---
title: "Feature Flags and Rollbacks"
guide: feature-flags-and-rollbacks
phase: 0
summary: "Ship code dark, flip it on for a few users, and turn it off instantly when it breaks: feature flags decouple deploy from release."
tags: [feature-flags, rollbacks, deployment, release, devops, trunk-based-development]
category: devops
order: 9
difficulty: intermediate
synonyms: [feature flags, feature toggles, kill switch, gradual rollout, canary release, instant rollback, decouple deploy from release, dark launch]
updated: 2026-06-30
---

# Feature Flags and Rollbacks

You merged the feature. It deployed clean. And then the support tickets start, and your only lever is a frantic redeploy of last week's build while real users hit the broken thing. That whole panic exists because deploying your code and releasing your feature got welded into one irreversible act. This guide pries them apart. You'll learn to ship code that's switched off, turn it on for a handful of people, watch, and kill it in seconds when something's wrong - no rebuild, no scramble.

## How to read this

Read the three phases in order; each one builds the mental model the next assumes. Phase 1 reshapes how you think about "released." Phase 2 is the day-to-day mechanics. Phase 3 is the part nobody warns you about: the cost of flags and how to keep them from rotting your codebase. If you only have five minutes, read Phase 1 - the mental model is the whole game.

## The phases

1. [The switch in your code](01-deploy-is-not-release.md) - why deploy and release are two different things, and what a flag actually is.
2. [Living with flags](02-rollouts-and-kill-switches.md) - gradual rollouts, kill switches, A/B tests, and trunk-based development.
3. [The bill comes due](03-flag-debt-and-rollback.md) - flag debt, combinatorial testing, expiry, and rollback versus roll-forward.

[Phase 1: The switch in your code](01-deploy-is-not-release.md) →
