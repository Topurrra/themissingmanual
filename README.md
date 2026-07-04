# The Missing Manual

**The free, text-first library of real-world developer and STEM knowledge nobody teaches you.**

Not "build a todo app." Not a 1,000-page reference. Just the stuff that makes you competent —
explained like advice from a battle-hardened friend who remembers what it felt like to not know.

**[themissingmanual.dev →](https://themissingmanual.dev)**

Every page has to answer one question: *"Would this have saved me from a terrible day at work?"*
If not, it doesn't belong.

---

## What's inside

- **323 guides, 1,292 phases, 25 categories** — Git, operating systems, hardware, networking,
  databases, architecture, security, DevOps, 7 full programming languages and 30+ frameworks
  end-to-end, plus Logic, Mathematics, and Physics for the reasoning underneath it all.
- **Everything is laddered A→Z.** Each category opens with "what this actually is" for someone who's
  never touched it, and ends at genuinely advanced material — no assumed knowledge, ever.
- **It's not just reading.** Interactive playgrounds (regex testers, sorting visualizers, a real
  in-browser terminal), inline quizzes, hands-on exercises, runnable Python/JS/SQL code blocks, and
  animated step-by-step explainers for the concepts that are easier to watch than read.
- **An AI tutor** that answers questions about the exact phase you're reading, grounded in the
  guide's own content — not a generic chatbot bolted on the side.
- **Spaced repetition review** and a set of logic/pattern brain games to keep the fundamentals sharp
  after you've read them once.
- **Free. No account, no paywall, no ads.** It stays that way.

## How it's built

A content-first split: the guides are the product, the platform serves them.

```
guides/            Markdown source of truth — every guide, every phase, every quiz/exercise
platform/
  core/            Rust: ingest, SQLite storage, Tantivy full-text search
  server/          Rust (axum): the public + admin API
  web/             SvelteKit: SSR frontend, admin CMS, search UI
```

- **Guides are plain Markdown** with YAML frontmatter — no CMS lock-in, readable and diffable in a
  PR. Interactive elements (quizzes, exercises, playgrounds, animated explainers) are authored as
  fenced code blocks right in the Markdown.
- **The server ingests `guides/` on startup** (and on a timer, and on demand from the admin panel) —
  drop a folder in, it goes live. No database migration to write a guide.
- **Search is real full-text search** (Tantivy), not a fuzzy string match — typo-tolerant, ranked,
  same engine that powers the in-app AI tutor's "look this up in the guides" tool.
- **Built to be read by machines too.** Every guide phase is independently citable (its own URL, its
  own JSON-LD `Article`/`FAQPage` structured data), served as clean semantic HTML, and available as
  raw Markdown to anything that asks for it (`Accept: text/markdown`) — including a small
  [MCP server](platform/web/src/routes/mcp/+server.js) so AI agents can search and read the library
  directly.

## Running it locally

```bash
# API (Rust, axum) — serves :3000, ingests guides/ on boot
cargo run --manifest-path platform/Cargo.toml -p server

# Web (SvelteKit) — serves :5173, calls the API above
cd platform/web && npm install && npm run dev

# Rust test suite
cargo test --manifest-path platform/Cargo.toml
```

## Contributing

Guides live in `guides/<category>/<slug>/` as plain Markdown — no code required to write one.

Found something wrong in a guide, or a command that doesn't work anymore? Open an issue or a PR —
small, factual corrections are exactly the kind of contribution this project wants most.

## License

Split by design:
- **Code** (`platform/`, tooling, scripts) — [MIT](LICENSE).
- **Guide content** (`guides/`) — [CC BY-NC-SA 4.0](LICENSE-CONTENT): share it, adapt it, teach with
  it, even train models on it — just credit the source, don't sell it, and share alike.
