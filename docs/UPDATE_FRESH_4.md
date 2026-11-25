# GPI Cipayung — Fresh 4.0

## Update dari Fresh 3
1. Hentikan server (`Ctrl+C`). Cadangkan folder proyek dan ekspor database MySQL lewat phpMyAdmin.
2. Ekstrak paket UPDATE_FRESH_4 langsung ke folder `GPI_CIPAYUNG_JS` yang berisi `package.json`. Timpa file yang sama. Paket update tidak memuat `.env`, `uploads`, maupun dump database utama. Tidak ada dependency npm baru.
3. Pastikan MySQL XAMPP aktif, `.env` tetap menggunakan database lama, lalu `npm start` (CMD) atau `npm.cmd start` (PowerShell).
4. Buka http://localhost:3000/admin dan refresh (Ctrl+F5). Sistem otomatis membuat `website_events`, `website_services`, dan `website_migrations`, lalu menanam 1 acara dan 5 halaman ibadah tepat sekali. Bila user MySQL tidak punya izin CREATE TABLE, pilih database GPI yang sudah ada di phpMyAdmin lalu impor hanya `database/migration_website_content.sql`. Jangan impor ulang database utama.
5. Buka http://localhost:3000/ untuk melihat hasil. Untuk full source yang baru diekstrak, salin `.env.example` ke `.env` bila belum ada, sesuaikan database, jalankan `npm install` dan `npm start`. Jangan menimpa `.env` lama.

## Pengelolaan
- **Acara Gereja** (`/admin#acara`): Admin bisa menambah, mengedit, menghapus, mengubah status draft/published, mengunggah poster JPG/PNG/WebP, mengatur judul, slug, tanggal mulai/selesai, lokasi, deskripsi, urutan. Majelis/Pendeta dapat melihat. Poster HUT ke-28 diambil dari PDF yang diberikan, tanggal 28–29 November 2026 berdasarkan instruksi pengguna.
- **Konten Ibadah** (`/admin#ibadah-konten`): Admin, Majelis, Pendeta dapat menambah, mengedit, menghapus halaman, mengganti judul, slug, deskripsi, jadwal rutin, lokasi, nama/jabatan/biografi pembina, foto pembina, banner dan urutan, serta draft/publish. Hak akses data lainnya (termasuk akun, jemaat, keuangan) tidak berubah. File baru maksimal 10 MB, diproses menjadi JPEG; gambar unggahan disimpan di `uploads/media/website` dan dilayani hanya untuk konten published atau pengguna internal yang berhak.
- Halaman draft tidak tampil di website; halaman dihapus tidak kembali saat restart atau migrasi ulang. Perubahan tampil saat halaman publik dimuat ulang. Mengubah slug berarti mengubah URL publik; simpan slug lama bila tidak ingin memutus link lama.
- Jadwal rutin bisa diedit pada Konten Ibadah; jadwal pelayanan bertanggal tetap dikelola melalui menu Jadwal Pelayanan sesuai izin sebelumnya.
- Tombol WhatsApp di Memberi membuka nomor 088214498018 dengan pesan awal. Jemaat perlu melampirkan bukti transfer sendiri di WhatsApp.
- Animasi marquee dilengkapi tombol jeda dan mengikuti prefers-reduced-motion. Carousel menampilkan satu poster asli; setelah ada beberapa acara, tombol geser aktif bila konten melebihi lebar layar.

## URL
- `/jadwal-ibadah` (semua jenis dan Doa Pagi)
- `/ibadah-minggu-raya`, `/ibadah-tengah-minggu`, `/ibadah-sekolah-minggu`, `/ibadah-youth-revive-generation`, `/ibadah-kaum-ibu`
- `/acara-hut-gpi-cipayung-28`
- `/memberi`

## Catatan isi
- Nama pembina Kaum Ibu digunakan **Ibu Pdt. J. Sinaga / Br. Nababan** sesuai nama yang diberikan dan daftar tim di proyek sebelumnya. Dalam deskripsi pengguna terdapat Br. Sinaga yang berbeda; biografi menggunakan nama Ibu Pdt. J. Sinaga tanpa marga tambahan agar tidak menimbulkan dua versi. Silakan konfirmasi dan edit jika perlu.
- Jadwal rutin Minggu Raya 09.00, Sekolah Minggu 07.00 dari info akun gereja yang disertakan sebelumnya; Tengah Minggu Kamis 18.30 dari proyek sebelumnya. Jadwal Youth dan Kaum Ibu sengaja kosong karena belum dikonfirmasi. Foto keempat dipasang untuk Sekolah Minggu sesuai urutan unggahan.
- Background menggunakan ilustrasi ibadah yang sudah ada pada Fresh 3, bukan foto GMS atau dokumentasi resmi GPI. Bisa diganti melalui Konten Ibadah untuk setiap halaman.
- `npm test` mencakup 37 tes dasar (template menggunakan EJS jika tersedia, fallback renderer jika tidak). Pemeriksaan sintaks JS dilakukan. Integrasi MySQL, Express, upload Sharp dan otorisasi end-to-end perlu diuji pada instalasi lokal pengguna.
