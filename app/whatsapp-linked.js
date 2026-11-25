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
  if (!active.pupBrowser) {
    return 'Puppeteer tidak berhasil membuka browser. Periksa akses Chrome atau Edge dari terminal Windows.';
  }
  return 'Browser terbuka, tetapi WhatsApp Web gagal disiapkan. Periksa apakah web.whatsapp.com bisa dibuka di browser.';
}

function close(active, phase, message) {
  if (client !== active) return;
  client = undefined;
  state = { phase, message };
  closing = Promise.resolve().then(() => active.destroy()).catch(() => {}).finally(() => {
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

function launch(dependencies, [executablePath, ...remainingBrowsers]) {
  const { Client, LocalAuth, QRCode, dataPath } = dependencies;
  const active = new Client({
    authStrategy: new LocalAuth({ dataPath, clientId: 'gpi-cipayung' }),
    puppeteer: { headless: true, executablePath, pipe: true, timeout: 15000, protocolTimeout: 30000, args: browserArgs },
    webVersion,
    webVersionCache,
    qrMaxRetries: 8,
    authTimeoutMs: 60000
  });
  client = active;
  state = { phase: 'starting' };
  const startupTimer = setTimeout(() => {
    close(active, 'error', 'WhatsApp Web belum siap setelah 90 detik. Periksa akses ke web.whatsapp.com, lalu coba lagi.');
  }, 90000);
  startupTimer.unref();
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
    if (client === active) state = { phase: 'starting' };
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
    const message = startupError(active, err);
    const launchFailed = !active.pupBrowser && (err?.name === 'TimeoutError' ||
      /failed to launch the browser process/i.test(String(err?.message)));
    console.error('WhatsApp Web startup:', message);
    if (launchFailed && remainingBrowsers.length) {
      await active.destroy().catch(() => {});
      if (client === active) launch(dependencies, remainingBrowsers);
      return;
    }
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
  await active.destroy().catch(() => {});
}

module.exports = { start, groups, destination, send, sendToGroup, sendToPhone, shutdown, status: () => state };
