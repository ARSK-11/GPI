Database versi revisi 20 November 2026:

1. Backup MySQL terlebih dahulu.
2. Modul app/repository.js secara otomatis membuat connect_categories, finance_audit, dan menambah kolom pada pengumuman dan persembahan saat login/public dibuka.
3. Jika akun database tidak memiliki izin CREATE/ALTER, gunakan akun migrasi sementara untuk menjalankan aplikasi sekali. Pastikan tabel dan kolom baru tersedia, lalu kembalikan akun database ke izin biasa (SELECT/INSERT/UPDATE/DELETE yang diperlukan).
4. Jangan menjalankan ulang file database/database_gpi_cipayung.sql pada database lama karena berisi DROP TABLE.
5. Janji iman yang belum terealisasi tidak dihitung sebagai saldo kas.
