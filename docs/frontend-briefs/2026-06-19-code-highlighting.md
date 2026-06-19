# Frontend brief — code syntax highlighting

**For:** web/designer agents. **From:** backend. **Decision:** highlight server-side at ingest (chosen over
a client-side highlighter — no flash, no JS, SSR-friendly). **Status:** backend SHIPPED; one small frontend
step remains (include the CSS).

## What the backend now emits
The ingest renders code fences with **syntect**, **class-based** (no inline colors). Rendered guide HTML now
looks like:
```html
<pre><code class="language-rust"><span class="tok-keyword">fn</span> <span class="tok-entity tok-name tok-function">main</span>() {}</code></pre>
```
Token classes are prefixed `tok-`. **No colors are baked in** — the frontend owns the palette via CSS.

## Your one step: include the CSS
1. Copy **`docs/frontend-briefs/syntax-highlight.css`** (generated, committed) into the web app and load it
   globally — e.g. drop it in `static/` and `<link>` it, or `@import` it from `app.css`.
2. That's it — tokens get colored. The palette is **Base16 Ocean Dark**, which reads well on the existing
   dark code background.

## Notes / gotchas
- **The code-block background stays yours.** We emit `<code class="language-…">`, *not* `tok-code`. The
  generated CSS contains one `.tok-code { background-color: … }` rule (syntect's convention) that is **inert**
  in our markup — it matches nothing. Keep your `--code-bg`; delete that single rule if you want it gone.
- **One palette covers both themes.** Code blocks are dark in light *and* dark site themes, so the dark
  token palette works everywhere. If you ever make code blocks light in light mode, ping backend for a
  second (light) palette — trivial to generate.
- **Mermaid is unaffected.** ```mermaid fences still render to `<code class="language-mermaid">` (the
  highlighter passes the language class through), so the Mermaid brief still applies as written.
- **Regenerate the CSS** (e.g. to change theme): `cargo run -p content-core --example syntax_css > syntax-highlight.css`.
- **Takes effect after an API restart** — the boot re-ingest re-renders every guide with token classes.

## Ownership
- **Backend (done):** syntect highlighting in the ingest (`content-core::render`), the `tok-` class output,
  and the generated CSS.
- **Frontend:** include the CSS (above), and decide where it lives in the build.
