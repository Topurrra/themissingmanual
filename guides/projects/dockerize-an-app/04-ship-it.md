---
title: "Ship It"
guide: dockerize-an-app
phase: 4
summary: "Move config out of the compose file into env vars and secrets, add a healthcheck, then tag the image and push it to a registry."
tags: [docker, secrets, healthcheck, registry, deployment]
difficulty: intermediate
synonyms:
  - docker push registry
  - docker healthcheck
  - env vars and secrets
  - tag docker image
  - deploy docker container
updated: 2026-06-30
---

# Ship It

You have a working stack. Now make it fit to leave your laptop. Three things stand between you and that: the password is sitting in plain text in your compose file, nothing checks whether the database is actually *ready* before the app tries to use it, and the image only exists on your machine. Let's close all three, then push the image somewhere a teammate or a server can pull it.

## Get secrets out of the compose file

Right now `compose.yaml` has `POSTGRES_PASSWORD: secret` written in it. That file is in version control, which means your password is in version control - for everyone, forever, even after you "delete" it from a later commit.

The first step up is an **`.env` file** that Compose reads automatically. Create `.env` next to `compose.yaml`:

```text
# .env  -- do NOT commit this
POSTGRES_USER=appuser
POSTGRES_PASSWORD=a-better-password-than-secret
POSTGRES_DB=appdb
```

Then reference those variables in `compose.yaml` with `${...}`:

```yaml
# compose.yaml
services:
  web:
    build: .
    ports:
      - "8080:5000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - dbdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  dbdata:
```

Now add `.env` to both `.gitignore` and `.dockerignore` so it never lands in your repo or your image. Commit a `.env.example` with dummy values instead, so the next person knows which variables to set:

```text
# .env.example  -- safe to commit
POSTGRES_USER=appuser
POSTGRES_PASSWORD=change-me
POSTGRES_DB=appdb
```

A word on what `.env` is and isn't. It keeps secrets out of your committed files, which is the big win. It is *not* a vault. For real production you'd graduate to your platform's secret manager (Docker secrets, Kubernetes secrets, a cloud KMS) - but the contract stays identical: **the app reads its config from the environment**, and where that environment comes from is someone else's problem. Because your app already reads `DATABASE_URL` from `os.environ`, you change nothing in the code to move up the ladder.

## Add a healthcheck

You may have noticed a race in Phase 3: Compose starts `db` before `web` because of `depends_on`, but "started" isn't "ready." Postgres takes a second or two to accept connections, and if `web` connects in that window, it crashes.

The compose file above already fixes this. The `healthcheck` on `db` runs `pg_isready` every few seconds until Postgres answers, marking the container *healthy*. Then `depends_on` with `condition: service_healthy` makes `web` wait for that healthy state - not start, but *healthy* - before it launches.

A healthcheck is also useful on its own. It tells Docker (and orchestrators like Kubernetes) whether a container is alive, so a wedged container gets noticed and restarted instead of silently failing. Bring it up and watch the states:

```bash
docker compose up --build -d
docker compose ps
```

You'll see `db` go from `starting` to `healthy`, and `web` only comes up after. No more startup race.

## Tag the image for a registry

Your image is called `myapp` and lives only on your machine. To share it, you push it to a **registry** - a server that stores images. Docker Hub is the default and has a free tier; cloud providers and `ghcr.io` (GitHub) work the same way.

Registry image names follow a pattern: `registry/username/name:tag`. For Docker Hub the registry part is implied, so it's only `username/name:tag`. The `tag` is a version label - `latest` is the default, but a real version is better.

Tag your existing image (replace `yourname` with your Docker Hub username):

```bash
docker tag myapp yourname/dockerize-demo:1.0.0
docker tag myapp yourname/dockerize-demo:latest
```

Tagging doesn't copy anything - it only adds names pointing at the same image. Confirm:

```bash
docker images yourname/dockerize-demo
```

## Push it

Log in, then push:

```bash
docker login
docker push yourname/dockerize-demo:1.0.0
docker push yourname/dockerize-demo:latest
```

Docker uploads the layers. Layers you've pushed before are skipped, so the slim base you chose in Phase 2 pays off again here - smaller image, faster push. When it finishes, your image is on the registry.

Now the proof. From any machine with Docker - or after deleting your local copy with `docker rmi yourname/dockerize-demo:1.0.0` - anyone can run it:

```bash
docker run -p 8080:5000 \
  -e DATABASE_URL="postgresql://appuser:pass@somehost:5432/appdb" \
  yourname/dockerize-demo:1.0.0
```

No clone, no Python, no pip. They pull the image and run it, passing in their own `DATABASE_URL`. That's the "works on my machine" problem fully closed - it now works on *any* machine.

## A few production tips

You've built the real thing. A handful of habits separate a demo from something that runs in production:

| Habit | Why it matters |
| --- | --- |
| Pin versions (`postgres:16`, `python:3.12-slim`) | `latest` changes under you and breaks reproducibility |
| Tag images with real versions, not only `latest` | You can roll back to a known image when a deploy goes wrong |
| Use a production WSGI server (e.g. gunicorn), not `flask run` | Flask's built-in server is for development, not load |
| Set `restart: unless-stopped` on services | The container comes back after a crash or reboot |
| Keep secrets in a real secret store for prod | `.env` is fine locally; production wants more |
| Run as non-root (you already do) | Smaller blast radius if the app is compromised |

To swap in gunicorn, add it to `requirements.txt` and change the Dockerfile's last line:

```dockerfile
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
```

That's the whole arc. You took an app that ran on exactly one machine and turned it into an image anyone can pull and run, wired to a database, with config kept out of source control, a healthcheck guarding startup, and a version you can roll back to. The next time someone says "it works on my machine," you can hand them an image and say: now it works on yours too.
