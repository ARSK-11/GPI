"use strict";
// Large Warta videos are streamed by Multer to a private temporary folder.
// Never buffer 1 GB into Node.js RAM. Other upload endpoints keep their old limits.
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');
const { fail } = require('./payloads');
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 1024 * 1024 * 1024; // 1 GiB
const tempRoot = path.resolve(__dirname, '../uploads/media/.warta-tmp');
const destRoot = path.resolve(__dirname, '../uploads/media/warta');
// Create the temp folder on first upload instead of at import time. A read-only
// filesystem (Vercel) must not crash the whole app during cold start.
let tempReady = false;
function ensureTempRoot(){
  if (tempReady) return tempRoot;
  try { fs.mkdirSync(tempRoot, { recursive: true, mode: 0o700 }); tempReady = true; }
  catch (e) { if (!['EROFS', 'EACCES', 'EPERM'].includes(e.code)) throw e; }
  return tempRoot;
}
const allow = new Set(['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm']);
const videoExt = new Set(['.mp4', '.webm']);
const extname = name => path.extname(String(name || '')).toLowerCase();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _f, cb) => {
      try { cb(null, ensureTempRoot()); }
      catch (e) { cb(Object.assign(new Error('Folder unggahan tidak dapat ditulis di server ini.'), { status: 500, cause: e })); }
    },
    filename: (_req, _f, cb) => cb(null, `warta-${Date.now()}-${crypto.randomBytes(12).toString('hex')}.tmp`)
  }),
  limits: { fileSize: VIDEO_MAX_BYTES, files: 1, fields: 100, fieldSize: 1024 * 1024, parts: 120 },
  fileFilter: (_req, f, cb) => {
    if (f.fieldname !== 'warta_file' || !allow.has(extname(f.originalname))) {
      return cb(Object.assign(new Error('File Warta harus JPG, JPEG, PNG, WebP, MP4, atau WebM.'), { status: 422 }));
    }
    cb(null, true);
  }
}).fields([{ name: 'warta_file', maxCount: 1 }]);
function isTempFile(f) {
  return !!(f?.path && path.dirname(path.resolve(f.path)) === tempRoot && /^warta-\d+-[0-9a-f]{24}\.tmp$/.test(path.basename(f.path)));
}
async function cleanup(req) {
  for (const files of Object.values(req.files || {})) {
    for (const f of files) if (isTempFile(f)) await fsp.unlink(f.path).catch(() => {});
  }
}
async function validVideo(f) {
  const ext = extname(f.originalname);
  if (!videoExt.has(ext) || !Number.isFinite(f.size) || f.size < 12 || f.size > VIDEO_MAX_BYTES || !isTempFile(f)) return false;
  const head = Buffer.alloc(12);
  const h = await fsp.open(f.path, 'r');
  try { await h.read(head, 0, head.length, 0); } finally { await h.close(); }
  return ext === '.mp4' ? head.toString('ascii', 4, 8) === 'ftyp'
    : head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
}
async function storeVideo(f) {
  if (!(await validVideo(f))) fail('Video MP4/WebM tidak valid atau melebihi batas 1 GB.');
  await fsp.mkdir(destRoot, { recursive: true });
  const stem = path.parse(f.originalname).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'video';
  const name = `${Date.now()}-${crypto.randomBytes(12).toString('hex')}-${stem}${extname(f.originalname)}`;
  await fsp.rename(f.path, path.join(destRoot, name));
  // Set path to null to signal that the temporary upload has been consumed.
  f.path = null;
  return `uploads/media/warta/${name}`;
}
module.exports = { upload, cleanup, storeVideo, validVideo, IMAGE_MAX_BYTES, VIDEO_MAX_BYTES, extname, isTempFile };
