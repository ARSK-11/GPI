const bcrypt=require('bcryptjs');
const db=require('./repository');
const finance=require('./finance');
const str=v=>String(v??'').trim();
const pick=(d,keys)=>Object.fromEntries(keys.split(' ').filter(Boolean).map(k=>[k,str(d[k])]));
const date=v=>str(v).slice(0,10)||null;
const time=v=>/^\d{1,2}:\d{2}(:\d{2})?$/.test(str(v))?(str(v).length<=5?str(v)+':00':str(v)):null;
const one=(v,allowed,def)=>allowed.includes(str(v))?str(v):def;
const int=v=>Number.parseInt(v,10)||0;
const status=d=>one(d.status,['published','draft'],'published');
const fail=message=>{const e=new Error(message);e.status=422;throw e;};
function category(v){const s=str(v).toLowerCase();return s.includes('kaum ibu')?'Kaum Ibu':/revive|pemuda/.test(s)?'Revive Generation':s.includes('sekolah')?'Sekolah Minggu':s.includes('diakonia')?'Diakonia':s.includes('keuangan')?'Keuangan Gereja':s.includes('janji iman')?'Janji Iman':s.includes('kas masuk')?'Kas Masuk':s.includes('kas keluar')?'Kas Keluar':'Persembahan';}
const builders={
 async users(d,id){const p={...pick(d,'username nama_lengkap'),email:str(d.email)||null,role:one(db.roleKey(d.role),['admin','majelis','pendeta'],'pendeta'),status:one(d.status,['aktif','nonaktif'],'aktif')};if(d.password){if(String(d.password).length<8)fail('Password minimal 8 karakter.');p.password_hash=await bcrypt.hash(String(d.password),12);}else if(!id)fail('Password wajib diisi untuk akun baru.');return p;},
 jemaat:d=>({...pick(d,'nama_keluarga nama_lengkap tempat_lahir alamat no_hp whatsapp email status_keluarga catatan'),nomor_urut:str(d.nomor_urut)&&Number.isFinite(Number(d.nomor_urut))?int(d.nomor_urut):null,jenis_kelamin:one(d.jenis_kelamin,['Laki-laki','Perempuan'],'') ,tanggal_lahir:date(d.tanggal_lahir),tanggal_bergabung:date(d.tanggal_bergabung),status_jemaat:one(d.status_jemaat,['Aktif','Nonaktif','Pindah','Meninggal'],'Aktif')}),
 jadwal:d=>({...pick(d,'jenis_ibadah tema pemimpin_pujian singer pemain_musik pengkhotbah liturgis multimedia usher kolektan catatan'),tanggal:date(d.tanggal),hari:str(d.hari)||(date(d.tanggal)?db.day(date(d.tanggal)):''),jam_mulai:time(d.jam_mulai)||(/doa pagi/i.test(d.jenis_ibadah)?'05:00:00':/tengah minggu/i.test(d.jenis_ibadah)?'18:30:00':null),jam_selesai:time(d.jam_selesai),lokasi:str(d.lokasi)||'GPI Cipayung',status:one(d.status,['published','draft','batal'],'published')}),
 pengumuman:d=>({...pick(d,'judul isi'),kategori_warta:one(d.kategori_warta,['Umum','Pelayanan','Ulang Tahun','Kegiatan','Pengumuman'],'Umum'),tanggal_publish:date(d.tanggal_publish)||db.today(),status:status(d)}),
 sakramen:d=>({...pick(d,'nama_penerima pelayan catatan'),jemaat_id:int(d.jemaat_id)||null,jenis_sakramen:str(d.jenis_sakramen)||'Baptisan',tanggal:date(d.tanggal)}),
 persembahan:d=>{
 const jenis=one(d.jenis_transaksi,['Persembahan','Kas','Janji Iman'],'Persembahan');
 const arus=one(d.arus_kas,['masuk','keluar'],'masuk');
 const janji=jenis==='Janji Iman'?one(d.status_janji,['janji','realisasi'],'janji'):'realisasi';
 if(jenis==='Persembahan'&&arus==='keluar')fail('Persembahan harus berupa pemasukan. Gunakan kategori Kas untuk pengeluaran.');
 if(jenis==='Janji Iman'&&arus==='keluar')fail('Janji iman tidak dapat dicatat sebagai pengeluaran.');
 const jumlah=finance.parseMoney(d.jumlah);
 if(!Number.isFinite(jumlah)||jumlah<=0||jumlah>999999999999)fail('Jumlah harus lebih dari nol dan valid.');
 return {...pick(d,'jenis_ibadah kolektan keterangan nomor_bukti metode_pembayaran penanggung_jawab nama_pemberi'),tanggal:date(d.tanggal),kategori_dana:category(d.kategori_dana),jenis_transaksi:jenis,arus_kas:arus,status_janji:janji,jenis:str(d.jenis_persembahan||d.jenis)||'Persembahan Umum',jenis_persembahan:str(d.jenis_persembahan||d.jenis)||'Persembahan Umum',jumlah};
 },
 pernikahan:d=>({...pick(d,'nama_pria nama_wanita pendeta no_sertifikat saksi_pria saksi_wanita keterangan'),tanggal_nikah:date(d.tanggal_nikah),tempat:str(d.tempat)||'GPI Cipayung'}),
 async tim_pelayan(d){const p={...pick(d,'nama_lengkap tim jabatan foto_path deskripsi'),jemaat_id:int(d.jemaat_id)||null,kategori:one(d.kategori,['musik','singer','pelayanan_gereja','diakonia','media','sekolah_minggu','kaum_ibu','pemuda'],'pelayanan_gereja'),status:status(d),urutan:int(d.urutan??99)};if(p.jemaat_id&&!p.nama_lengkap)p.nama_lengkap=(await db.find('jemaat',p.jemaat_id))?.nama_lengkap||'';if(p.nama_lengkap==='Phb. H. Sitorus')p.nama_lengkap='St. H. Sitorus';if(p.kategori==='pelayanan_gereja'&&!/gembala/i.test(p.tim+' '+p.jabatan))p.jabatan=/Ev\. D\. F\. Manurung/i.test(p.nama_lengkap)?'Evangelis':'Hamba Tuhan';return p;},
 pendalaman_alkitab:d=>({...pick(d,'judul ayat isi media_path'),tipe:str(d.tipe)||'renungan',urutan:int(d.urutan??99),status:status(d)})
};
const required={users:['username','nama_lengkap'],jemaat:['nama_lengkap'],jadwal:['tanggal','jenis_ibadah'],pengumuman:['judul','isi'],sakramen:['nama_penerima','tanggal'],persembahan:['tanggal','jumlah'],pernikahan:['nama_pria','nama_wanita','tanggal_nikah'],tim_pelayan:['nama_lengkap','tim','jabatan'],pendalaman_alkitab:['judul','isi']};
function valid(s,p){return required[s].every(k=>Boolean(p[k]))&&(s!=='persembahan'||p.jumlah>0);}
module.exports={str,date,time,int,fail,builders,required,valid};
