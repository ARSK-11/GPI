-- ==========================================================
-- DATABASE UTAMA WEBSITE GPI CIPAYUNG
-- Versi: Node.js + MySQL/MariaDB (skema kompatibel dengan versi PHP)
-- Cara pakai: import file ini jika ingin membuat database dari awal.
-- PERINGATAN: file ini akan DROP database gpi_cipayung lalu membuat ulang.
-- ==========================================================

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+07:00';
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS `gpi_cipayung`;
CREATE DATABASE `gpi_cipayung` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gpi_cipayung`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `whatsapp_logs`;
DROP TABLE IF EXISTS `chatbot_messages`;
DROP TABLE IF EXISTS `media_uploads`;
DROP TABLE IF EXISTS `pengumuman`;
DROP TABLE IF EXISTS `jadwal_pelayanan`;
DROP TABLE IF EXISTS `jemaat`;
DROP TABLE IF EXISTS `app_settings`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `sakramen_pernikahan`;
DROP TABLE IF EXISTS `sakramen_baptisan`;
DROP TABLE IF EXISTS `sakramen_sidi`;
DROP TABLE IF EXISTS `tim_pelayan_members`;
DROP TABLE IF EXISTS `pelayanan_tim`;
DROP TABLE IF EXISTS `sakramen`;
DROP TABLE IF EXISTS `persembahan`;
DROP TABLE IF EXISTS `pengeluaran`;
DROP VIEW IF EXISTS `view_statistik_jemaat`;
DROP VIEW IF EXISTS `view_laporan_keuangan_bulanan`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(80) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `nama_lengkap` VARCHAR(160) NOT NULL,
  `email` VARCHAR(160) DEFAULT NULL,
  `role` VARCHAR(30) NOT NULL DEFAULT 'admin',
  `status` VARCHAR(20) NOT NULL DEFAULT 'aktif',
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  UNIQUE KEY `uk_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `role_permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role` VARCHAR(30) NOT NULL,
  `section_key` VARCHAR(60) NOT NULL,
  `can_view` TINYINT(1) NOT NULL DEFAULT 0,
  `can_create` TINYINT(1) NOT NULL DEFAULT 0,
  `can_update` TINYINT(1) NOT NULL DEFAULT 0,
  `can_delete` TINYINT(1) NOT NULL DEFAULT 0,
  `can_import` TINYINT(1) NOT NULL DEFAULT 0,
  `can_export` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_section` (`role`, `section_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `app_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `jemaat` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nomor_urut` INT UNSIGNED DEFAULT NULL,
  `nama_keluarga` VARCHAR(180) DEFAULT NULL,
  `nama_lengkap` VARCHAR(180) NOT NULL,
  `jenis_kelamin` VARCHAR(20) NOT NULL DEFAULT '',
  `tempat_lahir` VARCHAR(120) DEFAULT NULL,
  `tanggal_lahir` DATE DEFAULT NULL,
  `alamat` TEXT,
  `no_hp` VARCHAR(40) DEFAULT NULL,
  `whatsapp` VARCHAR(40) DEFAULT NULL,
  `email` VARCHAR(160) DEFAULT NULL,
  `status_jemaat` VARCHAR(30) NOT NULL DEFAULT 'Aktif',
  `status_keluarga` VARCHAR(120) DEFAULT NULL,
  `tanggal_bergabung` DATE DEFAULT NULL,
  `catatan` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jemaat_nomor` (`nomor_urut`),
  KEY `idx_jemaat_keluarga` (`nama_keluarga`),
  KEY `idx_jemaat_nama` (`nama_lengkap`),
  KEY `idx_jemaat_status` (`status_jemaat`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `jadwal_pelayanan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tanggal` DATE NOT NULL,
  `hari` VARCHAR(30) DEFAULT NULL,
  `jenis_ibadah` VARCHAR(140) NOT NULL,
  `jam_mulai` TIME DEFAULT NULL,
  `jam_selesai` TIME DEFAULT NULL,
  `lokasi` VARCHAR(180) DEFAULT 'GPI Cipayung',
  `tema` VARCHAR(220) DEFAULT NULL,
  `pemimpin_pujian` VARCHAR(180) DEFAULT NULL,
  `singer` VARCHAR(255) DEFAULT NULL,
  `pemain_musik` VARCHAR(255) DEFAULT NULL,
  `pengkhotbah` VARCHAR(180) DEFAULT NULL,
  `liturgis` VARCHAR(180) DEFAULT NULL,
  `multimedia` VARCHAR(180) DEFAULT NULL,
  `usher` VARCHAR(180) DEFAULT NULL,
  `kolektan` VARCHAR(180) DEFAULT NULL,
  `catatan` TEXT,
  `status` VARCHAR(30) NOT NULL DEFAULT 'published',
  `reminder_h_minus_1` TINYINT(1) NOT NULL DEFAULT 1,
  `reminder_sent_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jadwal_tanggal` (`tanggal`),
  KEY `idx_jadwal_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pengumuman` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `judul` VARCHAR(220) NOT NULL,
  `isi` TEXT NOT NULL,
  `tanggal_publish` DATE NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'published',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pengumuman_status_tanggal` (`status`, `tanggal_publish`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `media_uploads` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `judul` VARCHAR(180) NOT NULL,
  `deskripsi` TEXT,
  `file_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(40) NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'published',
  `uploaded_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_media_status` (`status`),
  KEY `idx_media_uploaded_by` (`uploaded_by`),
  CONSTRAINT `fk_media_user` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `chatbot_messages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama` VARCHAR(160) NOT NULL,
  `kontak` VARCHAR(160) DEFAULT NULL,
  `pesan` TEXT NOT NULL,
  `balasan` TEXT,
  `status` VARCHAR(30) NOT NULL DEFAULT 'baru',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chat_status` (`status`),
  KEY `idx_chat_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `whatsapp_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jadwal_id` INT UNSIGNED DEFAULT NULL,
  `target_name` VARCHAR(180) DEFAULT NULL,
  `target_phone` VARCHAR(60) DEFAULT NULL,
  `message_type` VARCHAR(40) NOT NULL DEFAULT 'group_manual',
  `message_text` TEXT NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'menunggu',
  `response_text` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wa_jadwal` (`jadwal_id`),
  KEY `idx_wa_status` (`status`),
  CONSTRAINT `fk_wa_jadwal` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_pelayanan` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sakramen` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jemaat_id` INT UNSIGNED DEFAULT NULL,
  `nama_penerima` VARCHAR(180) NOT NULL,
  `jenis_sakramen` VARCHAR(80) NOT NULL,
  `tanggal` DATE NOT NULL,
  `pelayan` VARCHAR(180) DEFAULT NULL,
  `catatan` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sakramen_tanggal` (`tanggal`),
  KEY `idx_sakramen_jemaat` (`jemaat_id`),
  CONSTRAINT `fk_sakramen_jemaat` FOREIGN KEY (`jemaat_id`) REFERENCES `jemaat` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `sakramen_baptisan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jemaat_id` INT UNSIGNED DEFAULT NULL,
  `nama_penerima` VARCHAR(180) NOT NULL,
  `tanggal_baptis` DATE NOT NULL,
  `tempat` VARCHAR(180) DEFAULT 'GPI Cipayung',
  `pendeta` VARCHAR(180) DEFAULT NULL,
  `jenis_baptis` VARCHAR(80) DEFAULT 'Baptis Air',
  `no_sertifikat` VARCHAR(120) DEFAULT NULL,
  `keterangan` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_baptisan_tanggal` (`tanggal_baptis`),
  KEY `idx_baptisan_jemaat` (`jemaat_id`),
  CONSTRAINT `fk_baptisan_jemaat` FOREIGN KEY (`jemaat_id`) REFERENCES `jemaat` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sakramen_sidi` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jemaat_id` INT UNSIGNED DEFAULT NULL,
  `nama_penerima` VARCHAR(180) NOT NULL,
  `tanggal_sidi` DATE NOT NULL,
  `tempat` VARCHAR(180) DEFAULT 'GPI Cipayung',
  `pendeta` VARCHAR(180) DEFAULT NULL,
  `no_sertifikat` VARCHAR(120) DEFAULT NULL,
  `keterangan` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sidi_tanggal` (`tanggal_sidi`),
  KEY `idx_sidi_jemaat` (`jemaat_id`),
  CONSTRAINT `fk_sidi_jemaat` FOREIGN KEY (`jemaat_id`) REFERENCES `jemaat` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sakramen_pernikahan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nama_pria` VARCHAR(180) NOT NULL,
  `nama_wanita` VARCHAR(180) NOT NULL,
  `tanggal_nikah` DATE NOT NULL,
  `tempat` VARCHAR(180) DEFAULT 'GPI Cipayung',
  `pendeta` VARCHAR(180) DEFAULT NULL,
  `no_sertifikat` VARCHAR(120) DEFAULT NULL,
  `saksi_pria` VARCHAR(180) DEFAULT NULL,
  `saksi_wanita` VARCHAR(180) DEFAULT NULL,
  `keterangan` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pernikahan_tanggal` (`tanggal_nikah`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pelayanan_tim` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `kategori` VARCHAR(120) NOT NULL,
  `nama_tim` VARCHAR(180) NOT NULL,
  `deskripsi` TEXT,
  `penanggung_jawab` VARCHAR(180) DEFAULT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'published',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pelayanan_status` (`status`),
  KEY `idx_pelayanan_kategori` (`kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tim_pelayan_members` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jemaat_id` INT UNSIGNED DEFAULT NULL,
  `nama_lengkap` VARCHAR(180) NOT NULL,
  `kategori` VARCHAR(60) NOT NULL DEFAULT 'pelayanan_gereja',
  `tim` VARCHAR(140) NOT NULL,
  `jabatan` VARCHAR(140) NOT NULL,
  `urutan` INT NOT NULL DEFAULT 99,
  `foto_path` VARCHAR(255) DEFAULT NULL,
  `deskripsi` TEXT,
  `status` VARCHAR(30) NOT NULL DEFAULT 'published',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tim_pelayan_kategori` (`kategori`),
  KEY `idx_tim_pelayan_status` (`status`),
  KEY `idx_tim_pelayan_urutan` (`urutan`),
  KEY `idx_tim_pelayan_jemaat` (`jemaat_id`),
  CONSTRAINT `fk_tim_pelayan_jemaat` FOREIGN KEY (`jemaat_id`) REFERENCES `jemaat` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `persembahan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tanggal` DATE NOT NULL,
  `kategori_dana` VARCHAR(80) NOT NULL DEFAULT 'Persembahan',
  `jenis` VARCHAR(120) NOT NULL DEFAULT 'Persembahan Umum',
  `jenis_ibadah` VARCHAR(140) DEFAULT NULL,
  `jenis_persembahan` VARCHAR(140) NOT NULL DEFAULT 'Persembahan Umum',
  `jumlah` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `kolektan` VARCHAR(180) DEFAULT NULL,
  `keterangan` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_persembahan_tanggal` (`tanggal`),
  KEY `idx_persembahan_kategori` (`kategori_dana`),
  KEY `idx_persembahan_jenis` (`jenis_persembahan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pengeluaran` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tanggal` DATE NOT NULL,
  `kategori` VARCHAR(120) NOT NULL,
  `keterangan` VARCHAR(220) DEFAULT NULL,
  `jumlah` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pengeluaran_tanggal` (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Akun awal tersimpan di database untuk 3 aktor sistem. Ganti password setelah instalasi.
INSERT INTO `users` (`username`, `password_hash`, `nama_lengkap`, `email`, `role`, `status`) VALUES
('admin', '$2y$12$65Z7b5AX6j7sZu6.pT/kluougqlmZIZWCqDQDo0PbQN3TLbZ69op.', 'Administrator GPI Cipayung', 'admin@gpicipayung.local', 'admin', 'aktif'),
('majelis', '$2y$12$6VrCBCTTRMdu2.BKofkz7u58Yl.uRt3bwscjc7hPCv6ECO1Dmjpdi', 'Majelis / Pengurus GPI Cipayung', 'majelis@gpicipayung.local', 'majelis', 'aktif'),
('pendeta', '$2y$12$b7.wyMowsUdN4SI/oK9vTO1OC18unqduXSZ47HitLiZWGka8hvyL6', 'Pendeta GPI Cipayung', 'pendeta@gpicipayung.local', 'pendeta', 'aktif');



INSERT INTO `role_permissions` (`role`, `section_key`, `can_view`, `can_create`, `can_update`, `can_delete`, `can_import`, `can_export`) VALUES
('admin','dashboard',1,0,0,0,0,0),('admin','users',1,1,1,1,0,0),('admin','jemaat',1,1,1,1,1,1),('admin','jadwal',1,1,1,1,1,1),('admin','pengumuman',1,1,1,1,0,1),('admin','media',1,1,1,1,0,1),('admin','pesan',1,1,1,1,0,1),('admin','sakramen',1,1,1,1,0,1),('admin','persembahan',1,1,1,1,0,1),('admin','pernikahan',1,1,1,1,0,1),('admin','tim_pelayan',1,1,1,1,0,1),('admin','whatsapp',1,0,0,0,0,1),
('majelis','dashboard',1,0,0,0,0,0),('majelis','users',0,0,0,0,0,0),('majelis','jemaat',1,1,1,1,1,1),('majelis','jadwal',1,1,1,1,1,1),('majelis','pengumuman',1,1,1,1,0,1),('majelis','media',1,1,1,1,0,1),('majelis','pesan',1,1,1,1,0,1),('majelis','sakramen',1,1,1,1,0,1),('majelis','persembahan',1,1,1,1,0,1),('majelis','pernikahan',1,1,1,1,0,1),('majelis','tim_pelayan',1,1,1,1,0,1),('majelis','whatsapp',1,0,0,0,0,1),
('pendeta','dashboard',1,0,0,0,0,0),('pendeta','users',0,0,0,0,0,0),('pendeta','jemaat',1,0,0,0,0,1),('pendeta','jadwal',1,0,0,0,0,1),('pendeta','pengumuman',1,0,0,0,0,1),('pendeta','media',1,0,0,0,0,1),('pendeta','pesan',0,0,0,0,0,0),('pendeta','sakramen',1,0,0,0,0,1),('pendeta','persembahan',1,0,0,0,0,1),('pendeta','pernikahan',1,0,0,0,0,1),('pendeta','tim_pelayan',1,0,0,0,0,1),('pendeta','whatsapp',1,0,0,0,0,1);

INSERT INTO `app_settings` (`setting_key`, `setting_value`) VALUES
('nama_gereja', 'GPI Cipayung'),
('alamat_gereja', 'Jl. Tengki No. 78 RT04/03 Cipayung, Jakarta Timur'),
('telepon_gereja', '081315490602'),
('email_gereja', 'gpisidangcipayung@gmail.com'),
('whatsapp_group_invite', 'https://chat.whatsapp.com/CkPJODyvqcu7IjUQqyAABu');

INSERT INTO `pengumuman` (`judul`, `isi`, `tanggal_publish`, `status`) VALUES
('Website GPI Cipayung Aktif', 'Website ini digunakan untuk informasi jadwal ibadah, pelayanan, media, dan komunikasi jemaat.', CURDATE(), 'published');


INSERT INTO `pelayanan_tim` (`kategori`, `nama_tim`, `deskripsi`, `penanggung_jawab`, `status`) VALUES
('Pelayanan', 'Tim Musik & Singers', 'Melayani pujian, penyembahan, musik ibadah, dan singers.', 'Koordinator Musik', 'published'),
('Pelayanan', 'Tim Pelayanan Gereja', 'Koordinasi pelayan ibadah, usher, multimedia, dan pendukung pelayanan.', 'Pengurus Gereja', 'published'),
('Pelayanan', 'Sekolah Minggu', 'Pelayanan pembinaan iman anak dan generasi muda sejak dini.', 'Koordinator Sekolah Minggu', 'published'),
('Pelayanan', 'Revive Generation', 'Pembinaan karakter dan komunitas pemuda gereja.', 'Koordinator Revive Generation', 'published'),
('Pelayanan', 'Kaum Ibu', 'Wadah pertumbuhan rohani dan pemberdayaan kaum wanita gereja.', 'Koordinator Kaum Ibu', 'published'),
('Pelayanan', 'Pendalaman Alkitab', 'Kelompok pembelajaran Firman Tuhan dan pertumbuhan iman.', 'Koordinator PA', 'published');

INSERT INTO `tim_pelayan_members` (`nama_lengkap`, `kategori`, `tim`, `jabatan`, `urutan`, `foto_path`, `status`) VALUES
('Natalia Debora Sinaga', 'musik', 'Pemain Musik', 'Pemain Keyboard', 1, '', 'published'),
('Andre Siburian', 'musik', 'Pemain Musik', 'Pemain Gitar', 2, '', 'published'),
('Gideon Siburian', 'musik', 'Pemain Musik', 'Pemain Drum', 3, 'assets/img/gideon.jpg', 'published'),
('Yakub Rumahorbo', 'musik', 'Pemain Musik', 'Pemain Bass', 4, '', 'published'),
('David Sitompul', 'musik', 'Pemain Cadangan', 'Bass & Gitar', 5, 'assets/img/david.jpg', 'published'),
('Aaron Sinaga', 'musik', 'Pemain Cadangan', 'Keyboard & Drum', 6, '', 'published'),
('Johan Sihombing', 'musik', 'Pemain Cadangan', 'Gitar & Drum', 7, 'assets/img/johan.jpg', 'published'),
('Septiana Sinaga', 'singer', 'Singers', 'Vocalist', 11, 'assets/img/septiana.jpg', 'published'),
('Rahel Sitompul', 'singer', 'Singers', 'Vocalist', 12, 'assets/img/rahel.jpg', 'published'),
('Isak Sinaga', 'singer', 'Singers', 'Vocalist', 13, 'assets/img/isak.jpg', 'published'),
('Pdt. E.H. Sinaga', 'pelayanan_gereja', 'Gembala Sidang', 'Gembala Sidang', 1, 'assets/img/pdt-e-h-sinaga.jpg', 'published'),
('Ev. D. F. Manurung', 'pelayanan_gereja', 'Pendamping & Pelayan Gereja', 'Evangelis', 2, '', 'published'),
('Ibu Pdt. J. Sinaga', 'pelayanan_gereja', 'Pendamping & Pelayan Gereja', 'Hamba Tuhan', 3, '', 'published'),
('Gr. H. Sitorus', 'pelayanan_gereja', 'Pendamping & Pelayan Gereja', 'Hamba Tuhan', 4, '', 'published'),
('St. N. Sihombing', 'pelayanan_gereja', 'Pendamping & Pelayan Gereja', 'Hamba Tuhan', 5, '', 'published'),
('St. R. B. Rumahorbo', 'pelayanan_gereja', 'Pendamping & Pelayan Gereja', 'Hamba Tuhan', 6, '', 'published'),
('St. R. D. Sinaga', 'pelayanan_gereja', 'Pendamping & Pelayan Gereja', 'Hamba Tuhan', 7, '', 'published'),
('St. H. Sitorus', 'pelayanan_gereja', 'Pendamping & Pelayan Gereja', 'Hamba Tuhan', 8, '', 'published'),
('Ibu St. Siagian', 'pelayanan_gereja', 'Pendamping & Pelayan Gereja', 'Hamba Tuhan', 9, '', 'published'),
('Nama Lengkap', 'diakonia', 'Diakonia Gereja', 'Ketua', 1, '', 'published'),
('Nama Lengkap', 'diakonia', 'Diakonia Gereja', 'Sekretaris', 2, '', 'published'),
('Nama Lengkap', 'diakonia', 'Diakonia Gereja', 'Keuangan', 3, '', 'published'),
('Johan Sihombing', 'media', 'Media Gereja', 'Koordinator Media', 1, '', 'published'),
('Septiana Sinaga', 'media', 'Media Gereja', 'Publikasi', 2, 'assets/img/septiana.jpg', 'published'),
('Rahel Sitompul', 'media', 'Media Gereja', 'Dokumentasi', 3, 'assets/img/rahel.jpg', 'published'),
('David Sitompul', 'media', 'Media Gereja', 'Teknis Media', 5, '', 'published'),
('Isak Sinaga', 'media', 'Media Gereja', 'Konten Digital', 4, 'assets/img/isak.jpg', 'published'),
('Natalia Debora Sinaga', 'sekolah_minggu', 'Sekolah Minggu', 'Koordinator Guru Sekolah Minggu', 1, 'assets/img/team/natalia-debora-sinaga.svg', 'published'),
('Ibu Pdt. E. H. Sinaga / Br. Nainggolan', 'sekolah_minggu', 'Sekolah Minggu', 'Guru Sekolah Minggu', 2, 'assets/img/team/ibu-pdt-e-h-sinaga-br-nainggolan.svg', 'published'),
('Ibu St. R. D. Sinaga / Br. Simanjuntak', 'sekolah_minggu', 'Sekolah Minggu', 'Guru Sekolah Minggu', 3, 'assets/img/team/ibu-st-r-d-sinaga-br-simanjuntak.svg', 'published'),
('Bp. St. R. D. Sinaga', 'sekolah_minggu', 'Sekolah Minggu', 'Guru Sekolah Minggu', 4, 'assets/img/team/bp-st-r-d-sinaga.svg', 'published'),
('Gideon Siburian', 'sekolah_minggu', 'Sekolah Minggu', 'Guru Sekolah Minggu', 5, 'assets/img/gideon.jpg', 'published'),
('Ibu Siagian / Br. Sinaga', 'sekolah_minggu', 'Sekolah Minggu', 'Guru Sekolah Minggu', 6, 'assets/img/team/ibu-siagian-br-sinaga.svg', 'published'),
('Isak Sinaga', 'sekolah_minggu', 'Sekolah Minggu', 'Guru Sekolah Minggu', 7, 'assets/img/isak.jpg', 'published'),
('David Sitompul', 'sekolah_minggu', 'Sekolah Minggu', 'Guru Sekolah Minggu', 8, 'assets/img/david.jpg', 'published'),
('Septiana Sinaga', 'sekolah_minggu', 'Sekolah Minggu', 'Guru Sekolah Minggu', 9, 'assets/img/septiana.jpg', 'published'),
('Johan Sihombing', 'sekolah_minggu', 'Sekolah Minggu', 'Guru Sekolah Minggu', 10, 'assets/img/johan.jpg', 'published'),
('Emely Sihombing', 'sekolah_minggu', 'Sekolah Minggu', 'Guru Sekolah Minggu', 11, 'assets/img/team/emely-sihombing.svg', 'published'),
('Ibu Pdt. J. Sinaga / Br. Nababan', 'kaum_ibu', 'Kaum Ibu', 'Pembina', 1, 'assets/img/team/ibu-pdt-j-sinaga-br-nababan.svg', 'published'),
('Ibu Lumbangaol / Br. Manurung', 'kaum_ibu', 'Kaum Ibu', 'Ketua', 2, 'assets/img/team/ibu-lumbangaol-br-manurung.svg', 'published'),
('Ibu Sihombing / Br. Sinaga', 'kaum_ibu', 'Kaum Ibu', 'Sekretaris', 3, 'assets/img/team/ibu-sihombing-br-sinaga.svg', 'published'),
('Ibu Siagian / Br. Sinaga', 'kaum_ibu', 'Kaum Ibu', 'Bendahara', 4, 'assets/img/team/ibu-siagian-br-sinaga.svg', 'published'),
('Ibu Gr. H. Sitorus / Br. Sihombing', 'kaum_ibu', 'Kaum Ibu', 'Sie. Doa', 5, 'assets/img/team/ibu-gr-h-sitorus-br-sihombing.svg', 'published'),
('Ibu St. Sinaga / Br. Sinaga', 'kaum_ibu', 'Kaum Ibu', 'Sie. Pemerhati', 6, 'assets/img/team/ibu-st-sinaga-br-sinaga.svg', 'published'),
('Ibu Pdt. E. H. Sinaga / Br. Nainggolan', 'kaum_ibu', 'Kaum Ibu', 'Anggota', 7, 'assets/img/team/ibu-pdt-e-h-sinaga-br-nainggolan.svg', 'published'),
('Ibu Ev. D. F. Manurung', 'kaum_ibu', 'Kaum Ibu', 'Anggota', 8, 'assets/img/team/ibu-ev-d-f-manurung.svg', 'published'),
('Ibu St. R. B. Rumahorbo / Br. Sitompul', 'kaum_ibu', 'Kaum Ibu', 'Anggota', 9, 'assets/img/team/ibu-st-r-b-rumahorbo-br-sitompul.svg', 'published'),
('Ibu St. Sinaga / Br. Simanjuntak', 'kaum_ibu', 'Kaum Ibu', 'Anggota', 10, 'assets/img/team/ibu-st-sinaga-br-simanjuntak.svg', 'published'),
('Ibu St. N. Sihombing / Br. Silitonga', 'kaum_ibu', 'Kaum Ibu', 'Anggota', 11, 'assets/img/team/ibu-st-n-sihombing-br-silitonga.svg', 'published'),
('Bp. St. H. Sitorus', 'pemuda', 'Revive Generation', 'Pembina', 1, 'assets/img/team/bp-st-h-sitorus.svg', 'published'),
('Gideon Ferdinan Siburian, S.Pd', 'pemuda', 'Revive Generation', 'Ketua', 2, 'assets/img/gideon.jpg', 'published'),
('Imell Warnita Sihombing', 'pemuda', 'Revive Generation', 'Sekretaris', 3, 'assets/img/team/imell-warnita-sihombing.svg', 'published'),
('Zefanya Manurung', 'pemuda', 'Revive Generation', 'Bendahara', 4, 'assets/img/team/zefanya-manurung.svg', 'published'),
('Abygail Septiani Rumahorbo', 'pemuda', 'Revive Generation', 'Kerohanian', 5, 'assets/img/team/abygail-septiani-rumahorbo.svg', 'published'),
('Yosia Natanael Siagian', 'pemuda', 'Revive Generation', 'Humas', 6, 'assets/img/team/yosia-natanael-siagian.svg', 'published'),
('Taruli Abigael Kristina Samosir', 'pemuda', 'Revive Generation', 'Humas', 7, 'assets/img/team/taruli-abigael-kristina-samosir.svg', 'published');

CREATE VIEW `view_statistik_jemaat` AS
SELECT
  COUNT(*) AS total_jemaat,
  SUM(CASE WHEN `status_jemaat` = 'Aktif' THEN 1 ELSE 0 END) AS total_aktif,
  SUM(CASE WHEN `jenis_kelamin` = 'Laki-laki' THEN 1 ELSE 0 END) AS total_laki_laki,
  SUM(CASE WHEN `jenis_kelamin` = 'Perempuan' THEN 1 ELSE 0 END) AS total_perempuan
FROM `jemaat`;

CREATE VIEW `view_laporan_keuangan_bulanan` AS
SELECT
  `tahun`,
  `bulan`,
  SUM(`total_pemasukan`) AS `total_pemasukan`,
  SUM(`total_pengeluaran`) AS `total_pengeluaran`,
  SUM(`total_pemasukan`) - SUM(`total_pengeluaran`) AS `saldo`
FROM (
  SELECT YEAR(`tanggal`) AS `tahun`, MONTH(`tanggal`) AS `bulan`, SUM(`jumlah`) AS `total_pemasukan`, 0 AS `total_pengeluaran`
  FROM `persembahan`
  GROUP BY YEAR(`tanggal`), MONTH(`tanggal`)
  UNION ALL
  SELECT YEAR(`tanggal`) AS `tahun`, MONTH(`tanggal`) AS `bulan`, 0 AS `total_pemasukan`, SUM(`jumlah`) AS `total_pengeluaran`
  FROM `pengeluaran`
  GROUP BY YEAR(`tanggal`), MONTH(`tanggal`)
) AS `laporan`
GROUP BY `tahun`, `bulan`;


-- ==========================================================
-- UPDATE FINAL: Pendalaman Alkitab, klik card pelayanan, dan WA jadwal khusus.
-- ==========================================================
CREATE TABLE IF NOT EXISTS `pendalaman_alkitab` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `judul` VARCHAR(160) NOT NULL,
  `tipe` VARCHAR(50) DEFAULT 'renungan',
  `ayat` VARCHAR(120) DEFAULT '',
  `isi` TEXT,
  `media_path` VARCHAR(255) DEFAULT '',
  `urutan` INT DEFAULT 99,
  `status` VARCHAR(30) DEFAULT 'published',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELETE FROM `pendalaman_alkitab` WHERE `judul` IN ('Cerita Alkitab untuk Pertumbuhan Iman','Renungan Singkat: Hidup dalam Kasih','Materi Animasi Anak: Mengenal Doa','Galeri Kegiatan Pendalaman Alkitab');
INSERT INTO `pendalaman_alkitab` (`judul`,`tipe`,`ayat`,`isi`,`media_path`,`urutan`,`status`) VALUES
('Cerita Alkitab untuk Pertumbuhan Iman','cerita','Mazmur 119:105','Firman Tuhan menjadi pelita dalam kehidupan. Melalui pendalaman Alkitab, jemaat diajak mengenal kehendak Tuhan dan menerapkannya dalam keluarga, pelayanan, dan kehidupan sehari-hari.','',1,'published'),
('Renungan Singkat: Hidup dalam Kasih','renungan','Yohanes 13:34-35','Kasih menjadi tanda murid Kristus. Materi ini dapat dipakai sebagai bahan diskusi kelompok kecil, sekolah minggu, atau pembinaan rohani keluarga.','',2,'published'),
('Materi Animasi Anak: Mengenal Doa','animasi','1 Tesalonika 5:17','Konten animasi rohani dapat dipakai untuk membantu anak dan remaja memahami pentingnya berdoa, bersyukur, dan membangun relasi dengan Tuhan.','',3,'published'),
('Galeri Kegiatan Pendalaman Alkitab','foto','','Bagian ini dapat diisi dokumentasi foto kegiatan PA, ibadah rumah tangga, dan pembinaan iman jemaat.','assets/img/logo-gpi-cipayung.jpg',4,'published')
ON DUPLICATE KEY UPDATE `judul`=VALUES(`judul`);

INSERT INTO `role_permissions` (`role`, `section_key`, `can_view`, `can_create`, `can_update`, `can_delete`, `can_import`, `can_export`) VALUES
('admin','pendalaman_alkitab',1,1,1,1,0,1),
('majelis','pendalaman_alkitab',1,1,1,1,0,1),
('pendeta','pendalaman_alkitab',1,0,0,0,0,1);

UPDATE `pelayanan_tim` SET `penanggung_jawab`='Koordinator Kaum Ibu' WHERE LOWER(`nama_tim`)='kaum ibu';
UPDATE `pelayanan_tim` SET `penanggung_jawab`='Koordinator Revive Generation' WHERE LOWER(`nama_tim`) LIKE '%revive%' OR LOWER(`nama_tim`) LIKE '%pemuda%';
UPDATE `pelayanan_tim` SET `penanggung_jawab`='Koordinator Sekolah Minggu' WHERE LOWER(`nama_tim`)='sekolah minggu';
UPDATE `pelayanan_tim` SET `penanggung_jawab`='Koordinator PA' WHERE LOWER(`nama_tim`) LIKE '%pendalaman%' OR LOWER(`nama_tim`) LIKE '%alkitab%';
