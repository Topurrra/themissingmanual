---
title: "How to Actually Grade Output"
guide: "evaluating-llm-output"
phase: 2
summary: "The three ways to score model output — exact and rule-based checks, reference-based metrics, and LLM-as-judge — with where each one fits and where each one lies to you."
tags: [evals, grading, llm-as-judge, metrics, rules, testing]
difficulty: intermediate
synonyms: ["how to grade llm output", "llm as a judge", "rule based eval", "reference based metric", "exact match eval", "how to score model output", "automated llm evaluation"]
updated: 2026-06-30
---

# How to Actually Grade Output

You've got your input set from Phase 1. Now the real question: for each output, how does a *machine* decide pass or fail, so you can run the whole set without re-reading every line by hand?

There isn't one answer, because "correct" means different things for different tasks. Extracting a date has one right answer; summarizing an article has a thousand acceptable ones. So you reach for one of three grading methods, from cheapest-and-strictest to most-flexible-and-fuzziest. The skill is matching the method to the task — and knowing exactly how each one can fool you.

## Method 1: Exact and rule-based checks

**What it is.** Code that inspects the output and returns true or false. Exact match (`output == expected`), or looser rules: does it contain this substring, parse as valid JSON, fall in this set of allowed values, match this regex, stay under this length?

**When it fits.** Any task with a constrained, checkable answer:

- **Classification** — the intent should be exactly `account_access`. Exact match.
- **Extraction** — the pulled-out date should equal `2026-03-14`. Exact match.
- **Format / structure** — it must be valid JSON with these fields, or it must not contain a phone number. Rule check.

```python
def grade(output: str, row: dict) -> bool:
    # must be one of the allowed intents, and exactly the expected one
    if output.strip() not in {"account_access", "billing", "other"}:
        return False
    return output.strip() == row["expected_intent"]

print(grade("account_access", {"expected_intent": "account_access"}))  # True
print(grade("Account Access!", {"expected_intent": "account_access"})) # False
```

*What just happened:* The grader returned a hard pass/fail with zero ambiguity and zero cost — perfect for classification. Note the second case fails on a trailing `!` and capitalization: that's the method working as designed, not a bug. Exact checks are unforgiving, which is their strength and their trap.

**Where it lies to you.** It can't see meaning. "Yes." and "Absolutely, that's correct." are the same answer to a human and a fail/pass split to exact match. The moment the acceptable output is a *range* of phrasings — any summary, any explanation, any chat reply — exact match either rejects good answers or you loosen it into uselessness.

💡 **Key point.** Always reach for rule-based first. It's free, instant, deterministic, and never argues. Use it for everything it *can* cover, and only escalate to the fuzzier methods for the parts it genuinely can't.

## Method 2: Reference-based metrics

**What it is.** You write down one or more *reference* (gold) answers and score how close the model's output is to them, using a similarity measure rather than exact equality. The crude classic is word overlap; the modern version compares meaning by turning both texts into vectors and measuring how close they point — semantic similarity.

**When it fits.** Tasks where there's a known good answer but the exact words can vary — translation, short factual answers, "did the summary capture the same key points as the reference summary?"

```text
output:    "The deploy failed because the database migration timed out."
reference: "Deployment broke due to a database migration that timed out."

word-overlap score:    moderate  (different wording trips it up)
semantic similarity:   high      (same meaning, scored as close)
```

*What just happened:* Two sentences that mean the same thing get a mediocre word-overlap score but a high semantic-similarity score. That gap is the whole reason semantic measures exist: they grade what was *said*, not which exact words were used.

**Where it lies to you.** Three ways, and they bite:

- **A score isn't a verdict.** Reference methods give you a number like `0.82`, not a pass/fail. You have to pick a threshold, and that threshold is a judgment call you can get wrong.
- **High similarity can still be wrong.** An output can be semantically close to the reference and yet have flipped a critical fact — "the migration *succeeded*" is very similar to "the migration *failed*" by overlap, and disastrously different in truth.
- **It's only as good as your reference.** A mediocre gold answer rewards mediocre outputs and punishes ones that are actually *better* than your reference. Garbage reference in, garbage score out.

⚠️ **Gotcha.** Treat reference scores as a signal, not a referee. They're great for catching big drops ("similarity fell off a cliff after this prompt change") and weak at certifying any single output as correct. Don't let a green number lull you past a flipped negation.

## Method 3: LLM-as-judge

**What it is.** You use a *second* model call to grade the first. You give a judge model the input, the output, and a rubric ("Score 1–5 on whether the answer is helpful, grounded in the provided context, and free of invented facts"), and it returns a score and a reason.

**When it fits.** The fuzzy, open-ended tasks the other two methods can't touch — "is this summary good?", "is this reply polite and on-brand?", "does this answer actually address the question?" When acceptable output is a wide range and you can articulate *what good looks like* in words, a judge can apply that rubric across hundreds of outputs far faster than you can.

```text
JUDGE PROMPT (sketch)
─────────────────────
You are grading a support reply. Given the user message and the reply,
score 1–5 on each: groundedness, helpfulness, tone.
A reply that invents facts scores 1 on groundedness regardless of tone.
Return JSON: {"groundedness": n, "helpfulness": n, "tone": n, "why": "..."}
```

*What just happened:* You encoded your definition of "good" into a rubric a model can apply at scale. The judge isn't smarter than you — it's *you, written down and run a thousand times*, which is exactly the leverage Phase 1 promised.

**Where it lies to you — and this is the big one.** The judge is itself an LLM, so it inherits every flaw you're trying to measure:

- **It can be confidently wrong** about the grade, the same way the thing it's grading can be.
- **It has biases.** Many judges favor longer, more confident-sounding answers, or favor an answer that's positioned first, or rate their own model's style highly. A flattering output can score well for being flattering.
- **A vague rubric gets vague grades.** "Rate the quality 1–10" gives you noise. Specific, behavior-anchored criteria ("invents facts → groundedness = 1") give you something repeatable.

🪖 **War story.** A team automated grading with a judge and watched scores climb release after release — then a customer flagged answers that were polished, friendly, and *wrong*. The judge had a length-and-confidence bias; the prompt changes had been making outputs longer and more assertive, not more correct, and the judge happily rewarded that. The fix was twofold: tighten the rubric to score groundedness explicitly, and **validate the judge against a small human-graded set** to confirm it agreed with people before trusting it on the rest.

💡 **Key point.** Before you trust an LLM judge, grade a few dozen outputs *by hand*, then have the judge grade the same ones, and check that they agree. If the judge disagrees with humans, fix the rubric — don't ship a grader you haven't graded.

## Choosing a method

You'll usually use more than one. A single eval row can be checked by rules *and* a judge.

```text
Task shape                          Reach for
──────────                          ─────────
one exact right answer        ──▶   rule-based / exact match
known answer, wording varies  ──▶   reference-based (as a signal)
open-ended, "is it good?"     ──▶   LLM-as-judge (validated)
```

*What just happened:* The grading method follows the *shape* of the task, not your preference. Default to the cheapest method the task allows — rules over references over judges — and only climb to fuzzier, costlier, more-fallible grading when the task genuinely demands it.

## For builders

Layer them. Run the rule checks first as a hard gate (valid JSON? required field present? not over length?) — those are free and catch the dumb breakages instantly. Only send the outputs that *pass* the gate to a judge for the fuzzy quality score, since judge calls cost tokens and time. And keep a small human-graded sample as ground truth to periodically check that your judge still agrees with actual humans. The grader is code; like any code, it can rot, and an eval you trust blindly is vibes with extra latency.

```quiz
[
  {
    "q": "For grading a classification task where the intent must be exactly 'billing', which method fits best?",
    "choices": [
      "LLM-as-judge with a detailed rubric",
      "Reference-based semantic similarity",
      "Rule-based / exact match",
      "Reading every output by hand"
    ],
    "answer": 2,
    "explain": "A constrained, single-correct-answer task is exactly where cheap, deterministic exact-match checks shine."
  },
  {
    "q": "What's the most important precaution before trusting an LLM-as-judge?",
    "choices": [
      "Use the largest available model as the judge",
      "Validate it against a small human-graded set and confirm it agrees with people",
      "Set the judge's temperature to zero",
      "Ask the judge to also fix the output"
    ],
    "answer": 1,
    "explain": "A judge is itself an LLM with biases; you must check it agrees with humans before trusting its scores at scale."
  },
  {
    "q": "Why are reference-based metric scores a signal rather than a verdict?",
    "choices": [
      "They are always exactly right",
      "They produce a similarity number that needs a threshold and can rate a fact-flipped answer as 'close'",
      "They only work on numbers, never text",
      "They require a human to read every output"
    ],
    "answer": 1,
    "explain": "Similarity gives a number, not pass/fail, and a flipped negation can score 'close' while being completely wrong — so treat it as a signal."
  }
]
```

[← Phase 1: Why Vibes Don't Scale](01-why-vibes-dont-scale.md) · [Guide overview](_guide.md) · [Phase 3: Evals as a Habit →](03-evals-as-a-habit.md)
