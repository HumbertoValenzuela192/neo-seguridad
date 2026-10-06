(() => {
 const $ = id => document.getElementById(id);
 let clients = [], organizations = [], editing = null, draft = {}, organizationAction = null;
 const blankContact = relationship => ({name:'',relationship,phone:'',email:''});
 function message(text) { $('message').textContent = text; }
 async function request(path, method='GET', body) {
  const response = await fetch('api/directory'+path, {
   method, headers:{'Content-Type':'application/json','X-Portal-Request':'1'},
   body:body===undefined?undefined:JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error||'No se pudo completar la operación.');
  return data;
 }
 function button(label, action) {
  const b=document.createElement('button');b.type='button';b.className='btn btn-ghost';b.textContent=label;b.onclick=action;return b;
 }
 function labelFor(id) { return organizations.find(o=>o.id===id)?.name||'Sin organización'; }
 function options(element, initial) {
  element.replaceChildren();for(const [value,label] of initial)element.add(new Option(label,value));
  organizations.forEach(o=>element.add(new Option(o.name,o.id)));
 }
 async function load() {
  const [a,b]=await Promise.all([request('/clients'),request('/organizations')]);
  clients=a.clients;organizations=b.organizations;const selected=$('filter').value;
  options($('filter'),[['all','Todas las organizaciones'],['none','Sin organización']]);
  $('filter').value=[...$('filter').options].some(o=>o.value===selected)?selected:'all';
  render();renderOrganizations();
 }
 function render() {
  const query=$('search').value.trim().toLowerCase(),filter=$('filter').value,list=$('clients');list.replaceChildren();
  clients.filter(c=>(filter==='all'||(filter==='none'?!c.organization_id:c.organization_id===filter))&&[c.code,c.name,c.address].join(' ').toLowerCase().includes(query)).forEach(c=>{
   const row=document.createElement('article');row.className='record';
   const title=document.createElement('h2');title.textContent=c.code+' · '+c.name;
   const sub=document.createElement('p');sub.textContent=labelFor(c.organization_id)+' · '+(c.status==='pending'?'Datos pendientes':'Datos completos');
   const address=document.createElement('p');address.textContent=c.address||'Dirección pendiente';
   const editButton=button('Editar ficha',()=>edit(c));editButton.setAttribute('aria-label','Editar ficha de '+c.name);
   row.append(title,sub,address,editButton);list.append(row);
  });
  if(!list.children.length){const p=document.createElement('p');p.textContent='No hay fichas que coincidan con el filtro.';list.append(p);}
 }
 function renderOrganizations() {
  $('organizations').replaceChildren();organizations.forEach(o=>{
   const row=document.createElement('div');row.className='record';const name=document.createElement('span');name.textContent=o.name;
   row.append(name,button('Renombrar',()=>organizationDialog(o,'PUT')),button('Quitar',()=>organizationDialog(o,'DELETE')));$('organizations').append(row);
  });
 }
 function organizationDialog(org,method) {
  organizationAction={org,method};$('organization-dialog-title').textContent=(method==='DELETE'?'Quitar ':'Renombrar ')+org.name;
  $('organization-edit-name').value=org.name;$('organization-edit-name').hidden=method==='DELETE';
  $('organization-confirm').textContent=method==='DELETE'?'Quitar organización':'Guardar';$('organization-dialog').showModal();
 }
 function edit(client) {
  editing=client;draft=structuredClone(client||{external_id:'portal-directory:'+Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join(''),addresses:[],contacts:[],guards:[],supervisor:blankContact('Supervisor')});
  $('editor-title').textContent=client?'Editar '+client.code:'Nuevo cliente';
  for(const key of ['code','name'])$(key).value=client?.[key]||'';
  options($('organization'),[['','Sin organización']]);$('organization').value=client?.organization_id||'';
  $('status').value=client?.status||'pending';$('has-guard').checked=!!client?.has_guard;
  $('supervisor-name').value=client?.supervisor?.name||'';$('supervisor-phone').value=client?.supervisor?.phone||'';
  if(!draft.addresses.length)draft.addresses=[{address:'',latitude:null,longitude:null}];
  renderRows();$('editor').hidden=false;$('editor').scrollIntoView({behavior:'auto'});$('name').focus();
 }
 function input(row,label,value,type,onChange) {
  const field=document.createElement('label');field.className='field';const span=document.createElement('span');span.textContent=label;
  const control=document.createElement('input');control.type=type;control.value=value??'';control.oninput=()=>onChange(control.value);
  if(type==='number')control.step='any';field.append(span,control);row.append(field);
 }
 function renderRows() {
  for(const key of ['addresses','contacts','guards']) {
   const list=$(key);list.replaceChildren();draft[key].forEach((entry,i)=>{
    const row=document.createElement('div');row.className='contact-form';
    if(key==='addresses') {
     input(row,'Dirección '+(i+1),entry.address,'text',v=>{entry.address=v;entry.latitude=null;entry.longitude=null;row.querySelectorAll('input[type="number"]').forEach(control=>{control.value='';});});
     input(row,'Latitud '+(i+1),entry.latitude,'number',v=>entry.latitude=v===''?null:Number(v));
     input(row,'Longitud '+(i+1),entry.longitude,'number',v=>entry.longitude=v===''?null:Number(v));
    } else {
     input(row,'Nombre '+(i+1),entry.name,'text',v=>entry.name=v);input(row,'Cargo '+(i+1),entry.relationship,'text',v=>entry.relationship=v);
     input(row,'Teléfono '+(i+1),entry.phone,'tel',v=>entry.phone=v);input(row,'Correo '+(i+1),entry.email,'email',v=>entry.email=v);
     if(key==='contacts') {
      const up=button('Subir contacto '+(i+1),()=>{[draft[key][i-1],draft[key][i]]=[draft[key][i],draft[key][i-1]];renderRows();});up.disabled=i===0;
      const down=button('Bajar contacto '+(i+1),()=>{[draft[key][i],draft[key][i+1]]=[draft[key][i+1],draft[key][i]];renderRows();});down.disabled=i===draft[key].length-1;row.append(up,down);
     }
    }
    row.append(button('Quitar '+(key==='addresses'?'dirección':key==='guards'?'guardia':'contacto')+' '+(i+1),()=>{draft[key].splice(i,1);renderRows();}));list.append(row);
   });
  }
 }
 $('search').oninput=render;$('filter').onchange=render;$('new').onclick=()=>edit(null);
 $('refresh').onclick=()=>load().then(()=>message('Datos actualizados.')).catch(e=>message(e.message));$('cancel').onclick=()=>{$('editor').hidden=true;};
 for(const [id,key] of [['add-address','addresses'],['add-contact','contacts'],['add-guard','guards']])$(id).onclick=()=>{
  draft[key].push(key==='addresses'?{address:'',latitude:null,longitude:null}:blankContact(key==='guards'?'Guardia':''));renderRows();
 };
 $('client-form').onsubmit=async event=>{
  event.preventDefault();$('save').disabled=true;
  try {
   const first=draft.addresses[0]||{};
   const body={name:$('name').value.trim(),code:$('code').value.trim(),organization_id:$('organization').value||null,status:$('status').value,
    address:first.address||'',latitude:first.latitude??null,longitude:first.longitude??null,addresses:draft.addresses,contacts:draft.contacts,guards:draft.guards,
    supervisor:{...draft.supervisor,name:$('supervisor-name').value,phone:$('supervisor-phone').value},has_guard:$('has-guard').checked};
   if(editing)body.version=editing.version;
   else body.external_id=draft.external_id;
   await request('/clients'+(editing?'/'+editing.id:''),editing?'PATCH':'POST',body);$('editor').hidden=true;await load();message('Ficha guardada en NEO.');
  }catch(e){message(e.message);$('message').scrollIntoView();}finally{$('save').disabled=false;}
 };
 $('organization-form').onsubmit=async event=>{
  event.preventDefault();const b=event.target.querySelector('button');b.disabled=true;
  try{await request('/organizations','POST',{name:$('organization-name').value});$('organization-name').value='';await load();message('Organización creada.');}
  catch(e){message(e.message);}finally{b.disabled=false;}
 };
 $('organization-edit').onsubmit=async event=>{
  event.preventDefault();const {org,method}=organizationAction;$('organization-confirm').disabled=true;
  try{await request('/organizations/'+org.id,method,method==='DELETE'?undefined:{name:$('organization-edit-name').value});$('organization-dialog').close();await load();message(method==='DELETE'?'Organización quitada. Las fichas se conservaron.':'Organización actualizada.');}
  catch(e){message(e.message);}finally{$('organization-confirm').disabled=false;}
 };
 $('organization-cancel').onclick=()=>$('organization-dialog').close();
 $('migrate').onclick=async()=>{
  $('migrate').disabled=true;
  try{const response=await fetch('api/directory/import',{method:'POST',headers:{'X-Portal-Request':'1','Content-Type':'application/json'},body:'{}'});const result=await response.json();if(!response.ok)throw new Error(result.error);await load();message('Importación verificada. Cuentas procesadas: '+result.accounts);}
  catch(e){message(e.message);}finally{$('migrate').disabled=false;}
 };
 window.addEventListener('focus',()=>{void load().catch(e=>message(e.message));});
 load().catch(e=>message(e.message+' Si tu sesión venció, vuelve al portal para ingresar.'));
})();
