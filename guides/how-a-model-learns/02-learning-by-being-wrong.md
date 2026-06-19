---
title: "Learning by Being Wrong"
guide: "how-a-model-learns"
phase: 2
summary: "Training is a loop: the model predicts, we measure how wrong it was (the loss), we nudge the weights to make it a little less wrong, and we repeat over millions of examples."
tags: [ai-ml, machine-learning, training, loss, gradient-descent, epochs, beginner-friendly]
difficulty: beginner
synonyms: ["how does training actually work", "what is loss in machine learning", "what is gradient descent in plain english", "what is an epoch", "why do models need so much data", "how do weights get updated"]
updated: 2026-06-19
---

# Learning by Being Wrong

In Phase 1 we said training "nudges the weights until the predictions are good." That's true, but it
skips the interesting part: *how does the model know which way to nudge?* It can't see the right answer
and copy it. All it can do is guess, find out how badly it missed, and adjust.

That's the whole thing, and it's worth saying plainly: **a model learns by being wrong, over and over,
and being slightly less wrong each time.** This phase walks the loop in plain words.

## The training loop

**What it actually is.** Training is a four-step cycle repeated an enormous number of times. Each pass
takes one example whose answer we already know, and uses the gap between the guess and the truth to
improve the model.

```text
   ┌─────────────────────────────────────────────────────────┐
   │                                                         │
   │   1. PREDICT      take an example, run it through       │
   │                   the current weights → a guess        │
   │                                                         │
   │   2. MEASURE      compare the guess to the known        │
   │                   answer → how wrong? (the "loss")      │
   │                                                         │
   │   3. NUDGE        adjust the weights a little so this   │
   │                   guess would have been less wrong      │
   │                                                         │
   │   4. REPEAT  ─────────────────────────────────────►    │
   │              with the next example, millions of times   │
   └─────────────────────────────────────────────────────────┘
```

We'll take the steps that need a name one at a time.

## Step 2: Measuring how wrong — the loss

**What it actually is.** After the model guesses, we compare its guess to the real answer and boil the
difference down to a single number: how wrong was that? That number is the **loss**.

📝 **Terminology.** **Loss** is a score for *badness*. High loss = the guess was far off. Low loss = the
guess was close. Training's entire goal, stated honestly, is to make the loss as small as possible
across all the examples.

**A real example.** Back to the house-price model from Phase 1:

```text
   House: 1,500 sq ft     real price: $410,000
   Model's guess:         $250,000
   Miss:                  $160,000 off   ──►  large loss
```

*What just happened:* We didn't tell the model the answer to memorize. We told it *how far off* it was —
a single number summarizing the miss. That number is the signal the next step needs. A guess of
$400,000 would produce a small loss; a guess of $38,000 would produce a huge one.

## Step 3: Nudging the weights — "roll downhill"

**What it actually is.** Once we have the loss, we adjust each weight a tiny bit in whatever direction
makes the loss smaller. Do that and the model's next guess on a similar example will be a little better.

Here's the mental model that does all the heavy lifting. Picture the loss as a landscape of hills and
valleys. High loss is a hilltop (bad); low loss is a valley (good). Every possible setting of the
weights is a spot on that landscape, and you want to get downhill, toward less wrongness.

```text
   loss
   (badness)
     high  \                         the model starts up here,
            \      .                  guessing badly
             \    / \
              \  /   \      each nudge = one small step downhill
               \/     \
                       \___        ◄── lower loss = better model
                           \____
     low                        \____  goal: settle near the bottom
            (different weight settings →)
```

📝 **Terminology.** Rolling downhill on this loss landscape — taking small steps in the direction that
reduces the loss — is called **gradient descent**. That's the actual name for the math you don't need.
The intuition is exactly the picture above: feel which way is downhill, take a small step, repeat.

**The gotcha.** ⚠️ The steps are deliberately *small*. If the model lunged all the way to "perfect" on
one example, it would lurch around and never settle — getting example #1 right by getting #2 badly
wrong. So each nudge is gentle, which means it takes a great many examples to settle into weights that
are good for *all* of them at once. That gentleness is the direct reason the next gotcha exists.

## Why models need so much data

**What it does in real life.** Because each example only earns a tiny nudge, the model has to see a
mountain of examples before the weights are any good. One house teaches it almost nothing; a hundred
thousand houses teach it the real shape of the market. The same is true everywhere: a spam filter needs
to see vast numbers of spam and not-spam emails; a language model needs an enormous amount of text.

⚠️ **This is the honest reason "AI needs lots of data."** It's not a slogan. It falls straight out of
the loop: small nudges × one example at a time = you need a lot of examples to add up to a model that
generalizes. Too little data and the weights never settle anywhere sensible.

📝 **Terminology.** One full pass through *all* of your training examples is called an **epoch**.
Training usually runs for many epochs — the model walks through the entire dataset again and again,
because one trip down the hill rarely reaches the bottom.

**A real example.**

```text
   Epoch 1:  average loss across all houses = 180,000   (rough)
   Epoch 2:  average loss = 95,000                       (better)
   Epoch 5:  average loss = 22,000                       (close)
   Epoch 9:  average loss = 21,500                       (barely moving — near the bottom)
```

*What just happened:* Each epoch is one complete walk through the data, and the average loss drops as
the weights settle into the valley. Notice the last step barely improves — the model is near the bottom
of the hill, and there's little left to squeeze out. Watching loss flatten like this is how people know
training is "done."

**Why this saves you later.** "We trained for 10 epochs," "the loss isn't going down," "we need more
data" — these stop being jargon. They're all status reports on the same downhill walk: how many
laps we've done, whether we're still descending, and whether we have enough examples to find the valley
at all.

## Recap

1. Training is a loop: **predict → measure the wrongness (loss) → nudge the weights → repeat.**
2. **Loss** is one number for how wrong a guess was; the goal is to make it small.
3. Nudging the weights toward lower loss is **gradient descent** — "roll downhill toward less error,"
   one small step at a time.
4. Steps are small on purpose, so a model needs **lots of examples**, walked through many times
   (**epochs**), before the weights are any good.

The loop will happily keep lowering loss on the examples it's shown. Next phase: why that can quietly
go wrong, and why we hide some data from the model on purpose.

---

[← Phase 1: Data → Weights → Predictions](01-data-weights-predictions.md) · [Guide overview](_guide.md) · [Phase 3: Overfitting & Why Test Sets Exist →](03-overfitting-and-test-sets.md)
