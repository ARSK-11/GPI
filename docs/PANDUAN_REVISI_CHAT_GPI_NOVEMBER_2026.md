# GPI Cipayung — Revisi Halaman Terhubung, Beranda, Help Center dan Media

## Yang sudah diubah

1. **Terhubung / Pemberkatan Pernikahan:** setelah memilih Pemberkatan Pernikahan, muncul bagian pengajuan khusus (NIJ/NIJ pasangan, CG/kelompok persekutuan, aktif CG sejak, rencana tanggal pernikahan), notifikasi bahwa permohonan bukan pendaftaran otomatis, dan identitas umum pengaju. Data khusus disimpan di kolom `connect_requests.detail_json` dan ditampilkan di detail permohonan dashboard. Kolom NIJ/CG disediakan karena diminta menyerupai contoh GMS; sesuaikan istilah dengan administrasi GPI Cipayung jika pengurus tidak memakai NIJ/CG.
2. **Header publik:** jarak antar-item diperbaiki, menu desktop tidak terpotong; pada layar yang lebih sempit, menjadi menu hamburger. Di beranda, bar navigasi transparan berada di atas cover.
3. **Cover Beranda:** font tulisan *Welcome Home* menggunakan font script **Alex Brush** dengan fallback font kursif. Memerlukan akses internet agar Google Fonts dimuat; bila offline akan memakai font kursif sistem. Foto cover masih menggunakan foto ibadah asli GPI Cipayung dari arsip sebelumnya.
4. **Pusat Bantuan dan Chat:** tombol mengambang di setiap halaman, tab Beranda / Bantuan / Pesan, rekomendasi Knowledge Base, pencarian dengan saran sesuai kata kunci, halaman detail artikel dan tautan internal. Data artikel disimpan pada `support_articles` dan dapat dikelola pengurus.
5. **Chat pengunjung:** formulir awal (kota, departemen, nama, telepon, email opsional, persetujuan). Setelah itu pengunjung dapat mengirim banyak pesan, memuat balasan admin berkala (sekitar 7 detik ketika chat dibuka). Chat tersimpan di MySQL: `support_threads`, `support_messages`. Token akses pribadi disimpan dalam `sessionStorage` tab browser, bukan pada URL ataupun halaman publik.
6. **Portal internal / Chat Jemaat:** menu baru *Chat Jemaat* tersedia untuk **Admin dan Majelis** (sesuai hak akses Pesan Masuk proyek). Petugas dapat membaca pesan, membalas, menandai percakapan selesai, membuat, menyunting, dan menyembunyikan artikel Knowledge Base. Dashboard memperbarui daftar pesan berkala (sekitar 6,5 detik ketika panel terbuka). Pendeta tidak memperoleh akses chat karena pada sistem sebelumnya tidak memiliki izin melihat Pesan Masuk.
7. **Media:** modal *Upload Media* hanya memuat **satu** field upload `files[]` yang digunakan API. Field `warta_file` salah tempat sudah dihapus dari modal Media, tetapi tetap ada pada modal Pengumuman/Warta. Upload banyak file galeri didukung (foto 10 MB/file, video 30 MB/file, maksimum 20 file/request). Media berstatus Published muncul pada galeri publik. Warta tetap terpisah dari galeri.

## Instalasi / upgrade

1. **Backup seluruh folder `GPI_CIPAYUNG_JS`, file `.env` lama, database MySQL dan direktori `uploads` yang berisi file dari situs berjalan.** Jangan menimpa database atau folder uploads lama dengan data kosong.
2. Ekstrak ZIP ke folder proyek. Jika proyek sudah berjalan, gabungkan file sumber revisi sambil mempertahankan file `.env`, database, dan file upload produksi.
3. Atur `.env` berdasarkan `.env.example` proyek. Gunakan nilai `SESSION_SECRET` yang kuat pada produksi, aktifkan HTTPS, dan pakai kredensial database yang memiliki izin `CREATE TABLE` / `ALTER TABLE` jika ingin migrasi otomatis.
4. Bila role database tidak dapat membuat tabel, jalankan terlebih dulu `database/migration_support_chat_2026.sql` dengan user DB yang berwenang. Untuk kolom `connect_requests.detail_json` tambahkan dengan SQL: `ALTER TABLE connect_requests ADD COLUMN detail_json TEXT NULL;` **hanya jika kolom belum ada**. Jika menggunakan auto-migrasi pada startup, langkah manual ini tidak diperlukan.
5. Dari direktori proyek jalankan `npm install`, `npm test`, lalu `npm start` (Node.js >=20). Website publik: `http://localhost:3000`, login: `http://localhost:3000/login`, portal: `http://localhost:3000/admin`.
6. Buka halaman *Terhubung*, uji pengajuan pernikahan; buka *Beranda*, uji menu hamburger dan tampilan font. Uji galeri: upload satu foto dan satu video dari menu Media, pilih Published, cek `/media`.
7. Uji chat dengan dua browser (atau browser normal dan incognito): browser A membuka situs sebagai pengunjung, isi formulir dan kirim pesan; browser B login Admin/Majelis, buka menu **Chat Jemaat**, pilih thread dan balas; browser A melihat balasan. Uji pula pencarian artikel, tambah/edit artikel, tandai percakapan selesai.

## Penjelasan teknis dan batasan

- Chat **bukan** integrasi layanan tawk.to atau WhatsApp; tidak menggunakan sistem AI generatif. Pencarian rekomendasi berbasis pencocokan kata kunci judul, ringkasan dan isi artikel. Balasan pengurus diperbarui melalui polling berkala, bukan WebSocket.
- Pengunjung tetap dapat membaca balasan selama akses chat tersimpan di tab browser (`sessionStorage`). Menghapus storage, menutup sesi tab tanpa pemulihan, atau berpindah perangkat dapat membuat riwayat tidak dapat dibuka dari sisi pengunjung. Admin tetap memiliki arsip di MySQL. Jangan mengirim token chat kepada orang lain.
- Tidak ada pengiriman otomatis email, notifikasi WhatsApp, atau push notification; admin perlu membuka dashboard untuk melihat pesan.
- Data formulir dan chat berisi data pribadi, batasi hak akses akun dan lakukan backup serta kebijakan penyimpanan/penghapusan sesuai kebutuhan gereja.
- Font tulisan tangan dimuat melalui Google Fonts ketika ada koneksi; fallback sudah tersedia.
- **Pengujian yang dilakukan di lingkungan penyusunan:** pemeriksaan sintaks Node/JavaScript dan unit tests. **Integrasi MySQL secara langsung belum terverifikasi**, sehingga wajib diuji di localhost/staging sebelum deploy produksi.
