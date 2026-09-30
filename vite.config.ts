/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Miscrits Companion', short_name: 'Miscrits', description: 'Companion for Miscrits: World of Creatures',
        theme_color: '#0b0e15', background_color: '#0b0e15', display: 'standalone', start_url: './', scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png,svg}'],
        maximumFileSizeToCacheInBytes: 3_000_000,
        navigateFallbackDenylist: [/^\/data\//],
        runtimeCaching: [
          { urlPattern: /\/data\/maps\/.*\.webp$/, handler: 'StaleWhileRevalidate', options: { cacheName: 'maps', expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 3600 } } },
          // opaque (no-cors) images: revalidate so a transient CDN error is not pinned; keep the count low (opaque entries are quota-heavy)
          { urlPattern: /^https:\/\/cdn\.worldofmiscrits\.com\/.*/, handler: 'StaleWhileRevalidate',
            options: { cacheName: 'sprites', expiration: { maxEntries: 400, maxAgeSeconds: 7 * 24 * 3600, purgeOnQuotaError: true }, cacheableResponse: { statuses: [0, 200] } } },
          { urlPattern: /^https:\/\/worldofmiscrits\.com\/.*\.png$/, handler: 'StaleWhileRevalidate',
            options: { cacheName: 'icons', expiration: { maxEntries: 60, maxAgeSeconds: 7 * 24 * 3600, purgeOnQuotaError: true }, cacheableResponse: { statuses: [0, 200] } } },
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, handler: 'StaleWhileRevalidate', options: { cacheName: 'fonts' } },
        ],
      },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
})
