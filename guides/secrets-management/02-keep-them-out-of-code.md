---
title: "Keep Them Out of Code"
guide: "secrets-management"
phase: 2
summary: "Move secrets out of source into environment variables or a .env file, keep that file out of Git with .gitignore, commit a .env.example with placeholders, add a pre-commit secret scanner, and rotate any secret that was ever committed because it lives in Git history forever."
tags: [dotenv, gitignore, env-example, secret-scanning, pre-commit, rotation, security]
difficulty: intermediate
synonyms: ["how to keep api keys out of code", "use env vars for secrets", "gitignore env file", "what is env example", "pre-commit secret scanner", "i committed a secret to git", "how to remove secret from git history", "do i need to rotate a leaked key"]
updated: 2026-06-19
---

# Keep Them Out of Code

In Phase 1 we landed on the rule: a secret is a house key, and the fastest way to lose it is to commit it. Now the practical question — *where does the key go instead?* The answer is a small, well-worn pattern that every professional project uses, and once you've set it up once, it becomes muscle memory. We'll build it up one layer at a time, and then face the uncomfortable case: what to do when a secret is already in your history.

## Layer 1: Move the secret out of the source

**What it actually is.** Instead of writing the key as a literal string in your code, you read it from the **environment** at runtime — the same `NAME=value` mechanism the operating system hands every process. Your code asks for `STRIPE_SECRET_KEY` by name; *where that value comes from* is decided outside the code.

The hardcoded version from Phase 1 becomes this:

```text
   // payment.js  — the secret is no longer in the file
   const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
```

Now the source code is safe to commit. It mentions the *name* of the secret, never the value. The value lives in the environment, and the environment is per-machine: your laptop, staging, and production each supply their own.

> 📝 If environment variables, `process.env`, and `.env` files are unfamiliar mechanics, the full walkthrough is in [Environment Variables & Config](/guides/env-vars-and-config). Here we're focused only on the *security* of them. The short version: an environment variable is a named value the OS gives your running program, and a `.env` file is a plain text file that loads a bunch of them at once for local development.

## Layer 2: The `.env` file — and keeping it out of Git

For local development you keep the actual values in a `.env` file, one per line:

```text
STRIPE_SECRET_KEY=sk_test_51H8xK2eZvKYlo3a9qN...
DATABASE_URL=postgres://app:hunter2@localhost:5432/myapp_dev
```

This file holds real, live secrets. So the single most important rule in this whole phase: **it must never enter Git.** You tell Git to ignore it by adding one line to a `.gitignore` file in your project root:

```text
.env
```

Then verify Git is actually ignoring it — don't assume, check:

```console
$ git status
On branch main
nothing to commit, working tree clean
```
*What just happened:* Even though `.env` exists on disk with your real keys inside it, it does not appear in `git status`. The `.gitignore` entry told Git to treat it as if it weren't there, so you cannot stage or commit it by accident. If `.env` *had* shown up in that list, it is **not** ignored yet — fix the `.gitignore` before you do anything else.

⚠️ **Gotcha — `.gitignore` only ignores files Git isn't already tracking.** If you committed `.env` *before* adding it to `.gitignore`, the ignore rule does nothing — Git keeps tracking the file it already knows. You have to explicitly untrack it:

```console
$ git rm --cached .env
rm '.env'
$ git commit -m "Stop tracking .env"
```
*What just happened:* `git rm --cached` removed `.env` from Git's tracking *without deleting it from your disk* (the `--cached` flag is the important part — your local file stays). From the next commit on, Git ignores it. But read the next section carefully, because this does **not** undo the fact that the secret was already committed.

## Layer 3: `.env.example` — so teammates know what's needed

Since `.env` itself never gets committed, a new teammate cloning the repo has no idea which variables to set. The convention that solves this is a committed companion file, **`.env.example`**, that lists every variable *name* with placeholder or blank values — never real ones:

```text
STRIPE_SECRET_KEY=your_stripe_test_key_here
DATABASE_URL=postgres://user:password@localhost:5432/dbname
```

This file is safe to commit precisely because it contains no real secrets — just the shape of what's needed. The onboarding ritual becomes: copy `.env.example` to `.env`, then fill in the real values you've been given. New developer productive in two minutes, zero secrets in the repo.

💡 **Key point.** The split is the whole trick: **`.env` is real and ignored; `.env.example` is fake and committed.** One tells your app what to do; the other tells your teammates what to fill in.

## Layer 4: A pre-commit secret scanner — a net under the trapeze

The pattern above relies on you remembering. Humans forget — especially the day you paste a key "just to test something fast." A **pre-commit secret scanner** is an automated check that runs *before* each commit is recorded and refuses the commit if it spots something that looks like a secret.

Two common tools are [git-secrets](https://github.com/awslabs/git-secrets) and [gitleaks](https://github.com/gitleaks/gitleaks); they're often wired in via the [pre-commit](https://pre-commit.com/) framework. The exact setup varies, but the experience you want looks like this:

```console
$ git commit -m "Add payment retry logic"
gitleaks: detected hardcoded secret in payment.js
  Rule:    stripe-access-token
  File:    payment.js
  Line:    14
gitleaks detected 1 leak — commit aborted
```
*What just happened:* The scanner ran automatically as part of the commit, recognized the pattern of a Stripe key sitting in `payment.js`, and **stopped the commit from being created at all.** Nothing entered Git. You delete the line, move the value to your `.env`, and commit again. The leak that would have cost you a bad week never happened — it was caught at the last possible safe moment.

This is a net, not a guarantee — scanners can miss novel patterns and occasionally flag harmless strings. But catching the obvious cases automatically, on every commit, dramatically lowers the odds of the classic mistake. Set it up once per repo (or globally) and forget about it.

## The hard truth: a committed secret lives in history forever

Now the part people most want to be untrue. Suppose you already committed a secret — maybe even pushed it. Your instinct is to delete the line, commit the fix, and feel relieved. **That relief is false.**

Git doesn't store files as a single "current" state; it stores **history** — every commit is a snapshot, and old snapshots don't disappear when you change the latest one. Deleting the secret in a new commit just means the *newest* snapshot no longer has it. The commit where you *added* it is still right there, one step back in the log, with the secret intact. Anyone can check out that older commit and read it.

```text
   commit C3  "Remove secret"      ← secret gone HERE...
        │
   commit C2  "Add payment logic"  ← ...but it's STILL RIGHT HERE,
        │                            full value, forever in history
   commit C1  "Initial commit"
```

And if you *pushed*, it's worse: the secret now exists in every clone anyone has made, and quite possibly in a scanning bot's database already. Even genuinely rewriting Git history to scrub it (a heavy, coordinated operation) can't recall the copies already out in the world.

⚠️ **Gotcha — removing the file is NOT enough. Rotate the secret.** Because you cannot reliably un-leak a value that reached a repository, the only real fix is to **rotate** it: go to the service, revoke the old key, and issue a new one. Once the old key is dead, it doesn't matter who has the old value — it unlocks nothing. Rotation is the lock-change for a lost house key. (For the Git-mechanics side of why `git revert` and even force-pushing don't erase a pushed secret, see [Git Disaster Recovery](/guides/git-disaster-recovery).)

🪖 **War story.** A teammate once committed a cloud access key, noticed an hour later, and pushed a commit deleting the line — then went home feeling responsible and tidy. The key was scraped and used to spin up servers for crypto mining before morning, racking up real charges, because the *deletion* commit changed nothing about the *addition* commit sitting one step back. The fix that would have ended it in thirty seconds was the one step skipped: revoke the key in the cloud console. Deleting the line treats the symptom; rotating treats the leak.

## Recap

1. **Read secrets from the environment**, never as literals in source: `process.env.STRIPE_SECRET_KEY`, not the key itself. The code may mention the *name*, never the value.
2. Keep real values in a **`.env` file** and add `.env` to **`.gitignore`** — then run `git status` to confirm it's actually ignored.
3. If `.env` was already committed, untrack it with `git rm --cached .env`. (Ignoring doesn't retroactively untrack.)
4. Commit a **`.env.example`** with placeholder values so teammates know what to set; never put real secrets in it.
5. Add a **pre-commit secret scanner** (gitleaks, git-secrets) as an automated net that blocks the commit before a leak happens.
6. ⚠️ A committed secret lives in **Git history forever** — deleting it from the latest commit is not enough. **Rotate it**: revoke the old value and issue a new one.

Next: how teams stop relying on `.env` files entirely and manage secrets centrally for production — with a cheat-card for the day one gets out.

---

[← Phase 1: What Counts as a Secret](01-what-counts-as-a-secret.md) · [Guide overview](_guide.md) · [Phase 3: Real Secrets Management →](03-real-secrets-management.md)
