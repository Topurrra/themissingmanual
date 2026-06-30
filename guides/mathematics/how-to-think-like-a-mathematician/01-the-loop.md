---
title: "The Loop: Understand, Plan, Do, Look Back"
guide: "how-to-think-like-a-mathematician"
phase: 1
summary: "Problem-solving as a learnable craft: Polya's four steps, trying small cases, finding invariants, and getting unstuck when you are stuck."
tags: [mathematics, problem-solving, polya, heuristics, debugging]
difficulty: beginner
synonyms: ["polya four steps", "understand the problem", "how to approach a math problem", "devise a plan", "look back math", "problem solving method"]
updated: 2026-06-30
---

# The Loop: Understand, Plan, Do, Look Back

Watch what most people do with a hard problem: they read it once, feel the panic,
and immediately start writing equations — any equations — hoping the right ones fall
out. That's not solving. That's flailing with a pencil.

In 1945 a mathematician named George Polya wrote down what the people who *don't*
flail actually do. It turned out to be four plain steps, run in a loop. Not a magic
formula — a checklist. The value isn't that the steps are clever. It's that having
them stops you from skipping the two steps everyone skips, which are the first one
and the last one.

## The four steps

1. **Understand the problem.** What are you given? What are you asked for? Could you
   state it back in your own words?
2. **Devise a plan.** What approach might connect what you have to what you want?
3. **Carry out the plan.** Do the work, one honest step at a time, checking each.
4. **Look back.** Did it answer the actual question? Does the answer make sense? What
   did you learn that you could reuse?

That's it. The whole loop. And if step 3 falls apart, you don't quit — you loop back
to step 2 and try a different plan. Getting stuck is part of the machine, not a sign
the machine broke.

## Step 1 is where the problem is won or lost

Most wrong answers are not arithmetic mistakes. They are answers to a question that
was never asked. "Understand the problem" sounds too obvious to need saying, which is
exactly why it gets skipped.

Here is the test for whether you understand a problem: can you say it back without
the original words?

```text
Given: "A train leaves A for B at 60 km/h. Another leaves B for A at
       40 km/h. The towns are 200 km apart. When do they meet?"

Say it back: "Two things move toward each other and close a 200 km gap.
              Together they eat 60 + 40 = 100 km every hour.
              I want the time to close 200 km."

The question I'm actually answering: 200 ÷ 100 = how many hours?
```

*What just happened:* re-stating the problem in plain words quietly did the hard
part. "Toward each other" is the insight that lets you add the speeds, and you found
it not by being clever but by refusing to move until the words were yours.

## Step 4 is the one that compounds

Look back is where amateurs stop early and pros pull ahead. You got an answer — now
ask: does it pass a sanity check? Could I have gotten it a faster way? Is there a
pattern here I'll see again?

```text
Answer to the train problem: 2 hours.

Look back:
- Sanity: in 2 hours the 60 km/h train goes 120 km, the other goes 80 km.
  120 + 80 = 200. The gap closes exactly. ✓
- Reusable idea: "closing speed = sum of speeds when moving toward each
  other." That'll show up again — two pipes filling a tank, two people
  raking leaves, two processes draining a queue.
```

*What just happened:* the sanity check caught nothing this time, which is the point —
you now *trust* the 2 hours instead of hoping. And naming the reusable idea means the
next "two things working together" problem is already half-solved.

## For builders

You already run this loop — you call it debugging. "Understand the problem" is
reproducing the bug before you touch code. "Devise a plan" is forming a hypothesis.
"Carry out" is the fix. "Look back" is writing the test that proves it stays fixed.
The engineers who skip reproduction and patch the first plausible line are doing the
pencil-flail, only in a different editor. When a proof needs to be airtight rather
than merely convincing, [/guides/what-a-proof-is](/guides/what-a-proof-is) picks up
where "look back" leaves off.

> The loop is not linear. You will loop from step 3 back to step 2 many times on a
> real problem. That's not failure — that's the loop working as designed.

```quiz
[
  {
    "q": "Which two steps of Polya's loop do people most often skip?",
    "choices": ["Plan and carry out", "Understand and look back", "Carry out and look back", "Understand and plan"],
    "answer": 1,
    "explain": "People rush past truly understanding the problem and quit the moment they have any answer, skipping the sanity check and the reusable lesson."
  },
  {
    "q": "What is the practical test for whether you understand a problem?",
    "choices": ["You can write an equation for it", "You can say it back in your own words without the original wording", "You recognize the topic it came from", "You remember a similar problem"],
    "answer": 1,
    "explain": "Re-stating it in your own words forces out hidden assumptions and often surfaces the key insight, like 'moving toward each other means add the speeds'."
  },
  {
    "q": "When step 3 (carry out the plan) falls apart, what does the loop say to do?",
    "choices": ["Give up; the problem is too hard", "Push harder on the same plan", "Loop back to step 2 and try a different plan", "Skip to step 4 and guess"],
    "answer": 2,
    "explain": "Getting stuck is built into the loop. A failed plan sends you back to devise a new one, not out the door."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The moves →](02-the-moves.md)
