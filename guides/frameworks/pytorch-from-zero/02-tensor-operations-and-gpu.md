---
title: "Tensor Operations & the GPU"
guide: "pytorch-from-zero"
phase: 2
summary: "Do real math on tensors: elementwise ops, matrix multiply (the heart of neural nets), broadcasting, reshaping and indexing, then move the whole thing onto a GPU with device-agnostic code."
tags: [pytorch, tensor-operations, broadcasting, reshape, gpu, cuda, device]
difficulty: beginner
synonyms: ["pytorch tensor operations", "pytorch broadcasting", "pytorch reshape view", "pytorch gpu cuda", "pytorch to device", "pytorch matrix multiply", "pytorch tensor indexing"]
updated: 2026-07-10
---

# Tensor Operations & the GPU

In [Phase 1](01-what-pytorch-is-and-tensors.md) you met the tensor: a multi-dimensional array that's
GPU-ready and autograd-aware — that was the noun. This phase is the verbs, the things you *do* to tensors.

Here's the mental model to carry through everything below: **a tensor operation acts on the whole tensor
at once, not one number at a time.** When you write `a + b`, you're not asking for a loop over elements —
you're asking the underlying engine (highly optimized C++, and on a GPU, thousands of cores) to do the
whole thing in one shot. Your job is to line the shapes up correctly; the engine does the grunt work. Get
comfortable here and the rest of PyTorch is mostly arranging these operations in the right order.

We'll cover five things: elementwise math, matrix multiply (the operation neural nets are built from),
broadcasting (combining different-but-compatible shapes), reshaping and indexing (shuffling data into the
shape a layer expects), and finally moving the work onto a GPU.

## 1. Elementwise math

The everyday operators — `+`, `-`, `*`, `/`, `**` — work on whole tensors, position by position. No loop
required. This is called **vectorized** math, and it's the first reason PyTorch is fast.

```python
import torch

a = torch.tensor([1.0, 2.0, 3.0])
b = torch.tensor([10.0, 20.0, 30.0])

print(a + b)      # add, element by element
print(a * b)      # multiply, element by element
print(a ** 2)     # square each element
```

```console
tensor([11., 22., 33.])
tensor([10., 40., 90.])
tensor([1., 4., 9.])
```

*What just happened:* Each operation lined up `a` and `b` by position and combined them. `a + b` added
the first elements (1 + 10), then the second (2 + 20), and so on — all at once, no `for` loop in your
code. `a ** 2` squared every element independently. To you it reads like ordinary arithmetic; underneath,
it's a single fast pass over the data.

PyTorch also ships the math functions you'd expect, plus reductions that collapse a tensor down to a
summary number:

```python
x = torch.tensor([1.0, 4.0, 9.0])

print(torch.sqrt(x))   # square root of each element
print(torch.exp(x))    # e^x for each element
print(x.sum())         # add everything up -> one number
print(x.mean())        # average -> one number
```

```console
tensor([1., 2., 3.])
tensor([2.7183e+00, 5.4598e+01, 8.1031e+03])
tensor(14.)
tensor(4.6667)
```

*What just happened:* `torch.sqrt` and `torch.exp` are elementwise — same shape out as in. `x.sum()` and
`x.mean()` are **reductions**: they squash the whole tensor into a single scalar tensor. You'll lean on
`sum` and `mean` constantly later — a loss value, for instance, is usually the *mean* error over a batch.

💡 Notice `x.sum()` returns `tensor(14.)`, not `14.` — it's still a tensor (a zero-dimensional one). If
you need a plain Python number out of it, call `.item()`.

## 2. Matrix multiply — the heart of a neural net

Elementwise math is the warm-up. The operation deep learning is actually *built* from is **matrix
multiplication**, written `@` (or `torch.matmul`).

Why does this one matter so much? Because a neural-network layer, stripped of mystique, is a matrix
multiply plus a bias: `output = input @ weights + bias`. That's it. Stack a few of those with some
non-linear functions between them and you have a model. So when people say training a model is
"expensive," they mostly mean: *a staggering number of matrix multiplies.*

```python
m = torch.tensor([[1.0, 2.0],
                  [3.0, 4.0]])          # shape (2, 2)
v = torch.tensor([[1.0],
                  [1.0]])               # shape (2, 1)

print(m @ v)                            # matrix-vector multiply
```

```console
tensor([[3.],
        [7.]])
```

*What just happened:* `m @ v` is true matrix multiplication, not elementwise. Row 1 of `m` (`[1, 2]`)
dotted with `v` (`[1, 1]`) gives `1*1 + 2*1 = 3`; row 2 (`[3, 4]`) gives `3*1 + 4*1 = 7`. The result has
shape `(2, 1)`. This dot-product-of-rows-and-columns pattern is the single most-run computation in all of
deep learning.

⚠️ **Shapes must align.** To multiply `(m, k) @ (k, n)` the inner dimensions must match — the number of
columns on the left must equal the number of rows on the right. Mismatch them and PyTorch stops you cold:

```python
left = torch.randn(2, 3)    # shape (2, 3)
right = torch.randn(2, 3)   # shape (2, 3) -- inner dims 3 and 2 don't match

print(left @ right)
```

```console
RuntimeError: mat1 and mat2 shapes cannot be multiplied (2x3 and 2x3)
```

*What just happened:* `left` is `(2, 3)` and `right` is `(2, 3)`. For `@` to work the inner dimensions
have to agree: `(2, 3) @ (3, n)` is fine, but here the left's `3` columns meet the right's `2` rows —
no match, so PyTorch refuses rather than guessing. This is one of the most common errors you'll hit, and
the message tells you exactly which two shapes collided. Read it, fix the shapes, move on.

💡 The vast majority of the math inside a neural net is matrix multiplies. If you internalize the
`(m, k) @ (k, n) -> (m, n)` rule, you've internalized the shape-checking skill that prevents most layer
bugs before they happen.

## 3. Broadcasting

📝 **Broadcasting** is how PyTorch combines tensors of *different but compatible* shapes without you
manually copying data around. The classic case: you have a matrix and you want to add the same bias
vector to every row.

```python
matrix = torch.tensor([[1.0, 2.0, 3.0],
                       [4.0, 5.0, 6.0]])   # shape (2, 3)
bias = torch.tensor([10.0, 20.0, 30.0])    # shape (3,)

print(matrix + bias)
```

```console
tensor([[11., 22., 33.],
        [14., 25., 36.]])
```

*What just happened:* `matrix` is `(2, 3)` and `bias` is just `(3,)` — a single row. Instead of erroring,
PyTorch **broadcast** the bias: it acted as if `bias` were stretched to `(2, 3)` (copied down both rows)
and then added elementwise. `[10, 20, 30]` got added to row 1 *and* row 2. No actual copy happens in
memory — it's a view-level trick — which is why it's fast and memory-cheap. This is exactly the
`input + bias` step inside a layer.

The rule (identical to NumPy's): line the shapes up from the **right**. Two dimensions are compatible if
they're equal, or one of them is `1` (or missing). Here `(2, 3)` and `(3,)` align as `(2, 3)` and
`(1, 3)` — the `1` stretches to `2`. Done.

⚠️ Broadcasting is powerful but it's *silent* — it won't always error when you make a mistake; sometimes
it produces a valid-but-wrong shape. A `(3, 1)` and a `(1, 3)` will broadcast to `(3, 3)`, which is
occasionally what you wanted and occasionally a bug you won't notice until your loss looks insane.
**Always sanity-check the shape of a broadcast result** with `.shape` if you're unsure:

```python
col = torch.tensor([[1.0], [2.0], [3.0]])   # shape (3, 1)
row = torch.tensor([[10.0, 20.0, 30.0]])    # shape (1, 3)

print((col + row).shape)                     # not (3,) or (3,1) -- it's (3,3)!
```

```console
torch.Size([3, 3])
```

*What just happened:* A column `(3, 1)` plus a row `(1, 3)` broadcast both directions and produced a full
`(3, 3)` grid — every column value added to every row value. Perfectly legal PyTorch, and a real surprise
if you expected a length-3 result. The lesson isn't "avoid broadcasting" — it's "print the shape when the
result matters."

## 4. Reshaping & indexing

Most of practical PyTorch is getting data into the *shape* a layer expects, then pulling pieces back out.
PyTorch gives you sharp tools for both.

**Reshape** rearranges the same data into a new shape (the total number of elements must stay the same).
`.reshape()` and `.view()` do the same thing for our purposes — `.reshape()` is the safe default.

```python
x = torch.arange(6)          # tensor([0, 1, 2, 3, 4, 5]), shape (6,)

print(x.reshape(2, 3))       # rearrange into 2 rows, 3 cols
print(x.reshape(3, 2))       # or 3 rows, 2 cols
```

```console
tensor([[0, 1, 2],
        [3, 4, 5]])
tensor([[0, 1],
        [2, 3],
        [4, 5]])
```

*What just happened:* The six numbers never changed — only how they're laid out. `(6,)` became `(2, 3)`
and then `(3, 2)`. The element count (6) is identical each time, which is the one rule reshape enforces.

**`.squeeze()` and `.unsqueeze()`** remove or add a dimension of size 1. This sounds fussy, but it's
everywhere — a model often expects a batch dimension, so you wrap a single example with `.unsqueeze(0)`,
and you peel an extra dimension back off the output with `.squeeze()`.

```python
single = torch.tensor([1.0, 2.0, 3.0])   # shape (3,)

batched = single.unsqueeze(0)            # add a dim at position 0
print(batched.shape)                     # (1, 3) -- now it's "a batch of 1"

print(batched.squeeze().shape)           # remove the size-1 dim -> back to (3,)
```

```console
torch.Size([1, 3])
torch.Size([3])
```

*What just happened:* `unsqueeze(0)` inserted a new axis at the front, turning a lone `(3,)` vector into a
`(1, 3)` "batch of one" — the shape many models demand. `squeeze()` then dropped that size-1 axis, getting
us back to `(3,)`. You'll do this dance constantly when feeding single examples to a model built for
batches.

**Indexing and slicing** work just like NumPy (and Python lists), including for multiple dimensions:

```python
g = torch.tensor([[10, 11, 12],
                  [20, 21, 22],
                  [30, 31, 32]])

print(g[0])        # first row
print(g[:, 1])     # second column (all rows, column 1)
print(g[1, 2])     # single element: row 1, col 2
```

```console
tensor([10, 11, 12])
tensor([11, 21, 31])
tensor(22)
```

*What just happened:* `g[0]` grabbed the whole first row. `g[:, 1]` used `:` to mean "all rows" and `1`
to pick column 1 — that's how you slice a column. `g[1, 2]` indexed both dimensions at once for a single
element. Same syntax you already know from NumPy, no relearning required.

💡 Shape-wrangling is a genuinely large part of day-to-day PyTorch, and here's the honest truth most
tutorials skip: **the majority of PyTorch bugs are shape bugs.** A model that "doesn't work" is far more
often a `(batch, features)` that should've been `(features, batch)` than a deep conceptual error. When
something breaks, print `.shape` first.

## 5. The GPU

Now the payoff. 📝 Everything above runs fine on your CPU — but deep learning runs on **GPUs**, and it's
worth understanding *why.*

A CPU has a handful of very fast, very general cores (see
[CPU, RAM & Storage](/guides/cpu-ram-and-storage) for what a core actually is). It's brilliant at doing
one complicated thing after another. A GPU is the opposite: **thousands of simpler cores** that all do
math in parallel. And what is a matrix multiply? Thousands of independent multiply-and-add operations that
can all happen at once. That's a perfect match. The same training that takes a CPU hours can take a GPU
minutes, purely because the GPU does the parallel arithmetic of deep learning far faster.

In PyTorch, a tensor lives on a **device** — either `"cpu"` or `"cuda"` (NVIDIA GPU). You move tensors
between devices with `.to(device)`. The standard, do-it-once-at-the-top pattern looks like this:

```python
# Pick the device ONCE, near the top of your program
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

x = torch.tensor([1.0, 2.0, 3.0])   # created on the CPU by default
x = x.to(device)                    # move it to the chosen device

print(x.device)
```

```console
Using device: cuda
tensor([1., 2., 3.], device='cuda:0')
```

*What just happened:* `torch.cuda.is_available()` checks whether a usable GPU exists; if so we pick
`"cuda"`, otherwise we fall back to `"cpu"`. Then `x.to(device)` moved the tensor onto that device — note
the output now shows `device='cuda:0'` (GPU number 0). The exact same code runs unchanged on a laptop with
no GPU (it'd print `cpu`) and on a Colab machine with one. That's the goal: **device-agnostic code.**

⚠️ Here's THE classic GPU error, the one that bites everyone exactly once: doing math across tensors on
**different devices.** If your model is on the GPU but your data is still on the CPU, PyTorch refuses to
guess where the work should happen:

```python
a = torch.tensor([1.0, 2.0]).to("cuda")   # on the GPU
b = torch.tensor([3.0, 4.0])              # still on the CPU

print(a + b)
```

```console
RuntimeError: Expected all tensors to be on the same device, but found at least
two devices, cuda:0 and cpu!
```

*What just happened:* `a` lives on `cuda:0` and `b` lives on `cpu`. An operation can't span two devices —
the data would have to physically move, and PyTorch won't do that silently behind your back. The error
names both devices so you can see the mismatch. The fix is to put `b` on the GPU too (`b = b.to("cuda")`).

💡 The whole headache disappears if you adopt one habit: **pick `device` once, then `.to(device)`
everything** — your model and every batch of data. Because you reuse the same `device` variable, your
tensors can't drift onto different devices. This one discipline prevents the most common GPU bug in
PyTorch, and it's the pattern you'll see in every training loop from Phase 6 onward.

## Recap

- **Elementwise math** (`+`, `*`, `torch.sqrt`, `torch.exp`, …) acts on the whole tensor at once, no
  loops; reductions like `.sum()` and `.mean()` collapse a tensor to a summary value.
- **Matrix multiply** (`@` / `torch.matmul`) is the operation neural nets are built from — a layer is a
  matmul plus a bias. Inner dimensions must align: `(m, k) @ (k, n) -> (m, n)`.
- **Broadcasting** combines different-but-compatible shapes (like adding a bias vector to every row)
  without copying — but it's silent, so check the result's `.shape` when in doubt.
- **Reshaping & indexing** (`.reshape`/`.view`, `.squeeze`/`.unsqueeze`, NumPy-style slicing) get data
  into the shape a layer expects. Most PyTorch bugs are shape bugs — print `.shape` first.
- **GPUs** do the parallel matmuls of deep learning far faster than CPUs. Write device-agnostic code: pick
  `device` once, `.to(device)` everything, and never mix tensors across devices.

## Quick check

```quiz
[
  {
    "q": "You write a @ b where a has shape (4, 3) and b has shape (4, 3). What happens?",
    "choices": ["It returns a (4, 3) tensor, multiplied elementwise", "RuntimeError: the inner dimensions (3 and 4) don't match", "It returns a (4, 4) tensor"],
    "answer": 1,
    "explain": "Matrix multiply needs inner dims to match: (m, k) @ (k, n). Here it's (4, 3) @ (4, 3), so the left's 3 columns meet the right's 4 rows -- mismatch, RuntimeError. For elementwise multiply you'd use *, not @."
  },
  {
    "q": "You add a tensor of shape (2, 3) to one of shape (3,). What does broadcasting do?",
    "choices": ["Errors, because the shapes are different", "Stretches the (3,) vector across both rows, giving a (2, 3) result", "Sums everything into a single number"],
    "answer": 1,
    "explain": "Aligning from the right, (3,) is treated as (1, 3) and stretched to (2, 3) -- the same vector is added to every row. No data is actually copied in memory."
  },
  {
    "q": "What's the reliable way to avoid the 'tensors on different devices' RuntimeError?",
    "choices": ["Always use the CPU and never touch the GPU", "Pick device once at the top, then .to(device) both the model and every batch of data", "Call torch.cuda.is_available() before every operation"],
    "answer": 1,
    "explain": "Device-agnostic code: choose one device variable up front and move everything to it. Reusing the same variable means your tensors can't drift onto different devices."
  }
]
```

---

[← Phase 1: What PyTorch Is & Tensors](01-what-pytorch-is-and-tensors.md) · [Guide overview](_guide.md) · [Phase 3: Autograd: Automatic Differentiation →](03-autograd.md)
