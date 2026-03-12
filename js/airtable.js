/* ============================================
   VOY — Airtable API Layer
   Todas las operaciones CRUD contra Airtable
   ============================================ */

const VoyDB = (() => {
  const BASE = 'https://api.airtable.com/v0';
  const token  = () => VOY_CONFIG.airtable.token;
  const baseId = () => VOY_CONFIG.airtable.baseId;

  const headers = () => ({
    Authorization: `Bearer ${token()}`,
    'Content-Type': 'application/json',
  });

  /* ── Core fetch ─────────────────────────── */
  async function request(path, options = {}) {
    const url = `${BASE}/${baseId()}/${path}`;
    const res = await fetch(url, { headers: headers(), ...options });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Airtable ${res.status}: ${err?.error?.message || res.statusText}`);
    }
    return res.json();
  }

  async function listAll(table, params = '') {
    let records = [], offset = null;
    do {
      const q = offset ? `${params}&offset=${offset}` : params;
      const data = await request(`${encodeURIComponent(table)}?${q}`);
      records.push(...data.records);
      offset = data.offset || null;
    } while (offset);
    return records;
  }

  /* ── Mappers ─────────────────────────────── */
  function mapWorker(rec) {
    const f = rec.fields;
    return {
      _recordId:    rec.id,
      id:           f.WorkerId,
      name:         f.Name         || '',
      avatar:       f.Avatar       || '',
      category:     f.Category     || '',
      categoryLabel:f.CategoryLabel|| '',
      rating:       f.Rating       || 0,
      reviews:      f.Reviews      || 0,
      distance:     f.Distance     || 0,
      priceMin:     f.PriceMin     || 0,
      priceMax:     f.PriceMax     || 0,
      priceUnit:    f.PriceUnit    || '',
      city:         f.City         || '',
      lat:          f.Lat          || 0,
      lng:          f.Lng          || 0,
      verified:     f.Verified     || false,
      available:    f.Available    || false,
      completedJobs:f.CompletedJobs|| 0,
      responseTime: f.ResponseTime || '',
      bio:          f.Bio          || '',
      skills:       f.Skills       ? f.Skills.split(',').map(s => s.trim()) : [],
      gallery:      f.Gallery      ? f.Gallery.split(',').map(s => s.trim()).filter(Boolean) : [],
      phone:        f.Phone        || '',
      email:        f.Email        || '',
    };
  }

  function mapClient(rec) {
    const f = rec.fields;
    return {
      _recordId:    rec.id,
      id:           f.ClientId,
      name:         f.Name          || '',
      avatar:       f.Avatar        || '',
      city:         f.City          || '',
      memberSince:  f.MemberSince   || '',
      totalServices:f.TotalServices || 0,
      lat:          f.Lat           || 0,
      lng:          f.Lng           || 0,
      phone:        f.Phone         || '',
      email:        f.Email         || '',
    };
  }

  function mapBooking(rec) {
    const f = rec.fields;
    return {
      _recordId:      rec.id,
      id:             f.BookingId     || '',
      clientId:       f.ClientId      || 0,
      workerId:       f.WorkerId      || 0,
      category:       f.Category      || '',
      service:        f.Service       || '',
      status:         f.Status        || 'pending',
      date:           f.Date          || '',
      time:           f.Time          || '',
      address:        f.Address       || '',
      price:          f.Price         || 0,
      commission:     f.Commission    || 0,
      rating:         f.Rating        || null,
      review:         f.Review        || null,
    };
  }

  function mapRequest(rec) {
    const f = rec.fields;
    return {
      _recordId:     rec.id,
      id:            f.ReqId          || '',
      clientName:    f.ClientName     || '',
      clientAvatar:  f.ClientAvatar   || '',
      clientRating:  f.ClientRating   || 0,
      service:       f.Service        || '',
      date:          f.Date           || '',
      time:          f.Time           || '',
      address:       f.Address        || '',
      estimatedPrice:f.EstimatedPrice || 0,
      isNew:         f.IsNew          || false,
      status:        f.Status         || 'pending',
      distance:      f.Distance       || 0,
      workerRecordId:f.WorkerRecordId || '',
    };
  }

  function mapVerification(rec) {
    const f = rec.fields;
    return {
      _recordId:   rec.id,
      id:          f.VerifId     || '',
      name:        f.WorkerName  || '',
      avatar:      f.Avatar      || '',
      category:    f.Category    || '',
      date:        f.RequestDate || '',
      docs:        f.Docs ? f.Docs.split(',').map(s => s.trim()) : [],
      status:      f.Status      || 'pending',
    };
  }

  function mapTransaction(rec) {
    const f = rec.fields;
    return {
      _recordId:  rec.id,
      id:         f.TxId        || '',
      date:       f.Date        || '',
      client:     f.ClientName  || '',
      worker:     f.WorkerName  || '',
      svc:        f.Service     || '',
      gross:      f.Gross       || 0,
      status:     f.Status      || 'completed',
    };
  }

  function mapMessage(rec) {
    const f = rec.fields;
    return {
      _recordId:      rec.id,
      conversationId: f.ConversationId || '',
      from:           f.From           || 'other',
      text:           f.Text           || '',
      time:           f.TimeStr        || '',
    };
  }

  /* ── Workers ─────────────────────────────── */
  async function getWorkers(filters = {}) {
    let formula = '';
    if (filters.category && filters.category !== 'all') {
      formula = `{Category}="${filters.category}"`;
    }
    const params = formula ? `filterByFormula=${encodeURIComponent(formula)}` : '';
    const records = await listAll('Workers', params);
    return records.map(mapWorker);
  }

  async function getWorkerByRecordId(recordId) {
    const rec = await request(`Workers/${recordId}`);
    return mapWorker(rec);
  }

  async function updateWorker(recordId, fields) {
    const rec = await request(`Workers/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    });
    return mapWorker(rec);
  }

  async function updateWorkerAvailability(recordId, available) {
    return updateWorker(recordId, { Available: available });
  }

  async function saveWorkerProfile(recordId, data) {
    const fields = {};
    if (data.name)         fields.Name         = data.name;
    if (data.phone)        fields.Phone        = data.phone;
    if (data.email)        fields.Email        = data.email;
    if (data.city)         fields.City         = data.city;
    if (data.bio)          fields.Bio          = data.bio;
    if (data.priceMin)     fields.PriceMin     = Number(data.priceMin);
    if (data.priceMax)     fields.PriceMax     = Number(data.priceMax);
    if (data.skills)       fields.Skills       = Array.isArray(data.skills) ? data.skills.join(', ') : data.skills;
    return updateWorker(recordId, fields);
  }

  /* ── Clients ─────────────────────────────── */
  async function getClients() {
    const records = await listAll('Clients');
    return records.map(mapClient);
  }

  async function saveClientProfile(recordId, data) {
    const fields = {};
    if (data.name)  fields.Name  = data.name;
    if (data.phone) fields.Phone = data.phone;
    if (data.email) fields.Email = data.email;
    if (data.city)  fields.City  = data.city;
    const rec = await request(`Clients/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    });
    return mapClient(rec);
  }

  /* ── Bookings ────────────────────────────── */
  async function getBookings(filters = {}) {
    let formula = '';
    if (filters.status) formula = `{Status}="${filters.status}"`;
    const params = formula ? `filterByFormula=${encodeURIComponent(formula)}` : '';
    const records = await listAll('Bookings', params);
    return records.map(mapBooking);
  }

  async function createBooking(data) {
    const nextId = 'VOY-' + String(Date.now()).slice(-4);
    const commission = Math.round((data.price || 0) * 0.15);
    const rec = await request('Bookings', {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          BookingId:  nextId,
          ClientId:   data.clientId   || 101,
          WorkerId:   data.workerId,
          Category:   data.category   || '',
          Service:    data.service    || '',
          Status:     'pending',
          Date:       data.date       || '',
          Time:       data.time       || '',
          Address:    data.address    || '',
          Price:      data.price      || 0,
          Commission: commission,
        },
      }),
    });
    return mapBooking(rec);
  }

  async function updateBookingStatus(recordId, status) {
    const rec = await request(`Bookings/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: { Status: status } }),
    });
    return mapBooking(rec);
  }

  async function addBookingReview(recordId, rating, review) {
    const rec = await request(`Bookings/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: { Rating: rating, Review: review } }),
    });
    return mapBooking(rec);
  }

  /* ── Requests ────────────────────────────── */
  async function getRequests(workerRecordId) {
    let formula = workerRecordId
      ? `{WorkerRecordId}="${workerRecordId}"`
      : '';
    const params = formula ? `filterByFormula=${encodeURIComponent(formula)}` : '';
    const records = await listAll('Requests', params);
    return records.map(mapRequest);
  }

  async function createRequest(data) {
    const rec = await request('Requests', {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          ReqId:          'REQ-' + String(Date.now()).slice(-3),
          ClientName:     data.clientName     || '',
          ClientAvatar:   data.clientAvatar   || '',
          ClientRating:   data.clientRating   || 5,
          Service:        data.service        || '',
          Date:           data.date           || '',
          Time:           data.time           || '',
          Address:        data.address        || '',
          EstimatedPrice: data.estimatedPrice || 0,
          IsNew:          true,
          Status:         'pending',
          Distance:       data.distance       || 0,
          WorkerRecordId: data.workerRecordId || '',
        },
      }),
    });
    return mapRequest(rec);
  }

  async function updateRequest(recordId, fields) {
    const rec = await request(`Requests/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    });
    return mapRequest(rec);
  }

  async function updateRequestStatus(recordId, status) {
    return updateRequest(recordId, { Status: status, IsNew: false });
  }

  /* ── Verifications ───────────────────────── */
  async function getVerifications(status = '') {
    let formula = status ? `{Status}="${status}"` : '';
    const params = formula ? `filterByFormula=${encodeURIComponent(formula)}` : '';
    const records = await listAll('Verifications', params);
    return records.map(mapVerification);
  }

  async function updateVerification(recordId, status) {
    const rec = await request(`Verifications/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields: { Status: status } }),
    });
    return mapVerification(rec);
  }

  /* ── Transactions ────────────────────────── */
  async function getTransactions() {
    const records = await listAll('Transactions', 'sort[0][field]=Date&sort[0][direction]=desc');
    return records.map(mapTransaction);
  }

  async function createTransaction(data) {
    const rec = await request('Transactions', {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          TxId:       'VOY-' + String(Date.now()).slice(-4),
          Date:       data.date        || new Date().toLocaleDateString('es-CL'),
          ClientName: data.clientName  || '',
          WorkerName: data.workerName  || '',
          Service:    data.service     || '',
          Gross:      data.gross       || 0,
          Status:     data.status      || 'completed',
        },
      }),
    });
    return mapTransaction(rec);
  }

  /* ── Messages ────────────────────────────── */
  async function getMessages(conversationId) {
    const formula = `{ConversationId}="${conversationId}"`;
    const records = await listAll('Messages',
      `filterByFormula=${encodeURIComponent(formula)}&sort[0][field]=Timestamp&sort[0][direction]=asc`
    );
    return records.map(mapMessage);
  }

  async function sendMessage(conversationId, from, text) {
    const now = new Date();
    const time = `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    const rec = await request('Messages', {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          ConversationId: conversationId,
          From:           from,
          Text:           text,
          TimeStr:        time,
          Timestamp:      now.toISOString(),
        },
      }),
    });
    return mapMessage(rec);
  }

  /* ── Stats (cálculo dinámico) ────────────── */
  async function getStats() {
    const [workers, clients, bookings, verifs] = await Promise.all([
      getWorkers(),
      getClients(),
      getBookings(),
      getVerifications('pending'),
    ]);
    const completed = bookings.filter(b => b.status === 'completed');
    const totalRevenue = completed.reduce((sum, b) => sum + (b.price || 0), 0);
    const ratings = workers.filter(w => w.rating > 0).map(w => w.rating);
    const avgRating = ratings.length ? (ratings.reduce((a,b) => a+b,0) / ratings.length) : 0;
    return {
      totalWorkers:          workers.length,
      totalClients:          clients.length,
      totalServices:         completed.length,
      avgRating:             Math.round(avgRating * 10) / 10,
      totalRevenue:          totalRevenue,
      pendingVerifications:  verifs.length,
    };
  }

  /* ── Favoritos (localStorage) ────────────── */
  function getFavorites() {
    try { return new Set(JSON.parse(localStorage.getItem('voy_favorites') || '[]')); }
    catch { return new Set(); }
  }

  function saveFavorites(set) {
    localStorage.setItem('voy_favorites', JSON.stringify([...set]));
  }

  function toggleFavoriteLocal(workerId) {
    const favs = getFavorites();
    if (favs.has(workerId)) favs.delete(workerId);
    else favs.add(workerId);
    saveFavorites(favs);
    return favs;
  }

  /* ── Exports públicos ────────────────────── */
  return {
    getWorkers, getWorkerByRecordId, updateWorker,
    updateWorkerAvailability, saveWorkerProfile,
    getClients, saveClientProfile,
    getBookings, createBooking, updateBookingStatus, addBookingReview,
    getRequests, createRequest, updateRequest, updateRequestStatus,
    getVerifications, updateVerification,
    getTransactions, createTransaction,
    getMessages, sendMessage,
    getStats,
    getFavorites, saveFavorites, toggleFavoriteLocal,
  };
})();
