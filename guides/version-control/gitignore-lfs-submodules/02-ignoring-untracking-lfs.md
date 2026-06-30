---
title: "Ignoring, untracking, and LFS for big files"
guide: "gitignore-lfs-submodules"
phase: 2
summary: "Keep junk, secrets, and giant files out of your repo, and tame the submodule: the settings that stop you committing node_modules or a 2GB video."
tags: [git, gitignore, git-lfs, submodules, secrets, large-files]
difficulty: intermediate
synonyms: ["how to use gitignore", "stop tracking a file in git", "git ignore not working", "remove file from git but keep it", "git lfs large files", "what are git submodules", "git submodule detached head", "accidentally committed secret to git"]
updated: 2026-06-30
---

# Ignoring, untracking, and LFS for big files

Now the hands-on part. You know *why* an ignored-but-tracked file misbehaves. This phase is the muscle memory: how to write patterns that match what you mean, how to untrack a file without deleting it, and how to wire up LFS so a giant binary stops bloating your history. These are the moves you'll reach for weekly.

## Ignore patterns, decoded

A `.gitignore` is a list of patterns, one per line, matched against file paths relative to the file's location. Most of the syntax is intuitive once you've seen each piece once:

```text
node_modules/      # trailing slash → match directories only
*.log              # * matches anything except a slash
build/             # ignores a folder and everything in it
/secret.txt        # leading slash → only at repo root, not nested
**/temp            # ** matches across directories (any depth)
!keep.log          # leading ! → un-ignore (exception to a rule above)
# this is a comment
```

*What just happened:* Each pattern is a rule. The two that surprise people: a leading `/` anchors to the root (so `/secret.txt` ignores the root one but not `docs/secret.txt`), and a leading `!` *re-includes* a file an earlier pattern ignored. Order matters for `!` — the exception must come *after* the rule it overrides.

A common real pattern: ignore a whole folder but keep one file in it.

```text
logs/
!logs/.gitkeep
```

*What just happened:* `logs/` ignores everything in the folder, then `!logs/.gitkeep` carves out an exception so the empty-ish folder still exists in the repo. (Git won't commit empty folders, so people add a placeholder file like `.gitkeep` to force the folder to exist for everyone who clones.)

> One gotcha: `!` cannot re-include a file if its *parent directory* is ignored. `logs/` then `!logs/important.log` works, but if you ignore `logs/` you can't selectively un-ignore a file inside a *sub*-folder that's also blanket-ignored. Re-include the path step by step if you hit this.

## Untracking a file you already committed

This is the fix for the Phase 1 mystery. You committed `config.local.json`, *then* realized it shouldn't be tracked. Adding it to `.gitignore` did nothing because it's already in the index. You need to remove it from the index — but keep it on disk.

```bash
# Stop tracking the file, but DO NOT delete it from your folder
git rm --cached config.local.json

# Then add it to .gitignore so it stays out
echo "config.local.json" >> .gitignore

git commit -m "Stop tracking config.local.json"
```

*What just happened:* `git rm --cached` removes the file from the index (untracks it) while leaving the actual file untouched on your disk — that's what `--cached` means. Now the file is *untracked*, so the `.gitignore` rule finally applies and Git stops nagging you. Drop `--cached` and `git rm` would delete the file from disk too, which is usually not what you want here.

For a whole folder you committed by mistake (the classic `node_modules/`):

```bash
git rm -r --cached node_modules/
echo "node_modules/" >> .gitignore
git commit -m "Stop tracking node_modules"
```

*What just happened:* `-r` recurses into the folder. After this commit, the folder still sits on your disk (your app still runs), but it's gone from Git's tracking and won't come back. Teammates who pull this commit will have it untracked too.

> Important nuance: this stops *future* tracking, but the file still lives in past commits and in history. For build junk that's harmless. For a *secret*, it is not enough — the secret is still recoverable from history. That's the whole of Phase 3.

## When to reach for LFS

If a binary is large *and* you genuinely need it versioned (not ignored), use Git LFS. The mental model from Phase 1: LFS swaps the real bytes for a small text pointer in your repo, and stores the actual file on an LFS server (GitHub, GitLab, etc. provide this).

```text
What's in your commit:        What LFS stores elsewhere:
┌──────────────────────┐      ┌──────────────────────┐
│ video.mp4 (pointer)  │ ───→ │ video.mp4 (the real  │
│ ~130 bytes of text   │      │ 2GB of bytes)        │
└──────────────────────┘      └──────────────────────┘
```

*What just happened:* Your repo and its history stay small because they only ever hold tiny pointers. When someone checks out the commit, LFS fetches the real file behind the scenes. Clones are fast because they don't drag every version of every big file along.

Setting it up is three steps:

```bash
# 1. Install LFS for your user (once per machine)
git lfs install

# 2. Tell LFS which files to handle (writes to .gitattributes)
git lfs track "*.psd"
git lfs track "*.mp4"

# 3. Commit the .gitattributes file so teammates get the same rules
git add .gitattributes
git commit -m "Track PSD and MP4 files with LFS"
```

*What just happened:* `git lfs install` sets up the LFS hooks. `git lfs track` records a pattern in a file called `.gitattributes` — from now on any `*.psd` or `*.mp4` you add gets stored as an LFS pointer automatically. Committing `.gitattributes` is what makes it work for everyone, not just you. After this, you `git add` and `git commit` big files exactly as normal; LFS handles the swap invisibly.

You can confirm what LFS is managing:

```bash
git lfs ls-files
```

*What just happened:* This lists every file currently stored via LFS, with a short hash and the filename. If a file you expected isn't here, its pattern probably isn't in `.gitattributes`, or you tracked it *after* it was already committed normally (LFS tracking, like ignore, only catches files going forward).

## For builders

Decide your LFS rules at project start, the same as `.gitignore`. If your repo will hold design files, datasets, or media, run `git lfs track` and commit `.gitattributes` in the first commit — retrofitting LFS onto files already in history means rewriting history (the same painful operation as scrubbing a secret, covered next). One more rule of thumb: LFS is for *large binaries you need to version*, not a dumping ground. If a file is reproducible build output, ignore it instead — LFS storage isn't free and has quotas.

```quiz
[
  {
    "q": "You accidentally committed node_modules/. What command stops tracking it without deleting it from your disk?",
    "choices": [
      "git rm -r node_modules/",
      "git rm -r --cached node_modules/",
      "git ignore node_modules/",
      "rm -rf node_modules/"
    ],
    "answer": 1,
    "explain": "git rm -r --cached removes the folder from the index (untracks it) but leaves it on disk. Dropping --cached would delete the actual files too."
  },
  {
    "q": "In a .gitignore, what does a line beginning with `!` do?",
    "choices": [
      "Marks a high-priority ignore rule",
      "Re-includes (un-ignores) a file matched by an earlier rule",
      "Ignores the file only on the current branch",
      "Comments out the line"
    ],
    "answer": 1,
    "explain": "A leading ! creates an exception, re-including a file an earlier pattern ignored. It must come after the rule it overrides, and can't rescue a file inside a blanket-ignored parent directory."
  },
  {
    "q": "How does Git LFS keep your repository small when versioning a 2GB video?",
    "choices": [
      "It compresses the video on each commit",
      "It stores a small text pointer in the repo and keeps the real bytes on an LFS server",
      "It only commits the video once and ignores later changes",
      "It splits the video into smaller tracked chunks"
    ],
    "answer": 1,
    "explain": "LFS replaces the file content in your commit with a tiny pointer and stores the actual bytes elsewhere, so history and clones stay small."
  }
]
```

[← Phase 1: What Git tracks](01-what-git-tracks.md) | [Overview](_guide.md) | [Phase 3: Leaked secrets and the submodule trap →](03-secrets-and-submodules.md)
