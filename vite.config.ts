import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// `npm run dev` (vercel dev) serves this app and /api together on one port.
// This proxy only matters for the `dev:vite-only` + `dev:api` fallback pair,
// for developers who haven't linked a Vercel account yet.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
