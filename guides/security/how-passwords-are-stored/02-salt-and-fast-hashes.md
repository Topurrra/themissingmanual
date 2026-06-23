---
title: "Salt (and Why Plain SHA-256 Isn't Enough)"
guide: "how-passwords-are-stored"
phase: 2
summary: "Identical passwords hash identically, which rainbow tables exploit. A per-user random salt fixes that. And general-purpose hashes like MD5 and SHA-256 are far too fast — attackers can try enormous numbers of guesses per second."
tags: [security, passwords, salt, rainbow-table, sha256, md5, brute-force]
difficulty: beginner
synonyms: ["what is a password salt", "why salt passwords", "what is a rainbow table", "is sha256 safe for passwords", "why is fast hashing bad for passwords", "identical passwords same hash"]
updated: 2026-06-19
---

# Salt (and Why Plain SHA-256 Isn't Enough)

So you're hashing now — excellent, you're already ahead of a frightening number of real systems. But the
simple version from Phase 1 has two weaknesses, and attackers have built an entire economy around both.
The good news is that each weakness has a clean, well-understood fix, and understanding *why* they exist
is what lets you recognize a safe setup when you see one.

We'll take them in order: first the problem that identical passwords hash identically, then the deeper
problem that the hash we used is far too fast.

## Problem 1: identical passwords produce identical hashes

**Why people get this wrong.** The thing that *feels* like a feature of hashing — "the same input always
gives the same output" — is also a leak. Look at what happens when two users happen to pick the same
password:

```text
   user  alice   password "summer2024"  ──►  hash  9c1f...e3
   user  bob     password "summer2024"  ──►  hash  9c1f...e3   ← identical!
   user  carol   password "p@ssw0rd"    ──►  hash  4b77...a9
```

**What it does in real life.** An attacker who steals this table doesn't even need to crack anything to
learn a lot. Identical hashes mean identical passwords, so they instantly know Alice and Bob share one.
Worse, attackers precompute giant lookup tables — every common password run through the hash function in
advance — and just *look up* your stored hash to find the password that made it.

📝 **Terminology.** A **rainbow table** is a precomputed map from hashes back to the passwords that
produce them. If your hash is in their table, the "one-way" function might as well be a dictionary lookup.
Building these tables is worth it precisely *because* the same password always hashes the same way for
everybody.

## The fix: a per-user salt

**What it actually is.** A **salt** is a chunk of random data, unique to each user, that you mix into the
password *before* hashing. You generate it once at signup and store it right alongside the hash (it's not
a secret — it just needs to be unique and random).

📝 **Terminology.** A **salt** is per-user random data combined with the password before hashing, so that
the same password produces a different hash for each user.

**What it does in real life.** Now Alice and Bob, with the same password, get different hashes — because
each was hashed with a different salt:

```text
   alice   "summer2024" + salt "x7Qe.."  ──►  hash  2a8c...11
   bob     "summer2024" + salt "Lp93.."  ──►  hash  d40f...e7   ← now different!
```

On login you fetch that user's salt, mix it into the password they typed, hash it, and compare — exactly
the same flow as before, with one extra ingredient pulled from the database.

**Why this saves you later.** A precomputed rainbow table is now worthless: the attacker would have to
rebuild the entire table separately *for every single user's salt*, which defeats the whole point of
precomputing. Identical passwords no longer reveal themselves. One small random value per user collapses
an entire category of attack.

💡 **Key point.** A unique, random **salt per user** makes identical passwords hash differently and kills
rainbow tables. The salt is stored next to the hash and isn't secret.

## Problem 2: SHA-256 is too *fast*

Here's the one that surprises people. We fixed the rainbow-table problem, but we used SHA-256 to do it,
and SHA-256 is the wrong hash for passwords — not because it's weak, but because it's **fast**. And for
password storage, fast is exactly what you don't want.

**Why people get this wrong.** Everywhere else in computing, a fast hash is good. SHA-256 and MD5 were
*designed* to be fast — they're built to fingerprint files and verify downloads at high speed. That
speed is a virtue there. For passwords, it's a gift to the attacker.

**What it does in real life.** Imagine the attacker has your salted hashes. They can't use a precomputed
table anymore (the salt saw to that), so instead they guess: take a candidate password, add the user's
salt, hash it, check for a match. Repeat. The only thing limiting them is how many guesses per second
they can compute — and with a fast hash on modern hardware, especially GPUs built for exactly this kind
of parallel work, that number is staggering. A password short or common enough will fall quickly when the
attacker can try guess after guess after guess at high speed.

> 📝 The exact guess rate depends entirely on the attacker's hardware and the specific hash, so any
> single number would be made up — but the direction is not in dispute: general-purpose hashes are *orders
> of magnitude* too fast to safely protect passwords. (See OWASP's Password Storage Cheat Sheet:
> <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>.)

**The mental model.** Think of it as a lock. SHA-256 is a lock that opens the instant the right key
touches it — and the attacker can try millions of keys without tiring. What you actually want is a lock
that takes a noticeable beat to turn *even with the right key*. For one honest login, a fraction of a
second is invisible. For an attacker trying to turn the lock billions of times, that same delay is a
wall. You don't want a *fast* hash. You want a *deliberately slow* one.

⚠️ **Gotcha.** "We salt our SHA-256 hashes" sounds secure, and salting is genuinely necessary — but it is
*not sufficient*. Salt defeats precomputed tables; it does nothing about raw guessing speed. A salted fast
hash is still a fast hash. You need both: a salt *and* a hash that's slow on purpose.

## Recap

1. **Identical passwords hash identically** with a plain hash — leaking that users share passwords and enabling **rainbow tables** (precomputed hash → password lookups).
2. A **per-user random salt**, mixed in before hashing and stored beside the hash, makes identical passwords hash differently and renders rainbow tables useless.
3. **Salt alone isn't enough.** Fast hashes like MD5 and SHA-256 let attackers guess enormous numbers of candidates per second, especially on GPUs.
4. You want a hash that is **deliberately slow** — invisible for one login, a wall for billions of guesses.

We now know the two properties a good password hash needs: it must be salted, and it must be slow. The
final phase introduces the algorithms built to do exactly that — and the safe way to use them.

---

[← Phase 1: Hashing, Not Encrypting](01-hashing-not-encrypting.md) · [Guide overview](_guide.md) · [Phase 3: Use a Slow Hash Built for Passwords →](03-use-a-slow-hash.md)
