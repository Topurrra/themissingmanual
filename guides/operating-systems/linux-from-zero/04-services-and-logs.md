---
title: "Services and Logs"
guide: "linux-from-zero"
phase: 4
summary: "A service (daemon) is a program that runs quietly in the background; systemctl starts, stops, checks, and enables them; journalctl shows their logs - plus a first-day snags cheat-card for when things go wrong."
tags: [linux, services, daemon, systemctl, systemd, journalctl, logs, troubleshooting]
difficulty: beginner
synonyms: ["what is a daemon", "what is a linux service", "how to use systemctl", "systemctl start stop status enable", "how to read linux logs", "journalctl explained", "linux service won't start"]
updated: 2026-06-19
---

# Services and Logs

Some programs you run and watch - `ls`, `tree`, a text editor. But the most important programs on a Linux
machine are the ones you *never* see: the web server quietly answering requests, the SSH server waiting for
you to log in, the clock that keeps time in sync. They start on their own, run forever in the background,
and only get your attention when something's wrong.

This last phase is about those invisible programs: what they are, the one command that controls them, and
where to look when one of them misbehaves. We'll finish with a cheat-card for the snags that ambush every
beginner.

## What a service (a daemon) actually is

**What it actually is.** A **service** is a program designed to run **in the background, continuously**,
usually without a screen or a person watching it. It starts (often when the machine boots), sits there
doing its job, and keeps going until something stops it. A web server, a database, the SSH server, a
scheduled-task runner - all services.

The traditional Unix word for such a background program is a **daemon** (pronounced "demon," but it means a
helpful background spirit, not an evil one). The two words are used interchangeably; many daemon program
names even end in `d` - `sshd` is the SSH daemon, `crond` runs scheduled jobs.

📝 **Terminology.** *Service / daemon* = a long-running background program with no interactive screen. It's
the opposite of a command you run and watch finish; a service is *meant* to keep running.

On modern Linux, services are managed by a system called **systemd**, and you talk to it through one
command: **`systemctl`**. Learn the four moves below and you can manage almost any service on the box.

## `systemctl`: the four moves you actually need

Everything you'll do as a beginner is one of these four verbs followed by the service's name. We'll use
`ssh` (the SSH server) as the example.

### Check what a service is doing - `status`

Start here. *Before* you start, stop, or worry about anything, ask how it's doing:
```console
$ systemctl status ssh
● ssh.service - OpenBSD Secure Shell server
     Loaded: loaded (/lib/systemd/system/ssh.service; enabled; preset: enabled)
     Active: active (running) since Thu 2026-06-19 09:02:11 UTC; 2h 14min ago
   Main PID: 812 (sshd)
      Tasks: 1 (limit: 4631)
     Memory: 5.6M
        CPU: 142ms
     CGroup: /system.slice/ssh.service
             └─812 "sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups"
```
*What just happened:* `systemctl status` gave you a health report. The two lines that matter most:
**`Active: active (running)`** means it's up and working right now, and **`enabled`** (on the `Loaded:`
line) means it's set to start automatically on boot. The green `●` is a quick visual "it's alive." This
one command answers "is it running?" and "will it come back after a reboot?" at a glance.

### Start and stop - `start` / `stop`

These do exactly what they say, and they're admin actions, so they need `sudo`:
```console
$ sudo systemctl stop ssh
$ sudo systemctl start ssh
```
*What just happened:* `stop` told systemd to shut the service down now; `start` told it to bring it back up
now. Neither prints anything when it succeeds - silence here is success. (There's also `restart`, which is
just stop-then-start in one step, handy after you change a service's config.)

⚠️ **Gotcha.** `start` and `stop` only affect the service *right now*. They do **not** change whether it
comes back after a reboot. A service you `stop` but leave `enabled` will quietly return on the next boot -
which surprises people who thought they'd turned it off for good. To change boot behavior, you need the next
verb.

### Make it start on boot (or not) - `enable` / `disable`

```console
$ sudo systemctl enable ssh
Created symlink /etc/systemd/system/multi-user.target.wants/ssh.service → /lib/systemd/system/ssh.service.
```
*What just happened:* `enable` registered the service to **start automatically every time the machine
boots**. It did *not* start it right now - `enable` is about the future, `start` is about this moment.
(`disable` is the opposite: don't auto-start on boot.) If you want both at once - start now *and* on every
boot - there's `sudo systemctl enable --now ssh`.

💡 **Key point.** Hold these two axes apart and `systemctl` stops being confusing: **`start`/`stop` = right
now**, **`enable`/`disable` = on every boot**. Most "but I turned it off!" confusion is mixing up those two.

## Reading the logs - `journalctl`

When a service won't start, won't behave, or you just want to know what it's been doing, you read its
**logs** - the running diary that programs write as they work. systemd collects these into one place called
the **journal**, and you read it with **`journalctl`**.

The most useful form ties the journal to a specific service:
```console
$ journalctl -u ssh
Jun 19 09:02:11 web-01 systemd[1]: Starting OpenBSD Secure Shell server...
Jun 19 09:02:11 web-01 sshd[812]: Server listening on 0.0.0.0 port 22.
Jun 19 09:02:11 web-01 sshd[812]: Server listening on :: port 22.
Jun 19 09:02:11 web-01 systemd[1]: Started OpenBSD Secure Shell server.
Jun 19 11:14:39 web-01 sshd[2210]: Accepted password for ada from 203.0.113.5 port 51112 ssh2
```
*What just happened:* `-u ssh` filtered the journal down to just the `ssh` service's entries. You can read
its life story: it started, it began listening on port 22, and later `ada` logged in. When a service
*fails* to start, this is exactly where the real reason shows up - an error line right around the failure
time, telling you what it choked on.

Two flags worth knowing right away:
```console
$ journalctl -u ssh -e      # jump to the end (the newest entries)
$ journalctl -u ssh -f      # follow live - new lines appear as they happen (Ctrl-C to quit)
```
*What just happened:* `-e` takes you straight to the most recent entries (usually what you want first), and
`-f` keeps the log open and streaming so you can watch what a service does in real time - invaluable when
you're trying to reproduce a problem.

⚠️ **Gotcha.** Reading other services' system logs often needs `sudo` (logs can contain sensitive info), so
if `journalctl -u something` comes back suspiciously empty or refuses, try `sudo journalctl -u something`.
And remember from Phase 2: many traditional logs *also* live as plain files under `/var/log` - both the
journal and `/var/log` are places to look.

**Why this saves you later.** This is the loop that fixes nearly every "the service is broken" situation:
**`systemctl status`** tells you *that* it's down, **`journalctl -u <name>`** tells you *why*. You don't
guess, and you don't panic - you ask the machine what happened, and it has been keeping notes the whole time.

---

## First-day snags - the cheat-card

> **You hit a wall. Match it to a row, breathe, apply the fix, and read the short *why* underneath.**

| The wall you hit | The calm fix |
|---|---|
| `Permission denied` on a file or action | You lack the rights - if it's genuinely admin, prefix with `sudo` (§1) |
| `command not found` for a program you expected | It isn't installed - install it with `apt`/`dnf` (§2) |
| `Unable to locate package` from `apt install` | Stale catalog - run `sudo apt update`, then install again (§3) |
| `sudo` seems frozen - typing shows nothing | It's waiting for your password; it's hidden on purpose - type it, press Enter (§4) |
| A service won't start | `systemctl status <name>`, then `journalctl -u <name>` to read the actual error (§5) |
| You stopped a service but it came back after reboot | `stop` is "now"; you also need `sudo systemctl disable <name>` (§6) |

### 1. `Permission denied`
You're trying to read, change, or run something your account isn't allowed to. If it's a real admin task
(installing software, editing `/etc`, controlling a service), put `sudo` in front. If it's your *own* file,
the owner/permissions may be off - see [Phase 3](03-users-permissions-sudo.md). Don't reflexively
`chmod 777`; decide whether the account *should* have access first.

### 2. `command not found`
The program isn't installed (or your shell can't find it). On Linux you don't download an installer - you
install it from the package manager: `sudo apt install <name>` (Ubuntu/Debian) or `sudo dnf install <name>`
(Fedora). See [Phase 2](02-getting-around.md).

### 3. `Unable to locate package`
`apt` is working from an out-of-date catalog and doesn't know the package exists yet. Refresh it and retry:
```console
$ sudo apt update
$ sudo apt install <name>
```
*What just happened:* `apt update` re-downloaded the list of available software; now `apt` can find what
you asked for. (If `apt` itself is missing, you're likely on a `dnf`-based distro - that's the Phase 1
distro-family lesson.)

### 4. `sudo` looks frozen while typing your password
It isn't frozen. `sudo` is asking for your password and **deliberately shows nothing** as you type - no
dots, no stars - so onlookers can't see its length. Type it normally and press Enter. See
[Phase 3](03-users-permissions-sudo.md).

### 5. A service won't start
Don't guess - ask the machine in two steps:
```console
$ systemctl status <name>
$ journalctl -u <name> -e
```
*What just happened:* `status` confirms it's down and often shows the last error line; `journalctl -u
<name> -e` shows the end of that service's log, where the real reason (a bad config line, a port already in
use, a missing file) is almost always spelled out.

### 6. A stopped service came back after reboot
`stop` only affects the service right now; it doesn't change boot behavior. To keep it from auto-starting,
disable it too:
```console
$ sudo systemctl disable <name>
```
*What just happened:* `disable` unregistered the service from the boot sequence, so it stays down across
reboots. (`stop` + `disable` = down now *and* later.) See §"`enable`/`disable`" above.

---

## You're no longer a stranger here

Look at what you can now do. You know **what Linux actually is** - a kernel, wrapped into a distribution,
running most of the world's servers. You can **find your way around** the one-tree filesystem and **install
software** from a package manager. You understand **users, permissions, and `sudo`**, so `permission
denied` is information, not a wall. And you can **start, check, and read the logs of services**, so a
misbehaving daemon is a thing you diagnose, not fear.

That's the cold start - genuinely the hardest part - behind you.

**Where to go next.** You're comfortable *on* a Linux machine. The natural next step is running one as a
real server: logging in remotely over SSH, running web services, keeping it updated and secure, and
deploying actual software. That's the next guide:
**[Linux for Servers](/guides/linux-for-servers)**. You now have exactly the foundation it builds on.

---

[← Phase 3: Users, Permissions, and sudo](03-users-permissions-sudo.md) · [Guide overview](_guide.md)
