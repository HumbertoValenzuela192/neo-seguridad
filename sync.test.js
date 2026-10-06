const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
test('admin login archives browser data before canonical hydration, without manual export',()=>{
 const original=JSON.stringify([{id:'browser-only',user:'fixture-client',installations:[{id:'local',name:'Local fixture'}]}]);
 const local=new Map([['neo_cuentas_cliente',original]]),session=new Map(),calls=[],archives=[];
 const storage=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)});
 class XHR{open(method,url){this.method=method;this.url=url;}setRequestHeader(){}send(body){calls.push(this.method+' '+this.url);this.status=200;
  if(this.url==='api/auth/me')this.responseText=JSON.stringify({kind:'user',id:'admin-fixture',sections:['usuarios','cuentas']});
  else if(this.url==='api/recovery'){archives.push(JSON.parse(body));this.responseText=JSON.stringify({archive_id:'verified-archive'});}
  else if(this.url==='api/directory/import')this.responseText=JSON.stringify({accounts:1});
  else if(this.url==='api/db')this.responseText=JSON.stringify({neo_cuentas_cliente:JSON.stringify([{id:'browser-only',installations:[{id:'local',coreId:'permanent-core-id'}]}]),__versions:{}});
  else throw new Error('Unexpected request');}}
 const context={localStorage:storage(local),sessionStorage:storage(session),XMLHttpRequest:XHR,location:{origin:'https://fixture.invalid'},window:{},document:{addEventListener(){}}};
 vm.runInNewContext(fs.readFileSync('sync.js','utf8'),context);
 assert.deepEqual(calls,['GET api/auth/me','POST api/recovery','POST api/directory/import','GET api/db']);
 assert.equal(archives[0].values.neo_cuentas_cliente,original);assert.equal(local.get('neo_recovery_uploaded_20261006'),'verified-archive');
 assert.equal(JSON.parse(local.get('neo_local_recovery_20261006')).values.neo_cuentas_cliente,original);
 assert.equal(JSON.parse(local.get('neo_cuentas_cliente'))[0].installations[0].coreId,'permanent-core-id');
});
