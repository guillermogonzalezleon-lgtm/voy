/* ============================================
   VOY — Build script (genera js/config.js)
   Variables requeridas en Vercel:
     VOY_AIRTABLE_TOKEN
     VOY_AIRTABLE_BASE
     VOY_ADMIN_PASSWORD  (opcional, default: voy2026)
   ============================================ */

const fs   = require('fs');
const path = require('path');

const token    = process.env.VOY_AIRTABLE_TOKEN;
const baseId   = process.env.VOY_AIRTABLE_BASE;
const adminPwd = process.env.VOY_ADMIN_PASSWORD || 'voy2026';

if (!token || !baseId) {
  console.error('❌ Faltan variables de entorno: VOY_AIRTABLE_TOKEN y VOY_AIRTABLE_BASE');
  process.exit(1);
}

const config = `/* Generado automáticamente por build.js — no editar */
const VOY_CONFIG = {
  airtable: {
    token:  '${token}',
    baseId: '${baseId}',
  },
  admin: {
    email:    'admin@voy.cl',
    password: '${adminPwd}',
  },
};
`;

fs.mkdirSync(path.join(__dirname, 'js'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'js', 'config.js'), config);
console.log('✅ js/config.js generado correctamente');
