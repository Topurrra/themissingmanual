---
title: "When a pod won't start: the debugging loop"
guide: kubectl-day-to-day
phase: 3
summary: "The Kubernetes commands you actually use: get/describe/logs/exec to see what's happening, apply to change it, and the debugging loop when a pod won't start."
tags: [kubectl, kubernetes, containers, devops, debugging, cli]
difficulty: intermediate
synonyms: ["kubectl commands", "kubectl cheat sheet", "kubectl get pods", "kubectl describe", "kubectl logs", "crashloopbackoff", "imagepullbackoff", "kubectl debugging", "kubectl day to day", "how to use kubectl"]
updated: 2026-06-30
---

# When a pod won't start: the debugging loop

This is the phase that earns its keep. A pod is stuck, the deploy is red, and you need to find out why - calmly, in order, without flailing. The good news: there's a fixed loop that handles the large majority of "pod won't start" problems, and the status string itself usually tells you which branch to take.

## The loop, in three moves

Whatever the symptom, run these in order. Each step narrows it down.

```text
1. kubectl get pods          → read the STATUS column
2. kubectl describe pod X    → scroll to Events (the why)
3. kubectl logs X [-p]       → read what the app said before it died
```

*What just happened:* `get` tells you the *category* of failure (the status), `describe` tells you what Kubernetes tried and what went wrong (the events), and `logs` tells you what your own code said on the way down. Status is the diagnosis; events and logs are the detail. Resist the urge to skip to logs - the status often tells you logs won't even exist yet.

```text
get pods → STATUS?
   │
   ├─ ImagePullBackOff ─► describe → fix the image name / registry auth
   ├─ Pending ─────────► describe → no room to schedule (resources / affinity)
   ├─ CrashLoopBackOff ► logs --previous → the app is crashing on startup
   └─ Running but 0/1 ─► describe → readiness/liveness probe failing
```

*What just happened:* the status routes you to the right next step. Three statuses cover most real outages. Let's take them one at a time.

## ImagePullBackOff: Kubernetes can't get the image

The node tried to pull your container image and failed. Nothing about your code is wrong yet - the cluster can't even get the image to run.

```bash
kubectl describe pod worker-5f6c8d9b-tq2vn
```

```text
Events:
  Warning  Failed  30s  kubelet  Failed to pull image "registry.example.com/worker:1.4.2":
                                 manifest unknown: manifest unknown
```

*What just happened:* the event names the exact image string and the exact failure. The usual culprits, in rough order: a typo in the image name or tag, a tag that was never pushed, or the cluster lacking credentials for a private registry (you'd see `unauthorized` or `pull access denied` instead). `logs` is useless here - there's no container to log. Fix the image reference (or the registry secret) and re-`apply`.

> **Why "BackOff"?** Kubernetes doesn't retry instantly forever - it backs off, waiting longer between attempts. So the status flickers between `ErrImagePull` (the latest attempt failed) and `ImagePullBackOff` (waiting before the next try). Same root cause; the BackOff version means it's been failing for a bit.

## Pending: nowhere to put it

`Pending` means the pod has been accepted but the scheduler can't place it on any node. The pod isn't broken - there's no room, or no node that matches its requirements.

```bash
kubectl describe pod worker-5f6c8d9b-tq2vn
```

```text
Events:
  Warning  FailedScheduling  45s  default-scheduler
    0/3 nodes are available: 3 Insufficient memory.
```

*What just happened:* the scheduler told you, per node, why it said no. `Insufficient memory` (or cpu) means your pod requested more than any node has free - shrink the request or add capacity. Other common reasons: `node(s) had untolerated taint` (the pod isn't allowed on the available nodes), or an unbound `PersistentVolumeClaim` (it's waiting for storage). The fix is almost never in the pod's code; it's in resources, scheduling rules, or storage.

## CrashLoopBackOff: it starts, then dies, on repeat

This is the one everybody meets. The container *does* start - then exits or crashes within seconds, Kubernetes restarts it, it crashes again, and Kubernetes backs off between restarts (hence the name). Your `RESTARTS` count climbs steadily.

Here `describe` tells you it's crashing, but the *reason* is in the application logs - and crucially, in the **previous** container's logs, because the current one may have already died.

```bash
kubectl logs worker-5f6c8d9b-tq2vn --previous
```

```text
Traceback (most recent call last):
  File "/app/server.py", line 11, in <module>
    DATABASE_URL = os.environ["DATABASE_URL"]
KeyError: 'DATABASE_URL'
```

*What just happened:* the real cause appeared - the app crashed on boot because a required environment variable was missing. Without `--previous`, you might have seen an empty log (the freshest container hadn't even gotten far enough to print). CrashLoopBackOff is almost always an application-level problem: a missing env var or config, a bad migration, a failed dependency connection, or an unhandled exception at startup. Read the stack trace, fix the cause, re-`apply`.

It's also worth glancing at the exit code in `describe`, under the container's `Last State`:

```text
    Last State:     Terminated
      Reason:       Error
      Exit Code:    1
```

*What just happened:* exit code 1 is a generic application error (read the logs). One code worth recognizing: **137** means the container was killed - usually the OOMKilled signal, meaning it used more memory than its limit allowed. If you see 137, the fix is a memory limit or a memory leak, not a logic bug.

## Running but not Ready: the probe is failing

A subtle one. `get pods` shows `STATUS: Running` but `READY: 0/1`. The container is up, but Kubernetes won't send it traffic because its **readiness probe** is failing - the app hasn't reported itself healthy.

```bash
kubectl describe pod web-7c9f5d8b-2xk4p
```

```text
Events:
  Warning  Unhealthy  10s (x6 over 1m)  kubelet
    Readiness probe failed: HTTP probe failed with statuscode: 503
```

*What just happened:* the app is running but its health endpoint returns 503, so Kubernetes keeps it out of the load balancer. Either the app genuinely isn't ready (still connecting to its database, warming a cache) or the probe is misconfigured (wrong path, wrong port, too short a timeout). Check the app logs to see which, then fix the app or the probe definition.

## The discipline that makes it fast

The loop only works if you actually *read* the output instead of skimming it. Three habits separate the people who fix it in two minutes from the people who flail for twenty:

- **Trust the status first.** `ImagePullBackOff` means don't bother with logs. `CrashLoopBackOff` means go straight to `logs --previous`. The status is a signpost; follow it.
- **Scroll to Events.** In `describe`, the Events section at the very bottom is where Kubernetes confesses what it tried and why it failed. It's the highest-value output in the whole tool.
- **Use `--previous` reflexively for restart loops.** The crash you want is in the container that already died, not the fresh one.

If the noun "readiness probe" or "PersistentVolumeClaim" is still fuzzy, [/guides/kubernetes-without-the-hype](/guides/kubernetes-without-the-hype) explains the moving parts; and if the image itself is the suspect, building and tagging it correctly is covered in [/guides/docker-without-the-magic](/guides/docker-without-the-magic).

In the wild, on-call engineers don't have a secret sense for this. They run the same three commands in the same order every single time, and they let the output tell them where to go next. That's the whole trick - a loop you can run half-asleep, which is often exactly when you'll need it.

```quiz
[
  {
    "q": "A pod is in CrashLoopBackOff. What's the right first move?",
    "choices": [
      "kubectl delete the pod and hope it reschedules cleanly",
      "kubectl logs <pod> --previous to read why the crashed container died",
      "kubectl describe the node it's running on",
      "Increase the pod's CPU request"
    ],
    "answer": 1,
    "explain": "CrashLoopBackOff means the app started then died. The cause is in the application logs - and in the PREVIOUS container's logs, since the current one may already be gone."
  },
  {
    "q": "A pod is stuck in Pending and describe shows '0/3 nodes are available: 3 Insufficient memory.' What's the problem?",
    "choices": [
      "The container image can't be pulled",
      "The application is crashing on startup",
      "The scheduler can't place the pod because no node has enough free memory",
      "The readiness probe is failing"
    ],
    "answer": 2,
    "explain": "Pending means the scheduler can't place the pod. 'Insufficient memory' means the pod requests more than any node has free - reduce the request or add capacity."
  },
  {
    "q": "In a container's Last State, you see Exit Code 137. What does that usually mean?",
    "choices": [
      "A generic application error - read the logs",
      "The image was not found in the registry",
      "The container was killed for exceeding its memory limit (OOMKilled)",
      "The readiness probe returned 503"
    ],
    "answer": 2,
    "explain": "Exit code 137 typically means the container was OOMKilled - it used more memory than its limit allowed. The fix is a higher limit or a memory leak, not a logic bug."
  }
]
```

← [Phase 2: The commands you actually run](02-the-everyday-commands.md) | [Overview](_guide.md)
