'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');

const calls = [];
const behaviour = {
  chats: [],
  chatExists: true,
  numberId: null,
  numberIdError: null,
  sendResult: { id: { _serialized: 'MSG-1' } },
  sendError: null
};

class FakeClient {
  constructor(options) {
    this.options = options;
    this.handlers = {};
    this.info = { wid: { _serialized: '628111111111@c.us' } };
    this.pupPage = { evaluate: async () => behaviour.chatExists };
  }
  on(event, handler) {
    (this.handlers[event] ||= []).push(handler);
    return this;
  }
  emit(event, ...args) {
    for (const handler of this.handlers[event] || []) handler(...args);
  }
  initialize() {
    this.emit('ready');
    return Promise.resolve();
  }
  destroy() {
    return Promise.resolve();
  }
  async getChats() {
    return behaviour.chats;
  }
  async getChatById() {
    return null;
  }
  async getNumberId(number) {
    calls.push(['getNumberId', number]);
    if (behaviour.numberIdError) throw behaviour.numberIdError;
    return behaviour.numberId;
  }
  async sendMessage(id, text, options) {
    calls.push(['sendMessage', id, text, options]);
    if (behaviour.sendError) throw behaviour.sendError;
    return behaviour.sendResult;
  }
}

// app/whatsapp-linked.js requires whatsapp-web.js lazily inside start(), so the
// stub must stay installed while the tests run, not only while loading the module.
const originalLoad = Module._load;
Module._load = function (id, parent) {
  if (parent?.filename.endsWith(path.join('app', 'whatsapp-linked.js'))) {
    if (id === 'whatsapp-web.js') return { Client: FakeClient, LocalAuth: class {} };
    if (id === 'qrcode') return { toDataURL: async () => 'data:image/png;base64,AA==' };
  }
  return originalLoad.apply(this, arguments);
};
process.env.WA_LINKED_SESSION_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gpi-wa-'));
const bot = require('../app/whatsapp-linked');

function reset(next = {}) {
  calls.length = 0;
  Object.assign(behaviour, {
    chats: [],
    chatExists: true,
    numberId: null,
    numberIdError: null,
    sendResult: { id: { _serialized: 'MSG-1' } },
    sendError: null
  }, next);
}

function sent() {
  return calls.filter(call => call[0] === 'sendMessage');
}

test('bot dapat dihubungkan dan berstatus ready', async () => {
  bot.start();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(bot.status().phase, 'ready');
  assert.equal(bot.status().account, '628111111111@c.us');
});

test('normalisasi nomor Indonesia', () => {
  assert.equal(bot.normalizePhone('0812-3456-7890'), '6281234567890');
  assert.equal(bot.normalizePhone('+62 812 3456 7890'), '6281234567890');
  assert.equal(bot.normalizePhone('81234567890'), '6281234567890');
  assert.throws(() => bot.normalizePhone('12'), /tidak valid/i);
});

test('daftar grup hanya menampilkan grup dan mendukung wid LID', async () => {
  reset({
    chats: [
      { id: { _serialized: '111-222@g.us' }, name: 'Grup GPI', isGroup: true, isReadOnly: false },
      { id: { _serialized: '628123@c.us' }, name: 'Budi', isGroup: false },
      { id: { $1: '333-444@g.us' }, name: 'Grup LID', isGroup: true, isReadOnly: true }
    ]
  });
  const groups = await bot.groups();
  assert.deepEqual(groups.map(group => group.id), ['111-222@g.us', '333-444@g.us']);
  assert.equal(groups[1].readOnly, true);
});

test('kirim ke grup memakai id grup langsung', async () => {
  reset();
  const result = await bot.sendToGroup('111-222@g.us', 'Halo grup');
  assert.equal(result.status, 'diterima');
  assert.equal(result.messageId, 'MSG-1');
  assert.deepEqual(sent()[0].slice(0, 3), ['sendMessage', '111-222@g.us', 'Halo grup']);
});

test('kirim ke nomor tetap bekerja saat getNumberId tidak tersedia', async () => {
  reset({ numberIdError: new Error('Evaluation failed: Cannot read properties of undefined') });
  const result = await bot.sendToPhone('0812-3456-7890', 'Halo nomor');
  assert.equal(result.status, 'diterima');
  assert.equal(sent()[0][1], '6281234567890@c.us');
});

test('kirim ke nomor memakai wid LID dari getNumberId', async () => {
  reset({ numberId: { _serialized: '999888777@lid' } });
  const result = await bot.sendToPhone('0812-3456-7890', 'Halo LID');
  assert.equal(result.status, 'diterima');
  assert.equal(sent()[0][1], '999888777@lid');
});

test('wid tanpa _serialized tetapi punya $1 tetap dipakai', async () => {
  reset({ numberId: { $1: '555666777@c.us' } });
  const result = await bot.sendToPhone('0812-3456-7890', 'Halo PN');
  assert.equal(result.status, 'diterima');
  assert.equal(sent()[0][1], '555666777@c.us');
});

test('hasil tanpa pesan tidak langsung dianggap gagal', async () => {
  reset({ sendResult: undefined });
  const group = await bot.sendToGroup('111-222@g.us', 'Halo');
  assert.equal(group.status, 'tidak_pasti');
  const phone = await bot.sendToPhone('0812-3456-7890', 'Halo');
  assert.equal(phone.status, 'tidak_pasti');
});

test('nomor tidak terdaftar dilaporkan gagal dengan pesan jelas', async () => {
  reset({ sendError: new Error('Evaluation failed: wid is not registered') });
  const result = await bot.sendToPhone('0812-3456-7890', 'Halo');
  assert.equal(result.status, 'gagal');
  assert.match(result.error, /tidak terdaftar/i);
});

test('grup yang tidak ditemukan tidak dicoba dikirimi', async () => {
  reset({ chatExists: false });
  const result = await bot.sendToGroup('111-222@g.us', 'Halo');
  assert.equal(result.status, 'gagal');
  assert.match(result.error, /tidak ditemukan/i);
  assert.equal(sent().length, 0);
});
