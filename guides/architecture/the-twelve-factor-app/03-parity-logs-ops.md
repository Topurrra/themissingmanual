---
title: "The Twelve-Factor App"
guide: the-twelve-factor-app
phase: 3
summary: "The canonical checklist for an app that is actually shippable and scalable: config in the environment, stateless processes, logs as streams, and more."
tags: [architecture, twelve-factor, deployment, config, cloud-native, devops]
difficulty: intermediate
synonyms: ["12 factor app", "twelve factor methodology", "12factor", "config in environment", "stateless processes", "cloud native checklist", "heroku twelve factor"]
updated: 2026-06-30
---

# Dev-prod parity, logs as streams, and the operations factors

You've made the app repeatable to deploy and safe to clone. The remaining factors are about the part of an app's life that lasts the longest: living in production. These are the factors that decide whether 2am pages are short or long, whether "it works in staging" means anything, and whether a one-off database fix is routine or terrifying. We'll cover the rest of the twelve here, grouped by the day they save you.

## Factor IV — Backing services are attached resources

The terrible day: your code knows it's talking to *your* Postgres on *that* box, with the connection details woven through the app. The database moves, or you want to swap the local Postgres for a managed one, and you're editing code in twenty places.

The rule: treat every backing service — database, cache, queue, mail server, third-party API — as an **attached resource**, reached only through a URL or credentials in the config. No code-level distinction between a service you run and one a vendor runs.

```text
Swap a backing service with ZERO code change — only config moves:

  DATABASE_URL=postgres://local-db:5432/app     ← dev
  DATABASE_URL=postgres://managed-rds:5432/app  ← prod, different vendor, same code
```

*What just happened:* the app doesn't care who runs the database. Detaching a local one and attaching a managed one is a config change (Factor III again), not a code change. Resources become loosely coupled, swappable, and disposable.

## Factor V — Strictly separate build, release, run

The terrible day: someone fixes a bug by editing code directly on the running server. Now production is a snowflake — the code there exists nowhere else, and the next deploy silently erases the fix.

The rule: three strictly separate stages, and you can never edit code at run time.

```text
BUILD   ── compile code + fetch deps ──►  an immutable build artifact
RELEASE ── build  +  config ──────────►  a release, tagged & unique (v347)
RUN     ── execute that release ──────►  the process running in production
```

*What just happened:* each release is immutable and uniquely tagged, so you always know exactly what's running, and rollback is "run the previous release" rather than "reverse-engineer what changed." Code cannot be modified at run time, which kills the snowflake server for good.

## Factor IX — Disposability: fast startup, graceful shutdown

The terrible day: a deploy takes ten minutes per process to start, so scaling up during a spike arrives long after the spike is over. Or a shutdown kills a process mid-request and the user gets a broken response.

The rule: processes are **disposable** — they start fast and shut down gracefully. On `SIGTERM`, stop accepting new work, finish what's in flight, and exit. Workers should return unfinished jobs to the queue so another process can pick them up.

```bash
# Platform sends SIGTERM. A well-behaved process:
#   1. stops accepting new requests/jobs
#   2. finishes in-flight work (within a grace period)
#   3. exits cleanly
$ kill -TERM <pid>
[info] draining: 2 requests in flight
[info] drained, exiting 0
```

*What just happened:* shutdown lost no work and corrupted nothing, so the platform can stop and start your processes freely. Fast startup plus graceful shutdown is what makes the scaling from phase 2 actually responsive and safe.

## Factor X — Dev-prod parity

The terrible day: "it works on my machine" — and it really did, because your machine runs SQLite and a different OS while production runs Postgres on Linux. The gap between dev and prod is where bugs hide until the worst possible moment.

The rule: keep dev and prod as similar as you can across three gaps — **time** (deploy hours after writing, not weeks), **personnel** (the people who write code also deploy it), and **tools** (same backing services in dev as in prod; don't substitute SQLite for Postgres). Containers exist in large part to close the tools gap.

## Factor XI — Logs are event streams

The terrible day: you need to know what happened during an incident, but the logs are scattered across files on twelve servers, some rotated away, and you're SSH-ing box to box grepping by hand at 3am.

The rule: your app does not manage log files. It treats logs as a **stream of events written to stdout**, unbuffered, and stays completely ignorant of where they go. The execution environment captures the stream and routes it — to the terminal in dev, to an aggregator in prod.

```text
app  ──►  writes events to stdout  ──►  (app's job ends here)
                                          │
              environment routes the stream ▼
        dev: your terminal      prod: aggregator → search, alerts, retention
```

*What just happened:* the app got simpler — no log rotation, no file paths, no log config per environment — and prod got more powerful, because the captured stream can be searched, alerted on, and retained centrally across every process at once.

## Factor XII — Run admin tasks as one-off processes

The terrible day: you run a database migration or a data-fix script by hand on your laptop, against production, with whatever version of the code happened to be checked out. It half-works, and now prod data is in a state nobody designed.

The rule: run admin and management tasks — migrations, one-off scripts, a REPL console — as **one-off processes in an identical environment to the long-running ones**, against the same release, the same config, the same dependencies.

```bash
# Same release, same env, same deps — just a different command, run once.
$ heroku run rails db:migrate           # or:
$ kubectl exec deploy/app -- ./manage migrate
```

*What just happened:* the one-off task ran with the exact code and config of the live release, so it can't drift from production. Admin work stops being a risky improvisation and becomes a repeatable, trustworthy operation.

## The whole checklist, in one breath

When something feels un-shippable, walk the list and find the broken factor: one codebase, declared dependencies, config in the environment, backing services as attached resources, separated build-release-run, stateless processes, port binding, scale via the process model, disposability, dev-prod parity, logs as streams, admin tasks as one-off processes. Most "how do I make this production-ready" questions are one of these twelve in disguise.

For builders: you don't need a giant platform to honor these. A single small service with secrets in env vars, a lock file, stdout logging, and a graceful `SIGTERM` handler is already most of the way there — and it'll survive contact with a real deploy.

```quiz
[
  {
    "q": "According to Factor XI, what should an app do with its logs?",
    "choices": ["Rotate them into dated files on local disk", "Write them as an unbuffered event stream to stdout and let the environment route them", "Ship them directly to a database the app manages", "Email them to the on-call engineer"],
    "answer": 1,
    "explain": "The app writes events to stdout and stays ignorant of routing; the execution environment captures and routes the stream."
  },
  {
    "q": "Which describes a one-off admin process done right (Factor XII)?",
    "choices": ["A migration run from a developer's laptop against prod", "A script run in an environment identical to the app's, against the same release and config", "A long-running daemon that polls for admin commands", "Editing the database by hand over SSH"],
    "answer": 1,
    "explain": "Admin tasks run as one-off processes in an environment identical to the running app — same release, config, and dependencies — so they can't drift from production."
  },
  {
    "q": "What does a disposable process (Factor IX) do when it receives SIGTERM?",
    "choices": ["Immediately exits, dropping any in-flight work", "Ignores it and keeps running until killed", "Stops taking new work, finishes in-flight work, then exits cleanly", "Restarts itself in place"],
    "answer": 2,
    "explain": "Graceful shutdown means refusing new work, draining what's in flight, and exiting cleanly — workers return unfinished jobs to the queue."
  }
]
```

[← Phase 2](02-processes-and-scale.md) | [Overview](_guide.md)
