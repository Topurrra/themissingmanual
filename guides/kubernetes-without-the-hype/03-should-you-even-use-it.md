---
title: "Should You Even Use It?"
guide: "kubernetes-without-the-hype"
phase: 3
summary: "The honest cost-benefit: Kubernetes is powerful and genuinely complex, and the operational cost is real. Most small apps are happier on a VPS or a PaaS. When k8s actually earns its keep — real scale, many services, a platform team — and how to dodge resume-driven Kubernetes."
tags: [kubernetes, when-to-use-kubernetes, vps, paas, managed-kubernetes, operational-cost]
difficulty: advanced
synonyms: ["do i need kubernetes", "is kubernetes overkill", "kubernetes vs vps", "kubernetes vs paas", "when to use kubernetes", "managed kubernetes worth it", "resume driven kubernetes", "alternatives to kubernetes"]
updated: 2026-06-19
---

# Should You Even Use It?

This is the phase the hype leaves out, so let's be the friend who says it plainly: **knowing how Kubernetes works
is not the same as needing it.** Kubernetes is a remarkable piece of engineering, and for the right problem it's
the right tool. For most apps — and especially most *small* apps — adopting it is a large, ongoing cost paid for
problems you don't have yet. You can understand the whole thing (you do now) and still correctly decide not to run
it. That's not a failure to "level up." That's good engineering.

## The cheat-card: which way to lean

If you want the answer before the reasoning:

| Your situation | Lean toward |
|---|---|
| One app, or a handful, modest traffic | **A VPS** — [deploying to a VPS](/guides/deploying-to-a-vps) |
| You want to push code and not think about servers | **A PaaS** (managed app platform) |
| A few containers that just need to run together | **Docker Compose on one box** — see [Docker without the magic](/guides/docker-without-the-magic) |
| Many services, real scale, a team to operate it | **Kubernetes** (ideally *managed* k8s) |
| "It'll look good on my resume / everyone uses it" | **None of the above — stop and re-read this phase** |

Now the why.

## The honest trade-off

Let's put both sides on the table, because a one-sided pitch is exactly what got Kubernetes over-adopted.

**What Kubernetes genuinely gives you.** Everything from Phase 1, for real: self-healing across machine failures,
declarative rollouts and rollbacks, horizontal scaling, service discovery and load balancing, and a single,
uniform way to describe all of it that works the same on any cluster, any cloud. If you operate many services on
many machines, this is enormous, and rebuilding it yourself would be its own disaster.

**What it genuinely costs.** This is the part the tutorials skip:

- **A new, deep body of knowledge.** Pods, Deployments, and Services are the *start*. Production means
  Ingress, ConfigMaps and Secrets, RBAC, namespaces, resource requests and limits, liveness/readiness probes,
  StatefulSets and storage classes, network policies, autoscalers, and the upgrade treadmill. Each is a real
  topic. The learning curve doesn't end; it just slopes more gently.
- **Standing operational work.** A cluster is itself a system that has to be run: kept patched, upgraded across
  versions that deprecate APIs out from under you, monitored, secured, and debugged when *it* (not just your app)
  misbehaves. You've added a powerful machine, and now you own the machine.
- **More moving parts to debug.** When something breaks, "is it my app, my container, my Pod, my Service, my
  Ingress, my node, or the control plane?" is a real question you now have to answer, often at a bad hour. The
  abstraction that gives you power also gives you more layers to be wrong in.
- **Real money, even when small.** A cluster wants a control plane and a baseline of nodes running before you've
  served a single user. A small app on a VPS can cost a few dollars a month; a cluster's floor is meaningfully
  higher and rarely scales down to "tiny."

None of these are reasons to never use Kubernetes. They're the bill, and you should read it before you sign.

## What "smaller" looks like — and why it's usually right

For most apps, something far lighter does the job with a fraction of the cost:

- **A VPS** (a single rented Linux server). You deploy your app — or a few containers via Docker Compose — onto
  one machine you understand end to end. One thing to reason about, one place to look when it breaks, a few
  dollars a month. For a great many real, revenue-earning apps this is genuinely the correct architecture, not a
  starter you're meant to outgrow. We cover it properly in [deploying to a VPS](/guides/deploying-to-a-vps).
- **A PaaS** (a managed application platform). You push your code or your container, and the platform handles the
  servers, scaling, and rollouts for you. You give up some control and flexibility; in exchange you delete almost
  all the operational work. For a small team that wants to ship product instead of operate infrastructure, this
  is often the highest-leverage choice available.

The honest framing: a VPS or PaaS asks you to learn *much* less and operate *much* less, and for one app or a
handful it loses you almost nothing. You can always move to Kubernetes later — and you'll do it far better once
you've actually hit the problems it solves, instead of guessing at them.

## When Kubernetes actually earns its keep

It is the right tool — clearly, not grudgingly — when several of these are true at once:

- **Many services, not one app.** You're running tens of services that must be deployed, networked, scaled, and
  updated independently. Hand-managing that across machines is the brutal job from Phase 1, and an orchestrator
  pays for itself.
- **Real, variable scale.** You genuinely need to run many replicas across many machines and scale them up and
  down with load. The cluster's baseline cost gets amortized across a fleet that's actually large.
- **You want a uniform platform across teams or clouds.** Kubernetes gives many teams one consistent way to
  deploy, and runs the same on different clouds — valuable when you're avoiding lock-in or standardizing a big org.
- **You have the people to operate it.** This is the quiet prerequisite. Kubernetes assumes a platform/ops
  capability — people whose job includes keeping the cluster healthy. With that team, the cost above is absorbed
  by specialists and the leverage is real. *Without* it, that cost lands on the same handful of developers trying
  to ship features, and it crushes them.

If you read that list and most of it is "not us, not yet" — that's your answer, and it's a perfectly good one.

⚠️ **Gotcha — resume-driven Kubernetes.** The most expensive reason teams adopt Kubernetes is the worst one:
because it's what serious companies use, because it'll look good on a resume, or because a conference talk made it
sound mandatory. This is how a two-person team with one web app ends up maintaining a cluster instead of building
their product — paying the full operational bill for benefits they won't use for years, if ever. Choose tools for
the problem in front of you, not the company you imagine becoming. If you genuinely outgrow a VPS or a PaaS, that
will be a real, observable problem with real symptoms, and *then* moving to Kubernetes is an easy, justified call
— made far better because you'll know exactly which of its features you actually need.

## "But managed Kubernetes makes it easy" — half true

You'll hear that managed Kubernetes (the cloud providers' offerings, where they run the control plane for you)
removes the pain. Be precise about what it does and doesn't do.

**What it genuinely eases:** running and upgrading the **control plane** — the cluster's brain — which is real,
fiddly work you'd rather not own. That's a meaningful chunk of the burden, gone. It's the right choice *if* you're
running Kubernetes at all; self-hosting the control plane is for people with a specific reason to.

**What it does not remove:** everything *else* on the cost list. You still write and debug the YAML, still design
Ingress and Secrets and RBAC and probes and resource limits, still reason about Pods and Services and nodes when
things break, still own your applications' behavior on the cluster, and still pay the baseline bill. Managed
Kubernetes makes the cluster *easier to run*. It does not make Kubernetes *unnecessary to learn*, and it does not
turn a small app's over-adoption into a good idea. It lowers the bill; it doesn't waive it.

💡 **Key point.** The question is never "is Kubernetes good?" — it is, for its problem. The question is "do I have
that problem, and do I have the people to operate the solution?" For most small apps, today, the answer is no, and
a VPS or a PaaS will make you faster and happier. Keep the mental model from this guide; reach for the tool when
the problem is real.

## Recap

1. Understanding Kubernetes and *needing* it are different. You can know it cold and still rightly choose not to
   run it.
2. The power is real (self-healing, rollouts, scaling, a uniform platform) — and so is the **cost**: a deep skill
   set, standing operational work, more layers to debug, and a non-trivial baseline bill.
3. Most small apps are happier on a **[VPS](/guides/deploying-to-a-vps)**, a **PaaS**, or **Docker Compose on one
   box**. You lose little, and you can move up later — better-informed — if you truly outgrow them.
4. Kubernetes earns its keep with **many services**, **real variable scale**, a **uniform platform need**, and —
   the quiet prerequisite — **people to operate it**.
5. Avoid **resume-driven Kubernetes**. **Managed** k8s eases the control-plane burden but does **not** remove the
   rest of the cost or the need to learn it.

That's the honest picture. You now know what Kubernetes is, the objects you'd actually touch, and whether it
belongs in your stack — which is exactly the knowledge the hype was hiding.

---

[← Phase 2: The Core Objects](02-the-core-objects.md) · [Guide overview →](_guide.md)
