const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const sharp=require('sharp');
const {fail,str}=require('./payloads');
const root=path.resolve(__dirname,'../uploads/media');
const images=['jpg','jpeg','png','webp','gif','bmp','tif','tiff','heic','heif','avif'];
const media=[...images,'pdf','mp4','webm','mov','m4v'];
const ext=f=>path.extname(f.originalname||'').slice(1).toLowerCase();
const slug=v=>String(v||'file').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100)||'file';
async function store(f,folder='',allowed=media,maxBytes=10485760){if(!f)fail('File wajib dipilih.');const e=ext(f);if(!allowed.includes(e))fail('Format file tidak diizinkan.');if(f.size>maxBytes)fail('Ukuran file terlalu besar.');const dir=path.join(root,folder);await fs.mkdir(dir,{recursive:true});const name=Date.now()+'-'+crypto.randomBytes(5).toString('hex')+'-'+slug(path.parse(f.originalname).name)+'.'+e;await fs.writeFile(path.join(dir,name),f.buffer,{flag:'wx'});return {name,ext:e,publicPath:['uploads/media',folder,name].filter(Boolean).join('/')};}
async function teamPhoto(file,cropped,name){let buffer;if(cropped){const m=String(cropped).match(/^data:image\/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/);if(!m)fail('Data foto tidak valid.');buffer=Buffer.from(m[1],'base64');if(buffer.length>10485760)fail('Ukuran foto maksimal 10 MB.');}else if(file){if(!images.includes(ext(file)))fail('Format foto tidak diizinkan.');buffer=file.buffer;}else return null;try{buffer=await sharp(buffer,{limitInputPixels:40000000}).rotate().resize(1600,1600,{fit:'inside',withoutEnlargement:true}).jpeg({quality:88}).toBuffer();return (await store({originalname:slug(name)+'.jpg',buffer,size:buffer.length},'team',images)).publicPath;}catch(e){if(file&&['heic','heif'].includes(ext(file)))return (await store(file,'team',images)).publicPath;fail('Foto tidak dapat diproses. Gunakan JPG atau PNG.');}}
async function removeFile(p,folder=''){const rel=String(p||'').replace(/^\//,'');const prefix='uploads/media/'+(folder?folder+'/':'');if(!rel.startsWith(prefix))return;const base=path.resolve(root,folder);const target=path.resolve(__dirname,'..',rel);if(path.dirname(target)!==base)return;await fs.unlink(target).catch(e=>{if(e.code!=='ENOENT')console.error(e.message);});}
module.exports={store,teamPhoto,removeFile,images,media};
