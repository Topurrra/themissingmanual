---
title: "docker compose: App Plus Database"
guide: dockerize-an-app
phase: 3
summary: "Write a compose.yaml that runs the Flask app and a Postgres database together, with a volume and depends_on, brought up and down in one command."
tags: [docker, compose, postgres, volumes, networking]
difficulty: intermediate
synonyms:
  - docker compose postgres
  - compose yaml example
  - app plus database container
  - docker volumes persistence
  - depends_on compose
updated: 2026-06-30
---

# docker compose: App Plus Database

Your app runs in a container. Now it needs a database — and a database is its own piece of software, with its own version and config and storage. You could install Postgres on your machine, but that drags you right back to "works on my machine." Instead you run Postgres as a second container.

Two containers means two `docker run` commands with the right ports, names, networks, and environment variables — and you'd type them in the right order every time. That gets old fast. **Docker Compose** is the fix: you describe the whole stack once in a file, and bring it all up or down with one command.

## Give the app something to store

First, make the app actually use a database so we can see it working. Update `requirements.txt`:

```text
# requirements.txt
flask==3.0.3
psycopg[binary]==3.2.1
```

`psycopg` is the Postgres driver for Python; the `[binary]` extra pulls a prebuilt version so nothing needs compiling. Now update `app.py` to count visits in Postgres:

```python
# app.py
import os
import psycopg
from flask import Flask

app = Flask(__name__)

DB_URL = os.environ["DATABASE_URL"]

def init_db():
    with psycopg.connect(DB_URL) as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS visits (id serial PRIMARY KEY)"
        )

@app.route("/")
def home():
    with psycopg.connect(DB_URL) as conn:
        conn.execute("INSERT INTO visits DEFAULT VALUES")
        count = conn.execute("SELECT count(*) FROM visits").fetchone()[0]
    return f"You are visit number {count}\n"

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000)
```

Notice the app reads its database connection from `os.environ["DATABASE_URL"]`. It doesn't hard-code where the database is — that comes from the environment, which is exactly what lets the same image run against different databases. Compose will set that variable for us.

## The compose file

Create `compose.yaml` next to your Dockerfile:

```yaml
# compose.yaml
services:
  web:
    build: .
    ports:
      - "8080:5000"
    environment:
      DATABASE_URL: postgresql://appuser:secret@db:5432/appdb
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: appdb
    volumes:
      - dbdata:/var/lib/postgresql/data

volumes:
  dbdata:
```

Walk through it:

- **Two services**, `web` and `db`. Each becomes a container.
- `build: .` — `web` is built from your Dockerfile in the current folder. `db` instead pulls the official `postgres:16` image — no Dockerfile needed.
- `ports` on `web` does what `-p` did: maps host 8080 to container 5000.
- `environment` sets variables inside each container. The `db` service uses Postgres's own variables to create a user, password, and database on first start. The `web` service gets the `DATABASE_URL` its code reads.
- `depends_on: [db]` tells Compose to start `db` before `web`.
- `volumes` on `db` maps a named volume `dbdata` to where Postgres stores its files, so data survives a container restart. More on that below.

## The magic word: `db`

Look closely at the connection string: `postgresql://appuser:secret@db:5432/appdb`. The host is `db` — the name of the service. Compose puts every service on a shared private network and lets them find each other by service name. Inside the `web` container, `db` resolves to the Postgres container's address. You never deal with IP addresses.

```mermaid
flowchart LR
    H[Your browser<br/>localhost:8080] --> W[web container<br/>Flask :5000]
    W -- "connects to host 'db'" --> D[db container<br/>Postgres :5432]
    D --- V[(dbdata volume)]
```

Note that 5432 is *not* published to your host — only `web` can reach Postgres, over the private network. That's a sensible default: your database shouldn't be exposed to the outside world. (If you want to inspect it with a desktop tool, you can add a `ports` entry to `db`, but you don't need to.)

## Volumes: why your data survives

Containers are disposable. Delete one and everything written inside it is gone. That's fine for your stateless app, but a database that forgets everything on restart is useless.

A **volume** is storage that lives outside the container's lifecycle. The line `dbdata:/var/lib/postgresql/data` says "keep the contents of Postgres's data directory in a named volume called `dbdata`." Destroy and recreate the `db` container and the data is still there, because it never lived inside the container — it lived in the volume.

## Bring it up

From the project folder:

```bash
docker compose up --build
```

`up` starts the whole stack; `--build` rebuilds your `web` image first so code changes are picked up. You'll see logs from both services interleaved, color-coded by service. Wait for Postgres to report it's ready and Flask to say it's serving, then hit it:

```bash
curl http://localhost:8080
# You are visit number 1
curl http://localhost:8080
# You are visit number 2
```

The count climbs because each request writes a row to Postgres. Stop the stack with `Ctrl+C`, or run detached and manage it separately:

```bash
docker compose up --build -d   # background
docker compose ps              # what's running
docker compose logs web        # logs for one service
docker compose logs -f         # follow all logs
```

## Prove the volume works

Here's the satisfying test. Bring the stack down — but keep the volume:

```bash
docker compose down
docker compose up -d
curl http://localhost:8080
# You are visit number 3
```

The count picked up where it left off. `down` removed the containers, but the `dbdata` volume persisted, so Postgres still had your rows. Now wipe it for real with `-v`, which deletes the named volumes too:

```bash
docker compose down -v
docker compose up -d
curl http://localhost:8080
# You are visit number 1
```

Back to one — the data is gone because you destroyed the volume. That `-v` flag is the difference between "restart the stack" and "start fresh," and knowing which is which will save you a panic someday.

You now have a real two-container application defined in one file, brought up and down with one command, with data that persists exactly as long as you want it to. The only thing left is making it fit to hand to someone else — secrets, health, and a registry. That's Phase 4.
