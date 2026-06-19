---
title: "Putting It on GitHub — remote, push, and clone"
guide: "git-from-zero"
phase: 3
summary: "Create a GitHub repo, connect it with git remote add, get past the authentication step that stumps beginners, push your commits up, and clone an existing repo down."
tags: [git, github, remote, push, clone, authentication, pull]
difficulty: beginner
synonyms: ["how to push to github", "connect local repo to github", "git remote add origin", "github authentication failed", "how to clone a repo", "git push first time"]
updated: 2026-06-18
---

# Putting It on GitHub — remote, push, and clone

Your project lives on your computer with a full history. That's already real version control. But it's
only in one place — if your laptop dies, so does everything. And nobody else can see it. **GitHub fixes
both:** it keeps an online copy of your project, as a backup and as something you can share or collaborate
on.

This phase has one genuinely fiddly part — proving to GitHub that you're you. We'll go slow there, because
it's where almost everyone gets stuck, and it's not your fault: GitHub changed how this works a few years
ago and most old tutorials are now wrong.

## First, the picture

Remember from Phase 1: Git is the tool on your computer; GitHub is a website that hosts a copy. So you'll
have *two* copies of the project — yours, and GitHub's — and you'll **push** your commits up to keep
GitHub's copy in sync with yours.

```text
   YOUR COMPUTER                         GITHUB (github.com)
   ┌──────────────────┐                  ┌──────────────────┐
   │  hello-git repo  │  ── git push ──► │  hello-git repo  │
   │  (your commits)  │                  │  (the copy)      │
   └──────────────────┘                  └──────────────────┘
```

📝 **Terminology.** That online copy is called a **remote** — a copy of your repo that lives somewhere
else. By tradition, the main remote is nicknamed **origin**. So "push to origin" just means "send my
commits to the GitHub copy."

## Step 1: Make a GitHub account and an empty repo

1. Sign up at [github.com](https://github.com) if you don't have an account. Use the **same email** you
   gave Git in Phase 1.
2. Click the **+** in the top-right → **New repository**.
3. Name it `hello-git` (matching your folder keeps things clear).
4. Leave it **empty** — do *not* check "Add a README," "Add .gitignore," or a license. (Those create a
   commit on GitHub's side, which would clash with the history you already have locally. Starting empty
   avoids a confusing first-day conflict.)
5. Click **Create repository.**

GitHub now shows you a setup page with several commands. The section you want is **"…or push an existing
repository from the command line."** It contains your repo's address — a URL like
`https://github.com/ada/hello-git.git`. Keep that page open.

## Step 2: Connect your local repo to GitHub

Back in your terminal, inside the `hello-git` folder, tell Git the address of the remote:
```console
$ git remote add origin https://github.com/ada/hello-git.git
```
*What just happened:* Nothing printed — that's fine. You saved GitHub's URL under the nickname `origin`,
so from now on you can say "origin" instead of typing the whole address. Confirm it stuck:
```console
$ git remote -v
origin  https://github.com/ada/hello-git.git (fetch)
origin  https://github.com/ada/hello-git.git (push)
```
*What just happened:* Git listed your remotes. `origin` now points at your GitHub repo for both
downloading (`fetch`) and uploading (`push`). The connection exists; nothing has been sent yet.

## Step 3: The authentication part (read this slowly)

When you push, GitHub needs to confirm you're allowed to. **Here's the thing nobody tells beginners: you
cannot type your GitHub website password here.** GitHub removed password-over-the-command-line in 2021. If
you try, you'll get an error that literally says *"Support for password authentication was removed."* Many
older tutorials still tell you to type your password — they're out of date.

There are a few legitimate ways to authenticate. For someone starting out, the smoothest is the **GitHub
CLI**, a small official tool that handles the whole handshake through your browser. Install it from
[cli.github.com](https://cli.github.com), then run:
```console
$ gh auth login
? Where do you use GitHub? GitHub.com
? What is your preferred protocol for Git operations? HTTPS
? Authenticate Git with your GitHub credentials? Yes
? How would you like to authenticate GitHub CLI? Login with a web browser

! First copy your one-time code: ABCD-1234
Press Enter to open github.com in your browser...
✓ Authentication complete.
✓ Configured git protocol
```
*What just happened:* You proved who you are by signing in through the browser — the same way you log into
any website — and `gh` saved that approval on your computer. Git will now use it automatically every time
you push. You only do this once per machine.

> **Other paths, briefly.** On Windows, the Git installer bundles a "credential manager" that pops up a
> browser sign-in the *first* time you push — so you may not need `gh` at all; just try Step 4 and follow
> the prompt. Two more options you'll hear about: a **Personal Access Token** (a long password-like string
> you generate in GitHub's settings and paste when asked) and **SSH keys** (a more permanent setup). All
> of them work; `gh auth login` is the least painful on day one. Setting up SSH keys is worth doing
> eventually — that's a topic for a later guide.

## Step 4: Push

Now send your commits up:
```console
$ git push -u origin main
Enumerating objects: 6, done.
Counting objects: 100% (6/6), done.
Writing objects: 100% (6/6), 512 bytes | 512.00 KiB/s, done.
Total 6 (delta 0), reused 0 (delta 0)
To https://github.com/ada/hello-git.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```
*What just happened:* Git uploaded your commits to GitHub. Reading the key lines: `[new branch] main ->
main` means GitHub now has your `main` and its full history, and the last line means your local `main` is
now *linked* to GitHub's — that's what `-u` did. Because of that link, from now on you can just type
`git push` (no extra words) to send future commits.

**Go look.** Refresh your GitHub repo page in the browser. There's `hello.txt`, your commit messages,
your history — the same project, now safely online. That's the whole goal of this phase, done.

## The daily loop, now with a remote

With GitHub connected, your everyday rhythm gains one step at the end:
```console
$ echo "Third line." >> hello.txt
$ git add hello.txt
$ git commit -m "Add a third line"
$ git push
```
*What just happened:* The familiar `edit → add → commit` from Phase 2, then `push` to mirror it to GitHub.
Commit as often as you like locally; push when you want the online copy caught up.

There's a partner command, `git pull`, which does the reverse — it **downloads** commits from GitHub into
your copy. You reach for it when work shows up on GitHub that you don't have yet (most often because a
teammate pushed, or you committed from another computer). The deeper mechanics of `pull` live in the
[next guide](/guides/git-explained-like-a-human); for now, "`push` sends up, `pull` brings down" is
enough.

## Cloning — getting a repo you don't have yet

The flip side of all this: when a project *already* exists on GitHub and you want it on your machine, you
**clone** it. This is how you'd download your own repo onto a second computer, or grab someone else's
project:
```console
$ git clone https://github.com/ada/hello-git.git
Cloning into 'hello-git'...
remote: Enumerating objects: 6, done.
remote: Total 6 (delta 0), reused 0 (delta 0)
Receiving objects: 100% (6/6), done.
```
*What just happened:* `git clone` created a `hello-git` folder, downloaded the entire project *and its full
history*, and even set up `origin` for you automatically. A clone is ready to go — no `init`, no `remote
add` needed.

⚠️ **Gotcha.** If a `push` ever gets rejected with `Updates were rejected ... fetch first`, it means
GitHub's copy has commits yours doesn't (you probably added that README on the website after all, or
pushed from elsewhere). Git is refusing to overwrite work you haven't seen — which is it protecting you,
not breaking. Run `git pull` to bring those commits down, then `git push` again. It's in the
[Phase 4 cheat-card](04-first-day-snags.md).

## Recap

1. A **remote** is an online copy of your repo; the main one is nicknamed **origin**.
2. **`git remote add origin <url>`** connects your local repo to a GitHub repo.
3. You **can't** use your website password on the command line — authenticate with `gh auth login` (or
   the credential-manager browser pop-up, a token, or SSH).
4. **`git push`** sends your commits up; **`git pull`** brings new ones down.
5. **`git clone <url>`** downloads an existing repo, history and all.

You can now go from an empty folder to a backed-up, shareable project online. That's the entire core
workflow. The last phase is your safety net: the small errors that ambush beginners, and the calm fix for
each.

---

[← Phase 2: Your First Repository](02-your-first-repository.md) · [Guide overview](_guide.md) · [Phase 4: When the First Day Goes Sideways →](04-first-day-snags.md)
