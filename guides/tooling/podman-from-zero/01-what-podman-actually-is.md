---
title: "Podman, From Zero"
guide: podman-from-zero
phase: 1
summary: "The daemonless, rootless container engine: a drop-in for most Docker commands, plus pods and the security win of running without a root daemon."
tags: [podman, containers, docker, rootless, systemd, oci]
difficulty: intermediate
synonyms: [podman tutorial, podman vs docker, rootless containers, daemonless containers, alias docker podman, podman pods, podman generate systemd]
updated: 2026-06-30
---

# What Podman Actually Is

Here is the thing nobody tells you about Docker until you have to explain it to a security team: when you run `docker run`, your command barely does anything. It hands a request to a long-running background service — the Docker daemon, `dockerd` — and that service, running as root, does the actual work of pulling images and starting containers. Your terminal is a remote control. The daemon is the machine.

Podman's whole pitch is: get rid of the machine. There is no daemon. When you run `podman run`, *that process* pulls the image and starts the container. When the container runs, it is a child of your shell, not a child of a root service you never see. That one architectural choice ripples into everything else, so it is worth slowing down on.

## The daemon, and why it bothers people

Docker's architecture looks like this:

```text
you ──> docker (CLI) ──> dockerd (root daemon) ──> containerd ──> your container
        unprivileged     runs as root             also root      runs as root by default
```

*What just happened:* every container you start is ultimately launched by a privileged, always-on service. If `dockerd` crashes, every container it manages can go with it. If someone compromises the daemon's socket, they effectively have root on the host, because the daemon *is* root and will do what it is told.

Podman's architecture is flatter:

```text
you ──> podman ──> conmon ──> your container
        your user            your user (rootless)
```

*What just happened:* there is no central privileged broker. `podman` does the setup itself and then hands the running container to a tiny monitor process called `conmon` (container monitor), which babysits it so the container keeps running after your `podman` command exits. No root daemon sits in the middle.

> The shorthand you will hear is "daemonless." It does not mean nothing runs in the background — `conmon` does, one per container. It means there is no single long-lived root service that owns every container on the box.

## Rootless: the part that actually matters

"Daemonless" is the architecture. "Rootless" is the consequence people care about.

Because Podman runs as *you*, it can start containers without root at all. It does this with a Linux kernel feature called **user namespaces**: inside the container, a process can think it is UID 0 (root), while outside, on the host, it is mapped to your unprivileged user. The container sees root; the host sees you.

```console
$ id -u
1000

$ podman run --rm alpine id
uid=0(root) gid=0(root) groups=0(root),...

$ podman run --rm alpine sleep 600 &
$ ps -o user,pid,cmd -C sleep
USER       PID CMD
chris    48213 sleep 600
```

*What just happened:* inside the container the process is `root` (uid 0). On the host, the very same process belongs to `chris`, an ordinary user. A container breakout would land an attacker as `chris`, not as host root. That is the security win in one sentence: a compromised container does not hand over the whole machine.

This mapping is driven by two files, `/etc/subuid` and `/etc/subgid`, which grant your user a range of "subordinate" UIDs to hand out inside containers. If Podman ever complains about user namespaces on a fresh box, those files (or the `newuidmap`/`newgidmap` helpers) are almost always the missing piece.

## "Drop-in for Docker" — true, with footnotes

Podman implements the same command-line interface as Docker on purpose. The verbs, flags, and image format (OCI — the Open Container Initiative standard, which Docker also produces) are shared. So this works:

```console
$ alias docker=podman
$ docker run --rm -p 8080:80 docker.io/library/nginx
```

*What just happened:* you aliased `docker` to `podman` and a standard `docker run` line worked unchanged. Most scripts, most tutorials, most muscle memory carry straight over. Note the full image name `docker.io/library/nginx` — Podman does not assume Docker Hub the way Docker does, a difference phase 2 returns to.

The footnotes are real, though, and they all trace back to the missing daemon:

- There is no `docker.sock` by default, so tools that talk to the Docker API need Podman's compatibility socket switched on (phase 3).
- Containers do not auto-restart on reboot via a daemon, because there is no daemon to do it — you use systemd instead (phase 3).
- Rootless networking and low ports behave differently, because you are not root (phase 2 and 3).

None of these are dealbreakers. They are the bill that comes due for not running a privileged daemon, and for many teams it is a bill worth paying.

## For builders

If you are coming from [/guides/docker-without-the-magic](/guides/docker-without-the-magic), the mental shift is small but load-bearing: stop thinking of "the container engine" as a service you talk to, and start thinking of it as a command you run. Everything that used to be the daemon's job — restarts, the API socket, owning the container lifecycle — becomes either your job or systemd's job. That reframing is most of what makes Podman click.

```quiz
[
  {
    "q": "What does \"daemonless\" mean in Podman's case?",
    "choices": [
      "Nothing ever runs in the background",
      "There is no single long-lived root service that owns every container; each container has a small conmon monitor instead",
      "Containers cannot run after the terminal closes",
      "Podman cannot pull images without an internet daemon"
    ],
    "answer": 1,
    "explain": "Podman has no central root daemon; conmon (one per container) keeps each container alive, but nothing privileged brokers them all."
  },
  {
    "q": "In a rootless Podman container, a process reports uid 0. What is it on the host?",
    "choices": [
      "Also uid 0 (real root on the host)",
      "A mapped unprivileged user, via user namespaces",
      "A random uid that changes each second",
      "It has no host identity at all"
    ],
    "answer": 1,
    "explain": "User namespaces map container root to your unprivileged host user, so a breakout lands as you, not as host root."
  },
  {
    "q": "Why does `alias docker=podman` work for most commands?",
    "choices": [
      "Podman bundles a copy of dockerd internally",
      "Podman deliberately implements the same CLI and uses the same OCI image format",
      "The alias secretly installs Docker first",
      "Podman translates each command over the network to a Docker server"
    ],
    "answer": 1,
    "explain": "Podman shares Docker's command-line interface and the OCI image standard on purpose, so most usage transfers directly."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Running Containers and Pods →](02-running-containers-and-pods.md)
