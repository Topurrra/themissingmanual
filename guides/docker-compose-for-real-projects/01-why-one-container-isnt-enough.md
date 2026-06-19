---
title: "Why One Container Isn't Enough"
guide: "docker-compose-for-real-projects"
phase: 1
summary: "Real apps are a stack of cooperating containers — web, API, database, cache. Running them by hand is a juggling act; Compose declares the whole stack in one file you bring up with one command."
tags: [docker, docker-compose, mental-model, containers, stack]
difficulty: intermediate
synonyms: ["why use docker compose", "what is a docker stack", "managing multiple containers", "docker run is painful for multiple services", "what problem does docker compose solve"]
updated: 2026-06-19
---

# Why One Container Isn't Enough

When you learned single-container Docker, the app *was* the container. One image, one `docker run`, one thing to think about. That clean picture is exactly why the next step feels like a step backward: real apps aren't one container. They're a small team of them.

Open up almost any web app you'd ship and you'll find the same cast: something serving the front-end, an API doing the work, a database holding the data, often a cache to keep things fast. Each of those is its own container. They start up, they need to find each other, they need to be torn down together. This phase is about seeing that shape clearly — and seeing why the tools you already know start to creak under it. Then we install the one idea that fixes it.

## What a "stack" actually is

**What it actually is.** A *stack* is the full set of containers that together make up one running application, plus the connections between them. Not one program — a little system of cooperating programs, each in its own container.

📝 **Stack.** Throughout this guide, "stack" means *all the services that have to be running for your app to work*, treated as a single unit you start and stop together.

A typical web app stack looks like this:

```text
        ┌──────────────────────────────────────────────┐
        │                  your app                     │
        │                                               │
        │   ┌─────────┐     ┌─────────┐     ┌────────┐  │
        │   │   web   │ ──► │   api   │ ──► │   db   │  │
        │   │ (nginx) │     │ (node)  │     │(postgres)│ │
        │   └─────────┘     └────┬────┘     └────────┘  │
        │                        │                      │
        │                        ▼                      │
        │                   ┌─────────┐                 │
        │                   │  cache  │                 │
        │                   │ (redis) │                 │
        │                   └─────────┘                 │
        └──────────────────────────────────────────────┘
          each box = one container    each ──► = "talks to"
```

The web container takes requests and hands the real work to the API. The API reads and writes the database, and checks the cache before doing slow work. Four containers, three connections — and every one of those connections has to actually *exist* for the app to function.

## Why doing this by hand hurts

**The common picture.** "I know `docker run`. I'll just run it four times." You can — and it works right up until it doesn't.

**What it does in real life.** Here's what running this stack by hand actually involves. You start the database:

```console
$ docker run -d --name db \
    -e POSTGRES_PASSWORD=secret \
    -e POSTGRES_DB=shop \
    -v shop_data:/var/lib/postgresql/data \
    --network shopnet \
    postgres:16
```

Then the cache, on the same network:

```console
$ docker run -d --name cache --network shopnet redis:7
```

Then the API, which needs to know where the database and cache live, and needs its own port published:

```console
$ docker run -d --name api \
    -e DATABASE_URL=postgres://postgres:secret@db:5432/shop \
    -e REDIS_URL=redis://cache:6379 \
    -p 3000:3000 \
    --network shopnet \
    my-api:latest
```

…and you haven't even started the web container yet, and you had to create that `shopnet` network and `shop_data` volume *first* or every one of those commands fails.

*What just happened:* You hand-assembled the stack one container at a time, manually keeping four things in sync across four commands: the network name (so they can find each other), the volume name (so data survives), the environment variables (so the API knows the database's address), and the start order (the network must exist before anything joins it).

**The gotcha.** None of that is written down anywhere. It lives in your shell history and your head. Tomorrow you'll mistype one flag and spend twenty minutes on "why can't the API reach the database" — when the real answer is you forgot `--network shopnet` on one line. A new teammate has *no* way to reproduce it except you reading commands aloud. And tearing it all down means remembering all four `--name` values to stop and remove. This is the pain Compose exists to kill.

## The one idea: declare the stack, don't perform it

**What it actually is.** Docker Compose flips the model from *imperative* (you perform a sequence of `run` commands) to *declarative* (you write down what the finished stack should look like, once, in a file called `docker-compose.yml`). Compose reads that file and makes reality match it.

📝 **Declarative.** You describe the desired end state — "these four services, on this network, with these settings" — and the tool figures out the steps to get there. The opposite of typing the steps yourself.

```text
   IMPERATIVE (by hand)                 DECLARATIVE (Compose)
   ─────────────────────                ─────────────────────
   docker run ... db                    docker-compose.yml
   docker run ... cache       ──►         describes the whole
   docker run ... api                     stack, once
   docker run ... web
   (network + volume first!)            $ docker compose up
   (4 commands, kept in sync             (one command reads the
    by hand, every time)                  file and builds it all)
```

**What it does in real life.** Everything you were juggling by hand — the network, the volumes, the environment, the start order, the published ports — becomes a few lines of text. Bringing the entire stack up is one command:

```console
$ docker compose up
```

*What just happened:* Compose read `docker-compose.yml`, created the network and volumes the file describes, and started every service with the right settings and in a sensible order — the same work as those four `docker run` commands, but driven by a file anyone can read, edit, and check into Git.

**Why this saves you later.** The file *is* the documentation. A teammate clones the repo, runs one command, and gets the exact same stack you have — no shell archaeology, no "works on my machine." Six months from now when you've forgotten every detail, the file remembers for you. And tearing the whole thing down is one command too, with nothing left behind. That reproducibility is the entire point.

💡 **Key point.** Compose doesn't do anything you couldn't do with `docker run` by hand. It does the same things, but from a written-down description instead of your memory — and that difference is what makes a multi-service app something a team can actually live with.

## Recap

1. **A real app is a stack** — several cooperating containers (web, API, database, cache), not one.
2. **Each connection between them must really exist** — same network, right addresses, right start order — or the app silently can't talk to itself.
3. **Running a stack by hand is fragile** — the setup lives in your shell history and your head, impossible to reproduce or hand off.
4. **Compose is declarative** — you write down the finished stack once in `docker-compose.yml`, and one command makes it real.
5. **The file is the win** — readable, editable, version-controlled, reproducible by anyone.

Now that you can see the shape of the problem, let's write the file that solves it.

---

[← Guide overview](_guide.md) · [Phase 2: The compose file →](02-the-compose-file.md)
