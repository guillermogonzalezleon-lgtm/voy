/* ============================================
   VOY — Admin App Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  buildAdminChart();
  buildCategoryBreakdown();
  loadPendingVerifPreview();
  loadRecentTransactions();
  loadVerificationsList();
  loadUsersTable();
  loadTransTable();
  loadCategoriesAdmin();
  loadConfigView();
});

/* ── Admin chart ────────────────────────── */
function buildAdminChart() {
  const el = document.getElementById('adminChart');
  if (!el) return;
  const months = [
    { m: 'Oct', v: 620 }, { m: 'Nov', v: 780 }, { m: 'Dic', v: 950 },
    { m: 'Ene', v: 840 }, { m: 'Feb', v: 1020 }, { m: 'Mar', v: 823, hl: true },
  ];
  const max = Math.max(...months.map(x => x.v));
  el.innerHTML = months.map(m => `
    <div class="admin-bar-wrap">
      <div style="font-size:9px;color:var(--gray-500);margin-bottom:2px;">${m.v}</div>
      <div class="admin-bar ${m.hl ? 'highlight' : ''}" style="height:${Math.round(m.v/max*100)}%;" title="${m.v} servicios"></div>
      <span class="admin-bar-label">${m.m}</span>
    </div>`).join('');
}

/* ── Category breakdown ─────────────────── */
function buildCategoryBreakdown() {
  const el = document.getElementById('categoryBreakdown');
  if (!el) return;
  const data = [
    { id: 'gasfiteria',   pct: 28 },
    { id: 'electricidad', pct: 22 },
    { id: 'limpieza',     pct: 18 },
    { id: 'belleza',      pct: 14 },
    { id: 'mecanica',     pct: 9  },
    { id: 'otros',        pct: 9  },
  ];
  el.innerHTML = data.map(d => {
    const cat = VOY_DATA.categories.find(c => c.id === d.id);
    const label = cat?.label ?? 'Otros';
    const color = cat?.color ?? 'var(--gray-400)';
    return `
    <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3);">
      <div style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></div>
      <span style="flex:1;font-size:var(--text-sm);color:var(--gray-700);">${label}</span>
      <div style="flex:2;height:6px;background:var(--gray-100);border-radius:4px;">
        <div style="height:6px;width:${d.pct}%;background:${color};border-radius:4px;"></div>
      </div>
      <span style="font-size:var(--text-xs);font-weight:600;color:var(--gray-500);min-width:28px;text-align:right;">${d.pct}%</span>
    </div>`;
  }).join('');
}

/* ── Pending verifications preview ─────── */
const pendingVerifs = [
  { id: 'VER-031', name: 'Marco Espinoza',  avatar: 'https://i.pravatar.cc/48?img=59', category: 'Electricidad', date: '10 Mar 2026', docs: ['Cédula', 'Foto perfil'], status: 'pending' },
  { id: 'VER-032', name: 'Lucía Castillo',  avatar: 'https://i.pravatar.cc/48?img=6',  category: 'Belleza',      date: '11 Mar 2026', docs: ['Cédula'], status: 'pending' },
  { id: 'VER-033', name: 'Gabriel Rivas',   avatar: 'https://i.pravatar.cc/48?img=63', category: 'Gasfitería',   date: '12 Mar 2026', docs: ['Cédula', 'Certificado'], status: 'pending' },
  { id: 'VER-034', name: 'Valentina Cruz',  avatar: 'https://i.pravatar.cc/48?img=36', category: 'Limpieza',     date: '12 Mar 2026', docs: ['Cédula', 'Foto perfil'], status: 'pending' },
];

function loadPendingVerifPreview() {
  const el = document.getElementById('pendingVerifPreview');
  if (!el) return;
  el.innerHTML = pendingVerifs.slice(0, 3).map(v => `
    <div style="display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) 0;border-bottom:1px solid var(--gray-100);">
      <img src="${v.avatar}" class="avatar avatar-sm" />
      <div style="flex:1;">
        <div style="font-size:var(--text-sm);font-weight:600;">${v.name}</div>
        <div style="font-size:var(--text-xs);color:var(--gray-400);">${v.category} · ${v.date}</div>
      </div>
      <div style="display:flex;gap:var(--sp-2);">
        <button class="btn btn-danger btn-sm" onclick="adminVerif('${v.id}','reject',this)" style="padding:3px 10px;font-size:11px;">✗</button>
        <button class="btn btn-success btn-sm" onclick="adminVerif('${v.id}','approve',this)" style="padding:3px 10px;font-size:11px;">✓</button>
      </div>
    </div>`).join('');
}

function loadVerificationsList() {
  const el = document.getElementById('verificationsList');
  if (!el) return;
  el.innerHTML = pendingVerifs.map(v => `
    <div class="approval-card new" id="verif-${v.id}">
      <div style="display:flex;align-items:flex-start;gap:var(--sp-4);flex-wrap:wrap;">
        <img src="${v.avatar}" class="avatar avatar-lg" />
        <div style="flex:1;min-width:200px;">
          <div style="font-size:var(--text-lg);font-weight:700;margin-bottom:var(--sp-1);">${v.name}</div>
          <div style="font-size:var(--text-sm);color:var(--gray-500);margin-bottom:var(--sp-3);">${v.category} · Solicitado: ${v.date}</div>
          <div style="display:flex;gap:var(--sp-2);flex-wrap:wrap;">
            ${v.docs.map(d => `
            <div style="display:flex;align-items:center;gap:var(--sp-2);padding:var(--sp-2) var(--sp-3);background:var(--gray-50);border-radius:var(--radius-lg);font-size:var(--text-xs);cursor:pointer;" onclick="VOY.showToast('Vista de documentos próximamente','info')">
              <i class="fa-solid fa-file-image" style="color:var(--color-primary);"></i> ${d}
              <i class="fa-solid fa-eye" style="color:var(--gray-400);"></i>
            </div>`).join('')}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--sp-3);">
          <button class="btn btn-success" onclick="adminVerif('${v.id}','approve',this)">
            <i class="fa-solid fa-check"></i> Aprobar
          </button>
          <button class="btn btn-danger" onclick="adminVerif('${v.id}','reject',this)">
            <i class="fa-solid fa-xmark"></i> Rechazar
          </button>
          <button class="btn btn-ghost btn-sm" onclick="VOY.showToast('Solicitar más info próximamente','info')">
            Pedir más info
          </button>
        </div>
      </div>
      <div style="font-size:var(--text-xs);color:var(--gray-400);margin-top:var(--sp-3);">Ref. ${v.id}</div>
    </div>`).join('');
}

function adminVerif(id, action, btn) {
  const card = document.getElementById(`verif-${id}`);
  const name = pendingVerifs.find(v => v.id === id)?.name;
  if (action === 'approve') {
    VOY.showToast(`✅ ${name} verificado correctamente`, 'success');
    card?.classList.remove('new');
    if (card) card.style.opacity = '0.5';
  } else {
    VOY.showToast(`Verificación de ${name} rechazada`, 'error');
    if (card) card.style.opacity = '0.3';
  }
  btn.disabled = true;
}

/* ── Recent transactions ─────────────────── */
function loadRecentTransactions() {
  const el = document.getElementById('recentTransactions');
  if (!el) return;
  const txs = [
    { id: 'VOY-2310', client: 'Isabella T.', worker: 'Ana R.', svc: 'Belleza', amount: 42000, status: 'completed' },
    { id: 'VOY-2309', client: 'Andrés M.',   worker: 'Roberto S.', svc: 'Electricidad', amount: 45000, status: 'pending' },
    { id: 'VOY-2308', client: 'Sofía M.',    worker: 'Carlos M.',  svc: 'Gasfitería',   amount: 35000, status: 'completed' },
  ];
  el.innerHTML = `
    <table class="data-table">
      <thead><tr><th>Ref.</th><th>Cliente</th><th>Servicio</th><th>Total</th><th>Estado</th></tr></thead>
      <tbody>
        ${txs.map(t => `
        <tr>
          <td><code style="font-size:var(--text-xs);background:var(--gray-100);padding:2px 6px;border-radius:4px;">${t.id}</code></td>
          <td>${t.client}</td>
          <td>${t.svc} · ${t.worker}</td>
          <td style="font-weight:600;color:var(--color-primary);">${VOY.formatCLP(t.amount)}</td>
          <td><span class="badge ${t.status === 'completed' ? 'badge-green' : 'badge-yellow'}">${t.status === 'completed' ? 'Completado' : 'Pendiente'}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

/* ── Users table ────────────────────────── */
let allUsers = null;

function buildAllUsers() {
  if (allUsers) return allUsers;
  const clients = VOY_DATA.clients.map(c => ({ ...c, role: 'cliente' }));
  const workers = VOY_DATA.workers.map(w => ({
    id: w.id + 200, name: w.name, avatar: w.avatar, city: w.city,
    memberSince: '2025-01', totalServices: w.completedJobs, role: 'profesional',
    category: w.categoryLabel, verified: w.verified, rating: w.rating,
  }));
  allUsers = [...clients, ...workers];
  return allUsers;
}

function loadUsersTable(filter = 'all') {
  const el = document.getElementById('usersTable');
  if (!el) return;
  const users = buildAllUsers().filter(u => filter === 'all' || u.role === filter);
  el.innerHTML = `
    <thead>
      <tr>
        <th>Usuario</th>
        <th>Rol</th>
        <th>Ciudad</th>
        <th>Miembro desde</th>
        <th>Servicios</th>
        <th>Estado</th>
        <th>Acción</th>
      </tr>
    </thead>
    <tbody>
      ${users.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:var(--sp-3);">
            <img src="${u.avatar}" class="avatar avatar-xs" />
            <div>
              <div style="font-weight:600;">${u.name}</div>
              ${u.category ? `<div style="font-size:var(--text-xs);color:var(--gray-400);">${u.category}</div>` : ''}
            </div>
          </div>
        </td>
        <td><span class="badge ${u.role === 'profesional' ? 'badge-blue' : 'badge-gray'}">${u.role}</span></td>
        <td>${u.city}</td>
        <td>${u.memberSince}</td>
        <td>${u.totalServices}</td>
        <td>
          ${u.role === 'profesional'
            ? `<span class="badge ${u.verified ? 'badge-green' : 'badge-yellow'}">${u.verified ? '✓ Verificado' : '! Pendiente'}</span>`
            : '<span class="badge badge-green">Activo</span>'}
        </td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="VOY.showToast('Vista de usuario próximamente','info')">Ver</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--color-danger);" onclick="VOY.showToast('Acción destructiva requiere confirmación','warning')">Suspender</button>
        </td>
      </tr>`).join('')}
    </tbody>`;
}

function filterUsers(val) { loadUsersTable(val); }

/* ── Transactions table ─────────────────── */
function loadTransTable() {
  const el = document.getElementById('transTable');
  if (!el) return;
  const txs = [
    { id: 'VOY-2310', date: '12 Mar', client: 'Isabella T.', worker: 'Ana R.',      svc: 'Belleza', gross: 42000, status: 'completed' },
    { id: 'VOY-2309', date: '12 Mar', client: 'Andrés M.',   worker: 'Roberto S.',  svc: 'Electricidad', gross: 45000, status: 'pending' },
    { id: 'VOY-2308', date: '08 Mar', client: 'Sofía M.',    worker: 'Carlos M.',   svc: 'Gasfitería',   gross: 35000, status: 'completed' },
    { id: 'VOY-2307', date: '06 Mar', client: 'Rodrigo P.',  worker: 'Carlos M.',   svc: 'Gasfitería',   gross: 25000, status: 'completed' },
    { id: 'VOY-2306', date: '05 Mar', client: 'Isabella T.', worker: 'Patricia V.', svc: 'Limpieza',     gross: 45000, status: 'completed' },
    { id: 'VOY-2305', date: '03 Mar', client: 'Andrés M.',   worker: 'Javier C.',   svc: 'Mecánica',     gross: 68000, status: 'completed' },
    { id: 'VOY-2304', date: '01 Mar', client: 'Sofía M.',    worker: 'Roberto S.',  svc: 'Electricidad', gross: 48000, status: 'refunded' },
  ];
  const statusMap = {
    completed: { label: 'Completado', cls: 'badge-green' },
    pending:   { label: 'Pendiente',  cls: 'badge-yellow' },
    refunded:  { label: 'Devuelto',   cls: 'badge-red' },
  };
  el.innerHTML = `
    <thead>
      <tr><th>Ref.</th><th>Fecha</th><th>Cliente</th><th>Profesional</th><th>Servicio</th><th>Total</th><th>Comisión</th><th>Estado</th></tr>
    </thead>
    <tbody>
      ${txs.map(t => {
        const st = statusMap[t.status];
        return `<tr>
          <td><code style="font-size:var(--text-xs);background:var(--gray-100);padding:2px 6px;border-radius:4px;">${t.id}</code></td>
          <td>${t.date}</td>
          <td>${t.client}</td>
          <td>${t.worker}</td>
          <td>${t.svc}</td>
          <td style="font-weight:700;">${VOY.formatCLP(t.gross)}</td>
          <td style="color:var(--color-success);font-weight:600;">+${VOY.formatCLP(Math.round(t.gross*0.15))}</td>
          <td><span class="badge ${st.cls}">${st.label}</span></td>
        </tr>`;
      }).join('')}
    </tbody>`;
}

/* ── Categories admin ───────────────────── */
function loadCategoriesAdmin() {
  const el = document.getElementById('categoriesAdmin');
  if (!el) return;
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--sp-4);">
      ${VOY_DATA.categories.map(cat => {
        const count = VOY_DATA.workers.filter(w => w.category === cat.id).length;
        return `
        <div class="card">
          <div class="card-body" style="display:flex;align-items:center;gap:var(--sp-4);">
            <div style="width:48px;height:48px;border-radius:var(--radius-lg);background:${cat.bg};color:${cat.color};display:flex;align-items:center;justify-content:center;font-size:var(--text-xl);flex-shrink:0;">
              <i class="fa-solid ${cat.icon}"></i>
            </div>
            <div style="flex:1;">
              <div style="font-weight:700;">${cat.label}</div>
              <div style="font-size:var(--text-xs);color:var(--gray-400);">${count} profesionales</div>
            </div>
            <div style="display:flex;gap:var(--sp-2);">
              <button class="btn btn-ghost btn-sm btn-icon" onclick="VOY.showToast('Editar categoría próximamente','info')"><i class="fa-solid fa-pencil"></i></button>
              <button class="btn btn-ghost btn-sm btn-icon" style="color:var(--color-danger);" onclick="VOY.showToast('Acción destructiva','warning')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

/* ── Config ─────────────────────────────── */
function loadConfigView() {
  const el = document.getElementById('configView');
  if (!el) return;
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-6);">
      <div class="card">
        <div class="card-header"><strong>Configuración general</strong></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:var(--sp-4);">
          <div class="input-group">
            <label class="input-label">Nombre de la plataforma</label>
            <input class="input" value="VOY" />
          </div>
          <div class="input-group">
            <label class="input-label">Comisión estándar (%)</label>
            <input class="input" type="number" value="15" />
          </div>
          <div class="input-group">
            <label class="input-label">Comisión verificados (%)</label>
            <input class="input" type="number" value="12" />
          </div>
          <div class="input-group">
            <label class="input-label">Radio máximo de búsqueda (km)</label>
            <input class="input" type="number" value="50" />
          </div>
          <button class="btn btn-primary" onclick="VOY.showToast('Configuración guardada','success')">
            <i class="fa-solid fa-check"></i> Guardar cambios
          </button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><strong>Estado de la plataforma</strong></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:var(--sp-4);">
          ${[
            { label: 'Registro de clientes', on: true },
            { label: 'Registro de profesionales', on: true },
            { label: 'Pagos online', on: true },
            { label: 'Notificaciones email', on: true },
            { label: 'Notificaciones push', on: false },
            { label: 'Modo mantenimiento', on: false },
          ].map(s => `
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:var(--text-sm);color:var(--gray-700);">${s.label}</span>
            <label class="toggle">
              <input type="checkbox" ${s.on ? 'checked' : ''} onchange="VOY.showToast('Configuración actualizada','info')" />
              <span class="toggle-slider"></span>
            </label>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
}

/* ── View switcher ──────────────────────── */
function showView(name, el) {
  document.querySelectorAll('[id^="view-"]').forEach(v => v.classList.add('hidden'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`view-${name}`)?.classList.remove('hidden');
  if (el) el.classList.add('active');
}
