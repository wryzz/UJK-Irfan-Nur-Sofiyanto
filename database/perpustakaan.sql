-- ============================================================
-- FILE: perpustakaan.sql
-- Database Export - Sistem Manajemen Perpustakaan
-- ============================================================

-- Tabel users (untuk autentikasi login)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,          -- bcrypt hash
    role TEXT NOT NULL DEFAULT 'petugas', -- 'admin' | 'petugas'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel buku (tabel bisnis utama)
CREATE TABLE IF NOT EXISTS buku (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    judul TEXT NOT NULL,
    pengarang TEXT NOT NULL,
    penerbit TEXT NOT NULL,
    tahun_terbit INTEGER NOT NULL,
    isbn TEXT UNIQUE,
    kategori TEXT NOT NULL,
    stok INTEGER NOT NULL DEFAULT 0,
    deskripsi TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- DATA AWAL (Seed Data)
-- ============================================================

-- Admin default: password = "admin123" (bcrypt hash)
INSERT OR IGNORE INTO users (nama, email, password, role) VALUES
(
    'Administrator',
    'admin@perpustakaan.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin'
),
(
    'Irfan Nur Sofiyanto',
    'irfan@perpustakaan.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'petugas'
);

-- Data buku contoh
INSERT OR IGNORE INTO buku (judul, pengarang, penerbit, tahun_terbit, isbn, kategori, stok, deskripsi) VALUES
('Bumi Manusia', 'Pramoedya Ananta Toer', 'Lentera Dipantara', 2005, '978-979-97312-3-2', 'Sastra', 5, 'Novel pertama dari Tetralogi Buru karya Pramoedya Ananta Toer.'),
('Laskar Pelangi', 'Andrea Hirata', 'Bentang Pustaka', 2005, '978-979-1227-00-1', 'Sastra', 8, 'Kisah persahabatan 10 anak Belitung dalam menggapai mimpi.'),
('Sapiens: Riwayat Singkat Umat Manusia', 'Yuval Noah Harari', 'KPG', 2017, '978-979-91-1083-0', 'Sejarah', 3, 'Eksplorasi sejarah manusia dari Zaman Batu hingga era modern.'),
('Clean Code', 'Robert C. Martin', 'Prentice Hall', 2008, '978-0-13-235088-4', 'Teknologi', 4, 'Panduan menulis kode program yang bersih dan mudah dipelihara.'),
('Atomic Habits', 'James Clear', 'Avery', 2018, '978-0-7352-1129-2', 'Pengembangan Diri', 6, 'Cara mudah dan terbukti membangun kebiasaan baik.'),
('The Alchemist', 'Paulo Coelho', 'HarperCollins', 1988, '978-0-06-231500-7', 'Sastra', 7, 'Novel tentang seorang anak muda yang mengikuti impiannya.'),
('Pemrograman Web dengan PHP', 'Budi Raharjo', 'Informatika', 2015, '978-602-1514-56-7', 'Teknologi', 2, 'Panduan lengkap pemrograman web menggunakan PHP.'),
('Ekonomi Kreatif', 'Suryana', 'Salemba Empat', 2013, '978-979-061-378-4', 'Ekonomi', 3, 'Konsep dan perkembangan ekonomi kreatif di Indonesia.');
