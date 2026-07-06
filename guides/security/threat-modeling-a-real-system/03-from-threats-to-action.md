---
title: "From Threats to Action"
guide: "threat-modeling-a-real-system"
phase: 3
summary: "Prioritizing threat-model findings by real risk, turning them into concrete fixes, and being honest about what threat modeling doesn't replace."
tags: [security, threat-modeling, risk-assessment, prioritization, appsec]
difficulty: advanced
synonyms: ["how to prioritize security findings", "likelihood vs impact security", "threat modeling vs code review", "what threat modeling does not cover"]
updated: 2026-07-06
---

# From Threats to Action

Phase 2 produced roughly a dozen findings from one small app. A real system - more endpoints, more integrations, more years of accumulated code - produces dozens to hundreds. Treating every finding as equally urgent is how a threat model turns into a document nobody acts on. The output of threat modeling isn't the list; it's what you fix, in what order, and why.

## Likelihood times impact, not a flat list

For each finding, ask two questions separately: how likely is someone to actually attempt this, and how bad is it if they succeed? Skipping the first question is the most common mistake - it's easy to fixate on the scariest-sounding outcome and ignore how hard it is to reach.

Rating the file-sharing findings from Phase 2 this way:

| Finding | Likelihood | Impact | Priority |
|---|---|---|---|
| Sequential/guessable share-link tokens | High - no skill required, just enumeration | High - direct access to other users' files | Fix now |
| Unsigned/unverified payment webhook | Medium - requires finding the URL, but public webhook paths are guessable | High - free upgrades, possible role elevation | Fix now |
| No upload size/quota limit | High - any logged-in user can trigger it | Medium - service degradation, cost, not data loss | Fix soon |
| Client-supplied `uploaded_by` field | Low - narrow UI-spoofing impact, not account takeover | Low-Medium - confusing, not damaging | Backlog |
| 404-vs-403 timing/status leak on expired links | Low - needs targeted enumeration | Low - confirms a guess, doesn't grant access | Backlog |

The sequential token and the unverified webhook both land in "fix now" - not because they sound the most technical, but because both are cheap for an attacker to attempt and both hand over something valuable. The `uploaded_by` spoofing finding is real and worth a ticket, but putting it ahead of the webhook issue because it was "creepier" to write up would be optimizing for narrative instead of risk.

This is also where you decide what's not worth fixing at all. A finding with low likelihood and low impact - say, a theoretical timing difference in a rarely-used endpoint - can sit in a backlog indefinitely without that being negligence. Threat modeling that produces an unprioritized wall of findings is often worse than not doing it, because it buries the two things that actually matter under twenty things that don't.

## Turning a finding into a fix

A threat-model finding names a gap; it doesn't specify the fix, and that's a feature - the fix usually already exists as a known pattern.

- **Sequential share-link tokens** → generate tokens as long, random, unguessable strings (a UUIDv4 or a securely-random 128-bit value, not an auto-incrementing ID). This is a straight application of the access-control thinking in [authentication vs. authorization](/guides/auth-vs-authz): a share link is a bearer credential, and it needs the same unguessability you'd demand of a session token.
- **Unverified payment webhook** → verify the payment provider's signature on every webhook request before trusting the payload, and reject anything that doesn't match. This maps directly onto the broken-access-control and injection-adjacent thinking in [the OWASP Top 10](/guides/owasp-top-10) - an unverified webhook is an unauthenticated input being treated as a trusted command.
- **No upload quota** → enforce size and rate limits server-side, tied to the account, not just the request. Straightforward capacity control, not a novel defense.
- **Client-supplied identity field** → derive `uploaded_by` from the authenticated session server-side, never from form data. Never trust a client to tell you who it is when you already know.

Each fix is small. What made them findable wasn't cleverness at the fix stage - it was systematically asking the STRIDE questions at every boundary in Phase 2, instead of relying on a scan or a hunch to happen to point at the same spot.

## What threat modeling doesn't do

Threat modeling finds *design-level* gaps: missing checks, wrong trust assumptions, boundaries nobody drew before. It does not verify that the code implementing the fix is correct. You can threat-model perfectly, decide "verify the webhook signature," and still ship a broken implementation - comparing signatures with `==` instead of a constant-time comparison, or checking the signature but not the payload it was computed over. That bug is invisible to a threat model and exactly what code review and testing exist to catch.

The reverse gap matters too: code review reads the code you wrote and rarely questions why a component exists at all or whether a boundary was drawn correctly in the first place, since by the time there's a diff to review, the architecture is already a given. A threat model happens earlier and asks a different question - not "is this code correct" but "is this design missing a check somewhere." Run both. Neither substitutes for the other, and neither substitutes for actually testing the running system.

Treat a threat model as a living document, not a one-time exercise. Re-run STRIDE against new boundaries whenever the diagram changes - a new integration, a new endpoint that crosses an existing boundary in a new way, a new "internal" service that turns out not to be as internal as assumed.

```quiz
[
  {
    "q": "Why rate findings on likelihood AND impact separately, instead of just impact?",
    "choices": ["Likelihood doesn't matter for security decisions", "A high-impact finding that's very hard to actually exploit may be lower priority than a medium-impact one that's trivial to trigger", "Impact is always higher priority regardless of likelihood"],
    "answer": 1,
    "explain": "Fixing purely by worst-case impact ignores how attackers actually spend effort - cheap-to-exploit, high-value findings deserve to jump the queue over rare, hard-to-reach ones."
  },
  {
    "q": "A threat model correctly flags 'verify the payment webhook signature' as a needed fix. The team implements it, but uses a non-constant-time string comparison that leaks timing information. Who should catch that?",
    "choices": ["The threat model should have caught it, since it found the webhook issue", "Code review and testing - implementation correctness is outside what a threat model checks", "No one; timing leaks in signature checks aren't a real risk"],
    "answer": 1,
    "explain": "Threat modeling operates at the design level - it says a check is missing, not whether a given implementation of that check is correct. That's code review's job."
  },
  {
    "q": "Why should a threat model be re-run rather than treated as done after the first pass?",
    "choices": ["Because STRIDE categories change over time", "Because new components and boundaries (integrations, endpoints, services) introduce risk the original diagram never covered", "Because compliance audits require a new document every quarter"],
    "answer": 1,
    "explain": "A threat model is only as complete as the diagram it's built on - once the architecture changes, the old diagram no longer reflects reality and needs revisiting."
  }
]
```

---

[← Phase 2: STRIDE, Applied](02-stride-applied.md) · [Guide overview](_guide.md)
