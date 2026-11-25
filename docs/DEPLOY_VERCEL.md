# Deploy GPI Cipayung ke Vercel

Panduan ini menyiapkan aplikasi Express + EJS di Vercel memakai MySQL eksternal.
Baca bagian **Batasan** sebelum menganggap deployment ini setara dengan server lokal.

## Ringkas: apa yang berfungsi dan tidak

| Fitur | Di Vercel | Catatan |
|---|---|---|
| Halaman publik (beranda, warta, jadwal, pelayanan, dll.) | Berfungsi | Semua data dibaca dari MySQL eksternal |
| Login, dashboard admin, CRUD data | Berfungsi | Sesi disimpan di MySQL (`createDatabaseTable`), bukan memori |
| Impor/ekspor CSV & Excel | Berfungsi | Tidak menulis ke disk |
| CSS, JS, gambar di `assets/` | Berfungsi | Disajikan lewat route handler `res.sendFile` + `includeFiles` di `vercel.json` |
| Media lama di `uploads/` | Berfungsi (read-only) | Ikut di-bundle; hanya file yang sudah ada di repo |
| Upload Warta / media / foto / dokumentasi baru | **Tidak berfungsi** | Filesystem Vercel read-only dan sementara; file hilang setelah function berhenti |
| Bot WhatsApp (QR, kirim pesan, cek grup) | **Tidak berfungsi** | Butuh Chromium + sesi folder yang persisten; tidak mungkin di serverless |
| Reminder H-1 otomatis (`scheduleWaReminder`) | **Tidak berfungsi** | Proses tidak hidup terus; perlu cron eksternal |
| `npm run cron` | **Tidak berfungsi** | Sama seperti di atas |
| Pencarian folder Google Drive | Berfungsi jika `DRIVE_API_KEY` diisi | Hanya panggilan API keluar |

Penyebab 500 `FUNCTION_INVOCATION_FAILED` sebelumnya: `server.js` menghentikan
proses bila `SESSION_SECRET` kosong pada `NODE_ENV=production` (Vercel memasangnya
otomatis), dan `uploads/media/.warta-tmp` dibuat saat import sehingga gagal di
filesystem read-only. Keduanya sudah ditangani: `SESSION_SECRET` wajib diisi, dan
folder sementara sekarang dibuat saat upload pertama.

## 1. Siapkan MySQL eksternal

Pilih salah satu penyedia MySQL yang bisa diakses publik dengan TLS:

- Aiven for MySQL — https://aiven.io (region Singapura, TLS wajib)
- PlanetScale — https://planetscale.com (MySQL-compatible; gunakan kredensial database biasa)
- TiDB Cloud Serverless — https://tidbcloud.com
- Railway MySQL — https://railway.com

Yang perlu dicatat: host, port, nama database, user, password, dan apakah TLS wajib.
Buat user database dengan izin `SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP`
karena `express-mysql-session` membuat tabel `sessions` saat pertama jalan dan
`app/repository.js` menambah tabel/kolom yang belum ada.

## 2. Pindahkan isi database

Dari mesin lokal (container MariaDB yang dipakai sekarang):

```bash
cd /home/aris/Documents/coding/GPI_CIPAYUNG_JAVASCRIPT/GPI
docker exec gpi-mysql mariadb-dump -uroot \
  --single-transaction --routines --triggers --default-character-set=utf8mb4 \
  gpi_cipayung > gpi_cipayung-dump.sql
```

Impor ke MySQL eksternal (contoh untuk Aiven/PlanetScale/TiDB/Railway):

```bash
mysql -h DB_HOST -P 3306 -u DB_USER -p --ssl-mode=REQUIRED gpi_cipayung < gpi_cipayung-dump.sql
```

File dump berisi hash password user admin, jadi **jangan commit** (sudah diabaikan
lewat pola `*-dump.sql` di `.gitignore`). Hapus setelah impor selesai.

Jika mulai dari database kosong, impor skema langsung:

```bash
mysql -h DB_HOST -P 3306 -u DB_USER -p --ssl-mode=REQUIRED < database/database_utama_gpi_cipayung.sql
mysql -h DB_HOST -P 3306 -u DB_USER -p --ssl-mode=REQUIRED gpi_cipayung < database/migration_update_database.sql
mysql -h DB_HOST -P 3306 -u DB_USER -p --ssl-mode=REQUIRED gpi_cipayung < database/migration_website_content.sql
mysql -h DB_HOST -P 3306 -u DB_USER -p --ssl-mode=REQUIRED gpi_cipayung < database/migration_website_documentation.sql
mysql -h DB_HOST -P 3306 -u DB_USER -p --ssl-mode=REQUIRED gpi_cipayung < database/migration_support_chat_2026.sql
mysql -h DB_HOST -P 3306 -u DB_USER -p --ssl-mode=REQUIRED gpi_cipayung < database/migration_connect_requests.sql
```

Catatan: `database_utama_gpi_cipayung.sql` diawali `DROP DATABASE gpi_cipayung`.
Jangan jalankan pada database yang sudah berisi data.

## 3. Isi environment variables di Vercel

Dashboard: **Project → Settings → Environment Variables** (pilih Production).
Daftar lengkap ada di `.env.vercel.example`. Yang wajib:

| Variabel | Isi |
|---|---|
| `SESSION_SECRET` | string acak ≥32 karakter, wajib (tanpa ini function crash) |
| `DB_HOST` | host MySQL eksternal (bukan `localhost`) |
| `DB_PORT` | biasanya `3306` atau port dari provider |
| `DB_NAME` | `gpi_cipayung` |
| `DB_USER` | user database |
| `DB_PASSWORD` | password database |
| `DB_SSL` | `1` bila provider mewajibkan TLS |
| `WA_REMINDER_AUTO` | `0` (scheduler tidak berjalan di Vercel) |

Opsional: `WHATSAPP_GROUP_INVITE`, `WA_CLOUD_*`, `DOA_PAGI_MEET_URL`,
`YOUTUBE_API_KEY`, `INSTAGRAM_*`, `DRIVE_API_KEY`.

Lewat CLI:

```bash
npx vercel link
npx vercel env add SESSION_SECRET production
npx vercel env add DB_HOST production
# ulangi untuk DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL, WA_REMINDER_AUTO
```

`NODE_ENV=production` tidak perlu diisi manual; Vercel memasangnya.

## 4. Deploy dan verifikasi

```bash
npx vercel --prod
```

Periksa berurutan:

1. `GET /` → 200 dan tampil dengan CSS.
2. `GET /assets/css/style.css` → 200 (membuktikan `includeFiles` bekerja).
3. `GET /login` → 200, lalu login dengan akun admin.
4. `GET /api?action=public_bootstrap` → `success: true` (membuktikan koneksi DB).
5. Dashboard → satu halaman data (Jemaat/Jadwal) untuk memastikan query berjalan.

Bila ada yang gagal, buka **Deployments → pilih deployment → Functions/Logs**
untuk melihat pesan error asli (Vercel tidak menampilkannya di browser).

## 5. Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| `500 FUNCTION_INVOCATION_FAILED` di semua halaman | `SESSION_SECRET` belum diisi, atau module crash saat import | Isi `SESSION_SECRET`, redeploy, cek logs |
| `500` hanya di halaman berdata | `DB_HOST`/kredensial salah, atau TLS belum aktif | Cek logs (`ECONNREFUSED`, `ER_ACCESS_DENIED`, `HANDSHAKE_SSL_ERROR`); set `DB_SSL=1` |
| CSS/JS tidak termuat | `includeFiles` tidak jalan | Pastikan `vercel.json` ikut ter-deploy; cek logs untuk `ENOENT ... assets` |
| Error `functions` pattern di vercel.json | Versi Vercel tidak mengenali key `server.js` | Hapus blok `functions`, lalu tambahkan `"builds": [{"src":"server.js","use":"@vercel/node","config":{"includeFiles":["views/**","assets/**","templates/**","uploads/**"]}}]` dan `"routes":[{"src":"/(.*)","dest":"server.js"}]` |
| Login berhasil lalu logout sendiri | Cookie `secure` butuh HTTPS (Vercel sudah HTTPS) atau sesi gagal disimpan | Pastikan user DB boleh `CREATE` tabel `sessions` |
| Upload gagal / 500 saat unggah | Filesystem read-only | Diharapkan; lihat Batasan |

## 6. Yang tetap harus dijalankan di server lain

- **Bot WhatsApp**: `whatsapp-web.js` membutuhkan Chromium dan folder sesi persisten.
  Jalankan di VPS/server sendiri (misalnya server yang sekarang), lalu gunakan
  dashboard lokal untuk memindai QR dan mengirim pengumuman.
- **Reminder H-1 otomatis**: jalankan `npm run cron` (atau `node whatsapp-cron.js`)
  sebagai cron sistem di server yang menjalankan bot.
- **Upload media/Warta**: bila harus dilakukan dari dashboard Vercel, perlu
  penambahan object storage (S3/R2/Cloudinary) — belum diimplementasikan.

## 7. Perubahan kode yang menyertai konfigurasi ini

- `vercel.json` — `includeFiles` untuk `views/`, `assets/`, `templates/`, `uploads/`,
  dan `maxDuration` 60 detik.
- `server.js` — `express.static` diganti handler `res.sendFile` karena Vercel
  mengabaikan `express.static`.
- `app/warta-upload.js` — folder sementara dibuat saat upload pertama, bukan saat
  import, agar cold start tidak crash di filesystem read-only.
- `app/repository.js` — dukungan `DB_SSL=1` untuk MySQL eksternal ber-TLS.
