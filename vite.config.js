import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 농림수산식품교육문화정보원 레시피 API 프록시
      // 브라우저 → Vite dev server → http://211.237.50.150:7080 (CORS·Mixed Content 우회)
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
