---
title: "How RAG Works"
guide: "rag-explained"
phase: 2
summary: "The RAG pipeline end to end: chunk your documents, embed the chunks into a vector store ahead of time, then at query time embed the question, retrieve the most relevant chunks, stuff them into the prompt as context, and generate the answer."
tags: [rag, pipeline, chunking, embeddings, vector-store, retrieval, prompt, ai]
difficulty: intermediate
synonyms: ["how does the rag pipeline work", "chunk and embed documents", "retrieve top chunks for a query", "stuff context into the prompt", "rag step by step", "what is an augmented prompt"]
updated: 2026-06-19
---

# How RAG Works

In [Phase 1](01-the-problem-rag-solves.md) we landed the idea: fetch the relevant facts, then let the model answer from them. That raises the practical question — how do you *find* the relevant facts in a pile of thousands of documents, fast, when the user's question won't use the exact same words as your docs?

This phase walks the whole pipeline. It splits cleanly into two stages: a slow **indexing** stage you do ahead of time, and a fast **query** stage that runs on every question.

## The whole pipeline in one picture

```text
  INDEXING  (done once, ahead of time, repeated when docs change)
  ─────────────────────────────────────────────────────────────
   your docs ──► chunk ──► embed each chunk ──► store vectors
   (wiki, PDFs,  (split    (turn text into     (in a vector
    repo, etc.)   into       a number-list       store / index)
                  pieces)    that captures
                             meaning)


  QUERY  (runs on every question)
  ─────────────────────────────────────────────────────────────
   question ──► embed the ──► search the ──► top-k ──► build ──► LLM ──► answer
                question      vector store   chunks    prompt    reads   (grounded
                (same way     for nearest    (the most  (question  & gen-  + citable)
                 as chunks)   vectors        relevant   + chunks)  erates
                                             pieces)
```

The key insight tying the two halves together: you turn *both* your documents and the incoming question into the same kind of object — a **vector** — so you can measure how related they are by math, not by keyword matching. Let's walk each step.

## Step 1 — Chunk your documents

**What it actually is.** Chunking is splitting each document into smaller pieces — a few paragraphs each, roughly. You don't embed a whole 40-page PDF as one blob; you break it into bite-sized chunks.

**Why bother.** Two reasons. First, you want retrieval to return the *relevant paragraph*, not an entire manual — the model's context window is finite and you want to spend it on signal. Second, a vector that represents one focused idea is far more useful for matching than one that tries to average a whole document into a single point.

**A real example.** A 12-page onboarding doc becomes a list of chunks:

```text
chunk 0001  "## Setting up your laptop  — Request access to the VPN via..."
chunk 0002  "## Cloning the monorepo     — Use SSH, not HTTPS. Run git clone..."
chunk 0003  "## Running the test suite    — `make test` runs unit tests; CI also..."
```

*What just happened:* One document became several independently-retrievable pieces, each one focused on a single topic. When someone later asks "how do I run the tests?", you want to surface chunk 0003 alone — not the whole onboarding doc.

> ⚠️ **Gotcha — chunking is a real decision, not a formality.** Chunk too big and each piece is muddy and dilutes the prompt; chunk too small and you slice a single idea in half so neither piece makes sense on its own. We come back to why this is the quiet make-or-break of RAG in [Phase 3](03-why-its-harder-than-it-looks.md).

## Step 2 — Embed each chunk

**What it actually is.** An **embedding** is a list of numbers (a vector) that represents the *meaning* of a piece of text. Run a chunk through an embedding model and you get back something like `[0.021, -0.44, 0.18, ...]` — typically hundreds of numbers. The crucial property: texts that mean similar things land at nearby points, even when they share no words. "How do I run the tests?" and "executing the test suite" end up close together.

> 📝 **Embedding** — a numeric vector that captures the meaning of text, produced by an embedding model. Closeness between two vectors ≈ closeness in meaning. The full story of how this works lives in [Embeddings and Vector Search](/guides/embeddings-and-vector-search) — for RAG you only need the property above.

**What it does in real life.** You embed every chunk and store the resulting vectors in a **vector store** (also called a vector database or index) — a system built to hold millions of these vectors and answer "which stored vectors are nearest to *this* one?" quickly.

**A real example.**

```text
chunk 0003  "Running the test suite — make test runs unit tests..."
            │
            ▼  embedding model
   vector   [ 0.08, -0.21, 0.55, ... ]   ──►  stored in vector index
```

*What just happened:* That chunk is now a point in "meaning space," parked in the index next to other chunks about testing, building, and CI. Steps 1 and 2 are the slow part, and you only redo them when your docs change.

## Step 3 — At query time, embed the question

**What it actually is.** When a question arrives, you run it through the *same* embedding model you used on the chunks. Same model matters — both have to live in the same meaning space for the comparison to be meaningful.

**A real example.**

```text
question  "where do I find the command to run tests?"
          │
          ▼  same embedding model
  vector  [ 0.07, -0.19, 0.58, ... ]   ←  notice: close to chunk 0003's vector
```

*What just happened:* The question is now a point in the same space as your chunks — and it landed near chunk 0003, even though the question said "command to run tests" and the chunk said "make test runs unit tests." No shared keywords, but similar *meaning*, so similar vectors. This is the whole reason embeddings beat keyword search for this job.

## Step 4 — Retrieve the top-k chunks

**What it actually is.** You ask the vector store for the **top-k** chunks whose vectors are nearest to the question's vector — the *k* most relevant pieces. `k` is just how many you pull back; small numbers like 3 to 8 are common starting points.

**A real example.**

```text
$ retrieve(question_vector, k=3)
  0.91  chunk 0003  "Running the test suite — make test runs unit tests..."
  0.74  chunk 0002  "Cloning the monorepo — use SSH, not HTTPS..."
  0.69  chunk 0048  "CI pipeline — every PR triggers the full test run..."
```

*What just happened:* The store ranked every chunk by closeness to the question and handed back the top 3, with a similarity score each. Chunk 0003 is the clear winner; the other two are loosely related. These are your "open-book pages" — the facts you're about to hand the model. (Notice the system retrieves whatever ranks highest, relevant or not — keep that in the back of your mind for Phase 3.)

## Step 5 — Build the augmented prompt

**What it actually is.** You assemble a single prompt that stitches the retrieved chunks together as *context*, adds a clear instruction to answer **from that context**, and then includes the user's actual question. This is the "augmented" in Retrieval-Augmented Generation.

**A real example — an annotated augmented prompt.**

```text
┌─ SYSTEM / INSTRUCTION ──────────────────────────────────────┐
│ Answer the question using ONLY the context below.           │  ← tells the model
│ If the context doesn't contain the answer, say you don't    │     to stay grounded,
│ know. Cite the source chunk you used.                       │     and to admit gaps
├─ CONTEXT (retrieved chunks) ────────────────────────────────┤
│ [chunk 0003] Running the test suite — `make test` runs the  │  ← the facts you
│   unit tests. CI also runs them on every PR.                │     fetched in step 4,
│ [chunk 0048] CI pipeline — every PR triggers the full test  │     pasted in verbatim
│   run before merge.                                         │
├─ USER QUESTION ─────────────────────────────────────────────┤
│ Where do I find the command to run tests?                   │  ← what the user
└─────────────────────────────────────────────────────────────┘     actually asked
```

*What just happened:* You built the open-book exam paper. The instruction sets the rules ("use only this, admit if it's not here, cite it"), the context is the textbook pages you looked up, and the question is the question. The model never had to recall a thing — everything it needs is right there in front of it.

> 💡 **Key point.** That instruction line — "answer only from the context, and say you don't know if it isn't there" — is doing real work. It's your main lever for pushing the model away from falling back on its generic memory. It isn't a guarantee (more on that in Phase 3), but it changes the model's behavior meaningfully.

## Step 6 — Generate

**What it actually is.** You send that assembled prompt to the LLM through its API and get the answer back. If you're new to calling a model programmatically, that mechanical step — building the request, sending it, handling the response — is covered in [Using an LLM API](/guides/using-an-llm-api).

**A real example.**

```text
LLM:  Run `make test` — that runs the unit tests locally. CI also
      runs the full suite on every PR before merge.  [source: chunk 0003]
```

*What just happened:* The model read the context, answered from it, and pointed at the chunk it used. That's a grounded, *verifiable* answer — a human can click through to chunk 0003 and confirm it. That citability is one of RAG's biggest practical wins, and it falls out of the pipeline naturally because you already know exactly which chunks you handed over.

## Recap

1. **Indexing (ahead of time):** chunk your docs → embed each chunk → store the vectors in a vector store.
2. **Querying (every question):** embed the question with the *same* model → retrieve the top-k nearest chunks → build an augmented prompt → generate.
3. Both documents and the question become **vectors**, so you match on *meaning*, not keywords.
4. The **augmented prompt** = instruction ("answer only from this, cite it") + retrieved context + the user's question.
5. Because you know which chunks you sent, you can **cite sources** — grounded answers a human can verify.

You now have a working mental model of the machine. The catch is that this clean pipeline is deceptively easy to build badly. The next phase is the honest one: why real RAG is mostly a retrieval problem, and where it bites.

---

[← Phase 1: The Problem RAG Solves](01-the-problem-rag-solves.md) · [Guide overview](_guide.md) · [Phase 3: Why It's Harder Than It Looks →](03-why-its-harder-than-it-looks.md)
