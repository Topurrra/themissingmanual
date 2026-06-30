---
title: "HashiCorp Vault"
guide: hashicorp-vault
phase: 0
summary: "Stop hardcoding secrets: Vault stores them encrypted, gates access by policy, issues short-lived dynamic credentials, and keeps an audit trail."
tags: [vault, secrets, security, dynamic-secrets, encryption, devops]
category: tooling
group: "Secrets & Supply Chain"
order: 52
difficulty: intermediate
synonyms: ["hashicorp vault", "vault secrets", "what is vault", "dynamic secrets", "vault unseal", "vault policy", "vault kv", "vault dynamic database credentials", "vault auth methods", "transit encryption"]
updated: 2026-06-30
---

# HashiCorp Vault

Right now there's a password in a config file, an API key in an environment variable that got committed once, and a database credential that hasn't changed in three years because nobody remembers everywhere it's pasted. That's not a bug, that's how most teams ship — until one leak turns it into a breach. Vault exists to make that sprawl stop: one encrypted place for secrets, access decided by written policy, credentials that expire on their own, and a log of every read. This guide builds the mental model first, then the daily moves, then the parts that bite in production.

## How to read this

Read phase 1 slowly. Vault makes a lot more sense once you understand that it spends its life *sealed* and that everything inside is encrypted by a key Vault itself can't reach without help. Get that, and unseal, policies, and dynamic secrets stop feeling like ceremony. Phase 2 is the everyday loop: logging in, reading and writing secrets, and the magic trick that is dynamic database credentials. Phase 3 is production reality — token leases, revocation, the audit log, and the failure modes that page you at 3am.

## The phases

1. [Phase 1: Sealed by Default](01-sealed-by-default.md) — what Vault actually is and why it exists
2. [Phase 2: The Daily Loop](02-the-daily-loop.md) — auth, policies, static and dynamic secrets
3. [Phase 3: Leases, Revocation, and Reality](03-leases-revocation-and-reality.md) — the gotchas and production concerns

[Phase 1: Sealed by Default](01-sealed-by-default.md) →
