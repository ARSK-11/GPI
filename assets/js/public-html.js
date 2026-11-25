const state = { csrf: '', data: null, mediaQuery: '' };
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
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

function fallbackTeams() {
  return [
    { kategori: 'musik', tim: 'Pemain Musik', nama_lengkap: 'Natalia Debora Sinaga', jabatan: 'Pemain Keyboard', urutan: 1, foto_path: '' },
    { kategori: 'musik', tim: 'Pemain Musik', nama_lengkap: 'Andre Siburian', jabatan: 'Pemain Gitar', urutan: 2, foto_path: '' },
    { kategori: 'musik', tim: 'Pemain Musik', nama_lengkap: 'Gideon Siburian', jabatan: 'Pemain Drum', urutan: 3, foto_path: 'assets/img/gideon.jpg' },
    { kategori: 'musik', tim: 'Pemain Musik', nama_lengkap: 'Yakub Rumahorbo', jabatan: 'Pemain Bass', urutan: 4, foto_path: '' },
    { kategori: 'musik', tim: 'Pemain Cadangan', nama_lengkap: 'David Sitompul', jabatan: 'Bass & Gitar', urutan: 5, foto_path: 'assets/img/david.jpg' },
    { kategori: 'musik', tim: 'Pemain Cadangan', nama_lengkap: 'Aaron Sinaga', jabatan: 'Keyboard & Drum', urutan: 6, foto_path: '' },
    { kategori: 'musik', tim: 'Pemain Cadangan', nama_lengkap: 'Johan Sihombing', jabatan: 'Gitar & Drum', urutan: 7, foto_path: 'assets/img/johan.jpg' },
    { kategori: 'singer', tim: 'Singers / Pujian', nama_lengkap: 'Septiana Sinaga', jabatan: 'Vocalist', urutan: 11, foto_path: 'assets/img/septiana.jpg' },
    { kategori: 'singer', tim: 'Singers / Pujian', nama_lengkap: 'Rahel Sitompul', jabatan: 'Vocalist', urutan: 12, foto_path: 'assets/img/rahel.jpg' },
    { kategori: 'singer', tim: 'Singers / Pujian', nama_lengkap: 'Isak Sinaga', jabatan: 'Vocalist', urutan: 13, foto_path: 'assets/img/isak.jpg' },
    { kategori: 'pelayanan_gereja', tim: 'Gembala Sidang', nama_lengkap: 'Pdt. E.H. Sinaga', jabatan: 'Gembala Sidang', urutan: 1, foto_path: '' },
    { kategori: 'pelayanan_gereja', tim: 'Pendamping & Pelayan Gereja', nama_lengkap: 'Ev. D. F. Manurung', jabatan: 'Evangelis', urutan: 2, foto_path: '' },
    { kategori: 'pelayanan_gereja', tim: 'Pendamping & Pelayan Gereja', nama_lengkap: 'Ibu Pdt. J. Sinaga', jabatan: 'Hamba Tuhan', urutan: 2, foto_path: '' },
    { kategori: 'pelayanan_gereja', tim: 'Pendamping & Pelayan Gereja', nama_lengkap: 'Gr. H. Sitorus', jabatan: 'Hamba Tuhan', urutan: 3, foto_path: '' },
    { kategori: 'pelayanan_gereja', tim: 'Pendamping & Pelayan Gereja', nama_lengkap: 'St. N. Sihombing', jabatan: 'Hamba Tuhan', urutan: 4, foto_path: '' },
    { kategori: 'pelayanan_gereja', tim: 'Pendamping & Pelayan Gereja', nama_lengkap: 'St. R. B. Rumahorbo', jabatan: 'Hamba Tuhan', urutan: 5, foto_path: '' },
    { kategori: 'pelayanan_gereja', tim: 'Pendamping & Pelayan Gereja', nama_lengkap: 'St. R. D. Sinaga', jabatan: 'Hamba Tuhan', urutan: 6, foto_path: '' },
    { kategori: 'pelayanan_gereja', tim: 'Pendamping & Pelayan Gereja', nama_lengkap: 'St. H. Sitorus', jabatan: 'Hamba Tuhan', urutan: 7, foto_path: '' },
    { kategori: 'pelayanan_gereja', tim: 'Pendamping & Pelayan Gereja', nama_lengkap: 'Ibu St. Siagian', jabatan: 'Hamba Tuhan', urutan: 8, foto_path: '' },
    { kategori: 'diakonia', tim: 'Diakonia Gereja', nama_lengkap: '(Belum Diisi)', jabatan: 'Ketua', urutan: 1, foto_path: '' },
    { kategori: 'diakonia', tim: 'Diakonia Gereja', nama_lengkap: '(Belum Diisi)', jabatan: 'Sekretaris', urutan: 2, foto_path: '' },
    { kategori: 'diakonia', tim: 'Diakonia Gereja', nama_lengkap: '(Belum Diisi)', jabatan: 'Keuangan', urutan: 3, foto_path: '' },
    { kategori: 'sekolah_minggu', tim: 'Sekolah Minggu', nama_lengkap: '(Belum Diisi)', jabatan: 'Koordinator Sekolah Minggu', urutan: 1, foto_path: '' },
    { kategori: 'sekolah_minggu', tim: 'Sekolah Minggu', nama_lengkap: '(Belum Diisi)', jabatan: 'Guru Sekolah Minggu', urutan: 2, foto_path: '' },
    { kategori: 'kaum_ibu', tim: 'Kaum Ibu', nama_lengkap: 'Ibu Pdt. J. Sinaga / Br. Nababan', jabatan: 'Pembina', urutan: 1, foto_path: 'assets/img/team/ibu-pdt-j-sinaga-br-nababan.svg' },
    { kategori: 'kaum_ibu', tim: 'Kaum Ibu', nama_lengkap: 'Ibu Lumbangaol / Br. Manurung', jabatan: 'Ketua', urutan: 2, foto_path: 'assets/img/team/ibu-lumbangaol-br-manurung.svg' },
    { kategori: 'kaum_ibu', tim: 'Kaum Ibu', nama_lengkap: 'Ibu Sihombing / Br. Sinaga', jabatan: 'Sekretaris', urutan: 3, foto_path: 'assets/img/team/ibu-sihombing-br-sinaga.svg' },
    { kategori: 'kaum_ibu', tim: 'Kaum Ibu', nama_lengkap: 'Ibu Siagian / Br. Sinaga', jabatan: 'Bendahara', urutan: 4, foto_path: 'assets/img/team/ibu-siagian-br-sinaga.svg' },
    { kategori: 'kaum_ibu', tim: 'Kaum Ibu', nama_lengkap: 'Ibu Gr. H. Sitorus / Br. Sihombing', jabatan: 'Sie. Doa', urutan: 5, foto_path: 'assets/img/team/ibu-gr-h-sitorus-br-sihombing.svg' },
    { kategori: 'kaum_ibu', tim: 'Kaum Ibu', nama_lengkap: 'Ibu St. Sinaga / Br. Sinaga', jabatan: 'Sie. Pemerhati', urutan: 6, foto_path: 'assets/img/team/ibu-st-sinaga-br-sinaga.svg' },
    { kategori: 'kaum_ibu', tim: 'Kaum Ibu', nama_lengkap: 'Ibu Pdt. E. H. Sinaga / Br. Nainggolan', jabatan: 'Anggota', urutan: 7, foto_path: 'assets/img/team/ibu-pdt-e-h-sinaga-br-nainggolan.svg' },
    { kategori: 'kaum_ibu', tim: 'Kaum Ibu', nama_lengkap: 'Ibu Ev. D. F. Manurung', jabatan: 'Anggota', urutan: 8, foto_path: 'assets/img/team/ibu-ev-d-f-manurung.svg' },
    { kategori: 'kaum_ibu', tim: 'Kaum Ibu', nama_lengkap: 'Ibu St. R. B. Rumahorbo / Br. Sitompul', jabatan: 'Anggota', urutan: 9, foto_path: 'assets/img/team/ibu-st-r-b-rumahorbo-br-sitompul.svg' },
    { kategori: 'kaum_ibu', tim: 'Kaum Ibu', nama_lengkap: 'Ibu St. Sinaga / Br. Simanjuntak', jabatan: 'Anggota', urutan: 10, foto_path: 'assets/img/team/ibu-st-sinaga-br-simanjuntak.svg' },
    { kategori: 'kaum_ibu', tim: 'Kaum Ibu', nama_lengkap: 'Ibu St. N. Sihombing / Br. Silitonga', jabatan: 'Anggota', urutan: 11, foto_path: 'assets/img/team/ibu-st-n-sihombing-br-silitonga.svg' },
    { kategori: 'pemuda', tim: 'Revive Generation', nama_lengkap: 'Bp. St. H. Sitorus', jabatan: 'Pembina', urutan: 1, foto_path: 'assets/img/team/bp-st-h-sitorus.svg' },
    { kategori: 'pemuda', tim: 'Revive Generation', nama_lengkap: 'Gideon Ferdinan Siburian, S.Pd', jabatan: 'Ketua', urutan: 2, foto_path: 'assets/img/gideon.jpg' },
    { kategori: 'pemuda', tim: 'Revive Generation', nama_lengkap: 'Imell Warnita Sihombing', jabatan: 'Sekretaris', urutan: 3, foto_path: 'assets/img/team/imell-warnita-sihombing.svg' },
    { kategori: 'pemuda', tim: 'Revive Generation', nama_lengkap: 'Zefanya Manurung', jabatan: 'Bendahara', urutan: 4, foto_path: 'assets/img/team/zefanya-manurung.svg' },
    { kategori: 'pemuda', tim: 'Revive Generation', nama_lengkap: 'Abygail Septiani Rumahorbo', jabatan: 'Kerohanian', urutan: 5, foto_path: 'assets/img/team/abygail-septiani-rumahorbo.svg' },
    { kategori: 'pemuda', tim: 'Revive Generation', nama_lengkap: 'Yosia Natanael Siagian', jabatan: 'Humas', urutan: 6, foto_path: 'assets/img/team/yosia-natanael-siagian.svg' },
    { kategori: 'pemuda', tim: 'Revive Generation', nama_lengkap: 'Taruli Abigael Kristina Samosir', jabatan: 'Humas', urutan: 7, foto_path: 'assets/img/team/taruli-abigael-kristina-samosir.svg' },
    { kategori: 'media', tim: 'Media Gereja', nama_lengkap: 'Johan Sihombing', jabatan: 'Koordinator Media', urutan: 1, foto_path: '' },
    { kategori: 'media', tim: 'Media Gereja', nama_lengkap: 'Septiana Sinaga', jabatan: 'Publikasi', urutan: 2, foto_path: 'assets/img/septiana.jpg' },
    { kategori: 'media', tim: 'Media Gereja', nama_lengkap: 'Rahel Sitompul', jabatan: 'Dokumentasi', urutan: 3, foto_path: 'assets/img/rahel.jpg' },
    { kategori: 'media', tim: 'Media Gereja', nama_lengkap: 'David Sitompul', jabatan: 'Teknis Media', urutan: 4, foto_path: '' },
    { kategori: 'media', tim: 'Media Gereja', nama_lengkap: 'Isak Sinaga', jabatan: 'Konten Digital', urutan: 5, foto_path: 'assets/img/isak.jpg' }
  ];
}
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

async function loadPublicData(show = false) {
  if (show) {
    if ($('#jadwalList')) $('#jadwalList').innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
    if ($('#pelayananGrid')) $('#pelayananGrid').innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
  }
  try {
    const res = await fetch(`/api?action=public_bootstrap&_=${Date.now()}`, { cache: 'no-store' });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal memuat data');
    state.data = json.data || {};
    state.csrf = state.data.csrf_token || state.csrf;
    renderAll(state.data);
  } catch (e) {
    console.warn('Menggunakan data fallback publik:', e.message);
    const data = fallbackData();
    state.data = data;
    state.csrf = data.csrf_token || '';
    renderAll(data);
  }
}
function renderAll(data) {
  renderSettings(data.settings || {});
  renderStats(data.stats || {});
  renderJadwal(data.jadwal || []);
  renderPelayanan(data.pelayanan || []);
  renderMedia(data.media || []);
  renderPengumuman(data.pengumuman || []);
  renderTeams(data.tim_pelayan || []);
}
function renderSettings(s) {
  const logo = safeUrl(s.logo_path) || 'assets/img/logo-gpi-cipayung.jpg';
  $$('[data-logo-gereja]').forEach(el => el.src = logo);
  $$('[data-nama-gereja]').forEach(el => el.textContent = s.nama_gereja || 'GPI Cipayung');
  $$('[data-alamat-gereja]').forEach(el => el.textContent = s.alamat_gereja || 'Cipayung, Jakarta Timur');
  $$('[data-telepon-gereja]').forEach(el => el.textContent = s.telepon_gereja || '08xxxxxxxxxx');
  $$('[data-email-gereja]').forEach(el => el.textContent = s.email_gereja || 'admin@gpicipayung.local');
}
function renderStats(st) {
  Object.entries({ statJadwal: st.jadwal || 0, statPengumuman: st.pengumuman || 0, statMedia: st.media || 0, statPelayanan: st.pelayanan || 0 }).forEach(([id, v]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  });
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
  w.innerHTML = rows.map(r=>{const path=String(r.media_path||'');const valid=/^uploads\/media\/warta\/[a-zA-Z0-9_.-]+$/.test(path),video=valid&&/\.(mp4|webm)$/i.test(path);const visual=valid?`<div class="warta-media">${video?`<video src="/${esc(path)}" controls preload="metadata" playsinline></video>`:`<img src="/${esc(path)}" alt="${esc(r.judul)}" loading="lazy">`}</div>`:'';return `<article class="announcement-card">${visual}<span class="warta-type">${esc(r.kategori_warta||'Umum')}</span><time>${fullDate(r.tanggal_publish)}</time><h3>${esc(r.judul||'Pengumuman')}</h3><p>${esc(r.isi||'').replace(/\n/g,'<br>')}</p></article>`;}).join('');
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

async function submitForm(action, form, msgSel) {
  const msg = $(msgSel);
  if (msg) { msg.textContent = ''; msg.className = 'form-msg'; }
  const btn = form.querySelector('button[type="submit"]');
  const old = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Mengirim...'; }
  try {
    const body = new FormData(form);
    body.append('action', action);
    body.append('csrf_token', state.csrf);
    const res = await fetch('/api', { method: 'POST', body });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Gagal mengirim data');
    form.reset();
    if (msg) { msg.textContent = json.message || 'Berhasil dikirim.'; msg.className = 'form-msg success'; }
  } catch (e) {
    if (msg) { msg.textContent = e.message; msg.className = 'form-msg danger'; }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = old; }
  }
}
function initPublic() {
  setTimeout(() => loadPublicData(true), 0);
  setInterval(() => loadPublicData(false), 25000);
  $('.nav-toggle')?.addEventListener('click', e => { const open=$('.official-links')?.classList.toggle('show');e.currentTarget.setAttribute('aria-expanded',String(Boolean(open))); });
  $('#mediaSearch')?.addEventListener('input', e => { state.mediaQuery = e.target.value; renderMedia(state.data?.media || []); });
  $('#messageForm')?.addEventListener('submit', e => { e.preventDefault(); submitForm('public_message', e.currentTarget, '#messageMsg'); });
  $('#mediaUploadForm')?.addEventListener('submit', e => { e.preventDefault(); submitForm('public_media_upload', e.currentTarget, '#uploadMsg'); });
  $('#chatOpen')?.addEventListener('click', () => $('#chatBox')?.classList.add('show'));
  $('#chatClose')?.addEventListener('click', () => $('#chatBox')?.classList.remove('show'));
  $('#chatForm')?.addEventListener('submit', e => { e.preventDefault(); submitForm('public_message', e.currentTarget, '#chatMsg'); });
}
document.addEventListener('DOMContentLoaded', initPublic);

// data-href delegation for service cards: memastikan card pelayanan bisa diklik penuh.
document.addEventListener('click', function (e) {
  const card = e.target.closest && e.target.closest('.service-card-link[data-href]');
  if (!card) return;
  const href = card.getAttribute('data-href');
  if (href) { e.preventDefault(); window.location.href = href; }
});
