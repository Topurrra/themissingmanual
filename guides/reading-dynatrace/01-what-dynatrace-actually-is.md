---
title: "What Dynatrace Actually Is"
guide: "reading-dynatrace"
phase: 1
summary: "Dynatrace is an APM platform that auto-instruments your services and keeps one live model of every entity and how they connect — an always-on x-ray of your system, not a pile of dashboards."
tags: [dynatrace, apm, observability, smartscape, entity-model, auto-instrumentation]
difficulty: intermediate
synonyms: ["what is dynatrace", "what does dynatrace do", "dynatrace smartscape explained", "dynatrace entity model", "dynatrace oneagent auto instrumentation", "is dynatrace just dashboards"]
updated: 2026-06-19
---

# What Dynatrace Actually Is

The first time you open Dynatrace it feels like ten products bolted together: infrastructure charts, a
service map, traces, user-session replays, a problems feed. The instinct is to treat each screen as its own
tool and try to memorize where everything lives. That instinct is exactly what makes it overwhelming.

Here's the secret that makes it calm: **all of those screens are windows onto one shared model.** Dynatrace
keeps a single, continuously-updated picture of your whole system — every host, every service, every
database, and crucially *how they talk to each other* — and each "view" is just a different lens on that one
picture. Learn the model and the screens stop being separate things to learn.

## Dynatrace is an APM / observability platform — an always-on x-ray

**What it actually is.** APM stands for *Application Performance Monitoring*. The mental model to hold:
Dynatrace is an **always-on x-ray of your running system**. An x-ray doesn't ask you to guess where the bone
is — it shows you the whole structure at once, and where something's wrong lights up. Dynatrace does the
same for your services: it's watching everything, all the time, and surfaces where the trouble is.

📝 **Terminology — observability vs. monitoring.** *Monitoring* answers questions you knew to ask ("is CPU
high?"). *Observability* is the property that lets you ask new questions after the fact ("why was *this one*
checkout slow at 2:14am?") without shipping new code. Dynatrace aims at the second — covered in depth in
[Observability: Logs, Metrics & Traces](/guides/observability-logs-metrics-traces).

**Why people get this wrong.** Newcomers think Dynatrace is "a dashboard tool" — a place where someone hand-
builds charts. You *can* build dashboards, but that's the smallest part. The heart of it is the live model
underneath, which is assembled for you whether or not anyone builds a single chart.

## Auto-instrumentation — why you didn't have to add tracing code

**What it actually is.** On each host runs an agent (Dynatrace calls it **OneAgent**). It hooks into your
application runtime and automatically detects your services, the requests flowing through them, and the calls
they make to other services and databases — *without you adding tracing libraries to your code*.

**What it does in real life.** This is the part that surprises people: you didn't write any trace-collection
code, yet full distributed traces appear. The agent instruments common frameworks and protocols at the
runtime level, so an incoming HTTP request and the outgoing database call it triggers are captured and
*stitched together* into one trace automatically.

⚠️ **Gotcha — "automatic" is not "total."** Auto-instrumentation covers the technologies Dynatrace knows how
to hook. A service written in an unsupported runtime, a call over an exotic protocol, or a third-party API
outside your hosts may show up as a vague "external" box or not at all. When a trace has a suspicious gap,
the first question is "is this tier actually instrumented?" — not "what broke inside it." An uninstrumented
hop looks a lot like a fast one.

## The entity model — everything is a thing with a type and an identity

**What it actually is.** Dynatrace doesn't store loose metrics floating in space. It models your system as
**entities**: a *host* is an entity, a *process* is an entity, a *service* is an entity, a *database* is an
entity. Each one has a stable identity, a type, and relationships to other entities ("this service *runs on*
that process," "this service *calls* that database").

**Why this matters for reading the UI.** Almost every screen is "an entity and the stuff attached to it."
When you click a service, you get *that service's* response time, failures, and the entities it depends on —
because the model already knows those links. You're never assembling the relationships yourself; you're
navigating ones the model already drew.

```text
   ENTITY MODEL — everything is a typed node with relationships
   (illustrative)

        ┌──────────────┐  calls   ┌──────────────┐  calls   ┌────────────┐
        │ checkout-svc │ ───────► │ pricing-svc  │ ───────► │  orders-db │
        └──────┬───────┘          └──────┬───────┘          └────────────┘
               │ runs on                 │ runs on
        ┌──────▼───────┐          ┌──────▼───────┐
        │  process A   │          │  process B   │
        └──────┬───────┘          └──────┬───────┘
               │ on host                 │ on host
        ┌──────▼───────┐          ┌──────▼───────┐
        │   host-01    │          │   host-02    │
        └──────────────┘          └──────────────┘

   Each box = an entity (typed, with a stable identity).
   Each arrow = a relationship the model already knows.
```

*What just happened:* That diagram is the thing Dynatrace is really storing. Every chart, map, and trace you
see is rendered from these nodes and edges. This is why clicking around feels connected: you're walking a
graph, not flipping between unrelated reports.

## Smartscape & the service flow — the live map of who talks to whom

**What it actually is.** **Smartscape** is the visual, navigable form of that entity graph — a live map across
the tiers (applications → services → processes → hosts), showing the connections between them and updating as
your system changes. The closely-related **service flow** zooms in on one service and shows the chain of
services and databases that requests fan out to from there.

**What it does in real life.** When a service is slow, the map gives you the *neighborhood*: what calls this
service, what this service calls, and which of those neighbors is also unhealthy. That turns "the app is slow"
into "checkout calls pricing, pricing calls orders-db, and orders-db is the one lighting up." You get a
direction to look before you've read a single trace.

💡 **Key point.** The map shows you *topology and direction* — who depends on whom. It does **not** by itself
prove causation. A downstream service lighting up red might be the cause, or might just be the loudest victim.
The map narrows where to look; the trace (Phase 2) and the Problem analysis (Phase 3) are where you confirm.

**Why this saves you later.** When you understand that Smartscape, the service list, the traces, and the
problems feed are all the *same model* seen from different angles, you stop hunting for "the right dashboard."
You start from wherever you landed — a red service, an alert, a slow trace — and *navigate the relationships*
to the rest. The tool stops being a maze and becomes a map you already know how to walk.

## Recap

1. **Dynatrace is one live model of your system**, not a pile of dashboards — every view is a lens on it.
2. **OneAgent auto-instruments** your services, so distributed traces appear without you writing tracing
   code — but "automatic" only covers supported tech; gaps can be uninstrumented hops, not failures.
3. **The entity model** stores your system as typed nodes (host, process, service, database) with
   relationships — which is why clicking around feels connected.
4. **Smartscape / service flow** is that graph made visual: it shows topology and direction (who calls whom),
   narrowing *where* to look — but it shows correlation, not proven cause.

Now that you know what the model is, the next step is reading one request as it moves through it.

---

[← Guide overview](_guide.md) · [Phase 2: Reading a Service Flow & a Trace →](02-reading-a-service-flow-and-a-trace.md)
