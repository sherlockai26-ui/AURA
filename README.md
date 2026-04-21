# AURA
Aura. Donde las parejas se redescubren.

Red social diseñada para parejas. La web funciona en PC y móvil (iOS / Android) sin pasar por App Store ni Play Store: los usuarios la instalan como **acceso directo** (PWA) desde el navegador.

## Empezar en local

No hay build. Solo servir la carpeta como archivos estáticos:

```bash
# Opción 1: Python
python3 -m http.server 8080

# Opción 2: Node
npx http-server -p 8080
```

Abrir http://localhost:8080 (conviene probar también desde el móvil en la misma red para ver la pantalla de instalación).

> Los Service Workers y `beforeinstallprompt` exigen **HTTPS** o `localhost`. En producción, servir detrás de TLS.

## Flujo implementado

1. **Splash (A1 · Brand Header)** → `index.html` muestra el logo, wordmark y barra "cargando…" durante ~900 ms.
2. **Login** → correo compartido o NickName personal + contraseña, con *floating labels* y botón de mostrar contraseña.
3. **Registro de pareja** (4 pasos):
   1. Cuenta compartida: correo, NickName público y contraseña común.
   2. Datos de cada integrante: nombre + teléfono (dos perfiles distintos).
   3. Verificación **doble SMS**: un código a cada teléfono (el modo demo los muestra en pantalla).
   4. Confirmación y entrada al espacio.
4. **App** (`app.html`) con barra inferior/lateral:
   - **Feed** público compartido (componer + likes).
   - **Chat** con 3 modos: *pareja*, *grupo de 4* (las dos parejas), *mensajes individuales* (directos).
   - **Perfil** con hero de pareja + dos espacios personales editables.
   - **Ajustes** con "Crear acceso directo", cambio de integrante activo (requiere contraseña compartida) y resumen de seguridad.

## Acceso directo (PWA)

- `manifest.webmanifest` declara nombre, iconos, `start_url`, `display: standalone`, colores y *shortcuts* (Feed / Chat).
- `sw.js` cachea el shell para funcionamiento offline básico.
- El botón **"Crear acceso directo"** aparece en:
  - Un banner flotante después del login.
  - El botón `+ Acceso directo` en la cabecera cuando `beforeinstallprompt` está disponible.
  - Ajustes → "Crear acceso directo", con instrucciones específicas para iOS / Android / PC cuando el navegador no expone el prompt nativo (Safari iOS).

## Estructura

```
/
├── index.html              Splash · Login · Registro
├── app.html                Shell (Feed / Chat / Perfil / Ajustes)
├── manifest.webmanifest    PWA manifest
├── sw.js                   Service Worker (cache-first con fallback a red)
├── assets/
│   ├── logo.svg            Logo triángulo "A"
│   ├── icon-192.png        PWA icon
│   ├── icon-512.png        PWA icon
│   └── icon-maskable-512.png
├── css/styles.css          Tema neon oscuro (purple + cyan) responsive
└── js/
    ├── store.js            Capa de datos (localStorage, mock del backend)
    ├── install.js          Registro del SW + lógica de instalación PWA
    ├── auth.js             Splash, login y wizard de registro
    └── app.js              Feed / Chat / Perfil / Ajustes
```

## Siguientes pasos

- Sustituir `store.js` por un backend real (sugerido: Node + Postgres, o Supabase/Firebase).
- Integrar proveedor de SMS (Twilio, MessageBird) para los códigos OTP.
- Añadir cifrado E2E real al chat (ahora el badge es un compromiso de diseño visible).
- Moderación de feed y notificaciones push (usando el Service Worker ya registrado).
