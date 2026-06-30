# web - The Missing Manual front-end (SvelteKit)

Server-rendered reading + search UI over the `server` API. All data loading is server-side
(`+page.server.js` loaders call the Rust API), so the browser never calls the API directly - no CORS,
and pages are SSR'd for SEO.

## Run (dev)
1. Start the API: `cargo run --manifest-path ../Cargo.toml -p server`  (serves `:3000`)
2. Start the web app: `npm run dev`  (serves `:5173`; SSR loaders call the API)

Set `API_BASE` to point at a non-default API origin in production.

## Routes
- `/` - guide list + search box
- `/guides/<slug>` - guide overview + phases
- `/guides/<slug>/<n>` - the phase reader
- `/search?q=` - server-rendered search results
