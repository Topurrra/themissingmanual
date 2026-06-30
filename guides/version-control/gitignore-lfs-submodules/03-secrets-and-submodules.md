---
title: "Leaked secrets and the submodule trap"
guide: "gitignore-lfs-submodules"
phase: 3
summary: "Keep junk, secrets, and giant files out of your repo, and tame the submodule: the settings that stop you committing node_modules or a 2GB video."
tags: [git, gitignore, git-lfs, submodules, secrets, large-files]
difficulty: intermediate
synonyms: ["how to use gitignore", "stop tracking a file in git", "git ignore not working", "remove file from git but keep it", "git lfs large files", "what are git submodules", "git submodule detached head", "accidentally committed secret to git"]
updated: 2026-06-30
---

# Leaked secrets and the submodule trap

This is where the stakes get real. The two topics here are the ones that turn into incidents: a secret committed to history that you *thought* you removed, and a submodule that drops you into "detached HEAD" and quietly commits the wrong version of a nested repo. Both punish the casual fix. Let's handle them with eyes open.

## A committed secret is a leaked secret

Say you committed `.env` with a live database password, noticed, and ran `git rm --cached .env` from Phase 2. The file's gone from your *current* commit. Problem solved?

No. It's still sitting in history.

```bash
# The secret is still right there in the old commit
git log --all --oneline -- .env
git show <that-commit>:.env   # prints the password in full
```

*What just happened:* `git rm --cached` only stops *future* tracking. Every commit that ever included the file still contains it, byte for byte. Anyone with the repo - or anyone who already cloned it - can recover the secret. If the repo was ever pushed anywhere public, treat the secret as compromised the instant it landed.

So the first and most important step is the one that isn't a Git command at all:

> **Rotate the secret. Immediately.** Revoke the leaked key or change the password at its source. Scrubbing history is damage control; rotation is the actual fix, because you can never be sure who already grabbed the old value. Do this *first*, every time.

Only then is it worth scrubbing history, so the secret isn't lying around in old commits:

```bash
# git-filter-repo is the modern, recommended tool (install separately)
git filter-repo --invert-paths --path .env

# force-push the rewritten history (coordinate with your team first!)
git push --force
```

*What just happened:* `git filter-repo` rewrites every commit to remove `.env` from history entirely, as if it had never been committed. This **changes the hash of every affected commit**, which is why it needs a force-push and why it wrecks everyone else's clones - they'll have to re-clone or reset. It's a heavy, disruptive operation. That's exactly why keeping secrets out from the start (Phase 1) matters so much: getting them out is genuinely painful.

> Tools like `git secrets`, `gitleaks`, or a pre-commit hook can block a secret *before* it's ever committed. For anything beyond a solo hobby repo, this is worth setting up - see [/guides/git-with-other-people](/guides/git-with-other-people) for hooks and team workflow.

## Submodules: a repo inside a repo

A **submodule** lets you embed one Git repository inside another. The outer (parent) repo doesn't store the inner repo's files - it stores a *pointer to one specific commit* of the inner repo.

```bash
# Add a library as a submodule
git submodule add https://github.com/some/library.git vendor/library
```

*What just happened:* This clones the library into `vendor/library` and creates two things in the parent repo: a `.gitmodules` file (recording the submodule's URL and path) and a special entry that pins the submodule to the *exact commit* you added. From then on, the parent doesn't track the library's files - it tracks "the library, at commit abc123."

In a diff, that pointer is all you see:

```text
-Subproject commit a1b2c3d4...
+Subproject commit e5f6a7b8...
```

*What just happened:* When you update a submodule, the parent's diff is just this one cryptic line - the old pinned commit replaced by the new one. It looks like nothing changed, but you've actually moved the parent to depend on a different version of the nested repo. This terseness is a big part of why submodules confuse people.

## The detached-HEAD pain

Here's the trap that catches everyone. When Git checks out a submodule, it puts you at that *specific pinned commit* - not on a branch.

```bash
cd vendor/library
git status
# HEAD detached at a1b2c3d
```

*What just happened:* "Detached HEAD" means you're sitting on a commit directly, with no branch checked out. If you make changes and commit here, the commit isn't on any branch - and a later `git checkout` inside the submodule can leave it stranded and easy to lose. This is the classic way people "lose" submodule work: they edit inside a submodule, commit on a detached HEAD, and the parent never gets updated to point at it.

The safe workflow when you *do* need to change a submodule:

```bash
cd vendor/library
git checkout main          # get onto an actual branch first
# ...make your changes, commit, push the submodule...

cd ../..                   # back to the parent
git add vendor/library     # stage the new pointer
git commit -m "Bump library to include fix"
```

*What just happened:* You checked out a real branch *inside* the submodule before changing anything, so your commit lands somewhere findable. Then back in the parent, `git add vendor/library` records the new pinned commit, and committing that is what actually moves the parent's dependency forward. Skip that last step and your submodule change is invisible to teammates - they'll still get the old pinned commit.

And the move people forget after cloning a repo *with* submodules:

```bash
git clone <repo>
git submodule update --init --recursive
```

*What just happened:* A plain `git clone` brings down the parent and the empty submodule folders, but not the submodules' contents. `git submodule update --init --recursive` fetches each submodule at its pinned commit (and any submodules-of-submodules). Forget this and you'll find empty folders where the library should be - a very common "it works on my machine but not the build server" cause.

## When to use one - and when to run

Submodules are the right tool in a narrow set of cases:

- You need to pin a dependency to an *exact* commit and control upgrades deliberately.
- The nested repo is genuinely separate (different team, different release cycle) and you want to keep its history out of yours.

But for most situations, reach for something simpler first:

- **A package manager** (npm, Cargo, pip, Go modules) handles versioned dependencies far better - real version ranges, lockfiles, no detached-HEAD surprises. If your dependency is published as a package, use the package manager, not a submodule.
- **A monorepo** (one repo holding multiple projects) sidesteps the whole pointer-juggling problem when the projects are developed together.
- **Git subtree** is an alternative that vendors the code directly into your repo, trading the pinning model for simplicity.

> Rule of thumb: if you *can* express the relationship with a package manager, do that. Submodules earn their complexity only when you truly need commit-level pinning of a separate repository. Many teams adopt them, get bitten by detached HEAD and forgotten `submodule update` steps, and migrate away.

## For builders

If you inherit a project with submodules, put `git submodule update --init --recursive` in your setup script and your CI checkout step - it's the single most common reason a submodule project "won't build" on a fresh machine. And before adding a *new* submodule, ask the YAGNI question: would a package dependency do the job? Most of the time it would, with far less pain for everyone who clones after you.

```quiz
[
  {
    "q": "You committed a live API key, then ran `git rm --cached .env`. What is the FIRST thing you should do?",
    "choices": [
      "Force-push to overwrite the remote",
      "Rotate the secret - revoke or change the key at its source",
      "Add .env to .gitignore",
      "Run git filter-repo to scrub history"
    ],
    "answer": 1,
    "explain": "The key is still in history and may already have been copied. Rotation is the real fix; scrubbing history is only damage control and must come after rotating."
  },
  {
    "q": "What does the parent repository actually store for a submodule?",
    "choices": [
      "A full copy of the submodule's files",
      "A pointer to one specific commit of the submodule",
      "The submodule's entire history merged into its own",
      "Just the submodule's URL, nothing else"
    ],
    "answer": 1,
    "explain": "The parent pins the submodule to an exact commit. Its diff shows only the old and new 'Subproject commit' hashes, not the files."
  },
  {
    "q": "When is a submodule usually the WRONG choice?",
    "choices": [
      "When the dependency is published as a package you could install with a package manager",
      "When you need to pin a separate repo to an exact commit",
      "When the nested repo has a different release cycle",
      "When you want the nested repo's history kept out of yours"
    ],
    "answer": 0,
    "explain": "If a package manager can express the dependency, it does so far better (version ranges, lockfiles, no detached-HEAD pain). Submodules earn their complexity only for true commit-level pinning of a separate repo."
  }
]
```

[← Phase 2: Ignoring, untracking, and LFS for big files](02-ignoring-untracking-lfs.md) | [Overview](_guide.md)
