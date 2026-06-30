---
title: "Supply-Chain Security"
guide: supply-chain-security
phase: 0
summary: "Your dependencies are your attack surface: the npm install that owned you, lockfiles, typosquatting, and how to trust code you did not write."
tags: [security, supply-chain, dependencies, npm, sbom, ci]
category: security
order: 9
difficulty: intermediate
synonyms: [supply chain attack, npm install hacked, malicious package, typosquatting, dependency confusion, sbom, lockfile security, software supply chain]
updated: 2026-06-30
---

# Supply-Chain Security

Open your `node_modules` folder and count the directories. A thousand? Five thousand? You wrote almost none of it, you read approximately none of it, and every line of it runs with the same privileges as your own code. That is the uncomfortable truth this guide makes peace with: most of your application is code from strangers, and an attacker who can change that code does not need to break into your server at all. They get in through your `install` step, on your own machine, with your blessing.

The relief is that this is a solvable problem. You cannot read five thousand packages, but you can pin what you depend on, see what changed, scan for known holes, and shrink the blast radius when something does go wrong. None of it is exotic.

## How to read this

Read the phases in order. Phase 1 rewires how you picture your project so the threat becomes obvious instead of invisible. Phase 2 is the everyday defense you turn on this week. Phase 3 is the bad day, real incidents and what would have stopped them. Skim the code blocks, but read the *What just happened:* line after each one, that is where the point lands.

## The phases

1. [Your code is mostly other people's code](01-the-real-attack-surface.md) — the mental model: why dependencies are an attack surface and who is trying to abuse it.
2. [Pinning, scanning, and seeing what you ship](02-everyday-defenses.md) — lockfiles, vulnerability scans, install scripts, and the SBOM.
3. [The terrible day, and what stops it](03-when-it-breaks.md) — real incidents, least-privilege CI, and a survivable response.

[Phase 1: Your code is mostly other people's code](01-the-real-attack-surface.md) →
