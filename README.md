# AURA

Red social privada para prelanzamiento. PWA instalable en Android, iOS y Windows sin tiendas.

---

## Stack real

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite 5 + React Router 6 + Zustand |
| Estilos | Tailwind CSS 3.4 con design tokens AURA |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL 16 |
| Archivos | Volumen Docker local (`/uploads`) |
| Autenticación | JWT (7 días) + bcrypt |
| PWA | vite-plugin-pwa + Workbox |
| Infra | Docker Compose (frontend + backend + postgres) |

> **Sin Firebase, Supabase, Cloudinary, Stripe ni servicios externos.**

---

## Funcionalidades implementadas

- Registro y login con JWT real
- Perfil: nombre, bio, avatar (upload local)
- Feed de posts: solo propios + matches (círculo)
- Crear post con imagen
- Likes y comentarios
- Historias con imagen (expiran 24h)
- Match real en PostgreSQL (`user_likes`, `matches`)
- Chat entre usuarios (polling 4s)
- Notificaciones de match y mensaje
- Monedero de Chispas interno (gratuito)
- Transferencia de Chispas entre usuarios
- Tareas para ganar Chispas (sistema de recompensas)
- PWA instalable: manifest + SW + iconos + meta tags iOS

---

## Pendiente / próximamente

- SMS real (verificación OTP por teléfono) — actualmente demo
- Verificación de identidad KYC (INE/Pasaporte) — actualmente demo
- Cifrado E2E en mensajes
- Videollamadas (Cita Doble / Zona Match)
- Pasarela de pago para recargar Chispas (SPEI / tarjeta)
- Cambio de contraseña desde la app
- Notificaciones push
- Bloqueo y reporte de usuarios (en pantalla, sin backend)

---

## Inicio rápido (Docker)

```bash
git clone https://github.com/sherlockai26-ui/AURA.git
cd AURA
cp .env.example .env
# Edita JWT_SECRET con un valor aleatorio:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
docker compose build
docker compose up -d
```

La app queda en `http://<servidor>:8080`. Configura tu nginx/proxy inverso apuntando a ese puerto.

---

## Variables de entorno

Ver [.env.example](.env.example) con todos los valores documentados.

Mínimas requeridas en producción:

```env
JWT_SECRET=<cadena larga y aleatoria>
POSTGRES_PASSWORD=<contraseña segura>
VITE_API_URL=/api
```

---

## Desarrollo local

```bash
# Backend
cd backend && npm install && node src/index.js

# Frontend (en otra terminal, desde la raíz)
npm install && npm run dev
# → http://localhost:5173 (proxy /api → localhost:3001 ya configurado en vite.config.js)
```

---

## Pruebas manuales

| Flujo | Dónde probar |
|---|---|
| Registro / login | `/registro` → `/login` |
| Crear post con imagen | Feed → botón Galería |
| Crear historia | Feed → Stories → Crear |
| Match entre dos usuarios | `/zona-match` con dos cuentas distintas |
| Chat | `/messages` → nueva conversación |
| Notificaciones | Campana en header tras un match |
| Tareas Chispas | `/monedero` → Gana Chispas gratis |
| PWA Android | Chrome → menú → Añadir a pantalla de inicio |
| PWA iOS | Safari → Compartir → Agregar a pantalla de inicio |
| Backend caído | Desconectar backend → UI muestra error, sin datos falsos |

---

## Estructura relevante

```
backend/
  src/
    index.js          ← entry, inicializa DB + aplica schema.sql
    schema.sql        ← tablas: users, profiles, posts, likes, comments,
                        conversations, messages, stories, notifications,
                        sparks_wallets, sparks_transactions,
                        user_likes, user_passes, matches,
                        reward_tasks, user_task_claims
    routes/
      auth.js          POST /api/auth/register|login
      me.js            GET/PUT /api/me
      posts.js         GET/POST /api/posts, likes, comments
      stories.js       GET/POST /api/stories
      chat.js          conversations + messages
      match.js         candidates, like, pass, matches
      tasks.js         GET /api/tasks, POST claim
      sparks.js        balance + transfer
      notifications.js GET + mark-read
      uploads.js       avatar + image

src/
  lib/
    api.js            ← cliente centralizado; JWT en localStorage 'aura-token'
    store.js          ← Zustand (sesión, sparks, UI state)
  routes/             ← páginas React
  components/         ← PostCard, PwaBar, StoriesRow, etc.
  sw.js               ← Service Worker: precaché estático, network-only /api /uploads
```

---

## Privacidad y anti-captura

El bloqueo real de capturas no existe en PWAs. Lo implementado es disuasorio:

- `useCaptureGuard`: oculta contenido cuando la pestaña pierde foco
- Watermark CSS diagonal con `@handle` del viewer sobre cada imagen
- Moderación de brief: sin rostros en contenido público

Para cumplimiento real (Ley Olimpia MX): se requiere app nativa con `FLAG_SECURE` + KYC real.

---

## Modelo de Chispas ⚡

Moneda interna gratuita sin valor monetario real en prelanzamiento. Se gana:

- Completando tareas del sistema (`/tareas`)
- Recibiendo de otros usuarios (transferencia)

Saldo almacenado en PostgreSQL (`sparks_wallets`). Cada movimiento queda en `sparks_transactions`.

---

## © 2026 AURA
