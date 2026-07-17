---
title: "Why It's Harder Than It Looks"
guide: "rag-explained"
phase: 3
summary: "RAG quality is retrieval quality. The failure modes - bad chunking, the model ignoring or misusing context, retrieving irrelevant or stale chunks, and thin context that still leaves it hallucinating - plus how to defend (cite sources, evaluate retrieval, keep the index fresh), and the clear line between RAG and fine-tuning."
tags: [rag, retrieval, chunking, evaluation, hallucination, fine-tuning, ai]
difficulty: intermediate
synonyms: ["why is rag hard", "rag not returning good answers", "rag still hallucinates", "how to evaluate rag retrieval", "rag vs fine tuning", "keep rag index fresh", "model ignores context"]
updated: 2026-07-10
---

# Why It's Harder Than It Looks

A basic RAG demo takes an afternoon. A RAG system you'd trust with real questions takes a lot longer - and the gap surprises almost everyone. The reason is one sentence worth tattooing on the project:

> **The model can only be as good as what you retrieve. Garbage in, confident garbage out.**

Generation gets the attention because it's the part that talks, but the model is rarely your bottleneck. **Retrieval is.** If the right chunk never makes it into the prompt, no amount of clever prompting saves you - the model is answering an open-book exam with the wrong page open. This phase is the clear-eyed tour of where that goes wrong, and what to do about it.

## The failure-mode cheat-card

> **Answer looks wrong? Find the symptom, then read the section.**

| Symptom | What's probably happening | Section |
|---|---|---|
| Answers are vague or miss the obvious detail | Chunks too big/small - the right idea got diluted or sliced | §1 |
| The right info exists but never shows up in answers | Retrieval is pulling the wrong chunks | §2 |
| Model ignores the context and answers from memory | Weak instruction, or context buried/contradicted | §3 |
| Answers are confidently outdated | Stale index - docs changed, vectors didn't | §4 |
| Still makes things up despite retrieval | Context was thin or absent; model filled the gap | §5 |

## 1. Chunking is the quiet make-or-break

Flagged in [Phase 2](02-how-rag-works.md), and it earns its own section because it's the single most underestimated knob.

**Why it bites.** Your chunks are the *only* units retrieval can return. Too large, and the embedding is a muddy average of several topics - it matches weakly and pads the prompt with irrelevant text. Too small, and you split a single fact across two chunks, so retrieving one gives the model half a sentence with no context.

```text
   TOO BIG                          TOO SMALL
   ┌──────────────────────┐        ┌──────────┐ ┌──────────┐
   │ setup + testing + CI │        │ "max     │ │ file     │
   │ + deploy, all in one │        │  upload" │ │  size is │
   │ → muddy vector,      │        │          │ │  10 MB"  │
   │   bloated prompt     │        └──────────┘ └──────────┘
   └──────────────────────┘         → the fact is split in two
```

**The calm approach.** Chunk along the document's natural seams - headings, sections, logical paragraphs - rather than blindly every N characters. A sane default is to split on structure and allow a small *overlap* between adjacent chunks so an idea straddling a boundary survives in at least one piece. There's no universal right size; it depends on your docs, which is exactly why §2 (measuring retrieval) matters.

## 2. Retrieving irrelevant chunks

**Why it bites.** The vector store *always* returns your top-k nearest chunks - even when none actually answer the question. "Nearest" is not "relevant." If your docs don't contain the answer, retrieval still hands back the *closest* chunks, and now the model has confident-looking but off-target context.

**A real example.**

```text
$ retrieve("what's our refund policy?", k=3)
  0.55  chunk 0012  "Return shipping is paid by the customer unless..."
  0.52  chunk 0077  "Our pricing tiers: Basic, Pro, Enterprise..."
  0.51  chunk 0090  "Support hours are 9–5 ET, Monday–Friday..."
```

*What just happened:* Nothing scored high (all near 0.5, versus the 0.91 we saw for a genuine hit in Phase 2). There is no refund-policy chunk, so the store returned the three *least irrelevant* ones. Feed these to the model and it'll either improvise a refund policy from shipping rules, or - if instructed well - say it doesn't know. The low scores were the warning sign.

**The calm approach.** Use the similarity scores: set a floor, and treat anything below it as "no good context" rather than forcing an answer. Better retrieval also helps - many production systems combine vector search with old-fashioned keyword search (so exact terms like a product code aren't lost), and some add a *reranking* step that re-scores candidates more carefully. Reach for those when measurement (below) shows you need them, not on day one.

## 3. The model ignores or misuses the context

**Why it bites.** Even with the right chunk in the prompt, the model can lean on its own training-data memory and answer from there, or blend the context with a half-remembered fact and quietly contradict your docs. Giving it context is an invitation, not a handcuff.

**The calm approach.** A few things move the needle, in rough order of effort:

- **Instruct explicitly.** Spell out "answer *only* from the context; if it's not there, say you don't know." The bare version lives in the Phase 2 prompt.
- **Demand citations.** Asking the model to quote or name the source chunk pushes it to actually use the context - and gives you a way to catch it when it doesn't.
- **Mind the ordering.** Models can pay less attention to material buried in the middle of a long context. Fewer, better chunks usually beat dumping twenty mediocre ones.

> 💡 **Key point.** "Just add more context" is the instinct, and it backfires. A bloated prompt full of marginal chunks dilutes the good one and can *increase* the chance the model latches onto the wrong detail. Precision beats volume, every time.

## 4. The index goes stale

**Why it bites.** Your vectors are a *photograph* of your docs taken at index time. Edit a doc and the photograph doesn't update itself - the chunk and its vector keep reflecting old text. RAG then confidently retrieves and cites outdated information, arguably worse than not knowing, because it *looks* sourced.

**The calm approach.** Treat indexing as an ongoing job, not a one-time setup. Re-index changed documents on a schedule, or trigger a re-index when a source updates. The good news - a genuine advantage over retraining a model - is that refreshing knowledge is cheap: re-embed a handful of changed chunks, not retrain anything. Keeping the index fresh is mostly a matter of remembering to.

## 5. It still hallucinates when the context is thin

**Why it bites.** RAG reduces hallucination; it doesn't abolish it. If retrieval comes back thin - nothing relevant, or only a fragment - the model is back in the gap-filling business from [Phase 1](01-the-problem-rag-solves.md), now with the extra danger that surrounding context lends its guess a false air of authority.

**The calm approach.** Accept "I don't know" as a *good* outcome and design for it: when nothing clears your similarity floor (§2), short-circuit and tell the user you don't have that information rather than asking the model to wing it. A plain "not found" earns far more trust than a confident fabrication.

## How you actually keep this straight: evaluate retrieval

Everything above shares one cure: you can't fix what you don't measure, and the thing to measure is **retrieval**, separately from generation.

Build a small set of real questions paired with the chunk(s) that *should* be retrieved for each. Run retrieval and check: did the right chunk show up in the top-k? This is the single highest-leverage habit in RAG - it tells you whether a bad answer is a *retrieval* problem (the right chunk never arrived) or a *generation* problem (it arrived and the model fumbled it). Without that split, you're tuning blind.

> ⚠️ **Gotcha - don't only eyeball the final answer.** A fluent answer can be wrong, and a clunky answer can be perfectly grounded. Judging RAG by how the output *reads* is how broken retrieval hides in plain sight. Check what was retrieved, not just what was said.

## The clear comparison: RAG vs fine-tuning

Sooner or later someone asks: "Why retrieve at all - why not *fine-tune* the model on our data?" They solve different problems, and conflating them is a common, expensive mistake.

> 📝 **Fine-tuning** - continuing to train an existing model on your own examples, adjusting its weights so it absorbs a new *behavior, format, or style*.

The clear split, both sides:

| | **RAG** | **Fine-tuning** |
|---|---|---|
| What it changes | What the model *knows* (facts in the prompt) | How the model *behaves* (style, format, tone) |
| Best for | Injecting your facts, docs, knowledge | Teaching a consistent voice, structure, or task pattern |
| Updating | Re-index changed docs - cheap, fast | Retrain on new examples - slower, costlier |
| Can cite sources? | Yes - the facts are right there | No - knowledge is baked into weights |
| Risk | Bad retrieval → bad answer | Stale/expensive to refresh; can still hallucinate facts |

The rule of thumb: **RAG adds knowledge; fine-tuning adds behavior.** "The model doesn't know our stuff" is RAG. "The model doesn't *answer in our style/format*" is fine-tuning. They're not rivals - plenty of serious systems do both: fine-tune for the voice, retrieve for the facts. Deeper on the other half: [Fine-Tuning vs Prompting, Plainly](/guides/fine-tuning-vs-prompting).

> ⏭️ Want to sharpen the *instruction* half of the augmented prompt - getting the model to obey "answer only from context" reliably? Covered in [Prompt Engineering, Plainly](/guides/prompt-engineering-plainly).

## Recap

1. **RAG quality is retrieval quality** - the model can't use a chunk you never retrieved.
2. **Chunking** is the quiet make-or-break: split on natural seams, allow small overlap, and measure.
3. The store always returns *something* - use **similarity scores** to reject weak retrievals instead of forcing an answer.
4. **Instruct and demand citations** so the model uses the context instead of its memory; precision beats volume.
5. **Keep the index fresh** - stale vectors produce confidently outdated, sourced-looking answers.
6. **Evaluate retrieval separately** from generation, against known good answers - that's how you know what to fix.
7. **RAG adds knowledge; fine-tuning adds behavior.** Pick by the problem you actually have, or use both.

---

[← Phase 2: How RAG Works](02-how-rag-works.md) · [Guide overview](_guide.md)
