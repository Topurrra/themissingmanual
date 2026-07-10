---
title: "When the First Day Goes Sideways - Beginner Errors, Calmly Fixed"
guide: "git-from-zero"
phase: 4
summary: "The handful of errors that ambush every Git beginner - command not found, identity unknown, auth failed, rejected push, stuck in Vim - each with a calm one-line fix and why it happened."
tags: [git, errors, troubleshooting, authentication, beginner, fixes]
difficulty: beginner
synonyms: ["git command not found", "git author identity unknown", "git authentication failed", "updates were rejected fetch first", "how to exit vim git commit", "fatal not a git repository"]
updated: 2026-07-10
---

# When the First Day Goes Sideways - Beginner Errors, Calmly Fixed

Every single person who learns Git hits a few of these in their first week. They look like cryptic
failures; they're really just Git telling you one specific thing is missing or out of place. None of them
mean you broke anything. Find your error below, breathe, apply the fix, and read the short *why* so it
won't rattle you next time.

## The cheat-card

> **Match the message you got to the row, then read the section under it.**

| The error you're seeing | The calm fix |
|---|---|
| `git: command not found` / `'git' is not recognized` | Git isn't installed or the terminal can't find it - reopen the terminal, or reinstall (§1) |
| `Author identity unknown` / `Please tell me who you are` | Set your name and email once (§2) |
| `fatal: not a git repository` | You're not inside a repo folder - `cd` into it, or `git init` (§3) |
| `Support for password authentication was removed` / `Authentication failed` | Don't use your password - authenticate properly (§4) |
| `Updates were rejected ... fetch first` | GitHub has commits you don't - `git pull`, then push (§5) |
| Stuck in a weird full-screen editor after `git commit` | You're in Vim - type `:q!` then Enter to escape (§6) |
| `warning: LF will be replaced by CRLF` (Windows) | Harmless line-ending notice - you can ignore it (§7) |
| Committed the wrong file (and haven't pushed) | Undo the last commit but keep your work (§8) |

---

## 1. `git: command not found`

**What you'll see.** You type `git --version` and get `command not found` (macOS/Linux) or `'git' is not
recognized as an internal or external command` (Windows).

**What it means.** Your terminal can't find the Git program - either it isn't installed, or it was
installed after this terminal window opened and it doesn't know about it yet.

**The calm fix.** First, **close the terminal completely and open a new one** - this alone fixes it
surprisingly often. Still failing? Reinstall Git from [Phase 1](01-what-is-version-control.md), and on
Windows use **Git Bash** (which comes with Git) rather than the default Command Prompt.

## 2. `Author identity unknown`

**What you'll see.**
```console
$ git commit -m "My first commit"
Author identity unknown

*** Please tell me who you are.

Run

  git config --global user.email "you@example.com"
  git config --global user.name "Your Name"

fatal: unable to auto-detect email address
```

**What it means.** Every commit is signed with a name and email, and you haven't told Git yours yet
(this is the Phase 1 setup step) - Git won't take the snapshot until you do.

**The calm fix.** Run the two lines Git is literally suggesting, with your details, then commit again:
```console
$ git config --global user.name "Ada Lovelace"
$ git config --global user.email "ada@example.com"
$ git commit -m "My first commit"
```
*What just happened:* You set your identity once, for every project on this machine, and the commit that
failed now succeeds. Your staged work was never lost - it waited in the box the whole time.

## 3. `fatal: not a git repository`

**What you'll see.** Almost any Git command answers with `fatal: not a git repository (or any of the
parent directories): .git`.

**What it means.** You're standing in a folder Git isn't tracking - no `.git` in it or any folder above
it. Usually you opened the terminal somewhere else, or never ran `git init` here.

**The calm fix.** If the repo exists, move into it. If this is a brand-new project, initialize it:
```console
$ cd path/to/your/project    # go into the repo, OR
$ git init                   # if this folder should be a new repo
```
*What just happened:* Git commands only work *inside* a repository. `cd` puts you in an existing one;
`git init` makes the current folder into one. Run `git status` afterward to confirm.

## 4. `Authentication failed` when pushing

**What you'll see.**
```console
remote: Support for password authentication was removed on August 13, 2021.
fatal: Authentication failed for 'https://github.com/ada/hello-git.git/'
```

**What it means.** You tried to push and either entered your GitHub website password (no longer works on
the command line) or haven't set up authentication at all. This is the single most common first-push
wall - old tutorials still tell people to type their password.

**The calm fix.** Authenticate the modern way. The smoothest is the GitHub CLI:
```console
$ gh auth login
```
Follow the browser sign-in (full walkthrough in [Phase 3, Step 3](03-putting-it-on-github.md)), then push
again. On Windows, retrying the push may pop up a browser sign-in from the bundled credential manager -
let it. A Personal Access Token or SSH key also work; you only need one.

## 5. `Updates were rejected (fetch first)`

**What you'll see.**
```console
$ git push
 ! [rejected]        main -> main (fetch first)
error: failed to push some refs to 'https://github.com/ada/hello-git.git'
hint: Updates were rejected because the remote contains work that you do
hint: not have locally.
```

**What it means.** GitHub's copy has at least one commit your computer doesn't - often because you
checked "Add a README" when creating the repo, or pushed from another machine. Git refuses to overwrite
history you haven't seen. **This is a safety feature, not a failure.**

**The calm fix.** Bring GitHub's commits down, then push:
```console
$ git pull
$ git push
```
*What just happened:* `git pull` merged the missing commit(s) into your copy so both sides agree, and the
push then succeeds. (If `pull` asks you to pick a merge strategy or drops you into an editor, the
[next guide](/guides/git-explained-like-a-human) covers it - for now, accepting the default is fine.)

## 6. Trapped in a full-screen editor after `git commit`

**What you'll see.** You ran `git commit` with no `-m`, and your terminal filled with a cryptic text
screen showing lines starting with `#`, and nothing you type seems to work normally.

**What it means.** Git opened an editor - usually **Vim** - for you to type a commit message, and Vim
doesn't behave like a normal text box. It's not broken; it just has its own rules, and nobody warned you.

**The calm fix.** To leave *without* committing: press `Esc`, then type `:q!` and press Enter.
```text
   Esc        ← make sure you're not in "typing" mode
   :q!        ← type these three characters
   Enter      ← and press Enter - you're out
```
Then run the command again *with* a message to skip the editor entirely:
```console
$ git commit -m "Your message here"
```

## 7. `warning: LF will be replaced by CRLF` (Windows)

**What you'll see.** On Windows, `git add` prints `warning: LF will be replaced by CRLF in hello.txt`.

**What it means.** Windows and macOS/Linux mark the end of a line of text differently, and Git is just
*telling you* it's smoothing that over. It's a **warning, not an error** - your file is fine and your
commit will work.

**The calm fix.** Nothing required - safe to ignore.

## 8. "I committed the wrong file" (and haven't pushed yet)

**What you'll see.** No error - just the sinking realization that your last commit included something it
shouldn't have (a giant file, a password, the wrong thing entirely), and you haven't pushed it anywhere
yet.

**What it means.** The commit is only on your machine, so it's easy to take back. You want to undo the
*commit* while keeping your *files* exactly as they are, so you can re-stage and commit correctly.

**The calm fix** (only for a commit you have **not** pushed):
```console
$ git reset --soft HEAD~1
```
*What just happened:* This rewound the last commit, putting all of its changes back into the staging box,
untouched - as if you'd never hit commit. Remove what shouldn't be there (`git restore --staged <file>`
takes a file out of the box) and commit again. To stop a file from ever being committed, list its name in
a `.gitignore` file.

⚠️ **One caution.** That `--soft` form keeps your work safe. Its cousin `git reset --hard` *deletes*
changes - don't reach for that one while you're still learning. And this trick is for commits that exist
only on your computer; undoing something already *pushed* is a more careful operation covered in a later
guide.

---

## You made it through the first day

You installed Git, made a repository, took your first snapshots, put them on GitHub, and learned to read
errors instead of fearing them. That's the hardest part - the cold start - and it's behind you now. From
here, the same `edit → add → commit → push` loop carries you a very long way.

**Where to go next.** You can now *do* the everyday moves. The natural next step is understanding what Git
is doing underneath them - why branches aren't scary, what HEAD means, how to fix the bigger "oh no"
moments calmly. That's the next guide:
**[Git, Explained Like You're a Human](/guides/git-explained-like-a-human)**.

---

[← Phase 3: Putting It on GitHub](03-putting-it-on-github.md) · [Guide overview](_guide.md)
