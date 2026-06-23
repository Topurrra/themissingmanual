---
title: "Ship Your Side Project to the Internet"
guide: "ship-your-side-project"
phase: 0
summary: "The full journey from 'it works on my laptop' to 'a stranger can use it at a real URL' — pick a VPS, SSH in, run it with Docker, point a domain, put it behind Cloudflare, and auto-deploy on merge — with every first-time gotcha flagged."
tags: [deployment, vps, ssh, docker, dns, cloudflare, ci-cd, infrastructure]
category: infrastructure
order: 9
difficulty: intermediate
synonyms: ["how to deploy my project", "deploy side project to a server", "first time deploying a web app", "vps docker cloudflare deploy", "how to get my app online", "self-host my app"]
updated: 2026-06-19
---

# Ship Your Side Project to the Internet

You built something. It runs on `localhost:3000` and it works. And now there's a gap — the one nobody
warns you about — between "it works on my machine" and "a stranger can open a URL and use it." That gap
is small in concept and full of tiny, infuriating traps: billing that keeps running after you power off,
an SSH key that's "permission denied" for five different reasons, a `$` in your password that quietly
breaks everything, a login that works locally and silently fails in production.

This guide walks the **whole journey, once, end to end** — the path a real first deploy actually takes —
and flags every trap as a ⚠️ so it bites the page instead of you. We won't re-teach SSH or Docker or DNS
from scratch; each has its own guide, and we'll link them. This is the *map* that strings them together
into "my thing is live."

```mermaid
flowchart LR
  Local[your laptop] --> VPS[a VPS] --> Docker[Docker compose up] --> DNS[domain + DNS] --> CF[Cloudflare + HTTPS] --> Auto[auto-deploy on merge]
```

## How to read this
- **First deploy ever?** Read in order — it's the literal sequence you'll follow, top to bottom.
- **Stuck on one step?** Each phase is self-contained; jump to the one that's fighting you (the ⚠️
  callouts are the fixes).

## The phases
1. **[Pick a Cheap VPS](01-pick-a-vps.md)** — what specs you *actually* need, why the build needs more
   RAM than the app, and the billing trap.
2. **[SSH In With a Key](02-ssh-in-with-a-key.md)** — keys not passwords, and the "Permission denied"
   decision tree.
3. **[Docker & Your Private Repo](03-docker-and-your-repo.md)** — install Docker, get a *private* repo
   onto the box with a deploy key, `compose up`.
4. **[Domains & DNS](04-domains-and-dns.md)** — buy one, point it, apex vs www, and the `.dev` HTTPS trap.
5. **[Behind Cloudflare](05-behind-cloudflare.md)** — free HTTPS, no open ports, and the cookie/CSRF
   must-dos that break logins.
6. **[Auto-Deploy on Merge](06-auto-deploy-on-merge.md)** — merge to `main`, and it's live.

> Every step here builds on a guide that goes deeper:
> [What a Server Is](/guides/what-a-server-is) · [SSH & Keys](/guides/ssh-and-keys) ·
> [Docker Without the Magic](/guides/docker-without-the-magic) ·
> [Docker Compose for Real Projects](/guides/docker-compose-for-real-projects) ·
> [Deploying to a VPS](/guides/deploying-to-a-vps) · [HTTPS & TLS](/guides/https-and-tls) ·
> [Environment Variables & Config](/guides/env-vars-and-config) ·
> [Your First Pipeline (GitHub Actions)](/guides/your-first-pipeline-github-actions). This guide is the
> end-to-end thread; reach for those when you want the full picture of one piece.
