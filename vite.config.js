/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { createHash } from 'node:crypto'
import { cp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const LANDING_DIR = fileURLToPath(new URL('./landing', import.meta.url))

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
}

/**
 * The company-profile site is plain static HTML that lives outside the Vite
 * app (it must not be nested under the app's '/app/' base). This plugin makes
 * dev behave exactly like production:
 *   '/'          → the landing page
 *   '/landing/*' → files from ./landing
 * and copies the folder into dist/ on build.
 */
function landingSite() {
  return {
    name: 'icon-holiday-landing',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url || '/').split('?')[0]

        // Same redirects nginx performs in production, so dev behaves the same.
        if (url === '/' || url === '/index.html') {
          res.statusCode = 302
          res.setHeader('Location', '/landing/')
          return res.end()
        }
        if (url === '/admin' || url.startsWith('/admin/')) {
          res.statusCode = 302
          res.setHeader('Location', '/app/admin')
          return res.end()
        }
        // '/landing' without the slash would load the page with every relative
        // link (styles.css, data.js, tour.html) resolved against '/'.
        if (url === '/landing') {
          const query = (req.url || '').slice(url.length)
          res.statusCode = 301
          res.setHeader('Location', `/landing/${query}`)
          return res.end()
        }
        if (!url.startsWith('/landing/')) return next()

        let rel = url.slice('/landing'.length) || '/'
        if (rel.endsWith('/')) rel += 'index.html'
        // Keep the resolved path inside the landing folder.
        const file = path.join(LANDING_DIR, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''))
        if (!file.startsWith(LANDING_DIR)) return next()

        try {
          const info = await stat(file)
          if (!info.isFile()) return next()
          res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream')
          return res.end(await readFile(file))
        } catch {
          return next()
        }
      })
    },
    async closeBundle() {
      // dist/app/ holds the SPA; the landing site sits beside it at dist/landing/.
      // Clear it first so pages deleted from ./landing don't linger in a rebuild.
      const out = fileURLToPath(new URL('./dist/landing', import.meta.url))
      await rm(out, { recursive: true, force: true })
      await cp(LANDING_DIR, out, { recursive: true })

      // The CDN caches styles.css and the scripts for hours, so a fresh page
      // would load last deploy's CSS and JS. Tag each link with a hash of the
      // file's content: a changed file gets a new URL, an unchanged one keeps
      // its cache.
      const version = {}
      const names = await readdir(out)
      for (const name of names.filter((n) => /\.(css|js)$/.test(n))) {
        const body = await readFile(path.join(out, name))
        version[name] = createHash('sha1').update(body).digest('hex').slice(0, 8)
      }
      for (const name of names.filter((n) => n.endsWith('.html'))) {
        const file = path.join(out, name)
        const html = await readFile(file, 'utf8')
        await writeFile(file, html.replace(
          /(href|src)="\.\/([\w-]+\.(?:css|js))"/g,
          (match, attr, asset) => (version[asset] ? `${attr}="./${asset}?v=${version[asset]}"` : match),
        ))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // The landing page owns '/', so the app is served from '/app/'. Everything
  // else derives from this: import.meta.env.BASE_URL, the router basename and
  // the PWA scope.
  base: '/app/',
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [react(), landingSite()],
  build: {
    // Emit into dist/app so the files sit exactly where the '/app/' URLs point.
    outDir: 'dist/app',
    emptyOutDir: true,
    // Route-based code-splitting keeps individual chunks reasonable; raise the
    // warning threshold so the (smaller) main chunk + vendor chunks don't warn.
    chunkSizeWarningLimit: 1500,
  },
  resolve: {
    alias: {
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
