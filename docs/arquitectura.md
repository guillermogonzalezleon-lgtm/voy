# VOY — Arquitectura y decisiones técnicas

## Decisión de stack

Se eligió **Vanilla HTML/CSS/JS** para la versión beta por las siguientes razones:

- Sin dependencias de build (no requiere npm, webpack ni bundler)
- Deploy instantáneo en Vercel como sitio estático
- Máxima velocidad de carga
- Fácil de migrar a React/Next.js en v1.1

---

## Design System

Toda la UI está construida sobre `css/variables.css` con CSS Custom Properties (tokens de diseño). Esto permite:

- Cambiar la paleta completa modificando solo el archivo de variables
- Consistencia visual en todas las páginas
- Preparado para modo oscuro (dark mode)

### Jerarquía de archivos CSS

```
variables.css  ← tokens base
    ↓
main.css       ← componentes globales (botones, cards, modals, inputs)
    ↓
landing.css    ← estilos exclusivos de index.html
app.css        ← layout compartido (topbar, sidebar, stats)
```

---

## Componentes globales (main.css)

| Componente | Clase base | Variantes |
|-----------|-----------|----------|
| Botón | `.btn` | `btn-primary`, `btn-outline`, `btn-ghost`, `btn-danger`, `btn-success` |
| Card | `.card` | `.card-body`, `.card-header` |
| Badge | `.badge` | `badge-blue`, `badge-green`, `badge-yellow`, `badge-red` |
| Modal | `.modal-overlay` | `.modal`, `.modal-header`, `.modal-body`, `.modal-footer` |
| Input | `.input` | `select.input`, `textarea.input` |
| Avatar | `.avatar` | `avatar-xs`, `avatar-sm`, `avatar-md`, `avatar-lg`, `avatar-xl` |
| Toast | `#toast-container` | Llamar `VOY.showToast(msg, type)` |

---

## Helpers globales (js/data.js)

El objeto `VOY` expone utilidades disponibles en todas las páginas:

```js
VOY.formatCLP(amount)          // → "$35.000"
VOY.formatDistance(km)         // → "1.2 km" o "800 m"
VOY.getCategoryById(id)        // → objeto categoría
VOY.getWorkersByCategory(cat)  // → array de workers
VOY.filterByDistance(workers, maxKm)
VOY.renderStars(rating)        // → "★★★★½"
VOY.showToast(message, type)   // type: info | success | error | warning
VOY.openModal(id)
VOY.closeModal(id)
```

---

## Flujo de datos (mock)

```
VOY_DATA
  ├── categories[]     // 8 categorías
  ├── workers[]        // 10 profesionales (lat/lng en V Región)
  ├── clients[]        // 3 clientes
  ├── bookings[]       // 3 reservas de ejemplo
  └── stats{}          // métricas globales
```

---

## Mapa

- **Librería:** Leaflet.js 1.9.4
- **Tiles:** OpenStreetMap (gratuito, sin API key)
- **Centro beta:** Viña del Mar (-33.025, -71.552), zoom 12
- **Marcadores:** `L.divIcon` con HTML personalizado (icono de categoría)
- **Popup:** HTML personalizado con botón "Ver perfil"

---

## Próxima arquitectura (v1.1)

```
voy/
├── apps/
│   ├── web/          ← Next.js 15 (App Router)
│   └── mobile/       ← React Native (Expo)
├── packages/
│   ├── api/          ← API Routes + tRPC
│   ├── db/           ← Prisma + PostgreSQL
│   └── ui/           ← Design system (shadcn/ui)
└── infra/
    ├── vercel.json
    └── docker-compose.yml
```

---

## Seguridad (producción)

- Google OAuth 2.0 para autenticación
- JWT tokens con refresh
- Rate limiting en API
- Validación server-side de todos los inputs
- Pagos procesados por Transbank (PCI-DSS compliant)
- Documentos de verificación almacenados en S3 cifrado
