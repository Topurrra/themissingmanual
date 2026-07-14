---
title: "The Etiquette Nobody Tells You"
guide: "code-review-etiquette"
phase: 3
summary: "Unwritten code review norms: reasonable response times, the real difference between approving with comments and blocking, and what LGTM culture gets wrong about actually reading the diff."
tags: [code-review, etiquette, pull-requests, teamwork, norms]
difficulty: beginner
synonyms: ["how long should code review take", "how fast should i respond to a PR", "approve with comments vs request changes", "what does LGTM mean", "is rubber stamping code review bad"]
updated: 2026-07-06
---

# The Etiquette Nobody Tells You

Some of code review's biggest friction points never get written down anywhere. Nobody tells you how fast
you're supposed to respond, what "approve with comments" actually means versus blocking, or that "LGTM" can
mean either "I read every line" or "I skimmed the diff on my phone between meetings." You're expected to
absorb these norms by osmosis. Here they are directly.

## You don't owe an instant reply, but going dark blocks someone

Code review isn't customer support - you don't need to drop what you're doing the second a review request
lands. Reasonable norm: same business day for small PRs, within a day or two for bigger ones, with a heads
up if it'll be longer ("in meetings all day, will look tomorrow AM"). Nobody expects you to review mid-focus
block on your own work.

What's not fine: a PR sitting unreviewed for four days with no comment, while the author refreshes the page
wondering if they did something wrong. Every hour a PR waits is an hour someone can't merge, can't build on
top of it, and often can't start their next task cleanly. Silence reads as "not a priority" even when it's
really "I forgot" - so if you can't get to it, say so in one line. That costs ten seconds and saves someone a
day of wondering.

If you're the author and a review is stalled past a reasonable window, a polite nudge is not rude: "Hey, any
chance you can take a look today? Kind of blocked on this." Reviewers generally want the reminder, not a
reason to be annoyed.

## Approving with comments versus blocking

Most PR tools give you three real options, and mixing them up causes real confusion:

- **Approve** - "this is good to merge as-is." No unresolved concerns.
- **Approve with comments** - "this is good to merge, and here are some thoughts that don't need to hold it
  up." Use this for nitpicks, "consider for next time," or a question you're curious about but don't need
  answered before merge.
- **Request changes / block** - "don't merge this until we resolve X." Reserve it for actual bugs, security
  issues, or things you genuinely believe will cause a problem in production.

The failure mode in both directions is common. Blocking on a naming preference makes the author (rightly)
annoyed and trains people to see your reviews as friction to route around. Approving *without* comments on a
PR that has a real bug, because you didn't want to seem difficult, is worse - it puts a bug in production to
avoid an awkward conversation. If you found a real issue, block. If it's a preference, approve and mention it
lightly.

## What LGTM culture gets wrong

"LGTM" (looks good to me) is fine shorthand - the problem is what it's shorthand *for*. Two developers can
both type "LGTM" on the same PR: one read every changed line, traced the logic, and thought about edge cases;
the other opened the diff, saw it wasn't huge, and clicked approve between Slack messages. Both comments look
identical. Only one of them is actually a review.

Rubber-stamping happens for understandable reasons - review fatigue, trusting a teammate's track record too
much, a backlog of five PRs waiting and a meeting in ten minutes. It's still a real cost: review is one of
the few places that catches bugs before they ship, and an LGTM that means "I didn't really look" quietly
turns that safety net into theater. If you don't have time to actually review something, "haven't had a
chance to look closely, will circle back this afternoon" is more upfront than a fast, empty approval - and
it's a completely normal thing to say.

A useful personal rule: never approve a PR you haven't actually opened and scrolled through. If you trust the
author enough to skip that, that's a legitimate call to make sometimes - make it on purpose, not by habit.

```quiz
[
  {
    "q": "A PR has a small naming inconsistency you'd personally do differently, but no functional issue. What's the right review outcome?",
    "choices": [
      "Request changes and block the merge until it's renamed",
      "Approve, optionally mentioning it as a non-blocking note",
      "Say nothing and quietly rename it yourself later"
    ],
    "answer": 1,
    "explain": "Blocking is for real problems. A naming preference belongs in an 'approve with comments' note, not a block."
  },
  {
    "q": "Why is going dark on a review request for several days a problem, even if you eventually review it thoroughly?",
    "choices": [
      "It isn't a problem as long as the review itself is good",
      "It blocks the author from merging or moving on, and silence reads as low priority",
      "Reviews older than a day are automatically rejected by most tools"
    ],
    "answer": 1,
    "explain": "The cost isn't the eventual review quality, it's the time the author spends blocked and unsure whether the PR was even seen."
  },
  {
    "q": "What's the actual problem with LGTM culture?",
    "choices": [
      "The phrase 'LGTM' itself is unprofessional",
      "It can mean either a careful review or a fast rubber stamp, and you can't tell which from the outside",
      "Approvals should always include a paragraph of praise"
    ],
    "answer": 1,
    "explain": "The words look identical whether the reviewer read every line or skimmed the diff - that ambiguity is the real cost."
  }
]
```

## Where to go next

Code review etiquette is one piece of working well with other people's code. [Reading Legacy Code](/guides/reading-legacy-code)
picks up right after this: how to make sense of code someone else wrote long before you got there, with no
one around to ask.

---

[← Phase 2: Receiving Feedback Without Getting Defensive](02-receiving-feedback-without-defensiveness.md) · [Guide overview](_guide.md)
