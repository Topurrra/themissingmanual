---
title: "Artifact Registries: Docker Hub, Nexus, Artifactory"
guide: artifact-registries
phase: 0
summary: "Where your builds live: container and package registries that store, version, and serve your artifacts - with the proxying and access control teams rely on."
tags: [registries, docker, nexus, artifactory, ghcr, artifacts, packages, supply-chain, proxying]
category: tooling
group: "Secrets & Supply Chain"
order: 53
difficulty: intermediate
synonyms: ["what is a docker registry", "docker hub vs ghcr", "nexus vs artifactory", "private npm registry", "proxy public registry", "docker tag immutability", "container registry retention", "vulnerability scanning images", "latest tag overwrite", "self-hosted package registry"]
updated: 2026-06-30
---

# Artifact Registries: Docker Hub, Nexus, Artifactory

Your build finishes, your tests go green, and then you hit the quiet question nobody documented: where does the *output* go? The image, the jar, the npm package - they need a home that the next pipeline stage, the next teammate, and production can all pull from. That home is an artifact registry, and the difference between treating it as a dumb bucket and understanding how it really works is the difference between reliable deploys and the day a moved `latest` tag silently ships old code.

This guide gives you the mental model first - what an artifact is, why registries exist, and the one rule (immutability) that everything else hangs on. Then the everyday flow of pushing and pulling across Docker Hub, GHCR, Nexus, and Artifactory. Then the production reality: proxying public registries for speed and resilience, private packages, retention, scanning, and exactly why the public-tag-overwrite trap bites teams who thought a tag was a promise.

## How to read this

- **Want it to actually click?** Read in order. Phase 1 installs the immutability mental model that phases 2 and 3 lean on the whole way through.
- **Already pushing images and only need the gotchas?** Phase 3 is the production phase - proxy repos, retention, scanning, and the tag-overwrite trap. But skim phase 1's immutability section first; it is the reason the trap exists.

## The phases

1. **[What a Registry Actually Is](01-what-a-registry-actually-is.md)** - artifacts need a home; what a registry stores, how a tag points at an immutable digest, and why that one distinction governs everything else.
2. **[Pushing, Pulling, and Private Packages](02-pushing-pulling-private-packages.md)** - the everyday flow across Docker Hub, GHCR, Nexus, and Artifactory: log in, tag, push, pull, and serve private npm/Maven/PyPI packages from one place.
3. **[Proxying, Retention, Scanning, and the Tag Trap](03-proxying-retention-scanning-gotchas.md)** - proxying public registries for speed and resilience, retention so you don't drown in old builds, vulnerability scanning, and why the mutable public tag bites.

[Phase 1: What a Registry Actually Is](01-what-a-registry-actually-is.md) →
