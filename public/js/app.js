// ============================================================
// app.js — BiblioTech SPA
// JWT Auth + CRUD + Welcome Modal (Admin & Petugas)
// ============================================================

const API = "/api";
let currentUser = null;
let searchTimer = null;

// ── Token ─────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("token");
}
function setToken(t) {
  localStorage.setItem("token", t);
}
function removeToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

// ── API Helper ────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Terjadi kesalahan");
  return data;
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => {
    t.className = "toast";
  }, 3500);
}

// ── Modals ────────────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (id === "modal-confirm") {
    el.style.display = "flex";
  } else {
    el.classList.add("open");
  }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (id === "modal-confirm") {
    el.style.display = "none";
  } else {
    el.classList.remove("open");
  }
}

// ── Sidebar ───────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  const ov = document.getElementById("sidebar-overlay");
  if (ov) ov.classList.toggle("show");
}

// ── Navigate ──────────────────────────────────────────────────
function navigate(page) {
  document
    .querySelectorAll(".content-section")
    .forEach((s) => s.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  const section = document.getElementById("section-" + page);
  if (section) section.classList.add("active");

  const navItem = document.querySelector(`[data-page="${page}"]`);
  if (navItem) navItem.classList.add("active");

  const titles = {
    dashboard: "Dashboard",
    buku: "Data Buku",
    users: "Data Pengguna",
  };
  document.getElementById("topbar-title").textContent = titles[page] || page;

  if (page === "dashboard") loadDashboard();
  if (page === "buku") loadBuku();
  if (page === "users") loadUsers();

  document.getElementById("sidebar").classList.remove("open");
  const ov = document.getElementById("sidebar-overlay");
  if (ov) ov.classList.remove("show");
}

// ══════════════════════════════════════════════════════════════
// WELCOME MODAL — INTERAKSI SELAMAT DATANG
// ══════════════════════════════════════════════════════════════
function showWelcome(user) {
  const modal = document.getElementById("modal-welcome");
  const header = document.getElementById("welcome-header");
  const greeting = document.getElementById("welcome-greeting");
  const timeEl = document.getElementById("welcome-time");
  const itemsEl = document.getElementById("welcome-items");

  const inisial = user.nama.charAt(0).toUpperCase();
  const isAdmin = user.role === "admin";

  // ── Waktu Sapaan ──
  const hour = new Date().getHours();
  let sapaan = "Selamat Malam";
  if (hour >= 5 && hour < 11) sapaan = "Selamat Pagi";
  if (hour >= 11 && hour < 15) sapaan = "Selamat Siang";
  if (hour >= 15 && hour < 19) sapaan = "Selamat Sore";

  // ── Tanggal & Waktu ──
  const now = new Date();
  const tgl = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const jam = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ── Header berbeda Admin vs Petugas ──
  if (isAdmin) {
    header.innerHTML = `
      <div class="welcome-header-admin">
        <div class="welcome-avatar">${inisial}</div>
        <h2>${sapaan}, ${user.nama.split(" ")[0]}!</h2>
        <p class="welcome-subtitle">Anda masuk sebagai Administrator</p>
        <span class="welcome-role-badge">Admin</span>
      </div>
    `;
    greeting.innerHTML = `
      Anda memiliki akses <strong>penuh</strong> ke seluruh fitur sistem.
      Kelola buku, pengguna, dan pantau statistik perpustakaan hari ini.
    `;
    itemsEl.innerHTML = `
      <div class="welcome-item">
        <div class="welcome-item-icon wi-sage">📚</div>
        <div><strong>Koleksi Buku</strong> — Tambah, edit, hapus data buku</div>
      </div>
      <div class="welcome-item">
        <div class="welcome-item-icon wi-blue">👥</div>
        <div><strong>Kelola Pengguna</strong> — Tambah & atur akun petugas</div>
      </div>
      <div class="welcome-item">
        <div class="welcome-item-icon wi-terra">📊</div>
        <div><strong>Statistik</strong> — Pantau data & stok buku</div>
      </div>
    `;
  } else {
    header.innerHTML = `
      <div class="welcome-header-petugas">
        <div class="welcome-avatar">${inisial}</div>
        <h2>${sapaan}, ${user.nama.split(" ")[0]}!</h2>
        <p class="welcome-subtitle">Anda masuk sebagai Petugas</p>
        <span class="welcome-role-badge">📋 Petugas</span>
      </div>
    `;
    greeting.innerHTML = `
      Selamat bertugas! Anda dapat mengelola <strong>koleksi buku</strong>
      perpustakaan. Pastikan data selalu diperbarui dengan benar.
    `;
    itemsEl.innerHTML = `
      <div class="welcome-item">
        <div class="welcome-item-icon wi-sage">📚</div>
        <div><strong>Data Buku</strong> — Tambah, edit, dan hapus buku</div>
      </div>
      <div class="welcome-item">
        <div class="welcome-item-icon wi-gold">📊</div>
        <div><strong>Dashboard</strong> — Lihat statistik dan stok buku</div>
      </div>
      <div class="welcome-item">
        <div class="welcome-item-icon wi-terra">ℹ️</div>
        <div><strong>Info</strong> — Manajemen pengguna hanya untuk Admin</div>
      </div>
    `;
  }

  timeEl.innerHTML = `<span>🕐</span> ${tgl} · ${jam}`;

  modal.style.display = "flex";

  // Auto tutup setelah 8 detik
  setTimeout(() => closeWelcome(), 8000);
}

function closeWelcome() {
  const modal = document.getElementById("modal-welcome");
  modal.style.opacity = "0";
  modal.style.transition = "opacity 0.3s ease";
  setTimeout(() => {
    modal.style.display = "none";
    modal.style.opacity = "";
  }, 300);
}

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════
function togglePw() {
  const inp = document.getElementById("login-password");
  inp.type = inp.type === "password" ? "text" : "password";
}

document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = document.getElementById("login-error");
  err.style.display = "none";
  const btn = document.getElementById("btn-login");
  btn.disabled = true;
  btn.textContent = "Memproses...";

  try {
    const data = await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value,
      }),
    }).then((r) => r.json());

    if (data.token) {
      setToken(data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      currentUser = data.user;
      initDashboard(true); // true = tampilkan welcome
    } else {
      throw new Error(data.message || "Login gagal");
    }
  } catch (ex) {
    err.textContent = ex.message;
    err.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Masuk";
  }
});

function logout() {
  removeToken();
  currentUser = null;
  document.getElementById("page-login").classList.add("active");
  document.getElementById("page-dashboard").classList.remove("active");
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";
}

function initDashboard(showWelcomeModal = false) {
  document.getElementById("page-login").classList.remove("active");
  document.getElementById("page-dashboard").classList.add("active");

  const u = currentUser;

  // Set avatar dengan warna sesuai role
  const avatarEl = document.getElementById("nav-avatar");
  avatarEl.textContent = u.nama.charAt(0).toUpperCase();
  avatarEl.className = `user-avatar ${u.role === "admin" ? "avatar-admin" : "avatar-petugas"}`;

  document.getElementById("nav-name").textContent = u.nama;
  document.getElementById("nav-role").textContent =
    u.role === "admin" ? "Administrator" : "📋 Petugas";
  document.getElementById("topbar-user").textContent =
    `${u.nama.split(" ")[0]}`;

  // Sembunyikan menu admin untuk petugas
  document.querySelectorAll(".nav-admin").forEach((el) => {
    el.style.display = u.role === "admin" ? "" : "none";
  });

  navigate("dashboard");

  // Tampilkan welcome modal hanya saat login baru
  if (showWelcomeModal) {
    setTimeout(() => showWelcome(u), 400);
  }
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════
async function loadDashboard() {
  try {
    const stats = await api("GET", "/buku/stats");
    document.getElementById("stat-buku").textContent = stats.totalBuku;
    document.getElementById("stat-stok").textContent = stats.totalStok;
    document.getElementById("stat-kategori").textContent = stats.totalKategori;
    document.getElementById("stat-user").textContent = stats.totalUser;

    const buku = await api("GET", "/buku");
    const recent = buku.slice(0, 5);
    const container = document.getElementById("recent-buku-list");

    if (!recent.length) {
      container.innerHTML = '<div class="empty-row">Belum ada buku</div>';
    } else {
      container.innerHTML = recent
        .map(
          (b, i) => `
        <div class="recent-item">
          <div class="recent-no">${i + 1}</div>
          <div class="recent-info">
            <div class="recent-title">${esc(b.judul)}</div>
            <div class="recent-sub">${esc(b.pengarang)} · ${esc(b.kategori)}</div>
          </div>
          <span class="badge-stok ${b.stok > 2 ? "stok-ok" : b.stok > 0 ? "stok-low" : "stok-empty"}">${b.stok}</span>
        </div>
      `,
        )
        .join("");
    }

    const u = currentUser;
    document.getElementById("account-info").innerHTML = `
      <div class="info-row"><label>Nama Lengkap</label><span>${esc(u.nama)}</span></div>
      <div class="info-row"><label>Email</label><span>${esc(u.email)}</span></div>
      <div class="info-row"><label>Hak Akses</label>
        <span><span class="role-badge role-${u.role}">${u.role === "admin" ? "👑 Admin" : "📋 Petugas"}</span></span>
      </div>
      <div class="info-row"><label>Status</label><span style="color:var(--sage);font-weight:600">● Aktif</span></div>
    `;
  } catch (e) {
    console.error(e);
  }
}

// ══════════════════════════════════════════════════════════════
// BUKU CRUD
// ══════════════════════════════════════════════════════════════
async function loadBuku() {
  const search = document.getElementById("search-buku").value;
  const kategori = document.getElementById("filter-kategori").value;
  const tbody = document.getElementById("tbody-buku");
  tbody.innerHTML =
    '<tr><td colspan="7" class="loading-row">Memuat...</td></tr>';

  try {
    let url = "/buku?";
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (kategori) url += `kategori=${encodeURIComponent(kategori)}`;
    const data = await api("GET", url);

    if (!data.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="empty-row">📭 Tidak ada data buku ditemukan</td></tr>';
      return;
    }

    tbody.innerHTML = data
      .map(
        (b, i) => `
      <tr>
        <td style="color:var(--text-muted);font-size:12px">${i + 1}</td>
        <td>
          <div style="font-weight:600;color:var(--text)">${esc(b.judul)}</div>
          ${b.isbn ? `<div style="font-size:11px;color:var(--text-light);margin-top:2px">${esc(b.isbn)}</div>` : ""}
        </td>
        <td>${esc(b.pengarang)}</td>
        <td><span class="badge ${badgeKategori(b.kategori)}">${esc(b.kategori)}</span></td>
        <td>${b.tahun_terbit}</td>
        <td>
          <span class="stok-badge ${b.stok > 2 ? "stok-ok" : b.stok > 0 ? "stok-low" : "stok-empty"}">
            ${b.stok} ${b.stok === 0 ? "⚠️" : ""}
          </span>
        </td>
        <td>
          <div class="actions">
            <button class="btn-edit" onclick="editBuku(${b.id})">✏️ Edit</button>
            <button class="btn-del" onclick="confirmDelete('buku', ${b.id}, '${esc(b.judul)}')">🗑️ Hapus</button>
          </div>
        </td>
      </tr>
    `,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">Error: ${e.message}</td></tr>`;
  }
}

function badgeKategori(k) {
  const map = {
    Sastra: "badge-sastra",
    Sejarah: "badge-sejarah",
    Teknologi: "badge-teknologi",
    Ekonomi: "badge-ekonomi",
    "Pengembangan Diri": "badge-pd",
    Sains: "badge-sains",
    Agama: "badge-agama",
  };
  return map[k] || "badge-lain";
}

function debounceSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadBuku(), 350);
}

function openModalBuku() {
  document.getElementById("modal-buku-title").textContent = "Tambah Buku Baru";
  document.getElementById("form-buku").reset();
  document.getElementById("buku-id").value = "";
  document.getElementById("buku-stok").value = "0";
  document.getElementById("modal-buku-error").style.display = "none";
  openModal("modal-buku");
}

async function editBuku(id) {
  try {
    const b = await api("GET", `/buku/${id}`);
    document.getElementById("modal-buku-title").textContent = "Edit Buku";
    document.getElementById("buku-id").value = b.id;
    document.getElementById("buku-judul").value = b.judul;
    document.getElementById("buku-pengarang").value = b.pengarang;
    document.getElementById("buku-penerbit").value = b.penerbit;
    document.getElementById("buku-tahun").value = b.tahun_terbit;
    document.getElementById("buku-isbn").value = b.isbn || "";
    document.getElementById("buku-kategori").value = b.kategori;
    document.getElementById("buku-stok").value = b.stok;
    document.getElementById("buku-deskripsi").value = b.deskripsi || "";
    document.getElementById("modal-buku-error").style.display = "none";
    openModal("modal-buku");
  } catch (e) {
    showToast(e.message, "error");
  }
}

document.getElementById("form-buku").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = document.getElementById("modal-buku-error");
  err.style.display = "none";
  const id = document.getElementById("buku-id").value;
  const payload = {
    judul: document.getElementById("buku-judul").value,
    pengarang: document.getElementById("buku-pengarang").value,
    penerbit: document.getElementById("buku-penerbit").value,
    tahun_terbit: parseInt(document.getElementById("buku-tahun").value),
    isbn: document.getElementById("buku-isbn").value,
    kategori: document.getElementById("buku-kategori").value,
    stok: parseInt(document.getElementById("buku-stok").value) || 0,
    deskripsi: document.getElementById("buku-deskripsi").value,
  };
  const btn = document.getElementById("btn-submit-buku");
  btn.disabled = true;
  btn.textContent = "Menyimpan...";
  try {
    if (id) {
      await api("PUT", `/buku/${id}`, payload);
      showToast("✅ Buku berhasil diperbarui!");
    } else {
      await api("POST", "/buku", payload);
      showToast("✅ Buku berhasil ditambahkan!");
    }
    closeModal("modal-buku");
    loadBuku();
  } catch (ex) {
    err.textContent = ex.message;
    err.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Simpan";
  }
});

// ══════════════════════════════════════════════════════════════
// USERS CRUD
// ══════════════════════════════════════════════════════════════
async function loadUsers() {
  const tbody = document.getElementById("tbody-users");
  tbody.innerHTML =
    '<tr><td colspan="6" class="loading-row">Memuat...</td></tr>';
  try {
    const data = await api("GET", "/users");
    if (!data.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="empty-row">Tidak ada pengguna</td></tr>';
      return;
    }
    tbody.innerHTML = data
      .map(
        (u, i) => `
      <tr>
        <td style="color:var(--text-muted);font-size:12px">${i + 1}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:34px;height:34px;border-radius:50%;background:${u.role === "admin" ? "var(--navy)" : "var(--sage)"};color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;font-family:'Playfair Display',serif">${u.nama.charAt(0).toUpperCase()}</div>
            <span style="font-weight:600">${esc(u.nama)}</span>
          </div>
        </td>
        <td style="color:var(--text-muted)">${esc(u.email)}</td>
        <td><span class="role-badge role-${u.role}">${u.role === "admin" ? "👑 Admin" : "📋 Petugas"}</span></td>
        <td style="color:var(--text-muted);font-size:12px">${formatDate(u.created_at)}</td>
        <td>
          <div class="actions">
            ${
              currentUser.role === "admin"
                ? `
              <button class="btn-edit" onclick="editUser(${u.id})">✏️ Edit</button>
              <button class="btn-del" onclick="confirmDelete('user', ${u.id}, '${esc(u.nama)}')">🗑️ Hapus</button>
            `
                : '<span style="color:var(--text-light);font-size:12px">—</span>'
            }
          </div>
        </td>
      </tr>
    `,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Error: ${e.message}</td></tr>`;
  }
}

function openModalUser() {
  document.getElementById("modal-user-title").textContent = "Tambah Pengguna";
  document.getElementById("form-user").reset();
  document.getElementById("user-id").value = "";
  document.getElementById("pw-label").textContent = "Password *";
  document.getElementById("pw-hint").style.display = "none";
  document.getElementById("user-password").required = true;
  document.getElementById("modal-user-error").style.display = "none";
  openModal("modal-user");
}

async function editUser(id) {
  try {
    const users = await api("GET", "/users");
    const u = users.find((x) => x.id === id);
    if (!u) return;
    document.getElementById("modal-user-title").textContent = "Edit Pengguna";
    document.getElementById("user-id").value = u.id;
    document.getElementById("user-nama").value = u.nama;
    document.getElementById("user-email").value = u.email;
    document.getElementById("user-role").value = u.role;
    document.getElementById("user-password").value = "";
    document.getElementById("pw-label").textContent = "Password Baru";
    document.getElementById("pw-hint").style.display = "block";
    document.getElementById("user-password").required = false;
    document.getElementById("modal-user-error").style.display = "none";
    openModal("modal-user");
  } catch (e) {
    showToast(e.message, "error");
  }
}

document.getElementById("form-user").addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = document.getElementById("modal-user-error");
  err.style.display = "none";
  const id = document.getElementById("user-id").value;
  const payload = {
    nama: document.getElementById("user-nama").value,
    email: document.getElementById("user-email").value,
    role: document.getElementById("user-role").value,
    password: document.getElementById("user-password").value,
  };
  try {
    if (id) {
      await api("PUT", `/users/${id}`, payload);
      showToast("✅ Pengguna berhasil diperbarui!");
    } else {
      if (!payload.password) {
        err.textContent = "Password wajib diisi";
        err.style.display = "block";
        return;
      }
      await api("POST", "/users", payload);
      showToast("✅ Pengguna berhasil ditambahkan!");
    }
    closeModal("modal-user");
    loadUsers();
  } catch (ex) {
    err.textContent = ex.message;
    err.style.display = "block";
  }
});

// ── Delete Confirm ────────────────────────────────────────────
function confirmDelete(type, id, name) {
  const modal = document.getElementById("modal-confirm");
  document.getElementById("confirm-title").textContent =
    `Hapus ${type === "buku" ? "Buku" : "Pengguna"}`;
  document.getElementById("confirm-msg").textContent =
    `Yakin ingin menghapus "${name}"? Tindakan ini tidak bisa dibatalkan.`;
  modal.style.display = "flex";

  document.getElementById("btn-confirm-ok").onclick = async () => {
    modal.style.display = "none";
    try {
      if (type === "buku") {
        await api("DELETE", `/buku/${id}`);
        showToast("🗑️ Buku berhasil dihapus");
        loadBuku();
      } else {
        await api("DELETE", `/users/${id}`);
        showToast("🗑️ Pengguna berhasil dihapus");
        loadUsers();
      }
    } catch (ex) {
      showToast(ex.message, "error");
    }
  };
}

// ── Utilities ─────────────────────────────────────────────────
function esc(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Buat overlay untuk sidebar mobile
  let ov = document.createElement("div");
  ov.id = "sidebar-overlay";
  ov.className = "sidebar-overlay";
  ov.onclick = toggleSidebar;
  document.body.appendChild(ov);

  // Cek token yang tersimpan
  const token = getToken();
  const user = getStoredUser();
  if (token && user) {
    currentUser = user;
    fetch(API + "/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          currentUser = { ...user, ...data };
          initDashboard(false); // tidak tampilkan welcome jika auto-login
        } else {
          removeToken();
        }
      })
      .catch(() => removeToken());
  }
});
