---
title: "The switch in your code"
guide: feature-flags-and-rollbacks
phase: 1
summary: "Ship code dark, flip it on for a few users, and turn it off instantly when it breaks: feature flags decouple deploy from release."
tags: [feature-flags, rollbacks, deployment, release, devops, trunk-based-development]
difficulty: intermediate
synonyms: [feature flags, feature toggles, kill switch, gradual rollout, canary release, instant rollback, decouple deploy from release, dark launch]
updated: 2026-06-30
---

# The switch in your code

Picture the worst version of a release. You merge a feature, the pipeline turns green, the new code goes live, and within minutes something is on fire for real users. Your only move is to rebuild the previous version and push it through the whole pipeline again while the clock runs. That panic isn't bad luck. It's the consequence of one quiet assumption baked into how most teams work: that putting code on the server and turning a feature on for users are the same event.

They don't have to be. Pulling them apart is the entire idea behind feature flags.

## Deploy and release are two different verbs

It's worth slowing down on these two words, because the whole guide hinges on the difference.

- **Deploy** means the new code is running on your servers. The binary is there. The functions exist in memory. It's *present*.
- **Release** means users can actually experience the feature. It's *active*.

Most teams treat these as one moment because, by default, they are. You merge code that adds a checkout button, you deploy, and the button is right there for everyone the instant the deploy finishes. Deploy *is* release. That coupling is exactly what turns a small bug into a five-alarm incident - the only way to un-release is to un-deploy.

A feature flag breaks the weld. It's a runtime switch wrapped around the new behavior, so you can deploy the code in the "off" position and decide *separately*, later, whether and when to flip it on.

> The one-line version: **deploy is a thing you do to servers; release is a thing you do to users.** Flags let you do them at different times.

## What a flag actually is

Strip away the marketing and a feature flag is humble: a named boolean your code checks before doing the new thing.

```js
// The new checkout flow is deployed, but gated behind a flag.
if (flags.isEnabled("new-checkout-flow")) {
  renderNewCheckout();   // the new code path
} else {
  renderOldCheckout();   // the old, known-good path
}
```

*What just happened:* both code paths are deployed and sitting on the server right now. Which one a user sees is decided at runtime by `isEnabled`, not at deploy time. Flip the flag's value somewhere else and behavior changes with no new deploy.

That's the mechanical heart of it. The new code shipped, but it's *dark* - present and inert. The old path is still doing its job. Nobody noticed the deploy because, as far as users are concerned, nothing released.

The value behind `isEnabled` doesn't live in the code. It lives somewhere you can change at runtime: a config file the app re-reads, a row in a database, an environment variable, or a hosted flag service. The key property is that changing it does **not** require a rebuild or a redeploy. That's the difference between a feature flag and an `if (false)` you have to edit and ship.

## Why this changes everything

Once deploy and release are separate, a pile of previously-scary things get calm.

- **The dreaded bug becomes a switch, not a rebuild.** Feature breaks in production? Flip the flag off. Users are back on the old path in seconds. No pipeline, no rollback build, no waiting. (Phase 2 calls this a kill switch.)
- **You can release to *some* people.** On for your own account first. Then 1% of users. Then 10%. Watch the dashboards between each step. (Phase 2: gradual rollout.)
- **Unfinished code can live on the main branch safely.** A half-built feature behind an off flag deploys with everything else and hurts nobody, because no one can reach it. That's what makes trunk-based development practical instead of terrifying.

```text
WITHOUT FLAGS:   merge → deploy → live for everyone   (one irreversible step)
WITH FLAGS:      merge → deploy (dark) → flip on for 1% → 10% → 100%
                                          ↑ any step reversible instantly
```

*What just happened:* the bottom row turned a single all-or-nothing leap into a series of small, reversible steps. Every arrow after "deploy" is a flag flip you can undo, not a release you have to chase down.

> Worth saying plainly: a flag is risk control, not a feature. Users never see it. Its only job is to give *you* a dial where there used to be a cliff.

## For builders

If your team runs CI/CD, flags are the missing safety layer on top of it. A green pipeline tells you the code *builds and tests pass* - it says nothing about whether the feature behaves under real traffic. (For how that pipeline works, see [/guides/what-cicd-does](/guides/what-cicd-does).) Flags let your pipeline deploy aggressively and often, while the release decision stays a small, human, reversible flip made *after* the code is safely in production. Fast deploys plus slow, controlled releases is the combination you're after.

```quiz
[
  {
    "q": "What is the core distinction a feature flag exploits?",
    "choices": [
      "The difference between writing code and reviewing it",
      "The difference between deploying code to servers and releasing a feature to users",
      "The difference between unit tests and integration tests",
      "The difference between staging and production environments"
    ],
    "answer": 1,
    "explain": "Deploy means the code is present on servers; release means users can experience it. Flags let those two happen at different times."
  },
  {
    "q": "Where does the value behind a feature flag need to live?",
    "choices": [
      "Hardcoded in the source, like if (false)",
      "Somewhere you can change at runtime without a rebuild or redeploy",
      "Only inside compiled binaries",
      "In the git commit message"
    ],
    "answer": 1,
    "explain": "If changing the flag required editing code and shipping, it would be no better than an if (false). The whole point is runtime control."
  },
  {
    "q": "What does it mean for code to be deployed 'dark'?",
    "choices": [
      "The code is on the server but gated off, so it runs nowhere users can reach",
      "The code is encrypted on disk",
      "The code is deployed only at night",
      "The code is deleted after deploy"
    ],
    "answer": 0,
    "explain": "Dark code is present and inert - deployed but switched off, hurting no one until you flip the flag."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Living with flags →](02-rollouts-and-kill-switches.md)
