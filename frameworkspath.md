# Frameworks roadmap

The `frameworks` category (slug `frameworks`, in `content-core::categories` DEFS, after `programming-languages`).
Guides live in `guides/frameworks/<slug>/`. **Rule:** only frameworks whose language already exists in
`programming-languages` (python, javascript, typescript, go, rust, java, c#). A framework for an unsupported
language ⇒ add the language first.

Each language is laddered in **three tiers**:
- **① Popular** - the default, most jobs.
- **② Battle-tested** - less hype, still very employable.
- **③ Roots** - what the popular ones are built on; learning these kills the "magic." More *understanding*
  than *job* (a perfect fit for the platform's "show you what's under the hood" identity).

## Build order (decided 2026-06-22)
1. **`what-a-framework-even-is`** - the category anchor (order 1). ✅ approved, building first.
2. **Per-language, non-JS/TS first** (finish a language before moving on): Python · Go · Rust · Java · C#.
3. **JavaScript / TypeScript LAST** - it's the biggest bucket (frontend + backend), so we tackle it once the
   rest are done.
4. Within reach, start with **① Popular** picks; Tier 2/3 follow.

> Framework guides are shorter than the language from-zero guides (~8–12 phases vs 18). Same conventions:
> badged phases, inline ```quiz, LF, `_guide.md` with `order:` + `category: frameworks`. Code runs only for
> python/javascript/sql; everything else stays plain.

---

## ⓪ Anchor
- [x] `what-a-framework-even-is` - order 1 - framework vs library (inversion of control), why they exist, the
  price of magic, the anatomy every framework shares (routing/middleware/ORM/templating/config/lifecycle),
  and how to choose + learn one fast. 5 phases + inline quizzes. ✅ 2026-06-22

## Python
- **① Popular:** [x] `fastapi-from-zero` ✅ 2026-06-22 (10 phases, order 8: ASGI/auto-docs, path ops & params, Pydantic validation [runnable!], response models, Depends() DI, async & concurrency, SQLModel, OAuth2/JWT auth, testing/structure, production; `Book` domain; types-as-contract) · [x] `django-from-zero` ✅ 2026-06-22 (11 phases, order 9: MTV/project-vs-app, URLs/views, models/ORM/migrations, the admin, templates, forms/CSRF, ORM-deeper/N+1, auth/sessions, CBVs+DRF, testing/structure, production; blog Post/Comment domain; batteries-included) · *(data/ML)* [x] `pytorch-from-zero` ✅ 2026-06-22 (11 phases, order 11: tensors, ops/GPU, autograd, nn.Module, loss/optimizers, training loop, Dataset/DataLoader, MNIST classifier, save/load/inference, perf/pitfalls, where-next; "tensors+autograd+the loop"; NOT runnable) · [x] `pandas-from-zero` ✅ 2026-06-22 (10 phases, order 10: DataFrame/Series, load/inspect, select/filter, clean, transform/vectorize, groupby, merge/concat, time series, reshape/pivot, plotting; sales dataset; NOT runnable - pandas isn't in the Pyodide sandbox, see note below)
- **② Battle-tested:** [x] `flask-from-zero` ✅ 2026-06-23 (10 phases, order 12: micro-framework, routing, Jinja2, forms/CSRF, Flask-SQLAlchemy, blueprints/app-factory, sessions/Flask-Login, JSON API, testing/gunicorn, where-next; Notes app) · [x] `celery-from-zero` ✅ 2026-06-23 (8 phases, order 15: broker/worker/result model, @task & .delay()/.apply_async(), result backend & AsyncResult, retries+idempotency+acks_late, Celery Beat scheduling, production scaling/queues/Flower/pitfalls, where-next vs RQ/Dramatiq/arq + framework integration; email/report/payment web-app domain; NOT runnable) · [x] `sqlalchemy-from-zero` ✅ 2026-06-23 (9 phases, order 13: Core vs ORM, engine, declarative models, Session/unit-of-work, select() API, relationships, loading/N+1, Alembic, real-world; Author/Book/Tag; SQLAlchemy 2.0; the ORM under Flask-SQLAlchemy/SQLModel)
- **③ Roots:** [x] `wsgi-and-asgi-explained` ✅ 2026-06-23 (6 phases, order 14: WSGI contract, bare WSGI app, server/middleware, why ASGI, bare ASGI app, protocol→framework; the callable under Flask/Django/FastAPI) · [ ] `pydantic-from-zero` (the validation engine under FastAPI) · [ ] `starlette-and-werkzeug` (the toolkits under FastAPI/Flask)

## Go ✅ COMPLETE (2026-06-23) - group: "Go", orders 16-20
- **① Popular:** [x] `gin-from-zero` ✅ (9 phases, order 16: engine/context, routing+groups, bind+validate [validator v10 `binding` tags], responses, middleware [c.Next], CRUD, errors+structure, testing[httptest]+prod[graceful shutdown], where-next; tasks API)
- **② Battle-tested:** [x] `chi-from-zero` ✅ (7 phases, order 18: net/http-compatible router, routing/URLParam/subrouters, stdlib middleware `func(http.Handler)http.Handler`, stdlib JSON I/O, CRUD, structure+httptest, where-next [+Go 1.22 ServeMux]; articles API) · [x] `echo-from-zero` ✅ (8 phases, order 17: instance/context/error-returning handlers, routing, bind+CustomValidator, responses, middleware, CRUD+central HTTPErrorHandler, testing+prod, where-next; books API) · [x] `gorm-from-zero` ✅ (9 phases, order 19: ORM/connect+SQL logger, models+AutoMigrate, create/read, querying, update/delete[zero-value trap, soft delete], associations, preload+N+1, transactions/hooks/migrations, where-next [sqlc/sqlx]; blog User/Post/Comment/Tag; SQLite)
- **③ Roots:** [x] `web-services-with-only-net-http` ✅ (7 phases, order 20: Handler/ServeMux/Server model, Go 1.22 routing+PathValue, stdlib JSON I/O, middleware-is-a-wrapper, CRUD no-framework, structure/context/graceful-shutdown, what-frameworks-add; messages service; the foundation Gin/Echo/chi wrap)
> **GO SET COMPLETE:** all 5 Go guides done. Go code is NOT runnable (plain ```go). Frameworks category now 21 guides (anchor + 6 Java + 8 Python + 5 Go + 1 JS[extjs, order 21]).

## Rust ✅ COMPLETE (2026-06-23) - group: "Rust", orders 22-26
*(Honest note: Rust web jobs are thinner than the language itself - systems/embedded/blockchain dominate.)*
- **① Popular:** [x] `axum-from-zero` ✅ (9 phases, order 22: Router/async handlers, routing+extractors [Path/Query], handlers+IntoResponse [Json], State [Arc<Mutex>], tower middleware [.layer/from_fn], CRUD, error handling [custom IntoResponse + ?], testing [oneshot]+prod [graceful shutdown], where-next; books API; what this platform runs on)
- **② Battle-tested:** [x] `actix-web-from-zero` ✅ (8 phases, order 23: App/HttpServer, routing+extractors, Responder, web::Data state [per-worker closure trap], middleware [wrap/from_fn], CRUD+ResponseError, testing+prod, where-next; articles API) · [x] `rocket-from-zero` ✅ (8 phases, order 24: #[get]/routes!/#[launch], dynamic paths, request guards+Json data, responders [Option→404], managed state+fairings, CRUD+catchers, testing+Rocket.toml, where-next; books API; macro-driven)
- **③ Roots:** [x] `tokio-the-async-runtime` ✅ (7 phases, order 25: inert futures+runtime, Future/poll/await, spawn/JoinHandle, work-stealing scheduler+spawn_blocking, channels [mpsc/oneshot/broadcast]+sync [Mutex], select!+timeouts, where-next; the engine under every async Rust framework) · [x] `hyper-and-tower` ✅ (7 phases, order 26: hyper [low-level HTTP] + tower [Service abstraction], the Service trait [poll_ready+call], Layers+ServiceBuilder, tower-http toolbox, how axum is a Service over hyper, where-next [tonic/clients]; the bottom of the Rust web stack)
> **RUST SET COMPLETE:** all 5 Rust guides done. Rust code is NOT runnable (plain ```rust). Frameworks category now 26 guides (anchor + 6 Java + 8 Python + 5 Go + 1 JS[extjs ord 21] + 5 Rust).

## Java
- **① Popular:** [x] `spring-boot-from-zero` ✅ 2026-06-22 - 11 phases (order 2): auto-config, DI/beans, REST controllers, config/profiles, Spring Data JPA, service layer/DTOs/validation, error handling, testing, Spring Security, production/Actuator/deploy, where-next. Running `Book` API throughout.
- **② Battle-tested:** [x] `quarkus-from-zero` ✅ 2026-06-22 (10 phases, order 5: build-time-vs-runtime, dev mode/DX, REST, ArC CDI, Panache, config, reactive/Mutiny, testing, native/GraalVM, production; `Product` domain; cloud-native, builds on the Jakarta specs) · [x] `hibernate-and-jpa-from-zero` ✅ 2026-06-22 (10 phases, order 3: ORM concept, entities/mapping, EntityManager & persistence context, transactions & dirty checking, relationships, lazy/eager & N+1, JPQL/Criteria/native, inheritance/embeddables, caching/perf, real-world+migrations; Author/Book/Review domain; demystifies Spring Data JPA) · [x] `jakarta-ee-from-zero` ✅ 2026-06-22 (10 phases, order 4: specs-vs-servers, app server/deployment, CDI, JAX-RS, Jakarta Persistence, JTA, validation/JSON-B, EJB/messaging, Jakarta Security, MicroProfile; `Product` domain; the enterprise standard)
- **③ Roots:** [x] `spring-framework-from-zero` ✅ 2026-06-22 (8 phases, order 6: core Spring without Boot - IoC container, @Configuration/@Bean, DI deep, scopes/lifecycle, AOP & proxies, MVC without Boot, "Boot = core Spring + auto-config + starters + embedded server"; NotificationService domain) · [x] `the-servlet-api` ✅ 2026-06-22 (7 phases, order 7: servlets, container/lifecycle & thread-per-request, HttpServlet, front-controller pattern, filters/chain = middleware, sessions; the foundation under Spring MVC & JAX-RS)

> **JAVA FRAMEWORK SET COMPLETE (2026-06-22):** all 6 Java framework guides done - Spring Boot ①, Hibernate ②, Quarkus ②, Jakarta EE ②, Spring Framework core ③, Servlet API ③. Frameworks category now has 7 guides (anchor + 6 Java).

## C# - core web tier COMPLETE (2026-06-23) - group: "C#", orders 27-30
- **① Popular:** [x] `aspnet-core-from-zero` ✅ (9 phases, order 27: minimal APIs, routing, model binding+validation [+the minimal-API auto-validate gotcha], DI [lifetimes/captive dep], middleware pipeline, CRUD, JWT auth, WebApplicationFactory tests+prod, where-next; products API; pillars = pipeline + DI) · [x] `unity-from-zero` ✅ (9 phases, order 31: the editor, GameObjects/Components [composition], MonoBehaviour+game loop [Time.deltaTime], transforms/input/movement, physics/colliders/triggers, prefabs+Instantiate, UI/audio/build, where-next [Godot/Unreal]; collect-the-pickups game)
- **② Battle-tested:** [x] `blazor-from-zero` ✅ (8 phases, order 29: components/Razor, Server vs WASM + .NET 8 render modes, @bind data binding, events+lifecycle [StateHasChanged], EditForm+validation, parameters/EventCallback/cascading/state-service, calling APIs+DI, where-next; products UI) · [x] `efcore-from-zero` ✅ (9 phases, order 28: DbContext/DbSet, models+migrations [dotnet ef], create/read, LINQ querying [deferred exec/AsNoTracking], change tracking [detached-entity trap], relationships, Include+N+1, transactions/concurrency/migrations-prod, where-next [Dapper]; blog schema; SQLite) · [x] `dotnet-maui-from-zero` ✅ (8 phases, order 32: XAML+layouts [Grid], controls+data binding [CollectionView], MVVM [CommunityToolkit.Mvvm], Shell navigation, data+APIs+local storage [SQLite/Preferences], platform features+deployment, where-next [Flutter/RN/Blazor Hybrid]; notes app)
- **③ Roots:** [x] `the-aspnet-pipeline-and-kestrel` ✅ (7 phases, order 30: Kestrel/pipeline/host model, Kestrel server, middleware pipeline [Use/Run/Map], the RequestDelegate [what middleware really is], host+DI+config, how minimal APIs/MVC sit on endpoint routing, where-next; the .NET parallel to net/http & hyper-tower) · [x] `how-an-orm-works` ✅ - built as a SHARED/language-agnostic guide in the **databases** category (NOT frameworks), order 10 (7 phases: the impedance mismatch + four jobs [mapping/identity+tracking/loading/translating], mapping objects↔tables, identity map+unit of work, change tracking+dirty checking, lazy loading+N+1, query builder→SQL, when-not-to-use; pseudocode, cross-links Hibernate/SQLAlchemy/GORM/EF Core)
> **C# COMPLETE (2026-06-23):** all 6 C# framework guides done (ASP.NET Core, EF Core, Blazor, Unity, MAUI, pipeline/Kestrel roots) + `how-an-orm-works` shipped in databases. C# code NOT runnable (plain ```csharp/```razor/```xml). Frameworks category now 32 guides; databases now 10. **ONLY REMAINING frameworks tier: JS/TS** (React/Next/Express/Vue/Angular/NestJS/Svelte/Fastify + roots; extjs already done).

## JavaScript / TypeScript  - IN PROGRESS (biggest bucket; frontend + backend, TS-first). group: "JavaScript"
**Server-side wave COMPLETE (2026-06-23), orders 33-36:**
- **① Popular:** [ ] `react-from-zero` · [ ] `nextjs-from-zero` · [x] `express-from-zero` ✅ (9 ph, order 33 - app/routing, the `(req,res,next)` middleware chain, req/res+validation, CRUD, error handling [async/Express 5], structure, supertest+prod; tasks API) · [ ] `vue-from-zero`
- **② Battle-tested:** [ ] `angular-from-zero` · [x] `nestjs-from-zero` ✅ (9 ph, order 35 - controllers, providers+DI, modules, DTOs/validation/pipes, CRUD, guards/interceptors/middleware, testing+prod; TS-first, tasks API, on Express) · [ ] `svelte-and-sveltekit-from-zero` · [x] `fastify-from-zero` ✅ (8 ph, order 34 - schema-first routing [JSON Schema validation+serialization], encapsulated plugins, hooks/lifecycle, CRUD, error handling, inject testing+prod; books API) · [x] `extjs-from-zero` ✅ 2026-06-23 (8 phases, order 16: the config-driven enterprise framework you get thrown into with no docs - class system/Ext.define/xtype, components & containment tree, layouts, the data package [Model/Store/proxy/reader], the Grid + forms, MVVM ViewController/ViewModel/binding, Sencha Cmd/theming/surviving a legacy codebase; "you describe a tree of components, the framework builds it"; NOT runnable. Built out-of-order by explicit user request - the platform's exact target: knowledge nobody documented.)
- **③ Roots:** [x] `build-a-server-with-node-http` ✅ (7 ph, order 36 - node:http model [createServer + (req,res)], requests/responses [stream body, JSON by hand], routing by hand, middleware-is-a-function, REST API no framework, async/streams/graceful-shutdown, what-Express-adds; messages service; the JS parallel to Go's net/http roots) · [ ] `how-react-renders` (the render loop & reconciliation) · [ ] `vite-and-the-dev-server` (the build tool under modern frameworks)
> **SERVER-SIDE JS COMPLETE (2026-06-23):** Express ①, Fastify ②, NestJS ②, node:http root ③ - the backend JS cluster (mirrors Go/Rust roots+frameworks). JS/TS code NOT runnable in these (need Node) → plain ```javascript/```typescript. Frameworks category now 36 guides. **REMAINING JS/TS: frontend wave** - `react-from-zero`, `nextjs-from-zero`, `vue-from-zero` (① popular); `angular-from-zero`, `svelte-and-sveltekit-from-zero` (② battle-tested); `how-react-renders`, `vite-and-the-dev-server` (③ roots). extjs already done (legacy ②). After frontend, do a final JS-group order renumber so it reads popular→battle-tested→roots (currently extjs=21 sorts first in the JS group; new ones 33-36).

---

## Notes / open
- ⚠️ **pandas/numpy are NOT runnable in the playground (verified 2026-06-22).** The Pyodide adapter
  (`platform/web/src/lib/runnable/adapters.js`) calls `runPythonAsync(code)` directly and never
  `loadPackagesFromImports` / `loadPackage('pandas')`, so `import pandas` crashes with ModuleNotFoundError.
  So `pandas-from-zero` (and any numpy/pandas content) uses plain ` ```python ` + ` ```console `, NOT
  ` ```python runnable `. **Frontend enhancement (spawned as a task):** have the adapter call
  `await pyodide.loadPackagesFromImports(code)` before running, so data guides could switch to live blocks.
- Tier-3 "roots" use `*-explained` / `*-from-scratch` naming where they're conceptual, `*-from-zero` where
  they're a real thing you set up.
- `how-an-orm-works` (C# Tier 3) might be better as a **shared, language-agnostic** guide - decide when we reach it.
- When each ships: tick it here, and if it completes/extends a learning-path step, wire `content-core::tracks`.
- Pairs with the homework plan ([[exercises-grader-pending]]): framework capstones are the natural Tier-2 omnis-x targets.
