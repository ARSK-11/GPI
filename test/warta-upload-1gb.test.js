'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const warta = require('../app/warta-upload');
const express = require('express');

test('Warta video uses disk and allows up to 1 GiB; photos remain limited to 10 MiB', () => {
  assert.equal(warta.VIDEO_MAX_BYTES,1024*1024*1024);
  assert.equal(warta.IMAGE_MAX_BYTES,10*1024*1024);
});
test('33 MB MP4 is accepted using a temporary disk file, not an in-memory buffer', async () => {
  const app = express();
  app.post('/test', (req,res,next)=>warta.upload(req,res,next), async (req,res,next)=>{
    try {
      const f = req.files?.warta_file?.[0];
      assert.ok(f);
      assert.equal(f.buffer,undefined);
      assert.equal(warta.isTempFile(f),true);
      const valid=await warta.validVideo(f);
      const fileSize=f.size;
      const path=await warta.storeVideo(f);
      res.json({fileSize,valid,path});
      await fs.unlink(require('node:path').resolve(__dirname,'..',path));
    } catch(err){next(err);}
  });
  const server = app.listen(0,'127.0.0.1');
  try{
    await new Promise(resolve=>server.once('listening',resolve));
    const b=Buffer.alloc(33*1024*1024);
    b.write('ftyp',4,'ascii');
    const f = new FormData();
    f.append('warta_file',new Blob([b],{type:'video/mp4'}),'large-recording.mp4');
    const resp=await fetch(`http://127.0.0.1:${server.address().port}/test`,{method:'POST',body:f});
    assert.equal(resp.status,200);
    const payload=await resp.json();
    assert.equal(payload.fileSize,b.length);
    assert.equal(payload.valid,true);
    assert.match(payload.path,/^uploads\/media\/warta\/.*\.mp4$/);
  }finally {await new Promise(resolve=>server.close(resolve));}
});
test('invalid video signature is rejected',async()=>{
 const dir=require('node:path').resolve(__dirname,'../uploads/media/.warta-tmp');
 await fs.mkdir(dir,{recursive:true});
 const p=require('node:path').join(dir,'warta-1000-abcdefabcdefabcdefabcdef.tmp');
 await fs.writeFile(p,Buffer.alloc(16));
 try{assert.equal(await warta.validVideo({path:p,originalname:'fake.mp4',size:16}),false)}finally{await fs.unlink(p);}
});
