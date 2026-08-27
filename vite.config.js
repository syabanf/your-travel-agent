import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [react()],
  build: {
    // Route-based code-splitting keeps individual chunks reasonable; raise the
    // warning threshold so the (smaller) main chunk + vendor chunks don't warn.
    chunkSizeWarningLimit: 1500,
  },
  resolve: {
    alias: {
      // Was previously provided by @base44/vite-plugin.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // jsdom disables localStorage/sessionStorage on the default about:blank
    // opaque origin, so give it a real origin — otherwise every storage call in
    // a test silently no-ops (or throws) and we'd be testing the in-memory
    // fallback instead of the real path.
    environmentOptions: { jsdom: { url: 'http://localhost/' } },
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    restoreMocks: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
