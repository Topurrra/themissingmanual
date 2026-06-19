# Runnable code blocks — language roadmap (hybrid plan)

The runnable-code widget runs against a **pluggable adapter layer**
(`platform/web/src/lib/runnable/adapters.js`). Each language is one adapter
implementing `{ label, cmLang(), load(onStatus), run(code), dispose() }`; the
widget only calls `getAdapter(lang)`. Adding a language never touches the widget.

## Now — client-side WASM (zero server, runs on the user's machine)
- **Python** — Pyodide (CPython in WASM, from CDN)
- **JavaScript** — sandboxed Web Worker (console capture, return value, timeout)
- **SQL** — sql.js (SQLite in WASM, seeded sample DB → results table)

A fence is flagged with the ` ```lang runnable ` info string; the backend ingest
emits `<pre data-runnable="<lang>">` and the frontend mounts the editor.

## Near-term — more client-side adapters (Tier 1: a real in-browser runtime exists)
Each is ~30 lines + a CDN/npm runtime, same pattern as Python — **no server**:
- **Ruby** — `@ruby/wasm-wasi` (ruby.wasm)
- **PHP** — `@php-wasm/web`
- **Lua** — `wasmoon`
- **C / C++** — a clang-in-WASM toolchain (heavier)
- **TypeScript** — transpile with `esbuild-wasm`/`sucrase`, then run in the JS worker
- **C#** — possible purely client-side via the .NET WASM runtime (Blazor + Roslyn),
  but it downloads tens of MB; acceptable for a dedicated C# guide, heavy otherwise.

## Future — HYBRID: add a server-side execute path for the rest
Some languages have **no practical in-browser runtime**: **Java, Go, Rust** (and C#
if we don't want the heavy .NET download). For these we'll go **hybrid** — keep
client-side WASM as the default for everything that supports it, and add a
**sandboxed server-side execute service** only for the languages that need it.

- **Shape:** a small isolated execute endpoint (self-hosted **Piston**, or
  **Judge0**, or a custom **gVisor/nsjail/Firecracker** container running the
  toolchain). The frontend stays identical: a server-backed adapter's `run()`
  simply `POST`s `{ lang, code, stdin }` to the endpoint and renders the response
  in the same `RunResult` shape — the widget can't tell the difference.
- **Why hybrid, not all-server:** client WASM is free, infinitely scalable, and has
  zero security surface (runs in the user's tab). Reserve the server only for
  Java/Go/Rust where there's no other option.
- **Costs to design for when we build it:** sandbox/isolation (untrusted code),
  CPU/memory/time limits, rate-limiting + abuse protection, and the compute/ops
  cost. These are exactly the risks the client-WASM design avoided, so the
  server path stays scoped to the few languages that truly need it.

**Decision:** ship Tier-1 client adapters on demand; build the hybrid server-exec
service when Java/Go/Rust become a priority. The adapter interface is the seam, so
either path is a drop-in.
