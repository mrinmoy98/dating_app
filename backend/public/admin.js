/* Dating App — Admin Panel (vanilla JS, same-origin calls). */
(function () {
  const TOKEN_KEY = 'dating_admin_token';
  let page = 1, totalPages = 1;
  const $ = (id) => document.getElementById(id);

  // ---- API helper (same-origin, unwraps { success, data }) ----
  async function apiFetch(path, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(path, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 401) { logout(); throw new Error('Session expired'); }
    if (!res.ok || json.success === false) throw new Error(json.message || ('Request failed (' + res.status + ')'));
    return json; // { success, data, pagination? }
  }

  // ---- Auth ----
  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('loginBtn'); const err = $('loginError');
    err.textContent = ''; btn.disabled = true; btn.textContent = 'Signing in…';
    try {
      const json = await apiFetch('/admin/auth/login', {
        method: 'POST',
        body: { email: $('email').value.trim(), password: $('password').value },
      });
      const { token, admin } = json.data;
      localStorage.setItem(TOKEN_KEY, token);
      showApp(admin);
    } catch (e2) {
      err.textContent = e2.message;
    } finally {
      btn.disabled = false; btn.textContent = 'Sign in';
    }
  });

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    $('app').style.display = 'none';
    $('login').style.display = 'flex';
  }
  $('logoutBtn').addEventListener('click', logout);

  function showApp(admin) {
    $('login').style.display = 'none';
    $('app').style.display = 'block';
    $('adminName').textContent = admin.name || 'Admin';
    $('adminRole').textContent = admin.role || '';
    $('adminAv').textContent = (admin.name || 'A').charAt(0).toUpperCase();
    loadDashboard();
  }

  // ---- Nav ----
  document.querySelectorAll('.nav-item[data-view]').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      const v = b.dataset.view;
      document.querySelectorAll('.view').forEach((s) => s.classList.remove('active'));
      $('view-' + v).classList.add('active');
      $('pageTitle').textContent = v.charAt(0).toUpperCase() + v.slice(1);
      if (v === 'dashboard') loadDashboard();
      if (v === 'users') { page = 1; loadUsers(); }
    });
  });

  // ---- Dashboard ----
  async function loadDashboard() {
    try {
      const { data } = await apiFetch('/admin/users/stats');
      const cards = [
        { k: 'Total Users', v: data.totalUsers, accent: true },
        { k: 'Active', v: data.activeUsers },
        { k: 'Banned', v: data.bannedUsers },
        { k: 'Completed Profiles', v: data.completedProfiles },
        { k: 'New Today', v: data.newToday },
      ];
      $('statCards').innerHTML = cards.map((c) =>
        '<div class="card ' + (c.accent ? 'accent' : '') + '"><div class="k">' + c.k + '</div><div class="v">' + (c.v ?? 0) + '</div></div>'
      ).join('');
      const g = data.byGender || {};
      $('genderCards').innerHTML = Object.keys(g).map((key) =>
        '<div class="card"><div class="k">' + key + '</div><div class="v small">' + (g[key] ?? 0) + '</div></div>'
      ).join('');
    } catch (e) { console.error(e); }
  }

  // ---- Users ----
  let searchTimer;
  $('search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { page = 1; loadUsers(); }, 350); });
  $('statusFilter').addEventListener('change', () => { page = 1; loadUsers(); });
  $('genderFilter').addEventListener('change', () => { page = 1; loadUsers(); });
  $('prevBtn').addEventListener('click', () => { if (page > 1) { page--; loadUsers(); } });
  $('nextBtn').addEventListener('click', () => { if (page < totalPages) { page++; loadUsers(); } });

  function fmtDate(d) { if (!d) return '—'; const x = new Date(d); return isNaN(x) ? '—' : x.toLocaleDateString(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function avatar(u) {
    const url = (u.photos && u.photos[0] && u.photos[0].url) || '';
    const initial = esc((u.first_name || u.phone || '?').charAt(0).toUpperCase());
    return url ? '<img class="av" src="' + esc(url) + '" alt="" data-initial="' + initial + '" />'
               : '<div class="av">' + initial + '</div>';
  }

  async function loadUsers() {
    const q = new URLSearchParams({ page: String(page), limit: '12' });
    if ($('search').value.trim()) q.set('search', $('search').value.trim());
    if ($('statusFilter').value) q.set('status', $('statusFilter').value);
    if ($('genderFilter').value) q.set('gender', $('genderFilter').value);
    try {
      const json = await apiFetch('/admin/users?' + q.toString());
      const users = json.data || [];
      const pg = json.pagination || { page: 1, totalPages: 1, total: users.length };
      totalPages = pg.totalPages || 1;
      const body = $('usersBody');
      if (!users.length) {
        body.innerHTML = '<tr><td colspan="8"><div class="empty">No users found.</div></td></tr>';
      } else {
        body.innerHTML = users.map((u) =>
          '<tr>' +
            '<td><div class="u-cell">' + avatar(u) + '<div style="font-weight:600">' + esc(u.first_name || 'Unknown') + ' ' + esc(u.last_name || '') + '</div></div></td>' +
            '<td>' + esc((u.country_code || '') + (u.phone || '—')) + '</td>' +
            '<td>' + esc(u.email || '—') + '</td>' +
            '<td>' + esc(u.gender || '—') + '</td>' +
            '<td>' + esc((u.address && u.address.city) || u.location || '—') + '</td>' +
            '<td><span class="badge ' + (u.status === 'banned' ? 'banned' : 'active') + '">' + esc(u.status || 'active') + '</span></td>' +
            '<td>' + fmtDate(u.created_at) + '</td>' +
            '<td><div class="act">' +
              (u.status === 'banned'
                ? '<button class="activate" data-act="activate" data-id="' + u._id + '">Activate</button>'
                : '<button class="ban" data-act="ban" data-id="' + u._id + '">Ban</button>') +
              '<button class="del" data-act="del" data-id="' + u._id + '" data-name="' + esc(u.first_name || 'this user') + '">Delete</button>' +
            '</div></td>' +
          '</tr>'
        ).join('');
        // Fallback avatar (no inline handlers, CSP-safe).
        body.querySelectorAll('img.av').forEach((img) => {
          img.onerror = () => {
            const d = document.createElement('div');
            d.className = 'av';
            d.textContent = img.dataset.initial || '?';
            img.replaceWith(d);
          };
        });
      }
      $('pagerInfo').textContent = 'Page ' + pg.page + ' of ' + pg.totalPages + ' · ' + pg.total + ' users';
      $('prevBtn').disabled = pg.page <= 1;
      $('nextBtn').disabled = pg.page >= pg.totalPages;
      bindRowActions();
    } catch (e) { console.error(e); }
  }

  function bindRowActions() {
    document.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id, act = btn.dataset.act;
        try {
          if (act === 'ban' || act === 'activate') {
            await apiFetch('/admin/users/' + id + '/status', { method: 'PATCH', body: { status: act === 'ban' ? 'banned' : 'active' } });
          } else if (act === 'del') {
            if (!confirm('Delete ' + btn.dataset.name + '? This cannot be undone.')) return;
            await apiFetch('/admin/users/' + id, { method: 'DELETE' });
          }
          loadUsers();
          loadDashboard();
        } catch (e) { alert(e.message); }
      });
    });
  }

  // ---- Boot: restore session ----
  (async function boot() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const { data } = await apiFetch('/admin/auth/me');
      showApp(data);
    } catch (e) { logout(); }
  })();
})();
