'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Module=require('node:module');
let rohani;
const old=Module._load;
try{
 Module._load=function(id,parent,isMain){
  if(id==='express'&&parent?.filename.endsWith('app/rohani-broadcast.js'))return {Router:()=>({use(){},get(){},post(){}})};
  if(id==='./repository'&&parent?.filename.endsWith('app/rohani-broadcast.js'))return {};
  if(id==='./api'&&parent?.filename.endsWith('app/rohani-broadcast.js'))return {csrfOK:()=>true};
  return old.apply(this,arguments);
 };
 rohani=require('../app/rohani-broadcast');
}finally{Module._load=old;}
const id='1a2B3cD4e5F6g7H8i9J0k';
test('kategori renungan dan lima jenis ibadah lengkap',()=>assert.equal(Object.keys(rohani.kinds).length,6));
test('Google Drive file preview valid',()=>{const r=rohani.mediaInfo('https://drive.google.com/file/d/'+id+'/view?usp=sharing');assert.equal(r.source,'drive');assert.equal(r.embed,'https://drive.google.com/file/d/'+id+'/preview');});
test('Google Drive uc?id=... valid',()=>assert.equal(rohani.mediaInfo('https://drive.google.com/uc?id='+id).source,'drive'));
test('YouTube watch dan shorts menjadi embed privat',()=>{for(const u of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ','https://youtu.be/dQw4w9WgXcQ','https://www.youtube.com/shorts/dQw4w9WgXcQ'])assert.equal(rohani.mediaInfo(u).embed,'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');});
test('menolak javascript, http dan file Drive invalid',()=>{for(const u of ['javascript:alert(1)','http://google.com/a.jpg','https://drive.google.com/drive/folders/'+id,'https://www.youtube.com/@channel'])assert.throws(()=>rohani.mediaInfo(u));});
test('gambar HTTPS langsung dipertahankan',()=>assert.equal(rohani.mediaInfo('https://example.org/flyer.png').source,'image'));
test('nomor WhatsApp Indonesia distandardisasi',()=>{assert.equal(rohani.normalizePhone('0812-3456-7890'),'6281234567890');assert.equal(rohani.normalizePhone('+62 812 3456 7890'),'6281234567890');});
test('nomor tidak valid ditolak',()=>{for(const n of ['08','abcd','+123456789'])assert.throws(()=>rohani.normalizePhone(n));});
test('konten draft dan published dibatasi serta media distandardisasi',()=>{const p=rohani.validateContent({jenis:'youth',judul:'Ibadah Pemuda',isi:'Mari beribadah bersama.',media_url:'https://youtu.be/dQw4w9WgXcQ',status:'published'});assert.equal(p.media_source,'youtube');assert.equal(p.tanggal_ibadah,null);assert.throws(()=>rohani.validateContent({...p,status:'private'}));});
test('hanya langganan kategori sesuai dan opt-in aktif yang diterima',()=>{const s={status:'active',opted_in_at:'2026-11-20',categories_json:'["youth","renungan"]'};assert.equal(rohani.matchPreferences(s,{jenis:'youth'}),true);assert.equal(rohani.matchPreferences(s,{jenis:'kaum_ibu'}),false);assert.equal(rohani.matchPreferences({...s,status:'opted_out'},{jenis:'youth'}),false);});
test('HTML disanitasi pada judul konten',()=>{const html=rohani.card({jenis:'doa_pagi',judul:'<script>alert(1)</script>',isi:'Informasi ibadah',media_url:''});assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;script&gt;/);});
test('parameter template berisi tautan materi yang dinormalisasi',()=>{const r=rohani.composeTemplate({jenis:'renungan',judul:'Renungan Iman',isi:'Tuhan Yesus baik.',media_url:'https://youtu.be/dQw4w9WgXcQ'});assert.equal(r.length,3);assert.match(r[2],/youtube.com\/watch/);});
test('pengelolaan terpasang ke dashboard dan web publik',()=>{const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');assert.match(server,/rohani-api/);assert.match(server,/renungan-flyer/);const admin=fs.readFileSync(path.join(__dirname,'../views/admin.ejs'),'utf8');assert.match(admin,/section-rohani-broadcast/);});
