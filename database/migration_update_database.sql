-- ==========================================================
-- DATABASE MIGRASI WEBSITE GPI CIPAYUNG
-- Versi: aman untuk database lama, tidak menghapus data.
-- Cara pakai: jalankan file ini jika database gpi_cipayung sudah ada.
-- File ini membuat tabel yang belum ada, menambahkan kolom yang belum ada,
-- serta membuat index yang belum ada dengan pengecekan information_schema.
-- ==========================================================

SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+07:00';
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `gpi_cipayung` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gpi_cipayung`;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
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

CREATE TABLE IF NOT EXISTS `app_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `jemaat` (
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

CREATE TABLE IF NOT EXISTS `jadwal_pelayanan` (
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

CREATE TABLE IF NOT EXISTS `pengumuman` (
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

CREATE TABLE IF NOT EXISTS `media_uploads` (
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
  KEY `idx_media_uploaded_by` (`uploaded_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chatbot_messages` (
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

CREATE TABLE IF NOT EXISTS `whatsapp_logs` (
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
  KEY `idx_wa_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sakramen` (
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
  KEY `idx_sakramen_jemaat` (`jemaat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `persembahan` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tanggal` DATE NOT NULL,
  `jenis` VARCHAR(120) NOT NULL,
  `keterangan` VARCHAR(220) DEFAULT NULL,
  `jumlah` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_persembahan_tanggal` (`tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pengeluaran` (
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

SET FOREIGN_KEY_CHECKS = 1;



-- Tambah kolom yang belum ada pada tabel `users`
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `username` VARCHAR(80) DEFAULT NULL AFTER `id`', 'SELECT ''Kolom users.username sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'username');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `password_hash` VARCHAR(255) DEFAULT NULL AFTER `username`', 'SELECT ''Kolom users.password_hash sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `nama_lengkap` VARCHAR(160) DEFAULT NULL AFTER `password_hash`', 'SELECT ''Kolom users.nama_lengkap sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'nama_lengkap');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `email` VARCHAR(160) DEFAULT NULL AFTER `nama_lengkap`', 'SELECT ''Kolom users.email sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `role` VARCHAR(30) NOT NULL DEFAULT ''admin'' AFTER `email`', 'SELECT ''Kolom users.role sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT ''aktif'' AFTER `role`', 'SELECT ''Kolom users.status sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `last_login_at` DATETIME DEFAULT NULL AFTER `status`', 'SELECT ''Kolom users.last_login_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `last_login_at`', 'SELECT ''Kolom users.created_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'created_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `users` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`', 'SELECT ''Kolom users.updated_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah kolom yang belum ada pada tabel `jemaat`
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `nomor_urut` INT UNSIGNED DEFAULT NULL AFTER `id`', 'SELECT ''Kolom jemaat.nomor_urut sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'nomor_urut');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `nama_keluarga` VARCHAR(180) DEFAULT NULL AFTER `nomor_urut`', 'SELECT ''Kolom jemaat.nama_keluarga sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'nama_keluarga');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `nama_lengkap` VARCHAR(180) DEFAULT NULL AFTER `nama_keluarga`', 'SELECT ''Kolom jemaat.nama_lengkap sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'nama_lengkap');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `jenis_kelamin` VARCHAR(20) NOT NULL DEFAULT '''' AFTER `nama_lengkap`', 'SELECT ''Kolom jemaat.jenis_kelamin sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'jenis_kelamin');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `tempat_lahir` VARCHAR(120) DEFAULT NULL AFTER `jenis_kelamin`', 'SELECT ''Kolom jemaat.tempat_lahir sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'tempat_lahir');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `tanggal_lahir` DATE DEFAULT NULL AFTER `tempat_lahir`', 'SELECT ''Kolom jemaat.tanggal_lahir sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'tanggal_lahir');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `alamat` TEXT AFTER `tanggal_lahir`', 'SELECT ''Kolom jemaat.alamat sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'alamat');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `no_hp` VARCHAR(40) DEFAULT NULL AFTER `alamat`', 'SELECT ''Kolom jemaat.no_hp sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'no_hp');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `whatsapp` VARCHAR(40) DEFAULT NULL AFTER `no_hp`', 'SELECT ''Kolom jemaat.whatsapp sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'whatsapp');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `email` VARCHAR(160) DEFAULT NULL AFTER `whatsapp`', 'SELECT ''Kolom jemaat.email sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'email');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `status_jemaat` VARCHAR(30) NOT NULL DEFAULT ''Aktif'' AFTER `email`', 'SELECT ''Kolom jemaat.status_jemaat sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'status_jemaat');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `status_keluarga` VARCHAR(120) DEFAULT NULL AFTER `status_jemaat`', 'SELECT ''Kolom jemaat.status_keluarga sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'status_keluarga');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `tanggal_bergabung` DATE DEFAULT NULL AFTER `status_keluarga`', 'SELECT ''Kolom jemaat.tanggal_bergabung sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'tanggal_bergabung');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `catatan` TEXT AFTER `tanggal_bergabung`', 'SELECT ''Kolom jemaat.catatan sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'catatan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `catatan`', 'SELECT ''Kolom jemaat.created_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'created_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jemaat` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`', 'SELECT ''Kolom jemaat.updated_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND COLUMN_NAME = 'updated_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah kolom yang belum ada pada tabel `jadwal_pelayanan`
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `tanggal` DATE DEFAULT NULL AFTER `id`', 'SELECT ''Kolom jadwal_pelayanan.tanggal sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'tanggal');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `hari` VARCHAR(30) DEFAULT NULL AFTER `tanggal`', 'SELECT ''Kolom jadwal_pelayanan.hari sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'hari');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `jenis_ibadah` VARCHAR(140) DEFAULT NULL AFTER `hari`', 'SELECT ''Kolom jadwal_pelayanan.jenis_ibadah sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'jenis_ibadah');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `jam_mulai` TIME DEFAULT NULL AFTER `jenis_ibadah`', 'SELECT ''Kolom jadwal_pelayanan.jam_mulai sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'jam_mulai');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `jam_selesai` TIME DEFAULT NULL AFTER `jam_mulai`', 'SELECT ''Kolom jadwal_pelayanan.jam_selesai sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'jam_selesai');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `lokasi` VARCHAR(180) DEFAULT ''GPI Cipayung'' AFTER `jam_selesai`', 'SELECT ''Kolom jadwal_pelayanan.lokasi sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'lokasi');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `tema` VARCHAR(220) DEFAULT NULL AFTER `lokasi`', 'SELECT ''Kolom jadwal_pelayanan.tema sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'tema');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `pemimpin_pujian` VARCHAR(180) DEFAULT NULL AFTER `tema`', 'SELECT ''Kolom jadwal_pelayanan.pemimpin_pujian sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'pemimpin_pujian');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `singer` VARCHAR(255) DEFAULT NULL AFTER `pemimpin_pujian`', 'SELECT ''Kolom jadwal_pelayanan.singer sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'singer');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `pemain_musik` VARCHAR(255) DEFAULT NULL AFTER `singer`', 'SELECT ''Kolom jadwal_pelayanan.pemain_musik sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'pemain_musik');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `pengkhotbah` VARCHAR(180) DEFAULT NULL AFTER `pemain_musik`', 'SELECT ''Kolom jadwal_pelayanan.pengkhotbah sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'pengkhotbah');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `liturgis` VARCHAR(180) DEFAULT NULL AFTER `pengkhotbah`', 'SELECT ''Kolom jadwal_pelayanan.liturgis sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'liturgis');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `multimedia` VARCHAR(180) DEFAULT NULL AFTER `liturgis`', 'SELECT ''Kolom jadwal_pelayanan.multimedia sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'multimedia');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `usher` VARCHAR(180) DEFAULT NULL AFTER `multimedia`', 'SELECT ''Kolom jadwal_pelayanan.usher sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'usher');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `kolektan` VARCHAR(180) DEFAULT NULL AFTER `usher`', 'SELECT ''Kolom jadwal_pelayanan.kolektan sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'kolektan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `catatan` TEXT AFTER `kolektan`', 'SELECT ''Kolom jadwal_pelayanan.catatan sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'catatan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `status` VARCHAR(30) NOT NULL DEFAULT ''published'' AFTER `catatan`', 'SELECT ''Kolom jadwal_pelayanan.status sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `reminder_h_minus_1` TINYINT(1) NOT NULL DEFAULT 1 AFTER `status`', 'SELECT ''Kolom jadwal_pelayanan.reminder_h_minus_1 sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'reminder_h_minus_1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `reminder_sent_at` DATETIME DEFAULT NULL AFTER `reminder_h_minus_1`', 'SELECT ''Kolom jadwal_pelayanan.reminder_sent_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'reminder_sent_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `reminder_sent_at`', 'SELECT ''Kolom jadwal_pelayanan.created_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'created_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `jadwal_pelayanan` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`', 'SELECT ''Kolom jadwal_pelayanan.updated_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND COLUMN_NAME = 'updated_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah kolom yang belum ada pada tabel `pengumuman`
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `pengumuman` ADD COLUMN `judul` VARCHAR(220) DEFAULT NULL AFTER `id`', 'SELECT ''Kolom pengumuman.judul sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengumuman' AND COLUMN_NAME = 'judul');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `pengumuman` ADD COLUMN `isi` TEXT AFTER `judul`', 'SELECT ''Kolom pengumuman.isi sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengumuman' AND COLUMN_NAME = 'isi');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `pengumuman` ADD COLUMN `tanggal_publish` DATE DEFAULT NULL AFTER `isi`', 'SELECT ''Kolom pengumuman.tanggal_publish sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengumuman' AND COLUMN_NAME = 'tanggal_publish');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `pengumuman` ADD COLUMN `status` VARCHAR(30) NOT NULL DEFAULT ''published'' AFTER `tanggal_publish`', 'SELECT ''Kolom pengumuman.status sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengumuman' AND COLUMN_NAME = 'status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `pengumuman` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `status`', 'SELECT ''Kolom pengumuman.created_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengumuman' AND COLUMN_NAME = 'created_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `pengumuman` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`', 'SELECT ''Kolom pengumuman.updated_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengumuman' AND COLUMN_NAME = 'updated_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah kolom yang belum ada pada tabel `media_uploads`
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `media_uploads` ADD COLUMN `judul` VARCHAR(180) DEFAULT NULL AFTER `id`', 'SELECT ''Kolom media_uploads.judul sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_uploads' AND COLUMN_NAME = 'judul');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `media_uploads` ADD COLUMN `deskripsi` TEXT AFTER `judul`', 'SELECT ''Kolom media_uploads.deskripsi sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_uploads' AND COLUMN_NAME = 'deskripsi');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `media_uploads` ADD COLUMN `file_name` VARCHAR(255) DEFAULT NULL AFTER `deskripsi`', 'SELECT ''Kolom media_uploads.file_name sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_uploads' AND COLUMN_NAME = 'file_name');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `media_uploads` ADD COLUMN `file_path` VARCHAR(255) DEFAULT NULL AFTER `file_name`', 'SELECT ''Kolom media_uploads.file_path sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_uploads' AND COLUMN_NAME = 'file_path');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `media_uploads` ADD COLUMN `file_type` VARCHAR(40) DEFAULT NULL AFTER `file_path`', 'SELECT ''Kolom media_uploads.file_type sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_uploads' AND COLUMN_NAME = 'file_type');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `media_uploads` ADD COLUMN `status` VARCHAR(30) NOT NULL DEFAULT ''published'' AFTER `file_type`', 'SELECT ''Kolom media_uploads.status sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_uploads' AND COLUMN_NAME = 'status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `media_uploads` ADD COLUMN `uploaded_by` INT UNSIGNED DEFAULT NULL AFTER `status`', 'SELECT ''Kolom media_uploads.uploaded_by sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_uploads' AND COLUMN_NAME = 'uploaded_by');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `media_uploads` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `uploaded_by`', 'SELECT ''Kolom media_uploads.created_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_uploads' AND COLUMN_NAME = 'created_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `media_uploads` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`', 'SELECT ''Kolom media_uploads.updated_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_uploads' AND COLUMN_NAME = 'updated_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah kolom yang belum ada pada tabel `chatbot_messages`
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `chatbot_messages` ADD COLUMN `nama` VARCHAR(160) DEFAULT NULL AFTER `id`', 'SELECT ''Kolom chatbot_messages.nama sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatbot_messages' AND COLUMN_NAME = 'nama');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `chatbot_messages` ADD COLUMN `kontak` VARCHAR(160) DEFAULT NULL AFTER `nama`', 'SELECT ''Kolom chatbot_messages.kontak sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatbot_messages' AND COLUMN_NAME = 'kontak');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `chatbot_messages` ADD COLUMN `pesan` TEXT AFTER `kontak`', 'SELECT ''Kolom chatbot_messages.pesan sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatbot_messages' AND COLUMN_NAME = 'pesan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `chatbot_messages` ADD COLUMN `balasan` TEXT AFTER `pesan`', 'SELECT ''Kolom chatbot_messages.balasan sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatbot_messages' AND COLUMN_NAME = 'balasan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `chatbot_messages` ADD COLUMN `status` VARCHAR(30) NOT NULL DEFAULT ''baru'' AFTER `balasan`', 'SELECT ''Kolom chatbot_messages.status sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatbot_messages' AND COLUMN_NAME = 'status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `chatbot_messages` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `status`', 'SELECT ''Kolom chatbot_messages.created_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatbot_messages' AND COLUMN_NAME = 'created_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `chatbot_messages` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`', 'SELECT ''Kolom chatbot_messages.updated_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatbot_messages' AND COLUMN_NAME = 'updated_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah kolom yang belum ada pada tabel `whatsapp_logs`
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `whatsapp_logs` ADD COLUMN `jadwal_id` INT UNSIGNED DEFAULT NULL AFTER `id`', 'SELECT ''Kolom whatsapp_logs.jadwal_id sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_logs' AND COLUMN_NAME = 'jadwal_id');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `whatsapp_logs` ADD COLUMN `target_name` VARCHAR(180) DEFAULT NULL AFTER `jadwal_id`', 'SELECT ''Kolom whatsapp_logs.target_name sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_logs' AND COLUMN_NAME = 'target_name');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `whatsapp_logs` ADD COLUMN `target_phone` VARCHAR(60) DEFAULT NULL AFTER `target_name`', 'SELECT ''Kolom whatsapp_logs.target_phone sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_logs' AND COLUMN_NAME = 'target_phone');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `whatsapp_logs` ADD COLUMN `message_type` VARCHAR(40) NOT NULL DEFAULT ''group_manual'' AFTER `target_phone`', 'SELECT ''Kolom whatsapp_logs.message_type sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_logs' AND COLUMN_NAME = 'message_type');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `whatsapp_logs` ADD COLUMN `message_text` TEXT AFTER `message_type`', 'SELECT ''Kolom whatsapp_logs.message_text sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_logs' AND COLUMN_NAME = 'message_text');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `whatsapp_logs` ADD COLUMN `status` VARCHAR(30) NOT NULL DEFAULT ''menunggu'' AFTER `message_text`', 'SELECT ''Kolom whatsapp_logs.status sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_logs' AND COLUMN_NAME = 'status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `whatsapp_logs` ADD COLUMN `response_text` TEXT AFTER `status`', 'SELECT ''Kolom whatsapp_logs.response_text sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_logs' AND COLUMN_NAME = 'response_text');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `whatsapp_logs` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `response_text`', 'SELECT ''Kolom whatsapp_logs.created_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_logs' AND COLUMN_NAME = 'created_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah kolom yang belum ada pada tabel `sakramen`
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `sakramen` ADD COLUMN `jemaat_id` INT UNSIGNED DEFAULT NULL AFTER `id`', 'SELECT ''Kolom sakramen.jemaat_id sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sakramen' AND COLUMN_NAME = 'jemaat_id');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `sakramen` ADD COLUMN `nama_penerima` VARCHAR(180) DEFAULT NULL AFTER `jemaat_id`', 'SELECT ''Kolom sakramen.nama_penerima sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sakramen' AND COLUMN_NAME = 'nama_penerima');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `sakramen` ADD COLUMN `jenis_sakramen` VARCHAR(80) DEFAULT NULL AFTER `nama_penerima`', 'SELECT ''Kolom sakramen.jenis_sakramen sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sakramen' AND COLUMN_NAME = 'jenis_sakramen');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `sakramen` ADD COLUMN `tanggal` DATE DEFAULT NULL AFTER `jenis_sakramen`', 'SELECT ''Kolom sakramen.tanggal sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sakramen' AND COLUMN_NAME = 'tanggal');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `sakramen` ADD COLUMN `pelayan` VARCHAR(180) DEFAULT NULL AFTER `tanggal`', 'SELECT ''Kolom sakramen.pelayan sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sakramen' AND COLUMN_NAME = 'pelayan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `sakramen` ADD COLUMN `catatan` TEXT AFTER `pelayan`', 'SELECT ''Kolom sakramen.catatan sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sakramen' AND COLUMN_NAME = 'catatan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `sakramen` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `catatan`', 'SELECT ''Kolom sakramen.created_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sakramen' AND COLUMN_NAME = 'created_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `sakramen` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`', 'SELECT ''Kolom sakramen.updated_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sakramen' AND COLUMN_NAME = 'updated_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah kolom yang belum ada pada tabel `persembahan`
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `persembahan` ADD COLUMN `tanggal` DATE DEFAULT NULL AFTER `id`', 'SELECT ''Kolom persembahan.tanggal sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'persembahan' AND COLUMN_NAME = 'tanggal');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `persembahan` ADD COLUMN `jenis` VARCHAR(120) DEFAULT NULL AFTER `tanggal`', 'SELECT ''Kolom persembahan.jenis sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'persembahan' AND COLUMN_NAME = 'jenis');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `persembahan` ADD COLUMN `keterangan` VARCHAR(220) DEFAULT NULL AFTER `jenis`', 'SELECT ''Kolom persembahan.keterangan sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'persembahan' AND COLUMN_NAME = 'keterangan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `persembahan` ADD COLUMN `jumlah` DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER `keterangan`', 'SELECT ''Kolom persembahan.jumlah sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'persembahan' AND COLUMN_NAME = 'jumlah');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `persembahan` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `jumlah`', 'SELECT ''Kolom persembahan.created_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'persembahan' AND COLUMN_NAME = 'created_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `persembahan` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`', 'SELECT ''Kolom persembahan.updated_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'persembahan' AND COLUMN_NAME = 'updated_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah kolom yang belum ada pada tabel `pengeluaran`
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `pengeluaran` ADD COLUMN `tanggal` DATE DEFAULT NULL AFTER `id`', 'SELECT ''Kolom pengeluaran.tanggal sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengeluaran' AND COLUMN_NAME = 'tanggal');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `pengeluaran` ADD COLUMN `kategori` VARCHAR(120) DEFAULT NULL AFTER `tanggal`', 'SELECT ''Kolom pengeluaran.kategori sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengeluaran' AND COLUMN_NAME = 'kategori');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `pengeluaran` ADD COLUMN `keterangan` VARCHAR(220) DEFAULT NULL AFTER `kategori`', 'SELECT ''Kolom pengeluaran.keterangan sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengeluaran' AND COLUMN_NAME = 'keterangan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `pengeluaran` ADD COLUMN `jumlah` DECIMAL(14,2) NOT NULL DEFAULT 0.00 AFTER `keterangan`', 'SELECT ''Kolom pengeluaran.jumlah sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengeluaran' AND COLUMN_NAME = 'jumlah');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `pengeluaran` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `jumlah`', 'SELECT ''Kolom pengeluaran.created_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengeluaran' AND COLUMN_NAME = 'created_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `pengeluaran` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`', 'SELECT ''Kolom pengeluaran.updated_at sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengeluaran' AND COLUMN_NAME = 'updated_at');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Tambah index yang belum ada
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE UNIQUE INDEX `uk_users_username` ON `users` (`username`)', 'SELECT ''Index uk_users_username sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'uk_users_username');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE UNIQUE INDEX `uk_users_email` ON `users` (`email`)', 'SELECT ''Index uk_users_email sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'uk_users_email');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE UNIQUE INDEX `uk_setting_key` ON `app_settings` (`setting_key`)', 'SELECT ''Index uk_setting_key sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'app_settings' AND INDEX_NAME = 'uk_setting_key');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_jemaat_nomor` ON `jemaat` (`nomor_urut`)', 'SELECT ''Index idx_jemaat_nomor sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND INDEX_NAME = 'idx_jemaat_nomor');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_jemaat_keluarga` ON `jemaat` (`nama_keluarga`)', 'SELECT ''Index idx_jemaat_keluarga sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND INDEX_NAME = 'idx_jemaat_keluarga');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_jemaat_nama` ON `jemaat` (`nama_lengkap`)', 'SELECT ''Index idx_jemaat_nama sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND INDEX_NAME = 'idx_jemaat_nama');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_jemaat_status` ON `jemaat` (`status_jemaat`)', 'SELECT ''Index idx_jemaat_status sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jemaat' AND INDEX_NAME = 'idx_jemaat_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_jadwal_tanggal` ON `jadwal_pelayanan` (`tanggal`)', 'SELECT ''Index idx_jadwal_tanggal sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND INDEX_NAME = 'idx_jadwal_tanggal');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_jadwal_status` ON `jadwal_pelayanan` (`status`)', 'SELECT ''Index idx_jadwal_status sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jadwal_pelayanan' AND INDEX_NAME = 'idx_jadwal_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_pengumuman_status_tanggal` ON `pengumuman` (`status`, `tanggal_publish`)', 'SELECT ''Index idx_pengumuman_status_tanggal sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengumuman' AND INDEX_NAME = 'idx_pengumuman_status_tanggal');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_media_status` ON `media_uploads` (`status`)', 'SELECT ''Index idx_media_status sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_uploads' AND INDEX_NAME = 'idx_media_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_media_uploaded_by` ON `media_uploads` (`uploaded_by`)', 'SELECT ''Index idx_media_uploaded_by sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'media_uploads' AND INDEX_NAME = 'idx_media_uploaded_by');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_chat_status` ON `chatbot_messages` (`status`)', 'SELECT ''Index idx_chat_status sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatbot_messages' AND INDEX_NAME = 'idx_chat_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_chat_created` ON `chatbot_messages` (`created_at`)', 'SELECT ''Index idx_chat_created sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chatbot_messages' AND INDEX_NAME = 'idx_chat_created');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_wa_jadwal` ON `whatsapp_logs` (`jadwal_id`)', 'SELECT ''Index idx_wa_jadwal sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_logs' AND INDEX_NAME = 'idx_wa_jadwal');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_wa_status` ON `whatsapp_logs` (`status`)', 'SELECT ''Index idx_wa_status sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'whatsapp_logs' AND INDEX_NAME = 'idx_wa_status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_persembahan_tanggal` ON `persembahan` (`tanggal`)', 'SELECT ''Index idx_persembahan_tanggal sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'persembahan' AND INDEX_NAME = 'idx_persembahan_tanggal');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_pengeluaran_tanggal` ON `pengeluaran` (`tanggal`)', 'SELECT ''Index idx_pengeluaran_tanggal sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pengeluaran' AND INDEX_NAME = 'idx_pengeluaran_tanggal');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_sakramen_tanggal` ON `sakramen` (`tanggal`)', 'SELECT ''Index idx_sakramen_tanggal sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sakramen' AND INDEX_NAME = 'idx_sakramen_tanggal');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'CREATE INDEX `idx_sakramen_jemaat` ON `sakramen` (`jemaat_id`)', 'SELECT ''Index idx_sakramen_jemaat sudah ada''') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sakramen' AND INDEX_NAME = 'idx_sakramen_jemaat');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- Isi akun admin awal hanya jika tabel users masih kosong.
INSERT INTO `users` (`username`, `password_hash`, `nama_lengkap`, `email`, `role`, `status`)
SELECT 'admin', '$2y$12$JKNsxvb/TxN/O48.Qq/rwOYCzAhQvOBCpgAC/KJkuz/q88aa3SGI.', 'Administrator GPI Cipayung', 'admin@gpicipayung.local', 'superadmin', 'aktif'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `users` WHERE `username` = 'admin');

INSERT INTO `app_settings` (`setting_key`, `setting_value`) VALUES
('nama_gereja', 'GPI Cipayung'),
('alamat_gereja', 'Cipayung, Jakarta Timur'),
('telepon_gereja', '08xxxxxxxxxx'),
('email_gereja', 'admin@gpicipayung.local'),
('whatsapp_group_invite', 'https://chat.whatsapp.com/CkPJODyvqcu7IjUQqyAABu')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

DROP VIEW IF EXISTS `view_statistik_jemaat`;
CREATE VIEW `view_statistik_jemaat` AS
SELECT
  COUNT(*) AS total_jemaat,
  SUM(CASE WHEN `status_jemaat` = 'Aktif' THEN 1 ELSE 0 END) AS total_aktif,
  SUM(CASE WHEN `jenis_kelamin` = 'Laki-laki' THEN 1 ELSE 0 END) AS total_laki_laki,
  SUM(CASE WHEN `jenis_kelamin` = 'Perempuan' THEN 1 ELSE 0 END) AS total_perempuan
FROM `jemaat`;

DROP VIEW IF EXISTS `view_laporan_keuangan_bulanan`;
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
-- TAMBAHAN MODUL SAKRAMEN, PERSEMBAHAN, PERNIKAHAN, DAN TIM PELAYANAN
-- Aman dijalankan berulang: tabel dibuat jika belum ada, kolom ditambah jika belum ada.
-- ==========================================================

CREATE TABLE IF NOT EXISTS `sakramen_pernikahan` (
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

CREATE TABLE IF NOT EXISTS `sakramen_baptisan` (
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
  KEY `idx_baptisan_jemaat` (`jemaat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sakramen_sidi` (
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
  KEY `idx_sidi_jemaat` (`jemaat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pelayanan_tim` (
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

-- Kolom tambahan persembahan untuk halaman admin baru
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `persembahan` ADD COLUMN `jenis_ibadah` VARCHAR(140) DEFAULT NULL AFTER `jenis`', 'SELECT ''Kolom persembahan.jenis_ibadah sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'persembahan' AND COLUMN_NAME = 'jenis_ibadah');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `persembahan` ADD COLUMN `jenis_persembahan` VARCHAR(140) NOT NULL DEFAULT ''Persembahan Umum'' AFTER `jenis_ibadah`', 'SELECT ''Kolom persembahan.jenis_persembahan sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'persembahan' AND COLUMN_NAME = 'jenis_persembahan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `persembahan` ADD COLUMN `kolektan` VARCHAR(180) DEFAULT NULL AFTER `jumlah`', 'SELECT ''Kolom persembahan.kolektan sudah ada''') FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'persembahan' AND COLUMN_NAME = 'kolektan');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT INTO `pelayanan_tim` (`kategori`, `nama_tim`, `deskripsi`, `penanggung_jawab`, `status`)
SELECT 'Pelayanan', 'Tim Musik & Singers', 'Melayani pujian, penyembahan, musik ibadah, dan singers.', 'Koordinator Musik', 'published'
WHERE NOT EXISTS (SELECT 1 FROM `pelayanan_tim` WHERE `nama_tim` = 'Tim Musik & Singers' LIMIT 1);
INSERT INTO `pelayanan_tim` (`kategori`, `nama_tim`, `deskripsi`, `penanggung_jawab`, `status`)
SELECT 'Pelayanan', 'Tim Pelayanan Gereja', 'Koordinasi pelayan ibadah, usher, multimedia, dan pendukung pelayanan.', 'Pengurus Gereja', 'published'
WHERE NOT EXISTS (SELECT 1 FROM `pelayanan_tim` WHERE `nama_tim` = 'Tim Pelayanan Gereja' LIMIT 1);
INSERT INTO `pelayanan_tim` (`kategori`, `nama_tim`, `deskripsi`, `penanggung_jawab`, `status`)
SELECT 'Pelayanan', 'Sekolah Minggu', 'Pelayanan pembinaan iman anak dan generasi muda sejak dini.', 'Koordinator Sekolah Minggu', 'published'
WHERE NOT EXISTS (SELECT 1 FROM `pelayanan_tim` WHERE `nama_tim` = 'Sekolah Minggu' LIMIT 1);
INSERT INTO `pelayanan_tim` (`kategori`, `nama_tim`, `deskripsi`, `penanggung_jawab`, `status`)
SELECT 'Pelayanan', 'Revive Generation', 'Pembinaan karakter dan komunitas pemuda gereja.', 'Koordinator Revive Generation', 'published'
WHERE NOT EXISTS (SELECT 1 FROM `pelayanan_tim` WHERE `nama_tim` = 'Revive Generation' LIMIT 1);
INSERT INTO `pelayanan_tim` (`kategori`, `nama_tim`, `deskripsi`, `penanggung_jawab`, `status`)
SELECT 'Pelayanan', 'Kaum Ibu', 'Wadah pertumbuhan rohani dan pemberdayaan kaum wanita gereja.', 'Koordinator Kaum Ibu', 'published'
WHERE NOT EXISTS (SELECT 1 FROM `pelayanan_tim` WHERE `nama_tim` = 'Kaum Ibu' LIMIT 1);
INSERT INTO `pelayanan_tim` (`kategori`, `nama_tim`, `deskripsi`, `penanggung_jawab`, `status`)
SELECT 'Pelayanan', 'Pendalaman Alkitab', 'Kelompok pembelajaran Firman Tuhan dan pertumbuhan iman.', 'Koordinator PA', 'published'
WHERE NOT EXISTS (SELECT 1 FROM `pelayanan_tim` WHERE `nama_tim` = 'Pendalaman Alkitab' LIMIT 1);



-- Tambahan tabel struktur tim pelayan untuk halaman Tim Musik, Singers, Tim Pelayanan Gereja, Diakonia, dan Media.
CREATE TABLE IF NOT EXISTS `tim_pelayan_members` (
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
  KEY `idx_tim_pelayan_jemaat` (`jemaat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tim_pelayan_members` (`nama_lengkap`, `kategori`, `tim`, `jabatan`, `urutan`, `foto_path`, `status`)
SELECT * FROM (
SELECT 'Natalia Debora Sinaga','musik','Pemain Musik','Pemain Keyboard',1,'','published' UNION ALL
SELECT 'Andre Siburian','musik','Pemain Musik','Pemain Gitar',2,'','published' UNION ALL
SELECT 'Gideon Siburian','musik','Pemain Musik','Pemain Drum',3,'assets/img/gideon.jpg','published' UNION ALL
SELECT 'Yakub Rumahorbo','musik','Pemain Musik','Pemain Bass',4,'','published' UNION ALL
SELECT 'David Sitompul','musik','Pemain Cadangan','Bass & Gitar',5,'assets/img/david.jpg','published' UNION ALL
SELECT 'Aaron Sinaga','musik','Pemain Cadangan','Keyboard & Drum',6,'','published' UNION ALL
SELECT 'Johan Sihombing','musik','Pemain Cadangan','Gitar & Drum',7,'assets/img/johan.jpg','published' UNION ALL
SELECT 'Septiana Sinaga','singer','Singers','Vocalist',11,'assets/img/septiana.jpg','published' UNION ALL
SELECT 'Rahel Sitompul','singer','Singers','Vocalist',12,'assets/img/rahel.jpg','published' UNION ALL
SELECT 'Isak Sinaga','singer','Singers','Vocalist',13,'assets/img/isak.jpg','published' UNION ALL
SELECT 'Pdt. E.H. Sinaga','pelayanan_gereja','Gembala Sidang','Gembala Sidang',1,'','published' UNION ALL
SELECT 'Ibu Pdt. J. Sinaga','pelayanan_gereja','Pendeta & Pelayan Gereja','Pelayan Gereja',2,'','published' UNION ALL
SELECT 'Gr. H. Sitorus','pelayanan_gereja','Pendeta & Pelayan Gereja','Guru Jemaat',3,'','published' UNION ALL
SELECT 'St. N. Sihombing','pelayanan_gereja','Pendamping & Pelayan Gereja','Pelayan Gereja',4,'','published' UNION ALL
SELECT 'St. R. B. Rumahorbo','pelayanan_gereja','Pendamping & Pelayan Gereja','Pelayan Gereja',5,'','published' UNION ALL
SELECT 'St. R. D. Sinaga','pelayanan_gereja','Pendamping & Pelayan Gereja','Pelayan Gereja',6,'','published' UNION ALL
SELECT 'Phb. H. Sitorus','pelayanan_gereja','Pendamping & Pelayan Gereja','Parhobas',7,'','published' UNION ALL
SELECT 'Ibu St. Siagian','pelayanan_gereja','Pendamping & Pelayan Gereja','Bendahara',8,'','published' UNION ALL
SELECT 'Nama Lengkap','diakonia','Diakonia Gereja','Ketua',1,'','published' UNION ALL
SELECT 'Nama Lengkap','diakonia','Diakonia Gereja','Sekretaris',2,'','published' UNION ALL
SELECT 'Nama Lengkap','diakonia','Diakonia Gereja','Keuangan',3,'','published' UNION ALL
SELECT 'Johan Sihombing','media','Media Gereja','Koordinator Media',1,'','published' UNION ALL
SELECT 'Septiana Sinaga','media','Media Gereja','Publikasi',2,'assets/img/septiana.jpg','published' UNION ALL
SELECT 'Rahel Sitompul','media','Media Gereja','Dokumentasi',3,'assets/img/rahel.jpg','published' UNION ALL
SELECT 'David Sitompul','media','Media Gereja','Teknis Media',5,'','published' UNION ALL
SELECT 'Isak Sinaga','media','Media Gereja','Konten Digital',4,'assets/img/isak.jpg','published'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` LIMIT 1);


-- Update struktur tim pelayanan versi terbaru
UPDATE `tim_pelayan_members` SET `tim`='Pendamping & Pelayan Gereja' WHERE `kategori`='pelayanan_gereja' AND (`tim`='PHB / Parhobas' OR `tim`='Bendahara');
UPDATE `tim_pelayan_members` SET `foto_path`='' WHERE `kategori`='media' AND `nama_lengkap` IN ('Johan Sihombing','David Sitompul');
UPDATE `tim_pelayan_members` SET `urutan`=5 WHERE `kategori`='media' AND `nama_lengkap`='David Sitompul';
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Isak Sinaga','media','Media Gereja','Konten Digital',4,'assets/img/isak.jpg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='media' AND `nama_lengkap`='Isak Sinaga');


-- Pastikan bagian Diakonia tersedia untuk halaman Tim Pelayanan Gereja.
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Nama Lengkap','diakonia','Diakonia Gereja','Ketua',1,'','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='diakonia' AND `jabatan`='Ketua');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Nama Lengkap','diakonia','Diakonia Gereja','Sekretaris',2,'','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='diakonia' AND `jabatan`='Sekretaris');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Nama Lengkap','diakonia','Diakonia Gereja','Keuangan',3,'','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='diakonia' AND `jabatan`='Keuangan');



-- Tambahan kategori Sekolah Minggu untuk halaman pelayanan tersendiri.
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Nama Lengkap','sekolah_minggu','Sekolah Minggu','Koordinator Sekolah Minggu',1,'','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `jabatan`='Koordinator Sekolah Minggu');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Nama Lengkap','sekolah_minggu','Sekolah Minggu','Guru Sekolah Minggu',2,'','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `jabatan`='Guru Sekolah Minggu');

-- Tambahan halaman organisasi Kaum Ibu dan Revive Generation.
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu Pdt. J. Sinaga / Br. Nababan','kaum_ibu','Kaum Ibu','Pembina',1,'assets/img/team/ibu-pdt-j-sinaga-br-nababan.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='kaum_ibu' AND `jabatan`='Pembina');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu Lumbangaol / Br. Manurung','kaum_ibu','Kaum Ibu','Ketua',2,'assets/img/team/ibu-lumbangaol-br-manurung.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='kaum_ibu' AND `jabatan`='Ketua');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu Sihombing / Br. Sinaga','kaum_ibu','Kaum Ibu','Sekretaris',3,'assets/img/team/ibu-sihombing-br-sinaga.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='kaum_ibu' AND `jabatan`='Sekretaris');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu Siagian / Br. Sinaga','kaum_ibu','Kaum Ibu','Bendahara',4,'assets/img/team/ibu-siagian-br-sinaga.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='kaum_ibu' AND `jabatan`='Bendahara');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu Gr. H. Sitorus / Br. Sihombing','kaum_ibu','Kaum Ibu','Sie. Doa',5,'assets/img/team/ibu-gr-h-sitorus-br-sihombing.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='kaum_ibu' AND `jabatan`='Sie. Doa');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu St. Sinaga / Br. Sinaga','kaum_ibu','Kaum Ibu','Sie. Pemerhati',6,'assets/img/team/ibu-st-sinaga-br-sinaga.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='kaum_ibu' AND `jabatan`='Sie. Pemerhati');

INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Bp. St. H. Sitorus','pemuda','Revive Generation','Pembina',1,'assets/img/team/bp-st-h-sitorus.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='pemuda' AND `jabatan`='Pembina');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Gideon Ferdinan Siburian, S.Pd','pemuda','Revive Generation','Ketua',2,'assets/img/gideon.jpg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='pemuda' AND `jabatan`='Ketua');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Imell Warnita Sihombing','pemuda','Revive Generation','Sekretaris',3,'assets/img/team/imell-warnita-sihombing.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='pemuda' AND `jabatan`='Sekretaris');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Zefanya Manurung','pemuda','Revive Generation','Bendahara',4,'assets/img/team/zefanya-manurung.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='pemuda' AND `jabatan`='Bendahara');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Abygail Septiani Rumahorbo','pemuda','Revive Generation','Kerohanian',5,'assets/img/team/abygail-septiani-rumahorbo.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='pemuda' AND `jabatan`='Kerohanian');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Yosia Natanael Siagian','pemuda','Revive Generation','Humas',6,'assets/img/team/yosia-natanael-siagian.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='pemuda' AND `nama_lengkap`='Yosia Natanael Siagian');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Taruli Abigael Kristina Samosir','pemuda','Revive Generation','Humas',7,'assets/img/team/taruli-abigael-kristina-samosir.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='pemuda' AND `nama_lengkap`='Taruli Abigael Kristina Samosir');

-- ==========================================================
-- UPDATE ROLE BASED ACCESS: 3 AKTOR LOGIN
-- Admin, Majelis/Pengurus, Pendeta
-- ==========================================================

CREATE TABLE IF NOT EXISTS `role_permissions` (
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

UPDATE `users` SET `role`='admin' WHERE `role` IN ('superadmin','administrator');
UPDATE `users` SET `role`='majelis' WHERE `role` IN ('pengurus','majelis_pengurus','majelis/pengurus');
UPDATE `users` SET `role`='pendeta' WHERE `role` IN ('pimpinan','pastor');

INSERT INTO `users` (`username`, `password_hash`, `nama_lengkap`, `email`, `role`, `status`) VALUES
('admin', '$2y$12$65Z7b5AX6j7sZu6.pT/kluougqlmZIZWCqDQDo0PbQN3TLbZ69op.', 'Administrator GPI Cipayung', 'admin@gpicipayung.local', 'admin', 'aktif'),
('majelis', '$2y$12$6VrCBCTTRMdu2.BKofkz7u58Yl.uRt3bwscjc7hPCv6ECO1Dmjpdi', 'Majelis / Pengurus GPI Cipayung', 'majelis@gpicipayung.local', 'majelis', 'aktif'),
('pendeta', '$2y$12$b7.wyMowsUdN4SI/oK9vTO1OC18unqduXSZ47HitLiZWGka8hvyL6', 'Pendeta GPI Cipayung', 'pendeta@gpicipayung.local', 'pendeta', 'aktif')
ON DUPLICATE KEY UPDATE `nama_lengkap`=VALUES(`nama_lengkap`), `role`=VALUES(`role`), `status`='aktif';

DELETE FROM `role_permissions` WHERE `role` IN ('admin','majelis','pendeta');
INSERT INTO `role_permissions` (`role`, `section_key`, `can_view`, `can_create`, `can_update`, `can_delete`, `can_import`, `can_export`) VALUES
('admin','dashboard',1,0,0,0,0,0),('admin','users',1,1,1,1,0,0),('admin','jemaat',1,1,1,1,1,1),('admin','jadwal',1,1,1,1,1,1),('admin','pengumuman',1,1,1,1,0,1),('admin','media',1,1,1,1,0,1),('admin','pesan',1,1,1,1,0,1),('admin','sakramen',1,1,1,1,0,1),('admin','persembahan',1,1,1,1,0,1),('admin','pernikahan',1,1,1,1,0,1),('admin','tim_pelayan',1,1,1,1,0,1),('admin','whatsapp',1,0,0,0,0,1),
('majelis','dashboard',1,0,0,0,0,0),('majelis','users',0,0,0,0,0,0),('majelis','jemaat',1,1,1,1,1,1),('majelis','jadwal',1,1,1,1,1,1),('majelis','pengumuman',1,1,1,1,0,1),('majelis','media',1,1,1,1,0,1),('majelis','pesan',1,1,1,1,0,1),('majelis','sakramen',1,1,1,1,0,1),('majelis','persembahan',1,1,1,1,0,1),('majelis','pernikahan',1,1,1,1,0,1),('majelis','tim_pelayan',1,1,1,1,0,1),('majelis','whatsapp',1,0,0,0,0,1),
('pendeta','dashboard',1,0,0,0,0,0),('pendeta','users',0,0,0,0,0,0),('pendeta','jemaat',1,0,0,0,0,1),('pendeta','jadwal',1,0,0,0,0,1),('pendeta','pengumuman',1,0,0,0,0,1),('pendeta','media',1,0,0,0,0,1),('pendeta','pesan',0,0,0,0,0,0),('pendeta','sakramen',1,0,0,0,0,1),('pendeta','persembahan',1,0,0,0,0,1),('pendeta','pernikahan',1,0,0,0,0,1),('pendeta','tim_pelayan',1,0,0,0,0,1),('pendeta','whatsapp',1,0,0,0,0,1);

-- 2026-06-26: Penyesuaian nama pelayanan pemuda menjadi Revive Generation.
UPDATE `pelayanan_tim` SET `nama_tim`='Revive Generation', `penanggung_jawab`='Koordinator Revive Generation'
WHERE LOWER(`nama_tim`) LIKE '%pemuda%' OR LOWER(`nama_tim`) LIKE '%pemudi%' OR LOWER(`nama_tim`) LIKE '%youth%';
UPDATE `tim_pelayan_members` SET `tim`='Revive Generation'
WHERE `kategori`='pemuda' AND (`tim` LIKE '%Pemuda%' OR `tim` LIKE '%Pemudi%' OR `tim` LIKE '%Youth%');

-- ==========================================================
-- UPDATE PELAYANAN 2026-06-26: perbaikan duplicate Revive, klik service card,
-- dan sinkron jabatan tim pelayan sesuai kategori yang benar.
-- ==========================================================
UPDATE `pelayanan_tim`
SET `nama_tim`='Revive Generation',
    `penanggung_jawab`='Koordinator Revive Generation'
WHERE LOWER(`nama_tim`) LIKE '%pemuda%'
   OR LOWER(`nama_tim`) LIKE '%pemudi%'
   OR LOWER(`nama_tim`) LIKE '%youth%'
   OR LOWER(`nama_tim`) LIKE '%revive%';

DELETE p FROM `pelayanan_tim` p
JOIN `pelayanan_tim` keep_row
  ON keep_row.`nama_tim` = p.`nama_tim`
 AND keep_row.`id` < p.`id`
WHERE p.`nama_tim` IN ('Tim Musik & Singers','Tim Pelayanan Gereja','Sekolah Minggu','Revive Generation','Kaum Ibu','Pendalaman Alkitab');

UPDATE `tim_pelayan_members`
SET `kategori`='sekolah_minggu', `tim`='Sekolah Minggu'
WHERE LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%sekolah minggu%'
   OR LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%guru sekolah%';

UPDATE `tim_pelayan_members`
SET `kategori`='pemuda', `tim`='Revive Generation'
WHERE LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%revive%'
   OR LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%pemuda%'
   OR LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%pemudi%'
   OR LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%youth%';

UPDATE `tim_pelayan_members`
SET `kategori`='kaum_ibu', `tim`='Kaum Ibu'
WHERE LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%kaum ibu%'
   OR LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%sie. doa%'
   OR LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%sie. pemerhati%';

UPDATE `tim_pelayan_members`
SET `kategori`='media', `tim`='Media Gereja'
WHERE LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%media%'
   OR LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%publikasi%'
   OR LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%dokumentasi%'
   OR LOWER(CONCAT_WS(' ', `tim`, `jabatan`)) LIKE '%konten%';


-- 2026-06-26 patch: perbaikan klik card pelayanan, jabatan Tim Pelayanan Gereja, dan tambahan Kaum Ibu.
UPDATE `pelayanan_tim`
SET `penanggung_jawab` = CASE
  WHEN `nama_tim` = 'Kaum Ibu' THEN 'Koordinator Kaum Ibu'
  WHEN `nama_tim` = 'Sekolah Minggu' THEN 'Koordinator Sekolah Minggu'
  WHEN `nama_tim` IN ('Pelayanan Pemuda/i','Pemuda/i','Revive Generation') THEN 'Koordinator Revive Generation'
  ELSE `penanggung_jawab`
END
WHERE LOWER(`penanggung_jawab`) LIKE '%buka halaman%'
   OR `nama_tim` IN ('Kaum Ibu','Sekolah Minggu','Pelayanan Pemuda/i','Pemuda/i','Revive Generation');

UPDATE `pelayanan_tim`
SET `nama_tim`='Revive Generation', `deskripsi`='Pembinaan karakter dan komunitas pemuda gereja.', `penanggung_jawab`='Koordinator Revive Generation', `status`='published'
WHERE `nama_tim` IN ('Pelayanan Pemuda/i','Pemuda/i','Youth','Revive Generation');

DELETE p1 FROM `pelayanan_tim` p1
JOIN `pelayanan_tim` p2
  ON p1.`nama_tim` = p2.`nama_tim`
 AND p1.`id` > p2.`id`
WHERE p1.`nama_tim` IN ('Revive Generation','Kaum Ibu','Sekolah Minggu');

UPDATE `tim_pelayan_members`
SET `nama_lengkap`='St. H. Sitorus'
WHERE `nama_lengkap`='Phb. H. Sitorus';

UPDATE `tim_pelayan_members`
SET `tim`='Pendamping & Pelayan Gereja', `jabatan`='Hamba Tuhan'
WHERE `kategori`='pelayanan_gereja'
  AND LOWER(CONCAT_WS(' ',`tim`,`jabatan`)) NOT LIKE '%gembala%'
  AND `nama_lengkap` NOT LIKE '%Ev. D. F. Manurung%';

INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ev. D. F. Manurung','pelayanan_gereja','Pendamping & Pelayan Gereja','Evangelis',2,'','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `nama_lengkap`='Ev. D. F. Manurung' AND `kategori`='pelayanan_gereja');

INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu Pdt. E. H. Sinaga / Br. Nainggolan','kaum_ibu','Kaum Ibu','Anggota',7,'assets/img/team/ibu-pdt-e-h-sinaga-br-nainggolan.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `nama_lengkap`='Ibu Pdt. E. H. Sinaga / Br. Nainggolan' AND `kategori`='kaum_ibu');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu Ev. D. F. Manurung','kaum_ibu','Kaum Ibu','Anggota',8,'assets/img/team/ibu-ev-d-f-manurung.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `nama_lengkap`='Ibu Ev. D. F. Manurung' AND `kategori`='kaum_ibu');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu St. R. B. Rumahorbo / Br. Sitompul','kaum_ibu','Kaum Ibu','Anggota',9,'assets/img/team/ibu-st-r-b-rumahorbo-br-sitompul.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `nama_lengkap`='Ibu St. R. B. Rumahorbo / Br. Sitompul' AND `kategori`='kaum_ibu');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu St. Sinaga / Br. Simanjuntak','kaum_ibu','Kaum Ibu','Anggota',10,'assets/img/team/ibu-st-sinaga-br-simanjuntak.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `nama_lengkap`='Ibu St. Sinaga / Br. Simanjuntak' AND `kategori`='kaum_ibu');
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu St. N. Sihombing / Br. Silitonga','kaum_ibu','Kaum Ibu','Anggota',11,'assets/img/team/ibu-st-n-sihombing-br-silitonga.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `nama_lengkap`='Ibu St. N. Sihombing / Br. Silitonga' AND `kategori`='kaum_ibu');


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



-- ==========================================================
-- PATCH 2026-06-30: foto Tim Pelayan, struktur Sekolah Minggu, dan thumbnail admin.
-- ==========================================================
-- Bersihkan placeholder Sekolah Minggu lama agar tidak tampil sebagai Nama Lengkap.
DELETE FROM `tim_pelayan_members`
WHERE `kategori`='sekolah_minggu'
  AND LOWER(`nama_lengkap`) IN ('nama lengkap','(belum diisi)');

UPDATE `tim_pelayan_members`
SET `kategori`='sekolah_minggu', `tim`='Sekolah Minggu', `jabatan`='Koordinator Guru Sekolah Minggu', `urutan`=1,
    `foto_path`=IF(`foto_path` IS NULL OR `foto_path`='', 'assets/img/team/natalia-debora-sinaga.svg', `foto_path`), `status`='published'
WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Natalia Debora Sinaga';
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Natalia Debora Sinaga','sekolah_minggu','Sekolah Minggu','Koordinator Guru Sekolah Minggu',1,'assets/img/team/natalia-debora-sinaga.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Natalia Debora Sinaga');

UPDATE `tim_pelayan_members`
SET `kategori`='sekolah_minggu', `tim`='Sekolah Minggu', `jabatan`='Guru Sekolah Minggu', `urutan`=2,
    `foto_path`=IF(`foto_path` IS NULL OR `foto_path`='', 'assets/img/team/ibu-pdt-e-h-sinaga-br-nainggolan.svg', `foto_path`), `status`='published'
WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Ibu Pdt. E. H. Sinaga / Br. Nainggolan';
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu Pdt. E. H. Sinaga / Br. Nainggolan','sekolah_minggu','Sekolah Minggu','Guru Sekolah Minggu',2,'assets/img/team/ibu-pdt-e-h-sinaga-br-nainggolan.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Ibu Pdt. E. H. Sinaga / Br. Nainggolan');

UPDATE `tim_pelayan_members`
SET `kategori`='sekolah_minggu', `tim`='Sekolah Minggu', `jabatan`='Guru Sekolah Minggu', `urutan`=3,
    `foto_path`=IF(`foto_path` IS NULL OR `foto_path`='', 'assets/img/team/ibu-st-r-d-sinaga-br-simanjuntak.svg', `foto_path`), `status`='published'
WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Ibu St. R. D. Sinaga / Br. Simanjuntak';
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu St. R. D. Sinaga / Br. Simanjuntak','sekolah_minggu','Sekolah Minggu','Guru Sekolah Minggu',3,'assets/img/team/ibu-st-r-d-sinaga-br-simanjuntak.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Ibu St. R. D. Sinaga / Br. Simanjuntak');

UPDATE `tim_pelayan_members`
SET `kategori`='sekolah_minggu', `tim`='Sekolah Minggu', `jabatan`='Guru Sekolah Minggu', `urutan`=4,
    `foto_path`=IF(`foto_path` IS NULL OR `foto_path`='', 'assets/img/team/bp-st-r-d-sinaga.svg', `foto_path`), `status`='published'
WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Bp. St. R. D. Sinaga';
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Bp. St. R. D. Sinaga','sekolah_minggu','Sekolah Minggu','Guru Sekolah Minggu',4,'assets/img/team/bp-st-r-d-sinaga.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Bp. St. R. D. Sinaga');

UPDATE `tim_pelayan_members`
SET `kategori`='sekolah_minggu', `tim`='Sekolah Minggu', `jabatan`='Guru Sekolah Minggu', `urutan`=5,
    `foto_path`=IF(`foto_path` IS NULL OR `foto_path`='', 'assets/img/gideon.jpg', `foto_path`), `status`='published'
WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Gideon Siburian';
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Gideon Siburian','sekolah_minggu','Sekolah Minggu','Guru Sekolah Minggu',5,'assets/img/gideon.jpg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Gideon Siburian');

UPDATE `tim_pelayan_members`
SET `kategori`='sekolah_minggu', `tim`='Sekolah Minggu', `jabatan`='Guru Sekolah Minggu', `urutan`=6,
    `foto_path`=IF(`foto_path` IS NULL OR `foto_path`='', 'assets/img/team/ibu-siagian-br-sinaga.svg', `foto_path`), `status`='published'
WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Ibu Siagian / Br. Sinaga';
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Ibu Siagian / Br. Sinaga','sekolah_minggu','Sekolah Minggu','Guru Sekolah Minggu',6,'assets/img/team/ibu-siagian-br-sinaga.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Ibu Siagian / Br. Sinaga');

UPDATE `tim_pelayan_members`
SET `kategori`='sekolah_minggu', `tim`='Sekolah Minggu', `jabatan`='Guru Sekolah Minggu', `urutan`=7,
    `foto_path`=IF(`foto_path` IS NULL OR `foto_path`='', 'assets/img/isak.jpg', `foto_path`), `status`='published'
WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Isak Sinaga';
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Isak Sinaga','sekolah_minggu','Sekolah Minggu','Guru Sekolah Minggu',7,'assets/img/isak.jpg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Isak Sinaga');

UPDATE `tim_pelayan_members`
SET `kategori`='sekolah_minggu', `tim`='Sekolah Minggu', `jabatan`='Guru Sekolah Minggu', `urutan`=8,
    `foto_path`=IF(`foto_path` IS NULL OR `foto_path`='', 'assets/img/david.jpg', `foto_path`), `status`='published'
WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='David Sitompul';
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'David Sitompul','sekolah_minggu','Sekolah Minggu','Guru Sekolah Minggu',8,'assets/img/david.jpg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='David Sitompul');

UPDATE `tim_pelayan_members`
SET `kategori`='sekolah_minggu', `tim`='Sekolah Minggu', `jabatan`='Guru Sekolah Minggu', `urutan`=9,
    `foto_path`=IF(`foto_path` IS NULL OR `foto_path`='', 'assets/img/septiana.jpg', `foto_path`), `status`='published'
WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Septiana Sinaga';
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Septiana Sinaga','sekolah_minggu','Sekolah Minggu','Guru Sekolah Minggu',9,'assets/img/septiana.jpg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Septiana Sinaga');

UPDATE `tim_pelayan_members`
SET `kategori`='sekolah_minggu', `tim`='Sekolah Minggu', `jabatan`='Guru Sekolah Minggu', `urutan`=10,
    `foto_path`=IF(`foto_path` IS NULL OR `foto_path`='', 'assets/img/johan.jpg', `foto_path`), `status`='published'
WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Johan Sihombing';
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Johan Sihombing','sekolah_minggu','Sekolah Minggu','Guru Sekolah Minggu',10,'assets/img/johan.jpg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Johan Sihombing');

UPDATE `tim_pelayan_members`
SET `kategori`='sekolah_minggu', `tim`='Sekolah Minggu', `jabatan`='Guru Sekolah Minggu', `urutan`=11,
    `foto_path`=IF(`foto_path` IS NULL OR `foto_path`='', 'assets/img/team/emely-sihombing.svg', `foto_path`), `status`='published'
WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Emely Sihombing';
INSERT INTO `tim_pelayan_members` (`nama_lengkap`,`kategori`,`tim`,`jabatan`,`urutan`,`foto_path`,`status`)
SELECT 'Emely Sihombing','sekolah_minggu','Sekolah Minggu','Guru Sekolah Minggu',11,'assets/img/team/emely-sihombing.svg','published'
WHERE NOT EXISTS (SELECT 1 FROM `tim_pelayan_members` WHERE `kategori`='sekolah_minggu' AND `nama_lengkap`='Emely Sihombing');

-- Pastikan foto Pdt. E.H. Sinaga tampil dengan file gambar valid yang sudah ada dalam project.
UPDATE `tim_pelayan_members`
SET `foto_path`='assets/img/pdt-e-h-sinaga.jpg'
WHERE `nama_lengkap`='Pdt. E.H. Sinaga'
  AND `kategori`='pelayanan_gereja'
  AND (`foto_path`='' OR `foto_path` IS NULL OR `foto_path` LIKE 'uploads/media/team/%pdt-e-h-sinaga%');


-- Tambahan kategori dana persembahan
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'persembahan' AND COLUMN_NAME = 'kategori_dana');
SET @sql := IF(@col = 0, 'ALTER TABLE `persembahan` ADD COLUMN `kategori_dana` VARCHAR(80) NOT NULL DEFAULT ''Persembahan'' AFTER `tanggal`', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
