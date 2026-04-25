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

## Despliegue propio (Docker + nginx)

El repo incluye `Dockerfile` (multi-stage), `nginx.conf` con SPA fallback y un `docker-compose.yml` para levantar la app en cualquier servidor con Docker.

### En tu servidor Ubuntu

```bash
# Clona el repo (o haz git pull si ya está)
git clone https://github.com/sherlockai26-ui/AURA.git
cd AURA

# Build + run en background
docker compose build
docker compose up -d
# → la app queda escuchando en http://<server>:8080
```

### Variables soportadas

Crea un `.env` junto al `docker-compose.yml`:

```env
PORT=8080         # puerto del host al que el proxy reverso apunta
BASE_PATH=/       # / si sirves en raíz del dominio; /aura/ si bajo subruta
```

### Con tu nginx + dominio (reverse proxy en el host)

Ejemplo de bloque server en el nginx del host (fuera de Docker), apuntando a `aura.tu-dominio.com`:

```nginx
server {
  listen 443 ssl http2;
  server_name aura.tu-dominio.com;

  ssl_certificate     /etc/letsencrypt/live/aura.tu-dominio.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/aura.tu-dominio.com/privkey.pem;

  location / {
    proxy_pass         http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header   Host              $host;
    proxy_set_header   X-Real-IP         $remote_addr;
    proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
  }
}
server {
  listen 80;
  server_name aura.tu-dominio.com;
  return 301 https://$host$request_uri;
}
```

Recarga: `sudo nginx -t && sudo systemctl reload nginx`. Si necesitas cert: `sudo certbot --nginx -d aura.tu-dominio.com`.

> **No usamos Firebase ni ningún backend remoto.** Todo el estado vive en `localStorage` del cliente; el servidor solo sirve archivos estáticos. Si en algún momento ves un error de Firebase en consola, es de un Service Worker viejo cacheado de un deploy previo. Limpia con DevTools → Application → Storage → "Clear site data" y refresca, o desde la consola:
> ```js
> navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
> caches.keys().then(ks => ks.forEach(k => caches.delete(k)));
> location.reload();
> ```

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
