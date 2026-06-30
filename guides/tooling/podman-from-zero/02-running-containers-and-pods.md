---
title: "Running Containers and Pods"
guide: podman-from-zero
phase: 2
summary: "The daemonless, rootless container engine: a drop-in for most Docker commands, plus pods and the security win of running without a root daemon."
tags: [podman, containers, docker, rootless, systemd, oci]
difficulty: intermediate
synonyms: [podman tutorial, podman vs docker, rootless containers, daemonless containers, alias docker podman, podman pods, podman generate systemd]
updated: 2026-06-30
---

# Running Containers and Pods

You came here to run things, so let's run things. This phase is the everyday loop — pull, run, inspect, clean up — and then the one genuinely new idea Podman gives you that Docker does not: pods.

## The commands you already know

If you have used Docker, this section is mostly confirmation. The verbs are the same.

```console
$ podman pull docker.io/library/redis:7
$ podman run -d --name cache -p 6379:6379 docker.io/library/redis:7
8f3a...
$ podman ps
CONTAINER ID  IMAGE                          COMMAND     STATUS         PORTS                   NAMES
8f3a1c2d4e5f  docker.io/library/redis:7      redis-...   Up 4 seconds   0.0.0.0:6379->6379/tcp  cache
$ podman logs cache
$ podman exec -it cache redis-cli ping
PONG
$ podman stop cache && podman rm cache
```

*What just happened:* a full pull-run-inspect-exec-teardown loop, identical to Docker except for the binary name. `podman ps`, `logs`, `exec`, `stop`, `rm`, `images`, `rmi`, `build` — all behave as you expect.

Two small differences will catch you the first day:

**Image names are not guessed.** Docker silently expands `redis` to `docker.io/library/redis`. Podman, by default, asks which registry you mean, or you spell it out:

```console
$ podman run redis
? Please select an image:
  ▸ registry.fedoraproject.org/redis:latest
    registry.access.redhat.com/redis:latest
    docker.io/library/redis:latest
```

*What just happened:* Podman refused to assume Docker Hub and offered the registries from your `registries.conf`. This is deliberate — implicit Docker Hub is how typo-squatting attacks land. Type the fully qualified name (`docker.io/library/redis:7`) in scripts and you will never see this prompt.

**`podman ps` is per-user.** Because there is no shared daemon, you only see *your* containers. Another user's rootless containers, and root's containers, are invisible to you. `sudo podman ps` shows root's set, which is a different world entirely (different storage, different images). Pick one mode per workload and stay in it.

## Pods: the idea Docker doesn't have

Here is where Podman earns its name. A **pod** is a group of containers that share a network namespace — meaning they share an IP address and can reach each other over `localhost`. If "pod" rings a Kubernetes bell, that is exactly the point: Podman borrowed the concept, so a pod you design locally maps cleanly onto how Kubernetes thinks.

Why would you want this? The classic case is an app plus a sidecar — a web server and a metrics exporter, or an app and a local cache — that should live and die together and talk over `localhost` with no networking ceremony.

```console
$ podman pod create --name web --publish 8080:80
$ podman run -d --pod web --name app docker.io/library/nginx
$ podman run -d --pod web --name sidecar docker.io/library/redis:7
$ podman pod ps
POD ID        NAME    STATUS    INFRA ID      # OF CONTAINERS
a1b2c3d4e5f6  web     Running   0f9e8d7c6b5a  3
```

*What just happened:* you created a pod, published the port **on the pod**, and added two containers to it. Notice the pod reports **3** containers, not 2 — Podman quietly adds an "infra" container that holds the shared namespaces open, so individual containers can come and go without tearing down the pod's network. The `app` and `sidecar` containers now share one IP; `app` can reach Redis at `localhost:6379` with no `--link`, no user-defined network, nothing.

A subtle but important detail: once a container is in a pod, you publish ports on the *pod*, not the container. The pod owns the network namespace, so a `-p` on an in-pod `podman run` is ignored. Set every port you need at `podman pod create` time.

Tearing a pod down is one command:

```console
$ podman pod stop web && podman pod rm web
```

*What just happened:* the pod, its infra container, and both app containers stopped and were removed together. Lifecycle as a unit — that is the entire value proposition of a pod.

## From a pod to Kubernetes

Because a pod is shaped like a Kubernetes pod, Podman can write the YAML for you:

```console
$ podman kube generate web > web.yaml
$ podman kube play web.yaml
```

*What just happened:* `kube generate` serialized your running pod into a Kubernetes manifest, and `kube play` can recreate it — locally in Podman, or as a starting point for a real cluster. It is not a magic "ship to prod" button (resource limits, real volumes, and probes still need your attention), but it is a genuine bridge from "works on my machine" to a manifest you can hand to [/guides/kubernetes-without-the-hype](/guides/kubernetes-without-the-hype).

> Treat `kube generate` output as a first draft, not a deliverable. It captures what you ran, not what production needs. Read every line before you apply it to a cluster.

## In the wild

A common rootless workflow: run your dev stack as a pod so the app and its database share `localhost` exactly like they would inside a single Kubernetes pod, then `kube generate` to seed the manifest your platform team will harden. You get Docker-grade local ergonomics and a Kubernetes-shaped artifact out the other end, without ever running a privileged daemon.

```quiz
[
  {
    "q": "You run `podman pod create --name web` then add two containers. Why does `podman pod ps` show 3 containers?",
    "choices": [
      "It double-counts the first container",
      "Podman adds an infra container that holds the shared namespaces open",
      "One container is a hidden logging agent",
      "It counts the pod itself as a container"
    ],
    "answer": 1,
    "explain": "Each pod gets an infra container that keeps the shared network namespace alive so member containers can come and go."
  },
  {
    "q": "Where should you publish a port for a container that lives inside a pod?",
    "choices": [
      "With -p on the container's `podman run`",
      "On the pod, at `podman pod create` time",
      "Ports cannot be published from pods",
      "In a separate `podman network` command only"
    ],
    "answer": 1,
    "explain": "The pod owns the network namespace, so a -p on an in-pod container is ignored; publish ports at pod-create time."
  },
  {
    "q": "Why does `podman run redis` sometimes prompt you to pick a registry, when Docker would not?",
    "choices": [
      "Podman cannot reach Docker Hub",
      "Podman deliberately refuses to assume a registry, to avoid typo-squatting from implicit Docker Hub",
      "The image name is invalid",
      "It is asking which architecture to download"
    ],
    "answer": 1,
    "explain": "Podman won't silently expand short names to Docker Hub; spell out the fully qualified name to skip the prompt."
  }
]
```

[← Phase 1: What Podman Actually Is](01-what-podman-actually-is.md) | [Overview](_guide.md) | [Phase 3: Production Reality and Gotchas →](03-production-reality-and-gotchas.md)
