'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const logs = [];
const updates = [];
const repo = {
  day: () => 'Selasa',
  now: () => '2026-11-30 08:00:00',
  query: async sql => {
    if (sql.includes('FROM app_settings')) {
      return [
        { setting_key: 'whatsapp_group_id', setting_value: '123456789-987654321@g.us' },
        { setting_key: 'whatsapp_group_name', setting_value: 'Grup Uji GPI' }
      ];
    }
    if (sql.includes('FROM jemaat')) return [{ id: 1, nama_lengkap: 'Budi', whatsapp: '081234567890' }];
    if (sql.includes('FROM jadwal_pelayanan')) {
      return [{ id: 9, tanggal: '2026-12-01', jenis_ibadah: 'Ibadah Uji', pengkhotbah: 'Budi' }];
    }
    return [];
  },
  insert: async (section, data) => { logs.push(data); return logs.length; },
  update: async (...args) => { updates.push(args); return args[1]; }
};

const sent = [];
const bot = {
  phase: 'ready',
  start: () => ({ phase: 'starting' }),
  status: () => ({ phase: bot.phase, account: '628111111111@c.us' }),
  sendToGroup: async (id, text) => { sent.push({ type: 'group', id, text }); return { status: 'diterima', messageId: 'g1' }; },
  sendToPhone: async (phone, text) => { sent.push({ type: 'phone', phone, text }); return { status: 'diterima', messageId: 'p1' }; },
  groups: async () => [{ id: '123456789-987654321@g.us', name: 'Grup Uji GPI' }]
};

let wa;
const originalLoad = Module._load;
try {
  Module._load = function (id, parent) {
    if (id === './repository' && parent?.filename.endsWith('app/whatsapp.js')) return repo;
    if (id === './whatsapp-linked' && parent?.filename.endsWith('app/whatsapp.js')) return bot;
    return originalLoad.apply(this, arguments);
  };
  wa = require('../app/whatsapp');
} finally {
  Module._load = originalLoad;
}

const schedule = { id: 9, tanggal: '2026-12-01', jenis_ibadah: 'Ibadah Uji', pengkhotbah: 'Budi', jam_mulai: '09:00:00' };

test('pesan jadwal berisi petugas dan tidak memakai tautan manual', () => {
  const text = wa.message(schedule);
  assert.match(text, /PENGUMUMAN JADWAL PELAYANAN/);
  assert.match(text, /Ibadah Uji/);
  assert.match(text, /Firman Tuhan: Budi/);
  assert.doesNotMatch(text, /wa\.me/);
});

test('pengumuman mengirim otomatis ke grup dan nomor pribadi lalu mencatat log', async () => {
  logs.length = 0;
  sent.length = 0;
  const report = await wa.announcement(schedule);
  assert.equal(report.sent, 2);
  assert.equal(report.group, 'Grup Uji GPI');
  assert.equal(sent[0].type, 'group');
  assert.equal(sent[1].type, 'phone');
  assert.equal(sent[1].phone, '6281234567890');
  assert.equal(logs.length, 2);
  assert.equal(logs[0].message_type, 'group_bot');
  assert.equal(logs[0].status, 'terkirim');
  assert.equal(logs[1].message_type, 'private_bot');
});

test('pratinjau tidak mengirim pesan dan menampilkan grup serta penerima', async () => {
  sent.length = 0;
  const preview = await wa.preview(schedule);
  assert.equal(preview.group.id, '123456789-987654321@g.us');
  assert.equal(preview.recipients.length, 1);
  assert.equal(preview.recipients[0].phone, '6281234567890');
  assert.equal(sent.length, 0);
});

test('cron berhenti jelas saat bot belum terhubung dan tidak menandai jadwal', async () => {
  bot.phase = 'idle';
  updates.length = 0;
  await assert.rejects(() => wa.cron(), /belum terhubung/i);
  assert.equal(updates.length, 0);
  bot.phase = 'ready';
});

test('sumber tidak lagi memuat alur copy pesan atau tautan wa.me', () => {
  const admin = fs.readFileSync(path.join(__dirname, '../assets/js/admin.js'), 'utf8');
  const view = fs.readFileSync(path.join(__dirname, '../views/admin.ejs'), 'utf8');
  for (const source of [admin, view]) {
    assert.doesNotMatch(source, /copyAnnouncement|openGroupWa|openShareWa|privateWaLinks/);
  }
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '../app/whatsapp.js'), 'utf8'), /https:\/\/wa\.me/);
});
