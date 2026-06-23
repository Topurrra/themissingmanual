---
title: "Running It Safely"
guide: "linux-for-servers"
phase: 3
summary: "The discipline that keeps a server alive and uncompromised: least-privilege users and sudo, scheduled jobs with cron, a firewall with ufw, SSH hardening (keys over passwords), and keeping packages updated — ending in a hardening cheat-card."
tags: [linux, security, sudo, users, cron, crontab, ufw, firewall, ssh-hardening, updates, hardening]
difficulty: advanced
synonyms: ["linux server security basics", "least privilege sudo", "how to use cron", "crontab syntax explained", "ufw firewall setup", "harden ssh server", "disable ssh password login", "keep linux packages updated", "server hardening checklist"]
updated: 2026-06-19
---

# Running It Safely

A server is exposed in a way your laptop never is: it has a public address, it's reachable around the clock,
and automated bots are knocking on its SSH port within minutes of it coming online. None of that is cause for
panic — it's cause for a small, boring set of habits. This phase is those habits. Each one shrinks what can go
wrong, and none of them is hard once you see *why* it exists.

We close with a hardening cheat-card you can run down on any new box.

## The server-hardening cheat-card

> **New box, or auditing an old one? Run down this list, then read the section behind anything you're unsure
> of. Each line closes a real door.**

| Door left open | How you close it | § |
|---|---|---|
| Doing everything as `root` | Work as a normal user; reach for `sudo` per-command | §1 |
| Manual chores you'll forget | Schedule them with `cron` | §2 |
| Every port reachable from the internet | Default-deny firewall, allow only what you serve (`ufw`) | §3 |
| SSH password logins (brute-forceable) | Key-based auth; disable password & root login | §4 |
| Known-vulnerable packages | Update regularly; enable unattended security updates | §5 |

---

## 1. Users and `sudo` — least privilege as a habit

**What it actually is.** `root` is the all-powerful account: it can read, change, or destroy anything, and
the kernel does *not* second-guess it. **Least privilege** is the practice of not living there — you do your
day-to-day work as an ordinary user, and you borrow root's power one command at a time with **`sudo`** only
when a task genuinely needs it.

**Why people get this wrong.** It's tempting to just `sudo -i` into a root shell and stay there because it
stops the password prompts. But a root shell means *every* command — including the typo'd `rm -rf` and the
copy-pasted script you didn't fully read — runs with the power to wreck the machine. `sudo` per-command is the
guardrail: it forces a half-second of intent before each privileged action, and it leaves an audit trail of
who did what.

**A real example.** Reading a protected file fails as a normal user; `sudo` grants exactly that one action:

```console
$ cat /etc/ssh/sshd_config
cat: /etc/ssh/sshd_config: Permission denied
$ sudo cat /etc/ssh/sshd_config
[sudo] password for deploy:
# This is the sshd server system-wide configuration file.
Port 22
...
```

*What just happened:* As `deploy` you weren't allowed to read the SSH config — good, that's the protection
working. Prefixing `sudo` ran *that single command* as root after you proved who you are with **your own**
password (not root's — that's the point; root may not even have a usable password). The grant lasts only for
that command; the next command is back to being plain `deploy`.

📝 **Terminology.** Membership in the **`sudo`** group (called `wheel` on Red Hat–family distros) is what lets
a user run `sudo` at all. You add a user with `sudo usermod -aG sudo alice`, which appends them to the group
without disturbing their other groups.

⚠️ **Gotcha.** That `-aG` is load-bearing. `usermod -G sudo alice` (no `a`) *replaces* all of alice's
supplementary groups with just `sudo`, silently dropping her from every other group she was in. Always
`-aG` — *append* to groups. And group membership only takes effect on a fresh login, so alice must log out
and back in before her new `sudo` power appears.

🪖 **War story.** The cleanest disasters come from a root shell left open in a forgotten terminal tab. Hours
later you fat-finger a command into the wrong window, and because it's root, there's nothing to stop it. Living
as a normal user and reaching for `sudo` deliberately is the cheap insurance that turns that catastrophe into a
harmless "Permission denied."

## 2. Scheduled jobs with `cron`

**What it actually is.** `cron` is the service that runs commands on a schedule — every night at 3am, every
15 minutes, the first of every month. You hand it a line describing *when* and *what*, and it runs that
command unattended, forever, whether or not you're logged in. (Remember the Phase 1 war story about work dying
with your SSH session? This is one of the right places to put recurring work instead.)

**What it does in real life.** You edit your personal schedule — your **crontab** ("cron table") — with
`crontab -e`. Each line is five time fields followed by the command:

```text
   ┌───────────── minute        (0–59)
   │ ┌─────────── hour          (0–23)
   │ │ ┌───────── day of month  (1–31)
   │ │ │ ┌─────── month         (1–12)
   │ │ │ │ ┌───── day of week    (0–6, Sunday = 0)
   │ │ │ │ │
   * * * * *   command to run
```

A `*` means "every value of this field." So a real backup line reads:

```console
$ crontab -e
# add this line, save, and exit the editor:
0 3 * * *  /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1
```

*What just happened:* `0 3 * * *` is "minute 0 of hour 3, every day of month, every month, every day of week"
— i.e. **3:00am daily**. The command runs `backup.sh`, and `>> /var/log/backup.log 2>&1` appends both its
normal output and its errors to a log file so you can see afterward whether it worked. When you save and quit,
cron installs the schedule and confirms with `crontab: installing new crontab`.

A couple more patterns so the syntax clicks:

```text
   */15 * * * *   →  every 15 minutes
   0 0 * * 0      →  midnight every Sunday
   30 2 1 * *     →  02:30 on the 1st of every month
```

⚠️ **Gotcha.** Cron runs your job with a **minimal environment** — a bare `PATH`, often no `cd` to your home
directory, and none of the shell setup from your `.bashrc`. A script that works perfectly when you run it by
hand can fail under cron because it relied on a `PATH` entry or a `cd` that isn't there. Defend against it:
use **absolute paths** for every command and file, set what you need explicitly, and *always* redirect output
to a log (`>> file 2>&1`) — because a cron job that fails silently at 3am is invisible until the day you needed
the backup it never made.

💡 **Key point.** `crontab -e` edits *your* schedule; `crontab -l` lists it; `sudo crontab -e` edits *root's*
separate schedule. System-wide jobs also live in `/etc/cron.d/` and the `/etc/cron.daily/` (etc.) directories.
For jobs that must survive the machine being powered off at the scheduled time, systemd **timers** are the more
robust modern alternative — but cron is universal and worth knowing first.

## 3. The firewall with `ufw`

**What it actually is.** A firewall decides which network connections the machine accepts and which it drops.
The only safe default for a server is **deny everything inbound, then allow back exactly the ports you
intend to serve.** `ufw` ("Uncomplicated Firewall") is the friendly front-end that makes this a few readable
commands instead of raw `iptables` rules.

**A real example.** The canonical setup, in order:

```console
$ sudo ufw default deny incoming
Default incoming policy changed to 'deny'
(be sure to update your rules accordingly)
$ sudo ufw default allow outgoing
Default outgoing policy changed to 'allow'
$ sudo ufw allow OpenSSH
Rules updated
Rules updated (v6)
$ sudo ufw allow 'Nginx Full'
Rules updated
Rules updated (v6)
$ sudo ufw enable
Command may disrupt existing ssh connections. Proceed with operation (y|n)? y
Firewall is active and enabled on system startup
```

*What just happened:* You set the policy to refuse all incoming connections and permit all outgoing ones (so
the server can still reach out to fetch updates). Then you punched back exactly two holes by **named profile**:
`OpenSSH` (so you don't lock yourself out — read the gotcha below), and `Nginx Full` (ports 80 and 443 for
web traffic). `ufw enable` turned it on and wired it to start at boot. From here, anything you didn't allow is
quietly dropped.

```console
$ sudo ufw status verbose
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW IN    Anywhere
Nginx Full                 ALLOW IN    Anywhere
OpenSSH (v6)               ALLOW IN    Anywhere (v6)
Nginx Full (v6)            ALLOW IN    Anywhere (v6)
```

*What just happened:* `status verbose` confirms the firewall is active, restates the default policies, and
lists every allow rule for both IPv4 and IPv6. This is the screen to check after every change.

⚠️ **Gotcha — the one that locks you out.** If you `sudo ufw enable` over an SSH connection *before* allowing
SSH, the default-deny policy will cut your own connection and you'll have no way back in (short of a cloud
console). Always `sudo ufw allow OpenSSH` (or `allow 22`) **first**, confirm it's in `ufw status`, *then*
enable. This mistake has stranded countless people on day one — do the allow before the enable, every time.

## 4. Hardening SSH

SSH is your front door, and it's the most-probed service on the box. Three changes, made in
`/etc/ssh/sshd_config`, dramatically shrink the attack surface — and the order matters, because two of them
can lock you out if done carelessly.

**1) Use key-based authentication.** As flagged in Phase 1, a private key on your laptop paired with its
public half on the server is both more convenient (no password typing) and far stronger than any password a
human will choose. Get keys working and confirm you can log in with them **before** you touch anything else.

**2) Then turn off password authentication.** Once keys work, passwords become pure liability — they're what
the brute-force bots are hammering. Disable them:

```console
$ sudo nano /etc/ssh/sshd_config
# set (uncommenting if needed):
PasswordAuthentication no
PermitRootLogin no
```

*What just happened:* `PasswordAuthentication no` tells `sshd` to refuse password logins entirely — only key
holders get in, so password-guessing attacks become pointless. `PermitRootLogin no` blocks logging in
*directly* as root over SSH, so an attacker must compromise a known username *and* its key *and* then
escalate, rather than guessing at the one account everyone knows exists.

**3) Apply and verify — without dropping yourself.** Changing the config does nothing until you restart the
service (Phase 2's lesson). But restart with care:

```console
$ sudo sshd -t
$ sudo systemctl restart ssh
```

*What just happened:* `sshd -t` does a **config syntax test** — if you typo'd a directive, it tells you now,
before the restart, instead of leaving you with a daemon that won't start and a door you can't open. Only
after it passes silently do you `restart`.

⚠️ **Gotcha — keep a lifeline open.** After restarting SSH, do **not** close your current session. Open a
*second*, brand-new SSH connection and confirm you can still log in with your key. If something is
misconfigured, your existing session is the only thing keeping you on the machine — your way in to fix it. Only
once the new connection succeeds is it safe to consider the change done.

📝 **Terminology.** On some distros the SSH service unit is `ssh`, on others `sshd`; `systemctl status ssh`
(or `sshd`) tells you which name your box uses. Same daemon, different unit name.

## 5. Keeping packages updated

**What it actually is.** The single highest-leverage security habit is also the most boring: **install
security updates promptly.** Most real-world server compromises exploit a *known* vulnerability that a patch
already exists for — the attacker is betting you didn't apply it.

**A real example.** On a Debian/Ubuntu box, the routine is two commands:

```console
$ sudo apt update
Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
...
12 packages can be upgraded. Run 'apt list --upgradable' to see them.
$ sudo apt upgrade
Reading package lists... Done
...
The following packages will be upgraded:
  libssl3 openssl ...
After this operation, 1,024 kB of additional disk space will be used.
Do you want to continue? [Y/n]
```

*What just happened:* `apt update` refreshes the local catalog of *what versions are available* — it does not
install anything, it just learns what's out there (the "12 packages can be upgraded" line is the news). Then
`apt upgrade` actually downloads and installs the newer versions, after showing you the list and asking for
confirmation. The two-step exists so you always see what's about to change before it changes.

💡 **Key point — automate the security-critical part.** Applying updates by hand is fine until the week you
forget. On Debian/Ubuntu, the `unattended-upgrades` package installs *security* updates automatically in the
background:

```console
$ sudo apt install unattended-upgrades
$ sudo dpkg-reconfigure --priority=low unattended-upgrades
```

*What just happened:* You installed the tool and ran its configuration dialog to switch on automatic security
upgrades. From now on the box patches known security holes on its own — closing the gap between "a fix exists"
and "the fix is applied" without depending on you remembering.

⚠️ **Gotcha.** Some updates (a new kernel, a core library) only take full effect after a **reboot** or a
service restart — the machine will tell you, often via a `*** System restart required ***` message at login or
a file at `/var/run/reboot-required`. Automatic *installation* doesn't automatically *reboot*; plan a window
to apply the ones that need it, rather than assuming "updates installed" means "fully protected."

## Recap

1. **Least privilege:** work as a normal user, borrow root per-command with `sudo`; add sudo access with
   `usermod -aG sudo` (always `-aG`).
2. **`cron`** runs commands on a schedule — five time fields plus a command; use **absolute paths** and
   **redirect output to a log**, because cron's environment is bare and silent failures are invisible.
3. **`ufw`:** default-deny incoming, allow only what you serve — and **allow SSH before you `enable`**, or you
   lock yourself out.
4. **Harden SSH** in `/etc/ssh/sshd_config`: keys first, then `PasswordAuthentication no` and
   `PermitRootLogin no`; `sshd -t` before restart, and keep a second session open to verify.
5. **Update regularly** (`apt update` then `apt upgrade`) and let **`unattended-upgrades`** handle security
   patches automatically; reboot when a kernel/library update asks for it.

That's the full arc: you understand the server posture, you can manage and debug its services with systemd, and
you can run it without leaving doors open. From here, the infrastructure track is
where this same knowledge gets automated across many machines — but every bit of it rests on being able to do
it by hand, calmly, on one box. Which you now can.

---

[← Guide overview](_guide.md) · [Phase 1: The Server Mindset →](01-the-server-mindset.md)

## Try it yourself

Inspect a fake server filesystem — `ls -l`, `cat /etc/hostname`, `cat readme.txt | grep shell`, `tail -n 2 projects/todo.txt`:

```playground-terminal
```
