# Revisi website GPI Cipayung — 20 November 2026

## Perubahan

- **Halaman Terhubung**: enam pilihan (Komitmen, Baptis, Kesaksian, Doa/Konseling, Pemberkatan Pernikahan, Penyerahan Anak). Tidak ada pilihan Bergabung Connect Group. Jenis pilihan dapat ditambah, diubah, dinonaktifkan oleh Admin, Majelis, dan Pendeta melalui **Portal → Formulir Terhubung**. Data formulir tetap privat dan masuk ke database yang sama.
- **Cover**: foto ibadah `assets/img/cover-ibadah-gpi-cipayung.jpeg` dipakai pada bagian hero semua halaman publik; responsif dengan overlay gelap agar judul terbaca.
- **Navigasi dan footer**: tautan navigasi diberi jarak responsif; footer baru empat kelompok dan tidak ada tautan Login Internal. Login tetap bisa dibuka langsung melalui `/login`, sedangkan admin pada `/admin` dan memakai sesi autentikasi yang sama dengan API.
- **Konten Ibadah & Warta**: pada Portal → Konten Ibadah tersedia bagian Warta Pelayanan & Ulang Tahun; admin/majelis dapat membuat/edit/hapus warta dan mengunggah foto (maks. 10 MB) atau MP4/WebM (maks. 30 MB). Status `draft` tidak ditampilkan secara publik. Pendeta dapat melihat warta (berdasarkan hak akses) dan tetap dapat mengelola Konten Ibadah.
- **Menu internal**: Sakramen, Pernikahan, WhatsApp Log tidak lagi ditampilkan dan akses API modul tersebut dinonaktifkan (data lama tidak dihapus).
- **Keuangan**: pencatatan Persembahan, Kas Masuk/Keluar dan Janji Iman, no. bukti, metode, petugas, serta audit create/update/delete. Janji iman yang masih berupa janji tidak menambah saldo kas. Ekspor Excel `.xlsx` memiliki tab Buku Kas dan Ringkasan.

## Instalasi / upgrade dari proyek lama

1. **Backup database MySQL lama dan folder upload sebelum upgrade.** Jangan impor ulang `database_gpi_cipayung.sql` ke database berisi data karena file itu memuat `DROP TABLE`.
2. Ekstrak ZIP versi revisi ke folder aplikasi. Buka terminal di `GPI_CIPAYUNG_JS`.
3. Jalankan `npm install` (Node.js 20+), lalu pastikan `.env` memuat konfigurasi `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` dan `SESSION_SECRET` (lihat `.env.example`).
4. Jalankan `npm start` dan buka `http://localhost:3000`. Akses akun internal lewat `http://localhost:3000/login` secara langsung (bukan melalui footer publik).
5. Skema baru `connect_categories`, `finance_audit`, dan kolom tambahan `persembahan` serta `pengumuman` disiapkan otomatis saat rute terkait dipanggil. Akun MySQL saat migrasi **harus punya izin CREATE/ALTER**. Setelah sukses, izin tersebut dapat dibatasi kembali.
6. Untuk uji: buka **Terhubung** dan kirim permohonan dengan data uji; login sebagai ketiga role untuk uji opsi; admin/majelis upload warta berfoto/video; input transaksi kas masuk, kas keluar, janji belum diterima; cek saldo dan ekspor `.xlsx`.

## Catatan operasional

- Ekspor keuangan hanya bisa dilakukan oleh pengguna login dan memiliki hak `persembahan:export`.
- Memperbarui status janji iman menjadi terealisasi menjadikan nominalnya penerimaan kas. Untuk pembayaran bertahap, buat catatan janji dan transaksi realisasi terpisah dengan nomor referensi yang berkaitan; hindari penghitungan ganda saat rekonsiliasi.
- Pencatatan finansial merupakan buku transaksi dan laporan operasional internal; untuk pembukuan resmi tetap lakukan rekonsiliasi bank, persetujuan bendahara, bukti transaksi, dan backup rutin.
- Tidak ada perubahan pada password/login yang sudah berlaku. Semua data lama dipertahankan selama database yang digunakan tetap database lama.
- `npm install` dan pengujian integrasi MySQL **belum dilakukan di lingkungan produksi**. Uji di salinan/staging sebelum mengganti website yang sedang digunakan.
