# The Missing Manual — project notes

A free, text-first developer knowledge library. Content is Markdown in `guides/` (the source of
truth); the platform under `platform/` is a Rust `content-core` engine (ingest + SQLite + Tantivy
search) + an axum `server` API + a SvelteKit `web` front-end.

## Design system
Read `DESIGN.md` before any visual or UI change. Fonts, colors, spacing, and aesthetic are defined
there. Don't deviate without explicit approval.

## Run the platform (dev)
- API: `cargo run --manifest-path platform/Cargo.toml -p server`  (serves :3000)
- Web: `(cd platform/web && npm run dev)`  (serves :5173; SSR loaders call the API)
- Tests: `cargo test --manifest-path platform/Cargo.toml`
- Content updates: the server ingests `guides/` on startup; restart to pick up edits.

## Windows note
Run npm via a subshell `(cd platform/web && npm ...)`, not `npm --prefix` (it misreads package.json).
