---
title: "Evals as a Habit"
guide: "evaluating-llm-output"
phase: 3
summary: "Run evals on every prompt change and model upgrade to catch regressions, track quality over time, and know where offline evals end and production monitoring begins."
tags: [evals, regression, monitoring, model-upgrade, quality, observability]
difficulty: intermediate
synonyms: ["regression testing prompts", "how to upgrade llm model safely", "tracking llm quality over time", "offline evals vs production monitoring", "did my prompt change break anything", "llm production monitoring"]
updated: 2026-06-30
---

# Evals as a Habit

A one-time eval is a snapshot — useful, but it ages the moment you change anything. The payoff comes when running the eval is a *reflex*: something that happens before every prompt edit ships, every time the provider releases a new model, every time you're tempted to nod at a demo and call it done. That's when the eval stops being homework and becomes the thing that lets you move fast without breaking the cases you already fixed.

This phase is about the habit: catching regressions, surviving model upgrades, watching quality drift over time, and — crucially — knowing where the eval's reach ends and the real world begins.

## Regression testing: the eval's main job

A regression is when a change makes something that *used to work* stop working. In normal code, your test suite catches it. With a model feature, the eval is that test suite.

The workflow is mechanical and that's the point:

```text
1. Establish a baseline    →  run the eval on what you ship today: 27/30 pass
2. Make your change        →  edit the prompt (or swap the model)
3. Re-run the eval         →  same 30 inputs, same graders
4. Compare                 →  28/30? ship it.  24/30? do NOT ship.
5. Inspect what moved      →  which rows flipped, in BOTH directions
```

*What just happened:* You turned "I think this is better" into a before-and-after diff on a fixed set. The number going up isn't even the most important part — step 5 is, because a change can lift the total while *breaking* specific rows you care about.

⚠️ **Gotcha.** Don't read only the headline score. Going from 27 to 28 can hide a disaster: you fixed *four* easy rows and broke *three* important ones. Always look at which rows flipped from pass to fail, not only the net. A green aggregate over a broken critical case is how regressions ship.

💡 **Key point.** Every bug you fix becomes a permanent eval row. The case the model got wrong in production goes into the set with its expected behavior, *forever*. That's how the eval grows teeth over time — it accumulates every mistake you've ever made so none of them can come back unnoticed.

## Surviving a model upgrade

The provider releases a newer, "better," cheaper model and you want to switch. Here's the trap: "better on the provider's benchmarks" is not "better on *your* task with *your* prompts." A new model can be smarter in general and still regress *your* specific use case — it may follow your formatting instructions differently, be more verbose, or interpret an edge case the old one handled.

Your eval is exactly the tool for this. Don't swap and pray:

- **Run your eval on the new model before switching.** Same inputs, same graders, new model. Compare to your current baseline.
- **Expect to re-tune the prompt.** A prompt squeezed to work around the *old* model's quirks may be fighting the new one. The eval tells you whether a tweak helped.
- **Watch cost and latency, not only quality.** A model that scores the same but is slower or pricier is a regression in a dimension the pass-count doesn't show. Track those alongside accuracy.

🪖 **War story.** A team upgraded to a newer model the day it launched, on the strength of the announcement post. Quality on their extraction task quietly dropped — the new model wrapped its JSON in a markdown code fence the old one never used, and their parser choked. Their eval would have caught it in one run, because "valid parseable JSON" was a rule check. They didn't run it. They learned to never let a model swap skip the eval, no matter how shiny the launch.

## Tracking quality over time

A single before/after is good. A *trend* is better. If you save each eval run — the date, the model, the prompt version, the scores — you can see quality as a line over weeks, not a feeling per release.

```text
date        prompt  model       pass   notes
────────    ──────  ─────────   ────   ─────────────────────────
2026-05-02  v3      model-A     24/30  baseline
2026-05-14  v4      model-A     27/30  added few-shot examples
2026-06-01  v4      model-B     25/30  upgraded model — REGRESSED
2026-06-03  v5      model-B     28/30  re-tuned prompt for model-B
```

*What just happened:* The history makes the model-B regression and the recovery visible at a glance — and ties each score to the exact prompt and model that produced it. Without this record, the June 1st dip would have been invisible until a user complained, and you'd have no idea which change caused it.

This doesn't need a fancy dashboard to start. A committed results file, or appended rows in a spreadsheet, gives you the trend. The discipline is recording *what changed* next to *what the score did*, so a drop always has a suspect.

## Offline evals are not the whole story

Here's the honest limit, and it's an important one: your eval set is a *sample of the past*. It tells you how your system does on inputs you've already collected. It cannot tell you about:

- **Inputs you've never seen.** Real users will send things your set doesn't contain. Always.
- **Real-world drift.** User behavior, slang, the topics they ask about, even the model behind the API can shift under you over time.
- **What users actually feel.** Your grader's definition of "good" is a proxy. Sometimes the thing that passes every check still isn't what the user wanted.

So evals are necessary but not sufficient. They're the *offline* half. The other half is watching production:

- **Production monitoring.** Log real inputs and outputs (privacy permitting), track error rates, latency, cost, refusals, and parse failures. Sample real traffic and run your graders — even your judge — on *live* outputs, not only the frozen set.
- **User feedback.** A thumbs up/down, a "regenerate," a copy-to-clipboard, an edit-before-sending, a support ticket — these are real signals of quality your offline set can't fake. Feed them back into the loop.
- **Close the loop.** When monitoring or feedback surfaces a failure, that case becomes a new eval row. Production *finds* the gaps; the eval set *remembers* them. That circle — offline catches regressions, production catches the unknown, and the unknown becomes part of offline — is the whole quality system.

```text
   OFFLINE EVALS                    PRODUCTION
   ─────────────                    ──────────
   fixed input set                  real, novel inputs
   catches regressions      ◀────▶  catches the unknown unknowns
   run before you ship              watched after you ship
        ▲                                │
        └──── new failure becomes ───────┘
                a new eval row
```

*What just happened:* The two halves feed each other. Offline evals stop you from re-breaking known cases; production tells you about cases you never imagined; and every new production failure graduates into the offline set so it's covered from then on.

## For builders

The minimum viable habit: a committed eval file, a script that runs it and prints the score, and a rule that *no prompt or model change merges without a before/after run pasted into the change*. That alone puts you ahead of most teams shipping AI features. Layer monitoring on once you're live — even a thumbs-up button and logged inputs — and pipe every real failure back into the eval set. You don't need a platform; you need the loop to actually close.

## Recap

1. **Run the eval on every change** — establish a baseline, re-run after editing, and compare. The diff replaces the vibe.
2. **Read which rows flipped, not only the total** — a higher aggregate can hide a broken critical case.
3. **Never swap models on the announcement alone** — run your eval on the new model first, expect to re-tune the prompt, and track cost and latency too.
4. **Save every run** so quality is a trend tied to specific prompt and model versions, and a drop always has a suspect.
5. **Offline evals catch regressions; production monitoring and user feedback catch the unknown** — and every real failure becomes a new permanent eval row.

You now have the full loop: a real input set, a way to grade it, and the habit of running it before every change while watching production after. That's the difference between hoping your AI feature works and knowing it does.

```quiz
[
  {
    "q": "After a prompt change, your eval goes from 27/30 to 28/30. What should you do before shipping?",
    "choices": [
      "Ship — the number went up",
      "Inspect which rows flipped in both directions, in case important cases broke",
      "Revert — any change is risky",
      "Delete the failing rows so it reads 30/30"
    ],
    "answer": 1,
    "explain": "A higher total can hide regressions: you may have fixed easy rows and broken important ones. Always check what moved, not just the net."
  },
  {
    "q": "A provider ships a newer, cheaper model. What's the safe way to adopt it?",
    "choices": [
      "Swap it in immediately because newer is better",
      "Trust the provider's benchmark scores",
      "Run your own eval on it first, expect to re-tune the prompt, and track cost and latency",
      "Wait a year for reviews"
    ],
    "answer": 2,
    "explain": "Better on general benchmarks isn't better on your task; run your eval, re-tune, and watch cost and latency before switching."
  },
  {
    "q": "What's the key limit of offline evals, and what complements them?",
    "choices": [
      "They're too slow; nothing complements them",
      "They only sample past inputs, so production monitoring and user feedback catch the unknowns — which then become new eval rows",
      "They're perfect and need nothing else",
      "They replace the need to ever look at production"
    ],
    "answer": 1,
    "explain": "Offline evals cover inputs you've collected; production monitoring and feedback catch novel cases, and those failures feed back into the eval set."
  }
]
```

[← Phase 2: How to Actually Grade Output](02-how-to-grade-output.md) · [Guide overview](_guide.md)
