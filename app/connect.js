'use strict';
const choices={
 komitmen:{label:'Terima Yesus / Berkomitmen Kembali',description:'Saya ingin menerima Tuhan Yesus atau memperbarui komitmen iman saya.',prompt:'Bagikan keputusan atau pergumulan Anda (opsional).'},
 baptis:{label:'Baptis',description:'Saya ingin dibaptis.',prompt:'Ceritakan kebutuhan atau pertanyaan tentang baptisan.'},
 kesaksian:{label:'Kesaksian',description:'Saya ingin mengirimkan kesaksian saya.',prompt:'Tuliskan kesaksian Anda.'},
 doa:{label:'Permintaan Doa / Konseling',description:'Saya memiliki permohonan doa atau permintaan konseling.',prompt:'Tuliskan permohonan doa atau kebutuhan konseling Anda.'},
 pernikahan:{label:'Pemberkatan Pernikahan',description:'Saya ingin mengajukan permohonan pemberkatan nikah.',prompt:'Tuliskan rencana tanggal pemberkatan dan informasi pasangan.'},
 anak:{label:'Penyerahan Anak',description:'Saya ingin mendedikasikan anak saya kepada Yesus Kristus.',prompt:'Tuliskan nama anak, usia, dan rencana penyerahan anak.'}
};
const categoriesSchema=`CREATE TABLE IF NOT EXISTS connect_categories (
 id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 kode VARCHAR(30) NOT NULL UNIQUE,
 label VARCHAR(160) NOT NULL,
 description VARCHAR(500) NOT NULL DEFAULT '',
 prompt VARCHAR(500) NOT NULL DEFAULT '',
 urutan INT NOT NULL DEFAULT 99,
 aktif TINYINT(1) NOT NULL DEFAULT 1,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
function categoryPayload(d){
 const kode=field(d,'kode',30,true).toLowerCase();
 if(!/^[a-z][a-z0-9_]{1,29}$/.test(kode))invalid('Kode kategori harus huruf kecil, angka atau garis bawah.');
 const label=field(d,'label',160,true),description=field(d,'description',500,true),prompt=field(d,'prompt',500,true);
 const urutan=Number(d.urutan??99);
 if(!Number.isInteger(urutan)||urutan<0||urutan>9999)invalid('Urutan 0 sampai 9999.');
 return {kode,label,description,prompt,urutan,aktif:String(d.aktif||'1')==='0'?0:1};
}

const statuses=['baru','diproses','selesai'];
const invalid=m=>{throw Object.assign(new Error(m),{status:422});};
function field(d,k,max,required=false){if(d[k]!=null&&typeof d[k]!=='string')invalid('Data '+k+' tidak valid.');const v=(d[k]||'').trim();if(required&&!v)invalid('Kolom '+k+' wajib diisi.');if(v.length>max)invalid('Kolom '+k+' terlalu panjang.');return v;}
function payload(d,allowed=choices){const kategori=field(d,'kategori',30,true);if(!Object.hasOwn(allowed,kategori))invalid('Pilih salah satu jenis permohonan.');const nama=field(d,'nama',160,true), gender=field(d,'jenis_kelamin',20),usia=field(d,'usia',3),kontak=field(d,'kontak',40),email=field(d,'email',160),kota=field(d,'kota',160,true),pesan=field(d,'pesan',5000,['kesaksian','doa'].includes(kategori));if(gender&&!['Pria','Wanita','Tidak ingin menyebutkan'].includes(gender))invalid('Jenis kelamin tidak valid.');if(usia&&(!/^\d{1,3}$/.test(usia)||Number(usia)>120))invalid('Usia tidak valid.');if(!kontak&&!email)invalid('Isi minimal nomor WhatsApp atau email.');if(kontak&&!/^\+?[0-9 ()-]{7,40}$/.test(kontak))invalid('Nomor WhatsApp tidak valid.');if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))invalid('Email tidak valid.');if(d.persetujuan!=='1')invalid('Persetujuan penggunaan data wajib dicentang.');let detail_json=null;
 if(kategori==='pernikahan'){
  const nij=field(d,'nij_pasangan',160,true),cg=field(d,'cg_pasangan',160,true),aktif=field(d,'aktif_cg_sejak',100,true),tanggal=field(d,'tanggal_pernikahan',10,true);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)||Number.isNaN(Date.parse(tanggal+'T00:00:00+07:00'))||new Date(tanggal+'T00:00:00+07:00').toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'})!==tanggal)invalid('Tanggal rencana pemberkatan tidak valid.');
  detail_json=JSON.stringify({nij_pasangan:nij,cg_pasangan:cg,aktif_cg_sejak:aktif,tanggal_pernikahan:tanggal});
 }
 return {kategori,nama,jenis_kelamin:gender||null,usia:usia?Number(usia):null,kontak:kontak||null,email:email||null,kota,pesan,detail_json,minat_baptis:d.minat_baptis==='1'&&kategori==='komitmen'?1:0,minat_komunitas:d.minat_komunitas==='1'&&kategori==='komitmen'?1:0,status:'baru'};}
const schema=`CREATE TABLE IF NOT EXISTS connect_requests (
 id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 kategori VARCHAR(30) NOT NULL, nama VARCHAR(160) NOT NULL,
 jenis_kelamin VARCHAR(30) NULL, usia SMALLINT UNSIGNED NULL,
 kontak VARCHAR(40) NULL, email VARCHAR(160) NULL, kota VARCHAR(160) NOT NULL,
 pesan TEXT NOT NULL, minat_baptis TINYINT(1) NOT NULL DEFAULT 0, minat_komunitas TINYINT(1) NOT NULL DEFAULT 0,
 status VARCHAR(20) NOT NULL DEFAULT 'baru', catatan TEXT NULL, detail_json TEXT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_connect_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
module.exports={choices,categoriesSchema,categoryPayload,statuses,payload,schema};
