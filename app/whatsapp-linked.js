'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const groupId = /^\d+(?:-\d+)?@g\.us$/;
const accountId = /^(\d+)@(?:c\.us|lid)$/;
const sessionRoot = path.join(process.env.LOCALAPPDATA || os.homedir(), 'GPI-Cipayung', 'whatsapp-web');
// WhatsApp Web build 2.3000.1055852612+ breaks logged-out sessions: WAWebSocketModel
// returns null and whatsapp-web.js never emits qr. Pin the last verified build.
const webVersion = process.env.WA_WEB_VERSION?.trim() || '2.3000.1053021455-alpha';
const webVersionCache = process.env.WA_LINKED_WEB_CACHE_DIR?.trim()
  ? { type: 'local', path: process.env.WA_LINKED_WEB_CACHE_DIR.trim(), strict: true }
  : { type: 'remote', remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html', strict: true };
const browserArgs = ['--disable-dev-shm-usage'];
// Keep Chrome's sandbox unless the host explicitly requires disabling it (containers/root).
if (process.env.WA_LINKED_NO_SANDBOX === '1' || (process.platform !== 'win32' && process.getuid?.() === 0)) {
  browserArgs.push('--no-sandbox', '--disable-setuid-sandbox');
}
let client;
let closing;
let state = { phase: 'idle' };

function error(message, status) {
  return Object.assign(new Error(message), { status });
}

function browserPaths() {
  const explicit = process.env.WA_LINKED_BROWSER_PATH?.trim();
  if (explicit) return fs.existsSync(explicit) ? [explicit] : [];
  if (process.platform !== 'win32') return [undefined];
  const installed = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA]
    .filter(Boolean)
    .flatMap(root => [
      path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
    ])
    .filter(file => fs.existsSync(file));
  try {
    const bundled = require('puppeteer').executablePath();
    if (fs.existsSync(bundled)) installed.unshift(bundled);
  } catch {
    // The browser download is optional when Chrome or Edge is installed.
  }
  return [...new Set(installed)];
}

function sandboxBlocked(err) {
  return /No usable sandbox|SUID sandbox|zygote_host|Failed to move to new namespace|Running as root without --no-sandbox/i.test(String(err?.message || ''));
}

// A cached WhatsApp Web build (service worker) from an older pin or from an interrupted
// launch can keep WAWebSocketModel UNLAUNCHED, so whatsapp-web.js never emits qr.
// Clear only the browser cache; the linked session (cookies/Local Storage) stays intact.
function clearWebCache(dataPath) {
  const profile = path.join(dataPath, 'session-gpi-cipayung', 'Default');
  for (const name of ['Service Worker', 'Service Worker CacheStorage']) {
    try {
      fs.rmSync(path.join(profile, name), { recursive: true, force: true });
    } catch {
      // A missing or locked cache must not abort the retry.
    }
  }
}

function startupError(active, err) {
  const detail = String(err?.message || '');
  if (/already running|profile.*in use|SingletonLock|ProcessSingleton/i.test(detail)) {
    return 'Profil bot sedang dipakai proses lain. Hentikan proses server GPI yang lain, lalu hubungkan kembali.';
  }
  if (/EPERM|EACCES|ENOSPC/i.test(String(err?.code))) {
    return 'Windows atau sistem berkas menolak akses browser atau folder sesi bot. Periksa izin penyimpanan.';
  }
  if (/Couldn't load version|VersionResolveError/i.test(detail)) {
    return 'Build WhatsApp Web yang dipin tidak dapat diambil dari arsip. Periksa WA_WEB_VERSION atau sediakan HTML-nya lewat WA_LINKED_WEB_CACHE_DIR.';
  }
  if (/net::ERR_/i.test(detail)) {
    const code = detail.match(/net::ERR_[A-Z0-9_]+/i)?.[0];
    return `Browser tidak dapat membuka web.whatsapp.com (${code}). Periksa koneksi atau pengaturan jaringan.`;
  }
  if (/Could not find Chrome|Could not find expected browser/i.test(detail)) {
    return 'Chrome/Edge untuk bot tidak ditemukan. Pasang browser, jalankan ulang npm install --prefix app, atau isi WA_LINKED_BROWSER_PATH.';
  }
  if (!active.pupBrowser) {
    const reason = (detail.split('\n').map(line => line.trim()).find(line => line && !line.startsWith('#')) || detail).slice(0, 180);
    const hint = process.platform === 'win32'
      ? 'Periksa akses Chrome atau Edge dari terminal Windows.'
      : 'Periksa Chrome/Chromium yang terpasang dan izin menjalankannya dari terminal.';
    return 'Puppeteer tidak berhasil membuka browser. ' + hint + (reason ? ' Detail: ' + reason : '');
  }
  return 'Browser terbuka, tetapi WhatsApp Web gagal disiapkan. Periksa apakah web.whatsapp.com bisa dibuka di browser.';
}

async function destroy(active) {
  // whatsapp-web.js keeps an async framenavigated listener that evaluates on the page;
  // it rejects when the page is closed mid-navigation and crashes the process.
  try {
    active.pupPage?.removeAllListeners?.('framenavigated');
  } catch {
    // Listener cleanup is best-effort.
  }
  await active.destroy().catch(() => {});
}

function close(active, phase, message) {
  if (client !== active) return;
  client = undefined;
  state = { phase, message };
  closing = Promise.resolve().then(() => destroy(active)).catch(() => {}).finally(() => {
    closing = undefined;
  });
}

function start() {
  if (client || closing) return state;
  let Client, LocalAuth, QRCode;
  try {
    ({ Client, LocalAuth } = require('whatsapp-web.js'));
    QRCode = require('qrcode');
  } catch {
    state = { phase: 'error', message: 'Dependensi bot belum tersedia. Jalankan npm install --prefix app dari folder proyek.' };
    return state;
  }

  const browsers = browserPaths();
  if (!browsers.length) {
    state = { phase: 'error', message: process.env.WA_LINKED_BROWSER_PATH?.trim()
      ? 'File browser di WA_LINKED_BROWSER_PATH tidak ditemukan.'
      : 'Chrome atau Edge tidak ditemukan. Pasang browser atau isi WA_LINKED_BROWSER_PATH.' };
    return state;
  }
  if (!/^\d+\.\d+\.\d+(?:-[a-z]+)?$/.test(webVersion)) {
    state = { phase: 'error', message: 'WA_WEB_VERSION tidak valid. Gunakan format seperti 2.3000.1053021455-alpha.' };
    return state;
  }
  const dataPath = process.env.WA_LINKED_SESSION_DIR?.trim() || path.join(sessionRoot, 'auth');
  try {
    fs.mkdirSync(dataPath, { recursive: true, mode: 0o700 });
  } catch {
    state = { phase: 'error', message: 'Folder sesi WhatsApp tidak bisa ditulis. Periksa WA_LINKED_SESSION_DIR.' };
    return state;
  }
  return launch({ Client, LocalAuth, QRCode, dataPath }, browsers);
}

function launch(dependencies, [executablePath, ...remainingBrowsers], args = browserArgs, cacheReset = false) {
  const { Client, LocalAuth, QRCode, dataPath } = dependencies;
  const active = new Client({
    authStrategy: new LocalAuth({ dataPath, clientId: 'gpi-cipayung' }),
    puppeteer: { headless: true, executablePath, pipe: true, timeout: 15000, protocolTimeout: 30000, args },
    webVersion,
    webVersionCache,
    qrMaxRetries: 8,
    authTimeoutMs: 60000
  });
  client = active;
  state = { phase: 'starting' };
  let startupTimer;
  // Every path that leaves the bot in 'starting' must keep a watchdog, otherwise a
  // stalled WhatsApp Web page leaves the dashboard on "Menyiapkan…" forever.
  const armStartupTimer = (ms = 90000) => {
    clearTimeout(startupTimer);
    startupTimer = setTimeout(async () => {
      if (client !== active || state.phase === 'ready') return;
      // A stalled page usually means the cached WhatsApp Web build cannot boot.
      // Refresh that cache once and relaunch before giving up.
      if (!cacheReset) {
        console.error('WhatsApp Web: tidak siap setelah 90 detik, menyegarkan cache web lalu mencoba lagi.');
        client = undefined;
        state = { phase: 'starting' };
        clearWebCache(dataPath);
        closing = destroy(active).finally(() => {
          closing = undefined;
          if (!client) launch(dependencies, [executablePath, ...remainingBrowsers], args, true);
        });
        return;
      }
      close(active, 'error', 'WhatsApp Web belum siap setelah 90 detik. Periksa akses ke web.whatsapp.com, lalu coba lagi.');
    }, ms);
    startupTimer.unref();
  };
  armStartupTimer();
  let qrVersion = 0;
  active.on('qr', async raw => {
    clearTimeout(startupTimer);
    const version = ++qrVersion;
    try {
      const qr = await QRCode.toDataURL(raw, { width: 300, margin: 4 });
      if (client === active && version === qrVersion) state = { phase: 'qr', qr };
    } catch {
      if (version === qrVersion) close(active, 'error', 'QR tidak dapat ditampilkan. Coba hubungkan kembali.');
    }
  });
  active.on('authenticated', () => {
    qrVersion++;
    if (client !== active) return;
    state = { phase: 'starting' };
    // Authentication emitted but 'ready' may never follow when the stored session hangs.
    armStartupTimer(60000);
  });
  active.on('ready', () => {
    clearTimeout(startupTimer);
    qrVersion++;
    if (client === active) state = { phase: 'ready', account: active.info.wid._serialized };
  });
  active.on('auth_failure', () => {
    clearTimeout(startupTimer);
    close(active, 'error', 'Sesi WhatsApp gagal. Coba hubungkan kembali.');
  });
  active.on('disconnected', () => {
    clearTimeout(startupTimer);
    close(active, 'idle', 'Koneksi terputus. Hubungkan kembali.');
  });
  void active.initialize().catch(async err => {
    clearTimeout(startupTimer);
    if (client !== active) return;
    const detail = String(err?.message || '');
    const browserMissing = !active.pupBrowser;
    const relaunch = async (nextBrowsers, nextArgs, nextCacheReset) => {
      await destroy(active);
      if (client === active) launch(dependencies, nextBrowsers, nextArgs, nextCacheReset);
    };
    // Chrome refuses to start on hosts without a usable sandbox (unprivileged user
    // namespaces disabled, containers). Retry once with the sandbox turned off.
    const chromeMissing = /Could not find Chrome|Could not find expected browser|ENOENT/i.test(detail);
    const profileBusy = /already running|profile.*in use|SingletonLock|ProcessSingleton/i.test(detail);
    if (!args.includes('--no-sandbox') && (sandboxBlocked(err) || (browserMissing && !chromeMissing && !profileBusy))) {
      console.error('WhatsApp Web: sandbox Chrome tidak tersedia, mencoba ulang tanpa sandbox.');
      return relaunch([executablePath, ...remainingBrowsers], [...args, '--no-sandbox', '--disable-setuid-sandbox'], cacheReset);
    }
    // The chosen browser cannot start at all: fall back to the next installed one.
    if (browserMissing && remainingBrowsers.length) return relaunch(remainingBrowsers, args, cacheReset);
    // Browser opened but WhatsApp Web never became ready: refresh the stale web cache once.
    if (!cacheReset && /Waiting failed|Network\.enable timed out|Protocol error/i.test(detail)) {
      console.error('WhatsApp Web: cache web tidak terbaca, menyegarkan cache lalu mencoba lagi.');
      clearWebCache(dataPath);
      return relaunch([executablePath, ...remainingBrowsers], args, true);
    }
    const message = startupError(active, err);
    console.error('WhatsApp Web startup:', message);
    if (detail) console.error('WhatsApp Web detail:', detail.split('\n')[0].slice(0, 300));
    close(active, 'error', message);
  });
  return state;
}

function ready(expectedAccount) {
  if (state.phase !== 'ready' || !client) throw error('Hubungkan akun WhatsApp terlebih dahulu.', 409);
  if (expectedAccount && state.account !== expectedAccount) {
    throw error('Akun WhatsApp berubah. Buat pratinjau baru sebelum mengirim.', 409);
  }
  return client;
}

async function groups() {
  const active = ready();
  const chats = await active.getChats();
  if (client !== active) throw error('Koneksi WhatsApp berubah. Muat ulang daftar grup.', 409);
  return chats
    .filter(chat => chat.isGroup && groupId.test(chat.id?._serialized))
    .map(chat => ({
      id: chat.id._serialized,
      name: chat.name || chat.id._serialized,
      readOnly: Boolean(chat.isReadOnly)
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

async function destination(type, value, expectedAccount) {
  const active = ready(expectedAccount);
  const account = state.account;
  let target;
  if (type === 'group' && groupId.test(value)) {
    const chat = await active.getChatById(value);
    if (!chat?.isGroup || chat.isReadOnly || chat.id?._serialized !== value) {
      throw error('Grup tidak tersedia untuk pengiriman.', 422);
    }
    target = { id: value, name: chat.name || value, type, value };
  } else if (type === 'phone' && /^\+?[\d ().-]{7,28}$/.test(value)) {
    const digits = value.replace(/\D/g, '');
    const phone = !value.startsWith('+') && digits.startsWith('08') ? '62' + digits.slice(1) : digits;
    if (!/^[1-9]\d{7,14}$/.test(phone)) throw error('Nomor WhatsApp tidak valid.', 422);
    const registered = await active.getNumberId(phone);
    if (!accountId.test(registered?._serialized)) throw error('Nomor tidak ditemukan di WhatsApp.', 422);
    target = { id: registered._serialized, name: '+' + phone, type, value: '+' + phone };
  } else {
    throw error('Pilih grup atau isi nomor WhatsApp yang valid.', 422);
  }
  if (client !== active) throw error('Koneksi WhatsApp berubah. Buat pratinjau baru.', 409);
  return { ...target, account };
}

async function send(target, message) {
  try {
    const active = ready(target.account);
    const result = await active.sendMessage(target.id, message, { sendSeen: false, linkPreview: false });
    const messageId = result?.id?._serialized;
    if (messageId) return { status: 'diterima', messageId };
  } catch (err) {
    // WhatsApp Web may have accepted the send before the browser reported an error.
    return { status: 'tidak_pasti', error: String(err?.message || 'Koneksi WhatsApp Web terputus.').slice(0, 300) };
  }
  return { status: 'tidak_pasti' };
}

async function sendToGroup(id, message) {
  if (!groupId.test(id)) throw error('ID grup WhatsApp tidak valid.', 422);
  const target = await destination('group', id);
  return send(target, message);
}

async function sendToPhone(phone, message) {
  const target = await destination('phone', phone);
  return send(target, message);
}

async function shutdown() {
  const active = client;
  if (!active) return;
  client = undefined;
  state = { phase: 'idle' };
  await destroy(active);
}

module.exports = { start, groups, destination, send, sendToGroup, sendToPhone, shutdown, status: () => state };
