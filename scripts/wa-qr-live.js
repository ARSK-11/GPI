'use strict';
// Temporary local-only QR viewer. Starts the WhatsApp bot with the normal
// session directory and serves the live QR at http://127.0.0.1:3199/.
const http = require('node:http');
const bot = require('../app/whatsapp-linked');

const HOST = '127.0.0.1';
const PORT = Number(process.env.WA_QR_PORT || 3199);

bot.start();

const page = `<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QR Bot WhatsApp GPI Cipayung</title>
<style>
body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
main{background:#fff;color:#0f172a;padding:24px;border-radius:16px;text-align:center;max-width:420px;width:calc(100% - 48px)}
img{width:300px;height:300px;image-rendering:pixelated;display:none;margin:0 auto}
h1{font-size:18px;margin:0 0 8px}p{font-size:14px;line-height:1.5;margin:8px 0}
.badge{display:inline-block;padding:4px 10px;border-radius:999px;background:#e2e8f0;font-size:12px}
.err{color:#b91c1c}
</style></head><body><main>
<h1>Hubungkan Bot WhatsApp</h1>
<p class="badge" id="phase">memuat...</p>
<img id="qr" alt="QR WhatsApp">
<p id="hint">Menyiapkan WhatsApp Web...</p>
<p id="account"></p>
<p style="font-size:12px;color:#64748b">Halaman ini hanya aktif di komputer ini. QR diperbarui otomatis.</p>
</main>
<script>
const img=document.getElementById('qr'),phase=document.getElementById('phase'),hint=document.getElementById('hint'),account=document.getElementById('account');
async function tick(){
 try{
  const s=await (await fetch('/status',{cache:'no-store'})).json();
  phase.textContent=s.phase;
  account.textContent=s.account?('Akun: '+s.account):'';
  if(s.phase==='qr'){img.style.display='block';img.src='/qr.png?t='+Date.now();hint.textContent='Buka WhatsApp di HP → Perangkat Tertaut → Tautkan Perangkat, lalu pindai QR ini.';hint.className='';}
  else if(s.phase==='ready'){img.style.display='none';hint.textContent='WhatsApp berhasil terhubung.';hint.className='';}
  else if(s.phase==='error'){img.style.display='none';hint.textContent=s.message||'Gagal menyiapkan bot.';hint.className='err';}
  else {hint.textContent='Menyiapkan WhatsApp Web...';hint.className='';}
 }catch(e){hint.textContent='Halaman QR terputus. Jalankan ulang skrip QR.';hint.className='err';}
 setTimeout(tick,1500);
}
tick();
</script></body></html>`;

http.createServer((req, res) => {
  const state = bot.status();
  if (req.url.startsWith('/status')) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({
      phase: state.phase,
      account: state.account || '',
      message: state.message || '',
      updatedAt: new Date().toISOString()
    }));
  }
  if (req.url.startsWith('/qr.png')) {
    if (state.phase !== 'qr' || !state.qr) { res.writeHead(404); return res.end('QR belum tersedia'); }
    const base64 = String(state.qr).split(',')[1] || '';
    const buffer = Buffer.from(base64, 'base64');
    res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'no-store', 'Content-Length': buffer.length });
    return res.end(buffer);
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(page);
}).listen(PORT, HOST, () => {
  console.log(`QR viewer: http://${HOST}:${PORT}/`);
});

setInterval(() => {
  const state = bot.status();
  console.log(new Date().toISOString(), state.phase, state.message || '', state.account || '');
}, 5000).unref();
