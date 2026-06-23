---
title: "The Problem RAG Solves"
guide: "rag-explained"
phase: 1
summary: "An LLM only knows its training data — stale, generic, and blind to your docs — so it fills the gaps by making things up. RAG fixes this by retrieving the relevant facts first and asking the model to answer using them: the open-book exam."
tags: [rag, llm, hallucination, training-data, grounding, ai]
difficulty: intermediate
synonyms: ["why does the llm make things up", "llm doesnt know my data", "what problem does rag solve", "open book exam llm", "ground llm answers in facts", "stop llm hallucinations"]
updated: 2026-06-19
---

# The Problem RAG Solves

Picture asking a brilliant new hire a question about your company on their first morning. They're sharp, well-read, articulate — and they know *nothing specific* about your systems. If you press them for an answer about your internal billing flow, the worst thing they can do is *guess fluently*: produce a confident, well-phrased answer that's flatly wrong.

That's an LLM on its own. Before we can appreciate what RAG does, we have to be honest about what the model actually knows — and what it doesn't.

## What an LLM actually knows

**What it actually is.** A large language model is a giant pattern-predictor trained once, on a fixed pile of text, up to a fixed cutoff date. Everything it "knows" is baked into its weights during that training run. It has no live connection to your files, your database, or today's events. When you chat with it, it isn't *looking anything up* — it's predicting the most plausible next words based on patterns it absorbed.

**Why people get this wrong.** It *feels* like the model is reasoning from facts, because the prose is so fluent. So when it answers a question about your internal API, it's easy to assume it went and checked something. It didn't. It produced text that *sounds* like a correct answer.

This leaves you with three concrete gaps:

- **It's stale.** Training has a cutoff. Anything that happened, changed, or shipped after that date is invisible to the model.
- **It's generic.** It learned from public text. Your private repo, your wiki, your ticket history, your contracts — none of that was in the training data.
- **It fills gaps by inventing.** When the model doesn't know, it rarely says so. It produces the most statistically plausible-sounding answer, which can be entirely fabricated. This is what people mean by **hallucination**.

> 📝 **Hallucination** — when a model generates confident, fluent output that is factually wrong or made up. It isn't lying; it has no concept of truth, only of plausibility. It's filling a gap the only way it can.

**A real example.** Here's the failure mode, with no retrieval in play:

```text
You:   What's the maximum file size our /upload endpoint accepts?

LLM:   The /upload endpoint accepts files up to 25 MB by default,
       configurable via the MAX_UPLOAD_SIZE environment variable.
```

*What just happened:* That answer is plausible, specific, and formatted like documentation — and the model has never seen your codebase. The "25 MB" and the env-var name are pattern-matched from similar public projects, not read from your config. It might be right by luck. You have no way to tell, and neither does the model. This is exactly the kind of answer that ruins an afternoon when someone trusts it.

## The fix: don't make the model recall — let it read

Here's the shift in thinking that RAG is built on.

The model is great at *reading and reasoning over text you give it*. It's unreliable at *recalling specific facts from memory*. So stop relying on its memory. Instead, go fetch the relevant facts yourself, paste them into the conversation, and ask the model to answer **using only what you provided**.

💡 **Key point — the open-book exam.** A closed-book exam tests memory: you either memorized the fact or you didn't, and under pressure you might bluff. An open-book exam is different — you're handed the textbook, you look up the relevant page, and you answer from it. RAG turns every question into an open-book exam for the model. You do the "look up the relevant page" part; the model does the "read it and answer" part, which is what it's actually good at.

That's the whole idea in the name:

- **Retrieval** — go find the relevant facts from your data.
- **Augmented** — add those facts to the prompt.
- **Generation** — let the model generate its answer from them.

**A real example.** Same question, now open-book:

```text
[Retrieved from your repo — config/upload.yaml]
  max_file_size_mb: 10
  allowed_types: [pdf, png, jpg]

You:   Using the context above, what's the maximum file size
       our /upload endpoint accepts?

LLM:   Your /upload endpoint accepts files up to 10 MB, and only
       PDF, PNG, and JPG types.
```

*What just happened:* The model didn't recall anything. You retrieved the actual config from your repo, placed it in the prompt as context, and the model read it and answered from it. The answer is now grounded in *your* data — and because the source is right there, you can verify it. The fluent-bluffing failure mode is largely closed off, because the model is reading rather than guessing.

## Why this is the standard approach

You might wonder why we don't just *retrain* the model on your data. We'll cover that trade-off honestly in [Phase 3](03-why-its-harder-than-it-looks.md), but the short version: retrieval is cheap, fast to update, and lets you point to your sources. When a doc changes, you re-index a file — you don't retrain a model. And because the facts are sitting in the prompt, you can show the user *where the answer came from*, which is the difference between "trust me" and "here's the source."

## Recap

1. An LLM only knows its **training data** — which is stale, generic, and blind to your private docs.
2. When it doesn't know, it doesn't stop — it **hallucinates** a plausible-sounding answer.
3. The model is good at **reading and reasoning over text you give it**, weak at recalling specific facts.
4. **RAG** = retrieve the relevant facts first, add them to the prompt, then let the model generate from them.
5. The mental model is an **open-book exam**: you look up the page, the model reads it and answers.

Now you know *why* RAG exists. Next, the actual machinery — how you turn a pile of documents into something you can retrieve from in milliseconds.

---

[← Guide overview](_guide.md) · [Phase 2: How RAG Works →](02-how-rag-works.md)
