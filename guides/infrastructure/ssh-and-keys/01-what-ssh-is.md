---
title: "What SSH Is"
guide: "ssh-and-keys"
phase: 1
summary: "SSH is an encrypted terminal into another machine: ssh user@host opens a session, the first-connection fingerprint prompt is SSH asking 'is this really the server?', and a session is just a remote shell that ends when you log out."
tags: [ssh, remote, terminal, session, fingerprint, host-key]
difficulty: beginner
synonyms: ["what is ssh", "how does ssh work", "ssh user@host explained", "what is the ssh fingerprint prompt", "what is an ssh session"]
updated: 2026-06-19
---

# What SSH Is

You've used a terminal on your own computer. You type a command, your machine runs it, you see the output.
SSH is that exact experience - except the machine running your commands is somewhere else. A server in a
data center. A Raspberry Pi in your closet. A cloud box you rented ten minutes ago. You type on your
keyboard, the commands travel across the internet, the *other* machine runs them, and its output travels
back to your screen.

That's the whole idea. Let's make it solid before touching a single command.

## What SSH actually is

**What it actually is.** SSH stands for **Secure Shell**. A *shell* is the program that reads your typed
commands and runs them (the thing you're already using locally). SSH gives you a shell on a *remote*
machine, with every keystroke and every byte of output **encrypted** as it crosses the network. Picture a
sealed pipe running between your terminal and the far machine: anyone watching the wire in between sees
only scrambled noise.

📝 **Terminology.** People say "SSH into the server," "SSH to the box," or just "ssh in." All three mean
the same thing: open an encrypted shell session on a remote machine.

**Why people get this wrong.** Newcomers imagine SSH *transfers files* or *is a website thing*. It isn't.
SSH gives you a **command line on another computer** - the same prompt you'd get if you walked over and
sat at its keyboard. (Copying files happens *over* SSH with separate tools like `scp`; that's a follow-up
topic.) If you can use a terminal, you already know how to use a machine over SSH. The only new part is
getting *in*.

**Why this matters.** Before SSH, people logged into remote machines with a tool called Telnet, which sent
everything - including your password - as plain readable text across the network. Anyone in between could
read it. SSH exists to fix exactly that: prove who you are and carry your session, all encrypted, so the
network in the middle learns nothing.

## The command: `ssh user@host`

**What it actually is.** One command opens a session. Here's the anatomy:

```text
   ssh   ada @ server.example.com
   │     │   │
   │     │   └── the host: which machine to connect to
   │     │       (a domain name, or a raw IP like 203.0.113.10)
   │     └────── the @ separates "who" from "where"
   └──────────── the user: which account to log in AS on that machine
```

So `ssh ada@server.example.com` means: *"Connect to the machine at `server.example.com` and log me in as
the user `ada`."* The user is an account **on the remote machine**, not your local username - though if you
leave the `user@` off, SSH assumes the remote username matches your local one.

**A real example.** Here's a first connection. Read the whole thing; we'll unpack the surprising middle
part next.

```console
$ ssh ada@server.example.com
The authenticity of host 'server.example.com (203.0.113.10)' can't be established.
ED25519 key fingerprint is SHA256:Vlt8x2pQ0r9kZ3mC7nB1aF6dH4jL5sT0uW8yE2gXoI.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'server.example.com' (ED25519) to the list of known hosts.
ada@server.example.com's password:
Welcome to Ubuntu 24.04 LTS

ada@server:~$
```

*What just happened:* A lot, in a calm order. SSH reached the remote machine, stopped to ask you a
one-time trust question (the fingerprint block - explained next), accepted your `yes`, asked for `ada`'s
password, and then dropped you at a **new prompt**: `ada@server:~$`. That last line is the tell - your
prompt changed. You are no longer typing into your own computer. Every command from here runs *on the
server*, as the user `ada`.

⚠️ **Gotcha - passwords here are invisible.** When SSH asks for a password, your terminal shows
**nothing** as you type - no dots, no stars, no moving cursor. This is on purpose (so nobody reads your
password length over your shoulder), but it makes everyone think the keyboard is broken the first time.
It isn't. Type the password and press Enter. (In Phase 2 we replace passwords with keys, which skip this
prompt entirely.)

## That first-connection fingerprint prompt

This is the part that makes people nervous, so let's defuse it completely.

**What it actually is.** The very first time you connect to a machine, SSH has never seen it before, so it
can't be sure the thing answering is the *real* server and not an impostor sitting in the middle. It shows
you the server's **host-key fingerprint** - a short, unique label derived from the server's identity - and
asks you to confirm it.

```text
   This is SSH saying:
   "Someone is claiming to be server.example.com. Their ID badge reads
    SHA256:Vlt8x2pQ...XoI. Do you trust this is who you meant to reach?"
```

**What it does in real life.** When you answer `yes`, SSH writes that fingerprint to a file on *your*
machine called `~/.ssh/known_hosts`. From then on, every time you connect, SSH silently checks that the
server's fingerprint still matches what it recorded. If it matches, you're not asked again - that's why you
only see this prompt once per machine. (The "Permanently added... to the list of known hosts" line in the
output above is SSH telling you it just saved the record.)

**The gotcha - and why this is a feature, not a nuisance.** If you ever connect later and the fingerprint
has *changed*, SSH will loudly refuse and warn you, because a changed key can mean someone is impersonating
the server. Most of the time it's innocent (the server was rebuilt and got a new identity), but SSH errs on
the side of stopping you. We cover that exact warning, and the safe way to clear it, in the
[Phase 3 cheat-card](03-living-with-ssh.md).

💡 **Key point.** The fingerprint prompt isn't a hurdle - it's SSH protecting you. The honest answer is:
if you genuinely set up or were given this server, `yes` is correct. The first `yes` is you teaching your
machine what the real server looks like.

## What a "session" is

**What it actually is.** A **session** is the live connection from the moment you log in to the moment you
leave. While the session is open, your terminal is a window into the remote machine. Whatever you'd do
sitting at its keyboard, you do here.

**What it does in real life.** Try a couple of harmless commands once you're in, and watch where they run:

```console
ada@server:~$ whoami
ada
ada@server:~$ hostname
server
ada@server:~$ pwd
/home/ada
```

*What just happened:* `whoami` reported `ada` (the remote account you logged in as, not your local
username), `hostname` reported the *server's* name, and `pwd` ("print working directory") showed you're
sitting in `ada`'s home folder **on the server**. These confirm the truth that the changed prompt already
hinted: you are operating on the remote machine.

**Ending the session.** When you're done, you leave:

```console
ada@server:~$ exit
logout
Connection to server.example.com closed.
$
```

*What just happened:* `exit` (you can also press `Ctrl-D`) closed the remote shell. The session ended, the
encrypted pipe was torn down, and your prompt snapped back to `$` - you're home, on your own machine again.
Nothing you ran remotely keeps running in your local terminal; the two were only joined for the life of the
session.

⚠️ **Gotcha - know which machine you're on.** The single most common beginner mistake is forgetting whether
a prompt is local or remote, then running a command (especially a destructive one) on the wrong machine.
Your anchor is the **prompt**: `ada@server:~$` means you're *on the server*; a bare `$` (or your usual local
prompt) means you're home. When in doubt, run `hostname` - it never lies about where you are.

## Recap

1. **SSH = Secure Shell.** It's a command line on another computer, with everything encrypted on the wire.
2. **`ssh user@host`** opens a session: log in as `user` on the machine `host`.
3. **The fingerprint prompt** appears once per machine - it's SSH asking you to confirm the server is real,
   then saving that fact in `~/.ssh/known_hosts`.
4. **Passwords typed at the SSH prompt are invisible** by design - keep typing.
5. **A session** lasts from login to `exit`; your prompt changing is the sign you've arrived.

You can already get in with a password. The trouble with passwords is that they're typed, guessable, and
travel each time you connect. Next, we replace them with something far better.

---

[← Guide overview](_guide.md) · [Phase 2: Key Pairs, Demystified →](02-key-pairs-demystified.md)
