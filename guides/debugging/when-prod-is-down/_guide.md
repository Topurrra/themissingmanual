---
title: "When Prod Is Down: Staying Calm"
guide: "when-prod-is-down"
phase: 0
summary: "How to handle a production outage without panicking: assess the blast radius, stop the bleeding before you diagnose, run the incident with clear comms, and turn the wreckage into a blameless postmortem that prevents the next one."
tags: [incident-response, on-call, outage, sre, postmortem, reliability]
category: debugging
difficulty: advanced
order: 7
synonyms: ["prod is down what do i do", "production outage response", "how to handle an incident", "incident response for developers", "site is down panic", "stop the bleeding outage", "blameless postmortem", "on call playbook"]
updated: 2026-06-19
---

# When Prod Is Down: Staying Calm

The alert fires. The dashboard goes red. Someone types "is anyone else seeing this?" in the channel and
your stomach drops through the floor. Maybe you shipped the last deploy. Maybe you have no idea what
happened. Either way, your hands are a little cold and your brain wants to either freeze or start frantically
typing commands - and both of those instincts will make it worse.

Here's the thing nobody tells you: handling an outage well is not about being a genius who instantly knows
the fix. It's a *procedure*. Calm under fire isn't a personality trait - it's a checklist you follow when
your judgment is compromised by adrenaline. This guide gives you that procedure: what to do in the first
five minutes, how to stop the damage before you understand it, how to run the response without chaos, and
how to make sure the outage buys you something instead of just costing you a night.

You don't need to be the most senior person in the room to use this. You need to be the calmest, and calm is
learnable.

## How to read this

- **In a panic right now?** Go straight to [Phase 1: The First Five Minutes](01-the-first-five-minutes.md)
  and use the **PROD-DOWN CHECKLIST** at the very top. Do those things in order. Read the explanations
  later, when it's over.
- **Want it to finally make sense?** Read in order. Each phase builds the mindset that makes the next one
  feel obvious - first how to stabilize, then how to coordinate, then how to learn.

## The phases

1. **[The First Five Minutes](01-the-first-five-minutes.md)** - don't panic, don't start randomly changing
   things. Assess the blast radius (who and what is affected, how bad), then *stop the bleeding* before you
   diagnose. The whole mindset: restore service first, understand later.
2. **[Triage & Mitigate](02-triage-and-mitigate.md)** - the fastest paths back to green: roll back the last
   deploy, flip the feature flag off, scale up, fail over. Plus how to actually *run* an incident - one
   coordinator, a clear channel, a timeline written as you go - and why the silent hero is the most
   dangerous person on the call.
3. **[After: the Blameless Postmortem](03-after-the-blameless-postmortem.md)** - once it's over: build the
   timeline, separate root cause from contributing factors, and protect the *blameless* rule that keeps
   people honest. Then turn the incident into prevention. Every outage is tuition; make it buy something.

> Deep dives into specific tooling - distributed tracing, chaos engineering, SLO/error-budget math, on-call
> rotation design - are deliberately left to follow-up guides. This one is about the human procedure that
> works no matter what your stack is.
