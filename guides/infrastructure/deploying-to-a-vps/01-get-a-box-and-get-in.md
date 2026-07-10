---
title: "Get a Box and Get In"
guide: "deploying-to-a-vps"
phase: 1
summary: "A VPS is a rented slice of a Linux server you control entirely. Here's what that means, how to create one, how to SSH in for the first time, and the three first-login hardening steps - a non-root user, system updates, and a firewall - that protect a box exposed to the open internet."
tags: [vps, ssh, linux, hardening, firewall, ufw, sudo, server-setup]
difficulty: intermediate
synonyms: ["what is a vps", "rent a linux server", "first ssh into a server", "set up a new vps", "create a non-root user on linux", "ufw firewall basics", "secure a new server", "harden a fresh vps"]
updated: 2026-07-10
---

# Get a Box and Get In

Before you can deploy anything, you need a *somewhere* to deploy it - a computer that isn't your laptop,
that's on all the time, and lives on the public internet. You're going to rent one, and the moment you
do, you're handed something weirdly powerful and a little alarming: full root access to a Linux machine
that anyone in the world can try to reach. Let's fix the mental model first, since almost everything in
this phase follows from understanding what you're actually renting.

## What a VPS actually is

A **VPS** - *Virtual Private Server* - is a slice of a big physical server in a data center, carved out
and handed to you as if it were a whole computer of its own: its own OS (you pick the Linux
distribution), its own memory and disk, its own public IP, and a root login that's yours alone. "Virtual"
means a hypervisor splits one physical machine into many isolated ones; "private" means your slice is
walled off from everyone else's.

The common misconception is that a VPS is some managed "hosting" thing with a control panel that does
everything for you. It isn't - it's a bare Linux box. Nobody installs your app, configures your web
server, or sets up security for you; you get an empty machine and root access, and the rest is up to you.
That's the deal: total control, total responsibility. It sits in a data center, powered on, connected to
the internet, running whatever you tell it to - administered entirely over the network via SSH (headless,
no monitor or keyboard; see [Linux for Servers](/guides/linux-for-servers) for the full server mindset).
You pay by the month, usually a few dollars for a small one, and can destroy and recreate it anytime.

📝 **Terminology.** *Provider* = the company renting you the box (DigitalOcean, Hetzner, Linode/Akamai,
Vultr, AWS Lightsail, and others). *Instance* / *droplet* / *server* = your individual VPS - providers
each use their own word. *Distribution* (*distro*) = the flavor of Linux; this guide uses Ubuntu, the
most common starting point with widely documented commands.

## Creating the box

There's no single command for this part - you do it in your provider's web console. The specifics differ
between providers, but every one asks the same handful of questions, and knowing what each one means
saves you from guessing:

```text
   WHAT THE SIGNUP FORM ASKS          WHAT IT MEANS / WHAT TO PICK
   ─────────────────────────────      ─────────────────────────────────────────────
   Operating system / image      │    The distro. Pick Ubuntu LTS (a "long-term
                                 │    support" release - stable, supported for years).
   Size / plan                   │    How much CPU/RAM/disk. The smallest tier is fine
                                 │    to start; you can resize later.
   Region / datacenter           │    Where the box physically lives. Pick the one
                                 │    closest to your users for lower latency.
   Authentication                │    SSH key (strongly preferred) or password.
                                 │    Choose SSH key - see below.
   Hostname                      │    A name for the box, e.g. "web-prod-1". Cosmetic.
```

The one choice that matters for everything after is **authentication**. When the form offers "SSH key"
versus "password," choose the SSH key, and paste yours in if it lets you. With a key, the provider puts
it on the box before it even boots, so your first login needs no password and the box is far harder to
brute-force. No keypair yet? Generating one is its own essential skill - see
[SSH and Keys](/guides/ssh-and-keys) before you continue; it's worth the ten-minute detour.

When you finish, the provider boots the box and shows you its **public IP address** - something like
`203.0.113.10`. Write it down. That number is how you reach your server until you give it a domain name
in [Phase 3](03-make-it-public-and-safe.md).

## Your first login

SSH (*Secure Shell*) gives you a terminal on the remote box exactly as if you were sitting in front of
it, with everything between you and it encrypted - you type locally, the commands run *there*. On a
fresh VPS, the account waiting for you is usually `root`, the all-powerful administrator.

With your key in place, the first connect is one command:

```console
$ ssh root@203.0.113.10
The authenticity of host '203.0.113.10 (203.0.113.10)' can't be established.
ED25519 key fingerprint is SHA256:Z9k3...Qp1A.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added '203.0.113.10' (ED25519) to the list of known hosts.
Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-41-generic x86_64)

root@web-prod-1:~#
```

*What just happened:* `ssh root@203.0.113.10` opens a shell on that host as `root`. Since this was the
first connection, SSH showed the server's **host key fingerprint** and asked you to confirm it - proof of
*which* machine you're talking to, so nobody can impersonate it later. Typing `yes` remembered the key,
and the prompt changed to `root@web-prod-1:~#`; that `#` (instead of `$`) is the tell that you're root,
running commands with full privileges. `exit` drops you back to your laptop.

⚠️ **Gotcha.** That fingerprint prompt only happens *once* per host. If you ever reconnect and SSH
instead prints `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!`, do **not** blindly type `yes` - it
means the host key differs from the one you trusted, usually an innocent server rebuild but potentially
someone intercepting you. Confirm out-of-band why it changed before clearing the old entry from
`~/.ssh/known_hosts`. Full treatment in [SSH and Keys](/guides/ssh-and-keys).

## First-login hardening: the three things everyone skips

Here's the uncomfortable truth about a fresh, internet-facing box: within *minutes* of booting, automated
bots start probing it, trying common usernames and passwords against your SSH port. That's not paranoia,
it's the constant background noise of the internet. Before you install anything, spend ten minutes on
three pieces of hardening - not optional, and far easier now than cleaning up after they bite you.

### 1. Create a non-root user (and stop living as root)

Root can do *anything* - including, with one mistyped command, deleting the whole system. The fix: do
your day-to-day work as an ordinary user who has to deliberately ask for admin powers (via `sudo`) for
the dangerous stuff. That deliberate ask is a speed bump that's saved countless servers from a careless
`rm`.

Still logged in as root, create a user and give them `sudo` rights:

```console
root@web-prod-1:~# adduser deploy
Adding user `deploy' ...
Adding new group `deploy' (1000) ...
Adding new user `deploy' (1000) with group `deploy' ...
Creating home directory `/home/deploy' ...
Copying files from `/etc/skel' ...
New password:
Retype new password:
passwd: password updated successfully
Changing the user information for deploy
Enter the new value, or press ENTER for the default
	Full Name []:
... (press Enter through the rest) ...
Is the information correct? [Y/n] Y

root@web-prod-1:~# usermod -aG sudo deploy
```

*What just happened:* `adduser deploy` created a normal user with its own home directory at
`/home/deploy` and set a password (used when `sudo` asks you to confirm). `usermod -aG sudo deploy` then
*appended* (`-a`) `deploy` to the `sudo` *group* - on Ubuntu, membership in that group is what grants the
right to run commands as root via `sudo`.

⚠️ **Gotcha.** Don't forget the `-a` in `usermod -aG`. Without it, `usermod -G sudo deploy` *replaces*
all the user's groups with just `sudo`, quietly stripping every other group they belonged to. `-a` means
"append, not replace" - this trips people up constantly.

Now copy your SSH key to the new user, from your **laptop**:

```console
$ ssh-copy-id deploy@203.0.113.10
```

*What just happened:* `ssh-copy-id` appended your public key to `/home/deploy/.ssh/authorized_keys`, so
the box now recognizes your laptop's key for the `deploy` user. (No `ssh-copy-id`? The manual equivalent
is in [SSH and Keys](/guides/ssh-and-keys).) Test it:

```console
$ ssh deploy@203.0.113.10
Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-41-generic x86_64)

deploy@web-prod-1:~$ sudo whoami
[sudo] password for deploy:
root
```

*What just happened:* You logged in as `deploy` (the `$` prompt - an ordinary user, not root), then ran
`sudo whoami` to confirm admin rights work: `sudo` asked for `deploy`'s password, ran `whoami` as root,
and printed `root`. From here on, live as `deploy` and reach for `sudo` only when a command genuinely
needs admin power.

💡 **Key point.** Once `deploy` can log in *and* use `sudo`, you can disable direct root SSH login and
password-based login entirely - covered in [SSH and Keys](/guides/ssh-and-keys). Just never disable root
*until* you've verified your replacement login works, or you'll lock yourself out.

### 2. Update the system

The OS and its packages shipped with whatever versions existed when the image was built - possibly weeks
or months old, including known security holes. Updating pulls the current, patched versions.

Two commands, run as `deploy`:

```console
deploy@web-prod-1:~$ sudo apt update
Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease
Get:2 http://security.ubuntu.com/ubuntu noble-security InRelease [129 kB]
...
Reading package lists... Done
42 packages can be upgraded. Run 'apt list --upgradable' to see them.

deploy@web-prod-1:~$ sudo apt upgrade -y
Reading package lists... Done
Building dependency tree... Done
...
The following packages will be upgraded:
  ... (list of packages) ...
Setting up ...
```

*What just happened:* `apt update` refreshed the local catalog of *what versions are available* (it
changes nothing installed yet, just learns what's out there). `apt upgrade -y` then downloaded and
installed the newer versions, with `-y` auto-answering the confirmation prompt. `apt` is Ubuntu's package
manager - it installs, updates, and removes software.

⚠️ **Gotcha.** If an upgrade touches the kernel (watch for a note about a pending reboot, or
`/var/run/reboot-required`), it only takes effect after `sudo reboot`. That drops your SSH connection for
a minute or two - wait, then reconnect. Normal, not a sign you broke anything.

### 3. Turn on a firewall

A firewall decides which network ports the world is allowed to reach. A fresh box may have several
services listening by default; you want it to accept connections on *only* the ports you intend to
serve. On Ubuntu the friendly front-end is **UFW** (*Uncomplicated Firewall*).

Allow SSH (so you don't lock yourself out), allow web traffic, then enable it:

```console
deploy@web-prod-1:~$ sudo ufw allow OpenSSH
Rules updated
Rules updated (v6)
deploy@web-prod-1:~$ sudo ufw allow 80/tcp
Rules updated
Rules updated (v6)
deploy@web-prod-1:~$ sudo ufw allow 443/tcp
Rules updated
Rules updated (v6)
deploy@web-prod-1:~$ sudo ufw enable
Command may disrupt existing ssh connections. Proceed with operation (y|n)? y
Firewall is active and enabled on system startup
deploy@web-prod-1:~$ sudo ufw status
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
OpenSSH (v6)               ALLOW       Anywhere (v6)
80/tcp (v6)                ALLOW       Anywhere (v6)
443/tcp (v6)               ALLOW       Anywhere (v6)
```

*What just happened:* UFW allowed three things before turning on. `OpenSSH` is a named rule for port 22 -
allowing it **first** is critical, since enabling a firewall that blocks SSH locks you out. `80/tcp` and
`443/tcp` are HTTP/HTTPS, needed once nginx fronts the app in [Phase 3](03-make-it-public-and-safe.md).
`ufw enable` then activated the firewall (it warns that it *could* disrupt SSH, but you're safe since
OpenSSH is allowed). `ufw status` confirms exactly what's open: SSH and web, nothing else.

⚠️ **Gotcha.** Always `allow OpenSSH` *before* you `enable`. The single most common way people lock
themselves out of a fresh box is enabling a firewall that blocks port 22. Most providers offer a
web-based console (separate from SSH) to fix it if it happens - but far better to never need it.

💡 **Key point.** Notice what you did *not* open: your app's own port (say, 3000 or 8080). That's
deliberate - it's the whole strategy of [Phase 3](03-make-it-public-and-safe.md): your app listens
privately, and only nginx (on 80/443) is exposed to the world. Never open your raw app port to the
internet.

## Recap

1. A **VPS** is a rented slice of a Linux server - your own headless box with a public IP and root
   access. Total control, total responsibility; nobody sets it up for you.
2. You create it in the provider's console, choosing **Ubuntu LTS**, the smallest size to start, a
   nearby region, and - crucially - **SSH key** authentication.
3. You reach it with **`ssh root@<ip>`**, verifying the host key fingerprint on first connect.
4. Before anything else, do the three hardening steps: a **non-root `sudo` user** you'll live as,
   **`apt update && apt upgrade`** to patch the system, and **UFW** allowing only SSH and web ports -
   SSH allowed *first*.

You now have a clean, reachable, reasonably-locked-down box. Next, let's get your app onto it and make
it stay running.

---

[← Guide overview](_guide.md) · [Phase 2: Run Your App as a Service →](02-run-your-app-as-a-service.md)
