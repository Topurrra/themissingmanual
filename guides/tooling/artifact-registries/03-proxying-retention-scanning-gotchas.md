---
title: "Proxying, Retention, Scanning, and the Tag Trap"
guide: artifact-registries
phase: 3
summary: "Where your builds live: container and package registries that store, version, and serve your artifacts — with the proxying and access control teams rely on."
tags: [registries, docker, nexus, artifactory, ghcr, artifacts, packages, supply-chain, proxying]
difficulty: intermediate
synonyms: ["what is a docker registry", "docker hub vs ghcr", "nexus vs artifactory", "private npm registry", "proxy public registry", "docker tag immutability", "container registry retention", "vulnerability scanning images", "latest tag overwrite", "self-hosted package registry"]
updated: 2026-06-30
---

# Proxying, Retention, Scanning, and the Tag Trap

Everything works in development. Then production reality arrives: a public registry rate-limits your CI mid-deploy, your storage bill quietly triples from years of dead builds, a security audit asks "are any of these images vulnerable?", and one afternoon a deploy ships old code because a tag moved under you. This phase is the bill that comes due for running registries at scale — and the well-worn answers to each item.

## Proxy public registries: speed and a seatbelt

Pulling `node:20` straight from Docker Hub on every CI run is slow and fragile: you pay the download latency every time, and if Docker Hub is down or rate-limiting, your pipeline is down with it. Public registries enforce pull rate limits, and a busy CI farm behind one shared IP hits them fast.

The fix is a **proxy (remote) repository** in Nexus or Artifactory. It sits between you and the public registry, caching what you pull:

```text
   first pull:   CI ──▶ Nexus proxy ──▶ Docker Hub   (cache miss, fetches + stores)
   later pulls:  CI ──▶ Nexus proxy ──X              (cache hit, served locally)
```

```console
# Point Docker at the proxy instead of Docker Hub directly:
$ docker pull nexus.internal:8082/docker-hub-proxy/library/node:20
```

*What just happened:* the first pull missed the cache, so Nexus fetched `node:20` from Docker Hub, stored it, and handed it to you. Every later pull is served from Nexus at LAN speed and never touches Docker Hub — so you stop burning rate-limit budget and your builds keep working even when the upstream is having a bad day. The same trick works for npm, PyPI, and Maven Central: one proxy per ecosystem, and your whole org pulls through it.

> A proxy repo is also a quiet supply-chain control point. Because everything external flows through one door, you can scan it, audit it, and (with the right tooling) block known-bad packages before they reach a build. See /guides/supply-chain-security for where this fits the bigger picture.

## Group repositories: one URL to rule them

Telling every developer "use the proxy for public, the private repo for internal" is fragile. **Group (virtual) repositories** merge several repos behind a single URL:

```text
  npm-group  =  [ npm-private  +  npm-proxy(public) ]
                        │              │
                  your @acme code   the public npm world
```

*What just happened:* developers configure exactly one registry URL — the group — and the registry resolves each request to the right backing repo: `@acme/*` from private, everything else from the cached public proxy. One line of config per machine, and the routing complexity lives in the registry where it belongs.

## Retention: artifacts pile up faster than you think

Every CI run can push an image. At a few builds an hour, you accumulate thousands of throwaway snapshot tags, and storage bills climb for builds nobody will ever pull again. Registries solve this with **retention (cleanup) policies** — rules for what to keep and what to reap.

```text
Retention policy (example shape):
  KEEP  release tags matching  v*.*.*           forever
  KEEP  the most recent        30  snapshot images
  DELETE  untagged images older than  14 days
```

*What just happened:* the policy keeps real releases indefinitely, keeps a rolling window of recent snapshots for debugging, and sweeps the untagged orphans that pile up when a moving tag is repointed (the old digest loses its tag but the bytes linger). Set this up early — retroactively cleaning a registry that's been hoarding for two years is a tense, careful job.

> Be specific about what "release" means in your keep rule. A too-broad delete rule that reaps an image production is still running is its own outage. Match release tags precisely, and prefer deleting *untagged* and *snapshot* artifacts over anything that looks like a version.

## Vulnerability scanning: know what you're shipping

An image isn't only your code — it's a base OS, system libraries, and every transitive dependency, any of which can carry a known CVE. Registries and CI tools scan artifacts against vulnerability databases so you find out *before* it's in production, not after.

```console
$ trivy image ghcr.io/acme/checkout-api:1.4.0
checkout-api:1.4.0 (debian 12.5)
Total: 4 (HIGH: 3, CRITICAL: 1)

┌────────────┬────────────────┬──────────┬───────────────┬──────────────┐
│  Library   │ Vulnerability  │ Severity │ Installed Ver │ Fixed Version│
├────────────┼────────────────┼──────────┼───────────────┼──────────────┤
│ libssl3    │ CVE-2024-XXXXX │ CRITICAL │ 3.0.11-1      │ 3.0.13-1     │
└────────────┴────────────────┴──────────┴───────────────┴──────────────┘
```

*What just happened:* the scanner cross-referenced every package in the image against CVE databases and flagged a critical one in a system library you never directly installed — it rode in on the base image. The "Fixed Version" column tells you the cure: rebuild on a patched base. Nexus and Artifactory run this server-side and can *block* a pull or promotion if an artifact is too risky; tools like Trivy or Grype run the same check in CI. The honest caveat: a scan reflects what the database knew *at scan time*, so scanning continuously (not once at build) is what keeps it useful.

## The gotcha that bites everyone: the moving public tag

Here is the trap phase 1 promised. A tag is a movable pointer, and **most public registries let a tag be re-pushed to point at different content.** That convenience is a quiet hazard.

```console
# Monday — you build and deploy:
$ docker pull acme/widget:latest          # → sha256:aaaa  (the build you tested)

# Wednesday — someone re-pushes latest with a new build:
$ docker push acme/widget:latest          # latest now → sha256:bbbb

# Friday — autoscaler launches a new node, pulls "the same" image:
$ docker pull acme/widget:latest          # → sha256:bbbb  (different bytes!)
```

*What just happened:* nothing in your config changed, yet your fleet is now running two different builds — old nodes on `aaaa`, the new node on `bbbb` — because `latest` silently moved. You tested `aaaa`. Friday's node runs `bbbb`, untested, in production. This is the public-tag-overwrite bite: a tag you treated as a stable name was a pointer someone repointed.

Three defenses, strongest first:

```console
# 1. Deploy by digest — immutable, cannot be moved out from under you:
$ docker pull acme/widget@sha256:aaaa...

# 2. Use precise, never-reused version tags (1.4.0, never latest) in deploys.

# 3. Turn on immutable tags in your registry so a tag can't be re-pushed at all.
```

*What just happened:* pinning by digest (option 1) makes "what I tested" and "what runs" the same bytes by construction. Precise version tags (option 2) work if your team *disciplines* itself to never re-push them. Immutable-tag enforcement (option 3) removes the discipline requirement by making the registry reject any re-push of an existing tag — Artifactory, Nexus, GHCR, and the cloud registries all offer some form of this. Defense in depth: do all three for anything that reaches production.

## When to reach for which registry

Choose on purpose, not on hype:

- **Docker Hub / GHCR** when you want managed, zero-ops image hosting and you live in that ecosystem already. GHCR is the natural fit when your code is on GitHub — images sit beside repos under the same permissions.
- **Nexus / Artifactory** when you need *one* place for many formats (npm + Maven + PyPI + images), proxy/group repos, retention, server-side scanning, and fine-grained access — and you're willing to run (or pay for) the server. Artifactory leans enterprise-feature-rich; Nexus has a capable free tier. Both solve the same core problem.
- **Cloud registries (ECR/GCR/ACR)** when your workloads already run in that cloud — IAM integration and in-region pulls are the draw.

None is a moral choice. They all store and serve artifacts. The decision is formats, scale, and how much infrastructure you want to own.

## In the wild

A mature setup looks like this: one Artifactory or Nexus as the single front door, proxy repos in front of Docker Hub / npm / PyPI so CI never hits the public internet directly, group URLs so developers configure one endpoint per ecosystem, retention policies sweeping snapshot and untagged artifacts nightly, server-side scanning gating promotion to the `prod` repo, and production deploys pinned by digest. The registry is invisible until the day it saves you — the day Docker Hub rate-limits the world and your builds keep running because everything's already cached behind your own door.

```quiz
[
  {
    "q": "What problem does a proxy (remote) repository in Nexus or Artifactory primarily solve?",
    "choices": [
      "It encrypts your source code",
      "It caches artifacts pulled from a public registry, so later pulls are local and fast and survive public-registry rate limits or outages",
      "It automatically rewrites your Dockerfiles",
      "It deletes all untagged images"
    ],
    "answer": 1,
    "explain": "A proxy caches upstream pulls. After the first fetch, pulls are served locally — faster, and resilient to upstream rate limits and downtime. It's also a supply-chain control point."
  },
  {
    "q": "You deploy acme/widget:latest Monday (sha256:aaaa). Someone re-pushes latest Wednesday (sha256:bbbb). What happens when an autoscaler pulls latest Friday?",
    "choices": [
      "It fails because the tag changed",
      "It gets sha256:aaaa, the original build",
      "It gets sha256:bbbb — different, untested bytes than the rest of your fleet — because the tag was moved",
      "The registry blocks the pull automatically"
    ],
    "answer": 2,
    "explain": "A mutable tag was repointed, so the new node runs different bytes than the nodes you deployed Monday. This is the public-tag-overwrite trap; pin by digest or enforce immutable tags."
  },
  {
    "q": "Which is the strongest defense against a moving tag silently changing what production runs?",
    "choices": [
      "Always pull :latest so everyone is consistent",
      "Deploy by immutable digest (image@sha256:...), so the reference cannot be repointed",
      "Delete old images more often",
      "Increase the registry's storage quota"
    ],
    "answer": 1,
    "explain": "A digest is content-addressed and immutable — deploying by digest guarantees the bytes you tested are the bytes that run, no matter what happens to tags."
  }
]
```

[← Phase 2: Pushing, Pulling, and Private Packages](02-pushing-pulling-private-packages.md) | [Overview](_guide.md)
