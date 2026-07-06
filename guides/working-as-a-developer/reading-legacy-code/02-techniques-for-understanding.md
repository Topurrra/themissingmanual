---
title: "Techniques for Making the Unknown Known"
guide: "reading-legacy-code"
phase: 2
summary: "Use git blame as archaeology, write a safety-net test before changing anything, and use small refactors to build understanding by doing."
tags: [legacy-code, git-blame, testing, refactoring, beginner-friendly]
difficulty: beginner
synonyms: ["how to use git blame", "how to understand old code", "safe refactoring legacy code", "git log archaeology"]
updated: 2026-07-06
---

# Techniques for Making the Unknown Known

Tracing a feature (Phase 1) tells you *what* the code does. It doesn't tell you *why* it's shaped the way it is. That "why" is usually the part that matters most before you change anything — and it's recoverable, if you know where to dig.

## Git blame and git log as archaeology

`git blame` doesn't just tell you who wrote a line. It tells you when, and pointing at a commit gives you the "why" if the author left one.

```bash
git blame -L 40,55 src/refund_calculator.py
```

This shows you the commit hash for each of those lines. Take that hash and look at the full commit:

```bash
git show a3f9c21
```

If you're lucky, the commit message says something like `"fix: don't refund taxes, finance flagged this in Q2 audit"`. Now you know that weird-looking `if not line_item.is_tax:` check isn't an accident — it's a deliberate fix for a real problem, and removing it reintroduces a bug someone already paid to find.

If the commit message is useless ("fix bug", "wip", "updates"), widen the search:

```bash
git log --follow -p -- src/refund_calculator.py
```

`--follow` tracks the file across renames; `-p` shows the actual diff for every change. Skim the messages for the commit that introduced the weird logic, then read the PR or ticket number in that message if there is one — that's often where the real explanation lives, not the commit itself.

One more trick: `git log -S"is_tax"` finds every commit that added or removed the exact string `is_tax`, even in commits that don't mention it in the message. Useful when you're hunting for where a specific check was introduced.

When git history has nothing — squashed history, one giant "initial commit" — that itself is information. It means the answer isn't in the repo. Ask around. A Slack search for the filename or function name sometimes surfaces the original discussion. And if nobody knows, treat the code as a fence you don't understand yet (more on that in Phase 3) rather than something safe to delete.

## Write the safety-net test before you touch anything

Legacy code is often legacy precisely because it has no tests. That makes any change scary — you can't tell if you broke something until it's in production. Fix that before you fix the bug.

Write a test that captures the *current* behavior, even if the current behavior is the bug you're about to fix:

```python
def test_cancel_prorates_refund_excluding_tax():
    sub = make_subscription(plan_price=100, tax=10, days_used=15, days_total=30)
    result = cancel_subscription(sub)
    # current (buggy) behavior: tax gets refunded too
    assert result.refund_amount == 55.0  # should be 50.0 once fixed
```

This test does two things. First, it proves you understand the current behavior well enough to describe it precisely — if you can't write this test, you don't understand the code yet, and that's worth knowing before you start editing. Second, once you fix the bug, you flip the assertion to the correct value and now you have a regression test that stays in the suite forever.

The safety net matters more in legacy code than new code, because you have no author to ask "did I break anything?" The test is the closest thing you get to that answer.

## Small, safe refactors build understanding by doing

Reading code passively only gets you so far. Renaming a variable to what it actually represents, or extracting a tangled block into a named function, forces you to prove you understood it — because if you didn't, the rename will be wrong or the extraction will break.

Two refactors that are close to risk-free and pay for themselves immediately:

- **Rename.** If `calc(x, y, z)` really computes a prorated refund, rename it to `calculate_prorated_refund(price, days_used, days_total)`. Every call site becomes self-documenting, and if your rename doesn't quite fit, that's a signal you misunderstood something.
- **Extract function.** Pull a 20-line block with a comment like `# handle edge case for annual plans` into `handle_annual_plan_proration()`. Now the outer function reads as a list of steps instead of a wall of logic, and the annual-plan behavior is isolated enough to reason about (and test) on its own.

Do these with your editor's built-in rename/extract refactoring tools, not find-and-replace — they update every reference correctly and won't quietly break a string that happened to match. Run the test suite (or your new safety-net test) after each one.

These refactors aren't the goal. They're a forcing function: you can't safely rename something you don't understand, so doing it safely is proof you now do.

```quiz
[
  {
    "q": "You find a strange conditional in legacy code with no comment. What's the best next step?",
    "choices": ["Delete it, since unexplained code is probably dead code", "Run `git blame` on that line, then `git show` the commit it points to", "Assume it's a bug and rewrite the logic"],
    "answer": 1,
    "explain": "git blame + git show recovers the commit message and often the reasoning behind the code, before you risk removing something load-bearing."
  },
  {
    "q": "Why write a test that captures the current (buggy) behavior before fixing a bug?",
    "choices": ["It's required by most style guides", "It proves you understand the current behavior and gives you a regression test once you flip the assertion", "It makes the pull request look more thorough"],
    "answer": 1,
    "explain": "If you can't write down what the code currently does, you don't understand it well enough to safely change it."
  },
  {
    "q": "What's the main value of doing a small rename or extract-function refactor in unfamiliar code?",
    "choices": ["It makes the diff look more active", "It forces you to prove you understood the code, since a wrong rename or broken extraction reveals gaps", "It's required before any bug fix"],
    "answer": 1,
    "explain": "Safe refactors are a comprehension check disguised as cleanup — you can't do them correctly without understanding what the code does."
  }
]
```

---

[← Phase 1: Where to Start When You Don't Understand Any of It](01-where-to-start.md) · [Guide overview](_guide.md) · [Phase 3: When (and When Not) to Rewrite →](03-when-to-rewrite.md)
