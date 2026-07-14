---
title: "Problems & Root Cause"
guide: "reading-dynatrace"
phase: 3
summary: "How Dynatrace folds many correlated symptoms into one 'Problem' and proposes a root cause, how to walk from alert to affected entities to the actual cause, and why you verify that cause instead of trusting it blindly."
tags: [dynatrace, problem, root-cause, alerting, incident, davis, troubleshooting]
difficulty: intermediate
synonyms: ["dynatrace problem explained", "dynatrace root cause analysis", "dynatrace davis ai root cause", "how does dynatrace find root cause", "dynatrace alert affected entities", "should i trust dynatrace root cause", "dynatrace problem to cause workflow"]
updated: 2026-07-10
---

# Problems & Root Cause

It's 2:14am, a page goes off, you open the link, and Dynatrace shows you a single red **Problem** card that
says - confidently - what the root cause is. Part of you wants to believe it and go back to bed. Another part
remembers the time a tool blamed the wrong thing and a team spent an hour restarting an innocent service.

Both instincts are right. Dynatrace is genuinely good at the thing humans are bad at half-asleep: collapsing a
storm of correlated alerts into *one* incident and pointing at where it started. But its "root cause" is a
*proposal* built from correlation and topology, not a proof.

## The incident cheat-card

> **Paged right now? Find your situation, then read the section below.**

| You're looking at | The calm move |
|---|---|
| A red **Problem** card | Read what it's *grouping* - that tells you the blast radius (§1) |
| "Affected entities" / "affected users" | This is *impact*, not cause - it's who's hurting, not who's guilty (§1) |
| A proposed **root cause** | Treat as the #1 lead, not a verdict - open the evidence and confirm (§2) |
| The root-cause entity, but no *why* | Drop into its trace/logs for the code-level error (§3) |
| A cause that doesn't add up | Trust the trace and the timeline over the label - re-walk from impact (§2 ⚠️) |

---

## 1. What a "Problem" actually is - many symptoms, one incident

**What it actually is.** When something breaks, it rarely breaks quietly in one place. A slow database makes
the service above it slow, which makes the service above *that* slow, which trips the user-facing alert - five
red things, one underlying event. A **Problem** in Dynatrace is the platform's attempt to recognize that those
five red things are *one incident* and group them into a single card, instead of paging you five times.

**What it does in real life.** It uses the entity model from Phase 1 - the map of who depends on whom - plus
the *timing* of when each symptom started, to decide which alerts are part of the same story. The result is one
Problem with a timeline, a set of **affected entities**, and a proposed cause.

📝 **Terminology - Davis.** Dynatrace's built-in analysis engine is called **Davis**. When the UI says "Davis
detected" or shows an AI-flavored root cause, that's this engine correlating signals across the topology. Treat
"Davis says" as "the correlation engine's best inference," not as ground truth.

⚠️ **Gotcha - "affected entities" is impact, not cause.** This trips everyone. The list of affected entities
(and affected users) is *who is hurting* - the blast radius. It is **not** the culprit. The thing at the top of
the impact list is usually the most *visible* victim (the user-facing service), which is the furthest thing from
the cause. Read the affected list to understand *scope*; look elsewhere for *cause*.

```text
   ONE PROBLEM = MANY CORRELATED SYMPTOMS, ONE TIMELINE  (illustrative)

   time ─────────────────────────────────────────────►
   orders-db     █ slow queries start                    ◄── earliest symptom (likely origin)
   pricing-svc       ░ response time climbs
   checkout-svc          ░ errors climb
   user impact               ▲ ALERT fires, page sent     ◄── most visible, latest, NOT the cause
```

*What just happened:* Four red signals, but read left-to-right they're one cascade with a clear *order*:
`orders-db` degraded first, and the user-facing alert - the thing that actually paged you - came *last*. The
Problem card bundles all four so you triage one incident, and the timeline hints that the earliest symptom is
the place to look. (Order and timing illustrative.)

## 2. From alert to proposed root cause - and why you still verify

**What it actually is.** The proposed **root cause** is Dynatrace's inference about which entity and which
change started the cascade - derived from the dependency graph (what could affect what) and the timeline (what
degraded first). It's typically your single best starting lead.

**Why you don't trust it blindly.** It's an inference from *correlation plus topology*, and that has plain
failure modes:

- **Two things break at once.** If a deploy and an unrelated cloud-network blip happen in the same minute, the
  engine may fold them into one Problem and pick the wrong one as cause.
- **The real cause is uninstrumented.** If the true origin is a tier Dynatrace can't see (Phase 1), it can only
  blame the nearest thing it *can* see - the innocent neighbor of the real culprit.
- **Correlation isn't causation.** Two services that always move together can have the engine point at the more
  visible one.

**The calm move - confirm before you act.** Don't restart, roll back, or page a team on the label alone. Open
the Problem's evidence and check three things:

1. **Timeline order** - did the named cause really degrade *first*? (Phase 1's "earliest symptom" instinct.)
2. **A representative trace** - does an actual failed/slow request (Phase 2) pass *through* the named cause and
   spend its time or throw its error *there*?
3. **A correlated change** - was there a deploy, config change, or traffic spike on that entity at that minute?

If all three line up, you've upgraded a *proposal* into a *confirmed* cause and you can act with confidence. If
they don't, trust the trace and the timeline over the label, and re-walk from the impact down.

🪖 **War story - the day the label lied.** A team got a Problem blaming a payments service and spent twenty
minutes poking at it. The trace told a different story: every failed request died at a *cache* node the
analysis had folded in as a mere "affected entity." The cache had run out of connections; payments was just the
loudest victim. The lesson wasn't "the tool is wrong" - it was "the proposed cause is lead #1, and the trace is
the judge." (Details generalized.)

## 3. From the cause entity to the code-level *why*

**What it actually is.** Even a *correct* root-cause entity usually tells you *where*, not *why*. "Root cause:
`orders-db`" or "Root cause: `payments-svc`" names the tier - it doesn't tell you it was a null dereference, a
connection-pool exhaustion, or a bad query. For that, you drop from the topology down into the actual evidence:
the failing trace and the logs/exception attached to the offending span.

**What it does in real life.** Open a representative failed request on the named entity (Phase 2's trace view),
find the **origin span**, and read the exception it carries. That's where the abstract "this service is the
cause" becomes a concrete stack trace you can act on.

```console
Problem: Failure rate increase on payments-svc
  Root cause (proposed): payments-svc
  → open a failed trace → origin span: payments-svc · charge()
    Exception: NullPointerException
      at PaymentProcessor.applyDiscount(PaymentProcessor.java:88)
      at PaymentProcessor.charge(PaymentProcessor.java:51)
```

*What just happened:* The Problem named the *tier* (`payments-svc`). The trace named the *request*. The origin
span named the *line of code* - a null dereference in `applyDiscount`. Now you have something a human can fix,
not just a colored box. Reading that stack trace - top frame vs. the line that's actually yours, "caused by"
chains, and how to find the first frame you control - is its own skill, walked through in
[How to Read a Stack Trace](/guides/reading-a-stack-trace).

**Why this saves you later.** The full chain is *alert → Problem (scope) → proposed cause (lead) →
confirming trace (judge) → origin span (the code).* Each step narrows from "something's wrong" to "this exact
line." When you can walk it, an incident stops being a panic and becomes a short, repeatable descent from
symptom to cause.

## Recap

1. **A Problem groups many correlated symptoms into one incident** using the dependency graph plus the
   timeline - so you triage one story, not five pages.
2. **Affected entities are impact (the blast radius), not cause** - the most visible victim is usually the
   furthest thing from the culprit.
3. **The proposed root cause is your #1 lead, not a verdict** - confirm it with timeline order, a real trace,
   and a correlated change before you act.
4. **The cause *entity* is "where," not "why"** - drop into the origin span's exception, then read it with
   [How to Read a Stack Trace](/guides/reading-a-stack-trace).

That's the whole tool. The thing to keep, across all three phases: **Dynatrace is excellent at surfacing
*where* - the slow tier, the failing hop, the correlated incident. You still bring the *why* - the trace you
confirm, the timeline you check, the line of code you read.** The x-ray shows the break; the doctor still
reads the film.

---

[← Phase 2: Reading a Service Flow & a Trace](02-reading-a-service-flow-and-a-trace.md) · [Guide overview](_guide.md)
