---
title: "Users, Permissions, and sudo"
guide: "linux-from-zero"
phase: 3
summary: "Root is the all-powerful admin user you don't log in as; sudo lets your normal user borrow root's power for one command; and every file's rwx permissions for owner/group/others decide who can do what."
tags: [linux, users, root, sudo, permissions, rwx, chmod, security]
difficulty: beginner
synonyms: ["what is root in linux", "what does sudo do", "why not run as root", "linux file permissions explained", "what does rwx mean", "permission denied linux", "chmod explained"]
updated: 2026-06-19
---

# Users, Permissions, and sudo

You typed `sudo apt install` in the last phase and it worked, but maybe a small voice asked: *what is
sudo, and why did installing software need it when listing files didn't?* That voice is onto something
real. Linux is built, from the ground up, around the idea that **not everyone is allowed to do everything**
- and once you understand that, half of Linux's "why won't it let me?" moments turn into "oh, of course."

This phase is the mental model behind every `permission denied` you'll ever see.

## Two kinds of user: you, and the one who can do anything

**What it actually is.** Linux is **multi-user** from its core. Every account on the machine is a separate
user with its own files and its own limits. But one user stands above all the rest:

- **Normal users** - like `ada`. You own your files under `/home/ada`, you can run programs, but you
  *can't* touch the system's vital parts (you can't edit other people's files, change system config in
  `/etc`, or install system-wide software) without explicit permission.
- **root** - the **superuser**, the administrator with no limits. root can read, change, or delete *any*
  file on the machine, install or remove anything, and reconfigure the whole system. root is allowed to do
  everything - *including* break everything.

📝 **Terminology.** *root* (the user) = the all-powerful administrator account, also called the
*superuser*. (Don't confuse it with root the *folder*, `/`, from Phase 2 - same word, different thing.)

## Why you don't just log in as root

It's tempting to think: "if root can do everything, why not just *be* root and skip the permission
hassles?" Here's why that's a genuinely bad idea, and why every careful Linux user avoids it:

When you're root, **nothing protects you from yourself**. A typo in a command can delete the entire system,
because root is allowed to delete the entire system. A program you run while root has the power to do
anything *you* could - so a malicious or buggy program gets the keys to everything. The permission walls
that would normally stop a mistake from spreading are gone, because root is exempt from all of them.

The whole design intention is this: **work as a normal user, where mistakes stay small and local, and only
reach for root power for the specific moment you need it.** Your day-to-day account is a room with sensible
walls. You don't tear the walls down; you step through a door when you have a reason, then step back.

💡 **Key point.** "Don't run as root" isn't superstition or gatekeeping. It's the seatbelt principle: stay
in the safe seat by default, so an ordinary mistake stays ordinary instead of catastrophic.

## `sudo`: borrow root's power for exactly one command

So how do you do the occasional admin task without *being* root? You use **`sudo`**.

**What it actually is.** `sudo` means roughly "**s**uper**u**ser **do**": run *this one command* with
root's power, just this once, then drop straight back to being your normal self. You stay logged in as you;
you temporarily borrow the authority for a single command.

**What it does in real life.** When you put `sudo` in front of a command, Linux pauses and asks for *your*
password to confirm it's really you, then runs that one command as root. The moment it finishes, you're an
ordinary user again. This is why installing software needed `sudo` (it changes the whole system) but listing
files didn't (reading your own folder is within a normal user's rights).

**A real example.** Watch the difference. First, try an admin action *without* `sudo`:
```console
$ apt install tree
E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)
E: Unable to acquire the dpkg frontend lock. Are you root?
```
*What just happened:* As a normal user you asked to change system-wide software, and Linux refused -
`Permission denied`, and it even hints `Are you root?`. You don't have the authority for this on its own.
Nothing broke; the wall did its job.

Now the same thing *with* `sudo`:
```console
$ sudo apt install tree
[sudo] password for ada:
Reading package lists... Done
...
Setting up tree (2.0.2-1) ...
```
*What just happened:* `sudo` asked for *your* password (not a separate root password), confirmed you're
allowed to use admin powers, and ran that single command as root. After it finished, you were instantly
back to being plain `ada`. You borrowed the power for one command and gave it right back.

⚠️ **Gotcha.** `sudo` asks for *your own* password, not a special "root password" - and as you type it,
**nothing appears on screen**, no dots, no stars. That's deliberate (so onlookers can't even see the
length), not a frozen terminal. Type it and press Enter. After a successful `sudo`, it usually won't ask
again for a few minutes.

⚠️ **The big caution.** `sudo` hands a command root's full power, so a careless `sudo` command can do real
damage that a non-`sudo` one couldn't. Treat every `sudo` line as "I'm about to act as the administrator -
do I actually understand what this does?" The classic disaster is pasting a `sudo` command from a random
website without reading it. The fix isn't fear; it's attention.

## File permissions: who can do what

The other half of "Linux won't let me" is **file permissions** - the rules attached to every single file
and folder saying who's allowed to do what with it.

**What it actually is.** Every file carries an **owner** (usually whoever created it) and is associated
with a **group** (a named set of users). The file then grants three kinds of access - separately to the
owner, to the group, and to **everyone else**:

- **r** - **read**: look at the file's contents (or list a folder's entries).
- **w** - **write**: change the file (or add/remove files in a folder).
- **x** - **execute**: run the file as a program (or, for a folder, *enter* it).

📝 **Terminology.** *Owner* = the user who owns the file. *Group* = a named collection of users who can be
given shared access. *Others* = everyone else on the system. Each gets its own r/w/x settings.

**A real example.** Ask `ls` to show the details with the `-l` ("long") flag:
```console
$ ls -l
total 8
-rw-r--r-- 1 ada  ada   220 Jun 19 09:14 notes.txt
-rwxr-xr-x 1 ada  ada  1320 Jun 19 09:15 backup.sh
drwxr-xr-x 2 ada  ada  4096 Jun 19 09:16 projects
```
*What just happened:* Each line describes one item, and that cryptic block at the front is the permissions.
Let's decode `notes.txt`'s `-rw-r--r--`:

```text
   -  rw-  r--  r--
   │   │    │    └── OTHERS : r--  → can read only
   │   │    └─────── GROUP  : r--  → can read only
   │   └──────────── OWNER  : rw-  → can read and write
   └──────────────── type   : '-' = a regular file ('d' = a directory)
```

So `notes.txt` can be read and edited by its owner `ada`, and only read by everyone else. Look at
`backup.sh`: its `-rwxr-xr-x` adds **x** everywhere - it's a script meant to be *run*, so it carries
execute permission. And `projects` begins with **d**: it's a directory, and its **x** bits mean users are
allowed to enter it.

## Permission denied, decoded

Now the most common day-one error makes complete sense:
```console
$ cat /etc/shadow
cat: /etc/shadow: Permission denied
```
*What just happened:* `/etc/shadow` (where encrypted passwords live) is readable only by root - its
permissions deny read access to normal users on purpose. As `ada`, you don't have the **r** bit for
"others," so Linux stops you. This isn't a bug or a broken file. It's the permission system protecting
something sensitive, exactly as designed.

When *you should* have access (it's your own file) and still get denied, the cause is usually that the file
is owned by root or another user. The fix is either to use `sudo` (if it's genuinely an admin task) or to
fix the file's ownership/permissions - but reach for that deliberately, not reflexively.

⚠️ **Gotcha.** The reflex to "fix" a permission problem by making a file readable/writable by *everyone*
(you'll see `chmod 777` suggested online) is almost always the wrong move - it removes the protection
instead of granting the right access, and on a server it's a real security hole. When you hit `permission
denied`, first ask *should* this account have access here? Usually a targeted `sudo` is the correct answer,
not throwing the doors open.

**Why this saves you later.** Owner / group / others and r/w/x is the entire foundation. Every
`permission denied`, every "the web server can't read its own config," every "why can't this user write to
that folder" is this one model playing out. Once you can read an `ls -l` line, these stop being mysteries
and become things you can diagnose in seconds.

## Recap

1. Linux is **multi-user**: normal users (like you) have limits; **root** is the all-powerful superuser
   with none.
2. **Don't log in as root.** Work as a normal user so mistakes stay small; only borrow admin power for the
   moment you need it.
3. **`sudo`** runs *one* command as root after asking for *your* password (typed invisibly). It's how you
   do admin tasks safely - but every `sudo` deserves your attention.
4. Every file has an **owner**, a **group**, and **others**, each with **read / write / execute** (`rwx`)
   permissions - readable from an `ls -l` line.
5. **`permission denied`** almost always means the permission system is working as designed, not that
   something's broken. Decide whether the account *should* have access before reaching for `sudo` - and
   avoid the `chmod 777` "fix."

You can now move around, install software, and understand who's allowed to do what. The last piece is the
software that runs *without* you - the background services humming on every Linux machine - and how to
start them, check them, and read their logs when they misbehave.

---

[← Phase 2: Getting Around](02-getting-around.md) · [Phase 4: Services and Logs →](04-services-and-logs.md)
