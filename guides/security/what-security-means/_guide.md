---
title: "What \"Security\" Even Means (Threat Modeling Basics)"
guide: "what-security-means"
phase: 0
summary: "Security is protecting confidentiality, integrity, and availability against people who want your system to break — and threat modeling is just four plain questions that turn that vague worry into a plan."
tags: [security, threat-modeling, cia-triad, defense-in-depth, beginner-friendly]
category: security
difficulty: beginner
synonyms: ["what is security", "what does security mean", "what is threat modeling", "how to think about security", "cia triad explained", "security for beginners", "least privilege explained", "defense in depth"]
order: 1
updated: 2026-06-19
---

# What "Security" Even Means (Threat Modeling Basics)

You've probably been told to "make it secure" without anyone explaining what that *means*. So security ends up feeling like a checklist someone else owns, or a wall of jargon — XSS, CSRF, OWASP — that you nod along to and hope nobody asks about. The unease underneath is real: you don't have a way to *think* about it, so you can't tell whether you've done enough.

This guide gives you that way to think. Not a list of attacks to memorize — a mental model you can reason from. By the end you'll be able to look at any system and ask the right questions: what am I protecting, who'd want to break it, how could they get in, and what do I do about it. That's the foundation. The specific holes (and how to close them) come in the guides this one points to.

## How to read this

- **Just need the framework?** Jump to [Phase 2: Threat Modeling, Lightly](02-threat-modeling-lightly.md) for the four questions you can run on any system today.
- **Want it to finally make sense?** Read in order — each phase builds the mental model the next one stands on.

## The phases

1. **[Think Like an Attacker](01-think-like-an-attacker.md)** — what "secure" actually protects (the CIA triad), and the one mindset shift the whole field rests on: from "does it work?" to "how could this be abused?"
2. **[Threat Modeling, Lightly](02-threat-modeling-lightly.md)** — four plain questions that turn vague worry into a plan, plus trust boundaries: where data crosses from a place you don't control into a place you do.
3. **[Defense in Depth & Least Privilege](03-defense-in-depth.md)** — why no single wall is enough, how to give every part the minimum power it needs, and how to assume a breach will happen and limit the damage when it does.

> This guide is the *map*. The specific vulnerabilities — injection, broken auth, the rest — live in [the OWASP Top 10](/guides/owasp-top-10), and the difference between "who are you" and "what are you allowed to do" lives in [auth vs. authz](/guides/auth-vs-authz). Read this first; those will make far more sense afterward.
