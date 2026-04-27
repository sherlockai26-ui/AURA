/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

// /api y /uploads siempre van a la red — nunca se cachean.
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/'),
  ({ request }) => fetch(request)
);

// Excluir del caché cualquier request con header Authorization.
registerRoute(
  ({ request }) => !!request.headers.get('Authorization'),
  ({ request }) => fetch(request)
);

// Precaché de assets estáticos inyectado por vite-plugin-pwa (JS, CSS, HTML, iconos).
precacheAndRoute(self.__WB_MANIFEST || []);

// SPA fallback: navegaciones sin ruta conocida → index.html cacheado.
const indexUrl = new URL('index.html', self.registration.scope).pathname;
registerRoute(new NavigationRoute(createHandlerBoundToURL(indexUrl)));

// Al instalar: limpiar caches viejos (purga SWs de versiones anteriores).
// No llamamos skipWaiting automáticamente → el usuario decide vía PwaBar.
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) { /* noop */ }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// PwaBar envía SKIP_WAITING cuando el usuario pulsa "Actualizar".
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
