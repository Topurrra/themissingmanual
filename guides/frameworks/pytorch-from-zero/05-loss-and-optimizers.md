---
title: "Loss Functions & Optimizers"
guide: "pytorch-from-zero"
phase: 5
summary: "How a model knows it's wrong and how it fixes itself: loss functions turn predictions vs. truth into one number, and optimizers (SGD, Adam) use the gradients to nudge the weights."
tags: [pytorch, loss-function, optimizer, sgd, adam, gradient-descent, learning-rate]
difficulty: intermediate
synonyms: ["pytorch loss function", "pytorch optimizer sgd adam", "pytorch crossentropyloss mseloss", "pytorch learning rate", "pytorch optimizer step", "pytorch gradient descent", "how pytorch updates weights"]
updated: 2026-07-10
---

# Loss Functions & Optimizers

In [Phase 4](04-building-models-with-nn-module.md) you built a model: a `nn.Module` with layers and a
`forward()` that turns an input into a prediction. But a fresh model is *random* — its weights are
nonsense, so its predictions are nonsense. Training fixes that, and fixing something takes two things: a
way to measure how wrong you are, and a way to act on that measurement.

Here's the mental model for this whole phase, and it's short: **the loss function tells you how wrong the
model is, and the optimizer is the thing that does something about it.** Loss is the score. The optimizer
is the player trying to lower the score. Everything below is just the PyTorch names for those two roles —
and the three magic lines that connect them. This is the missing half of the training loop you'll
assemble in Phase 6.

## 1. Loss = how wrong, in one number

📝 A **loss function** takes the model's predictions and the true answers and boils the gap between them
down to a single number. Lower is better. A loss of zero means the predictions matched the truth exactly;
a big loss means the model is badly off. That's the entire idea — *training is the act of making that one
number smaller.*

This is the same picture from [How a Model Learns](/guides/how-a-model-learns): a model learns by being
wrong, measuring *how* wrong, and nudging its numbers to be a little less wrong next time. The loss
function is the "how wrong" part, made concrete. PyTorch ships the common ones in `torch.nn`, ready to use.

💡 One number is the point, not a limitation. The optimizer needs a single value to push downhill — you
can't minimize ten numbers at once. The loss function's job is to be the honest scorekeeper that compresses
"how did the whole batch do?" into one comparable score.

## 2. The two losses you'll reach for most

📝 Two loss functions cover the overwhelming majority of beginner work, and which one you pick is decided
by *what kind of problem you have*:

- **`nn.MSELoss`** — for **regression** (predicting a number: a price, a temperature). It's the mean
  squared error: average of `(prediction − target)²`.
- **`nn.CrossEntropyLoss`** — for **classification** (predicting a category: cat vs. dog, digit 0–9).

Let's compute a regression loss. You create the loss object once, then call it like a function with
`(predictions, targets)`:

```python
import torch
import torch.nn as nn

loss_fn = nn.MSELoss()

predictions = torch.tensor([2.5, 0.0, 2.1])   # what the model guessed
targets     = torch.tensor([3.0, 0.0, 2.0])   # the true values

loss = loss_fn(predictions, targets)
print(loss)
```

```console
tensor(0.0867)
```

*What just happened:* `nn.MSELoss()` built a loss object; calling `loss_fn(predictions, targets)` measured
the gap. Element by element the errors are `-0.5`, `0.0`, `0.1`; squared they're `0.25`, `0.0`, `0.01`;
their mean is `0.0867`. One small number, because the guesses were close. If a prediction had been wildly
off, squaring would have blown that error up and the loss would be large — that's MSE punishing big misses
hard.

Now classification, where there's a notorious trap. ⚠️ **`nn.CrossEntropyLoss` expects RAW logits — the
plain, un-softmaxed numbers straight out of your model's last layer — together with the true class labels
as plain integers.** Applying a softmax yourself before passing predictions in is the classic
CrossEntropyLoss bug: it double-applies the math and quietly wrecks your training.

```python
loss_fn = nn.CrossEntropyLoss()

# Raw scores (logits) for 2 examples over 3 classes -- NO softmax applied
logits = torch.tensor([[2.0, 0.5, 0.1],    # example 1: model leans toward class 0
                       [0.1, 0.2, 3.0]])   # example 2: model leans toward class 2

targets = torch.tensor([0, 2])              # true classes, as integers (not one-hot)

loss = loss_fn(logits, targets)
print(loss)
```

```console
tensor(0.2559)
```

*What just happened:* We passed `logits` (raw, unnormalized scores) and `targets` as a tensor of integer
class indices — `0` means "example 1's correct answer is class 0," `2` means "example 2's is class 2."
`CrossEntropyLoss` internally does the softmax *for* us and then measures how much probability the model
put on the right class. Both examples leaned toward the correct class, so the loss is low. Pass it
pre-softmaxed numbers or one-hot labels and you'll either get an error or, worse, silently wrong training.

💡 Remember the contract: **raw logits in, integer labels in, softmax stays out of your hands.** If you
ever catch yourself writing `softmax(...)` right before a `CrossEntropyLoss`, delete it.

## 3. The optimizer — the thing that updates the weights

📝 The loss tells you *how wrong*. Autograd (Phase 3) tells you *which direction* each weight should move
to reduce that wrongness — the gradients. The **optimizer** is what actually takes those gradients and
*adjusts the weights*. It's the mechanism of learning: no optimizer, no improvement.

Optimizers live in `torch.optim`. You create one by handing it two things: the parameters it's allowed to
change, and a learning rate. Remember `model.parameters()` from Phase 4 — that's the bundle of every
weight and bias in your model. You pass it in so the optimizer knows exactly *what* it's responsible for
updating:

```python
import torch.optim as optim

model = nn.Linear(4, 2)     # a tiny model from Phase 4: 4 inputs -> 2 outputs

optimizer = optim.SGD(model.parameters(), lr=0.01)
print(optimizer)
```

```console
SGD (
Parameter Group 0
    dampening: 0
    lr: 0.01
    ...
)
```

*What just happened:* `optim.SGD(model.parameters(), lr=0.01)` created an optimizer wired directly to this
model's weights. By passing `model.parameters()`, we told it "these are the numbers you may change." From
now on, when we ask the optimizer to take a step, it walks through exactly those parameters and nudges each
one. The `lr=0.01` is the learning rate — coming up next.

## 4. SGD vs. Adam, and the learning rate

📝 You'll meet two optimizers early. **SGD** (Stochastic Gradient Descent) is the textbook one: for each
weight, step a little bit in the downhill direction — `new_weight = old_weight − (gradient × learning
rate)`. Simple and honest. **Adam** is the smarter default: it adapts the step size per-parameter as it
goes, which usually means it learns faster and needs less hand-tuning. Swapping between them is a one-line
change:

```python
sgd  = optim.SGD(model.parameters(), lr=0.01)
adam = optim.Adam(model.parameters(), lr=1e-3)   # 1e-3 = 0.001

print(type(sgd).__name__, type(adam).__name__)
```

```console
SGD Adam
```

*What just happened:* Same `model.parameters()`, two different update strategies. SGD will take steps of a
fixed size scaled by the gradient; Adam will quietly tune each parameter's step on the fly. The API is
identical — you'll use the exact same three lines (next section) regardless of which one you chose.

📝 That `lr` — the **learning rate** — is the size of each step downhill, and ⚠️ **it's the single most
important hyperparameter you'll touch.** Set it too high and the model overshoots the bottom on every step,
bouncing around or blowing up (loss goes to `nan`). Set it too low and learning crawls — technically
correct, but it might take a thousand times longer than it should. Most "my model won't learn" problems
trace back to the learning rate.

💡 When in doubt, start with **Adam and `lr=1e-3` (0.001)**. It's the closest thing PyTorch has to a safe
default, and it's where the majority of real projects begin before any tuning. Get something training
first, fiddle with the learning rate second.

## 5. The three-line update

Here's where loss and optimizer finally meet. Every PyTorch training step — for the simplest linear model
and for a giant language model alike — runs these three lines after computing the loss. Learn them once and
you've learned the engine of all of deep learning:

```python
optimizer.zero_grad()   # 1. clear the old gradients
loss.backward()         # 2. autograd fills in fresh gradients
optimizer.step()        # 3. apply the update to every weight
```

```console
(no output -- this is the work itself)
```

*What just happened:* Three jobs, in order. **`optimizer.zero_grad()`** wipes the gradients from the last
step — ⚠️ this matters because PyTorch *accumulates* gradients by default (you saw this in Phase 3); skip
this line and old and new gradients pile up, corrupting the update. **`loss.backward()`** runs autograd
backward from the loss, computing a fresh gradient for every parameter — the "which way is downhill"
answer. **`optimizer.step()`** then reads those gradients and actually moves each weight, using whatever
strategy (SGD, Adam) you chose. Old grads cleared, new grads computed, step taken.

💡 The clean way to hold this in your head: **the loss says how wrong you are, autograd (`backward`) says
which way to go, and the optimizer (`step`) takes the step.** Three roles, three lines, in that exact
order. That ordering — clear, backward, step — is non-negotiable, and getting it wrong (especially
forgetting `zero_grad`) is one of the most common training bugs.

This is the heart of training. In [Phase 6](06-the-training-loop.md) we wrap these three lines inside a
loop that runs them over and over, batch after batch, epoch after epoch — and you'll watch the loss
actually fall.

## Recap

- A **loss function** measures how wrong the model is in one number; lower is better, and training is the
  act of shrinking it. It makes the "learn by being wrong" idea concrete.
- **`nn.MSELoss`** is for regression (predicting a number); **`nn.CrossEntropyLoss`** is for
  classification. ⚠️ CrossEntropyLoss wants **raw logits and integer labels** — never pre-apply softmax.
- The **optimizer** (`torch.optim.SGD`, `torch.optim.Adam`) takes autograd's gradients and updates the
  weights. You pass it `model.parameters()` so it knows what to change.
- **SGD** steps by gradient × learning rate; **Adam** adapts and is the usual default. The **learning
  rate** is the most important hyperparameter — too high diverges, too low crawls. Start with Adam + `1e-3`.
- The update is three lines, in order: **`optimizer.zero_grad()`** (clear old grads — they accumulate),
  **`loss.backward()`** (autograd fills grads), **`optimizer.step()`** (apply the update).

## Quick check

```quiz
[
  {
    "q": "What does a loss function compute?",
    "choices": ["The model's prediction for a new input", "One number measuring how far the predictions are from the true answers", "The learning rate for the optimizer"],
    "answer": 1,
    "explain": "A loss function turns predictions-vs-truth into a single number, lower is better. Training is the process of making that number smaller."
  },
  {
    "q": "You're doing classification with nn.CrossEntropyLoss. What should you feed it?",
    "choices": ["Softmax probabilities and one-hot labels", "Raw logits and integer class labels", "Raw logits and softmax probabilities"],
    "answer": 1,
    "explain": "CrossEntropyLoss expects raw logits (it applies softmax internally) plus integer class indices. Pre-applying softmax yourself is the classic bug that quietly breaks training."
  },
  {
    "q": "What is the correct order of the three update lines, and why call zero_grad() first?",
    "choices": ["step(), backward(), zero_grad() -- to apply before measuring", "zero_grad(), backward(), step() -- because PyTorch accumulates gradients, so old ones must be cleared first", "backward(), zero_grad(), step() -- to compute then reset before stepping"],
    "answer": 1,
    "explain": "Clear, backward, step. PyTorch adds new gradients onto existing ones by default, so zero_grad() wipes the previous step's grads before backward() computes fresh ones and step() applies them."
  }
]
```

---

[← Phase 4: Building Models with nn.Module](04-building-models-with-nn-module.md) · [Guide overview](_guide.md) · [Phase 6: The Training Loop →](06-the-training-loop.md)
