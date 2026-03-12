/* ============================================
   VOY — Worker App Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  buildEarningsChart();
  loadRequests();
  loadCalendar();
  loadAgendaDay();
  loadEarningsView();
  loadWorkerProfile();
  loadVerification();
  loadWorkerReviews();
  loadWorkerNotifications();
  loadDashRequestsPreview();
});

/* ── Availability toggle ────────────────── */
function toggleAvailability(el) {
  const available = el.checked;
  const label = document.getElementById('availLabel');
  if (label) {
    label.innerHTML = available
      ? '<span class="status-dot online" style="display:inline-block;margin-right:6px;"></span> Disponible'
      : '<span class="status-dot offline" style="display:inline-block;margin-right:6px;"></span> No disponible';
    label.style.color = available ? 'var(--color-success)' : 'var(--gray-500)';
  }
  VOY.showToast(available ? 'Ahora estás disponible' : 'Te marcaste como no disponible', available ? 'success' : 'info');
}

/* ── Earnings chart ─────────────────────── */
function buildEarningsChart() {
  const el = document.getElementById('earningsChart');
  if (!el) return;
  const data = [
    { label: 'Oct', val: 180000 },
    { label: 'Nov', val: 210000 },
    { label: 'Dic', val: 295000 },
    { label: 'Ene', val: 240000 },
    { label: 'Feb', val: 264000 },
    { label: 'Mar', val: 312000, current: true },
  ];
  const max = Math.max(...data.map(d => d.val));
  el.innerHTML = data.map(d => `
    <div class="chart-bar-wrap">
      <div class="chart-bar ${d.current ? 'current' : ''}"
           style="height:${Math.round((d.val / max) * 100)}%;"
           title="${VOY.formatCLP(d.val)}"></div>
      <span class="chart-label">${d.label}</span>
    </div>`).join('');
}

/* ── Requests ───────────────────────────── */
const mockRequests = [
  {
    id: 'REQ-041',
    clientName: 'Andrés Morales',
    clientAvatar: 'https://i.pravatar.cc/48?img=51',
    clientRating: 4.8,
    service: 'Reparación de filtración en cocina',
    date: '2026-03-13',
    time: '10:00',
    address: 'Blanco 1254, Valparaíso',
    estimatedPrice: 35000,
    isNew: true,
    status: 'pending',
    distance: 3.2,
  },
  {
    id: 'REQ-042',
    clientName: 'Isabella Torres',
    clientAvatar: 'https://i.pravatar.cc/48?img=16',
    clientRating: 5.0,
    service: 'Instalación calefont nuevo',
    date: '2026-03-15',
    time: '14:00',
    address: 'Calle Valparaíso 320, Viña del Mar',
    estimatedPrice: 55000,
    isNew: true,
    status: 'pending',
    distance: 1.8,
  },
  {
    id: 'REQ-038',
    clientName: 'Rodrigo Pérez',
    clientAvatar: 'https://i.pravatar.cc/48?img=33',
    clientRating: 4.5,
    service: 'Revisión general fontanería',
    date: '2026-03-10',
    time: '09:00',
    address: 'Av. Libertad 890, Viña del Mar',
    estimatedPrice: 25000,
    isNew: false,
    status: 'accepted',
    distance: 2.5,
  },
];

function loadRequests() {
  const el = document.getElementById('requestsList');
  if (!el) return;
  el.innerHTML = mockRequests.map(r => buildRequestCard(r)).join('');
}

function buildRequestCard(r) {
  const commission = Math.round(r.estimatedPrice * 0.15);
  const net = r.estimatedPrice - commission;
  const statusMap = {
    pending:  { label: 'Esperando respuesta', class: 'badge-yellow' },
    accepted: { label: 'Aceptada', class: 'badge-green' },
    declined: { label: 'Rechazada', class: 'badge-red' },
  };
  const st = statusMap[r.status];
  return `
  <div class="request-card ${r.isNew && r.status === 'pending' ? 'new' : ''}">
    <div style="display:flex; align-items:flex-start; gap:var(--sp-4); flex-wrap:wrap;">
      <img src="${r.clientAvatar}" class="avatar avatar-md" />
      <div style="flex:1; min-width:200px;">
        <div style="display:flex; align-items:center; gap:var(--sp-3); margin-bottom:var(--sp-1);">
          <strong style="font-size:var(--text-base);">${r.clientName}</strong>
          <span style="font-size:var(--text-xs); color:var(--color-warning);">⭐ ${r.clientRating}</span>
          <span class="badge ${st.class}">${st.label}</span>
        </div>
        <div style="font-size:var(--text-sm); color:var(--gray-700); margin-bottom:var(--sp-2);">${r.service}</div>
        <div style="display:flex; flex-wrap:wrap; gap:var(--sp-4); font-size:var(--text-xs); color:var(--gray-500);">
          <span><i class="fa-solid fa-calendar" style="color:var(--color-primary);"></i> ${r.date} · ${r.time}</span>
          <span><i class="fa-solid fa-location-dot" style="color:var(--color-primary);"></i> ${r.address}</span>
          <span><i class="fa-solid fa-route" style="color:var(--color-primary);"></i> ${r.distance} km</span>
        </div>
      </div>
      <div style="text-align:right; min-width:140px;">
        <div style="font-size:var(--text-xl); font-weight:800; color:var(--gray-900);">${VOY.formatCLP(r.estimatedPrice)}</div>
        <div style="font-size:var(--text-xs); color:var(--gray-400);">Precio estimado</div>
        <div style="font-size:var(--text-xs); color:var(--gray-500); margin-top:var(--sp-1);">
          Tu parte: <strong style="color:var(--color-success);">${VOY.formatCLP(net)}</strong>
          <span style="color:var(--gray-300);">(-15% VOY)</span>
        </div>
      </div>
    </div>
    ${r.status === 'pending' ? `
    <div style="display:flex; gap:var(--sp-3); margin-top:var(--sp-4);">
      <button class="btn btn-ghost btn-sm flex-1" onclick="handleRequest('${r.id}', 'decline', this)">
        <i class="fa-solid fa-xmark"></i> Rechazar
      </button>
      <button class="btn btn-outline btn-sm flex-1" onclick="VOY.showToast('Chat abierto con ${r.clientName}', 'info')">
        <i class="fa-solid fa-comment-dots"></i> Preguntar
      </button>
      <button class="btn btn-success btn-sm flex-1" onclick="handleRequest('${r.id}', 'accept', this)">
        <i class="fa-solid fa-check"></i> Aceptar
      </button>
    </div>` : ''}
    <div style="margin-top:var(--sp-3); font-size:var(--text-xs); color:var(--gray-400);">Ref. ${r.id}</div>
  </div>`;
}

function handleRequest(id, action, el) {
  const r = mockRequests.find(x => x.id === id);
  if (!r) return;
  r.status = action === 'accept' ? 'accepted' : 'declined';
  r.isNew = false;

  if (action === 'accept') {
    VOY.showToast(`✅ Solicitud ${id} aceptada`, 'success');
    const badge = document.getElementById('pendingBadge');
    if (badge) {
      const n = parseInt(badge.textContent) - 1;
      badge.textContent = n;
      if (n === 0) badge.style.display = 'none';
    }
  } else {
    VOY.showToast(`Solicitud ${id} rechazada`, 'info');
  }
  loadRequests();
  loadDashRequestsPreview();
}

function loadDashRequestsPreview() {
  const el = document.getElementById('dashRequestsPreview');
  if (!el) return;
  const pending = mockRequests.filter(r => r.status === 'pending');
  if (!pending.length) {
    el.innerHTML = '<div class="empty-state" style="padding:var(--sp-8);"><i class="fa-solid fa-inbox"></i><h3>Sin solicitudes pendientes</h3></div>';
    return;
  }
  el.innerHTML = pending.slice(0, 2).map(r => `
    <div style="display:flex; align-items:center; gap:var(--sp-4); padding:var(--sp-3) 0; border-bottom:1px solid var(--gray-100);">
      <img src="${r.clientAvatar}" class="avatar avatar-sm" />
      <div style="flex:1;">
        <div style="font-size:var(--text-sm); font-weight:600;">${r.clientName}</div>
        <div style="font-size:var(--text-xs); color:var(--gray-400);">${r.service}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-weight:700; color:var(--color-primary);">${VOY.formatCLP(r.estimatedPrice)}</div>
        <div style="display:flex; gap:var(--sp-2);">
          <button class="btn btn-ghost btn-sm" style="padding:2px 8px; font-size:11px;" onclick="handleRequest('${r.id}', 'decline', this)">✗</button>
          <button class="btn btn-success btn-sm" style="padding:2px 8px; font-size:11px;" onclick="handleRequest('${r.id}', 'accept', this)">✓</button>
        </div>
      </div>
    </div>`).join('');
}

/* ── Calendar ───────────────────────────── */
function loadCalendar() {
  const el = document.getElementById('calendarGrid');
  if (!el) return;

  const year = 2026, month = 2; // March 2026 (0-indexed)
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = 12;
  const jobDays = [10, 12, 15, 18, 20, 22, 25];
  const busyDays = [14];

  let html = '';
  for (let i = 0; i < firstDay; i++) {
    const prevDate = new Date(year, month, -firstDay + i + 1).getDate();
    html += `<div class="cal-day other-month">${prevDate}</div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today;
    const hasJob  = jobDays.includes(d);
    const isBusy  = busyDays.includes(d);
    html += `<div class="cal-day ${isToday ? 'today' : ''} ${hasJob ? 'has-job' : ''} ${isBusy ? 'busy' : ''}" onclick="selectDay(${d})">${d}</div>`;
  }
  el.innerHTML = html;
}

function selectDay(d) {
  document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('today'));
  const all = document.querySelectorAll('.cal-day:not(.other-month)');
  const el = all[d - 1];
  if (el) el.classList.add('today');
  loadAgendaDay(d);
  const title = document.getElementById('agendaDayTitle');
  if (title) title.textContent = `${d} de Marzo`;
}

function loadAgendaDay(day = 12) {
  const el = document.getElementById('agendaDayDetail');
  if (!el) return;
  const jobs = day === 12 ? [
    { time: '10:00', client: 'Sofía Mendoza', avatar: 'https://i.pravatar.cc/40?img=2', service: 'Filtración baño', address: 'Av. 15 Norte 845', price: 35000, status: 'active' },
    { time: '15:00', client: 'Isabella Torres', avatar: 'https://i.pravatar.cc/40?img=16', service: 'Revisión general', address: 'Calle Valparaíso 320', price: 25000, status: 'confirmed' },
  ] : day === 15 ? [
    { time: '14:00', client: 'Isabella Torres', avatar: 'https://i.pravatar.cc/40?img=16', service: 'Calefont nuevo', address: 'Calle Valparaíso 320', price: 55000, status: 'confirmed' },
  ] : [];

  if (!jobs.length) {
    el.innerHTML = '<div style="text-align:center; padding:var(--sp-8); color:var(--gray-400);"><i class="fa-solid fa-calendar-xmark" style="font-size:2rem; margin-bottom:var(--sp-3); display:block;"></i>Sin trabajos este día</div>';
    return;
  }

  el.innerHTML = jobs.map(j => `
    <div style="padding:var(--sp-4); border-radius:var(--radius-xl); border:1.5px solid var(--gray-200); position:relative;">
      <div style="display:flex; align-items:center; gap:var(--sp-3);">
        <div style="font-size:var(--text-sm); font-weight:700; color:var(--color-primary); min-width:42px;">${j.time}</div>
        <img src="${j.avatar}" class="avatar avatar-sm" />
        <div style="flex:1;">
          <div style="font-size:var(--text-sm); font-weight:600;">${j.client}</div>
          <div style="font-size:var(--text-xs); color:var(--gray-400);">${j.service}</div>
          <div style="font-size:var(--text-xs); color:var(--gray-400);">${j.address}</div>
        </div>
        <div style="font-weight:700; color:var(--color-primary);">${VOY.formatCLP(j.price)}</div>
      </div>
      <span class="badge ${j.status === 'active' ? 'badge-green' : 'badge-blue'}" style="margin-top:var(--sp-2);">${j.status === 'active' ? '● Activo' : '✓ Confirmado'}</span>
    </div>`).join('');
}

/* ── Earnings view ──────────────────────── */
function loadEarningsView() {
  const el = document.getElementById('earningsView');
  if (!el) return;
  el.innerHTML = `
    <div class="stats-grid" style="margin-bottom:var(--sp-6);">
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#dbeafe;color:var(--color-primary);"><i class="fa-solid fa-wallet"></i></div>
        <div class="stat-card-info">
          <div class="stat-card-value">$312.000</div>
          <div class="stat-card-label">Este mes</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#d1fae5;color:var(--color-success);"><i class="fa-solid fa-calendar-check"></i></div>
        <div class="stat-card-info">
          <div class="stat-card-value">$1.861.000</div>
          <div class="stat-card-label">Este año</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#fef3c7;color:var(--color-warning);"><i class="fa-solid fa-percent"></i></div>
        <div class="stat-card-info">
          <div class="stat-card-value">$46.800</div>
          <div class="stat-card-label">Comisiones VOY (mes)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#ede9fe;color:#7c3aed;"><i class="fa-solid fa-money-bill-transfer"></i></div>
        <div class="stat-card-info">
          <div class="stat-card-value">$265.200</div>
          <div class="stat-card-label">Neto recibido (mes)</div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><strong>Historial de pagos</strong></div>
      <div class="card-body" style="padding:0;">
        <table class="data-table">
          <thead><tr><th>Fecha</th><th>Cliente</th><th>Servicio</th><th>Bruto</th><th>Comisión (15%)</th><th>Neto</th></tr></thead>
          <tbody>
            ${[
              { date: '08 Mar', client: 'Sofía M.', svc: 'Filtración baño', gross: 35000 },
              { date: '06 Mar', client: 'Rodrigo P.', svc: 'Revisión fontanería', gross: 25000 },
              { date: '03 Mar', client: 'Carolina V.', svc: 'Instalación ducha', gross: 42000 },
              { date: '28 Feb', client: 'Diego H.', svc: 'Cambio tuberías', gross: 78000 },
              { date: '25 Feb', client: 'Camila R.', svc: 'Reparación calefont', gross: 45000 },
            ].map(t => `
              <tr>
                <td>${t.date}</td>
                <td>${t.client}</td>
                <td>${t.svc}</td>
                <td style="font-weight:600;">${VOY.formatCLP(t.gross)}</td>
                <td style="color:var(--color-danger);">-${VOY.formatCLP(Math.round(t.gross*0.15))}</td>
                <td style="font-weight:700;color:var(--color-success);">${VOY.formatCLP(Math.round(t.gross*0.85))}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ── Worker profile ─────────────────────── */
function loadWorkerProfile() {
  const el = document.getElementById('workerProfileView');
  if (!el) return;
  const w = VOY_DATA.workers[0];
  el.innerHTML = `
    <div style="display:grid; grid-template-columns:300px 1fr; gap:var(--sp-6);">
      <div class="card">
        <div class="card-body" style="text-align:center; padding:var(--sp-8);">
          <div style="position:relative; display:inline-block; margin-bottom:var(--sp-4);">
            <img src="${w.avatar}" class="avatar avatar-xl" style="width:96px;height:96px; margin:0 auto;" />
            <button style="position:absolute;bottom:0;right:0;width:28px;height:28px;border-radius:50%;background:var(--color-primary);color:white;border:2px solid white;cursor:pointer;font-size:11px;" onclick="VOY.showToast('Cambiar foto próximamente', 'info')"><i class="fa-solid fa-camera"></i></button>
          </div>
          <h2 style="font-size:var(--text-xl);font-weight:700;margin-bottom:var(--sp-1);">${w.name}</h2>
          <p style="color:var(--gray-500);font-size:var(--text-sm);margin-bottom:var(--sp-4);">Gasfitería · ${w.city}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--sp-2);margin-bottom:var(--sp-4);">
            <div style="text-align:center;padding:var(--sp-3);background:var(--gray-50);border-radius:var(--radius-lg);">
              <div style="font-size:var(--text-lg);font-weight:800;">★ ${w.rating}</div>
              <div style="font-size:10px;color:var(--gray-400);">Rating</div>
            </div>
            <div style="text-align:center;padding:var(--sp-3);background:var(--gray-50);border-radius:var(--radius-lg);">
              <div style="font-size:var(--text-lg);font-weight:800;">${w.reviews}</div>
              <div style="font-size:10px;color:var(--gray-400);">Reseñas</div>
            </div>
            <div style="text-align:center;padding:var(--sp-3);background:var(--gray-50);border-radius:var(--radius-lg);">
              <div style="font-size:var(--text-lg);font-weight:800;">${w.completedJobs}</div>
              <div style="font-size:10px;color:var(--gray-400);">Trabajos</div>
            </div>
          </div>
          <span class="badge badge-green" style="font-size:var(--text-xs);">✓ Verificado</span>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><strong>Información profesional</strong></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);">
            <div class="input-group"><label class="input-label">Nombre completo</label><input class="input" value="${w.name}" /></div>
            <div class="input-group"><label class="input-label">Teléfono</label><input class="input" value="+56 9 8234 5678" /></div>
            <div class="input-group"><label class="input-label">Email</label><input class="input" value="carlos.munoz@gmail.com" /></div>
            <div class="input-group"><label class="input-label">Ciudad</label><input class="input" value="${w.city}" /></div>
            <div class="input-group" style="grid-column:1/-1;">
              <label class="input-label">Descripción profesional</label>
              <textarea class="input" rows="3">${w.bio}</textarea>
            </div>
            <div class="input-group"><label class="input-label">Precio mínimo (CLP)</label><input class="input" value="${w.priceMin}" /></div>
            <div class="input-group"><label class="input-label">Precio máximo (CLP)</label><input class="input" value="${w.priceMax}" /></div>
          </div>
          <div style="margin-top:var(--sp-5);">
            <label class="input-label" style="margin-bottom:var(--sp-3);">Especialidades</label>
            <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2);">
              ${w.skills.map(s => `<span class="skill-tag" style="cursor:pointer;" title="Click para eliminar">${s} ×</span>`).join('')}
              <button class="btn btn-outline btn-sm" onclick="VOY.showToast('Agregar especialidad próximamente', 'info')"><i class="fa-solid fa-plus"></i> Agregar</button>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top:var(--sp-5);" onclick="VOY.showToast('Perfil actualizado correctamente', 'success')">
            <i class="fa-solid fa-check"></i> Guardar cambios
          </button>
        </div>
      </div>
    </div>`;
}

/* ── Verification ───────────────────────── */
function loadVerification() {
  const el = document.getElementById('verificationView');
  if (!el) return;
  const steps = [
    { icon: '✓', cls: 'done',    title: 'Cuenta Google vinculada',   desc: 'Tu cuenta está verificada con Google Sign-In.', action: null },
    { icon: '✓', cls: 'done',    title: 'Número de teléfono',         desc: '+56 9 8234 5678 · verificado por SMS.', action: null },
    { icon: '!', cls: 'pending', title: 'Cédula de identidad',        desc: 'Sube ambos lados de tu cédula para verificar tu identidad.', action: 'Subir documento' },
    { icon: '!', cls: 'pending', title: 'Foto de perfil con cédula',  desc: 'Una selfie sosteniendo tu cédula de identidad.', action: 'Subir foto' },
    { icon: '✗', cls: 'missing', title: 'Certificación profesional',  desc: 'Sube tus certificados o título que acredite tu oficio.', action: 'Subir certificado' },
  ];
  el.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 360px; gap:var(--sp-6);">
      <div class="card">
        <div class="card-header">
          <strong>Estado de verificación</strong>
          <div style="margin-top:var(--sp-2);">
            <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);margin-bottom:var(--sp-2);">
              <span style="color:var(--gray-500);">Progreso</span><span style="font-weight:600;color:var(--color-primary);">40%</span>
            </div>
            <div style="height:8px;background:var(--gray-100);border-radius:var(--radius-full);">
              <div style="height:8px;width:40%;background:linear-gradient(90deg,var(--color-primary),var(--accent));border-radius:var(--radius-full);transition:width 0.5s;"></div>
            </div>
          </div>
        </div>
        <div class="card-body">
          ${steps.map(s => `
          <div class="verification-step">
            <div class="step-icon ${s.cls}">${s.icon}</div>
            <div style="flex:1;">
              <div style="font-weight:600;color:var(--gray-900);margin-bottom:2px;">${s.title}</div>
              <div style="font-size:var(--text-sm);color:var(--gray-500);">${s.desc}</div>
            </div>
            ${s.action ? `<button class="btn btn-outline btn-sm" onclick="VOY.showToast('Subida de documentos próximamente','info')">${s.action}</button>` : '<span style="color:var(--color-success);font-size:var(--text-sm);">✓ Listo</span>'}
          </div>`).join('')}
        </div>
      </div>
      <div class="card" style="align-self:start;">
        <div class="card-body">
          <div style="text-align:center;padding:var(--sp-6) 0;">
            <div style="font-size:3rem;margin-bottom:var(--sp-4);">🛡️</div>
            <h3 style="font-size:var(--text-xl);font-weight:700;margin-bottom:var(--sp-3);">Beneficios de verificarte</h3>
            <ul style="text-align:left;display:flex;flex-direction:column;gap:var(--sp-3);">
              <li style="display:flex;gap:var(--sp-3);font-size:var(--text-sm);color:var(--gray-600);">
                <i class="fa-solid fa-check-circle" style="color:var(--color-success);flex-shrink:0;margin-top:2px;"></i>
                Apareces primero en los resultados de búsqueda
              </li>
              <li style="display:flex;gap:var(--sp-3);font-size:var(--text-sm);color:var(--gray-600);">
                <i class="fa-solid fa-check-circle" style="color:var(--color-success);flex-shrink:0;margin-top:2px;"></i>
                Insignia "Verificado" en tu perfil
              </li>
              <li style="display:flex;gap:var(--sp-3);font-size:var(--text-sm);color:var(--gray-600);">
                <i class="fa-solid fa-check-circle" style="color:var(--color-success);flex-shrink:0;margin-top:2px;"></i>
                Mayor confianza y más contratos
              </li>
              <li style="display:flex;gap:var(--sp-3);font-size:var(--text-sm);color:var(--gray-600);">
                <i class="fa-solid fa-check-circle" style="color:var(--color-success);flex-shrink:0;margin-top:2px;"></i>
                Comisión reducida al 12% tras verificación completa
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>`;
}

/* ── Reviews ────────────────────────────── */
function loadWorkerReviews() {
  const el = document.getElementById('reviewsView');
  if (!el) return;
  const reviews = [
    { client: 'Sofía Mendoza',  avatar: 'https://i.pravatar.cc/40?img=2',  rating: 5, text: 'Excelente gasfiter. Llegó puntual, resolvió la filtración y dejó todo limpio. 100% recomendado.', date: '08 Mar 2026' },
    { client: 'Rodrigo Pérez',  avatar: 'https://i.pravatar.cc/40?img=33', rating: 5, text: 'Muy profesional, explica bien lo que va a hacer y cobra lo justo. Volvería a contratarlo.', date: '01 Mar 2026' },
    { client: 'Carolina Vera',  avatar: 'https://i.pravatar.cc/40?img=25', rating: 4, text: 'Buen trabajo, tardó un poco más de lo esperado pero el resultado es impecable.', date: '22 Feb 2026' },
    { client: 'Diego Herrera',  avatar: 'https://i.pravatar.cc/40?img=20', rating: 5, text: 'Resolvió un problema que nadie más había podido solucionar. ¡Gracias!', date: '15 Feb 2026' },
  ];
  el.innerHTML = `
    <div style="display:grid; grid-template-columns:240px 1fr; gap:var(--sp-6);">
      <div class="card" style="align-self:start;">
        <div class="card-body" style="text-align:center;">
          <div style="font-size:4rem;font-weight:800;color:var(--color-primary);line-height:1;">4.9</div>
          <div style="font-size:1.5rem;color:var(--color-warning);margin:var(--sp-2) 0;">★★★★★</div>
          <div style="font-size:var(--text-sm);color:var(--gray-400);">187 reseñas</div>
          <div style="margin-top:var(--sp-5);display:flex;flex-direction:column;gap:var(--sp-2);">
            ${[5,4,3,2,1].map((n,i) => {
              const widths = [82,14,3,1,0];
              return `<div style="display:flex;align-items:center;gap:var(--sp-2);font-size:var(--text-xs);">
                <span style="width:12px;text-align:right;">${n}</span>
                <i class="fa-solid fa-star" style="color:var(--color-warning);font-size:10px;"></i>
                <div style="flex:1;height:6px;background:var(--gray-100);border-radius:4px;">
                  <div style="height:6px;width:${widths[i]}%;background:var(--color-warning);border-radius:4px;"></div>
                </div>
                <span style="width:28px;">${widths[i]}%</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><strong>Reseñas recientes</strong></div>
        <div class="card-body" style="padding:0;">
          ${reviews.map(r => `
          <div class="review-item" style="padding:var(--sp-5); border-bottom:1px solid var(--gray-100);">
            <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3);">
              <img src="${r.avatar}" class="avatar avatar-sm" />
              <div style="flex:1;">
                <div style="font-weight:600;font-size:var(--text-sm);">${r.client}</div>
                <div style="font-size:var(--text-xs);color:var(--gray-400);">${r.date}</div>
              </div>
              <div style="color:var(--color-warning);">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            </div>
            <p style="font-size:var(--text-sm);color:var(--gray-600);font-style:italic;">"${r.text}"</p>
          </div>`).join('')}
        </div>
      </div>
    </div>`;
}

/* ── Notifications ──────────────────────── */
function loadWorkerNotifications() {
  const el = document.getElementById('workerNotifList');
  if (!el) return;
  const notifs = [
    { icon: '📥', bg: '#dbeafe', text: '<strong>Nueva solicitud</strong> de Isabella Torres · Instalación calefont.', time: 'Hace 30 min', unread: true },
    { icon: '💰', bg: '#d1fae5', text: '<strong>Pago recibido</strong> $35.000 por trabajo de Sofía Mendoza.', time: 'Hace 2 horas', unread: true },
    { icon: '⭐', bg: '#fef3c7', text: 'Nueva <strong>reseña de 5 estrellas</strong> de Rodrigo Pérez.', time: 'Hace 1 día', unread: false },
  ];
  el.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}">
      <div class="notif-icon" style="background:${n.bg};">${n.icon}</div>
      <div class="notif-body">
        <div class="notif-text">${n.text}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>`).join('');
}

function openNotif() { VOY.openModal('notifModal'); }

/* ── View switcher ──────────────────────── */
function showView(name, el) {
  document.querySelectorAll('[id^="view-"]').forEach(v => v.classList.add('hidden'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`view-${name}`)?.classList.remove('hidden');
  if (el) el.classList.add('active');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) VOY.closeModal(overlay.id); });
});
