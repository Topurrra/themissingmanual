---
title: "GPUs, Performance & Common Pitfalls"
guide: "pytorch-from-zero"
phase: 10
summary: "A field guide to the PyTorch bugs that waste days — device mismatches, CUDA out-of-memory, silent training failures — plus how to keep the GPU fed and debug like a pro."
tags: [pytorch, gpu, performance, pitfalls, debugging, device, mixed-precision]
difficulty: advanced
synonyms: ["pytorch gpu performance", "pytorch common mistakes", "pytorch debugging", "pytorch device error", "pytorch out of memory", "pytorch mixed precision amp", "pytorch training bugs"]
updated: 2026-07-10
---

# GPUs, Performance & Common Pitfalls

Here's the honest truth nobody tells you when you start: the hard part of PyTorch isn't the concepts, it's the bugs. You'll write a training loop that's structurally perfect, hit run, and watch the loss sit there like a stone — no error, no clue, just a model that refuses to learn. Or you'll get a wall of red text about devices and memory that means nothing the first time you see it.

The good news, and the whole point of this phase: **almost all of those bugs come from a short, knowable list.** The difference between someone who loses a day to PyTorch and someone who shrugs and fixes it in two minutes isn't talent — it's having seen the bug before. So let's hand you that list. For each one: the symptom you'll actually see, the cause underneath, and the fix.

The mental model to carry through this phase: **PyTorch trusts you completely.** It won't stop you from logging tensors that leak memory, mixing devices, or forgetting `zero_grad()`. That freedom is why researchers love it — and why these pitfalls exist. Knowing the list is how you earn the freedom without paying the tax.

## 1. The pitfall cheat-card

Bookmark this table. When something breaks, scan it first — your bug is very likely sitting right here.

| Symptom | Cause | Fix |
|---------|-------|-----|
| Loss explodes to `nan` or never converges | Forgot `optimizer.zero_grad()` — gradients accumulate across steps ([Phase 6](06-the-training-loop.md)) | Add `optimizer.zero_grad()` before every `loss.backward()` |
| Predictions wrong/random at inference; eval slow | Forgot `model.eval()` and/or `torch.no_grad()` ([Phase 9](09-saving-loading-inference.md)) | Call `model.eval()` and wrap inference in `with torch.no_grad():` |
| `RuntimeError: ... found at least two devices` | Model and data on different devices ([Phase 2](02-tensor-operations-and-gpu.md)) | Move both to the same `device` with `.to(device)` |
| Loss stuck high; "model won't learn" | Wrong loss/label setup — e.g. softmax applied before `CrossEntropyLoss`, or labels the wrong shape/dtype ([Phase 5](05-loss-and-optimizers.md)) | Feed raw logits to `CrossEntropyLoss`; labels are `int64` class indices of shape `(N,)` |
| Loss decreases painfully slowly or oscillates wildly | Learning rate too low (slow) or too high (oscillates); data not shuffled; a logic bug | Tune `lr` (try 10× up/down); shuffle the `DataLoader`; overfit a tiny batch to isolate |
| `CUDA out of memory` | Batch too large, or tensors quietly keeping the graph alive across the loop | Smaller batch; use `.item()`/`.detach()` for logged values; `torch.cuda.empty_cache()` |

The first three are so common they each deserve a closer look. Let's expand them, because seeing the bug *and* the fix side by side is what makes it stick.

## 2. Device discipline — the same-device rule

⚠️ **The model and the data it processes must live on the same device.** This is the single most common GPU error, and everyone hits it exactly once. You moved your model to the GPU, felt good about it, and forgot that the batch coming out of your `DataLoader` is still sitting on the CPU. PyTorch can't do math across two devices — moving data between them is expensive, and it refuses to do that silently behind your back.

Here's the bug:

```python
import torch
import torch.nn as nn

device = "cuda" if torch.cuda.is_available() else "cpu"

model = nn.Linear(10, 2).to(device)   # model on the GPU
X = torch.randn(4, 10)                 # data left on the CPU -- oops

pred = model(X)                        # boom
```

```console
RuntimeError: Expected all tensors to be on the same device, but found at least
two devices, cuda:0 and cpu! (when checking argument for argument mat1 in method wrapper_addmm)
```

*What just happened:* The model's weights are on `cuda:0`, but `X` is still on the `cpu` where it was created. The forward pass tries to multiply them together, and PyTorch stops cold rather than guessing where the work should happen. The error even names both devices for you — `cuda:0` and `cpu` — which is the clue that points straight at the fix.

The fix is the device-agnostic pattern from [Phase 2](02-tensor-operations-and-gpu.md): pick `device` **once**, then `.to(device)` the model and **every batch** as it comes in.

```python
device = "cuda" if torch.cuda.is_available() else "cpu"
model = nn.Linear(10, 2).to(device)        # model -> device, once

for X_batch, y_batch in data_loader:
    X_batch = X_batch.to(device)           # every batch -> same device
    y_batch = y_batch.to(device)
    pred = model(X_batch)                   # now everything agrees
    # ... loss, zero_grad, backward, step ...
```

*What just happened:* Because every tensor is moved to the *same* `device` variable, nothing can drift onto the wrong one. The model went to `device` once at setup; each batch goes to the same `device` inside the loop. This one habit — one `device`, `.to(device)` everything — eliminates the entire category of cross-device errors. Notice the model moves once (its weights persist on the GPU), but data moves every iteration (each batch is freshly loaded on the CPU first).

💡 The tell-tale sign you forgot a `.to(device)` somewhere is that error naming two devices. When you see it, don't panic — just find the tensor that's on the wrong one. It's almost always a batch you forgot to move.

## 3. CUDA out of memory

📝 Your GPU has its own memory (VRAM), and it's smaller than you think — a consumer card might have 8–24 GB, and a model plus its activations plus its gradients all have to fit. When they don't, you get the dreaded:

```console
torch.cuda.OutOfMemoryError: CUDA out of memory. Tried to allocate 2.00 GiB
(GPU 0; 8.00 GiB total capacity; 6.50 GiB already allocated; 1.20 GiB free)
```

There are two flavors of this bug, and they have very different causes.

**Flavor one: the batch is too big.** You asked the GPU to hold more than it can. The fix is direct — use a smaller batch size, or a smaller model. This one is honest: you're over budget, so spend less.

**Flavor two — the sneaky one: a memory leak across the loop.** This is the bug that confuses people because the model and batch *do* fit, yet memory climbs every iteration until it overflows. The cause is almost always logging. Remember from [Phase 6](06-the-training-loop.md) that `loss` isn't just a number — it's a tensor that holds onto the entire computation graph that produced it. If you accumulate the raw loss tensor for logging, you're quietly keeping *every* iteration's graph alive in memory:

```python
# BAD: total_loss keeps each iteration's whole graph alive
total_loss = 0
for X_batch, y_batch in data_loader:
    pred = model(X_batch)
    loss = loss_fn(pred, y_batch)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    total_loss += loss          # <-- adds the TENSOR (graph and all)
```

*What just happened:* `total_loss += loss` adds the loss *tensor*, not its value. Each `loss` carries a reference back through the graph to the activations that made it, and `total_loss` now holds a growing chain of them. PyTorch can't free any of that memory because you're still pointing at it. Over a few hundred batches, VRAM fills up and you crash — even though each individual batch fit fine.

The fix is one method call. Use `.item()` (which extracts the plain Python float, severing the graph) for logging, or `.detach()` if you need a tensor without its history:

```python
# GOOD: .item() pulls out the plain number, graph gets freed
total_loss = 0.0
for X_batch, y_batch in data_loader:
    pred = model(X_batch)
    loss = loss_fn(pred, y_batch)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    total_loss += loss.item()   # <-- adds a float; graph is released
```

*What just happened:* `loss.item()` returns a bare Python `float` with no tie to the computation graph. Once the loop moves on, nothing references this iteration's activations, so PyTorch frees them. Memory stays flat across the whole epoch. This is the same `.item()` habit from Phase 6, and now you can see *why* it matters beyond tidy printing — it's the difference between a stable run and a slow memory leak.

💡 If you ever want to clear cached GPU memory mid-program, `torch.cuda.empty_cache()` releases blocks PyTorch is holding for reuse — handy in notebooks where old tensors linger. But it's a band-aid: if memory grows every iteration, you have a leak (flavor two), and `empty_cache()` won't save you. Find the tensor you forgot to `.item()`.

## 4. Speed — keep the GPU fed

Once your code *runs*, the next question is whether it runs *fast*. The mental model here is counterintuitive: 💡 **a GPU is so fast at math that the bottleneck is usually getting data to it, not the math itself.** A GPU sitting idle waiting for the next batch is the most common performance problem, and it's invisible unless you look for it.

The first lever is the `DataLoader` from [Phase 7](07-datasets-and-dataloaders.md). Two arguments keep the pipeline flowing: `num_workers` spins up background processes that prepare the next batches while the GPU chews on the current one, and `pin_memory=True` makes the CPU→GPU transfer faster. Together they stop the GPU from starving:

```python
loader = DataLoader(dataset, batch_size=64, shuffle=True,
                    num_workers=4, pin_memory=True)
```

*What just happened:* `num_workers=4` lets four background processes load and transform data in parallel, so a batch is ready the instant the GPU asks for it. `pin_memory=True` parks those batches in a region of RAM that transfers to the GPU faster. The GPU stops idling between batches. (Start with `num_workers` around the number of CPU cores you have and tune from there; too many can backfire.)

The second lever is **mixed precision**. By default PyTorch does math in 32-bit floats, but modern GPUs run *much* faster in 16-bit — and for most of training, 16-bit precision is plenty. `torch.cuda.amp` (Automatic Mixed Precision) flips the heavy operations to 16-bit while keeping the parts that need full precision safe, often giving a large speedup and roughly halving memory use for a few extra lines. On a recent GPU it's close to free performance, and worth reaching for once your loop works.

The third, newest lever: **`torch.compile`** (PyTorch 2.x). Wrap your model in `model = torch.compile(model)` and PyTorch traces and optimizes the whole computation into faster fused operations — often a real speedup with a single line, no other changes.

⚠️ One discipline above all: **profile before you optimize.** Don't guess where the time goes — measure it (PyTorch ships `torch.profiler`). Nine times out of ten the answer is "the GPU is starved for data," and you'll fix the `DataLoader` instead of micro-optimizing math that was never the problem.

## 5. The debugging mindset

Let's end with the meta-skill, because it's worth more than any single fix. When a model "won't learn," beginners reach for the tuning knobs — more epochs, a fancier optimizer, a bigger network. 💡 **But the overwhelming majority of "it won't learn" bugs aren't tuning problems at all.** They're one of four things:

1. **Shapes are wrong** — a `(batch, features)` that should be `(features, batch)`, a label tensor with an extra dimension. (Print `.shape`, as drilled in [Phase 2](02-tensor-operations-and-gpu.md).)
2. **Loss and labels are mismatched** — softmax applied before `CrossEntropyLoss`, or labels as floats when they should be `int64` class indices ([Phase 5](05-loss-and-optimizers.md)).
3. **The learning rate is off** — too high and the loss oscillates or explodes; too low and it barely moves.
4. **A missing `zero_grad()`** — the silent killer from [Phase 6](06-the-training-loop.md).

Here's the single best diagnostic, the one trick that separates frustrating debugging from productive debugging: **overfit a tiny batch.** Take five examples and train the model on just those, over and over, with no shuffling. A working model should *memorize* five examples easily — the loss should drop to nearly zero.

```python
# Sanity check: can the model memorize 5 examples?
tiny_X, tiny_y = next(iter(data_loader))
tiny_X, tiny_y = tiny_X[:5].to(device), tiny_y[:5].to(device)

model.train()
for step in range(200):
    pred = model(tiny_X)
    loss = loss_fn(pred, tiny_y)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    if step % 50 == 0:
        print(f"step {step:3d} | loss {loss.item():.4f}")
```

```console
step   0 | loss 2.4127
step  50 | loss 0.0832
step 100 | loss 0.0041
step 150 | loss 0.0006
```

*What just happened:* The model was asked to do the easiest possible task — memorize five fixed examples — and the loss collapsed toward zero, exactly as a healthy model should. **That's a passing sanity check:** the wiring is sound. If instead the loss had stayed flat or refused to drop, you'd know the problem is a *bug* (shapes, labels, a missing `zero_grad`), not a tuning issue — and you'd go hunting in that short list above instead of wasting hours on hyperparameters. This test takes thirty seconds and saves entire afternoons.

💡 That's the whole secret, and it's worth saying plainly: **the difference between frustrating and productive PyTorch is knowing this short list.** Every error message points to one of these. You're not memorizing PyTorch — you're memorizing the half-dozen ways it goes wrong, and how to recognize each one fast.

## Recap

- **Most PyTorch bugs come from a short, knowable list** — the cheat-card in section 1 covers the classics: missing `zero_grad()`, missing `eval()`/`no_grad()`, device mismatches, loss/label setup, learning rate, and out-of-memory.
- **Same-device rule:** model and data must be on one device. Pick `device` once, `.to(device)` the model and *every batch* — that habit kills the `two devices` error.
- **CUDA out of memory** has two flavors: a batch that's genuinely too big (use a smaller batch), and a sneaky leak from logging the raw `loss` tensor (`total_loss += loss` BAD → `+= loss.item()` GOOD).
- **Keep the GPU fed:** tune `DataLoader` (`num_workers`, `pin_memory`), use `torch.cuda.amp` mixed precision and `torch.compile` for speed — and profile before optimizing, because the bottleneck is usually data, not math.
- **Debugging mindset:** "won't learn" is almost always shapes, loss/labels, learning rate, or a missing `zero_grad`. Overfit a tiny batch first — if the model can't memorize 5 examples, it's a bug, not a tuning problem.

## Quick check

```quiz
[
  {
    "q": "Your training loop crashes with 'CUDA out of memory' after a few hundred batches, even though batch size is small and the first batches ran fine. What's the most likely cause?",
    "choices": ["The GPU is too small for any training", "You're accumulating the raw loss tensor (e.g. total_loss += loss), keeping every iteration's graph alive", "torch.compile is using too much memory"],
    "answer": 1,
    "explain": "Growing memory across iterations is the classic logging leak. The loss tensor carries its whole computation graph; adding it to a running total keeps every graph alive. Use total_loss += loss.item() to add a plain float and let the graphs be freed."
  },
  {
    "q": "You get 'RuntimeError: Expected all tensors to be on the same device, but found cuda:0 and cpu'. What's the fix?",
    "choices": ["Restart the GPU", "Move both the model and every batch to the same device with .to(device)", "Wrap the forward pass in torch.no_grad()"],
    "answer": 1,
    "explain": "The model is on the GPU but a batch is still on the CPU. Pick one device variable and .to(device) the model (once) and every batch (each iteration) so all tensors agree."
  },
  {
    "q": "Your model 'won't learn' — the loss won't drop. What's the smartest first diagnostic?",
    "choices": ["Add more epochs and a bigger network", "Switch to a fancier optimizer", "Overfit a tiny batch of ~5 examples — if it can't memorize them, it's a bug, not a tuning problem"],
    "answer": 2,
    "explain": "A healthy model memorizes 5 fixed examples easily, driving loss near zero. If it can't, the problem is a bug (shapes, loss/labels, missing zero_grad), so you hunt there instead of wasting time on hyperparameters."
  }
]
```

---

[← Phase 9: Saving, Loading & Inference](09-saving-loading-inference.md) · [Guide overview](_guide.md) · [Phase 11: Where to Go Next →](11-where-to-go-next.md)
