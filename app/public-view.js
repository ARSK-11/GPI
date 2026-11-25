const state = { csrf: '', data: null, mediaQuery: '' };
const slots = Object.create(null);
const $ = s => slots[s] ||= {innerHTML:''};

const esc = v => String(v ?? '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
const safeUrl = v => {
  const u = String(v ?? '').trim();
  return /[\u0000-\u001f\u007f]/.test(u) || (/^[a-z][a-z0-9+.-]*:/i.test(u) && !/^https?:/i.test(u)) ? '' : u;
};

function parseDate(v) {
  const d = new Date(`${v}T00:00:00`);
  return isNaN(d) ? null : d;
}
function fullDate(v) {
  const d = parseDate(v);
  return d ? d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
}
function dateLong(v) {
  const d = parseDate(v);
  return d ? d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
}
function dayNum(v) {
  const d = parseDate(v);
  return d ? String(d.getDate()).padStart(2, '0') : '--';
}
function monthShort(v) {
  const d = parseDate(v);
  return d ? d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '-';
}
function timeRange(r) {
  const a = String(r.jam_mulai || '').slice(0, 5);
  const b = String(r.jam_selesai || '').slice(0, 5);
  return a ? `${a} - ${b || 'selesai'}` : '-';
}
function scheduleDay(r) {
  const d = parseDate(r?.tanggal);
  if (d) return d.toLocaleDateString('id-ID', { weekday: 'long' });
  return String(r?.hari || '').replace(/^(Minggu|Senin|Selasa|Rabu|Kamis|Jumat|Sabtu)\s*,\s*\1\b/i, '$1');
}
function scheduleWaPhone(r) {
  const j = String(r?.jenis_ibadah || '').toLowerCase();
  if (j.includes('youth') || j.includes('sabtu')) return '6282299352644';
  if (j.includes('sekolah minggu')) return '6285920706712';
  if (j.includes('kaum ibu')) return '6282240024022';
  return '6281315490602';
}
function icon(n) {
  const map = {
    music: '<svg class="icon" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    users: '<svg class="icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg>',
    book: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4v15.5A2.5 2.5 0 0 0 6.5 22H20V6a2 2 0 0 0-2-2H4z"/></svg>',
    heart: '<svg class="icon" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    cross: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 2v20M5 8h14"/></svg>',
    media: '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>'
  };
  return map[n] || map.cross;
}

function fallbackTeams() { return require('./defaults.json').teams; }
function fallbackData() {
  return {
    settings: { nama_gereja: 'GPI Cipayung', alamat_gereja: 'Jl. Tengki No. 78 RT04/03 Cipayung, Jakarta Timur', telepon_gereja: '081315490602', email_gereja: 'gpisidangcipayung@gmail.com', logo_path: 'assets/img/logo-gpi-cipayung.jpg' },
    stats: { jadwal: 0, pengumuman: 0, media: 0, pelayanan: 6, tim_pelayan: fallbackTeams().length },
    jadwal: [], pengumuman: [], media: [],
    pelayanan: [
      { nama_tim: 'Tim Musik & Singers', deskripsi: 'Melayani pujian, penyembahan, musik ibadah, dan singers.', penanggung_jawab: 'Koordinator Musik' },
      { nama_tim: 'Tim Pelayanan Gereja', deskripsi: 'Struktur pelayanan gereja, pelayan ibadah, diakonia, dan media gereja.', penanggung_jawab: 'Pengurus Gereja' },
      { nama_tim: 'Sekolah Minggu', deskripsi: 'Pelayanan pembinaan iman anak dan generasi muda sejak dini.', penanggung_jawab: 'Koordinator Sekolah Minggu' },
      { nama_tim: 'Revive Generation', deskripsi: 'Pembinaan karakter dan komunitas pemuda gereja.', penanggung_jawab: 'Koordinator Revive Generation' },
      { nama_tim: 'Kaum Ibu', deskripsi: 'Wadah pertumbuhan rohani dan pemberdayaan kaum wanita gereja.', penanggung_jawab: 'Koordinator Kaum Ibu' },
      { nama_tim: 'Pendalaman Alkitab', deskripsi: 'Kelompok pembelajaran Firman Tuhan dan pertumbuhan iman.', penanggung_jawab: 'Koordinator PA' }
    ],
    tim_pelayan: fallbackTeams()
  };
}

function renderJadwal(rows) {
  const w = $('#jadwalList');
  if (!w) return;
  if (!rows.length) { w.innerHTML = '<div class="empty">Belum ada jadwal ibadah yang dipublikasikan dari dashboard admin.</div>'; return; }
  w.innerHTML = rows.map(r => {
    const chips = [];
    if (r.pemimpin_pujian) chips.push(`<span class="chip">WL: ${esc(r.pemimpin_pujian)}</span>`);
    if (r.pengkhotbah) chips.push(`<span class="chip">Firman: ${esc(r.pengkhotbah)}</span>`);
    if (r.singer) chips.push(`<span class="chip">Singer: ${esc(r.singer)}</span>`);
    if (r.multimedia) chips.push(`<span class="chip">Media: ${esc(r.multimedia)}</span>`);
    const phone = scheduleWaPhone(r);
    const hari = scheduleDay(r);
    return `<article class="schedule-card"><div class="date-tile"><b>${dayNum(r.tanggal)}</b><span>${monthShort(r.tanggal)}</span></div><div><h3>${esc(r.jenis_ibadah || 'Ibadah')}</h3><p>${esc(hari)}${hari ? ', ' : ''}${dateLong(r.tanggal)} • ${timeRange(r)} WIB</p><small>${esc(r.lokasi || 'GPI Cipayung')}${r.tema ? ` • Tema: ${esc(r.tema)}` : ''}</small><div class="chips">${chips.join('')}</div></div><a class="btn" href="https://wa.me/${phone}?text=${encodeURIComponent('Shalom, saya ingin bertanya tentang ' + (r.jenis_ibadah || 'jadwal ibadah') + ' GPI Cipayung.')}" target="_blank" rel="noopener">Tanya Admin</a></article>`;
  }).join('');
}

function serviceKey(name) {
  const n = String(name || '').toLowerCase().trim();
  if (n.includes('musik') || n.includes('singer') || n.includes('pujian')) return 'musik';
  if (n.includes('pelayanan gereja') || n.includes('pengurus gereja') || n.includes('struktur')) return 'pelayanan_gereja';
  if (n.includes('sekolah minggu')) return 'sekolah_minggu';
  if (n.includes('kaum ibu') || n.includes('wanita') || n.includes('wbi')) return 'kaum_ibu';
  if (n.includes('revive') || n.includes('pemuda') || n.includes('pemudi') || n.includes('youth')) return 'pemuda';
  if (n.includes('alkitab') || n === 'pa') return 'pendalaman_alkitab';
  return n.replace(/[^a-z0-9]+/g, '_') || 'pelayanan';
}
function serviceDefaults(key) {
  return ({
    musik: { nama_tim: 'Tim Musik & Singers', deskripsi: 'Melayani pujian, penyembahan, musik ibadah, dan singers.', penanggung_jawab: 'Koordinator Musik' },
    pelayanan_gereja: { nama_tim: 'Tim Pelayanan Gereja', deskripsi: 'Koordinasi pelayan ibadah, usher, multimedia, dan pendukung pelayanan.', penanggung_jawab: 'Pengurus Gereja' },
    sekolah_minggu: { nama_tim: 'Sekolah Minggu', deskripsi: 'Pelayanan pembinaan iman anak dan generasi muda sejak dini.', penanggung_jawab: 'Koordinator Sekolah Minggu' },
    pemuda: { nama_tim: 'Revive Generation', deskripsi: 'Pembinaan karakter dan komunitas pemuda gereja.', penanggung_jawab: 'Koordinator Revive Generation' },
    kaum_ibu: { nama_tim: 'Kaum Ibu', deskripsi: 'Wadah pertumbuhan rohani dan pemberdayaan kaum wanita gereja.', penanggung_jawab: 'Koordinator Kaum Ibu' },
    pendalaman_alkitab: { nama_tim: 'Pendalaman Alkitab', deskripsi: 'Kelompok pembelajaran Firman Tuhan dan pertumbuhan iman.', penanggung_jawab: 'Koordinator PA' }
  })[key] || { nama_tim: 'Pelayanan Gereja', deskripsi: 'Bidang pelayanan GPI Cipayung.', penanggung_jawab: 'GPI Cipayung' };
}
function normalizeServices(rows) {
  const order = ['musik','pelayanan_gereja','sekolah_minggu','pemuda','kaum_ibu','pendalaman_alkitab'];
  const map = Object.create(null);
  (rows || []).forEach(r => {
    if (String(r.status || 'published') !== 'published') return;
    const key = serviceKey(r.nama_tim);
    const def = serviceDefaults(key);
    if (!map[key]) map[key] = { ...r, ...def, deskripsi: r.deskripsi || def.deskripsi, penanggung_jawab: /buka halaman/i.test(String(r.penanggung_jawab || '')) ? def.penanggung_jawab : (r.penanggung_jawab || def.penanggung_jawab) };
  });
  return order.filter(k => map[k]).map(k => map[k]).concat(Object.keys(map).filter(k => !order.includes(k)).map(k => map[k]));
}

function serviceHref(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('musik') || n.includes('singer')) return 'tim-musik';
  if (n.includes('pelayanan gereja') || n.includes('pengurus gereja') || n.includes('struktur')) return 'tim-pelayanan-gereja';
  if (n.includes('sekolah minggu')) return 'sekolah-minggu';
  if (n.includes('kaum ibu') || n.includes('wanita') || n.includes('wbi')) return 'kaum-ibu';
  if (n.includes('revive') || n.includes('pemuda') || n.includes('pemudi') || n.includes('youth')) return 'pelayanan-pemuda';
  if (n.includes('alkitab') || n.includes('pendalaman') || n === 'pa') return 'pendalaman-alkitab';
  return '#';
}
function renderPelayanan(rows) {
  const w = $('#pelayananGrid');
  if (!w) return;
  const data = normalizeServices(rows || []);
  if (!data.length) { w.innerHTML = '<div class="empty">Belum ada data pelayanan.</div>'; return; }
  const icons = ['music', 'users', 'book', 'heart', 'users', 'cross', 'media'];
  w.innerHTML = data.map((r, i) => {
    const href = serviceHref(r.nama_tim);
    const key = serviceKey(r.nama_tim);
    let small = r.penanggung_jawab || 'GPI Cipayung';
    if (/buka halaman/i.test(String(small))) small = serviceDefaults(key).penanggung_jawab || '';
    return `<a class="service-card service-card-link" data-service-key="${esc(key)}" ${href !== '#' ? `href="${href}" data-href="${href}" role="link" tabindex="0" onclick="event.preventDefault(); window.location.assign(this.dataset.href);"` : 'role="article"'}><span class="service-icon">${icon(icons[i % icons.length])}</span><h3>${esc(r.nama_tim || 'Pelayanan Gereja')}</h3><p>${esc(r.deskripsi || 'Bidang pelayanan GPI Cipayung.')}</p><small>${esc(small)}</small></a>`;
  }).join('');
}

function mediaAlbumName(title) {
  let t = String(title || 'Dokumentasi Gereja').trim() || 'Dokumentasi Gereja';
  // Jika hasil upload banyak file diberi format "Nama Kegiatan - nama-file", jadikan satu album.
  t = t.replace(/\s+-\s+[^-]+$/g, '').trim() || t;
  return t;
}

function mediaTypeFrom(row) {
  const direct = String(row.file_type || '').toLowerCase().trim();
  const path = String(row.file_path || '').split('?')[0].toLowerCase();
  const ext = path.includes('.') ? path.split('.').pop() : '';
  return direct || ext || '';
}

function renderMedia(rows) {
  const w = $('#mediaGrid');
  if (!w) return;
  const q = state.mediaQuery.trim().toLowerCase();
  const data = (q ? rows.filter(r => `${r.judul || ''} ${r.deskripsi || ''}`.toLowerCase().includes(q)) : rows)
    .filter(Boolean);
  if (!data.length) { w.innerHTML = '<div class="empty">Belum ada media yang dipublikasikan.</div>'; return; }

  const groups = Object.create(null);
  data.forEach(r => {
    const album = mediaAlbumName(r.judul);
    if (!groups[album]) groups[album] = [];
    groups[album].push(r);
  });

  w.innerHTML = Object.entries(groups).map(([album, items]) => {
    const cards = items.map((r, i) => {
      const t = mediaTypeFrom(r);
      const path = safeUrl(r.file_path || '');
      const title = r.judul || 'Media Gereja';
      const desc = r.deskripsi || 'Dokumentasi GPI Cipayung';
      const isImage = ['jpg','jpeg','png','webp','gif','bmp','avif','heic','heif'].includes(t);
      const isVideo = ['mp4','webm','mov','m4v'].includes(t);
      const badge = isVideo ? 'Video' : (isImage ? 'Foto' : 'Media');
      const initial = esc(String(title || 'G').trim().charAt(0).toUpperCase() || 'G');
      const placeholder = `<div class="media-tile-placeholder"><span>${initial}</span><small>GPI Cipayung</small></div>`;
      let preview = placeholder;
      if (isImage && path) {
        preview = `<img src="${esc(path)}" alt="${esc(title)}" loading="lazy" onerror="this.style.display='none';this.parentNode.classList.add('media-broken');">${placeholder}`;
      } else if (isVideo && path) {
        preview = `<video src="${esc(path)}" preload="metadata" muted playsinline controls></video>${placeholder}`;
      }
      const href = path || '#';
      const target = path ? ' target="_blank" rel="noopener"' : '';
      return `<article class="media-tile"><a href="${esc(href)}"${target} class="media-tile-link"><div class="media-square"><span class="media-type-badge">${esc(badge)}</span>${preview}</div><div class="media-tile-body"><h4>${esc(title)}</h4><p>${esc(desc)}</p></div></a></article>`;
    }).join('');
    return `<section class="media-album media-album-gallery"><div class="media-album-head media-album-head-elegant"><div><span class="label">Album Dokumentasi</span><h3>${esc(album)}</h3><p>Dokumentasi foto dan video kegiatan gereja dari dashboard admin.</p></div><span class="media-count">${items.length} file</span></div><div class="media-mosaic-grid">${cards}</div></section>`;
  }).join('');
}
function renderPengumuman(rows) {
  const w = $('#pengumumanList');
  if (!w) return;
  if (!rows.length) { w.innerHTML = '<div class="empty">Belum ada warta gereja yang dipublikasikan.</div>'; return; }
  w.innerHTML = rows.map(r => {const path=String(r.media_path||'');const valid=/^uploads\/media\/warta\/[a-zA-Z0-9_.-]+$/.test(path);const video=valid&&/\.(mp4|webm)$/i.test(path);const visual=valid?`<div class="warta-media">${video?`<video src="/${esc(path)}" controls preload="metadata" playsinline></video>`:`<img src="/${esc(path)}" loading="lazy" alt="${esc(r.judul)}">`}</div>`:'';return `<article class="announcement-card">${visual}<span class="warta-type">${esc(r.kategori_warta||'Umum')}</span><time>${fullDate(r.tanggal_publish)}</time><h3>${esc(r.judul || 'Pengumuman')}</h3><p>${esc(r.isi || '').replace(/\n/g, '<br>')}</p></article>`;}).join('');
}

function initials(n) {
  return String(n || 'GPI').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase();
}
function normalizeTeamRows(rows) {
  return (rows || [])
    .filter(r => String(r.status || 'published') === 'published')
    .map(r => ({ ...r, nama_lengkap: r.nama_tampil || r.nama_lengkap || '' }))
    .filter(r => r.nama_lengkap || r.tim || r.jabatan)
    .sort((a, b) => (Number(a.urutan) || 99) - (Number(b.urutan) || 99));
}

function publicTeamRow(r) {
  const out = { ...(r || {}) };
  const kategori = String(out.kategori || '');
  const tim = String(out.tim || '');
  const jabatan = String(out.jabatan || '');
  const nama = String(out.nama_lengkap || out.nama_tampil || '');
  if (out.nama_lengkap === 'Phb. H. Sitorus') out.nama_lengkap = 'St. H. Sitorus';
  if (kategori === 'pelayanan_gereja' && !/gembala/i.test(`${tim} ${jabatan}`)) {
    out.jabatan = /Ev\. D\. F\. Manurung/i.test(nama) ? 'Evangelis' : 'Hamba Tuhan';
  }
  return out;
}

function profilePhoto(r, opt = {}) {
  const p = opt.forceInitials ? '' : safeUrl(r.foto_path || '');
  const round = opt.round ? ' round' : '';
  const initialOnly = opt.forceInitials ? ' initial-only' : '';
  return `<div class="profile-photo${round}${initialOnly}">${p ? `<img src="${esc(p)}" alt="Foto ${esc(r.nama_lengkap || 'Pelayan')}">` : esc(initials(r.nama_lengkap))}</div>`;
}
function profileCard(r, opt = {}) {
  r = publicTeamRow(r);
  return `<article class="profile-card">${profilePhoto(r, opt)}<div class="profile-body"><h3>${esc(r.nama_lengkap || r.nama_tampil || 'Nama Pelayan')}</h3><p><span class="role-pill">${esc(r.jabatan || r.tim || 'Pelayan Gereja')}</span></p></div></article>`;
}
function renderTeamGrid(id, rows, opt = {}) {
  const w = $(id);
  if (!w) return;
  w.innerHTML = rows.length ? rows.map(r => profileCard(r, opt)).join('') : '<div class="empty">Data bagian ini belum diisi dari dashboard admin.</div>';
}
function groupOrFallback(all, fallback, predicate) {
  const live = all.filter(predicate);
  return live.length ? live : fallback.filter(predicate);
}

function renderPendalamanAlkitab(rows) {
  const w = $('#pendalamanGrid');
  if (!w) return;
  const data = (rows && rows.length ? rows : [
    { judul:'Cerita Alkitab untuk Pertumbuhan Iman', tipe:'cerita', ayat:'Mazmur 119:105', isi:'Firman Tuhan menjadi pelita dalam kehidupan. Jemaat diajak mengenal kehendak Tuhan dan menerapkannya dalam keluarga, pelayanan, dan kehidupan sehari-hari.', media_path:'', status:'published' },
    { judul:'Renungan Singkat: Hidup dalam Kasih', tipe:'renungan', ayat:'Yohanes 13:34-35', isi:'Kasih menjadi tanda murid Kristus. Materi ini dapat dipakai sebagai bahan diskusi kelompok kecil, sekolah minggu, atau pembinaan rohani keluarga.', media_path:'', status:'published' },
    { judul:'Materi Animasi Anak: Mengenal Doa', tipe:'animasi', ayat:'1 Tesalonika 5:17', isi:'Konten animasi rohani membantu anak dan remaja memahami pentingnya berdoa, bersyukur, dan membangun relasi dengan Tuhan.', media_path:'', status:'published' },
    { judul:'Galeri Kegiatan Pendalaman Alkitab', tipe:'foto', ayat:'', isi:'Bagian ini dapat diisi dokumentasi foto kegiatan PA, ibadah rumah tangga, dan pembinaan iman jemaat.', media_path:'assets/img/logo-gpi-cipayung.jpg', status:'published' }
  ]).filter(r => String(r.status || 'published') === 'published');
  w.innerHTML = data.length ? data.map(r => {
    const media = safeUrl(r.media_path || '');
    const visual = media ? `<img src="${esc(media)}" alt="${esc(r.judul || 'Pendalaman Alkitab')}">` : icon((String(r.tipe || '').toLowerCase().includes('foto') || String(r.tipe || '').toLowerCase().includes('animasi')) ? 'media' : 'book');
    return `<article class="pa-card"><div class="pa-visual">${visual}</div><div class="pa-body"><span class="label">${esc(r.tipe || 'Renungan')}</span><h3>${esc(r.judul || 'Materi Pendalaman Alkitab')}</h3>${r.ayat ? `<small class="role-pill">${esc(r.ayat)}</small>` : ''}<p>${esc(r.isi || '').replace(/\n/g,'<br>')}</p></div></article>`;
  }).join('') : '<div class="empty">Belum ada materi Pendalaman Alkitab.</div>';
}

function renderTeams(rows) {
  const all = normalizeTeamRows(rows);
  const fallback = normalizeTeamRows(fallbackTeams());
  const txt = r => `${r.tim || ''} ${r.jabatan || ''}`.trim();
  const isMusicText = r => /musik|keyboard|gitar|drum|bass/i.test(txt(r));
  const isSingerText = r => /singer|vocal|vokalis|pujian/i.test(txt(r));
  const isSekolah = r => String(r.kategori) === 'sekolah_minggu' || /sekolah minggu|guru sekolah|anak/i.test(txt(r));
  const isKaumIbu = r => String(r.kategori) === 'kaum_ibu' || /kaum ibu|wanita|sie\. doa|sie\. pemerhati/i.test(txt(r));
  const isPemuda = r => String(r.kategori) === 'pemuda' || /revive|pemuda|pemudi|youth|humas|kerohanian/i.test(txt(r));
  const isDiakonia = r => String(r.kategori) === 'diakonia' || /diakonia/i.test(txt(r));
  const isMedia = r => String(r.kategori) === 'media' || /media|publikasi|dokumentasi|konten|desain|video/i.test(txt(r));
  const isPlayer = r => String(r.kategori) === 'musik' && !/cadangan|reserve|singer|vocal|pujian/i.test(txt(r));
  const isReserve = r => String(r.kategori) === 'musik' && /cadangan|reserve/i.test(txt(r));
  const isSinger = r => String(r.kategori) === 'singer' || (String(r.kategori) !== 'media' && isSingerText(r));
  const isGembala = r => String(r.kategori) === 'pelayanan_gereja' && /gembala/i.test(txt(r));
  const isPelayan = r => String(r.kategori) === 'pelayanan_gereja'
    && !/gembala/i.test(txt(r))
    && !isSekolah(r) && !isKaumIbu(r) && !isPemuda(r) && !isDiakonia(r) && !isMedia(r) && !isMusicText(r) && !isSingerText(r);
  renderTeamGrid('#musicPlayerGrid', groupOrFallback(all, fallback, isPlayer));
  renderTeamGrid('#musicReserveGrid', groupOrFallback(all, fallback, isReserve));
  renderTeamGrid('#singerGrid', groupOrFallback(all, fallback, isSinger));
  renderTeamGrid('#gembalaGrid', groupOrFallback(all, fallback, isGembala), { round: true });
  renderTeamGrid('#pelayanGerejaGrid', groupOrFallback(all, fallback, isPelayan), { round: true });
  renderTeamGrid('#diakoniaGrid', groupOrFallback(all, fallback, isDiakonia), { round: true });
  renderTeamGrid('#mediaTeamGrid', groupOrFallback(all, fallback, isMedia));
  renderTeamGrid('#sekolahMingguGrid', groupOrFallback(all, fallback, isSekolah), { round: true });
  renderTeamGrid('#kaumIbuGrid', groupOrFallback(all, fallback, isKaumIbu), { round: true });
  renderTeamGrid('#pemudaGrid', groupOrFallback(all, fallback, isPemuda), { round: true });
}


const defaults = require('./defaults.json');
const capture = (fn, id, rows) => { fn(rows); return slots[id].innerHTML; };
const layout = (html,s) => html.replaceAll('__NAME__',esc(s.nama_gereja || 'GPI Cipayung')).replaceAll('assets/img/__LOGO__.jpg',esc(safeUrl(s.logo_path)||defaults.settings.logo_path));
function public_head(title,s) {return layout(defaults.head,s).replaceAll('__TITLE__',esc(title)).replace('</head>','<link rel="stylesheet" href="/assets/css/refresh.css?v=3"><link rel="stylesheet" href="/assets/css/fresh4.css?v=4"><link rel="stylesheet" href="/assets/css/website-docs.css?v=5"><link rel="stylesheet" href="/assets/css/revisi-2026.css?v=1"><link rel="stylesheet" href="/assets/css/support-2026.css?v=2"><link rel="stylesheet" href="/assets/css/fresh7-fixes.css?v=7"><script defer src="/assets/js/fresh4.js?v=4"></script><script defer src="/assets/js/refresh.js?v=3"></script><script defer src="/assets/js/connect.js?v=3"></script><script defer src="/assets/js/social-media.js?v=3"></script></head>');}
function public_header(s,active) {
  const nav=[['beranda','/','Beranda'],['tentang','/tentang','Gereja'],['jadwal','/jadwal-ibadah','Ibadah'],['pelayanan','/pelayanan','Pelayanan'],['media','/media','Media'],['pengumuman','/warta','Warta'],['memberi','/memberi','Memberi'],['kontak','/kontak','Terhubung']];
  return `<a class="skip-link" href="#main-content">Lewati ke konten</a><nav class="official-nav refresh-nav" aria-label="Navigasi utama"><div class="container"><a class="official-brand" href="/"><img data-logo-gereja src="${esc(pv_logo(s))}" alt="Logo GPI Cipayung"><span><strong data-nama-gereja>${esc(s.nama_gereja||'GPI Cipayung')}</strong><small>Gereja Pentakosta Indonesia</small></span></a><button class="nav-toggle" aria-label="Buka menu" aria-expanded="false" aria-controls="main-nav">☰</button><div class="official-links" id="main-nav">${nav.map(([key,url,name])=>`<a href="${url}"${active===key?' class="active" aria-current="page"':''}>${name}</a>`).join('')}</div></div></nav>`;
}
function public_footer(s) {
 const groups=[['GEREJA',[['Tentang Kami','/tentang'],['Jadwal Ibadah','/jadwal-ibadah'],['Pelayanan','/pelayanan'],['Tim Pelayan','/tim-pelayanan-gereja']]],['TERHUBUNG',[['Formulir Online','/terhubung'],['Permintaan Doa','/terhubung'],['Kesaksian','/terhubung'],['Pemberkatan Pernikahan','/terhubung'],['Penyerahan Anak','/terhubung']]],['INFORMASI',[['Warta Gereja','/warta'],['Acara Gereja','/#acara'],['Galeri Media','/media'],['Persembahan','/memberi']]],['MEDIA',[['YouTube','https://www.youtube.com/@gpisidangcipayung'],['Instagram','https://instagram.com/gpicipayung'],['Facebook','https://www.facebook.com/gpi.cipayung.5/']]]];
 return `<footer class="gpi-footer"><div class="container gpi-footer-inner"><div class="gpi-footer-brand"><a href="/" class="gpi-footer-logo"><img src="${esc(pv_logo(s))}" alt="Logo GPI Cipayung"><span><strong>GPI Cipayung</strong><small>Gereja Pentakosta Indonesia</small></span></a><p>Rumah untuk beribadah, bertumbuh dalam iman dan melayani bersama.</p><p>Jl. Tengki No.78, Cipayung, Jakarta Timur</p><a href="mailto:gpisidangcipayung@gmail.com">gpisidangcipayung@gmail.com</a></div><div class="gpi-footer-columns">${groups.map(([h,links])=>`<div class="gpi-footer-col"><h3>${h}</h3>${links.map(([t,u])=>`<a href="${esc(u)}" ${u.startsWith('https://')?'target="_blank" rel="noopener noreferrer"':''}>${esc(t)}</a>`).join('')}</div>`).join('')}</div></div><div class="gpi-footer-bottom"><div class="container"><span>© ${new Date().getFullYear()} GPI Cipayung. Hak cipta dilindungi.</span><span>Gereja Pentakosta Indonesia · Sidang Cipayung</span></div></div></footer>${require('node:fs').readFileSync(require('node:path').join(__dirname,'support-widget.html'),'utf8')}<script src="/assets/js/support-widget.js?v=2" defer></script><script src="/assets/js/public-html.js?v=5"></script></body></html>`;
}
const pv_logo = s => safeUrl(s.logo_path)||defaults.settings.logo_path;
function team_sections(rows) {renderTeams(rows); return Object.fromEntries(['musicPlayer','musicReserve','singer','gembala','pelayanGereja','diakonia','mediaTeam','sekolahMinggu','kaumIbu','pemuda'].map(k=>[k,slots['#'+k+'Grid'].innerHTML]));}
function roleGrid(rows,category,role,cls='') {const pred=r=>r.kategori===category && String(r.jabatan||'').trim().toLowerCase()===role.toLowerCase(); const matches=groupOrFallback(normalizeTeamRows(rows),normalizeTeamRows(defaults.teams),pred); return `<div class="org-role-block ${esc(cls)}"><h3 class="org-title">${esc(role)}</h3><div class="profile-grid org-grid org-role-grid">${matches.map(r=>profileCard(r,{round:true})).join('')||'<div class="empty">Data bagian ini belum diisi dari dashboard admin.</div>'}</div></div>`;}
function home_schedule_preview(rows) {return rows.map(r=>`<article class="home-schedule-item"><div class="home-date"><b>${dayNum(r.tanggal)}</b><span>${monthShort(r.tanggal)}</span></div><div><h3>${esc(r.jenis_ibadah||'Ibadah')}</h3><p>${esc(scheduleDay(r))}, ${dateLong(r.tanggal)} • ${timeRange(r)} WIB</p></div></article>`).join('')||'<div class="empty">Jadwal ibadah akan segera dipublikasikan.</div>';}
function render_pa(rows) {return (rows||[]).filter(r=>(r.status||'published')==='published').map(r=>{const t=String(r.tipe||'renungan').toLowerCase(), p=safeUrl(r.media_path), ext=p.split('?')[0].split('.').pop().toLowerCase(); let visual=icon(({cerita:'book',renungan:'cross',animasi:'media',foto:'media',video:'media'})[t]||'book'); if(p) visual=/^(jpg|jpeg|png|webp|gif|bmp|avif)$/.test(ext)?`<img src="${esc(p)}" alt="${esc(r.judul)}">`:/^(mp4|webm|mov)$/.test(ext)?`<video src="${esc(p)}" controls preload="metadata"></video>`:`<a class="pa-media-link" href="${esc(p)}" target="_blank" rel="noopener">${icon('media')}<span>Buka Media</span></a>`; return `<article class="pa-card"><div class="pa-visual">${visual}</div><div class="pa-body"><span class="label">${esc(t[0].toUpperCase()+t.slice(1))}</span><h3>${esc(r.judul)}</h3>${r.ayat?`<small class="role-pill">${esc(r.ayat)}</small>`:''}<p>${esc(r.isi).replace(/\n/g,'<br>')}</p></div></article>`;}).join('')||'<div class="empty">Belum ada materi Pendalaman Alkitab yang dipublikasikan.</div>';}
function meetLink() {const raw=String(process.env.DOA_PAGI_MEET_URL||'https://meet.google.com/ywm-oere-smt').trim();try{const u=new URL(raw);return u.protocol==='https:'&&u.hostname==='meet.google.com'&&/^\/[a-z]{3}-[a-z]{4}-[a-z]{3}\/?$/i.test(u.pathname)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
function prayerCard(){const url=meetLink();return `<article class="prayer-card"><div class="eyebrow">Doa bersama · Online</div><h2>Doa Pagi</h2><p>Sabtu · 05.00 WIB – selesai</p><p>Awali hari dengan doa, Firman Tuhan, dan persekutuan bersama.</p>${url?`<a class="refresh-button light" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Gabung Google Meet ↗</a>`:'<p class="meet-note">Tautan Google Meet belum tersedia.</p><a class="refresh-button light" href="/kontak">Hubungi gereja untuk link Meet ↗</a>'}</article>`;}
function ministryTabs(rows){return normalizeServices(rows).map((r,i)=>({name:r.nama_tim,description:r.deskripsi,href:serviceHref(r.nama_tim),key:serviceKey(r.nama_tim),index:i}));}
module.exports={contentImage:require('./website-content').imageUrl,contentDate:require('./website-content').dateLabel,connectChoices:require('./connect').choices,meetLink,prayerCard,ministryTabs,esc,public_head,public_header,public_footer,pv_logo,pv_esc:esc,pv_icon:icon,team_sections,roleGrid,home_schedule_preview,normalizeServices,render_jadwal:r=>capture(renderJadwal,'#jadwalList',r),render_pelayanan:r=>capture(renderPelayanan,'#pelayananGrid',r),render_media:r=>capture(renderMedia,'#mediaGrid',r),render_pengumuman:r=>capture(renderPengumuman,'#pengumumanList',r),render_pendalaman_alkitab:render_pa};
