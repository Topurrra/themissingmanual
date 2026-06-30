---
title: "Act, Check, Repeat"
guide: loop-engineering
phase: 1
summary: "Why the act-check-repeat loop, not the single answer, is the real unit of AI work — and where one-shot prompting quietly breaks down."
tags: [agentic-loops, one-shot-prompting, verification, self-correction, ai]
difficulty: intermediate
synonyms:
  - "why one shot prompting fails"
  - "AI self correction loop"
  - "act check repeat explained"
  - "agent feedback loop"
  - "why AI finishes wrong"
updated: 2026-06-30
---

# Act, Check, Repeat

Think about how you actually do a piece of work that matters. You don't write the whole report in one pass and ship it unread. You draft a paragraph, read it back, notice it's clunky, rewrite it. You run the numbers, they look off, you check the formula. You send a tricky email, then reread the sent copy and wince at a typo. The work isn't the first draft. The work is the loop: do a thing, look at what you got, adjust, repeat until it's right.

For a long time, the way most people used AI skipped that entirely. You typed a request, the model produced one response, and that was the whole transaction. One prompt in, one answer out. That's one-shot prompting, and for plenty of tasks it's fine — summarize this, rephrase that, what's a word for "happy." Low stakes, single step, you can eyeball the result in two seconds.

It falls apart the moment the task has more than one moving part.

## Why one-shot finishes wrong

A model generating a single answer has no way to know whether that answer worked. It produces text that's statistically plausible given your request, stops, and hands it over. There's no built-in step where it runs the thing, looks at the output, and goes "huh, that's not right." Confidence and correctness are different signals, and a one-shot answer is full of the first and blind to the second.

So you get failures that all share a shape: the result looks complete and is quietly broken.

- You ask it to reorganize a budget spreadsheet. It returns a beautifully formatted table where one column silently doesn't add up, because it never totaled the column to check.
- You ask it to write a script that renames a folder of files. It produces clean, confident code that crashes on the first file with a space in the name — because it never ran it.
- You ask it to plan a three-city trip. It books you a connection that leaves before the inbound flight lands, because it never laid the times side by side.

None of these are the model being dumb. They're the model not being given a chance to check its own work. A person handed the same task and told "you get exactly one attempt, no looking at the result" would make the same class of mistake.

## The loop is the unit

Now change one thing. Instead of one answer out, let the AI take an action, observe what happened, and decide what to do next — and keep going. That's the loop:

```text
1. Act    — take a step toward the goal
2. Check  — look at the actual result of that step
3. Repeat — adjust based on what you saw, or stop if you're done
```

This is the engine underneath every "agent" you've heard about. When an AI coding tool writes code, runs the tests, sees three of them fail, reads the error, and fixes the code, that's the loop. When a research agent searches, reads what came back, realizes it's off-topic, and searches again with better terms, that's the loop. The intelligence people attribute to agents lives mostly here — not in any single step being brilliant, but in the willingness to look at the result and go again.

Here's the part worth sitting with: the model doing the looping is the same model that one-shots wrong. The capability didn't change. The structure around it did. Give a mediocre step a good loop and you get a good outcome, because the loop catches and corrects the bad steps. Give a brilliant step no loop and one bad guess sails straight through to you, polished and confident.

That's why the loop, not the answer, is the real unit of work. A single answer is a snapshot of one attempt. The loop is the process that drives attempts toward something that actually holds.

## What this changes for you

You don't need to build anything to use this idea. You need to recognize when a task needs a loop and set it up so the AI can run one.

The tell is this: **can the result be wrong in a way you can't see at a glance?** If yes, one shot is a gamble. A summary you can sanity-check by reading is fine to one-shot. A spreadsheet calculation, a piece of code, a multi-step plan with dependencies, anything that touches the real world — those need a check step, and ideally a repeat.

Sometimes you are the loop. You give the AI a task, look hard at the result, tell it specifically what's wrong, and have it try again. That works, and it's a real use of the pattern — but it costs your attention on every turn, and you become the bottleneck. The next phase is about handing more of that loop to the AI itself: giving it a goal it can verify, a way to check its own results, and a clear sense of when it's actually done.
