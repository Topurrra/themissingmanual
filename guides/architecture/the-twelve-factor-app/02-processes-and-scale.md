---
title: "Stateless processes, port binding, and scaling out"
guide: the-twelve-factor-app
phase: 2
summary: "The canonical checklist for an app that is actually shippable and scalable: config in the environment, stateless processes, logs as streams, and more."
tags: [architecture, twelve-factor, deployment, config, cloud-native, devops]
difficulty: intermediate
synonyms: ["12 factor app", "twelve factor methodology", "12factor", "config in environment", "stateless processes", "cloud native checklist", "heroku twelve factor"]
updated: 2026-06-30
---

# Stateless processes, port binding, and scaling out

The foundation from phase 1 makes a deploy repeatable. This phase is about how the *running* app behaves — and the whole point is one word: **multiplicity**. You want to be able to run many copies of your app, kill any of them, and start new ones, without anyone noticing. Almost every "we can't scale" story is really a story about one of these factors being broken. Once you can run ten copies as safely as one, scaling stops being scary and becomes a slider you drag.

## Factor VI — Processes are stateless

The terrible day: a user uploads a file, the next request lands on a different server, and the file is gone. Or you deploy, the old process dies, and everyone's shopping cart vanishes. Or you can never restart the app during business hours because restarting *loses something*.

The rule: your processes are **stateless and share-nothing**. Anything that must persist goes into a backing service — a database, a cache, object storage. The process itself holds nothing it can't afford to lose the instant it dies.

```text
Request 1 ──► [process A]  writes session to ──► [Redis / Postgres]
Request 2 ──► [process B]  reads  session from ──► [Redis / Postgres]
                  ▲
        either process can serve either request,
        because neither one OWNS the state
```

*What just happened:* because state lives in a shared backing service, it does not matter which process handles a given request. Process B can answer a request that process A started. Kill either one and nothing is lost.

The classic trap is **sticky sessions** — pinning a user to one server so their in-memory session survives. It works until that server restarts or you need to scale, and then it doesn't. The fix is to stop keeping the session in memory: put it in a shared store and any process can serve any user.

Local disk and memory are scratch space only — fine for the duration of one request, gone after. Treat them like a whiteboard you wipe between meetings, never a filing cabinet.

## Factor VII — Export services via port binding

The terrible day is subtler: your app only runs because it's hand-wired into a specific Apache or nginx install on a specific box, with config that lives nowhere in your repo. Move it and it dies, because the webserver *was* part of the app and nobody wrote that down.

The rule: the app is **self-contained** and exports its service by binding to a port. It *is* the web server. It doesn't get injected into one.

```bash
# The app starts its own HTTP listener. Nothing external required to "serve" it.
$ PORT=5000 ./my-app
Listening on http://0.0.0.0:5000

# In another deploy it binds a different port — the env decides (see Factor III).
$ PORT=8080 ./my-app
Listening on http://0.0.0.0:8080
```

*What just happened:* the app owns its own listening socket. A routing layer or load balancer sits in front and forwards traffic to that port, but the app needs nothing injected to be a complete, runnable service. This is exactly why containers work the way they do — a Dockerfile that ends in `EXPOSE 5000` is Factor VII made literal.

## Factor VIII — Scale out via the process model

Now the payoff. Because processes are stateless (VI) and self-contained (VII), scaling is no longer "buy a bigger server." It's "run more processes." This is **scaling out** (more copies) versus **scaling up** (a beefier box), and the process model is what makes scaling out trivial.

The twelve-factor framing is that an app is a collection of **process types**, and you scale each type independently by running more of it:

```text
web    = ./my-app                  → run 8 of these (handle HTTP)
worker = ./my-app --jobs           → run 3 of these (background jobs)
clock  = ./my-app --scheduler      → run 1 of these (periodic tasks)
```

*What just happened:* traffic spikes? Run more `web` processes. Job queue backing up? Run more `worker` processes. Each type scales on its own axis, and because every process is stateless, adding or removing one is safe at any moment.

The deep idea: never daemonize your app or write your own PID files to manage copies. Let the process model — the operating system, the container orchestrator, the platform — own that. Your job is to make one process that's safe to run N times. The platform's job is to run N of them.

For builders: this trio is the entire reason container platforms and orchestrators exist. Kubernetes "replicas," a `docker compose` `scale`, a platform's "dynos" — all of it assumes your process is stateless, self-contained, and safe to clone. When scaling that way fights you, the cause is almost always a broken Factor VI. The trade-offs of scaling out at large numbers — coordination, data partitioning, the limits of horizontal scale — are their own topic in /guides/designing-for-scale.

```quiz
[
  {
    "q": "Why do sticky sessions break Factor VI?",
    "choices": ["They use too much memory", "They pin state to one process's memory, so it's lost on restart and blocks scaling", "They require a load balancer", "They store sessions in the database"],
    "answer": 1,
    "explain": "Sticky sessions keep state in one process; when it restarts or you scale, that state is stranded. Put session state in a shared backing service instead."
  },
  {
    "q": "What does 'export services via port binding' (Factor VII) mean?",
    "choices": ["The app must be injected into Apache or nginx", "The app binds its own port and is a self-contained service", "The port number is hard-coded in the source", "Each process exports a different protocol"],
    "answer": 1,
    "explain": "The app is self-contained and serves by binding to a port (often from a PORT env var); a routing layer forwards to it, but nothing is injected into the app."
  },
  {
    "q": "Under the process model (Factor VIII), how do you handle a traffic spike?",
    "choices": ["Move to a bigger server (scale up)", "Run more processes of the web type (scale out)", "Daemonize the app and increase its priority", "Add more local disk to each server"],
    "answer": 1,
    "explain": "You scale out by running more processes of the relevant type. Statelessness makes adding or removing copies safe at any moment."
  }
]
```

[← Phase 1](01-codebase-deps-config.md) | [Overview](_guide.md) | [Phase 3: Dev-prod parity, logs as streams, and the operations factors →](03-parity-logs-ops.md)
