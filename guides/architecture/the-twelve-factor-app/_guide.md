---
title: "The Twelve-Factor App"
guide: the-twelve-factor-app
phase: 0
summary: "The canonical checklist for an app that is actually shippable and scalable: config in the environment, stateless processes, logs as streams, and more."
tags: [architecture, twelve-factor, deployment, config, cloud-native, devops]
category: architecture
order: 7
difficulty: intermediate
synonyms: ["12 factor app", "twelve factor methodology", "12factor", "config in environment", "stateless processes", "cloud native checklist", "heroku twelve factor"]
updated: 2026-07-10
---

# The Twelve-Factor App

You shipped something that runs great on your laptop and falls over the moment it meets a second server, a real database, or a deploy at 5pm on a Friday: passwords live in the code, restarting loses data, "works on my machine" has become a personal insult. The Twelve-Factor App is the checklist that turns that fragile thing into something you can deploy, scale, and hand off without dread - and once you internalize it, most of "how do I make this production-ready" stops being a mystery.

## How to read this

This is a field guide, not a spec: each factor exists because of a specific terrible day it prevents, so we lead with the pain and then the rule. You don't have to adopt all twelve at once - read them as moves you reach for when the matching problem shows up. If you only remember three, remember config in the environment, stateless processes, and logs as streams - those three carry most of the weight.

## The phases

1. [One codebase, clean dependencies, config outside the code](01-codebase-deps-config.md) - the foundation that makes a deploy repeatable.
2. [Stateless processes, port binding, and scaling out](02-processes-and-scale.md) - how the running app behaves so you can run many copies.
3. [Dev-prod parity, logs as streams, and the operations factors](03-parity-logs-ops.md) - the factors that keep you sane once it's live.

[Phase 1: One codebase, clean dependencies, config outside the code](01-codebase-deps-config.md) →
