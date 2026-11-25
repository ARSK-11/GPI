# Bot WhatsApp GPI Cipayung

Bot ini mengirim pengumuman jadwal pelayanan dan reminder H-1 **otomatis** dari dashboard. Alur lama yang meminta admin menyalin pesan lalu membuka grup/`wa.me` sudah dihapus.

## Yang berubah

- Menu **Bot WhatsApp** di dashboard: status koneksi, QR, pilihan grup tujuan, pesan uji, dan riwayat pengiriman.
- Tombol **Kirim WA** pada Jadwal Pelayanan menampilkan pratinjau, lalu mengirim langsung melalui bot setelah dikonfirmasi.
- `npm run cron` mengirim reminder H-1 langsung ke grup dan nomor pelayan yang cocok di Data Jemaat.
- Semua hasil dicatat di `whatsapp_logs` (`group_bot`, `private_bot`, `test_bot`).
- Tidak ada lagi tautan `wa.me` atau tombol salin pesan untuk pengiriman jadwal.

## Persyaratan

1. Node.js 20 atau lebih baru.
2. Google Chrome atau Microsoft Edge terpasang. Di Windows, bot mencari Chrome/Edge otomatis. Di Linux/macOS, Puppeteer memakai browser bawaannya.
3. Dependensi bot diinstal terpisah:

```bash
npm install --prefix app
```

4. Satu akun WhatsApp (disarankan nomor khusus gereja) untuk ditautkan sebagai perangkat.

## Menghubungkan bot

1. Jalankan `npm start`, lalu login sebagai **Admin**.
2. Buka **Bot WhatsApp**.
3. Klik **Hubungkan WhatsApp**. QR akan muncul.
4. Di HP: **WhatsApp → Perangkat tertaut → Tautkan perangkat**, pindai QR.
5. Setelah status **Terhubung**, klik **Muat Daftar Grup**, pilih grup gereja, lalu **Simpan Grup**.
6. Klik **Kirim Pesan Uji** ke nomor sendiri untuk memastikan bot bekerja.

Sesi disimpan di `WA_LINKED_SESSION_DIR` atau, jika kosong, di folder privat akun sistem (`GPI-Cipayung/whatsapp-web`). Jangan simpan sesi di dalam folder yang disajikan publik atau di Git. Jalankan satu proses server per folder sesi.

### Pin versi WhatsApp Web

WhatsApp Web build `2.3000.1055852612` dan sesudahnya memutus sesi yang belum login: QR tampil di halaman, tetapi `WAWebSocketModel` tidak tersedia sehingga `whatsapp-web.js` tidak pernah memancarkan event QR. Aplikasi ini memakai build terverifikasi `2.3000.1053021455-alpha` dari arsip `wppconnect-team/wa-version` (diatur lewat `WA_WEB_VERSION`).

- Jika QR tetap tidak muncul, periksa `WA_WEB_VERSION` dan koneksi ke GitHub (arsip remote).
- Untuk produksi yang tidak boleh bergantung pada GitHub, unduh `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1053021455-alpha.html` ke sebuah folder, lalu isi `WA_LINKED_WEB_CACHE_DIR` dengan folder tersebut. Nama file harus `2.3000.1053021455-alpha.html`.
- Jangan mengganti pin tanpa menguji event QR terlebih dahulu. Naikkan versi hanya setelah build tersebut terbukti kompatibel dengan `whatsapp-web.js` yang terpasang.

## Mengirim pengumuman

1. Buka **Jadwal Pelayanan**.
2. Klik **Kirim WA** pada jadwal yang sudah published.
3. Periksa pratinjau pesan, grup tujuan, dan daftar nomor pribadi.
4. Klik **Kirim Otomatis**. Bot mengirim ke grup, lalu ke nomor pelayan dengan jeda singkat.

Jika bot belum terhubung atau grup belum dipilih, tombol kirim dinonaktifkan dan dashboard menampilkan petunjuknya.

## Reminder H-1

Selama server dan bot tetap terhubung, aplikasi menjalankan reminder otomatis sekali sehari pada `WA_REMINDER_HOUR` (bawaan pukul 08.00 WIB). Set `WA_REMINDER_AUTO=0` untuk mematikan penjadwal bawaan, misalnya jika ingin memakai cron sistem.

Perintah manual tetap tersedia:

```bash
npm run cron
```

Cron mengambil jadwal besok yang `status='published'`, `reminder_h_minus_1=1`, dan belum pernah dikirim, lalu mengirim pesan yang sama ke grup dan nomor pelayan. Setelah percobaan, `reminder_sent_at` diisi agar tidak terkirim berulang; status setiap tujuan tersedia di riwayat bot.

Perintah manual menjalankan botnya sendiri lalu mematikannya setelah selesai. Karena itu, hentikan server terlebih dahulu jika server memakai folder sesi yang sama; dua proses tidak boleh memakai profil WhatsApp yang sama. Jika server berjalan 24 jam, gunakan penjadwal bawaan dan nonaktifkan `WA_REMINDER_AUTO` hanya bila memakai cron sistem agar tidak terjadi pengiriman ganda.

## Status pengiriman

- **terkirim** — WhatsApp Web menerima pesan dan mengembalikan ID pesan.
- **gagal** — tujuan tidak ditemukan, grup tidak tersedia, atau bot terputus.
- **tidak_pasti** — koneksi terputus sebelum status diterima; periksa grup/nomor sebelum mengirim ulang.

## Batasan dan keamanan

- Bot memakai [whatsapp-web.js](https://github.com/wwebjs/whatsapp-web.js), library komunitas yang menjalankan WhatsApp Web. Perubahan WhatsApp dapat memengaruhi kompatibilitas dan akun tunduk pada aturan WhatsApp. Gunakan nomor khusus gereja dan kirim dengan wajar.
- Koneksi dan QR hanya dapat dikelola **Admin**. Tombol pengumuman mengikuti izin `jadwal.update` (Admin dan Majelis).
- Jangan menutup server saat proses pengiriman berjalan. Jika server mati, sesi perlu dihubungkan kembali.
- Folder `uploads` dan database tidak berubah; tidak ada migrasi database untuk fitur ini.

## Pemecahan masalah

- **Dependensi bot belum tersedia** — jalankan `npm install --prefix app`.
- **Chrome atau Edge tidak ditemukan** — pasang browser atau isi `WA_LINKED_BROWSER_PATH` dengan path executable.
- **Chrome gagal start di container** — set `WA_LINKED_NO_SANDBOX=1`. Ini melemahkan sandbox browser, jadi gunakan hanya bila lingkungan memang memerlukannya.
- **Profil bot sedang dipakai proses lain** — hentikan proses server GPI lain, lalu hubungkan kembali.
- **QR tidak muncul** — pastikan `npm start` berjalan dan browser dapat membuka `web.whatsapp.com`.
- **Grup tidak muncul** — pastikan akun bot sudah menjadi anggota grup, lalu klik **Muat Daftar Grup**.
- **Nomor tidak ditemukan** — nomor harus terdaftar di WhatsApp dan ditulis dengan format Indonesia (`08…` atau `62…`).
