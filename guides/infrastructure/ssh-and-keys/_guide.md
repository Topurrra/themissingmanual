---
title: "SSH & Keys, Explained"
guide: "ssh-and-keys"
phase: 0
summary: "What SSH actually is (an encrypted remote terminal into another machine), how key pairs replace passwords, and how to live with SSH day to day - config shortcuts, the agent, and the errors that bite everyone."
tags: [ssh, keys, ssh-keygen, remote, security, terminal]
category: infrastructure
order: 2
difficulty: beginner
synonyms: ["what is ssh", "how does ssh work", "ssh public and private key explained", "ssh-keygen for beginners", "permission denied publickey fix", "how to log into a server"]
updated: 2026-06-19
---

# SSH & Keys, Explained

The first time someone tells you to "just SSH into the server," it sounds like a secret handshake. You
type a command full of `@` and `:` symbols, a wall of text about fingerprints appears, you say *yes* to
something you don't understand, and suddenly your terminal is... somewhere else. Then later you're told to
"add your key," and now there are two files, one of which you must *never* share, and a single wrong move
gives you the dreaded `Permission denied (publickey)`.

Here's the calm version. SSH is one small idea - an encrypted terminal into another machine - plus one
clever trick for proving who you are without ever sending a password. Once those two ideas click, every
command and every error message stops being mysterious. This guide walks you there, slowly, with real
output at every step.

## How to read this
- **Stuck on an error right now?** Jump to [Phase 3: Living With SSH](03-living-with-ssh.md) and use the
  cheat-card at the top - it maps the common errors to calm fixes.
- **Want it to finally make sense?** Read in order. Phase 1 gives you the mental model, Phase 2 gives you
  the keys that make logins safe and effortless, and Phase 3 is how you actually live with it.

## The phases
1. **[What SSH Is](01-what-ssh-is.md)** - an encrypted remote terminal into another machine, the
   `ssh user@host` command line by line, and that first-connection fingerprint prompt explained.
2. **[Key Pairs, Demystified](02-key-pairs-demystified.md)** - public and private keys as a padlock and
   its only key, why this beats passwords, and how to generate and install one.
3. **[Living With SSH](03-living-with-ssh.md)** - the `~/.ssh/config` for shortcuts, the agent so you type
   your passphrase once, and the errors everyone hits, calmly fixed.

> This is the beginner's map. Deeper topics - port forwarding and tunnels, jump hosts, hardening
> `sshd_config` on a server you run - are deliberately left for follow-up guides so this one stays a clear
> on-ramp. When you're ready to put a key on a real machine you rent, [Deploying to a
> VPS](/guides/deploying-to-a-vps) picks up where this leaves off.

**Related:** [What a Server Is](/guides/what-a-server-is) · [Deploying to a VPS](/guides/deploying-to-a-vps) · [Linux for Servers](/guides/linux-for-servers)
