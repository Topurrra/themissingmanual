---
title: "Vector Databases & the Gotchas — Searching Millions, Without Getting Burned"
guide: "embeddings-and-vector-search"
phase: 3
summary: "How vector databases store millions of embeddings and find nearest neighbors fast using approximate (ANN) indexes, the main tools (pgvector, FAISS, Pinecone, and friends), and the three traps that quietly ruin results: cross-model vectors, chunking, and confusing similarity with correctness."
tags: [vector-database, ann, pgvector, faiss, pinecone, chunking, embeddings, gotchas]
difficulty: intermediate
synonyms: ["what is a vector database", "how do vector databases work", "what is ANN approximate nearest neighbor", "pgvector vs pinecone vs faiss", "why is my vector search wrong", "can i mix embeddings from different models", "what is chunking for embeddings", "does similarity mean correct"]
updated: 2026-06-19
---

# Vector Databases & the Gotchas — Searching Millions, Without Getting Burned

In [Phase 2](02-measuring-similarity.md) we compared a query against four documents and read the scores off by hand. That's fine for four. But real systems have a hundred thousand support articles, or ten million product descriptions, and a user expects results before they blink. Comparing the query against every single stored vector, one by one, gets slow exactly when you need it to be fast.

This phase covers the two things that separate a toy from a real system: **how you search millions of vectors quickly**, and the **three gotchas** that make a system technically work while quietly returning garbage. The gotchas matter more than the tooling — you can swap databases in an afternoon, but a chunking mistake will haunt you for months.

## The gotcha cheat-card

> **Search feeling off? Find your symptom, then read the section.**

| Symptom | Likely cause | The fix |
|---|---|---|
| Results are nonsense / everything looks equally (ir)relevant | Query and documents embedded with **different models** (§3) | Re-embed everything with one model; never mix (§3) |
| Right document exists but never surfaces | Document **chunked** too big/small or split mid-idea (§4) | Rethink chunk size and boundaries; re-embed (§4) |
| Top result is "similar" but factually wrong, and you trusted it | **Similarity ≠ correctness** (§5) | Treat results as candidates, not answers; verify (§5) |
| Search is slow at scale | Doing an **exact** scan over millions of vectors (§2) | Use an **ANN index** / a vector database (§1–2) |

---

## 1. A vector database is a search engine for nearest neighbors

**What it actually is.** A **vector database** is a store built for one job: keep a huge pile of embeddings and, given a query vector, return the nearest ones *fast*. It's the specialized muscle behind the "find nearest neighbors" step from Phase 2 — built to do it across millions of vectors without melting.

**What it does in real life.** You hand it vectors (usually with some metadata attached — the original text, an ID, tags), and later you hand it a query vector and ask for the top `k` nearest. It handles the storage, the indexing, and the speed. A typical interaction looks like this:

```text
   WRITE (once, or whenever content changes)
     for each document:  embed it → store (vector + text + metadata)

   READ (every search)
     embed query → ask DB for top-k nearest → get back the documents
```

*What just happened:* The shape is identical to the semantic search from Phase 2 — embed, find nearest, return. The only thing the database adds is the ability to do the "find nearest" part across an enormous collection in milliseconds, plus the bookkeeping to give you back the actual text and metadata, not just a bare vector.

## 2. Why "fast" needs approximation: ANN indexes

**What it actually is.** The honest way to find the true nearest neighbors is to compare the query against *every* stored vector and keep the closest. That's called an **exact** search, and it's correct — but its cost grows with every vector you add. At ten million vectors, exact-on-every-query gets too slow for an interactive app.

The escape is an **ANN index** — Approximate Nearest Neighbor. It organizes the vectors ahead of time (into graphs or clusters) so that at query time it only has to check a small, promising slice of them instead of all of them.

📝 **Terminology — ANN (Approximate Nearest Neighbor).** A search that returns vectors that are *almost certainly* the nearest, by cleverly skipping most of the collection. You trade a tiny bit of accuracy for an enormous speed gain. "Approximate" means it might occasionally miss the true #1 result and return the #2 instead — almost always an acceptable trade.

**What it does in real life.** The trade is the whole point: ANN can be dramatically faster than checking everything, at the cost of *occasionally* missing a true nearest neighbor. For search and recommendations, that's almost always worth it — being a hair less perfect but returning instantly beats being exact and slow. Most vector databases use ANN by default and let you tune how hard it looks (more thorough = more accurate but slower).

⚠️ **Gotcha — "approximate" is in the name for a reason.** If you're doing something where a single miss is unacceptable (say, deduplication that must *never* let a duplicate slip through), know that ANN can miss. For those cases you either accept exact search's cost or tune the index toward higher accuracy. For ordinary search, the approximation is invisible to users.

## 3. The tools (lightly)

You don't need to memorize a catalog, just the shape of the landscape. There are roughly three flavors, and the right one depends on scale and what you already run.

- **A library you embed in your own code** — for example **FAISS** (from Meta). It's a fast nearest-neighbor library you call directly; you own the storage and serving around it. Great for batch jobs and when you want full control.
- **An extension to a database you already have** — for example **pgvector**, which adds vector columns and nearest-neighbor search to PostgreSQL. If your data already lives in Postgres, this keeps vectors right next to it — one system, one backup, normal SQL filters alongside the vector search.
- **A managed vector database service** — for example **Pinecone** (and other hosted services). You send vectors over an API and they run the index, scaling, and ops for you. You pay for not having to operate it.

*What just happened:* Same core operation in all three — store vectors, query for nearest — wrapped in different amounts of "do it yourself" versus "let someone run it." A common, sane path: start with **pgvector** if you're already on Postgres (least new infrastructure), and move to a dedicated service only when scale or features demand it. There's no prize for the fanciest tool.

> This is a *light* tour on purpose. Picking and tuning a specific vector store is a deep topic of its own; the mental model here transfers to all of them.

## 4. Gotcha: vectors from different models can't be compared

This is the one that produces the most baffling "why is my search returning total nonsense?" bug, so we'll be blunt about it.

**What's actually happening.** Every embedding model has its **own private map** (you saw this hinted at in [Phase 1](01-meaning-as-coordinates.md)). Model A's coordinates for "cat" mean nothing on Model B's map — they're different spaces, often even different lengths. Comparing a vector from one model against a vector from another is like comparing a latitude in degrees to a temperature in Celsius. The numbers compute; the result is meaningless.

⚠️ **Gotcha — embed your documents and your queries with the same model, always.** The classic disaster: you embedded all your documents months ago with one model, then embedded incoming queries with a newer one. Every query "works" (returns results, no errors) but the results are random, because the two live in incompatible spaces. And if you **upgrade your embedding model**, you must **re-embed your entire collection** — old and new vectors don't mix. Write the model name down next to your stored vectors so future-you knows what they're in.

**Why this saves you later.** When semantic search suddenly returns garbage after a "harmless" dependency bump or model swap, this is the first thing to check — and the fix (re-embed everything with one consistent model) is straightforward once you know to look.

## 5. Gotcha: chunking decides what can ever be found

**What it actually is.** You usually can't embed a whole 40-page document as one vector — it would blur every topic in it into one muddy average, and most models have a length limit anyway. So you split long text into smaller pieces — **chunks** — and embed each chunk separately. Search then finds the relevant *chunk*, not the whole document.

📝 **Terminology — chunking.** Splitting a long document into smaller passages before embedding, so each passage gets its own vector and can be matched on its own.

**Why people get this wrong.** Chunking feels like a boring preprocessing detail, so people slap an arbitrary "split every 500 characters" on it and move on. But chunking quietly sets the ceiling on what your search can *ever* return. Split too **big**, and one chunk covers five topics — its vector is a vague average that matches everything weakly and nothing strongly. Split too **small**, and you slice a single idea in half, so neither half carries the full meaning. Split mid-sentence, and you can sever the exact passage that answered the question.

⚠️ **Gotcha — bad chunking is invisible until it isn't.** There are no errors. Search runs, returns results, looks fine in a demo. Then a user asks the one question whose answer got split across a chunk boundary, and the right passage never surfaces — because as a vector, it never existed as a coherent unit. When a document you *know* contains the answer refuses to show up, suspect the chunking before you suspect the model. Splitting on natural boundaries (paragraphs, sections) and keeping chunks coherent beats any fixed character count.

## 6. Gotcha: similarity is not correctness

**What's actually happening.** This is the deepest trap, because it's not a bug — the system is doing exactly what you asked. Nearest-neighbor search returns the vectors most *similar* to your query. Similar is not the same as **correct**, **true**, or **up to date**.

A document can be the closest match in meaning while being **wrong** (an outdated policy), **stale** (last year's prices), or **plausibly off-topic** (a passage that sounds relevant but answers a slightly different question). The search did its job perfectly — it found the nearest neighbor. Whether that neighbor is *right* is a question vectors can't answer.

⚠️ **Gotcha — "the top result" is a candidate, not a verdict.** Treat search results as *suggestions to be checked*, not as answers. This matters enormously the moment you feed them to a language model: if you hand a model a confidently-wrong "most similar" passage, it will often present that wrong information confidently. The retrieval being similar does not make the answer true.

**Why this saves you later.** This is precisely the seam where [RAG, Explained](/guides/rag-explained) picks up. RAG feeds these search results to a language model to generate an answer — and "similarity ≠ correctness" is *the* reason RAG systems need careful retrieval, source citations, and verification. Internalize it now and the next guide will feel obvious instead of alarming.

## Recap

1. A **vector database** stores millions of embeddings and returns nearest neighbors fast — the muscle behind Phase 2's search.
2. Speed at scale comes from **ANN indexes**, which trade a tiny bit of accuracy for a huge speed gain by skipping most of the collection.
3. Tools range from **libraries** (FAISS) to **database extensions** (pgvector) to **managed services** (Pinecone) — same core op, different amounts of ops work.
4. **Never mix models:** documents and queries must be embedded with the *same* model, and upgrading a model means re-embedding everything.
5. **Chunking sets the ceiling** on what can be found — split on natural boundaries, not arbitrary character counts.
6. **Similarity is not correctness:** the nearest match can still be wrong, stale, or off-topic — treat results as candidates to verify.

You now understand the full arc: meaning becomes coordinates, "near" becomes a number, and a vector database turns that into search across millions — along with the traps that decide whether it works in practice. The natural next step is feeding these results to a language model to actually answer questions, which is exactly what [RAG, Explained](/guides/rag-explained) is about.

---

[← Phase 2: Measuring Similarity](02-measuring-similarity.md) · [Guide overview](_guide.md) · [Next guide: RAG, Explained →](/guides/rag-explained)
