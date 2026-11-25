## Pembaruan Dokumentasi Ibadah (Fresh 5)

Dokumentasi Youth Revive Generation dan Kaum Ibu kini mendukung album Google Drive, file Google Drive, dan upload foto/video/PDF via Dashboard → Konten Ibadah. Lihat `docs/PANDUAN_DOKUMENTASI_FRESH_5.md` untuk instalasi, hak akses, dan pengaturan Google Drive.

## Deploy ke Vercel

Vercel hanya bisa menjalankan halaman publik dan dashboard bila memakai MySQL eksternal. Upload file, bot WhatsApp, dan reminder otomatis tetap harus berjalan di server sendiri. Konfigurasi (`vercel.json`, variabel environment, impor database, dan batasan fitur) ada di `docs/DEPLOY_VERCEL.md`.

---

# GPI Cipayung — JavaScript (Node.js)

Migrasi dari `GPI_CIPAYUNG_MEDIA_ALBUM_SQUARE_FINAL.zip`. Aplikasi tetap menggunakan HTML/CSS, JavaScript frontend, dan MySQL/MariaDB, tetapi backend PHP diganti dengan Node.js, Express, dan template EJS (HTML dengan ekspresi JavaScript). Tidak diperlukan PHP atau Apache untuk menjalankan aplikasi Node.js. Tampilan asli, CSS, gambar, template CSV, serta folder upload disertakan.

## 1. Persiapan

- Node.js 20 atau lebih baru (disarankan Node.js 22 LTS atau lebih baru).
- MySQL atau MariaDB. Jika menggunakan XAMPP, cukup jalankan modul **MySQL**. Apache hanya diperlukan jika ingin membuka phpMyAdmin XAMPP, bukan untuk menjalankan aplikasi Node.
- VS Code atau editor lain, dan terminal.

## 2. Database

Jika database `gpi_cipayung` dari aplikasi PHP sebelumnya sudah tersedia dan skemanya lengkap, **langsung gunakan database itu**, tanpa import ulang. Cadangkan database dan folder uploads terlebih dahulu.

Jika instalasi baru dengan database kosong, impor `database/database_gpi_cipayung.sql` menggunakan phpMyAdmin atau MySQL client. **PERINGATAN:** script SQL bawaan mengandung `DROP DATABASE IF EXISTS gpi_cipayung` dan akan menghapus data lama. Jangan menjalankannya pada database aktif tanpa cadangan. Dua file database utama pada arsip asli merupakan duplikat; jangan impor keduanya. File migrasi SQL asli juga disertakan untuk referensi, bukan untuk dijalankan otomatis.

## 3. Menjalankan melalui VS Code / Windows

Ekstrak ZIP, buka folder `GPI` di VS Code, buka terminal di folder yang berisi `package.json`, kemudian jalankan:

```powershell
npm install
Copy-Item .env.example .env
```

Jika memakai Command Prompt, gunakan `copy .env.example .env` sebagai pengganti `Copy-Item`. Pada macOS/Linux gunakan `cp .env.example .env`.

Edit file `.env` sesuai konfigurasi MySQL. Contoh lokal XAMPP standar:

```dotenv
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=gpi_cipayung
DB_USER=root
DB_PASSWORD=
SESSION_SECRET=
```

`SESSION_SECRET` kosong akan menghasilkan secret sementara pada mode development. Untuk secret tetap, jalankan perintah berikut lalu salin hasilnya ke `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Jalankan aplikasi:

```bash
npm start
```

- Website: `http://localhost:3000/`
- Login: `http://localhost:3000/login`
- Dashboard: `http://localhost:3000/admin` (setelah login)
- API publik: `http://localhost:3000/api?action=public_bootstrap`

Untuk pengembangan dengan restart saat file berubah: `npm run dev`. Hentikan aplikasi dengan Ctrl+C.

## 4. Akun internal

Username dan hash password bcrypt bawaan tetap mengikuti database asli. Login mendukung hash PHP `$2y$` dan hash baru bcrypt `$2b$`. Gunakan password akun yang sudah dimiliki. Jika lupa password, reset akun secara lokal. Misalnya melalui PowerShell:

```powershell
$env:NEW_PASSWORD = 'GantiDenganPasswordKuatAnda'
npm run reset-password -- admin
Remove-Item Env:NEW_PASSWORD
```

Ganti password contoh dengan password pribadi yang kuat. Jangan membagikan `.env` atau kredensial. Username bawaan: admin, majelis, pendeta. Hak akses mengikuti `role_matrix()` versi PHP, termasuk pendeta yang dapat melihat data dan laporan tertentu tetapi tidak mengubahnya.

## 5. Struktur proyek

```text
GPI/
├── server.js                   # Express, login, sesi, routing
├── app/
│   ├── repository.js           # MySQL pool, CRUD, query publik
│   ├── api.js                  # API, CSRF, izin, import/export
│   ├── payloads.js             # Validasi dan normalisasi input
│   ├── public-view.js          # Render halaman publik
│   ├── uploads.js              # Upload media dan pengolahan foto
│   ├── whatsapp.js             # Pengumuman dan pengingat H-1
│   ├── defaults.json           # Fallback dan matriks izin asli
│   └── nav.json                # Navigasi admin
├── views/                      # 15 halaman EJS dari PHP asli
├── assets/                     # CSS, JavaScript browser, gambar asli
├── uploads/                    # File media dari arsip sumber
├── database/                   # SQL asli, struktur database dipertahankan
├── templates/                  # Template impor CSV
├── scripts/                    # Reset password dan utilitas lokal
├── test/                       # Uji render, API, upload, dan bot WhatsApp
├── docs/                       # Panduan dan catatan update
├── whatsapp-cron.js            # CLI reminder H-1
├── vercel.json                 # Konfigurasi deploy Vercel (includeFiles + maxDuration)
├── .env.example
├── .env.vercel.example         # Contoh variabel environment untuk Vercel
└── package.json
```

### Pemetaan file

| PHP asal | JavaScript / EJS |
|---|---|
| `index.php` dan halaman publik lain | `views/*.ejs`, `app/public-view.js`, routing `server.js` |
| `admin.php` | `views/admin.ejs`, `server.js`, `assets/js/admin.js` |
| `login.php`, `logout.php` | `server.js`, `views/login.ejs` |
| `api.php` | `app/api.js`, `app/payloads.js`, `app/uploads.js` |
| `app/bootstrap.php` dan `app/config.php` | `server.js`, `app/repository.js`, `.env` |
| `app/repository.php` | `app/repository.js` |
| `app/public_view.php` | `app/public-view.js`, `app/defaults.json` |
| `whatsapp_cron.php` | `whatsapp-cron.js`, `app/whatsapp.js` |

Rute baru tidak memakai ekstensi `.php`. Alias GET `.php` dan `.html` untuk halaman publik serta `/api.php` masih ditangani Express untuk kompatibilitas tautan lama, tanpa menjalankan PHP. Aksi pengubah data (termasuk pembuatan pesan WhatsApp dan logout) menggunakan POST + CSRF.

## 6. WhatsApp, media, dan deployment

- Pengumuman jadwal dan reminder H-1 dikirim **otomatis oleh bot WhatsApp** melalui akun yang ditautkan di dashboard. Jalankan `npm install --prefix app` sekali, hubungkan WhatsApp dari menu **Bot WhatsApp** (pindai QR), lalu pilih grup tujuan. Jalankan `npm run cron` untuk reminder H-1. Alur manual copy pesan/`wa.me` sudah dihapus. Panduan lengkap: `app/WHATSAPP-GRUP.md`.
- Upload dibatasi 10 MB per file, 20 file per permintaan. Foto tim diproses menggunakan Sharp. Dukungan HEIC/HEIF tergantung decoder di platform; bila gagal diproses, file HEIC dapat disimpan tanpa konversi dan mungkin tidak tampil di semua browser. Gunakan JPG/PNG untuk kompatibilitas terbaik.
- Folder `uploads` harus persisten pada hosting. Database, konfigurasi, dan source backend tidak diekspos sebagai static files. Media publik hanya dilayani bila statusnya published; pengguna internal yang berizin dapat mengakses media yang belum dipublikasi. Foto fallback pada `assets/img` tetap tersedia.
- Untuk produksi gunakan `NODE_ENV=production`, secret tetap yang kuat, database dengan akun terbatas, reverse proxy HTTPS, persistent storage, dan lakukan pengujian keamanan. Sesi produksi menggunakan MySQL session store. Jangan gunakan port Node development terbuka langsung ke internet. CDN XLSX dan Google Fonts tetap seperti sumber dan memerlukan akses internet dari browser.

## 7. Pengujian dan batasan migrasi

`npm test` menjalankan pemeriksaan 15 halaman, struktur album media, render materi video/link, dan matriks role. Saat paket EJS tersedia, pengujian memakai EJS asli. Jika belum tersedia, pengujian menggunakan evaluasi JavaScript terhadap subset template EJS yang digunakan di proyek. Pada lingkungan pembuatan ZIP, seluruh 18 pengujian dasar lulus dan seluruh file JavaScript lulus `node --check`. Instalasi npm tidak dapat diselesaikan di lingkungan tersebut karena registry npm tidak dapat diakses (DNS EAI_AGAIN). Oleh karena itu Express, login, operasi MySQL, upload, dan WhatsApp **belum diuji end-to-end dengan database nyata**.

Setelah `npm install` berhasil, lakukan pengujian lokal: login ketiga role; tambah/edit/hapus data dengan akun yang sesuai; pastikan Pendeta tidak dapat mengubah data; impor/ekspor CSV dan Excel; unggah dan publikasikan beberapa gambar; periksa album publik; kirim pesan kontak; uji materi Pendalaman Alkitab dan reminder WhatsApp. Gunakan database uji, bukan data produksi. Perilaku JavaScript browser dan tampilan visual perlu diuji juga di browser. Ini merupakan source code hasil migrasi, bukan jaminan siap produksi.

Catatan privasi: arsip mencakup file SQL, foto, dan media yang diwarisi dari proyek asli. Jangan unggah repository ini ke repositori publik tanpa meninjau dan menghapus data yang bersifat internal.

## Pembaruan tampilan publik (Fresh 2.0)

Beranda, navigasi, halaman ibadah, pelayanan, warta, dan memberi didesain ulang. Halaman publik lainnya mendapat tema baru. Dashboard admin, login, role, API, skema MySQL, dan album persegi tetap menggunakan kode sebelumnya.

### Upgrade dari versi JavaScript sebelumnya

1. Hentikan server lama (Ctrl+C). Cadangkan folder proyek, file `.env`, folder `uploads`, dan database.
2. Paling aman: salin file yang terdaftar dalam `docs/UPDATE_FILES.txt` dari versi baru ke lokasi yang sama dalam folder proyek lama. Jangan menimpa `.env`, `uploads`, atau database. Tidak perlu `npm install` lagi jika dependencies versi lama masih tersedia (package.json tidak berubah).
3. Tambahkan `DOA_PAGI_MEET_URL=` pada file `.env` lama, lalu isi dengan URL rapat Google Meet resmi dari pengurus. Format yang diterima: `https://meet.google.com/` diikuti kode rapat tiga-empat-tiga huruf. Jika belum tersedia, website menampilkan kontak gereja, bukan tautan palsu. Jadwal rutin Sabtu 05.00 WIB mengikuti informasi di website lama.
4. Jalankan MySQL, lalu `npm start` dari folder yang berisi `package.json`. Refresh browser dengan Ctrl+F5.

Halaman baru: `/doa-pagi`, `/memberi`, `/warta` (alias `/pengumuman`). Warta memakai tabel pengumuman yang sudah ada; terbitkan dari dashboard Pengumuman. Tidak ada migrasi database baru.

Nomor rekening sesuai informasi yang diberikan: 10823135346, GPI SIDANG CIPAYUNG JAKARTA. Nama bank belum diberikan; halaman mengarahkan jemaat mengonfirmasi bank dan tujuan transfer kepada pengurus. Tidak ada integrasi transaksi atau pembayaran otomatis.

Gambar hero memakai aset ilustrasi ibadah yang sudah disertakan pada proyek lama, bukan dokumentasi GMS. Ganti `assets/img/worship-background.png` dengan foto resmi gereja bila tersedia.
