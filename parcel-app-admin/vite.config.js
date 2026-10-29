import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_* values are inlined at build time; a production build without the API origin would
  // ship an admin panel that cannot reach the backend.
  if (mode === 'production' && !loadEnv(mode, process.cwd(), 'VITE_').VITE_API_BASE_URL?.trim()) {
    throw new Error('VITE_API_BASE_URL must be set for production builds.')
  }

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  }
})
