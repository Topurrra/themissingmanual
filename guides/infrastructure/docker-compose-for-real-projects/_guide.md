---
title: "Docker Compose for Real Projects"
guide: "docker-compose-for-real-projects"
phase: 0
summary: "Real apps are several containers at once — web, API, database, cache. Compose declares the whole stack in one file and brings it up with a single command."
tags: [docker, docker-compose, containers, infrastructure, dev-environment]
category: infrastructure
order: 4
difficulty: intermediate
synonyms: ["how does docker compose work", "run multiple containers together", "what is docker-compose.yml", "docker compose vs docker run", "spin up database and app with docker", "multi-container docker setup"]
updated: 2026-06-19
---

# Docker Compose for Real Projects

You know how to run a single container. You've typed `docker run` enough times that it doesn't scare you anymore. But the moment you try to run a *real* app — the kind with an API, a database, and maybe a cache — you discover that "real" means several containers, all running at once, all needing to find each other. Suddenly you've got four terminal tabs open, you're copying long `docker run` flags between them, and one wrong `--network` argument means the API can't see the database.

That's the wall this guide gets you over. Docker Compose lets you describe your *entire stack* — every service, its image, its ports, its environment, how they connect — in one file, and bring the whole thing up (or down) with one command. This is how teams actually run things. (This very project runs on Compose.)

## How to read this
- **Already know single-container Docker and want the file format fast?** Skip to [Phase 2: The compose file](02-the-compose-file.md) — it's the annotated `docker-compose.yml` you came for.
- **Want it to finally make sense?** Read in order. Phase 1 installs the mental model, Phase 2 builds a real stack, and Phase 3 covers the networking, data, and dev-vs-prod realities that bite people later.

## The phases
1. **[Why One Container Isn't Enough](01-why-one-container-isnt-enough.md)** — what a "stack" really is, why managing it by hand hurts, and the one idea Compose is built on.
2. **[The compose file](02-the-compose-file.md)** — services, images vs build, ports, environment, `depends_on`, and named volumes — with a real `web + db + cache` file and the transcripts of bringing it up, watching logs, and tearing it down.
3. **[Networking, Volumes & Dev Workflow](03-networking-volumes-and-dev-workflow.md)** — how services reach each other by name, how to keep your database's data, live-reload in dev, and the two traps (`depends_on` readiness, and shipping dev config to prod).

> This guide assumes you're comfortable with one container at a time — `docker run`, images, ports. If any of that is fuzzy, read [Docker Without the Magic](/guides/docker-without-the-magic) first; everything here builds on it. Deep production topics — orchestration across many machines, secrets management, multi-stage build tuning — are deliberately left for a follow-up; this guide is about running a real multi-service stack on one machine, cleanly.

**Related:** [Docker Without the Magic](/guides/docker-without-the-magic) · [Environment Variables & Config](/guides/env-vars-and-config)
