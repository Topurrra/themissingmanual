---
title: "Where Data People Fit"
guide: "ml-basics-for-data-people"
phase: 3
summary: "The unglamorous truth: ML lives or dies on data - clean inputs, good features, leak-free splits, reliable pipelines. The model is the easy part, and that's exactly where a data person is most valuable."
tags: [machine-learning, data-quality, data-leakage, feature-engineering, data-pipelines, garbage-in-garbage-out]
difficulty: intermediate
synonyms: ["why do ml projects fail", "what is data leakage in machine learning", "garbage in garbage out machine learning", "where do data analysts fit in ml", "data quality for machine learning", "is the model the hard part of ml"]
updated: 2026-07-10
---

# Where Data People Fit

Here's the truth practitioners learn the hard way, the one nobody puts on the recruiting slides: **machine learning lives or dies on the data.** The model is the easy part. The hard part is the part you already do.

If you take one thing from this guide, take this: the bottleneck in real ML is almost never "we need a smarter algorithm." It's "our data is messy, our features are weak, our pipeline broke, or something leaked." Every one of those is a data problem - not a consolation prize, the main event, and you're already standing on it.

## Garbage in, garbage out

⚠️ **Garbage in, garbage out.** A model learns whatever patterns are in the data you feed it - including the wrong ones. It cannot tell the difference between a real signal and a data-entry mistake. Feed it dirty data and it will faithfully, confidently learn nonsense.

This phrase is old because it's true, and ML makes it sharper than ever. Consider what "garbage" quietly looks like in the data you handle:

- A column where "unknown" was recorded as `0`, so the model treats missing-info customers as if they scored zero.
- A `country` field that's `"US"` in one system and `"United States"` in another - to the model, two different countries.
- Duplicated rows from a bad join, so some customers are silently counted three times and the model over-weights them.
- A label that's wrong - someone marked "churned" on customers who actually just switched plans.

None of these throw an error. The pipeline runs, the model trains, a number comes out. It's just *quietly wrong* - the most dangerous kind. Spotting these is precisely the skill you've built staring at real tables.

💡 **Key point.** A model can't be better than its data. No algorithm, however fancy, recovers signal that the data never contained or fixes labels that were wrong. Clean inputs aren't a prerequisite to the "real" ML work - they *are* the real ML work.

## Data leakage: when the model peeks at the answer

This is the subtle killer that fools smart teams, flagged briefly in Phase 2 - and the failure most likely to bite *you* specifically.

📝 **Terminology.** *Data leakage* is when information that wouldn't really be available at prediction time sneaks into the features the model trains on. In effect, the model gets to peek at the answer - so it looks brilliant in testing and collapses in production.

**What it does in real life.** Remember the churn model. Suppose one of your feature columns is `account_closed_date`. It seems innocent - it's just a date. But that date only exists for customers who *already churned*. The model quickly discovers "if `account_closed_date` is filled in, this customer churned" - which is true, and completely useless, because at the moment you actually need a prediction, that field is empty. You're trying to predict churn *before* it happens, and you accidentally handed the model a column that's only populated *after* it happens.

```text
   LEAKAGE: a feature that only exists once you know the answer

   prediction time            outcome happens
   (what you really know)      (the future)
        │                          │
        │   features should        │   ← account_closed_date
        │   come from HERE         │     gets filled in HERE
        ▼                          ▼
   ─────┼──────────────────────────┼─────► time
        │                          │
        └─ if a "feature" is       │
           secretly from the right │
           side, it has LEAKED ────┘
```

⚠️ **The model is peeking at the answer.** Leakage doesn't announce itself. The symptom is a model that performs *suspiciously* well - far better than the problem should allow. When results look too good, your first suspicion should be leakage, not genius. Ask of every feature: *"Would I genuinely have this value at the moment I need to predict?"* If the real answer is no, it leaks.

🪖 **War story.** Leakage hides in the most ordinary-looking places - timestamps that postdate the outcome, an ID that encodes when a record was created, an aggregate accidentally computed over the whole dataset (including the test rows) before the split. The person most likely to catch it is whoever understands where each column *comes from* and *when it's populated*. That's the data person. Not the modeler. You.

## Leak-free splits and reliable pipelines

Two more places where the data person is the last line of defense:

**Leak-free splits.** Phase 2's train/test split only protects you if it's done cleanly. A common slip: computing something across *all* the data - an average, a normalization, a fill-in value - *before* splitting, so information from the test rows bleeds into the training step. The split has to come first, and the test set must stay genuinely untouched. Getting this right is data discipline, not modeling cleverness.

**Reliable pipelines.** A model in production is fed by a **pipeline** - the plumbing that pulls data, cleans it, builds features, and delivers them to the model, over and over, automatically. If that plumbing silently changes - a source table renames a column, an upstream job starts emitting nulls, a currency switches from dollars to cents - the model keeps producing predictions, just *wrong* ones, with no error and no warning.

⚠️ **A model that's still running is not the same as a model that's still right.** Models degrade quietly when their input data drifts. The only defense: watch your data, validate it, alert when it changes - see [Data Quality and Observability](/guides/data-quality-and-observability), because in production that *is* the ML work.

## So where do you fit? Closer to the center than you think

Step back and look at the whole workflow with clear eyes:

```text
   THE REAL WEIGHTING OF AN ML PROJECT

   data sourcing & cleaning   ████████████████
   feature engineering        ████████████
   leak-free splitting        ██████
   the model / algorithm      ███
   monitoring the pipeline    ████████████████

   (illustrative - proportions vary by project, but the
    shape is real: the data work dwarfs the modeling)
```

Notice where "the model / algorithm" sits. The glamorous part is the smallest part. Everything large is data work - sourcing, cleaning, shaping, guarding, watching. Those are *your* skills, and they're the ones a project can't survive without.

💡 **Key point.** You don't need to be a mathematician to be essential to ML. Bring clean inputs, thoughtful features, trustworthy splits, and reliable pipelines - and be the person who asks "wait, where does that column actually come from?" That question has saved more ML projects than any algorithm.

## Recap

1. ML **lives or dies on data** - the model is the easy part. The hard, decisive work is the data work you already do.
2. **Garbage in, garbage out**: a model faithfully learns whatever's in the data, including the mistakes - and they rarely throw errors.
3. **Data leakage** is the subtle killer: a feature that's only known *after* the outcome makes the model look brilliant in testing and useless in reality. Suspiciously good results mean *check for leakage*.
4. Keep splits **leak-free** (split before you compute anything across the data) and pipelines **reliable** (a running model can be silently wrong as its inputs drift).
5. The data person sits **closer to the center** of ML than the job titles suggest.

## Where to go from here

You now have the working model: ML learns from data, the workflow runs features → split → train → evaluate, and it all rests on data quality.

Neural networks, deep learning, and today's large language models are their own territory - watch for a future **ai-ml** category. Everything here about leakage, quality, and rigorous evaluation carries straight into it; the tools get bigger, the truth that data decides the outcome does not.

For now, double down on the foundations: [What Is Data Engineering](/guides/what-is-data-engineering) for the pipelines that feed ML, and [Data Quality and Observability](/guides/data-quality-and-observability) for keeping those inputs trustworthy.

---

[← Guide overview](_guide.md) · [Phase 1: What ML Actually Is →](01-what-ml-actually-is.md)
