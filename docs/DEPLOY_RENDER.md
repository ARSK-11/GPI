# Deploy di Render

Image Docker di repo ini bisa langsung dipakai Render. Satu hal yang wajib: **`SESSION_SECRET`
harus diisi** saat `NODE_ENV=production`, kalau tidak server sengaja berhenti dengan pesan
`SESSION_SECRET wajib diisi pada produksi.` dan Render akan restart terus.

## Perbaikan cepat untuk service yang sudah ada

1. Buka service di dashboard Render → **Environment**.
2. Tambahkan:

   | Key | Value |
   | --- | --- |
   | `SESSION_SECRET` | string acak minimal 32 karakter (mis. hasil `openssl rand -hex 32`) |
   | `DB_HOST` | host MySQL/MariaDB eksternal |
   | `DB_PORT` | biasanya `3306` |
   | `DB_NAME` | `gpi_cipayung` |
   | `DB_USER` | user database |
   | `DB_PASSWORD` | password database |
   | `DB_SSL` | `1` bila penyedia database mewajibkan TLS, selain itu `0` |
   | `SESSION_COOKIE_SECURE` | `1` (Render selalu HTTPS) |

3. **Save changes** → Render otomatis deploy ulang.
4. Cek log sampai muncul `GPI Cipayung: http://localhost:...` tanpa error.

Render tidak menyediakan MySQL/MariaDB. Gunakan database eksternal (Aiven, Railway, PlanetScale,
atau server sendiri) dan impor `database/database_gpi_cipayung.sql` sekali ke database itu.

## Blueprint otomatis (`render.yaml`)

File `render.yaml` di root repo membuat service Docker dengan `SESSION_SECRET` yang di-generate
otomatis oleh Render. Saat membuat Blueprint, Render akan meminta nilai untuk variabel `sync: false`
(`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_SSL`).

## Batasan bot WhatsApp di Render

- Paket gratis/tanpa disk: container bisa dihentikan saat idle dan filesystem hilang saat deploy,
  sehingga bot mati dan sesi WhatsApp harus dipindai ulang.
- Untuk bot yang tetap tersambung, pakai instance yang selalu hidup dan tambahkan disk dengan mount
  path `/data` (variabel `WA_LINKED_SESSION_DIR` sudah menunjuk ke `/data/wa-session`).
- Render hanya satu instance per service tanpa autoscaling; jangan menaikkan jumlah instance karena
  satu sesi WhatsApp tidak boleh dipakai dua proses sekaligus.

Untuk deployment jangka panjang dengan database + bot + volume sekaligus, `docker-compose.yml`
lebih cocok dijalankan di VPS (lihat `docs/DEPLOY_DOCKER.md`).
