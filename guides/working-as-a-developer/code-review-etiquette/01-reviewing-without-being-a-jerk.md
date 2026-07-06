---
title: "Reviewing Someone Else's Code Without Being a Jerk"
guide: "code-review-etiquette"
phase: 1
summary: "Text reads harsher than you mean it. Phrase feedback as questions or observations instead of commands, and learn to tell a style nitpick apart from a real bug and an architecture concern."
tags: [code-review, communication, pull-requests, feedback, tone]
difficulty: beginner
synonyms: ["how to leave good code review comments", "how to review a pull request", "code review tone", "how to phrase code review feedback", "style nitpick vs real bug"]
updated: 2026-07-06
---

# Reviewing Someone Else's Code Without Being a Jerk

A comment that would sound fine said out loud can read as an attack in a PR thread. There's no face, no
tone of voice, no shared context that this is Dave being Dave again. Text on a screen, at 2pm, sitting
between the author and the "merge" button they were hoping to hit today.

"This is wrong" reads as a verdict. "Why not use a map here instead of nested loops?" reads as a question
you can actually answer. Same underlying concern, completely different experience for the person reading it.
Assume every comment you write will be read in the worst possible mood, because eventually one will be.

## Commands versus questions

Compare these two comments on the same line of code:

> **Before:** "Change this to use `Promise.all`. This is inefficient."
>
> **After:** "Since these three fetches don't depend on each other, could we run them with `Promise.all`
> instead of awaiting each one in sequence? Might shave a couple hundred ms off the load."

The first is a command with a judgment attached ("inefficient"). It's technically correct and still lands
badly - it tells the author what to do without explaining why, and it labels their work with a negative
word. The second asks a question, states the reasoning, and gives a concrete reason to care. The author can
say "good catch" or "actually I need them sequential because X" - either way, it's a conversation, not an
order.

You don't need this phrasing for every comment - "typo: `recieve` → `receive`" doesn't need a question mark.
Save the soft framing for anything that questions a decision the author made on purpose.

## Observations work better than instructions

"You should extract this into a helper" assumes you know their reasons for not doing that already. Try
narrating what you're noticing instead: "I see this validation logic three times in this file - might be
worth pulling into one function, might not be worth it for three call sites. Your call." That last phrase
matters: it signals you're not blocking the PR over it.

Real example, seen in an actual PR: a comment that said only "no" on a 40-line function. No explanation, no
suggestion. The author had no idea what to fix and had to ask in Slack what the reviewer even meant. Compare
to: "This function does validation, transformation, and the DB write all in one place - if the DB write
fails partway through, we might've validated for nothing. Worth splitting?" Same objection, one version is
usable.

## Picking your battles

Not every PR comment carries the same weight, and treating them all the same way (either steamrolling
everything or staying silent about everything) is how reviews go wrong. Rough hierarchy:

- **Style nitpicks** (naming, formatting, "I'd write this differently but it works") - mention lightly,
  label them as opinion, and drop it after one round. "Nit: I'd call this `userCount` not `cnt`, but not
  blocking on it."
- **Real bugs** (off-by-one, unhandled null, race condition, wrong logic) - these need to be raised clearly
  and are worth blocking the merge over. Don't soften a real bug into invisibility for the sake of politeness:
  "This will throw if `user` is null - looks reachable from the `/guest` route. Can we guard it?"
- **Architecture concerns** (this whole approach might not scale, this couples two modules that shouldn't
  know about each other) - the biggest and rarest category. Raise it, but recognize it might mean redoing
  real work, so bring reasoning, not a preference, and be open to "let's ship this and revisit."

A common early-career mistake is spending your credibility on nitpicks - fifteen comments about spacing and
variable names, nothing about the null pointer three lines down. Reviewers who catch real bugs earn the
right to be picky later. Reviewers who only nitpick get their comments skimmed.

## A quick gut check before you hit submit

Before posting a review, skim your own comments and ask: if a stranger read only these, with no tone of
voice, would they sound like feedback or like criticism of a person? If a comment only makes sense in your
head as "I'm being efficient," rewrite it. Two extra sentences of context cost you nothing and save the
author a defensive reread.

Ready to check your understanding:

```quiz
[
  {
    "q": "Which comment is more likely to get a productive response?",
    "choices": [
      "\"This is wrong, fix it.\"",
      "\"This throws if `user` is null - reachable from the /guest route. Can we guard it?\"",
      "\"Bad approach.\""
    ],
    "answer": 1,
    "explain": "It names the specific problem, explains why it matters, and asks rather than orders."
  },
  {
    "q": "A teammate used a slightly different variable naming style than you'd use, but the code works fine. What's the right move?",
    "choices": [
      "Block the PR until it matches your preferred style",
      "Mention it lightly as a non-blocking nit, or let it go",
      "Say nothing in the PR, then complain about it later"
    ],
    "answer": 1,
    "explain": "Style preferences are the lowest-stakes category - flag them softly if at all, and don't block on them."
  },
  {
    "q": "Why does 'This is inefficient, change it' tend to land badly even when it's technically correct?",
    "choices": [
      "Because efficiency doesn't matter in code review",
      "Because it's a command with a judgment attached, and gives no reasoning to engage with",
      "Because reviewers should never mention performance"
    ],
    "answer": 1,
    "explain": "The problem isn't the content, it's the framing - no reasoning, no room for a response, only a verdict."
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: Receiving Feedback Without Getting Defensive →](02-receiving-feedback-without-defensiveness.md)
