---
title: "Patterns That Help"
guide: prompting-that-works
phase: 2
summary: "A handful of reliable moves — assign a role, ask for steps, show an example, pin the output format, and let it think first — that lift answer quality across almost any task."
tags: [prompting, patterns, few-shot, output-format, productivity]
difficulty: beginner
synonyms:
  - prompt patterns that work
  - giving ai a role
  - few shot prompting example
  - ask ai to think step by step
  - how to control ai output format
updated: 2026-06-30
---

# Patterns That Help

Once you're being clear about what you want, a few repeatable patterns reliably push the answer from okay to good. None of these are tricks. They're ways of giving the model more to work with. Reach for them when a plain request isn't landing.

## Give it a role

Telling the AI who to be sets the tone, vocabulary, and priorities of the answer in one move.

```text
You're an experienced kindergarten teacher. Explain why my 5-year-old
melts down at bedtime, in plain language, like you're talking to a tired
parent.
```

versus the same question with no role — which tends to come back clinical and hedged. A role isn't roleplay for its own sake; it's a shortcut for "answer the way this kind of person would." "Act as a skeptical editor." "You're a budget-conscious financial planner." "Respond like a patient IT helpdesk person." Each one shifts what the model emphasizes and what it leaves out.

Keep it honest, though. A role makes the *style* fit; it does not make the model an actual licensed professional. "Act as a doctor" doesn't turn it into one — treat medical, legal, and financial output as a starting point to verify, not advice to follow.

## Ask for steps

For anything with reasoning or sequence — planning, troubleshooting, comparing options, math — ask the model to lay out its thinking or work through it in steps rather than blurting a final answer.

```text
Walk me through how to decide whether to repair or replace my 9-year-old
washing machine. Lay out the factors step by step, then give a
recommendation at the end.
```

This does two things. It usually produces a more careful answer, and it lets *you* see the reasoning, so when something's off you can spot exactly where it went sideways instead of arguing with a verdict. (Many newer "reasoning" models do some of this internally now, but explicitly asking still helps for everyday tools and everyday questions.)

## Show an example (few-shot)

This is the most underused pattern and one of the most effective. If you want output in a particular style or shape, show one or two examples of what "right" looks like. The model is very good at matching a pattern it can see.

Say you're turning rough notes into clean meeting action items:

```text
Turn my messy notes into action items. Match this format exactly:

Example input: "talk to sam about budget, the report is late, maybe move
the launch"
Example output:
- [ ] Sam — discuss budget (owner: me)
- [ ] Chase the late report (owner: ?)
- [ ] Decide whether to move the launch date (owner: me)

Now do these notes:
[your notes]
```

Showing one example beats three paragraphs describing the format. This trick — giving examples — is often called "few-shot" prompting; giving none is "zero-shot." You don't need the jargon, but you'll see it around.

## Pin the output format

Phase one mentioned format; it's worth its own line because it saves the most cleanup. Tell the model the exact shape you want and it'll usually comply:

- "Answer as a table with columns: Option, Cost, Effort, Best for."
- "Give me exactly three options, no preamble."
- "Reply with only the rewritten text, nothing else."
- "Bullet points, no longer than one line each."

"No preamble" and "nothing else" are quietly effective — they cut the "Certainly! Here's..." throat-clearing and the unsolicited summary at the end.

## Let it think before it answers

Related to "ask for steps," but broader: for harder requests, tell the model to plan or check before committing.

```text
Before you write the cover letter, first list the 3 things this job posting
seems to care about most. Then write the letter to hit those three.
```

You can also ask it to review its own work: *"Now reread that and flag anything that sounds generic or untrue."* It won't catch everything — a model checking itself has real limits and will still miss its own mistakes — but it catches more than zero, and it's free.

## Combine them, don't overload

These stack. A genuinely strong prompt might assign a role, give context, show one example, and pin the format — all in a few lines. But don't pile on every pattern for a question that didn't need any of them. "What's a good substitute for buttermilk?" needs none of this. Match the effort to the stakes. The patterns are tools in a drawer, not a checklist you run every time.
