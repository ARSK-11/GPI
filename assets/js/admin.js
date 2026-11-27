const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
let state = { user: {}, permissions: {}, stats: {}, terhubung: [], users: [], jemaat: [], jadwal: [], pengumuman: [], media: [], pesan: [], sakramen: [], persembahan: [], pernikahan: [], tim_pelayan: [], pendalaman_alkitab: [], whatsapp: [] };
let activeSection = 'dashboard';
let whatsappTimer = null;
let botState = null;
let announcementId = null;
let filtered = { jemaat: '', jadwal: '' };

const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => Array.from(root.querySelectorAll(q));
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
const badge = (v) => `<span class="badge ${badgeClass(v)}">${esc(v || '-')}</span>`;
const badgeClass = (v) => {
  v = String(v || '').toLowerCase();
  if (['aktif','published','dibalas','terkirim'].includes(v)) return 'success';
  if (['baru','draft','menunggu','pending','tidak_pasti'].includes(v)) return 'warning';
  if (['nonaktif','batal','gagal','pindah','meninggal'].includes(v)) return 'danger';
  return 'neutral';
};
const initialPermissions = (() => { try { return JSON.parse(document.getElementById('appPermissions')?.textContent || '{}'); } catch(e) { return {}; } })();
const initialBootstrap = (() => { try { return JSON.parse(document.getElementById('adminInitialData')?.textContent || 'null'); } catch(e) { return null; } })();
if (initialBootstrap && typeof initialBootstrap === 'object') {
  state = { ...state, ...initialBootstrap, permissions: initialBootstrap.permissions || state.permissions || {} };
}
let initialBootstrapRendered = false;
const sectionKey = (section) => String(section || '').replace(/-/g, '_');
function can(section, op = 'view') {
  const perms = state.permissions && Object.keys(state.permissions).length ? state.permissions : initialPermissions;
  return !!(perms?.[sectionKey(section)]?.[op]);
}
function roleLabel(role) {
  return ({admin:'Admin', superadmin:'Admin', majelis:'Majelis / Pengurus', pengurus:'Majelis / Pengurus', pendeta:'Pendeta'}[String(role || '').toLowerCase()] || role || '-');
}
function actionMenu(items) {
  const enabled = items.filter(Boolean).map(x => String(x).replace(/<button(?![^>]*type=)/g, '<button type="button"'));
  if (!enabled.length) return '<span class="muted">-</span>';
  return `<div class="action-menu"><button type="button" class="action-dots" data-dots aria-label="Aksi">⋯</button><div class="action-dropdown">${enabled.join('')}</div></div>`;
}
function applyPermissions() {
  $$('[data-permission]').forEach(el => {
    const [section, op] = String(el.dataset.permission || '').split(':');
    if (section && op && !can(section, op)) el.style.display = 'none';
  });
  $$('.side-nav button').forEach(btn => { if (!can(btn.dataset.section, 'view')) btn.remove(); });
  const hide = (sel) => $$(sel).forEach(el => { el.style.display = 'none'; });
  const hideParent = (sel) => $$(sel).forEach(el => { (el.closest('label') || el).style.display = 'none'; });
  if (!can('jemaat','create') && !can('jemaat','import')) hide('#toggleAddJemaat');
  if (!can('jemaat','import')) hideParent('#importJemaat');
  if (!can('jemaat','export')) hide('[data-export="jemaat"]');
  if (!can('jemaat','delete')) hide('#deleteAllJemaat');
  if (!can('jadwal','create') && !can('jadwal','import')) hide('#toggleAddJadwal');
  if (!can('jadwal','import')) hideParent('#importJadwal');
  if (!can('jadwal','export')) hide('[data-export="jadwal"]');
  if (!can('jadwal','delete')) hide('#deleteAllJadwal');
  if (!can('pengumuman','create')) hide('[data-open-modal="pengumumanModal"]');
  if (!can('media','create')) hide('[data-open-modal="mediaModal"]');
  if (!can('sakramen','create')) hide('[data-open-modal="sakramenModal"]');
  if (!can('persembahan','create')) hide('[data-open-modal="persembahanModal"]');
  if (!can('pernikahan','create')) hide('[data-open-modal="pernikahanModal"]');
  if (!can('tim_pelayan','create')) hide('[data-open-modal="timPelayanModal"]');
  if (!can('tim_pelayan','export')) hide('[data-export="tim_pelayan"]');
  if (!can('pendalaman_alkitab','create')) hide('[data-open-modal="pendalaman_alkitabModal"]');
  if (!can('pendalaman_alkitab','export')) hide('[data-export="pendalaman_alkitab"]');
}

const fmtDate = (date) => date ? new Date(String(date).slice(0,10) + 'T00:00:00').toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '-';
const shortTime = (t) => t ? String(t).slice(0,5) : '';
const timeRange = (start, end) => {
  const a = shortTime(start);
  const b = shortTime(end);
  if (!a && !b) return '-';
  return `${a || '-'} - ${b || 'selesai'}`;
};

function uploadWartaWithProgress(fd, onProgress) {
  if (!fd.get('csrf_token')) fd.append('csrf_token', csrf);
  return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();
    xhr.open('POST','/api?action=save_pengumuman&_ts='+Date.now());
    xhr.setRequestHeader('X-CSRF-Token',csrf);
    xhr.timeout=30*60*1000;
    xhr.upload.onprogress=e=>{
      if(e.lengthComputable && e.total>0) onProgress(Math.min(100,Math.round(e.loaded/e.total*100)));
    };
    xhr.onload=()=>{
      let data;try{data=JSON.parse(xhr.responseText);}catch{data={success:false,message:'Respons server tidak valid.'};}
      if(xhr.status<200||xhr.status>=300||!data.success) reject(new Error(data.message||'Upload Warta gagal.'));
      else resolve(data);
    };
    xhr.onerror=()=>reject(new Error('Koneksi terputus saat mengunggah video. Periksa koneksi dan coba lagi.'));
    xhr.ontimeout=()=>reject(new Error('Unggahan melewati batas waktu 30 menit.'));
    xhr.onabort=()=>reject(new Error('Unggahan dibatalkan.'));
    xhr.send(fd);
  });
}

async function api(action, options = {}) {
  const method = options.method || 'GET';
  const query = options.query || '';
  const sep = query ? (query.startsWith('&') ? '' : '&') : '&';
  const url = '/api?action=' + encodeURIComponent(action) + query + sep + '_ts=' + Date.now();
  const init = { method, headers: { ...(options.headers || {}), 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }, cache: 'no-store' };
  if (options.body instanceof FormData) {
    if (!options.body.get('csrf_token')) options.body.append('csrf_token', csrf);
    init.headers['X-CSRF-Token'] = csrf; // required before Multer starts large Warta uploads
    init.body = options.body;
  } else if (options.body) {
    init.headers['Content-Type'] = 'application/json';
    init.headers['X-CSRF-Token'] = csrf;
    init.body = JSON.stringify({ ...options.body, csrf_token: csrf });
  }
  const res = await fetch(url, init);
  const json = await res.json().catch(() => ({ success:false, message:'Respons server tidak valid.' }));
  if (!json.success) throw new Error(json.message || 'Terjadi kesalahan.');
  return json;
}

function notify(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3800);
}

function table(el, headers, rows, emptyText = 'Data belum tersedia.') {
  if (!el) return;
  const thead = `<thead><tr>${headers.map(h => `<th>${esc(h.label)}</th>`).join('')}<th>Aksi</th></tr></thead>`;
  const tbody = rows.length
    ? `<tbody>${rows.map(row => `<tr>${headers.map(h => `<td>${h.render ? h.render(row) : esc(row[h.key] ?? '-')}</td>`).join('')}<td class="action-cell">${row._actions || ''}</td></tr>`).join('')}</tbody>`
    : `<tbody><tr><td colspan="${headers.length + 1}" class="muted">${esc(emptyText)}</td></tr></tbody>`;
  el.innerHTML = thead + tbody;
}

function renderStats() {
  const labels = [
    ['terhubung_baru','Formulir Baru'], ['jemaat','Data Jemaat'], ['jadwal','Jadwal Mendatang'], ['pengumuman','Pengumuman Aktif'], ['pesan_baru','Pesan Baru'], ['media','Media'], ['tim_pelayan','Tim Pelayan'], ['pendalaman_alkitab','Pendalaman Alkitab']
  ];
  $('#statGrid').innerHTML = labels.map(([k,l],i) => `<article class="stat-card"><span class="stat-index">${String(i+1).padStart(2,'0')}</span><span>${l}</span><b>${state.stats?.[k] ?? 0}</b></article>`).join('');
}

function renderAll() {
  applyPermissions(); renderStats(); renderUsers(); renderJemaat(); renderJadwal(); renderPengumuman(); renderMedia(); renderPesan(); renderConnect(); renderSakramen(); renderPersembahan(); renderPernikahan(); renderTimPelayan(); renderPendalamanAlkitabAdmin(); renderWhatsapp(); renderJemaatDatalist(); if(typeof renderWebsiteContent==='function')renderWebsiteContent();if(typeof window.renderDocsAdmin==='function')window.renderDocsAdmin();if(typeof window.renderGPIRevisi==='function')window.renderGPIRevisi();
}


function renderUsers() {
  const rows = (state.users || []).map(r => ({...r, _actions: actionMenu([
    can('users','update') ? `<button data-edit="user" data-id="${r.id}">Edit</button>` : '',
    can('users','delete') ? `<button class="danger" data-delete="user" data-id="${r.id}">Hapus</button>` : ''
  ])}));
  table($('#tableUsers'), [
    {label:'Nama Lengkap', key:'nama_lengkap'},
    {label:'Username', key:'username'},
    {label:'Role / Aktor', key:'role', render:r=>`<span class="badge neutral">${esc(roleLabel(r.role))}</span>`},
    {label:'Email', key:'email', render:r=>esc(r.email || '-')},
    {label:'Status', key:'status', render:r=>badge(r.status)},
    {label:'Login Terakhir', key:'last_login_at', render:r=>esc(r.last_login_at || '-')}
  ], rows, 'Belum ada akun pengguna.');
}

function renderJemaat() {
  const q = filtered.jemaat.toLowerCase();
  const data = (state.jemaat || []).filter(r => JSON.stringify(r).toLowerCase().includes(q));
  $('#jemaatCount') && ($('#jemaatCount').textContent = `${data.length} data tampil`);
  const rows = data.map((r, i) => ({...r, _rowNo: r.nomor_urut || (i + 1), _actions: actionMenu([
    can('jemaat','update') ? `<button data-edit="jemaat" data-id="${r.id}">Edit</button>` : '',
    can('jemaat','delete') ? `<button class="danger" data-delete="jemaat" data-id="${r.id}">Hapus</button>` : ''
  ])}));
  table($('#tableJemaat'), [
    {label:'No', key:'nomor_urut', render:r=>esc(r._rowNo)},
    {label:'Nama Keluarga', key:'nama_keluarga', render:r=>esc(r.nama_keluarga || '-')},
    {label:'Anggota Keluarga', key:'nama_lengkap'},
    {label:'Status Keluarga', key:'status_keluarga', render:r=>esc(r.status_keluarga || '-')},
    {label:'Tanggal Lahir', key:'tanggal_lahir', render:r=>fmtDate(r.tanggal_lahir)},
    {label:'Alamat', key:'alamat'},
    {label:'WhatsApp', key:'whatsapp', render:r=>esc(r.whatsapp || r.no_hp || '-')},
    {label:'Status Jemaat', key:'status_jemaat', render:r=>badge(r.status_jemaat)}
  ], rows, 'Belum ada data jemaat. Klik Sinkron Excel/CSV lalu pilih file daftar ulang jemaat.');
}

function renderJadwal() {
  const q = filtered.jadwal.toLowerCase();
  const data = (state.jadwal || []).filter(r => JSON.stringify(r).toLowerCase().includes(q));
  $('#jadwalCount') && ($('#jadwalCount').textContent = `${data.length} data tampil`);
  const rows = data.map(r => ({...r, _actions: actionMenu([
    can('jadwal','update') ? `<button class="success" data-announcement="${r.id}">Announcement</button>` : '',
    can('jadwal','update') ? `<button data-edit="jadwal" data-id="${r.id}">Edit</button>` : '',
    can('jadwal','delete') ? `<button class="danger" data-delete="jadwal" data-id="${r.id}">Hapus</button>` : ''
  ])}));
  table($('#tableJadwal'), [
    {label:'Tanggal', key:'tanggal', render:r=>fmtDate(r.tanggal)},
    {label:'Hari', key:'hari', render:r=>esc(r.hari || hariIndonesia(r.tanggal) || '-')},
    {label:'Ibadah', key:'jenis_ibadah'},
    {label:'Jam', key:'jam_mulai', render:r=>timeRange(r.jam_mulai, r.jam_selesai)},
    {label:'WL', key:'pemimpin_pujian', render:r=>esc(r.pemimpin_pujian || '-')},
    {label:'FT / Renungan', key:'pengkhotbah', render:r=>esc(r.pengkhotbah || '-')},
    {label:'Tema', key:'tema', render:r=>esc(r.tema || '-')},
    {label:'Singer', key:'singer', render:r=>esc(r.singer || '-')},
    {label:'Multimedia', key:'multimedia', render:r=>esc(r.multimedia || '-')},
    {label:'Usher', key:'usher', render:r=>esc(r.usher || '-')},
    {label:'Status', key:'status', render:r=>badge(r.status)}
  ], rows, 'Belum ada jadwal. Klik Sinkron Excel/CSV lalu pilih file informasi pelayanan.');
}

function renderPengumuman() {
  const rows = (state.pengumuman || []).map(r => ({...r, _actions: actionMenu([
    can('pengumuman','update') ? `<button data-edit="pengumuman" data-id="${r.id}">Edit</button>` : '',
    can('pengumuman','delete') ? `<button class="danger" data-delete="pengumuman" data-id="${r.id}">Hapus</button>` : ''
  ])}));
  table($('#tablePengumuman'), [
    {label:'Tanggal', key:'tanggal_publish', render:r=>fmtDate(r.tanggal_publish)}, {label:'Judul', key:'judul'}, {label:'Kategori',key:'kategori_warta'}, {label:'Media',render:r=>r.media_path?'<a href="/'+esc(r.media_path)+'" target="_blank" rel="noopener">Lihat media</a>':'-',},{label:'Status', key:'status', render:r=>badge(r.status)}
  ], rows, 'Belum ada pengumuman.');
}

function renderMedia() {
  const rows = (state.media || []).map(r => ({...r, _actions: actionMenu([
    `<a href="${esc(r.file_path)}" target="_blank">Lihat</a>`,
    (r.status !== 'published' && can('media','update')) ? `<button class="success" data-publish-media="${r.id}">Publish</button>` : '',
    can('media','delete') ? `<button class="danger" data-delete="media" data-id="${r.id}">Hapus</button>` : ''
  ])}));
  table($('#tableMedia'), [
    {label:'Judul', key:'judul'}, {label:'Tipe', key:'file_type'}, {label:'Status', key:'status', render:r=>badge(r.status)}, {label:'Upload', key:'created_at'}
  ], rows, 'Belum ada media.');
}

function renderPesan() {
  const rows = (state.pesan || []).map(r => ({...r, _actions: actionMenu([
    can('pesan','update') ? `<button data-reply="${r.id}">Balas</button>` : '',
    can('pesan','delete') ? `<button class="danger" data-delete="message" data-id="${r.id}">Hapus</button>` : ''
  ])}));
  table($('#tablePesan'), [
    {label:'Nama', key:'nama'}, {label:'Kontak', key:'kontak'}, {label:'Pesan', key:'pesan'}, {label:'Status', key:'status', render:r=>badge(r.status)}, {label:'Balasan', key:'balasan'}
  ], rows, 'Belum ada pesan masuk.');
}



function renderSakramen() {
  const rows = (state.sakramen || []).map(r => ({...r, _actions: actionMenu([can('sakramen','update') ? `<button data-edit="sakramen" data-id="${r.id}">Edit</button>` : '', can('sakramen','delete') ? `<button class="danger" data-delete="sakramen" data-id="${r.id}">Hapus</button>` : ''])}));
  table($('#tableSakramen'), [
    {label:'Tanggal', key:'tanggal', render:r=>fmtDate(r.tanggal)},
    {label:'Nama Penerima', key:'nama_penerima'},
    {label:'Jenis Sakramen', key:'jenis_sakramen'},
    {label:'Pelayan', key:'pelayan', render:r=>esc(r.pelayan || '-')},
    {label:'Catatan', key:'catatan', render:r=>esc(shortNote(r.catatan || '-'))}
  ], rows, 'Belum ada data sakramen.');
}

function renderPersembahan() {
  const rows = (state.persembahan || []).filter(r=>!$('#financeTypeFilter')?.value|| (r.jenis_transaksi||'Persembahan')===$('#financeTypeFilter').value).filter(r=>!$('#financeStartDate')?.value || String(r.tanggal).slice(0,10)>=$('#financeStartDate').value).filter(r=>!$('#financeEndDate')?.value || String(r.tanggal).slice(0,10)<=$('#financeEndDate').value).map(r => ({...r, _actions: actionMenu([can('persembahan','update') ? `<button data-edit="persembahan" data-id="${r.id}">Edit</button>` : '', can('persembahan','delete') ? `<button class="danger" data-delete="persembahan" data-id="${r.id}">Hapus</button>` : ''])}));
  table($('#tablePersembahan'), [
    {label:'Tanggal', key:'tanggal', render:r=>fmtDate(r.tanggal)},
    {label:'No. Bukti', key:'nomor_bukti'},
    {label:'Transaksi', key:'jenis_transaksi',render:r=>badge(r.jenis_transaksi||'Persembahan')},
    {label:'Arus Kas', key:'arus_kas',render:r=>r.jenis_transaksi==='Janji Iman'&&r.status_janji==='janji'?'Janji belum diterima':esc(r.arus_kas||'masuk')},
    {label:'Kategori', key:'kategori_dana', render:r=>badge(r.kategori_dana || 'Persembahan')},
    {label:'Jenis Ibadah', key:'jenis_ibadah', render:r=>esc(r.jenis_ibadah || '-')},
    {label:'Jenis Persembahan', key:'jenis_persembahan', render:r=>esc(r.jenis_persembahan || r.jenis || '-')},
    {label:'Jumlah', key:'jumlah', render:r=>rupiah(r.jumlah)},
    {label:'Kolektan', key:'kolektan', render:r=>esc(r.kolektan || '-')},
    {label:'Metode',key:'metode_pembayaran'},
    {label:'Penanggung Jawab',key:'penanggung_jawab'},
    {label:'Keterangan', key:'keterangan', render:r=>esc(shortNote(r.keterangan || '-'))}
  ], rows, 'Belum ada data persembahan.');
}

function renderPernikahan() {
  const rows = (state.pernikahan || []).map(r => ({...r, _actions: actionMenu([can('pernikahan','update') ? `<button data-edit="pernikahan" data-id="${r.id}">Edit</button>` : '', can('pernikahan','delete') ? `<button class="danger" data-delete="pernikahan" data-id="${r.id}">Hapus</button>` : ''])}));
  table($('#tablePernikahan'), [
    {label:'Tanggal', key:'tanggal_nikah', render:r=>fmtDate(r.tanggal_nikah)},
    {label:'Mempelai Pria', key:'nama_pria'},
    {label:'Mempelai Wanita', key:'nama_wanita'},
    {label:'Tempat', key:'tempat', render:r=>esc(r.tempat || '-')},
    {label:'Pendeta', key:'pendeta', render:r=>esc(r.pendeta || '-')},
    {label:'No. Sertifikat', key:'no_sertifikat', render:r=>esc(r.no_sertifikat || '-')}
  ], rows, 'Belum ada data pernikahan.');
}


function renderTimPelayan() {
  const rows = (state.tim_pelayan || []).map(r => ({...r, _actions: actionMenu([can('tim_pelayan','update') ? `<button data-edit="tim_pelayan" data-id="${r.id}">Edit</button>` : '', can('tim_pelayan','delete') ? `<button class="danger" data-delete="tim_pelayan" data-id="${r.id}">Hapus</button>` : ''])}));
  table($('#tableTimPelayan'), [
    {label:'Nama', key:'nama_lengkap'},
    {label:'Kategori', key:'kategori', render:r=>esc(labelKategori(r.kategori))},
    {label:'Tim/Bagian', key:'tim'},
    {label:'Jabatan', key:'jabatan'},
    {label:'Urutan', key:'urutan'},
    {label:'Foto', key:'foto_path', render:r=>r.foto_path ? `<div class="team-photo-cell photo-only"><img src="${esc(r.foto_path)}" alt="Foto ${esc(r.nama_lengkap || 'Tim')}" onerror="this.closest('.team-photo-cell').innerHTML='-'"></div>` : '-'},
    {label:'Status', key:'status', render:r=>badge(r.status)}
  ], rows, 'Belum ada data tim pelayan. Tambahkan dari Data Jemaat agar tampil di halaman umum.');
}


function renderPendalamanAlkitabAdmin() {
  const rows = (state.pendalaman_alkitab || []).map(r => ({...r, _actions: actionMenu([can('pendalaman_alkitab','update') ? `<button data-edit="pendalaman_alkitab" data-id="${r.id}">Edit</button>` : '', can('pendalaman_alkitab','delete') ? `<button class="danger" data-delete="pendalaman_alkitab" data-id="${r.id}">Hapus</button>` : ''])}));
  table($('#tablePendalamanAlkitab'), [
    {label:'Judul', key:'judul'},
    {label:'Tipe', key:'tipe', render:r=>badge(r.tipe || 'renungan')},
    {label:'Ayat', key:'ayat', render:r=>esc(r.ayat || '-')},
    {label:'Isi', key:'isi', render:r=>esc(shortNote(r.isi || '-'))},
    {label:'Media', key:'media_path', render:r=>r.media_path ? `<a class="btn tiny ghost" href="${esc(r.media_path)}" target="_blank" rel="noopener">Buka</a>` : '-'},
    {label:'Urutan', key:'urutan'},
    {label:'Status', key:'status', render:r=>badge(r.status)}
  ], rows, 'Belum ada materi Pendalaman Alkitab.');
}

function renderJemaatDatalist() {
  const list = $('#jemaatNameList');
  if (!list) return;
  list.innerHTML = (state.jemaat || []).map(j => `<option value="${esc(j.nama_lengkap)}">${esc((j.nama_keluarga || '') + (j.status_keluarga ? ' — ' + j.status_keluarga : ''))}</option>`).join('');
}

function labelKategori(k) {
  return ({musik:'Tim Musik', singer:'Singers', pelayanan_gereja:'Tim Pelayanan Gereja', diakonia:'Diakonia Gereja', media:'Media Gereja', sekolah_minggu:'Sekolah Minggu', kaum_ibu:'Kaum Ibu', pemuda:'Revive Generation'}[k] || k || '-');
}

const WA_TYPES = {group_bot:'Grup (bot)',private_bot:'Pribadi (bot)',test_bot:'Uji bot',group_manual:'Grup (manual lama)',private_link:'Link manual lama',cloud_api:'Cloud API lama',group_cloud:'Cloud API lama',linked_web:'WhatsApp tertaut'};
function waTarget(r) { return r.target_phone || r.target_name || '-'; }
function renderWhatsapp() {
  const rows = (state.whatsapp || []).map(r => ({...r, _actions: r.message_text ? `<button class="btn tiny ghost" data-view-wa="${r.id}">Lihat Pesan</button>` : ''}));
  table($('#tableWhatsapp'), [
    {label:'Target', key:'target_name'},
    {label:'Tujuan', key:'target_phone', render:r=>esc(waTarget(r))},
    {label:'Tipe', key:'message_type', render:r=>esc(WA_TYPES[r.message_type] || r.message_type || '-')},
    {label:'Status', key:'status', render:r=>badge(r.status)},
    {label:'Respon', key:'response_text', render:r=>esc(shortNote(r.response_text || '-'))},
    {label:'Dibuat', key:'created_at'}
  ], rows, 'Belum ada log WhatsApp.');
}

function botPhaseText(data) {
  if (!data) return 'Status bot belum tersedia.';
  if (data.phase === 'ready') return `Terhubung${data.account ? ' sebagai ' + data.account.replace(/@.*$/, '') : ''}.`;
  if (data.phase === 'qr') return 'Menunggu QR dipindai dari WhatsApp → Perangkat tertaut.';
  if (data.phase === 'starting') return 'Menyiapkan WhatsApp Web…';
  if (data.phase === 'error') return 'Gagal: ' + (data.message || 'periksa browser dan koneksi.');
  return 'Belum terhubung. Klik Hubungkan WhatsApp.';
}

async function loadBotStatus() {
  const el = $('#waBotStatus');
  if (!el) return;
  try {
    const json = await api('wa_bot_status');
    botState = json.data || {};
    el.textContent = botPhaseText(botState);
    el.className = 'wa-bot-status ' + (botState.phase || 'idle');
    const wrap = $('#waBotQrWrap'), img = $('#waBotQr');
    if (botState.phase === 'qr' && botState.qr) { img.src = botState.qr; wrap.hidden = false; }
    else { wrap.hidden = true; img.removeAttribute('src'); }
    const btn = $('#waBotConnect');
    if (btn) {
      btn.textContent = botState.phase === 'ready' ? 'Bot Terhubung' : botState.phase === 'starting' ? 'Menyiapkan…' : botState.phase === 'qr' ? 'Tampilkan QR Lagi' : 'Hubungkan WhatsApp';
      btn.disabled = botState.phase === 'ready' || botState.phase === 'starting';
    }
    const off = $('#waBotDisconnect');
    if (off) off.disabled = !botState.phase || botState.phase === 'idle';
    const info = $('#waBotGroupInfo');
    if (info) info.textContent = botState.group?.id ? `Grup aktif: ${botState.group.name || botState.group.id}` : 'Belum ada grup tujuan yang disimpan.';
    const select = $('#waBotGroup');
    if (select && botState.group?.id && [...select.options].some(o => o.value === botState.group.id)) select.value = botState.group.id;
  } catch (err) {
    el.textContent = 'Status bot tidak tersedia: ' + err.message;
    el.className = 'wa-bot-status error';
  }
}

async function connectBot() {
  const btn = $('#waBotConnect');
  if (btn) btn.disabled = true;
  try {
    const json = await api('wa_bot_connect', { method:'POST', body: new FormData() });
    botState = json.data || botState;
    notify('Menghubungkan WhatsApp. Pindai QR bila muncul.');
    await loadBotStatus();
  } catch (err) {
    notify(err.message, 'danger');
    if (btn) btn.disabled = false;
  }
}

async function disconnectBot() {
  const btn = $('#waBotDisconnect');
  if (btn) { btn.disabled = true; btn.textContent = 'Memutuskan…'; }
  try {
    await api('wa_bot_disconnect', { method:'POST', body: new FormData() });
    notify('Koneksi bot WhatsApp diputuskan. Klik Hubungkan WhatsApp untuk memulai ulang.');
    await loadBotStatus();
  } catch (err) {
    notify(err.message, 'danger');
    if (btn) btn.disabled = false;
  } finally {
    if (btn) btn.textContent = 'Putuskan';
  }
}

async function loadBotGroups() {
  const sel = $('#waBotGroup');
  if (!sel) return;
  try {
    const json = await api('wa_bot_groups');
    const groups = json.data?.groups || [];
    const current = botState?.group?.id || sel.value;
    sel.innerHTML = '<option value="">Pilih grup WhatsApp…</option>' + groups.map(g => `<option value="${esc(g.id)}" data-name="${esc(g.name)}">${esc(g.name)}${g.readOnly ? ' — hanya admin' : ''}</option>`).join('');
    if (current) sel.value = current;
    notify(`${groups.length} grup ditemukan.`);
  } catch (err) { notify(err.message, 'danger'); }
}

async function saveBotGroup() {
  const sel = $('#waBotGroup');
  const id = sel?.value || '';
  if (!id) return notify('Pilih grup terlebih dahulu.', 'danger');
  const name = sel.options[sel.selectedIndex]?.dataset.name || sel.options[sel.selectedIndex]?.textContent || '';
  try {
    await api('wa_bot_save_group', { method:'POST', body:{ group_id:id, group_name:name } });
    notify('Grup tujuan bot disimpan.');
    await loadBotStatus();
  } catch (err) { notify(err.message, 'danger'); }
}

function syncBotTestTarget() {
  const group = $('#waBotTestTarget')?.value === 'group';
  const phone = $('#waBotTestPhone');
  if (phone) {
    phone.hidden = group;
    phone.disabled = group;
  }
  const hint = $('#waBotTestHint');
  if (hint) hint.textContent = group
    ? 'Grup yang dipilih di atas akan dipakai untuk uji grup.'
    : 'Masukkan nomor yang terdaftar di WhatsApp, misalnya 08xxxxxxxxxx.';
}

async function sendBotTest() {
  const btn = $('#waBotTest');
  // WhatsApp Web can take seconds to confirm a send. Without this guard every
  // extra click queues another message to the same target.
  if (btn?.disabled) return;
  const message = $('#waBotTestMessage')?.value || '';
  const targetType = $('#waBotTestTarget')?.value === 'group' ? 'group' : 'phone';
  // For a group test, use the group currently chosen in the picker when it has not
  // been saved yet; the server accepts a serialized group id directly.
  const selectedGroup = $('#waBotGroup')?.value || '';
  const phone = targetType === 'group' ? selectedGroup : ($('#waBotTestPhone')?.value || '');
  if (targetType === 'group' && !phone && !botState?.group?.id) return notify('Pilih atau simpan grup tujuan terlebih dahulu.', 'danger');
  if (targetType === 'phone' && !phone.trim()) return notify('Isi nomor WhatsApp tujuan uji.', 'danger');
  if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'Mengirim…'; }
  try {
    const json = await api('wa_bot_test', { method:'POST', body:{ phone, message, target_type: targetType } });
    const result = json.result || {};
    const target = targetType === 'group' ? (result.group || 'grup tujuan') : (result.phone || phone);
    notify(result.status === 'diterima' ? `Pesan uji terkirim ke ${target}.` : `Pesan uji ke ${target} diproses dengan status ${result.status || '-'}${result.error ? ': ' + result.error : '.'}`, result.status === 'diterima' ? 'success' : 'danger');
    await loadWhatsappLogs();
  } catch (err) { notify(err.message, 'danger'); }
  finally { if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || 'Kirim Pesan Uji'; } }
}

function openModal(id) { const m = $('#' + id); if (m) { m.classList.add('show'); m.setAttribute('aria-hidden', 'false'); } }
function closeModal(el) { const m = el.closest?.('.modal') || el; if (m) { m.classList.remove('show'); m.setAttribute('aria-hidden','true'); } }
function resetForm(form) { form.reset(); form.querySelectorAll('input[type="hidden"]').forEach(i => i.value = ''); }
function fillForm(form, data) { Object.entries(data).forEach(([k,v]) => { const el = form.elements[k]; if (el) el.value = v ?? ''; }); }

const TIM_PELAYAN_OPTIONS = {
  musik: {
    tim: ['Pemain Musik','Pemain Cadangan'],
    jabatan: ['Pemain Keyboard','Pemain Gitar','Pemain Drum','Pemain Bass','Bass & Gitar','Keyboard & Drum','Gitar & Drum']
  },
  singer: {
    tim: ['Singers / Pujian'],
    jabatan: ['Vocalist','Singer','Song Leader']
  },
  pelayanan_gereja: {
    tim: ['Gembala Sidang','Pendamping & Pelayan Gereja'],
    jabatan: ['Gembala Sidang','Hamba Tuhan','Evangelis']
  },
  diakonia: {
    tim: ['Diakonia Gereja'],
    jabatan: ['Ketua','Sekretaris','Keuangan','Bendahara','Anggota']
  },
  media: {
    tim: ['Media Gereja'],
    jabatan: ['Koordinator Media','Publikasi','Dokumentasi','Teknis Media','Konten Digital','Desain','Video']
  },
  kaum_ibu: {
    tim: ['Kaum Ibu'],
    jabatan: ['Pembina','Ketua','Sekretaris','Bendahara','Sie. Doa','Sie. Pemerhati','Anggota']
  },
  pemuda: {
    tim: ['Revive Generation'],
    jabatan: ['Pembina','Ketua','Sekretaris','Bendahara','Kerohanian','Humas','Anggota']
  },
  sekolah_minggu: {
    tim: ['Sekolah Minggu'],
    jabatan: ['Koordinator Sekolah Minggu','Guru Sekolah Minggu','Pendamping Anak','Anggota']
  }
};

function setSelectOptions(select, values, selected = '') {
  if (!select) return;
  const current = selected || select.value || '';
  const unique = Array.from(new Set([current, ...values].filter(Boolean)));
  select.innerHTML = '<option value="">Pilih</option>' + unique.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  select.value = current;
}

function refreshTimPelayanOptions(selectedTim = '', selectedJabatan = '') {
  const form = document.querySelector('[data-form="tim_pelayan"]');
  if (!form) return;
  const kategori = form.elements.kategori?.value || 'musik';
  const opts = TIM_PELAYAN_OPTIONS[kategori] || TIM_PELAYAN_OPTIONS.musik;
  setSelectOptions(form.elements.tim, opts.tim, selectedTim);
  setSelectOptions(form.elements.jabatan, opts.jabatan, selectedJabatan);
}

const teamCrop = {
  file: null,
  url: '',
  img: null,
  stage: null,
  preview: null,
  zoom: 1,
  minZoom: 1,
  x: 0,
  y: 0,
  naturalW: 0,
  naturalH: 0,
  stageW: 0,
  stageH: 0,
  cropSize: 0,
  dragging: false,
  lastX: 0,
  lastY: 0,
  applied: false,
  decodeFailed: false
};

function initTeamCropper() {
  teamCrop.img = $('#teamCropImage');
  teamCrop.stage = $('#teamCropStage');
  teamCrop.preview = $('#teamCropPreview');
  const zoomEl = $('#teamCropZoom');
  if (!teamCrop.img || !teamCrop.stage || !zoomEl) return;

  zoomEl.addEventListener('input', () => {
    const oldZoom = teamCrop.zoom;
    teamCrop.zoom = Number(zoomEl.value) || teamCrop.minZoom;
    if (oldZoom > 0) {
      teamCrop.x = teamCrop.x * (teamCrop.zoom / oldZoom);
      teamCrop.y = teamCrop.y * (teamCrop.zoom / oldZoom);
    }
    clampCropPosition();
    renderTeamCrop();
  });
  $('#teamCropReset')?.addEventListener('click', resetTeamCropPosition);
  $('#teamCropApply')?.addEventListener('click', applyTeamCropSelection);
  $$('[data-crop-cancel]').forEach(btn => btn.addEventListener('click', cancelTeamCrop));

  const pointerDown = (e) => {
    if (!teamCrop.file) return;
    teamCrop.dragging = true;
    teamCrop.lastX = e.clientX ?? (e.touches?.[0]?.clientX || 0);
    teamCrop.lastY = e.clientY ?? (e.touches?.[0]?.clientY || 0);
    teamCrop.stage.setPointerCapture?.(e.pointerId);
  };
  const pointerMove = (e) => {
    if (!teamCrop.dragging) return;
    const x = e.clientX ?? (e.touches?.[0]?.clientX || 0);
    const y = e.clientY ?? (e.touches?.[0]?.clientY || 0);
    teamCrop.x += x - teamCrop.lastX;
    teamCrop.y += y - teamCrop.lastY;
    teamCrop.lastX = x;
    teamCrop.lastY = y;
    clampCropPosition();
    renderTeamCrop();
  };
  const pointerUp = () => { teamCrop.dragging = false; };
  teamCrop.stage.addEventListener('pointerdown', pointerDown);
  teamCrop.stage.addEventListener('pointermove', pointerMove);
  teamCrop.stage.addEventListener('pointerup', pointerUp);
  teamCrop.stage.addEventListener('pointercancel', pointerUp);
  teamCrop.stage.addEventListener('wheel', (e) => {
    if (!teamCrop.file) return;
    e.preventDefault();
    const oldZoom = teamCrop.zoom;
    const next = Math.max(teamCrop.minZoom, Math.min(3, teamCrop.zoom + (e.deltaY < 0 ? 0.06 : -0.06)));
    teamCrop.zoom = next;
    zoomEl.value = String(next);
    if (oldZoom > 0) {
      teamCrop.x = teamCrop.x * (teamCrop.zoom / oldZoom);
      teamCrop.y = teamCrop.y * (teamCrop.zoom / oldZoom);
    }
    clampCropPosition();
    renderTeamCrop();
  }, { passive:false });

  $('[data-form="tim_pelayan"] input[name="foto_file"]')?.addEventListener('change', handleTeamPhotoSelected);
}

function resetTeamCropState(clearFile = false) {
  if (teamCrop.url) {
    try { URL.revokeObjectURL(teamCrop.url); } catch (_) {}
  }
  teamCrop.file = null;
  teamCrop.url = '';
  teamCrop.zoom = 1;
  teamCrop.minZoom = 1;
  teamCrop.x = 0;
  teamCrop.y = 0;
  teamCrop.naturalW = 0;
  teamCrop.naturalH = 0;
  teamCrop.cropSize = 0;
  teamCrop.dragging = false;
  teamCrop.applied = false;
  teamCrop.decodeFailed = false;
  const inline = $('#teamCropInline');
  if (inline) { inline.hidden = true; inline.classList.remove('active'); }
  if (teamCrop.img) {
    teamCrop.img.removeAttribute('src');
    teamCrop.img.style.width = '';
    teamCrop.img.style.height = '';
    teamCrop.img.style.transform = '';
  }
  const zoomEl = $('#teamCropZoom');
  if (zoomEl) zoomEl.value = '1';
  const form = $('[data-form="tim_pelayan"]');
  if (form?.elements.foto_cropped_data) form.elements.foto_cropped_data.value = '';
  if (clearFile && form?.elements.foto_file) form.elements.foto_file.value = '';
}

function showTeamCropInline(show = true) {
  const inline = $('#teamCropInline');
  if (!inline) return;
  inline.hidden = !show;
  inline.classList.toggle('active', !!show);
}

function isCropSupportedImage(file) {
  if (!file) return false;
  if ((file.type || '').toLowerCase().startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|bmp|avif|tiff?|heic|heif)$/i.test(file.name || '');
}

function handleTeamPhotoSelected(e) {
  const file = e.target.files?.[0];
  const form = e.target.closest('form');
  if (form?.elements.foto_cropped_data) form.elements.foto_cropped_data.value = '';
  if (form?.elements.hapus_foto) form.elements.hapus_foto.value = '0';
  if (!file) {
    resetTeamCropState(false);
    updateTeamUploadPreview('');
    return;
  }

  resetTeamCropState(false);
  teamCrop.file = file;
  teamCrop.url = URL.createObjectURL(file);
  showTeamCropInline(true);

  let triedDataUrl = false;
  const markDecodeFallback = () => {
    teamCrop.decodeFailed = true;
    teamCrop.naturalW = 0;
    teamCrop.naturalH = 0;
    teamCrop.cropSize = 0;
    const inline = $('#teamCropInline');
    if (inline) { inline.hidden = true; inline.classList.remove('active'); }
    if (teamCrop.img) teamCrop.img.removeAttribute('src');
    updateTeamUploadPreview('', false);
    const text = $('#teamUploadPreview .team-upload-summary p');
    if (text) {
      text.innerHTML = 'Foto sudah dipilih. Jika browser tidak mendukung preview untuk format ini, file tetap akan disimpan ke server. Untuk atur posisi manual, gunakan preview yang tersedia atau pakai file JPG/PNG standar.';
    }
    notify('Foto dipilih. Jika preview tidak muncul, sistem tetap akan mencoba menyimpan file aslinya.', 'warning');
  };

  teamCrop.img.onload = () => {
    teamCrop.decodeFailed = false;
    teamCrop.naturalW = teamCrop.img.naturalWidth || 1;
    teamCrop.naturalH = teamCrop.img.naturalHeight || 1;
    requestAnimationFrame(() => {
      setupTeamCropGeometry();
      renderTeamCrop();
      updateTeamUploadPreview(teamCrop.img.src, true);
      notify('Foto siap diatur. Geser foto atau ubah zoom, lalu klik Simpan Tim Pelayan.');
    });
  };
  teamCrop.img.onerror = () => {
    if (!triedDataUrl) {
      triedDataUrl = true;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string' && reader.result.startsWith('data:image/')) {
          teamCrop.img.src = reader.result;
        } else {
          markDecodeFallback();
        }
      };
      reader.onerror = markDecodeFallback;
      try { reader.readAsDataURL(file); } catch (_) { markDecodeFallback(); }
      return;
    }
    markDecodeFallback();
  };
  if (!isCropSupportedImage(file)) {
    markDecodeFallback();
    return;
  }
  teamCrop.img.src = teamCrop.url;
}

function setupTeamCropGeometry() {
  const inline = $('#teamCropInline');
  if (inline) inline.hidden = false;
  const rect = teamCrop.stage.getBoundingClientRect();
  teamCrop.stageW = rect.width || 420;
  teamCrop.stageH = rect.height || 360;
  teamCrop.cropSize = Math.min(teamCrop.stageW * 0.72, teamCrop.stageH * 0.72, 320);
  teamCrop.minZoom = 1;
  teamCrop.zoom = 1;
  const zoomEl = $('#teamCropZoom');
  if (zoomEl) { zoomEl.min = '1'; zoomEl.max = '3'; zoomEl.value = '1'; }
  teamCrop.x = 0;
  teamCrop.y = 0;
  clampCropPosition();
}

function displayedCropBase() {
  const cropSize = teamCrop.cropSize || 300;
  const scale = Math.max(cropSize / Math.max(1, teamCrop.naturalW), cropSize / Math.max(1, teamCrop.naturalH));
  return { width: teamCrop.naturalW * scale, height: teamCrop.naturalH * scale, scale };
}

function clampCropPosition() {
  const base = displayedCropBase();
  const w = base.width * teamCrop.zoom;
  const h = base.height * teamCrop.zoom;
  const crop = teamCrop.cropSize || 300;
  const maxX = Math.max(0, (w - crop) / 2);
  const maxY = Math.max(0, (h - crop) / 2);
  teamCrop.x = Math.max(-maxX, Math.min(maxX, teamCrop.x));
  teamCrop.y = Math.max(-maxY, Math.min(maxY, teamCrop.y));
}

function renderTeamCrop() {
  if (!teamCrop.img || !teamCrop.naturalW) return;
  const base = displayedCropBase();
  const w = base.width * teamCrop.zoom;
  const h = base.height * teamCrop.zoom;
  teamCrop.img.style.width = `${w}px`;
  teamCrop.img.style.height = `${h}px`;
  teamCrop.img.style.transform = `translate(calc(-50% + ${teamCrop.x}px), calc(-50% + ${teamCrop.y}px))`;
  drawTeamCropPreview();
}

function resetTeamCropPosition() {
  if (!teamCrop.file) return;
  setupTeamCropGeometry();
  renderTeamCrop();
}

function teamCropSourceRect() {
  if (!teamCrop.img || !teamCrop.naturalW) return null;
  const base = displayedCropBase();
  const displayW = base.width * teamCrop.zoom;
  const displayH = base.height * teamCrop.zoom;
  const crop = teamCrop.cropSize || 300;
  let sx = ((displayW - crop) / 2 - teamCrop.x) / (displayW / teamCrop.naturalW);
  let sy = ((displayH - crop) / 2 - teamCrop.y) / (displayH / teamCrop.naturalH);
  let sw = crop / (displayW / teamCrop.naturalW);
  let sh = crop / (displayH / teamCrop.naturalH);
  // Clamp safely inside the original image, so canvas output never becomes blank.
  sx = Math.max(0, Math.min(teamCrop.naturalW - sw, sx));
  sy = Math.max(0, Math.min(teamCrop.naturalH - sh, sy));
  return { sx, sy, sw, sh };
}

function drawTeamCropPreview(size = 180) {
  const canvas = teamCrop.preview;
  const rect = teamCropSourceRect();
  if (!canvas || !rect) return null;
  const ctx = canvas.getContext('2d');
  canvas.width = size;
  canvas.height = size;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#071832';
  ctx.fillRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(teamCrop.img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, size, size);
  ctx.restore();
  return rect;
}

function createTeamCropData(size = 900) {
  const rect = teamCropSourceRect();
  if (!teamCrop.img || !teamCrop.file || !rect) return '';
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(teamCrop.img, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.9);
}

function applyTeamCropSelection() {
  const form = $('[data-form="tim_pelayan"]');
  const data = createTeamCropData(900);
  if (!data || !form?.elements.foto_cropped_data) {
    notify('Posisi foto belum siap. Pilih ulang foto lalu coba lagi.', 'danger');
    return;
  }
  form.elements.foto_cropped_data.value = data;
  teamCrop.applied = true;
  updateTeamUploadPreview(data, true);
  notify('Posisi foto siap disimpan. Klik Simpan Tim Pelayan untuk menampilkan foto di website.');
}

function cancelTeamCrop() {
  resetTeamCropState(true);
  updateTeamUploadPreview('');
}

function updateTeamUploadPreview(dataUrl, isNewSelection = false) {
  const box = $('#teamUploadPreview .team-upload-preview-box');
  if (!box) return;
  if (dataUrl) {
    const src = String(dataUrl).startsWith('data:') || String(dataUrl).startsWith('blob:') ? dataUrl : dataUrl + (dataUrl.includes('?') ? '&' : '?') + 'v=' + Date.now();
    box.innerHTML = `<img src="${esc(src)}" alt="Preview foto" onerror="this.parentElement.innerHTML='<span>Preview foto</span>'">`;
  } else {
    box.innerHTML = '<span>Preview foto</span>';
  }
  const text = $('#teamUploadPreview .team-upload-summary p');
  if (text) text.innerHTML = isNewSelection
    ? 'Geser foto dan atur zoom. Saat klik <strong>Simpan Tim Pelayan</strong>, posisi ini otomatis disimpan.'
    : 'Pilih foto, lalu geser dan zoom langsung di area bawah ini. Jika format foto tidak mendukung preview browser, file tetap akan dicoba simpan ke server.';
}

function removeTeamPhotoSelection() {
  const form = $('[data-form="tim_pelayan"]');
  resetTeamCropState(true);
  updateTeamUploadPreview('');
  if (form?.elements.foto_path) form.elements.foto_path.value = '';
  if (form?.elements.hapus_foto) form.elements.hapus_foto.value = '1';
  notify('Foto akan dihapus saat data disimpan.', 'warning');
}

async function ensureTeamCropApplied(form) {
  if (!form || form.dataset.form !== 'tim_pelayan') return true;
  const file = form.elements.foto_file?.files?.[0];
  const cropped = form.elements.foto_cropped_data?.value || '';
  if (file && isCropSupportedImage(file) && !cropped) {
    if (teamCrop.decodeFailed) return true;
    const data = createTeamCropData(900);
    if (!data) {
      notify('Foto belum siap diproses. Tunggu preview muncul, lalu klik Simpan lagi.', 'danger');
      return false;
    }
    form.elements.foto_cropped_data.value = data;
    updateTeamUploadPreview(data, true);
  }
  return true;
}


async function loadData() {
  try {
    const json = await api('bootstrap');
    state = { ...state, ...(json.data || {}) };
    renderAll();
    return state;
  } catch (e) {
    console.error('Load data gagal:', e);
    if (!initialBootstrapRendered) notify(e.message || 'Gagal memuat data dashboard.', 'danger');
    throw e;
  }
}



async function loadWhatsappLogs() {
  try {
    const json = await api('whatsapp_logs');
    state.whatsapp = json.data || [];
    renderWhatsapp();
    const el = $('#waRealtimeStatus');
    if (el) el.textContent = 'Update ' + new Date().toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  } catch (e) {
    const el = $('#waRealtimeStatus');
    if (el) el.textContent = 'Gagal sync';
  }
}

function syncWhatsappRealtime() {
  clearInterval(whatsappTimer);
  whatsappTimer = null;
  if (activeSection === 'whatsapp') {
    loadBotStatus();
    loadWhatsappLogs();
    whatsappTimer = setInterval(() => { loadBotStatus(); loadWhatsappLogs(); }, 5000);
  }
}

async function saveForm(type, form) {
  if (type === 'tim_pelayan' && !(await ensureTeamCropApplied(form))) return;
  const fd = new FormData(form);
  const actions = { user:'save_user', jemaat:'save_jemaat', jadwal:'save_jadwal', pengumuman:'save_pengumuman', media:'upload_media', reply:'reply_message', sakramen:'save_sakramen', persembahan:'save_persembahan', pernikahan:'save_pernikahan', tim_pelayan:'save_tim_pelayan', pendalaman_alkitab:'save_pendalaman_alkitab' };
  let json;
  if (type === 'pengumuman') {
    const media=fd.get('warta_file');
    const hasMedia=media && typeof media.size === 'number' && media.size>0;
    const ext=hasMedia?media.name.split('.').pop().toLowerCase():'';
    if(hasMedia){
      if(!['jpg','jpeg','png','webp','mp4','webm'].includes(ext))throw new Error('Hanya JPG, PNG, WebP, MP4, atau WebM.');
      const max=['mp4','webm'].includes(ext)?1024*1024*1024:10*1024*1024;
      if(media.size>max)throw new Error('Ukuran '+(['mp4','webm'].includes(ext)?'video maksimal 1 GB.':'foto maksimal 10 MB.'));
    }
    const box=document.getElementById('wartaUploadStatus');
    const bar=document.getElementById('wartaUploadProgress');
    const value=document.getElementById('wartaUploadPercent');
    const button=form.querySelector('[type=submit]');
    if(button)button.disabled=true;
    if(box)box.hidden=!hasMedia;
    if(bar)bar.value=0;
    if(value)value.textContent='0%';
    try{
      json=hasMedia ? await uploadWartaWithProgress(fd,p=>{if(bar)bar.value=p;if(value)value.textContent=p===100?'100% · Memproses file…':p+'%';}) : await api(actions[type],{method:'POST',body:fd});
    }finally{if(button)button.disabled=false;if(box)box.hidden=true;}
  }else{
    json=await api(actions[type], { method:'POST', body:fd });
  }
  notify(json.message || 'Berhasil disimpan.');
  closeModal(form);
  await loadData();
}

async function deleteItem(type, id) {
  const map = { user:'delete_user', jemaat:'delete_jemaat', jadwal:'delete_jadwal', pengumuman:'delete_pengumuman', media:'delete_media', message:'delete_message', sakramen:'delete_sakramen', persembahan:'delete_persembahan', pernikahan:'delete_pernikahan', tim_pelayan:'delete_tim_pelayan', pendalaman_alkitab:'delete_pendalaman_alkitab' };
  if (!confirm('Yakin ingin menghapus data ini?')) return;
  const fd = new FormData();
  await api(map[type], { method:'POST', query:'&id=' + encodeURIComponent(id), body:fd });
  notify('Data berhasil dihapus.');
  await loadData();
}

async function deleteAll(type) {
  const label = type === 'jemaat' ? 'Jemaat' : 'Jadwal Pelayanan';
  const total = type === 'jemaat' ? (state.jemaat || []).length : (state.jadwal || []).length;
  if (!total) return notify(`Data ${label} sudah kosong.`, 'danger');
  if (!confirm(`Semua data ${label} akan dihapus dari database. Lanjutkan?`)) return;
  const typed = prompt('Ketik HAPUS SEMUA untuk konfirmasi:');
  if (String(typed || '').trim().toUpperCase() !== 'HAPUS SEMUA') return notify('Delete All dibatalkan.', 'danger');
  const fd = new FormData();
  await api(type === 'jemaat' ? 'delete_all_jemaat' : 'delete_all_jadwal', { method:'POST', body:fd });
  notify(`Semua data ${label} berhasil dihapus.`);
  await loadData();
}

async function importFile(type, file) {
  if (!file) return;
  try {
    const rows = await parseImport(type, file);
    if (!rows.length) throw new Error('Tidak ada data valid yang terbaca. Pastikan sheet dan kolom spreadsheet sudah benar.');
    const label = type === 'jemaat' ? 'Data Jemaat' : (type === 'jadwal' ? 'Jadwal Pelayanan' : 'Persembahan');
    const replace = confirm(`Sinkron ${label}\n\nFile: ${file.name}\nData valid terbaca: ${rows.length} baris.\n\nOK = kosongkan tabel lama lalu isi sesuai file.\nCancel = tambahkan tanpa menghapus data lama.`);
    const action = type === 'jemaat' ? 'bulk_import_jemaat' : (type === 'jadwal' ? 'bulk_import_jadwal' : 'bulk_import_persembahan');
    const json = await api(action, { method:'POST', body:{ rows, replace } });
    notify(json.message || `Sinkron ${rows.length} data berhasil.`);
    await loadData();
  } catch (e) { notify(e.message, 'danger'); }
}

async function parseImport(type, file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') {
    const matrix = csvToMatrix(await file.text());
    if (type === 'jemaat') return normalizeJemaatSheet('CSV', matrix);
    if (type === 'jadwal') return normalizeJadwalSheet('CSV', matrix);
    if (type === 'persembahan') return normalizePersembahanSheet(matrix);
    return [];
  }
  if (!window.XLSX) throw new Error('Library Excel belum termuat. Pastikan internet aktif, reload halaman, lalu coba lagi.');
  const arr = await file.arrayBuffer();
  const wb = XLSX.read(arr, { type:'array', cellDates:true, raw:true });
  if (type === 'jemaat') return normalizeJemaatWorkbook(wb);
  if (type === 'jadwal') return normalizeJadwalWorkbook(wb);
  if (type === 'persembahan') {
    const out = [];
    for (const name of wb.SheetNames) {
      const matrix = XLSX.utils.sheet_to_json(wb.Sheets[name], { header:1, defval:'', raw:true, blankrows:false });
      out.push(...normalizePersembahanSheet(matrix));
    }
    return out;
  }
  return [];
}


function normalizePersembahanSheet(matrix) {
  return matrixToObjects(matrix).map(row => ({
    tanggal: isoDate(pick(row, ['tanggal','Tanggal','TANGGAL','date'])),
    kategori_dana: clean(pick(row, ['kategori_dana','Kategori Dana','Kategori','kategori'])) || 'Persembahan',
    jenis_ibadah: clean(pick(row, ['jenis_ibadah','Jenis Ibadah','Ibadah'])),
    jenis_persembahan: clean(pick(row, ['jenis_persembahan','Jenis Persembahan','Jenis','Persembahan'])) || 'Persembahan Umum',
    jumlah: String(pick(row, ['jumlah','Jumlah','Nominal','nominal','Total','total']) || '').replace(/[^0-9.]/g,''),
    kolektan: clean(pick(row, ['kolektan','Kolektan'])),
    keterangan: clean(pick(row, ['keterangan','Keterangan','catatan','Catatan']))
  })).filter(r => r.tanggal && Number(r.jumlah || 0) > 0);
}

function normalizeJemaatWorkbook(wb) {
  const result = [];
  const names = [...wb.SheetNames].sort((a,b) => jemaatSheetPriority(a) - jemaatSheetPriority(b));
  for (const name of names) {
    const matrix = XLSX.utils.sheet_to_json(wb.Sheets[name], { header:1, defval:'', raw:true });
    result.push(...normalizeJemaatSheet(name, matrix));
  }
  return dedupe(result.filter(r => validName(r.nama_lengkap)), r => `${norm(r.nama_lengkap)}|${r.tanggal_lahir || ''}|${norm(r.alamat || '')}`);
}

function jemaatSheetPriority(name) { const n = norm(name); if (n.includes('daftar keluarga')) return 1; if (n.includes('form responses')) return 2; return 9; }

function normalizeJemaatSheet(name, matrix) {
  if (!Array.isArray(matrix) || !matrix.length) return [];
  const lower = norm(name);
  const hasKeluargaHeader = matrix.some(row => row.some(c => norm(c) === 'anggota keluarga') && row.some(c => norm(c) === 'status'));
  const hasFormHeader = matrix.some(row => row.some(c => norm(c).includes('nama lengkap') && (norm(c).includes('ayah') || norm(c).includes('suami'))));
  if (lower.includes('daftar keluarga') || hasKeluargaHeader) return parseDaftarKeluarga(matrix);
  if (lower.includes('form responses') || hasFormHeader) return parseFormResponses(matrix);
  return normalizeGenericJemaat(matrixToObjects(matrix));
}

function parseDaftarKeluarga(matrix) {
  const out = [];
  const headerIndex = matrix.findIndex(row => row.some(c => norm(c) === 'anggota keluarga'));
  if (headerIndex < 0) return out;
  const headers = matrix[headerIndex].map(h => norm(h));
  const idx = {
    no: headers.findIndex(h => h === 'no'),
    keluarga: headers.findIndex(h => h === 'nama keluarga'),
    anggota: headers.findIndex(h => h === 'anggota keluarga'),
    status: headers.findIndex(h => h === 'status'),
    lahir: headers.findIndex(h => h === 'tanggal lahir'),
    alamat: headers.findIndex(h => h === 'alamat')
  };
  let currentNo = '', currentFamily = '', currentAddress = '';
  for (const row of matrix.slice(headerIndex + 1)) {
    if (!row.some(v => clean(v))) continue;
    const no = idx.no >= 0 ? clean(row[idx.no]) : '';
    const family = idx.keluarga >= 0 ? smartName(row[idx.keluarga]) : '';
    const address = idx.alamat >= 0 ? clean(row[idx.alamat]) : '';
    if (no) currentNo = no;
    if (family) currentFamily = family;
    if (address) currentAddress = address;
    const nama = idx.anggota >= 0 ? smartName(row[idx.anggota]) : '';
    if (!validName(nama)) continue;
    const statusKeluarga = idx.status >= 0 ? properStatus(row[idx.status]) : '';
    out.push({
      nomor_urut: currentNo,
      nama_keluarga: currentFamily,
      nama_lengkap: nama,
      jenis_kelamin: guessGender(statusKeluarga),
      tempat_lahir: '',
      tanggal_lahir: idx.lahir >= 0 ? isoDate(row[idx.lahir]) : '',
      alamat: currentAddress,
      no_hp: '', whatsapp: '', email: '',
      status_jemaat: 'Aktif',
      status_keluarga: statusKeluarga,
      tanggal_bergabung: '',
      catatan: 'Sumber: sheet DAFTAR KELUARGA'
    });
  }
  return out;
}

function parseFormResponses(matrix) {
  const headerIndex = matrix.findIndex(row => row.some(c => norm(c).includes('nama lengkap') && (norm(c).includes('ayah') || norm(c).includes('suami'))));
  if (headerIndex < 0) return [];
  const headers = matrix[headerIndex].map(h => clean(h));
  const emailIdx = findHeaderIndex(headers, h => norm(h).includes('email'));
  const alamatIdx = findHeaderIndex(headers, h => norm(h).includes('alamat'));
  const roleDefs = [
    { needles:['ayah','suami'], status:'Kepala Keluarga', jk:'Laki-laki' },
    { needles:['ibu','istri'], status:'Istri', jk:'Perempuan' },
    { needles:['anak pertama'], status:'Anak Pertama', jk:'' },
    { needles:['anak kedua'], status:'Anak Kedua', jk:'' },
    { needles:['anak ketiga'], status:'Anak Ketiga', jk:'' },
    { needles:['anak keempat'], status:'Anak Keempat', jk:'' },
    { needles:['anak kelima'], status:'Anak Kelima', jk:'' },
    { needles:['anak keenam'], status:'Anak Keenam', jk:'' }
  ];
  const roleIndexes = roleDefs.map(def => {
    const nameIdx = findHeaderIndex(headers, h => norm(h).includes('nama lengkap') && def.needles.some(n => norm(h).includes(n)));
    const dateIdx = nameIdx >= 0 ? findNextBirthDateHeader(headers, nameIdx) : -1;
    return { ...def, nameIdx, dateIdx };
  }).filter(x => x.nameIdx >= 0);
  const out = [];
  for (const [rIdx, row] of matrix.slice(headerIndex + 1).entries()) {
    if (!row.some(v => clean(v))) continue;
    const alamat = clean(row[alamatIdx] ?? '');
    const email = clean(row[emailIdx] ?? '');
    const familyName = smartName(row[roleIndexes[0]?.nameIdx] ?? row[roleIndexes[1]?.nameIdx] ?? '');
    for (const def of roleIndexes) {
      const nama = smartName(row[def.nameIdx] ?? '');
      if (!validName(nama)) continue;
      out.push({
        nomor_urut: String(rIdx + 1),
        nama_keluarga: familyName,
        nama_lengkap: nama,
        jenis_kelamin: def.jk,
        tempat_lahir: '',
        tanggal_lahir: isoDate(row[def.dateIdx] ?? ''),
        alamat,
        no_hp: '', whatsapp: '', email,
        status_jemaat: 'Aktif',
        status_keluarga: def.status,
        tanggal_bergabung: '',
        catatan: 'Sumber: sheet Form Responses'
      });
    }
  }
  return out;
}

function normalizeGenericJemaat(rows) {
  return (rows || []).map(row => {
    const statusKeluarga = properStatus(pick(row, ['status_keluarga','Status Keluarga','STATUS','Status']));
    return {
      nomor_urut: clean(pick(row, ['nomor_urut','No','NO','Nomor'])),
      nama_keluarga: smartName(pick(row, ['nama_keluarga','Nama Keluarga','NAMA KELUARGA','Keluarga'])),
      nama_lengkap: smartName(pick(row, ['nama_lengkap','Nama Lengkap','Nama','ANGGOTA KELUARGA','Anggota Keluarga','Nama Jemaat'])),
      jenis_kelamin: clean(pick(row, ['jenis_kelamin','Jenis Kelamin','JK'])),
      tempat_lahir: clean(pick(row, ['tempat_lahir','Tempat Lahir'])),
      tanggal_lahir: isoDate(pick(row, ['tanggal_lahir','Tanggal Lahir','TANGGAL LAHIR'])),
      alamat: clean(pick(row, ['alamat','ALAMAT','Address'])),
      no_hp: normalizePhone(pick(row, ['no_hp','No HP','Nomor HP','Telepon','phone'])),
      whatsapp: normalizePhone(pick(row, ['whatsapp','WA','No WA','Nomor WhatsApp'])),
      email: clean(pick(row, ['email','Email','Email Address'])),
      status_jemaat: clean(pick(row, ['status_jemaat','Status Jemaat'])) || 'Aktif',
      status_keluarga: statusKeluarga,
      tanggal_bergabung: isoDate(pick(row, ['tanggal_bergabung','Tanggal Bergabung'])),
      catatan: clean(pick(row, ['catatan','Catatan','keterangan','Keterangan']))
    };
  }).filter(r => validName(r.nama_lengkap));
}

function normalizeJadwalWorkbook(wb) {
  const result = [];
  const names = [...wb.SheetNames].sort((a, b) => jadwalSheetPriority(a) - jadwalSheetPriority(b));
  for (const name of names) {
    if (norm(name).includes('absen')) continue;
    const matrix = XLSX.utils.sheet_to_json(wb.Sheets[name], { header:1, defval:'', raw:true, blankrows:false });
    result.push(...normalizeJadwalSheet(name, matrix));
  }
  return dedupe(
    result.filter(r => r.tanggal && r.jenis_ibadah && hasAnyPelayan(r)),
    r => `${r.tanggal}|${norm(r.jenis_ibadah)}|${norm(r.pemimpin_pujian)}|${norm(r.pengkhotbah)}|${norm(r.tema)}|${norm(r.singer)}|${norm(r.multimedia)}|${norm(r.usher)}`
  ).sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)) || String(a.jam_mulai || '').localeCompare(String(b.jam_mulai || '')));
}

function jadwalSheetPriority(name) {
  const n = norm(name);
  if (n.includes('jadwal januari')) return 1;
  if (n.includes('doa pagi')) return 2;
  if (n.includes('10 malam')) return 3;
  if (n.includes('jadwal')) return 4;
  return 9;
}

function normalizeJadwalSheet(name, matrix) {
  if (!Array.isArray(matrix) || !matrix.length) return [];
  const lower = norm(name);
  if (lower.includes('doa pagi')) return parseDoaPagi(matrix);
  if (lower.includes('10 malam')) return parseDoa10Malam(matrix, extractYearFromText(name) || extractYearFromMatrix(matrix) || 2026);
  const hasMonthMatrix = matrix.some(row => row.some(c => norm(c) === 'bulan')) && matrix.some(row => row.some(c => norm(c) === 'tanggal'));
  if (lower.includes('jadwal') || hasMonthMatrix) return parseJadwalMatriks(matrix, name);
  return normalizeGenericJadwal(matrixToObjects(matrix));
}

function parseJadwalMatriks(matrix, sheetName = '') {
  const out = [];
  const year = extractYearFromText(sheetName) || extractYearFromMatrix(matrix) || 2026;
  const bulanRowIndex = matrix.findIndex(row => row.some(c => norm(c) === 'bulan'));
  if (bulanRowIndex < 0) return out;

  const bulanRow = matrix[bulanRowIndex] || [];
  let tanggalRowIndex = -1;
  for (let r = bulanRowIndex + 1; r < Math.min(matrix.length, bulanRowIndex + 5); r++) {
    if ((matrix[r] || []).some(c => norm(c) === 'tanggal')) { tanggalRowIndex = r; break; }
  }
  if (tanggalRowIndex < 0) tanggalRowIndex = bulanRowIndex + 1;
  const tanggalRow = matrix[tanggalRowIndex] || [];
  const labelCol = Math.max(0, (matrix[tanggalRowIndex] || []).findIndex(c => norm(c) === 'tanggal'));
  const maxCols = Math.max(...matrix.map(r => r.length));
  const monthByCol = buildMonthByColumn(bulanRow, maxCols);
  const dateCols = [];
  for (let c = labelCol + 1; c < maxCols; c++) {
    const rawTanggal = clean(tanggalRow[c]);
    const day = extractDay(rawTanggal);
    const month = monthNumber(monthByCol[c]);
    if (day && month) dateCols.push({ c, rawTanggal, day, month });
  }

  const roleRows = [];
  let lastRole = '';
  for (let r = tanggalRowIndex + 1; r < Math.min(matrix.length, tanggalRowIndex + 22); r++) {
    const row = matrix[r] || [];
    const labelRaw = clean(row[labelCol] ?? row[1] ?? '');
    if (norm(labelRaw).includes('keterangan')) break;
    if (!row.some(v => clean(v))) {
      if (roleRows.length) break;
      continue;
    }
    let role = labelRaw ? normalizeRoleLabel(labelRaw) : '';
    if (!role && lastRole === 'pengkhotbah') role = 'pengkhotbah';
    if (role) lastRole = role;
    if (role) roleRows.push({ r, role });
  }

  for (const info of dateCols) {
    const tanggal = `${year}-${String(info.month).padStart(2,'0')}-${String(info.day).padStart(2,'0')}`;
    const special = specialEventName(info.rawTanggal);
    const jenisIbadah = guessIbadahFromSpreadsheet(tanggal, info.rawTanggal, special);
    const [jamMulai, jamSelesai] = defaultTimes(jenisIbadah, tanggal);
    const record = {
      tanggal,
      hari: hariIndonesia(tanggal),
      jenis_ibadah: jenisIbadah,
      jam_mulai: jamMulai,
      jam_selesai: jamSelesai,
      lokasi: 'GPI Cipayung',
      tema: '',
      pemimpin_pujian: '',
      singer: '',
      pemain_musik: '',
      pengkhotbah: '',
      liturgis: '',
      multimedia: '',
      usher: '',
      kolektan: '',
      catatan: `Sumber: ${sheetName || 'Jadwal matriks'} | Kolom ${excelCol(info.c)} | ${info.rawTanggal}${special ? ' | ' + special : ''}`,
      status: 'published'
    };

    for (const rr of roleRows) {
      const val = serviceText(matrix[rr.r]?.[info.c]);
      if (!val) continue;
      applyRoleValue(record, rr.role, val);
    }

    if (hasAnyPelayan(record) || special) out.push(record);
  }
  return out;
}

function parseDoaPagi(matrix) {
  const out = [];
  const header = matrix.findIndex(r => r.some(c => norm(c).includes('tanggal')) && r.some(c => norm(c).includes('renungan')));
  if (header < 0) return out;
  const h = matrix[header].map(clean);
  const dateIdx = findHeaderIndex(h, x => norm(x).includes('tanggal'));
  const renunganIdx = findHeaderIndex(h, x => norm(x).includes('renungan'));
  for (const row of matrix.slice(header + 1)) {
    let tanggal = isoDate(row[dateIdx]);
    tanggal = forceSaturdayIfDoaPagi(tanggal);
    const pelayan = serviceText(row[renunganIdx]);
    if (!tanggal || !validName(pelayan)) continue;
    out.push({ tanggal, hari:hariIndonesia(tanggal), jenis_ibadah:'Doa Pagi', jam_mulai:'05:00', jam_selesai:'', lokasi:'GPI Cipayung', tema:'', pemimpin_pujian:'', singer:'', pemain_musik:'', pengkhotbah:pelayan, liturgis:'', multimedia:'', usher:'', kolektan:'', catatan:'Sumber: sheet Doa Pagi | Kolom Renungan', status:'published' });
  }
  return out;
}

function parseDoa10Malam(matrix, year = 2026) {
  const out = [];
  const dateRowIndex = matrix.findIndex(r => r.some(c => /malam\s*ke/i.test(clean(c))));
  if (dateRowIndex < 0) return out;
  const dateRow = matrix[dateRowIndex] || [];
  const month = 5;
  for (let c = 0; c < dateRow.length; c++) {
    const cell = clean(dateRow[c]);
    const day = extractDay(cell);
    if (!day) continue;
    const tanggal = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const record = {
      tanggal,
      hari: hariIndonesia(tanggal),
      jenis_ibadah:'Doa 10 Malam',
      jam_mulai:'19:00',
      jam_selesai:'21:00',
      lokasi:'GPI Cipayung',
      tema:serviceText(matrix[dateRowIndex + 3]?.[c]),
      pemimpin_pujian:serviceText(matrix[dateRowIndex + 1]?.[c]),
      singer:serviceText(matrix[dateRowIndex + 4]?.[c]),
      pemain_musik:'',
      pengkhotbah:serviceText(matrix[dateRowIndex + 2]?.[c]),
      liturgis:'',
      multimedia:serviceText(matrix[dateRowIndex + 5]?.[c]),
      usher:serviceText(matrix[dateRowIndex + 6]?.[c]),
      kolektan:'',
      catatan:`Sumber: sheet Jadwal Doa 10 Malam | ${cell}`,
      status:'published'
    };
    if (hasAnyPelayan(record)) out.push(record);
  }
  return out;
}

function buildMonthByColumn(bulanRow, maxCols) {
  const monthByCol = {};
  let currentMonth = '';
  for (let c = 0; c < maxCols; c++) {
    const raw = clean(bulanRow[c]);
    if (monthNumber(raw)) currentMonth = raw;
    if (currentMonth) monthByCol[c] = currentMonth;
  }
  return monthByCol;
}

function normalizeRoleLabel(label) {
  const r = norm(label);
  if (!r) return '';
  if (r === 'wl' || r.includes('worship') || r.includes('pemimpin pujian')) return 'pemimpin_pujian';
  if (r === 'ft' || r.includes('firman') || r.includes('renungan') || r.includes('pengkhotbah')) return 'pengkhotbah';
  if (r.includes('singer')) return 'singer';
  if (r.includes('musik') || r.includes('pemusik')) return 'pemain_musik';
  if (r.includes('multi')) return 'multimedia';
  if (r.includes('usher')) return 'usher';
  if (r.includes('kolektan')) return 'kolektan';
  if (r.includes('liturgis')) return 'liturgis';
  if (r.includes('tema')) return 'tema';
  return '';
}

function applyRoleValue(record, role, value) {
  if (!role || !value) return;
  if (role === 'pemimpin_pujian') record.pemimpin_pujian = appendText(record.pemimpin_pujian, value);
  else if (role === 'pengkhotbah') record.pengkhotbah = appendText(record.pengkhotbah, value);
  else if (role === 'singer') record.singer = appendText(record.singer, value);
  else if (role === 'pemain_musik') record.pemain_musik = appendText(record.pemain_musik, value);
  else if (role === 'multimedia') record.multimedia = appendText(record.multimedia, value);
  else if (role === 'usher') record.usher = appendText(record.usher, value);
  else if (role === 'kolektan') record.kolektan = appendText(record.kolektan, value);
  else if (role === 'liturgis') record.liturgis = appendText(record.liturgis, value);
  else if (role === 'tema') record.tema = appendText(record.tema, value);
}

function serviceText(v) {
  const s = clean(v);
  if (!s) return '';
  if (/^(tidak ada|tdk ada|tidak|none|null|nihil|kosong|-|0|false)$/i.test(s)) return '';
  return smartName(s);
}

function hasAnyPelayan(r) {
  return Boolean(clean(r.pemimpin_pujian) || clean(r.pengkhotbah) || clean(r.tema) || clean(r.singer) || clean(r.pemain_musik) || clean(r.multimedia) || clean(r.usher) || clean(r.kolektan) || clean(r.liturgis));
}

function guessIbadahFromSpreadsheet(date, rawTanggal = '', special = '') {
  if (special) return `Perayaan ${special}`;
  const raw = norm(rawTanggal);
  if (raw.includes('malam')) return 'Doa 10 Malam';
  return guessIbadahFromDate(date, special);
}

function extractYearFromMatrix(matrix) {
  for (const row of matrix.slice(0, 6)) {
    for (const cell of row || []) {
      const year = extractYearFromText(cell);
      if (year) return year;
    }
  }
  return 0;
}

function excelCol(index) {
  let n = index + 1, out = '';
  while (n > 0) { const m = (n - 1) % 26; out = String.fromCharCode(65 + m) + out; n = Math.floor((n - 1) / 26); }
  return out;
}

function shortNote(v) {
  const s = clean(v);
  return s.length > 70 ? s.slice(0, 67) + '...' : s;
}
function rupiah(v) {
  const n = Number(v || 0);
  return 'Rp ' + n.toLocaleString('id-ID');
}

function normalizeGenericJadwal(rows) {
  return (rows || []).map(row => {
    let tanggal = isoDate(pick(row, ['tanggal','Tanggal','date','DATE']));
    const jenis = clean(pick(row, ['jenis_ibadah','Jenis Ibadah','jenis','Ibadah','IBADAH'])) || guessIbadahFromDate(tanggal, '');
    if (norm(jenis).includes('doa pagi')) tanggal = forceSaturdayIfDoaPagi(tanggal);
    const jam = clean(pick(row, ['jam','Jam','Waktu']));
    const [jamMulaiFromJam, jamSelesaiFromJam] = splitJamRange(jam);
    return {
      tanggal,
      hari: clean(pick(row, ['hari','Hari'])) || hariIndonesia(tanggal),
      jenis_ibadah: jenis || 'Ibadah',
      jam_mulai: clean(pick(row, ['jam_mulai','Jam Mulai'])) || jamMulaiFromJam,
      jam_selesai: clean(pick(row, ['jam_selesai','Jam Selesai'])) || jamSelesaiFromJam,
      lokasi: clean(pick(row, ['lokasi','Lokasi'])) || 'GPI Cipayung',
      tema: clean(pick(row, ['tema','Tema'])),
      pemimpin_pujian: smartName(pick(row, ['pemimpin_pujian','WL','Worship Leader','wl'])),
      singer: smartName(pick(row, ['singer','Singer','singers'])),
      pemain_musik: smartName(pick(row, ['pemain_musik','Pemusik','Musik'])),
      pengkhotbah: smartName(pick(row, ['pengkhotbah','FT','Firman','Pelayan Firman','Renungan'])),
      liturgis: smartName(pick(row, ['liturgis','Liturgis'])),
      multimedia: smartName(pick(row, ['multimedia','Multimedia'])),
      usher: smartName(pick(row, ['usher','Usher'])),
      kolektan: smartName(pick(row, ['kolektan','Kolektan'])),
      catatan: clean(pick(row, ['catatan','Catatan','keterangan','Keterangan'])),
      status: clean(pick(row, ['status','Status'])) || 'published'
    };
  }).filter(r => r.tanggal && r.jenis_ibadah);
}

async function showAnnouncement(id) {
  try {
    const json = await api('announcement_preview', { query: '&id=' + encodeURIComponent(id) });
    const data = json.data || {};
    announcementId = id;
    $('#announcementText').value = data.message || '';
    const group = data.group?.id ? (data.group.name || data.group.id) : 'belum dipilih';
    $('#announcementSummary').textContent = `Bot: ${data.bot === 'ready' ? 'terhubung' : 'belum siap'} · Grup: ${group} · ${data.recipients?.length || 0} nomor pribadi.`;
    $('#announcementTargets').innerHTML = data.recipients?.length ? `<h3>Tujuan pribadi</h3>${data.recipients.map(r => `<span class="wa-chip">${esc(r.nama)} · ${esc(r.phone)}</span>`).join('')}` : '<p class="muted">Tidak ada nomor pelayan yang cocok di Data Jemaat.</p>';
    $('#announcementResult').innerHTML = '';
    const send = $('#sendAnnouncement');
    send.hidden = false;
    send.disabled = data.bot !== 'ready' || !data.group?.id;
    if (send.disabled) $('#announcementResult').innerHTML = '<p class="wa-error">Hubungkan bot dan simpan grup tujuan terlebih dahulu di menu Bot WhatsApp.</p>';
    openModal('announcementModal');
  } catch (e) { notify(e.message, 'danger'); }
}

async function sendAnnouncementNow() {
  if (!announcementId) return;
  const btn = $('#sendAnnouncement');
  const box = $('#announcementResult');
  btn.disabled = true;
  box.innerHTML = '<p class="muted">Mengirim melalui bot WhatsApp…</p>';
  try {
    const json = await api('announcement', { method:'POST', body:new FormData(), query:'&id=' + encodeURIComponent(announcementId) });
    const report = json.report || {};
    const rows = report.results || [];
    box.innerHTML = `<h3>Hasil pengiriman</h3><p>${esc(report.sent || 0)} dari ${rows.length} tujuan berhasil.</p>${rows.map(r => `<div class="wa-result ${r.status === 'diterima' ? 'ok' : 'fail'}"><strong>${esc(r.target || '-')}</strong><span>${esc(r.phone || 'grup')} · ${esc(r.status)}</span>${r.detail ? `<small>${esc(r.detail)}</small>` : ''}</div>`).join('')}`;
    notify(json.message || 'Pengumuman diproses bot.');
    await loadData();
    await loadWhatsappLogs();
  } catch (err) {
    box.innerHTML = `<p class="wa-error">${esc(err.message)}</p>`;
    notify(err.message, 'danger');
  } finally { btn.disabled = false; }
}

function openAnnouncementLog(row) {
  announcementId = null;
  $('#announcementSummary').textContent = `Log ${WA_TYPES[row.message_type] || row.message_type || 'WhatsApp'} · ${row.status || '-'} · ${row.created_at || ''}`;
  $('#announcementText').value = row.message_text || '';
  $('#announcementTargets').innerHTML = `<h3>Tujuan</h3><span class="wa-chip">${esc(row.target_name || '-')}${row.target_phone ? ' · ' + esc(row.target_phone) : ''}</span>`;
  $('#announcementResult').innerHTML = '';
  $('#sendAnnouncement').hidden = true;
  openModal('announcementModal');
}

function activateSection(section) {
  if (!section || !$('#section-' + section) || !can(section,'view')) section = 'dashboard';
  activeSection = section;
  $$('.side-nav button').forEach(b => b.classList.toggle('active', b.dataset.section === section));
  $$('.admin-section').forEach(s => s.classList.toggle('active', s.id === 'section-' + section));
  $('.sidebar')?.classList.remove('show');
  if (location.hash.replace('#','') !== section) history.replaceState(null, '', '#' + section);
  syncWhatsappRealtime();
}
function sectionFromHash() {
  return location.hash.replace('#','') || 'dashboard';
}
function rowsForType(type) {
  return { user:state.users, jemaat:state.jemaat, jadwal:state.jadwal, pengumuman:state.pengumuman, sakramen:state.sakramen, persembahan:state.persembahan, pernikahan:state.pernikahan, tim_pelayan:state.tim_pelayan, pendalaman_alkitab:state.pendalaman_alkitab }[type] || [];
}
async function openEditForm(type, id) {
  let rows = rowsForType(type);
  let row = rows.find(x => String(x.id) === String(id));
  if (!row) {
    try { await loadData(); } catch (_) {}
    rows = rowsForType(type);
    row = rows.find(x => String(x.id) === String(id));
  }
  const form = $('[data-form="' + type + '"]');
  if (!row || !form) {
    notify('Data belum siap untuk diedit. Klik Refresh Data lalu coba lagi.', 'danger');
    return;
  }
  resetForm(form);
  if (type === 'tim_pelayan') {
    form.elements.kategori.value = row.kategori || 'musik';
    refreshTimPelayanOptions(row.tim || '', row.jabatan || '');
    resetTeamCropState(false);
    if (form.elements.foto_file) form.elements.foto_file.value = '';
    if (form.elements.foto_cropped_data) form.elements.foto_cropped_data.value = '';
    if (form.elements.hapus_foto) form.elements.hapus_foto.value = '0';
    updateTeamUploadPreview(row.foto_path || '');
  }
  fillForm(form, row);
  if (type === 'user' && form.elements.password) form.elements.password.value = '';
  const modalId = type === 'tim_pelayan' ? 'timPelayanModal' : (type === 'pendalaman_alkitab' ? 'pendalaman_alkitabModal' : (type === 'user' ? 'userModal' : type + 'Modal'));
  openModal(modalId);
}

function attachEvents() {
  const activate = activateSection;
  $$('.side-nav button').forEach(btn => btn.addEventListener('click', () => activate(btn.dataset.section)));
  $$('[data-jump]').forEach(btn => btn.addEventListener('click', () => activate(btn.dataset.jump)));
  $('[data-mobile-sidebar]')?.addEventListener('click', () => $('.sidebar')?.classList.toggle('show'));
  $('#refreshAll')?.addEventListener('click', loadData);
  $$('[data-open-modal]').forEach(btn => btn.addEventListener('click', (e) => { e.preventDefault(); const form = $('#' + btn.dataset.openModal)?.querySelector('form'); if (form) { resetForm(form); if (btn.dataset.openModal === 'timPelayanModal') { refreshTimPelayanOptions(); resetTeamCropState(true); if (form.elements.hapus_foto) form.elements.hapus_foto.value = '0'; updateTeamUploadPreview(''); } } openModal(btn.dataset.openModal); }));
  $$('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => closeModal(btn)));
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModal(m); }));
  $$('[data-form]').forEach(form => form.addEventListener('submit', async (e) => { e.preventDefault(); try { await saveForm(form.dataset.form, form); } catch (err) { notify(err.message, 'danger'); } }));
  // Add-dropdown toggles
  function setupAddDropdown(btnId, menuId) {
    const btn = $('#' + btnId), menu = $('#' + menuId);
    if (!btn || !menu) return;
    btn.addEventListener('click', (e) => { e.stopPropagation(); $$('.add-dropdown-menu.open').forEach(m => { if (m !== menu) m.classList.remove('open'); }); menu.classList.toggle('open'); });
    document.addEventListener('click', () => menu.classList.remove('open'));
  }
  setupAddDropdown('toggleAddJemaat', 'menuAddJemaat');
  setupAddDropdown('toggleAddJadwal', 'menuAddJadwal');
  setupAddDropdown('toggleAddPersembahan', 'menuAddPersembahan');
  $('#importJemaat')?.addEventListener('change', e => { importFile('jemaat', e.target.files[0]); e.target.value = ''; });
  $('#importJadwal')?.addEventListener('change', e => { importFile('jadwal', e.target.files[0]); e.target.value = ''; });
  $('#importPersembahan')?.addEventListener('change', e => { importFile('persembahan', e.target.files[0]); e.target.value = ''; });
  $('[data-form="tim_pelayan"] select[name="kategori"]')?.addEventListener('change', () => refreshTimPelayanOptions());
  initTeamCropper();
  refreshTimPelayanOptions();
  $$('[data-export]').forEach(btn => btn.addEventListener('click', () => { window.location = '/api?action=export_' + btn.dataset.export + '&_ts=' + Date.now(); }));
  $('#deleteAllJemaat')?.addEventListener('click', () => deleteAll('jemaat'));
  $('#deleteAllJadwal')?.addEventListener('click', () => deleteAll('jadwal'));
  $('#teamPhotoRemoveBtn')?.addEventListener('click', removeTeamPhotoSelection);
  $$('[data-search]').forEach(inp => inp.addEventListener('input', () => { filtered[inp.dataset.search] = inp.value; inp.dataset.search === 'jemaat' ? renderJemaat() : renderJadwal(); }));
  document.body.addEventListener('click', (e) => {
    const dots = e.target.closest('[data-dots]');
    if (dots) {
      e.stopPropagation();
      const menu = dots.nextElementSibling;
      $$('.action-dropdown.open').forEach(m => { if (m !== menu) m.classList.remove('open'); });
      menu?.classList.toggle('open');
      return;
    }
    if (!e.target.closest('.action-dropdown')) {
      $$('.action-dropdown.open').forEach(m => m.classList.remove('open'));
    }
  });
  document.body.addEventListener('click', async (e) => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    const ann = e.target.closest('[data-announcement]');
    const rep = e.target.closest('[data-reply]');
    const pub = e.target.closest('[data-publish-media]');
    const viewWa = e.target.closest('[data-view-wa]');
    if (edit) {
      e.preventDefault();
      e.stopPropagation();
      $$('.action-dropdown.open').forEach(m => m.classList.remove('open'));
      await openEditForm(edit.dataset.edit, edit.dataset.id);
      return;
    }
    if (del) deleteItem(del.dataset.delete, del.dataset.id);
    if (ann) showAnnouncement(ann.dataset.announcement);
    if (rep) {
      const row = state.pesan.find(x => String(x.id) === String(rep.dataset.reply));
      const form = $('[data-form="reply"]');
      if (row && form) { fillForm(form, { id: row.id, balasan: row.balasan || '' }); openModal('replyModal'); }
    }
    if (viewWa) {
      const row = (state.whatsapp || []).find(x => String(x.id) === String(viewWa.dataset.viewWa));
      if (row) openAnnouncementLog(row);
    }
    if (pub) {
      try { const fd = new FormData(); await api('publish_media', { method:'POST', query:'&id=' + encodeURIComponent(pub.dataset.publishMedia), body:fd }); notify('Media dipublish.'); await loadData(); } catch(err) { notify(err.message, 'danger'); }
    }
  });
  $('#waBotRefresh')?.addEventListener('click', () => { loadBotStatus(); loadWhatsappLogs(); });
  $('#waBotConnect')?.addEventListener('click', connectBot);
  $('#waBotDisconnect')?.addEventListener('click', disconnectBot);
  $('#waBotLoadGroups')?.addEventListener('click', loadBotGroups);
  $('#waBotSaveGroup')?.addEventListener('click', saveBotGroup);
  $('#waBotTest')?.addEventListener('click', sendBotTest);
  $('#waBotTestTarget')?.addEventListener('change', syncBotTestTarget);
  syncBotTestTarget();
  $('#sendAnnouncement')?.addEventListener('click', sendAnnouncementNow);
}

function csvToMatrix(text) {
  const rows = [];
  let row = [], cell = '', quote = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i+1];
    if (c === '"' && quote && n === '"') { cell += '"'; i++; continue; }
    if (c === '"') { quote = !quote; continue; }
    if (c === ',' && !quote) { row.push(cell); cell = ''; continue; }
    if ((c === '\n' || c === '\r') && !quote) {
      if (c === '\r' && n === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = ''; continue;
    }
    cell += c;
  }
  row.push(cell); rows.push(row);
  return rows.filter(r => r.some(v => clean(v)));
}

function matrixToObjects(matrix) {
  const headerIndex = matrix.findIndex(r => r.filter(c => clean(c)).length >= 2);
  if (headerIndex < 0) return [];
  const headers = uniqueHeaders(matrix[headerIndex].map(h => clean(h)));
  return matrix.slice(headerIndex + 1).filter(r => r.some(x => clean(x))).map(r => Object.fromEntries(headers.map((h,i)=>[h, r[i] ?? ''])));
}

function uniqueHeaders(headers) {
  const used = {};
  return headers.map((h, i) => {
    const base = h || `Kolom ${i + 1}`;
    const key = norm(base);
    used[key] = (used[key] || 0) + 1;
    return used[key] === 1 ? base : `${base}__${used[key]}`;
  });
}

function findHeaderIndex(headers, predicate) { return headers.findIndex(h => predicate(h)); }
function findNextBirthDateHeader(headers, fromIdx) {
  for (let i = fromIdx + 1; i < headers.length; i++) {
    const h = norm(headers[i]);
    if (h.includes('nama lengkap')) break;
    if (h.includes('tanggal') && h.includes('lahir')) return i;
  }
  return -1;
}
function pick(row, aliases) {
  const entries = Object.entries(row || {});
  for (const a of aliases) {
    const found = entries.find(([k]) => norm(k).replace(/__\d+$/,'') === norm(a));
    if (found && clean(found[1]) !== '') return found[1];
  }
  for (const a of aliases) {
    const found = entries.find(([k,v]) => {
      const nk = norm(k).replace(/__\d+$/,''); const na = norm(a);
      return (nk.includes(na) || na.includes(nk)) && clean(v) !== '';
    });
    if (found && clean(found[1]) !== '') return found[1];
  }
  return '';
}
function clean(v) { return String(v ?? '').replace(/\s+/g,' ').trim(); }
function norm(v) { return clean(v).toLowerCase().replace(/[\s_\-:.()\/]+/g,' ').trim(); }
function smartName(v) {
  const s = clean(v);
  if (!s) return '';
  if (/^(tidak ada|tdk ada|tidak|none|null|nihil|kosong|-|0)$/i.test(s)) return '';
  if (s === s.toUpperCase() && /[A-Z]/.test(s)) return s.toLowerCase().replace(/(^|\s|\.|'|-)([a-zà-ÿ])/g, (m,p,c)=>p+c.toUpperCase());
  return s;
}
function validName(v) {
  const s = clean(v);
  if (!s) return false;
  if (/^(tidak ada|tdk ada|tidak|none|null|nihil|kosong|-|0)$/i.test(s)) return false;
  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}(\s*[–-]\s*)?/i.test(s)) return false;
  return /[a-zA-ZÀ-ÿ]/.test(s);
}
function properStatus(v) {
  const s = clean(v);
  if (!s) return '';
  return s.toLowerCase().replace(/(^|\s)([a-zà-ÿ])/g, (m,p,c)=>p+c.toUpperCase());
}
function guessGender(status) {
  const s = norm(status);
  if (s.includes('kepala') || s.includes('ayah') || s.includes('suami')) return 'Laki-laki';
  if (s.includes('istri') || s.includes('ibu')) return 'Perempuan';
  return '';
}
function isoDate(v) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`;
  if (typeof v === 'number' && isFinite(v)) {
    const utc = Math.round((v - 25569) * 86400 * 1000);
    const d = new Date(utc);
    return isNaN(d) ? '' : `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;
  }
  const s = clean(v); if (!s) return '';
  if (/^\d+(\.\d+)?$/.test(s)) return isoDate(Number(s));
  let m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/); if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/); if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  const d = new Date(s); return isNaN(d) ? '' : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function normalizePhone(v) { let p = clean(v).replace(/[^0-9]/g,''); if (!p) return ''; if (p.startsWith('0')) return '62' + p.slice(1); if (p.startsWith('8')) return '62' + p; return p; }
function dedupe(rows, keyFn) { const seen = new Set(); return rows.filter(r => { const k = keyFn(r); if (seen.has(k)) return false; seen.add(k); return true; }); }
function extractDay(v) { const s = clean(v).replace('`',''); const m = s.match(/\d{1,2}/); return m ? Number(m[0]) : 0; }
function extractYearFromText(v) { const m = clean(v).match(/20\d{2}/); return m ? Number(m[0]) : 0; }
function monthNumber(v) { const s = norm(v); const map = {januari:1,februari:2,maret:3,april:4,mei:5,juni:6,juli:7,agustus:8,september:9,oktober:10,november:11,desember:12}; return map[s] || 0; }
function hariIndonesia(date) { if (!date) return ''; const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']; const d = new Date(date + 'T00:00:00'); return isNaN(d) ? '' : days[d.getDay()]; }
function specialEventName(text) {
  const s = norm(text);
  if (s.includes('jumat agung')) return 'Jumat Agung';
  if (s.includes('kebangkitan')) return 'Kebangkitan/Paskah';
  if (s.includes('kenaikan')) return 'Kenaikan Tuhan Yesus';
  if (s.includes('pentakosta')) return 'Pentakosta';
  return '';
}
function guessIbadahFromDate(date, special = '') {
  if (special) return `Perayaan ${special}`;
  const d = new Date(date + 'T00:00:00');
  const day = d.getDay();
  if (day === 0) return 'Ibadah Minggu Raya';
  if (day === 4) return 'Ibadah Tengah Minggu';
  if (day === 6) return 'Ibadah Youth/Sabtu';
  return 'Ibadah Pelayanan';
}
function forceSaturdayIfDoaPagi(date) {
  if (!date) return date;
  const d = new Date(date + 'T00:00:00');
  if (isNaN(d) || d.getDay() === 6) return date;
  const add = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function defaultTimes(jenis, date) {
  const j = norm(jenis);
  const d = new Date(date + 'T00:00:00');
  if (j.includes('doa pagi')) return ['05:00',''];
  if (j.includes('tengah minggu')) return ['18:30',''];
  if (j.includes('10 malam') || j.includes('youth') || j.includes('sabtu')) return ['19:00','21:00'];
  if (j.includes('perayaan') && d.getDay() !== 0) return ['19:00','21:00'];
  if (j.includes('minggu') || d.getDay() === 0) return ['09:00','11:30'];
  return ['19:00','21:00'];
}
function splitJamRange(v) {
  const s = clean(v);
  const m = s.match(/(\d{1,2}:\d{2})\s*(?:-|s.d.|sd|–)\s*(\d{1,2}:\d{2})/i);
  if (m) return [m[1], m[2]];
  const one = s.match(/\d{1,2}:\d{2}/);
  return [one ? one[0] : '', ''];
}
function appendText(a, b) { a = clean(a); b = clean(b); if (!a) return b; if (!b) return a; return `${a}, ${b}`; }

// Bug guard: jangan pernah biarkan tanggal masuk sebagai nama jemaat ketika import dari spreadsheet.
function sanitizeImportedJemaat(rows) {
  return rows.filter(r => validName(r.nama_lengkap)).map(r => ({...r, nama_lengkap: smartName(r.nama_lengkap)}));
}

document.addEventListener('DOMContentLoaded', async () => {
  attachEvents();
  activateSection(sectionFromHash());
  if (initialBootstrap && typeof initialBootstrap === 'object') {
    renderAll();
    initialBootstrapRendered = true;
  }
  try { await loadData(); } catch (_) {}
});
window.addEventListener('hashchange', () => activateSection(sectionFromHash()));


const connectLabels={komitmen:'Terima Yesus / Berkomitmen Kembali',baptis:'Baptis',komunitas:'Komunitas / Persekutuan',kesaksian:'Kesaksian',doa:'Permintaan Doa / Konseling'};
let currentConnectId=null;
function renderConnect(){
 const q=($('#connectSearch')?.value||'').trim().toLowerCase(),status=$('#connectFilter')?.value||'';
 Object.assign(connectLabels,Object.fromEntries((state.connect_categories||[]).map(r=>[r.kode,r.label])));
 const rows=(can('terhubung')?state.terhubung||[]:[]).filter(r=>(!status||r.status===status)&&[r.nama,r.kontak,r.email,r.kota,connectLabels[r.kategori]].join(' ').toLowerCase().includes(q));
 if($('#connectCount'))$('#connectCount').textContent=state.connect_error?'Tabel belum siap':rows.length+' permohonan';
 table($('#tableConnect'),[{label:'Tanggal',key:'created_at'},{label:'Nama',key:'nama'},{label:'Jenis permohonan',render:r=>esc(connectLabels[r.kategori]||r.kategori)},{label:'Kontak',render:r=>esc([r.kontak,r.email].filter(Boolean).join(' / ')||'-')},{label:'Kota',key:'kota'},{label:'Status',render:r=>badge(r.status)}],rows.map(r=>({...r,_actions:`<button class="btn small ghost" type="button" data-connect-view="${Number(r.id)}">Detail</button> ${can('terhubung','delete')?`<button class="btn small danger" type="button" data-connect-delete="${Number(r.id)}">Hapus</button>`:''}`})),state.connect_error?'Tabel formulir belum tersedia. Jalankan migrasi database lalu muat ulang.':'Belum ada formulir masuk.');
}
function openConnect(id){const r=(state.terhubung||[]).find(x=>Number(x.id)===Number(id));if(!r||!can('terhubung'))return;currentConnectId=Number(id);$('#connectDialogTitle').textContent=connectLabels[r.kategori]||r.kategori;const entries=[['Nama',r.nama],['Jenis kelamin',r.jenis_kelamin],['Usia',r.usia],['WhatsApp',r.kontak],['Email',r.email],['Kota / Negara',r.kota],...(() => {try{const d=JSON.parse(r.detail_json||'null');return d?[['NIJ / NIJ pasangan',d.nij_pasangan],['CG / Kelompok Persekutuan',d.cg_pasangan],['Aktif CG Sejak',d.aktif_cg_sejak],['Rencana Tanggal Pernikahan',d.tanggal_pernikahan]]:[];}catch{return [];}})(),['Pesan / kebutuhan',r.pesan],['Minat baptis',Number(r.minat_baptis)?'Ya':'Tidak'],['Minat persekutuan',Number(r.minat_komunitas)?'Ya':'Tidak'],['Status',r.status],['Catatan internal',r.catatan],['Tanggal masuk',r.created_at]];$('#connectDialogBody').innerHTML='<dl class="connect-detail-list">'+entries.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v??'-')}</dd></div>`).join('')+'</dl>';const f=$('#connectUpdateForm');f.hidden=!can('terhubung','update');f.elements.status.value=r.status;f.elements.catatan.value=r.catatan||'';$('#connectDialog').showModal();}
document.addEventListener('DOMContentLoaded',()=>{ $('#connectSearch')?.addEventListener('input',renderConnect);$('#connectFilter')?.addEventListener('change',renderConnect);$('#refreshConnect')?.addEventListener('click',()=>loadData().catch(e=>notify(e.message,'danger')));$('#closeConnectDialog')?.addEventListener('click',()=>$('#connectDialog').close());document.body.addEventListener('click',async e=>{const v=e.target.closest('[data-connect-view]'),d=e.target.closest('[data-connect-delete]'),g=e.target.closest('[data-go-section]');if(v)openConnect(v.dataset.connectView);if(g)activateSection(g.dataset.goSection);if(d&&can('terhubung','delete')&&confirm('Hapus permohonan ini secara permanen?')){try{await api('delete_connect',{method:'POST',body:{id:Number(d.dataset.connectDelete)}});await loadData();notify('Formulir dihapus.');}catch(err){notify(err.message,'danger');}}});$('#connectUpdateForm')?.addEventListener('submit',async e=>{e.preventDefault();if(!can('terhubung','update'))return;const f=e.currentTarget,b=f.querySelector('button');b.disabled=true;try{await api('update_connect',{method:'POST',body:{id:currentConnectId,status:f.elements.status.value,catatan:f.elements.catatan.value}});$('#connectDialog').close();await loadData();notify('Tindak lanjut disimpan.');}catch(err){notify(err.message,'danger');}finally{b.disabled=false;}});});
