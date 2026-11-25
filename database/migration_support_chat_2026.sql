-- GPI Cipayung: pusat bantuan / chat dua arah, November 2026.
-- Jalankan pada database GPI Cipayung yang sama dengan server.js.
-- BUAT BACKUP sebelum perubahan. Script ini hanya menambah tabel baru.
-- Kolom connect_requests.detail_json akan ditambah otomatis melalui ensureConnect() ketika aplikasi mulai.

CREATE TABLE IF NOT EXISTS support_articles (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 slug VARCHAR(90) NOT NULL UNIQUE,
 title VARCHAR(180) NOT NULL,
 category VARCHAR(80) NOT NULL,
 summary VARCHAR(360) NOT NULL,
 body TEXT NOT NULL,
 link_path VARCHAR(300) NOT NULL DEFAULT '',
 active TINYINT(1) NOT NULL DEFAULT 1,
 sort_order INT NOT NULL DEFAULT 100,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_active_category (active,category,sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_threads (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 visitor_token_hash CHAR(64) NOT NULL UNIQUE,
 visitor_name VARCHAR(160) NOT NULL,
 city VARCHAR(120) NOT NULL,
 department VARCHAR(120) NOT NULL,
 phone VARCHAR(40) NOT NULL,
 email VARCHAR(160) NULL,
 status VARCHAR(20) NOT NULL DEFAULT 'baru',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 KEY idx_activity (last_message_at),
 KEY idx_status (status,last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS support_messages (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 thread_id BIGINT UNSIGNED NOT NULL,
 sender VARCHAR(16) NOT NULL,
 body TEXT NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX idx_thread_messages(thread_id,id),
 CONSTRAINT fk_support_thread FOREIGN KEY (thread_id)
  REFERENCES support_threads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
