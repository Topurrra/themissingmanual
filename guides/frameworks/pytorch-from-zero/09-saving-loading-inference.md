---
title: "Saving, Loading & Inference"
guide: "pytorch-from-zero"
phase: 9
summary: "Save a trained model's state_dict, recreate the architecture and load it back, then run predictions correctly with eval() and no_grad() — turning raw logits into a labeled answer with confidence."
tags: [pytorch, save-model, state-dict, inference, eval-mode, no-grad, deployment]
difficulty: intermediate
synonyms: ["pytorch save load model", "pytorch state_dict", "pytorch inference", "pytorch eval mode no_grad", "pytorch deploy model", "pytorch torch.save", "pytorch load_state_dict"]
updated: 2026-07-10
---

# Saving, Loading & Inference

In [Phase 8](08-training-a-classifier.md) you trained a real classifier — you watched the loss fall, the
accuracy climb, and ended up with a model that actually works. Then your Python process exits, and it's
all gone. The weights lived in RAM; closing the program threw them away.

So here's the mental model for this whole phase, and it's the one that makes everything else fall into
place: **the value of training isn't the running program — it's the numbers it produced.** A trained model
is, at the end of the day, a bag of learned tensors (the weights and biases the optimizer nudged into shape
over Phase 8). Saving a model means writing those numbers to disk. Loading means recreating the model and
pouring the numbers back in. And *using* the model — inference — means flipping two switches that tell
PyTorch "we're done learning, just give me an answer."

Train once, save the numbers, then load and run them anywhere — your laptop, a server, someone else's
machine. That's the loop this phase closes.

## 1. Save the `state_dict`, not the whole model

📝 The recommended way to save a PyTorch model is to save its **`state_dict`** — the dictionary of learned
parameters you met back in [Phase 4](04-building-models-with-nn-module.md). It maps each layer's name to
its current weight and bias tensors. Those tensors *are* what training produced. Save them and you've saved
everything that matters.

```python
import torch

# `model` is the classifier you trained in Phase 8
torch.save(model.state_dict(), "model.pt")

# peek at what's inside that dictionary
for name, tensor in model.state_dict().items():
    print(name, tuple(tensor.shape))
```

```console
fc1.weight (16, 4)
fc1.bias (16,)
fc2.weight (3, 16)
fc2.bias (3,)
```

*What just happened:* `model.state_dict()` handed back a plain dictionary — keys like `fc1.weight` naming
each parameter, values being the actual tensors of learned numbers. `torch.save(...)` pickled that
dictionary to a file called `model.pt`. Notice what is *not* in there: no Python class, no `forward` method,
no architecture. Just named tensors. The shapes are exactly the layers you defined — that's the proof that
the file is your learning and nothing more.

⚠️ **Don't save the whole model object** (`torch.save(model, "model.pt")`). It works, and it's tempting
because loading looks like one line — but it pickles your *Python class along with the weights*. That ties
the file to your exact code, file layout, and library versions at save time. Rename the class, move the
file, or bump your PyTorch version, and the load can break in confusing ways. The `state_dict` is just
numbers, so it survives all of that. Save the `state_dict`.

> 💡 **Why `.pt` files are portable but not magic.** A `state_dict` file is a snapshot of numbers, not a
> program. It doesn't know what shape the model is, only what shape its own tensors are. That's the whole
> reason the next section needs your model *code* — the file can't rebuild the architecture, only refill it.

## 2. Load: recreate the architecture, then pour the numbers in

📝 Loading is a two-step dance, and the order matters:

1. **Recreate the model** — instantiate the same class with the same architecture you trained.
2. **Load the weights into it** — `model.load_state_dict(torch.load("model.pt"))`.

⚠️ You need the model **code** to load weights. The file is just numbers; it has no idea what a `fc1` layer
is until you build an object that *has* an `fc1`. The keys and shapes in the file have to line up with the
keys and shapes of the model you create. Build the wrong architecture and the load fails loudly (which is
better than failing silently).

```python
import torch
import torch.nn as nn

# 1. Recreate the SAME architecture you trained (same class, same sizes)
class IrisNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(4, 16)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(16, 3)

    def forward(self, x):
        return self.fc2(self.relu(self.fc1(x)))

model = IrisNet()                                   # fresh, random weights

# 2. Load the saved numbers into it
model.load_state_dict(torch.load("model.pt"))
print("Loaded.")
```

```console
Loaded.
```

*What just happened:* `IrisNet()` built a brand-new model with *random* weights — useless on its own.
`torch.load("model.pt")` read the dictionary of trained tensors back off disk, and `load_state_dict(...)`
copied each one into the matching layer by name. The freshly-built random model is now the trained model
again. The architecture came from your code; the intelligence came from the file. Both halves are required —
that's why "the file is just numbers" is the line to remember.

## 3. Inference mode: two switches before you predict

You've loaded a trained model. Before you ask it for predictions, you flip **two switches**. Forgetting
either is one of the most common beginner mistakes, so let's make the mental model crisp: 📝 **training mode
and inference mode are different**, and PyTorch doesn't switch automatically.

- **`model.eval()`** — puts the model into *evaluation* behavior. Some layers act differently when training
  versus predicting: dropout randomly zeros activations during training but must pass everything through at
  inference; batch-norm uses batch statistics during training but running averages at inference.
  ⚠️ Forget `model.eval()` and those layers stay in training mode, giving you wrong, unstable predictions.
- **`torch.no_grad()`** — tells PyTorch *not* to track gradients for these operations. You're not learning
  anymore, so there's no backward pass coming. Skipping gradient tracking is faster and uses less memory.

Here's a single prediction done correctly — load, `eval()`, `no_grad()`, forward, `argmax`:

```python
model.eval()                                # switch 1: inference behavior

# one flower: [sepal_len, sepal_width, petal_len, petal_width]
sample = torch.tensor([[5.1, 3.5, 1.4, 0.2]])

with torch.no_grad():                       # switch 2: no gradient tracking
    logits = model(sample)                  # forward pass -> raw scores
    predicted_class = logits.argmax(dim=1)  # index of the highest score

print("Logits:", logits)
print("Predicted class index:", predicted_class.item())
```

```console
Logits: tensor([[ 4.21, -0.88, -3.05]])
Predicted class index: 0
```

*What just happened:* `model.eval()` flipped every layer into inference behavior. The `with torch.no_grad():`
block ran the forward pass without building the autograd graph — faster and lighter, because we threw away
the machinery we'd only need for training. `model(sample)` returned three raw scores (one per class), and
`argmax(dim=1)` picked the index of the largest. Class `0` won. 💡 Build the habit now: **load → `eval()` →
`no_grad()` → forward → `argmax`** is the inference ritual, the same shape every time, just as the training
loop was.

## 4. From logits to an answer

The numbers the model spits out are **logits** — raw, unbounded scores, not probabilities. They're enough
to pick a winner with `argmax`, but they don't tell a human *how confident* the model is. To get that:

- **`softmax`** turns logits into probabilities that sum to 1 — a confidence for each class.
- **`argmax`** picks the predicted class (the highest one).

Let's turn those raw scores into a labeled prediction with a confidence:

```python
import torch.nn.functional as F

labels = ["setosa", "versicolor", "virginica"]

with torch.no_grad():
    logits = model(sample)
    probs = F.softmax(logits, dim=1)        # logits -> probabilities
    confidence, idx = probs.max(dim=1)      # best probability + its index

print(f"Prediction: {labels[idx.item()]}")
print(f"Confidence: {confidence.item():.1%}")
```

```console
Prediction: setosa
Confidence: 98.7%
```

*What just happened:* `F.softmax` squashed the three logits into probabilities that add up to 1, so they
read as confidences. `probs.max(dim=1)` returned both the largest probability *and* its index in one call.
We used the index to look up a human-readable label and formatted the probability as a percent. Now the
output is something a person — or an API caller — can actually use: *"setosa, 98.7% confident,"* instead of
`tensor([[4.21, -0.88, -3.05]])`. ⚠️ Don't apply `softmax` during *training* with a loss like
`CrossEntropyLoss` — that loss expects raw logits and applies its own softmax internally. Softmax is for
*reading* predictions, not for feeding the loss.

## 5. Toward deployment

You now have the complete cycle: train, save, load, predict. Real deployment builds on exactly that — here's
the lay of the land so you know what to reach for next.

- **Serve it behind an API.** The common pattern is to load the model once at startup (`eval()` + the
  weights), then call it inside a request handler. A small web framework like
  [FastAPI](/guides/fastapi-from-zero) is the usual home for this: receive JSON, run the same inference
  ritual from sections 3–4, return the labeled prediction.
- **Export for production and portability.** Three options, one line each: **TorchScript**
  (`torch.jit.script(model)`) serializes the model so it can run without Python; **`torch.compile(model)`**
  speeds up inference by compiling the forward pass; **ONNX** (`torch.onnx.export(...)`) converts the model
  to a framework-neutral format other runtimes can load.
- ⚠️ **Checkpoint during long training.** Don't wait until the end to save. Periodically write the
  `state_dict` (say, every few epochs) so a crash, a power cut, or a killed job doesn't vaporize hours of
  training. A checkpoint is just a `state_dict` saved mid-run.

💡 The throughline of this whole guide: a model is learnable layers (Phase 4), a loss and optimizer teach
them (Phases 5–6), training produces good weights (Phase 8), and you save that `state_dict` and reload it
with `eval()` + `no_grad()` to use the model anywhere. Train once, run forever.

## Recap

1. **Save the `state_dict`, not the whole model** — `torch.save(model.state_dict(), "model.pt")` writes the
   learned tensors. Pickling the whole object ties the file to your code and versions; the `state_dict` is
   just numbers and stays portable.
2. **Loading is two steps** — recreate the same architecture (you need the model *code*), then
   `model.load_state_dict(torch.load("model.pt"))`. The file refills the model; it can't rebuild it.
3. **Flip two switches to predict** — `model.eval()` for correct inference behavior (dropout, batch-norm),
   and `torch.no_grad()` for faster, lighter forward passes with no gradient tracking.
4. **Logits aren't answers** — the model outputs raw scores. `argmax` picks the class; `softmax` turns
   logits into probabilities you can report as a confidence.
5. **Deployment is this cycle, scaled up** — serve it behind an API (e.g. FastAPI), export with
   TorchScript / `torch.compile` / ONNX, and checkpoint periodically during long training.

That closes the loop from random weights to a model you can ship. The last phase looks outward: how to run
all of this fast on a GPU, and the pitfalls that trip people up along the way.

## Quick check

```quiz
[
  {
    "q": "Why is saving model.state_dict() preferred over saving the whole model object?",
    "choices": ["The state_dict trains faster", "The state_dict is just the learned tensors, so it stays portable across code and version changes; pickling the whole object ties the file to your exact class and library versions", "You can only load a state_dict on a GPU"],
    "answer": 1,
    "explain": "state_dict() saves only the parameters (named tensors). Saving the whole model pickles the Python class too, which can break when your code, file layout, or PyTorch version changes."
  },
  {
    "q": "What do you need in order to load weights from a saved state_dict file?",
    "choices": ["Nothing — the file rebuilds the model itself", "The model CODE, to recreate the same architecture before calling load_state_dict()", "A GPU to deserialize the tensors"],
    "answer": 1,
    "explain": "The file is just numbers with no architecture. You recreate the same model class first, then load_state_dict() pours the saved tensors into the matching layers by name."
  },
  {
    "q": "Before running predictions on a trained model, which two things should you do?",
    "choices": ["Call model.train() and enable gradients", "Call model.eval() and wrap the forward pass in torch.no_grad()", "Apply softmax and call loss.backward()"],
    "answer": 1,
    "explain": "model.eval() puts layers like dropout and batch-norm into inference behavior, and torch.no_grad() skips gradient tracking for a faster, lighter forward pass since you're not training."
  }
]
```

---

[← Phase 8: Training a Real Classifier](08-training-a-classifier.md) · [Guide overview](_guide.md) · [Phase 10: GPUs, Performance & Common Pitfalls →](10-gpus-performance-pitfalls.md)
