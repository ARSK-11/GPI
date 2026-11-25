'use strict';
// Bantuan publik dan percakapan dua arah GPI Cipayung. Tidak menggunakan API pihak ketiga.
const express = require('express');
const crypto = require('node:crypto');
const db = require('./repository');
const router = express.Router();
const error = (message,status=422)=>Object.assign(new Error(message),{status});
const seed = [
 ['formulir-terhubung','Formulir Terhubung','Formulir Online','Kirim permohonan doa, baptis, kesaksian dan pelayanan lainnya.','Buka halaman Terhubung, pilih jenis permohonan, lalu isi data dan kontak yang dapat dihubungi. Admin, Majelis, atau Pendeta gereja akan menindaklanjuti permohonan Anda.','/terhubung'],
 ['pemberkatan-pernikahan','Pengajuan Pemberkatan Pernikahan','Formulir Online','Informasi pengajuan pemberkatan pernikahan.','Pilih Pemberkatan Pernikahan di halaman Terhubung. Isilah informasi jemaat/pasangan, kelompok persekutuan, dan rencana tanggal pemberkatan. Pengajuan akan ditinjau oleh pengurus; mengisi formulir bukan berarti jadwal sudah disetujui.','/terhubung'],
 ['penyerahan-anak','Pengajuan Penyerahan Anak','Formulir Online','Ajukan permohonan penyerahan anak.','Di halaman Terhubung, pilih Penyerahan Anak lalu lengkapi data dan kontak Anda. Pengurus gereja akan menghubungi Anda terkait tindak lanjut.','/terhubung'],
 ['doa-konseling','Permintaan Doa dan Konseling','Pelayanan Jemaat','Kirimkan pokok doa atau permintaan konseling.','Pilih Permintaan Doa / Konseling pada halaman Terhubung, lengkapi formulir dan isi pokok doa. Informasi permohonan hanya diproses melalui portal internal gereja.','/terhubung'],
 ['jadwal-ibadah','Jadwal Ibadah GPI Cipayung','Ibadah','Lihat jadwal kebaktian dan kegiatan ibadah.','Kunjungi halaman Ibadah untuk melihat jadwal yang dipublikasikan pengurus. Perubahan jadwal dapat diumumkan pada halaman Warta.','/jadwal-ibadah'],
 ['warta-gereja','Warta Gereja dan Pengumuman','Informasi','Lihat pengumuman, pelayanan dan ulang tahun.','Berita dan pengumuman pelayanan, kegiatan, ulang tahun serta media warta yang sudah dipublikasikan tersedia di halaman Warta Gereja.','/warta'],
 ['persembahan','Informasi Persembahan','Informasi','Temukan informasi pemberian dan rekening resmi.','Silakan melihat halaman Memberi untuk informasi persembahan yang dipublikasikan GPI Cipayung. Pastikan nama rekening sesuai dengan yang tertera di situs resmi gereja.','/memberi'],
 ['hubungi-admin','Bagaimana Menghubungi Admin?','Bantuan','Memulai percakapan pribadi dengan petugas gereja.','Klik tombol chat di kanan bawah website, pilih Pesan, lalu isi formulir nama, kota, departemen, dan nomor telepon. Setelah mengirim pesan, balasan pengurus akan muncul di jendela percakapan selama akses percakapan masih tersimpan pada perangkat Anda.','/terhubung']
];
let initPromise;
function ensureSupport(){if(!initPromise)initPromise=(async()=>{
 await db.query(`CREATE TABLE IF NOT EXISTS support_articles (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(90) NOT NULL UNIQUE,
 title VARCHAR(180) NOT NULL, category VARCHAR(80) NOT NULL, summary VARCHAR(360) NOT NULL,
 body TEXT NOT NULL, link_path VARCHAR(300) NOT NULL DEFAULT '', active TINYINT(1) NOT NULL DEFAULT 1,
 sort_order INT NOT NULL DEFAULT 100, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_active_category (active,category,sort_order)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
 await db.query(`CREATE TABLE IF NOT EXISTS support_threads (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, visitor_token_hash CHAR(64) NOT NULL UNIQUE,
 visitor_name VARCHAR(160) NOT NULL, city VARCHAR(120) NOT NULL,
 department VARCHAR(120) NOT NULL, phone VARCHAR(40) NOT NULL, email VARCHAR(160) NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'baru', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 KEY idx_activity (last_message_at), KEY idx_status (status,last_message_at)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
 await db.query(`CREATE TABLE IF NOT EXISTS support_messages (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, thread_id BIGINT UNSIGNED NOT NULL,
 sender VARCHAR(16) NOT NULL, body TEXT NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_thread_messages(thread_id,id),
 CONSTRAINT fk_support_thread FOREIGN KEY (thread_id) REFERENCES support_threads(id) ON DELETE CASCADE
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
 for(let i=0;i<seed.length;i++){
  await db.query('INSERT IGNORE INTO support_articles (slug,title,category,summary,body,link_path,sort_order) VALUES (?,?,?,?,?,?,?)',[...seed[i],i+1]);
 }
 })().catch(e=>{initPromise=null;throw e;});return initPromise;}
function field(v,max,label,required=false){if(typeof v!=='string')v='';const x=v.trim();if(required&&!x)throw error(label+' wajib diisi.');if(x.length>max)throw error(label+' terlalu panjang.');return x;}
function signup(d){const p={visitor_name:field(d.nama,160,'Nama',true),city:field(d.kota,120,'Kota',true),department:field(d.departemen,120,'Departemen',true),phone:field(d.telepon,40,'Nomor telepon',true),email:field(d.email,160,'Email')};if(!/^\+?[0-9 ()-]{7,40}$/.test(p.phone))throw error('Nomor telepon tidak valid.');if(p.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email))throw error('Format email tidak valid.');if(d.persetujuan!=='1')throw error('Persetujuan privasi wajib dicentang.');return p;}
function textBody(d){return field(d.pesan,4000,'Pesan',true);}
function digest(token){return crypto.createHash('sha256').update(token).digest('hex');}
function validToken(t){if(typeof t!=='string'||!/^[a-f0-9]{64}$/.test(t))throw error('Akses percakapan tidak valid.',403);return t;}
function csrfOK(req){const a=String(req.get('X-CSRF-Token')||req.body?.csrf_token||'');const b=String(req.session?.csrf||'');const x=Buffer.from(a),y=Buffer.from(b);return x.length>0&&x.length===y.length&&crypto.timingSafeEqual(x,y);}
async function authorizedThread(id,token){const t=(await db.query('SELECT * FROM support_threads WHERE id=? AND visitor_token_hash=?',[id,digest(validToken(token))]))[0];if(!t)throw error('Percakapan tidak ditemukan.',404);return t;}
function staff(req){if(!db.can(req.session.user,'pesan','view'))throw error('Anda tidak memiliki izin untuk mengakses pesan.',403);}
function requireMethod(req,m){if(req.method!==m)throw error('Metode tidak diizinkan.',405);}
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
router.use(async(req,res,next)=>{try{await ensureSupport();next();}catch(e){next(e);}});
router.get('/csrf',(req,res)=>{req.session.csrf ||= crypto.randomBytes(32).toString('hex');res.json({success:true,csrf_token:req.session.csrf});});
router.get('/articles',async(req,res,next)=>{try{
 const q=field(req.query.q,120,'Pencarian').toLowerCase();let rows=await db.query('SELECT id,slug,title,category,summary,body,link_path FROM support_articles WHERE active=1 ORDER BY sort_order ASC,id ASC LIMIT 100');
 if(q)rows=rows.filter(r=>[r.title,r.category,r.summary,r.body].some(v=>String(v||'').toLowerCase().includes(q)));
 res.json({success:true,articles:rows.slice(0,30)});
 }catch(e){next(e);}});
router.post('/start',async(req,res,next)=>{try{
 requireMethod(req,'POST');if(!csrfOK(req))throw error('Token keamanan tidak valid. Muat ulang website.',419);
 if(req.body.website)throw error('Permintaan tidak valid.');
 if(Date.now()-(req.session.supportStarted||0)<10000)throw error('Mohon tunggu sebelum membuka percakapan lain.',429);
 const d=signup(req.body);const token=crypto.randomBytes(32).toString('hex');
 const result=await db.query('INSERT INTO support_threads (visitor_token_hash,visitor_name,city,department,phone,email) VALUES (?,?,?,?,?,?)',[digest(token),d.visitor_name,d.city,d.department,d.phone,d.email||null]);
 req.session.supportStarted=Date.now();
 res.json({success:true,id:String(result.insertId),token,message:'Percakapan dibuat. Silakan tuliskan pesan Anda.'});
 }catch(e){next(e);}});
router.get('/thread',async(req,res,next)=>{try{
 const id=Number(req.query.id);if(!Number.isSafeInteger(id)||id<1)throw error('ID percakapan tidak valid.');
 const t=await authorizedThread(id,req.query.token);const messages=await db.query('SELECT id,sender,body,created_at FROM support_messages WHERE thread_id=? ORDER BY id ASC LIMIT 300',[id]);
 res.json({success:true,thread:{id:String(t.id),status:t.status,nama:t.visitor_name},messages});
 }catch(e){next(e);}});
router.post('/message',async(req,res,next)=>{try{
 if(!csrfOK(req))throw error('Token keamanan tidak valid. Muat ulang website.',419);
 const id=Number(req.body.id);if(!Number.isSafeInteger(id)||id<1)throw error('ID tidak valid.');
 const t=await authorizedThread(id,req.body.token);if(t.status==='selesai')throw error('Percakapan telah ditutup. Silakan mulai percakapan baru.');
 if(Date.now()-(req.session.supportLastMessage||0)<1000)throw error('Tunggu sebentar sebelum mengirim pesan berikutnya.',429);
 const message=textBody(req.body);await db.transaction(async conn=>{
  await db.query('INSERT INTO support_messages (thread_id,sender,body) VALUES (?,\'visitor\',?)',[id,message],conn);
  await db.query("UPDATE support_threads SET status=IF(status='selesai','selesai','baru'),last_message_at=CURRENT_TIMESTAMP WHERE id=?",[id],conn);
 });req.session.supportLastMessage=Date.now();res.json({success:true,message:'Pesan terkirim ke admin.'});
 }catch(e){next(e);}});
router.get('/admin/threads',async(req,res,next)=>{try{staff(req);const rows=await db.query(`SELECT t.id,t.visitor_name,t.city,t.department,t.phone,t.email,t.status,t.created_at,t.last_message_at,
 (SELECT m.body FROM support_messages m WHERE m.thread_id=t.id ORDER BY m.id DESC LIMIT 1) AS latest_message
 FROM support_threads t ORDER BY t.last_message_at DESC LIMIT 200`);res.json({success:true,threads:rows});}catch(e){next(e);}});
router.get('/admin/thread',async(req,res,next)=>{try{staff(req);const id=Number(req.query.id);if(!Number.isSafeInteger(id)||id<1)throw error('ID tidak valid.');const thread=(await db.query('SELECT id,visitor_name,city,department,phone,email,status FROM support_threads WHERE id=?',[id]))[0];if(!thread)throw error('Percakapan tidak ditemukan.',404);const messages=await db.query('SELECT id,sender,body,created_at FROM support_messages WHERE thread_id=? ORDER BY id ASC LIMIT 300',[id]);res.json({success:true,thread,messages});}catch(e){next(e);}});
router.post('/admin/reply',async(req,res,next)=>{try{staff(req);if(!db.can(req.session.user,'pesan','update'))throw error('Tidak berhak membalas.',403);if(!csrfOK(req))throw error('Token keamanan tidak valid.',419);const id=Number(req.body.id);if(!Number.isSafeInteger(id)||id<1)throw error('ID tidak valid.');const message=textBody(req.body);await db.transaction(async conn=>{
 const t=(await db.query('SELECT id FROM support_threads WHERE id=? FOR UPDATE',[id],conn))[0];if(!t)throw error('Percakapan tidak ditemukan.',404);
 await db.query("INSERT INTO support_messages (thread_id,sender,body) VALUES (?,'admin',?)",[id,message],conn);
 await db.query("UPDATE support_threads SET status='ditangani',last_message_at=CURRENT_TIMESTAMP WHERE id=?",[id],conn);
 });res.json({success:true,message:'Balasan berhasil dikirim.'});}catch(e){next(e);}});
router.post('/admin/status',async(req,res,next)=>{try{staff(req);if(!db.can(req.session.user,'pesan','update'))throw error('Tidak berhak mengubah status.',403);if(!csrfOK(req))throw error('Token keamanan tidak valid.',419);const id=Number(req.body.id),status=String(req.body.status||'');if(!Number.isSafeInteger(id)||id<1||!['baru','ditangani','selesai'].includes(status))throw error('Data status tidak valid.');await db.query('UPDATE support_threads SET status=? WHERE id=?',[status,id]);res.json({success:true,message:'Status diperbarui.'});}catch(e){next(e);}});
router.get('/admin/articles',async(req,res,next)=>{try{staff(req);res.json({success:true,articles:await db.query('SELECT * FROM support_articles ORDER BY sort_order,id')});}catch(e){next(e);}});
router.post('/admin/article',async(req,res,next)=>{try{staff(req);if(!db.can(req.session.user,'pesan','update'))throw error('Tidak berhak mengubah artikel.',403);if(!csrfOK(req))throw error('Token keamanan tidak valid.',419);
 const d=req.body,id=Number(d.id)||0,title=field(d.title,180,'Judul',true),category=field(d.category,80,'Kategori',true),summary=field(d.summary,360,'Ringkasan',true),body=field(d.body,12000,'Isi artikel',true),link=field(d.link_path,300,'Tautan');if(link&&!/^\/(?!\/)[a-zA-Z0-9\/#?=&._%-]*$/.test(link))throw error('Gunakan tautan internal yang valid, dimulai dengan /.');const active=d.active===false||d.active===0||d.active==='0'?0:1;
 if(id){await db.query('UPDATE support_articles SET title=?,category=?,summary=?,body=?,link_path=?,active=? WHERE id=?',[title,category,summary,body,link,active,id]);}
 else {const slug='artikel-'+crypto.randomBytes(7).toString('hex');await db.query('INSERT INTO support_articles (slug,title,category,summary,body,link_path,active,sort_order) VALUES (?,?,?,?,?,?,?,100)',[slug,title,category,summary,body,link,active]);}
 res.json({success:true,message:'Artikel bantuan tersimpan.'});}catch(e){next(e);}});
router.use((e,req,res,next)=>{console.error('SUPPORT:',e.message);res.status(e.status||500).json({success:false,message:e.status?e.message:process.env.NODE_ENV==='production'?'Layanan bantuan mengalami kendala.':e.message});});
module.exports={router,ensureSupport,signup,textBody,validToken};
