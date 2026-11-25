-- GPI CIPAYUNG • FRESH 5 • DOKUMENTASI IBADAH
-- Jalankan hanya apabila database sudah berisi tabel website_services dan website_migrations
CREATE TABLE IF NOT EXISTS website_documentation (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 service_id INT UNSIGNED NOT NULL,
 judul VARCHAR(180) NOT NULL,
 deskripsi TEXT NOT NULL,
 source VARCHAR(20) NOT NULL DEFAULT 'upload',
 media_type VARCHAR(12) NOT NULL DEFAULT 'photo',
 file_path VARCHAR(500) NOT NULL DEFAULT '',
 external_url VARCHAR(1024) NOT NULL DEFAULT '',
 drive_id VARCHAR(200) NOT NULL DEFAULT '',
 urutan INT NOT NULL DEFAULT 99,
 status VARCHAR(20) NOT NULL DEFAULT 'published',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 KEY idx_service_status (service_id,status,urutan),
 CONSTRAINT fk_website_documentation_service FOREIGN KEY (service_id)
 REFERENCES website_services(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO website_documentation (service_id,judul,deskripsi,source,media_type,file_path,external_url,drive_id,urutan,status)
SELECT s.id,'Dokumentasi Youth Revive Generation','Album dokumentasi melalui Google Drive.','drive_folder','folder','',
'https://drive.google.com/drive/folders/1Jx9PvVly5WZlpPYj4pMKtVzcrrMthhbL','1Jx9PvVly5WZlpPYj4pMKtVzcrrMthhbL',1,'published'
FROM website_services s WHERE s.slug='youth-revive-generation'
AND NOT EXISTS(SELECT 1 FROM website_documentation d WHERE d.service_id=s.id AND d.source='drive_folder' AND d.drive_id='1Jx9PvVly5WZlpPYj4pMKtVzcrrMthhbL');
INSERT INTO website_documentation (service_id,judul,deskripsi,source,media_type,file_path,external_url,drive_id,urutan,status)
SELECT s.id,'Dokumentasi Ibadah Kaum Ibu','Album dokumentasi melalui Google Drive.','drive_folder','folder','',
'https://drive.google.com/drive/folders/1bBapA5ORt_hU2NiLCDDl8N9zDH_mpX_r','1bBapA5ORt_hU2NiLCDDl8N9zDH_mpX_r',1,'published'
FROM website_services s WHERE s.slug='kaum-ibu'
AND NOT EXISTS(SELECT 1 FROM website_documentation d WHERE d.service_id=s.id AND d.source='drive_folder' AND d.drive_id='1bBapA5ORt_hU2NiLCDDl8N9zDH_mpX_r');
INSERT IGNORE INTO website_migrations(migration_key) VALUES('fresh5_documentation_drive_v1');
