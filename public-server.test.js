const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createPublicServer}=require('./public-server');
const routes=require('./routes.json');

test('public server has only commercial pages and forwards contact without session or database access',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'tigrr-public-'));fs.mkdirSync(path.join(root,'assets'));
 for(const page of routes.publicPages)fs.writeFileSync(path.join(root,page.file),'<h1>Public '+page.page+'</h1>');
 fs.writeFileSync(path.join(root,'admin.html'),'Must never be served');fs.writeFileSync(path.join(root,'assets','public.js'),'console.log("public")');
 const deliveries=[];let unavailable=false;
 const fetchLead=async(url,options)=>{deliveries.push({url,...options});return new Response('{}',{status:unavailable?503:201});};
 const server=createPublicServer({root,publicURL:'https://tigrrsecurity.cl',allowedOrigins:['https://www.tigrrsecurity.cl'],leadURL:'http://internal:3000/api/leads',leadToken:'private-fixture-token',fetchLead});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const address='http://127.0.0.1:'+server.address().port;
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});});
 const request=(route,options={})=>fetch(address+route,{redirect:'manual',...options});
 for(const page of routes.publicPages)assert.equal((await request(page.path)).status,200);
 const html=await request('/');assert.equal(html.headers.get('cache-control'),'no-cache');assert.equal((await request('/',{headers:{'If-None-Match':html.headers.get('etag')}})).status,304);
 const asset=await request('/assets/public.js',{method:'HEAD'});assert.equal(asset.status,200);assert.match(asset.headers.get('content-type'),/javascript/);assert.match(asset.headers.get('cache-control'),/immutable/);
 for(const route of ['/admin','/admin/inicio','/admin.html','/directory.html','/recover.html','/api/db','/api/auth/me','/api/directory/clients','/src/portal/App.tsx','/public-server.js','/routes.json','/pagina-inexistente'])assert.equal((await request(route,{headers:{Cookie:'portal_session=old-session'}})).status,404,route);
 for(const [old,target]of Object.entries(routes.redirects)){const r=await request(old+'?test=1');assert.equal(r.status,308);assert.equal(r.headers.get('location'),target+'?test=1');}
 const post=(body,origin='https://tigrrsecurity.cl')=>request('/api/leads',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Portal-Request':'1',Cookie:'portal_session=never-forward'},body:JSON.stringify(body)});
 assert.equal((await post({company:'Example',email:'qa@example.test'},'https://evil.invalid')).status,403);
 assert.equal((await post({})).status,400);assert.equal(deliveries.length,0);
 const accepted=await post({company:'Example',email:'qa@example.test',solution:'NEO',id:'fake-id',status:'atendido',password:'never-forward'},'https://www.tigrrsecurity.cl');assert.equal(accepted.status,201);assert.deepEqual(await accepted.json(),{ok:true});
 assert.equal(deliveries.length,1);assert.equal(deliveries[0].url,'http://internal:3000/api/leads');assert.equal(deliveries[0].headers.Authorization,'Bearer private-fixture-token');assert.equal(deliveries[0].headers.Cookie,undefined);assert.deepEqual(JSON.parse(deliveries[0].body),{company:'Example',email:'qa@example.test',solution:'NEO'});
 unavailable=true;assert.equal((await post({company:'Example',email:'qa@example.test'})).status,503);
 assert.equal((await request('/api/leads')).status,404);
});

test('public dependencies and build contain no administrative entry',()=>{
 const pkg=require('./package.json');assert.equal(pkg.dependencies.pg,undefined);assert.equal(pkg.dependencies['react-router'],undefined);assert.equal(pkg.dependencies.leaflet,undefined);
 for(const file of ['admin.html','directory.html','recover.html','portal-server.js','src/portal/App.tsx'])assert.equal(fs.existsSync(path.join(__dirname,file)),false,file);
 if(fs.existsSync(path.join(__dirname,'dist')))for(const file of ['admin.html','directory.html','recover.html'])assert.equal(fs.existsSync(path.join(__dirname,'dist',file)),false,file);
});
