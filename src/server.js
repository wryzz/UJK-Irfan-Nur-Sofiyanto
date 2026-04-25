// ============================================================
// src/server.js — Backend Express + SQLite + JWT
// Tabel: users, buku, peminjaman
// ============================================================
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const Database = require('better-sqlite3');
const cors    = require('cors');
const path    = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'perpustakaan_secret_key_2024_uas';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ── DATABASE ──────────────────────────────────────────────────
const dbPath = path.join(__dirname, '../database/perpustakaan.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    nama       TEXT    NOT NULL,
    email      TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    role       TEXT    NOT NULL DEFAULT 'petugas',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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

  CREATE TABLE IF NOT EXISTS peminjaman (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_peminjam   TEXT    NOT NULL,
    no_anggota      TEXT    NOT NULL,
    buku_id         INTEGER NOT NULL REFERENCES buku(id),
    tanggal_pinjam  DATE    NOT NULL,
    tanggal_kembali DATE    NOT NULL,
    tanggal_kembali_aktual DATE,
    status          TEXT    NOT NULL DEFAULT 'dipinjam',
    catatan         TEXT,
    petugas_id      INTEGER REFERENCES users(id),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// ── SEED ──────────────────────────────────────────────────────
const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin-irfan@perpustakaan.com');
if (!adminExists) {
  const h1 = bcrypt.hashSync('admin123', 10);
  const h2 = bcrypt.hashSync('irfan123', 10);
  db.prepare('INSERT INTO users (nama,email,password,role) VALUES (?,?,?,?)').run('Admin Irfan','admin-irfan@perpustakaan.com',h1,'admin');
  db.prepare('INSERT INTO users (nama,email,password,role) VALUES (?,?,?,?)').run('Irfan Nur Sofiyanto','irfan@perpustakaan.com',h2,'petugas');

  const seedBuku = [
    ['Bumi Manusia','Pramoedya Ananta Toer','Lentera Dipantara',2005,'978-979-97312-3-2','Sastra',5,'Novel pertama dari Tetralogi Buru.'],
    ['Laskar Pelangi','Andrea Hirata','Bentang Pustaka',2005,'978-979-1227-00-1','Sastra',8,'Kisah persahabatan 10 anak Belitung.'],
    ['Sapiens','Yuval Noah Harari','KPG',2017,'978-979-91-1083-0','Sejarah',3,'Eksplorasi sejarah manusia.'],
    ['Clean Code','Robert C. Martin','Prentice Hall',2008,'978-0-13-235088-4','Teknologi',4,'Panduan kode bersih.'],
    ['Atomic Habits','James Clear','Avery',2018,'978-0-7352-1129-2','Pengembangan Diri',6,'Cara membangun kebiasaan baik.'],
    ['The Alchemist','Paulo Coelho','HarperCollins',1988,'978-0-06-231500-7','Sastra',7,'Novel mengejar impian.'],
    ['Pemrograman Web PHP','Budi Raharjo','Informatika',2015,'978-602-1514-56-7','Teknologi',2,'Panduan lengkap PHP.'],
    ['Ekonomi Kreatif','Suryana','Salemba Empat',2013,'978-979-061-378-4','Ekonomi',3,'Konsep ekonomi kreatif.'],
  ];
  const ins = db.prepare('INSERT OR IGNORE INTO buku (judul,pengarang,penerbit,tahun_terbit,isbn,kategori,stok,deskripsi) VALUES (?,?,?,?,?,?,?,?)');
  seedBuku.forEach(b => ins.run(...b));

  // Seed peminjaman contoh
  const buku1 = db.prepare('SELECT id FROM buku LIMIT 1').get();
  const buku2 = db.prepare('SELECT id FROM buku LIMIT 1 OFFSET 1').get();
  const adm   = db.prepare('SELECT id FROM users WHERE role=?').get('admin');
  if (buku1 && buku2 && adm) {
    db.prepare(`INSERT INTO peminjaman (nama_peminjam,no_anggota,buku_id,tanggal_pinjam,tanggal_kembali,status,petugas_id)
                VALUES (?,?,?,date('now','-10 days'),date('now','+4 days'),'dipinjam',?)`)
      .run('Andi Pratama','ANG-001',buku1.id,adm.id);
    db.prepare(`INSERT INTO peminjaman (nama_peminjam,no_anggota,buku_id,tanggal_pinjam,tanggal_kembali,tanggal_kembali_aktual,status,petugas_id)
                VALUES (?,?,?,date('now','-20 days'),date('now','-6 days'),date('now','-7 days'),'dikembalikan',?)`)
      .run('Siti Rahayu','ANG-002',buku2.id,adm.id);
  }
}

// ── AUTH MIDDLEWARE ───────────────────────────────────────────
function auth(req, res, next) {
  const h = req.headers['authorization'];
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try { req.user = jwt.verify(h.split(' ')[1], JWT_SECRET); next(); }
  catch { res.status(401).json({ message: 'Token tidak valid atau kadaluarsa' }); }
}

// ══════════════════════════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════════════════════════
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email dan password wajib diisi' });
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ message: 'Email atau password salah' });
  const token = jwt.sign({ id:user.id, email:user.email, nama:user.nama, role:user.role }, JWT_SECRET, { expiresIn:'8h' });
  res.json({ token, user:{ id:user.id, nama:user.nama, email:user.email, role:user.role } });
});

app.get('/api/auth/me', auth, (req, res) => res.json(req.user));

// ══════════════════════════════════════════════════════════════
// USERS ROUTES
// ══════════════════════════════════════════════════════════════
app.get('/api/users', auth, (req, res) => {
  res.json(db.prepare('SELECT id,nama,email,role,created_at FROM users ORDER BY id').all());
});

app.post('/api/users', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Hanya admin' });
  const { nama, email, password, role } = req.body;
  if (!nama||!email||!password) return res.status(400).json({ message: 'Semua field wajib diisi' });
  try {
    const r = db.prepare('INSERT INTO users (nama,email,password,role) VALUES (?,?,?,?)').run(nama,email,bcrypt.hashSync(password,10),role||'petugas');
    res.json({ id:r.lastInsertRowid, message:'User berhasil ditambahkan' });
  } catch { res.status(400).json({ message:'Email sudah terdaftar' }); }
});

app.put('/api/users/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Hanya admin' });
  const { nama, email, role, password } = req.body;
  try {
    if (password) db.prepare('UPDATE users SET nama=?,email=?,role=?,password=? WHERE id=?').run(nama,email,role,bcrypt.hashSync(password,10),req.params.id);
    else          db.prepare('UPDATE users SET nama=?,email=?,role=? WHERE id=?').run(nama,email,role,req.params.id);
    res.json({ message:'User berhasil diperbarui' });
  } catch { res.status(400).json({ message:'Email sudah digunakan' }); }
});

app.delete('/api/users/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Hanya admin' });
  if (req.params.id == req.user.id) return res.status(400).json({ message:'Tidak bisa hapus akun sendiri' });
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ message:'User berhasil dihapus' });
});

// ══════════════════════════════════════════════════════════════
// BUKU ROUTES
// ══════════════════════════════════════════════════════════════
app.get('/api/buku', auth, (req, res) => {
  const { search, kategori } = req.query;
  let q = 'SELECT * FROM buku WHERE 1=1'; const p = [];
  if (search)   { q += ' AND (judul LIKE ? OR pengarang LIKE ? OR isbn LIKE ?)'; p.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  if (kategori) { q += ' AND kategori=?'; p.push(kategori); }
  res.json(db.prepare(q + ' ORDER BY id DESC').all(...p));
});

app.get('/api/buku/stats', auth, (req, res) => {
  const totalBuku      = db.prepare('SELECT COUNT(*) as c FROM buku').get().c;
  const totalStok      = db.prepare('SELECT SUM(stok) as c FROM buku').get().c || 0;
  const totalKategori  = db.prepare('SELECT COUNT(DISTINCT kategori) as c FROM buku').get().c;
  const totalUser      = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalPinjam    = db.prepare("SELECT COUNT(*) as c FROM peminjaman WHERE status='dipinjam'").get().c;
  const totalTerlambat = db.prepare("SELECT COUNT(*) as c FROM peminjaman WHERE status='dipinjam' AND tanggal_kembali < date('now')").get().c;
  res.json({ totalBuku, totalStok, totalKategori, totalUser, totalPinjam, totalTerlambat });
});

app.get('/api/buku/:id', auth, (req, res) => {
  const b = db.prepare('SELECT * FROM buku WHERE id=?').get(req.params.id);
  if (!b) return res.status(404).json({ message:'Buku tidak ditemukan' });
  res.json(b);
});

app.post('/api/buku', auth, (req, res) => {
  const { judul,pengarang,penerbit,tahun_terbit,isbn,kategori,stok,deskripsi } = req.body;
  if (!judul||!pengarang||!penerbit||!tahun_terbit||!kategori)
    return res.status(400).json({ message:'Field wajib: judul, pengarang, penerbit, tahun_terbit, kategori' });
  try {
    const r = db.prepare('INSERT INTO buku (judul,pengarang,penerbit,tahun_terbit,isbn,kategori,stok,deskripsi) VALUES (?,?,?,?,?,?,?,?)').run(judul,pengarang,penerbit,tahun_terbit,isbn||null,kategori,stok||0,deskripsi||null);
    res.json({ id:r.lastInsertRowid, message:'Buku berhasil ditambahkan' });
  } catch { res.status(400).json({ message:'ISBN sudah terdaftar' }); }
});

app.put('/api/buku/:id', auth, (req, res) => {
  const { judul,pengarang,penerbit,tahun_terbit,isbn,kategori,stok,deskripsi } = req.body;
  try {
    db.prepare('UPDATE buku SET judul=?,pengarang=?,penerbit=?,tahun_terbit=?,isbn=?,kategori=?,stok=?,deskripsi=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(judul,pengarang,penerbit,tahun_terbit,isbn||null,kategori,stok||0,deskripsi||null,req.params.id);
    res.json({ message:'Buku berhasil diperbarui' });
  } catch { res.status(400).json({ message:'ISBN sudah digunakan buku lain' }); }
});

app.delete('/api/buku/:id', auth, (req, res) => {
  db.prepare('DELETE FROM buku WHERE id=?').run(req.params.id);
  res.json({ message:'Buku berhasil dihapus' });
});

// ══════════════════════════════════════════════════════════════
// PEMINJAMAN ROUTES  ← TABEL BARU
// ══════════════════════════════════════════════════════════════

// GET /api/peminjaman — list dengan info buku
app.get('/api/peminjaman', auth, (req, res) => {
  const { status, search } = req.query;
  let q = `
    SELECT p.*, b.judul AS judul_buku, b.pengarang, u.nama AS nama_petugas
    FROM peminjaman p
    LEFT JOIN buku b ON p.buku_id = b.id
    LEFT JOIN users u ON p.petugas_id = u.id
    WHERE 1=1`;
  const params = [];
  if (status) { q += ' AND p.status=?'; params.push(status); }
  if (search) { q += ' AND (p.nama_peminjam LIKE ? OR p.no_anggota LIKE ? OR b.judul LIKE ?)'; params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  q += ' ORDER BY p.id DESC';
  res.json(db.prepare(q).all(...params));
});

// GET /api/peminjaman/:id
app.get('/api/peminjaman/:id', auth, (req, res) => {
  const p = db.prepare(`
    SELECT p.*, b.judul AS judul_buku
    FROM peminjaman p LEFT JOIN buku b ON p.buku_id=b.id
    WHERE p.id=?`).get(req.params.id);
  if (!p) return res.status(404).json({ message:'Data tidak ditemukan' });
  res.json(p);
});

// POST /api/peminjaman — tambah peminjaman
app.post('/api/peminjaman', auth, (req, res) => {
  const { nama_peminjam, no_anggota, buku_id, tanggal_pinjam, tanggal_kembali, catatan } = req.body;
  if (!nama_peminjam||!no_anggota||!buku_id||!tanggal_pinjam||!tanggal_kembali)
    return res.status(400).json({ message:'Semua field wajib diisi' });

  // Cek stok buku
  const buku = db.prepare('SELECT stok FROM buku WHERE id=?').get(buku_id);
  if (!buku) return res.status(404).json({ message:'Buku tidak ditemukan' });
  if (buku.stok < 1) return res.status(400).json({ message:'Stok buku habis, tidak bisa dipinjam' });

  try {
    const r = db.prepare(`INSERT INTO peminjaman (nama_peminjam,no_anggota,buku_id,tanggal_pinjam,tanggal_kembali,status,catatan,petugas_id)
                           VALUES (?,?,?,?,?,'dipinjam',?,?)`).run(nama_peminjam,no_anggota,buku_id,tanggal_pinjam,tanggal_kembali,catatan||null,req.user.id);
    // Kurangi stok
    db.prepare('UPDATE buku SET stok=stok-1 WHERE id=?').run(buku_id);
    res.json({ id:r.lastInsertRowid, message:'Peminjaman berhasil dicatat' });
  } catch(e) { res.status(500).json({ message:e.message }); }
});

// PUT /api/peminjaman/:id — edit data peminjaman
app.put('/api/peminjaman/:id', auth, (req, res) => {
  const { nama_peminjam, no_anggota, buku_id, tanggal_pinjam, tanggal_kembali, catatan } = req.body;
  try {
    db.prepare(`UPDATE peminjaman SET nama_peminjam=?,no_anggota=?,buku_id=?,tanggal_pinjam=?,tanggal_kembali=?,catatan=? WHERE id=?`)
      .run(nama_peminjam,no_anggota,buku_id,tanggal_pinjam,tanggal_kembali,catatan||null,req.params.id);
    res.json({ message:'Data peminjaman berhasil diperbarui' });
  } catch(e) { res.status(500).json({ message:e.message }); }
});

// PATCH /api/peminjaman/:id/kembalikan — kembalikan buku
app.patch('/api/peminjaman/:id/kembalikan', auth, (req, res) => {
  const pinjam = db.prepare('SELECT * FROM peminjaman WHERE id=?').get(req.params.id);
  if (!pinjam) return res.status(404).json({ message:'Data tidak ditemukan' });
  if (pinjam.status === 'dikembalikan') return res.status(400).json({ message:'Buku sudah dikembalikan' });
  const today = new Date().toISOString().split('T')[0];
  db.prepare("UPDATE peminjaman SET status='dikembalikan', tanggal_kembali_aktual=? WHERE id=?").run(today, req.params.id);
  // Kembalikan stok
  db.prepare('UPDATE buku SET stok=stok+1 WHERE id=?').run(pinjam.buku_id);
  res.json({ message:'Buku berhasil dikembalikan' });
});

// DELETE /api/peminjaman/:id
app.delete('/api/peminjaman/:id', auth, (req, res) => {
  const pinjam = db.prepare('SELECT * FROM peminjaman WHERE id=?').get(req.params.id);
  if (!pinjam) return res.status(404).json({ message:'Data tidak ditemukan' });
  // Kalau masih dipinjam, kembalikan stok
  if (pinjam.status === 'dipinjam')
    db.prepare('UPDATE buku SET stok=stok+1 WHERE id=?').run(pinjam.buku_id);
  db.prepare('DELETE FROM peminjaman WHERE id=?').run(req.params.id);
  res.json({ message:'Data peminjaman berhasil dihapus' });
});

// Serve SPA
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../public/index.html')));

app.listen(PORT, () => {
  console.log(`\n🚀 Server: http://localhost:${PORT}`);
  console.log('📚 BiblioTech — Sistem Manajemen Perpustakaan');
  console.log('─────────────────────────────────────────────');
  console.log('  Admin   → admin-irfan@perpustakaan.com  / admin123');
  console.log('  Petugas → irfan@perpustakaan.com        / irfan123\n');
});
