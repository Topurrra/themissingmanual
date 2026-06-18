# Guides Path — The Missing Manual content roadmap

The master backlog of guides, organized by category and by learning track. This is the planning doc we
pick the next guide from — it is **not** an ingested guide (it lives at repo root, outside `guides/`).

Every shipped guide is a small phased series in our "battle-hardened friend" voice (see
`.claude/skills/missing-manual-writer/SKILL.md`). Source of truth is Markdown under `guides/<slug>/`;
content auto-syncs from that folder. Each `_guide.md` carries `category`, `difficulty`, and an `order:`
integer (position within its category).

**Two rules this roadmap is built around:**
1. **A→Z, every category.** Each category opens with a *"…From Zero"* rung (the absolute basics — what
   the thing *is*) and ladders **beginner → intermediate → advanced**, the way `version-control` does.
   No category may start mid-mountain (the old "databases starts at JOINs" mistake).
2. **Concept first, then the tool.** Teach the idea, then make it concrete with a tool guide that
   explains *what the tool is showing you* (not a click-by-click UI tour, which ages badly). Tool guides
   live in their concept category (Dynatrace → `performance`, Postman → `apis`, Wireshark → `networking`).

The 16 categories below match `content-core::categories::DEFS` (the canonical taxonomy) and appear in
that display order.

## Legend
- ✅ **done** — written and live
- 🔜 **next-priority** — strong candidate for the next build
- ⬜ **planned** — on the backlog
- ⭐ **feeds a learning-path track step** (lights up a "coming soon" step in the wizard — higher leverage)
- 🛠️ **tool guide** — concept-first, "what it's showing you"

---

## Categories

### operating-systems
*Windows, macOS, and Linux — what they're really doing under the hood. The broadest on-ramp; great for non-developers too.*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | **What an Operating System Actually Is** | beginner | ⬜ | The A. Kernel, processes, files, memory — the model shared by Windows/macOS/Linux. |
| 2 | The Filesystem, Explained | beginner | ⬜ | Paths, permissions, where things actually live. |
| 3 | The Terminal & Shell, Explained | beginner | ⬜ | `cd`/`ls`/pipes/PATH. Survival for the command line. (Foundational — referenced by devops/infra.) |
| 4 | Processes, Memory & the CPU | beginner→intermediate | ⬜ | What "100% CPU" / "out of memory" actually mean. |
| 5 | Linux From Zero | beginner→intermediate | ⬜ | Shell, packages, permissions, services — the OS most servers run. |
| 6 | Windows for People Who Use It Every Day | intermediate | ⬜ | Beyond clicking: services, the registry, PowerShell basics. |
| 7 | macOS Under the Hood | intermediate | ⬜ | Unix underneath, Homebrew, where macOS differs. |
| 8 | Linux for Servers | advanced | ⬜ | systemd, users, logs, cron, hardening. |

### hardware
*How the machine is built and talks to itself — from the chip to the device on your desk.*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | **How a Computer Actually Works** | beginner | ⬜ | The A. CPU, RAM, storage, the bus — the parts and how they cooperate. |
| 2 | CPU, RAM & Storage, Explained | beginner | ⬜ | What each does and why it decides "fast" vs "slow". |
| 3 | Storage Deep-Dive: HDD vs SSD vs NVMe | intermediate | ⬜ | How data is really stored and why it matters. |
| 4 | How Data Moves Inside a Machine | intermediate | ⬜ | Buses, I/O, interrupts — devices communicating. |
| 5 | How Devices Connect (USB, PCIe, GPUs, peripherals) | intermediate | ⬜ | Plugging the world into the box. |
| 6 | Inside a Server & Data-Center Hardware | advanced | ⬜ | Racks, redundancy, what "the cloud" physically is. |

### networking
*How the internet really works, and how to design networks that hold up — home to enterprise.*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | **How the Internet Actually Works** | beginner | ⬜ | The A. The journey of one request: packets, IP, DNS, servers. |
| 2 | IP Addresses, DNS & Ports, Explained | beginner | ⬜ | The address book of the internet. |
| 3 | HTTP, Explained | beginner | ⬜ | Requests, responses, status codes, headers. (APIs build on this — see `apis`.) |
| 4 | Your Home Network, Explained | beginner→intermediate | ⬜ | Router, NAT, Wi-Fi, firewall — the box that connects you. |
| 5 | The TCP/IP Model Without the Acronym Soup | intermediate | ⬜ | The layers, finally intuitive. |
| 6 | Troubleshooting Networks | intermediate | ⬜ 🛠️ | `ping`/`traceroute`/`dig` + reading **Wireshark**. |
| 7 | Designing an Enterprise Network | advanced | ⬜ | Subnets, VLANs, load balancers, redundancy. (Manifesto: "plan enterprise-grade networks".) |

### programming-languages
*Languages and features explained the way they should have been. Feeds the backend track `language` step.*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | **Programming From Zero** | beginner | ⬜ | The A (career-switchers!). Variables, types, control flow, functions. |
| 2 | What Actually Happens When Your Code Runs | beginner | ⬜ | Compile vs interpret, the stack & heap, memory. |
| 3 | Data Structures, Explained | beginner→intermediate | ⬜ | Arrays, maps, sets — when to reach for which. |
| 4 | Regular Expressions, Explained | beginner | ⬜ | Read and write regex without fear. |
| 5 | Async/Await & the Event Loop | intermediate | ⬜ | Why "blocking" matters; concurrency intuition. |
| 6 | Memory & Garbage Collection, Explained | intermediate | ⬜ | What's really happening to your objects. |
| 7 | Python / JavaScript / Go / Rust — "explained like a human" | beginner→intermediate | ⬜ ⭐ | Per-language intros that feed the `language` choice (go/rust/python/node). |
| 8 | Object-Oriented vs Functional, Honestly | intermediate | ⬜ | One fair comparison, both styles. |

### version-control ✅ COMPLETE
*The flagship ladder — a full beginner→advanced run. The model every other category should copy.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `git-from-zero` | Git From Zero | beginner | ✅ |
| 2 | `git-explained-like-a-human` | Git, Explained Like You're a Human | beginner | ✅ |
| 3 | `git-with-other-people` | Git With Other People | intermediate | ✅ |
| 4 | `git-disaster-recovery` | Git Disaster Recovery | advanced | ✅ |

### debugging
*Finding and fixing what's broken, calmly. The manifesto's home turf ("read a stack trace at 2am").*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | What an Error Message Is Actually Telling You | beginner | ⬜ | The A. How to read an error instead of fearing it. |
| 2 | **Reading a Stack Trace at 2am** | beginner | 🔜 | North-star topic. Language-agnostic; everyone needs it, nobody teaches it. |
| 3 | Reading Logs Without Drowning | beginner | ⬜ | grep/tail/levels/structured logs; finding the needle. |
| 4 | How to Reproduce a Bug | intermediate | ⬜ | The skill that makes every other fix possible. |
| 5 | Using a Debugger (Breakpoints, Stepping, Watch) | intermediate | ⬜ | Beyond print-debugging. |
| 6 | Bisecting a Bug (`git bisect` + binary-search thinking) | intermediate | ⬜ | "Which commit broke it?" |
| 7 | When Prod Is Down: Staying Calm | advanced | ⬜ | Incident-response survival: triage, comms, rollback. |

### testing
*Unit, integration, E2E, and load tests — plus TDD/BDD — that actually catch the bug. (Moved out of the old `architecture` grab-bag.)*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | Why Test At All? | beginner | ⬜ | The A. The mental model: tests as a safety net, not a chore. |
| 2 | Your First Unit Test | beginner | ⬜ | Arrange–act–assert, hands on. |
| 3 | Unit / Integration / E2E, Explained | intermediate | ⬜ ⭐ | The pyramid; what each catches. Feeds the backend `testing` step. |
| 4 | Mocking, Stubbing & Test Doubles | intermediate | ⬜ | Isolating the thing under test. |
| 5 | TDD & BDD, Honestly | intermediate | ⬜ | What they are, when they help, when they don't. |
| 6 | Testing in CI (what runs on every push) | intermediate | ⬜ | Ties into `devops` CI/CD. |
| 7 | Load & Performance Testing | advanced | ⬜ | Will it hold under real traffic? |

### databases
*Schemas, queries, and the production lessons that come with them. Feeds the backend track `database` step.*
**(Rebuilt A→Z — the old list opened on JOINs with no basics.)**

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | **What a Database Actually Is** | beginner | 🔜 | The missing A. Tables, rows, columns, keys — the mental model. |
| 2 | SELECT, WHERE & Friends: Querying Basics | beginner | ⬜ | Reading and filtering data; INSERT/UPDATE/DELETE. |
| 3 | Relationships & Keys (Primary / Foreign) | beginner | ⬜ | The thing JOINs actually depend on. |
| 4 | SQL Joins, Finally Explained | beginner→intermediate | ⬜ ⭐ | INNER/LEFT/etc. (Was listed first — it's really rung 4.) |
| 5 | Why Is My Query Slow? (Indexes & EXPLAIN) | intermediate | 🔜 ⭐ | "Fast on my laptop, dying in prod." |
| 6 | Transactions & ACID, Explained | intermediate | ⬜ | Commits, rollbacks, isolation. |
| 7 | Database Migrations Without Fear | intermediate | ⬜ | Schema changes on live data. |
| 8 | SQL vs NoSQL, Honestly | intermediate | ⬜ | One fair table, both sides. |
| 9 | Scaling a Database (Replication & Sharding) | advanced | ⬜ | When one box isn't enough. |

### data-analytics
*Data pipelines, engineering, BI, and the ML basics — turning raw data into answers you trust.*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | **What "Data Engineering" Even Is** | beginner | ⬜ | The A. The path from raw data to a usable answer. |
| 2 | Spreadsheets → SQL → Pipelines | beginner | ⬜ | The natural progression most people actually take. |
| 3 | ETL / ELT Pipelines, Explained | intermediate | ⬜ | Extract-transform-load, the backbone of data work. |
| 4 | Data Warehouses vs Lakes, Honestly | intermediate | ⬜ | Where the data lands and why. |
| 5 | Building a BI Dashboard That's Actually Useful | intermediate | ⬜ | Metrics that inform decisions, not vanity charts. |
| 6 | ML Basics for Data People | intermediate | ⬜ | Bridges into `ai-ml`. |
| 7 | Data Quality & Pipeline Observability | advanced | ⬜ | Trusting the numbers; catching silent breakage. |

### apis
*REST, GraphQL, gRPC, webhooks, and message queues — how systems actually talk. (API guides moved here from the old `architecture` category.)*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | **What an API Actually Is** | beginner | ⬜ | The A — the mental model before any protocol. |
| 2 | HTTP & JSON: the API Building Blocks | beginner | ⬜ | Builds on `networking` → HTTP. |
| 3 | REST APIs, Explained | beginner→intermediate | ⬜ ⭐ | Feeds `api-style` (rest). |
| 4 | Reading API Docs & Using Postman | beginner | ⬜ 🛠️ | Make a real request, read the response. |
| 5 | GraphQL, Explained | intermediate | ⬜ ⭐ | Feeds `api-style` (graphql). |
| 6 | gRPC, Explained | intermediate | ⬜ ⭐ | Feeds `api-style` (grpc). |
| 7 | Webhooks & Message Queues | intermediate | ⬜ | Events and async integration. |
| 8 | Versioning & Designing APIs That Last | advanced | ⬜ | Contracts, deprecation, not breaking clients. (Auth for APIs → see `security`.) |

### architecture
*Designing systems that survive real load and real teams. (Leaner now — APIs and testing have their own categories.)*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | What "Architecture" Even Means | beginner | ⬜ | The A. Boxes, arrows, and the trade-offs behind them. |
| 2 | Monolith vs Microservices, Honestly | intermediate | ⬜ | When to split, when not to. |
| 3 | Caching, Explained | intermediate | ⬜ | What to cache, invalidation, the footguns. |
| 4 | Designing for Scale (Load Balancing, Statelessness) | advanced | ⬜ | Surviving real traffic. |
| 5 | Designing for Failure (Retries, Timeouts, Circuit Breakers) | advanced | ⬜ | Systems that bend instead of break. |

### devops
*CI/CD, automation, and infrastructure as code — shipping safely and repeatedly. (Containers/cloud now live in `infrastructure`.)*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | What DevOps Actually Is | beginner | ⬜ | The A. The loop: build → test → ship → observe. |
| 2 | Environment Variables & Config (.env, YAML) | beginner | ⬜ | "What that config file really does" (manifesto). |
| 3 | Build & Release Basics | beginner→intermediate | ⬜ | Artifacts, versions, environments. |
| 4 | What a CI/CD Pipeline Actually Does | intermediate | ⬜ ⭐ | Feeds the devops `cicd` step. |
| 5 | Your First Pipeline (GitHub Actions) | intermediate | ⬜ 🛠️ | A real workflow, line by line. |
| 6 | Automating the Boring Stuff (Ops Scripting) | intermediate | ⬜ | Bash/Python for repeatable tasks. |
| 7 | Infrastructure as Code (Terraform Basics) | intermediate→advanced | ⬜ | Servers defined in version-controlled files. |

### infrastructure
*Servers, containers, and cloud platforms — where your code actually runs. (Split out of the old "DevOps & Infra".)*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | What a Server Actually Is | beginner | ⬜ | The A. From "a computer that's always on" to the cloud. |
| 2 | SSH & Keys, Explained | beginner | ⬜ | Key pairs, agents, `~/.ssh/config` (manifesto). |
| 3 | **Docker Without the Magic** | beginner→intermediate | 🔜 ⭐ | image vs container vs volume vs layer; "works on my machine". Feeds `deployment`. |
| 4 | Docker Compose for Real Projects | intermediate | ⬜ | Multi-service stacks (this project is one). |
| 5 | Deploying to a VPS (From Zero to Live) | intermediate | ⬜ ⭐ | Feeds `deployment` (vps option). |
| 6 | Load Balancers & Reverse Proxies (nginx) | intermediate | ⬜ | Routing traffic to your app. |
| 7 | Cloud Platforms, Explained (AWS / GCP / Azure) | intermediate | ⬜ | The mental model, not the 900 services. |
| 8 | Kubernetes, Explained Without the Hype | advanced | ⬜ ⭐ | Feeds `deployment` (k8s option). |

### performance
*Finding the slow thing, and the tools that show you where it hides. Home of the observability/monitoring tool guides.*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | What "Performance" Even Means | beginner | ⬜ | The A. Latency vs throughput; measure before you optimize. |
| 2 | Big-O Without the Math Panic | beginner | ⬜ | Intuition, not proofs. |
| 3 | Finding the Slow Thing (Profiling 101) | intermediate | ⬜ | Profilers, flame graphs, the real bottleneck. |
| 4 | Observability: Logs, Metrics & Traces | intermediate | ⬜ ⭐ | The concept. Feeds the devops `observability` step. |
| 5 | Reading Dynatrace (What It's Showing You) | intermediate | ⬜ 🛠️ | Manifesto-named. Traces, service flow, problems. |
| 6 | Reading Graylog (Log Search & Streams) | intermediate | ⬜ 🛠️ | Structured-log search when you're drowning. |
| 7 | Prometheus & Grafana, Explained | intermediate | ⬜ 🛠️ | Metrics + dashboards, the open-source pair. |
| 8 | Optimizing Real Systems | advanced | ⬜ | Putting profiling + observability to work. |

### security
*The threats, the defaults, and the habits that keep you out of the news.*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | What "Security" Even Means (Threat Modeling Basics) | beginner | ⬜ | The A. Think like an attacker, defend in layers. |
| 2 | How Passwords Should Be Stored (Hashing) | beginner | ⬜ | Salting, bcrypt/argon2, what NOT to do. |
| 3 | CORS, Explained (and Why It Keeps Blocking You) | beginner | ⬜ | The error everyone fights. |
| 4 | Auth vs Authz (Sessions, JWT, OAuth) | intermediate | ⬜ | The one everyone half-understands. (Used by `apis`.) |
| 5 | HTTPS / TLS, Explained | intermediate | ⬜ | Certs, the handshake, why the padlock. |
| 6 | SQL Injection & XSS, Explained | intermediate | ⬜ | The two classic web holes. |
| 7 | The OWASP Top 10, Explained | intermediate | ⬜ | The canonical "what goes wrong". |
| 8 | Secrets Management (Don't Commit Your Keys) | intermediate | ⬜ | Vaults, env, rotation. |

### ai-ml
*Models, training, and putting AI into real products — without the hype or the hand-waving.*

| order | guide | difficulty | status | notes |
|---|---|---|---|---|
| 1 | **What AI & Machine Learning Actually Are** | beginner | ⬜ | The A. AI vs ML vs LLM, demystified. |
| 2 | How a Model Learns (Training, in Plain English) | beginner | ⬜ | Data → weights → predictions, no calculus. |
| 3 | Using an LLM API in Your App | beginner→intermediate | ⬜ | Practical: prompts, tokens, cost, streaming. |
| 4 | Prompt Engineering, Honestly | beginner | ⬜ | What actually moves the needle. |
| 5 | Embeddings & Vector Search, Explained | intermediate | ⬜ | Meaning as numbers; similarity. |
| 6 | RAG (Retrieval-Augmented Generation), Explained | intermediate | ⬜ | Grounding an LLM in your own data. |
| 7 | Running Models Locally | intermediate | ⬜ | Ollama and friends; when local makes sense. |
| 8 | Fine-Tuning vs Prompting, Honestly | advanced | ⬜ | When training your own is (and isn't) worth it. |

---

## Learning-path tracks (from `content-core::tracks`)

Tracks string guides into a roadmap. The ⭐ items above are the steps currently showing "coming soon" —
filling them is the highest-leverage content because it completes a track the wizard already offers.

**Backend Developer:** version control ✅ → language ⭐ (`programming-languages`) → database ⭐ (`databases`)
→ API style ⭐ (`apis`) → deployment ⭐ (`infrastructure`) → testing ⭐ (`testing`)

**DevOps Engineer:** version control ✅ → containers & deployment ⭐ (`infrastructure`) → CI/CD ⭐ (`devops`)
→ observability ⭐ (`performance`)

### Proposed new tracks (once their categories have content)
- **Computer Foundations** (the "not only for developers" on-ramp): How a Computer Works (`hardware`) →
  What an OS Is (`operating-systems`) → How the Internet Works (`networking`) → The Terminal & Shell.
- **Observability & On-Call** (the monitoring/tool-reading path): Reading Logs (`debugging`) →
  Observability: Logs/Metrics/Traces (`performance`) → Reading Dynatrace / Graylog (`performance`) →
  When Prod Is Down (`debugging`).
- **Debugging / Troubleshooting:** stack traces → logs → reproducing → debugger → bisect → prod-down
  (the whole `debugging` ladder).

*(Adding a track = a `TrackDef` in `content-core::tracks`; choice options map to guide slugs once they exist.)*

### ⏸️ DEFERRED — sync `content-core::tracks` to the new taxonomy (don't forget)
**Paused by request (2026-06-19). Not done yet.** When we return to tracks:
1. **Fix stale step categories in `tracks.rs`** (they predate the 16-category split):
   - Backend Developer: `api` step `architecture` → **`apis`**; `test` step `architecture` → **`testing`**;
     `deploy` step `devops` → **`infrastructure`**.
   - DevOps Engineer: containers/`deploy` step `devops` → **`infrastructure`** (keep `cicd` on `devops`,
     `observability` on `performance`).
2. **Add the two proposed `TrackDef`s:** *Computer Foundations* and *Observability & On-Call* (see above).
3. Update the `tracks_list_and_detail` / track tests for any new tracks.
No rush — tracks pay off once their steps resolve to live guides; today most are "coming soon".

---

## Conventions reminder (for whoever writes the next one)
- Files: `guides/<slug>/_guide.md` (phase 0, carries `category`) + `NN-name.md` phases.
- Frontmatter on every file; `_guide.md` needs `category` + `order:` (its rung number in the table above) +
  `difficulty`. Keep the `order:` values matching this doc so the sidebar ladders A→Z.
- **Category** must be one of the 16 canonical slugs in `content-core::categories::DEFS`. Adding a category =
  one `DEFS` entry (it re-seeds on boot).
- Internal links: relative `.md` *within the same guide* (ingest rewrites them). **Cross-guide links must use
  the absolute web route** `/guides/<slug>` — the rewriter only handles same-guide prefix-less `.md` names.
- Tool guides: concept-first, explain *what the tool is showing you*, avoid click-by-click UI tours (they age).
- New content auto-syncs from `guides/` (files win on change); no rebuild needed for content, only for code.
