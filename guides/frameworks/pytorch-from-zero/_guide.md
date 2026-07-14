---
title: "PyTorch From Zero"
guide: "pytorch-from-zero"
phase: 0
summary: "Learn the deep-learning framework that runs modern AI: tensors and the GPU, autograd (automatic differentiation), building models with nn.Module, loss functions and optimizers, the training loop, Dataset/DataLoader, training a real classifier, saving and inference, performance pitfalls, and where to go. The three ideas under all of it - tensors, autograd, the loop - made plain."
tags: [pytorch, python, deep-learning, machine-learning, tensors, autograd, neural-networks, framework]
category: frameworks
order: 11
group: "Python"
difficulty: intermediate
synonyms: ["learn pytorch", "pytorch tutorial", "pytorch for beginners", "pytorch tensors autograd", "pytorch nn.module", "pytorch training loop", "pytorch dataloader", "pytorch vs tensorflow", "how to train a neural network pytorch"]
updated: 2026-06-22
---

# PyTorch From Zero

PyTorch is the framework most modern AI is actually built in - the research papers, the image models, and
the large language models you've heard of were, in huge part, trained with it. It has a reputation for
being deep and mathematical, and the math is real, but the framework itself rests on just **three ideas**:
a **tensor** (a multi-dimensional array you do math on, fast, on a GPU), **autograd** (PyTorch
automatically computes the derivatives needed to learn), and **the training loop** (a short, repeating
ritual that nudges a model toward being right). Understand those three and the rest is detail.

This guide builds those ideas first, in plain language, then assembles them into a real model you train
and run. We connect it to what you may already know: a tensor is NumPy's array with superpowers; "learning"
is the gradient descent from [How a Model Learns](/guides/how-a-model-learns), made concrete; a model is a
Python class. By the end you'll have trained a working classifier and understand every line of the loop
that did it.

> 📝 This teaches the **framework**, not the math from scratch. It assumes **Python**
> ([Python From Zero](/guides/python-from-zero)) and is far richer if you've met the concepts in
> [What AI & ML Are](/guides/what-ai-and-ml-are) and especially [How a Model Learns](/guides/how-a-model-learns)
> (gradients, loss, training). Helpful too: [pandas From Zero](/guides/pandas-from-zero) for data prep.
>
> ⚠️ PyTorch needs a native install (and ideally a GPU), so examples here are shown with their output
> rather than run on the page - follow along in a notebook or Google Colab (free GPUs).

## How to read this

Read in order - it builds from a single tensor up to a trained, saved classifier, one idea per phase.
Phases carry difficulty badges; the 🔴 ones (autograd, the loop, performance) are the conceptual core.

## The phases

**Part 1 - The three core ideas (🟢 → 🔴)**
1. **[What PyTorch Is & Tensors](01-what-pytorch-is-and-tensors.md)** 🟢 - the tensor: a GPU-ready, autograd-aware array.
2. **[Tensor Operations & the GPU](02-tensor-operations-and-gpu.md)** 🟢 - math, broadcasting, reshaping, and moving work to the GPU.
3. **[Autograd: Automatic Differentiation](03-autograd.md)** 🔴 - how PyTorch computes the gradients that make learning possible.

**Part 2 - Building & training a model (🟡 → 🔴)**
4. **[Building Models with nn.Module](04-building-models-with-nn-module.md)** 🟡 - layers, `forward()`, and a model as a Python class.
5. **[Loss Functions & Optimizers](05-loss-and-optimizers.md)** 🟡 - measuring wrongness and the algorithm that fixes it.
6. **[The Training Loop](06-the-training-loop.md)** 🔴 - forward → loss → backward → step: the ritual that trains everything.
7. **[Data: Dataset & DataLoader](07-datasets-and-dataloaders.md)** 🟡 - batching, shuffling, and feeding data efficiently.
8. **[Training a Real Classifier](08-training-a-classifier.md)** 🟡 - putting it all together on a real dataset, with evaluation.

**Part 3 - Using & shipping models (🟡 → 🟢)**
9. **[Saving, Loading & Inference](09-saving-loading-inference.md)** 🟡 - `state_dict`, `eval()` mode, `no_grad`, and running a trained model.
10. **[GPUs, Performance & Common Pitfalls](10-gpus-performance-pitfalls.md)** 🔴 - devices, speed, and the bugs that bite every beginner.
11. **[Where to Go Next](11-where-to-go-next.md)** 🟢 - pretrained models, transfer learning, the ecosystem, and LLMs.

> Tensors, autograd, the loop. Everything in deep learning - from a 3-line model to a giant LLM - is those
> three ideas at scale. This guide makes them yours.

---

[Phase 1: What PyTorch Is & Tensors →](01-what-pytorch-is-and-tensors.md)
