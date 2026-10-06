/* Server authorization is authoritative. Preserve existing browser-only data before hydration. */
(function(){
 const nativeSet=localStorage.setItem.bind(localStorage);
 const nativeRemove=localStorage.removeItem.bind(localStorage);
 const keys=['neo_solicitudes','neo_solicitudes_cliente','neo_cuentas_cliente','neo_usuarios','neo_roles','neo_precios','neo_implementacion','neo_uf','neo_sueldos','neo_sueldo_params','neo_horario','neo_datos_instalacion'];
 let recoveryError=null,browserRecovery=null;
 try{browserRecovery=JSON.parse(localStorage.getItem('neo_local_recovery_20261006')||'null');}catch{}
 if(!localStorage.getItem('neo_local_recovery_20261006')&&!sessionStorage.getItem('neo_recovery_archived')&&localStorage.getItem('neo_cuentas_cliente')){
  const values={};keys.forEach(key=>{const value=localStorage.getItem(key);if(value!=null)values[key]=value;});
   browserRecovery={origin:location.origin,exportedAt:new Date().toISOString(),values};
   try{nativeSet('neo_local_recovery_20261006',JSON.stringify(browserRecovery));}catch{recoveryError=new Error('La copia local necesita archivarse en el servidor. Inicia sesión como administrador para recuperarla automáticamente.');}
 }
 let versions={},queue=Promise.resolve(),lastError=recoveryError;
 function hydrate(){
  try{
   const me=new XMLHttpRequest();me.open('GET','api/auth/me',false);me.send();
   if(me.status!==200){window.portalSession=null;sessionStorage.removeItem('neo_admin_session');return false;}
    window.portalSession=JSON.parse(me.responseText);
    if(window.portalSession.sections.includes('usuarios')&&window.portalSession.sections.includes('cuentas')){
     if(browserRecovery&&!localStorage.getItem('neo_recovery_uploaded_20261006')&&!sessionStorage.getItem('neo_recovery_archived')){
      const archive=syncPost('api/recovery',browserRecovery);
      sessionStorage.setItem('neo_recovery_archived',archive.archive_id);
      try{nativeSet('neo_recovery_uploaded_20261006',archive.archive_id);}catch{}
      recoveryError=null;lastError=null;
     }
     if(!sessionStorage.getItem('neo_directory_imported')){syncPost('api/directory/import',{});sessionStorage.setItem('neo_directory_imported','1');}
    }
    if(recoveryError)throw recoveryError;
   const xhr=new XMLHttpRequest();xhr.open('GET','api/db',false);xhr.send();
   if(xhr.status!==200)throw new Error('No se pudieron cargar las fichas. La copia local está preservada.');
   const data=JSON.parse(xhr.responseText);versions=data.__versions||{};
   keys.forEach(key=>{if(typeof data[key]==='string')nativeSet(key,data[key]);else nativeRemove(key);});
   sessionStorage.setItem('neo_admin_session',(window.portalSession.kind==='user'?'user:':'cliente:')+window.portalSession.id);
   return true;
  }catch(error){lastError=error;return false;}
  }
 function syncPost(url,body){const xhr=new XMLHttpRequest();xhr.open('POST',url,false);xhr.setRequestHeader('Content-Type','application/json');xhr.setRequestHeader('X-Portal-Request','1');xhr.send(JSON.stringify(body));const result=JSON.parse(xhr.responseText||'{}');if(xhr.status<200||xhr.status>=300)throw new Error(result.error||'No se pudo recuperar la copia; los datos locales se conservan.');return result;}
 async function request(url,body,method='POST'){
  const response=await fetch(url.replace(/^\//,''),{method,headers:{'Content-Type':'application/json','X-Portal-Request':'1'},body:body===undefined?undefined:JSON.stringify(body)});
  const result=await response.json();if(!response.ok)throw new Error(result.error||'No se pudo guardar.');return result;
 }
 const online=hydrate();
 if(recoveryError){window.portalSession=null;sessionStorage.removeItem('neo_admin_session');}
 if(online)localStorage.setItem=function(key,value){
  nativeSet(key,value);if(!keys.includes(String(key)))return;
  const pending=String(value);
  queue=queue.catch(()=>{}).then(async()=>{
   const result=await request('/api/store/'+encodeURIComponent(key),{value:pending,version:versions[key]},'PUT');
   versions[key]=result.version;lastError=null;
  }).catch(error=>{lastError=error;window.dispatchEvent(new CustomEvent('portal-save-error',{detail:error.message}));throw error;});
  queue.catch(()=>{});
 };
 window.portalSync={hydrate,request,flush:async()=>{await queue;if(lastError)throw lastError;}};
 if(recoveryError)document.addEventListener('DOMContentLoaded',()=>{const error=document.getElementById('login-error');if(error){error.textContent=recoveryError.message;error.hidden=false;}});
})();
