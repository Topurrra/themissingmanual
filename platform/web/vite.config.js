import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  // @electric-sql/pglite ships its WASM/data files and resolves them via
  // import.meta.url-relative URLs at runtime. Vite's dependency pre-bundling
  // rewrites/copies the package into node_modules/.vite/deps/ without those
  // sibling asset files, so pglite.wasm/pglite.data/initdb.wasm 404 unless the
  // package is excluded from pre-bundling (confirmed via a real browser network
  // trace - see pglite-adapter.js). This is the standard fix for WASM npm
  // packages that resolve their own assets this way (sql.js-in-CDN doesn't hit
  // this because it isn't loaded through npm/Vite at all).
  optimizeDeps: { exclude: ['@electric-sql/pglite'] }
});
