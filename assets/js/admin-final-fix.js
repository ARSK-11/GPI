(function(){
  'use strict';
  const $ = (q, root=document) => root.querySelector(q);
  const $$ = (q, root=document) => Array.from(root.querySelectorAll(q));
  const csrf = $('meta[name="csrf-token"]')?.content || '';
  let dataCache = {};

  function notify(msg, type='success') {
    const box = $('#toast');
    if (box) {
      box.textContent = msg;
      box.className = 'toast show ' + (type === 'danger' ? 'danger' : type === 'warning' ? 'warning' : 'success');
      clearTimeout(notify._t);
      notify._t = setTimeout(() => box.classList.remove('show'), 3200);
    } else {
      alert(msg);
    }
  }

  function readInitial() {
    try { dataCache = JSON.parse($('#adminInitialData')?.textContent || '{}') || {}; }
    catch (_) { dataCache = {}; }
  }
  readInitial();

  async function api(action, {method='GET', body=null, query=''} = {}) {
    const sep = query ? (query.startsWith('&') ? '' : '&') : '&';
    const url = '/api?action=' + encodeURIComponent(action) + (query || '') + sep + '_ts=' + Date.now();
    const init = { method, cache:'no-store', headers:{'Cache-Control':'no-cache','Pragma':'no-cache'} };
    if (body instanceof FormData) {
      if (!body.get('csrf_token')) body.append('csrf_token', csrf);
      init.body = body;
    } else if (body && typeof body === 'object') {
      init.headers['Content-Type'] = 'application/json';
      init.headers['X-CSRF-Token'] = csrf;
      init.body = JSON.stringify(body);
    }
    const res = await fetch(url, init);
    const json = await res.json().catch(() => ({success:false, message:'Respons server tidak valid.'}));
    if (!json.success) throw new Error(json.message || 'Proses gagal.');
    return json;
  }

  async function refreshData(render=true) {
    const json = await api('bootstrap');
    dataCache = json.data || {};
    if (render) {
      if (typeof window.renderAll === 'function') {
        try { window.state = Object.assign(window.state || {}, dataCache); window.renderAll(); }
        catch (_) {}
      }
      if (typeof window.loadData === 'function') {
        try { await window.loadData(); } catch (_) {}
      }
    }
    return dataCache;
  }

  function rowsFor(type) {
    return ({
      user:dataCache.users, jemaat:dataCache.jemaat, jadwal:dataCache.jadwal,
      pengumuman:dataCache.pengumuman, media:dataCache.media, pesan:dataCache.pesan,
      sakramen:dataCache.sakramen, persembahan:dataCache.persembahan,
      pernikahan:dataCache.pernikahan, tim_pelayan:dataCache.tim_pelayan,
      pendalaman_alkitab:dataCache.pendalaman_alkitab
    }[type] || []);
  }

  function modalFor(type) {
    if (type === 'tim_pelayan') return 'timPelayanModal';
    if (type === 'pendalaman_alkitab') return 'pendalaman_alkitabModal';
    if (type === 'user') return 'userModal';
    return type + 'Modal';
  }
  function openModal(id) {
    const m = $('#' + id);
    if (!m) return;
    m.classList.add('show');
    m.setAttribute('aria-hidden','false');
  }
  function closeModal(el) {
    const m = el?.closest?.('.modal') || el;
    if (!m) return;
    m.classList.remove('show');
    m.setAttribute('aria-hidden','true');
  }
  function resetForm(form) {
    if (!form) return;
    form.reset();
    $$('input[type="hidden"]', form).forEach(i => { if (i.name !== 'csrf_token') i.value = ''; });
    if (form.elements.hapus_foto) form.elements.hapus_foto.value = '0';
    if (form.dataset.form === 'tim_pelayan') resetTeamPhoto(false);
  }
  function fillForm(form, row) {
    Object.entries(row || {}).forEach(([k,v]) => { if (form.elements[k]) form.elements[k].value = v ?? ''; });
  }

  const TIM_OPTS = {
    musik:{tim:['Pemain Musik','Pemain Cadangan'], jabatan:['Pemain Keyboard','Pemain Gitar','Pemain Drum','Pemain Bass','Bass & Gitar','Keyboard & Drum','Gitar & Drum']},
    singer:{tim:['Singers / Pujian'], jabatan:['Vocalist','Singer','Song Leader']},
    pelayanan_gereja:{tim:['Gembala Sidang','Pendamping & Pelayan Gereja'], jabatan:['Gembala Sidang','Hamba Tuhan','Evangelis']},
    diakonia:{tim:['Diakonia Gereja'], jabatan:['Ketua','Sekretaris','Keuangan','Bendahara','Anggota']},
    media:{tim:['Media Gereja'], jabatan:['Koordinator Media','Publikasi','Dokumentasi','Teknis Media','Konten Digital','Desain','Video']},
    sekolah_minggu:{tim:['Sekolah Minggu'], jabatan:['Koordinator Sekolah Minggu','Guru Sekolah Minggu','Pendamping Anak','Anggota']},
    kaum_ibu:{tim:['Kaum Ibu'], jabatan:['Pembina','Ketua','Sekretaris','Bendahara','Sie. Doa','Sie. Pemerhati','Anggota']},
    pemuda:{tim:['Revive Generation'], jabatan:['Pembina','Ketua','Sekretaris','Bendahara','Kerohanian','Humas','Anggota']}
  };
  function setOptions(select, values, selected='') {
    if (!select) return;
    const list = Array.from(new Set([selected, ...values].filter(Boolean)));
    select.innerHTML = '<option value="">Pilih</option>' + list.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
    select.value = selected || '';
  }
  function syncTimOptions(form, row={}) {
    if (!form || form.dataset.form !== 'tim_pelayan') return;
    const kategori = row.kategori || form.elements.kategori?.value || 'musik';
    if (form.elements.kategori) form.elements.kategori.value = kategori;
    const opt = TIM_OPTS[kategori] || TIM_OPTS.musik;
    setOptions(form.elements.tim, opt.tim, row.tim || '');
    setOptions(form.elements.jabatan, opt.jabatan, row.jabatan || '');
  }
  function escapeHtml(v){ return String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }

  // Tim photo crop/delete fix
  const team = {file:null,url:'',ready:false,drag:false,x:0,y:0,lastX:0,lastY:0,zoom:1,nw:0,nh:0,crop:300};
  function tForm(){ return $('[data-form="tim_pelayan"]'); }
  function tEl(name){ const f=tForm(); return f ? f.elements[name] : null; }
  const cropInline = () => $('#teamCropInline');
  const cropStage = () => $('#teamCropStage');
  const cropImg = () => $('#teamCropImage');
  const cropCanvas = () => $('#teamCropPreview');
  const cropZoom = () => $('#teamCropZoom');
  const previewBox = () => $('#teamUploadPreview .team-upload-preview-box');
  const previewText = () => $('#teamUploadPreview .team-upload-summary p');
  function setTeamPreview(src, text) {
    const b = previewBox();
    if (b) b.innerHTML = src ? `<img src="${escapeHtml(src)}" alt="Preview foto">` : '<span>Preview foto</span>';
    const p = previewText();
    if (p && text) p.innerHTML = text;
  }
  function resetTeamPhoto(clearFile=true) {
    if (team.url) { try { URL.revokeObjectURL(team.url); } catch(_){} }
    Object.assign(team,{file:null,url:'',ready:false,drag:false,x:0,y:0,lastX:0,lastY:0,zoom:1,nw:0,nh:0,crop:300});
    const i = cropInline(); if (i) { i.hidden = true; i.classList.remove('active'); }
    const im = cropImg(); if (im) { im.removeAttribute('src'); im.style.width=''; im.style.height=''; im.style.transform=''; }
    const z = cropZoom(); if (z) z.value = '1';
    if (tEl('foto_cropped_data')) tEl('foto_cropped_data').value = '';
    if (clearFile && tEl('foto_file')) tEl('foto_file').value = '';
    setTeamPreview('', 'Pilih foto, lalu geser dan zoom langsung di area bawah ini. Jika format foto tidak mendukung preview browser, file tetap akan dicoba simpan ke server.');
  }
  function baseSize(){ const s=Math.max(team.crop/Math.max(1,team.nw), team.crop/Math.max(1,team.nh)); return {w:team.nw*s,h:team.nh*s}; }
  function clamp(){ const b=baseSize(), w=b.w*team.zoom, h=b.h*team.zoom, c=team.crop; team.x=Math.max(-(w-c)/2, Math.min((w-c)/2, team.x)); team.y=Math.max(-(h-c)/2, Math.min((h-c)/2, team.y)); }
  function srcRect(){ if(!team.ready) return null; const b=baseSize(), dw=b.w*team.zoom, dh=b.h*team.zoom, c=team.crop; let sx=((dw-c)/2-team.x)/(dw/team.nw), sy=((dh-c)/2-team.y)/(dh/team.nh), sw=c/(dw/team.nw), sh=c/(dh/team.nh); sx=Math.max(0,Math.min(team.nw-sw,sx)); sy=Math.max(0,Math.min(team.nh-sh,sy)); return {sx,sy,sw,sh}; }
  function draw(size=180){ const im=cropImg(), cv=cropCanvas(), r=srcRect(); if(!im||!cv||!r) return ''; cv.width=size; cv.height=size; const ctx=cv.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,size,size); ctx.drawImage(im,r.sx,r.sy,r.sw,r.sh,0,0,size,size); return r; }
  function renderCrop(){ const im=cropImg(); if(!im||!team.ready) return; const b=baseSize(); im.style.width=(b.w*team.zoom)+'px'; im.style.height=(b.h*team.zoom)+'px'; im.style.transform=`translate(calc(-50% + ${team.x}px), calc(-50% + ${team.y}px))`; draw(); }
  function setupCrop(){ const st=cropStage(); if(!st) return; const r=st.getBoundingClientRect(); team.crop=Math.min((r.width||420)*.72,(r.height||340)*.72,320); team.x=0; team.y=0; team.zoom=1; const z=cropZoom(); if(z) z.value='1'; clamp(); renderCrop(); }
  function makeCropData(size=900){ const im=cropImg(), r=srcRect(); if(!im||!r) return ''; const cv=document.createElement('canvas'); cv.width=size; cv.height=size; const ctx=cv.getContext('2d'); ctx.fillStyle='#fff'; ctx.fillRect(0,0,size,size); ctx.drawImage(im,r.sx,r.sy,r.sw,r.sh,0,0,size,size); return cv.toDataURL('image/jpeg',.9); }
  function applyCrop(){ if(!team.ready || !tEl('foto_cropped_data')) return false; const data=makeCropData(900); if(!data) return false; tEl('foto_cropped_data').value=data; setTeamPreview(data, 'Posisi foto siap disimpan. Klik <strong>Simpan Tim Pelayan</strong>.'); return true; }
  function handlePhoto(file) {
    if (tEl('hapus_foto')) tEl('hapus_foto').value = '0';
    if (tEl('foto_cropped_data')) tEl('foto_cropped_data').value = '';
    if (!file) { resetTeamPhoto(false); return; }
    resetTeamPhoto(false);
    team.file=file; team.url=URL.createObjectURL(file);
    const im=cropImg(), inline=cropInline();
    if (inline) { inline.hidden=false; inline.classList.add('active'); }
    if (!im) return;
    im.onload=()=>{ team.ready=true; team.nw=im.naturalWidth||1; team.nh=im.naturalHeight||1; requestAnimationFrame(setupCrop); setTeamPreview(team.url, 'Geser foto dan atur zoom. Saat klik <strong>Simpan Tim Pelayan</strong>, posisi ini otomatis disimpan.'); };
    im.onerror=()=>{ team.ready=false; if (inline) { inline.hidden=true; inline.classList.remove('active'); } setTeamPreview('', 'File foto tetap dipilih. Format ini tidak bisa dipreview browser, tetapi akan dikirim ke server saat disimpan.'); };
    im.src=team.url;
  }
  function bindPhotoTools(){
    const f=tForm(); if(!f || f.dataset.finalPhotoBound==='1') return; f.dataset.finalPhotoBound='1';
    const inp=f.elements.foto_file; if(inp) inp.addEventListener('change', e => handlePhoto(e.target.files && e.target.files[0]), true);
    const del=$('#teamPhotoRemoveBtn'); if(del) del.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); resetTeamPhoto(true); if(tEl('foto_path')) tEl('foto_path').value=''; if(tEl('hapus_foto')) tEl('hapus_foto').value='1'; setTeamPreview('', 'Foto lama akan dihapus setelah klik <strong>Simpan Tim Pelayan</strong>.'); }, true);
    const reset=$('#teamCropReset'); if(reset) reset.addEventListener('click', e => { e.preventDefault(); setupCrop(); }, true);
    const apply=$('#teamCropApply'); if(apply) apply.addEventListener('click', e => { e.preventDefault(); if(!applyCrop()) notify('Foto belum siap diproses.', 'danger'); }, true);
    const z=cropZoom(); if(z) z.addEventListener('input', () => { if(!team.ready) return; const old=team.zoom || 1; team.zoom=Number(z.value)||1; team.x*=team.zoom/old; team.y*=team.zoom/old; clamp(); renderCrop(); }, true);
    const st=cropStage();
    if(st){
      st.addEventListener('pointerdown', e => { if(!team.ready) return; e.preventDefault(); team.drag=true; team.lastX=e.clientX; team.lastY=e.clientY; try{st.setPointerCapture(e.pointerId)}catch(_){} }, true);
      st.addEventListener('pointermove', e => { if(!team.drag||!team.ready) return; e.preventDefault(); team.x+=e.clientX-team.lastX; team.y+=e.clientY-team.lastY; team.lastX=e.clientX; team.lastY=e.clientY; clamp(); renderCrop(); }, true);
      ['pointerup','pointercancel','pointerleave'].forEach(ev => st.addEventListener(ev,()=>{team.drag=false},true));
      st.addEventListener('wheel', e => { if(!team.ready) return; e.preventDefault(); const z=cropZoom(); const old=team.zoom; team.zoom=Math.max(1, Math.min(3, team.zoom + (e.deltaY<0?.08:-.08))); if(z) z.value=String(team.zoom); team.x*=team.zoom/old; team.y*=team.zoom/old; clamp(); renderCrop(); }, {capture:true,passive:false});
    }
  }

  const saveActions = {user:'save_user', jemaat:'save_jemaat', jadwal:'save_jadwal', pengumuman:'save_pengumuman', media:'upload_media', reply:'reply_message', sakramen:'save_sakramen', persembahan:'save_persembahan', pernikahan:'save_pernikahan', tim_pelayan:'save_tim_pelayan', pendalaman_alkitab:'save_pendalaman_alkitab'};
  const delActions = {user:'delete_user', jemaat:'delete_jemaat', jadwal:'delete_jadwal', pengumuman:'delete_pengumuman', media:'delete_media', message:'delete_message', sakramen:'delete_sakramen', persembahan:'delete_persembahan', pernikahan:'delete_pernikahan', tim_pelayan:'delete_tim_pelayan', pendalaman_alkitab:'delete_pendalaman_alkitab'};
  async function afterChange(){ try { await refreshData(true); } catch(_) { location.reload(); } }

  // Excel/CSV import persembahan
  function clean(v){ return String(v ?? '').trim(); }
  function toNumber(v){ const s=clean(v).replace(/[^0-9,-]/g,'').replace(',', '.'); return Number(s) || 0; }
  function isoDate(v){ if(v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`; const s=clean(v); let m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/); if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`; m=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/); if(m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`; const d=new Date(s); return isNaN(d)?'':`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  function csvRows(text){ const out=[]; let row=[], cell='', q=false; for(let i=0;i<text.length;i++){ const c=text[i], n=text[i+1]; if(c==='"'){ if(q && n==='"'){cell+='"'; i++;} else q=!q; } else if(c===',' && !q){row.push(cell); cell='';} else if((c==='\n'||c==='\r')&&!q){ if(c==='\r'&&n==='\n') i++; row.push(cell); if(row.some(x=>clean(x))) out.push(row); row=[]; cell=''; } else cell+=c; } row.push(cell); if(row.some(x=>clean(x))) out.push(row); return out; }
  function matrixToObjects(matrix){ if(!matrix.length) return []; const h=matrix[0].map(x=>clean(x).toLowerCase()); return matrix.slice(1).map(r=>Object.fromEntries(h.map((k,i)=>[k, r[i] ?? '']))); }
  function pick(row, keys){ const names=Object.keys(row); for(const k of keys){ const f=names.find(n=>n.replace(/[_\s]/g,'').toLowerCase()===k.replace(/[_\s]/g,'').toLowerCase()); if(f) return row[f]; } return ''; }
  async function parsePersembahan(file){
    let rows=[]; const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(ext==='csv') rows=matrixToObjects(csvRows(await file.text()));
    else { if(!window.XLSX) throw new Error('Library Excel belum termuat. Coba reload halaman, lalu import ulang.'); const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true,raw:true}); rows=[]; wb.SheetNames.forEach(n=>{ rows.push(...matrixToObjects(XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:'',raw:true}))); }); }
    return rows.map(r=>({
      tanggal: isoDate(pick(r,['tanggal','date'])),
      jenis_ibadah: clean(pick(r,['jenis ibadah','jenis_ibadah','ibadah'])) || 'Ibadah',
      jenis_persembahan: clean(pick(r,['jenis persembahan','jenis_persembahan','jenis'])) || 'Persembahan Umum',
      jumlah: toNumber(pick(r,['jumlah','nominal','total','amount'])),
      kolektan: clean(pick(r,['kolektan','petugas'])) || '',
      keterangan: clean(pick(r,['keterangan','catatan','deskripsi'])) || ''
    })).filter(r=>r.tanggal && r.jumlah>0);
  }
  async function importPersembahan(file){
    if(!file) return;
    try{
      const rows=await parsePersembahan(file);
      if(!rows.length) throw new Error('Tidak ada data persembahan valid. Pastikan kolom minimal: Tanggal, Jenis Ibadah, Jenis Persembahan, Jumlah, Kolektan, Keterangan.');
      if(!confirm(`Import ${rows.length} data persembahan dari ${file.name}?`)) return;
      for(const r of rows){ const fd=new FormData(); Object.entries(r).forEach(([k,v])=>fd.append(k,v)); await api('save_persembahan',{method:'POST',body:fd}); }
      notify(`${rows.length} data persembahan berhasil diimport.`);
      await afterChange();
    }catch(err){ notify(err.message || 'Import persembahan gagal.', 'danger'); }
  }

  document.addEventListener('click', async function(e){
    const add = e.target.closest('[data-open-modal]');
    if (add) {
      e.preventDefault(); e.stopImmediatePropagation();
      const form = $('#' + add.dataset.openModal + ' form');
      resetForm(form);
      if (form?.dataset.form === 'tim_pelayan') { syncTimOptions(form, {}); bindPhotoTools(); }
      openModal(add.dataset.openModal);
      return;
    }
    const toggle = e.target.closest('#toggleAddJemaat,#toggleAddJadwal,#toggleAddPersembahan');
    if (toggle) {
      e.preventDefault(); e.stopImmediatePropagation();
      const menuId = toggle.id === 'toggleAddJemaat' ? 'menuAddJemaat' : toggle.id === 'toggleAddJadwal' ? 'menuAddJadwal' : 'menuAddPersembahan';
      const menu = $('#' + menuId);
      $$('.add-dropdown-menu.open').forEach(m => { if (m !== menu) m.classList.remove('open'); });
      menu?.classList.toggle('open');
      return;
    }
    const close = e.target.closest('[data-close-modal]');
    if (close) { e.preventDefault(); e.stopImmediatePropagation(); closeModal(close); return; }
    const dots = e.target.closest('[data-dots]');
    if (dots) { e.preventDefault(); e.stopImmediatePropagation(); const menu=dots.nextElementSibling; $$('.action-dropdown.open').forEach(m=>{if(m!==menu)m.classList.remove('open')}); menu?.classList.toggle('open'); return; }
    const edit = e.target.closest('[data-edit]');
    if (edit) {
      e.preventDefault(); e.stopImmediatePropagation();
      try { await refreshData(false); } catch(_) {}
      const type = edit.dataset.edit;
      const row = rowsFor(type).find(x => String(x.id) === String(edit.dataset.id));
      const form = $('[data-form="' + type + '"]');
      if (!row || !form) { notify('Data belum siap untuk diedit. Klik Refresh Data lalu coba lagi.', 'danger'); return; }
      resetForm(form);
      if (type === 'tim_pelayan') { syncTimOptions(form, row); bindPhotoTools(); }
      fillForm(form, row);
      if (type === 'tim_pelayan') { if (form.elements.hapus_foto) form.elements.hapus_foto.value='0'; setTeamPreview(row.foto_path || '', 'Pilih foto baru untuk mengganti, atau klik Hapus Foto lalu Simpan.'); }
      if (type === 'user' && form.elements.password) form.elements.password.value = '';
      openModal(modalFor(type));
      return;
    }
    const del = e.target.closest('[data-delete]');
    if (del) {
      e.preventDefault(); e.stopImmediatePropagation();
      if(!confirm('Yakin ingin menghapus data ini?')) return;
      try { await api(delActions[del.dataset.delete], {method:'POST', query:'&id=' + encodeURIComponent(del.dataset.id), body:new FormData()}); notify('Data berhasil dihapus.'); await afterChange(); }
      catch(err){ notify(err.message || 'Gagal menghapus data.', 'danger'); }
      return;
    }
  }, true);

  document.addEventListener('submit', async function(e){
    const form = e.target.closest('[data-form]');
    if (!form) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const type = form.dataset.form;
    try {
      if (type === 'tim_pelayan') { bindPhotoTools(); const file=form.elements.foto_file?.files?.[0]; if(file && team.ready) applyCrop(); }
      const action = saveActions[type];
      if (!action) throw new Error('Aksi simpan belum tersedia.');
      const json = await api(action, {method:'POST', body:new FormData(form)});
      notify(json.message || 'Data berhasil disimpan.');
      closeModal(form);
      await afterChange();
    } catch(err) { notify(err.message || 'Gagal menyimpan data.', 'danger'); }
  }, true);

  document.addEventListener('change', function(e){
    if (e.target.matches('[data-form="tim_pelayan"] select[name="kategori"]')) syncTimOptions(tForm(), {});
    if (e.target.id === 'importPersembahan') { const f=e.target.files && e.target.files[0]; e.target.value=''; importPersembahan(f); }
  }, true);

  document.addEventListener('DOMContentLoaded', function(){
    bindPhotoTools();
  });
})();
