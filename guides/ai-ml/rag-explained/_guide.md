---
title: "RAG (Retrieval-Augmented Generation), Explained"
guide: "rag-explained"
phase: 0
summary: "What RAG actually is — retrieving the right facts from your own data first, then asking the model to answer using them — why an LLM needs it, how the pipeline works end to end, and why good RAG is mostly good retrieval."
tags: [rag, retrieval-augmented-generation, llm, embeddings, vector-search, ai]
category: ai-ml
order: 6
difficulty: intermediate
synonyms: ["what is rag", "retrieval augmented generation explained", "ground an llm in my own data", "make chatgpt answer from my docs", "rag vs fine tuning", "how does rag work", "stop the llm from making things up"]
updated: 2026-06-19
---

# RAG (Retrieval-Augmented Generation), Explained

You've watched an LLM confidently invent a function that doesn't exist, cite a policy your company never wrote, or shrug at a question it should have known the answer to. The model isn't broken — it just doesn't *have* your data. It only knows what it absorbed during training: a frozen, generic snapshot of the public internet, with nothing about your codebase, your docs, or last Tuesday's incident.

RAG is the standard fix. The idea is calmer than the acronym suggests: before you ask the model anything, you go and *fetch the relevant facts* from your own data, then hand them to the model and say "answer using these." This guide builds that idea up properly — what problem it solves, the exact pipeline that makes it work, and the honest reasons it's harder to do well than the diagrams suggest.

## How to read this

- **Just need the gist of what RAG is?** Read [Phase 1: The Problem RAG Solves](01-the-problem-rag-solves.md) — it gives you the whole mental model in one sitting.
- **Want it to actually make sense?** Read in order. Phase 1 is the *why*, Phase 2 is the *how*, and Phase 3 is the *why it's harder than it looks* — the part that separates a demo from something you'd trust in production.

## The phases

1. **[The Problem RAG Solves](01-the-problem-rag-solves.md)** — why an LLM alone makes things up about your data, and the open-book-exam mental model that fixes it.
2. **[How RAG Works](02-how-rag-works.md)** — the pipeline: chunk your docs, embed them into a vector store, retrieve the most relevant chunks at query time, stuff them into the prompt, and generate.
3. **[Why It's Harder Than It Looks](03-why-its-harder-than-it-looks.md)** — RAG quality is retrieval quality. Bad chunking, ignored context, stale indexes, thin retrieval, and the honest line between RAG and fine-tuning.

> Deliberately deferred: the deep mechanics of *how* embeddings and vector search work live in their own guide, [Embeddings and Vector Search](/guides/embeddings-and-vector-search). This guide uses them as a building block and links there when you want to go deeper.
