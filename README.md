# AURA
Aura. Donde las parejas se redescubren.

Red social privada y curada para parejas. PWA instalable como acceso directo en móvil (iOS/Android) y en PC — sin depender de App Store ni Play Store.

## Stack

- **React 18** + **Vite 5** + **React Router 6**
- **Tailwind CSS 3.4** con design tokens del brief (`aura-bg`, `aura-surface`, `aura-purple`, `aura-cyan`, `aura-text-2`, `aura-error`)
- **Zustand** (persistido en `localStorage`) para sesión y saldo de Chispas ⚡
- **vite-plugin-pwa** (Workbox) para manifest + service worker

## Scripts

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # bundle de producción en dist/
npm run preview   # sirve dist/ para probar PWA
```

> PWA requiere HTTPS o `localhost`. Para probar "Crear acceso directo" desde un móvil en la misma red, despliega en Vercel/Netlify/Cloudflare Pages o usa un túnel HTTPS.

## Pantallas implementadas

### A3 · Login (`/login`)
- Logo triangular AURA + wordmark `32px / letter-spacing 4` + tagline "Tu espacio sagrado".
- Input de correo/NickName + input de contraseña con toggle de visibilidad (👁️ cyan).
- Validación cliente: formato email cuando aplica, password ≥ 6 caracteres.
- Link "¿Olvidaste tu contraseña?" en cyan, alineado a la derecha.
- Botón primario `INICIAR SESIÓN` — pill cyan con glow.
- Divisor "O" centrado.
- Botón secundario `REGISTRARSE` — pill outline púrpura.
- Footer legal (10 px) + badge "🔒 Conexión segura E2E".
- Fondo con partículas flotantes púrpura/cyan.

### B1 · Feed (`/feed`)
- **Header fijo**: logo `AURA` izquierda; saldo de Chispas ⚡ y campana 🔔 derecha, con acento cyan.
- **Status Box**: placeholder "Comparte algo con tu pareja..." + accesos Galería / Cámara.
- **Quick Access Row**: Destello ⚡, Sintonía 🧭, Álbum Priv. 🔒.
- **Stories** con tabs `Tu Círculo` (activo) y `Explorar` (gris). Primer item "Crear" con borde púrpura; el resto muestra siluetas abstractas con anillo neón cuando no se han visto.
- **Posts** con media abstracta (siluetas entrelazadas, *sin rostros*), watermark diagonal con `@handle` y badge "🔒 Captura bloqueada". Acciones: ⚡ Chispa (gasta 1 chispa o usa la gratuita diaria), 💬 Comentar, ↗️ Compartir. Hashtags renderizados en púrpura.
- **Scroll infinito** con `IntersectionObserver`.
- **Bottom Tab Bar fija**: Inicio / Destello / Notificaciones / Mensajes / Perfil. Tab activo en cyan con glow.

## Privacidad y anti-captura

El bloqueo real de capturas no existe en PWAs (solo en apps nativas con flags como Android `FLAG_SECURE`). Implementación actual, como capa disuasoria:

- `useCaptureGuard` (`src/hooks/`): enmascara el post cuando la pestaña pierde foco/visibilidad.
- CSS `.no-capture` + `.media-watermark`: bloquea selección, callout iOS, arrastre y pinta un watermark diagonal con `@handle + identificador del viewer` sobre cada media.
- Moderación del brief: no se permiten rostros en contenido público.

Para cumplimiento real (Ley Olimpia MX), se recomienda complementar con:
- Cliente nativo iOS/Android (opcional a futuro) con `FLAG_SECURE` y detección de ReplayKit.
- Verificación KYC obligatoria y legalmente aceptable (documento oficial + prueba de vida).

## Modelo de monedas (Chispas ⚡)

- Estado en `useAuthStore` (Zustand) persistido en `localStorage`.
- Paquetes definidos en el brief: 100⚡ = $4.99, 300⚡ = $11.99, 600⚡ = $19.99, 1500⚡ = $44.99.
- Una "Chispa" gratuita diaria: primer tap en `⚡ Chispa` no gasta saldo.
- Si no hay saldo ni chispa gratis, el post muestra "Sin Chispas. Recarga en tu monedero".

## Estructura

```
.
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   ├── logo.svg
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── icon-maskable-512.png
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   ├── BottomTabBar.jsx
    │   ├── BrandLogo.jsx
    │   ├── Particles.jsx
    │   ├── PostCard.jsx
    │   ├── QuickAccessRow.jsx
    │   ├── StatusBox.jsx
    │   ├── StoriesRow.jsx
    │   ├── StoryItem.jsx
    │   └── TopHeader.jsx
    ├── hooks/
    │   └── useCaptureGuard.js
    ├── lib/
    │   ├── data.js
    │   └── store.js
    └── routes/
        ├── Feed.jsx
        ├── Layout.jsx
        ├── Login.jsx
        └── Placeholder.jsx
```

## Próximos entregables

- A4 Registro de Nido (cuenta compartida + doble OTP real con proveedor SMS).
- A5 Verificación KYC (INE/pasaporte + prueba de vida).
- B2 Sintonía, B3 Destello (WebRTC pareja-a-pareja con votación 4 bandas).
- B4 Espejo (chat E2E, posiblemente basado en Signal Protocol).
- B5 Mi Nido (perfil de pareja + espacios individuales + álbum privado).
- C1 Monedero Chispas (pagos reales: Stripe + StoreKit/Play Billing en wrappers nativos si aplica).
