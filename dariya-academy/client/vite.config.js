import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Keep the proxy in sync with the API port (star.bat may bump it if busy).
      '/api': {
        target: `http://localhost:${process.env.PORT || 4000}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
