---
title: "Training a Real Classifier"
guide: "pytorch-from-zero"
phase: 8
summary: "The payoff: assemble tensors, an nn.Module, a loss, an optimizer, the training loop, and DataLoaders into a working MNIST digit classifier - train it, evaluate it rigorously, and read the results."
tags: [pytorch, classifier, mnist, training, evaluation, accuracy, end-to-end]
difficulty: intermediate
synonyms: ["pytorch mnist classifier", "pytorch train neural network example", "pytorch evaluation accuracy", "pytorch end to end training", "pytorch image classification", "pytorch train test split", "pytorch model evaluation"]
updated: 2026-07-10
---

# Training a Real Classifier

This is the phase you've been building toward. Every piece you've met so far has been one corner of a
picture, and now we snap them together into something that actually *works* - a neural network that looks
at a handwritten digit and tells you which one it is.

Here's the mental model to hold onto before any code. **A real training program is always the same five-part
skeleton**, and you already know all five parts:

1. **Data** - load it and hand it out in batches ([Phase 7](07-datasets-and-dataloaders.md)).
2. **Model** - an `nn.Module` that turns inputs into predictions ([Phase 4](04-building-models-with-nn-module.md)).
3. **Loss + optimizer** - one to measure wrongness, one to fix it ([Phase 5](05-loss-and-optimizers.md)).
4. **Training loop** - the forward → loss → `zero_grad` → backward → step ritual ([Phase 6](06-the-training-loop.md)).
5. **Evaluation** - check it on data it never saw.

That skeleton doesn't change whether you're classifying digits or training a model with billions of
parameters. We'll build it once, end to end, on the classic "hello world" of deep learning: MNIST.

## 1. The task and the data

📝 **MNIST** is 70,000 grayscale images of handwritten digits, each 28×28 pixels, each labeled with the
digit it shows (0 through 9). The job is **classification**: given a 28×28 image, predict which of the 10
classes it belongs to. It's small, it's clean, and a simple network gets very good at it - which makes it
perfect for seeing the whole pipeline without drowning in detail.

The data comes pre-split into two parts, and that split is the single most important idea in this phase:

- **Training set** (60,000 images) - the model *learns* from these.
- **Test set** (10,000 images) - the model is *judged* on these, and it never trains on them.

Why hold data back? Because a model that has seen an image can just memorize the answer - that tells you
nothing about whether it actually *learned* to recognize digits. The only real measure of learning is
performance on examples it has never encountered. That's the [overfitting](/guides/how-a-model-learns)
problem made concrete: train great, test poorly, and you've memorized, not learned. We hold out the test
set so we can catch exactly that.

`torchvision` (PyTorch's companion library for images) downloads MNIST for us and gives us a `Dataset`,
which we wrap in the `DataLoader` from [Phase 7](07-datasets-and-dataloaders.md):

```python
import torch
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

# ToTensor() turns each 28x28 image into a float tensor with values in [0, 1].
transform = transforms.ToTensor()

train_data = datasets.MNIST(root="data", train=True,  download=True, transform=transform)
test_data  = datasets.MNIST(root="data", train=False, download=True, transform=transform)

train_loader = DataLoader(train_data, batch_size=64, shuffle=True)
test_loader  = DataLoader(test_data,  batch_size=1000, shuffle=False)

print(f"train: {len(train_data)} images | test: {len(test_data)} images")
images, labels = next(iter(train_loader))
print(f"one batch: images {tuple(images.shape)}, labels {tuple(labels.shape)}")
```

```console
train: 60000 images | test: 10000 images
one batch: images (64, 1, 28, 28), labels (64,)
```

*What just happened:* `datasets.MNIST` downloaded the data (the first time only) and gave us two
`Dataset` objects, one per split. `transforms.ToTensor()` is the recipe that converts each PIL image into a
tensor with pixel values scaled to the 0–1 range PyTorch likes. We wrapped each `Dataset` in a
`DataLoader`: the training one **shuffles** every epoch (so the model doesn't learn the order) and hands out
batches of 64; the test one doesn't shuffle (order is irrelevant when you're only measuring) and uses big
batches of 1000 for speed. The batch shape `(64, 1, 28, 28)` reads as *64 images, 1 color channel,
28 tall, 28 wide* - and the 64 matching labels are just the digit for each one.

💡 The `1` in `(64, 1, 28, 28)` is the channel dimension - grayscale has one channel. Color images would
have 3 (red, green, blue). It's there even for grayscale because image layers in PyTorch always expect a
channel dimension; you'll be glad of the consistency later.

## 2. The model

For digits, a small **multilayer perceptron** (MLP) does the job: flatten the image into a flat row of
numbers, push it through one hidden layer with a ReLU in between, then out to 10 numbers - one score per
digit class. We define it as an `nn.Module`, exactly the pattern from
[Phase 4](04-building-models-with-nn-module.md).

```python
import torch.nn as nn

class DigitClassifier(nn.Module):
    def __init__(self):
        super().__init__()
        self.flatten = nn.Flatten()          # (B, 1, 28, 28) -> (B, 784)
        self.fc1 = nn.Linear(28 * 28, 128)   # 784 inputs -> 128 hidden
        self.relu = nn.ReLU()                # nonlinearity
        self.fc2 = nn.Linear(128, 10)        # 128 hidden -> 10 class scores

    def forward(self, x):
        x = self.flatten(x)
        x = self.relu(self.fc1(x))
        return self.fc2(x)                   # raw logits, one per class

device = "cuda" if torch.cuda.is_available() else "cpu"
model = DigitClassifier().to(device)
print(model)
print("device:", device)
```

```console
DigitClassifier(
  (flatten): Flatten(start_dim=1, end_dim=-1)
  (fc1): Linear(in_features=784, out_features=128, bias=True)
  (relu): ReLU()
  (fc2): Linear(in_features=128, out_features=10, bias=True)
)
device: cpu
```

*What just happened:* We described the network as layers in `__init__` and the data's path through them in
`forward`. `Flatten` squashes each 28×28 image into a flat vector of 784 numbers (a `Linear` layer wants a
flat row, not a grid). Then 784 → 128 → 10, with a `ReLU` in the middle so the network can learn curves
rather than just straight lines. The final layer spits out **10 logits** - raw, unbounded scores where the
biggest one is the model's guess. We never squeeze them into probabilities ourselves; the loss function does
that for us in the next step. Finally, `.to(device)` moves the model's weights onto the GPU if there is one
([Phase 2](02-tensor-operations-and-gpu.md)) - and the iron rule is that the model and its data must live on
the *same* device, which is why we'll move each batch too.

## 3. Loss, optimizer, and the training loop

Now the engine. For multi-class classification the standard loss is **`CrossEntropyLoss`**, and a reliable
default optimizer is **`Adam`** - both from [Phase 5](05-loss-and-optimizers.md).

```python
loss_fn = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

epochs = 5
model.train()                                       # training mode
for epoch in range(epochs):
    running_loss = 0.0
    for images, labels in train_loader:             # one batch at a time
        images, labels = images.to(device), labels.to(device)

        loss = loss_fn(model(images), labels)       # forward + measure
        optimizer.zero_grad()                       # clear old gradients
        loss.backward()                             # compute new gradients
        optimizer.step()                            # nudge the weights

        running_loss += loss.item()

    avg = running_loss / len(train_loader)
    print(f"epoch {epoch + 1}/{epochs} | avg loss {avg:.4f}")
```

```console
epoch 1/5 | avg loss 0.3372
epoch 2/5 | avg loss 0.1502
epoch 3/5 | avg loss 0.1064
epoch 4/5 | avg loss 0.0823
epoch 5/5 | avg loss 0.0674
```

*What just happened:* This is the exact five-step ritual from [Phase 6](06-the-training-loop.md), now with
real data flowing through it. The outer loop counts epochs (full passes over all 60,000 images); the inner
loop walks the batches the `DataLoader` hands us. For each batch we move it to the device, run the forward
pass and measure the loss, then `zero_grad` → `backward` → `step` in that exact, non-negotiable order. We
accumulate `loss.item()` to print an average per epoch. The thing to *feel* is the loss column falling from
0.34 to 0.07 - that downward march is the network learning to read digits. A few important details hide in
plain sight:

- **`CrossEntropyLoss` takes raw logits**, not probabilities. It applies the softmax internally. A classic
  beginner bug is adding your own softmax to the model and feeding it in - that double-counts and quietly
  hurts training. Hand it the raw logits.
- **The labels are plain integers** (`3`, `7`, ...), not one-hot vectors. `CrossEntropyLoss` expects exactly
  that. It just works.

💡 If your loss starts high and *doesn't* fall, it's almost always one of the three suspects from Phase 6:
the learning rate, a loop-order bug, or the data. Print the loss every epoch from the start - it's your
cheapest diagnostic.

## 4. Evaluation: how good is it, really?

The falling loss is encouraging, but it's measured on the *training* data - the data the model is allowed to
study. The real question is: **how does it do on the 10,000 test images it has never seen?** For
classification, the natural metric is **accuracy**: out of all test images, what fraction did it label
correctly?

📝 The evaluation pass has its own ritual, and it's deliberately different from training:

- **`model.eval()`** flips the model into evaluation mode (some layers behave differently when training vs.
  measuring - Phase 6).
- **`torch.no_grad()`** turns off gradient tracking. We're only measuring, not learning, so there's nothing
  to update and no reason to build the computation graph - it's faster and lighter.
- **No `backward()`, no `step()`.** We never adjust the weights here. We're judging, not teaching.

To turn logits into a prediction, we take the **argmax** - the index of the biggest score is the model's
guessed digit. Compare that to the true label, count the matches, divide by the total.

```python
model.eval()                                        # evaluation mode
correct = 0
total = 0
with torch.no_grad():                               # no gradients -- just measuring
    for images, labels in test_loader:
        images, labels = images.to(device), labels.to(device)
        logits = model(images)
        predicted = logits.argmax(dim=1)            # index of the biggest score
        correct += (predicted == labels).sum().item()
        total += labels.size(0)

accuracy = correct / total
print(f"test accuracy: {accuracy:.4f}  ({correct}/{total})")
```

```console
test accuracy: 0.9743  (9743/10000)
```

*What just happened:* We switched to `eval()` mode, wrapped everything in `no_grad()`, and ran the whole
test set through the model - no training, just measuring. For each batch, `logits.argmax(dim=1)` picked the
highest-scoring class per image. `(predicted == labels)` is a tensor of `True`/`False`; `.sum().item()`
counts the `True`s as a plain number, and we tallied them across all batches. The result: **97.4% of digits
it had never seen were classified correctly.** That's the real score - the number that means it *learned*,
not memorized.

⚠️ **Never tune your model against the test set.** It's tempting to peek at the test accuracy, tweak a
setting, re-check, tweak again - but the moment you make decisions based on the test set, you've started
leaking its information into your model, and your "test" score stops being trustworthy. The test set is for one
thing: a final, untouched verdict. (When you need a set to tune against, you hold out a *third* split - a
validation set - and leave the test set sealed until the very end.) Report the number you actually got, not
the one you wish you got.

## 5. Reading the results

So you've got a falling training loss and a 97.4% test accuracy. 💡 Here's how to read those two numbers
together, because the *relationship* between them tells you almost everything:

- **Training loss falling AND test accuracy high** → the model genuinely learned. This is the win. The
  patterns it found on the training data transfer to data it's never seen, which is the whole point.
- **Training loss low (or accuracy near-perfect on training) BUT test accuracy poor** → classic
  [overfitting](/guides/ml-basics-for-data-people). The model memorized the training set instead of learning
  general patterns. The gap between train and test performance is the alarm bell - when training looks great
  but test lags badly, suspect overfitting first.
- **Both poor** → the model hasn't learned enough yet. Train longer, give it more capacity, or check the
  learning rate and data.

💡 And here's the payoff to carry out of this whole guide: **this exact skeleton scales to anything.** Data →
model → loss + optimizer → training loop → evaluation. Swap MNIST for medical scans, swap the MLP for a
giant network, swap the digit labels for any target you can measure a loss against - the shape of the
program is *identical* to what you just wrote. You didn't just train a digit classifier. You learned the
template that every supervised deep-learning project on Earth is built from. From here on, you're not
learning *whether* you can train a model - you're just changing what goes in the five boxes.

## Recap

- **MNIST** is 70,000 labeled 28×28 digit images, pre-split into a 60,000-image training set and a
  10,000-image test set. `torchvision.datasets.MNIST` + `transforms.ToTensor()` + a `DataLoader` give you
  batches ready to train on.
- **The train/test split exists so you can evaluate on unseen data.** Performance on data the model never
  trained on is the only real measure of learning, and the way you catch overfitting.
- **The model** is a small MLP (`Flatten` → `Linear` → `ReLU` → `Linear` → 10 logits) defined as an
  `nn.Module`, moved to `device` along with every batch.
- **The training loop is the same Phase 6 ritual:** `CrossEntropyLoss` (fed raw logits + integer labels) +
  `Adam`, looping `zero_grad` → `backward` → `step` over batches and epochs while the loss falls.
- **Evaluation** runs under `model.eval()` and `torch.no_grad()`: take `argmax` of the logits, compare to
  the labels, and report accuracy (~97%). Never tune on the test set; report it straight.
- **The five-part skeleton - data → model → loss/optimizer → train loop → eval - is universal.** You now have
  it end to end, and it scales to any supervised task.

## Quick check

```quiz
[
  {
    "q": "Why does MNIST come split into a training set and a separate test set?",
    "choices": ["To make the download smaller", "So the model can be evaluated on data it never trained on - the only real measure of learning", "Because PyTorch requires exactly two DataLoaders"],
    "answer": 1,
    "explain": "A model can memorize data it has seen, which proves nothing. Performance on the held-out test set shows whether it actually learned to generalize - and reveals overfitting."
  },
  {
    "q": "What should you feed into nn.CrossEntropyLoss as the model's predictions?",
    "choices": ["Softmax probabilities you computed yourself", "The raw logits straight from the final Linear layer", "The argmax (predicted class index)"],
    "answer": 1,
    "explain": "CrossEntropyLoss applies softmax internally and expects raw logits plus integer labels. Adding your own softmax double-counts and hurts training."
  },
  {
    "q": "Training loss is very low but test accuracy is poor. What does this most likely indicate?",
    "choices": ["The model has learned well and is ready to ship", "Overfitting - the model memorized the training data instead of learning general patterns", "The learning rate is too low"],
    "answer": 1,
    "explain": "A big gap between strong training performance and weak test performance is the classic signature of overfitting: the model fit the training set rather than learning patterns that generalize."
  }
]
```

---

[← Phase 7: Data: Dataset & DataLoader](07-datasets-and-dataloaders.md) · [Guide overview](_guide.md) · [Phase 9: Saving, Loading & Inference →](09-saving-loading-inference.md)
