# Frontend brief — runnable code blocks (client-side WASM)

**For:** web/designer agents. **From:** backend. **Decision:** in-browser code editor via client-side WASM
(no server execution — zero security/cost/ops risk, scales infinitely, runs on the user's machine).
**Status:** design/contract only; nothing built yet.

## Goal
Inside a guide, a marked code block becomes an interactive widget: editable code + a **Run** button + an
output panel, executed entirely in the browser. Ideal for the per-language A→Z guides and the SQL guides.

## The marker contract (how a block is flagged "runnable")
A normal fenced block stays static. A runnable one needs a signal that survives Markdown → HTML.

**Recommended (backend-emitted attribute — I'll build this side):** the writer flags a block with a
`runnable` info string:
````markdown
```python runnable
print("hello")
```
````
The ingest (comrak post-process) emits `<pre data-runnable="python"><code>…</code></pre>`. The frontend
then just queries `[data-runnable]`, reads the language + the code, and mounts the editor. Clean, and the
detection is a single attribute. **Say the word and I'll add the ingest support** (small backend change).

**Fallback (frontend-only, no backend change):** detect a sentinel first line in the code, e.g.
`# ::runnable` (Python) / `// ::runnable` (JS), strip it, and use the `language-*` class for the runtime.
Works today with zero backend change if you want to prototype before I wire the attribute.

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
- **Backend (me):** the `data-runnable` attribute in the ingest, if you choose the recommended marker.
- This is independent of search/Mermaid — it can land on its own timeline.
