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

**STRUCTURE DECISION (2026-06-19):** each `*-from-zero` is **one zero-to-hero guide** — we APPEND the
advanced phases *into it* with per-phase difficulty badges (🟢 Basic / 🟡 Intermediate / 🔴 Advanced),
rather than a separate `*-beyond-the-basics` guide. Reason: one entry per language keeps the sidebar from
overcrowding, and "from zero" should mean all the way to hero. **Frameworks stay separate guides** (a
framework is a different tool, and there are only a few per language). So each language = *one* growing
from-zero guide + a handful of framework guides. (The `*-beyond-the-basics` items below mean "advanced
phases appended into the from-zero guide.")

> **Runnable note:** python & javascript code can be ` ```lang runnable `; **go, rust, java, c#** cannot yet
> (no runtime — see `docs/runnable-languages-roadmap.md`), and framework/web guides aren't runnable either
> (they need a server). Keep snippets plain for those.

### Python  (`python-from-zero` — now zero-to-hero, 19 phases)
- [x] **Advanced phases folded into `python-from-zero` (phases 10–18, badged):** the data model & dunder
  methods · iterators & generators · decorators · context managers · type hints & mypy · dataclasses ·
  concurrency & the GIL · performance & memory · packaging & environments. (Where-to-Go-Next moved to the
  finale, phase 19. ✅ 2026-06-19)
- [ ] `fastapi-from-zero` — intermediate — modern async API framework (the popular default). 🔝
- [ ] `django-from-zero` — intermediate — batteries-included web framework (ORM, admin, templates).

### JavaScript / TypeScript  (`javascript-from-zero` ✅ now zero-to-hero, 18 phases)
- [x] **Advanced phases folded into `javascript-from-zero` (phases 10–17, badged):** scope/closures/hoisting ·
  `this`/prototypes/object model · iterators/generators/symbols · the event loop deep · functional JS ·
  modules & bundlers deep · performance & memory · types & the road to TypeScript. (Where-to-Go-Next moved
  to the finale, phase 18. ✅ 2026-06-22)
- [x] `typescript-from-zero` — intermediate — its own zero-to-hero guide, **13 phases** (order 3, after JS):
  types, functions, interfaces, unions/narrowing, generics, classes, tsconfig — then the deep half: the
  structural type system, utility & mapped types, conditional & template-literal types, typing the real
  world. ✅ 2026-06-22
- [ ] `react-from-zero` — intermediate — components, state, hooks, the render model. 🔝 → **frameworks** category
- [ ] `nextjs-from-zero` — intermediate — the full-stack React framework (routing, SSR, server components). → **frameworks**
- [ ] `nodejs-and-express-from-zero` — intermediate — JS on the server, building an API. → **frameworks**

### Go  (`go-from-zero` ✅ now zero-to-hero, 18 phases)
- [x] **Advanced phases folded into `go-from-zero` (phases 10–17, badged):** interfaces in depth · generics &
  advanced types · concurrency patterns · error handling deep · the runtime (scheduler, memory, GC) ·
  testing/benchmarks/profiling · the standard library as design · performance & optimization. (Where-to-Go-Next
  moved to the finale, phase 18. ✅ 2026-06-22)
- [ ] `go-web-services` — intermediate — `net/http` + a router (chi/gin); building a real service. → **frameworks**

### Rust  (`rust-from-zero` ✅ now zero-to-hero, 18 phases)
- [x] **Advanced phases folded into `rust-from-zero` (phases 10–17, badged):** lifetimes & the borrow checker
  deep · traits & generics deep · smart pointers & interior mutability · error handling deep · fearless
  concurrency · closures/iterators/zero-cost abstractions · macros · performance/unsafe/ecosystem.
  (Where-to-Go-Next moved to the finale, phase 18. ✅ 2026-06-22)
- [ ] `rust-web-with-axum` — intermediate — async web services in Rust (axum/tokio). (This very platform is Rust+axum.) → **frameworks**

### Java  (`java-from-zero` ✅ zero-to-hero, 18 phases — order 6)
- [x] `java-from-zero` — one zero-to-hero guide, **18 phases**: install/JVM, types, collections, control flow,
  classes & objects, inheritance & interfaces, errors & I/O, packages/build/tooling, idioms — then the deep
  half: generics, lambdas & functional interfaces, the Streams API, records/sealed/modern Java, concurrency
  & threads, the JVM (memory/GC/JIT, `playground-gc`), testing/profiling, performance (`playground-bigo`).
  Code plain ` ```java ` (not runnable). ✅ 2026-06-22
- [ ] `spring-boot-from-zero` — intermediate — the dominant Java framework; DI, controllers, JPA, building a REST service. 🔝 → **frameworks**

### C#  (`csharp-from-zero` ✅ zero-to-hero, 18 phases — order 7)
- [x] `csharp-from-zero` — one zero-to-hero guide, **18 phases**: install/.NET/CLR, types (value vs ref),
  collections, control flow, classes & objects, inheritance & interfaces, errors & I/O, projects/NuGet/tooling,
  idioms — then the deep half: generics, delegates/lambdas/events, LINQ, records/pattern-matching/modern C#,
  async/await & Tasks, the .NET runtime (memory/GC/JIT, `playground-gc`), testing/profiling, performance
  (`playground-bigo`). Code plain ` ```csharp ` (not runnable). ✅ 2026-06-22
- [ ] `aspnet-core-from-zero` — intermediate — the dominant C# web framework; minimal APIs/controllers, DI, EF Core. 🔝 → **frameworks**

> **Later (not now):** more languages on the same trio pattern — candidates: **Kotlin, Swift, PHP, Ruby,
> C/C++, SQL-as-a-language**. Add when the above land.

---

## Notes & open decisions
- **`frameworks` category LANDED (✅ 2026-06-22).** Added to `content-core::categories` `DEFS` (slug
  `frameworks`, "Frameworks & Libraries", icon `ti-stack-2`), positioned right after `programming-languages`
  (18 categories total; tests bumped 17→18). Framework guides (FastAPI/Django/React/Next/Spring/axum/etc.)
  go here, NOT in `programming-languages`. The `→ frameworks` tags above mark which backlog items belong.
- **Possible new `frontend` category (still open).** Several ideas are frontend-flavored and currently filed
  elsewhere: `debugging-in-the-browser` (debugging), `web-performance-core-web-vitals` (performance). If we
  add HTML/CSS basics, a dedicated `frontend` category could group these. **Decide before writing the
  HTML/CSS/browser-platform guides.**
- **Category placements flagged ⚠** above are deliberate; revisit if a `frontend` category lands.
- **Framework guides** may eventually warrant their own grouping if `programming-languages` gets crowded;
  fine where they are for now.
- When each guide ships: add its row to `guidespath.md` (with `order:`), and if it completes/extends a
  learning-path step, wire it in `content-core::tracks`.

_Continuing tomorrow._
