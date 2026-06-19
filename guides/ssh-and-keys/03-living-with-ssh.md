---
title: "Living With SSH"
guide: "ssh-and-keys"
phase: 3
summary: "Make SSH pleasant: ~/.ssh/config turns long host strings into short names, the ssh-agent remembers your passphrase for the session, and a cheat-card maps the common errors — Permission denied (publickey) and the changed host-key warning — to calm fixes."
tags: [ssh, ssh-config, ssh-agent, permission-denied, known-hosts, troubleshooting]
difficulty: beginner
synonyms: ["ssh config file shortcuts", "what is ssh-agent", "permission denied publickey fix", "remote host identification has changed", "ssh host key changed", "ssh add passphrase once"]
updated: 2026-06-19
---

# Living With SSH

You can get in, and you can get in with a key. Now let's make SSH something you barely think about: a short
name instead of a long command, your passphrase typed once instead of every time, and — when something does
go wrong — a calm, short list of what the error means and how to fix it.

If you arrived here mid-panic with an error in your terminal, start with the cheat-card. The explanations
underneath are for when you have a minute to actually understand it.

## Cheat-card: common errors → calm fixes

| What you see | What it means | Calm fix |
|---|---|---|
| `Permission denied (publickey)` | The server didn't accept your key (or you offered the wrong one / wrong username). | Check the **username** and that your **public key is in the server's `authorized_keys`**. See [below](#permission-denied-publickey). |
| `Permission denied (publickey,password)` | Same, but the server *would* take a password — your key just didn't work. | Same checks as above; you can also retry with a password to get in and fix the key. |
| `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!` | The server's host key is different from what you trusted before. | Confirm the change is expected, then remove the old line: `ssh-keygen -R hostname`. See [below](#the-host-key-changed-warning). |
| `Could not open a connection to your authentication agent` | The ssh-agent isn't running in this shell. | Start it: `eval "$(ssh-agent -s)"`, then `ssh-add`. See [below](#the-ssh-agent). |
| `Connection refused` | Nothing is listening for SSH at that host/port. | The server may be off, the address wrong, or SSH not running there. Verify the host and that the machine is up. |
| `Connection timed out` | No reply at all — usually a firewall or wrong address. | Double-check the host/IP; a firewall may be blocking you. |

Now the parts worth understanding.

## `~/.ssh/config` — stop typing long host strings

**What it actually is.** Typing `ssh ada@server.example.com` over and over (and remembering which key, which
port, which username for *which* server) gets old fast. The file `~/.ssh/config` lets you save all of that
under a **short nickname** you make up.

**What it does in real life.** Create or edit `~/.ssh/config` and add a block:

```text
Host myserver
    HostName server.example.com
    User ada
    IdentityFile ~/.ssh/id_ed25519
```

Each line is plain: `Host` is the nickname you'll type, `HostName` is the real address, `User` is the
account to log in as, and `IdentityFile` points at the private key to use. Now your daily login shrinks to:

```console
$ ssh myserver
ada@server:~$
```

*What just happened:* SSH read `~/.ssh/config`, saw the nickname `myserver`, and expanded it into the full
`ada@server.example.com` connection using the key you named. You typed one short word; SSH filled in the
rest. The same nickname works with related tools too (like `scp`), so it pays off everywhere.

💡 **Key point.** The config file is pure convenience — it changes *nothing* about security. It just saves
you from memorizing and retyping connection details. The moment you have more than one server, you'll want
it.

## The ssh-agent — type your passphrase once

**What it actually is.** If you protected your private key with a passphrase (Phase 2 — and you should), SSH
asks for it *every* time you connect. The **ssh-agent** is a small program that holds your **unlocked**
private key in memory for the duration of your session, so you type the passphrase once and SSH borrows the
key from the agent after that.

```text
   first connection:  you type passphrase ──► agent unlocks & holds the key
   every connection after:  SSH asks the agent ──► instant, no passphrase
   you log out / reboot:  agent forgets ──► you'll type it once again next time
```

**What it does in real life.** On most desktop systems the agent is already running. You hand it your key
once with `ssh-add`:

```console
$ ssh-add ~/.ssh/id_ed25519
Enter passphrase for /home/ada/.ssh/id_ed25519:
Identity added: /home/ada/.ssh/id_ed25519 (ada@example.com)
```

*What just happened:* You typed the passphrase one time. The agent unlocked the key and is now holding it.
For the rest of this login session, `ssh myserver` just works — no more passphrase prompts — because SSH
quietly asks the agent instead of asking you.

⚠️ **Gotcha — "Could not open a connection to your authentication agent."** This means no agent is running
in your current shell. Start one and try again:

```console
$ eval "$(ssh-agent -s)"
Agent pid 4123
$ ssh-add ~/.ssh/id_ed25519
Identity added: /home/ada/.ssh/id_ed25519 (ada@example.com)
```

*What just happened:* `ssh-agent -s` printed the setup commands for a new agent, and `eval` ran them so your
shell knows how to reach it. Then `ssh-add` worked. The agent forgets everything when you log out or reboot
— that's by design; it's a session convenience, not permanent storage.

## When it breaks

### `Permission denied (publickey)`

**What it means.** This is the error everyone meets eventually, and it's almost always one of a few mundane
things — not a deep failure. The server did not accept your key, so it slammed the door.

Walk this short checklist, top to bottom:

```console
$ ssh -v ada@server.example.com
...
debug1: Offering public key: /home/ada/.ssh/id_ed25519 ED25519 SHA256:9pK2vN...
debug1: Authentications that can continue: publickey
...
ada@server.example.com: Permission denied (publickey).
```

*What just happened:* The `-v` ("verbose") flag makes SSH narrate what it tried — here you can see it
*offered* your key and the server still said no. That narration is your best diagnostic tool. The usual
causes, in order of how often they're the culprit:

1. **Wrong username.** You logged in as `ada` but the account is `ubuntu` (or `root`, or `git`). The
   username is part of *who* you're proving to be; get it wrong and the right key still fails. Double-check
   what account exists on that machine.
2. **Public key not installed on the server.** Your padlock isn't in the server's `~/.ssh/authorized_keys`,
   so there's nothing for your private key to match. Re-run `ssh-copy-id ada@server.example.com` (it'll ask
   for the password once) to install it.
3. **Wrong key offered.** If you have several keys, SSH may not be offering the one the server knows. Point
   at the right one explicitly — `ssh -i ~/.ssh/id_ed25519 ada@server.example.com` — or, better, name it in
   `~/.ssh/config` (above) so it's automatic.
4. **Permissions too open.** As covered in Phase 2, SSH refuses a private key that other users could read.
   Tighten with `chmod 700 ~/.ssh` and `chmod 600 ~/.ssh/id_ed25519`.

🪖 **War story.** Nine times out of ten, `Permission denied (publickey)` on a fresh cloud box is just the
username. People paste a guide that says `ssh root@...` when their provider actually set up an `ubuntu`
account, get the error, and assume their keys are broken. They aren't — try the right username first, every
time, before touching anything else.

### The host-key-changed warning

**What it means.** Remember the fingerprint you trusted in Phase 1? If a server's host key later *changes*,
SSH stops you cold with a wall of capital letters:

```console
$ ssh myserver
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@    WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!     @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
IT IS POSSIBLE THAT SOMEONE IS DOING SOMETHING NASTY!
...
Add correct host key in /home/ada/.ssh/known_hosts to get rid of this message.
Offending ECDSA key in /home/ada/.ssh/known_hosts:14
Host key verification failed.
```

*What just happened:* SSH compared the server's current fingerprint to the one you trusted earlier, found
they differ, and refused to connect — because a changed key *can* mean an impostor sitting in the middle. It
even tells you which line of `known_hosts` is the stale one (`:14` here).

**The calm fix — but think first.** The honest part: usually this is innocent — the server was rebuilt,
reinstalled, or replaced, so it legitimately has a new identity. But "usually" isn't "always," so confirm
the change was expected (you or your provider rebuilt the box) *before* clearing it. When you're satisfied
it's legitimate, remove the old record and reconnect:

```console
$ ssh-keygen -R server.example.com
# Host server.example.com found: line 14
/home/ada/.ssh/known_hosts updated.
$ ssh myserver
The authenticity of host 'server.example.com (203.0.113.10)' can't be established.
ED25519 key fingerprint is SHA256:Kp3rN7...
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
ada@server:~$
```

*What just happened:* `ssh-keygen -R` ("remove") deleted the outdated entry for that host from
`known_hosts`. With the stale record gone, the next connection is treated like a brand-new one — you get the
first-time fingerprint prompt again, you confirm, and you're back in. You've re-taught your machine
what the server now looks like.

⚠️ **Gotcha — don't reflexively clear this on a machine you didn't change.** If you *didn't* rebuild the
server and have no idea why its key changed, that's exactly the situation the warning exists for. Pause and
check with whoever runs the machine before deleting the entry. The warning is annoying precisely so you
won't ignore the rare time it's real.

## Where to go next

You now have the full beginner's toolkit: get in, prove who you are with keys, and stay calm when it breaks.
The natural next step is putting this to work on a machine you actually rent — generating a key, adding it at
the provider, and logging into a fresh box. That's exactly what [Deploying to a
VPS](/guides/deploying-to-a-vps) walks through, and everything in this guide is the foundation it builds on.

## Recap

1. **`~/.ssh/config`** turns long connection strings into short nicknames — pure convenience, zero security
   change.
2. **The ssh-agent** holds your unlocked key for the session so you type your passphrase once
   (`ssh-add` to load it; `eval "$(ssh-agent -s)"` if no agent is running).
3. **`Permission denied (publickey)`** is usually the username, a missing public key on the server, the
   wrong key being offered, or open permissions — check with `ssh -v`.
4. **A changed host key** stops you on purpose; confirm the change is expected, then clear the stale entry
   with `ssh-keygen -R hostname`.
5. **The cheat-card** at the top maps every common error to its fix — come back to it whenever something
   refuses you.

---

[← Phase 2: Key Pairs, Demystified](02-key-pairs-demystified.md) · [Guide overview](_guide.md)
