📚 BiblioTech — Sistem Manajemen Perpustakaan
👤 Identitas Mahasiswa

| Field | Detail |
|-------|--------|
| **Nama** | [Irfan Nur Sofiyanto] |
| **NIM** | [220103179] |
| **Kelas** | [22TIA6] |
| **Mata Kuliah** | Pemrograman Web |
| **Dosen** | [Bapak Sopingi] |

---

📖 Tema Kasus: Sistem Manajemen Perpustakaan

Aplikasi **BiblioTech** adalah sistem manajemen perpustakaan digital yang memungkinkan petugas dan admin perpustakaan untuk mengelola koleksi buku secara efisien. Sistem ini menyelesaikan masalah pengelolaan data buku yang selama ini masih dilakukan secara manual atau menggunakan spreadsheet sederhana.

---

🗃️ Struktur Database

Tabel 1: `users` (Autentikasi)
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | INTEGER PK | Auto increment |
| nama | TEXT | Nama lengkap pengguna |
| email | TEXT UNIQUE | Email untuk login |
| password | TEXT | Bcrypt hash (tidak disimpan plaintext) |
| role | TEXT | `admin` atau `petugas` |
| created_at | DATETIME | Waktu pendaftaran |

Tabel 2: `buku` (Tabel Bisnis)
| Kolom | Tipe | Keterangan |
|-------|------|-----------|
| id | INTEGER PK | Auto increment |
| judul | TEXT | Judul buku |
| pengarang | TEXT | Nama pengarang |
| penerbit | TEXT | Nama penerbit |
| tahun_terbit | INTEGER | Tahun diterbitkan |
| isbn | TEXT UNIQUE | Kode ISBN buku |
| kategori | TEXT | Kategori/genre buku |
| stok | INTEGER | Jumlah stok tersedia |
| deskripsi | TEXT | Deskripsi singkat |
| created_at | DATETIME | Waktu ditambahkan |
| updated_at | DATETIME | Waktu terakhir diubah |

---

✨ Fitur Aplikasi

🔐 Autentikasi
- Halaman login dengan validasi form
- Password dienkripsi menggunakan **bcrypt** (salt rounds: 10)
- Sistem autentikasi menggunakan **JWT (JSON Web Token)**
- Token berlaku selama 8 jam
- Semua halaman CRUD dilindungi middleware auth
- Auto-redirect ke login jika token tidak valid/expired

📚 CRUD Data Buku
- **Create** — Tambah buku baru dengan form modal
- **Read** — Tampilkan tabel buku dengan fitur pencarian & filter kategori
- **Update** — Edit data buku melalui form modal yang pre-filled
- **Delete** — Hapus buku dengan konfirmasi dialog

👥 CRUD Data Pengguna (Admin Only)
- Tambah, edit, hapus akun pengguna
- Role-based access control (Admin vs Petugas)
- Petugas hanya bisa melihat daftar pengguna

📊 Dashboard
- Statistik ringkasan (total buku, stok, kategori, pengguna)
- Daftar buku terbaru
- Info akun yang sedang login

---

🛠️ Teknologi yang Digunakan

| Layer | Teknologi |
|-------|-----------|
| Backend | Node.js + Express.js |
| Database | SQLite (via better-sqlite3) |
| Autentikasi | JWT (jsonwebtoken) |
| Enkripsi | bcryptjs |
| Frontend | HTML5 + CSS3 + Vanilla JavaScript (SPA) |
| Font | Google Fonts (Playfair Display + DM Sans) |

---

🚀 Cara Menjalankan

Prasyarat
- Node.js versi 16+ ([download](https://nodejs.org))
- npm (sudah include dengan Node.js)

Langkah Instalasi

```bash
# 1. Clone atau download project ini
git clone https://github.com/[username]/sistem-perpustakaan.git

# 2. Masuk ke folder project
cd sistem-perpustakaan

# 3. Install dependencies
npm install

# 4. Jalankan server
npm start
```

Server akan berjalan di **http://localhost:3000**

Akun Default

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@perpustakaan.com | admin123 |
| Petugas | budi@perpustakaan.com | petugas123 |

> **Catatan:** Database SQLite (`perpustakaan.db`) akan dibuat otomatis di folder `database/` saat pertama kali server dijalankan, beserta data awal (seed data).

---

📁 Struktur Folder

```
sistem-perpustakaan/
├── src/
│   └── server.js          # Backend Express + API Routes
├── public/
│   ├── index.html         # SPA utama
│   ├── css/
│   │   └── style.css      # Stylesheet
│   └── js/
│       └── app.js         # Frontend JavaScript
├── database/
│   ├── perpustakaan.sql   # Export database (schema + seed)
│   └── perpustakaan.db    # File database SQLite (auto-generated)
├── package.json
└── README.md
```

---

🔒 Keamanan

- Password **tidak pernah** disimpan dalam bentuk plaintext
- Setiap password di-hash dengan bcrypt sebelum disimpan
- Semua endpoint API dilindungi dengan JWT middleware
- Role-based access control untuk operasi sensitif
- Input di-escape untuk mencegah XSS

---

📸 Tampilan Aplikasi

- **Halaman Login** — Split layout dengan branding di kiri, form login di kanan
- **Dashboard** — Kartu statistik + daftar buku terbaru + info akun  
- **Data Buku** — Tabel dengan pencarian, filter kategori, dan badge stok berwarna
- **Data Pengguna** — Manajemen user dengan role badge (khusus admin)

---

*Dibuat untuk memenuhi UJK*
