---
title: "Receiving Feedback Without Getting Defensive"
guide: "code-review-etiquette"
phase: 2
summary: "A comment on your PR isn't a comment on your competence. Learn the difference between healthy pushback and defensiveness, and what to do when you genuinely think the reviewer is wrong."
tags: [code-review, feedback, defensiveness, communication, pull-requests]
difficulty: beginner
synonyms: ["how to not take code review personally", "how to respond to critical PR comments", "code review made me feel bad", "how to disagree with a code reviewer", "reviewer is wrong what do i do"]
updated: 2026-07-06
---

# Receiving Feedback Without Getting Defensive

Your PR comes back with eight comments and "changes requested" in red. Your stomach drops a little. That
reaction is normal - you spent hours on this, and it feels like *you* got graded, not your code. It
didn't. The two feel identical from the inside. They aren't the same thing, and learning to separate them is
most of what makes code review survivable.

## The code is not you

Nobody comments "this function is bad" and means "you are bad at your job." They mean the function, on this
line, in this context, could be better. The reviewer usually didn't even think about you while writing the
comment - they were looking at the diff, not psychoanalyzing your worth as an engineer. You're the one
adding that layer.

A trick that helps: read the comment as if it were left on code you wrote a year ago, not code you wrote
this morning. Distance turns "you missed something" into "oh, that's a good catch" almost automatically -
because there's no fresh ego attached yet. The goal is to get there without waiting a year.

## Healthy pushback versus defensiveness

Disagreeing with a reviewer is not the problem. *How* you disagree is what separates a good engineer from
one people dread reviewing.

> **Defensive:** "It works fine, I tested it." (No reasoning. Treats "it works" as the only bar. Shuts the
> conversation down.)
>
> **Healthy pushback:** "I went with a single query here because the join was getting expensive at our data
> size - happy to split it if you're worried about readability, but wanted to flag the tradeoff first."

The difference isn't tone, it's content. Defensiveness protects the code (and the ego) without engaging the
actual concern. Healthy pushback engages the concern, states real reasoning, and leaves room for the other
person to be right. Notice the healthy version doesn't apologize for disagreeing, either - "I disagree, and
here's why" is not rude. Silence and instant compliance without explanation aren't better than pushback;
they hide the disagreement instead of resolving it.

Watch for defensiveness tells in your own replies: explaining your reasoning *after* getting annoyed instead
of before, replying within ninety seconds, or leading with "well, actually" three comments in a row. None of
these mean you're wrong. They mean you're reacting instead of responding - close the laptop for five minutes
if you notice it happening.

## When you think the reviewer is actually wrong

It happens. Reviewers make mistakes too - they misread the diff, don't have the context you do, or are
applying a rule that doesn't fit this case. The move isn't to concede to avoid conflict, and it isn't to dig
in silently and merge anyway. It's to make your case with specifics:

> "I think this is actually safe - `items` can't be empty here because we validate it in the route handler
> above (line 12). Want me to add a comment pointing that out, or are you thinking of a case I'm missing?"

This does three things: states your position, gives the evidence, and invites them to correct you if you've
missed something. Most disagreements resolve in one round of this. If it doesn't resolve after two rounds of
back-and-forth, that's the signal to stop typing and talk - a five-minute call settles what a 20-comment
thread won't, and text arguments have a way of hardening positions that a real conversation defuses in one
sentence.

If you're junior and the reviewer is senior, "they're probably right" is a reasonable prior - but a prior,
not a rule. If you have a specific, checkable reason (a test that passes, a line of code that handles the
case) it's worth saying so. Being wrong sometimes is the cost of ever being right out loud.

## What actually helps in the moment

Before you reply to a review that stung: reread it once after the sting fades, usually the next time you
look. Comments that felt harsh at 9am often read as completely reasonable at 9:15, once "they think I'm
incompetent" has stopped being the story you're telling yourself. If a comment genuinely crossed a line -
mocking, sarcasm, "how did this even pass CI" - that's a tone problem worth naming directly to the person,
separate from the technical content.

```quiz
[
  {
    "q": "A reviewer comments that your function has a bug. What's the most accurate way to think about that comment?",
    "choices": [
      "It's feedback about your competence as an engineer",
      "It's feedback about this specific code, not about you",
      "It means you should stop contributing to this codebase"
    ],
    "answer": 1,
    "explain": "Reviewers are looking at the diff, not judging your worth - the separation is a skill you practice, not a fact you accept once."
  },
  {
    "q": "What makes a reply 'healthy pushback' rather than 'defensive'?",
    "choices": [
      "Replying quickly so the reviewer knows you disagree",
      "Stating concrete reasoning and leaving room for the reviewer to be right",
      "Insisting the code works because it passed your own testing"
    ],
    "answer": 1,
    "explain": "Defensiveness protects the code without engaging the concern; healthy pushback engages it with real reasoning and stays open to being wrong."
  },
  {
    "q": "You and a reviewer go back and forth twice on a comment thread with no resolution. What should you do next?",
    "choices": [
      "Keep replying in the thread until one side gives up",
      "Merge anyway without addressing it",
      "Move the conversation to a quick call or chat"
    ],
    "answer": 2,
    "explain": "Text threads harden positions. A short live conversation resolves in minutes what a long comment thread often can't."
  }
]
```

---

[← Phase 1: Reviewing Someone Else's Code Without Being a Jerk](01-reviewing-without-being-a-jerk.md) · [Guide overview](_guide.md) · [Phase 3: The Etiquette Nobody Tells You →](03-the-etiquette-nobody-tells-you.md)
