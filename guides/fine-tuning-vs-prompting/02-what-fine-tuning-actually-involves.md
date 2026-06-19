---
title: "What Fine-Tuning Actually Involves"
guide: "fine-tuning-vs-prompting"
phase: 2
summary: "The real work of fine-tuning: building a curated dataset of high-quality example pairs (where most of the cost lives), running the training, hosting and serving the tuned model, the lighter LoRA approach, and how you'd actually know if it worked."
tags: [fine-tuning, dataset, training, lora, evaluation, llm, hosting]
difficulty: advanced
synonyms: ["how does fine-tuning work", "what does fine-tuning cost", "fine-tuning dataset how many examples", "what is lora fine-tuning", "how to evaluate a fine-tuned model", "fine-tuning effort"]
updated: 2026-06-19
---

# What Fine-Tuning Actually Involves

If you've decided (or are tempted) to fine-tune, here's the part the demos skip: what it actually takes, day
to day, and where the cost really lives. Spoiler — it's almost never the training run. The training is a
button. The hard part is everything around it.

Knowing the real shape of the work is what stops you from saying "yes" in a meeting and discovering three
weeks later that the expensive part hadn't even started. Let's walk the whole pipeline honestly.

## The pipeline, end to end

Four stages, and they are wildly unequal in effort:

```text
   ┌──────────────────┐   ┌────────────┐   ┌──────────────┐   ┌──────────────┐
   │  1. THE DATASET  │──►│ 2. TRAINING│──►│ 3. HOSTING / │──►│ 4. EVALUATION│
   │ curated examples │   │  the run   │   │   SERVING    │   │  did it work?│
   └──────────────────┘   └────────────┘   └──────────────┘   └──────────────┘
        ▲▲▲▲▲▲▲▲▲▲              ▲                  ▲▲                ▲▲▲
     where the real cost     mostly a         ongoing, not       skip this and
        actually lives        button          one-and-done     you're flying blind
```

The widest part of that diagram is stage 1, and that's not an accident.

## Stage 1 — The dataset (this is the real cost)

**What it actually is.** A fine-tuning dataset is a collection of example pairs: an input, and the *exact*
output you wish the model had produced. Not roughly. Exactly. Each pair is a demonstration of the behavior
you're trying to make default. You'll typically want hundreds at a minimum and often thousands, and every one
of them has to be *good*.

**What it does in real life.** This is where weeks go. Someone — usually someone who understands the domain,
not a junior with a spare afternoon — has to gather real inputs, write or clean up the ideal outputs, make
them consistent with each other (same tone, same format, same conventions across all of them), and check them.
Inconsistent examples teach the model an inconsistent habit. The dataset *is* the product; the model just
absorbs whatever's in it.

**The gotcha — garbage in, garbage model.** ⚠️ This is the single most important sentence in this guide:
**a fine-tuned model is only as good as its training data, and bad data is worse than no fine-tuning at all.**
If your examples contradict each other, contain mistakes, or aren't actually in the voice you want, you won't
get a mediocre model — you'll get a model that has *confidently learned the wrong habit*, and it'll be harder
to debug than a base model, because the bad behavior is now baked into the weights instead of sitting in a
prompt you can edit. Curation is not the boring prerequisite. Curation is the job.

**Why this saves you later.** When you scope a fine-tuning project, scope the *dataset* first and honestly. If
nobody on the team has the time or the domain knowledge to produce a few thousand consistent, high-quality
examples, you don't have a fine-tuning project yet — you have a data project wearing a fine-tuning costume.
Better to learn that on day one.

## Stage 2 — The training run

**What it actually is.** You hand your dataset to a training process — through your model provider's
fine-tuning API, or your own setup if you're hosting open-weight models — and it adjusts the weights over a
number of passes through your data. With a hosted provider, this is genuinely close to "upload file, click
start, wait."

**What it does in real life.** It runs for a while (minutes to hours, depending on dataset size and model) and
hands you back a tuned model you can call like any other. The compute has a real but usually modest cost
relative to the human cost of stage 1. This is the stage people *picture* when they think "fine-tuning," and
it's the easiest stage by far.

**The gotcha.** A training run that completes without errors is not a training run that succeeded. "It
finished" tells you nothing about whether the model got *better* — it only tells you the machinery ran. The
two failure modes to know by name:

📝 **Overfitting.** When a model memorizes your training examples instead of learning the general behavior
behind them. It nails inputs it has seen and falls apart on anything slightly different — like a student who
memorized the practice exam instead of understanding the subject.

📝 **Catastrophic forgetting.** When fine-tuning hard on a narrow task degrades the general abilities the model
used to have. You taught it your support voice so intensely that it got worse at basic reasoning. The cure is
usually a lighter touch — which is exactly what the next section is about.

## Stage 3 — Hosting and serving (the part people forget)

**What it actually is.** A fine-tuned model is *yours* now, which means it has to live somewhere and be served
to your application. With a hosted provider this is mostly handled — you call your tuned model by its ID. With
open-weight models you're running on your own, you own the serving infrastructure: the GPUs, the scaling, the
uptime.

**What it does in real life.** This is the cost that doesn't show up in the proof-of-concept and never goes
away. A base model from a provider is shared infrastructure — you pay per call and someone else keeps it
running. The moment the model is custom-tuned for you, the economics shift toward *you* (directly, or folded
into per-call pricing for hosted tuned models). It's an ongoing line item, not a one-time setup.

**The gotcha.** Teams budget for the training and forget the serving. "We fine-tuned it" is the start of an
operational commitment, not the end of a project. Factor in who keeps the tuned model running, and what it
costs to keep it running, *before* you commit.

## A lighter way in — LoRA and parameter-efficient tuning

Full fine-tuning — rewriting all of a model's weights — is heavy: expensive to train and a whole model to
store and serve per variant. Most teams don't do that. They use **parameter-efficient fine-tuning**, and the
one name you'll hear most is **LoRA**.

📝 **LoRA (Low-Rank Adaptation).** Instead of editing all the model's weights, LoRA freezes the original model
and trains a small set of *new* weights — an "adapter" — that ride alongside it and adjust its behavior. You
train far fewer numbers, so it's cheaper and faster, and the adapter is a small file you can attach to the
base model rather than a whole new copy of it.

**Why this matters for your decision.** LoRA lowers the cost and the lock-in of fine-tuning meaningfully. It
also softens catastrophic forgetting, because the original model is left intact underneath the adapter. If
you've honestly decided to fine-tune, parameter-efficient methods like LoRA are usually where to start rather
than full fine-tuning — you get most of the benefit for a fraction of the cost and commitment. (The exact
mechanics are an implementation detail beyond this guide; what you need here is that "fine-tuning" doesn't
have to mean "retrain the whole model.")

## Stage 4 — Evaluation: how you'd actually know it worked

**What it actually is.** A held-back set of test cases — inputs you did *not* train on, plus a way to judge the
outputs — that tells you whether the tuned model is genuinely better than what you had before. "Before" means
the honest baseline: your best prompt on the base model.

**What it does in real life.** You run the same test inputs through (a) your best-prompted base model and (b)
your fine-tuned model, and you compare. Did the format get more consistent? Did the voice match? Did general
ability survive (no catastrophic forgetting)? Without this, you have a vibe, not a result — and "it feels
better" is not something you can take to a review or defend in six months.

**The gotcha.** ⚠️ Evaluate against the *prompted base model*, not against a naked, un-prompted model. The
fair question is never "is the tuned model better than nothing?" — it's "is the tuned model better than the
cheapest thing I could have done instead?" Skip that comparison and you can convince yourself fine-tuning won
when a good prompt would have tied it for a fraction of the cost.

## Recap

1. Fine-tuning is four stages — **dataset, training, hosting, evaluation** — and they're wildly unequal in
   effort.
2. **The dataset is the real cost.** Hundreds to thousands of consistent, high-quality, exact example pairs,
   built by someone with domain knowledge.
3. **Garbage data makes a confidently wrong model** that's harder to fix than a base model. Curation is the
   job, not the prerequisite.
4. **The training run is mostly a button**; "it finished" doesn't mean "it worked." Watch for overfitting and
   catastrophic forgetting.
5. **Hosting/serving is an ongoing cost** people forget to budget for. **LoRA** and parameter-efficient
   methods make fine-tuning cheaper and lower lock-in.
6. **Evaluate against your best-prompted base model**, not against nothing.

You now know what the lever actually costs to pull. The final phase turns all of this into a decision you can
make — and defend — in the right order.

---

[← Phase 1: Three Ways to Steer a Model](01-three-ways-to-steer-a-model.md) · [Guide overview](_guide.md) · [Phase 3: Choosing — the Honest Order →](03-choosing-the-honest-order.md)
