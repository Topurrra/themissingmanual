---
title: "Secrets Management (Don't Commit Your Keys)"
guide: "secrets-management"
phase: 0
summary: "What counts as a secret and why it leaks, how to keep API keys and passwords out of your code and out of Git, and how teams store, inject, and rotate secrets safely in production."
tags: [secrets, api-keys, security, dotenv, secrets-manager, vault, rotation]
category: security
difficulty: intermediate
order: 8
synonyms: ["how to keep api keys safe", "stop committing secrets to git", "what is a secret in code", "i committed my api key", "how to store passwords for an app", "what is a secrets manager", "how to rotate a leaked key", "secrets management for beginners"]
updated: 2026-06-19
---

# Secrets Management (Don't Commit Your Keys)

There's a moment that happens to almost every developer once. You wire up a third-party service, paste the API key right into the code to "get it working," push the branch — and three days later get an email from your cloud provider about a $4,000 bill, or a note from a security bot that found your key in a public repo. Your stomach drops. You weren't careless, exactly. Nobody ever showed you where keys are *supposed* to live, so you put it where the code could see it.

This guide fixes that gap. By the end you'll know exactly what counts as a secret, why secrets leak (it's almost always the same way), how to keep them out of your code and out of Git, and how real teams store and rotate them so a leak is a shrug instead of a disaster. The core idea is calm and simple: **a secret is a key to something that costs money or data, so you treat it like a key — you don't tape it to the front door.**

## How to read this

- **You leaked a secret right now and need to act?** Jump to the [leaked-secret cheat-card in Phase 3](03-real-secrets-management.md) and follow it top to bottom. Then come back and read the rest when your heart rate is normal.
- **Want it to finally make sense?** Read in order. Each phase builds on the one before, starting with the mental model that makes every rule afterward obvious.

## The phases

1. **[What Counts as a Secret & Why It Leaks](01-what-counts-as-a-secret.md)** — the mental model (a secret is a key to something that costs money or data), the four kinds you'll meet, and the number-one way they escape: hardcoded into source and committed.
2. **[Keep Them Out of Code](02-keep-them-out-of-code.md)** — config via environment variables and `.env`, `.gitignore` and `.env.example`, pre-commit secret scanners, and the hard truth that a committed secret lives in Git history forever — so you rotate it.
3. **[Real Secrets Management](03-real-secrets-management.md)** — how teams do it for production: a secrets manager that stores keys centrally, encrypted and access-controlled; injecting them at runtime instead of baking them into images; least privilege; and making rotation routine. Includes the leaked-secret cheat-card.

> This guide is about keeping secrets *safe*. Where config values *come from* in the first place — environment variables, `.env`, YAML, precedence — is its own guide: [Environment Variables & Config](/guides/env-vars-and-config). And if a secret has already reached a remote and you're wondering whether `git revert` hides it (it doesn't), see [Git Disaster Recovery](/guides/git-disaster-recovery).

---

[Phase 1: What Counts as a Secret & Why It Leaks →](01-what-counts-as-a-secret.md)
