const db = require('./app/repository');
const wa = require('./app/whatsapp');

// Jalankan di luar proses server yang sedang memakai sesi bot yang sama.
// Jika server aktif 24 jam, gunakan penjadwal bawaan (WA_REMINDER_AUTO) dan biarkan perintah ini tidak dipakai.
(async () => {
  let code = 0;
  try {
    await wa.connectAndWait();
    console.log('Selesai. Jadwal diproses: ' + await wa.cron());
  } catch (e) {
    console.error(e.message);
    code = 1;
  } finally {
    await wa.shutdown();
    await db.pool.end();
    process.exit(code);
  }
})();
