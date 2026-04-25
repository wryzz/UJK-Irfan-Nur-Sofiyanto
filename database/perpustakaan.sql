-- ============================================================
-- FILE: perpustakaan.sql
-- Sistem Manajemen Perpustakaan — BiblioTech
-- Tabel: users, buku, peminjaman
-- ============================================================

-- Tabel 1: users (autentikasi & manajemen pengguna)
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nama       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,          -- bcrypt hash
    role       TEXT    NOT NULL DEFAULT 'petugas', -- 'admin' | 'petugas'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 2: buku (koleksi perpustakaan)
CREATE TABLE IF NOT EXISTS buku (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    judul        TEXT    NOT NULL,
    pengarang    TEXT    NOT NULL,
    penerbit     TEXT    NOT NULL,
    tahun_terbit INTEGER NOT NULL,
    isbn         TEXT    UNIQUE,
    kategori     TEXT    NOT NULL,
    stok         INTEGER NOT NULL DEFAULT 0,
    deskripsi    TEXT,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel 3: peminjaman (TABEL TAMBAHAN — transaksi peminjaman buku)
CREATE TABLE IF NOT EXISTS peminjaman (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_peminjam          TEXT    NOT NULL,            -- nama anggota peminjam
    no_anggota             TEXT    NOT NULL,            -- nomor kartu anggota
    buku_id                INTEGER NOT NULL REFERENCES buku(id),
    tanggal_pinjam         DATE    NOT NULL,
    tanggal_kembali        DATE    NOT NULL,            -- rencana kembali
    tanggal_kembali_aktual DATE,                        -- aktual dikembalikan
    status                 TEXT    NOT NULL DEFAULT 'dipinjam', -- 'dipinjam' | 'dikembalikan'
    catatan                TEXT,
    petugas_id             INTEGER REFERENCES users(id),
    created_at             DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DATA AWAL (Seed)
-- ============================================================

-- Users: password = 'admin123' / 'petugas123' (bcrypt hash)
INSERT OR IGNORE INTO users (nama, email, password, role) VALUES
('Admin Irfan', 'admin-irfan@perpustakaan.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Irfan Nur Sofiyanto', 'irfan@perpustakaan.com',
 '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'petugas');

-- Buku
INSERT OR IGNORE INTO buku (judul, pengarang, penerbit, tahun_terbit, isbn, kategori, stok, deskripsi) VALUES
('Bumi Manusia','Pramoedya Ananta Toer','Lentera Dipantara',2005,'978-979-97312-3-2','Sastra',5,'Novel pertama dari Tetralogi Buru.'),
('Laskar Pelangi','Andrea Hirata','Bentang Pustaka',2005,'978-979-1227-00-1','Sastra',8,'Kisah persahabatan 10 anak Belitung.'),
('Sapiens','Yuval Noah Harari','KPG',2017,'978-979-91-1083-0','Sejarah',3,'Eksplorasi sejarah manusia.'),
('Clean Code','Robert C. Martin','Prentice Hall',2008,'978-0-13-235088-4','Teknologi',4,'Panduan kode bersih.'),
('Atomic Habits','James Clear','Avery',2018,'978-0-7352-1129-2','Pengembangan Diri',6,'Cara membangun kebiasaan baik.'),
('The Alchemist','Paulo Coelho','HarperCollins',1988,'978-0-06-231500-7','Sastra',7,'Novel mengejar impian.'),
('Pemrograman Web PHP','Budi Raharjo','Informatika',2015,'978-602-1514-56-7','Teknologi',2,'Panduan lengkap PHP.'),
('Ekonomi Kreatif','Suryana','Salemba Empat',2013,'978-979-061-378-4','Ekonomi',3,'Konsep ekonomi kreatif.');

-- Peminjaman contoh
INSERT OR IGNORE INTO peminjaman (nama_peminjam, no_anggota, buku_id, tanggal_pinjam, tanggal_kembali, status, petugas_id) VALUES
('Andi Pratama','ANG-001',1,date('now','-10 days'),date('now','+4 days'),'dipinjam',1),
('Siti Rahayu','ANG-002',2,date('now','-20 days'),date('now','-6 days'),'dikembalikan',1),
('Rizky Hidayat','ANG-003',3,date('now','-5 days'),date('now','+9 days'),'dipinjam',2),
('Dewi Lestari','ANG-004',4,date('now','-30 days'),date('now','-16 days'),'dikembalikan',1);
