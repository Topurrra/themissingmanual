---
title: "The compose file"
guide: "docker-compose-for-real-projects"
phase: 2
summary: "A guided tour of docker-compose.yml — services, image vs build, ports, environment, depends_on, and named volumes — then bringing the stack up, watching its logs, and tearing it down."
tags: [docker-compose, docker-compose-yml, services, volumes, depends_on, ports]
difficulty: intermediate
synonyms: ["how to write docker-compose.yml", "docker compose services example", "docker compose ports environment volumes", "docker compose up logs down", "image vs build in docker compose", "what does depends_on do"]
updated: 2026-06-19
---

# The compose file

This is the file everything else hangs on. Once you can read a `docker-compose.yml` line by line and know what each part *does*, the rest of Compose is just commands that act on it. So we'll build one real file — a web server, an API, a database, and a cache — and walk every section. Then we'll run it for real: bring it up, watch the logs, and tear it down clean.

Don't memorize the shape. By the end you should be able to look at any compose file and reason about what it's going to do.

## The whole file, top to bottom

Here's a complete, realistic stack. Read it once for the overall shape, then we'll go section by section.

```yaml
services:
  web:
    image: nginx:1.27
    ports:
      - "8080:80"
    depends_on:
      - api

  api:
    build: ./api
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/shop
      REDIS_URL: redis://cache:6379
    depends_on:
      - db
      - cache

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: shop
    volumes:
      - db_data:/var/lib/postgresql/data

  cache:
    image: redis:7

volumes:
  db_data:
```

That's the entire stack from Phase 1 — the four `docker run` commands, the network, and the volume — captured in one readable file. Now the tour.

## `services:` — one block per container

**What it actually is.** The `services` map is the heart of the file. Each key under it (`web`, `api`, `db`, `cache`) is one service — which in practice means one container — and the name you give it matters: it becomes the container's address on the network (more on that in Phase 3).

**What it does in real life.** Compose reads each service block and starts a container for it. The names are yours to choose, but choose them well — `api`, `db`, `cache` read clearly, and they're the hostnames your services will use to reach each other.

## `image:` vs `build:` — use someone's, or build your own

**What it actually is.** Every service needs an image to run. You have two ways to point at one:

- **`image:`** — pull a ready-made image from a registry (like Docker Hub). Use this for off-the-shelf software you don't write: databases, caches, web servers.
- **`build:`** — build the image yourself from a `Dockerfile` in a directory you point at. Use this for *your own* code.

```yaml
  web:
    image: nginx:1.27      # pull nginx, pinned to version 1.27

  api:
    build: ./api           # build from the Dockerfile in ./api
```

*What just happened:* For `web`, Compose pulls the official `nginx:1.27` image as-is. For `api`, Compose looks in the `./api` directory, finds the `Dockerfile` there, and builds an image from it — the same as running `docker build ./api`, done for you.

⚠️ **Gotcha — pin your versions.** `image: postgres` (no tag) means "whatever `latest` happens to be today," which can change under you and break things weeks later when you least expect it. Always pin a version — `postgres:16`, `nginx:1.27`, `redis:7` — so the stack you run tomorrow is the stack you ran today.

## `ports:` — open a door from your machine into a container

**What it actually is.** By default a container's ports are private to the stack — reachable by other services, but not from your laptop's browser. `ports:` publishes a port out to your host machine, exactly like `-p` on `docker run`.

```yaml
  web:
    ports:
      - "8080:80"
```

*What just happened:* This maps **host** port `8080` to the **container's** port `80`. The format is always `"HOST:CONTAINER"`. So `http://localhost:8080` on your machine reaches nginx listening on port 80 inside the container.

📝 **Which port goes where.** Left of the colon is *your machine*; right of the colon is *inside the container*. `"8080:80"` means "I'll visit 8080, it arrives at 80." Mixing these up is the single most common Compose port mistake.

💡 **Key point — you don't publish what stays internal.** Notice `db` and `cache` have *no* `ports:` block. The API reaches them inside the stack's private network without any port being exposed to your laptop. Only publish a port when something *outside* the stack (your browser, a tool) needs in. Publishing the database port to your host is a habit worth not forming.

## `environment:` — configuration the container reads at startup

**What it actually is.** The `environment:` map sets environment variables inside the container. This is the standard way to configure both off-the-shelf images and your own code — connection strings, passwords, feature flags, modes.

```yaml
  db:
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: shop

  api:
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/shop
      REDIS_URL: redis://cache:6379
```

*What just happened:* The official `postgres` image reads `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` on first start and creates that user and database for you. Your `api` reads `DATABASE_URL` and `REDIS_URL` to know where to connect. Look closely at `DATABASE_URL`: the host part is `db` — the *service name* from this very file. That's how the API finds the database (Phase 3 explains exactly why that works).

⚠️ **Gotcha — secrets in plain text.** Writing `POSTGRES_PASSWORD: secret` straight into the file is fine for local development, but this file usually lives in Git. Don't commit real production passwords this way. The common fix is to read them from a `.env` file or the host environment instead — covered in depth in [Environment Variables & Config](/guides/env-vars-and-config).

## `depends_on:` — start order, and *only* start order

**What it actually is.** `depends_on:` tells Compose which services must be *started* before this one. It controls the order Compose launches containers.

```yaml
  api:
    depends_on:
      - db
      - cache
```

*What just happened:* Compose starts `db` and `cache` before it starts `api`, so the things the API depends on are already running by the time it comes up.

⚠️ **Gotcha — "started" is not "ready."** This is the trap that catches everyone, so we'll name it now and fix it properly in Phase 3: `depends_on` waits for the database container to *start*, not for Postgres inside it to be *ready to accept connections*. A database can take a few seconds to initialize after its container starts. So your API can launch, immediately try to connect, and crash — even though `depends_on` did exactly what it promised. Hold that thought; [Phase 3](03-networking-volumes-and-dev-workflow.md) shows the real fix (healthchecks).

## `volumes:` — where your data lives when the container doesn't

**What it actually is.** Containers are disposable — delete one and everything inside its filesystem is gone. That's fine for stateless services, and a disaster for a database. A **named volume** is storage that lives *outside* any single container, managed by Docker, so your data survives the container being recreated.

📝 **Named volume.** A chunk of disk Docker manages on your behalf, given a name. You mount it into a container at a path; whatever's written there is kept even after the container is destroyed.

There are two parts to it. First, you *declare* the volume at the bottom of the file:

```yaml
volumes:
  db_data:
```

Then you *mount* it into the service that needs it:

```yaml
  db:
    volumes:
      - db_data:/var/lib/postgresql/data
```

*What just happened:* You told Docker "keep a named volume called `db_data`," then mounted it at `/var/lib/postgresql/data` — the path where Postgres stores its data. Now the database's files live in the volume, not in the container. Recreate the `db` container and the data is still there, waiting. We'll come back to *why* this matters and how to verify it in Phase 3.

## Bringing it up

With the file written, the whole stack starts with one command. The first time, Compose pulls images and builds yours, so there's a lot of output; here's the shape of it:

```console
$ docker compose up
[+] Running 5/5
 ✔ Network shop_default    Created
 ✔ Container shop-db-1      Created
 ✔ Container shop-cache-1   Created
 ✔ Container shop-api-1     Created
 ✔ Container shop-web-1     Created
Attaching to api-1, cache-1, db-1, web-1
db-1     | PostgreSQL init process complete; ready for start up.
db-1     | database system is ready to accept connections
cache-1  | Ready to accept connections tcp
api-1    | Server listening on http://0.0.0.0:3000
web-1    | start worker processes
```

*What just happened:* Compose created a private network for the stack, created and started all four containers in dependency order (`db` and `cache` before `api`, `api` before `web`), then *attached* to them — meaning the logs from every service are now streaming into your terminal, each line prefixed with which service it came from. Your stack is running. Visit `http://localhost:8080` and nginx answers.

💡 **Run it in the background.** Add `-d` (detached) and Compose starts the stack and hands your terminal back instead of streaming logs:

```console
$ docker compose up -d
[+] Running 5/5
 ✔ Network shop_default    Created
 ✔ Container shop-db-1      Started
 ✔ Container shop-cache-1   Started
 ✔ Container shop-api-1     Started
 ✔ Container shop-web-1     Started
```

*What just happened:* Same stack, same order, but Compose returned control to you immediately. The containers keep running in the background. This is how you'll usually run it once you trust it.

## Watching the logs

Running detached, you still want to see what your services are saying. `docker compose logs` shows you:

```console
$ docker compose logs -f api
api-1  | Server listening on http://0.0.0.0:3000
api-1  | GET /health 200 4ms
api-1  | GET /api/products 200 31ms
```

*What just happened:* `logs` pulls the output of your services; naming `api` narrows it to just that one, and `-f` ("follow") keeps the stream live, printing new lines as they happen — the same view you'd get from `up` without `-d`, but for one service and on demand. Drop the service name to see all of them interleaved.

## Tearing it down

When you're done, one command removes the whole stack — every container and the network — cleanly:

```console
$ docker compose down
[+] Running 5/5
 ✔ Container shop-web-1     Removed
 ✔ Container shop-api-1     Removed
 ✔ Container shop-cache-1   Removed
 ✔ Container shop-db-1      Removed
 ✔ Network shop_default    Removed
```

*What just happened:* Compose stopped and removed all four containers and deleted the network it created — the exact reverse of `up`. No leftover containers, no orphaned network, nothing to clean up by hand.

⚠️ **Gotcha — `down` keeps your data, on purpose.** Notice the volume isn't in that list. Plain `docker compose down` removes containers and the network but *leaves named volumes alone*, so your database survives a teardown. That's the safe default. If you genuinely want to wipe the data too, you have to ask for it explicitly with `docker compose down -v` — and that `-v` deletes your volumes for real, so treat it with the respect you'd give `rm -rf`.

## Recap

1. **`services:`** — one block per container; the service name is also its network address.
2. **`image:` vs `build:`** — pull a ready-made image, or build your own from a `Dockerfile`. Pin versions.
3. **`ports:`** — `"HOST:CONTAINER"`, only for what needs reaching from outside the stack.
4. **`environment:`** — configuration variables; how services learn each other's addresses and credentials.
5. **`depends_on:`** — start order only — *started*, not *ready* (Phase 3 fixes this).
6. **`volumes:`** — named volumes keep data alive across container recreation; declared at the bottom, mounted into the service.
7. **`up` / `up -d` / `logs -f` / `down`** — bring the stack up (foreground or background), watch it, tear it down without leftovers.

You can now write and run a stack. Next we'll look under the hood at the three things that make a stack actually *work*: how services find each other, how data persists, and how to wire it for fast day-to-day development without setting traps for production.

---

[← Phase 1: Why One Container Isn't Enough](01-why-one-container-isnt-enough.md) · [Guide overview](_guide.md) · [Phase 3: Networking, Volumes & Dev Workflow →](03-networking-volumes-and-dev-workflow.md)
