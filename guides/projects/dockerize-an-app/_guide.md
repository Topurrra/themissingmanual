---
title: "Dockerize an App"
guide: dockerize-an-app
phase: 0
summary: "Take a small web app and containerize it — a real Dockerfile, image caching, and a compose file with a database — built and run on your machine."
tags: [docker, containers, dockerfile, compose, project]
category: projects
group: "Build On Your Machine"
order: 6
difficulty: intermediate
synonyms:
  - containerize a web app
  - docker tutorial project
  - dockerfile and compose
  - run app in a container
  - docker postgres setup
updated: 2026-06-30
---

# Dockerize an App

You have an app that runs on your laptop. It works. Then a teammate clones it, runs the same commands, and gets a wall of errors — a missing library, the wrong language version, a database that isn't there. You spend an afternoon over a screen-share fixing their machine instead of building anything.

This weekend you're going to fix that for good. You'll take a small web app, put it inside a container, and end up with something anyone can run with one command — same versions, same dependencies, same database, every time. No "works on my machine."

## What you'll build

A small Python web app (Flask) running inside a Docker container, talking to a Postgres database in a second container, the two wired together with a single compose file. By the end you'll bring the whole stack up with `docker compose up` and shut it down with `docker compose down`, and you'll have an image you can tag and push to a registry for someone else to pull and run.

## The stack

| Piece | What it is |
| --- | --- |
| Docker Engine | Runs containers on your machine |
| Flask | A tiny Python web app (the thing we containerize) |
| Postgres | The database, run as its own container |
| Docker Compose | Wires the app and database together |

## Built on your machine

This is a **build-on-your-machine** project, not a run-in-the-browser one. Every command here you run in your own terminal. You need Docker installed before you start — get **Docker Desktop** (macOS, Windows) or **Docker Engine** (Linux) from docker.com, then confirm it's alive:

```bash
docker --version
docker run hello-world
```

If `hello-world` prints a friendly message, you're set. If it can't connect to the Docker daemon, start Docker Desktop (or run `sudo systemctl start docker` on Linux) and try again.

You'll also want Python 3 on hand for the first couple of phases, though by the end the container holds its own Python and your machine's version stops mattering — which is the whole point.

## Rough time

About a weekend, in four sittings:

- **Phase 1** — the "works on my machine" problem, and your first Dockerfile that builds and runs.
- **Phase 2** — a real Dockerfile: caching, `.dockerignore`, a slim base, a non-root user.
- **Phase 3** — `docker compose` to run the app and a Postgres database together.
- **Phase 4** — ship it: environment variables, secrets, a healthcheck, and pushing to a registry.

## What you'll learn

- The difference between an **image** (the recipe) and a **container** (a running instance of it).
- How Docker's layer cache makes the difference between a 2-second rebuild and a 2-minute one.
- Why the order of lines in a Dockerfile matters more than almost anything else.
- How containers find and talk to each other on a network.
- How to pass configuration in without baking secrets into the image.
- How to hand your image to someone else so they run it with no setup at all.

Open a terminal, make a folder for this project, and turn to Phase 1.
