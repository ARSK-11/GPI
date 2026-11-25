-- Fresh 4: jalankan di database GPI yang sudah dipilih. Tidak menghapus tabel lama.
CREATE TABLE IF NOT EXISTS website_events (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, judul VARCHAR(180) NOT NULL, slug VARCHAR(120) NOT NULL UNIQUE,
 deskripsi TEXT NOT NULL, lokasi VARCHAR(250) NOT NULL, tanggal_mulai DATE NOT NULL, tanggal_selesai DATE NOT NULL,
 foto_path VARCHAR(500) NOT NULL DEFAULT '', urutan INT NOT NULL DEFAULT 99, status VARCHAR(20) NOT NULL DEFAULT 'draft',
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_services (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, judul VARCHAR(180) NOT NULL, slug VARCHAR(120) NOT NULL UNIQUE,
 deskripsi TEXT NOT NULL, jadwal VARCHAR(500) NOT NULL DEFAULT '', lokasi VARCHAR(250) NOT NULL DEFAULT '',
 nama_pembina VARCHAR(180) NOT NULL DEFAULT '', jabatan_pembina VARCHAR(180) NOT NULL DEFAULT '', bio TEXT NOT NULL,
 foto_path VARCHAR(500) NOT NULL DEFAULT '', hero_path VARCHAR(500) NOT NULL DEFAULT '',
 urutan INT NOT NULL DEFAULT 99, status VARCHAR(20) NOT NULL DEFAULT 'draft',
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_migrations (migration_key VARCHAR(100) PRIMARY KEY) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
START TRANSACTION;
INSERT IGNORE INTO website_migrations (migration_key) VALUES ('fresh4_seed_v1');
SET @gpi_f4_seed = ROW_COUNT();
INSERT INTO website_events (`judul`, `slug`, `deskripsi`, `lokasi`, `tanggal_mulai`, `tanggal_selesai`, `foto_path`, `urutan`, `status`) SELECT 'HUT GPI Cipayung ke-28', 'hut-gpi-cipayung-28', 'Built for More · Efesus 3:20–21. Mature in Faith, Strong in Unity, Ready for Greater Things.', 'Diamond Villa Lembang, Bandung, Jawa Barat', '2026-11-28', '2026-11-29', 'assets/img/website/hut-28.jpg', 1, 'published' WHERE @gpi_f4_seed = 1;
INSERT INTO website_services (`judul`, `slug`, `deskripsi`, `jadwal`, `lokasi`, `nama_pembina`, `jabatan_pembina`, `bio`, `foto_path`, `hero_path`, `urutan`, `status`) SELECT 'Ibadah Minggu Raya', 'minggu-raya', 'Mari berkumpul sebagai keluarga rohani untuk memuji dan menyembah Tuhan, mendengarkan Firman, serta bertumbuh bersama dalam iman dan kasih Kristus.', 'Minggu · 09.00 WIB', 'GPI Cipayung', '', '', '', '', 'assets/img/worship-background.png', 1, 'published' WHERE @gpi_f4_seed = 1;
INSERT INTO website_services (`judul`, `slug`, `deskripsi`, `jadwal`, `lokasi`, `nama_pembina`, `jabatan_pembina`, `bio`, `foto_path`, `hero_path`, `urutan`, `status`) SELECT 'Ibadah Tengah Minggu', 'tengah-minggu', 'Luangkan waktu di tengah kesibukan untuk bersekutu, berdoa, dan memperdalam Firman Tuhan bersama saudara seiman.', 'Kamis · 18.30 WIB', 'GPI Cipayung', 'Pdt. E. H. Sinaga, S.Th', 'Gembala Sidang', 'Pdt. E. H. Sinaga, S.Th diangkat sebagai pendeta pada tahun 2020 dan ditetapkan sebagai Gembala Sidang GPI Sidang Cipayung pada tahun 2021.', 'assets/img/website/gembala.jpg', 'assets/img/worship-background.png', 2, 'published' WHERE @gpi_f4_seed = 1;
INSERT INTO website_services (`judul`, `slug`, `deskripsi`, `jadwal`, `lokasi`, `nama_pembina`, `jabatan_pembina`, `bio`, `foto_path`, `hero_path`, `urutan`, `status`) SELECT 'Ibadah Sekolah Minggu', 'sekolah-minggu', 'Tempat anak-anak mengenal kasih Yesus dan bertumbuh melalui Firman Tuhan, doa, pujian, dan kegiatan kreatif bersama guru Sekolah Minggu.', 'Minggu · 07.00 WIB', 'GPI Cipayung', 'Dian Johan Partogi, S.Kom', 'Koordinator Guru Sekolah Minggu', 'Dian Johan Partogi adalah Koordinator Guru Sekolah Minggu pada tahun 2026, menggantikan posisi Natalia Debora.', 'assets/img/website/sekolah-minggu.jpg', 'assets/img/worship-background.png', 3, 'published' WHERE @gpi_f4_seed = 1;
INSERT INTO website_services (`judul`, `slug`, `deskripsi`, `jadwal`, `lokasi`, `nama_pembina`, `jabatan_pembina`, `bio`, `foto_path`, `hero_path`, `urutan`, `status`) SELECT 'Ibadah Youth Revive Generation', 'youth-revive-generation', 'Ruang bagi generasi muda untuk membangun iman, menemukan tujuan hidup dalam Kristus, dan saling menguatkan melalui persekutuan serta pelayanan.', '', 'GPI Cipayung', 'St. H. Sitorus', 'Pembina Revive Generation', 'St. H. Sitorus menjadi pembina sejak tahun 2023 dengan status Parhobas (Phb). Jabatan sebagai pembina berlanjut hingga tahun 2027, dan pada tahun 2026 beliau diangkat sebagai sintua.', 'assets/img/website/youth.jpg', 'assets/img/worship-background.png', 4, 'published' WHERE @gpi_f4_seed = 1;
INSERT INTO website_services (`judul`, `slug`, `deskripsi`, `jadwal`, `lokasi`, `nama_pembina`, `jabatan_pembina`, `bio`, `foto_path`, `hero_path`, `urutan`, `status`) SELECT 'Ibadah Kaum Ibu', 'kaum-ibu', 'Persekutuan bagi kaum ibu untuk bertumbuh dalam iman, saling mendoakan, memperkuat keluarga, dan melayani Tuhan dengan penuh kasih.', '', 'GPI Cipayung', 'Ibu Pdt. J. Sinaga / Br. Nababan', 'Pembina Kaum Ibu', 'Ibu Pdt. J. Sinaga adalah istri dari Alm. Bapak Pendeta J. Sinaga dan merupakan pembina organisasi ibadah Kaum Ibu di GPI Sidang Cipayung.', 'assets/img/website/kaum-ibu.jpg', 'assets/img/worship-background.png', 5, 'published' WHERE @gpi_f4_seed = 1;
COMMIT;
