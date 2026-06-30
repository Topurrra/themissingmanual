---
title: "The bill comes due"
guide: feature-flags-and-rollbacks
phase: 3
summary: "Ship code dark, flip it on for a few users, and turn it off instantly when it breaks: feature flags decouple deploy from release."
tags: [feature-flags, rollbacks, deployment, release, devops, trunk-based-development]
difficulty: intermediate
synonyms: [feature flags, feature toggles, kill switch, gradual rollout, canary release, instant rollback, decouple deploy from release, dark launch]
updated: 2026-06-30
---

# The bill comes due

Flags feel like free safety. They aren't. Every one you add is a fork in the road that lives in your code, and forks that nobody removes pile up into a quiet, compounding mess. This phase is the honest part: what flags cost, why old ones are dangerous, how to keep them from rotting your codebase, and the one decision you'll face in every incident — roll back or roll forward.

## Flag debt: the switches nobody turned off

A flag you added for a rollout three months ago is fully released — everyone's on the new path. But the `if (flags.isEnabled(...))` is still in the code, and so is the old `else` branch underneath it. That dead fork is *flag debt*: a switch that's done its job but never got removed.

```js
// Shipped 4 months ago. Flag is at 100% and will never be turned off.
if (flags.isEnabled("new-checkout-flow")) {
  renderNewCheckout();
} else {
  renderOldCheckout();   // dead code — but is it? nobody's sure anymore
}
```

*What just happened:* the `else` is unreachable in practice, but no one's certain enough to delete it, so it lingers. Multiply that by every rollout your team has ever done and the codebase fills with forks that obscure what the code actually does. Worse, an old forgotten flag is a live hazard — flip the wrong stale toggle and you've just re-enabled code that hasn't run in months and was never maintained.

## Combinatorial testing: flags multiply states

Here's the cost that scales worst. Each independent flag doubles the number of states your system can be in. Two flags is four combinations. Ten flags is over a thousand. You cannot test them all.

```text
1 flag   →  2 states     (on, off)
2 flags  →  4 states
3 flags  →  8 states
10 flags →  1024 states   ← you are not testing all of these
```

*What just happened:* the state space grows as 2 to the power of the flag count. In reality most flags aren't truly independent, so it's not quite that bad — but the direction is unforgiving. A combination you never tested *will* eventually occur in production, because some user's account hits exactly that mix of toggles. Fewer live flags is fewer untested combinations.

> The lesson isn't "avoid flags." It's that **every live flag is permanent inventory you have to carry.** The carrying cost is real, so the inventory must be actively managed down.

## Give every flag an expiry

The fix is a discipline, not a tool: a flag is born with a death date. The moment you add one, you decide when it dies.

- **Release flags** (gradual rollouts) are temporary by design. Once at 100% and stable, the flag *and the old branch* get deleted. That's the cleanup task, not an optional nicety.
- **Kill switches** for risky dependencies may be long-lived on purpose — but they're a deliberate, documented exception, not the default.
- Track expiry dates somewhere visible. Some teams make a stale flag fail the build; others run a recurring review. The mechanism matters less than the rule: **no flag lives forever by accident.**

```text
GOOD:  add flag → roll out → 100% stable → DELETE flag + old branch  (debt: 0)
BAD:   add flag → roll out → 100% → move on → ...repeat 40 times      (debt: 40 forks)
```

*What just happened:* the top row treats removal as part of the feature's lifecycle, so debt stays near zero. The bottom row treats the flag as done at 100%, and the forks accumulate until the codebase is a minefield of stale toggles.

## Rollback versus roll-forward

When something breaks in production, you face one fork in the road, and a flag changes which one is even available.

**Rollback** means going back to a known-good state. With a flag, this is the kill switch — flip it off, you're instantly back on the old path. Fast, low-risk, reversible. It's almost always the right *first* move in an incident: stop the bleeding now, diagnose later.

**Roll-forward** means fixing the problem with a *new* deploy that goes forward, not back. You'd choose it when there's nothing safe to roll back *to* — for example, a database migration already changed the data shape, so the old code can no longer run correctly. You can't un-migrate cleanly, so the only way out is through: ship a fix.

```text
Bug in production?
  ├─ Is there a safe state to return to?
  │     YES → ROLL BACK  (flip the kill switch — fast, reversible)
  │     NO  → ROLL FORWARD (ship a fix — the only path when going back is unsafe)
```

*What just happened:* the deciding question isn't "which is better" — it's "is going back actually safe?" Flags make rollback cheap and instant *when it's available*, which is exactly why you wrap risky changes in them. But a flag can't undo a data migration, so some incidents force you forward no matter how good your toggles are.

> Decide the rollback plan *before* you ship, not during the incident. "If this breaks, do we flip a flag or do we ship a fix?" is a five-minute conversation calm, and an agonizing one at 3am.

## For builders

The mature version of all this is a habit, not a platform. When you add a flag, write down three things: who it's for, when it dies, and how you'd back out the change it gates. Flags are part of your release machinery, so treat them with the same care as the rest of your pipeline — see [/guides/build-and-release-basics](/guides/build-and-release-basics) for where they sit in the broader release flow. The teams that get burned aren't the ones using flags; they're the ones who added forty and removed zero.

```quiz
[
  {
    "q": "What is 'flag debt'?",
    "choices": [
      "The licensing cost of a hosted flag service",
      "Flags that have done their job but were never removed, leaving dead forks in the code",
      "The latency added by checking a flag",
      "Flags that are turned on for too many users"
    ],
    "answer": 1,
    "explain": "A released flag whose if/else lingers in the code is debt — dead, confusing, and a live hazard if someone flips the stale toggle."
  },
  {
    "q": "Why does the number of live flags create a testing problem?",
    "choices": [
      "Each flag requires its own separate server",
      "Each independent flag roughly doubles the number of system states, and you can't test them all",
      "Flags slow down the test suite linearly",
      "Tests cannot read flag values at all"
    ],
    "answer": 1,
    "explain": "State space grows roughly as 2^(flag count). Untested combinations will eventually occur in production, so fewer live flags is safer."
  },
  {
    "q": "When would you choose roll-forward instead of rolling back?",
    "choices": [
      "Whenever a flag exists for the feature",
      "When rolling forward is always faster than a flag flip",
      "When there's no safe state to return to — e.g. a migration already changed the data shape",
      "Roll-forward should never be used in production"
    ],
    "answer": 2,
    "explain": "Rollback needs a safe state to return to. If a migration changed data so the old code can't run, going back is unsafe and you must ship a fix forward."
  }
]
```

[← Phase 2](02-rollouts-and-kill-switches.md) | [Overview](_guide.md)
