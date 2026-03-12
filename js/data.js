/* ============================================
   VOY — Data Layer
   Combina categorías locales + datos de Airtable
   ============================================ */

const VOY_DATA = {
  /* Las categorías son estáticas (no cambian) */
  categories: [
    { id: 'gasfiteria',   label: 'Gasfitería',   icon: 'fa-faucet',       color: '#2563EB', bg: '#DBEAFE' },
    { id: 'electricidad', label: 'Electricidad',  icon: 'fa-bolt',         color: '#0EA5E9', bg: '#E0F2FE' },
    { id: 'pintura',      label: 'Pintura',        icon: 'fa-paint-roller', color: '#8B5CF6', bg: '#EDE9FE' },
    { id: 'mecanica',     label: 'Mecánica',       icon: 'fa-wrench',       color: '#F59E0B', bg: '#FEF3C7' },
    { id: 'belleza',      label: 'Belleza',        icon: 'fa-scissors',     color: '#EC4899', bg: '#FCE7F3' },
    { id: 'profesores',   label: 'Clases',         icon: 'fa-book-open',    color: '#10B981', bg: '#D1FAE5' },
    { id: 'baile',        label: 'Baile',           icon: 'fa-music',        color: '#F97316', bg: '#FFEDD5' },
    { id: 'limpieza',     label: 'Limpieza',       icon: 'fa-broom',        color: '#14B8A6', bg: '#CCFBF1' },
  ],

  /* Cargados desde Airtable al init */
  workers:  [],
  clients:  [],
  bookings: [],
  stats:    { totalWorkers:0, totalClients:0, totalServices:0, avgRating:0, totalRevenue:0, pendingVerifications:0 },

  /* ── Init: carga todo desde Airtable ──── */
  async init() {
    try {
      const [workers, clients, bookings, stats] = await Promise.all([
        VoyDB.getWorkers(),
        VoyDB.getClients(),
        VoyDB.getBookings(),
        VoyDB.getStats(),
      ]);
      this.workers  = workers;
      this.clients  = clients;
      this.bookings = bookings;
      this.stats    = stats;
    } catch (e) {
      console.error('Error cargando datos de Airtable:', e);
      throw e;
    }
  },
};

/* ── Helpers (sin cambios) ───────────────── */
const VOY = {
  formatCLP(amount) {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
  },
  formatDistance(km) {
    return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`;
  },
  getCategoryById(id) {
    return VOY_DATA.categories.find(c => c.id === id);
  },
  getWorkersByCategory(cat) {
    if (!cat || cat === 'all') return VOY_DATA.workers;
    return VOY_DATA.workers.filter(w => w.category === cat);
  },
  filterByDistance(workers, maxKm) {
    return workers.filter(w => w.distance <= maxKm);
  },
  renderStars(rating) {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  },
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { info: '💡', success: '✅', error: '❌', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },
  openModal(id) {
    document.getElementById(id)?.classList.add('active');
    document.body.style.overflow = 'hidden';
  },
  closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
    document.body.style.overflow = '';
  },
  showLoading(containerId, msg = 'Cargando...') {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<div class="empty-state" style="padding:var(--sp-10);">
      <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:var(--color-primary);"></i>
      <p style="margin-top:var(--sp-4);color:var(--gray-400);">${msg}</p>
    </div>`;
  },
  showError(containerId, msg = 'Error al cargar datos. Intenta nuevamente.') {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = `<div class="empty-state" style="padding:var(--sp-10);">
      <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem;color:var(--color-danger);"></i>
      <p style="margin-top:var(--sp-4);color:var(--gray-500);">${msg}</p>
    </div>`;
  },
};
