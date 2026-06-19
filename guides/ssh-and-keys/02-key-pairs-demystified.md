---
title: "Key Pairs, Demystified"
guide: "ssh-and-keys"
phase: 2
summary: "A key pair is a padlock (public key) you hang on the server and the only key (private key) that opens it; it beats passwords because no secret ever travels and it resists brute force. Generate one with ssh-keygen, keep it in ~/.ssh, and install the public half with ssh-copy-id."
tags: [ssh, keys, ssh-keygen, ssh-copy-id, public-key, private-key, security]
difficulty: beginner
synonyms: ["ssh public and private key explained", "how do ssh keys work", "ssh-keygen for beginners", "what goes in ~/.ssh", "how to copy ssh key to server", "why are ssh keys better than passwords"]
updated: 2026-06-19
---

# Key Pairs, Demystified

Passwords are exhausting and a little dangerous. You have to remember them, you type the same secret to the
server every single time you log in, and anything you type can, in principle, be guessed by a machine trying
millions of combinations. SSH keys throw that whole model out and replace it with something that feels like
magic the first time: you log in instantly, with no password sent anywhere, and it's *more* secure, not
less.

The magic is one idea. Let's install it carefully, because once you have the mental model, the commands are
short and the gotcha is obvious.

## The mental model: a padlock and its only key

**What it actually is.** When you make an SSH key, you actually make a **pair** of files that belong
together:

- A **public key** — think of it as an open **padlock**. You can hand it out freely. You hang it on any
  server you want to log into.
- A **private key** — the one and only **key that opens that padlock**. It never leaves your computer. You
  never send it anywhere. Ever.

```text
        YOUR COMPUTER                              THE SERVER
   ┌────────────────────┐                   ┌────────────────────┐
   │  private key  🔑    │                   │  your public key 🔒 │
   │  (stays here,       │   prove ownership │  (a padlock you     │
   │   never travels)    │ ────────────────► │   hung here)        │
   └────────────────────┘                   └────────────────────┘
        the ONE key                              anyone can hold
        that opens the lock                      the padlock; only
                                                 your key opens it
```

The beauty of a padlock: handing someone your padlock tells them **nothing** about your key. They can hang
it on a door, photograph it, copy it — and still can't open it. Only the matching private key can. That's
the heart of how keys work.

**Why people get this wrong.** The names sound symmetric, so beginners assume the two files are
interchangeable, or that the *public* one is the secret. It's the reverse. The public key is meant to be
shared; the **private** key is the secret you guard with your life. Mixing these up is the one mistake that
actually hurts (see the big gotcha below).

## Why this beats passwords

**What it does in real life.** When you log in with a key, the server doesn't ask for a secret you type.
Instead it uses your padlock to pose a little challenge that *only* the matching private key can answer.
Your computer answers it locally, the server sees a correct answer, and you're in. Two things follow from
this, and they're the whole reason keys win:

- **No secret ever travels.** With a password, you send the actual secret across the network on every
  login (encrypted, but still the real thing leaves your machine). With a key, your **private key never
  moves** — only a one-time proof does. There is no reusable secret on the wire to capture.
- **It resists brute force.** A password is short enough for a human to remember, which means it's short
  enough for a machine to eventually guess by trying combinations. A private key is enormous and random —
  far beyond what guessing can reach in any practical time. This is why servers exposed to the internet
  routinely turn passwords *off* and require keys.

💡 **Key point.** Passwords prove who you are by *sending a shared secret*. Keys prove who you are by
*demonstrating you hold the private key* — without revealing it. That single shift is what makes key logins
both effortless and safer.

## Generating a key with `ssh-keygen`

**What it does in real life.** One command creates the pair. The modern, recommended type is `ed25519`
(small, fast, strong). The `-C` flag just adds a comment so you can recognize the key later — your email is
the convention.

```console
$ ssh-keygen -t ed25519 -C "ada@example.com"
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/ada/.ssh/id_ed25519):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /home/ada/.ssh/id_ed25519
Your public key has been saved in /home/ada/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:9pK2vN... ada@example.com
```

*What just happened:* `ssh-keygen` asked three questions (pressing Enter accepts the sensible default for
each) and then wrote **two files**:

- `id_ed25519` — your **private** key. The secret. Guard it.
- `id_ed25519.pub` — your **public** key. Note the `.pub` extension; that's always the padlock, the
  shareable half.

📝 **Terminology — the passphrase.** When it asked for a *passphrase*, that's an optional extra lock on the
**private key file itself**, so that if someone copies the file off your laptop, it's still useless without
the passphrase. It is *not* the server's password — it never goes to the server. Pressing Enter twice
leaves the key unprotected (convenient, riskier). Setting one is safer, and Phase 3 shows how the
**ssh-agent** lets you type it just once per session so it's not annoying.

## `~/.ssh/` — where keys live

**What it actually is.** All of this lives in a hidden folder in your home directory called `~/.ssh/`
(the `~` means "my home folder"). Take a quick look:

```console
$ ls -l ~/.ssh
total 12
-rw-------  1 ada ada  411 Jun 19 09:14 id_ed25519
-rw-r--r--  1 ada ada   98 Jun 19 09:14 id_ed25519.pub
-rw-r--r--  1 ada ada  142 Jun 19 09:02 known_hosts
```

*What just happened:* `ls -l` listed the folder in long form. You can see your two new key files, plus the
`known_hosts` file from Phase 1 (the record of servers you've trusted). Look at the leftmost column — those
letters are **permissions**, and they matter here:

- The private key reads `-rw-------`: only *you* can read or write it. No one else on the machine can even
  look.
- The public key reads `-rw-r--r--`: you can write it, everyone can read it. That's fine — it's meant to be
  shared.

⚠️ **Gotcha — permissions that are too open break logins silently.** SSH is deliberately paranoid: if your
private key or `~/.ssh` folder is readable by other users, SSH **refuses to use the key** rather than risk
it being stolen. If keys mysteriously stop working, this is a prime suspect. The fix is to tighten them:
`chmod 700 ~/.ssh` and `chmod 600 ~/.ssh/id_ed25519`. (`ssh-keygen` sets these correctly when it creates
the files; the trouble usually starts after copying keys around by hand.)

## Installing the public key with `ssh-copy-id`

**What it does in real life.** To log in with your key, the server needs your **padlock** — your public
key — added to a file in *its* `~/.ssh/` called `authorized_keys`. The clean way to do that is one command:

```console
$ ssh-copy-id ada@server.example.com
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
ada@server.example.com's password:

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'ada@server.example.com'"
and check to make sure that only the key(s) you wanted were added.
```

*What just happened:* `ssh-copy-id` logged in **this one last time with your password**, appended your
public key to the server's `~/.ssh/authorized_keys`, and disconnected. You just hung your padlock on the
server. From now on, your private key opens it — no password needed.

Prove it:

```console
$ ssh ada@server.example.com
Welcome to Ubuntu 24.04 LTS

ada@server:~$
```

*What just happened:* No password prompt this time. SSH offered your private key, the server checked it
against the padlock you installed, the match worked, and you were let straight in. (If you set a passphrase
on the key, you'll be asked for *that* once — Phase 3 makes even that a one-time-per-session thing.)

📝 **No `ssh-copy-id`?** On some systems (notably stock Windows) the command isn't installed. The same job
is just appending the contents of your `id_ed25519.pub` to the server's `~/.ssh/authorized_keys` — any
method that gets that one line of text into that one file works. `ssh-copy-id` automates it safely.

## The one rule that matters most

⚠️ **Gotcha — NEVER share or commit your PRIVATE key.** This is the single most important sentence in the
guide. Your private key (`id_ed25519`, the file *without* `.pub`) is the only thing standing between you and
anyone who wants to log in as you. So:

- **Never paste it** into a chat, an email, a ticket, or a forum post.
- **Never commit it** to a Git repository — accidentally pushing a private key to GitHub is a genuinely
  common, genuinely bad mistake, and bots scan for exactly this.
- **Never copy it onto a shared machine.** If you need to log in from another computer, generate a *new*
  key pair there.

The public key (`.pub`) is the opposite — share it freely, that's its entire purpose. The rule is simple
once you hold the mental model: you can hand out as many copies of the padlock as you like, but the key
that opens it stays in your pocket, always.

## Recap

1. **A key pair = a padlock (public key) + its only key (private key).** Hand out the padlock; guard the
   key.
2. **Keys beat passwords** because no secret travels on login, and a private key is too large to brute-force.
3. **`ssh-keygen -t ed25519`** creates the pair in `~/.ssh/`: `id_ed25519` (private) and `id_ed25519.pub`
   (public).
4. **A passphrase** is an optional extra lock on the *private key file*, not the server's password.
5. **`ssh-copy-id user@host`** installs your public key on the server so future logins use the key.
6. **Never share or commit the private key.** The `.pub` file is the only half you ever hand out.

You can now log in without typing a password. Next: making SSH pleasant to live with — short names instead
of long host strings, typing your passphrase once instead of every time, and reading the errors everyone
eventually hits.

---

[← Phase 1: What SSH Is](01-what-ssh-is.md) · [Guide overview](_guide.md) · [Phase 3: Living With SSH →](03-living-with-ssh.md)
