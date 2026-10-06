const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {Pool}=require('pg');
const {createPortalServer,initialize,hashPassword,verifyPassword}=require('./portal-server');

test('legacy credentials survive; new credentials use server-side scrypt',async()=>{
 const password='FixturePassword123!';const hash=await hashPassword(password);
 assert.ok(hash.startsWith('scrypt:'));assert.equal(await verifyPassword(password,hash),true);assert.equal(await verifyPassword('wrong',hash),false);
 const salt='old-fixture-salt';const legacy=salt+':'+crypto.createHash('sha256').update(salt+password).digest('hex');assert.equal(await verifyPassword(password,legacy),true);
});

test('compiled pages and chunks have correct MIME, cache, HEAD and source isolation',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'neo-static-'));fs.mkdirSync(path.join(root,'assets'));
 fs.writeFileSync(path.join(root,'index.html'),'<h1>Prerendered public page</h1>');fs.writeFileSync(path.join(root,'admin.html'),'<main id="root"></main>');fs.writeFileSync(path.join(root,'assets','app-hash.js'),'console.log("fixture")');fs.writeFileSync(path.join(root,'assets','app-hash.css'),'body{}');
 const server=createPortalServer({db:null,root});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});});
 const html=await fetch(origin+'/');assert.equal(html.status,200);assert.match(await html.text(),/Prerendered public page/);assert.equal(html.headers.get('cache-control'),'no-cache');
 const cached=await fetch(origin+'/',{headers:{'If-None-Match':html.headers.get('etag')}});assert.equal(cached.status,304);
 const js=await fetch(origin+'/assets/app-hash.js');assert.match(js.headers.get('content-type'),/javascript/);assert.match(js.headers.get('cache-control'),/immutable/);
 const css=await fetch(origin+'/assets/app-hash.css');assert.match(css.headers.get('content-type'),/text\/css/);
 const head=await fetch(origin+'/admin.html',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('x-robots-tag'),'noindex, nofollow');
 for(const resource of ['/server.js','/src/portal/store.tsx','/assets/missing.js','/assets/%2e%2e/server.js'])assert.equal((await fetch(origin+resource)).status,404);
});

test('PostgreSQL portal isolation, recovery, idempotent import and shared edits',async t=>{
 assert.ok(process.env.TEST_DATABASE_URL,'Set TEST_DATABASE_URL to a disposable PostgreSQL database.');
 const adminDB=new Pool({connectionString:process.env.TEST_DATABASE_URL});const schema='fixture_'+crypto.randomBytes(8).toString('hex');await adminDB.query('CREATE SCHEMA '+schema);
 const db=new Pool({connectionString:process.env.TEST_DATABASE_URL,options:'-c search_path='+schema});
 const records=[];let nextID=1,reverseCoreOrder=false;
 const fetchCore=async(url,options)=>{const p=new URL(url).pathname.split('/client-directory')[1];const body=options.body?JSON.parse(options.body):{};let result,status=200;
  if(options.method==='GET'&&p==='/clients')result={clients:reverseCoreOrder?[...records].reverse():records};
  else if(options.method==='POST'&&p==='/clients'){result=records.find(c=>c.external_id===body.external_id);if(!result){result={id:'core-'+nextID,code:'C0'+nextID++,version:1,addresses:[],contacts:[],guards:[],supervisor:{name:'',phone:''},organization_id:null,...body};records.push(result);status=201;}}
  else if(options.method==='PATCH'){result=records.find(c=>p==='/clients/'+c.id);if(result.version!==body.version){status=409;result={error:{message:'La ficha cambió. Actualiza antes de guardar.'}};}else Object.assign(result,body,{version:result.version+1});}
  else throw new Error('Unexpected Core operation: '+options.method+' '+p);
  return new Response(JSON.stringify(result),{status,headers:{'Content-Type':'application/json'}});
 };
 await initialize(db,'');await db.query("INSERT INTO store(key,value) VALUES('neo_usuarios','[]')");await initialize(db,'FixturePassword123!');
 const bootstrapUser=JSON.parse((await db.query("SELECT value FROM store WHERE key='neo_usuarios'")).rows[0].value)[0];
 await initialize(db,'DoNotReplaceExisting123!');assert.equal(JSON.parse((await db.query("SELECT value FROM store WHERE key='neo_usuarios'")).rows[0].value)[0].password,bootstrapUser.password);
 await db.query("INSERT INTO store(key,value) VALUES('neo_sueldos',$1)",[JSON.stringify([{id:'private-payroll',base:1000}])]);
 const clientHash=await hashPassword('ClientFixture123!');
 const initialUsers=JSON.parse((await db.query("SELECT value FROM store WHERE key='neo_usuarios'")).rows[0].value);
 initialUsers.push({id:'manager',usuario:'manager',nombre:'Manager',password:clientHash,rol:'manager',activo:true});
 await db.query("UPDATE store SET value=$1 WHERE key='neo_usuarios'",[JSON.stringify(initialUsers)]);
 await db.query("INSERT INTO store(key,value) VALUES('neo_roles',$1)",[JSON.stringify([{id:'manager',name:'Manager',sections:['cuentas'],portal:false}])]);
 const a={id:'account-a',name:'Company A',user:'client-a',pass:clientHash,role:'cliente',installations:[{id:'south',name:'South',addresses:[{address:'South road',lat:-33,lng:-70}],callOrder:[{cargo:'Owner',name:'Alice',phone:'111'}],guards:[{name:'Guard',phone:'222'}],supervisorName:'Boss',supervisorPhone:'333',hasGuard:'si',onboarded:true},{id:'north',name:'North',addresses:[],callOrder:[],hasGuard:'no',onboarded:false}]};
 const b={id:'account-b',name:'Company B',user:'client-b',pass:clientHash,role:'cliente',installations:[{id:'other',name:'Other',addresses:[],callOrder:[]}]};
 await db.query("INSERT INTO store(key,value) VALUES('neo_cuentas_cliente',$1)",[JSON.stringify([a,b])]);
 const server=createPortalServer({db,coreURL:'https://core.invalid',coreToken:'fixture',fetchCore});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));await db.end();await adminDB.query('DROP SCHEMA '+schema+' CASCADE');await adminDB.end();});
 const request=async(p,method='GET',body,cookie)=>{const res=await fetch(origin+p,{method,headers:{Origin:origin,'X-Portal-Request':'1','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};};
 assert.equal((await request('/api/db')).status,401);
 assert.equal((await fetch(origin+'/server.js')).status,404);
 const login=await request('/api/auth/login','POST',{username:'admin',password:'FixturePassword123!'});assert.equal(login.status,200);const admin=login.cookie;
 assert.equal((await fetch(origin+'/api/store/neo_roles',{method:'PUT',headers:{Origin:'https://evil.invalid',Cookie:admin,'Content-Type':'application/json','X-Portal-Request':'1'},body:'{}'})).status,403);
 let snapshot=(await request('/api/db','GET',undefined,admin)).data;assert.ok(!snapshot.neo_usuarios.includes('scrypt:'));assert.ok(!snapshot.neo_cuentas_cliente.includes('scrypt:'));
 assert.equal((await request('/api/directory/import','POST',{},admin)).status,200);assert.equal(records.length,3);
 const ids=records.map(c=>c.id);await request('/api/directory/import','POST',{},admin);assert.deepEqual(records.map(c=>c.id),ids);
 records[0].contacts[0].email='owner@example.test';records[0].guards[0].email='guard@example.test';records[0].guards[0].relationship='Guardia nocturno';records[0].supervisor.email='supervisor@example.test';records[0].version++;
 const clientLogin=await request('/api/auth/login','POST',{username:'client-a',password:'ClientFixture123!'});assert.equal(clientLogin.status,200);const cookie=clientLogin.cookie;
 let own=(await request('/api/db','GET',undefined,cookie)).data;let accounts=JSON.parse(own.neo_cuentas_cliente);assert.equal(accounts.length,1);assert.equal(accounts[0].id,a.id);assert.equal(accounts[0].installations[0].coreId,ids[0]);
 assert.equal(own.neo_sueldos,undefined);assert.equal(own.__versions.neo_sueldos,undefined);assert.equal(own.neo_usuarios,undefined);
 assert.equal((await request('/api/directory/clients','GET',undefined,cookie)).status,403);
 assert.equal((await request('/api/store/neo_cuentas_cliente','PUT',{value:JSON.stringify([b])},cookie)).status,403);
 accounts[0].installations[0].callOrder[0].name='Updated by owner';
 assert.equal((await request('/api/store/neo_cuentas_cliente','PUT',{value:JSON.stringify(accounts)},cookie)).status,200);assert.equal(records[0].contacts[0].name,'Updated by owner');assert.equal(records[0].guards[0].name,'Guard');assert.equal(records[1].id,ids[1]);
 assert.equal(records[0].contacts[0].email,'owner@example.test');assert.equal(records[0].guards[0].email,'guard@example.test');assert.equal(records[0].guards[0].relationship,'Guardia nocturno');assert.equal(records[0].supervisor.email,'supervisor@example.test');
 accounts[0].installations[0].callOrder[0].name='Stale edit';assert.equal((await request('/api/store/neo_cuentas_cliente','PUT',{value:JSON.stringify(accounts)},cookie)).status,409);
 const managerLogin=await request('/api/auth/login','POST',{username:'manager',password:'ClientFixture123!'});assert.equal(managerLogin.status,200);const managerSnapshot=(await request('/api/db','GET',undefined,managerLogin.cookie)).data;
 const escalation=JSON.parse(managerSnapshot.neo_cuentas_cliente);escalation.push({id:'escalation',name:'Escalation',user:'elevated',pass:clientHash,role:'admin'});
 assert.equal((await request('/api/store/neo_cuentas_cliente','PUT',{value:JSON.stringify(escalation),version:managerSnapshot.__versions.neo_cuentas_cliente},managerLogin.cookie)).status,403);
 snapshot=(await request('/api/db','GET',undefined,admin)).data;const recovered={...a,id:'recovered',user:'recovered-client',installations:[{id:'local',name:'Browser only',addresses:[],callOrder:[]}]};
 const payload={values:{neo_cuentas_cliente:JSON.stringify([recovered])},archivedBrowserCopy:{values:{neo_cuentas_cliente:JSON.stringify([{...recovered,name:'Older archive'}, {...b,id:'archive-only',user:'archive-only'}])}}};
 assert.equal((await request('/api/recovery','POST',payload,admin)).status,200);assert.equal((await request('/api/recovery','POST',payload,admin)).status,200);
 const stored=JSON.parse((await db.query("SELECT value FROM store WHERE key='neo_cuentas_cliente'")).rows[0].value);assert.equal(stored.length,4);assert.equal(stored.find(c=>c.id==='recovered').name,'Company A');assert.ok(stored.every(c=>c.pass));
 assert.equal((await request('/api/store/neo_cuentas_cliente','PUT',{value:JSON.stringify(stored),version:snapshot.__versions.neo_cuentas_cliente},admin)).status,409);
 reverseCoreOrder=true;const sortedSnapshot=(await request('/api/db','GET',undefined,cookie)).data;
 assert.deepEqual(JSON.parse(sortedSnapshot.neo_cuentas_cliente)[0].installations.map(i=>i.coreId),[ids[1],ids[0]]);
 await request('/api/auth/logout','POST',{},cookie);assert.equal((await request('/api/db','GET',undefined,cookie)).status,401);
 const archives=await db.query('SELECT count(*)::integer AS count FROM portal_archives');assert.ok(archives.rows[0].count>=5);
});
