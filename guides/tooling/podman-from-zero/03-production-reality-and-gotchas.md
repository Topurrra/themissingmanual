---
title: "Production Reality and Gotchas"
guide: podman-from-zero
phase: 3
summary: "The daemonless, rootless container engine: a drop-in for most Docker commands, plus pods and the security win of running without a root daemon."
tags: [podman, containers, docker, rootless, systemd, oci]
difficulty: intermediate
synonyms: [podman tutorial, podman vs docker, rootless containers, daemonless containers, alias docker podman, podman pods, podman generate systemd]
updated: 2026-06-30
---

# Production Reality and Gotchas

Everything works on your laptop. Then you put it on a server, reboot, and your container does not come back - because there is no daemon to bring it back. This phase is the bill that comes due for going daemonless, and the well-worn answers to each item.

## Restarts: systemd is the daemon now

With Docker, `--restart=always` works because `dockerd` is always running and re-launches the container after a reboot. Podman has no such service, so the job falls to the init system every Linux server already runs: systemd.

The modern way is **Quadlet** - you describe a container in a small unit-like file, and systemd generates the service for you:

```ini
# ~/.config/containers/systemd/cache.container
[Container]
Image=docker.io/library/redis:7
PublishPort=6379:6379

[Install]
WantedBy=default.target
```

```console
$ systemctl --user daemon-reload
$ systemctl --user start cache.service
$ loginctl enable-linger $USER
```

*What just happened:* you declared a container in a `.container` file, systemd turned it into `cache.service`, and you started it as a *user* service - no root involved. The `enable-linger` line is the one people forget: by default a rootless user's services stop when you log out, so linger tells systemd to keep your user manager running across logout and reboot. Without it, your "always-on" container quietly dies the moment you disconnect.

> Older guides use `podman generate systemd` to emit a unit file you save by hand. It still works, but it is deprecated in favor of Quadlet. If you are starting fresh, write a `.container` file; if you inherit generated units, they will keep running.

## Rootless can't bind low ports

Linux reserves ports below 1024 for root. Rootless Podman is, by definition, not root, so this fails:

```console
$ podman run -p 80:80 docker.io/library/nginx
Error: rootless cannot bind to port 80: permission denied
```

*What just happened:* the kernel refused, because binding port 80 needs privilege you deliberately gave up. You have three straightforward options, in rough order of preference:

```console
# 1. Publish to a high host port, front it with a reverse proxy:
$ podman run -p 8080:80 docker.io/library/nginx

# 2. Lower the unprivileged-port floor system-wide (host change):
$ sudo sysctl net.ipv4.ip_unprivileged_port_start=80

# 3. Only if you truly need it: run that workload rootful (sudo podman).
```

*What just happened:* option 1 keeps the security model intact and is what most production setups do. Option 2 trades a little host hardening for convenience. Option 3 throws away the rootless win, so reach for it only when nothing else fits.

## The Docker API socket

Tools like `docker compose`, Testcontainers, or anything that talks to `/var/run/docker.sock` expect a daemon API. Podman can speak that API, but the socket is off until you ask for it:

```console
$ systemctl --user enable --now podman.socket
$ export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock
$ docker-compose up    # now talks to Podman
```

*What just happened:* you started Podman's compatibility socket and pointed `DOCKER_HOST` at it, so Docker-API clients reach Podman instead. It is a faithful subset, not a perfect clone - most Compose files run fine; the rare feature that depends on a Docker-only API quirk will not. Note this socket is on-demand: it activates when a client connects and is not a permanent root daemon.

## Volumes, SELinux, and the `:z` you'll forget

On SELinux systems (Fedora, RHEL, and relatives - common Podman territory), a host bind-mount needs a label or the container cannot read it:

```console
$ podman run -v ./data:/data:Z docker.io/library/postgres:16
```

*What just happened:* the `:Z` told Podman to relabel `./data` so the container's SELinux context may access it (lowercase `:z` shares the label between multiple containers; uppercase `:Z` makes it private). Skip it on an SELinux host and you get baffling "permission denied" errors on files that obviously exist. This bites Docker users too, but Podman's typical homes turn SELinux on by default, so you meet it sooner.

## When to reach for Podman

Be clear-eyed about the tradeoff so you choose on purpose, not on hype:

- **Reach for it** when rootless is a security requirement, when you cannot or will not run a root daemon, when you are already on systemd and want first-class integration, or when you want pods that mirror Kubernetes locally.
- **Stay on Docker** when a critical tool only speaks the real Docker API, when your team's entire toolchain assumes `dockerd`, or when Docker Desktop's polish is worth more to you than the daemonless model. The migration cost is real even when it is small.

Neither is a moral choice. They produce the same OCI images and run the same workloads. Podman trades a little convenience for a meaningfully smaller attack surface, and now you know exactly where that trade shows up.

## In the wild

A typical server deployment ends up as: a Quadlet `.container` file per service, `enable-linger` set so they survive reboots, a high host port behind nginx or Caddy, and `DOCKER_HOST` exported only on the CI box that runs Compose-based integration tests. No root daemon anywhere - which is the entire reason the security team signed off.

```quiz
[
  {
    "q": "Your rootless Podman container does not come back after a server reboot. What is the modern fix?",
    "choices": [
      "Add --restart=always to podman run",
      "Define it with a Quadlet .container file as a systemd user service, and enable-linger",
      "Install dockerd alongside Podman",
      "Run podman ps in a cron job"
    ],
    "answer": 1,
    "explain": "There is no daemon to restart it; systemd is the daemon now. Quadlet plus enable-linger keeps a rootless service alive across reboots."
  },
  {
    "q": "Why does `loginctl enable-linger $USER` matter for a rootless always-on container?",
    "choices": [
      "It grants the user root for port 80",
      "Without it, the user's systemd services stop at logout, so the container dies when you disconnect",
      "It speeds up image pulls",
      "It enables the Docker compatibility socket"
    ],
    "answer": 1,
    "explain": "Rootless user services normally stop at logout; linger keeps the user manager running across logout and reboot."
  },
  {
    "q": "On an SELinux host, a bind-mount gives \"permission denied\" on files that clearly exist. What is usually missing?",
    "choices": [
      "The image tag",
      "A :z or :Z relabel suffix on the -v mount",
      "The podman.socket service",
      "An entry in /etc/subuid"
    ],
    "answer": 1,
    "explain": "SELinux blocks the container until the mount is relabeled; :z shares the label, :Z makes it private to that container."
  }
]
```

[← Phase 2: Running Containers and Pods](02-running-containers-and-pods.md) | [Overview](_guide.md)
