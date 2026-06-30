---
title: "Zero-Downtime Deploys"
guide: "zero-downtime-deploys"
phase: 0
summary: "Ship a new version without a maintenance window: rolling, blue-green, and canary deploys, plus the health checks and migrations that make them safe."
tags: [deployment, zero-downtime, rolling-deploy, blue-green, canary, migrations, load-balancer, devops]
category: devops
order: 8
difficulty: intermediate
synonyms: ["how to deploy without downtime", "what is a rolling deploy", "blue green vs canary deployment", "zero downtime database migration", "deploy without maintenance window", "expand and contract migration", "health check before deploy"]
updated: 2026-06-30
---

# Zero-Downtime Deploys

You've felt the dread: it's release night, you put up a "back in 30 minutes" page, and you cross your fingers while the new version goes live. Maybe it works. Maybe it doesn't, and now you're rolling back at 11pm with users watching the maintenance page. There's a better way, and it's not magic — it's a handful of patterns that let you swap a running system out from under live traffic without anyone noticing.

By the end of this guide, deploys stop being a held-breath event. You'll understand *why* the naive approach drops requests, the three strategies that fix it, and the one part everyone gets wrong — the database — so your next release is something you do on a Tuesday afternoon instead of a Saturday night.

## How to read this

- **Want it to finally click?** Read in order. Phase 1 shows why the obvious deploy breaks; Phase 2 covers the three strategies that fix it; Phase 3 tackles the hard part — migrations and health checks — that make all three actually safe.
- **Already deploying and only need the migration trick?** Jump to [Phase 3: The Hard Part — Migrations and Health](03-migrations-and-health.md). That's where most real outages hide.

## The phases

1. **[Why Naive Deploys Hurt](01-why-naive-deploys-hurt.md)** — the mental model: a deploy means *two versions of your code wanting to exist at the same moment*. Stop-and-replace drops that moment on the floor, and your users feel it.
2. **[The Three Strategies](02-the-three-strategies.md)** — rolling, blue-green, and canary. How each one moves traffic off the old version and onto the new without a gap, and when to reach for which.
3. **[The Hard Part — Migrations and Health](03-migrations-and-health.md)** — why the database is what actually bites you, the expand-then-contract pattern, and the health checks and connection draining that let a load balancer do its job.

[Phase 1: Why Naive Deploys Hurt](01-why-naive-deploys-hurt.md) →
