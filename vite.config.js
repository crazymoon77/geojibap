import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: '거지밥',
        short_name: '거지밥',
        description: '고물가 시대, 하루 1만원으로 건강하게 먹는 식단 도우미',
        theme_color: '#863bff',
        background_color: '#111111',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        lang: 'ko',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // 빌드 산출물 전체 프리캐시
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // API는 네트워크 우선 (오프라인 시 캐시 fallback)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/openapi\.foodsafetykorea\.go\.kr\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'cookrcp-api', expiration: { maxAgeSeconds: 60 * 60 * 24 } },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      // 농림수산식품교육문화정보원 레시피 API 프록시
      '/api-proxy/recipe': {
        target:       'http://211.237.50.150:7080',
        changeOrigin: true,
        rewrite:      path => path.replace(/^\/api-proxy\/recipe/, '/openapi'),
      },
      // 식품안전나라 레시피 API (COOKRCP01)
      '/api-proxy/cookrcp': {
        target:       'http://openapi.foodsafetykorea.go.kr',
        changeOrigin: true,
        rewrite:      path => path.replace(/^\/api-proxy\/cookrcp/, '/api'),
      },
    },
  },
})
