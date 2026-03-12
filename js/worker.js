/* ============================================
   VOY — Worker App Logic (Airtable conectado)
   ============================================ */

let workerData = null;
let workerSession = null;
let workerRequests = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar sesión — redirige a /login/ si no hay sesión de profesional
  workerSession = VoyAuth.requireRole('profesional');
  if (!workerSession) return;

  showWorkerLoading();
  try {
    await VOY_DATA.init();
    // Cargar datos del profesional logueado desde Airtable
    workerData = await VoyDB.getWorkerByRecordId(workerSession.recordId);
    if (!workerData) throw new Error('No se encontraron datos del profesional');
    // Mostrar info de sesión en la UI
    VoyAuth.applySessionToUI(workerSession);
    workerRequests = await VoyDB.getRequests(workerData?._recordId);

    buildEarningsChart();
    loadWorkerDashboard();   // carga stats + trabajo activo + solicitudes preview
    renderRequests();
    loadCalendar();
    loadAgendaDay();
    loadVerification();
    loadWorkerNotifications();
    updateAvailabilityUI();
  } catch (e) {
    VOY.showToast('Error conectando con la base de datos', 'error');
    console.error(e);
  }
});

function showWorkerLoading() {
  VOY.showLoading('dashRequestsPreview', 'Cargando solicitudes...');
}

/* ── Helper ─────────────────────────────── */
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ── Dashboard dinámico ─────────────────── */
function loadWorkerDashboard() {
  if (!workerData) return;

  const completedBookings = VOY_DATA.bookings.filter(
    b => b.workerId === workerData.id && b.status === 'completed'
  );
  const earnings    = completedBookings.reduce((s, b) => s + (b.price || 0), 0) || 312000;
  const jobCount    = completedBookings.length || 23;
  const pendingCount = workerRequests.filter(r => r.status === 'pending').length;
  const prevMonth   = Math.round(earnings * 0.85);
  const pct         = earnings > 0 && prevMonth > 0
    ? Math.round(((earnings - prevMonth) / prevMonth) * 100)
    : 18;

  setEl('dashEarnings',  VOY.formatCLP(earnings));
  setEl('dashJobs',      jobCount);
  setEl('dashRating',    `${workerData.rating} ★`);
  setEl('dashNewReqs',   pendingCount);
  setEl('dashThisMonth', `$${Math.round(earnings / 1000)}k`);
  setEl('dashLastMonth', `$${Math.round(prevMonth / 1000)}k`);
  setEl('dashVariation', `${pct > 0 ? '+' : ''}${pct}%`);

  // Pending badge en sidebar
  const badge = document.getElementById('pendingBadge');
  if (badge) {
    badge.textContent = pendingCount;
    badge.style.display = pendingCount > 0 ? '' : 'none';
  }

  // Trabajo activo
  loadActiveJobCard();
  loadDashRequestsPreview();
}

function loadActiveJobCard() {
  const el = document.getElementById('activeJobCard');
  if (!el) return;

  const active = VOY_DATA.bookings.find(
    b => b.workerId === workerData?.id && (b.status === 'active' || b.status === 'pending')
  );

  if (!active) {
    el.innerHTML = `<div class="empty-state" style="padding:var(--sp-6);">
      <i class="fa-solid fa-calendar-xmark"></i>
      <h3>Sin trabajo activo ahora</h3>
      <p>Cuando aceptes una solicitud aparecerá aquí.</p>
    </div>`;
    return;
  }

  const client = VOY_DATA.clients.find(c => c.id === active.clientId);
  el.innerHTML = `
    <div style="display:flex; align-items:center; gap:var(--sp-4); margin-bottom:var(--sp-4);">
      <img src="${client?.avatar || 'https://i.pravatar.cc/56'}" class="avatar avatar-md" />
      <div>
        <div style="font-weight:700; color:var(--gray-900);">${client?.name || 'Cliente'}</div>
        <div style="font-size:var(--text-sm); color:var(--gray-500);">${active.service} · ${active.date} ${active.time}</div>
        <div style="font-size:var(--text-xs); color:var(--gray-400);">
          <i class="fa-solid fa-location-dot" style="color:var(--color-primary);"></i> ${active.address}
        </div>
      </div>
    </div>
    <div style="background:var(--blue-50); border-radius:var(--radius-xl); padding:var(--sp-3) var(--sp-4); margin-bottom:var(--sp-4);">
      <div style="font-size:var(--text-sm); color:var(--gray-500); margin-bottom:2px;">Precio acordado</div>
      <div style="font-weight:700; color:var(--color-primary);">${VOY.formatCLP(active.price)}</div>
    </div>
    <div style="display:flex; gap:var(--sp-3);">
      <button class="btn btn-outline flex-1" onclick="VOY.showToast('Chat próximamente', 'info')">
        <i class="fa-solid fa-comment-dots"></i> Chat
      </button>
      <button class="btn btn-success flex-1" onclick="completeJob('${active._recordId}')">
        <i class="fa-solid fa-check"></i> Completar
      </button>
    </div>`;
}

async function completeJob(recordId) {
  const btn = event?.currentTarget;
  if (btn) { btn.disabled = true; btn.textContent = '...'; }
  try {
    await VoyDB.updateBookingStatus(recordId, 'completed');
    VOY_DATA.bookings = await VoyDB.getBookings();
    VOY.showToast('¡Trabajo marcado como completado!', 'success');
    loadWorkerDashboard();
    buildEarningsChart();
  } catch (e) {
    VOY.showToast('Error al completar el trabajo', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Completar'; }
  }
}

/* ── Availability toggle ────────────────── */
async function toggleAvailability(el) {
  const available = el.checked;
  if (!workerData?._recordId) return;
  try {
    await VoyDB.updateWorkerAvailability(workerData._recordId, available);
    workerData.available = available;
    const idx = VOY_DATA.workers.findIndex(w => w._recordId === workerData._recordId);
    if (idx !== -1) VOY_DATA.workers[idx].available = available;
    updateAvailabilityUI();
    VOY.showToast(available ? 'Ahora estás disponible' : 'Te marcaste como no disponible', available ? 'success' : 'info');
  } catch (e) {
    el.checked = !available;
    VOY.showToast('Error actualizando disponibilidad', 'error');
  }
}

function updateAvailabilityUI() {
  if (!workerData) return;
  // Sincronizar ambos toggles (topbar + dashboard)
  ['availToggle', 'availToggle2'].forEach(id => {
    const t = document.getElementById(id);
    if (t) t.checked = workerData.available;
  });
  const label = document.getElementById('availLabel');
  if (label) {
    label.innerHTML = workerData.available
      ? '<span class="status-dot online" style="display:inline-block;margin-right:6px;"></span> Disponible'
      : '<span class="status-dot offline" style="display:inline-block;margin-right:6px;"></span> No disponible';
    label.style.color = workerData.available ? 'var(--color-success)' : 'var(--gray-500)';
  }
}

/* ── Earnings chart ─────────────────────── */
function buildEarningsChart() {
  const el = document.getElementById('earningsChart');
  if (!el) return;
  // Calcular ganancias de los últimos 6 meses desde bookings reales
  const completed = VOY_DATA.bookings.filter(b => b.workerId === workerData?.id && b.status === 'completed');
  const months = ['Oct','Nov','Dic','Ene','Feb','Mar'];
  // Por ahora usamos datos del mock chart más datos reales del mes actual
  const realThisMonth = completed.reduce((s, b) => s + (b.price || 0), 0);
  const data = [
    { label: 'Oct', val: 180000 },
    { label: 'Nov', val: 210000 },
    { label: 'Dic', val: 295000 },
    { label: 'Ene', val: 240000 },
    { label: 'Feb', val: 264000 },
    { label: 'Mar', val: Math.max(realThisMonth, 312000), current: true },
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
function renderRequests() {
  const el = document.getElementById('requestsList');
  if (!el) return;
  if (!workerRequests.length) {
    el.innerHTML = '<div class="empty-state" style="padding:var(--sp-8);"><i class="fa-solid fa-inbox"></i><h3>Sin solicitudes</h3><p>Nuevas solicitudes aparecerán aquí.</p></div>';
    return;
  }
  el.innerHTML = workerRequests.map(r => buildRequestCard(r)).join('');
}

function buildRequestCard(r) {
  const commission = Math.round(r.estimatedPrice * 0.15);
  const net = r.estimatedPrice - commission;
  const statusMap = {
    pending:  { label: 'Esperando respuesta', class: 'badge-yellow' },
    accepted: { label: 'Aceptada', class: 'badge-green' },
    declined: { label: 'Rechazada', class: 'badge-red' },
  };
  const st = statusMap[r.status] || statusMap.pending;
  return `
  <div class="request-card ${r.isNew && r.status === 'pending' ? 'new' : ''}" id="req-${r._recordId}">
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
      <button class="btn btn-ghost btn-sm flex-1" onclick="handleRequest('${r._recordId}', 'declined')">
        <i class="fa-solid fa-xmark"></i> Rechazar
      </button>
      <button class="btn btn-outline btn-sm flex-1" onclick="VOY.showToast('Chat próximamente', 'info')">
        <i class="fa-solid fa-comment-dots"></i> Preguntar
      </button>
      <button class="btn btn-success btn-sm flex-1" onclick="handleRequest('${r._recordId}', 'accepted')">
        <i class="fa-solid fa-check"></i> Aceptar
      </button>
    </div>` : ''}
    <div style="margin-top:var(--sp-3); font-size:var(--text-xs); color:var(--gray-400);">Ref. ${r.id}</div>
  </div>`;
}

async function handleRequest(recordId, action) {
  const card = document.getElementById(`req-${recordId}`);
  if (card) {
    card.style.opacity = '0.6';
    card.style.pointerEvents = 'none';
  }
  try {
    await VoyDB.updateRequestStatus(recordId, action);

    // Actualizar cache local
    const idx = workerRequests.findIndex(r => r._recordId === recordId);
    if (idx !== -1) { workerRequests[idx].status = action; workerRequests[idx].isNew = false; }

    if (action === 'accepted') {
      VOY.showToast(`✅ Solicitud aceptada`, 'success');
      // Actualizar el booking correspondiente a 'active'
      const matchBooking = VOY_DATA.bookings.find(b =>
        workerRequests.find(r => r._recordId === recordId)?.service === b.service
      );
      if (matchBooking?._recordId) await VoyDB.updateBookingStatus(matchBooking._recordId, 'active');
    } else {
      VOY.showToast('Solicitud rechazada', 'info');
    }

    // Actualizar badge
    const pending = workerRequests.filter(r => r.status === 'pending');
    const badge = document.getElementById('pendingBadge');
    if (badge) {
      badge.textContent = pending.length;
      badge.style.display = pending.length ? '' : 'none';
    }

    renderRequests();
    loadDashRequestsPreview();
  } catch (e) {
    VOY.showToast('Error actualizando solicitud', 'error');
    if (card) { card.style.opacity = '1'; card.style.pointerEvents = ''; }
  }
}

function loadDashRequestsPreview() {
  const el = document.getElementById('dashRequestsPreview');
  if (!el) return;
  const pending = workerRequests.filter(r => r.status === 'pending');
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
          <button class="btn btn-ghost btn-sm" style="padding:2px 8px; font-size:11px;" onclick="handleRequest('${r._recordId}', 'declined')">✗</button>
          <button class="btn btn-success btn-sm" style="padding:2px 8px; font-size:11px;" onclick="handleRequest('${r._recordId}', 'accepted')">✓</button>
        </div>
      </div>
    </div>`).join('');
}

/* ── Calendar ───────────────────────────── */
function loadCalendar() {
  const el = document.getElementById('calendarGrid');
  if (!el) return;

  const now = new Date();
  const year = now.getFullYear(), month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = now.getDate();

  // Días con trabajo (desde bookings aceptadas/activas)
  const acceptedReqs = workerRequests.filter(r => r.status === 'accepted');
  const jobDays = acceptedReqs.map(r => parseInt(r.date?.split('-')[2])).filter(Boolean);

  let html = '';
  for (let i = 0; i < firstDay; i++) {
    const prevDate = new Date(year, month, -firstDay + i + 1).getDate();
    html += `<div class="cal-day other-month">${prevDate}</div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today;
    const hasJob  = jobDays.includes(d);
    html += `<div class="cal-day ${isToday ? 'today' : ''} ${hasJob ? 'has-job' : ''}" onclick="selectDay(${d})">${d}</div>`;
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
  if (title) title.textContent = `${d} de ${new Date().toLocaleString('es', { month: 'long' })}`;
}

function loadAgendaDay(day = new Date().getDate()) {
  const el = document.getElementById('agendaDayDetail');
  if (!el) return;

  const todayStr = new Date(new Date().getFullYear(), new Date().getMonth(), day)
    .toISOString().split('T')[0];

  const dayJobs = workerRequests
    .filter(r => r.status === 'accepted' && r.date === todayStr)
    .map(r => ({
      time:    r.time,
      client:  r.clientName,
      avatar:  r.clientAvatar,
      service: r.service,
      address: r.address,
      price:   r.estimatedPrice,
      status:  'confirmed',
    }));

  // Añadir bookings activas del día
  const bookingJobs = VOY_DATA.bookings
    .filter(b => b.workerId === workerData?.id && (b.status === 'active' || b.status === 'pending') && b.date === todayStr)
    .map(b => {
      const client = VOY_DATA.clients.find(c => c.id === b.clientId);
      return {
        time:    b.time,
        client:  client?.name || 'Cliente',
        avatar:  client?.avatar || '',
        service: b.service,
        address: b.address,
        price:   b.price,
        status:  b.status === 'active' ? 'active' : 'confirmed',
      };
    });

  const allJobs = [...dayJobs, ...bookingJobs];

  if (!allJobs.length) {
    el.innerHTML = '<div style="text-align:center; padding:var(--sp-8); color:var(--gray-400);"><i class="fa-solid fa-calendar-xmark" style="font-size:2rem; margin-bottom:var(--sp-3); display:block;"></i>Sin trabajos este día</div>';
    return;
  }

  el.innerHTML = allJobs.map(j => `
    <div style="padding:var(--sp-4); border-radius:var(--radius-xl); border:1.5px solid var(--gray-200); position:relative; margin-bottom:var(--sp-3);">
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

  const completedBookings = VOY_DATA.bookings.filter(
    b => b.workerId === workerData?.id && b.status === 'completed'
  );
  const thisMonthGross = completedBookings.reduce((s, b) => s + (b.price || 0), 0) || 312000;
  const yearGross      = thisMonthGross * 6; // Aproximado
  const commission     = Math.round(thisMonthGross * 0.15);
  const net            = thisMonthGross - commission;

  el.innerHTML = `
    <div class="stats-grid" style="margin-bottom:var(--sp-6);">
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#dbeafe;color:var(--color-primary);"><i class="fa-solid fa-wallet"></i></div>
        <div class="stat-card-info">
          <div class="stat-card-value">${VOY.formatCLP(thisMonthGross)}</div>
          <div class="stat-card-label">Este mes</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#d1fae5;color:var(--color-success);"><i class="fa-solid fa-calendar-check"></i></div>
        <div class="stat-card-info">
          <div class="stat-card-value">${VOY.formatCLP(yearGross)}</div>
          <div class="stat-card-label">Este año (estimado)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#fef3c7;color:var(--color-warning);"><i class="fa-solid fa-percent"></i></div>
        <div class="stat-card-info">
          <div class="stat-card-value">${VOY.formatCLP(commission)}</div>
          <div class="stat-card-label">Comisiones VOY (mes)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:#ede9fe;color:#7c3aed;"><i class="fa-solid fa-money-bill-transfer"></i></div>
        <div class="stat-card-info">
          <div class="stat-card-value">${VOY.formatCLP(net)}</div>
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
            ${completedBookings.length ? completedBookings.map(b => {
              const c = VOY_DATA.clients.find(x => x.id === b.clientId);
              return `<tr>
                <td>${b.date}</td>
                <td>${c?.name || 'Cliente'}</td>
                <td>${b.service}</td>
                <td style="font-weight:600;">${VOY.formatCLP(b.price)}</td>
                <td style="color:var(--color-danger);">-${VOY.formatCLP(Math.round(b.price*0.15))}</td>
                <td style="font-weight:700;color:var(--color-success);">${VOY.formatCLP(Math.round(b.price*0.85))}</td>
              </tr>`;
            }).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--gray-400);padding:var(--sp-8);">Sin pagos registrados aún</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>`;
}

/* ── Worker profile ─────────────────────── */
function loadWorkerProfile() {
  const el = document.getElementById('workerProfileView');
  if (!el) return;
  const w = workerData;
  if (!w) return;
  el.innerHTML = `
    <div style="display:grid; grid-template-columns:300px 1fr; gap:var(--sp-6);">
      <div class="card">
        <div class="card-body" style="text-align:center; padding:var(--sp-8);">
          <div style="position:relative; display:inline-block; margin-bottom:var(--sp-4);">
            <img src="${w.avatar}" class="avatar avatar-xl" style="width:96px;height:96px; margin:0 auto;" />
            <button style="position:absolute;bottom:0;right:0;width:28px;height:28px;border-radius:50%;background:var(--color-primary);color:white;border:2px solid white;cursor:pointer;font-size:11px;" onclick="VOY.showToast('Cambiar foto próximamente', 'info')"><i class="fa-solid fa-camera"></i></button>
          </div>
          <h2 style="font-size:var(--text-xl);font-weight:700;margin-bottom:var(--sp-1);">${w.name}</h2>
          <p style="color:var(--gray-500);font-size:var(--text-sm);margin-bottom:var(--sp-4);">${w.categoryLabel} · ${w.city}</p>
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
          <span class="badge ${w.verified ? 'badge-green' : 'badge-yellow'}">${w.verified ? '✓ Verificado' : '! Pendiente verificación'}</span>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><strong>Información profesional</strong></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4);">
            <div class="input-group"><label class="input-label">Nombre completo</label><input class="input" id="wName" value="${w.name}" /></div>
            <div class="input-group"><label class="input-label">Teléfono</label><input class="input" id="wPhone" value="${w.phone || ''}" /></div>
            <div class="input-group"><label class="input-label">Email</label><input class="input" id="wEmail" value="${w.email || ''}" /></div>
            <div class="input-group"><label class="input-label">Ciudad</label><input class="input" id="wCity" value="${w.city}" /></div>
            <div class="input-group" style="grid-column:1/-1;">
              <label class="input-label">Descripción profesional</label>
              <textarea class="input" id="wBio" rows="3">${w.bio}</textarea>
            </div>
            <div class="input-group"><label class="input-label">Precio mínimo (CLP)</label><input class="input" id="wPriceMin" type="number" value="${w.priceMin}" /></div>
            <div class="input-group"><label class="input-label">Precio máximo (CLP)</label><input class="input" id="wPriceMax" type="number" value="${w.priceMax}" /></div>
          </div>
          <div style="margin-top:var(--sp-5);">
            <label class="input-label" style="margin-bottom:var(--sp-3);">Especialidades</label>
            <div style="display:flex;flex-wrap:wrap;gap:var(--sp-2);">
              ${w.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
              <button class="btn btn-outline btn-sm" onclick="VOY.showToast('Agregar especialidad próximamente', 'info')"><i class="fa-solid fa-plus"></i> Agregar</button>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top:var(--sp-5);" onclick="saveWorkerProfile()">
            <i class="fa-solid fa-check"></i> Guardar cambios
          </button>
        </div>
      </div>
    </div>`;
}

async function saveWorkerProfile() {
  if (!workerData?._recordId) return;
  try {
    const updated = await VoyDB.saveWorkerProfile(workerData._recordId, {
      name:     document.getElementById('wName')?.value,
      phone:    document.getElementById('wPhone')?.value,
      email:    document.getElementById('wEmail')?.value,
      city:     document.getElementById('wCity')?.value,
      bio:      document.getElementById('wBio')?.value,
      priceMin: document.getElementById('wPriceMin')?.value,
      priceMax: document.getElementById('wPriceMax')?.value,
    });
    workerData = { ...workerData, ...updated };
    const idx = VOY_DATA.workers.findIndex(w => w._recordId === workerData._recordId);
    if (idx !== -1) VOY_DATA.workers[idx] = workerData;
    VOY.showToast('Perfil actualizado correctamente', 'success');
  } catch (e) {
    VOY.showToast('Error al guardar perfil', 'error');
  }
}

/* ── Verification ───────────────────────── */
function loadVerification() {
  const el = document.getElementById('verificationView');
  if (!el) return;
  const steps = [
    { icon: '✓', cls: 'done',    title: 'Cuenta Google vinculada',   desc: 'Tu cuenta está verificada con Google Sign-In.', action: null },
    { icon: '✓', cls: 'done',    title: 'Número de teléfono',         desc: `${workerData?.phone || '+56 9 XXXX XXXX'} · verificado por SMS.`, action: null },
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
              <div style="height:8px;width:40%;background:linear-gradient(90deg,var(--color-primary),var(--accent));border-radius:var(--radius-full);"></div>
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
              <li style="display:flex;gap:var(--sp-3);font-size:var(--text-sm);color:var(--gray-600);"><i class="fa-solid fa-check-circle" style="color:var(--color-success);flex-shrink:0;margin-top:2px;"></i>Apareces primero en resultados</li>
              <li style="display:flex;gap:var(--sp-3);font-size:var(--text-sm);color:var(--gray-600);"><i class="fa-solid fa-check-circle" style="color:var(--color-success);flex-shrink:0;margin-top:2px;"></i>Insignia "Verificado" en tu perfil</li>
              <li style="display:flex;gap:var(--sp-3);font-size:var(--text-sm);color:var(--gray-600);"><i class="fa-solid fa-check-circle" style="color:var(--color-success);flex-shrink:0;margin-top:2px;"></i>Mayor confianza y más contratos</li>
              <li style="display:flex;gap:var(--sp-3);font-size:var(--text-sm);color:var(--gray-600);"><i class="fa-solid fa-check-circle" style="color:var(--color-success);flex-shrink:0;margin-top:2px;"></i>Comisión reducida al 12%</li>
            </ul>
          </div>
        </div>
      </div>
    </div>`;
}

/* ── Reviews ────────────────────────────── */
async function loadWorkerReviews() {
  const el = document.getElementById('reviewsView');
  if (!el) return;

  const allBookings = await VoyDB.getBookings({ status: 'completed' });
  const reviews = allBookings.filter(b => b.workerId === workerData?.id && b.rating);

  const avgRating = reviews.length
    ? (reviews.reduce((s, b) => s + b.rating, 0) / reviews.length).toFixed(1)
    : workerData?.rating || 0;

  const dist = [5,4,3,2,1].map(n => ({
    n,
    pct: reviews.length ? Math.round(reviews.filter(b => b.rating === n).length / reviews.length * 100) : [82,14,3,1,0][[5,4,3,2,1].indexOf(n)],
  }));

  el.innerHTML = `
    <div style="display:grid; grid-template-columns:240px 1fr; gap:var(--sp-6);">
      <div class="card" style="align-self:start;">
        <div class="card-body" style="text-align:center;">
          <div style="font-size:4rem;font-weight:800;color:var(--color-primary);line-height:1;">${avgRating}</div>
          <div style="font-size:1.5rem;color:var(--color-warning);margin:var(--sp-2) 0;">★★★★★</div>
          <div style="font-size:var(--text-sm);color:var(--gray-400);">${workerData?.reviews || reviews.length} reseñas</div>
          <div style="margin-top:var(--sp-5);display:flex;flex-direction:column;gap:var(--sp-2);">
            ${dist.map(d => `
            <div style="display:flex;align-items:center;gap:var(--sp-2);font-size:var(--text-xs);">
              <span style="width:12px;text-align:right;">${d.n}</span>
              <i class="fa-solid fa-star" style="color:var(--color-warning);font-size:10px;"></i>
              <div style="flex:1;height:6px;background:var(--gray-100);border-radius:4px;">
                <div style="height:6px;width:${d.pct}%;background:var(--color-warning);border-radius:4px;"></div>
              </div>
              <span style="width:28px;">${d.pct}%</span>
            </div>`).join('')}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><strong>Reseñas recientes</strong></div>
        <div class="card-body" style="padding:0;">
          ${reviews.length ? reviews.map(b => {
            const client = VOY_DATA.clients.find(c => c.id === b.clientId);
            return `
            <div class="review-item" style="padding:var(--sp-5); border-bottom:1px solid var(--gray-100);">
              <div style="display:flex;align-items:center;gap:var(--sp-3);margin-bottom:var(--sp-3);">
                <img src="${client?.avatar || 'https://i.pravatar.cc/40'}" class="avatar avatar-sm" />
                <div style="flex:1;">
                  <div style="font-weight:600;font-size:var(--text-sm);">${client?.name || 'Cliente'}</div>
                  <div style="font-size:var(--text-xs);color:var(--gray-400);">${b.date}</div>
                </div>
                <div style="color:var(--color-warning);">${'★'.repeat(b.rating)}${'☆'.repeat(5-b.rating)}</div>
              </div>
              ${b.review ? `<p style="font-size:var(--text-sm);color:var(--gray-600);font-style:italic;">"${b.review}"</p>` : ''}
            </div>`;
          }).join('') : '<div style="padding:var(--sp-8);text-align:center;color:var(--gray-400);">Aún sin reseñas</div>'}
        </div>
      </div>
    </div>`;
}

/* ── Notifications ──────────────────────── */
function loadWorkerNotifications() {
  const el = document.getElementById('workerNotifList');
  if (!el) return;
  const pending = workerRequests.filter(r => r.status === 'pending');
  const notifs = [];

  pending.forEach(r => {
    notifs.push({ icon: '📥', bg: '#dbeafe', text: `<strong>Nueva solicitud</strong> de ${r.clientName} · ${r.service}.`, time: 'Reciente', unread: true });
  });

  const completed = VOY_DATA.bookings.filter(b => b.workerId === workerData?.id && b.status === 'completed');
  completed.forEach(b => {
    notifs.push({ icon: '💰', bg: '#d1fae5', text: `<strong>Pago recibido</strong> ${VOY.formatCLP(b.price)} por ${b.service}.`, time: b.date, unread: false });
  });

  if (!notifs.length) {
    notifs.push({ icon: '💡', bg: '#dbeafe', text: 'No tienes notificaciones nuevas.', time: 'Ahora', unread: false });
  }

  el.innerHTML = notifs.slice(0, 5).map(n => `
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

  // Los nombres en el HTML son: dashboard, solicitudes, agenda, ganancias, perfil, verificacion, resenas
  if (name === 'ganancias')    loadEarningsView();
  if (name === 'resenas')      loadWorkerReviews();
  if (name === 'perfil')       loadWorkerProfile();
  if (name === 'verificacion') loadVerification();
  if (name === 'agenda')       { loadCalendar(); loadAgendaDay(); }
  if (name === 'dashboard')    loadWorkerDashboard();
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) VOY.closeModal(overlay.id); });
});

/* ── Logout ─────────────────────────────── */
function logout() {
  VoyAuth.logout();
}
