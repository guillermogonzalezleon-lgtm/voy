# VOY — Servicios a un VOY de distancia

> Marketplace de servicios locales para la Quinta Región, Chile.
> Conecta clientes con profesionales verificados cerca de ti.

---

## Descripción

**VOY** es una plataforma estilo Uber para servicios del hogar y profesionales independientes. Los clientes buscan y contratan servicios (gasfitería, electricidad, belleza, mecánica, limpieza, clases y más) filtrando por radio de distancia. Los profesionales gestionan su agenda, reciben solicitudes y cobran de forma segura.

---

## Demo

| Vista | Descripción |
|-------|-------------|
| `/` | Landing page |
| `/client` | App del cliente |
| `/worker` | Dashboard del profesional |
| `/admin` | Panel de administración |

---

## Stack tecnológico

- **Frontend:** HTML5 / CSS3 / JavaScript vanilla
- **Mapa:** Leaflet.js + OpenStreetMap (sin API key)
- **Iconos:** Font Awesome 6
- **Tipografía:** Inter (Google Fonts)
- **Deploy:** Vercel
- **Repositorio:** GitHub

---

## Estructura del proyecto

```
VOY/
├── index.html              # Landing page
├── client/
│   └── index.html          # App cliente (buscar, agendar, chat)
├── worker/
│   └── index.html          # App profesional (solicitudes, agenda, ganancias)
├── admin/
│   └── index.html          # Panel admin (verificaciones, usuarios, métricas)
├── css/
│   ├── variables.css       # Design tokens (colores, tipografía, espaciado)
│   ├── main.css            # Estilos globales y componentes reutilizables
│   ├── landing.css         # Estilos exclusivos de la landing
│   └── app.css             # Layout compartido de las apps
├── js/
│   ├── data.js             # Mock data + helpers globales (VOY.*)
│   ├── client.js           # Lógica del cliente
│   ├── worker.js           # Lógica del profesional
│   └── admin.js            # Lógica del admin
├── vercel.json             # Configuración de deploy
├── .gitignore
└── README.md
```

---

## Categorías de servicios

| Icono | Categoría | Descripción |
|-------|-----------|-------------|
| 🔧 | Gasfitería | Filtraciones, calefont, instalaciones |
| ⚡ | Electricidad | Tableros, iluminación, SEC |
| 🎨 | Pintura | Interiores, exteriores, estuco |
| 🔩 | Mecánica | Diagnóstico, frenos, motor |
| ✂️ | Belleza | Corte, colorimetría, maquillaje |
| 📚 | Clases | Matemáticas, física, idiomas |
| 🎵 | Baile | Salsa, bachata, kizomba |
| 🧹 | Limpieza | General, profunda, post-construcción |

---

## Roles de usuario

### Cliente
- Registro con Google
- Búsqueda por categoría y radio (km variable)
- Mapa interactivo con profesionales cercanos
- Ver perfil, reseñas y portfolio del profesional
- Agendar (inmediato o con fecha/hora)
- Chat directo
- Historial de servicios
- Calificar y reseñar

### Profesional
- Registro con Google + verificación de identidad
- Toggle de disponibilidad
- Recibir y gestionar solicitudes (aceptar / rechazar)
- Agenda y calendario mensual
- Dashboard de ganancias
- Gestión de perfil y especialidades
- Proceso de verificación por pasos

### Administrador
- Métricas generales de la plataforma
- Aprobación/rechazo de verificaciones
- Gestión de usuarios (clientes y profesionales)
- Historial de transacciones
- Gestión de categorías
- Configuración de la plataforma

---

## Monetización

| Tipo | Comisión |
|------|----------|
| Profesional estándar | 15% por servicio completado |
| Profesional verificado (completo) | 12% por servicio completado |

---

## Paleta de colores

```css
--color-primary: #2563EB   /* Azul principal */
--color-navy:    #1E3A5F   /* Azul oscuro */
--accent:        #0EA5E9   /* Azul cielo */
--color-success: #10B981   /* Verde */
--color-warning: #F59E0B   /* Ámbar */
--color-danger:  #EF4444   /* Rojo */
```

---

## Instalación y deploy local

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/voy.git
cd voy

# Abrir en el navegador (no requiere servidor)
open index.html

# O con un servidor local
npx serve .
# → http://localhost:3000
```

## Deploy en Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Producción
vercel --prod
```

---

## Roadmap

### v1.0 — Beta actual ✅
- [x] Landing page
- [x] App cliente (búsqueda, mapa, agendar, chat, historial)
- [x] App profesional (solicitudes, agenda, ganancias, verificación)
- [x] Panel admin (métricas, verificaciones, usuarios)
- [x] Mock data con profesionales de la Quinta Región

### v1.1 — Backend
- [ ] API REST (Next.js / Node.js)
- [ ] Base de datos PostgreSQL + Prisma
- [ ] Google Auth real
- [ ] Geolocalización GPS real

### v1.2 — Pagos
- [ ] Integración Webpay (Transbank)
- [ ] Transferencias bancarias
- [ ] Facturación electrónica (SII)

### v1.3 — Tiempo real
- [ ] Chat WebSocket
- [ ] Notificaciones push (FCM)
- [ ] Tracking en mapa del profesional

### v2.0 — Móvil
- [ ] App iOS / Android (React Native)

---

## Mercado objetivo

- **Beta:** Quinta Región — Viña del Mar, Valparaíso, Quilpué, Villa Alemana, Concón
- **Expansión:** Región Metropolitana y otras regiones de Chile

---

## Licencia

Proyecto privado — © 2026 VOY SpA, Chile. Todos los derechos reservados.
