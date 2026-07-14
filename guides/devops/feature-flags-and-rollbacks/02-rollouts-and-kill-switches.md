---
title: "Living with flags"
guide: feature-flags-and-rollbacks
phase: 2
summary: "Ship code dark, flip it on for a few users, and turn it off instantly when it breaks: feature flags decouple deploy from release."
tags: [feature-flags, rollbacks, deployment, release, devops, trunk-based-development]
difficulty: intermediate
synonyms: [feature flags, feature toggles, kill switch, gradual rollout, canary release, instant rollback, decouple deploy from release, dark launch]
updated: 2026-06-30
---

# Living with flags

You've got the mental model: code can be deployed and still dark. Now the practical question - what do you actually *do* with that switch? It turns out a single boolean, once you can target *who* sees it, covers four very different jobs that teams used to handle with four very different (and more painful) tools. Let's walk each one the way you'd hit them in a real week.

## The gradual rollout: don't release to everyone at once

You finished a feature. The tests pass. The instinct is to flip it on for all users and move on. Resist it. The flag lets you turn it on for a *slice* and grow the slice only if the dashboards stay calm.

A rollout is a sequence of flag states, not one flip:

```text
1. Enable for: my own account            → click around, sanity check
2. Enable for: internal team             → real humans, real data
3. Enable for: 1% of users               → watch error rate, latency, support
4. Enable for: 10%                        → still calm? keep going
5. Enable for: 100%                       → fully released
```

*What just happened:* you converted a binary launch into a dimmer switch. At each step the blast radius of a bug is capped - a problem at 1% touches 1% of users, and you caught it before it reached the other 99%. This is what people mean by a *canary release*: a small group goes first, like the canary in the mine.

The targeting logic usually lives in the flag service, but conceptually it's plain:

```js
function isEnabled(flagName, user) {
  const flag = lookupFlag(flagName);        // current config, fetched at runtime
  if (flag.allowList.includes(user.id)) return true;   // explicit early access
  return hashUserId(user.id) % 100 < flag.percentage;  // stable % bucketing
}
```

*What just happened:* hashing the user id and comparing against a percentage means the *same* user lands in the same bucket every call. That stability matters - without it, a user at 10% rollout would flicker between old and new on every page load, which feels broken even when nothing is wrong.

> Roll out by percentage of *users*, not percentage of *requests*. A single confused user seeing the new feature half the time is a worse experience than a clean 10% who consistently get it.

## The kill switch: the reason flags earn their keep

This is the payoff Phase 1 promised. The new feature is at 10%, the error rate spikes, and you don't reach for a rollback build. You flip one value.

```bash
# Feature is misbehaving in production. One command, no redeploy.
$ flagctl disable new-checkout-flow
✓ new-checkout-flow → OFF (propagating to all instances ~10s)
```

*What just happened:* every server re-reads the flag within seconds and routes all traffic back to the old, known-good path. No pipeline ran. No artifact was rebuilt. The mean-time-to-recovery dropped from "however long a deploy takes" to "however long a config propagation takes" - typically seconds.

A kill switch is most valuable around the things most likely to go wrong: a new third-party integration, an expensive query, a risky algorithm. Wrap those in a flag *specifically* so you have an off button, even if you never plan a gradual rollout. The flag exists to fail safely, not to release slowly.

## A/B tests: the flag as a measuring tool

The same targeting machinery answers a different question. Instead of "is this safe?" you ask "which version performs better?" Split users into groups, show each group a variant, and compare a metric.

```text
Group A (50%):  old button copy   → measured conversion: baseline
Group B (50%):  new button copy   → measured conversion: +4.1%
```

*What just happened:* the flag stopped being a pure on/off and became a *which-variant* selector. The mechanism is identical - stable per-user bucketing - but the goal shifted from risk control to learning. (One plain caveat: a real A/B test needs enough traffic and a proper significance check before you trust a difference. The flag delivers the split; it doesn't do the statistics for you.)

## Trunk-based development: flags as the unlock

Here's the workflow consequence that surprises people. When unfinished features can be deployed dark, long-lived feature branches stop being necessary. Everyone commits to the main branch ("trunk") in small pieces; half-built work hides behind an off flag and ships with every deploy, harming nobody because no one can reach it.

```text
Branch-heavy:  feature lives on a branch for 3 weeks → painful merge → big-bang release
Trunk-based:   small commits to main daily, feature behind an off flag → flip on when ready
```

*What just happened:* the bottom row eliminated the giant merge and the big-bang release. The work integrated continuously, in tiny increments, while staying invisible to users. The flag is what makes "merge unfinished code to main" sane instead of reckless.

## For builders

These four uses share one engine: a runtime-changeable value plus per-user targeting. You can start with the crudest possible version - a JSON file your app re-reads, or a single environment variable - and it'll genuinely work for a small team. Reach for a hosted flag service when you need per-user targeting, an audit trail of who flipped what, and instant propagation across many instances. Don't buy that complexity on day one; grow into it when a config file stops being enough.

```quiz
[
  {
    "q": "Why should percentage rollout bucket users with a stable hash rather than randomly per request?",
    "choices": [
      "Random is slower to compute",
      "So the same user consistently gets the same version instead of flickering between old and new",
      "Hashing encrypts the user id for privacy",
      "Random rollouts are not allowed by most flag services"
    ],
    "answer": 1,
    "explain": "Without stable bucketing a user at 10% would flip between old and new on every page load - that feels broken even when nothing is wrong."
  },
  {
    "q": "What is the main thing a kill switch reduces compared to a traditional rollback?",
    "choices": [
      "The number of tests you need to write",
      "The size of the codebase",
      "Mean-time-to-recovery - from 'a deploy length' down to a config propagation",
      "The cost of cloud hosting"
    ],
    "answer": 2,
    "explain": "A kill switch routes traffic back to the safe path via a config change in seconds, instead of waiting for a full rebuild-and-redeploy."
  },
  {
    "q": "How do feature flags make trunk-based development practical?",
    "choices": [
      "They prevent anyone from committing buggy code",
      "They let unfinished features deploy to main behind an off flag, invisible to users",
      "They automatically merge long-lived branches",
      "They remove the need for code review"
    ],
    "answer": 1,
    "explain": "Half-built work hides behind an off flag and ships with every deploy harming nobody, which removes the need for long-lived feature branches."
  }
]
```

[← Phase 1](01-deploy-is-not-release.md) | [Overview](_guide.md) | [Phase 3: The bill comes due →](03-flag-debt-and-rollback.md)
