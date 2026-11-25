'use strict';
const seed=require('./website-seed.json');
const documentation=require('./website-documentation');
const schema=[`CREATE TABLE IF NOT EXISTS website_events (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, judul VARCHAR(180) NOT NULL, slug VARCHAR(120) NOT NULL UNIQUE,
 deskripsi TEXT NOT NULL, lokasi VARCHAR(250) NOT NULL, tanggal_mulai DATE NOT NULL, tanggal_selesai DATE NOT NULL,
 foto_path VARCHAR(500) NOT NULL DEFAULT '', urutan INT NOT NULL DEFAULT 99, status VARCHAR(20) NOT NULL DEFAULT 'draft',
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, `CREATE TABLE IF NOT EXISTS website_services (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, judul VARCHAR(180) NOT NULL, slug VARCHAR(120) NOT NULL UNIQUE,
 deskripsi TEXT NOT NULL, jadwal VARCHAR(500) NOT NULL DEFAULT '', lokasi VARCHAR(250) NOT NULL DEFAULT '',
 nama_pembina VARCHAR(180) NOT NULL DEFAULT '', jabatan_pembina VARCHAR(180) NOT NULL DEFAULT '', bio TEXT NOT NULL,
 foto_path VARCHAR(500) NOT NULL DEFAULT '', hero_path VARCHAR(500) NOT NULL DEFAULT '',
 urutan INT NOT NULL DEFAULT 99, status VARCHAR(20) NOT NULL DEFAULT 'draft',
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, `CREATE TABLE IF NOT EXISTS website_migrations (migration_key VARCHAR(100) PRIMARY KEY) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`];
const migration='fresh4_seed_v1';
const sections=['acara','ibadah_konten'];
const invalid=m=>{throw Object.assign(new Error(m),{status:422});};
function field(d,k,max,required=false){if(d[k]!=null&&typeof d[k]!=='string')invalid('Kolom '+k+' tidak valid.');const v=(d[k]||'').trim();if(required&&!v)invalid('Kolom '+k+' wajib diisi.');if(v.length>max)invalid('Kolom '+k+' terlalu panjang.');return v;}
function date(d,k){const v=field(d,k,10,true);if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)invalid('Tanggal tidak valid.');return v;}
function payload(section,d){if(!sections.includes(section))invalid('Jenis konten tidak valid.');const p={judul:field(d,'judul',180,true),slug:field(d,'slug',120,true).toLowerCase(),deskripsi:field(d,'deskripsi',12000,true),lokasi:field(d,'lokasi',250),status:field(d,'status',20,true),urutan:Number(d.urutan??99)};if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))invalid('Slug hanya huruf kecil, angka, dan tanda hubung.');if(!['published','draft'].includes(p.status))invalid('Status tidak valid.');if(!Number.isInteger(p.urutan)||p.urutan<0||p.urutan>9999)invalid('Urutan harus 0–9999.');if(section==='acara'){p.tanggal_mulai=date(d,'tanggal_mulai');p.tanggal_selesai=date(d,'tanggal_selesai');if(p.tanggal_selesai<p.tanggal_mulai)invalid('Tanggal selesai tidak boleh sebelum tanggal mulai.');}else{for(const [k,max] of [['jadwal',500],['nama_pembina',180],['jabatan_pembina',180],['bio',12000]])p[k]=field(d,k,max);}return p;}
function imageUrl(p){return /^(?:assets\/img\/[a-zA-Z0-9_./-]+|uploads\/media\/website\/[a-zA-Z0-9_.-]+\.jpg)$/.test(String(p||''))&&!String(p).split('/').some(s=>s==='..'||s==='.')?'/'+p:'';}
function dateLabel(a,b){if(!a)return '';const fmt=x=>new Date(x+'T00:00:00+07:00').toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'});return a===b?fmt(a):a.slice(0,7)===b.slice(0,7)?Number(a.slice(8,10))+'–'+fmt(b):fmt(a)+' – '+fmt(b);}
async function init(db){for(const sql of schema)await db.query(sql);await db.query(documentation.schema);await db.transaction(async c=>{const r=await db.query('INSERT IGNORE INTO website_migrations (migration_key) VALUES (?)',[migration],c);if(r.affectedRows===1)for(const s of sections)for(const row of seed[s])await db.insert(s,row,c);});await documentation.seedFolders(db);}
module.exports={seed,schema,migration,sections,payload,imageUrl,dateLabel,init};
