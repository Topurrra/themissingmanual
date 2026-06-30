---
title: "The commands you actually run"
guide: kubectl-day-to-day
phase: 2
summary: "The Kubernetes commands you actually use: get/describe/logs/exec to see what's happening, apply to change it, and the debugging loop when a pod won't start."
tags: [kubectl, kubernetes, containers, devops, debugging, cli]
difficulty: intermediate
synonyms: ["kubectl commands", "kubectl cheat sheet", "kubectl get pods", "kubectl describe", "kubectl logs", "crashloopbackoff", "imagepullbackoff", "kubectl debugging", "kubectl day to day", "how to use kubectl"]
updated: 2026-06-30
---

# The commands you actually run

This is the working set - the commands you'll type dozens of times a day. There aren't many. Split them into two jobs: **seeing** what's happening (get, describe, logs, exec) and **changing** it (apply, port-forward). Get fluent in these and you can handle the large majority of real work without looking anything up.

## See the shape: `get`

`get` is your overview. It lists objects and their high-level state. Run it first, always, to orient yourself.

```bash
kubectl get pods
```

```text
NAME                    READY   STATUS    RESTARTS   AGE
web-7c9f5d8b6-2xk4p     1/1     Running   0          3d
web-7c9f5d8b6-9mlpq     1/1     Running   0          3d
worker-5f6c8d9b-tq2vn   0/1     Pending   0          12s
```

*What just happened:* one line per pod. Read the columns: `READY` is `running-containers / desired-containers` (so `0/1` means it's not up yet), `STATUS` is the headline, `RESTARTS` is a smell - a climbing number means something keeps dying, and `AGE` tells you if this is fresh or has been limping for days.

Two flags turn `get` from a snapshot into a tool:

```bash
kubectl get pods -o wide          # adds node + pod IP columns
kubectl get pods -w               # WATCH: stream changes live, don't re-run
```

*What just happened:* `-o wide` answers "which node is this on, and what's its IP?" `-w` keeps the command open and prints a new line every time a pod's state changes - perfect for watching a rollout settle without spamming the up-arrow key. Ctrl-C to stop.

You can `get` any resource the same way: `kubectl get deploy`, `kubectl get svc`, `kubectl get nodes`. Same grammar, different noun.

## Get the full story: `describe`

`get` gives you the headline; `describe` gives you the article. When a pod looks wrong, `describe` is where the *why* lives - especially the **Events** section at the bottom.

```bash
kubectl describe pod worker-5f6c8d9b-tq2vn
```

```text
Name:         worker-5f6c8d9b-tq2vn
Namespace:    payments
Status:       Pending
Containers:
  worker:
    Image:    registry.example.com/worker:1.4.2
    State:    Waiting
      Reason: ImagePullBackOff
...
Events:
  Type     Reason     Age              From     Message
  ----     ------     ----             ----     -------
  Warning  Failed     20s (x3 over 1m) kubelet  Failed to pull image "...worker:1.4.2": not found
```

*What just happened:* the Events section narrated the failure in plain language - Kubernetes tried to pull an image that doesn't exist. `get` only showed you `Pending`; `describe` told you exactly why. **When something is stuck, the Events at the bottom of `describe` are usually the answer.** Train your eyes to scroll straight there.

## Read the program's own voice: `logs`

`describe` tells you what Kubernetes thinks about your pod from the outside. `logs` shows you what your application wrote to stdout/stderr from the inside. Both matter, and they answer different questions.

```bash
kubectl logs web-7c9f5d8b-2xk4p          # the container's stdout/stderr
kubectl logs web-7c9f5d8b-2xk4p -f       # follow (tail -f style), stream live
kubectl logs web-7c9f5d8b-2xk4p --tail=50    # last 50 lines only
```

*What just happened:* `logs` printed whatever your app logs. `-f` follows it live; `--tail=50` spares you scrolling through a day of output to see the last few lines.

One flag earns its keep over and over. When a pod has restarted, the *current* container's logs are often empty or boring - the interesting crash is in the container that died:

```bash
kubectl logs web-7c9f5d8b-2xk4p --previous
```

*What just happened:* `--previous` (or `-p`) shows the logs of the *prior* container instance - the one that crashed and got replaced. For anything in a restart loop, this is where the real error message hides.

If a pod runs more than one container, `logs` needs to know which:

```bash
kubectl logs web-7c9f5d8b-2xk4p -c sidecar    # pick a container by name
```

*What just happened:* `-c` selects a container inside a multi-container pod. Without it, `logs` defaults to the first container, which may not be the one you care about.

## Step inside: `exec`

Sometimes you need to be *in* the container - check a file, hit localhost, see what an env var actually resolved to. `exec` runs a command inside a running container; with `-it` it gives you an interactive shell.

```bash
kubectl exec -it web-7c9f5d8b-2xk4p -- /bin/sh
```

```text
/app # ls
config.yaml  server  static
/app # echo $DATABASE_URL
postgres://db.internal:5432/app
/app # exit
```

*What just happened:* `-it` gave you a terminal inside the container; everything after `--` is the command to run there (here, a shell). The `--` matters - it tells kubectl "stop reading flags, the rest is the container's command." Use a slim image's `/bin/sh` if `/bin/bash` isn't present.

You don't need a full shell for a one-off check:

```bash
kubectl exec web-7c9f5d8b-2xk4p -- env        # dump environment variables
kubectl exec web-7c9f5d8b-2xk4p -- cat /etc/config/app.yaml
```

*What just happened:* a single command runs in the container and its output comes back to you, no interactive session needed. Great for quick "is the config what I think it is?" checks.

## Reach the service: `port-forward`

A service inside the cluster usually isn't reachable from your laptop. `port-forward` tunnels a local port straight to a pod or service so you can poke it with a browser or curl, without exposing anything publicly.

```bash
kubectl port-forward svc/web 8080:80
```

```text
Forwarding from 127.0.0.1:8080 -> 80
Forwarding from [::1]:8080 -> 80
```

*What just happened:* traffic to `localhost:8080` on your machine now flows to port 80 of the `web` service in the cluster. Open `http://localhost:8080` and you're hitting the in-cluster app. The tunnel lives only as long as the command runs - Ctrl-C closes it. The format is `LOCAL:REMOTE`, so `8080:80` means "my 8080 → its 80."

## Change it: `apply`

So far everything has been read-only. `apply` is how you make changes the right way. You hand it a YAML file describing the desired state, and Kubernetes makes reality match it.

```bash
kubectl apply -f deployment.yaml
```

```text
deployment.apps/web configured
```

*What just happened:* Kubernetes compared your file to what's running and made the difference real. The output verb tells you what it did - `created` (new), `configured` (changed), or `unchanged` (already matched). `apply` is declarative: the file is the source of truth, and you can run it repeatedly with the same result.

> **apply vs edit:** `kubectl edit deploy web` opens the live object in your editor for a quick in-place change. It's handy for a hotfix at 3am - but the change exists only in the cluster, not in your YAML or git, so it vanishes the next time someone runs `apply`. Treat `edit` as a temporary probe; treat `apply -f` (from version-controlled files) as how real changes ship. If you `edit` something to recover, port the fix back into the YAML before you forget.

A few change commands you'll use alongside `apply`:

```bash
kubectl rollout status deploy/web        # watch a deployment finish rolling out
kubectl rollout restart deploy/web       # restart all pods (e.g. to reload config)
kubectl rollout undo deploy/web          # roll back to the previous version
```

*What just happened:* `rollout status` blocks until the new version is fully up (or fails), so you know when a deploy is actually done. `rollout restart` cycles the pods without changing the spec. `rollout undo` is your panic button - it reverts to the last known-good revision.

## The 90-percent set, in one place

If you remember nothing else, remember this list. It covers most days:

```text
kubectl get pods [-A] [-o wide] [-w]     # what exists, what state
kubectl describe pod <name>              # why it's in that state (read Events!)
kubectl logs <name> [-f] [--previous]    # what the app itself said
kubectl exec -it <name> -- /bin/sh       # get inside
kubectl port-forward svc/<name> 8080:80  # reach it from localhost
kubectl apply -f <file>.yaml             # change it, declaratively
```

*What just happened:* six commands, each with a flag or two. This is the actual working vocabulary of most Kubernetes users. The next phase shows how to chain the read commands into a debugging loop when a pod refuses to start.

```quiz
[
  {
    "q": "A pod keeps restarting and `kubectl logs <pod>` shows nothing useful. What should you try?",
    "choices": [
      "kubectl logs <pod> --previous",
      "kubectl delete <pod>",
      "kubectl get pods -w",
      "kubectl apply -f again"
    ],
    "answer": 0,
    "explain": "`--previous` shows logs from the container instance that just crashed - where the real error usually is - instead of the fresh, empty one."
  },
  {
    "q": "What's the key risk of fixing something with `kubectl edit` instead of `kubectl apply -f`?",
    "choices": [
      "edit is slower than apply",
      "edit can only change one field at a time",
      "The change lives only in the cluster and is lost on the next apply",
      "edit requires cluster-admin permissions"
    ],
    "answer": 2,
    "explain": "`edit` mutates the live object but not your YAML or git, so the next `apply` from version control overwrites it. Use edit for temporary probes, apply for real changes."
  },
  {
    "q": "In `kubectl port-forward svc/web 8080:80`, what does 8080:80 mean?",
    "choices": [
      "Cluster port 8080 maps to your local port 80",
      "Your local port 8080 maps to the service's port 80",
      "It forwards both ports 8080 and 80 simultaneously",
      "It's a timeout in seconds"
    ],
    "answer": 1,
    "explain": "The format is LOCAL:REMOTE. Traffic to localhost:8080 on your machine is tunneled to port 80 of the in-cluster service."
  }
]
```

← [Phase 1: The mental model](01-the-mental-model.md) | [Overview](_guide.md) | [Phase 3: When a pod won't start](03-when-pods-wont-start.md) →
