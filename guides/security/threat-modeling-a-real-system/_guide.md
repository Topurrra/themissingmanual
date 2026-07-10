---
title: "Threat Modeling a Real System"
guide: "threat-modeling-a-real-system"
phase: 0
summary: "How to systematically find the security gaps in a whole system - not one vulnerability at a time, but by drawing the data flows, marking trust boundaries, and working through STRIDE against a real example: a file-sharing app with uploads, accounts, and payments."
tags: [security, threat-modeling, stride, appsec, system-design, risk-assessment]
category: security
order: 12
difficulty: advanced
synonyms: ["what is threat modeling", "how to threat model an application", "stride threat modeling explained", "data flow diagram security", "how to find security vulnerabilities in system design", "trust boundaries explained"]
updated: 2026-07-11
---

# Threat Modeling a Real System

You know what SQL injection is. You know the difference between authentication and authorization. You've read the OWASP Top 10 enough times to recite it. And none of that tells you where to actually look on the system sitting in front of you.

That's the gap threat modeling fills. It's not a new vulnerability to learn - it's a method for pointing everything you already know about individual attacks at your own architecture, systematically, before an attacker does. Instead of asking "is this endpoint vulnerable to XSS," you ask "where does untrusted data enter this system, and what happens to it at every step from there."

This guide uses one running example throughout: a small file-sharing service. Users sign up, upload files, share links, and pay for a premium tier through a third-party processor. Simple enough to hold in your head, real enough that every finding maps to something you've built before.

## How to read this

- **Need the method fast?** Phase 1 is the diagram and trust boundaries, Phase 2 is STRIDE applied to them - read both and you can run this on your own system today.
- **Want the full arc?** Read in order. Phase 3 closes the loop: what to do with a stack of findings so threat modeling produces fixes instead of a document nobody reads.

## The phases

1. **[Drawing the System](01-drawing-the-system.md)** - a data-flow diagram of the file-sharing app (users, web server, database, payment API, file storage) and marking the trust boundaries where control changes hands.
2. **[STRIDE, Applied](02-stride-applied.md)** - each STRIDE category walked through against the example app's actual boundaries: concrete findings, not definitions.
3. **[From Threats to Action](03-from-threats-to-action.md)** - prioritizing by likelihood times impact, turning findings into real fixes, and where threat modeling's job ends.

> This is the systems-thinking layer above specific vulnerabilities. For the vulnerabilities themselves, see [the OWASP Top 10](/guides/owasp-top-10), [authentication vs. authorization](/guides/auth-vs-authz), and [secrets management](/guides/secrets-management). For the broader "what does secure even mean" question, see [what security means](/guides/what-security-means).
