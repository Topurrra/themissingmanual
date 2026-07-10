---
title: "Building Models with nn.Module"
guide: "pytorch-from-zero"
phase: 4
summary: "A model is a Python class: subclass nn.Module, define layers in __init__ and the forward pass in forward(). Covers nn.Linear, activations, nn.Sequential, and how parameters are tracked."
tags: [pytorch, nn-module, layers, linear, forward, parameters, neural-network]
difficulty: intermediate
synonyms: ["pytorch nn.Module", "pytorch build neural network", "pytorch nn.Linear layer", "pytorch forward method", "pytorch model parameters", "pytorch nn.Sequential", "pytorch activation functions"]
updated: 2026-07-10
---

# Building Models with nn.Module

In [Phase 3](03-autograd.md) you saw autograd quietly record every operation on a tensor that has
`requires_grad=True`, then hand you the gradients on demand. That's the engine of learning; this phase is
about the thing autograd runs *inside* — the model.

Here's the mental model to hold onto, and it's one you already know from Python: **a model is a class.**
Specifically, a class that subclasses `nn.Module`. You met classes in
[Objects & Classes](/guides/python-from-zero) — data bundled with the behavior that acts on it. A PyTorch
model is exactly that: the *data* is the layers (each holding learnable weights), and the *behavior* is the
forward pass (how an input flows through those layers to an output). Nothing mystical. If you can write a
`Dog` class, you can write a neural network.

`nn.Module` is the parent class you inherit from, and inheriting from it buys you a lot for free —
parameter tracking, device moves, train/eval switching. We'll build up from the smallest possible model to
a real two-layer network, and end by looking at the parameters the optimizer will update in
[Phase 5](05-loss-and-optimizers.md).

## 1. A model is a class

📝 To define a model you **subclass `nn.Module`**, define your layers in `__init__`, and define the forward
pass in a method called `forward`. That's the whole pattern. Here is the smallest model that does anything:

```python
import torch
import torch.nn as nn

class TinyModel(nn.Module):
    def __init__(self):
        super().__init__()              # let nn.Module do its setup FIRST
        self.layer = nn.Linear(3, 1)    # one layer, defined as an attribute

    def forward(self, x):
        return self.layer(x)            # the forward pass: input -> output

model = TinyModel()
print(model)
```

```console
TinyModel(
  (layer): Linear(in_features=3, out_features=1, bias=True)
)
```

*What just happened:* `TinyModel(nn.Module)` means "a TinyModel *is an* `nn.Module`" — the same `is-a`
inheritance from the Python guide. The `super().__init__()` call runs `nn.Module`'s own constructor, which
sets up the bookkeeping that tracks your layers. Then `self.layer = nn.Linear(3, 1)` stored a layer *on
this model*, exactly like storing `self.name` on a dog. Printing the model shows PyTorch already knows about
that layer — because `nn.Module` was watching when you assigned it.

⚠️ **Always call `super().__init__()` first**, before assigning any layers. `nn.Module`'s constructor sets
up the internal machinery that records your layers and their parameters. Skip it (or assign layers before
it) and you'll get a confusing `AttributeError` like *"cannot assign module before Module.__init__() call"*.

> 💡 **Key point.** What `nn.Module` gives you for inheriting from it: it **tracks every parameter** in
> every layer you assign (so the optimizer can find them), it **moves the whole model to a device** with one
> `model.to(device)` call, and it **toggles train/eval mode** with `model.train()` / `model.eval()`. You get
> all of that by writing `class MyModel(nn.Module)` and calling `super().__init__()`. That's the payoff.

## 2. nn.Linear — a layer is a matmul plus a bias

📝 A **linear layer** (also called *fully-connected* or *dense*) computes `output = input @ W + b`. That's
the exact matrix-multiply-plus-bias from [Phase 2](02-tensor-operations-and-gpu.md) — `nn.Linear` is just
that operation wrapped up with its weights bundled inside.

`nn.Linear(in_features, out_features)` creates two tensors for you: a weight matrix `W` and a bias vector
`b`. Crucially, it creates them already marked as **learnable** — their `requires_grad` is `True`
automatically (tying back to [Phase 3](03-autograd.md)), so autograd will track them and produce gradients.
You don't set that up by hand.

```python
layer = nn.Linear(3, 2)        # 3 inputs in, 2 outputs out

print(layer.weight.shape)      # the W matrix
print(layer.bias.shape)        # the b vector
print(layer.weight.requires_grad)
```

```console
torch.Size([2, 3])
torch.Size([2])
True
```

*What just happened:* `nn.Linear(3, 2)` built a weight of shape `(2, 3)` and a bias of shape `(2,)` — sized
so that an input with 3 features maps to 2 outputs. (PyTorch stores `W` as `(out, in)` and computes
`input @ W.T + b` under the hood, which is why it's `(2, 3)` and not `(3, 2)` — you rarely need to think
about the transpose.) Both were initialized to small random values and, as the last line shows, both already
have `requires_grad=True`. These are the numbers training will adjust.

## 3. forward() and calling the model

📝 You define the forward pass in a method named `forward(self, x)` — but you **call the model directly**,
as `model(x)`, *not* `model.forward(x)`. Writing `model(x)` triggers `nn.Module`'s `__call__`, which runs
some setup (like hooks and train/eval handling) and *then* calls your `forward`. This is the same dunder-method
trick you saw with `__init__` in the Python guide: PyTorch defines `__call__` so that `model(x)` "just works."

```python
model = TinyModel()             # has one nn.Linear(3, 1) inside

x = torch.randn(4, 3)           # a batch of 4 examples, each with 3 features
output = model(x)               # call the model -> runs forward()

print(output.shape)
```

```console
torch.Size([4, 1])
```

*What just happened:* `model(x)` invoked `__call__`, which ran your `forward`, which pushed `x` through the
linear layer. The input was `(4, 3)` — 4 examples of 3 features each — and the layer mapped each example's
3 features to 1 output, giving `(4, 1)`. Notice the batch dimension (4) flows straight through untouched;
layers operate per-example. This is the shape-tracking habit from Phase 2 paying off.

⚠️ **Call `model(x)`, never `model.forward(x)` directly.** Calling `forward` yourself skips the wrapper
work `__call__` does (hooks, and the train/eval bookkeeping that layers like dropout and batch-norm rely on).
Most days it'll *seem* to work, then silently misbehave the one time it matters. Build the `model(x)` habit
now and you'll never get bitten.

## 4. Activations and stacking layers

Here's a subtle, important truth: 📝 **stacking linear layers with nothing between them gains you nothing.**
Two matrix multiplies in a row are mathematically just *one* matrix multiply (the product of the two weight
matrices). So a 10-layer all-linear network has exactly the same expressive power as a single linear layer —
it can only draw straight lines.

The fix is a **nonlinearity** (an *activation function*) between the linear layers. The most common is
**ReLU** (`nn.ReLU` or `torch.relu`), which is dead simple: it turns negatives into zero and leaves
positives alone. That tiny kink is enough to break the "stacked linears collapse to one" trap and let the
network learn curved, complicated boundaries. The pattern is **Linear → activation → Linear**.

Let's build a real two-layer **MLP** (multi-layer perceptron):

```python
class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc1 = nn.Linear(3, 8)      # 3 features -> 8 hidden units
        self.relu = nn.ReLU()           # the nonlinearity
        self.fc2 = nn.Linear(8, 1)      # 8 hidden units -> 1 output

    def forward(self, x):
        x = self.fc1(x)                 # first linear layer
        x = self.relu(x)                # nonlinearity in between
        x = self.fc2(x)                 # second linear layer
        return x

model = MLP()
out = model(torch.randn(4, 3))
print(out.shape)
```

```console
torch.Size([4, 1])
```

*What just happened:* The input `(4, 3)` flowed through `fc1` to become `(4, 8)` — 8 hidden features per
example. `relu` then zeroed out the negatives (same shape, `(4, 8)`), and `fc2` mapped those 8 hidden
features down to 1 output, giving `(4, 1)`. The `forward` method reads top-to-bottom like a recipe: that's
the whole point of defining it yourself — you control exactly how data flows.

For a plain stack like this, `nn.Sequential` is shorthand that chains layers in order, so you don't write
the `forward` by hand at all:

```python
model = nn.Sequential(
    nn.Linear(3, 8),
    nn.ReLU(),
    nn.Linear(8, 1),
)

out = model(torch.randn(4, 3))
print(out.shape)
```

```console
torch.Size([4, 1])
```

*What just happened:* `nn.Sequential` built a module that runs each layer in the order listed, feeding each
one's output into the next — the same Linear → ReLU → Linear pipeline as the `MLP` class, in fewer lines. It
produced the identical `(4, 1)` output. 💡 Use `nn.Sequential` when your model is a straight chain; write a
full `nn.Module` subclass with a custom `forward` when you need branches, skip connections, or any logic that
isn't a simple line. Most real models start as `Sequential` and grow into a custom class.

## 5. Parameters — what gets learned

Every layer you defined holds learnable tensors (the `W`s and `b`s). `nn.Module` collects them all so you
never have to round them up yourself. Two methods matter:

- **`model.parameters()`** — yields every learnable tensor in the model. This is exactly what you'll hand
  to the optimizer in [Phase 5](05-loss-and-optimizers.md) so it knows what to update.
- **`model.state_dict()`** — a dictionary mapping each layer's name to its current values. This is what you
  save to disk in [Phase 9](09-saving-loading-inference.md).

A common sanity check is counting how many learnable numbers a model has:

```python
model = MLP()       # Linear(3,8) + Linear(8,1)

total = sum(p.numel() for p in model.parameters())
print(f"Trainable parameters: {total}")
```

```console
Trainable parameters: 41
```

*What just happened:* `model.parameters()` walked every layer and yielded each weight and bias tensor;
`p.numel()` counted the elements in each. `fc1` has a `(8, 3)` weight (24) plus an `(8,)` bias (8) = 32, and
`fc2` has a `(1, 8)` weight (8) plus a `(1,)` bias (1) = 9, for 41 total. Those 41 numbers *are* the model —
training is the process of nudging exactly these values until the outputs are good.

💡 **The big picture for this phase.** A model is a class made of learnable layers. You define what's in it
(`__init__`) and how data flows through it (`forward`), call it as `model(x)`, and `nn.Module` keeps track of
every parameter inside. Autograd (Phase 3) tracks those parameters; the optimizer (Phase 5) updates them.
That's the division of labor — and you've now got the middle piece.

## Recap

1. **A model is a class** that subclasses `nn.Module`. Define layers in `__init__` (after
   `super().__init__()`), define the forward pass in `forward(self, x)`.
2. **`nn.Linear(in, out)`** is a layer computing `input @ W + b`. It creates `W` and `b` for you, already
   marked learnable (`requires_grad=True`).
3. **Call the model as `model(x)`** — this runs `__call__`, which runs your `forward`. Never call
   `model.forward(x)` directly.
4. **Activations** (`nn.ReLU` / `torch.relu`) between linear layers add nonlinearity; without them, stacked
   linear layers collapse into a single linear layer. `nn.Sequential` is shorthand for a straight chain.
5. **`model.parameters()`** yields what the optimizer updates; **`model.state_dict()`** is what you save.
   The parameters *are* the model.

With the model built, the next two pieces complete the picture: a way to measure how wrong it is, and an
algorithm that uses the gradients to fix it. That's loss functions and optimizers.

## Quick check

```quiz
[
  {
    "q": "How should you run a forward pass on a model named `model` for input `x`?",
    "choices": ["model.forward(x)", "model(x)", "model.run(x)"],
    "answer": 1,
    "explain": "Call the model directly as model(x). That triggers nn.Module's __call__, which does setup (hooks, train/eval handling) and then runs your forward(). Calling model.forward(x) skips that wrapper and can silently misbehave."
  },
  {
    "q": "Why put a nn.ReLU() between two nn.Linear layers?",
    "choices": ["To make the model run faster", "Without a nonlinearity, the two linear layers collapse into a single linear layer", "ReLU is required for the model to compile"],
    "answer": 1,
    "explain": "Two matrix multiplies in a row equal one matrix multiply, so stacked linears have no more power than one. A nonlinearity like ReLU breaks that, letting the network learn curved, complex patterns."
  },
  {
    "q": "What does nn.Linear(in, out) set up for you automatically?",
    "choices": ["A weight and bias, both with requires_grad=True so autograd tracks them", "Just a weight matrix, with no bias", "A weight and bias that must be manually marked as learnable"],
    "answer": 0,
    "explain": "nn.Linear creates the weight W and bias b for you, already initialized and already marked learnable (requires_grad=True), so autograd tracks them and the optimizer can update them."
  }
]
```

---

[← Phase 3: Autograd: Automatic Differentiation](03-autograd.md) · [Guide overview](_guide.md) · [Phase 5: Loss Functions & Optimizers →](05-loss-and-optimizers.md)
