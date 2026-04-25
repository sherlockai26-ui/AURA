/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

// Precache inyectado por vite-plugin-pwa con hash por archivo.
precacheAndRoute(self.__WB_MANIFEST || []);

// SPA fallback: cualquier navegación cae a index.html (precacheado).
const indexUrl = new URL('index.html', self.registration.scope).pathname;
registerRoute(new NavigationRoute(createHandlerBoundToURL(indexUrl)));

// ────────────────────────────────────────────────────────────────────
// Auto-purga agresiva.
//
// Si en el navegador del usuario quedó un Service Worker antiguo (por
// ejemplo de un deploy previo que sí incluía Firebase) sirviendo bundles
// obsoletos: en cuanto el navegador instala este SW nuevo, en `install`
// borramos TODOS los caches (no solo los del precache propio) y en
// `activate` tomamos control de las páginas abiertas y las recargamos
// para que vean el bundle nuevo sin necesidad de limpiar nada a mano.
// ────────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) { /* noop */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      try { await w.navigate(w.url); } catch (_) { /* tab cerrada o cross-origin */ }
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
