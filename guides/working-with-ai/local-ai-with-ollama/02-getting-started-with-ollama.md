---
title: "Getting Started with Ollama"
guide: local-ai-with-ollama
phase: 2
summary: "From nothing to a working local chat: install Ollama, pull a model, talk to it in the terminal, and size up the hardware you actually need."
tags: [ollama, local-llm, install, hardware, open-models]
difficulty: intermediate
synonyms:
  - how to install Ollama
  - pull and run a model with Ollama
  - chat with a local LLM in the terminal
  - hardware needed to run a local model
updated: 2026-06-30
---

# Getting Started with Ollama

Going from "I'm curious" to "I'm chatting with a model on my own machine" takes about ten minutes and four commands. Let's walk it.

## Step 1: Install Ollama

Go to ollama.com and download the installer for your system - macOS, Windows, or Linux. It installs like any normal app. On macOS and Windows you get a small background program plus a command you can run in the terminal. On Linux it is a one-line install script the site gives you.

Once it is installed, open a terminal and confirm it is there:

```bash
ollama --version
```

If that prints a version number, you are ready.

## Step 2: Pull a model

A "model" is the AI itself - a single (large) file Ollama downloads and stores. You pick one by name. A sensible first choice in 2026 is one of the small, current open models; Llama, Gemma, Qwen, and Mistral all publish versions sized to run at home. Start small:

```bash
ollama pull llama3.2
```

This downloads the model. Expect a wait - these files run from a couple of gigabytes for the smallest models up to tens of gigabytes for larger ones. The number in a model's name (like "3B" or "8B") is roughly how big it is: bigger usually means smarter but slower and hungrier for memory. For a first run, smaller is friendlier.

You only pull a model once. After that it lives on your disk.

## Step 3: Chat with it

Now talk to it:

```bash
ollama run llama3.2
```

You will get a prompt. Type a question, press enter, and the model answers right there in your terminal - generated on your machine, no internet needed. Type `/bye` to leave the chat.

That is the whole loop. Install, pull, run, chat.

```text
>>> Write me a two-line note thanking a coworker for covering my shift.
Thanks so much for covering my shift - you really saved me, and
I owe you one. I'll happily return the favor whenever you need it.
>>> /bye
```

## Step 4 (optional): see what you've got

A couple of commands worth knowing:

```bash
ollama list      # shows every model you've downloaded
ollama rm llama3.2   # deletes one to free up disk space
```

Models take real disk space, so `ollama rm` is how you clean up the ones you tried and did not keep.

## The hardware you actually need

This is where local AI gets real. The model has to fit in your computer's memory while it runs, and how fast it responds depends mostly on your hardware. Here is a rough guide - not a spec sheet, only the shape of it:

| Your machine | What runs well | What to expect |
|---|---|---|
| 8 GB RAM, no dedicated graphics | Small models (≈3B) only | Works, but slow; fine for short tasks |
| 16 GB RAM, integrated graphics | Small to mid models (3B–8B) | Comfortable for everyday chat |
| 16–32 GB RAM + a decent GPU | Mid models (8B–14B) | Fast, genuinely usable daily |
| Apple Silicon Mac (M-series), 16 GB+ | Surprisingly large models | Strong; Apple's unified memory helps a lot |
| 32 GB+ RAM + a strong GPU | Large models (30B+) | Closest you'll get to cloud quality at home |

Two things drive the experience:

**Memory (RAM, or video memory on a graphics card).** The model must fit. If it does not, it either refuses to load or spills over and grinds to a crawl. This is the hard limit - pick a model that fits your memory, not the other way around.

**The graphics chip (GPU).** A dedicated GPU does the heavy lifting and makes responses come fast. Without one, the model runs on your main processor (CPU), which works but is much slower - you will watch words appear one at a time. Apple's M-series Macs are a happy exception: their shared memory design runs local models well without a separate graphics card.

If you are not sure what you have, try the smallest model first. If it feels quick enough, step up to a bigger one and see where your machine taps out. That trial-and-error takes minutes and teaches you your ceiling faster than any chart.

A realistic expectation: on a typical modern laptop, a small model is fine for drafting, summarizing, and quick questions. It will not feel as instant or as sharp as a cloud model - but it is yours, it is private, and it is free to run. That trade is the whole point, and the next phase is about when it is worth making.
