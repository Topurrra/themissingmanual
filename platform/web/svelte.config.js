import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    csp: {
      mode: 'auto', // nonce for dynamically-rendered responses, hash for prerendered ones
      directives: {
        'default-src': ["'self'"],
        // 'strict-dynamic' lets scripts we load dynamically (Google Translate,
        // Pyodide/sql.js from jsdelivr) inherit trust from the nonced bundle that
        // injects them - the explicit hosts are just a fallback for browsers that
        // don't support strict-dynamic.
        // 'wasm-unsafe-eval' (not 'unsafe-eval') lets Pyodide/sql.js compile their
        // WebAssembly - it doesn't reopen eval()/new Function() the way unsafe-eval does.
        'script-src': [
          "'self'",
          "'strict-dynamic'",
          "'wasm-unsafe-eval'",
          'https://translate.google.com',
          'https://cdn.jsdelivr.net'
        ],
        // app.html's font/icon/syntax-CSS <link>s use onload="this.media='all'" to
        // load non-render-blocking (see the comment there) - that's an inline event
        // HANDLER ATTRIBUTE, a different CSP directive (script-src-attr) from actual
        // <script> tags. Scoping 'unsafe-inline' to just this directive keeps
        // script-src itself fully nonce/strict-dynamic locked down.
        'script-src-attr': ["'self'", "'unsafe-inline'"],
        // Svelte compiles bound style="..." attributes (progress bars, mastery
        // fills, etc.) to literal inline styles - 'unsafe-inline' is the standard,
        // low-risk compromise for style-src (no script execution possible via CSS).
        // Google Translate's widget injects its own <link rel="stylesheet"> from
        // gstatic (menu chrome) - not covered by strict-dynamic, which only applies
        // to scripts.
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://cdn.jsdelivr.net',
          'https://www.gstatic.com',
          'https://translate.googleapis.com'
        ],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://www.gstatic.com', 'https://cdn.jsdelivr.net', 'data:'],
        'img-src': ["'self'", 'data:', 'https:'],
        // The lofi player's radio mode streams from SomaFM (ice1.somafm.com); loop
        // tracks are self-hosted. Admins can also point the loop list at their own
        // licensed audio via Settings, so this stays as permissive as img-src above
        // rather than a single hardcoded host.
        'media-src': ["'self'", 'https:'],
        'connect-src': ["'self'", 'https://cdn.jsdelivr.net', 'https://translate.googleapis.com'],
        'frame-src': ['https://translate.google.com'],
        // The JS code-playground sandbox (runnable/js-worker.js) runs reader-submitted
        // code via indirect eval() inside a dedicated Worker. Without an explicit
        // worker-src, workers fall back to script-src's policy - which only carries
        // 'wasm-unsafe-eval' (for Pyodide/sql.js WASM), not 'unsafe-eval', so eval()
        // gets silently blocked there. Scoping 'unsafe-eval' to worker-src keeps the
        // main thread's script-src eval-free; only the sandboxed worker gets it.
        'worker-src': ["'self'", "'unsafe-eval'"],
        'object-src': ["'none'"],
        'base-uri': ["'none'"],
        'frame-ancestors': ["'none'"]
      }
    }
  }
};
