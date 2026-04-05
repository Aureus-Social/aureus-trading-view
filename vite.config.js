import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['lightweight-charts'],
          'supabase': ['@supabase/supabase-js'],
          'store': ['zustand'],
        }
      }
    }
  }
})
