---
title: "From Threats to Action"
guide: "threat-modeling-a-real-system"
phase: 3
summary: "Prioritizing threat-model findings by real risk, turning them into concrete fixes, and being clear about what threat modeling doesn't replace."
tags: [security, threat-modeling, risk-assessment, prioritization, appsec]
difficulty: advanced
synonyms: ["how to prioritize security findings", "likelihood vs impact security", "threat modeling vs code review", "what threat modeling does not cover"]
updated: 2026-07-16
---

# From Threats to Action

Phase 2 produced roughly a dozen findings from one small app. A real system - more endpoints, more integrations, more years of accumulated code - produces dozens to hundreds. Treating every finding as equally urgent is how a threat model turns into a document nobody acts on. The output of threat modeling isn't the list; it's what you fix, in what order, and why.

## Likelihood times impact, not a flat list

For each finding, ask two questions separately: how likely is someone to attempt this, and how bad is it if they succeed? Skipping the first question is the most common mistake - it's easy to fixate on the scariest-sounding outcome and ignore how hard it is to reach.

Rating the file-sharing findings from Phase 2 this way:

| Finding | Likelihood | Impact | Priority |
|---|---|---|---|
| Sequential/guessable share-link tokens | High - no skill required, just enumeration | High - direct access to other users' files | Fix now |
| Unsigned/unverified payment webhook | Medium - requires finding the URL, but public webhook paths are guessable | High - free upgrades, possible role elevation | Fix now |
| No upload size/quota limit | High - any logged-in user can trigger it | Medium - service degradation, cost, not data loss | Fix soon |
| Client-supplied `uploaded_by` field | Low - narrow UI-spoofing impact, not account takeover | Low-Medium - confusing, not damaging | Backlog |
| 404-vs-403 timing/status leak on expired links | Low - needs targeted enumeration | Low - confirms a guess, doesn't grant access | Backlog |

The sequential token and the unverified webhook both land in "fix now" - not because they sound the most technical, but because both are cheap for an attacker to attempt and both hand over something valuable. The `uploaded_by` spoofing finding is real and worth a ticket, but putting it ahead of the webhook issue because it was "creepier" to write up would be optimizing for narrative instead of risk.

This is also where you decide what's not worth fixing at all. A finding with low likelihood and low impact - say, a theoretical timing difference in a rarely-used endpoint - can sit in a backlog indefinitely without that being negligence. Threat modeling that produces an unprioritized wall of findings is often worse than not doing it, because it buries the two things that matter under twenty things that don't.

## Turning a finding into a fix

A threat-model finding names a gap; it doesn't specify the fix, and that's a feature - the fix usually already exists as a known pattern.

- **Sequential share-link tokens** → generate tokens as long, random, unguessable strings (a UUIDv4 or a securely-random 128-bit value, not an auto-incrementing ID). This is a straight application of the access-control thinking in [authentication vs. authorization](/guides/auth-vs-authz): a share link is a bearer credential, and it needs the same unguessability you'd demand of a session token.
- **Unverified payment webhook** → verify the payment provider's signature on every webhook request before trusting the payload, and reject anything that doesn't match. This maps directly onto the broken-access-control and injection-adjacent thinking in [the OWASP Top 10](/guides/owasp-top-10) - an unverified webhook is an unauthenticated input being treated as a trusted command.
- **No upload quota** → enforce size and rate limits server-side, tied to the account, not just the request. Straightforward capacity control, not a novel defense.
- **Client-supplied identity field** → derive `uploaded_by` from the authenticated session server-side, never from form data. Never trust a client to tell you who it is when you already know.

Each fix is small. What made them findable wasn't cleverness at the fix stage - it was systematically asking the STRIDE questions at every boundary in Phase 2, instead of relying on a scan or a hunch to happen to point at the same spot.

## What threat modeling doesn't do

Threat modeling finds *design-level* gaps: missing checks, wrong trust assumptions, boundaries nobody drew before. It does not verify that the code implementing the fix is correct. You can threat-model perfectly, decide "verify the webhook signature," and still ship a broken implementation - comparing signatures with `==` instead of a constant-time comparison, or checking the signature but not the payload it was computed over. That bug is invisible to a threat model and exactly what code review and testing exist to catch.

The reverse gap matters too: code review reads the code you wrote and rarely questions why a component exists at all or whether a boundary was drawn correctly, since by the time there's a diff to review, the architecture is already a given. A threat model happens earlier and asks a different question - not "is this code correct" but "is this design missing a check somewhere." Run both. Neither substitutes for the other, or for testing the running system.

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

## Your turn: ship day, twelve findings, one ranked table

Reading Phase 2's findings is the easy part. Deciding what actually gets fixed before the deploy is the job -
and every hour you spend on one fix is an hour you don't have for anything else on the list. There's no single
right answer below and nothing is scored right or wrong, but the clock is real. Ship with your top risks
closed, then read the debrief.

```scenario
{
  "title": "Ship day: twelve findings, one ranked table",
  "brief": "Phase 2 left you with twelve STRIDE findings on the file-sharing app, already ranked by likelihood and impact. The release ships today. Every hour you spend on one fix is an hour you don't have for the deploy, for testing, or for anything else on the list.",
  "prompt": "Which fixes do you commit to?",
  "clock": { "unit": "hr", "running": "before ship", "resolved": "shipped" },
  "resolvedHeading": "Shipped. Here's what went out the door.",
  "actions": [
    {
      "id": "fix-tokens",
      "label": "Rewrite share-link tokens as unguessable strings",
      "cost": 2,
      "reveals": "before: token = str(next_share_id)\nafter:  token = secrets.token_urlsafe(32)",
      "note": "Sequential tokens were the single highest combined risk on Phase 2's table: no skill required, direct access to someone else's files."
    },
    {
      "id": "fix-webhook",
      "label": "Verify the payment webhook signature",
      "cost": 2,
      "reveals": "before: def handle_webhook(payload):\n            process(payload)\nafter:  def handle_webhook(payload, signature):\n            verify_signature(payload, signature, WEBHOOK_SECRET)\n            process(payload)",
      "note": "This is the boundary that showed up in four different STRIDE categories in Phase 2. Verifying it closes the other 'fix now' item."
    },
    {
      "id": "fix-quota",
      "label": "Add a per-account upload size and rate limit",
      "cost": 2,
      "reveals": "before: no limit on the upload endpoint\nafter:  @rate_limit(max_bytes=500_000_000, per=\"account\", window=\"1d\")",
      "note": "Real, and rated 'fix soon' - high likelihood, but medium impact. It degrades service, it doesn't hand over anyone's files."
    },
    {
      "id": "fix-spoofing",
      "label": "Fix the uploaded_by field to derive identity from the session",
      "cost": 1,
      "reveals": "before: uploaded_by = form.get(\"uploaded_by\")\nafter:  uploaded_by = session.user.id",
      "note": "Rated 'backlog' on Phase 2's table - low likelihood, low-to-medium impact. Worth a ticket. Not worth your ship-day hours."
    },
    {
      "id": "audit-elevation",
      "label": "Trace every code path that can grant premium or admin access",
      "cost": 4,
      "reveals": "$ grep -rn 'user.plan ==' app/\napp/storage.py:44:      if user.plan == \"premium\":\napp/bulk_import.py:118: if user.plan == \"premium\":   # added last quarter, no test coverage\napp/admin_tools.py:9:    # TODO: this endpoint predates the plan check entirely",
      "note": "Genuinely useful, and it turns up more than Phase 2 found. It also doesn't close a single 'fix now' item, and it's the most expensive thing on this list."
    },
    {
      "id": "write-priority-doc",
      "label": "Write a document ranking all twelve findings by risk",
      "cost": 1,
      "reveals": "THREAT-MODEL-PRIORITY.md (draft)\n| Finding | Likelihood | Impact | Priority |\n|---|---|---|---|\n| Sequential tokens | High | High | Fix now |\n| Unverified webhook | Medium | High | Fix now |\n| ... | | | (same ranking as Phase 2's table) |",
      "note": "The ranking you'd be writing already exists - it's Phase 2's own table. This produces a document, not a fix."
    },
    {
      "id": "ship",
      "label": "Ship the release with whatever's fixed",
      "cost": 0,
      "resolves": true,
      "reveals": "$ git push origin release/2026-07-17\n$ ./deploy.sh\ndeploy: release/2026-07-17 -> production ... done",
      "note": "Whatever you closed is closed. Whatever's still open ships with you."
    }
  ],
  "debrief": {
    "ideal": 4,
    "text": "The output of a threat model isn't the list, it's what you fix. The two moves worth your hours were already sitting in the 'fix now' row of Phase 2's table: the sequential tokens and the unverified webhook, both cheap for an attacker to try and both worth real money or real data. The uploaded_by field is a genuine finding too, but reaching for it first because it felt creepier to write up is optimizing for narrative instead of risk - exactly the trap Phase 3 names. Ship with the top two closed; the rest sits in the backlog on purpose, not from neglect.",
    "notes": [
      { "when": "if-taken", "action": "audit-elevation", "text": "The audit was real work and it found real paths. It also spent four of your hours finding more problems instead of fixing the two you already knew were fix-now." },
      { "when": "if-taken", "action": "fix-spoofing", "text": "Fixing uploaded_by wasn't wasted work, but Phase 2's own table rated it low-likelihood, low-impact. Shipping it ahead of the webhook signature check is choosing the finding that read worse over the one that costs the most." },
      { "when": "if-taken", "action": "write-priority-doc", "text": "Re-ranking the findings feels like progress. It fixes nothing - the ranking was the output of Phase 2 and Phase 3, not a new step you needed to take today." },
      { "when": "if-not-taken", "action": "fix-tokens", "text": "You shipped without touching the share-link tokens. They're sequential, guessable, and rated high-likelihood/high-impact for a reason: anyone who noticed could enumerate their way into someone else's files with no login at all." },
      { "when": "if-not-taken", "action": "fix-webhook", "text": "The webhook still trusts any request that hits the right URL. That's the boundary Phase 2 flagged in four separate STRIDE categories, and it shipped unverified." }
    ]
  }
}
```

---

[← Phase 2: STRIDE, Applied](02-stride-applied.md) · [Guide overview](_guide.md)
