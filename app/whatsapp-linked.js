'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const groupId = /^\d+(?:-\d+)?@g\.us$/;
const accountId = /^(\d+)@(?:c\.us|lid)$/;

function serialized(wid) {
  return wid?._serialized || wid?.$1 || '';
}

// WhatsApp Web may return a wid only as `$1`, and some builds have removed the
// module behind getNumberId(). Normalise the number here so the caller always
// has a usable chat id even when that lookup is unavailable.
function normalizePhone(value) {
  const raw = String(value ?? '').trim().replace(/@.*$/, '');
  const international = raw.startsWith('+');
  let digits = raw.replace(/\D/g, '');
  if (!international) {
    if (digits.startsWith('0')) digits = '62' + digits.slice(1);
    else if (digits.startsWith('8')) digits = '62' + digits;
  }
  if (!/^[1-9]\d{7,14}$/.test(digits)) throw error('Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx atau 62xxxxxxxxxx.', 422);
  return digits;
}
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
let runId = 0;
let state = { phase: 'idle' };

function error(message, status) {
  return Object.assign(new Error(message), { status });
}

const pause = ms => new Promise(resolve => {
  const timer = setTimeout(resolve, ms);
  timer.unref?.();
});

function sessionDataPath() {
  return process.env.WA_LINKED_SESSION_DIR?.trim() || path.join(sessionRoot, 'auth');
}

// WhatsApp Web stores the linked-device credentials in this profile. While it is
// present, WhatsApp Web tries to resume the old session instead of showing a QR;
// after the device is unlinked from the phone that resume hangs forever.
function purgeSession() {
  const dir = path.join(sessionDataPath(), 'session-gpi-cipayung');
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 4, retryDelay: 150 });
    return true;
  } catch (err) {
    console.error('Gagal menghapus sesi WhatsApp:', err.message);
    return false;
  }
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
  let timer;
  await Promise.race([
    active.destroy().catch(() => {}),
    new Promise(resolve => { timer = setTimeout(resolve, 10000); timer.unref(); })
  ]);
  clearTimeout(timer);
  // A hung browser can outlive its Puppeteer client and keep the profile lock,
  // which makes every following connection attempt fail.
  try {
    const proc = active.pupBrowser?.process?.();
    if (proc && proc.exitCode === null) proc.kill('SIGKILL');
  } catch {
    // The browser is already gone.
  }
}

function close(active, phase, message, purge = false) {
  if (client !== active) return;
  client = undefined;
  state = { phase, message };
  closing = Promise.resolve()
    .then(() => destroy(active))
    .then(() => { if (purge) purgeSession(); })
    .catch(() => {})
    .finally(() => {
      closing = undefined;
    });
}

function start() {
  if (client) return state;
  if (closing) {
    // Clicking "Hubungkan" right after "Putuskan" must not be ignored: the old
    // browser may still be closing, so launch again as soon as it is gone.
    state = { phase: 'starting' };
    const pending = closing;
    pending.then(() => {
      if (!client) start();
    });
    return state;
  }
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
  const dataPath = sessionDataPath();
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
  const run = ++runId;
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
          if (!client && run === runId) launch(dependencies, [executablePath, ...remainingBrowsers], args, true);
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
    // Stored credentials were rejected (for example the device was removed from the
    // phone). Drop the dead profile so the next attempt can display a fresh QR.
    close(active, 'error', 'Sesi WhatsApp tidak valid dan sudah dihapus. Klik Hubungkan WhatsApp untuk memindai QR baru.', true);
  });
  active.on('disconnected', () => {
    clearTimeout(startupTimer);
    close(active, 'idle', 'Koneksi terputus dan sesi lokal dihapus. Hubungkan lagi untuk memindai QR baru.', true);
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
  let rows;
  try {
    const chats = await active.getChats();
    rows = chats.map(chat => ({
      id: serialized(chat.id),
      name: chat.name || '',
      isGroup: Boolean(chat.isGroup),
      readOnly: Boolean(chat.isReadOnly)
    }));
  } catch (err) {
    // getChats() serializes every chat and fails completely when one LID chat cannot
    // be resolved. Read the raw chat list so the group picker still works.
    rows = await active.pupPage.evaluate(() => window.require('WAWebCollections').Chat.getModelsArray().map(chat => {
      const id = chat.id?._serialized || chat.id?.$1 || '';
      return {
        id,
        name: chat.name || chat.formattedTitle || '',
        isGroup: /@g\.us$/.test(id),
        readOnly: Boolean(chat.groupMetadata?.announce)
      };
    })).catch(() => { throw err; });
  }
  if (client !== active) throw error('Koneksi WhatsApp berubah. Muat ulang daftar grup.', 409);
  return rows
    .filter(chat => chat.isGroup && groupId.test(chat.id))
    .map(chat => ({
      id: chat.id,
      name: chat.name || chat.id,
      readOnly: chat.readOnly
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

async function destination(type, value, expectedAccount) {
  const active = ready(expectedAccount);
  const account = state.account;
  let target;
  if (type === 'group') {
    const id = String(value || '');
    if (!groupId.test(id)) throw error('ID grup WhatsApp tidak valid.', 422);
    let name = id;
    try {
      // Best effort only: it loads the chat so sendMessage() can find it. A group
      // whose metadata is not cached yet must not block delivery.
      const chat = await active.getChatById(id);
      if (chat && !chat.isGroup) throw error('Tujuan bukan grup WhatsApp.', 422);
      name = chat?.name || id;
    } catch (err) {
      if (err.status) throw err;
    }
    target = { id, name, type, value: id };
  } else if (type === 'phone') {
    const phone = normalizePhone(value);
    let id = phone + '@c.us';
    try {
      const registered = await active.getNumberId(phone);
      const wid = serialized(registered);
      // getNumberId() can return a LID instead of a phone-number wid. Both are
      // valid delivery targets; only fall back when it returns nothing usable.
      if (wid && accountId.test(wid)) id = wid;
    } catch {
      // Some WhatsApp Web builds removed the module used by getNumberId().
      // Keep the phone-number chat id instead of failing the whole send.
    }
    target = { id, name: '+' + phone, type, value: '+' + phone };
  } else {
    throw error('Pilih grup atau isi nomor WhatsApp yang valid.', 422);
  }
  if (client !== active) throw error('Koneksi WhatsApp berubah. Buat pratinjau baru.', 409);
  return { ...target, account };
}

// Ask WhatsApp Web whether a chat is already resolvable without building a full
// chat model. Returns true/false, or null when the check cannot be performed.
async function chatExists(active, id) {
  if (!active?.pupPage?.evaluate) return null;
  try {
    const found = await active.pupPage.evaluate(async chatId => {
      if (!window.WWebJS?.getChat) return undefined;
      const chat = await window.WWebJS.getChat(chatId, { getAsModel: false });
      return Boolean(chat);
    }, id);
    return typeof found === 'boolean' ? found : null;
  } catch {
    return null;
  }
}

function failedSend(target, detail) {
  const text = String(detail || '');
  if (/not registered|not on whatsapp|isn't on whatsapp|invalid wid|wid.*invalid|no such user|item[- ]not[- ]found|chat.*not.*found|could not find.*chat|findOrCreateLatestChat|404/i.test(text)) {
    return {
      status: 'gagal',
      error: target.type === 'group'
        ? 'Grup tidak ditemukan atau akun bot bukan anggotanya. Muat ulang daftar grup dan pastikan bot sudah bergabung.'
        : 'Nomor tidak terdaftar di WhatsApp. Periksa kembali nomor tersebut.'
    };
  }
  if (/not.?authori[sz]ed|forbidden|admin.*only|only.*admin|announce|restricted|403|401/i.test(text)) {
    return {
      status: 'gagal',
      error: target.type === 'group'
        ? 'Akun bot tidak diizinkan mengirim ke grup ini. Pastikan bot masih anggota dan grup tidak disetel "hanya admin yang dapat mengirim".'
        : 'Akun bot tidak diizinkan mengirim ke nomor ini.'
    };
  }
  // WhatsApp Web may have accepted the send before the browser reported an error.
  return { status: 'tidak_pasti', error: text.slice(0, 300) || 'Koneksi WhatsApp Web terputus.' };
}

async function send(target, message) {
  const active = ready(target.account);
  try {
    const result = await active.sendMessage(target.id, message, { sendSeen: false, linkPreview: false });
    if (result) return { status: 'diterima', messageId: serialized(result.id) };
    // A resolved send without a message object is not proof of failure: WhatsApp
    // Web can index the sent message under the contact's alternate (LID/PN) wid.
    // Report it as uncertain so the same message is not sent twice automatically.
    return {
      status: 'tidak_pasti',
      error: target.type === 'group'
        ? 'WhatsApp tidak mengembalikan konfirmasi untuk grup ini. Pesan mungkin sudah terkirim; periksa grup sebelum mengirim ulang.'
        : 'WhatsApp tidak mengembalikan konfirmasi untuk nomor ini. Pesan mungkin sudah terkirim; periksa WhatsApp sebelum mengirim ulang.'
    };
  } catch (err) {
    return failedSend(target, err?.message || 'Koneksi WhatsApp Web terputus.');
  }
}

async function sendToGroup(id, message) {
  if (!groupId.test(id)) throw error('ID grup WhatsApp tidak valid.', 422);
  // Send straight to the serialized group id. Validating through getChatById()
  // builds a full chat model (group metadata update) and fails for groups whose
  // metadata is not loaded yet, even though WhatsApp can still deliver the message.
  const active = ready();
  const target = { id, name: id, type: 'group', value: id, account: state.account };
  if (await chatExists(active, id) === false) {
    return { status: 'gagal', error: 'Grup tidak ditemukan. Pastikan akun bot masih menjadi anggota grup, lalu muat ulang daftar grup.' };
  }
  return send(target, message);
}

async function sendToPhone(phone, message) {
  const target = await destination('phone', phone);
  return send(target, message);
}

// Disconnect and delete the linked-device profile so the next connection is forced
// to show a new QR. This is what the "Putuskan" button uses.
async function disconnect({ purge = true } = {}) {
  const active = client;
  const wasReady = state.phase === 'ready';
  const pending = closing;
  // Cancel any pending relaunch so a stale client cannot reappear after cleanup.
  runId++;
  client = undefined;
  state = { phase: 'idle', message: 'Memutuskan koneksi WhatsApp…' };
  if (pending) {
    try { await pending; } catch { /* cleanup is best effort */ }
  }
  if (active) {
    // Best effort: unlink the device from the WhatsApp account so it also leaves the
    // phone's linked-devices list. Newer WhatsApp Web builds can make the internal
    // call used by logout() throw, so never let it block the local cleanup.
    if (wasReady) {
      try {
        await Promise.race([active.logout().catch(() => {}), pause(8000)]);
      } catch {
        // destroy() and purgeSession() below still run.
      }
    }
    await destroy(active);
  }
  if (purge) purgeSession();
  state = {
    phase: 'idle',
    message: purge
      ? 'Sesi WhatsApp dihapus. Klik Hubungkan WhatsApp lalu pindai QR baru.'
      : 'Koneksi WhatsApp diputuskan.'
  };
  return state;
}

async function shutdown() {
  // Cancel any pending relaunch so a stuck connection cannot come back on its own.
  runId++;
  const active = client;
  client = undefined;
  state = { phase: 'idle' };
  if (active) await destroy(active);
  if (closing) await closing;
}

module.exports = { start, disconnect, groups, destination, send, sendToGroup, sendToPhone, shutdown, normalizePhone, status: () => state };
