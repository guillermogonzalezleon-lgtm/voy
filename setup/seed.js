/* ============================================
   VOY — Setup Airtable (Node.js)
   Ejecutar UNA VEZ: node setup/seed.js
   Requiere Node 18+ (fetch nativo)
   ============================================ */

// Configura estas variables antes de ejecutar:
// export VOY_AIRTABLE_TOKEN="patXXX..."
// export VOY_AIRTABLE_BASE="appXXX..."
const TOKEN  = process.env.VOY_AIRTABLE_TOKEN;
const BASE   = process.env.VOY_AIRTABLE_BASE;
if (!TOKEN || !BASE) { console.error('❌ Falta VOY_AIRTABLE_TOKEN o VOY_AIRTABLE_BASE'); process.exit(1); }
const META   = `https://api.airtable.com/v0/meta/bases/${BASE}/tables`;
const API    = `https://api.airtable.com/v0/${BASE}`;

const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

async function req(url, opts = {}) {
  const r = await fetch(url, { headers: H, ...opts });
  const body = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(body?.error)}`);
  return body;
}

/* ── Tablas ─────────────────────────────────── */
const TABLES = [
  {
    name: 'Workers',
    fields: [
      { name: 'WorkerId',      type: 'number',         options: { precision: 0 } },
      { name: 'Name',          type: 'singleLineText' },
      { name: 'Avatar',        type: 'url' },
      { name: 'Category',      type: 'singleLineText' },
      { name: 'CategoryLabel', type: 'singleLineText' },
      { name: 'Rating',        type: 'number',         options: { precision: 1 } },
      { name: 'Reviews',       type: 'number',         options: { precision: 0 } },
      { name: 'Distance',      type: 'number',         options: { precision: 1 } },
      { name: 'PriceMin',      type: 'number',         options: { precision: 0 } },
      { name: 'PriceMax',      type: 'number',         options: { precision: 0 } },
      { name: 'PriceUnit',     type: 'singleLineText' },
      { name: 'City',          type: 'singleLineText' },
      { name: 'Lat',           type: 'number',         options: { precision: 6 } },
      { name: 'Lng',           type: 'number',         options: { precision: 6 } },
      { name: 'Verified',      type: 'checkbox',       options: { icon: 'check', color: 'greenBright' } },
      { name: 'Available',     type: 'checkbox',       options: { icon: 'check', color: 'greenBright' } },
      { name: 'CompletedJobs', type: 'number',         options: { precision: 0 } },
      { name: 'ResponseTime',  type: 'singleLineText' },
      { name: 'Bio',           type: 'multilineText' },
      { name: 'Skills',        type: 'singleLineText' },
      { name: 'Gallery',       type: 'singleLineText' },
      { name: 'Phone',         type: 'phoneNumber' },
      { name: 'Email',         type: 'email' },
    ],
  },
  {
    name: 'Clients',
    fields: [
      { name: 'ClientId',      type: 'number',         options: { precision: 0 } },
      { name: 'Name',          type: 'singleLineText' },
      { name: 'Avatar',        type: 'url' },
      { name: 'City',          type: 'singleLineText' },
      { name: 'MemberSince',   type: 'singleLineText' },
      { name: 'TotalServices', type: 'number',         options: { precision: 0 } },
      { name: 'Lat',           type: 'number',         options: { precision: 6 } },
      { name: 'Lng',           type: 'number',         options: { precision: 6 } },
      { name: 'Phone',         type: 'phoneNumber' },
      { name: 'Email',         type: 'email' },
    ],
  },
  {
    name: 'Bookings',
    fields: [
      { name: 'BookingId',  type: 'singleLineText' },
      { name: 'ClientId',   type: 'number',  options: { precision: 0 } },
      { name: 'WorkerId',   type: 'number',  options: { precision: 0 } },
      { name: 'Category',   type: 'singleLineText' },
      { name: 'Service',    type: 'singleLineText' },
      { name: 'Status',     type: 'singleSelect', options: { choices: [
        { name: 'pending',   color: 'yellowLight2' },
        { name: 'active',    color: 'greenLight2'  },
        { name: 'completed', color: 'blueLight2'   },
        { name: 'cancelled', color: 'redLight2'    },
      ]}},
      { name: 'Date',       type: 'singleLineText' },
      { name: 'Time',       type: 'singleLineText' },
      { name: 'Address',    type: 'singleLineText' },
      { name: 'Price',      type: 'number', options: { precision: 0 } },
      { name: 'Commission', type: 'number', options: { precision: 0 } },
      { name: 'Rating',     type: 'number', options: { precision: 0 } },
      { name: 'Review',     type: 'multilineText' },
    ],
  },
  {
    name: 'Requests',
    fields: [
      { name: 'ReqId',          type: 'singleLineText' },
      { name: 'ClientName',     type: 'singleLineText' },
      { name: 'ClientAvatar',   type: 'url' },
      { name: 'ClientRating',   type: 'number', options: { precision: 1 } },
      { name: 'Service',        type: 'singleLineText' },
      { name: 'Date',           type: 'singleLineText' },
      { name: 'Time',           type: 'singleLineText' },
      { name: 'Address',        type: 'singleLineText' },
      { name: 'EstimatedPrice', type: 'number', options: { precision: 0 } },
      { name: 'IsNew',          type: 'checkbox', options: { icon: 'check', color: 'blueBright' } },
      { name: 'Status',         type: 'singleSelect', options: { choices: [
        { name: 'pending',  color: 'yellowLight2' },
        { name: 'accepted', color: 'greenLight2'  },
        { name: 'declined', color: 'redLight2'    },
      ]}},
      { name: 'Distance',       type: 'number', options: { precision: 1 } },
      { name: 'WorkerRecordId', type: 'singleLineText' },
    ],
  },
  {
    name: 'Verifications',
    fields: [
      { name: 'VerifId',     type: 'singleLineText' },
      { name: 'WorkerName',  type: 'singleLineText' },
      { name: 'Avatar',      type: 'url' },
      { name: 'Category',    type: 'singleLineText' },
      { name: 'RequestDate', type: 'singleLineText' },
      { name: 'Docs',        type: 'singleLineText' },
      { name: 'Status',      type: 'singleSelect', options: { choices: [
        { name: 'pending',  color: 'yellowLight2' },
        { name: 'approved', color: 'greenLight2'  },
        { name: 'rejected', color: 'redLight2'    },
      ]}},
    ],
  },
  {
    name: 'Transactions',
    fields: [
      { name: 'TxId',       type: 'singleLineText' },
      { name: 'Date',       type: 'singleLineText' },
      { name: 'ClientName', type: 'singleLineText' },
      { name: 'WorkerName', type: 'singleLineText' },
      { name: 'Service',    type: 'singleLineText' },
      { name: 'Gross',      type: 'number', options: { precision: 0 } },
      { name: 'Status',     type: 'singleSelect', options: { choices: [
        { name: 'completed', color: 'greenLight2'  },
        { name: 'pending',   color: 'yellowLight2' },
        { name: 'refunded',  color: 'redLight2'    },
      ]}},
    ],
  },
  {
    name: 'Messages',
    fields: [
      { name: 'ConversationId', type: 'singleLineText' },
      { name: 'From',           type: 'singleSelect', options: { choices: [
        { name: 'client', color: 'blueBright'  },
        { name: 'worker', color: 'greenBright' },
      ]}},
      { name: 'Text',           type: 'multilineText' },
      { name: 'TimeStr',        type: 'singleLineText' },
      { name: 'Timestamp',      type: 'dateTime', options: {
        dateFormat:   { name: 'iso' },
        timeFormat:   { name: '24hour' },
        timeZone:     'America/Santiago',
      }},
    ],
  },
];

/* ── Datos ──────────────────────────────────── */
const WORKERS = [
  { WorkerId:1,  Name:'Carlos Muñoz',     Avatar:'https://i.pravatar.cc/128?img=11', Category:'gasfiteria',   CategoryLabel:'Gasfitería',   Rating:4.9, Reviews:187, Distance:1.2, PriceMin:20000, PriceMax:60000,  PriceUnit:'visita',  City:'Viña del Mar', Lat:-33.024, Lng:-71.552, Verified:true,  Available:true,  CompletedJobs:312, ResponseTime:'~15 min', Bio:'Gasfiter certificado con 9 años de experiencia. Especializado en instalaciones, filtraciones y emergencias 24/7. Trabajo limpio y garantizado.', Skills:'Filtraciones, Calefont, Instalaciones, Desagüe, Emergencias', Gallery:'https://picsum.photos/seed/gasfit1/300/200,https://picsum.photos/seed/gasfit2/300/200,https://picsum.photos/seed/gasfit3/300/200', Phone:'+56982345678', Email:'carlos.munoz@gmail.com' },
  { WorkerId:2,  Name:'Roberto Soto',     Avatar:'https://i.pravatar.cc/128?img=15', Category:'electricidad', CategoryLabel:'Electricidad', Rating:4.8, Reviews:143, Distance:2.4, PriceMin:25000, PriceMax:80000,  PriceUnit:'proyecto',City:'Viña del Mar', Lat:-33.031, Lng:-71.540, Verified:true,  Available:true,  CompletedJobs:256, ResponseTime:'~20 min', Bio:'Electricista SEC clase A con 12 años de trayectoria. Instalaciones residenciales y comerciales, tableros, iluminación LED.', Skills:'Tableros, Iluminación LED, Instalaciones, Certificación SEC, Domótica', Gallery:'https://picsum.photos/seed/elec1/300/200,https://picsum.photos/seed/elec2/300/200', Phone:'+56987654321', Email:'roberto.soto@gmail.com' },
  { WorkerId:3,  Name:'Ana Ramírez',      Avatar:'https://i.pravatar.cc/128?img=5',  Category:'belleza',      CategoryLabel:'Belleza',      Rating:5.0, Reviews:98,  Distance:0.8, PriceMin:15000, PriceMax:50000,  PriceUnit:'sesión',  City:'Valparaíso',   Lat:-33.045, Lng:-71.620, Verified:true,  Available:true,  CompletedJobs:189, ResponseTime:'~10 min', Bio:'Estilista y maquilladora profesional. Cortes, colorimetría, peinados para eventos y maquillaje artístico. Trabajo a domicilio.', Skills:'Corte, Colorimetría, Peinado, Maquillaje, Uñas', Gallery:'https://picsum.photos/seed/beauty1/300/200,https://picsum.photos/seed/beauty2/300/200', Phone:'+56912345678', Email:'ana.ramirez@gmail.com' },
  { WorkerId:4,  Name:'Diego Herrera',    Avatar:'https://i.pravatar.cc/128?img=20', Category:'pintura',      CategoryLabel:'Pintura',      Rating:4.7, Reviews:61,  Distance:3.1, PriceMin:30000, PriceMax:150000, PriceUnit:'proyecto',City:'Quilpué',      Lat:-33.048, Lng:-71.443, Verified:true,  Available:false, CompletedJobs:94,  ResponseTime:'~30 min', Bio:'Pintor de interiores y exteriores con 7 años de experiencia. Trabajo prolijo, materiales de primera. Presupuesto sin costo.', Skills:'Interiores, Exteriores, Estuco, Barniz, Pintura decorativa', Gallery:'https://picsum.photos/seed/pintor1/300/200,https://picsum.photos/seed/pintor2/300/200', Phone:'+56976543210', Email:'diego.herrera@gmail.com' },
  { WorkerId:5,  Name:'Javier Contreras', Avatar:'https://i.pravatar.cc/128?img=33', Category:'mecanica',     CategoryLabel:'Mecánica',     Rating:4.8, Reviews:212, Distance:4.5, PriceMin:20000, PriceMax:200000, PriceUnit:'servicio',City:'Concón',       Lat:-32.920, Lng:-71.530, Verified:true,  Available:true,  CompletedJobs:405, ResponseTime:'~25 min', Bio:'Mecánico automotriz especializado en vehículos japoneses y coreanos. Diagnóstico computarizado, frenos, suspensión y motor.', Skills:'Diagnóstico, Frenos, Suspensión, Motor, Cambio de aceite', Gallery:'https://picsum.photos/seed/mec1/300/200,https://picsum.photos/seed/mec2/300/200', Phone:'+56965432109', Email:'javier.contreras@gmail.com' },
  { WorkerId:6,  Name:'Valentina Lagos',  Avatar:'https://i.pravatar.cc/128?img=9',  Category:'profesores',   CategoryLabel:'Clases',       Rating:4.9, Reviews:77,  Distance:1.8, PriceMin:15000, PriceMax:30000,  PriceUnit:'hora',    City:'Viña del Mar', Lat:-33.020, Lng:-71.560, Verified:true,  Available:true,  CompletedJobs:143, ResponseTime:'~15 min', Bio:'Profesora de matemáticas y física para enseñanza media y pre-universitaria. Egresada de Ingeniería Civil PUCV. Clases online y presenciales.', Skills:'Matemáticas, Física, PSU/PTU, Pre-universitario, Álgebra', Gallery:'', Phone:'+56954321098', Email:'valentina.lagos@gmail.com' },
  { WorkerId:7,  Name:'Camila Rojas',     Avatar:'https://i.pravatar.cc/128?img=47', Category:'baile',        CategoryLabel:'Baile',        Rating:5.0, Reviews:54,  Distance:2.2, PriceMin:20000, PriceMax:35000,  PriceUnit:'hora',    City:'Viña del Mar', Lat:-33.035, Lng:-71.555, Verified:true,  Available:true,  CompletedJobs:89,  ResponseTime:'~10 min', Bio:'Bailarina y profesora certificada de salsa, bachata y kizomba. 8 años de experiencia. Clases individuales, en pareja y grupos pequeños.', Skills:'Salsa, Bachata, Kizomba, Ritmos latinos, Coreografía', Gallery:'', Phone:'+56943210987', Email:'camila.rojas@gmail.com' },
  { WorkerId:8,  Name:'Patricia Vera',    Avatar:'https://i.pravatar.cc/128?img=32', Category:'limpieza',     CategoryLabel:'Limpieza',     Rating:4.9, Reviews:165, Distance:1.0, PriceMin:25000, PriceMax:70000,  PriceUnit:'jornada', City:'Viña del Mar', Lat:-33.028, Lng:-71.548, Verified:true,  Available:true,  CompletedJobs:298, ResponseTime:'~5 min',  Bio:'Servicio de limpieza doméstica y de oficinas. Limpieza general, profunda, post-construcción y de fin de arriendo. Con sus propios materiales.', Skills:'Limpieza general, Limpieza profunda, Post-construcción, Oficinas, Fin de arriendo', Gallery:'', Phone:'+56932109876', Email:'patricia.vera@gmail.com' },
  { WorkerId:9,  Name:'Felipe Núñez',     Avatar:'https://i.pravatar.cc/128?img=67', Category:'gasfiteria',   CategoryLabel:'Gasfitería',   Rating:4.6, Reviews:89,  Distance:5.3, PriceMin:18000, PriceMax:55000,  PriceUnit:'visita',  City:'Villa Alemana',Lat:-33.042, Lng:-71.375, Verified:true,  Available:true,  CompletedJobs:167, ResponseTime:'~35 min', Bio:'Gasfiter con amplia experiencia en sistemas de agua caliente y fría. Disponible fines de semana.', Skills:'Agua caliente, Termostatos, Duchas, Lavamanos, Filtraciones', Gallery:'', Phone:'+56921098765', Email:'felipe.nunez@gmail.com' },
  { WorkerId:10, Name:'Marco Espinoza',   Avatar:'https://i.pravatar.cc/128?img=59', Category:'electricidad', CategoryLabel:'Electricidad', Rating:4.7, Reviews:103, Distance:6.1, PriceMin:20000, PriceMax:90000,  PriceUnit:'proyecto',City:'Quilpué',      Lat:-33.055, Lng:-71.450, Verified:false, Available:true,  CompletedJobs:134, ResponseTime:'~40 min', Bio:'Electricista residencial con certificación en proceso. Trabajos de calidad garantizada.', Skills:'Enchufes, Interruptores, Iluminación, Revisiones, Alarmas', Gallery:'', Phone:'+56910987654', Email:'marco.espinoza@gmail.com' },
];

const CLIENTS = [
  { ClientId:101, Name:'Sofía Mendoza',   Avatar:'https://i.pravatar.cc/128?img=2',  City:'Viña del Mar', MemberSince:'2025-01', TotalServices:14, Lat:-33.022, Lng:-71.548, Phone:'+56987654321', Email:'sofia.mendoza@gmail.com' },
  { ClientId:102, Name:'Andrés Morales',  Avatar:'https://i.pravatar.cc/128?img=51', City:'Valparaíso',   MemberSince:'2025-03', TotalServices:7,  Lat:-33.040, Lng:-71.612, Phone:'+56976543210', Email:'andres.morales@gmail.com' },
  { ClientId:103, Name:'Isabella Torres', Avatar:'https://i.pravatar.cc/128?img=16', City:'Viña del Mar', MemberSince:'2025-02', TotalServices:22, Lat:-33.028, Lng:-71.560, Phone:'+56965432109', Email:'isabella.torres@gmail.com' },
];

const BOOKINGS = [
  { BookingId:'VOY-001', ClientId:101, WorkerId:1, Category:'gasfiteria',   Service:'Reparación de filtración', Status:'completed', Date:'2026-03-08', Time:'10:00', Address:'Av. 15 Norte 845, Viña del Mar',      Price:35000, Commission:5250,  Rating:5, Review:'Excelente trabajo, muy puntual y prolijo.' },
  { BookingId:'VOY-002', ClientId:103, WorkerId:3, Category:'belleza',      Service:'Corte y colorimetría',     Status:'active',    Date:'2026-03-12', Time:'15:00', Address:'Calle Valparaíso 320, Viña del Mar', Price:42000, Commission:6300,  Rating:null, Review:null },
  { BookingId:'VOY-003', ClientId:102, WorkerId:2, Category:'electricidad', Service:'Instalación punto de luz', Status:'pending',   Date:'2026-03-15', Time:'09:00', Address:'Blanco 1254, Valparaíso',            Price:45000, Commission:6750,  Rating:null, Review:null },
];

const REQUESTS = [
  { ReqId:'REQ-041', ClientName:'Andrés Morales',  ClientAvatar:'https://i.pravatar.cc/48?img=51', ClientRating:4.8, Service:'Reparación de filtración en cocina', Date:'2026-03-13', Time:'10:00', Address:'Blanco 1254, Valparaíso',          EstimatedPrice:35000, IsNew:true,  Status:'pending',  Distance:3.2 },
  { ReqId:'REQ-042', ClientName:'Isabella Torres', ClientAvatar:'https://i.pravatar.cc/48?img=16', ClientRating:5.0, Service:'Instalación calefont nuevo',         Date:'2026-03-15', Time:'14:00', Address:'Calle Valparaíso 320, Viña del Mar',EstimatedPrice:55000, IsNew:true,  Status:'pending',  Distance:1.8 },
  { ReqId:'REQ-038', ClientName:'Rodrigo Pérez',   ClientAvatar:'https://i.pravatar.cc/48?img=33', ClientRating:4.5, Service:'Revisión general fontanería',         Date:'2026-03-10', Time:'09:00', Address:'Av. Libertad 890, Viña del Mar',    EstimatedPrice:25000, IsNew:false, Status:'accepted', Distance:2.5 },
];

const VERIFICATIONS = [
  { VerifId:'VER-031', WorkerName:'Marco Espinoza', Avatar:'https://i.pravatar.cc/48?img=59', Category:'Electricidad', RequestDate:'10 Mar 2026', Docs:'Cédula, Foto perfil',         Status:'pending' },
  { VerifId:'VER-032', WorkerName:'Lucía Castillo', Avatar:'https://i.pravatar.cc/48?img=6',  Category:'Belleza',      RequestDate:'11 Mar 2026', Docs:'Cédula',                      Status:'pending' },
  { VerifId:'VER-033', WorkerName:'Gabriel Rivas',  Avatar:'https://i.pravatar.cc/48?img=63', Category:'Gasfitería',   RequestDate:'12 Mar 2026', Docs:'Cédula, Certificado',         Status:'pending' },
  { VerifId:'VER-034', WorkerName:'Valentina Cruz', Avatar:'https://i.pravatar.cc/48?img=36', Category:'Limpieza',     RequestDate:'12 Mar 2026', Docs:'Cédula, Foto perfil',         Status:'pending' },
];

const TRANSACTIONS = [
  { TxId:'VOY-2310', Date:'12 Mar', ClientName:'Isabella T.', WorkerName:'Ana R.',      Service:'Belleza',       Gross:42000, Status:'completed' },
  { TxId:'VOY-2309', Date:'12 Mar', ClientName:'Andrés M.',   WorkerName:'Roberto S.',  Service:'Electricidad',  Gross:45000, Status:'pending'   },
  { TxId:'VOY-2308', Date:'08 Mar', ClientName:'Sofía M.',    WorkerName:'Carlos M.',   Service:'Gasfitería',    Gross:35000, Status:'completed' },
  { TxId:'VOY-2307', Date:'06 Mar', ClientName:'Rodrigo P.',  WorkerName:'Carlos M.',   Service:'Gasfitería',    Gross:25000, Status:'completed' },
  { TxId:'VOY-2306', Date:'05 Mar', ClientName:'Isabella T.', WorkerName:'Patricia V.', Service:'Limpieza',      Gross:45000, Status:'completed' },
  { TxId:'VOY-2305', Date:'03 Mar', ClientName:'Andrés M.',   WorkerName:'Javier C.',   Service:'Mecánica',      Gross:68000, Status:'completed' },
  { TxId:'VOY-2304', Date:'01 Mar', ClientName:'Sofía M.',    WorkerName:'Roberto S.',  Service:'Electricidad',  Gross:48000, Status:'refunded'  },
];

const MESSAGES = [
  { ConversationId:'conv-1-101', From:'worker', Text:'Hola, ¿en qué te puedo ayudar?',                     TimeStr:'14:30', Timestamp:'2026-03-08T14:30:00.000Z' },
  { ConversationId:'conv-1-101', From:'client', Text:'Hola Carlos, tengo una filtración en el baño.',        TimeStr:'14:31', Timestamp:'2026-03-08T14:31:00.000Z' },
  { ConversationId:'conv-1-101', From:'worker', Text:'Claro, puedo ir esta tarde. ¿A qué hora te acomoda?', TimeStr:'14:32', Timestamp:'2026-03-08T14:32:00.000Z' },
];

/* ── Helper ─────────────────────────────────── */
async function createRecords(tableName, records) {
  // Airtable permite hasta 10 registros por request
  const chunks = [];
  for (let i = 0; i < records.length; i += 10)
    chunks.push(records.slice(i, i + 10));

  const created = [];
  for (const chunk of chunks) {
    const res = await req(`${API}/${encodeURIComponent(tableName)}`, {
      method: 'POST',
      body: JSON.stringify({ records: chunk.map(fields => ({ fields })) }),
    });
    created.push(...res.records);
    console.log(`  ✓ ${chunk.length} registros en ${tableName}`);
  }
  return created;
}

async function tableExists(name) {
  const res = await req(META);
  return res.tables.some(t => t.name === name);
}

async function createTable(def) {
  if (await tableExists(def.name)) {
    console.log(`  ⏭  Tabla "${def.name}" ya existe, omitiendo creación`);
    return;
  }
  await req(META, { method: 'POST', body: JSON.stringify(def) });
  console.log(`  ✓ Tabla "${def.name}" creada`);
}

async function countRecords(tableName) {
  const res = await req(`${API}/${encodeURIComponent(tableName)}?maxRecords=1`);
  return res.records.length;
}

/* ── Main ───────────────────────────────────── */
(async () => {
  console.log('\n🚀 VOY — Setup Airtable\n');

  // 1. Crear tablas
  console.log('📋 Creando tablas...');
  for (const t of TABLES) await createTable(t);

  // 2. Sembrar datos (solo si la tabla está vacía)
  console.log('\n🌱 Sembrando datos...');

  if (await countRecords('Workers') === 0) {
    console.log('Workers:');
    await createRecords('Workers', WORKERS);
  } else console.log('  ⏭  Workers ya tiene datos');

  if (await countRecords('Clients') === 0) {
    console.log('Clients:');
    await createRecords('Clients', CLIENTS);
  } else console.log('  ⏭  Clients ya tiene datos');

  if (await countRecords('Bookings') === 0) {
    console.log('Bookings:');
    await createRecords('Bookings', BOOKINGS);
  } else console.log('  ⏭  Bookings ya tiene datos');

  if (await countRecords('Requests') === 0) {
    console.log('Requests:');
    // Asignar WorkerRecordId al worker 1 (Carlos Muñoz) para las solicitudes de gasfitería
    const wRes = await req(`${API}/Workers?filterByFormula=${encodeURIComponent('{WorkerId}=1')}`);
    const carlosId = wRes.records[0]?.id || '';
    const reqs = REQUESTS.map(r => ({ ...r, WorkerRecordId: carlosId }));
    await createRecords('Requests', reqs);
  } else console.log('  ⏭  Requests ya tiene datos');

  if (await countRecords('Verifications') === 0) {
    console.log('Verifications:');
    await createRecords('Verifications', VERIFICATIONS);
  } else console.log('  ⏭  Verifications ya tiene datos');

  if (await countRecords('Transactions') === 0) {
    console.log('Transactions:');
    await createRecords('Transactions', TRANSACTIONS);
  } else console.log('  ⏭  Transactions ya tiene datos');

  if (await countRecords('Messages') === 0) {
    console.log('Messages:');
    await createRecords('Messages', MESSAGES);
  } else console.log('  ⏭  Messages ya tiene datos');

  console.log('\n✅ Setup completo. ¡Base de datos VOY lista!\n');
})().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
