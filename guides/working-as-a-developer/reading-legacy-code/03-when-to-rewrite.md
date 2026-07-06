---
title: "When (and When Not) to Rewrite"
guide: "reading-legacy-code"
phase: 3
summary: "Why the urge to rewrite legacy code is usually wrong, how Chesterton's Fence keeps you from removing something load-bearing, and the rare cases a rewrite is the right call."
tags: [legacy-code, rewrite, chestertons-fence, refactoring, beginner-friendly]
difficulty: beginner
synonyms: ["should I rewrite legacy code", "chesterton's fence", "when to rewrite vs refactor", "why not to rewrite old code"]
updated: 2026-07-06
---

# When (and When Not) to Rewrite

Two weeks into reading someone else's tangled code, the thought arrives: "This would be so much cleaner if I just rewrote it." That thought is almost always premature, and it's worth knowing why before you act on it.

## Why "just rewrite it" is usually wrong

The rewrite urge shows up right when you're the least qualified to act on it — you've read enough code to see the mess, but not enough to see why the mess exists. That gap is exactly where rewrites fail.

Old code accumulates fixes for real problems: the tax-exclusion check from Phase 2, a race condition patched at 2am, a workaround for a payment provider's broken API. None of that shows up as a clean abstraction. It shows up as a pile of specific, ugly conditionals — and every one of them was somebody's Tuesday.

A rewrite throws all of that away and starts from what the system *looks like it should do*, not what it actually has to do. The bugs you'll reintroduce aren't new bugs. They're the same bugs the original code already fixed, now unfixed again, waiting to be rediscovered by whoever's on call next.

There's also a cost side that's routinely underestimated: a rewrite takes real calendar time in which the old system still needs to work, still needs bug fixes, and now has to be kept in sync with the parallel rewrite. Most rewrite projects don't fail because the new code is bad — they fail because the team runs out of patience or budget to finish the migration, and you end up maintaining both versions.

## Chesterton's Fence

The principle: if you find a fence in a field and don't know why it's there, don't remove it until you find out why it was put there. Maybe it's pointless. Maybe it's keeping a bull from wandering onto a road.

Applied to code: don't delete or rewrite a piece of logic just because you don't understand why it's there. "I don't understand this" and "this is unnecessary" are different claims, and legacy code habitually gets treated as if the first implies the second.

The fix is cheap: do the archaeology from Phase 2 first. Git blame it, read the commit, check for a linked ticket, ask around. Three outcomes:

1. **You find a real reason.** The fence stays. You now understand the system better than you did an hour ago.
2. **You find it was a reason that no longer applies** (a workaround for a payment provider bug fixed years ago). Now you can remove it — with confidence, and ideally with a test proving the old reason is gone.
3. **You find nothing — no commit message, no ticket, no one remembers.** Treat this as "reason unknown," not "no reason." Leave it, or change it cautiously with a safety-net test, rather than deleting outright.

Chesterton's Fence isn't "never change legacy code." It's "earn the right to change it by finding out why it's shaped this way first."

## When a rewrite really is the right call

Rewrites aren't always wrong. They're right when specific conditions hold, not when the code merely looks old:

- **The technology itself is the constraint**, not the logic built on it — a framework that's end-of-life and unpatched for known security vulnerabilities, a database that can't scale to your actual load no matter how it's tuned.
- **You've already done the archaeology and genuinely understand the business rules**, not just the code shape. A rewrite by someone who can list every edge case from memory is a different project than a rewrite by someone who's read the code for a week and is annoyed by it.
- **The system is small and well-bounded enough to rewrite in weeks, not quarters** — a single service, not "the whole platform." The smaller the blast radius, the smaller the risk if the rewrite misses an edge case.
- **You can run old and new side by side and compare outputs** before cutting over — shadow traffic, feature flags, a migration period where both systems run and disagree loudly if they don't match.

Under those conditions, a rewrite is a refactor with extra steps, not a leap of faith. Absent them, the incremental path from Phase 2 — trace, test, small safe change, repeat — gets you to the same clean end state without the all-or-nothing risk.

The honest default: assume the rewrite urge is sunk-cost thinking in disguise (the code is confusing, so surely starting over is less work) until you've proven otherwise with the checklist above. Most of the time, the fastest way out of confusing legacy code isn't replacing it — it's a series of small, tested changes that turn confusing code into code you understand, one Chesterton's Fence at a time.

```quiz
[
  {
    "q": "Why is the urge to rewrite legacy code often a bad instinct?",
    "choices": ["Rewrites are always slower than fixing bugs one at a time", "It usually happens right when you've seen enough mess to be annoyed but not enough history to know why the mess exists", "Product managers never approve rewrites"],
    "answer": 1,
    "explain": "The rewrite urge peaks at partial understanding — you can see the ugliness but haven't yet uncovered the real reasons behind it."
  },
  {
    "q": "What does Chesterton's Fence actually recommend?",
    "choices": ["Never remove or change anything you don't understand", "Find out why something exists before removing it — then remove it with confidence if the reason no longer applies", "Always keep old code exactly as-is for safety"],
    "answer": 1,
    "explain": "The fence isn't sacred — it's unremovable until you understand why it was built. Once you know, you can act on that knowledge."
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

Reading and understanding the code is half the job — the other half is knowing when to ask for help instead of guessing. See [Asking Good Questions](/guides/asking-good-questions) for how to ask the person who wrote it (or anyone else) without wasting their time or yours.

---

[← Phase 2: Techniques for Making the Unknown Known](02-techniques-for-understanding.md) · [Guide overview](_guide.md)
