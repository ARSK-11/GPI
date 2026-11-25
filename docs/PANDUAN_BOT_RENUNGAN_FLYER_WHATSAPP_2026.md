# PANDUAN BOT RENUNGAN DAN FLYER IBADAH — GPI CIPAYUNG

## Ringkasan

Versi ini **menambahkan fitur** ke proyek sebelumnya tanpa menghapus modul website, chat jemaat, warta, keuangan, dan database lama.

- Dashboard `/admin#rohani-broadcast` (Admin dan Majelis) untuk konten, pelanggan, dan kampanye.
- Website publik `/renungan-flyer` (alias `/renungan`, `/flyer-ibadah`), serta tautan di Beranda, navbar dan footer.
- Enam jenis konten: **Renungan Firman Tuhan**, **Ibadah Tengah Minggu**, **Ibadah Minggu Raya**, **Ibadah Youth/Pemuda**, **Ibadah Kaum Ibu**, **Ibadah Doa Pagi**.
- Input teks, ayat, tanggal ibadah, link Google Drive, YouTube atau gambar langsung. Draf dan konten *Published*.
- Poster ditampilkan **utuh**, `object-fit: contain`, area 3:4; video YouTube 16:9; tampilan menyesuaikan desktop, tablet dan ponsel.
- Admin menambahkan nomor yang **sudah memberikan persetujuan** (*opt-in*) dengan catatan persetujuannya, atau jemaat dapat mengirim `DAFTAR` ke nomor WhatsApp Business jika webhook aktif.
- Menjadwalkan atau membuat antrean pengiriman ke nomor pribadi yang memilih kategori tersebut. Riwayat dan status tersedia di dashboard.
- Berhenti: balas `STOP` atau `BERHENTI` (jika webhook aktif), atau dinonaktifkan oleh admin.

**Penting:** Media Google Drive/YouTube ditampilkan sebagai pratinjau di website. Untuk siaran WhatsApp, bot menyertakan **tautan media** di dalam pesan. WhatsApp tidak dapat menggunakan iframe YouTube/Drive sebagai lampiran gambar. Flyer JPG/PNG yang bisa diakses publik langsung dapat dikirim sebagai *image header* **hanya** bila menggunakan template Meta yang telah disetujui dengan *image header* dan `WA_TEMPLATE_IMAGE_HEADER=1`. Untuk gambar lainnya, gunakan tautan.

## Instalasi / Upgrade

1. **Backup database lama** dan folder `uploads/` terlebih dahulu.
2. Ekstrak ZIP dan gunakan `GPI_CIPAYUNG_JS` sebagai folder proyek; jangan timpa konfigurasi `.env` produksi tanpa mencadangkannya.
3. Pastikan Node.js >= 20 dan database MySQL sudah tersedia.
4. Buat atau perbarui `.env` berdasarkan `.env.example` (tetap masukkan DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, SESSION_SECRET milik instalasi Anda).
5. Jalankan `npm install`, kemudian `npm test`, lalu `npm start`.
6. Tabel baru `rohani_posts`, `rohani_subscribers`, `rohani_campaigns`, `rohani_deliveries`, `rohani_inbound_events` dibuat otomatis saat fitur dibuka jika akun MySQL punya izin CREATE TABLE. Apabila tidak, jalankan **sekali** `database/migration_renungan_broadcast_2026.sql` pada database yang sama (misalnya melalui phpMyAdmin). Tidak ada DROP TABLE / data dihapus oleh migrasi ini.
7. Buka `http://localhost:3000/admin#rohani-broadcast` untuk mengelola konten, atau `http://localhost:3000/renungan-flyer` untuk melihat publik.

## Aktivasi WhatsApp resmi Meta Cloud API

Diperlukan akun WhatsApp Business Platform (WABA) dan nomor WhatsApp Business dengan akses **Cloud API**. Jangan memakai bot WhatsApp Web atau library tidak resmi. Di **Meta for Developers / WhatsApp Manager**:

1. Siapkan aplikasi Meta, nomor WhatsApp, **Phone Number ID**, dan token sistem yang memiliki izin sesuai kebutuhan WhatsApp Business Platform. Uji dengan nomor penguji yang diizinkan terlebih dahulu.
2. Buat template **Marketing** (renungan dan undangan ibadah dapat dinilai sebagai pesan pemasaran oleh Meta). Contoh nama: `gpi_renungan_flyer`; contoh bahasa: Indonesian (`id`). Kirim untuk **persetujuan Meta** sebelum mencoba broadcast di luar jendela layanan.
3. Contoh badan template persis dengan **3 parameter teks**:

   ```text
   Shalom! Informasi dari GPI Cipayung:
   *{{1}}*
   *{{2}}*
   {{3}}
   
   Untuk berhenti menerima pembaruan, balas STOP.
   ```

   Keterangan: `{{1}}` kategori, `{{2}}` judul, `{{3}}` ringkasan konten + tautan media. Sesuaikan contoh variabel di WhatsApp Manager; template yang disetujui harus konsisten dengan bentuk parameter yang dikirim kode. Jika ingin header gambar, buat varian template dengan header **IMAGE**, lalu set `WA_TEMPLATE_IMAGE_HEADER=1` dan gunakan URL JPG/PNG HTTPS langsung, bukan Drive.
4. Lengkapi `.env`:

   ```dotenv
   WA_CLOUD_PHONE_NUMBER_ID=PHONE_NUMBER_ID_ANDA
   WA_CLOUD_TOKEN=TOKEN_RAHASIA_ANDA
   WA_GRAPH_VERSION=v23.0
   WA_BROADCAST_TEMPLATE_NAME=gpi_renungan_flyer
   WA_BROADCAST_TEMPLATE_LANGUAGE=id
   WA_TEMPLATE_IMAGE_HEADER=0
   WA_VERIFY_TOKEN=TOKEN_VERIFIKASI_RAHASIA_YANG_DIPILIH_ANDA
   WA_APP_SECRET=APP_SECRET_DARI_META
   WA_WORKER_ENABLED=1
   ```

   `WA_GRAPH_VERSION` harus disesuaikan dengan **versi Graph API yang masih didukung** pada akun Meta Anda saat penerapan. **Jangan memasukkan token dan App Secret ke source code publik atau Git.**
5. Gunakan domain **HTTPS publik** yang mengarah ke server, kemudian atur callback webhook Meta ke:

   `https://DOMAIN-GEREJA-ANDA/rohani-api/webhook`

   Verify Token di Meta harus sama dengan `WA_VERIFY_TOKEN` pada `.env`. Aktifkan *messages* dan *message status events* agar pesan `DAFTAR` / `STOP` serta status `sent`, `delivered`, `read`, `failed` masuk. Webhook POST dicek dengan tanda tangan HMAC SHA-256 (`WA_APP_SECRET`). **`localhost` tidak dapat diakses Meta dari internet.**
6. Kirim satu pesan uji menggunakan nomor yang sudah menyetujui berlangganan. Periksa status pengiriman di admin, serta WhatsApp penerima.

**Catatan biaya dan aturan:** Template bisnis dapat menimbulkan biaya per pesan menurut kategori dan negara penerima. Pesan otomatis yang dimulai gereja di luar jendela layanan WhatsApp umumnya memerlukan **template yang telah disetujui Meta**. Verifikasi kategori, limit pengiriman, dan harga aktual di WhatsApp Manager sebelum produksi. Penerima harus dapat menolak/langganan berhenti. API ini mengirim **pesan langsung per penerima**, bukan mengirim otomatis ke grup WhatsApp.

## Mengelola Konten dan Flyer

1. Login Admin/Majelis → menu **Renungan & Flyer WA**.
2. Isi kategori, judul, ayat Firman (opsional), isi renungan atau tema/jam/lokasi, dan link media.
3. Bila menggunakan Google Drive, pilih file, klik **Share → General access → Anyone with the link → Viewer**, kemudian salin link file yang valid. Jangan memasukkan link folder.
4. Untuk YouTube gunakan URL video (`youtube.com/watch?v=...`, `youtu.be/...`, Shorts). Video yang diblokir untuk embed tidak dapat diputar langsung, tetapi link aslinya tetap tersedia.
5. Periksa pratinjau; ubah status menjadi **Published** agar muncul di website.
6. Jika ingin mengirim, pilih materi yang sudah Published, pilih jadwal WIB (kosong untuk sekarang), lalu klik **Buat antrean pengiriman**.

**Perhatikan tampilan:** pratinjau Google Drive adalah iframe dari Google dan menyesuaikan proporsi poster 3:4. Google dapat menampilkan bingkai/toolbar sendiri atau menolak pratinjau untuk file yang tidak dibagikan. Untuk flyer yang harus mengisi ruang secara bersih dan tetap utuh, gunakan **URL gambar JPG/PNG langsung** (HTTPS publik) agar `object-fit: contain` dapat bekerja tanpa toolbar Drive. Jika mengunggah JPG/PNG ke Drive, iframe preview tidak menjadikannya URL langsung untuk lampiran WhatsApp.

## Pelanggan dan Persetujuan

- Admin hanya boleh memasukkan nomor yang **sudah menyetujui langganan**. Simpan jenis informasi dan asal/bukti persetujuan. Jangan menyalin semua nomor dari database jemaat tanpa persetujuan.
- Atur kategori yang sesuai, misalnya pemuda hanya untuk **Youth** dan **Renungan**.
- Penerima yang mengirim `DAFTAR` ke nomor WhatsApp Cloud API otomatis tercatat untuk keenam kategori. `STOP`, `BERHENTI`, atau `UNSUBSCRIBE` menonaktifkan penerimaan pesan berikutnya.
- Apabila webhook tidak aktif, admin harus memproses permintaan berhenti secara manual melalui dashboard; untuk produksi, **aktifkan webhook** supaya unsubscribe otomatis.
- Admin/Majelis dapat menghentikan pelanggan secara manual. Pendeta tidak diberikan akses database pelanggan pribadi dalam modul ini.

## Pengiriman, Jadwal, dan Log

- Saat membuat kampanye, aplikasi membentuk satu baris `rohani_deliveries` per penerima yang cocok kategori dan masih setuju.
- Worker mengirim maksimal **5 pesan setiap 10 detik** (jika server hidup dan `WA_WORKER_ENABLED=1`). Implementasi ini aman dari resubmit otomatis setelah timeout; status tak pasti akan menjadi `unknown`, dan memerlukan pengecekan manual sebelum tindakan lanjut.
- Saat server mati, jadwal yang terlewat akan diproses ketika aplikasi aktif kembali. Atur proses agar terus hidup, dan pastikan hanya satu worker aktif atau biarkan klaim database mencegah duplikasi.
- `accepted` berarti API Meta menerima permintaan, **bukan** bukti diterima ponsel. Webhook yang aktif dapat mengubah status menjadi `sent`, `delivered`, `read`, atau `failed`.
- Membatalkan kampanye menghentikan **pesan yang belum diproses**. Pesan yang sudah diterima API Meta tidak dapat ditarik.
- Jika media dalam WhatsApp tidak tampil, cek akses publik gambar; link Google Drive dan YouTube tetap menjadi tautan, bukan file yang dikirimkan secara native.

## Checklist sebelum aktif di produksi

- [ ] Backup database dan folder upload.
- [ ] Semua perintah `npm test` lulus dan `npm start` berjalan.
- [ ] `http://localhost:3000/renungan-flyer` dan dashboard dapat dibuka.
- [ ] Link Drive dapat diakses tanpa login akun Google.
- [ ] Pratinjau media proporsional di desktop/tablet/ponsel.
- [ ] Token, Phone Number ID, nama template approved, dan HTTPS webhook dikonfigurasi.
- [ ] Satu nomor yang telah memberikan opt-in berhasil menerima pesan uji.
- [ ] Perintah `STOP` benar-benar menonaktifkan langganan.
- [ ] Tidak ada pesan dikirim ke nomor yang belum memberikan persetujuan.
- [ ] Riwayat kampanye dan status webhook sesuai hasil WhatsApp.

## Apa yang sudah diuji dan yang masih perlu diuji di server Anda

Pemeriksaan sintaks (`node --check`) dan tes unit dengan `node --test` sudah dilakukan pada kode revisi. Pengujian integrasi **MySQL nyata, autentikasi akun langsung, browser sungguhan, dan pengiriman Meta Cloud API langsung** belum bisa dilakukan tanpa kredensial/database lingkungan Anda. Karena itu pengiriman baru akan aktif setelah konfigurasi WABA, template, webhook dan database Anda sudah sesuai.

Referensi: https://developers.facebook.com/docs/whatsapp/cloud-api/ dan https://support.google.com/youtube/answer/171780
