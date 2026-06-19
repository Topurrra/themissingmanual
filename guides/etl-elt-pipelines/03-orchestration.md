---
title: "Orchestration: Making It Run Reliably"
guide: "etl-elt-pipelines"
phase: 3
summary: "A real pipeline is a scheduled, multi-step job: dependencies form a DAG, steps run on a schedule with retries, and steps must be idempotent so re-runs and backfills don't double-count — because 'it ran' is not the same as 'it ran correctly.'"
tags: [orchestration, dag, scheduling, retries, idempotency, backfill, airflow]
difficulty: intermediate
synonyms: ["what is pipeline orchestration", "what is a dag in data pipelines", "how does pipeline scheduling work", "what is idempotency in data pipelines", "what is a backfill", "why did my pipeline double count", "it ran but the data is wrong", "airflow dag explained"]
updated: 2026-06-19
---

# Orchestration: Making It Run Reliably

A pipeline you run by hand, once, on your laptop is a script. A pipeline that runs every morning at 5am, in order, recovers when a step fails, and doesn't quietly corrupt your data when it re-runs — that's a *production* pipeline. The gap between those two is **orchestration**, and it's where most of the real pain (and the 6am pages) lives.

The hardest lesson in this whole field fits in one sentence: **"it ran" is not the same as "it ran correctly."** A pipeline can finish with a green checkmark and still have loaded yesterday's data twice, or skipped a source that returned nothing, or written garbage. This phase is about closing that gap — making runs both *happen* and *be right*.

## The orchestration cheat-card

> **Hit one of these? Find your situation, then read the section.**

| Situation | What's going on | Where |
|---|---|---|
| "Step B started before step A finished" | Dependencies aren't declared — orchestrator doesn't know the order | §1 |
| "The pipeline didn't run last night" | Scheduling / trigger problem, not a logic problem | §2 |
| "A step failed once then worked on retry" | Transient failure; retries are doing their job | §3 |
| "We re-ran it and now revenue is doubled" | A step isn't **idempotent** — re-running changed the result | §4 |
| "We need to reprocess the last 3 months" | That's a **backfill** — and it's only safe if steps are idempotent | §5 |
| "It's green but the numbers are wrong" | It ran ≠ it ran correctly | §6 |

---

## 1. Dependencies as a DAG — what runs after what

**What it actually is.** A real pipeline isn't one script; it's many steps, and some steps can't start until others finish. You can't transform orders before you've extracted them. You can't build the daily-revenue table before the orders *and* the products tables are both loaded. Those "must happen after" relationships form a shape called a **DAG**.

> 📝 **Terminology.** *DAG* = **Directed Acyclic Graph**. *Directed*: each arrow points one way (A then B). *Acyclic*: no loops — you can never end up depending on yourself, directly or in a circle. It's just a dependency map: "this step runs after that step."

```text
                ┌────────────────┐
                │ extract_orders │──┐
                └────────────────┘  │   ┌─────────────────┐    ┌───────────────┐
                                    ├──►│ transform_orders│──► │ daily_revenue │
                ┌────────────────┐  │   └─────────────────┘    └───────────────┘
                │ extract_products│─┘            ▲                     ▲
                └────────────────┘               │                     │
                                          needs both extracts    needs orders +
                                                                  products done
```

**What it does in real life.** You declare the dependencies, and the orchestrator (Airflow, Dagster, Prefect, and friends) figures out the order — running independent steps in parallel and waiting for prerequisites before starting dependents. You describe *what depends on what*; it handles *when*.

**Why this saves you later.** When `daily_revenue` is missing products, the DAG tells you instantly whether `extract_products` even ran before the transform tried to read it. The dependency map is also your debugging map.

## 2. Scheduling — making it run on its own

**What it actually is.** Orchestrators run pipelines on a *trigger* — most often a schedule ("every day at 5am"), sometimes an event ("when a new file lands"). The schedule is what turns a script you remember to run into infrastructure that runs itself.

**A real example.** A scheduler logging a triggered run:

```console
$ airflow dags list-runs -d orders_pipeline
dag_id          | run_id                          | state   | execution_date
================+=================================+=========+====================
orders_pipeline | scheduled__2026-06-19T05:00:00  | success | 2026-06-19T05:00:00
orders_pipeline | scheduled__2026-06-18T05:00:00  | success | 2026-06-18T05:00:00
```

*What just happened:* The scheduler fired the pipeline at 05:00 each day on its own and recorded each run with the date it was *processing data for* (`execution_date`). That date matters: a run is tied to a specific time window of data, which is what makes re-running a single day's run meaningful later.

⚠️ **Gotcha — a missed run is silent unless you watch for it.** If the scheduler is down or a trigger never fires, the pipeline doesn't fail loudly — it *doesn't run*, and your data quietly stops being fresh. "No news" is not "good news" here. You need an alert for *absence*, not only for errors.

## 3. Retries — surviving the flaky 3am failure

**What it actually is.** Networks blip. A source API times out. A database has a momentary hiccup. Many failures are *transient* — they'd succeed if you tried again. A retry policy tells the orchestrator: if a step fails, wait a bit and try again, up to N times, before giving up and alerting a human.

**What it does in real life.** A step that fails on a network timeout retries automatically; if the second attempt succeeds, nobody gets paged and the pipeline carries on. Only a step that exhausts its retries raises an alarm.

⚠️ **Gotcha — retries are only safe if the step is idempotent.** Here's the trap: a step might fail *after* it already wrote some data but *before* it reported success. The orchestrator sees a failure and retries — running the write *again*. If that step double-writes on a second run, your automatic retry just corrupted your data. Which brings us to the most important idea in this whole phase.

## 4. Idempotency — the one that bites everyone

**What it actually is.** A step is **idempotent** when running it twice produces the same result as running it once. Re-running it doesn't double-count, doesn't duplicate rows, doesn't drift — it lands on the same final state every time.

> 📝 **Terminology.** *Idempotent* — from "same" + "power." A light switch set to "off" is idempotent: flip it off twice, it's still off. Appending "+1 order" is *not* idempotent: do it twice and you've counted the order twice.

**Why this is the one that bites everyone.** Retries (§3), backfills (§5), and manual re-runs all do the same thing: **run a step again.** If a step isn't idempotent, every one of those safety mechanisms becomes a corruption mechanism. The classic disaster:

```text
  NOT idempotent (append):              IDEMPOTENT (overwrite/merge the window):

  run 1:  append today's 1,204 orders   run 1:  replace 2026-06-19 partition
          → table has 1,204                     → partition has 1,204
  run 2:  append today's 1,204 again     run 2:  replace 2026-06-19 partition again
          → table has 2,408  ✗ doubled          → partition still has 1,204  ✓
```

**The calm fix — make re-running a no-op-on-repeat.** Two common patterns:
- **Overwrite the window, don't append to it.** Have each daily run *replace* its own day's partition rather than blindly adding rows. Re-running the day's load just rewrites that day — same result every time.
- **Merge on a key (upsert).** Match on `order_id` and update-or-insert (as in Phase 1's load) so a row can't be inserted twice.

*What just happened:* By writing the *whole window* fresh instead of appending to it, you made the step safe to run any number of times. Now retries, backfills, and a nervous engineer re-running the job by hand are all harmless. Idempotency is what makes a pipeline *trustworthy under repetition* — and pipelines repeat constantly.

💡 **Key point.** Design every step so that re-running it is boring. If "what happens if this runs twice?" has a scary answer, that step is a latent outage waiting for the next retry.

## 5. Backfills — reprocessing the past

**What it actually is.** A **backfill** is running the pipeline over *historical* time windows — because you just built a new table and need the last year populated, or you fixed a transform bug and must reprocess three months with the corrected logic.

**What it does in real life.** Because each scheduled run is tied to a date window (§2), a backfill is "run the pipeline for 2026-03-01, then 2026-03-02, then …" across the range you need. Good orchestrators do this for you given a start and end date.

**A real example.** Backfilling a quarter after a transform fix:

```console
$ airflow dags backfill orders_pipeline \
    --start-date 2026-03-01 --end-date 2026-05-31
[backfill] 92 runs queued (one per day)
[backfill] 2026-03-01 ... success
[backfill] 2026-03-02 ... success
...
```

*What just happened:* The orchestrator queued one run per historical day and replayed the pipeline across the quarter with today's (fixed) code. Each day's run rewrote that day's data — *which is only safe because the load step is idempotent* (§4). Without idempotency, this backfill would have stacked a second copy of three months of data on top of the first.

⚠️ **Gotcha — a backfill on a non-idempotent pipeline is a self-inflicted disaster.** It's the highest-volume way to trigger the double-count bug, because you're deliberately re-running hundreds of windows. Never backfill a pipeline whose steps aren't idempotent — fix the idempotency first.

## 6. "It ran" is not "it ran correctly"

You've now got dependencies, scheduling, retries, idempotency, and backfills. The pipeline runs itself and survives re-runs. And it can *still* be wrong.

A green checkmark only means *the code finished without throwing an error*. It does **not** mean:
- the source actually returned data (an empty pull "succeeds" and loads nothing);
- the numbers are right (a transform bug runs cleanly and produces wrong results);
- nothing upstream changed (a renamed source column can pass silently, then quietly null out a field).

```text
   "it ran"                          "it ran CORRECTLY"
   ─────────                         ──────────────────
   ✓ no errors thrown                ✓ no errors thrown
   ✓ all steps green             +   ✓ rows actually arrived (not zero)
                                  +   ✓ values pass sanity checks
                                  +   ✓ totals reconcile with the source

   orchestration gives you          data quality / observability
   the LEFT column                  gives you the RIGHT column
```

This is the boundary of orchestration. Making a pipeline *run reliably* is necessary but not sufficient; making sure what it produced is *trustworthy* — row-count checks, freshness alerts, schema monitoring, reconciliation — is a discipline of its own.

> That discipline has its own guide: [Data Quality & Observability](/guides/data-quality-and-observability). If this phase made you slightly paranoid about green checkmarks, that's the correct instinct — and that's where you take it next.

## Recap

1. **Dependencies form a DAG** — declare what runs after what; the orchestrator handles order and parallelism.
2. **Scheduling** runs the pipeline on its own — and a *missed* run is silent, so alert on absence.
3. **Retries** survive transient failures — but are only safe on idempotent steps.
4. **Idempotency** is the keystone: running a step twice must equal running it once (overwrite the window or merge on a key). It's what makes retries, backfills, and re-runs safe.
5. **Backfills** replay history over date windows — safe *only* when steps are idempotent.
6. **"It ran" ≠ "it ran correctly"** — a green run can still be empty or wrong; trusting the output is the job of [Data Quality & Observability](/guides/data-quality-and-observability).

You now have the full shape of moving and shaping data: the three stages, the order trade-off, and what it takes to run the whole thing reliably. From here, the two natural next steps are *where the data lands* ([Warehouses vs. Lakes](/guides/warehouses-vs-lakes)) and *how to trust it once it's there* ([Data Quality & Observability](/guides/data-quality-and-observability)).

---

[← Phase 2: ETL vs ELT](02-etl-vs-elt.md) · [Guide overview](_guide.md)
