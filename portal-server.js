const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const routes = require('./routes.json');
const { promisify } = require('node:util');
const scrypt = promisify(crypto.scrypt);
const SECTIONS = ['inicio','solicitudes','clientes','cuentas','usuarios','roles','precios','mensual','sueldo'];
const KEY_SECTION = { neo_solicitudes:'solicitudes', neo_solicitudes_cliente:'clientes', neo_cuentas_cliente:'cuentas', neo_usuarios:'usuarios', neo_roles:'roles', neo_precios:'precios', neo_implementacion:'precios', neo_uf:'precios', neo_sueldos:'sueldo', neo_sueldo_params:'sueldo', neo_horario:'inicio', neo_datos_instalacion:'cuentas' };
const PUBLIC_FILES = new Set(['index.html','tigrr.html','admin.html','directory.html','recover.html','tigrr.png','neo-globo.png','neo-globo-icon.png','a2791a37-6fe2-413d-9f5a-526532134dcc.jpg']);
const PUBLIC_ROUTES = new Map(routes.publicPages.map(page=>[page.path,page.file]));
const PORTAL_ROUTES = new Set(['/admin',...Object.values(routes.portalSections).map(slug=>'/admin/'+slug),...routes.portalExtra.map(slug=>'/admin/'+slug)]);
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.mp4':'video/mp4'};
const fail = (status,message) => Object.assign(new Error(message),{status});
const digest = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const safeEqual = (a,b) => crypto.timingSafeEqual(Buffer.from(digest(a),'hex'),Buffer.from(digest(b),'hex'));
const redact = list => list.map(({pass,password,...rest})=>rest);
const parse = (value,fallback=[]) => value == null ? fallback : JSON.parse(value);

async function hashPassword(password) {
 if(typeof password!=='string'||password.length<8||password.length>256)throw fail(400,'La contraseña debe tener entre 8 y 256 caracteres.');
 const salt=crypto.randomBytes(16).toString('hex');
 const key=await scrypt(password,salt,64,{N:16384,r:8,p:1});
 return 'scrypt:'+salt+':'+key.toString('hex');
}
async function verifyPassword(password,stored) {
 if(typeof password!=='string'||password.length>256||typeof stored!=='string')return false;
 if(stored.startsWith('scrypt:')){const [,salt,hash]=stored.split(':');if(!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{128}$/.test(hash))return false;return safeEqual((await scrypt(password,salt,64,{N:16384,r:8,p:1})).toString('hex'),hash);}
 // Existing browser hashes remain usable and are upgraded after a successful login.
 const i=stored.indexOf(':');
 return i<0?safeEqual(password,stored):safeEqual(digest(stored.slice(0,i)+password),stored.slice(i+1));
}
async function readJSON(req,limit=2*1024*1024) {
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>limit)throw fail(413,'Los datos superan el tamaño permitido.');chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{throw fail(400,'JSON inválido.');}
}
function send(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));}

function createPortalServer({db,coreURL='',coreToken='',publicURL='',adminURL='',allowedOrigins=[],root=path.join(__dirname,'dist'),fetchCore=fetch}) {
 const failures=new Map();
 const origin=publicURL?new URL(publicURL).origin:null;
 const adminOrigin=adminURL?new URL(adminURL).origin:null;
 const adminHost=adminURL?new URL(adminURL).host.toLowerCase():null;
 const secureCookie=(adminOrigin||origin)?.startsWith('https:')?'Secure; ':'';
 const privateAssets=new Set();
 if(adminHost){
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'.vite/manifest.json'),'utf8'));
  const byFile=new Map(Object.entries(manifest).map(([key,chunk])=>[chunk.file,key]));
  function assets(entries){
   const files=new Set(),visited=new Set();
   function visit(key){
    if(visited.has(key))return;visited.add(key);
    const chunk=manifest[key];if(!chunk)throw new Error('Entrada ausente en el manifest: '+key);
    [chunk.file,...chunk.css||[],...chunk.assets||[]].forEach(file=>files.add(file));
    [...chunk.imports||[],...chunk.dynamicImports||[]].forEach(visit);
   }
   for(const entry of entries){
    if(manifest[entry]){visit(entry);continue;}
    // Vite can merge HTML entries with identical imports; start from their emitted asset links.
    const html=fs.readFileSync(path.join(root,entry),'utf8');
    for(const [,file]of html.matchAll(/(?:src|href)="\/(assets\/[^"?#]+)"/g)){files.add(file);if(byFile.has(file))visit(byFile.get(file));}
   }
   return files;
  }
  const publicAssets=assets(['index.html','tigrr.html']);
  for(const file of assets(['admin.html','directory.html','recover.html']))if(!publicAssets.has(file))privateAssets.add(file);
 }
 function limitRequest(req,kind,limit){const now=Date.now();for(const[k,v]of failures)if(v.expires<now)failures.delete(k);const key=kind+':'+req.socket.remoteAddress;const bucket=failures.get(key)||{count:0,expires:now+60000};if(++bucket.count>limit||(!failures.has(key)&&failures.size>=10000))throw fail(429,'Demasiadas solicitudes. Espera un minuto.');failures.set(key,bucket);}
 async function store(key,conn=db){const result=await conn.query('SELECT value FROM store WHERE key=$1',[key]);return result.rows[0]?.value;}
 async function setStore(key,value,conn=db){await conn.query('INSERT INTO store(key,value,updated_at) VALUES($1,$2,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()',[key,value]);}
 async function archive(kind,payload,conn=db){const id=crypto.randomUUID();await conn.query('INSERT INTO portal_archives(id,kind,payload) VALUES($1,$2,$3)',[id,kind,JSON.stringify(payload)]);return id;}
 async function core(method,resource,body){
  if(!coreURL||!coreToken)throw fail(503,'El directorio compartido aún no está configurado. Tus datos anteriores se conservan.');
  const response=await fetchCore(coreURL.replace(/\/$/,'')+'/api/v1/integrations/client-directory'+resource,{method,headers:{Authorization:'Bearer '+coreToken,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  const result=await response.json();if(!response.ok)throw fail(response.status,result.error?.message||'NEO no pudo guardar la ficha.');return result;
 }
 async function identity(req){
  const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('portal_session='))?.slice(15);
  if(!token)return null;
  const result=await db.query('SELECT account_kind,account_id FROM portal_sessions WHERE token_hash=$1 AND expires_at>now()',[digest(token)]);
  const row=result.rows[0];if(!row)return null;
  const key=row.account_kind==='user'?'neo_usuarios':'neo_cuentas_cliente';
  const account=parse(await store(key)).find(a=>String(a.id)===row.account_id);
  if(!account||account.activo===false)return null;
  const roleID=account.rol||account.role;
  const role=parse(await store('neo_roles')).find(r=>r.id===roleID);
  const sections=roleID==='admin'?SECTIONS:(Array.isArray(role?.sections)?role.sections.filter(s=>SECTIONS.includes(s)):[]);
  return {kind:row.account_kind,id:row.account_id,name:account.nombre||account.name||account.usuario||account.user,sections,portal:row.account_kind==='client'&&(roleID==='cliente'||role?.portal===true),account};
 }
 function requireSection(user,section){if(!user?.sections.includes(section))throw fail(403,'No tienes permiso para esta operación.');}
 async function projectAccounts(accounts){
  if(!coreURL||!coreToken)return accounts;
  const {clients}=await core('GET','/clients');const byExternal=new Map(clients.filter(c=>c.external_id).map(c=>[c.external_id,c]));
  const order=new Map(clients.map((c,i)=>[c.id,i]));
  return accounts.map(account=>({...account,installations:installations(account).map(inst=>{
   const c=byExternal.get(externalID(account,inst));if(!c)return inst;
    return {...inst,name:c.name,addresses:c.addresses.map(a=>({address:a.address,lat:a.latitude,lng:a.longitude})),hasGuard:c.has_guard?'si':'no',callOrder:c.contacts.map(c=>({name:c.name,cargo:c.relationship,phone:c.phone,email:c.email})),guards:c.guards.map(g=>({name:g.name,phone:g.phone,cargo:g.relationship,email:g.email})),supervisorName:c.supervisor.name,supervisorPhone:c.supervisor.phone,supervisorEmail:c.supervisor.email,supervisorCargo:c.supervisor.relationship,onboarded:c.status==='ready',coreId:c.id,coreVersion:c.version,code:c.code,organizationId:c.organization_id};
  }).sort((a,b)=>(order.get(a.coreId)??Number.MAX_SAFE_INTEGER)-(order.get(b.coreId)??Number.MAX_SAFE_INTEGER))}));
 }
 function installations(account){
  if(Array.isArray(account.installations)&&account.installations.length)return account.installations;
  return [{id:'primary',name:account.installation||account.name||'',addresses:account.addresses||(account.address?[{address:account.address,lat:account.mapLat??null,lng:account.mapLng??null}]:[]),hasGuard:account.hasGuard||'no',guards:account.guards||[],callOrder:account.callOrder||[],supervisorName:account.supervisorName||'',supervisorPhone:account.supervisorPhone||'',onboarded:!!account.onboarded}];
 }
 // References use immutable legacy IDs, never organization, name or array position.
 function externalID(account,inst){return 'portal:'+encodeURIComponent(String(account.id))+':'+encodeURIComponent(String(inst.id||'primary'));}
 function clientBody(inst){const first=inst.addresses?.[0]||{};return {name:inst.name||'Instalación pendiente',address:first.address||'',latitude:first.lat??null,longitude:first.lng??null,addresses:(inst.addresses||[]).map(a=>({address:a.address||'',latitude:a.lat??null,longitude:a.lng??null})),has_guard:inst.hasGuard==='si',contacts:(inst.callOrder||[]).map(c=>({name:c.name||'',relationship:c.cargo||'',phone:c.phone||'',email:c.email||''})),guards:(inst.guards||[]).map(g=>({name:g.name||'',relationship:g.cargo||'Guardia',phone:g.phone||'',email:g.email||''})),supervisor:{name:inst.supervisorName||'',phone:inst.supervisorPhone||'',relationship:inst.supervisorCargo||'Supervisor',email:inst.supervisorEmail||''},status:inst.onboarded&&first.lat!=null&&first.lng!=null?'ready':'pending'};}
 async function synchronize(accounts,previous=[],importOnly=false){
  for(const account of accounts){const old=previous.find(a=>String(a.id)===String(account.id));const oldInst=old?installations(old):[];
   const refs=installations(account).map(inst=>externalID(account,inst));
   if(new Set(refs).size!==refs.length)throw fail(409,'La cuenta contiene instalaciones con IDs repetidos. La copia anterior se conserva; revisa el respaldo antes de importarla.');
   for(const inst of installations(account)){
    const body=clientBody(inst);const reference=externalID(account,inst);
    const before=oldInst.find(old=>String(old.id||'primary')===String(inst.id||'primary'));if(!importOnly&&before&&JSON.stringify(clientBody(before))===JSON.stringify(body))continue;
    const created=await core('POST','/clients',{...body,external_id:reference});
    if(!importOnly&&before){if(!inst.coreVersion)throw fail(409,'Actualiza el portal antes de guardar una ficha existente.');await core('PATCH','/clients/'+created.id,{...body,version:inst.coreVersion});}
   }
  }
 }
 async function importDirectory(){const accounts=parse(await store('neo_cuentas_cliente'));if(accounts.length){await archive('pre-directory-import',accounts);await synchronize(accounts,[],true);}return {ok:true,accounts:accounts.length};}
 async function snapshot(user){
  const result=await db.query('SELECT key,value FROM store');const out={};
  out.__versions={};
  for(const {key,value} of result.rows){
   if(!KEY_SECTION[key])continue;
   if(key==='neo_cuentas_cliente'&&(user.portal||user.sections.includes('cuentas'))){let list=parse(value);if(!user.sections.includes('cuentas'))list=list.filter(a=>String(a.id)===user.id);out[key]=JSON.stringify(redact(await projectAccounts(list)));}
   else if(key==='neo_solicitudes_cliente'&&user.portal&&!user.sections.includes('clientes'))out[key]=JSON.stringify(parse(value).filter(a=>String(a.accountId)===user.id));
   else if(key==='neo_roles')out[key]=value;
   else if(user.sections.includes(KEY_SECTION[key]))out[key]=key==='neo_usuarios'?JSON.stringify(redact(parse(value))):value;
   if(out[key]!==undefined)out.__versions[key]=digest(user.sections.includes(KEY_SECTION[key])?redactValue(key,value):out[key]);
  }
  if(user.kind==='user'&&!out.neo_usuarios)out.neo_usuarios=JSON.stringify(redact([user.account]));
  return out;
 }
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
  try{
     const url=new URL(req.url,'http://localhost');const pathname=url.pathname;
     const administrative=!adminHost||req.headers.host?.toLowerCase()===adminHost;
     const lead=pathname==='/api/leads'&&req.method==='POST';
     if(adminHost){
      const target=routes.redirects[pathname];
      const decoded=decodeURIComponent(pathname).replace(/\/+$/,'')||'/';
      const internal=decoded==='/admin'||decoded.startsWith('/admin/')||['/admin.html','/directory.html','/recover.html'].includes(decoded)||target?.startsWith('/admin')||privateAssets.has(decoded.slice(1));
      if(!administrative&&(internal||(pathname.startsWith('/api/')&&!lead)))throw fail(404,'Ruta no encontrada.');
      if(administrative){res.setHeader('X-Robots-Tag','noindex, nofollow');if(pathname==='/'){res.writeHead(308,{Location:'/admin','Cache-Control':'no-cache'});res.end();return;}if(PUBLIC_ROUTES.has(decoded)||['/index.html','/tigrr.html'].includes(decoded)||lead)throw fail(404,'Ruta no encontrada.');}
     }
    if(!pathname.startsWith('/api/')){
     const normalized=pathname.length>1?pathname.replace(/\/+$/,''):pathname;
     const redirect=routes.redirects[pathname]||(pathname!==normalized&&(PUBLIC_ROUTES.has(normalized)||PORTAL_ROUTES.has(normalized))?normalized:null);
     if(redirect){res.writeHead(308,{Location:redirect+url.search,'Cache-Control':'no-cache'});res.end();return;}
     const portal=PORTAL_ROUTES.has(pathname);
     const rel=portal?'admin.html':PUBLIC_ROUTES.get(pathname)||decodeURIComponent(pathname).slice(1);
     const asset=/^assets\/[a-zA-Z0-9_./-]+\.(js|css|png|jpg|jpeg|webp|svg|woff|woff2|mp4)$/.test(rel)&&!rel.includes('..');
    if(!PUBLIC_ROUTES.has(pathname)&&!portal&&!PUBLIC_FILES.has(rel)&&!asset){res.writeHead(404);res.end('Not found');return;}
     const file=path.join(root,rel);const stat=await fs.promises.stat(file);if(!stat.isFile())throw fail(404,'Not found');
     if(portal)res.setHeader('X-Robots-Tag','noindex, nofollow');
     const etag='W/"'+stat.size+'-'+stat.mtimeMs+'"';res.setHeader('ETag',etag);
     if(req.headers['if-none-match']===etag){res.writeHead(304,{'Cache-Control':asset?'public, max-age=31536000, immutable':'no-cache'});res.end();return;}
     res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':asset?'public, max-age=31536000, immutable':'no-cache','Content-Length':stat.size});
     if(req.method==='HEAD'){res.end();return;}
     const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);return;
   }
   if(!db)throw fail(503,'Base de datos no disponible.');
   if(!['GET','HEAD'].includes(req.method)){
     const expected=(administrative&&adminOrigin?adminOrigin:origin)||'http://'+req.headers.host;
     if(!(req.headers.origin===expected||((!adminHost||lead)&&allowedOrigins.includes(req.headers.origin)))||req.headers['x-portal-request']!=='1')throw fail(403,'Origen de solicitud no autorizado.');
   }
   if(pathname==='/api/auth/login'&&req.method==='POST'){
    limitRequest(req,'login',20);
    const body=await readJSON(req,4096);let found;
    for(const [kind,key,userField,passwordField] of [['user','neo_usuarios','usuario','password'],['client','neo_cuentas_cliente','user','pass']]){
     const list=parse(await store(key));const account=list.find(a=>a[userField]===body.username&&a.activo!==false);
     if(account&&await verifyPassword(body.password,account[passwordField])){found={kind,key,passwordField,account,upgraded:!account[passwordField].startsWith('scrypt:')&&body.password.length>=8?await hashPassword(body.password):null};break;}
    }
    if(!found)throw fail(401,'Usuario o contraseña incorrectos.');
    const token=crypto.randomBytes(32).toString('hex');const conn=await db.connect();
    try{
     await conn.query('BEGIN');await conn.query('SELECT pg_advisory_xact_lock(814207)');
     const currentList=parse(await store(found.key,conn));const current=currentList.find(a=>String(a.id)===String(found.account.id));
     if(!current||current.activo===false||!safeEqual(current[found.passwordField],found.account[found.passwordField]))throw fail(401,'La cuenta cambió. Inicia sesión nuevamente.');
     if(found.upgraded){current[found.passwordField]=found.upgraded;await setStore(found.key,JSON.stringify(currentList),conn);}
     await conn.query('DELETE FROM portal_sessions WHERE expires_at<now()');
     await conn.query('INSERT INTO portal_sessions(token_hash,account_kind,account_id,expires_at) VALUES($1,$2,$3,now()+interval \'12 hours\')',[digest(token),found.kind,String(current.id)]);
     await conn.query('COMMIT');
    }catch(error){await conn.query('ROLLBACK');throw error;}finally{conn.release();}
    res.setHeader('Set-Cookie','portal_session='+token+'; '+secureCookie+'HttpOnly; SameSite=Strict; Path=/; Max-Age=43200');send(res,200,{ok:true});return;
   }
   if(pathname==='/api/leads'&&req.method==='POST'){
    limitRequest(req,'lead',10);
    const lead=await readJSON(req,16384);if(typeof lead.company!=='string'||!lead.company.trim()||typeof lead.email!=='string'||!/^\S+@\S+\.\S+$/.test(lead.email))throw fail(400,'Empresa y correo válidos son obligatorios.');
    const conn=await db.connect();try{await conn.query('BEGIN');await conn.query('SELECT pg_advisory_xact_lock(814207)');const list=parse(await store('neo_solicitudes',conn));list.push({...lead,id:crypto.randomUUID(),status:'nuevo'});await setStore('neo_solicitudes',JSON.stringify(list),conn);await conn.query('COMMIT');}catch(e){await conn.query('ROLLBACK');throw e;}finally{conn.release();}send(res,201,{ok:true});return;
   }
   const user=await identity(req);if(!user)throw fail(401,'Inicia sesión para continuar.');
   if(pathname==='/api/auth/me'&&req.method==='GET'){const {account,...publicUser}=user;send(res,200,publicUser);return;}
   if(pathname==='/api/auth/logout'&&req.method==='POST'){const cookie=(req.headers.cookie||'').match(/(?:^|;\s*)portal_session=([^;]+)/);if(cookie)await db.query('DELETE FROM portal_sessions WHERE token_hash=$1',[digest(cookie[1])]);res.setHeader('Set-Cookie','portal_session=; '+secureCookie+'HttpOnly; SameSite=Strict; Path=/; Max-Age=0');send(res,200,{ok:true});return;}
   if(pathname==='/api/password-hash'&&req.method==='POST'){if(!user.sections.includes('usuarios')&&!user.sections.includes('cuentas'))throw fail(403,'No tienes permiso para gestionar cuentas.');send(res,200,{hash:await hashPassword((await readJSON(req,4096)).password)});return;}
   if(pathname==='/api/db'&&req.method==='GET'){send(res,200,await snapshot(user));return;}
   if(pathname==='/api/recovery'&&req.method==='POST'){
    requireSection(user,'usuarios');requireSection(user,'cuentas');const payload=await readJSON(req);const datasets=[payload.values||payload,payload.archivedBrowserCopy?.values].filter(Boolean);
    let archiveID;const conn=await db.connect();try{await conn.query('BEGIN');await conn.query('SELECT pg_advisory_xact_lock(814207)');archiveID=await archive('browser-recovery',payload,conn);
     for(const values of datasets)for(const [key,value]of Object.entries(values)){if(!KEY_SECTION[key])continue;const saved=await store(key,conn);const incoming=parse(typeof value==='string'?value:JSON.stringify(value));
      if(Array.isArray(incoming)){if(saved==null){await setStore(key,JSON.stringify(incoming),conn);continue;}const existing=parse(saved);if(!Array.isArray(existing))continue;for(const item of incoming){if(!item||typeof item!=='object')continue;if(!existing.some(e=>(item.id!=null&&String(e.id)===String(item.id))||(item.id==null&&JSON.stringify(e)===JSON.stringify(item))||(key==='neo_usuarios'&&e.usuario===item.usuario)||(key==='neo_cuentas_cliente'&&e.user===item.user)))existing.push(item);}await setStore(key,JSON.stringify(existing),conn);}
      else if(saved==null)await setStore(key,typeof value==='string'?value:JSON.stringify(value),conn);
     }await conn.query('COMMIT');}catch(e){await conn.query('ROLLBACK');throw e;}finally{conn.release();}send(res,200,{ok:true,archive_id:archiveID,message:'Copia archivada y registros nuevos recuperados. Los existentes no se sobrescribieron.'});return;
   }
   if(pathname==='/api/directory/import'&&req.method==='POST'){requireSection(user,'cuentas');send(res,200,await importDirectory());return;}
   if(pathname.startsWith('/api/directory/')){
    const resource=pathname.slice('/api/directory'.length);requireSection(user,'cuentas');
    const allowed=(req.method==='GET'&&/^\/(clients|organizations)(\/[^/]+)?$/.test(resource))||(req.method==='POST'&&['/clients','/organizations'].includes(resource))||(req.method==='PATCH'&&/^\/clients\/[^/]+$/.test(resource))||(['PUT','DELETE'].includes(req.method)&&/^\/organizations\/[^/]+$/.test(resource));
    if(!allowed)throw fail(403,'Operación de directorio no permitida.');
    const body=['GET','DELETE'].includes(req.method)?undefined:await readJSON(req,256*1024);send(res,200,await core(req.method,resource,body));return;
   }
   const match=pathname.match(/^\/api\/store\/(neo_[a-z_]+)$/);
   if(match&&req.method==='PUT'){
    const key=match[1];if(!KEY_SECTION[key])throw fail(400,'Clave no autorizada.');const body=await readJSON(req);const value=String(body.value??'');let incoming=parse(value);
    if(key==='neo_datos_instalacion'&&user.portal&&!user.sections.includes('cuentas')){send(res,200,{ok:true});return;}
    const ownAccounts=key==='neo_cuentas_cliente'&&user.portal&&!user.sections.includes('cuentas');
    const ownRequests=key==='neo_solicitudes_cliente'&&user.portal&&!user.sections.includes('clientes');
    if(!ownAccounts&&!ownRequests)requireSection(user,KEY_SECTION[key]);
    // ponytail: legacy whole-list edits are serialized; move to per-record tables if concurrent writes grow.
    const conn=await db.connect();try{await conn.query('BEGIN');await conn.query('SELECT pg_advisory_xact_lock(814207)');const oldValue=await store(key,conn);const old=parse(oldValue);
     if(ownAccounts){if(!Array.isArray(incoming)||incoming.length!==1||String(incoming[0].id)!==user.id)throw fail(403,'Sólo puedes actualizar tu propia ficha.');const a=old.find(a=>String(a.id)===user.id);for(const field of ['user','role','name','pass','activo','source','sourceId'])if(incoming[0][field]!==undefined&&incoming[0][field]!==a[field])throw fail(403,'No puedes cambiar los datos de acceso.');incoming=old.map(a=>String(a.id)===user.id?{...a,installations:incoming[0].installations}:a);}
     else if(ownRequests){if(!Array.isArray(incoming))throw fail(400,'Solicitud inválida.');const added=incoming.filter(x=>!old.some(o=>String(o.id)===String(x.id)));incoming=[...old,...added.map(x=>({...x,accountId:user.id,client:user.name,status:'nuevo'}))];}
     else if(oldValue!=null&&body.version!==digest(redactValue(key,oldValue)))throw fail(409,'Los datos cambiaron. Actualiza la página antes de guardar.');
      if(['neo_cuentas_cliente','neo_usuarios'].includes(key)){
       if(!Array.isArray(incoming))throw fail(400,'Listado inválido.');
       const pwd=key==='neo_usuarios'?'password':'pass',field=key==='neo_usuarios'?'usuario':'user',roleField=key==='neo_usuarios'?'rol':'role';
       const roles=parse(await store('neo_roles',conn));
       const authorizeRole=id=>{const role=roles.find(r=>r.id===id);const sections=id==='admin'?SECTIONS:id==='cliente'?[]:role?.sections;if(!Array.isArray(sections)||sections.some(s=>!user.sections.includes(s)))throw fail(403,'No puedes administrar una cuenta con permisos superiores a los tuyos.');};
       for(const a of incoming){
        if(!a.id||typeof a[field]!=='string'||!a[field].trim())throw fail(400,'Identidad de cuenta inválida.');
        const previous=old.find(o=>String(o.id)===String(a.id));
        if(!a[pwd]&&previous)a[pwd]=previous[pwd];if(!a[pwd])throw fail(400,'Contraseña requerida.');
        const accessChanged=!previous||['id',field,pwd,roleField,'activo'].some(f=>a[f]!==previous[f]);
        if(accessChanged){if(previous)authorizeRole(previous[roleField]);authorizeRole(a[roleField]);}
        if(a[pwd]!==previous?.[pwd]&&!/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(a[pwd]))throw fail(400,'La contraseña nueva debe generarse mediante el servidor.');
        if(previous&&a[pwd]!==previous[pwd])await conn.query('DELETE FROM portal_sessions WHERE account_kind=$1 AND account_id=$2',[key==='neo_usuarios'?'user':'client',String(a.id)]);
       }
       for(const removed of old.filter(o=>!incoming.some(a=>String(a.id)===String(o.id))))authorizeRole(removed[roleField]);
       if(new Set(incoming.map(a=>a[field])).size!==incoming.length||new Set(incoming.map(a=>String(a.id))).size!==incoming.length)throw fail(400,'Hay usuarios o IDs duplicados.');
      }
     if(key==='neo_cuentas_cliente'&&coreURL&&coreToken){await archive('pre-account-update',old,conn);await synchronize(incoming,await projectAccounts(old));}
     await setStore(key,JSON.stringify(incoming),conn);await conn.query('COMMIT');const saved=redactValue(key,JSON.stringify(incoming));send(res,200,{ok:true,value:saved,version:digest(saved)});
    }catch(e){await conn.query('ROLLBACK');throw e;}finally{conn.release();}return;
   }
   throw fail(404,'Ruta no encontrada.');
    }catch(error){if(error.code==='ENOENT')error=fail(404,'Not found');if(!error.status)console.error('Portal request failed:',error.code||'UNAVAILABLE');if(!res.headersSent)send(res,error.status||503,{error:error.status?error.message:'El servicio no está disponible. Tus cambios no se confirmaron.'});}
 });
 server.importDirectory=importDirectory;
 return server;
 function redactValue(key,value){return ['neo_cuentas_cliente','neo_usuarios'].includes(key)?JSON.stringify(redact(parse(value))):value;}
}

async function initialize(db,bootstrapPassword=''){
 await db.query('CREATE TABLE IF NOT EXISTS store(key TEXT PRIMARY KEY,value TEXT,updated_at TIMESTAMPTZ NOT NULL DEFAULT now())');
 await db.query('CREATE TABLE IF NOT EXISTS portal_sessions(token_hash TEXT PRIMARY KEY,account_kind TEXT NOT NULL,account_id TEXT NOT NULL,expires_at TIMESTAMPTZ NOT NULL)');
 await db.query('CREATE INDEX IF NOT EXISTS portal_sessions_expiry ON portal_sessions(expires_at)');
 await db.query('CREATE TABLE IF NOT EXISTS portal_archives(id TEXT PRIMARY KEY,kind TEXT NOT NULL,payload TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now())');
 const users=await db.query("SELECT value FROM store WHERE key='neo_usuarios'");
  if(!parse(users.rows[0]?.value).length&&bootstrapPassword){const admin=[{id:crypto.randomUUID(),usuario:'admin',nombre:'Administrador',password:await hashPassword(bootstrapPassword),rol:'admin',activo:true}];await db.query("INSERT INTO store(key,value) VALUES('neo_usuarios',$1) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value WHERE store.value='[]'",[JSON.stringify(admin)]);}
}
async function start(){
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL requerida.');
 if(!process.env.PORTAL_PUBLIC_URL)throw new Error('PORTAL_PUBLIC_URL requerida para validar origen y cookie de sesión.');
 if(process.env.NODE_ENV==='production'&&!process.env.PORTAL_PUBLIC_URL.startsWith('https://'))throw new Error('PORTAL_PUBLIC_URL debe usar HTTPS en producción.');
 if(!!process.env.CORE_URL!==!!process.env.CORE_CLIENT_DIRECTORY_TOKEN)throw new Error('CORE_URL y CORE_CLIENT_DIRECTORY_TOKEN deben configurarse juntos.');
 const {Pool}=require('pg');const db=new Pool({connectionString:process.env.DATABASE_URL});
  const deadline=Date.now()+30000;
  for(;;){try{await initialize(db,process.env.PORTAL_BOOTSTRAP_PASSWORD||'');break;}catch(error){if(Date.now()>=deadline)throw error;await new Promise(resolve=>setTimeout(resolve,1000));}}
  const adminURL=process.env.PORTAL_ADMIN_URL||(process.env.NODE_ENV==='production'?routes.adminURL:'');
  if(process.env.NODE_ENV==='production'&&!adminURL.startsWith('https://'))throw new Error('PORTAL_ADMIN_URL debe usar HTTPS en producción.');
  const server=createPortalServer({db,coreURL:process.env.CORE_URL||'',coreToken:process.env.CORE_CLIENT_DIRECTORY_TOKEN||'',publicURL:process.env.PORTAL_PUBLIC_URL||'',adminURL,allowedOrigins:(process.env.PORTAL_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)});
 if(process.env.CORE_URL)try{const result=await server.importDirectory();console.log('Directorio inicializado; cuentas procesadas: '+result.accounts);}catch(error){console.error('La importación inicial se reintentará al ingresar al portal:',error.status||'UNAVAILABLE');}
 server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Portal listo; directorio '+(process.env.CORE_URL?'configurado':'desactivado')));
}
module.exports={createPortalServer,initialize,hashPassword,verifyPassword,start};
