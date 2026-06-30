---
title: "Why Containers, and a First Dockerfile"
guide: dockerize-an-app
phase: 1
summary: "Build a tiny Flask app, write a minimal Dockerfile for it, and run it inside a container on your machine."
tags: [docker, dockerfile, flask, containers, build]
difficulty: intermediate
synonyms:
  - first dockerfile
  - dockerize flask app
  - docker build and run
  - works on my machine problem
  - minimal dockerfile example
updated: 2026-06-30
---

# Why Containers, and a First Dockerfile

Here's the problem we're solving, stated plainly. Your app depends on things that aren't in the app: a specific Python version, a web framework, a database driver, maybe a system library or two. When you run it, all of those happen to be on your machine. When someone else runs it, some of them aren't - or they're the wrong version. The app doesn't care that it's "the same code." It breaks.

A container fixes this by shipping the app **and** everything it depends on as one sealed unit. Inside the container is a tiny, predictable Linux system with exactly the Python and libraries your app needs. Outside, the host machine's setup stops mattering. Whoever runs the container gets your environment, not theirs.

Two words you'll see constantly:

- An **image** is the recipe - a frozen, read-only snapshot of the filesystem with your app and its dependencies baked in.
- A **container** is a running instance of an image. You can start many containers from one image, like many objects from one class.

You write a **Dockerfile** to describe the image. Docker reads it top to bottom and builds the image. Let's make one.

## The app

Make a project folder and drop two files in it. First the app - a Flask server with a single route:

```python
# app.py
from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Hello from inside a container!\n"

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

One detail that trips everyone up: `host="0.0.0.0"`. Inside a container, the default `127.0.0.1` means "only listen to traffic from inside this container" - which is nobody, since you're connecting from outside. `0.0.0.0` tells Flask to accept connections on all interfaces so your host can reach it.

Now declare the dependency:

```text
# requirements.txt
flask==3.0.3
```

You could run this locally right now (`pip install -r requirements.txt && python app.py`), and if you want to confirm the app itself works before containerizing, go ahead. But the point is to stop depending on your machine's Python. So let's containerize it.

## The Dockerfile

Create a file named exactly `Dockerfile` (no extension) next to `app.py`:

```dockerfile
# Dockerfile
FROM python:3.12

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

Read it line by line, because every line is doing real work:

- `FROM python:3.12` - start from an official image that already has Python 3.12 installed. This is your base layer; you build on top of it.
- `WORKDIR /app` - set the working directory inside the image. Commands after this run here, and it's created if it doesn't exist.
- `COPY requirements.txt .` - copy the requirements file from your folder into the image's `/app`.
- `RUN pip install -r requirements.txt` - install Flask inside the image. This runs at *build* time, so the dependency is baked in.
- `COPY . .` - copy the rest of your project (including `app.py`) into the image.
- `EXPOSE 5000` - document that the app listens on port 5000. (This is a label; it doesn't actually publish the port - you do that when you run.)
- `CMD [...]` - the default command to run when a container starts. This one launches your app.

## Build it

From the project folder, build the image and give it a name with `-t` (for "tag"):

```bash
docker build -t myapp .
```

The `.` at the end is the **build context** - the folder Docker sends to the build, and the root for those `COPY` lines. You'll watch Docker pull the base image (once - it's cached after that) and run each step. At the end you'll see something like `naming to docker.io/library/myapp`.

Confirm the image exists:

```bash
docker images
```

You should see `myapp` in the list with a size - probably around a gigabyte, because `python:3.12` is a full image. We'll shrink that dramatically in Phase 2.

## Run it

Start a container from the image:

```bash
docker run -p 8080:5000 myapp
```

The `-p 8080:5000` is the bridge between worlds: it maps port 8080 on your machine to port 5000 inside the container (the order is `host:container`). The `EXPOSE` line alone wouldn't do this - `-p` is what actually opens the door.

Open a browser to `http://localhost:8080` (or run `curl http://localhost:8080`). You should see:

```text
Hello from inside a container!
```

That response came from a Python that may not even be installed on your machine, running inside an isolated Linux environment, reachable because you mapped a port. The container is running in your terminal - press `Ctrl+C` to stop it.

To run it in the background instead, add `-d` (detached) and name it:

```bash
docker run -d -p 8080:5000 --name myapp-run myapp
docker ps          # see it running
docker logs myapp-run
docker stop myapp-run && docker rm myapp-run
```

## Where you are

You have a working image and a container serving HTTP. Anyone with Docker can now run your exact app - no Python setup, no dependency install - with `docker build` and `docker run`. That's the "works on my machine" problem solved in its crudest form.

It's also wasteful: a gigabyte for a Hello World, and a full reinstall of Flask every time you change one line of `app.py`. In Phase 2 we turn this rough Dockerfile into one you'd be happy to put your name on.
