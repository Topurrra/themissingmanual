---
title: "The Core Objects"
guide: "kubernetes-without-the-hype"
phase: 2
summary: "The pieces you actually meet: the Pod (one or more containers), the Deployment (desired replicas + safe rollouts), the Service (a stable address + load balancing), and the controllers that reconcile actual toward desired — shown with annotated YAML and kubectl transcripts."
tags: [kubernetes, pod, deployment, service, kubectl, yaml, controllers]
difficulty: advanced
synonyms: ["kubernetes pod explained", "what is a deployment in kubernetes", "what is a service in kubernetes", "pod vs deployment vs service", "kubernetes deployment yaml example", "kubectl get pods", "kubernetes replicas rollout"]
updated: 2026-06-19
---

# The Core Objects

Kubernetes has a *lot* of objects, and the docs list them all with equal weight, which is how everyone ends up
overwhelmed. The truth is that to run an app you meet a small handful, over and over. Learn these four ideas —
Pod, Deployment, Service, and the controller that ties them together — and you can read most real-world setups.

A quick way to hold them before we dig in:

```text
   Service        ── a stable front door + load balancer (one address, many backends)
      │
      ▼  routes traffic to
   Deployment     ── "I want N copies of this app, here's how to update them safely"
      │
      ▼  creates & maintains
   Pod ×N         ── the smallest runnable unit: a wrapper around your container(s)
      │
      ▼  runs
   your container ── the image you built in the Docker guide
```

Notice the direction. You almost never create a Pod yourself. You declare a **Deployment**, it makes the
**Pods**, and a **Service** gives those Pods a stable address. Let's take them in the order you'd actually build.

## The Pod — the smallest thing Kubernetes runs

**What it actually is.** A Pod is the smallest unit Kubernetes schedules: a thin wrapper around **one or more
containers** that share a network address and storage and always live and die together on the same machine.
Ninety percent of the time a Pod holds exactly *one* container — your app — and you can read "Pod" as "my running
container, plus the Kubernetes paperwork around it."

**Why people get this wrong.** Two traps. First, people assume a Pod is one container — usually true, but the
*reason* a Pod exists as its own concept is the rare case where two containers are so tightly coupled they must
share a network and be co-located (a "sidecar," like a logging helper riding alongside your app). Second, and
more important: people treat Pods as pets you create and tend. **Pods are cattle.** They're meant to be
disposable — created, killed, and replaced constantly. A Pod has no memory of a previous one; if it dies, you
don't repair it, the system makes a fresh one.

**Why this saves you later.** Because Pods are disposable, you never store anything precious *inside* one (its
filesystem vanishes with it — the same lesson as Docker containers, now multiplied across a fleet). And because
they're disposable, the question "how do I keep the right number alive?" can't be the Pod's job. That's what the
Deployment is for.

📝 **Terminology.** *Node* = one machine in the cluster (physical or virtual) that runs Pods. *Cluster* = all
the nodes plus the *control plane* (the brain running the controllers and the API). You talk to the cluster's
API with `kubectl`; the control plane decides which node each Pod lands on.

## The Deployment — desired replicas and safe rollouts

This is the object you'll actually write and edit most. If you learn one Kubernetes object well, make it this.

**What it actually is.** A Deployment is a declaration that says: *"Here's a Pod template, and I want N copies
(replicas) of it running at all times — and here's how to roll out changes to them safely."* It's the standing
goal from Phase 1, written down. You hand it to the cluster, and a controller takes on the job of keeping exactly
N healthy Pods alive, replacing any that die, and — when you change the template — rolling Pods over to the new
version gradually instead of all at once.

**A real example.** Here is a minimal, annotated Deployment. This is the shape you'll see everywhere:

```yaml
apiVersion: apps/v1
kind: Deployment              # the object type
metadata:
  name: web                   # what we'll call this Deployment
spec:
  replicas: 3                 # ← THE DESIRED STATE: keep 3 Pods alive
  selector:
    matchLabels:
      app: web                # this Deployment owns Pods labeled app=web
  template:                   # ← the Pod template: every replica is stamped from this
    metadata:
      labels:
        app: web              # the label the selector above matches (these MUST agree)
    spec:
      containers:
        - name: web
          image: myapp:1.4.0  # the image to run — same kind you built with Docker
          ports:
            - containerPort: 8080   # the port your app listens on inside the container
```

*What just happened:* You didn't tell Kubernetes to *start three containers*. You declared that the world should
contain three Pods stamped from that template, labeled `app=web`. The `replicas: 3` line is the desired state;
the `selector`/`labels` pair is how the Deployment recognizes which Pods are "its own" (labels are how almost
everything in Kubernetes finds everything else). Apply this and the control loop from Phase 1 goes to work:

```console
$ kubectl apply -f web-deployment.yaml
deployment.apps/web created

$ kubectl get pods
NAME                   READY   STATUS    RESTARTS   AGE
web-7d9f8c6b5d-2xk9p   1/1     Running   0          12s
web-7d9f8c6b5d-q4m7n   1/1     Running   0          12s
web-7d9f8c6b5d-v8r2t   1/1     Running   0          12s
```

*What just happened:* `apply` sent your declared state to the cluster's API. The Deployment controller saw
"desired: 3, actual: 0," and created three Pods, each named after the Deployment plus a random suffix (because
they're disposable — the suffix is the cluster's, not yours to care about). `1/1` means one of one containers in
the Pod is ready. You declared a number; the cluster made it true.

Now watch the self-healing be utterly mundane:

```console
$ kubectl delete pod web-7d9f8c6b5d-2xk9p
pod "web-7d9f8c6b5d-2xk9p" deleted

$ kubectl get pods
NAME                   READY   STATUS    RESTARTS   AGE
web-7d9f8c6b5d-q4m7n   1/1     Running   0          3m
web-7d9f8c6b5d-v8r2t   1/1     Running   0          3m
web-7d9f8c6b5d-8lz5w   1/1     Running   0          6s     ← brand-new, replacing the one you killed
```

*What just happened:* You deleted a Pod, dropping actual to 2. The desired state still said 3. On its next pass
the controller closed the gap by creating a fresh Pod (note the new suffix and the 6-second age). You didn't ask
for that recovery; it's the control loop, exactly as Phase 1 described.

**Rolling out a new version.** Change the image and re-apply — this is the everyday update:

```console
$ kubectl set image deployment/web web=myapp:1.5.0
deployment.apps/web image updated

$ kubectl rollout status deployment/web
Waiting for deployment "web" rollout to finish: 1 out of 3 new replicas have been updated...
Waiting for deployment "web" rollout to finish: 2 out of 3 new replicas have been updated...
deployment "web" successfully rolled out
```

*What just happened:* The Deployment didn't kill all three old Pods at once. It brought up new (`1.5.0`) Pods and
retired old (`1.4.0`) ones a few at a time, keeping the app serving throughout — a **rolling update**. If the new
Pods had failed their health checks, it would have stopped, leaving the old ones running, and you could
`kubectl rollout undo deployment/web` to snap back to the previous version. *That* — gradual, watched, reversible
updates — is the rollout pain from Phase 1, solved.

⚠️ **Gotcha — the selector and the template labels must match.** The `selector.matchLabels` and the
`template.metadata.labels` have to agree (both `app: web` above). If they don't, the Deployment either refuses to
create or creates Pods it then can't recognize as its own, and you get a baffling "it made Pods but says it has
zero replicas" situation. When a Deployment behaves like it can't see its own Pods, check the labels first.

## The Service — a stable address in a world of disposable Pods

Pods are disposable, which creates an obvious problem: every Pod has its own IP, and those Pods are constantly
being replaced with new ones at new IPs. So how does anything *reach* your app? You can't hand out an address
that changes every time a Pod restarts. The Service is the answer.

**What it actually is.** A Service is a **stable, unchanging address** that sits in front of a set of Pods and
load-balances traffic across them. The Pods behind it come and go; the Service's name and address stay put. It
finds its Pods the same way the Deployment does — by **label selector** — so it automatically includes new Pods
and drops dead ones.

**A real example.** A minimal Service for the Deployment above:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web                   # other apps reach this app by this name
spec:
  selector:
    app: web                  # send traffic to every Pod labeled app=web
  ports:
    - port: 80                # the Service listens on port 80
      targetPort: 8080        # and forwards to the Pods' containerPort 8080
```

```console
$ kubectl apply -f web-service.yaml
service/web created

$ kubectl get service web
NAME   TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
web    ClusterIP   10.96.140.21    <none>        80/TCP    5s
```

*What just happened:* You created a Service named `web` with a fixed cluster IP (`10.96.140.21`) that won't
change for the life of the Service. Anything inside the cluster can now reach your app at `web` (Kubernetes gives
it an internal DNS name) without ever knowing or caring which Pods exist or what their IPs are. Each request gets
load-balanced to one of the healthy `app=web` Pods. When a Pod dies and the Deployment replaces it, the Service
picks up the new one and drops the old one automatically — same label selector, same as before.

📝 **Terminology.** *ClusterIP* (the default, shown above) = an address reachable only *inside* the cluster — for
one app talking to another. To expose an app to the outside world you use a different Service type (`NodePort` or
`LoadBalancer`) or an **Ingress**, which we deliberately leave for operational follow-up material; the mental
model — *a stable address fronting disposable Pods* — is identical regardless of type.

**Why this trio is the whole pattern.** Deployment keeps N Pods alive and updates them safely; Service gives them
one steady address and spreads load; the control loop ties it together and heals it. That's a complete, running,
self-maintaining service expressed in two short YAML files. Every fancier object you'll meet later is a
refinement of this base — and now you can read it.

## How it all fits

```text
   you ──apply──► Deployment (replicas: 3, template, image)
                       │ controller maintains
                       ▼
                 Pod  Pod  Pod   (labeled app=web, disposable, replaced on death)
                  ▲    ▲    ▲
                  └────┼────┘  selected by label
                       │
   traffic ──────► Service "web" (stable IP, load-balances across the live Pods)
```

## Recap

1. A **Pod** wraps one (occasionally more) container; it's the smallest unit Kubernetes runs, and it's
   **disposable** — replaced, not repaired. You rarely create one directly.
2. A **Deployment** declares **desired replicas** and a **Pod template**, then keeps exactly that many alive,
   replaces dead Pods, and performs **safe, reversible rolling updates** when you change the image.
3. A **Service** is a **stable address** that load-balances across a Deployment's Pods, finding them by **label**
   so it tracks the constant churn automatically.
4. **Labels + selectors** are the glue: Deployments own Pods by label, Services route to Pods by label. Mismatched
   labels are a top early bug.

Now the honest part everyone skips: knowing how Kubernetes works doesn't mean you should run it. Next, when it
earns its keep — and when it absolutely doesn't.

---

[← Phase 1: The Problem K8s Solves](01-the-problem-k8s-solves.md) · [Phase 3: Should You Even Use It? →](03-should-you-even-use-it.md)
