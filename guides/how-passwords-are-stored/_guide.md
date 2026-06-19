---
title: "How Passwords Should Be Stored (Hashing)"
guide: "how-passwords-are-stored"
phase: 0
summary: "Never store passwords in plain text. Store a one-way hash made with a slow, salted, password-specific algorithm like bcrypt, scrypt, or Argon2 — so a stolen database doesn't hand attackers everyone's password."
tags: [security, passwords, hashing, bcrypt, argon2, authentication]
category: security
difficulty: beginner
order: 2
synonyms: ["how to store passwords", "should I encrypt passwords", "how does password hashing work", "what is a salt in passwords", "bcrypt vs sha256", "why not store passwords in plain text"]
updated: 2026-06-19
---

# How Passwords Should Be Stored (Hashing)

There's a moment, the first time you build a login system, when you create the `users` table and reach
for a `password` column. It feels natural to drop the password straight in — you'll need it to check
logins, right? That instinct is the single most expensive mistake in account security, and almost
everyone has it before they're shown the alternative.

Here's the relief: the alternative is not harder, it's just *different*, and once you see the idea it
never leaves you. You're going to learn why your database should never contain a single readable
password — yours, your users', anyone's — and exactly what to store instead so that even an attacker who
steals the entire table walks away with nothing useful.

## How to read this
- **Just need the safe answer right now?** Jump to [Phase 3: Use a Slow Hash Built for Passwords](03-use-a-slow-hash.md) — it has the do-this pseudo-code for signup and login.
- **Want it to finally make sense?** Read in order. Each phase fixes a flaw the previous one left open, which is exactly how real-world password storage evolved.

## The phases
1. **[Hashing, Not Encrypting](01-hashing-not-encrypting.md)** — the core idea: store a one-way *hash* of the password, never the password itself, and never reversible encryption.
2. **[Salt (and Why Plain SHA-256 Isn't Enough)](02-salt-and-fast-hashes.md)** — why identical passwords need a per-user *salt*, and why fast hashes like SHA-256 are the wrong tool.
3. **[Use a Slow Hash Built for Passwords](03-use-a-slow-hash.md)** — bcrypt, scrypt, and Argon2: deliberately slow, salted, tunable, and battle-tested. Use a library; never roll your own.

> Deeper material — multi-factor auth, session tokens, OAuth, and rotating leaked credentials at scale — belongs to its own guides. This one does one thing well: get the password out of your database safely. For *who* a logged-in user is allowed to be, see [Authentication vs Authorization](/guides/auth-vs-authz).
