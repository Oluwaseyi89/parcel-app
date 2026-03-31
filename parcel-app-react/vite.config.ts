import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: '.',  // Explicitly set root to current directory
  
  server: {
    port: 3000,
    host: 'localhost',
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:7000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')  // Point to root index.html
      },
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            'zustand'
          ]
        }
      }
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')  // Optional but helpful
    }
  }
})
