---
title: "The mental model: kubectl talks to one API"
guide: kubectl-day-to-day
phase: 1
summary: "The Kubernetes commands you actually use: get/describe/logs/exec to see what's happening, apply to change it, and the debugging loop when a pod won't start."
tags: [kubectl, kubernetes, containers, devops, debugging, cli]
difficulty: intermediate
synonyms: ["kubectl commands", "kubectl cheat sheet", "kubectl get pods", "kubectl describe", "kubectl logs", "crashloopbackoff", "imagepullbackoff", "kubectl debugging", "kubectl day to day", "how to use kubectl"]
updated: 2026-06-30
---

# The mental model: kubectl talks to one API

The first time you watch someone fly through kubectl, it looks like a hundred memorized incantations. It isn't. There's one shape under almost everything, and once you see it, the "hundred commands" collapse into a small grammar you can recombine.

## kubectl is a typewriter, not the cluster

Here is the single most useful thing to internalize: **kubectl does almost nothing itself.** It takes your command, turns it into an HTTP request, and sends it to the Kubernetes API server. The API server is the brain. kubectl is the keyboard.

```text
you ──► kubectl ──► (HTTPS) ──► API server ──► etcd (the cluster's memory)
                                     │
                                     ▼
                              controllers + kubelets
                              make reality match the request
```

*What just happened:* every command you run is a read or a write against one API. `kubectl get pods` is a GET. `kubectl apply` is roughly a PATCH. This is why the commands feel so regular — they're all CRUD against the same set of resources.

Why does this matter on a normal Tuesday? Because it tells you where to look when things are weird. If a command hangs, the question is "can I reach the API server?" not "is kubectl broken?" If a change "didn't take," the question is "did the write reach the API, and did a controller act on it?" You stop blaming the tool and start reading the system.

## The grammar: verb, resource, name

Most kubectl commands fit one template:

```text
kubectl <verb> <resource-type> <name> [flags]
```

```bash
kubectl get pods                  # verb=get, resource=pods, no name → list them all
kubectl get pod web-7c9f          # one specific pod
kubectl describe pod web-7c9f     # verb=describe → the full story of one object
kubectl delete pod web-7c9f       # verb=delete
kubectl logs web-7c9f             # logs is special: it targets a pod by name directly
```

*What just happened:* the same four pieces rearrange into different commands. Learn the verbs (`get`, `describe`, `logs`, `exec`, `apply`, `delete`) and the common resources (`pods`, `deployments`, `services`, `nodes`, `events`) and you can already express most of what you need.

A few resources have short aliases you'll see constantly — `po` for pods, `deploy` for deployments, `svc` for services, `ns` for namespaces. They're typing savers, nothing more:

```bash
kubectl get po          # same as kubectl get pods
kubectl get deploy      # deployments
kubectl get svc         # services
```

*What just happened:* `po` and `pods` hit the exact same API endpoint. Use whichever your fingers prefer; the cluster can't tell the difference.

## Context and namespace: where am I, and where am I looking?

Two settings silently shape every command, and forgetting them is the number-one source of "it works on my machine but not in the demo."

**Context** = which cluster (and which user/credentials) you're talking to. Your `kubectl` config can hold many clusters — laptop minikube, staging, production — and exactly one is "current."

```bash
kubectl config current-context        # which cluster am I pointed at RIGHT NOW?
kubectl config get-contexts           # list all of them; the * marks current
kubectl config use-context staging    # switch
```

*What just happened:* `current-context` answers the scariest question in Kubernetes — "wait, is this prod?" Run it before any command that changes things. The asterisk in `get-contexts` is your you-are-here marker.

**Namespace** = a folder inside one cluster. Pods, services, and deployments live in a namespace. By default kubectl looks only at the `default` namespace, which is why `get pods` can come back empty even though the cluster is busy — your workload is in `payments` or `kube-system`, not `default`.

```bash
kubectl get pods                       # only the 'default' namespace
kubectl get pods -n payments           # look in the 'payments' namespace
kubectl get pods -A                     # ALL namespaces (the honest full picture)
```

*What just happened:* `-A` (short for `--all-namespaces`) is the command that ends the "but there's nothing running!" confusion. When a cluster looks empty, run `get pods -A` and the truth appears.

> **Two-question habit:** before any command that matters, ask *which context* and *which namespace*. Ninety percent of "kubectl is lying to me" moments are actually "I was looking in the wrong place." A wrong context can also mean you're about to change the wrong cluster — that one isn't only confusing, it's dangerous.

If typing `-n payments` on every command gets old, you can pin the default namespace for your current context:

```bash
kubectl config set-context --current --namespace=payments
```

*What just happened:* from now on, in this context, bare commands target `payments`. It's a per-context setting, so switching clusters with `use-context` resets you to that cluster's default — which is exactly what you want.

## Why this mental model pays off

Everything in the next two phases is built from these pieces. "Read what's happening" is `get` and `describe` and `logs`. "Change it" is `apply`. "Get inside" is `exec` and `port-forward`. The debugging loop is nothing more than running the read verbs in a deliberate order. You're not memorizing a phrasebook — you're learning a grammar, and grammar generalizes.

In the wild, the engineers who look fastest with kubectl aren't the ones who memorized the most. They're the ones who always know their context and namespace, and who read the output instead of skimming it.

```quiz
[
  {
    "q": "What does kubectl actually do when you run a command?",
    "choices": [
      "Runs the workload directly on your laptop",
      "Turns the command into an HTTP request to the Kubernetes API server",
      "Edits etcd files on disk over SSH",
      "Restarts the affected pods itself"
    ],
    "answer": 1,
    "explain": "kubectl is a client. It builds an HTTP request to the API server, which is the real brain; controllers and kubelets do the work."
  },
  {
    "q": "You run `kubectl get pods` and get nothing, but you know the cluster is busy. What's the most likely cause?",
    "choices": [
      "The cluster is down",
      "kubectl needs reinstalling",
      "Your workload is in a different namespace than 'default'",
      "Pods don't show up in 'get' until they crash"
    ],
    "answer": 2,
    "explain": "Bare `get pods` looks only at the 'default' namespace. Use `-n <namespace>` or `-A` to see all namespaces."
  },
  {
    "q": "Which command answers 'am I about to run this against production?'",
    "choices": [
      "kubectl get pods -A",
      "kubectl config current-context",
      "kubectl describe cluster",
      "kubectl version"
    ],
    "answer": 1,
    "explain": "`config current-context` shows which cluster and credentials kubectl is pointed at right now. Run it before any change."
  }
]
```

← [Overview](_guide.md) | [Phase 2: The commands you actually run](02-the-everyday-commands.md) →
