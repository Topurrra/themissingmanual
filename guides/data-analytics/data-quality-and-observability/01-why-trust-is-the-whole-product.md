---
title: "Why Trust Is the Whole Product"
guide: "data-quality-and-observability"
phase: 1
summary: "The mental model: data can be broken even when the job is green. A silent data bug — wrong numbers from a pipeline that 'succeeded' — is worse than a loud crash, because nobody knows to look until a decision is made on it."
tags: [data-quality, observability, mental-model, silent-failures, data-trust, data-engineering]
difficulty: advanced
synonyms: ["pipeline succeeded but data wrong", "silent data bug", "why is data quality important", "green job bad data", "data can be broken even when job succeeds", "what does data trust mean", "garbage in garbage out pipeline"]
updated: 2026-07-10
---

# Why Trust Is the Whole Product

Before any checks or tools, let's fix one idea, because every technique later in this guide exists to
serve it: **the product of a data pipeline is not a successful job. It's a number someone can trust.**

You can have a flawless pipeline — clean code, fast runs, a wall of green in the orchestrator — and still be
doing active harm, if the numbers coming out the far end are wrong and people believe them. The job
succeeding tells you the *machinery* ran; it tells you nothing about whether the *output is true*. Those
are two completely different questions, and conflating them is the single most expensive mistake in data
work.

## The two questions a pipeline answers (and only one of them is the green checkmark)

Every pipeline run silently answers two separate questions:

1. *Did the job run to completion?* — Did the code execute, did the queries return, did the load finish
   without throwing?
2. *Is the data it produced correct?* — Are the rows there, are they fresh, do the values make sense, do
   the totals match reality?

The green checkmark in your orchestrator only ever answers question 1. It is a statement about the
*process*, not the *product*. Nothing about "exit code 0" inspects whether the numbers are right.

```text
   What the green check means              What it does NOT mean
   ────────────────────────────────       ────────────────────────────────
   the code ran without throwing     │     the rows are actually there
   the queries returned              │     the values are correct
   the load finished                 │     the data is up to date
   exit code 0                       │     the totals match reality
   ─────────────────────────────────────────────────────────────────────
   "the machine ran"                 │     "the output is true"
```

We borrow our instincts from application code, where failures are loud — a web request that breaks throws a
500, a null pointer crashes the process, you *find out*. So we assume the same of data: if something were
wrong, surely it would fail. But data pipelines mostly don't work that way. Bad data is usually *valid*
data — it's the right type, it parses, it loads. A column that should be `1000.00` but arrives as `0.00` is
a perfectly well-formed number. A table that should have a million rows but got ten thousand is a perfectly
well-formed table. The machinery has no opinion about whether the content is true; it just moves it.

Once you accept that "green" and "correct" are different questions, data quality stops feeling like
overhead and starts feeling necessary. Phase 2 exists precisely because the orchestrator can't answer
question 2 for you — *you have to add the checks that do.*

## A silent data bug is worse than a loud crash

This is the part that surprises people, so let's state it plainly: when it comes to data, **a crash is the
good outcome.** Counterintuitive, but true, and worth internalizing.

A loud failure — the job crashes, the load aborts, the orchestrator turns red — announces itself. Someone
gets paged. The bad data never reaches a dashboard, because the run didn't finish; the blast radius is
contained to "the table is stale," which is visible and fixable.

A silent failure does the opposite. The job *succeeds*, the bad data flows all the way to the dashboards
and the reports and the models, and there is no signal anywhere that something is wrong. The only way it
surfaces is when a human eventually notices the number looks off — and by then it may have already shaped a
decision.

```text
   LOUD FAILURE (the good kind)            SILENT FAILURE (the nightmare)
   ─────────────────────────────          ──────────────────────────────
   job goes red                     │      job goes green
   someone is paged                 │      nobody is notified
   bad data never ships             │      bad data flows everywhere
   "the table is stale" (visible)   │      "the number is wrong" (invisible)
   found in minutes                 │      found in days — after a decision
```

**A real example.** Picture a daily revenue pipeline. An upstream API changes, and the `amount` field
starts arriving as `null` for a slice of orders. Nothing crashes — `null` is a valid value. The transform
sums revenue, and `SUM` in SQL ignores nulls:

```console
$ # What the pipeline computed
SELECT SUM(amount) AS revenue FROM orders WHERE day = '2026-06-18';
   revenue
 -----------
   842150.00
(1 row)

$ # What was actually true (nulls counted as the zeros they should have been)
SELECT SUM(COALESCE(amount, 0)) + (missing revenue, uncounted) ...
   revenue
 -----------
   958320.00   -- the real figure
```

*What just happened:* The pipeline didn't error — it did exactly what it was told. `SUM` skipped the
`null` rows, so revenue came out lower than reality, by however much those nulled-out orders were worth.
The job was green. The dashboard updated. And the only thing wrong was the *truth* of the number, which no
exit code checks. Someone reading that dashboard has no way to know the figure is missing a chunk of real
orders.

⚠️ **Gotcha — "garbage in, garbage out" is not an excuse, it's a warning.** It's tempting to wave off bad
output as "well, the source was bad." But your pipeline is the last place that bad source data can be
*caught* before a human trusts it. If you pass garbage through silently, you've laundered it: the source's
mistake now wears your pipeline's credibility. Catching bad input is your job, not the source's.

This is why you'll spend real effort on the next two phases. You're not adding checks to make the pipeline
*run* — it already runs. You're adding them to convert silent failures into loud ones *on purpose*, so
wrong data trips a wire and turns the job red instead of slipping quietly onto a dashboard. The whole game
of data quality is **buying back the loud crash you'd normally get for free in application code.**

## Trust is fragile and slow to rebuild

One more piece of the model, because it explains why this matters beyond any single bug.

Trust in a data platform is asymmetric. It takes months of correct numbers to build, and a single bad
number — caught publicly, in a meeting, after a decision — to destroy. Once a stakeholder has been burned by
a wrong figure, they stop trusting *all* your numbers, not just the broken one, and go back to their own
spreadsheets. At that point the pipeline can be technically perfect and still be worthless, because nobody
believes it.

Every other part of this guide — the freshness checks, the lineage graphs, the alerts, the SLAs — is in
service of one outcome: that when someone looks at a number you produced, they can act on it without
second-guessing. That confidence *is* the product; the pipeline is just the machinery that delivers it. A
pipeline nobody trusts is a very expensive way to compute numbers people then ignore.

💡 **Key point.** The deliverable of data engineering is not a running pipeline. It's *justified trust* in
the numbers. Green means the machine ran; it never means the output is true. Your job in the next two
phases is to make "is the output true?" a question the pipeline answers automatically — and answers
*loudly* when the answer is no.

## Recap

1. Every pipeline run answers **two separate questions** — "did the job run?" and "is the data correct?"
   The **green checkmark only ever answers the first.**
2. Bad data is usually **valid** data: right type, parses fine, loads fine. The machinery has no opinion
   about whether the content is *true*, so wrong numbers don't crash anything.
3. A **silent data bug is worse than a loud crash**, because a crash contains the damage and pages someone,
   while a silent failure ships wrong numbers everywhere and is only found when a human notices — often
   after a decision.
4. The goal of data quality is to **convert silent failures into loud ones on purpose** — to buy back the
   crash you'd get for free in application code.
5. **Trust is the product.** It's slow to build, fast to lose, and once gone the pipeline is worthless even
   if it runs perfectly.

Next, the concrete part: the specific dimensions of data worth testing automatically, and where to put the
checks so they fail the run *before* bad data spreads.

---

[← Guide overview](_guide.md) · [Phase 2: Data Quality Checks →](02-data-quality-checks.md)
