const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const routes = require('./routes.json');
const pages = new Map(routes.publicPages.map(page => [page.path, page.file]));
const files = new Set(['tigrr.png', 'neo-globo.png', 'neo-globo-icon.png']);
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2'};
const fail = (status, message) => Object.assign(new Error(message), {status});
function send(res, status, value) { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(value)); }

function createPublicServer({root=path.join(__dirname,'dist'),publicURL='',allowedOrigins=[],leadURL='',leadToken='',fetchLead=fetch}={}) {
 const origin=publicURL?new URL(publicURL).origin:null;
 const buckets=new Map();
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
  try {
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/api/leads'&&req.method==='POST') {
    const expected=origin||'http://'+req.headers.host;
    if(!(req.headers.origin===expected||allowedOrigins.includes(req.headers.origin))||req.headers['x-portal-request']!=='1')throw fail(403,'Origen de solicitud no autorizado.');
    const now=Date.now();for(const [key,bucket]of buckets)if(bucket.expires<now)buckets.delete(key);
    const key=req.socket.remoteAddress,bucket=buckets.get(key)||{count:0,expires:now+60000};
    if(++bucket.count>10||(!buckets.has(key)&&buckets.size>=10000))throw fail(429,'Demasiadas solicitudes. Espera un minuto.');buckets.set(key,bucket);
    let size=0;const chunks=[];
    for await(const chunk of req){size+=chunk.length;if(size>16384)throw fail(413,'Los datos superan el tamaño permitido.');chunks.push(chunk);}
    let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{throw fail(400,'JSON inválido.');}
    if(!body||typeof body.company!=='string'||!body.company.trim()||typeof body.email!=='string'||!/^\S+@\S+\.\S+$/.test(body.email))throw fail(400,'Empresa y correo válidos son obligatorios.');
    if(!leadURL||!leadToken)throw fail(503,'El formulario no está disponible. Reintenta más tarde.');
    const lead=Object.fromEntries(['date','company','rut','manager','email','phone','cameras','operators','solution'].filter(key=>typeof body[key]==='string').map(key=>[key,body[key].trim()]));
    const response=await fetchLead(leadURL,{method:'POST',headers:{Authorization:'Bearer '+leadToken,'Content-Type':'application/json'},body:JSON.stringify(lead),signal:AbortSignal.timeout(15000)});
    if(response.status!==201)throw fail(503,'No se pudo entregar tu solicitud. Reintenta sin cerrar esta página.');
    send(res,201,{ok:true});return;
   }
   if(!['GET','HEAD'].includes(req.method)||url.pathname.startsWith('/api/'))throw fail(404,'Ruta no encontrada.');
   const normalized=url.pathname.length>1?url.pathname.replace(/\/+$/,''):url.pathname;
   const redirect=routes.redirects[url.pathname]||(normalized!==url.pathname&&pages.has(normalized)?normalized:null);
   if(redirect){res.writeHead(308,{Location:redirect+url.search,'Cache-Control':'no-cache'});res.end();return;}
   const rel=pages.get(url.pathname)||decodeURIComponent(url.pathname).slice(1);
   const asset=/^assets\/[a-zA-Z0-9_./-]+\.(js|css|png|jpg|jpeg|webp|svg|woff|woff2)$/.test(rel)&&!rel.includes('..');
   if(!pages.has(url.pathname)&&!files.has(rel)&&!asset)throw fail(404,'Ruta no encontrada.');
   const file=path.join(root,rel),stat=await fs.promises.stat(file);if(!stat.isFile())throw fail(404,'Ruta no encontrada.');
   const etag='W/"'+stat.size+'-'+stat.mtimeMs+'"',cache=asset?'public, max-age=31536000, immutable':'no-cache';res.setHeader('ETag',etag);
   if(req.headers['if-none-match']===etag){res.writeHead(304,{'Cache-Control':cache});res.end();return;}
   res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':cache});
   if(req.method==='HEAD'){res.end();return;}const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
  }catch(error){if(error.code==='ENOENT')error=fail(404,'Ruta no encontrada.');if(error instanceof URIError)error=fail(400,'URL inválida.');if(!res.headersSent)send(res,error.status||503,{error:error.status?error.message:'El servicio no está disponible. Reintenta más tarde.'});}
 });
}
async function start(){
 const publicURL=process.env.PUBLIC_URL||'http://localhost:3000';
 if(process.env.NODE_ENV==='production'&&(!publicURL.startsWith('https://')||!process.env.LEAD_SERVICE_URL||(process.env.LEAD_SERVICE_TOKEN||'').length<32))throw new Error('PUBLIC_URL HTTPS y entrega privada de solicitudes requeridas.');
 createPublicServer({publicURL,allowedOrigins:(process.env.PUBLIC_ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean),leadURL:process.env.LEAD_SERVICE_URL||'',leadToken:process.env.LEAD_SERVICE_TOKEN||''}).listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>console.log('Web pública lista; formulario configurado'));
}
module.exports={createPublicServer,start};
