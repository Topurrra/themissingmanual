# Next Guides — working backlog

The live to-do list for upcoming guides. **Mark an item `- [x]` when its guide is written, reviewed, and
passing** (`cargo test -p content-core` green, LF endings, Mermaid compact). `guidespath.md` stays the
canonical taxonomy/order map; this file is just "what's next and what's done."

Legend: `[ ]` todo · `[x]` done · 🔝 high-impact · ⚠ placement = category differs from first instinct / may need a new category.

---

## Part 1 — Standalone new guides (fill gaps in existing categories)

Slugs are proposals; set the real `order:` (next free rung in that category) when writing. Each line:
`slug` — difficulty — the terrible day it saves.

### operating-systems
- [ ] `editing-in-the-terminal` — beginner — vim/nano survival; escaping vim without closing the SSH session. 🔝
- [ ] `scheduled-tasks-cron` — intermediate — cron & Task Scheduler; the job that silently never ran.
- [ ] `file-permissions-deep-dive` — beginner — 644 vs 755, chmod/chown, "permission denied" for real.

### hardware
- [ ] `why-your-computer-is-slow` — beginner — what to actually upgrade (RAM vs SSD vs CPU), not guesswork. 🔝
- [ ] `how-a-screen-works` — beginner — pixels, refresh rate, resolution, color.

### networking
- [ ] `what-a-vpn-does` — beginner — what a VPN really routes/hides (and what it doesn't). 🔝
- [ ] `email-demystified` — intermediate — SMTP/SPF/DKIM/DMARC; why your mail lands in spam. 🔝
- [ ] `firewalls-and-ports` — intermediate — what a firewall blocks and the "open port" mental model.

### programming-languages  (⚠ several cross-cutting ones live here on purpose — they're code-facing)
- [ ] `dates-and-time-zones` — intermediate — UTC/DST/offsets; the bug that corrupts data and breaks launches. 🔝 ⚠ (cross-cutting → PL)
- [ ] `character-encodings-unicode` — intermediate — UTF-8, mojibake (`�`/`Ã©`), emoji, bytes vs chars. 🔝 ⚠ (was tempted to file under hardware → PL)
- [ ] `floating-point-and-money` — beginner — why `0.1 + 0.2 ≠ 0.3`; never store money in floats. 🔝
- [ ] `closures-and-scope` — intermediate — the captured-variable bugs across languages.
- [ ] `recursion-finally-clicks` — beginner — the mental model + when it blows the stack.

### version-control
- [ ] `gitignore-lfs-submodules` — intermediate — keep junk/secrets/big files out; LFS; submodule pain. 🔝
- [ ] `code-review-done-well` — intermediate — giving/receiving review without the friction.
- [ ] `git-internals` — advanced — what `.git` actually contains (objects, refs).

### debugging
- [ ] `debugging-in-the-browser` — intermediate — DevTools: console, breakpoints, the Network tab. 🔝 ⚠ (frontend-flavored; see "possible frontend category")
- [ ] `race-conditions-and-heisenbugs` — advanced — bugs that vanish when you look (timing/state/concurrency).
- [ ] `print-debugging-well` — beginner — structured logging/tracing when there's no debugger.

### testing
- [ ] `flaky-tests` — intermediate — why tests flake and how to kill them; the red CI nobody trusts. 🔝
- [ ] `test-coverage-truth` — intermediate — what the % really means and the lies it tells.
- [ ] `testing-with-databases` — intermediate — fixtures, test containers, isolating external services.

### databases
- [ ] `n-plus-one-queries` — intermediate — the ORM trap: fast on seed data, dead in prod. 🔝
- [ ] `connection-pools` — intermediate — "too many connections" outages; pool sizing. 🔝
- [ ] `database-backups-and-restores` — intermediate — test the restore *before* the disaster. 🔝
- [ ] `null-and-three-valued-logic` — beginner — why `WHERE x != 'a'` drops the NULLs.
- [ ] `orms-explained` — intermediate — what an ORM does and when it bites.

### data-analytics
- [ ] `sql-window-functions` — intermediate — the analyst's power tool (running totals, ranks, lag). 🔝
- [ ] `metrics-that-lie` — beginner — averages, survivorship, Simpson's paradox. 🔝 (very on-brand)
- [ ] `cleaning-messy-data` — intermediate — the unglamorous 80% of data work.

### apis
- [ ] `rate-limits-and-retries` — intermediate — 429s, backoff, jitter, idempotency when calling flaky APIs. 🔝
- [ ] `realtime-apis-websockets-sse` — intermediate — WebSockets vs Server-Sent Events vs polling. 🔝
- [ ] `authenticating-to-an-api` — beginner — keys/OAuth/JWT from the *caller's* side.
- [ ] `pagination-and-bulk` — intermediate — cursor vs offset; not melting the server fetching everything.

### architecture
- [ ] `event-driven-architecture` — intermediate — events, queues, choreography vs orchestration. 🔝
- [ ] `the-twelve-factor-app` — intermediate — the canonical "is this app actually shippable?" checklist. 🔝
- [ ] `idempotency-explained` — intermediate — making retries safe (the "charged twice" bug).

### devops
- [ ] `zero-downtime-deploys` — intermediate — blue-green & canary; shipping without a maintenance window. 🔝
- [ ] `feature-flags-and-rollbacks` — intermediate — ship dark, flip on, roll back instantly. 🔝
- [ ] `monitoring-without-crying-wolf` — intermediate — alert design; pages that mean something.

### infrastructure
- [ ] `backups-and-disaster-recovery` — intermediate — 3-2-1, RPO/RTO, and *testing* the restore. 🔝
- [ ] `object-storage-s3` — intermediate — buckets, keys, signed URLs, the "public bucket" leak. 🔝
- [ ] `tls-certs-with-certbot` — intermediate — hands-on Let's Encrypt/Certbot, auto-renewal.

### performance
- [ ] `web-performance-core-web-vitals` — intermediate — LCP/CLS/INP, the Network tab, bundle size. 🔝 ⚠ (frontend-flavored)
- [ ] `memory-leaks-find-and-fix` — advanced — the slow climb to OOM; heap snapshots.
- [ ] `http-caching-and-cdns` — intermediate — Cache-Control, ETags, CDN cache keys.

### security
- [ ] `supply-chain-security` — intermediate — dependencies & lockfiles; the `npm install` that owned you. 🔝
- [ ] `security-headers-csp-hsts` — intermediate — CSP, HSTS, and friends, explained. 🔝
- [ ] `2fa-and-session-security` — intermediate — TOTP, session fixation, secure session design.

### ai-ml
- [ ] `evaluating-llm-output` — intermediate — evals, not vibes; catch prompt regressions. 🔝
- [ ] `building-an-ai-agent` — intermediate — tools / function-calling / the agent loop. 🔝
- [ ] `prompt-injection-and-guardrails` — intermediate — the security model of LLM apps. 🔝
- [ ] `structured-output-from-llms` — beginner — reliable JSON out of a model.

---

## Part 2 — Per-language deepening + new languages

Each language gets a **trio**: `*-from-zero` (basics, exists for py/js/go/rust) → `*-beyond-the-basics`
(advanced language features) → one or more **framework** guides (the dominant real-world stack). All in
`programming-languages` for now (⚠ if it grows unwieldy, consider splitting frameworks into their own
category — see notes).

> **Runnable note:** python & javascript code can be ` ```lang runnable `; **go, rust, java, c#** cannot yet
> (no runtime — see `docs/runnable-languages-roadmap.md`), and framework/web guides aren't runnable either
> (they need a server). Keep snippets plain for those.

### Python  (`python-from-zero` ✅)
- [ ] `python-beyond-the-basics` — advanced — decorators, generators, context managers, typing/mypy, dunder methods, packaging, async deep-dive.
- [ ] `fastapi-from-zero` — intermediate — modern async API framework (the popular default). 🔝
- [ ] `django-from-zero` — intermediate — batteries-included web framework (ORM, admin, templates).

### JavaScript / TypeScript  (`javascript-from-zero` ✅)
- [ ] `typescript-from-zero` — intermediate — typed JS; the single highest-demand gap. 🔝
- [ ] `javascript-beyond-the-basics` — advanced — prototypes/`this` deep, modules & bundlers, iterators/generators, perf.
- [ ] `react-from-zero` — intermediate — components, state, hooks, the render model. 🔝
- [ ] `nextjs-from-zero` — intermediate — the full-stack React framework (routing, SSR, server components).
- [ ] `nodejs-and-express-from-zero` — intermediate — JS on the server, building an API.

### Go  (`go-from-zero` ✅)
- [ ] `go-beyond-the-basics` — advanced — concurrency patterns (select, worker pools, context), generics, interfaces deep, profiling, modules.
- [ ] `go-web-services` — intermediate — `net/http` + a router (chi/gin); building a real service.

### Rust  (`rust-from-zero` ✅)
- [ ] `rust-beyond-the-basics` — advanced — traits & generics deep, lifetimes in practice, `async`/await + tokio, error handling patterns, macros, a peek at `unsafe`.
- [ ] `rust-web-with-axum` — intermediate — async web services in Rust (axum/tokio). (This very platform is Rust+axum.)

### Java  (NEW — full depth)
- [ ] `java-from-zero` — beginner — JVM, `javac`/`java`, types, classes & objects, collections, the standard library.
- [ ] `java-beyond-the-basics` — advanced — generics, streams & lambdas, concurrency, the JVM/GC, build tools (Maven/Gradle), packaging.
- [ ] `spring-boot-from-zero` — intermediate — the dominant Java framework; DI, controllers, JPA, building a REST service. 🔝

### C#  (NEW — full depth)
- [ ] `csharp-from-zero` — beginner — .NET, `dotnet` CLI, types, classes, collections, LINQ basics.
- [ ] `csharp-beyond-the-basics` — advanced — LINQ deep, `async`/await & Tasks, generics, records, the .NET runtime/GC, NuGet.
- [ ] `aspnet-core-from-zero` — intermediate — the dominant C# web framework; minimal APIs/controllers, DI, EF Core. 🔝

> **Later (not now):** more languages on the same trio pattern — candidates: **Kotlin, Swift, PHP, Ruby,
> C/C++, SQL-as-a-language**. Add when the above land.

---

## Notes & open decisions
- **Possible new `frontend` category.** Several ideas are frontend-flavored and currently filed elsewhere:
  `debugging-in-the-browser` (debugging), `web-performance-core-web-vitals` (performance), plus
  `react-from-zero` / `nextjs-from-zero` / `typescript-from-zero` (programming-languages). If we add HTML/CSS
  basics + a framework lane, a dedicated `frontend` category (one `DEFS` entry in `content-core::categories`)
  would group these cleanly. **Decide before writing the React/Next guides** so they land in the right home.
- **Category placements flagged ⚠** above are deliberate; revisit if a `frontend` category lands.
- **Framework guides** may eventually warrant their own grouping if `programming-languages` gets crowded;
  fine where they are for now.
- When each guide ships: add its row to `guidespath.md` (with `order:`), and if it completes/extends a
  learning-path step, wire it in `content-core::tracks`.

_Continuing tomorrow._
