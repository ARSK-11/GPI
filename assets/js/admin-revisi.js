/* GPI Cipayung: category CMS, finance KPIs, warta attachment UX */
'use strict';
(function(){
 const rupiahRevisi = n=>'Rp '+(Number(n)||0).toLocaleString('id-ID',{maximumFractionDigits:2});
 function financeSummary(){
  const target=document.querySelector('#financeSummary');if(!target)return;
  let masuk=0,keluar=0,janji=0;
  for(const r of (state.persembahan||[])){
   const n=Number(r.jumlah)||0;
   if(r.jenis_transaksi==='Janji Iman'&&r.status_janji==='janji')janji+=n;
   else if(r.arus_kas==='keluar')keluar+=n;
   else masuk+=n;
  }
  const entries=[['Total pemasukan',masuk],['Total pengeluaran',keluar],['Saldo kas',masuk-keluar],['Janji belum terealisasi',janji]];
  target.innerHTML=entries.map(([l,v],i)=>`<article class="gpi-finance-kpi ${i===2?'main':''}"><small>${esc(l)}</small><strong>${esc(rupiahRevisi(v))}</strong></article>`).join('');
 }
 function categories(){
  const box=document.querySelector('#connectCategoryList');if(!box)return;
  const rows=state.connect_categories||[];
  box.innerHTML=rows.map(r=>`<article class="gpi-connect-cat ${Number(r.aktif)?'':'inactive'}"><div><strong>${esc(r.label)}</strong><small>${esc(r.description)} · ${esc(r.kode)}</small></div><span>${Number(r.aktif)?'Aktif':'Nonaktif'}</span><button class="btn small ghost" type="button" data-category-edit="${Number(r.id)}">Edit</button>${Number(r.aktif)?`<button class="btn small danger" data-category-hide="${Number(r.id)}" type="button">Hapus</button>`:''}</article>`).join('')||'<p class="muted">Belum tersedia pilihan formulir.</p>';
 }
 window.renderGPIRevisi=()=>{financeSummary();categories();};
 document.addEventListener('DOMContentLoaded',()=>{
  const catForm=document.querySelector('#connectCategoryForm');
  catForm?.addEventListener('submit',async e=>{
   e.preventDefault();const b=catForm.querySelector('button[type=submit]');b.disabled=true;
   try{const body=Object.fromEntries(new FormData(catForm));await api('save_connect_category',{method:'POST',body});await loadData();catForm.reset();catForm.elements.id.value='';catForm.elements.kode.readOnly=false;notify('Pilihan formulir tersimpan.');}
   catch(err){notify(err.message,'danger');}finally{b.disabled=false;}
  });
  catForm?.addEventListener('reset',()=>{setTimeout(()=>{catForm.elements.id.value='';catForm.elements.kode.readOnly=false;},0)});
  document.querySelector('#connectCategoryList')?.addEventListener('click',async e=>{
   const edit=e.target.closest('[data-category-edit]'),hide=e.target.closest('[data-category-hide]');
   if(edit){const r=(state.connect_categories||[]).find(x=>Number(x.id)===Number(edit.dataset.categoryEdit));if(!r)return;
    for(const k of ['id','kode','label','description','prompt','urutan','aktif'])catForm.elements[k].value=r[k]??'';
    catForm.elements.kode.readOnly=true;catForm.scrollIntoView({behavior:'smooth',block:'center'});catForm.elements.label.focus();
   }
   if(hide&&confirm('Nonaktifkan pilihan ini dari formulir publik? Data permohonan lama tetap tersimpan.')){
    try{await api('delete_connect_category',{method:'POST',body:{id:Number(hide.dataset.categoryHide)}});await loadData();notify('Pilihan dinonaktifkan.');}catch(err){notify(err.message,'danger');}
   }
  });
  function financeFilterChange(){renderPersembahan();const q=new URLSearchParams({action:'export_keuangan_excel'});const st=document.querySelector('#financeStartDate')?.value,en=document.querySelector('#financeEndDate')?.value,type=document.querySelector('#financeTypeFilter')?.value;if(st)q.set('dari',st);if(en)q.set('sampai',en);if(type)q.set('jenis',type);const a=document.querySelector('.gpi-export-xlsx');if(a)a.href='/api?'+q.toString();}
  for(const name of ['financeTypeFilter','financeStartDate','financeEndDate'])document.querySelector('#'+name)?.addEventListener('change',financeFilterChange);
  document.querySelector('#financeClearFilter')?.addEventListener('click',()=>{for(const id of ['financeTypeFilter','financeStartDate','financeEndDate'])document.getElementById(id).value='';financeFilterChange();});
  const trans=document.querySelector('#financeTransactionType'),direction=document.querySelector('#financeCashDirection'),pledge=document.querySelector('#financePledgeStatus');
  function updateType(){if(!trans)return;const isPledge=trans.value==='Janji Iman';pledge.disabled=!isPledge;if(!isPledge)pledge.value='realisasi';direction.querySelector('option[value="keluar"]').disabled=trans.value!=='Kas';if(trans.value!=='Kas')direction.value='masuk';}
  trans?.addEventListener('change',()=>{if(trans.value==='Janji Iman')pledge.value='janji';updateType()});
  // Called after edit modal is filled to keep pledge direction restrictions in sync.
  document.body.addEventListener('click',e=>{
   if(e.target.closest('[data-open-modal="persembahanModal"]')){setTimeout(()=>{updateType();const f=document.querySelector('[data-form="persembahan"]');if(f&&!f.elements.id.value)f.elements.tanggal.value=new Date().toLocaleDateString('en-CA');},0);}
   if(e.target.closest('[data-edit="persembahan"]'))setTimeout(updateType,40);
   if(e.target.closest('[data-edit="pengumuman"]'))setTimeout(()=>{const f=document.querySelector('[data-form="pengumuman"]'),row=(state.pengumuman||[]).find(r=>String(r.id)===String(f?.elements.id.value));const p=document.querySelector('#currentWartaMedia');if(p)p.textContent=row?.media_path?'Media saat ini: '+row.media_path:'';},50);
   if(e.target.closest('[data-open-modal="pengumumanModal"]'))document.querySelector('#currentWartaMedia').textContent='';
  });
  updateType();
 });
})();
