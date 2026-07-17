---
title: "When (and When Not) to Rewrite"
guide: "reading-legacy-code"
phase: 3
summary: "Why the urge to rewrite legacy code is usually wrong, how Chesterton's Fence keeps you from removing something load-bearing, and the rare cases a rewrite is the right call."
tags: [legacy-code, rewrite, chestertons-fence, refactoring, beginner-friendly]
difficulty: beginner
synonyms: ["should I rewrite legacy code", "chesterton's fence", "when to rewrite vs refactor", "why not to rewrite old code"]
updated: 2026-07-16
---

# When (and When Not) to Rewrite

Two weeks into reading someone else's tangled code, the thought arrives: "This would be so much cleaner if I just rewrote it." That thought is almost always premature, and it's worth knowing why before you act on it.

## Why "just rewrite it" is usually wrong

The rewrite urge shows up right when you're the least qualified to act on it - you've read enough code to see the mess, but not enough to see why the mess exists. That gap is exactly where rewrites fail.

Old code accumulates fixes for real problems: the tax-exclusion check from Phase 2, a race condition patched at 2am, a workaround for a payment provider's broken API. None of that shows up as a clean abstraction. It shows up as a pile of specific, ugly conditionals - and every one of them was somebody's Tuesday.

A rewrite throws all of that away and starts from what the system *looks like it should do*, not what it actually has to do. The bugs you'll reintroduce aren't new bugs. They're the same bugs the original code already fixed, now unfixed again, waiting to be rediscovered by whoever's on call next.

There's also a cost side that's routinely underestimated: a rewrite takes real calendar time in which the old system still needs to work, still needs bug fixes, and now has to be kept in sync with the parallel rewrite. Most rewrite projects don't fail because the new code is bad - they fail because the team runs out of patience or budget to finish the migration, and you end up maintaining both versions.

## Chesterton's Fence

The principle: if you find a fence in a field and don't know why it's there, don't remove it until you find out why it was put there. Maybe it's pointless. Maybe it's keeping a bull from wandering onto a road.

Applied to code: don't delete or rewrite a piece of logic just because you don't understand why it's there. "I don't understand this" and "this is unnecessary" are different claims, and legacy code habitually gets treated as if the first implies the second.

The fix is cheap: do the archaeology from Phase 2 first. Git blame it, read the commit, check for a linked ticket, ask around. Three outcomes:

1. **You find a real reason.** The fence stays. You now understand the system better than you did an hour ago.
2. **You find it was a reason that no longer applies** (a workaround for a payment provider bug fixed years ago). Now you can remove it - with confidence, and ideally with a test proving the old reason is gone.
3. **You find nothing - no commit message, no ticket, no one remembers.** Treat this as "reason unknown," not "no reason." Leave it, or change it cautiously with a safety-net test, rather than deleting outright.

Chesterton's Fence isn't "never change legacy code." It's "earn the right to change it by finding out why it's shaped this way first."

## When a rewrite really is the right call

Rewrites aren't always wrong. They're right when specific conditions hold, not when the code merely looks old:

- **The technology itself is the constraint**, not the logic built on it - a framework that's end-of-life and unpatched for known security vulnerabilities, a database that can't scale to your actual load no matter how it's tuned.
- **You've already done the archaeology and genuinely understand the business rules**, not just the code shape. A rewrite by someone who can list every edge case from memory is a different project than a rewrite by someone who's read the code for a week and is annoyed by it.
- **The system is small and well-bounded enough to rewrite in weeks, not quarters** - a single service, not "the whole platform." The smaller the blast radius, the smaller the risk if the rewrite misses an edge case.
- **You can run old and new side by side and compare outputs** before cutting over - shadow traffic, feature flags, a migration period where both systems run and disagree loudly if they don't match.

Under those conditions, a rewrite is a refactor with extra steps, not a leap of faith. Absent them, the incremental path from Phase 2 - trace, test, small safe change, repeat - gets you to the same clean end state without the all-or-nothing risk.

The clear-eyed default: assume the rewrite urge is sunk-cost thinking in disguise (the code is confusing, so surely starting over is less work) until you've proven otherwise with the checklist above. Most of the time, the fastest way out of confusing legacy code isn't replacing it - it's a series of small, tested changes that turn confusing code into code you understand, one Chesterton's Fence at a time.

```quiz
[
  {
    "q": "Why is the urge to rewrite legacy code often a bad instinct?",
    "choices": ["Rewrites are always slower than fixing bugs one at a time", "It usually happens right when you've seen enough mess to be annoyed but not enough history to know why the mess exists", "Product managers never approve rewrites"],
    "answer": 1,
    "explain": "The rewrite urge peaks at partial understanding - you can see the ugliness but haven't yet uncovered the real reasons behind it."
  },
  {
    "q": "What does Chesterton's Fence actually recommend?",
    "choices": ["Never remove or change anything you don't understand", "Find out why something exists before removing it - then remove it with confidence if the reason no longer applies", "Always keep old code exactly as-is for safety"],
    "answer": 1,
    "explain": "The fence isn't sacred - it's unremovable until you understand why it was built. Once you know, you can act on that knowledge."
  },
  {
    "q": "Which scenario best supports an actual rewrite rather than incremental refactoring?",
    "choices": ["The code looks messy and you personally find it annoying to read", "The framework is end-of-life with unpatched security holes, the system is small, and you can run old and new in parallel to compare", "A new developer joined the team and prefers a different style"],
    "answer": 1,
    "explain": "Real constraints (dead framework, contained scope, a safe comparison path) justify a rewrite. Aesthetic annoyance doesn't."
  }
]
```

## Where to go next

Reading and understanding the code is half the job - the other half is knowing when to ask for help instead of guessing. See [Asking Good Questions](/guides/asking-good-questions) for how to ask the person who wrote it (or anyone else) without wasting their time or yours.

## Your turn: the grace-period ticket is due today

Knowing the rewrite urge is a trap is the easy part. Feeling the deadline while a genuinely tempting rewrite sits right there is the actual test. There is no single right answer below and nothing is scored right or wrong - but the clock is real, and it's the same six hours either way you spend them.

```scenario
{
  "title": "The grace-period ticket is due today",
  "brief": "It's 10am. Ticket: add a 48-hour grace period before a canceled subscription's refund finalizes, so support can reverse an accidental cancellation without reissuing money. You've never opened this codebase before. It's due end of day - six hours from now. You open RefundCalculator.prorate() and find 140 lines of nested conditionals, including one with no comment: `if not line_item.is_tax:`. Nothing else has been touched yet.",
  "prompt": "What do you do first?",
  "clock": { "unit": "hr", "running": "until the ticket is due", "resolved": "shipped, tests green" },
  "resolvedHeading": "PR is up. Here's how the six hours went.",
  "actions": [
    {
      "id": "trace",
      "label": "Trace the cancel flow end to end, file by file",
      "cost": 1,
      "reveals": "$ grep -r \"Cancel Subscription\" src/\nSubscriptionSettings.jsx:  <button onClick={cancelSubscription}>Cancel Subscription</button>\n$ grep -r \"subscriptions/:id/cancel\" server/\nroutes/subscriptions.py:  @app.post(\"/api/subscriptions/:id/cancel\")\n\n# routes/subscriptions.py -> SubscriptionService.cancel() -> RefundCalculator.prorate()",
      "note": "Same five files as the Phase 1 trace. Confirms the grace period belongs inside prorate(), and that the is_tax block a few lines above it is still unexplained."
    },
    {
      "id": "blame",
      "label": "git blame the is_tax check and read the commit",
      "cost": 0.5,
      "reveals": "$ git blame -L 60,75 src/refund_calculator.py\na3f9c21 (Priya Nair 2025-04-02)   if not line_item.is_tax:\n$ git show a3f9c21\ncommit a3f9c21\n    fix: don't refund taxes, finance flagged this in Q2 audit",
      "note": "Not a mystery, a deliberate fix. Costs thirty minutes. If the grace-period edit had moved this line without knowing that, the tax-refund bug comes back and nobody notices until finance does."
    },
    {
      "id": "clarify",
      "label": "Ask your tech lead if the grace period applies to annual plans too",
      "cost": 0.5,
      "reveals": "you: does the 48h grace period apply to annual plans too, or just monthly?\ntech-lead: same rule for both, plan type doesn't matter here",
      "note": "Cheap and useful for scope. It tells you nothing about the is_tax check sitting a few lines above where you're about to edit."
    },
    {
      "id": "guess-fix",
      "label": "Add the grace-period check directly, skip the reading",
      "cost": 0.5,
      "reveals": "# added straight into prorate(), no reading first\nif not grace_period_active(sub):\n    line_item.refund = calculate(line_item)\n$ pytest tests/test_refund.py -q\nFAILED test_cancel_prorates_refund_excluding_tax - assert 55.0 == 60.0",
      "note": "You edited a function you hadn't read yet and it silently pulled tax back into the refund. Now you have to find that failure, work out why, and undo it, on top of the reading you tried to skip."
    },
    {
      "id": "rewrite",
      "label": "Rewrite prorate() cleanly, then add the grace period",
      "cost": 5,
      "reveals": "# 5 hours later\n$ git diff --stat\n refund_calculator.py | 210 ++++++++++++++--------------\n 1 file changed, 105 insertions(+), 105 deletions(-)\n$ pytest tests/test_refund.py -q\nFAILED test_cancel_prorates_refund_excluding_tax\nFAILED test_annual_plan_proration\n2 failed, 4 passed",
      "note": "It felt like real progress the whole time. It's 3pm, the grace period still isn't in, and two edge cases the old code quietly handled are broken because the new version never knew they existed."
    },
    {
      "id": "small-fix",
      "label": "Add the grace period as a small guarded change, with a safety-net test",
      "cost": 1,
      "resolves": true,
      "reveals": "def prorate(sub, line_item):\n    if not line_item.is_tax:\n        ...\n    if within_grace_period(sub):\n        return  # refund finalizes after 48h, not now\n    ...\n\n$ pytest tests/test_refund.py -q\ntest_cancel_prorates_refund_excluding_tax PASSED\ntest_cancel_within_grace_period_does_not_finalize_refund PASSED\n2 passed\n$ git diff --stat\n refund_calculator.py | 8 ++++++--\n tests/test_refund.py  | 9 +++++++++\n2 files changed, 15 insertions(+), 2 deletions(-)",
      "note": "Eight lines, one new test, the is_tax check untouched because now you know why it's there. PR opened with time to spare."
    }
  ],
  "debrief": {
    "ideal": 2.5,
    "text": "The fast path here isn't a small diff by accident, it's a small diff on purpose: find out why the fence is standing before deciding whether to move it, then add a few lines next to it instead of tearing up the field. Rewriting prorate() felt like the productive choice. It cost five hours to relearn what a thirty-minute git blame would have told you for free.",
    "notes": [
      { "when": "if-taken", "action": "rewrite", "text": "You rewrote prorate() before you understood it. Five hours in, the grace period still wasn't added, and two edge cases the old code quietly handled had no test anywhere to remind you they existed. That's the rewrite urge from this phase, playing out in real time: you'd read enough to be annoyed, not enough to know why the mess was there." },
      { "when": "if-taken", "action": "guess-fix", "text": "You edited before tracing or checking history and broke the tax exclusion without knowing it. That's the exact failure Chesterton's Fence warns about: treating 'I don't understand this' as 'this is safe to change'." },
      { "when": "if-not-taken", "action": "blame", "text": "You never checked why the is_tax check exists. This time your change happened to leave it alone, so nothing broke - but that's luck. The whole point of the fence is that you don't get to find out it was luck until after something breaks." },
      { "when": "if-not-taken", "action": "trace", "text": "You never traced the call chain before editing. It worked out because the Phase 1 trace of this same codebase was still fresh in your head. In a codebase you opened for the first time today, skipping that step means guessing which function actually owns the behavior you're changing." }
    ]
  }
}
```

---

[← Phase 2: Techniques for Making the Unknown Known](02-techniques-for-understanding.md) · [Guide overview](_guide.md)
