(() => {
 const values={};
 for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key.startsWith('neo_')&&key!=='neo_admin_session')values[key]=localStorage.getItem(key);}
 let payload={origin:location.origin,exportedAt:new Date().toISOString(),values};
 if(values.neo_local_recovery_20261006){try{const archived=JSON.parse(values.neo_local_recovery_20261006);payload.archivedBrowserCopy=archived;}catch{}}
 let accounts=[];try{accounts=JSON.parse(values.neo_cuentas_cliente||payload.archivedBrowserCopy?.values?.neo_cuentas_cliente||'[]');}catch{}
 document.getElementById('summary').textContent=`Este origen contiene ${Array.isArray(accounts)?accounts.length:0} cuenta(s) de cliente y ${Object.keys(values).length} conjuntos de datos. El archivo incluye la copia anterior si existe.`;
 document.getElementById('download').onclick=()=>{payload.exportedAt=new Date().toISOString();const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='portal-browser-backup-'+location.hostname+'-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 document.getElementById('import').onsubmit=async event=>{
  event.preventDefault();const output=document.getElementById('result');const button=event.target.querySelector('button');button.disabled=true;
  try{
   const file=document.getElementById('file').files[0];if(file.size>2*1024*1024)throw new Error('El archivo supera 2 MiB.');
   const data=JSON.parse(await file.text());
   const response=await fetch('api/recovery',{method:'POST',headers:{'Content-Type':'application/json','X-Portal-Request':'1'},body:JSON.stringify(data)});
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Inicia sesión como administrador en el portal actualizado.');
   sessionStorage.setItem('neo_recovery_archived',result.archive_id);output.textContent=result.message;
  }catch(error){output.textContent=error.message;}finally{button.disabled=false;}
 };
})();
