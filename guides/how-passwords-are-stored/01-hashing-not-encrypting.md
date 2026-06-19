---
title: "Hashing, Not Encrypting"
guide: "how-passwords-are-stored"
phase: 1
summary: "Store a one-way hash of the password, never the password itself. On login, hash the attempt and compare hashes — so a stolen database reveals no passwords. Hashing is not encryption."
tags: [security, passwords, hashing, one-way, encryption]
difficulty: beginner
synonyms: ["what is password hashing", "hashing vs encryption passwords", "why not store plaintext passwords", "how does login check a password", "one way hash explained"]
updated: 2026-06-19
---

# Hashing, Not Encrypting

Picture the worst day: someone copies your entire `users` table. Maybe a leaked backup, a SQL injection
bug, a misconfigured cloud bucket. It happens to careful teams. The question that decides whether this is
an embarrassing incident or a catastrophe is simple: **when the attacker opens that table, can they read
people's passwords?**

If the answer is yes, it's a catastrophe — not just for your site, but for every other site where your
users reused that password (and most people reuse passwords). If the answer is *no, the table is full of
useless gibberish*, you've turned a disaster into a manageable cleanup. This phase is about how to be in
that second world. The whole trick is one idea: **never store the password — store a one-way hash of it.**

## What a hash actually is

**What it actually is.** A **hash function** is a one-way blender. You feed it any input — a word, a
password, a whole book — and it produces a fixed-size scrambled string called a **hash** (or *digest*).
The defining property: it's a one-way street. Going from password to hash is fast and easy. Going *back*,
from hash to the original password, is designed to be effectively impossible.

📝 **Terminology.** A **hash function** takes input and produces a fixed-length fingerprint of it. The
output is the **hash** or **digest**. "Hash the password" means "run the password through this function and
keep the output."

**What it does in real life.** The same input always produces the same output, and a tiny change to the
input produces a wildly different output. Here's the shape of it, using a common hash function so you can
see what a digest looks like:

```console
$ echo -n "hunter2" | sha256sum
f52fbd32b2b3b86ff88ef6c490628285f482af15ddcb29541f94bcf526a3f6c7  -

$ echo -n "hunter3" | sha256sum
fb8c2e2b85ca81eb4350199faddd983cb26af3064614e737ea9f479621cfa57a  -
```
*What just happened:* `sha256sum` ran each password through the SHA-256 hash function (`echo -n` just
feeds it the text without a trailing newline). Two things to notice. First, the output is a fixed length
no matter the input. Second, changing one character — `hunter2` to `hunter3` — produced a completely
different hash, with no resemblance to the first. There's no "close"; there's no pattern an attacker can
follow back to the original.

## Why this protects a stolen database

**The mental model.** You never write the password to disk. Instead:

```text
   SIGN UP                              LOG IN
   ───────                              ──────
   user types  "hunter2"               user types  "hunter2"
        │                                   │
        ▼                                   ▼
     hash it                             hash it
        │                                   │
        ▼                                   ▼
   store the HASH       ───────►        compare to the STORED hash
   (not the password)                   match?  ✓ let them in
                                        no match? ✗ reject
```

On signup you hash the password and store *only the hash*. On login you hash whatever the user just typed
and compare that new hash to the stored one. If they match, the passwords matched — without your server
ever keeping the password around. You verify the password without knowing it.

**Why this saves you later.** When that table leaks, the attacker gets a column of hashes. They can't run
the hash backward to recover `hunter2`, because the function only goes one way. The password the user
typed exists for a fraction of a second in memory during login and is then gone. There is nothing on disk
to steal. *That* is why hashing is the foundation of every responsible login system.

## Hashing is not encryption

This is the distinction that trips up nearly everyone new to this, so let's be precise about it.

📝 **Terminology.** **Encryption** is *reversible by design*: you scramble data with a key, and anyone
holding the key can unscramble it back to the original. It's for data you need to read again later — a
credit card you'll charge next month, a message the recipient must decrypt. **Hashing** is *one-way by
design*: there is no key, and nothing turns the hash back into the original.

⚠️ **Gotcha — do not "encrypt" passwords.** It sounds responsible, but it's the wrong tool, and it's
dangerous. Encryption means a key exists that turns every password back into plain text. Where does that
key live? On your servers, near the database. Steal the database *and* the key — and attackers who reach
one usually reach the other — and every password is instantly readable. You've added a lock and taped the
key to the door. Passwords are exactly the kind of data you *never* need to read back, so you should use
the tool that makes reading them back impossible: a hash.

⚠️ **Gotcha — never, ever store plain text.** No `password` column with the real password in it. Not "just
for now," not "only in the dev database," not "we'll fix it before launch." Dev databases get copied to
laptops; "before launch" becomes "after the breach." If you remember one sentence from this entire guide,
make it this one: **the readable password must never touch your disk.**

💡 **Key point.** Store a one-way *hash*, never the password and never a reversible encryption of it. To
check a login, hash the attempt and compare hashes. A stolen database should reveal exactly zero
passwords.

## Recap

1. A **hash function** is a one-way blender: easy to go password → hash, effectively impossible to go back.
2. On **signup**, store only the hash. On **login**, hash the attempt and compare to the stored hash.
3. A leaked table of hashes reveals no passwords — that's the whole point.
4. **Hashing is not encryption.** Encryption is reversible (a key exists); hashing is not. Passwords need the one-way tool.
5. **Never store plain text, and never encrypt passwords.** The readable password must never be on disk.

You now have the core idea. But there's a crack in it: hashing the same password always gives the same
hash — which an attacker can exploit. Next, we close that crack with a *salt*, and find out why the
fast hash we just used is the wrong one for passwords.

---

[← Guide overview](_guide.md) · [Phase 2: Salt (and Why Plain SHA-256 Isn't Enough) →](02-salt-and-fast-hashes.md)
