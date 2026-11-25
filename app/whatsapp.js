'use strict';
// Pengiriman otomatis pengumuman dan reminder jadwal melalui bot WhatsApp Web
// yang sudah terhubung di dashboard. Tidak ada lagi copy/paste atau link wa.me manual.
const db = require('./repository');
const bot = require('./whatsapp-linked');

const GROUP_ID_KEY = 'whatsapp_group_id';
const GROUP_NAME_KEY = 'whatsapp_group_name';
const GROUP_ID = /^\d+(?:-\d+)?@g\.us$/;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const roles = {pemimpin_pujian:'Pemimpin Pujian',singer:'Singer',pemain_musik:'Pemain Musik',pengkhotbah:'Firman Tuhan',liturgis:'Liturgis',multimedia:'Multimedia',usher:'Usher',kolektan:'Kolektan'};

function error(message, status) {
  return Object.assign(new Error(message), { status });
}

function cleanPhone(v) {
  const p = String(v || '').replace(/\D/g, '');
  return p.startsWith('0') ? '62' + p.slice(1) : p.startsWith('8') ? '62' + p : p;
}

function message(j) {
  const date = j.tanggal ? new Date(j.tanggal + 'T00:00:00+07:00').toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric', timeZone:'Asia/Jakarta' }) : '-';
  const jam = j.jam_mulai ? j.jam_mulai.slice(0, 5) + ' - ' + (j.jam_selesai?.slice(0, 5) || 'selesai') : '-';
  return [
    '*PENGUMUMAN JADWAL PELAYANAN*',
    '*GPI Cipayung*',
    '',
    'Ibadah: ' + (j.jenis_ibadah || '-'),
    'Hari/Tanggal: ' + (j.hari || db.day(j.tanggal) || '-') + ', ' + date,
    'Waktu: ' + jam,
    'Lokasi: ' + (j.lokasi || 'GPI Cipayung'),
    ...(j.tema ? ['Tema: ' + j.tema] : []),
    '',
    '*Petugas Pelayanan:*',
    ...Object.entries(roles).filter(([k]) => j[k]).map(([k, v]) => '- ' + v + ': ' + j[k]),
    ...(j.catatan ? ['', 'Catatan: ' + j.catatan] : []),
    '',
    'Mohon hadir tepat waktu dan mempersiapkan pelayanan dengan baik.',
    'Tuhan Yesus memberkati.'
  ].join('\n');
}

async function contacts(j) {
  const names = [...new Set(Object.keys(roles).map(k => j[k] || '').join(',').split(/[,;\/&]+/).map(v => v.trim()).filter(Boolean))];
  const found = new Map();
  for (const n of names) {
    const rows = await db.query('SELECT id,nama_lengkap,no_hp,whatsapp FROM jemaat WHERE nama_lengkap LIKE ? ORDER BY nama_lengkap LIMIT 1', ['%' + n + '%']);
    const phone = rows[0] ? cleanPhone(rows[0].whatsapp || rows[0].no_hp) : '';
    if (phone && !found.has(phone)) found.set(phone, rows[0]);
  }
  return [...found.values()];
}

async function groupSettings() {
  try {
    const rows = await db.query('SELECT setting_key,setting_value FROM app_settings WHERE setting_key IN (?,?)', [GROUP_ID_KEY, GROUP_NAME_KEY]);
    const values = Object.fromEntries(rows.map(r => [r.setting_key, String(r.setting_value || '')]));
    return { id: GROUP_ID.test(values[GROUP_ID_KEY] || '') ? values[GROUP_ID_KEY] : '', name: values[GROUP_NAME_KEY] || '' };
  } catch {
    return { id: '', name: '' };
  }
}

async function saveGroup(id, name) {
  if (!GROUP_ID.test(String(id || ''))) throw error('Pilih grup WhatsApp dari daftar terlebih dahulu.', 422);
  const label = String(name || '').trim().slice(0, 180) || 'Grup WhatsApp GPI Cipayung';
  await db.query('INSERT INTO app_settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)', [GROUP_ID_KEY, id]);
  await db.query('INSERT INTO app_settings (setting_key,setting_value) VALUES (?,?) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)', [GROUP_NAME_KEY, label]);
  return { id, name: label };
}

function ensureReady() {
  const state = bot.status();
  if (state.phase !== 'ready') {
    throw error('Bot WhatsApp belum terhubung. Buka menu Bot WhatsApp dan pindai QR terlebih dahulu.', 409);
  }
  return state;
}

async function status() {
  return { ...bot.status(), group: await groupSettings() };
}

function connect() {
  return bot.start();
}

async function groups() {
  return bot.groups();
}

async function record(j, type, target, phone, text, result) {
  try {
    await db.insert('whatsapp', {
      jadwal_id: j?.id || null,
      target_name: String(target || '').slice(0, 180),
      target_phone: String(phone || '').slice(0, 60),
      message_type: type,
      message_text: text,
      status: result.status === 'diterima' ? 'terkirim' : result.status,
      response_text: JSON.stringify({ messageId: result.messageId || '', error: result.error || '' }).slice(0, 4000)
    });
  } catch (err) {
    console.error('Gagal mencatat log WhatsApp:', err.message);
  }
}

async function deliver(j, source) {
  ensureReady();
  const group = await groupSettings();
  if (!group.id) throw error('Grup tujuan bot belum dipilih. Buka menu Bot WhatsApp, muat daftar grup, lalu simpan grup tujuan.', 409);
  const text = message(j);
  const groupName = group.name || 'Grup WhatsApp GPI Cipayung';
  const results = [];

  try {
    const sent = await bot.sendToGroup(group.id, text);
    await record(j, 'group_bot', groupName, '', text, sent);
    results.push({ target: groupName, phone: '', status: sent.status, detail: sent.error || sent.messageId || '' });
  } catch (err) {
    const failed = { status: 'gagal', error: err.message };
    await record(j, 'group_bot', groupName, '', text, failed);
    results.push({ target: groupName, phone: '', status: 'gagal', detail: err.message });
  }

  const people = await contacts(j);
  for (let i = 0; i < people.length; i++) {
    const contact = people[i];
    const phone = cleanPhone(contact.whatsapp || contact.no_hp);
    try {
      const sent = await bot.sendToPhone(phone, text);
      await record(j, 'private_bot', contact.nama_lengkap, phone, text, sent);
      results.push({ target: contact.nama_lengkap, phone, status: sent.status, detail: sent.error || sent.messageId || '' });
    } catch (err) {
      const failed = { status: 'gagal', error: err.message };
      await record(j, 'private_bot', contact.nama_lengkap, phone, text, failed);
      results.push({ target: contact.nama_lengkap, phone, status: 'gagal', detail: err.message });
    }
    if (i < people.length - 1) await sleep(900);
  }

  return { message: text, group: groupName, source, recipients: people.length, sent: results.filter(r => r.status === 'diterima').length, results };
}

async function preview(j) {
  const group = await groupSettings();
  const state = bot.status();
  const people = await contacts(j);
  return {
    message: message(j),
    bot: state.phase,
    account: state.account || '',
    group,
    recipients: people.map(c => ({ nama: c.nama_lengkap, phone: cleanPhone(c.whatsapp || c.no_hp) }))
  };
}

async function announcement(j) {
  if (!j) throw error('Jadwal tidak ditemukan.', 404);
  return deliver(j, 'dashboard');
}

let cronBusy = false;
async function cron() {
  if (cronBusy) return 0;
  cronBusy = true;
  try {
    ensureReady();
    const rows = await db.query("SELECT * FROM jadwal_pelayanan WHERE tanggal=DATE_ADD(CURDATE(),INTERVAL 1 DAY) AND status='published' AND reminder_h_minus_1=1 AND reminder_sent_at IS NULL");
    for (const j of rows) {
      await deliver(j, 'cron');
      await db.update('jadwal', j.id, { reminder_sent_at: db.now() });
    }
    return rows.length;
  } finally {
    cronBusy = false;
  }
}

async function sendTest(phone, text) {
  ensureReady();
  const target = cleanPhone(phone);
  if (!/^62[1-9]\d{7,12}$/.test(target)) throw error('Nomor WhatsApp Indonesia tidak valid. Contoh: 081234567890.', 422);
  const body = String(text || '').trim();
  if (!body) throw error('Isi pesan uji wajib diisi.', 422);
  if (body.length > 4096) throw error('Pesan maksimal 4.096 karakter.', 422);
  const result = await bot.sendToPhone(target, body);
  await record(null, 'test_bot', '+' + target, target, body, result);
  return { ...result, phone: target };
}

const ready = () => bot.status().phase === 'ready';

async function connectAndWait(seconds = 120) {
  if (ready()) return;
  bot.start();
  for (let i = 0; i < seconds; i++) {
    if (ready()) return;
    const state = bot.status();
    if (state.phase === 'error') throw error(state.message || 'Bot WhatsApp gagal disiapkan.', 503);
    await sleep(1000);
  }
  throw error('Bot WhatsApp belum siap. Hubungkan dan pindai QR dari dashboard terlebih dahulu.', 503);
}

const shutdown = () => bot.shutdown();
const disconnect = () => bot.shutdown();

module.exports = { preview, announcement, cron, sendTest, status, saveGroup, groups, connect, connectAndWait, shutdown, disconnect, message, cleanPhone, contacts, ready };
