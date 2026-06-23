---
title: "Environment Variables & .env Files"
guide: "env-vars-and-config"
phase: 2
summary: "An environment variable is a name=value pair the operating system hands your process; here's how to read one from the shell and from code, and how .env files load them for local development — plus why you must never commit a .env file."
tags: [environment-variables, dotenv, env, shell, secrets, beginner-friendly]
difficulty: beginner
synonyms: ["what is an environment variable", "how to read env var in code", "echo $VAR explained", "what is a .env file", "should i commit .env to git", "how to set an environment variable"]
updated: 2026-06-19
---

# Environment Variables & .env Files

You've seen them in READMEs (`export API_KEY=...`), in error messages (`DATABASE_URL is not set`), and in
that mysterious `.env` file everyone has but nobody explains. Environment variables are the single most
common way config reaches a running program, and once you see what they actually are, they stop being
magic. Let's make them ordinary.

## What an environment variable actually is

**What it actually is.** An **environment variable** is a `NAME=value` pair that the operating system
keeps for a running program and its children. When your program starts, it inherits a little bag of these
pairs — its **environment** — and it can look any of them up by name. That's the whole concept: named
values handed to a process from the outside.

```text
   ┌──────────── the process's environment ────────────┐
   │  DATABASE_URL = postgres://localhost:5432/myapp    │
   │  LOG_LEVEL    = debug                              │
   │  API_KEY      = sk_test_abc123                     │
   │  PATH         = /usr/local/bin:/usr/bin:/bin       │
   └────────────────────────────────────────────────────┘
            │  your program reads these by name
            ▼
        "give me DATABASE_URL"  →  "postgres://localhost:5432/myapp"
```

📝 **Terminology.** The convention is **ALL_CAPS_WITH_UNDERSCORES** for the name. That's just a
convention, not a rule the OS enforces — but every project follows it, so you should too. The value is
always text (a string); even a "number" like a port is stored as the characters `"5432"`.

**Why people get this wrong.** A common assumption is that environment variables are something Python or
Node or your framework invented. They're not — they're an operating-system feature that predates all of
them. Your shell has them, every program has them, and that `PATH` variable that tells your terminal
where to find commands? Same mechanism. Frameworks just give you a convenient way to *read* them.

## Reading a variable from the shell

The fastest way to see one is from your terminal. On macOS or Linux, `echo` prints a value and `$NAME`
asks the shell for that variable:

```console
$ echo $HOME
/home/ada
```
*What just happened:* The shell looked up the `HOME` variable — which the OS set for you at login — and
substituted its value, then `echo` printed it. `HOME` is one your system always sets; it points at your
user folder.

Ask for one that isn't set, and you get nothing — an empty line, not an error:

```console
$ echo $DATABASE_URL

```
*What just happened:* `DATABASE_URL` isn't set in this shell, so `$DATABASE_URL` expanded to *nothing*,
and `echo` printed a blank line. This is the root of those `is not set` errors: the program asked for a
variable, the OS had nothing, and the program gave up.

⚠️ **Gotcha — Windows is different.** The `echo $VAR` syntax is for the Unix shells (bash, zsh). On
Windows **PowerShell** the same lookup is `echo $env:HOME`, and in the old **Command Prompt** it's
`echo %HOME%`. The *concept* is identical everywhere — only the syntax for reading differs.

You can set one for the current shell session like this (Unix):

```console
$ export LOG_LEVEL=debug
$ echo $LOG_LEVEL
debug
```
*What just happened:* `export` created the variable `LOG_LEVEL` and marked it so that programs you launch
*from this shell* inherit it. Two things to know: it's spelled with no spaces around the `=`, and it's
**temporary** — it lives only until you close this terminal window. That temporariness is exactly the
problem `.env` files solve, coming up.

## Reading a variable from your code

Every language has a built-in way to read the environment. You don't import a library for this part — the
variables are just *there* for any program. A few of the common ones:

```text
   Python      os.environ["DATABASE_URL"]        # or os.environ.get(...) for a safe default
   Node.js     process.env.DATABASE_URL
   Ruby        ENV["DATABASE_URL"]
   Go          os.Getenv("DATABASE_URL")
   Rust        std::env::var("DATABASE_URL")
```

Here's the shape it takes in practice (Python), and what it does when you run it:

```console
$ export GREETING=hello
$ python3 -c "import os; print(os.environ.get('GREETING', 'default'))"
hello
$ python3 -c "import os; print(os.environ.get('MISSING', 'default'))"
default
```
*What just happened:* The first call read `GREETING` from the environment we just exported and printed
its value. The second asked for `MISSING`, which we never set — and because we used `.get()` with a
fallback of `'default'`, the program printed that fallback instead of crashing. That fallback pattern is
how you give a setting a sensible default while still letting the environment override it.

⚠️ **Gotcha — everything is a string.** A variable read from the environment is always text. If you set
`PORT=8080` and your code needs a number, you have to convert it (`int(os.environ["PORT"])` in Python).
Forgetting this gives confusing errors like trying to do math on the string `"8080"`.

## `.env` files — sane local development

**Why people get this wrong.** Setting variables by hand with `export` works, but it's miserable for
daily work: the values vanish when you close the terminal, and a real app might need a dozen of them. You
do not want to re-type twelve `export` lines every morning. There's a standard fix.

**What it actually is.** A **`.env` file** (pronounced "dot-env") is a plain text file in your project,
one `NAME=value` per line, that a small library loads into the environment when your app starts. It's a
convenience: instead of exporting variables by hand, you write them down once.

A typical `.env` looks like this:

```text
DATABASE_URL=postgres://localhost:5432/myapp_dev
LOG_LEVEL=debug
API_KEY=sk_test_abc123
PORT=8080
```

To load it, you add a tiny library — `python-dotenv` for Python, `dotenv` for Node, and so on. In Python:

```console
$ pip install python-dotenv
$ python3 -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.environ['LOG_LEVEL'])"
debug
```
*What just happened:* `load_dotenv()` found the `.env` file in the current folder, read each line, and
placed those pairs into the process environment — exactly as if you'd `export`ed every one by hand. After
that, `os.environ['LOG_LEVEL']` reads `debug` from the file. Your code doesn't change at all; it still
just reads environment variables. The `.env` file only *populates* them.

💡 **Key point.** The `.env` file is a **development** convenience. In staging and production you usually
*don't* ship a `.env` file — the hosting platform (or your container, or a secrets manager) sets the real
environment variables directly. Your code reads `os.environ[...]` the same way in every environment; only
the *source* of those values changes. That's the payoff from [Phase 1](01-why-config-lives-outside-code.md):
one codebase, different surroundings.

## ⚠️ Never commit your `.env`

This is the rule that gets its own heading because getting it wrong is genuinely costly.

Your `.env` file holds the real values for *your* machine — and on real projects, that includes
**secrets**: API keys, database passwords, tokens. If you commit `.env` to Git, those secrets go into the
repository's history, where they're visible to everyone with access and effectively impossible to fully
erase (deleting the file in a later commit doesn't remove it from history).

So you tell Git to ignore it. Add this one line to a file named `.gitignore` in your project:

```text
.env
```

Then confirm Git is actually ignoring it:

```console
$ git status
On branch main
nothing to commit, working tree clean
```
*What just happened:* Even though `.env` exists on disk, it doesn't appear in `git status` — `.gitignore`
told Git to pretend it isn't there, so you can't accidentally stage or commit it. If `.env` *did* show up
in that list, it isn't ignored yet, and you should fix that before your next commit.

📝 **The `.env.example` convention.** Since `.env` itself is secret and uncommitted, projects commit a
companion file called **`.env.example`** instead. It lists the *names* every variable needs, with fake or
blank values, so a new teammate knows what to fill in:

```text
DATABASE_URL=
LOG_LEVEL=debug
API_KEY=your_test_key_here
PORT=8080
```

When you clone a project, the ritual is: copy `.env.example` to `.env`, then fill in the real values.
That's the `is not set` error from the start of this guide, solved.

This is only the *first* layer of keeping secrets safe — keeping them out of Git. How to store and
distribute production secrets properly (vaults, encrypted files, cloud secret managers) is a whole topic
of its own: [Secrets Management](/guides/secrets-management).

**Why this saves you later.** Reading config from the environment means the *same code* works on your
laptop with a `.env` file and in production with platform-injected variables — and keeping `.env` out of
Git means a leaked laptop or a public repo doesn't hand an attacker your production keys.

## Recap

1. An **environment variable** is a `NAME=value` pair the OS gives your running program; your code reads
   it by name (`os.environ`, `process.env`, `ENV[...]`, etc.).
2. Read one from the shell with `echo $NAME` (Unix), `$env:NAME` (PowerShell), or `%NAME%` (cmd). An
   unset variable reads as **empty**, which is what `is not set` errors come from.
3. Everything is a **string** — convert ports and numbers yourself.
4. A **`.env` file** loads many variables at once for local development; a small library reads it into the
   environment so your code doesn't change.
5. **Never commit `.env`** — add it to `.gitignore`. Commit a `.env.example` listing the variable names
   instead.

Next: when a handful of variables isn't enough and you need structured, nested config — YAML and friends.

---

[← Phase 1: Why Config Lives Outside Code](01-why-config-lives-outside-code.md) · [Guide overview](_guide.md) · [Phase 3: Config Files: YAML & Friends →](03-config-files-yaml.md)
