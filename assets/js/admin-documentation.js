'use strict';
// Shared backend permissions: ibadah_konten (Admin, Majelis and Pendeta).
let docsSelectedService='';
function docsLink(row){
 if(row.source==='upload'&&/^uploads\/media\/service-docs\/[A-Za-z0-9_.-]+\.(jpg|mp4|webm|mov|pdf)$/.test(String(row.file_path||'')))return '/'+row.file_path;
 if(['drive_file','drive_folder'].includes(row.source)&&/^https:\/\/drive\.google\.com\//.test(row.external_url||''))return row.external_url;
 return '';
}
function renderDocsAdmin(){
 const list=$('#docsAdminList'),select=$('#docsServiceFilter'),count=$('#docsAdminCount');if(!list||!can('ibadah_konten','view'))return;
 const services=state.ibadah_konten||[];
 const value=docsSelectedService||select.value;
 select.innerHTML='<option value="">Semua halaman</option>'+services.map(s=>`<option value="${Number(s.id)}">${esc(s.judul)}</option>`).join('');
 if(services.some(s=>String(s.id)===value)){select.value=value;docsSelectedService=value;}else{docsSelectedService='';select.value='';}
 const byId=Object.fromEntries(services.map(s=>[s.id,s.judul]));
 const rows=(state.dokumentasi||[]).filter(r=>!docsSelectedService||String(r.service_id)===docsSelectedService);
 count.textContent=rows.length+' dokumentasi';
 list.innerHTML=rows.length?rows.map(r=>{
  const link=docsLink(r);
  const label=({upload:'Upload lokal',drive_file:'File Google Drive',drive_folder:'Folder Google Drive'})[r.source]||'-';
  return `<article class="docs-admin-card"><div class="doc-source">${esc(label)} · ${esc(r.media_type)} · ${badge(r.status)}</div><h3>${esc(r.judul)}</h3><p>${esc(byId[r.service_id]||'Halaman ibadah tidak tersedia')} · Urutan ${Number(r.urutan)}</p><p>${esc(r.deskripsi||'')}</p><div class="toolbar">${link?`<a class="btn ghost small" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Lihat ↗</a>`:''}${can('ibadah_konten','update')?`<button class="btn small" type="button" data-doc-edit="${Number(r.id)}">Edit</button>`:''}${can('ibadah_konten','delete')?`<button class="btn danger small" type="button" data-doc-delete="${Number(r.id)}">Hapus</button>`:''}</div></article>`;
 }).join(''):'<p class="muted">Belum ada dokumentasi di halaman ibadah ini.</p>';
}
window.renderDocsAdmin=renderDocsAdmin;
function docsToggle(){
 const f=$('#docForm');if(!f)return;
 const source=f.elements.source.value;
 for(const el of $$('[data-doc-upload]',f))el.hidden=source!=='upload';
 for(const el of $$('[data-doc-link]',f))el.hidden=source==='upload';
 for(const el of $$('[data-doc-drive-type]',f))el.hidden=source!=='drive_file';
 f.elements.external_url.required=source!=='upload';
 f.elements.document_file.required=source==='upload'&&!f.elements.id.value;
}
function docsOpen(id=0,serviceId=''){
 if(!can('ibadah_konten',id?'update':'create'))return;
 const r=id?(state.dokumentasi||[]).find(x=>Number(x.id)===Number(id)):null;
 if(id&&!r)return;
 const f=$('#docForm');f.reset();
 f.elements.id.value=r?.id||'';
 f.elements.service_id.innerHTML=(state.ibadah_konten||[]).map(s=>`<option value="${Number(s.id)}">${esc(s.judul)}</option>`).join('');
 f.elements.service_id.value=String(r?.service_id||serviceId||docsSelectedService||f.elements.service_id.options[0]?.value||'');
 f.elements.judul.value=r?.judul||'';
 f.elements.deskripsi.value=r?.deskripsi||'';
 f.elements.source.value=r?.source||'upload';
 f.elements.media_type.value=r?.media_type==='folder'?'photo':r?.media_type||'photo';
 f.elements.external_url.value=r?.external_url||'';
 f.elements.urutan.value=r?.urutan??99;
 f.elements.status.value=r?.status||'published';
 $('#docDialogTitle').textContent=(r?'Edit':'Tambah')+' Dokumentasi Ibadah';
 $('#docFormMessage').textContent='';docsToggle();$('#docDialog').showModal();
}
document.addEventListener('DOMContentLoaded',()=>{
 const form=$('#docForm'),dialog=$('#docDialog');if(!form||!dialog)return;
 renderDocsAdmin();
 $('#docsServiceFilter')?.addEventListener('change',e=>{docsSelectedService=e.target.value;renderDocsAdmin();});
 form.elements.source.addEventListener('change',docsToggle);
 $('#docClose').addEventListener('click',()=>dialog.close());
 $('#docCancel').addEventListener('click',()=>dialog.close());
 document.body.addEventListener('click',async e=>{
  const add=e.target.closest('[data-doc-add]'),edit=e.target.closest('[data-doc-edit]'),remove=e.target.closest('[data-doc-delete]'),service=e.target.closest('[data-doc-service]');
  if(add)docsOpen();
  if(edit)docsOpen(Number(edit.dataset.docEdit));
  if(service){docsSelectedService=service.dataset.docService;activateSection('ibadah-konten');renderDocsAdmin();$('#docsAdminArea').scrollIntoView({behavior:'smooth',block:'start'});}
  if(remove&&can('ibadah_konten','delete')&&confirm('Hapus dokumentasi ini dari website?')){
   remove.disabled=true;
   try{await api('delete_documentation',{method:'POST',body:{id:Number(remove.dataset.docDelete)}});await loadData();notify('Dokumentasi dihapus.');}
   catch(err){notify(err.message,'danger');remove.disabled=false;}
  }
 });
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!can('ibadah_konten',form.elements.id.value?'update':'create'))return;
  const button=form.querySelector('[type=submit]');button.disabled=true;$('#docFormMessage').textContent='Menyimpan dokumentasi…';
  try{await api('save_documentation',{method:'POST',body:new FormData(form)});dialog.close();await loadData();notify('Dokumentasi tersimpan.');}
  catch(err){$('#docFormMessage').textContent=err.message;}
  finally{button.disabled=false;}
 });
});
