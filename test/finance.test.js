'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {parseMoney,summary}=require('../app/finance');
test('format nominal rupiah dan Excel tidak menyebabkan salah nominal',()=>{
 assert.equal(parseMoney('Rp 1.250.000'),1250000);
 assert.equal(parseMoney('1.250.000,50'),1250000.5);
 assert.equal(parseMoney('1,250,000.50'),1250000.5);
 assert.equal(parseMoney('1000000'),1000000);
 assert.equal(parseMoney(2500),2500);
 assert.ok(Number.isNaN(parseMoney('1.2.3')));
 assert.ok(Number.isNaN(parseMoney('')));
});
test('saldo tidak memasukkan janji yang belum diterima',()=>{
 const x=summary([
  {jenis_transaksi:'Persembahan',jumlah:100000,arus_kas:'masuk'},
  {jenis_transaksi:'Kas',jumlah:20000,arus_kas:'keluar'},
  {jenis_transaksi:'Janji Iman',status_janji:'janji',jumlah:500000,arus_kas:'masuk'},
  {jenis_transaksi:'Janji Iman',status_janji:'realisasi',jumlah:30000,arus_kas:'masuk'}
 ]);
 assert.deepEqual(x,{masuk:130000,keluar:20000,saldo:110000,janji:500000});
});
