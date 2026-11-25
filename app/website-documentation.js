'use strict';

const folderSeeds = Object.freeze([
  {slug:'youth-revive-generation',judul:'Dokumentasi Youth Revive Generation',folderId:'1Jx9PvVly5WZlpPYj4pMKtVzcrrMthhbL'},
  {slug:'kaum-ibu',judul:'Dokumentasi Ibadah Kaum Ibu',folderId:'1bBapA5ORt_hU2NiLCDDl8N9zDH_mpX_r'}
]);
const migration='fresh5_documentation_drive_v1';
const schema=`CREATE TABLE IF NOT EXISTS website_documentation (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 service_id INT UNSIGNED NOT NULL,
 judul VARCHAR(180) NOT NULL,
 deskripsi TEXT NOT NULL,
 source VARCHAR(20) NOT NULL DEFAULT 'upload',
 media_type VARCHAR(12) NOT NULL DEFAULT 'photo',
 file_path VARCHAR(500) NOT NULL DEFAULT '',
 external_url VARCHAR(1024) NOT NULL DEFAULT '',
 drive_id VARCHAR(200) NOT NULL DEFAULT '',
 urutan INT NOT NULL DEFAULT 99,
 status VARCHAR(20) NOT NULL DEFAULT 'published',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_service_status (service_id,status,urutan),
 CONSTRAINT fk_website_documentation_service FOREIGN KEY (service_id)
 REFERENCES website_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;
const invalid=message=>{throw Object.assign(new Error(message),{status:422});};
const text=(value,label,max,required=false)=>{
  if(value!=null&&typeof value!=='string')invalid(label+' tidak valid.');
  const v=String(value||'').trim();
  if(required&&!v)invalid(label+' wajib diisi.');
  if(v.length>max)invalid(label+' terlalu panjang.');
  return v;
};
const safeId=id=>/^[a-zA-Z0-9_-]{10,200}$/.test(String(id||''))?String(id):'';
function parseDrive(value,expectedSource){
 const raw=text(value,'Link Google Drive',1024,true);let url;
 try{url=new URL(raw);}catch{invalid('Link Google Drive tidak valid.');}
 if(url.protocol!=='https:'||url.hostname!=='drive.google.com'||url.username||url.password||url.port)invalid('Gunakan link resmi https://drive.google.com.');
 let id='',type='';
 let match=url.pathname.match(/^\/drive\/folders\/([a-zA-Z0-9_-]+)\/?$/);
 if(match){id=match[1];type='drive_folder';}
 match=url.pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)\/(?:view|preview|edit)?\/?$/);
 if(match){id=match[1];type='drive_file';}
 if(url.pathname==='/open'){id=url.searchParams.get('id')||'';type='drive_file';}
 if(!safeId(id)||type!==expectedSource)invalid(expectedSource==='drive_folder'?'Gunakan link folder Google Drive (drive/folders/...).':'Gunakan link file Google Drive (file/d/.../view).');
 return {id,url:type==='drive_folder'?`https://drive.google.com/drive/folders/${id}`:`https://drive.google.com/file/d/${id}/view`};
}
function payload(d){
 const serviceId=Number(d.service_id);if(!Number.isSafeInteger(serviceId)||serviceId<=0)invalid('Pilih halaman ibadah yang valid.');
 const p={service_id:serviceId,judul:text(d.judul,'Judul dokumentasi',180,true),deskripsi:text(d.deskripsi,'Deskripsi',5000),source:text(d.source,'Sumber',20,true),media_type:text(d.media_type,'Tipe',12),urutan:Number(d.urutan??99),status:text(d.status,'Status',20,true)};
 if(!['upload','drive_file','drive_folder'].includes(p.source))invalid('Sumber dokumentasi tidak valid.');
 if(!Number.isInteger(p.urutan)||p.urutan<0||p.urutan>9999)invalid('Urutan harus 0–9999.');
 if(!['published','draft'].includes(p.status))invalid('Status dokumentasi tidak valid.');
 if(p.source==='drive_folder'){p.media_type='folder';const u=parseDrive(d.external_url,p.source);p.drive_id=u.id;p.external_url=u.url;p.file_path='';}
 else if(p.source==='drive_file'){
  if(!['photo','video','pdf'].includes(p.media_type))invalid('Pilih foto, video, atau PDF.');
  const u=parseDrive(d.external_url,p.source);p.drive_id=u.id;p.external_url=u.url;p.file_path='';
 }else{p.file_path='';p.external_url='';p.drive_id='';p.media_type='';}
 return p;
}
const localPath=p=>/^uploads\/media\/service-docs\/[a-zA-Z0-9_.-]+\.(?:jpg|mp4|webm|mov|pdf)$/i.test(String(p||''))&&!p.split('/').some(x=>x==='..')?'/'+p:'';
const imageSrc=r=>r.source==='upload'&&r.media_type==='photo'?localPath(r.file_path):r.source==='drive_file'&&r.media_type==='photo'&&safeId(r.drive_id)?`https://drive.google.com/thumbnail?id=${r.drive_id}&sz=w960`:'';
const previewSrc=r=>r.source==='upload'?localPath(r.file_path):r.source==='drive_folder'&&safeId(r.drive_id)?`https://drive.google.com/embeddedfolderview?id=${r.drive_id}#grid`:r.source==='drive_file'&&safeId(r.drive_id)?`https://drive.google.com/file/d/${r.drive_id}/preview`:'';
async function seedFolders(db){
 await db.transaction(async conn=>{
  const result=await db.query('INSERT IGNORE INTO website_migrations (migration_key) VALUES (?)',[migration],conn);
  if(result.affectedRows!==1)return;
  for(const folder of folderSeeds){
   const rows=await db.query('SELECT id FROM website_services WHERE slug=? LIMIT 1',[folder.slug],conn);
   if(!rows.length)continue;
   await db.insert('dokumentasi',{service_id:rows[0].id,judul:folder.judul,deskripsi:'Album dokumentasi melalui Google Drive.',source:'drive_folder',media_type:'folder',file_path:'',external_url:`https://drive.google.com/drive/folders/${folder.folderId}`,drive_id:folder.folderId,urutan:1,status:'published'},conn);
  }
 });
}
module.exports={schema,migration,folderSeeds,parseDrive,payload,localPath,imageSrc,previewSrc,seedFolders};
