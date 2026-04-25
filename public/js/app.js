// ============================================================
// app.js — BiblioTech SPA
// CRUD: buku, peminjaman, users + JWT Auth + Welcome Modal
// ============================================================

const API = '/api';
let currentUser = null;
let searchTimers = {};

// ── Token ─────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('token');
const setToken = t => localStorage.setItem('token', t);
const removeToken = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); };
const getStoredUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };

// ── API Helper ────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan');
  return data;
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.className = 'toast', 3500);
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  id === 'modal-confirm' ? (el.style.display = 'flex') : el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  id === 'modal-confirm' ? (el.style.display = 'none') : el.classList.remove('open');
}

// ── Sidebar ───────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay')?.classList.toggle('show');
}

// ── Navigate ──────────────────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('section-' + page)?.classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  document.getElementById('topbar-title').textContent =
    { dashboard: 'Dashboard', buku: 'Data Buku', peminjaman: 'Peminjaman', users: 'Data Pengguna' }[page] || page;
  if (page === 'dashboard')  loadDashboard();
  if (page === 'buku')       loadBuku();
  if (page === 'peminjaman') loadPeminjaman();
  if (page === 'users')      loadUsers();
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');
}

// ── Debounce ──────────────────────────────────────────────────
function debounceSearch(key) {
  clearTimeout(searchTimers[key]);
  searchTimers[key] = setTimeout(() => key === 'buku' ? loadBuku() : loadPeminjaman(), 350);
}

// ── Escape ────────────────────────────────────────────────────
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}

// ══════════════════════════════════════════════════════════════
// WELCOME MODAL
// ══════════════════════════════════════════════════════════════
function showWelcome(user) {
  const modal = document.getElementById('modal-welcome');
  const isAdmin = user.role === 'admin';
  const inisial = user.nama.charAt(0).toUpperCase();
  const hour = new Date().getHours();
  const sapaan = hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 19 ? 'Selamat Sore' : 'Selamat Malam';
  const now = new Date();
  const tgl = now.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  const jam = now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

  document.getElementById('welcome-header').innerHTML = isAdmin ? `
    <div class="welcome-header-admin">
      <div class="welcome-avatar">${inisial}</div>
      <h2>${sapaan}, ${user.nama.split(' ')[0]}!</h2>
      <p class="welcome-subtitle">Anda masuk sebagai Administrator</p>
      <span class="welcome-role-badge">👑 Admin</span>
    </div>` : `
    <div class="welcome-header-petugas">
      <div class="welcome-avatar">${inisial}</div>
      <h2>${sapaan}, ${user.nama.split(' ')[0]}!</h2>
      <p class="welcome-subtitle">Anda masuk sebagai Petugas</p>
      <span class="welcome-role-badge">📋 Petugas</span>
    </div>`;

  document.getElementById('welcome-greeting').innerHTML = isAdmin
    ? `Anda memiliki akses <strong>penuh</strong> ke seluruh fitur sistem. Kelola buku, peminjaman, dan pengguna perpustakaan hari ini.`
    : `Selamat bertugas! Anda dapat mengelola <strong>data buku</strong> dan mencatat <strong>transaksi peminjaman</strong> buku.`;

  document.getElementById('welcome-time').innerHTML = `<span>🕐</span> ${tgl} · ${jam}`;

  document.getElementById('welcome-items').innerHTML = isAdmin ? `
    <div class="welcome-item"><div class="welcome-item-icon wi-sage">📖</div><div><strong>Koleksi Buku</strong> — Tambah, edit, hapus data buku</div></div>
    <div class="welcome-item"><div class="welcome-item-icon wi-terra">📋</div><div><strong>Peminjaman</strong> — Catat & kelola transaksi peminjaman</div></div>
    <div class="welcome-item"><div class="welcome-item-icon wi-blue">👥</div><div><strong>Pengguna</strong> — Atur akun admin & petugas</div></div>` : `
    <div class="welcome-item"><div class="welcome-item-icon wi-sage">📖</div><div><strong>Data Buku</strong> — Tambah, edit, dan hapus buku</div></div>
    <div class="welcome-item"><div class="welcome-item-icon wi-terra">📋</div><div><strong>Peminjaman</strong> — Catat peminjaman & pengembalian buku</div></div>
    <div class="welcome-item"><div class="welcome-item-icon wi-gold">📊</div><div><strong>Dashboard</strong> — Pantau statistik dan stok buku</div></div>`;

  modal.style.display = 'flex';
  setTimeout(() => closeWelcome(), 9000);
}

function closeWelcome() {
  const m = document.getElementById('modal-welcome');
  m.style.opacity = '0';
  m.style.transition = 'opacity 0.3s';
  setTimeout(() => { m.style.display = 'none'; m.style.opacity = ''; }, 300);
}

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════
function togglePw() {
  const i = document.getElementById('login-password');
  i.type = i.type === 'password' ? 'text' : 'password';
}

document.getElementById('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const err = document.getElementById('login-error');
  err.style.display = 'none';
  const btn = document.getElementById('btn-login');
  btn.disabled = true; btn.textContent = 'Memproses...';
  try {
    const data = await fetch(API + '/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('login-email').value, password: document.getElementById('login-password').value })
    }).then(r => r.json());
    if (data.token) {
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      currentUser = data.user;
      initDashboard(true);
    } else throw new Error(data.message || 'Login gagal');
  } catch (ex) { err.textContent = ex.message; err.style.display = 'block'; }
  finally { btn.disabled = false; btn.textContent = 'Masuk'; }
});

function logout() {
  removeToken(); currentUser = null;
  document.getElementById('page-login').classList.add('active');
  document.getElementById('page-dashboard').classList.remove('active');
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
}

function initDashboard(showWelcomeModal = false) {
  document.getElementById('page-login').classList.remove('active');
  document.getElementById('page-dashboard').classList.add('active');
  const u = currentUser;
  const av = document.getElementById('nav-avatar');
  av.textContent = u.nama.charAt(0).toUpperCase();
  av.className = `user-avatar ${u.role === 'admin' ? 'avatar-admin' : 'avatar-petugas'}`;
  document.getElementById('nav-name').textContent = u.nama;
  document.getElementById('nav-role').textContent = u.role === 'admin' ? '👑 Administrator' : '📋 Petugas';
  document.getElementById('topbar-user').textContent = u.nama.split(' ')[0];
  document.querySelectorAll('.nav-admin').forEach(el => el.style.display = u.role === 'admin' ? '' : 'none');
  navigate('dashboard');
  if (showWelcomeModal) setTimeout(() => showWelcome(u), 400);
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
async function loadDashboard() {
  try {
    const stats = await api('GET', '/buku/stats');
    document.getElementById('stat-buku').textContent      = stats.totalBuku;
    document.getElementById('stat-stok').textContent      = stats.totalStok;
    document.getElementById('stat-pinjam').textContent    = stats.totalPinjam;
    document.getElementById('stat-terlambat').textContent = stats.totalTerlambat;

    // Recent peminjaman
    const pinjamList = await api('GET', '/peminjaman?');
    const recent = pinjamList.slice(0, 5);
    const cont = document.getElementById('recent-pinjam-list');
    cont.innerHTML = recent.length ? recent.map((p, i) => {
      const terlambat = p.status === 'dipinjam' && new Date(p.tanggal_kembali) < new Date();
      return `<div class="recent-item">
        <div class="recent-no">${i + 1}</div>
        <div class="recent-info">
          <div class="recent-title">${esc(p.nama_peminjam)} <small style="color:var(--text-light)">(${esc(p.no_anggota)})</small></div>
          <div class="recent-sub">${esc(p.judul_buku)}</div>
        </div>
        <span class="badge-stok ${p.status==='dikembalikan'?'stok-ok':terlambat?'stok-empty':'stok-low'}">${p.status==='dikembalikan'?'✅':'📖'}</span>
      </div>`;
    }).join('') : '<div class="empty-row">Belum ada peminjaman</div>';

    const u = currentUser;
    document.getElementById('account-info').innerHTML = `
      <div class="info-row"><label>Nama</label><span>${esc(u.nama)}</span></div>
      <div class="info-row"><label>Email</label><span>${esc(u.email)}</span></div>
      <div class="info-row"><label>Role</label><span class="role-badge role-${u.role}">${u.role==='admin'?'👑 Admin':'📋 Petugas'}</span></div>
      <div class="info-row"><label>Status</label><span style="color:var(--sage);font-weight:600">● Aktif</span></div>`;
  } catch(e) { console.error(e); }
}

// ══════════════════════════════════════════════════════════════
// BUKU CRUD
// ══════════════════════════════════════════════════════════════
async function loadBuku() {
  const search   = document.getElementById('search-buku').value;
  const kategori = document.getElementById('filter-kategori').value;
  const tbody    = document.getElementById('tbody-buku');
  tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Memuat...</td></tr>';
  try {
    let url = '/buku?';
    if (search)   url += `search=${encodeURIComponent(search)}&`;
    if (kategori) url += `kategori=${encodeURIComponent(kategori)}`;
    const data = await api('GET', url);
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">📭 Tidak ada data buku</td></tr>'; return; }
    tbody.innerHTML = data.map((b, i) => `<tr>
      <td style="color:var(--text-muted);font-size:12px">${i+1}</td>
      <td><div style="font-weight:600">${esc(b.judul)}</div>${b.isbn?`<div style="font-size:11px;color:var(--text-light)">${esc(b.isbn)}</div>`:''}</td>
      <td>${esc(b.pengarang)}</td>
      <td><span class="badge ${badgeKat(b.kategori)}">${esc(b.kategori)}</span></td>
      <td>${b.tahun_terbit}</td>
      <td><span class="stok-badge ${b.stok>2?'stok-ok':b.stok>0?'stok-low':'stok-empty'}">${b.stok}${b.stok===0?' ⚠️':''}</span></td>
      <td><div class="actions">
        <button class="btn-edit" onclick="editBuku(${b.id})">✏️ Edit</button>
        <button class="btn-del" onclick="confirmAct('buku-del',${b.id},'${esc(b.judul)}')">🗑️ Hapus</button>
      </div></td>
    </tr>`).join('');
  } catch(e) { tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Error: ${e.message}</td></tr>`; }
}

function badgeKat(k) {
  return ({Sastra:'badge-sastra',Sejarah:'badge-sejarah',Teknologi:'badge-teknologi',
    Ekonomi:'badge-ekonomi','Pengembangan Diri':'badge-pd',Sains:'badge-sains',Agama:'badge-agama'})[k]||'badge-lain';
}

function openModalBuku() {
  document.getElementById('modal-buku-title').textContent = 'Tambah Buku Baru';
  document.getElementById('form-buku').reset();
  document.getElementById('buku-id').value = '';
  document.getElementById('buku-stok').value = 0;
  document.getElementById('modal-buku-error').style.display = 'none';
  openModal('modal-buku');
}

async function editBuku(id) {
  try {
    const b = await api('GET', `/buku/${id}`);
    document.getElementById('modal-buku-title').textContent = 'Edit Buku';
    ['id','judul','pengarang','penerbit','isbn','kategori','stok','deskripsi'].forEach(f => {
      const el = document.getElementById('buku-' + f);
      if (el) el.value = b[f==='id'?'id':f] ?? '';
    });
    document.getElementById('buku-tahun').value = b.tahun_terbit;
    document.getElementById('modal-buku-error').style.display = 'none';
    openModal('modal-buku');
  } catch(e) { showToast(e.message, 'error'); }
}

document.getElementById('form-buku').addEventListener('submit', async e => {
  e.preventDefault();
  const err = document.getElementById('modal-buku-error');
  err.style.display = 'none';
  const id = document.getElementById('buku-id').value;
  const payload = {
    judul: document.getElementById('buku-judul').value,
    pengarang: document.getElementById('buku-pengarang').value,
    penerbit: document.getElementById('buku-penerbit').value,
    tahun_terbit: parseInt(document.getElementById('buku-tahun').value),
    isbn: document.getElementById('buku-isbn').value,
    kategori: document.getElementById('buku-kategori').value,
    stok: parseInt(document.getElementById('buku-stok').value)||0,
    deskripsi: document.getElementById('buku-deskripsi').value,
  };
  const btn = document.getElementById('btn-submit-buku');
  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try {
    if (id) { await api('PUT', `/buku/${id}`, payload); showToast('✅ Buku berhasil diperbarui!'); }
    else     { await api('POST', '/buku', payload);      showToast('✅ Buku berhasil ditambahkan!'); }
    closeModal('modal-buku'); loadBuku();
  } catch(ex) { err.textContent = ex.message; err.style.display = 'block'; }
  finally { btn.disabled = false; btn.textContent = 'Simpan'; }
});

// ══════════════════════════════════════════════════════════════
// PEMINJAMAN CRUD  ← TABEL BARU
// ══════════════════════════════════════════════════════════════
async function loadPeminjaman() {
  const search = document.getElementById('search-pinjam').value;
  const status = document.getElementById('filter-status').value;
  const tbody  = document.getElementById('tbody-pinjam');
  tbody.innerHTML = '<tr><td colspan="7" class="loading-row">Memuat...</td></tr>';
  try {
    let url = '/peminjaman?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (status) url += `status=${encodeURIComponent(status)}`;
    const data = await api('GET', url);
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-row">📭 Tidak ada data peminjaman</td></tr>'; return; }

    tbody.innerHTML = data.map((p, i) => {
      const terlambat = p.status === 'dipinjam' && new Date(p.tanggal_kembali) < new Date();
      const statusBadge = p.status === 'dikembalikan'
        ? `<span class="badge badge-ekonomi">✅ Dikembalikan</span>`
        : terlambat
          ? `<span class="badge badge-agama">⚠️ Terlambat</span>`
          : `<span class="badge badge-teknologi">📖 Dipinjam</span>`;
      return `<tr>
        <td style="color:var(--text-muted);font-size:12px">${i+1}</td>
        <td>
          <div style="font-weight:600">${esc(p.nama_peminjam)}</div>
          <div style="font-size:11px;color:var(--text-light)">${esc(p.no_anggota)}</div>
        </td>
        <td><div style="font-weight:500">${esc(p.judul_buku)}</div><div style="font-size:11px;color:var(--text-light)">${esc(p.pengarang)}</div></td>
        <td>${fmtDate(p.tanggal_pinjam)}</td>
        <td${terlambat?' style="color:var(--red);font-weight:600"':''}>${fmtDate(p.tanggal_kembali)}</td>
        <td>${statusBadge}</td>
        <td><div class="actions">
          ${p.status==='dipinjam'?`<button class="btn-edit" style="background:var(--green-bg);color:var(--green);border-color:var(--green)" onclick="kembalikanBuku(${p.id},'${esc(p.judul_buku)}','${esc(p.nama_peminjam)}')">↩️ Kembalikan</button>`:''}
          <button class="btn-edit" onclick="editPeminjaman(${p.id})">✏️ Edit</button>
          <button class="btn-del" onclick="confirmAct('pinjam-del',${p.id},'${esc(p.nama_peminjam)}')">🗑️</button>
        </div></td>
      </tr>`;
    }).join('');
  } catch(e) { tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Error: ${e.message}</td></tr>`; }
}

async function openModalPeminjaman() {
  document.getElementById('modal-pinjam-title').textContent = 'Tambah Peminjaman';
  document.getElementById('form-pinjam').reset();
  document.getElementById('pinjam-id').value = '';
  document.getElementById('modal-pinjam-error').style.display = 'none';

  // Isi pilihan buku dari API
  await populasiBukuSelect();

  // Default tanggal hari ini + 7 hari
  const today = new Date().toISOString().split('T')[0];
  const next7 = new Date(Date.now() + 7*86400000).toISOString().split('T')[0];
  document.getElementById('pinjam-tgl-pinjam').value  = today;
  document.getElementById('pinjam-tgl-kembali').value = next7;

  openModal('modal-pinjam');
}

async function populasiBukuSelect(selectedId = null) {
  const sel = document.getElementById('pinjam-buku');
  try {
    const buku = await api('GET', '/buku?');
    sel.innerHTML = '<option value="">-- Pilih buku --</option>' +
      buku.map(b => `<option value="${b.id}" ${b.id==selectedId?'selected':''} ${b.stok<1&&!selectedId?'disabled':''}>
        ${esc(b.judul)} (Stok: ${b.stok})
      </option>`).join('');
  } catch { sel.innerHTML = '<option value="">Gagal memuat buku</option>'; }
}

async function editPeminjaman(id) {
  try {
    const p = await api('GET', `/peminjaman/${id}`);
    document.getElementById('modal-pinjam-title').textContent = 'Edit Peminjaman';
    document.getElementById('pinjam-id').value = p.id;
    document.getElementById('pinjam-nama').value = p.nama_peminjam;
    document.getElementById('pinjam-no').value = p.no_anggota;
    document.getElementById('pinjam-tgl-pinjam').value = p.tanggal_pinjam;
    document.getElementById('pinjam-tgl-kembali').value = p.tanggal_kembali;
    document.getElementById('pinjam-catatan').value = p.catatan || '';
    document.getElementById('modal-pinjam-error').style.display = 'none';
    await populasiBukuSelect(p.buku_id);
    openModal('modal-pinjam');
  } catch(e) { showToast(e.message, 'error'); }
}

document.getElementById('form-pinjam').addEventListener('submit', async e => {
  e.preventDefault();
  const err = document.getElementById('modal-pinjam-error');
  err.style.display = 'none';
  const id = document.getElementById('pinjam-id').value;
  const payload = {
    nama_peminjam:   document.getElementById('pinjam-nama').value,
    no_anggota:      document.getElementById('pinjam-no').value,
    buku_id:         parseInt(document.getElementById('pinjam-buku').value),
    tanggal_pinjam:  document.getElementById('pinjam-tgl-pinjam').value,
    tanggal_kembali: document.getElementById('pinjam-tgl-kembali').value,
    catatan:         document.getElementById('pinjam-catatan').value,
  };
  const btn = document.getElementById('btn-submit-pinjam');
  btn.disabled = true; btn.textContent = 'Menyimpan...';
  try {
    if (id) { await api('PUT', `/peminjaman/${id}`, payload); showToast('✅ Data peminjaman diperbarui!'); }
    else     { await api('POST', '/peminjaman', payload);     showToast('✅ Peminjaman berhasil dicatat!'); }
    closeModal('modal-pinjam'); loadPeminjaman();
  } catch(ex) { err.textContent = ex.message; err.style.display = 'block'; }
  finally { btn.disabled = false; btn.textContent = 'Simpan'; }
});

function kembalikanBuku(id, judul, nama) {
  const modal = document.getElementById('modal-confirm');
  document.getElementById('confirm-icon').textContent = '↩️';
  document.getElementById('confirm-title').textContent = 'Kembalikan Buku';
  document.getElementById('confirm-msg').textContent = `Konfirmasi pengembalian buku "${judul}" oleh ${nama}?`;
  document.getElementById('btn-confirm-ok').textContent = 'Ya, Kembalikan';
  document.getElementById('btn-confirm-ok').className = 'btn-primary';
  modal.style.display = 'flex';
  document.getElementById('btn-confirm-ok').onclick = async () => {
    modal.style.display = 'none';
    try {
      await api('PATCH', `/peminjaman/${id}/kembalikan`);
      showToast('✅ Buku berhasil dikembalikan! Stok bertambah.');
      loadPeminjaman();
    } catch(ex) { showToast(ex.message, 'error'); }
  };
}

// ══════════════════════════════════════════════════════════════
// USERS CRUD
// ══════════════════════════════════════════════════════════════
async function loadUsers() {
  const tbody = document.getElementById('tbody-users');
  tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Memuat...</td></tr>';
  try {
    const data = await api('GET', '/users');
    if (!data.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-row">Tidak ada pengguna</td></tr>'; return; }
    tbody.innerHTML = data.map((u, i) => `<tr>
      <td style="color:var(--text-muted);font-size:12px">${i+1}</td>
      <td><div style="display:flex;align-items:center;gap:10px">
        <div style="width:32px;height:32px;border-radius:50%;background:${u.role==='admin'?'var(--navy)':'var(--sage)'};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0">${u.nama.charAt(0).toUpperCase()}</div>
        <span style="font-weight:600">${esc(u.nama)}</span>
      </div></td>
      <td style="color:var(--text-muted)">${esc(u.email)}</td>
      <td><span class="role-badge role-${u.role}">${u.role==='admin'?'👑 Admin':'📋 Petugas'}</span></td>
      <td style="color:var(--text-muted);font-size:12px">${fmtDate(u.created_at)}</td>
      <td><div class="actions">
        ${currentUser.role==='admin'?`
          <button class="btn-edit" onclick="editUser(${u.id})">✏️ Edit</button>
          <button class="btn-del" onclick="confirmAct('user-del',${u.id},'${esc(u.nama)}')">🗑️ Hapus</button>
        `:'<span style="color:var(--text-light);font-size:12px">—</span>'}
      </div></td>
    </tr>`).join('');
  } catch(e) { tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Error: ${e.message}</td></tr>`; }
}

function openModalUser() {
  document.getElementById('modal-user-title').textContent = 'Tambah Pengguna';
  document.getElementById('form-user').reset();
  document.getElementById('user-id').value = '';
  document.getElementById('pw-label').textContent = 'Password *';
  document.getElementById('pw-hint').style.display = 'none';
  document.getElementById('user-password').required = true;
  document.getElementById('modal-user-error').style.display = 'none';
  openModal('modal-user');
}

async function editUser(id) {
  try {
    const users = await api('GET', '/users');
    const u = users.find(x => x.id === id);
    if (!u) return;
    document.getElementById('modal-user-title').textContent = 'Edit Pengguna';
    document.getElementById('user-id').value    = u.id;
    document.getElementById('user-nama').value  = u.nama;
    document.getElementById('user-email').value = u.email;
    document.getElementById('user-role').value  = u.role;
    document.getElementById('user-password').value   = '';
    document.getElementById('user-password').required = false;
    document.getElementById('pw-label').textContent  = 'Password Baru';
    document.getElementById('pw-hint').style.display = 'block';
    document.getElementById('modal-user-error').style.display = 'none';
    openModal('modal-user');
  } catch(e) { showToast(e.message, 'error'); }
}

document.getElementById('form-user').addEventListener('submit', async e => {
  e.preventDefault();
  const err = document.getElementById('modal-user-error');
  err.style.display = 'none';
  const id = document.getElementById('user-id').value;
  const payload = {
    nama:     document.getElementById('user-nama').value,
    email:    document.getElementById('user-email').value,
    role:     document.getElementById('user-role').value,
    password: document.getElementById('user-password').value,
  };
  try {
    if (id) { await api('PUT', `/users/${id}`, payload); showToast('✅ Pengguna berhasil diperbarui!'); }
    else {
      if (!payload.password) { err.textContent = 'Password wajib diisi'; err.style.display = 'block'; return; }
      await api('POST', '/users', payload); showToast('✅ Pengguna berhasil ditambahkan!');
    }
    closeModal('modal-user'); loadUsers();
  } catch(ex) { err.textContent = ex.message; err.style.display = 'block'; }
});

// ── Confirm Generic ───────────────────────────────────────────
function confirmAct(type, id, name) {
  const modal = document.getElementById('modal-confirm');
  const labels = { 'buku-del':'Hapus Buku', 'pinjam-del':'Hapus Peminjaman', 'user-del':'Hapus Pengguna' };
  document.getElementById('confirm-icon').textContent = '⚠️';
  document.getElementById('confirm-title').textContent = labels[type] || 'Konfirmasi';
  document.getElementById('confirm-msg').textContent = `Yakin ingin menghapus "${name}"? Tindakan ini tidak bisa dibatalkan.`;
  document.getElementById('btn-confirm-ok').textContent = 'Ya, Hapus';
  document.getElementById('btn-confirm-ok').className = 'btn-danger';
  modal.style.display = 'flex';
  document.getElementById('btn-confirm-ok').onclick = async () => {
    modal.style.display = 'none';
    try {
      const routes = { 'buku-del': `/buku/${id}`, 'pinjam-del': `/peminjaman/${id}`, 'user-del': `/users/${id}` };
      await api('DELETE', routes[type]);
      showToast('🗑️ Data berhasil dihapus');
      if (type === 'buku-del')  loadBuku();
      if (type === 'pinjam-del') loadPeminjaman();
      if (type === 'user-del')  loadUsers();
    } catch(ex) { showToast(ex.message, 'error'); }
  };
}

// ── Init App ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Sidebar overlay mobile
  const ov = document.createElement('div');
  ov.id = 'sidebar-overlay'; ov.className = 'sidebar-overlay';
  ov.onclick = toggleSidebar;
  document.body.appendChild(ov);

  // Auto login dari token tersimpan
  const token = getToken(), user = getStoredUser();
  if (token && user) {
    currentUser = user;
    fetch(API + '/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.id) { currentUser = { ...user, ...d }; initDashboard(false); } else removeToken(); })
      .catch(() => removeToken());
  }
});
