/* ============================================
   VOY — Client App Logic
   ============================================ */

let map, markers = [], selectedWorker = null, favorites = new Set([3, 7]);
let currentCategory = 'all', currentRadius = 10, listView = 'list';

/* ── Init ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildCategoryChips();
  initMap();
  filterWorkers();
  loadActiveServices();
  loadHistorial();
  loadClientProfile();
  loadPagos();
  loadFavorites();
  loadNotifications();
  handleURLParams();
  setTodayDate();
});

function setTodayDate() {
  const today = new Date().toISOString().split('T')[0];
  const d = document.getElementById('bookingDate');
  if (d) { d.value = today; d.min = today; }
}

function handleURLParams() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('cat')) { currentCategory = p.get('cat'); filterWorkers(); }
  if (p.get('worker')) openWorkerDetail(parseInt(p.get('worker')));
}

/* ── Category chips ─────────────────────── */
function buildCategoryChips() {
  const el = document.getElementById('filterCats');
  VOY_DATA.categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-chip';
    btn.dataset.cat = cat.id;
    btn.innerHTML = `<i class="fa-solid ${cat.icon}"></i> ${cat.label}`;
    btn.onclick = () => setCategory(cat.id, btn);
    el.appendChild(btn);
  });
}

function setCategory(catId, el) {
  currentCategory = catId;
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  filterWorkers();
}

/* ── Filter & sort ──────────────────────── */
function updateRadius(val) {
  currentRadius = parseInt(val);
  document.getElementById('radiusLabel').textContent = `${val} km`;
  filterWorkers();
}

function filterWorkers() {
  const search    = document.getElementById('mainSearch')?.value.toLowerCase() ?? '';
  const sort      = document.getElementById('sortSelect')?.value ?? 'distance';
  const onlyAvail = document.getElementById('onlyAvailable')?.checked ?? true;
  const onlyVerif = document.getElementById('onlyVerified')?.checked ?? false;

  let workers = VOY_DATA.workers.filter(w => {
    if (onlyAvail && !w.available) return false;
    if (onlyVerif && !w.verified) return false;
    if (currentCategory !== 'all' && w.category !== currentCategory) return false;
    if (w.distance > currentRadius) return false;
    if (search && !w.name.toLowerCase().includes(search) && !w.categoryLabel.toLowerCase().includes(search)) return false;
    return true;
  });

  workers.sort((a, b) => {
    if (sort === 'distance') return a.distance - b.distance;
    if (sort === 'rating')   return b.rating - a.rating;
    if (sort === 'price')    return a.priceMin - b.priceMin;
    return 0;
  });

  document.getElementById('resultsCount').textContent =
    `${workers.length} profesional${workers.length !== 1 ? 'es' : ''} encontrado${workers.length !== 1 ? 's' : ''}`;

  renderProvidersList(workers);
  updateMapMarkers(workers);
}

/* ── Providers list ─────────────────────── */
function renderProvidersList(workers) {
  const el = document.getElementById('providersList');
  if (!el) return;

  if (workers.length === 0) {
    el.innerHTML = `<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><h3>Sin resultados</h3><p>Intenta ampliar el radio de búsqueda o cambiar la categoría.</p></div>`;
    return;
  }

  el.innerHTML = workers.map(w => {
    const cat = VOY.getCategoryById(w.category);
    const isFav = favorites.has(w.id);
    return `
    <div class="provider-card ${selectedWorker?.id === w.id ? 'selected' : ''}" onclick="openWorkerDetail(${w.id})" id="pcard-${w.id}">
      <div style="position:relative;">
        <img src="${w.avatar}" alt="${w.name}" class="avatar avatar-md" />
        <span class="status-dot ${w.available ? 'online' : 'offline'}" style="position:absolute; bottom:2px; right:2px;"></span>
      </div>
      <div class="provider-card-body">
        <div style="display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-1);">
          <span class="provider-card-name">${w.name}</span>
          ${w.verified ? '<i class="fa-solid fa-circle-check" style="color:var(--color-primary); font-size:var(--text-sm);" title="Verificado"></i>' : ''}
          ${isFav ? '<i class="fa-solid fa-heart" style="color:#ef4444; font-size:var(--text-sm);"></i>' : ''}
        </div>
        <span class="badge badge-blue" style="background:${cat.bg}; color:${cat.color}; margin-bottom:var(--sp-2);">
          <i class="fa-solid ${cat.icon}"></i> ${w.categoryLabel}
        </span>
        <div class="provider-card-meta">
          <span><i class="fa-solid fa-star" style="color:var(--color-warning);"></i> ${w.rating} (${w.reviews})</span>
          <span><i class="fa-solid fa-location-dot"></i> ${VOY.formatDistance(w.distance)}</span>
          <span><i class="fa-solid fa-clock"></i> ${w.responseTime}</span>
        </div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:var(--sp-2);">
          <span class="provider-card-price">Desde ${VOY.formatCLP(w.priceMin)} / ${w.priceUnit}</span>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); quickBook(${w.id})">
            Contratar
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function setListView(v) {
  listView = v;
  document.getElementById('tabList').classList.toggle('active', v === 'list');
  document.getElementById('tabGrid').classList.toggle('active', v === 'grid');
}

/* ── Map ────────────────────────────────── */
function initMap() {
  const el = document.getElementById('mapContainer');
  if (!el) return;
  el.innerHTML = '<div id="map"></div>';

  map = L.map('map', { zoomControl: true }).setView([-33.025, -71.552], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  // User marker
  const userIcon = L.divIcon({
    html: '<div style="width:16px;height:16px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,0.5);"></div>',
    iconSize: [16, 16], iconAnchor: [8, 8], className: '',
  });
  L.marker([-33.022, -71.548], { icon: userIcon })
    .addTo(map)
    .bindPopup('<strong>Tu ubicación</strong>');
}

function updateMapMarkers(workers) {
  if (!map) return;
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  workers.forEach(w => {
    const cat = VOY.getCategoryById(w.category);
    const icon = L.divIcon({
      html: `<div style="width:36px;height:36px;border-radius:50%;background:${cat.color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;"><i class="fa-solid ${cat.icon}"></i></div>`,
      iconSize: [36, 36], iconAnchor: [18, 18], className: '',
    });

    const m = L.marker([w.lat, w.lng], { icon })
      .addTo(map)
      .bindPopup(`
        <div class="map-worker-popup">
          <div class="popup-name">${w.name} ${w.verified ? '✓' : ''}</div>
          <div class="popup-cat">${w.categoryLabel} · ${VOY.formatDistance(w.distance)}</div>
          <div class="popup-row">
            <span>⭐ ${w.rating}</span>
            <span>Desde ${VOY.formatCLP(w.priceMin)}</span>
          </div>
          <br/>
          <button onclick="openWorkerDetail(${w.id})" style="width:100%;padding:6px;background:#2563EB;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:12px;">Ver perfil</button>
        </div>
      `);
    m.on('click', () => openWorkerDetail(w.id));
    markers.push(m);
  });
}

/* ── Worker detail ──────────────────────── */
function openWorkerDetail(id) {
  selectedWorker = VOY_DATA.workers.find(w => w.id === id);
  if (!selectedWorker) return;

  document.getElementById('detailWorkerName').textContent = selectedWorker.name;
  const isFav = favorites.has(id);
  const favBtn = document.getElementById('btnFavorite');
  favBtn.innerHTML = isFav ? '<i class="fa-solid fa-heart" style="color:#ef4444;"></i>' : '<i class="fa-regular fa-heart"></i>';

  const cat = VOY.getCategoryById(selectedWorker.category);

  document.getElementById('workerDetailBody').innerHTML = `
    <!-- Profile header -->
    <div style="text-align:center; padding: var(--sp-5) 0; border-bottom:1px solid var(--gray-100); margin-bottom:var(--sp-5);">
      <div style="position:relative; display:inline-block; margin-bottom:var(--sp-4);">
        <img src="${selectedWorker.avatar}" alt="${selectedWorker.name}" class="avatar avatar-xl" style="width:88px;height:88px;" />
        <span class="status-dot ${selectedWorker.available ? 'online' : 'offline'}" style="position:absolute; bottom:4px; right:4px; width:14px; height:14px; border:3px solid white;"></span>
      </div>
      <h2 style="font-size:var(--text-xl); font-weight:700; color:var(--gray-900); margin-bottom:var(--sp-1);">
        ${selectedWorker.name}
        ${selectedWorker.verified ? '<i class="fa-solid fa-circle-check" style="color:var(--color-primary); font-size:var(--text-lg);"></i>' : ''}
      </h2>
      <span class="badge badge-blue" style="background:${cat.bg}; color:${cat.color};">
        <i class="fa-solid ${cat.icon}"></i> ${selectedWorker.categoryLabel}
      </span>
      <div style="display:flex; justify-content:center; gap:var(--sp-6); margin-top:var(--sp-4);">
        <div style="text-align:center;">
          <div style="font-size:var(--text-xl); font-weight:800; color:var(--gray-900);">${selectedWorker.rating}</div>
          <div style="font-size:var(--text-xs); color:var(--gray-400);">★ Rating</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:var(--text-xl); font-weight:800; color:var(--gray-900);">${selectedWorker.reviews}</div>
          <div style="font-size:var(--text-xs); color:var(--gray-400);">Reseñas</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:var(--text-xl); font-weight:800; color:var(--gray-900);">${selectedWorker.completedJobs}</div>
          <div style="font-size:var(--text-xs); color:var(--gray-400);">Trabajos</div>
        </div>
      </div>
    </div>

    <!-- Info chips -->
    <div style="display:flex; flex-wrap:wrap; gap:var(--sp-2); margin-bottom:var(--sp-5);">
      <span class="badge badge-gray"><i class="fa-solid fa-location-dot" style="color:var(--color-primary);"></i> ${selectedWorker.city} · ${VOY.formatDistance(selectedWorker.distance)}</span>
      <span class="badge badge-gray"><i class="fa-solid fa-clock" style="color:var(--color-primary);"></i> Responde ${selectedWorker.responseTime}</span>
      <span class="badge ${selectedWorker.available ? 'badge-green' : 'badge-gray'}">${selectedWorker.available ? '● Disponible ahora' : '○ No disponible'}</span>
    </div>

    <!-- Bio -->
    <div class="detail-section">
      <h4>Sobre mí</h4>
      <p style="font-size:var(--text-sm); color:var(--gray-600); line-height:1.7;">${selectedWorker.bio}</p>
    </div>

    <!-- Skills -->
    <div class="detail-section">
      <h4>Especialidades</h4>
      <div class="skill-tags">
        ${selectedWorker.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
      </div>
    </div>

    <!-- Pricing -->
    <div class="detail-section">
      <h4>Tarifas</h4>
      <div style="background:var(--blue-50); border-radius:var(--radius-xl); padding:var(--sp-4);">
        <div style="font-size:var(--text-2xl); font-weight:800; color:var(--color-primary);">
          ${VOY.formatCLP(selectedWorker.priceMin)} – ${VOY.formatCLP(selectedWorker.priceMax)}
        </div>
        <div style="font-size:var(--text-sm); color:var(--gray-500);">por ${selectedWorker.priceUnit} · Precio final acordado con el profesional</div>
      </div>
    </div>

    <!-- Gallery -->
    ${selectedWorker.gallery.length > 0 ? `
    <div class="detail-section">
      <h4>Trabajos realizados</h4>
      <div class="gallery-row">
        ${selectedWorker.gallery.map(img => `<img src="${img}" alt="Trabajo" />`).join('')}
      </div>
    </div>` : ''}

    <!-- Reviews -->
    <div class="detail-section">
      <h4>Reseñas recientes</h4>
      ${generateMockReviews(selectedWorker)}
    </div>
  `;

  document.getElementById('workerDetail').classList.add('open');

  // Update booking modal
  const svc = document.getElementById('bookingService');
  if (svc) {
    svc.innerHTML = selectedWorker.skills.map(s => `<option>${s}</option>`).join('');
  }
  const info = document.getElementById('bookingWorkerInfo');
  if (info) {
    info.innerHTML = `
      <img src="${selectedWorker.avatar}" alt="${selectedWorker.name}" class="avatar avatar-md" />
      <div>
        <div style="font-weight:700; color:var(--gray-900);">${selectedWorker.name}</div>
        <div style="font-size:var(--text-sm); color:var(--gray-500);">${selectedWorker.categoryLabel} · ⭐ ${selectedWorker.rating}</div>
      </div>
      <div style="margin-left:auto; text-align:right;">
        <div style="font-weight:700; color:var(--color-primary);">Desde ${VOY.formatCLP(selectedWorker.priceMin)}</div>
        <div style="font-size:var(--text-xs); color:var(--gray-400);">/ ${selectedWorker.priceUnit}</div>
      </div>`;
  }
  updateBookingSummary();

  // Highlight on map
  if (map) map.flyTo([selectedWorker.lat, selectedWorker.lng], 14, { duration: 0.8 });
}

function generateMockReviews(worker) {
  const names = ['Sofía M.', 'Andrés R.', 'Carolina V.', 'Rodrigo P.'];
  const texts = [
    'Excelente trabajo, muy puntual y dejó todo muy limpio.',
    'Super profesional, resolvió el problema rápidamente. Lo recomiendo.',
    'Muy buen servicio, precio justo y trabajo impecable.',
    'Llegó a tiempo y el resultado fue perfecto. Volvería a contratar.',
  ];
  return names.slice(0, 3).map((name, i) => `
    <div class="review-item">
      <div class="review-header">
        <img src="https://i.pravatar.cc/32?img=${20 + i}" class="avatar avatar-xs" />
        <div>
          <div style="font-size:var(--text-sm); font-weight:600; color:var(--gray-900);">${name}</div>
          <div class="review-stars">★★★★★</div>
        </div>
        <span style="margin-left:auto; font-size:var(--text-xs); color:var(--gray-400);">Hace ${i + 1} semana${i > 0 ? 's' : ''}</span>
      </div>
      <div class="review-text">"${texts[i]}"</div>
    </div>`).join('');
}

function closeWorkerDetail() {
  document.getElementById('workerDetail').classList.remove('open');
  selectedWorker = null;
}

function toggleFavorite() {
  if (!selectedWorker) return;
  if (favorites.has(selectedWorker.id)) {
    favorites.delete(selectedWorker.id);
    document.getElementById('btnFavorite').innerHTML = '<i class="fa-regular fa-heart"></i>';
    VOY.showToast('Eliminado de favoritos', 'info');
  } else {
    favorites.add(selectedWorker.id);
    document.getElementById('btnFavorite').innerHTML = '<i class="fa-solid fa-heart" style="color:#ef4444;"></i>';
    VOY.showToast('Guardado en favoritos ❤️', 'success');
  }
  filterWorkers();
}

/* ── Booking ────────────────────────────── */
function quickBook(id) {
  openWorkerDetail(id);
  setTimeout(() => VOY.openModal('bookingModal'), 300);
}

function updateBookingSummary() {
  if (!selectedWorker) return;
  const el = document.getElementById('bookingPriceSummary');
  if (!el) return;
  const commission = Math.round(selectedWorker.priceMin * 0.15);
  el.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:var(--sp-2);">
      <span style="color:var(--gray-600);">Precio estimado</span>
      <strong>${VOY.formatCLP(selectedWorker.priceMin)} – ${VOY.formatCLP(selectedWorker.priceMax)}</strong>
    </div>
    <div style="display:flex; justify-content:space-between; margin-bottom:var(--sp-2);">
      <span style="color:var(--gray-600);">Cargo de servicio VOY (15%)</span>
      <span style="color:var(--gray-500);">Incluido</span>
    </div>
    <div style="height:1px; background:var(--blue-200); margin: var(--sp-3) 0;"></div>
    <div style="display:flex; justify-content:space-between;">
      <strong style="color:var(--gray-900);">Total estimado</strong>
      <strong style="color:var(--color-primary); font-size:var(--text-lg);">${VOY.formatCLP(selectedWorker.priceMin)}</strong>
    </div>
    <div style="font-size:var(--text-xs); color:var(--gray-400); margin-top:var(--sp-2);">El precio final se acuerda con el profesional antes del inicio del servicio.</div>`;
}

function confirmBooking() {
  if (!selectedWorker) return;
  VOY.closeModal('bookingModal');
  VOY.showToast(`¡Solicitud enviada a ${selectedWorker.name}!`, 'success');
  setTimeout(() => VOY.showToast('El profesional confirmará en breve.', 'info'), 1500);
}

/* ── Chat ───────────────────────────────── */
const chatLog = [
  { from: 'other', text: 'Hola, ¿en qué te puedo ayudar?', time: '14:30' },
  { from: 'me',    text: 'Hola Carlos, tengo una filtración en el baño.', time: '14:31' },
  { from: 'other', text: 'Claro, puedo ir esta tarde. ¿A qué hora te acomoda?', time: '14:32' },
];

function toggleChat() {
  const panel = document.getElementById('chatPanel');
  if (!panel) return;
  const showing = panel.style.display !== 'none';
  panel.style.display = showing ? 'none' : 'flex';
  panel.style.flexDirection = 'column';
  if (!showing) {
    renderChatMessages();
  }
}

function renderChatMessages() {
  const el = document.getElementById('chatMessages');
  if (!el) return;
  el.innerHTML = chatLog.map(m => `
    <div class="chat-msg ${m.from === 'me' ? 'sent' : 'received'}">
      <div class="chat-msg-bubble">${m.text}</div>
      <div class="chat-msg-time">${m.time}</div>
    </div>`).join('');
  el.scrollTop = el.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input?.value.trim();
  if (!text) return;
  const now = new Date();
  chatLog.push({ from: 'me', text, time: `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}` });
  input.value = '';
  renderChatMessages();
  // Auto reply
  setTimeout(() => {
    chatLog.push({ from: 'other', text: '¡Perfecto! Te confirmo de inmediato.', time: `${now.getHours()}:${String(now.getMinutes()+1).padStart(2,'0')}` });
    renderChatMessages();
  }, 1500);
}

function handleChatKey(e) {
  if (e.key === 'Enter') sendMessage();
}

function openChat() {
  closeWorkerDetail();
  toggleChat();
}

/* ── Active services ────────────────────── */
function loadActiveServices() {
  const el = document.getElementById('activeServices');
  if (!el) return;
  const active = VOY_DATA.bookings.filter(b => b.status === 'active' || b.status === 'pending');
  if (!active.length) {
    el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-calendar-days"></i><h3>Sin servicios activos</h3><p>Cuando agendes un servicio aparecerá aquí.</p></div>';
    return;
  }
  el.innerHTML = active.map(b => {
    const worker = VOY_DATA.workers.find(w => w.id === b.workerId);
    const statusColors = { active: 'badge-green', pending: 'badge-yellow' };
    const statusLabels = { active: 'En curso', pending: 'Pendiente' };
    return `
    <div class="card" style="margin-bottom:var(--sp-4);">
      <div class="card-body">
        <div style="display:flex; align-items:center; gap:var(--sp-4);">
          <img src="${worker?.avatar}" class="avatar avatar-lg" />
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:var(--sp-3); margin-bottom:var(--sp-1);">
              <strong>${worker?.name}</strong>
              <span class="badge ${statusColors[b.status]}">${statusLabels[b.status]}</span>
            </div>
            <div style="font-size:var(--text-sm); color:var(--gray-600);">${b.service}</div>
            <div style="font-size:var(--text-xs); color:var(--gray-400); margin-top:var(--sp-1);">
              <i class="fa-solid fa-calendar" style="color:var(--color-primary);"></i> ${b.date} a las ${b.time} &nbsp;
              <i class="fa-solid fa-location-dot" style="color:var(--color-primary);"></i> ${b.address}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700; color:var(--color-primary); font-size:var(--text-lg);">${VOY.formatCLP(b.price)}</div>
            <div style="font-size:var(--text-xs); color:var(--gray-400);">Ref: ${b.id}</div>
          </div>
        </div>
        <div style="display:flex; gap:var(--sp-3); margin-top:var(--sp-4);">
          <button class="btn btn-outline btn-sm" onclick="toggleChat()"><i class="fa-solid fa-comment-dots"></i> Mensaje</button>
          ${b.status === 'active' ? '<button class="btn btn-danger btn-sm"><i class="fa-solid fa-xmark"></i> Cancelar</button>' : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ── Historial ──────────────────────────── */
function loadHistorial() {
  const el = document.getElementById('historialTable');
  if (!el) return;
  const completed = VOY_DATA.bookings.filter(b => b.status === 'completed');
  el.innerHTML = `
    <thead>
      <tr>
        <th>Ref.</th>
        <th>Servicio</th>
        <th>Profesional</th>
        <th>Fecha</th>
        <th>Total</th>
        <th>Estado</th>
        <th>Calificación</th>
      </tr>
    </thead>
    <tbody>
      ${completed.map(b => {
        const w = VOY_DATA.workers.find(x => x.id === b.workerId);
        return `<tr>
          <td><code style="font-size:var(--text-xs); background:var(--gray-100); padding:2px 6px; border-radius:4px;">${b.id}</code></td>
          <td>${b.service}</td>
          <td>
            <div style="display:flex; align-items:center; gap:var(--sp-2);">
              <img src="${w?.avatar}" class="avatar avatar-xs" />
              ${w?.name}
            </div>
          </td>
          <td>${b.date}</td>
          <td style="font-weight:600; color:var(--color-primary);">${VOY.formatCLP(b.price)}</td>
          <td><span class="badge badge-green">Completado</span></td>
          <td>${b.rating ? '★'.repeat(b.rating) : '-'}</td>
        </tr>`;
      }).join('')}
    </tbody>`;
}

/* ── Client profile ─────────────────────── */
function loadClientProfile() {
  const el = document.getElementById('clientProfile');
  if (!el) return;
  const client = VOY_DATA.clients[0];
  el.innerHTML = `
    <div style="display:grid; grid-template-columns:300px 1fr; gap:var(--sp-6);">
      <div class="card">
        <div class="card-body" style="text-align:center; padding:var(--sp-8);">
          <img src="${client.avatar}" class="avatar avatar-xl" style="width:96px;height:96px; margin:0 auto var(--sp-4);" />
          <h2 style="font-size:var(--text-xl); font-weight:700; margin-bottom:var(--sp-1);">${client.name}</h2>
          <p style="color:var(--gray-500); font-size:var(--text-sm); margin-bottom:var(--sp-4);">
            <i class="fa-solid fa-location-dot" style="color:var(--color-primary);"></i> ${client.city}
          </p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-3); text-align:center; padding:var(--sp-4); background:var(--gray-50); border-radius:var(--radius-xl);">
            <div><div style="font-size:var(--text-xl); font-weight:800;">${client.totalServices}</div><div style="font-size:var(--text-xs); color:var(--gray-400);">Servicios</div></div>
            <div><div style="font-size:var(--text-xl); font-weight:800;">5</div><div style="font-size:var(--text-xs); color:var(--gray-400);">Reseñas</div></div>
          </div>
          <button class="btn btn-outline btn-block" style="margin-top:var(--sp-4);">
            <i class="fa-solid fa-pencil"></i> Editar perfil
          </button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><strong>Información personal</strong></div>
        <div class="card-body">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-4);">
            <div class="input-group"><label class="input-label">Nombre completo</label><input class="input" value="${client.name}" /></div>
            <div class="input-group"><label class="input-label">Teléfono</label><input class="input" value="+56 9 8765 4321" /></div>
            <div class="input-group"><label class="input-label">Email</label><input class="input" value="sofia.mendoza@gmail.com" /></div>
            <div class="input-group"><label class="input-label">Ciudad</label><input class="input" value="${client.city}" /></div>
          </div>
          <button class="btn btn-primary" style="margin-top:var(--sp-5);" onclick="VOY.showToast('Perfil actualizado', 'success')">
            <i class="fa-solid fa-check"></i> Guardar cambios
          </button>
        </div>
      </div>
    </div>`;
}

/* ── Pagos ──────────────────────────────── */
function loadPagos() {
  const el = document.getElementById('pagosView');
  if (!el) return;
  el.innerHTML = `
    <div style="display:grid; grid-template-columns: 360px 1fr; gap:var(--sp-6);">
      <div class="card">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;">
          <strong>Métodos guardados</strong>
          <button class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> Agregar</button>
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:var(--sp-3);">
          <div style="display:flex;align-items:center;gap:var(--sp-4);padding:var(--sp-4);border:1.5px solid var(--color-primary);border-radius:var(--radius-xl);background:var(--blue-50);">
            <i class="fa-brands fa-cc-visa" style="font-size:2rem;color:#1a1f71;"></i>
            <div style="flex:1;"><div style="font-weight:600;">Visa •••• 4321</div><div style="font-size:var(--text-xs);color:var(--gray-400);">Vence 09/27</div></div>
            <span class="badge badge-blue">Principal</span>
          </div>
          <div style="display:flex;align-items:center;gap:var(--sp-4);padding:var(--sp-4);border:1.5px solid var(--gray-200);border-radius:var(--radius-xl);">
            <i class="fa-brands fa-cc-mastercard" style="font-size:2rem;color:#eb001b;"></i>
            <div style="flex:1;"><div style="font-weight:600;">Mastercard •••• 8890</div><div style="font-size:var(--text-xs);color:var(--gray-400);">Vence 03/26</div></div>
          </div>
          <div style="padding:var(--sp-4);border:1.5px dashed var(--gray-300);border-radius:var(--radius-xl);text-align:center;cursor:pointer;color:var(--gray-400);">
            <i class="fa-solid fa-plus"></i> Agregar Webpay / Transferencia
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><strong>Últimas transacciones</strong></div>
        <div class="card-body" style="padding:0;">
          <table class="data-table">
            <thead><tr><th>Fecha</th><th>Servicio</th><th>Monto</th><th>Estado</th></tr></thead>
            <tbody>
              <tr><td>08 Mar 2026</td><td>Reparación de filtración</td><td style="color:var(--color-danger);">-$35.000</td><td><span class="badge badge-green">Pagado</span></td></tr>
              <tr><td>01 Mar 2026</td><td>Instalación eléctrica</td><td style="color:var(--color-danger);">-$48.000</td><td><span class="badge badge-green">Pagado</span></td></tr>
              <tr><td>20 Feb 2026</td><td>Limpieza hogar</td><td style="color:var(--color-danger);">-$32.000</td><td><span class="badge badge-green">Pagado</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

/* ── Favorites ──────────────────────────── */
function loadFavorites() {
  const el = document.getElementById('favoritosGrid');
  if (!el) return;
  const favWorkers = VOY_DATA.workers.filter(w => favorites.has(w.id));
  if (!favWorkers.length) {
    el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-heart"></i><h3>Sin favoritos</h3><p>Guarda profesionales que te gusten para encontrarlos fácil.</p></div>';
    return;
  }
  el.innerHTML = favWorkers.map(w => {
    const cat = VOY.getCategoryById(w.category);
    return `
    <div class="provider-card" onclick="openWorkerDetail(${w.id})">
      <img src="${w.avatar}" class="avatar avatar-md" />
      <div class="provider-card-body">
        <div class="provider-card-name">${w.name} <i class="fa-solid fa-heart" style="color:#ef4444;"></i></div>
        <span class="badge badge-blue" style="background:${cat.bg};color:${cat.color};">${w.categoryLabel}</span>
        <div class="provider-card-meta" style="margin-top:var(--sp-2);">
          <span>⭐ ${w.rating}</span>
          <span>📍 ${VOY.formatDistance(w.distance)}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ── Notifications ──────────────────────── */
function loadNotifications() {
  const el = document.getElementById('notifList');
  if (!el) return;
  const notifs = [
    { icon: '✅', bg: '#d1fae5', text: '<strong>Carlos Muñoz</strong> confirmó tu reserva para el 15 de marzo.', time: 'Hace 2 horas', unread: true },
    { icon: '⭐', bg: '#fef3c7', text: 'Califica tu servicio de <strong>gasfitería</strong> del 8 de marzo.', time: 'Hace 3 días', unread: true },
    { icon: '💬', bg: '#dbeafe', text: '<strong>Ana Ramírez</strong> te envió un mensaje.', time: 'Hace 5 días', unread: false },
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

function openNotifications() { VOY.openModal('notifModal'); }

/* ── View switcher ──────────────────────── */
function showView(name) {
  document.querySelectorAll('[id^="view-"]').forEach(v => v.classList.add('hidden'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`view-${name}`)?.classList.remove('hidden');
  event?.currentTarget?.classList.add('active');

  if (name === 'favoritos') loadFavorites();
}

/* ── Close modals on overlay click ─────── */
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) VOY.closeModal(overlay.id);
  });
});
