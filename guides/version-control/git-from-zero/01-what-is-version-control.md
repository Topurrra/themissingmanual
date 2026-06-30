---
title: "What Version Control Even Is (and Getting Git Installed)"
guide: "git-from-zero"
phase: 1
summary: "Version control is named save-points for your whole project; Git is the tool, GitHub is a website that hosts copies; install Git and tell it who you are."
tags: [git, version-control, github, install, setup, config]
difficulty: beginner
synonyms: ["what is version control", "difference between git and github", "how to install git", "git config user name email", "set up git first time"]
updated: 2026-06-18
---

# What Version Control Even Is (and Getting Git Installed)

Before we touch a single command, let's clear up what this thing *is* - because if you don't know what
problem Git solves, every command will feel like a magic word you're scared to get wrong.

So: what's the problem?

## The problem version control actually solves

You're working on something. It works. You want to change it - but you're afraid that if the change
breaks everything, you won't be able to get back to the version that worked. So you do what everyone
does: you copy the whole folder and name it `project-backup`. Then `project-backup-2`. Then
`project-final`. Then `project-final-ACTUALLY-final`.

And when a teammate emails you *their* copy, now there are two histories and no way to safely combine
them. You're manually comparing files at midnight trying to figure out whose version is right.

**That entire mess is what version control was invented to delete.**

**What version control actually is.** It's a tool that takes named snapshots of your *whole project* and
remembers every one of them, forever. Think of save points in a video game - except *you* decide when to
save, *you* write a note on each save ("beat the boss," "fixed the login bug"), and you can return to any
save you've ever made. No more copied folders. The folder stays one folder; the history lives quietly
alongside it.

It does one more thing the copied-folders approach never could: it lets several people work on the same
project and combine their work intelligently, instead of overwriting each other.

📝 **Terminology.** *Version control* (also called *source control*) is the general idea. *Git* is the
specific, wildly popular tool that does it. When people say "the repo," they mean a project that Git is
tracking. We'll define "repo" properly in [Phase 2](02-your-first-repository.md).

## Git is not GitHub (this trips up everybody)

You will hear "Git" and "GitHub" used almost interchangeably, and it causes real confusion on day one.
They are two different things:

```text
   GIT                                   GITHUB
   ─────────────────────────             ─────────────────────────
   A program on your computer.           A website (github.com).
   Takes the snapshots.                  Stores copies of your project
   Works with zero internet.             online so you (and others)
                                         can access and share them.

   The tool.                             A place to keep a copy of
                                         what the tool produces.
```

A useful comparison: **Git is like a word processor; GitHub is like Google Drive.** One creates and
manages the work on your machine; the other is a place on the internet to store and share it. There are
other such websites (GitLab, Bitbucket) - GitHub is just the most common. You can use Git completely on
your own with no account anywhere, which is exactly what we'll do in Phase 2. GitHub doesn't enter the
picture until [Phase 3](03-putting-it-on-github.md).

💡 **Key point.** Git lives on your computer and does the real work. GitHub is an optional online home
for a copy of it. Get this distinction now and half of the early confusion never happens.

## Step 1: Install Git

Git is a small free program. Installing it is the same as installing any app - find your operating system
below.

**Windows.** Download the installer from [git-scm.com/download/win](https://git-scm.com/download/win) and
run it. The default options are fine - keep clicking Next. This also installs a terminal called **Git
Bash**, which is where you'll type the commands in this guide.

**macOS.** Open the **Terminal** app (press `Cmd-Space`, type "Terminal", hit Enter) and type
`git --version`. If Git isn't installed yet, macOS offers to install the developer command-line tools for
you - accept it. (If you use [Homebrew](https://brew.sh), `brew install git` works too.)

**Linux (Debian/Ubuntu).** Open a terminal and run:
```console
$ sudo apt update && sudo apt install git
```
On Fedora it's `sudo dnf install git`. (`sudo` means "do this as administrator"; it'll ask for your
password.)

## Step 2: Check it worked

Open your terminal (Git Bash on Windows; Terminal on macOS/Linux) and type:
```console
$ git --version
git version 2.43.0
```
*What just happened:* You asked Git to report its version, and it answered. The exact number doesn't
matter - any answer at all means Git is installed and your terminal can find it. (If instead you got
`command not found` or `'git' is not recognized`, see [Phase 4](04-first-day-snags.md) - it's a common,
fixable first stumble.)

## Step 3: Tell Git who you are

This is the one setup step everyone skips and then trips over. Remember that every snapshot gets a note?
It also gets *signed* with your name and email, so that later - especially when working with others -
history shows who made each change. Git refuses to take its first snapshot until you've told it who you
are.

You only do this once per computer. Type these two lines, with your own name and email:
```console
$ git config --global user.name "Ada Lovelace"
$ git config --global user.email "ada@example.com"
```
*What just happened:* Nothing printed, and that's correct - these commands save your settings quietly.
`--global` means "use this for every project on this computer," so you never have to repeat it. Use the
same email you'll later use for GitHub; it makes your commits line up with your account.

While you're here, set the default name for the starting branch to `main` (the modern standard - don't
worry about what a branch is yet):
```console
$ git config --global init.defaultBranch main
```

To confirm it all saved:
```console
$ git config --global --list
user.name=Ada Lovelace
user.email=ada@example.com
init.defaultBranch=main
```
*What just happened:* Git read back the settings you just stored. Seeing your name and email here means
you're fully set up.

⚠️ **Gotcha.** If you skip this step, your very first commit in Phase 2 fails with `Author identity
unknown / Please tell me who you are`. It looks alarming but means only this: you haven't run the two
`config` commands above. Run them and try again. (It's in the Phase 4 cheat-card too.)

## Recap

1. **Version control** = named save-points for your whole project, kept forever, plus a sane way to
   combine work from multiple people.
2. **Git** is the tool on your computer; **GitHub** is an optional website that hosts copies. Not the
   same thing.
3. You **installed Git** and proved it with `git --version`.
4. You **told Git who you are** with `git config --global user.name`/`user.email` - required before your
   first commit.

Your machine is ready. Next, you'll make an actual project and take your first snapshot - entirely
offline, no GitHub needed yet.

---

[← Guide overview](_guide.md) · [Phase 2: Your First Repository →](02-your-first-repository.md)
