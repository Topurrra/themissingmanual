---
title: "Permissions & Ownership"
guide: "the-filesystem-explained"
phase: 2
summary: "Every file has an owner and rules for who can read, write, or run it; 'permission denied' means you tried to do something the rules don't allow you to - and that's a protection, not a punishment."
tags: [filesystem, permissions, ownership, rwx, chmod, permission-denied, security]
difficulty: beginner
synonyms: ["what does permission denied mean", "what are file permissions", "what is rwx", "unix file permissions explained", "what does chmod do", "file owner group others", "windows acl permissions"]
updated: 2026-07-10
---

# Permissions & Ownership

Sooner or later the filesystem tells you "permission denied," and it feels like the computer is being
difficult on purpose. It isn't. Every file carries rules about who's allowed to touch it, and once you can
read those rules, that error stops being a wall and becomes a clear, fixable message.

## Why permissions exist at all

**What it actually is.** A shared computer holds things that shouldn't be freely editable by everyone: the
system's own configuration, other users' private files, the programs that keep the machine running.
Permissions are the filesystem's answer to a question asked on *every single file access*: "is this person
allowed to do this?"

**Why this matters.** Without permissions, any program you ran - or any other user on the machine - could
overwrite the OS, read your private documents, or delete someone else's work. "Permission denied" is usually
the system doing its job: stopping a mistake or a security hole.

💡 **Key point.** "Permission denied" is not a bug and rarely a glitch. It means: *the rules on this file don't grant you what you just tried to do.* The fix is always one of three things - do it as a user who's allowed, change the file's rules, or accept that you shouldn't be doing it.

## The two questions: who owns it, and who can do what

Every file answers two things. First, **who owns it** - on Unix systems that's an *owner* (one user) and a *group* (a named set of users). Second, **what's allowed**, broken into three actions for three audiences.

The three actions:

```text
   r  = read     → look at the file's contents (or list a folder's contents)
   w  = write    → change the file (or add/remove things in a folder)
   x  = execute  → run the file as a program (or enter/pass through a folder)
```

The three audiences, in order:

```text
   user    → the single owner of the file
   group   → everyone in the file's group
   others  → everybody else on the machine
```

📝 **Terminology.** This is the **rwx model**: read / write / execute, granted separately to **user, group, and others**. Almost every permission question on macOS and Linux comes down to reading this little grid.

## Reading `ls -l` - the permission line decoded

**What it does in real life.** Add `-l` ("long" format) to `ls` and the filesystem shows you the rules. Here's the line that confuses everyone the first time, fully annotated:

```console
$ ls -l notes.txt
-rw-r--r--  1  ada  staff  1048  Jun 19 09:14  notes.txt
```
*What just happened:* you asked for the detailed listing of one file. That cryptic `-rw-r--r--` is the
permission grid, and `ada` / `staff` are the owner and group. Here's how to read it:

```text
   -  rw-  r--  r--   1   ada   staff   1048   Jun 19 09:14   notes.txt
   │  │    │    │          │     │       │      │              │
   │  │    │    │          │     │       │      │              └ file name
   │  │    │    │          │     │       │      └ last modified
   │  │    │    │          │     │       └ size in bytes
   │  │    │    │          │     └ group that owns it
   │  │    │    │          └ user who owns it
   │  │    │    └ OTHERS can: read only (r--)
   │  │    └ GROUP can: read only (r--)
   │  └ USER (ada) can: read and write (rw-), but not execute
   └ type: "-" = file, "d" = directory
```

In plain English: `ada` can read and edit this file; everyone else can only read it; nobody can run it as a
program (it's text, not a program - `x` is off everywhere). That single line answers "why can't my coworker
edit this?" before they even ask.

Now a folder and a program for contrast:

```console
$ ls -l
drwxr-xr-x  4  ada  staff   128  Jun 18 17:02  projects
-rwxr-xr-x  1  ada  staff  9216  Jun 10 11:30  deploy.sh
```
*What just happened:* the leading `d` on `projects` marks it a directory, and its `x` bits mean people are
allowed to *enter* it (for folders, `x` means "pass through," not "run"). `deploy.sh` has `x` set for
everyone, so it's a file meant to be run as a program - what makes a script executable.

⚠️ **Gotcha - `x` means different things for files and folders.** On a *file*, `x` = "run this as a
program." On a *folder*, `x` = "you may enter it." A folder you can read (`r`) but not enter (`x`) will let
you see the names inside but not open them - baffling until you know this rule.

## "Permission denied" - what it really means

**What it does in real life.** Here's the error in the wild, and the calm read of it:

```console
$ echo "edit" >> /etc/hosts
bash: /etc/hosts: Permission denied
```
*What just happened:* you tried to *write* to `/etc/hosts`, a system file owned by the administrator. Your
user has read but not write permission on it, so the filesystem refused before changing a single byte.
Nothing broke - the rule held.

The honest fix on Unix is to act as the administrator for that one command using `sudo` ("do this as the
superuser"). To actually change a system file, open it as the administrator - for example with a terminal
editor:

```console
$ sudo nano /etc/hosts
[sudo] password for ada:
```
*What just happened:* `sudo` asked for your password and, because you're allowed to use it, opened
`/etc/hosts` as the administrator - who *does* have write permission. `sudo` runs one command with full
rights; that's how you cross the permission line on purpose. (Why not `sudo echo "edit" >> /etc/hosts`? The
`>>` redirect is handled by your *shell*, running as you, *before* `sudo` ever starts - so it still hits
"permission denied." Editing the file as above sidesteps the trap.)

⚠️ **Gotcha.** Reflexively slapping `sudo` on everything to make errors disappear is how people accidentally
damage their system or end up owning files as `root` that they can no longer edit normally. If a normal
action needs `sudo`, pause and ask *why* this file is protected before forcing past it.

## Changing the rules: `chmod` and `chown`

**What it actually is.** `chmod` ("change mode") edits the rwx rules; `chown` ("change owner") changes who owns the file. You mostly reach for `chmod` to make a script runnable:

```console
$ chmod +x deploy.sh
$ ls -l deploy.sh
-rwxr-xr-x  1  ada  staff  9216  Jun 10 11:30  deploy.sh
```
*What just happened:* `chmod +x` turned on the execute bit. Before, the file was just text the system wouldn't run; now the `x`s are present and you can run it as a program. This is the single most common reason a beginner reaches for `chmod` - "permission denied" when trying to run their own script.

## A short note on Windows

Windows reaches the same goal - controlling who can do what - by a different, more detailed road called
**ACLs** (Access Control Lists). Instead of three audiences (user/group/others) with three bits each, an
ACL is a *list* of entries, each naming a specific user or group and spelling out exactly what they may do
(read, write, modify, full control, and more).

📝 **Terminology.** An *ACL* is a per-file list of "who → what they're allowed." It's more granular than
Unix rwx, which is why Windows permissions are usually managed through the file's **Properties → Security**
dialog rather than a single readable line. The mental model is identical: a file knows its owner, and it
knows the rules for who may touch it.

## Recap

1. Permissions exist to **safely share one machine** - they answer "is this person allowed to do this?" on every file access.
2. Unix files carry an **owner** and **group**, plus **rwx** (read / write / execute) for **user, group, and others**.
3. `ls -l` shows the rules; read the line left to right - type, then three triplets of rwx.
4. **`x` means "run" on a file but "enter" on a folder** - a classic source of confusion.
5. **"Permission denied"** means the rules didn't grant your action; cross the line *on purpose* with `sudo` (carefully), or change the rules with `chmod` / `chown`.
6. **Windows uses ACLs** for the same idea - more detailed lists, same goal.

Next, we'll connect the tree and the rules to what actually happens when you open a file - plus hidden files, what extensions really are, and how to find anything on the disk.

---

[← Phase 1: What a Filesystem Is](01-what-a-filesystem-is.md) · [Guide overview](_guide.md) · [Phase 3: Where Things Live & Finding Them →](03-where-things-live.md)

## Try it yourself

Toggle the permission bits and watch the octal (e.g. `755`) and `rwx` string update:

```playground-chmod
```
