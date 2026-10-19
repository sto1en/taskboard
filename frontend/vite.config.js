import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // host: true => слушаем 0.0.0.0, чтобы Vite был доступен
    // и по LAN-IP, и через ngrok (ngrok http 5173).
    host: true,
    port: 5173,
    // Разрешаем внешние хосты (ngrok-домены) — иначе Vite
    // отбивает запросы с "Blocked request" при туннелировании.
    allowedHosts: true,
    proxy: {
      '/api': { target: 'http://localhost:8082', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8082', changeOrigin: true },
    },
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
})
