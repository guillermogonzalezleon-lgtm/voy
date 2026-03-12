/* ============================================
   VOY — Agregar autenticación a Airtable
   Ejecutar UNA VEZ: node setup/add-auth.js
   ============================================ */

const TOKEN  = process.env.VOY_AIRTABLE_TOKEN;
const BASE   = process.env.VOY_AIRTABLE_BASE;
if (!TOKEN || !BASE) {
  console.error('❌ Falta VOY_AIRTABLE_TOKEN o VOY_AIRTABLE_BASE');
  process.exit(1);
}

const META = `https://api.airtable.com/v0/meta/bases/${BASE}/tables`;
const API  = `https://api.airtable.com/v0/${BASE}`;
const H    = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const { createHash } = await import('crypto');

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

async function req(url, opts = {}) {
  const r = await fetch(url, { headers: H, ...opts });
  const body = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(body?.error)}`);
  return body;
}

/* ── 1. Obtener tablas existentes ─────────── */
console.log('📋 Obteniendo tablas...');
const { tables } = await req(META);
const workersTable = tables.find(t => t.name === 'Workers');
const clientsTable = tables.find(t => t.name === 'Clients');

if (!workersTable || !clientsTable) {
  console.error('❌ No se encontraron las tablas Workers o Clients. Ejecuta seed.js primero.');
  process.exit(1);
}

/* ── 2. Agregar campo PasswordHash ───────── */
async function addPasswordHashField(tableId, tableName) {
  const table = tables.find(t => t.id === tableId);
  const exists = table.fields.some(f => f.name === 'PasswordHash');
  if (exists) {
    console.log(`✅ PasswordHash ya existe en ${tableName}`);
    return;
  }
  console.log(`➕ Agregando PasswordHash a ${tableName}...`);
  await req(`${META}/${tableId}/fields`, {
    method: 'POST',
    body: JSON.stringify({ name: 'PasswordHash', type: 'singleLineText' }),
  });
  console.log(`✅ Campo PasswordHash agregado a ${tableName}`);
}

await addPasswordHashField(workersTable.id, 'Workers');
await addPasswordHashField(clientsTable.id, 'Clients');

/* ── 3. Configurar contraseñas demo ───────── */
// Contraseña demo: "demo1234" para el primer worker y primer cliente
const demoHash = sha256('demo1234');

async function setDemoPassword(table, filterField, filterValue, label) {
  const formula = encodeURIComponent(`{${filterField}}="${filterValue}"`);
  const data = await req(`${API}/${encodeURIComponent(table)}?filterByFormula=${formula}&maxRecords=1`);
  if (!data.records.length) {
    console.log(`⚠️  No se encontró ${label}`);
    return;
  }
  const rec = data.records[0];
  if (rec.fields.PasswordHash) {
    console.log(`✅ ${label} ya tiene contraseña`);
    return;
  }
  await req(`${API}/${encodeURIComponent(table)}/${rec.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: { PasswordHash: demoHash } }),
  });
  console.log(`🔑 Contraseña demo configurada para ${label}`);
}

// Worker 1 (Carlos Muñoz) — email: carlos@voy.cl
await setDemoPassword('Workers', 'Email', 'carlos@voy.cl', 'Carlos Muñoz (worker demo)');

// Cliente 1 (Sofía Mendoza) — email: sofia@voy.cl
await setDemoPassword('Clients', 'Email', 'sofia@voy.cl', 'Sofía Mendoza (cliente demo)');

console.log('\n✅ Auth configurado exitosamente.');
console.log('   Cliente demo:      sofia@voy.cl    / demo1234');
console.log('   Profesional demo:  carlos@voy.cl   / demo1234');
console.log('   Admin:             admin@voy.cl     / voy2026');
