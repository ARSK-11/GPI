const express=require('express');
const multer=require('multer');
const {parse}=require('csv-parse/sync');
const {stringify}=require('csv-stringify/sync');
const db=require('./repository');
const connect=require('./connect');
const website=require('./website-content');
const documentation=require('./website-documentation');
const sharp=require('sharp');
const {str,int,fail,builders,valid,required}=require('./payloads');
const uploads=require('./uploads');
const wartaUpload=require('./warta-upload');
const wa=require('./whatsapp');
const crypto=require('node:crypto');
const path=require('node:path');
const ExcelJS=require('exceljs');
const router=express.Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:31457280,files:20,fields:100,fieldSize:16*1024*1024,parts:120}}).fields([{name:'file',maxCount:1},{name:'files[]',maxCount:20},{name:'files',maxCount:20},{name:'foto_file',maxCount:1},{name:'media_file',maxCount:1},{name:'hero_file',maxCount:1},{name:'warta_file',maxCount:1},{name:'document_file',maxCount:1}]);
const file=(req,k)=>req.files?.[k]?.[0];
const token=req=>req.session.csrf ||= crypto.randomBytes(32).toString('hex');
const csrfOK=req=>{const a=String(req.body?.csrf_token||req.get('X-CSRF-Token')||''),b=req.session.csrf||'';const aa=Buffer.from(a),bb=Buffer.from(b);return aa.length>0&&aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);};
const error=(message,status)=>Object.assign(new Error(message),{status});
const good=(res,message,extra={})=>res.json({success:true,message,...extra});
const exportHeaders={jemaat:'nomor_urut nama_keluarga nama_lengkap jenis_kelamin tempat_lahir tanggal_lahir alamat no_hp whatsapp email status_jemaat status_keluarga tanggal_bergabung catatan',jadwal:'tanggal hari jenis_ibadah jam_mulai jam_selesai lokasi tema pemimpin_pujian singer pemain_musik pengkhotbah liturgis multimedia usher kolektan catatan status',persembahan:'tanggal nomor_bukti jenis_transaksi arus_kas status_janji kategori_dana jenis_ibadah jenis_persembahan jumlah metode_pembayaran kolektan penanggung_jawab nama_pemberi keterangan',tim_pelayan:'nama_lengkap kategori tim jabatan urutan foto_path deskripsi status',pendalaman_alkitab:'judul tipe ayat isi media_path urutan status'};
const special={save_documentation:['ibadah_konten','create'],delete_documentation:['ibadah_konten','delete'],save_connect_category:['connect_categories','create'],delete_connect_category:['connect_categories','delete'],export_keuangan_excel:['persembahan','export'],update_connect:['terhubung','update'],delete_connect:['terhubung','delete'],bootstrap:['dashboard','view'],whatsapp_logs:['whatsapp','view'],wa_bot_status:['whatsapp','view'],wa_bot_groups:['whatsapp','view'],wa_bot_connect:['whatsapp','update'],wa_bot_disconnect:['whatsapp','update'],wa_bot_save_group:['whatsapp','update'],wa_bot_test:['whatsapp','update'],announcement_preview:['jadwal','update'],announcement:['jadwal','update'],send_message:['pesan','create'],public_upload_media:['media','create'],upload_media:['media','create'],publish_media:['media','update'],delete_media:['media','delete'],reply_message:['pesan','update'],delete_message:['pesan','delete']};
function permission(a,id){if(a==='save_documentation')return ['ibadah_konten',id>0?'update':'create'];const cms=a.match(/^(save|delete)_(acara|ibadah_konten)$/);if(cms)return [cms[2],cms[1]==='delete'?'delete':id>0?'update':'create'];if(Object.hasOwn(special,a))return special[a];const m=a.match(/^(save|delete_all|delete|bulk_import|import|export)_(.+)$/);if(!m)return null;const [,verb,key]=m;const s=key==='user'?'users':key;if(!Object.hasOwn(builders,s))return null;if(verb==='save')return [s,id>0?'update':'create'];if(verb==='delete')return [s,'delete'];if(verb==='delete_all'&&['jemaat','jadwal'].includes(s))return [s,'delete'];if(verb==='bulk_import'&&['jemaat','jadwal','persembahan'].includes(s))return [s,s==='persembahan'?'create':'import'];if(verb==='import'&&['jemaat','jadwal'].includes(s))return [s,'import'];if(verb==='export'&&Object.hasOwn(exportHeaders,s))return [s,'export'];return null;}
async function mediaUpload(req,status,userId,files){if(!files.length)fail('File wajib dipilih.');const d=req.body||{};const ids=[];for(const f of files){const ext=path.extname(f.originalname||'').slice(1).toLowerCase();if(!['jpg','jpeg','png','webp','gif','mp4','webm','mov'].includes(ext))fail('Unggah foto JPG/PNG/WebP/GIF atau video MP4/WebM/MOV.');const video=['mp4','webm','mov'].includes(ext);const r=await uploads.store(f,'',['jpg','jpeg','png','webp','gif','mp4','webm','mov'],video?30*1024*1024:10*1024*1024);const title=str(d.judul),filename=path.parse(f.originalname).name;try{ids.push(await db.insert('media',{judul:title?(files.length>1?title+' - '+filename:title):filename,deskripsi:str(d.deskripsi),file_name:r.name,file_path:r.publicPath,file_type:r.ext,status:['published','draft','pending'].includes(status)?status:'pending',uploaded_by:userId}));}catch(e){await uploads.removeFile(r.publicPath);throw e;}}return ids;}
router.use((req,res,next)=>{res.set('Cache-Control','no-store');next();});
router.all('/',(req,res,next)=>{
 if (!req.is('multipart/form-data')) return next();
 if (req.query.action !== 'save_pengumuman') return upload(req,res,next);
 // Reject unauthenticated, unauthorized or cross-site uploads BEFORE writing large files to disk.
 const u=req.session?.user;
 if (!u) return next(error('Sesi admin habis. Silakan login ulang.',401));
 if (!db.can(u,'pengumuman','create') && !db.can(u,'pengumuman','update')) return next(error('Akses Warta ditolak.',403));
 if (!csrfOK(req)) return next(error('Token keamanan tidak valid. Refresh halaman.',419));
 req.setTimeout(30*60*1000);
 wartaUpload.upload(req,res,err=>{
   // Clean up temporary media whether the request succeeds or fails.
   res.once('finish',()=>wartaUpload.cleanup(req).catch(console.error));
   res.once('close',()=>wartaUpload.cleanup(req).catch(console.error));
   if (err) return next(err);
   next();
 });
},async(req,res,next)=>{try{
 const d=req.body||{},a=String(req.query.action||d.action||''),id=int(d.id??req.query.id),u=req.session.user;
 if(a==='public_bootstrap'&&req.method==='GET')return res.json({success:true,data:await db.publicPayload(token(req))});
 if(['public_message','public_media_upload'].includes(a)){if(req.method!=='POST')throw error('Metode tidak diizinkan.',405);if(!csrfOK(req))throw error('Token keamanan tidak valid. Refresh halaman.',419);if(a==='public_message'){if(!str(d.pesan))fail('Pesan wajib diisi.');await db.insert('pesan',{nama:str(d.nama)||'Pengunjung',kontak:str(d.kontak),pesan:str(d.pesan),status:'baru'});return good(res,'Pesan berhasil dikirim. Admin akan membaca pesan Anda.');}const ids=await mediaUpload(req,'pending',null,[file(req,'file')].filter(Boolean));return good(res,'Media berhasil dikirim dan menunggu review admin.',{id:ids[0]});}
 if(a==='public_connect'){if(req.method!=='POST')throw error('Metode tidak diizinkan.',405);if(!csrfOK(req))throw error('Token keamanan tidak valid. Refresh halaman.',419);if(d.website)throw error('Permohonan tidak valid.',422);const p=connect.payload(d,await db.activeConnectChoices());const last=Number(req.session.lastConnect||0);if(Date.now()-last<10000)throw error('Mohon tunggu beberapa saat sebelum mengirim kembali.',429);await db.ensureConnect();await db.insert('terhubung',p);req.session.lastConnect=Date.now();return good(res,'Formulir berhasil dikirim. Tim gereja akan menindaklanjuti melalui kontak Anda.');}
 if(!u)throw error('Sesi admin habis. Silakan login ulang.',401);
 const perm=permission(a,id);if(!perm)throw error('Action API tidak ditemukan.',404);if(!db.can(u,...perm))throw error('Akses ditolak. Akun '+db.roleLabel(u.role)+' tidak memiliki izin untuk aksi ini.',403);
 const read=a==='bootstrap'||a==='whatsapp_logs'||a==='wa_bot_status'||a==='wa_bot_groups'||a==='announcement_preview'||a.startsWith('export_');
 if(read&&req.method!=='GET')throw error('Metode tidak diizinkan.',405);
 if(!read){if(req.method!=='POST')throw error('Metode tidak diizinkan.',405);if(!csrfOK(req))throw error('Token keamanan tidak valid. Refresh halaman.',419);}

 if(a==='save_documentation'||a==='delete_documentation'){
  await db.ensureWebsite();
  const old=id>0?await db.find('dokumentasi',id):null;
  if(id>0&&!old)throw error('Dokumentasi tidak ditemukan.',404);
  if(a==='delete_documentation'){
   if(!old)fail('ID dokumentasi tidak valid.');
   await db.remove('dokumentasi',id);
   if(old.source==='upload')await uploads.removeFile(old.file_path,'service-docs');
   return good(res,'Dokumentasi berhasil dihapus.');
  }
  const p=documentation.payload(d);
  const service=await db.find('ibadah_konten',p.service_id);
  if(!service)throw error('Halaman ibadah tidak ditemukan.',404);
  let added='';
  try{
   if(p.source==='upload'){
    const f=file(req,'document_file');
    if(!f){if(!old||old.source!=='upload'||!documentation.localPath(old.file_path))fail('Pilih foto, video, atau PDF yang akan diunggah.');p.file_path=old.file_path;p.media_type=old.media_type;}
    else{
     const ext=path.extname(f.originalname||'').slice(1).toLowerCase();
     if(['jpg','jpeg','png','webp'].includes(ext)){
      if(f.size>10*1024*1024)fail('Ukuran foto maksimal 10 MB.');
      let buffer;try{buffer=await sharp(f.buffer,{limitInputPixels:40000000}).rotate().resize(2000,2000,{fit:'inside',withoutEnlargement:true}).jpeg({quality:87}).toBuffer();}catch{fail('Foto tidak terbaca. Gunakan JPG, PNG, atau WebP.');}
      added=(await uploads.store({originalname:'dokumentasi.jpg',buffer,size:buffer.length},'service-docs',['jpg'],10*1024*1024)).publicPath;p.media_type='photo';
     }else if(ext==='pdf'){
      if(f.size>15*1024*1024||f.buffer.subarray(0,5).toString('ascii')!=='%PDF-')fail('PDF tidak valid atau melebihi 15 MB.');
      added=(await uploads.store(f,'service-docs',['pdf'],15*1024*1024)).publicPath;p.media_type='pdf';
     }else if(['mp4','webm','mov'].includes(ext)){
      const iso=(ext==='mp4'||ext==='mov')&&f.buffer.toString('ascii',4,8)==='ftyp';
      const webm=ext==='webm'&&f.buffer.length>4&&f.buffer[0]===0x1a&&f.buffer[1]===0x45&&f.buffer[2]===0xdf&&f.buffer[3]===0xa3;
      if(f.size>30*1024*1024||!iso&&!webm)fail('Video tidak valid atau melebihi 30 MB. Gunakan MP4, WebM, atau MOV.');
      added=(await uploads.store(f,'service-docs',['mp4','webm','mov'],30*1024*1024)).publicPath;p.media_type='video';
     }else fail('Format yang diizinkan: JPG, PNG, WebP, MP4, WebM, MOV, dan PDF.');
     p.file_path=added;
    }
   }
   const saved=id>0?await db.update('dokumentasi',id,p):await db.insert('dokumentasi',p);
   if(old?.source==='upload'&&old.file_path&&old.file_path!==p.file_path)await uploads.removeFile(old.file_path,'service-docs');
   return good(res,'Dokumentasi berhasil disimpan.',{id:saved});
  }catch(e){if(added)await uploads.removeFile(added,'service-docs');throw e;}
 }
 if(website.sections.includes(perm[0])){const section=perm[0];await db.ensureWebsite();const old=id>0?await db.find(section,id):null;if(id>0&&!old)throw error('Konten tidak ditemukan.',404);if(a.startsWith('delete_')){if(!old)fail('ID konten tidak valid.');const childFiles=section==='ibadah_konten'?(await db.query('SELECT file_path FROM website_documentation WHERE service_id=? AND source=?',[id,'upload'])).map(r=>r.file_path):[];await db.remove(section,id);for(const p of childFiles)await uploads.removeFile(p,'service-docs');for(const k of ['foto_path','hero_path'])await uploads.removeFile(old[k],'website');return good(res,'Konten berhasil dihapus.');}const p=website.payload(section,d),created=[];const fields=section==='acara'?[['foto_path','foto_file']]:[['foto_path','foto_file'],['hero_path','hero_file']];try{for(const [k,input] of fields){const f=file(req,input);p[k]=str(d['hapus_'+k])==='1'?'':old?.[k]||'';if(f){let buffer;try{buffer=await sharp(f.buffer,{limitInputPixels:40000000}).rotate().resize(2000,2000,{fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality:90}).toBuffer();}catch{fail('Gambar tidak valid. Pilih JPG, PNG, atau WebP.');}p[k]=(await uploads.store({originalname:'website.jpg',buffer,size:buffer.length},'website',['jpg'])).publicPath;created.push(p[k]);}}const saved=id>0?await db.update(section,id,p):await db.insert(section,p);for(const [k] of fields)if(old?.[k]&&old[k]!==p[k])await uploads.removeFile(old[k],'website');return good(res,'Konten berhasil disimpan.',{id:saved});}catch(e){for(const p of created)await uploads.removeFile(p,'website');if(e.code==='ER_DUP_ENTRY')fail('Slug sudah dipakai. Gunakan slug lain.');throw e;}}
 if(a==='save_connect_category'){
  await db.ensureConnect();const p=connect.categoryPayload(d),old=id?await db.find('connect_categories',id):null;if(id&&!old)throw error('Kategori tidak ditemukan.',404);
  if(id){if(!db.can(u,'connect_categories','update'))throw error('Akses ubah ditolak.',403);await db.update('connect_categories',id,p);}else await db.insert('connect_categories',p);
  return good(res,'Kategori formulir berhasil disimpan.');
 }
 if(a==='delete_connect_category'){
  await db.ensureConnect();if(!id)fail('Kategori tidak valid.');await db.update('connect_categories',id,{aktif:0});return good(res,'Kategori dinonaktifkan dari formulir publik.');
 }
 if(a==='update_connect'){if(!connect.statuses.includes(d.status)||typeof d.catatan!=='string'||d.catatan.length>5000||id<=0)fail('Status atau catatan tidak valid.');await db.ensureConnect();await db.update('terhubung',id,{status:d.status,catatan:d.catatan.trim()});return good(res,'Tindak lanjut berhasil disimpan.');}
 if(a==='delete_connect'){await db.ensureConnect();await db.remove('terhubung',id);return good(res,'Formulir dihapus.');}
 if(a==='bootstrap')return res.json({success:true,data:await db.bootstrap(u)});
 if(a==='whatsapp_logs')return res.json({success:true,data:await db.list('whatsapp')});
 const botAdmin=db.roleKey(u.role)==='admin';
 if(a==='wa_bot_status')return res.json({success:true,data:await wa.status()});
 if(a==='wa_bot_groups'){if(!botAdmin)throw error('Hanya Admin yang dapat mengelola bot WhatsApp.',403);return res.json({success:true,data:{groups:await wa.groups()}});}
   if(a==='wa_bot_connect'){if(!botAdmin)throw error('Hanya Admin yang dapat menghubungkan bot WhatsApp.',403);return res.json({success:true,data:wa.connect()});}
  if(a==='wa_bot_disconnect'){if(!botAdmin)throw error('Hanya Admin yang dapat memutuskan bot WhatsApp.',403);await wa.disconnect();return good(res,'Koneksi bot WhatsApp diputuskan dan sesi lokal dihapus. Klik Hubungkan WhatsApp untuk memindai QR baru.');}
 if(a==='wa_bot_save_group'){if(!botAdmin)throw error('Hanya Admin yang dapat mengubah grup tujuan bot.',403);const group=await wa.saveGroup(str(d.group_id),str(d.group_name));return good(res,'Grup tujuan bot WhatsApp disimpan.',{group});}
 if(a==='wa_bot_test'){if(!botAdmin)throw error('Hanya Admin yang dapat mengirim pesan uji bot.',403);const result=await wa.sendTest(str(d.phone),str(d.message),str(d.target_type)==='group'?'group':str(d.target_type)==='phone'?'phone':'auto');return good(res,'Pesan uji diproses bot.',{result});}
 if(a==='announcement_preview'){const j=await db.find('jadwal',id);if(!j)throw error('Jadwal tidak ditemukan.',404);return res.json({success:true,data:await wa.preview(j)});}
 if(a==='announcement'){const j=await db.find('jadwal',id);if(!j)throw error('Jadwal tidak ditemukan.',404);const report=await wa.announcement(j);return good(res,`Pengumuman dikirim otomatis ke ${report.group} dan ${report.recipients} nomor pribadi.`,{report});}
 if(a==='upload_media'||a==='public_upload_media'){const files=a==='upload_media'?[...(req.files?.['files[]']||[]),...(req.files?.files||[]),...(req.files?.file||[])]:[file(req,'file')].filter(Boolean);const ids=await mediaUpload(req,a==='upload_media'?str(d.status)||'published':'pending',u.id,files);return good(res,`${ids.length} media berhasil diupload.`,{id:ids[0],ids});}
 if(a==='publish_media'){await db.update('media',id,{status:'published'});return good(res,'Media dipublish.');}
 if(a==='delete_media'){const old=await db.find('media',id);await db.remove('media',id);await uploads.removeFile(old?.file_path);return good(res,'Media dihapus.');}
 if(a==='reply_message'){await db.update('pesan',id,{balasan:str(d.balasan),status:'dibalas'});return good(res,'Balasan tersimpan.');}
 if(a==='delete_message'){await db.remove('pesan',id);return good(res,'Pesan dihapus.');}
 if(a==='send_message'){if(!str(d.nama)||!str(d.pesan))fail('Nama dan pesan wajib diisi.');await db.insert('pesan',{nama:str(d.nama),kontak:str(d.kontak),pesan:str(d.pesan),status:'baru'});return good(res,'Pesan berhasil dikirim ke admin gereja.');}
 const s=perm[0];
 if(a==='export_keuangan_excel'){
 await db.ensureFinance();const from=String(req.query.dari||''),to=String(req.query.sampai||''),type=String(req.query.jenis||'');
 if((from&&!/^\d{4}-\d{2}-\d{2}$/.test(from))||(to&&!/^\d{4}-\d{2}-\d{2}$/.test(to)))fail('Format tanggal laporan tidak valid.');
 const rows=(await db.list('persembahan')).filter(r=>(!from||String(r.tanggal).slice(0,10)>=from)&&(!to||String(r.tanggal).slice(0,10)<=to)&&(!type||(r.jenis_transaksi||'Persembahan')===type));const wb=new ExcelJS.Workbook();wb.creator='GPI Cipayung';wb.created=new Date();
 const sheet=wb.addWorksheet('Buku Kas',{views:[{state:'frozen',ySplit:5}]});
 sheet.mergeCells('A1:N1');sheet.getCell('A1').value='GPI CIPAYUNG — LAPORAN KEUANGAN';sheet.getCell('A1').font={bold:true,size:17,color:{argb:'FFFFFFFF'}};sheet.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF174F78'}};
 sheet.mergeCells('A2:N2');sheet.getCell('A2').value='Persembahan, kas, dan janji iman | Dicetak: '+new Date().toLocaleDateString('id-ID',{timeZone:'Asia/Jakarta'});
 sheet.addRow([]);const heads=['Tanggal','No. Bukti','Jenis Transaksi','Arus','Status Janji','Kategori Dana','Jenis Ibadah','Jenis Persembahan','Pemasukan (Rp)','Pengeluaran (Rp)','Janji belum terealisasi (Rp)','Metode','Penanggung Jawab','Keterangan'];sheet.addRow(heads);const header=sheet.getRow(4);header.font={bold:true,color:{argb:'FFFFFFFF'}};header.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF244D67'}};header.height=28;
 let masuk=0,keluar=0,janji=0;const safeCell=x=>typeof x==='string'&&/^[=+@-]/.test(x)?"'"+x:x;
 for(const r of rows){const pledged=r.jenis_transaksi==='Janji Iman'&&r.status_janji==='janji',out=r.arus_kas==='keluar'&&!pledged;const amount=Number(r.jumlah)||0;const n=pledged?0:out?0:amount,o=out?amount:0,j=pledged?amount:0;masuk+=n;keluar+=o;janji+=j;sheet.addRow([String(r.tanggal).slice(0,10),safeCell(r.nomor_bukti||''),r.jenis_transaksi||'Persembahan',r.arus_kas||'masuk',r.status_janji||'realisasi',safeCell(r.kategori_dana),safeCell(r.jenis_ibadah||''),safeCell(r.jenis_persembahan||r.jenis||''),n,o,j,safeCell(r.metode_pembayaran||''),safeCell(r.penanggung_jawab||r.kolektan||''),safeCell(r.keterangan||'')]);}
 const t=sheet.addRow(['TOTAL','','','','','','','',masuk,keluar,janji]);t.font={bold:true};t.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFDCEBF3'}};
 sheet.columns.forEach((c,i)=>{c.width=[15,19,20,13,18,22,24,25,22,22,30,19,25,48][i];});for(const r of sheet.getRows(5,sheet.rowCount-4)||[])for(const i of [9,10,11])r.getCell(i).numFmt='"Rp" #,##0.00';sheet.autoFilter={from:{row:4,column:1},to:{row:sheet.rowCount-1,column:14}};
 const summary=wb.addWorksheet('Ringkasan');[['Keterangan','Nilai (Rp)'],['Total Pemasukan',masuk],['Total Pengeluaran',keluar],['Saldo Kas',masuk-keluar],['Janji Iman Belum Terealisasi',janji]].forEach(a=>summary.addRow(a));summary.getColumn(1).width=37;summary.getColumn(2).width=25;summary.getColumn(2).numFmt='"Rp" #,##0.00';summary.getRow(1).font={bold:true};
 res.set('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');res.attachment('laporan_keuangan_gpi_cipayung.xlsx');return res.send(Buffer.from(await wb.xlsx.writeBuffer()));
 }
 if(a.startsWith('export_')){const headers=exportHeaders[s].split(' ');const rows=await db.list(s);const filename=({jemaat:'data_jemaat',jadwal:'jadwal_pelayanan'}[s]||s)+'_gpi_cipayung.csv';res.set('Content-Type','text/csv; charset=utf-8').attachment(filename);return res.send(stringify(rows,{header:true,columns:headers,escape_formulas:true}));}
 if(a.startsWith('bulk_import_')||a.startsWith('import_')){let rows=d.rows;if(a.startsWith('import_')){const f=file(req,'file');if(!f)fail('File CSV wajib dipilih.');rows=parse(f.buffer,{columns:h=>h.map(x=>x.trim()),bom:true,skip_empty_lines:true,relax_column_count:true});}if(!Array.isArray(rows))fail('Data import tidak valid.');if(d.replace&&!db.can(u,s,'delete'))throw error('Akses hapus ditolak.',403);const prepared=[];for(const row of rows){if(!row||typeof row!=='object'||Array.isArray(row))continue;const p=await builders[s](row,0);if(valid(s,p))prepared.push(p);}if(d.replace&&!prepared.length)fail('Tidak ada data valid untuk mengganti data lama.');await db.transaction(async c=>{if(d.replace)await db.clear(s,c);for(const p of prepared)await db.insert(s,p,c);});return good(res,`Import ${prepared.length} data berhasil.`);}
 if(a.startsWith('delete_all_')){await db.clear(s);return good(res,'Semua data berhasil dihapus.');}
 if(a.startsWith('delete_')){if(s==='persembahan'){
  await db.ensureFinance();await db.transaction(async c=>{
    const before=(await db.query('SELECT * FROM persembahan WHERE id=? FOR UPDATE',[id],c))[0];if(!before)throw error('Transaksi tidak ditemukan.',404);
    await db.query('INSERT INTO finance_audit (transaksi_id,aksi,actor_id,actor_role,before_json) VALUES (?,?,?,?,?)',[id,'hapus',u.id,db.roleKey(u.role),JSON.stringify(before)],c);
    await db.query('DELETE FROM persembahan WHERE id=?',[id],c);
  });return good(res,'Transaksi dihapus dan dicatat dalam audit.');
 }if(s==='users'&&id===Number(u.id))fail('Akun yang sedang dipakai tidak boleh dihapus.');const old=['tim_pelayan','pendalaman_alkitab'].includes(s)?await db.find(s,id):null;await db.remove(s,id);if(s==='tim_pelayan')await uploads.removeFile(old?.foto_path,'team');if(s==='pendalaman_alkitab')await uploads.removeFile(old?.media_path,'pendalaman');return good(res,'Data berhasil dihapus.');}
 if(a.startsWith('save_')){if(s==='persembahan')await db.ensureFinance();if(s==='pengumuman')await db.ensureWarta();const p=await builders[s](d,id);if(!valid(s,p))fail('Data wajib diisi: '+required[s].join(', '));if(s==='users'&&id===Number(u.id)&&(p.status!=='aktif'||p.role!==db.roleKey(u.role)))fail('Akun yang sedang dipakai tidak boleh dinonaktifkan atau diubah perannya.');let old=null,newPath=null,field=null,folder=null;if(['tim_pelayan','pendalaman_alkitab'].includes(s)){old=id>0?await db.find(s,id):null;if(s==='tim_pelayan'){field='foto_path';folder='team';newPath=await uploads.teamPhoto(file(req,'foto_file'),str(d.foto_cropped_data),p.nama_lengkap);p.foto_path=newPath||(str(d.hapus_foto)==='1'?'':p.foto_path||old?.foto_path||'');}else{field='media_path';folder='pendalaman';const f=file(req,'media_file');if(f)newPath=(await uploads.store(f,folder,[...uploads.images,'mp4','webm','mov'])).publicPath;p.media_path=newPath||str(d.media_link)||p.media_path||old?.media_path||'';}}
 if(s==='pengumuman'){
  old=id>0?await db.find(s,id):null;field='media_path';folder='warta';const f=file(req,'warta_file');
  if(f){
   const ext=wartaUpload.extname(f.originalname);
   const isVideo=ext==='.mp4'||ext==='.webm';
   if(!['.jpg','.jpeg','.png','.webp','.mp4','.webm'].includes(ext))fail('Format Warta hanya JPG, PNG, WebP, MP4 atau WebM.');
   if(isVideo){
     if(f.size>wartaUpload.VIDEO_MAX_BYTES)fail('Ukuran video maksimal 1 GB.');
     newPath=await wartaUpload.storeVideo(f);
   }else{
     if(f.size>wartaUpload.IMAGE_MAX_BYTES)fail('Ukuran foto maksimal 10 MB.');
     let processed;
     try{
       processed=await sharp(f.path,{limitInputPixels:40000000}).rotate().resize(1920,1920,{fit:'inside',withoutEnlargement:true}).jpeg({quality:88}).toBuffer();
     }catch(e){fail('Foto Warta tidak valid. Gunakan JPG, PNG, atau WebP.');}
     newPath=(await uploads.store({originalname:'warta.jpg',buffer:processed,size:processed.length},'warta',['jpg'],wartaUpload.IMAGE_MAX_BYTES)).publicPath;
   }
  }
  p.media_path=newPath||(String(d.hapus_media)==='1'?'':old?.media_path||'');p.tipe_media=p.media_path? /\.(mp4|webm)$/i.test(p.media_path)?'video':'foto':'';
 }
 let saved;try{
 if(s==='persembahan')saved=await db.transaction(async c=>{
   const financeOld=id>0?(await db.query('SELECT * FROM persembahan WHERE id=? FOR UPDATE',[id],c))[0]:null;
   if(id&&!financeOld)throw error('Transaksi tidak ditemukan.',404);
   const newId=id>0?await db.update(s,id,p,c):await db.insert(s,p,c);
   await db.query('INSERT INTO finance_audit (transaksi_id,aksi,actor_id,actor_role,before_json,after_json) VALUES (?,?,?,?,?,?)',[newId,id?'ubah':'tambah',u.id,db.roleKey(u.role),financeOld?JSON.stringify(financeOld):null,JSON.stringify(p)],c);
   return newId;
 });else saved=id>0?await db.update(s,id,p):await db.insert(s,p);
 }catch(e){if(newPath)await uploads.removeFile(newPath,folder);throw e;}if(field&&old?.[field]&&old[field]!==p[field])await uploads.removeFile(old[field],folder);return good(res,'Data berhasil disimpan.',{id:saved,...(s==='tim_pelayan'?{foto_path:p.foto_path}:{})});}
 throw error('Action API tidak ditemukan.',404);
}catch(e){next(e);}});
router.use((e,req,res,next)=>{console.error('API:',e.message);const code=e.status|| (e instanceof multer.MulterError?422:500);const msg=e instanceof multer.MulterError&&e.code==='LIMIT_FILE_SIZE'?(req.query.action==='save_pengumuman'?'Video Warta maksimal 1 GB; foto maksimal 10 MB.':'Ukuran file melebihi batas upload.'):(code<500?e.message:process.env.NODE_ENV==='production'?'Terjadi kesalahan server.':e.message);res.status(code).json({success:false,message:msg});});
module.exports={router,token,csrfOK,permission};
