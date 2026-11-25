# GPI Cipayung — Fresh 3.0

## Update proyek yang sudah berjalan (disarankan)
1. Hentikan server (`Ctrl+C`) dan cadangkan folder proyek serta database MySQL.
2. Ekstrak ZIP update langsung ke folder `GPI_CIPAYUNG_JS` yang berisi `package.json`. Timpa file kode yang sama. Paket update tidak berisi `.env`, `uploads`, atau dump database lama.
3. Jalankan MySQL XAMPP. Gunakan `.env` lama. Tambahkan/ganti `DOA_PAGI_MEET_URL=https://meet.google.com/ywm-oere-smt` jika sebelumnya berisi URL lain. Default sudah menggunakan tautan ini.
4. Jalankan `npm start` dari folder proyek (CMD). Tidak ada dependensi npm baru.
5. Buka `http://localhost:3000`, tekan `Ctrl+F5`. Masuk dengan akun lama.

## Database dan formulir
Tabel `connect_requests` dibuat secara otomatis saat dashboard pertama kali dibuka atau formulir dikirim. Jika akun database tidak berizin CREATE TABLE, buka phpMyAdmin, pilih database yang ditentukan `DB_NAME` di `.env`, lalu impor **hanya** `database/migration_connect_requests.sql` menggunakan akun database yang berizin. SQL tersebut tidak menghapus data atau tabel lama. Jangan mengimpor ulang dump database utama jika sudah memiliki data. 

Formulir: `/kontak` atau `/terhubung`. Pilih satu dari lima kategori, isi nama, kota, minimal satu kontak, dan persetujuan. Jenis kelamin/usia opsional untuk mengurangi pengumpulan data pribadi. Permintaan doa/kesaksian wajib disertai pesan. Data hanya tersedia melalui dashboard yang terautentikasi, tidak muncul di payload publik. Dashboard `/admin#terhubung`: Admin/Majelis dapat membaca, mengubah status/catatan, menghapus; Pendeta membaca saja. Status: baru, diproses, selesai. Gunakan tombol Muat ulang setelah ada pengiriman baru. Data sensitif: batasi akses akun, gunakan HTTPS dan kata sandi kuat saat produksi; tetapkan kebijakan retensi dan tindak lanjut gereja. Jangan gunakan formulir untuk keadaan darurat.

## Media
- `/media#youtube`: mengambil video terbaru dari kanal `@gpisidangcipayung` melalui feed Atom YouTube menggunakan ID dari screenshot akun Instagram yang diberikan (`UCiiGg_Nt5UtRixE99FwSoYQ`). Cache server 5 menit; refresh halaman untuk mengambil hasil terbaru. Jika feed tidak tersedia, tautan kanal resmi tetap berfungsi. Video dibuka di YouTube. Opsional: `YOUTUBE_CHANNEL_ID` dan `YOUTUBE_API_KEY` pada `.env` untuk mengambil unggahan dari YouTube Data API (24 video). Pastikan ID channel benar apabila hasil feed kosong.
- `/media#instagram`: profil dan tombol langsung ke akun resmi `@gpicipayung`. Untuk grid otomatis, akun Instagram harus profesional (Business/Creator) dan pemilik akun harus mengotorisasi aplikasi Meta dengan Instagram Login dan izin pembacaan profil/media (`instagram_business_basic`). Isi `INSTAGRAM_USER_ID`, `INSTAGRAM_ACCESS_TOKEN`, dan bila perlu `INSTAGRAM_GRAPH_VERSION` di `.env` server; token jangan dibagikan atau diletakkan di frontend. Gunakan token yang masih berlaku dan lakukan refresh sesuai kebijakan Meta. Server mengambil media dari Graph API dan menampilkan thumbnail persegi. Tanpa otorisasi, profil resmi tetap dapat dibuka. Alternatif: isi `INSTAGRAM_POST_URLS` dengan daftar URL posting/Reels publik (dipisahkan koma), jika pemilik mengizinkan embedding. Tidak ada scraping atau konten palsu.
- `/media#galeri`: album foto/video dari dashboard lama tetap tersedia.

## Pengujian di komputer pengguna
1. Buka formulir, pilih Baptis, isi data uji dan kirim.
2. Login sebagai admin, klik Formulir Terhubung, buka detail, ubah status menjadi Diproses dan simpan.
3. Login sebagai Majelis dan Pendeta, pastikan data yang sama terlihat. Pendeta tidak dapat menyimpan/menghapus.
4. Buka menu Ibadah, klik Gabung Google Meet pada kartu Doa Pagi. Doa Pagi tidak tampil di navbar utama.
5. Buka Media dan coba tiga tab. Periksa koneksi internet jika YouTube gagal memuat. Instagram memerlukan pengaturan resmi seperti di atas.
6. Hapus data uji dari dashboard admin.

`npm test` menjalankan pengujian dasar tanpa koneksi MySQL. Integrasi MySQL dan akses API media asli harus diuji pada instalasi pengguna. Jangan menjalankan `npm audit fix --force` tanpa meninjau kompatibilitas.
