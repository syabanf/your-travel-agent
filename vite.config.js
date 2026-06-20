import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [react()],
  resolve: {
    alias: {
      // Was previously provided by @base44/vite-plugin.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
