# GPI Cipayung • Pembaruan Dokumentasi Ibadah (Fresh 5)

## Fitur
Halaman **Ibadah Youth Revive Generation** dan **Ibadah Kaum Ibu** memiliki section **Dokumentasi Ibadah**.

- Album Drive bawaan Youth: https://drive.google.com/drive/folders/1Jx9PvVly5WZlpPYj4pMKtVzcrrMthhbL
- Album Drive bawaan Kaum Ibu: https://drive.google.com/drive/folders/1bBapA5ORt_hU2NiLCDDl8N9zDH_mpX_r
- Bisa tambah/ubah/hapus melalui **Dashboard → Konten Ibadah → Dokumentasi Ibadah** oleh akun Admin, Majelis, dan Pendeta.
- Tambah **upload lokal** foto JPG/PNG/WebP (maks 10 MB), video MP4/WebM/MOV (maks 30 MB), dan PDF (maks 15 MB).
- Tambah **tautan file Drive** foto/video/PDF atau **tautan folder Drive** yang akan ditampilkan di situs.
- Atur judul, deskripsi, halaman tujuan, urutan, status Draft/Publikasikan.
- Pengunjung hanya melihat dokumentasi yang statusnya `published` dan halaman ibadah yang statusnya `published`.

## Cara update di VS Code (Windows)

1. Cadangkan folder `GPI_CIPAYUNG_JS`, database MySQL, dan `.env` yang sedang digunakan.
2. Berhentikan server dengan `Ctrl + C`.
3. Ekstrak **GPI_CIPAYUNG_UPDATE_DOKUMENTASI_5.zip** ke folder **GPI_CIPAYUNG_JS** (file ZIP update langsung memuat `app/`, `views/`, `assets/`, dan seterusnya). Setujui penggantian file yang sama.
4. **Jangan mengganti `.env` atau database yang sudah ada.** Tidak ada dependency npm baru yang perlu dipasang.
5. Start MySQL di XAMPP.
6. Di CMD/terminal VS Code dalam folder proyek, jalankan `npm start`.
7. Buka `http://localhost:3000/admin` lalu **Konten Ibadah → Dokumentasi Ibadah**.
8. Buka `http://localhost:3000/ibadah-youth-revive-generation` atau `http://localhost:3000/ibadah-kaum-ibu`.
9. Untuk penyegaran cache browser, tekan `Ctrl + F5`.

## Migrasi database

Saat server pertama kali memuat konten website, aplikasi mencoba membuat tabel `website_documentation` dan menambahkan dua tautan folder Drive **sekali saja**. Tautan yang dihapus dari admin **tidak akan muncul lagi** setelah server direstart.

Jika akun MySQL tidak mempunyai hak `CREATE TABLE`, jalankan **hanya** file `database/migration_website_documentation.sql` dari phpMyAdmin menggunakan akun yang berizin. Jangan mengimpor ulang database utama.

## Cara menambah dokumentasi

1. Login ke dashboard dengan akun Admin / Majelis / Pendeta.
2. Pilih **Konten Ibadah → Dokumentasi Ibadah → + Tambah Dokumentasi**.
3. Pilih halaman tujuan (Youth atau Kaum Ibu).
4. Tulis judul dan deskripsi.
5. Pilih sumber:
   - **Upload dari perangkat:** pilih foto/video/PDF dari komputer dan klik Simpan.
   - **Tautan file Google Drive:** pilih tipe Foto/Video/PDF lalu tempel URL `https://drive.google.com/file/d/FILE_ID/view`.
   - **Album/folder Google Drive:** tempel URL `https://drive.google.com/drive/folders/FOLDER_ID`.
6. Atur status `Publikasikan` supaya tampil, atau `Draft` untuk disembunyikan.
7. Edit/Hapus dilakukan melalui tombol di kartu dokumentasi masing-masing.

## Cara kerja sinkronisasi Google Drive

**Mode standar (tidak memerlukan Google Cloud API key):** album tampil melalui `https://drive.google.com/embeddedfolderview?id=FOLDER_ID#grid`. Penambahan dan penghapusan file pada folder Drive akan tercermin dalam tampilan album setelah Google memperbarui daftar dan pengunjung memuat ulang halaman. Tampilan file mengikuti Google Drive, tidak sepenuhnya dikendalikan oleh website.

**Mode grid foto/video/PDF opsional:** aktifkan Google Drive API di Google Cloud Console, buat API key untuk akses folder publik, lalu tambahkan ke `.env`:

```dotenv
DRIVE_API_KEY=isi_api_key_anda
```

Jangan tampilkan API key kepada pengunjung atau commit `.env` ke repositori. Website memanggil API Google Drive **dari backend** dan menyimpan cache hasilnya selama 5 menit. Jika kunci tidak ada / terjadi error API, tampilan album sematan Drive tetap digunakan.

**Penting:** Atur berbagi folder serta file: **Siapa saja yang memiliki link → Pelihat**. Uji akses lewat jendela Incognito tanpa login Google. Hanya dokumentasi yang diizinkan untuk dipublikasikan yang boleh ditempatkan pada folder publik; khususnya, pastikan persetujuan untuk foto anak dan informasi pribadi. Mengunggah file melalui dashboard **tidak** otomatis mengunggah file tersebut ke Google Drive. Upload lokal disimpan pada server website (`uploads/media/service-docs/`).

## Keamanan dan kompatibilitas

- Semua aksi tambah/edit/hapus memerlukan login, pemeriksaan CSRF, dan hak akses `ibadah_konten`.
- Upload diperiksa format dan ukuran. File draft tidak dilayani kepada pengunjung publik.
- Hapus item upload lokal akan menghapus file lokal. Hapus item Drive **hanya** menghapus tautan dari website, tidak menghapus file asli dari Google Drive.
- Hapus halaman ibadah akan menghapus catatan dokumentasinya secara cascade dan berkas upload terkait.
- Instalasi baru: `npm install`, konfigurasi `.env`, import database utama sesuai panduan README lama, lalu start.

## Pengujian

Uji sintaks: `node --check server.js && node --check app/api.js`.
Pengujian fitur: `node --test test/website-documentation.test.js test/website-content.test.js test/views.test.js`.
Pengujian CRUD ke MySQL dan koneksi ke Google Drive nyata harus dilakukan pada instalasi yang mempunyai database, jaringan, dan hak akses folder yang sesuai.
