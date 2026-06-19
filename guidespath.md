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

The 17 categories below match `content-core::categories::DEFS` (the canonical taxonomy) and appear in
that display order.

## Legend
- ✅ **done** — written and live
- 🔜 **next-priority** — strong candidate for the next build
- ⬜ **planned** — on the backlog
- ⭐ **feeds a learning-path track step** (lights up a "coming soon" step in the wizard — higher leverage)
- 🛠️ **tool guide** — concept-first, "what it's showing you"

---

## Categories

### operating-systems ✅ COMPLETE
*Windows, macOS, and Linux — what they're really doing under the hood. The broadest on-ramp; great for non-developers too.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `what-an-operating-system-is` | What an Operating System Actually Is | beginner | ✅ |
| 2 | `the-filesystem-explained` | The Filesystem, Explained | beginner | ✅ |
| 3 | `the-terminal-and-shell` | The Terminal & Shell, Explained | beginner | ✅ |
| 4 | `processes-memory-and-cpu` | Processes, Memory & the CPU | intermediate | ✅ |
| 5 | `linux-from-zero` | Linux From Zero | beginner | ✅ |
| 6 | `windows-for-power-users` | Windows for People Who Use It Every Day | intermediate | ✅ |
| 7 | `macos-under-the-hood` | macOS Under the Hood | intermediate | ✅ |
| 8 | `linux-for-servers` | Linux for Servers | advanced | ✅ |

### hardware ✅ COMPLETE
*How the machine is built and talks to itself — from the chip to the device on your desk.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `how-a-computer-works` | How a Computer Actually Works | beginner | ✅ |
| 2 | `cpu-ram-and-storage` | CPU, RAM & Storage, Explained | beginner | ✅ |
| 3 | `storage-hdd-ssd-nvme` | Storage Deep-Dive: HDD vs SSD vs NVMe | intermediate | ✅ |
| 4 | `how-data-moves-inside-a-machine` | How Data Moves Inside a Machine | intermediate | ✅ |
| 5 | `how-devices-connect` | How Devices Connect (USB, PCIe, GPUs, peripherals) | intermediate | ✅ |
| 6 | `inside-a-server-and-data-center` | Inside a Server & Data-Center Hardware | advanced | ✅ |

### networking ✅ COMPLETE
*How the internet really works, and how to design networks that hold up — home to enterprise.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `how-the-internet-works` | How the Internet Actually Works | beginner | ✅ |
| 2 | `ip-dns-and-ports` | IP Addresses, DNS & Ports, Explained | beginner | ✅ |
| 3 | `http-explained` | HTTP, Explained | beginner | ✅ |
| 4 | `your-home-network` | Your Home Network, Explained | beginner | ✅ |
| 5 | `tcp-ip-model` | The TCP/IP Model Without the Acronym Soup | intermediate | ✅ |
| 6 | `troubleshooting-networks` | Troubleshooting Networks 🛠️ | intermediate | ✅ |
| 7 | `designing-an-enterprise-network` | Designing an Enterprise Network | advanced | ✅ |

### programming-concepts ✅ COMPLETE
*The ideas under every language — how code runs, data structures, async, memory, big-O, and choosing a
language. Language-agnostic; split out of `programming-languages` so the languages category holds only
actual languages.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `programming-from-zero` | Programming From Zero | beginner | ✅ |
| 2 | `what-happens-when-code-runs` | What Actually Happens When Your Code Runs | beginner | ✅ |
| 3 | `data-structures-explained` | Data Structures, Explained | beginner | ✅ |
| 4 | `regular-expressions-explained` | Regular Expressions, Explained | beginner | ✅ |
| 5 | `async-await-and-the-event-loop` | Async/Await & the Event Loop | intermediate | ✅ |
| 6 | `memory-and-garbage-collection` | Memory & Garbage Collection, Explained | intermediate | ✅ |
| 7 | `languages-explained-like-a-human` | Python, JavaScript, Go & Rust — Explained Like a Human ⭐ | beginner | ✅ |
| 8 | `oop-vs-functional` | Object-Oriented vs Functional, Honestly | intermediate | ✅ |

### programming-languages ✅ COMPLETE
*One A→Z course per language (zero → advanced). Feeds the backend track `language` step.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `python-from-zero` | Python From Zero (A→Z, 10 phases; big idea = OOP) | beginner→advanced | ✅ |
| 2 | `javascript-from-zero` | JavaScript From Zero (A→Z, 10 phases; big idea = async & the DOM) | beginner→advanced | ✅ |
| 3 | `go-from-zero` | Go From Zero (A→Z, 10 phases; big idea = goroutines & channels) | beginner→advanced | ✅ |
| 4 | `rust-from-zero` | Rust From Zero (A→Z, 10 phases; big idea = ownership & borrowing) | beginner→advanced | ✅ |

### version-control ✅ COMPLETE
*The flagship ladder — a full beginner→advanced run. The model every other category should copy.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `git-from-zero` | Git From Zero | beginner | ✅ |
| 2 | `git-explained-like-a-human` | Git, Explained Like You're a Human | beginner | ✅ |
| 3 | `git-with-other-people` | Git With Other People | intermediate | ✅ |
| 4 | `git-disaster-recovery` | Git Disaster Recovery | advanced | ✅ |

### debugging ✅ COMPLETE
*Finding and fixing what's broken, calmly. The manifesto's home turf ("read a stack trace at 2am").*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `what-an-error-message-tells-you` | What an Error Message Is Actually Telling You | beginner | ✅ |
| 2 | `reading-a-stack-trace` | Reading a Stack Trace at 2am | beginner | ✅ |
| 3 | `reading-logs-without-drowning` | Reading Logs Without Drowning | beginner | ✅ |
| 4 | `how-to-reproduce-a-bug` | How to Reproduce a Bug | intermediate | ✅ |
| 5 | `using-a-debugger` | Using a Debugger (Breakpoints, Stepping, Watch) | intermediate | ✅ |
| 6 | `bisecting-a-bug` | Bisecting a Bug (git bisect + binary-search thinking) | intermediate | ✅ |
| 7 | `when-prod-is-down` | When Prod Is Down: Staying Calm | advanced | ✅ |

### testing ✅ COMPLETE
*Unit, integration, E2E, and load tests — plus TDD/BDD — that actually catch the bug.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `why-test-at-all` | Why Test At All? | beginner | ✅ |
| 2 | `your-first-unit-test` | Your First Unit Test | beginner | ✅ |
| 3 | `unit-integration-e2e` | Unit, Integration & E2E Tests, Explained ⭐ | intermediate | ✅ |
| 4 | `mocking-and-test-doubles` | Mocking, Stubbing & Test Doubles | intermediate | ✅ |
| 5 | `tdd-and-bdd-honestly` | TDD & BDD, Honestly | intermediate | ✅ |
| 6 | `testing-in-ci` | Testing in CI (What Runs on Every Push) | intermediate | ✅ |
| 7 | `load-and-performance-testing` | Load & Performance Testing | advanced | ✅ |

### databases ✅ COMPLETE
*Schemas, queries, and the production lessons that come with them. Feeds the backend track `database` step.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `what-a-database-is` | What a Database Actually Is | beginner | ✅ |
| 2 | `querying-basics-select-where` | SELECT, WHERE & Friends: Querying Basics | beginner | ✅ |
| 3 | `relationships-and-keys` | Relationships & Keys (Primary & Foreign) | beginner | ✅ |
| 4 | `sql-joins-explained` | SQL Joins, Finally Explained ⭐ | beginner | ✅ |
| 5 | `why-is-my-query-slow` | Why Is My Query Slow? (Indexes & EXPLAIN) ⭐ | intermediate | ✅ |
| 6 | `transactions-and-acid` | Transactions & ACID, Explained | intermediate | ✅ |
| 7 | `database-migrations` | Database Migrations Without Fear | intermediate | ✅ |
| 8 | `sql-vs-nosql` | SQL vs NoSQL, Honestly | intermediate | ✅ |
| 9 | `scaling-a-database` | Scaling a Database (Replication & Sharding) | advanced | ✅ |

### data-analytics ✅ COMPLETE
*Data pipelines, engineering, BI, and the ML basics — turning raw data into answers you trust.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `what-is-data-engineering` | What "Data Engineering" Even Is | beginner | ✅ |
| 2 | `spreadsheets-to-sql-to-pipelines` | Spreadsheets → SQL → Pipelines | beginner | ✅ |
| 3 | `etl-elt-pipelines` | ETL & ELT Pipelines, Explained | intermediate | ✅ |
| 4 | `warehouses-vs-lakes` | Data Warehouses vs Lakes, Honestly | intermediate | ✅ |
| 5 | `bi-dashboards-that-work` | Building a BI Dashboard That's Actually Useful | intermediate | ✅ |
| 6 | `ml-basics-for-data-people` | ML Basics for Data People | intermediate | ✅ |
| 7 | `data-quality-and-observability` | Data Quality & Pipeline Observability | advanced | ✅ |

### apis ✅ COMPLETE
*REST, GraphQL, gRPC, webhooks, and message queues — how systems actually talk.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `what-an-api-is` | What an API Actually Is | beginner | ✅ |
| 2 | `http-and-json-api-basics` | HTTP & JSON: the API Building Blocks | beginner | ✅ |
| 3 | `rest-apis-explained` | REST APIs, Explained ⭐ | intermediate | ✅ |
| 4 | `reading-api-docs-postman` | Reading API Docs & Using Postman 🛠️ | beginner | ✅ |
| 5 | `graphql-explained` | GraphQL, Explained ⭐ | intermediate | ✅ |
| 6 | `grpc-explained` | gRPC, Explained ⭐ | intermediate | ✅ |
| 7 | `webhooks-and-message-queues` | Webhooks & Message Queues | intermediate | ✅ |
| 8 | `designing-apis-that-last` | Versioning & Designing APIs That Last | advanced | ✅ |

### architecture ✅ COMPLETE
*Designing systems that survive real load and real teams.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `what-architecture-means` | What "Architecture" Even Means | beginner | ✅ |
| 2 | `monolith-vs-microservices` | Monolith vs Microservices, Honestly | intermediate | ✅ |
| 3 | `caching-explained` | Caching, Explained | intermediate | ✅ |
| 4 | `designing-for-scale` | Designing for Scale (Load Balancing, Statelessness) | advanced | ✅ |
| 5 | `designing-for-failure` | Designing for Failure (Retries, Timeouts, Circuit Breakers) | advanced | ✅ |

### devops ✅ COMPLETE
*CI/CD, automation, and infrastructure as code — shipping safely and repeatedly.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `what-devops-is` | What DevOps Actually Is | beginner | ✅ |
| 2 | `env-vars-and-config` | Environment Variables & Config (.env, YAML) | beginner | ✅ |
| 3 | `build-and-release-basics` | Build & Release Basics | beginner | ✅ |
| 4 | `what-cicd-does` | What a CI/CD Pipeline Actually Does ⭐ | intermediate | ✅ |
| 5 | `your-first-pipeline-github-actions` | Your First Pipeline (GitHub Actions) 🛠️ | intermediate | ✅ |
| 6 | `automating-the-boring-stuff` | Automating the Boring Stuff (Ops Scripting) | intermediate | ✅ |
| 7 | `infrastructure-as-code-terraform` | Infrastructure as Code (Terraform Basics) | advanced | ✅ |

### infrastructure ✅ COMPLETE
*Servers, containers, and cloud platforms — where your code actually runs.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `what-a-server-is` | What a Server Actually Is | beginner | ✅ |
| 2 | `ssh-and-keys` | SSH & Keys, Explained | beginner | ✅ |
| 3 | `docker-without-the-magic` | Docker Without the Magic ⭐ | intermediate | ✅ |
| 4 | `docker-compose-for-real-projects` | Docker Compose for Real Projects | intermediate | ✅ |
| 5 | `deploying-to-a-vps` | Deploying to a VPS (From Zero to Live) ⭐ | intermediate | ✅ |
| 6 | `load-balancers-and-nginx` | Load Balancers & Reverse Proxies (nginx) | intermediate | ✅ |
| 7 | `cloud-platforms-explained` | Cloud Platforms, Explained (AWS / GCP / Azure) | intermediate | ✅ |
| 8 | `kubernetes-without-the-hype` | Kubernetes, Explained Without the Hype ⭐ | advanced | ✅ |

### performance ✅ COMPLETE
*Finding the slow thing, and the tools that show you where it hides. Home of the observability/monitoring tool guides.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `what-performance-means` | What "Performance" Even Means | beginner | ✅ |
| 2 | `big-o-without-the-math-panic` | Big-O Without the Math Panic | beginner | ✅ |
| 3 | `profiling-101` | Finding the Slow Thing (Profiling 101) | intermediate | ✅ |
| 4 | `observability-logs-metrics-traces` | Observability: Logs, Metrics & Traces ⭐ | intermediate | ✅ |
| 5 | `reading-dynatrace` | Reading Dynatrace (What It's Showing You) 🛠️ | intermediate | ✅ |
| 6 | `reading-graylog` | Reading Graylog (Log Search & Streams) 🛠️ | intermediate | ✅ |
| 7 | `prometheus-and-grafana` | Prometheus & Grafana, Explained 🛠️ | intermediate | ✅ |
| 8 | `optimizing-real-systems` | Optimizing Real Systems | advanced | ✅ |

### security ✅ COMPLETE
*The threats, the defaults, and the habits that keep you out of the news.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `what-security-means` | What "Security" Even Means (Threat Modeling Basics) | beginner | ✅ |
| 2 | `how-passwords-are-stored` | How Passwords Should Be Stored (Hashing) | beginner | ✅ |
| 3 | `cors-explained` | CORS, Explained (and Why It Keeps Blocking You) | beginner | ✅ |
| 4 | `auth-vs-authz` | Auth vs Authz (Sessions, JWT, OAuth) | intermediate | ✅ |
| 5 | `https-and-tls` | HTTPS / TLS, Explained | intermediate | ✅ |
| 6 | `sql-injection-and-xss` | SQL Injection & XSS, Explained | intermediate | ✅ |
| 7 | `owasp-top-10` | The OWASP Top 10, Explained | intermediate | ✅ |
| 8 | `secrets-management` | Secrets Management (Don't Commit Your Keys) | intermediate | ✅ |

### ai-ml ✅ COMPLETE
*Models, training, and putting AI into real products — without the hype or the hand-waving.*

| order | slug | guide | difficulty | status |
|---|---|---|---|---|
| 1 | `what-ai-and-ml-are` | What AI & Machine Learning Actually Are | beginner | ✅ |
| 2 | `how-a-model-learns` | How a Model Learns (Training, in Plain English) | beginner | ✅ |
| 3 | `using-an-llm-api` | Using an LLM API in Your App | beginner | ✅ |
| 4 | `prompt-engineering-honestly` | Prompt Engineering, Honestly | beginner | ✅ |
| 5 | `embeddings-and-vector-search` | Embeddings & Vector Search, Explained | intermediate | ✅ |
| 6 | `rag-explained` | RAG (Retrieval-Augmented Generation), Explained | intermediate | ✅ |
| 7 | `running-models-locally` | Running Models Locally | intermediate | ✅ |
| 8 | `fine-tuning-vs-prompting` | Fine-Tuning vs Prompting, Honestly | advanced | ✅ |

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
- **Category** must be one of the 17 canonical slugs in `content-core::categories::DEFS`. Adding a category =
  one `DEFS` entry (it re-seeds on boot).
- Internal links: relative `.md` *within the same guide* (ingest rewrites them). **Cross-guide links must use
  the absolute web route** `/guides/<slug>` — the rewriter only handles same-guide prefix-less `.md` names.
- Tool guides: concept-first, explain *what the tool is showing you*, avoid click-by-click UI tours (they age).
- New content auto-syncs from `guides/` (files win on change); no rebuild needed for content, only for code.
