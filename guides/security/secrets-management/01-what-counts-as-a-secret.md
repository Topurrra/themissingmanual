---
title: "What Counts as a Secret & Why It Leaks"
guide: "secrets-management"
phase: 1
summary: "A secret is a key to something that costs money or data; the four kinds are API keys, database passwords, tokens, and private keys, and the number-one way they leak is being hardcoded into source and committed to Git."
tags: [secrets, api-keys, passwords, tokens, private-keys, security]
difficulty: intermediate
synonyms: ["what is a secret in code", "what counts as a secret", "why do api keys leak", "is an api key a secret", "what is a private key", "difference between api key and token", "how do secrets get leaked"]
updated: 2026-07-10
---

# What Counts as a Secret & Why It Leaks

Before any rules about `.gitignore` or vaults, you need one idea in your head - the idea that makes every later rule feel obvious instead of arbitrary. People follow security advice badly when it's a list of memorized commandments; they follow it well when they understand what they're protecting and why it runs away. So: the mental model first, then the things that count, then how they escape.

## The mental model: a secret is a key

**What a secret actually is.** A secret is a **key to something that costs money or data.** That's it. Not "a string that looks random," not "anything in the config." The test is consequence: *if a stranger had this value, could they spend your money, read your users' data, or pretend to be you?* If yes, it's a secret. If no, it's just config.

Think of your house key: it isn't dangerous because it's shiny or secret-looking, it's dangerous because of what it *opens*. You don't leave it under the mat, you don't photocopy it for strangers, and if you lose it you change the lock. Every rule in this guide is one of those instincts applied to software.

```mermaid
flowchart TD
  q{"If a stranger had this value, could they<br/>spend my money, read my data, or be me?"}
  q -->|no| config["CONFIG<br/>(port, log level, feature flag, public API URL)<br/>- harmless if seen"]
  q -->|yes| secret["SECRET<br/>(anything that unlocks money or data)<br/>- never in code, never in Git, rotate if it leaks"]
```

💡 **Key point.** The thing that makes a value a secret is *what it unlocks*, not what it looks like. A short password to a production database is a secret; a long random string that's actually a public identifier is not. When unsure, ask the consequence question.

## The four kinds you'll meet

Almost everything you'll need to protect falls into one of four buckets. You don't have to memorize them - you'll recognize them in the wild once you've seen them named.

📝 **API key.** A single string a service gives you to prove "requests with this key are from my account." Think `sk_live_51H...` from a payments provider, or a key for a maps or email service. Whoever holds it can make calls *as you* - and you get the bill. This is the one that ends up in the surprise-invoice horror stories.

📝 **Database password (and connection strings).** The credentials your app uses to reach its database. Often bundled into one **connection string** like `postgres://app:hunter2@db.internal:5432/prod` - notice the password sits right in the middle of that URL. Whoever has it can read or delete every row your app can touch.

📝 **Token.** A string that proves an *identity* or a *granted permission*, usually time-limited. Session tokens, OAuth access tokens, personal access tokens for GitHub, JWTs. A token is often "an API key that expires" - still fully dangerous while it's alive.

📝 **Private key.** One half of a cryptographic key pair (the public half is meant to be shared; the **private** half must never be). SSH keys that log you into servers, TLS certificate keys, signing keys. These usually live in files like `id_rsa` or `private.pem`. Leaking a private key can hand someone your servers or let them forge things signed as you.

The reason to group them is that they share a single property: **possession is permission.** There's no second factor, no "are you sure?" - if the value is in someone's hands, they can use it. That's why we guard the value itself so fiercely.

## Why secrets leak: the number-one cause

Here's the honest part. Secrets rarely leak through some sophisticated hack. The overwhelmingly common way is mundane: **a developer writes the secret directly into the source code and commits it.**

It looks innocent in the moment:

```text
   // payment.js  - committed to the repo
   const stripe = require("stripe")("sk_live_51H8xK2eZvKYlo3a9qN...");
```

The code works, the feature ships, and the key is now sitting in your repository. If that repo is public - or ever becomes public, or is cloned to a laptop that's later lost - the key is out, and because it's a literal string in the code, it's trivially findable.

**Why people get this wrong.** The instinct is "it's in my private repo, so it's fine." But private isn't a fortress: repos get made public by accident, contractors get added and removed, laptops get stolen, backups get misconfigured. And as you'll see in Phase 2, once a secret is committed, **deleting it later doesn't remove it from Git's history** - it lingers in every clone forever. The safe assumption is the uncomfortable one: *anything that touches a repository should be considered potentially public.*

⚠️ **Gotcha - bots are watching, and they're fast.** Public code hosts are continuously scanned by automated bots looking for exactly these patterns. A real key pushed to a public repository can be found and abused within **minutes** of the push - not days. This is routine behavior for both attackers (hunting for free compute and data) and the good guys (GitHub's own secret-scanning service notifies you, and many providers auto-revoke keys it spots).

**Why this saves you later.** Once you internalize that a secret is a house key and the fastest way to lose it is to commit it, the next phase reads as common sense: get the key *out* of the code, keep the file it lives in *out* of Git, and assume that if it ever got out, you must change the lock.

## The other ways they leak (briefly)

Hardcoding-and-committing is number one by a wide margin, but a few others are worth knowing so you recognize them:

- **Logs.** Printing a request that contains an `Authorization` header, or logging the full config at startup, writes secrets into log files that get shipped to a logging service or shown in a stack trace.
- **Error pages and screenshots.** A debug error page that dumps environment variables, pasted into a ticket or chat, leaks whatever was on screen.
- **Sharing the wrong way.** Pasting a key into a public chat, a forum question, or an issue. Once it's somewhere you don't control, treat it as gone.

Each is the same root mistake as committing: **the secret ended up somewhere it could be seen.** Keep that frame - "where can this value be seen, and who can see there?" - and you'll catch leaks the rules don't explicitly cover.

## Recap

1. A **secret is a key to something that costs money or data.** The test is consequence, not appearance: could a stranger spend your money, read your data, or impersonate you with it?
2. The four kinds: **API keys**, **database passwords / connection strings**, **tokens**, and **private keys.** They share one rule - *possession is permission.*
3. The number-one leak is **hardcoding a secret into source and committing it.** "It's private" is not protection; repos go public, laptops walk off, and committed secrets stay in history.
4. ⚠️ Bots scan public repos continuously - a leaked key can be abused within **minutes** of being pushed.
5. The universal lens: **where can this value be seen, and who can see there?** Logs, error pages, and careless sharing leak secrets the same way commits do.

Next: the practical mechanics of getting secrets out of your code and keeping them out of Git - and what to do about the ones already in there.

---

[← Guide overview](_guide.md) · [Phase 2: Keep Them Out of Code →](02-keep-them-out-of-code.md)
