import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages sirve bajo /AURA/. Si despliegas en raíz de dominio
// propio, cambia `base` a '/'.
const base = process.env.VITE_BASE ?? '/AURA/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      injectRegister: 'auto',
      includeAssets: ['logo.svg', 'icons/*.png'],
      manifest: {
        name: 'AURA · Tu espacio sagrado',
        short_name: 'AURA',
        description: 'Red social privada para parejas. Donde se redescubren.',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0B0C10',
        theme_color: '#0B0C10',
        lang: 'es',
        categories: ['social', 'lifestyle'],
        icons: [
          { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${base}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Vitrina',  url: `${base}feed` },
          { name: 'Mensajes', url: `${base}messages` },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    // Dev proxy: /api y /uploads apuntan al backend local
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL_DEV || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_URL_DEV || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
