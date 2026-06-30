---
title: "Jenkins, From Zero"
guide: jenkins-from-zero
phase: 0
summary: "The CI server that still runs much of enterprise: the Jenkinsfile pipeline-as-code, stages and steps, agents, and the plugin ecosystem for better and worse."
tags: [jenkins, ci, cd, pipeline, jenkinsfile, automation, devops]
category: tooling
group: "CI/CD"
order: 18
difficulty: intermediate
synonyms: ["jenkins tutorial", "jenkinsfile", "declarative pipeline", "jenkins pipeline", "jenkins stages steps", "jenkins agent", "jenkins plugins", "jenkins credentials", "ci server jenkins"]
updated: 2026-06-30
---

# Jenkins, From Zero

You have probably inherited a Jenkins server. Nobody chooses Jenkins fresh anymore, but somebody before you did, and now a wall of blue and red orbs decides whether your code ships. The XML config is a mystery, the plugins are a graveyard, and the one person who understood it left. This guide hands you the mental model so the box stops being a black box.

## How to read this

Read the phases in order. Phase 1 is the model: what Jenkins actually is, why it exists, and the controller/agent shape that explains everything else. Phase 2 is the Jenkinsfile you will read and write every day. Phase 3 is the production reality: plugins, credentials, and the reasons teams both depend on it and curse it. Each phase has runnable-looking examples and a short quiz to check yourself.

## The phases

1. [The mental model: what Jenkins is and why it won't die](01-the-mental-model.md)
2. [The Jenkinsfile: pipeline, agent, stages, steps](02-the-jenkinsfile.md)
3. [Production reality: plugins, credentials, and the tradeoffs](03-production-reality.md)

[Phase 1: The mental model: what Jenkins is and why it won't die](01-the-mental-model.md) →
