---
title: "Embeddings & Vector Search, Explained"
guide: "embeddings-and-vector-search"
phase: 0
summary: "What an embedding actually is (meaning turned into a list of numbers), how 'nearness' between two pieces of text is measured, and how vector databases search millions of them by meaning instead of keywords."
tags: [embeddings, vector-search, semantic-search, similarity, vector-database, ai, ml]
category: ai-ml
order: 5
difficulty: intermediate
synonyms: ["what is an embedding", "what is vector search", "how does semantic search work", "embeddings vs keyword search", "what is cosine similarity", "what is a vector database", "how do vectors capture meaning", "find similar text by meaning"]
updated: 2026-06-19
---

# Embeddings & Vector Search, Explained

You keep hearing that AI "understands meaning" — that it can find the right document even when you don't use the right keyword, that it powers search, recommendations, and the retrieval behind chatbots. Underneath almost all of that sits one quiet idea: an **embedding**, a way of turning a piece of text (or an image) into a list of numbers that captures what it *means*.

That sounds abstract until you see the trick: once meaning is a list of numbers, "find things that mean something similar" becomes "find numbers that are close together" — a math problem a computer can do in milliseconds across millions of items. This guide builds that mental model from the ground up, then shows how real systems search at scale and where they bite.

## How to read this

- **Want the one idea to take away?** Read [Phase 1: Meaning as Coordinates](01-meaning-as-coordinates.md). Everything else builds on it.
- **Want it to finally make sense end to end?** Read in order — each phase builds on the last. Three short phases, no math degree required.

## The phases

1. **[Meaning as Coordinates](01-meaning-as-coordinates.md)** — what an embedding *actually is*: a list of numbers that places meaning on a map, so similar meanings land near each other.
2. **[Measuring Similarity](02-measuring-similarity.md)** — how "near" gets computed, and why embedding your query and finding the nearest stored vectors gives you search by *meaning*, not keyword matching.
3. **[Vector Databases & the Gotchas](03-vector-databases-and-the-gotchas.md)** — how millions of vectors get stored and searched fast, the tools that do it, and the three traps that quietly ruin results.

**Related:** [What AI and ML Actually Are](/guides/what-ai-and-ml-are) for the bigger picture, and [RAG, Explained](/guides/rag-explained) — which is what you build *on top of* everything here.

> This guide deliberately stops at "search by meaning." How you feed those search results into a language model to answer questions — Retrieval-Augmented Generation — is its own guide: [RAG, Explained](/guides/rag-explained).
