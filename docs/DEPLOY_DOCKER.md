# Deploy dengan Docker

Docker Compose menjalankan tiga hal sekaligus: database MariaDB, server Node.js, dan bot WhatsApp
(Chrome headless sudah ada di dalam image). Semua data penting disimpan di volume, jadi aman saat
container dihapus atau di-update.

## Prasyarat

- Docker Engine 24+ (Linux) atau Docker Desktop (Windows/macOS) dengan plugin `docker compose`.
- Akses internet saat build pertama (unduh dependensi npm dan Chrome untuk bot).
- Port `3000` bebas, atau set `APP_PORT` lain saat menjalankan compose.

## Deploy satu perintah

```bash
npm run docker:deploy
```

Perintah itu menjalankan `scripts/docker-deploy.sh` yang:

1. Membuat `.env.docker` berisi password database dan `SESSION_SECRET` acak (hanya sekali).
2. Build image aplikasi (`Dockerfile`).
3. Menjalankan MariaDB dan mengimpor `database/database_gpi_cipayung.sql` bila volume database masih kosong.
4. Menunggu kedua service sehat, lalu menampilkan status.

Buka `http://localhost:3000/login`. Ganti password admin:

```bash
docker compose exec app npm run reset-password -- admin
```

Jika port 3000 sudah dipakai:

```bash
APP_PORT=8080 npm run docker:deploy
```

## Konfigurasi `.env.docker`

| Variabel | Keterangan |
| --- | --- |
| `MARIADB_ROOT_PASSWORD`, `DB_ROOT_PASSWORD`, `DB_PASSWORD` | Harus bernilai sama; dipakai MariaDB dan aplikasi. |
| `DB_NAME` | Default `gpi_cipayung`, mengikuti skema di `database/`. |
| `SESSION_SECRET` | Wajib, minimal 32 karakter acak. |
| `SESSION_COOKIE_SECURE` | `0` untuk akses HTTP langsung, `1` bila sudah di belakang HTTPS. |
| `WA_REMINDER_AUTO`, `WA_REMINDER_HOUR` | Reminder H-1 otomatis (jam WIB). |
| `WA_WEB_VERSION` | Pin build WhatsApp Web agar bot stabil. |
| `APP_PORT` | Port host (hanya dibaca oleh compose, bukan container). |

File ini diabaikan Git. Jangan commit `.env.docker`.

## Bot WhatsApp

Setelah login, buka menu **Bot WhatsApp** lalu klik **Hubungkan WhatsApp** dan pindai QR.

- Sesi tersimpan di volume `wa_session`, jadi scan QR hanya sekali. Setelah restart container bot
  kembali tersambung tanpa QR.
- Chrome di container berjalan tanpa sandbox (`WA_LINKED_NO_SANDBOX=1`), ini normal untuk Docker.
- Jika status macet di "Menyiapkan…", klik **Putuskan** lalu **Hubungkan WhatsApp** lagi.

## Update aplikasi

```bash
git pull
docker compose up -d --build
```

Database dan sesi WhatsApp tidak tersentuh. Skema tambahan yang dibuat otomatis oleh aplikasi
(`ensureWebsite`, `ensureConnect`, `ensureFinance`, `ensureWarta`) tetap berjalan seperti biasa.

## Operasional

```bash
docker compose ps                 # status + healthcheck
docker compose logs -f app        # log server dan bot
docker compose logs -f db
docker compose exec db mariadb-dump -uroot -p"$DB_ROOT_PASSWORD" gpi_cipayung > backup.sql
docker compose down               # hentikan (data tetap)
docker compose down -v            # HAPUS database, uploads, dan sesi WhatsApp
```

Backup yang perlu dijaga: volume `db_data`, `uploads_data`, dan `wa_session`. Upload baru masuk ke
`uploads_data`, sehingga tetap ada walau image di-build ulang.

## Catatan produksi

- Jalankan di belakang reverse proxy HTTPS (Nginx/Caddy/Traefik), lalu set
  `SESSION_COOKIE_SECURE=1` dan restart: `docker compose up -d`.
- Jangan buka port database ke publik; compose ini tidak mem-publish port 3306.
- Container bot harus berjalan terus (bukan serverless). Vercel tidak cocok untuk bot WhatsApp;
  gunakan VPS/rumah server dengan Docker.
- Build ulang setelah mengubah kode. Perubahan `server.js` atau `assets/` tidak otomatis masuk ke
  container yang sedang berjalan.
