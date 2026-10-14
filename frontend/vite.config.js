import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Плагин для прод-сборки: вырезает console.debug/info/log и debugger.
 * console.warn/error остаются, чтобы ошибки были видны в мониторинге.
 * Совместим с Vite 8 (Oxc), без зависимости от esbuild.
 */
function stripDebugLogs() {
  return {
    name: 'strip-debug-logs',
    apply: 'build',
    enforce: 'post',
    renderChunk(code) {
      const cleaned = code
        .replace(/console\.(debug|info|log)\s*\([^)]*\)\s*;?/g, '')
        .replace(/\bdebugger\s*;?/g, '')
      return cleaned === code ? null : { code: cleaned, map: null }
    },
  }
}

export default defineConfig({
  plugins: [react(), stripDebugLogs()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8082', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8082', changeOrigin: true }
    }
  }
})