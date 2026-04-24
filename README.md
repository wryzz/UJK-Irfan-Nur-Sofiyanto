# 📚 BiblioTech — Sistem Manajemen Perpustakaan

Aplikasi web berbasis **Node.js + Express.js** untuk mengelola data perpustakaan secara digital. Dilengkapi dengan sistem autentikasi, fitur CRUD lengkap, pencarian & filter kategori, serta dashboard monitoring.

---

## 📦 Daftar Isi

- [👤 Identitas Mahasiswa](#-identitas-mahasiswa)
- [📖 Tentang Proyek](#-tentang-proyek)
- [✨ Fitur Utama](#-fitur-utama)
- [🛠️ Teknologi yang Digunakan](#️-teknologi-yang-digunakan)
- [🗃️ Struktur Database](#️-struktur-database)
- [📁 Struktur Proyek](#-struktur-proyek)
- [🚀 Instalasi & Menjalankan](#-instalasi--menjalankan)
- [👤 Akun Default](#-akun-default)
- [🔒 Keamanan](#-keamanan)
- [📸 Tampilan Aplikasi](#-tampilan-aplikasi)
- [🎓 Penutup](#-penutup)

---

## 👤 Identitas Mahasiswa

| Field           | Detail              |
|-----------------|---------------------|
| **Nama**        | Irfan Nur Sofiyanto |
| **NIM**         | 220103179           |
| **Kelas**       | 22TIA6              |
| **Mata Kuliah** | Pemrograman Web     |
| **Dosen**       | Bapak Sopingi       |

---

## 📖 Tentang Proyek

Proyek ini merupakan sistem manajemen perpustakaan digital bernama **BiblioTech**, dibangun sebagai bagian dari **Uji Kompetensi Kejuruan (UJK)** pada mata kuliah Pemrograman Web.

Sistem ini menggantikan metode manual atau spreadsheet dengan aplikasi berbasis web yang lebih terstruktur, aman, dan mudah digunakan oleh admin maupun petugas perpustakaan.

---

## ✨ Fitur Utama

### 🔐 Autentikasi
- Login dengan validasi form
- Password dienkripsi menggunakan **bcrypt**
- Autentikasi berbasis **JWT** (berlaku 8 jam)
- Proteksi halaman dengan middleware auth

### 📚 Manajemen Buku
- Tambah, lihat, edit, dan hapus buku (CRUD)
- Pencarian buku berdasarkan judul / pengarang
- Filter berdasarkan kategori

### 👥 Manajemen User (Admin)
- CRUD data pengguna
- Role-based access control (Admin / Petugas)
- Petugas hanya dapat melihat data

### 📊 Dashboard
- Statistik jumlah buku dan pengguna
- Informasi akun yang sedang login
- Data buku terbaru

---

## 🛠️ Teknologi yang Digunakan

| Layer    | Teknologi               |
|----------|-------------------------|
| Backend  | Node.js + Express.js    |
| Database | SQLite (better-sqlite3) |
| Auth     | JSON Web Token (JWT)    |
| Security | bcrypt                  |
| Frontend | HTML, CSS, JavaScript   |

---

## 🗃️ Struktur Database

### 🔐 Tabel `users`

| Kolom      | Tipe         | Keterangan        |
|------------|--------------|-------------------|
| id         | INTEGER PK   | Auto increment    |
| nama       | TEXT         | Nama pengguna     |
| email      | TEXT         | Email login       |
| password   | TEXT         | Hash bcrypt       |
| role       | TEXT         | `admin`/`petugas` |
| created_at | DATETIME     | Waktu dibuat      |

### 📚 Tabel `buku`

| Kolom        | Tipe       | Keterangan      |
|--------------|------------|-----------------|
| id           | INTEGER PK | Auto increment  |
| judul        | TEXT       | Judul buku      |
| pengarang    | TEXT       | Nama pengarang  |
| penerbit     | TEXT       | Nama penerbit   |
| tahun_terbit | INTEGER    | Tahun terbit    |
| isbn         | TEXT       | Nomor ISBN      |
| kategori     | TEXT       | Genre / kategori|
| stok         | INTEGER    | Jumlah stok     |
| deskripsi    | TEXT       | Deskripsi buku  |
| created_at   | DATETIME   | Waktu dibuat    |
| updated_at   | DATETIME   | Waktu diupdate  |

---

## 📁 Struktur Proyek

```
sistem-perpustakaan/
├── src/
│   └── server.js
├── public/
│   ├── index.html
│   ├── css/
│   └── js/
├── database/
│   ├── perpustakaan.sql
│   └── perpustakaan.db
├── package.json
└── README.md
```

---

## 🚀 Instalasi & Menjalankan

### 🔧 Prasyarat

- Node.js versi **16+**
- npm

### 📥 Langkah Instalasi

```bash
git clone https://github.com/wryzz/UJK-Irfan-Nur-Sofiyanto.git
cd sistem-perpustakaan
npm install
npm start
```

### 🌐 Akses Aplikasi

Buka browser dan akses:

```
http://localhost:3000
```

---

## 👤 Akun Default

| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@perpustakaan.com   | `admin123`   |
| Petugas | budi@perpustakaan.com    | `petugas123` |

---

## 🔒 Keamanan

- ✅ Password tidak disimpan dalam bentuk plaintext
- ✅ Hashing password menggunakan **bcrypt**
- ✅ Proteksi endpoint dengan **JWT**
- ✅ Role-based access control (RBAC)
- ✅ Validasi input untuk mencegah **XSS**

---

## 📸 Tampilan Aplikasi

| Halaman      | Deskripsi                        |
|--------------|----------------------------------|
| 🔑 Login     | Form login dengan validasi       |
| 📊 Dashboard | Statistik dan ringkasan data     |
| 📚 Data Buku | Daftar, tambah, edit, hapus buku |
| 👥 Data User | Manajemen pengguna (khusus admin)|

---

## 🎓 Penutup

> Proyek **BiblioTech** dibuat untuk memenuhi tugas **Uji Kompetensi Kejuruan (UJK)**