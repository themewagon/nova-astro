// @ts-check
import { defineConfig } from 'astro/config';
import { fileURLToPath, URL } from 'node:url';
import { SITE_URL } from './site.config.mjs';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	output: 'static',
  devToolbar: {
    enabled: false,
  },
  site: SITE_URL,
  base: undefined,
  compressHTML: true,
  image: {
    responsiveStyles: true,
  },
  build: {
    assets: '_assets',
    inlineStylesheets: 'never',
  },
  // Sitemap: filter cuts utility pages (component gallery /dev/ and
  // fixture QA /qa/) that have a meta noindex - they went into it without it
  // sitemap-index.xml and sent Google a contradictory signal (as for webscale).
  // serialize adds lastmod (build date), because the integration does not add it itself.
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/dev/') && !page.includes('/qa/'),
      serialize(item) {
        return { ...item, lastmod: new Date().toISOString() };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // Why: Agents and scripts write files in batches (JSON, .astro, tests).
    // Without this, Vite reloads the module when only some of the files
    // already exists, and says "Cannot find module" for those just created
    // imports. awaitWriteFinish waits until the file is unchanged by
    // stabilityThreshold ms (stable write) before reloading the module.
    server: {
      watch: {
        // Dlaczego usePolling: na Windows chokidar gubi zdarzenia "create" dla
        // nowych plikow (agenci zapisuja szybko partie plikow), przez co Astro
        // nie rejestruje nowych routow (np. /dev/components/*) i zwraca 404
        // dopoki jakikolwiek inny plik nie wymusi pelnego rescannu.
        // Polling gwarantuje wykrycie kazdej zmiany/utworzenia niezawodnie.
        usePolling: true,
        interval: 300,
        awaitWriteFinish: {
          stabilityThreshold: 400,
          pollInterval: 50,
        },
      },
    },
    build: {
      minify: 'esbuild',
      cssMinify: 'lightningcss',
      // Common global CSS should be one request per page,
      // so that component sheets do not create a render blocking chain.
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          entryFileNames: 'js/[name]-[hash].js',
          chunkFileNames: 'js/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
        '@content': fileURLToPath(new URL('./src/content', import.meta.url)),
        '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
        '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
        '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
      }
    },
    // Dlaczego noDiscovery: false: Astro (do 7.0.9) w client environment nie
    // scans .astro files in optimizeDeps.entries (bug withastro/astro#16630),
    // therefore deps imported by <script> in .astro components are
    // only discovered when the page is loaded. Every "new" discovery forces
    // re-optimization and invalidates the entire cache, and modules without ?v= (including
    // dev-toolbar: /@id/astro/runtime/client/dev-toolbar/entrypoint.js)
    // they get 504 "Outdated Optimize Dep". noDiscovery: false activates the branch
    // Astro with entries containing .astro, so the scanner sees everything at once.
    optimizeDeps: {
      noDiscovery: false,
    },
  }
});
