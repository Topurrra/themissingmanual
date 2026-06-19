# Frontend brief — runnable code blocks (client-side WASM)

**For:** web/designer agents. **From:** backend. **Decision:** in-browser code editor via client-side WASM
(no server execution — zero security/cost/ops risk, scales infinitely, runs on the user's machine).
**Status:** the backend marker is **SHIPPED** — the ingest now emits `<pre data-runnable="<lang>">`.
The frontend editor/runtimes are the remaining work.

## Goal
Inside a guide, a marked code block becomes an interactive widget: editable code + a **Run** button + an
output panel, executed entirely in the browser. Ideal for the per-language A→Z guides and the SQL guides.

## The marker contract (SHIPPED)
The writer flags a block with a `runnable` info string:
````markdown
```python runnable
print("hello")
```
````
The ingest now renders that as:
```html
<pre data-runnable="python"><code class="language-python">…highlighted…</code></pre>
```
So the frontend simply `querySelectorAll('[data-runnable]')`, reads the language from the attribute (and the
code text from the inner `<code>`), and mounts the editor. A plain fence (no `runnable`) stays a static
`<pre><code class="language-…">`, and ```mermaid is never marked runnable. The language is validated
(alphanumeric/`+`/`-`) before the attribute is emitted. The messier `# ::runnable` sentinel fallback is no
longer needed — the real attribute is live.

## Runtimes (all client-side)
| Language | Runtime |
|---|---|
| Python | **Pyodide** (CPython in WASM) |
| JavaScript / TypeScript | sandboxed **Web Worker** (eval with captured console) |
| SQL | **sql.js** (SQLite in WASM) — run against a small seeded DB; perfect for the `databases` guides |
| Go / Rust | embed the official WASM playground, or defer |

Load each runtime **lazily** (only when a runnable block of that language is on the page) — Pyodide is a
few MB, so never load it on guides that don't need it.

## Editor + widget
- **CodeMirror 6** (lighter than Monaco, better for a content site) with the language mode.
- Widget = editor + Run + an output area; capture stdout/stderr/return value; show errors inline.
- A Reset-to-original button. Optional: a "copy" button.
- Persist nothing server-side; it's all local.
- Respect theme (light/dark) and keep it keyboard-accessible.

## Ownership
- **Frontend:** the editor, the WASM runtimes, the Run widget, lazy-loading, theming.
- **Backend (done):** the `data-runnable="<lang>"` attribute in the ingest (`content-core::render`).
- This is independent of search/Mermaid — it can land on its own timeline. Live after the next API restart
  (re-ingest re-renders the guides).
