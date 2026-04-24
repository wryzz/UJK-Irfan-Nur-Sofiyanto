// ============================================================
// src/server.js — Backend Express + SQLite + JWT
// ============================================================
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Database = require("better-sqlite3");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;
const JWT_SECRET = "perpustakaan_secret_key_2024_uas";

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// ── Database Setup ────────────────────────────────────────────
const dbPath = path.join(__dirname, "../database/perpustakaan.db");
const db = new Database(dbPath);

// Inisialisasi tabel
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'petugas',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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
`);

// Seed admin default jika belum ada
// Cek admin
const adminExists = db
  .prepare("SELECT id FROM users WHERE email = ?")
  .get("admin@perpustakaan.com");

if (!adminExists) {
  const hash = bcrypt.hashSync("admin123", 10);
  db.prepare(
    "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)",
  ).run("Administrator", "admin@perpustakaan.com", hash, "admin");
}

// Cek petugas
const petugasExists = db
  .prepare("SELECT id FROM users WHERE email = ?")
  .get("irfan@perpustakaan.com");

if (!petugasExists) {
  const hash2 = bcrypt.hashSync("petugas123", 10);
  db.prepare(
    "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)",
  ).run("Irfan Nur Sofiyanto", "irfan@perpustakaan.com", hash2, "petugas");
}

// Seed buku
const seedBuku = [
  [
    "Bumi Manusia",
    "Pramoedya Ananta Toer",
    "Lentera Dipantara",
    2005,
    "978-979-97312-3-2",
    "Sastra",
    5,
    "Novel pertama dari Tetralogi Buru karya Pramoedya Ananta Toer.",
  ],
  [
    "Laskar Pelangi",
    "Andrea Hirata",
    "Bentang Pustaka",
    2005,
    "978-979-1227-00-1",
    "Sastra",
    8,
    "Kisah persahabatan 10 anak Belitung dalam menggapai mimpi.",
  ],
  [
    "Sapiens",
    "Yuval Noah Harari",
    "KPG",
    2017,
    "978-979-91-1083-0",
    "Sejarah",
    3,
    "Eksplorasi sejarah manusia dari Zaman Batu hingga era modern.",
  ],
  [
    "Clean Code",
    "Robert C. Martin",
    "Prentice Hall",
    2008,
    "978-0-13-235088-4",
    "Teknologi",
    4,
    "Panduan menulis kode program yang bersih dan mudah dipelihara.",
  ],
  [
    "Atomic Habits",
    "James Clear",
    "Avery",
    2018,
    "978-0-7352-1129-2",
    "Pengembangan Diri",
    6,
    "Cara mudah dan terbukti membangun kebiasaan baik.",
  ],
  [
    "The Alchemist",
    "Paulo Coelho",
    "HarperCollins",
    1988,
    "978-0-06-231500-7",
    "Sastra",
    7,
    "Novel tentang seorang anak muda yang mengikuti impiannya.",
  ],
  [
    "Pemrograman Web dengan PHP",
    "Budi Raharjo",
    "Informatika",
    2015,
    "978-602-1514-56-7",
    "Teknologi",
    2,
    "Panduan lengkap pemrograman web menggunakan PHP.",
  ],
  [
    "Ekonomi Kreatif",
    "Suryana",
    "Salemba Empat",
    2013,
    "978-979-061-378-4",
    "Ekonomi",
    3,
    "Konsep dan perkembangan ekonomi kreatif di Indonesia.",
  ],
];
const insertBuku = db.prepare(
  "INSERT OR IGNORE INTO buku (judul, pengarang, penerbit, tahun_terbit, isbn, kategori, stok, deskripsi) VALUES (?,?,?,?,?,?,?,?)",
);
seedBuku.forEach((b) => insertBuku.run(...b));

// ── Middleware Auth ───────────────────────────────────────────
function authMiddleware(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ message: "Unauthorized" });
  try {
    const token = auth.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res
      .status(401)
      .json({ message: "Token tidak valid atau sudah kadaluarsa" });
  }
}

// ── AUTH ROUTES ───────────────────────────────────────────────

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email dan password wajib diisi" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user)
    return res.status(401).json({ message: "Email atau password salah" });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid)
    return res.status(401).json({ message: "Email atau password salah" });

  const token = jwt.sign(
    { id: user.id, email: user.email, nama: user.nama, role: user.role },
    JWT_SECRET,
    { expiresIn: "8h" },
  );
  res.json({
    token,
    user: { id: user.id, nama: user.nama, email: user.email, role: user.role },
  });
});

// GET /api/auth/me
app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json(req.user);
});

// ── USERS ROUTES (admin only) ─────────────────────────────────

// GET /api/users
app.get("/api/users", authMiddleware, (req, res) => {
  const users = db
    .prepare("SELECT id, nama, email, role, created_at FROM users ORDER BY id")
    .all();
  res.json(users);
});

// POST /api/users
app.post("/api/users", authMiddleware, (req, res) => {
  if (req.user.role !== "admin")
    return res
      .status(403)
      .json({ message: "Hanya admin yang bisa menambah user" });
  const { nama, email, password, role } = req.body;
  if (!nama || !email || !password)
    return res.status(400).json({ message: "Semua field wajib diisi" });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db
      .prepare(
        "INSERT INTO users (nama, email, password, role) VALUES (?,?,?,?)",
      )
      .run(nama, email, hash, role || "petugas");
    res.json({
      id: result.lastInsertRowid,
      message: "User berhasil ditambahkan",
    });
  } catch (e) {
    res.status(400).json({ message: "Email sudah terdaftar" });
  }
});

// PUT /api/users/:id
app.put("/api/users/:id", authMiddleware, (req, res) => {
  if (req.user.role !== "admin")
    return res
      .status(403)
      .json({ message: "Hanya admin yang bisa mengubah user" });
  const { nama, email, role, password } = req.body;
  const id = req.params.id;
  try {
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare(
        "UPDATE users SET nama=?, email=?, role=?, password=? WHERE id=?",
      ).run(nama, email, role, hash, id);
    } else {
      db.prepare("UPDATE users SET nama=?, email=?, role=? WHERE id=?").run(
        nama,
        email,
        role,
        id,
      );
    }
    res.json({ message: "User berhasil diperbarui" });
  } catch (e) {
    res.status(400).json({ message: "Email sudah digunakan" });
  }
});

// DELETE /api/users/:id
app.delete("/api/users/:id", authMiddleware, (req, res) => {
  if (req.user.role !== "admin")
    return res
      .status(403)
      .json({ message: "Hanya admin yang bisa menghapus user" });
  if (req.params.id == req.user.id)
    return res
      .status(400)
      .json({ message: "Tidak bisa menghapus akun sendiri" });
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json({ message: "User berhasil dihapus" });
});

// ── BUKU ROUTES ───────────────────────────────────────────────

// GET /api/buku
app.get("/api/buku", authMiddleware, (req, res) => {
  const { search, kategori } = req.query;
  let query = "SELECT * FROM buku WHERE 1=1";
  const params = [];
  if (search) {
    query += " AND (judul LIKE ? OR pengarang LIKE ? OR isbn LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (kategori) {
    query += " AND kategori = ?";
    params.push(kategori);
  }
  query += " ORDER BY id DESC";
  const buku = db.prepare(query).all(...params);
  res.json(buku);
});

// GET /api/buku/stats
app.get("/api/buku/stats", authMiddleware, (req, res) => {
  const totalBuku = db
    .prepare("SELECT COUNT(*) as count FROM buku")
    .get().count;
  const totalStok =
    db.prepare("SELECT SUM(stok) as total FROM buku").get().total || 0;
  const totalKategori = db
    .prepare("SELECT COUNT(DISTINCT kategori) as count FROM buku")
    .get().count;
  const totalUser = db
    .prepare("SELECT COUNT(*) as count FROM users")
    .get().count;
  res.json({ totalBuku, totalStok, totalKategori, totalUser });
});

// GET /api/buku/:id
app.get("/api/buku/:id", authMiddleware, (req, res) => {
  const buku = db.prepare("SELECT * FROM buku WHERE id = ?").get(req.params.id);
  if (!buku) return res.status(404).json({ message: "Buku tidak ditemukan" });
  res.json(buku);
});

// POST /api/buku
app.post("/api/buku", authMiddleware, (req, res) => {
  const {
    judul,
    pengarang,
    penerbit,
    tahun_terbit,
    isbn,
    kategori,
    stok,
    deskripsi,
  } = req.body;
  if (!judul || !pengarang || !penerbit || !tahun_terbit || !kategori) {
    return res.status(400).json({
      message:
        "Field wajib: judul, pengarang, penerbit, tahun_terbit, kategori",
    });
  }
  try {
    const result = db
      .prepare(
        "INSERT INTO buku (judul, pengarang, penerbit, tahun_terbit, isbn, kategori, stok, deskripsi) VALUES (?,?,?,?,?,?,?,?)",
      )
      .run(
        judul,
        pengarang,
        penerbit,
        tahun_terbit,
        isbn || null,
        kategori,
        stok || 0,
        deskripsi || null,
      );
    res.json({
      id: result.lastInsertRowid,
      message: "Buku berhasil ditambahkan",
    });
  } catch (e) {
    res.status(400).json({ message: "ISBN sudah terdaftar" });
  }
});

// PUT /api/buku/:id
app.put("/api/buku/:id", authMiddleware, (req, res) => {
  const {
    judul,
    pengarang,
    penerbit,
    tahun_terbit,
    isbn,
    kategori,
    stok,
    deskripsi,
  } = req.body;
  try {
    db.prepare(
      "UPDATE buku SET judul=?, pengarang=?, penerbit=?, tahun_terbit=?, isbn=?, kategori=?, stok=?, deskripsi=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
    ).run(
      judul,
      pengarang,
      penerbit,
      tahun_terbit,
      isbn || null,
      kategori,
      stok || 0,
      deskripsi || null,
      req.params.id,
    );
    res.json({ message: "Buku berhasil diperbarui" });
  } catch (e) {
    res.status(400).json({ message: "ISBN sudah digunakan buku lain" });
  }
});

// DELETE /api/buku/:id
app.delete("/api/buku/:id", authMiddleware, (req, res) => {
  db.prepare("DELETE FROM buku WHERE id = ?").run(req.params.id);
  res.json({ message: "Buku berhasil dihapus" });
});

// ── Serve SPA ─────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
  console.log("📚 Sistem Manajemen Perpustakaan");
  console.log("─────────────────────────────────");
  console.log("Login default:");
  console.log("  Admin   → admin@perpustakaan.com / admin123");
  console.log("  Petugas → irfan@perpustakaan.com / petugas123\n");
});
