---
title: "Running Models Locally"
guide: "running-models-locally"
phase: 0
summary: "What it really means to run an LLM on your own machine — the honest trade-off against a hosted API, a real Ollama session from download to local API call, and how model size, RAM/VRAM, and quantization decide whether it runs at all."
tags: [ai-ml, llm, local-models, ollama, quantization, hardware]
category: ai-ml
order: 7
difficulty: intermediate
synonyms: ["how to run an llm locally", "run a large language model on my own computer", "what is ollama", "how to run llama locally", "do i need a gpu to run an llm", "what is quantization", "run ai model offline", "local llm vs api", "how much ram to run an llm"]
updated: 2026-06-19
---

# Running Models Locally

You've used an LLM through a website or an API key, and somewhere along the way a quieter idea took hold: *what if the model just ran on my own machine?* No account, no sending your data to someone else's servers, no meter ticking with every request. It turns out you can — and the experience of pulling a real model down and watching it answer entirely offline is genuinely a little magical the first time.

It's also a trade-off, not a free upgrade. A model running on your laptop is usually weaker than the big hosted ones, and whether it runs *at all* depends on numbers most people have never had explained to them — parameters, RAM, VRAM, quantization. This guide makes those knowable. By the end you'll be able to download a model, talk to it from code, and look at any model on a download page and say "that'll fit my machine" or "that won't" — and know why.

> ⏭️ Never called an LLM from code before? [Using an LLM API](/guides/using-an-llm-api) shows the hosted side first. Running locally is the same idea — text in, text out — with the model living on your hardware instead of someone else's.

## How to read this

- **Just want to decide if local is even worth it?** Read [Phase 1](01-why-run-locally.md) — the honest trade-off against a hosted API — and stop there if the answer is "not for me yet."
- **Want it to finally make sense?** Read in order. Phase 1 frames the decision, Phase 2 gets a real model running, and Phase 3 explains the hardware reality so you can pick a model that actually fits.

## The phases

1. **[Why (and Why Not) Run Locally](01-why-run-locally.md)** — the honest trade-off: privacy, zero per-token cost, offline, and control on one side; weaker models, your hardware's limits, and setup effort on the other. When local genuinely makes sense, and when a hosted API is the right call.
2. **[Getting One Running (Ollama)](02-getting-one-running.md)** — the mental model (download an open-weights model, run it locally), then a real `ollama pull` / `ollama run` session, and finally hitting the model's local API endpoint from your own code.
3. **[Hardware, Quantization & Reality](03-hardware-and-quantization.md)** — what actually decides if a model runs: its size in parameters versus your RAM/VRAM, and **quantization** — shrinking the weights to fit, trading a little quality for a lot of memory. CPU versus GPU speed, and how to match a model to your machine.

> This guide gets you running a single model on one machine. Fine-tuning a model on your own data, serving one to a team, and squeezing out maximum speed are each their own topic — deferred to follow-up guides rather than crammed in here.
