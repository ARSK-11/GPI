'use strict';
require('dotenv').config();
const path=require('node:path');
const crypto=require('node:crypto');
const express=require('express');
const session=require('express-session');
const MySQLStore=require('express-mysql-session')(session);
const bcrypt=require('bcryptjs');
const db=require('./app/repository');
const view=require('./app/public-view');
const nav=require('./app/nav.json');
const {router,token,csrfOK}=require('./app/api');
const support=require('./app/support-center');
const wa=require('./app/whatsapp');
const social=require('./app/social-media');
const website=require('./app/website-content');
const docs=require('./app/website-documentation');
const driveGallery=require('./app/drive-gallery');
const app=express();
const prod=process.env.NODE_ENV==='production';
const secret=process.env.SESSION_SECRET||crypto.randomBytes(32).toString('hex');
if(prod&&!process.env.SESSION_SECRET)throw Error('SESSION_SECRET wajib diisi pada produksi.');
if(prod)app.set('trust proxy',1);
app.disable('x-powered-by');
app.set('view engine','ejs');app.set('views',path.join(__dirname,'views'));
app.use((req,res,next)=>{res.set('X-Content-Type-Options','nosniff');res.set('Referrer-Policy','strict-origin-when-cross-origin');res.set('X-Frame-Options','SAMEORIGIN');next();});
// Serve bundled assets through a route handler instead of express.static so the files
// also load on Vercel, where express.static() is ignored (the files are kept in the
// function bundle through includeFiles in vercel.json).
function staticAssets(folder){
 return (req,res,next)=>{
  let rel;try{rel=decodeURIComponent(req.path);}catch{return res.sendStatus(400);}
  if(!rel||rel.split('/').some(s=>s.startsWith('.')))return res.sendStatus(404);
  res.set('Cache-Control','public, max-age=300');
  res.sendFile(rel,{root:path.join(__dirname,folder),dotfiles:'deny'},e=>{if(e&&!res.headersSent)res.sendStatus(e.status||404);});
 };
}
app.use('/assets',staticAssets('assets'));
app.use('/templates',staticAssets('templates'));
app.use(express.urlencoded({extended:false,limit:'20mb'}));app.use(express.json({limit:'20mb'}));
const store=prod?new MySQLStore({...db.config,createDatabaseTable:true}):undefined;
// Secure cookies require HTTPS. Behind a TLS proxy this is automatic; set
// SESSION_COOKIE_SECURE=0 only when the app is opened directly over plain HTTP.
const secureCookie=prod&&process.env.SESSION_COOKIE_SECURE!=='0';
app.use(session({name:'gpi_cipayung_session',secret,resave:false,saveUninitialized:false,...(store?{store}:{}),cookie:{httpOnly:true,sameSite:'lax',secure:secureCookie,maxAge:8*60*60*1000}}));
// Check the account on each authenticated request; role changes/revocation take effect immediately.
app.use(async(req,res,next)=>{try{if(req.session.user){const u=(await db.query('SELECT id,username,nama_lengkap,role,status FROM users WHERE id=?',[req.session.user.id]))[0];if(!u||u.status!=='aktif')delete req.session.user;else req.session.user={id:u.id,username:u.username,nama_lengkap:u.nama_lengkap,role:u.role};}next();}catch(e){next(e);}});
app.get('/social/:kind',async(req,res,next)=>{if(!['youtube','instagram'].includes(req.params.kind))return res.sendStatus(404);try{res.set('Cache-Control','public, max-age=60');res.json(await social.feed(req.params.kind));}catch(e){next(e);}});
app.use('/support-api',support.router);
app.use(['/api','/api.php'],router);
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
const requireLogin=(req,res,next)=>req.session.user?next():res.redirect('/login');
const safeJSON=x=>JSON.stringify(x).replace(/[<>&\u2028\u2029]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
const common={e:view.esc,APP_NAME:'GPI Cipayung',assetVersion:'7',assetCss:'7',assetJs:'9',safeJSON};
const publicPages=['index','tentang','jadwal-ibadah','pelayanan','media','pengumuman','kontak','tim-musik','tim-pelayanan-gereja','sekolah-minggu','kaum-ibu','pelayanan-pemuda','pendalaman-alkitab','doa-pagi','memberi'];
for(const page of publicPages){app.get([page==='index'?'/':'/'+page,'/'+page+'.html','/'+page+'.php',...(page==='index'?['/index']:[]),...(page==='pengumuman'?['/warta']:[]),...(page==='kontak'?['/terhubung']:[])],wrap(async(req,res)=>{const data=await db.publicPayload(token(req));const s=data.settings;const team=view.team_sections(data.tim_pelayan);if(page==='kontak')res.set('Cache-Control','no-store');res.render(page,{...view,data,s,st:data.stats,team,nextSchedules:data.jadwal.slice(0,3),renderRole:(role,cls)=>view.roleGrid(data.tim_pelayan,page==='kaum-ibu'?'kaum_ibu':'pemuda',role,cls)});}));}
app.get('/ibadah-:slug',wrap(async(req,res)=>{const data=await db.publicPayload(token(req));if(data.website_error)return res.status(503).send('Konten ibadah sementara tidak tersedia. Periksa database.');const service=data.ibadah_konten.find(r=>r.slug===req.params.slug);if(!service)return res.status(404).send('Halaman ibadah tidak ditemukan.');res.render('ibadah-detail',{...view,data,s:data.settings,service,serviceDocs:(data.dokumentasi||[]).filter(x=>x.service_id===service.id),docs});}));
app.get('/acara-:slug',wrap(async(req,res)=>{const data=await db.publicPayload(token(req));if(data.website_error)return res.status(503).send('Konten acara sementara tidak tersedia. Periksa database.');const event=data.acara.find(r=>r.slug===req.params.slug);if(!event)return res.status(404).send('Acara tidak ditemukan.');res.render('acara-detail',{...view,data,s:data.settings,event});}));
app.get(['/login','/login.php'],(req,res)=>{if(req.session.user)return res.redirect('/admin');res.set('Cache-Control','no-store');res.render('login',{...common,csrf:token(req),error:''});});
app.post(['/login','/login.php'],wrap(async(req,res)=>{if(req.session.user)return res.redirect('/admin');let error='';try{if(!csrfOK(req))error='Token keamanan tidak valid. Refresh halaman.';else{const u=(await db.query('SELECT id,username,password_hash,nama_lengkap,role,status FROM users WHERE username=? LIMIT 1',[String(req.body.username||'').trim()]))[0];const hash=u?.password_hash?.replace(/^\$2y\$/,'$2b$');if(!u||u.status!=='aktif'||!await bcrypt.compare(String(req.body.password||''),hash))error='Username atau password salah.';else{await new Promise((resolve,reject)=>req.session.regenerate(e=>e?reject(e):resolve()));req.session.user={id:u.id,username:u.username,nama_lengkap:u.nama_lengkap,role:u.role};token(req);await db.update('users',Number(u.id),{last_login_at:db.now()}).catch(()=>{});return res.redirect('/admin');}}}catch(e){console.error(e.message);error='Login gagal. Periksa koneksi database.';}res.status(401).render('login',{...common,csrf:token(req),error});}));
app.get(['/admin','/admin.php'],requireLogin,wrap(async(req,res)=>{const user=req.session.user;const initialData=await db.bootstrap(user);res.set('Cache-Control','no-store');res.render('admin',{...common,csrf:token(req),user,initialData,permissions:initialData.permissions,roleLabel:db.roleLabel(user.role),navItems:nav.items,nav_icon:k=>nav.icons[k]||''});}));
app.post('/logout',requireLogin,(req,res,next)=>{if(!csrfOK(req))return res.status(419).send('Token keamanan tidak valid.');req.session.destroy(e=>{if(e)return next(e);res.clearCookie('gpi_cipayung_session');res.redirect('/login');});});
app.post('/whatsapp-cron',requireLogin,wrap(async(req,res)=>{if(db.roleKey(req.session.user.role)!=='admin')return res.sendStatus(403);if(!csrfOK(req))return res.sendStatus(419);res.type('text').send('Selesai. Jadwal diproses: '+await wa.cron());}));
// Only approved uploads are served publicly. Internal users may view pending media according to role.
app.get('/uploads/media/warta/:name',wrap(async(req,res)=>{
 const name=req.params.name;if(!/^[a-zA-Z0-9_.-]+$/.test(name))return res.sendStatus(404);
 await db.ensureWarta();const records=await db.query('SELECT status FROM pengumuman WHERE media_path=?',['uploads/media/warta/'+name]);
 if(!records.some(r=>r.status==='published')&&!(records.length&&db.can(req.session.user,'pengumuman')))return res.sendStatus(404);
 if(!records.length)return res.sendStatus(404);res.set('Cache-Control','private,max-age=300');res.sendFile(name,{root:path.join(__dirname,'uploads/media/warta'),dotfiles:'deny'},e=>{if(e&&!res.headersSent)res.sendStatus(e.status||404);});
}));
app.get('/documentation/drive/:id',wrap(async(req,res)=>{
 const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<=0)return res.sendStatus(404);
 await db.ensureWebsite();
 const rows=await db.query(`SELECT d.drive_id FROM website_documentation d INNER JOIN website_services s ON s.id=d.service_id WHERE d.id=? AND d.source='drive_folder' AND d.status='published' AND s.status='published' LIMIT 1`,[id]);
 if(!rows.length)return res.sendStatus(404);
 try{res.set('Cache-Control','public,max-age=300');res.json(await driveGallery.listing(rows[0].drive_id));}
 catch(e){console.error('Drive folder sync:',e.message);res.status(502).json({configured:false,files:[],message:'Tampilan folder Drive tersedia sebagai alternatif.'});}
}));
app.get('/uploads/media/service-docs/:name',wrap(async(req,res)=>{
 const name=req.params.name;if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]+\.(?:jpg|mp4|webm|mov|pdf)$/.test(name))return res.sendStatus(404);
 await db.ensureWebsite();const p='uploads/media/service-docs/'+name;
 const rows=await db.query('SELECT d.status AS doc_status,s.status AS service_status FROM website_documentation d JOIN website_services s ON s.id=d.service_id WHERE d.source=? AND d.file_path=?',['upload',p]);
 if(!rows.length||!rows.some(r=>r.doc_status==='published'&&r.service_status==='published')&&!db.can(req.session.user,'ibadah_konten','view'))return res.sendStatus(404);
 res.set('Cache-Control','private,no-store');res.set('X-Content-Type-Options','nosniff');
 res.sendFile(name,{root:path.join(__dirname,'uploads/media/service-docs'),dotfiles:'deny'},e=>{if(e&&!res.headersSent)res.sendStatus(e.status||404);});
}));
app.get('/uploads/media/website/:name',wrap(async(req,res)=>{const name=req.params.name;if(!/^[a-zA-Z0-9_-]+\.jpg$/.test(name))return res.sendStatus(404);const p='uploads/media/website/'+name;await db.ensureWebsite();const events=await db.query('SELECT status FROM website_events WHERE foto_path=?',[p]);const services=await db.query('SELECT status FROM website_services WHERE foto_path=? OR hero_path=?',[p,p]);if(!events.some(r=>r.status==='published')&&!services.some(r=>r.status==='published')&&!(events.length&&db.can(req.session.user,'acara'))&&!(services.length&&db.can(req.session.user,'ibadah_konten')))return res.sendStatus(404);res.set('Cache-Control','private, no-store');res.sendFile(name,{root:path.join(__dirname,'uploads/media/website'),dotfiles:'deny'},e=>{if(e&&!res.headersSent)res.sendStatus(e.status||404);});}));
app.get('/uploads/media/*',wrap(async(req,res)=>{const name=req.params[0];if(!/^(?:(?:team|pendalaman)\/)?[a-zA-Z0-9_.-]+$/.test(name)||name.split('/').some(s=>s.startsWith('.')))return res.sendStatus(404);const p='uploads/media/'+name;const [section,col]=name.startsWith('team/')?['tim_pelayan','foto_path']:name.startsWith('pendalaman/')?['pendalaman_alkitab','media_path']:['media','file_path'];const table=db.tables[section][0];const rows=await db.query(`SELECT status FROM ${table} WHERE ${col}=?`,[p]);if(!rows.some(r=>r.status==='published')&&!db.can(req.session.user,section))return res.sendStatus(404);if(!rows.length)return res.sendStatus(404);res.set('Cache-Control','private, no-store');res.sendFile(name,{root:path.join(__dirname,'uploads/media'),dotfiles:'deny'},e=>{if(e&&!res.headersSent)res.sendStatus(e.status||404);});}));
app.use((req,res)=>res.status(404).send('Halaman tidak ditemukan.'));
app.use((e,req,res,next)=>{console.error(e.message);if(res.headersSent)return next(e);if(req.path.startsWith('/api'))return res.status(e.status||500).json({success:false,message:'Terjadi kesalahan server.'});res.status(e.status||500).send('Terjadi kesalahan server. Periksa konfigurasi database.');});
// Daily H-1 reminder while the server and bot stay connected. Set WA_REMINDER_AUTO=0 to disable.
function scheduleWaReminder(){
 const hour=Math.min(23,Math.max(0,Number(process.env.WA_REMINDER_HOUR||8)));
 const next=new Date();next.setHours(hour,0,0,0);if(next.getTime()<=Date.now())next.setDate(next.getDate()+1);
 const timer=setTimeout(async()=>{
  try{if(wa.ready()){const n=await wa.cron();if(n)console.log('Reminder WhatsApp otomatis: '+n+' jadwal diproses.');}}
  catch(e){console.error('Reminder WhatsApp otomatis:',e.message);}
  scheduleWaReminder();
 },next.getTime()-Date.now());
 timer.unref();
}
if(require.main===module){
 const server=app.listen(Number(process.env.PORT||3000),()=>console.log('GPI Cipayung: http://localhost:'+(process.env.PORT||3000)));
 // Allow large Warta video uploads over slower connections. Configure any reverse proxy separately.
 server.requestTimeout=30*60*1000;
 if(process.env.WA_REMINDER_AUTO!=='0')scheduleWaReminder();
}
module.exports=app;
