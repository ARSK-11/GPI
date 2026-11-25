# Pembaruan GPI Cipayung Fresh 7 — Sticky Navbar & Upload Warta 1 GB

## Yang berubah

1. Pada `/jadwal-ibadah` dan `/ibadah-<slug>`, header website tetap menempel di `top: 0` saat halaman digulir. Bar kategori ibadah menempel persis di bawah header, tidak melayang atau tertutup header. Desktop: header 86 px, mobile: 76 px. Semua halaman non-ibadah mempertahankan perilaku desainnya.
2. Form **Warta Gereja** di dashboard menerima **foto JPG/JPEG/PNG/WebP maksimal 10 MiB** atau **video MP4/WebM maksimal 1 GiB (1.073.741.824 byte)**. Batas lama video 30 MB diganti *khusus Warta*, tanpa menaikkan batas semua upload lainnya.
3. File video Warta diterima dengan **Multer disk storage** ke `uploads/media/.warta-tmp`, diperiksa signature format, dipindahkan ke `uploads/media/warta/`, lalu dicatat ke database. Node.js tidak menampung keseluruhan video besar di `Buffer` RAM. File sementara dibersihkan setelah respons selesai. Foto tetap diolah dengan Sharp.
4. Browser menampilkan persentase progress upload dan menonaktifkan tombol Simpan selama pengiriman. Setelah 100%, indikator menjadi 'Memproses file…' sampai server selesai menyimpan ke database.
5. Server menggunakan `requestTimeout` 30 menit untuk mengakomodasi koneksi upload lambat. Periksa pengaturan hosting/proxy secara terpisah sebelum dipublikasikan.

## Cara memasang Paket Update (direkomendasikan)

1. Cadangkan **folder proyek** dan **database** MySQL terlebih dahulu.
2. Hentikan server Node.js dengan `Ctrl + C` di terminal Visual Studio Code.
3. Ekstrak isi `GPI_CIPAYUNG_UPDATE_NAVBAR_WARTA_7.zip` ke **dalam** folder `GPI_CIPAYUNG_JS`. Struktur file seharusnya menjadi `GPI_CIPAYUNG_JS/app/api.js`, `GPI_CIPAYUNG_JS/views/admin.ejs`, dst. Izinkan overwrite file yang sama. Jangan sampai tercipta folder `GPI_CIPAYUNG_JS/GPI_CIPAYUNG_JS/`.
4. **Jangan mengganti `.env`, `node_modules`, folder `uploads`, atau database**. Paket update tidak menyertakan data tersebut.
5. Buka XAMPP dan nyalakan MySQL. Di terminal CMD pada folder `GPI_CIPAYUNG_JS` jalankan `npm start` (tidak ada dependency baru).
6. Perbarui cache dengan `Ctrl + F5`. Uji sticky navbar pada `http://localhost:3000/jadwal-ibadah` dan salah satu halaman `http://localhost:3000/ibadah-...`.
7. Uji formulir Warta: buka `http://localhost:3000/admin`, pilih **Warta Gereja** lalu unggah video MP4 atau WebM 100–300 MB, simpan, dan pastikan media tampil di `http://localhost:3000/warta` setelah dipublikasikan.

## Persyaratan penyimpanan / hosting

- Siapkan **ruang disk kosong lebih besar dari ukuran file** untuk file sementara selama pengiriman. Pertimbangkan kapasitas untuk beberapa upload bersamaan, pencadangan, dan ruang sistem.
- Aplikasi dijalankan langsung dengan Node.js di localhost. Jika nantinya memakai Nginx/Apache/reverse proxy, sesuaikan batas request body dan timeout. Contoh Nginx: `client_max_body_size 1024m;` dengan timeout proxy upload yang mencukupi; **konfigurasi dan keamanan server harus ditinjau sebelum produksi**.
- 1 GB adalah **batas unggah**, bukan ukuran file yang direkomendasikan. Video MP4 H.264 yang dikompresi untuk web biasanya lebih nyaman ditonton. Video 100–300 MB dapat membutuhkan beberapa menit untuk diunggah melalui internet.
- Format yang diterima tetap MP4 / WebM untuk video. MOV tidak didukung di formulir Warta.
- Permintaan upload dicek **autentikasi, peran, serta CSRF** sebelum file diterima. Sesi pengguna perlu tetap aktif selama upload.
- Peringatan: `uploads/media/.warta-tmp` hanya untuk berkas sementara. Folder ini tidak boleh disajikan langsung oleh web server atau dibuka sebagai direktori publik.

## Daftar file yang diperbarui

- `assets/css/fresh7-fixes.css` (baru)
- `app/public-view.js`
- `views/admin.ejs`
- `assets/js/admin.js`
- `app/warta-upload.js` (baru)
- `app/api.js`
- `server.js`
- `test/warta-upload-1gb.test.js` (baru)

Tidak ada migrasi database untuk pembaruan ini. Data jemaat, keuangan, jadwal, kegiatan gereja, dan file yang telah diunggah tidak dihapus.

## Pengujian

- `node --check` untuk file JS yang diubah: **lulus**.
- Browser Chromium, halaman jadwal ibadah dirender dengan data uji, scroll 900 px: posisi header y=0, subnav y=86 (desktop 1440 px); y=0 dan y=76 (mobile 390 px): **lulus**.
- Unit / integration test upload: **lulus**. Video MP4 sintetis 33 MB diterima ke disk, format invalid ditolak, maksimum video konstanta 1 GiB; tidak ada uji unggah 1 GB penuh.
- Rangkaian test proyek: masih ada satu kegagalan tes lama integrasi renungan/siaran, yang sudah ada di sumber sebelum pembaruan ini. Tidak berkaitan dengan navbar/Warta.
- Pengujian MySQL aktif dengan data produksi serta reverse proxy belum dilakukan di lingkungan ini. Lakukan backup dan uji di localhost sebelum pemakaian publik.
