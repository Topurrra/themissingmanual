---
title: "Use a Slow Hash Built for Passwords"
guide: "how-passwords-are-stored"
phase: 3
summary: "bcrypt, scrypt, and Argon2 are deliberately slow, salted, and tunable via a work factor. Use a vetted library, never roll your own, verify with a constant-time compare, and add a breach/strength check at signup."
tags: [security, passwords, bcrypt, scrypt, argon2, work-factor, constant-time]
difficulty: beginner
synonyms: ["which password hash should I use", "bcrypt vs argon2 vs scrypt", "how to hash a password safely", "what is a work factor", "constant time password compare", "should I write my own password hashing"]
updated: 2026-06-19
---

# Use a Slow Hash Built for Passwords

We've arrived at the practical answer. You know *why* a password hash must be salted and slow; now you
just need the tools that do both correctly, and the handful of rules for using them safely. The
reassuring part: you don't build any of this yourself. The hard work has already been done, vetted by
cryptographers, and packaged into a library for your language. Your job is to call it correctly.

If you skipped straight here in a hurry, the cheat-card is right below. The rest of the phase explains
each line so you can trust it rather than just copy it.

## The cheat-card

| You want to… | Do this |
|---|---|
| Pick an algorithm | **Argon2** (Argon2id) if available; **bcrypt** is a fine, ubiquitous default; **scrypt** also good. |
| Hash on signup | `hash = passwordHasher.hash(plainPassword)` — the library generates the salt and embeds it. |
| Verify on login | `passwordHasher.verify(plainPassword, storedHash)` — returns true/false; do **not** compare strings yourself. |
| Choose the slowness | Tune the **work factor** so one hash takes a noticeable fraction of a second on your hardware. |
| Write your own crypto | **Don't.** Use the vetted library. |
| Store | Just the single hash string the library returns (salt + work factor are baked into it). |

## The three good algorithms

**What they actually are.** **bcrypt**, **scrypt**, and **Argon2** are *password hashing functions* —
hash functions designed specifically for storing passwords, not for general use. Each one builds in
exactly the two properties from the last two phases: it generates and embeds a salt for you, and it's
deliberately slow.

📝 **Terminology.** A **password hashing function** (also called a *key derivation function* in this
context) is built to be slow and salted on purpose, unlike a general-purpose hash like SHA-256.

**What they do in real life.** The defining feature is a **work factor** (sometimes called *cost* or
*rounds*): a dial that controls how much computation each hash takes. Turn it up and every hash gets
slower. You set it high enough that a single login costs a barely-noticeable fraction of a second — and
that same cost, multiplied across an attacker's billions of guesses, becomes prohibitive. As hardware
gets faster over the years, you raise the work factor to keep pace. That tunability is the whole reason
these algorithms exist.

📝 **Terminology.** The **work factor** (cost / rounds) is a configurable number that sets how slow the
hash is. Higher = slower = harder to brute-force. It's stored inside the resulting hash so verification
knows how much work to redo.

A quick, honest comparison so you can choose without agonizing:

| Algorithm | In one line | When to reach for it |
|---|---|---|
| **Argon2** (Argon2id) | Newest; winner of the Password Hashing Competition; resists GPU *and* memory-based attacks. | The current first choice when your library supports it. |
| **bcrypt** | Old, boring, everywhere, well-understood. | A safe, ubiquitous default — especially if it's already in your stack. |
| **scrypt** | Deliberately memory-hungry, which frustrates specialized cracking hardware. | A solid choice; common where it's already available. |

There's no wrong pick among these three. The wrong pick is anything *not* on this list. (OWASP's Password
Storage Cheat Sheet tracks current recommended parameters as hardware moves:
<https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>.)

## Hash on signup, verify on login

Here's the entire flow in annotated pseudo-code. It's intentionally generic — your library's function
names will differ, but the shape is universal.

```text
# ── SIGN UP ────────────────────────────────────────────────
function register(username, plainPassword):
    # the library generates a random salt AND applies the work
    # factor, then bundles salt + work factor + digest into ONE string
    storedHash = passwordHasher.hash(plainPassword)

    db.save(username, storedHash)     # store ONLY this string
    # never store plainPassword anywhere — not in a log, not in a variable you keep
```
*What just happened:* You called the library's `hash` function with the plain password. It minted a fresh
random salt, ran the slow hashing with your configured work factor, and returned a single self-contained
string that already includes the salt and the work factor. You save that one string. There is no separate
salt column to manage — it's baked in.

```text
# ── LOG IN ─────────────────────────────────────────────────
function login(username, plainPassword):
    storedHash = db.lookupHash(username)
    if storedHash is null:
        reject("invalid username or password")   # same vague message either way

    # verify() re-reads the salt + work factor from storedHash,
    # hashes the attempt the same way, and compares — in CONSTANT TIME
    if passwordHasher.verify(plainPassword, storedHash):
        accept()
    else:
        reject("invalid username or password")
```
*What just happened:* `verify` pulled the salt and work factor back out of the stored hash, applied the
identical slow hashing to the password the user just typed, and compared the result against the stored
digest — using a constant-time comparison (more on that next). You never reconstruct the salt yourself and
you never compare strings by hand. One call in, true or false out.

📝 **Terminology.** A **constant-time comparison** checks two values in a way that takes the same amount of
time whether they match at the first character or the last. A naive `==` can bail out early on the first
mismatched byte, and an attacker measuring tiny timing differences could slowly learn the correct value.
Good libraries' `verify` functions compare in constant time for you.

## The rules that keep this safe

⚠️ **Gotcha — never roll your own scheme.** The most dangerous instinct in this whole topic is "I'll
combine a few SHA-256 calls and a salt and call it good." Cryptography fails in subtle, invisible ways —
it'll look like it works perfectly while being trivially breakable. bcrypt, scrypt, and Argon2 exist
because experts spent years getting the details right. Use the vetted library for your language. This is
the one area of programming where *not* being clever is the senior move.

⚠️ **Gotcha — use the library's `verify`, not `==`.** Don't hash the attempt and compare the strings
yourself with `==`; that risks both the timing leak above and subtle format mismatches. The library's
verify function is built to re-derive and compare correctly. Let it.

⚠️ **Gotcha — a slow hash doesn't fix a weak password.** Argon2 protects `hunter2` exactly as well as it
protects a random 20-character passphrase — which is to say, a common password is still guessed early no
matter how slow the hash. So at signup, also check the password against a list of known-breached and
common passwords and reject the worst ones. The "Have I Been Pwned" Pwned Passwords range API is the
standard tool for this (<https://haveibeenpwned.com/Passwords>). Strong storage and strong passwords are
two different jobs; do both.

💡 **Key point.** Reach for **Argon2, bcrypt, or scrypt** through a vetted library. Let it generate the
salt, set the **work factor** so a login takes a noticeable fraction of a second, store the single string
it returns, and verify logins with its **constant-time** verify function. Never invent your own scheme.

## Where this fits in the bigger picture

You've now got the password *stored* correctly: hashed, salted, slow, breach-checked, verified safely. But
storing the password is only half of a login system. Once you've confirmed *who* someone is — that's
**authentication**, the job this guide supports — there's a separate question of *what they're allowed to
do* — that's **authorization**. Those two are constantly confused, and confusing them causes its own
breaches.

> ⏭️ Next, read [Authentication vs Authorization](/guides/auth-vs-authz) to see how proving identity
> (which a stored password is one way to do) differs from granting permissions.

## Recap

1. Use a **password hashing function** — **Argon2**, **bcrypt**, or **scrypt** — never a general-purpose hash.
2. The **work factor** dials in slowness; set it so a single login takes a noticeable fraction of a second, and raise it over the years.
3. **On signup**, call the library's `hash`; it makes the salt and returns one self-contained string. Store only that.
4. **On login**, call the library's `verify`; it re-derives and compares in **constant time**. Don't compare strings yourself.
5. **Never roll your own** crypto, and **add a breached/weak-password check** at signup — strong storage and strong passwords are separate jobs.

That's the complete, responsible way to store a password. Stored like this, even a full database leak
hands an attacker nothing they can practically use — which is exactly the calm, manageable day you were
promised at the start.

---

[← Phase 2: Salt (and Why Plain SHA-256 Isn't Enough)](02-salt-and-fast-hashes.md) · [Guide overview](_guide.md)
