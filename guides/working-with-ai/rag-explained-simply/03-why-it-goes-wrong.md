---
title: "Why It Goes Wrong"
guide: rag-explained-simply
phase: 3
summary: "The four common failure modes - bad chunking, stale data, wrong-passage retrieval, and ungrounded answers - and how to catch each one."
tags: [rag, retrieval, hallucination, debugging, knowledge-base]
difficulty: intermediate
synonyms:
  - "why does my rag bot give wrong answers"
  - "rag hallucination causes"
  - "rag retrieves wrong documents"
  - "stale data in ai chatbot"
  - "how to debug a rag system"
updated: 2026-06-30
---

# Why It Goes Wrong

RAG is a clean idea, and the demo always works. You point it at a tidy PDF, ask an obvious question, and it nails the answer with a citation. Then you ship it on real documents with real users, and it starts handing out confident, wrong answers. Every time, the failure traces back to one of four steps in the pipeline. Learn these four and you can diagnose almost any RAG problem - and decide how much to trust one you didn't build.

## Failure 1: Bad chunking

Remember chunking - splitting documents into searchable pieces. Get it wrong and everything downstream inherits the mistake, because you can't retrieve a clean answer that was never stored as a clean chunk.

The classic break is **splitting in the middle of an idea**. Your policy says "Refunds are available within 30 days" and then, in the next paragraph, "...except for enterprise contracts, which are non-refundable." If the chunk boundary falls between those two paragraphs, the system can retrieve the first half and never see the exception. The answer it gives is exactly half right, which is worse than no answer.

The other break is **chunks that are too big or too small**. Too big, and a single chunk covers five topics, so it gets retrieved for everything and dilutes the relevant part. Too small, and a chunk lacks the surrounding context needed to make sense - a line that says "this is not permitted" with no nearby clue what "this" is.

What it looks like in the wild: answers that are partially correct, that miss exceptions and edge cases, or that confidently state a rule without its qualifier. The fix is unglamorous - chunk along the document's natural structure (headings, sections), keep related material together, and test with real questions. There's no universal right chunk size; it depends on your documents, which is exactly why teams skip the work and then wonder why the bot is flaky.

## Failure 2: Stale data

RAG's whole pitch is staying current - but only if someone keeps the index current. The retrieval step searches the vectors you stored, not the documents as they exist *right now*. Edit the source document and the stored vectors don't change until something re-processes it.

So the policy team updates the refund window in the wiki on Tuesday. The RAG index was built last month. Until someone re-runs the chunk-and-embed step, the bot keeps quoting the old number - with full confidence and a citation pointing at a document that no longer says that. The citation makes it *more* believable, not less.

This one is sneaky because nothing errors out. The system works perfectly; it's only answering from a stale snapshot. What it looks like: answers that were right last quarter, prices that don't match the current ones, references to a process you've since changed. The fix is operational, not technical - re-index on a schedule or whenever source documents change, and show the document's last-updated date so a human can smell when something's off.

## Failure 3: Retrieving the wrong passages

This is the heart of it, because retrieval is a similarity match, not an understanding. The vector store returns the chunks whose *wording and topic* sit closest to the question - which is usually, but not always, the same as the chunks that *answer* it.

A few ways it whiffs:

- **The right answer exists but loses the race.** It's chunk number eleven, the system only grabs the top five, and the answer never reaches the model. The model then answers from five chunks that don't contain it.
- **It grabs a close cousin.** Ask about the *enterprise* refund policy and it returns the *consumer* refund policy - same topic, same words, wrong audience. They live in the same neighborhood on the map.
- **The question is vague.** "How does this work?" matches a hundred chunks equally well, so the system returns a grab-bag and the answer is mush.

What it looks like: answers that are about the right *subject* but wrong in the *specifics*, or answers that miss information you know is sitting in the documents. The fixes range from cheap to involved - retrieve more chunks and let a second pass re-rank them, combine vector search with old-fashioned keyword search so exact terms aren't lost, and write clearer source documents. But you can never assume retrieval is perfect. It is the step most likely to silently hand the model the wrong page.

## Failure 4: Trusting an answer the sources don't support

Suppose retrieval did its job and handed the model the right passages. The model can *still* produce an answer the passages don't actually back up. It might blend the retrieved text with something half-remembered from training. It might stretch a passage to cover a question it doesn't quite address. It might be handed nothing useful and, instead of saying "I don't know," fill the silence with a plausible guess.

That instruction from Phase 2 - "if the answer isn't in the passages, say you don't know" - reduces this. It does not eliminate it. Models are built to be helpful, and "helpful" and "upfront about not knowing" are in tension. Under pressure, helpfulness often wins.

This is the failure that erodes trust fastest, because the answer *sounds* grounded - it's fluent, it's specific, it may even carry a citation that, on a click, doesn't actually say what the answer claims. What it looks like: confident claims that aren't in the cited source, details that go beyond what the passages contain, an answer where there should have been a plain "I couldn't find this."

The real defense is to **check the citations**, not the prose. A good RAG system shows you the exact passages it used. The discipline - for you and for anyone relying on the tool - is to read those passages, not the AI's summary, whenever the answer matters. If the system can't show its sources, treat its answers like a confident stranger's: possibly right, not to be trusted on anything that counts.

## The diagnostic, in one table

When a RAG answer is wrong, it's almost always one of these. Walk them in order:

| Symptom | Likely culprit |
|---|---|
| Half-right, misses the exception | Bad chunking |
| Was right months ago, wrong now | Stale data |
| Right topic, wrong specifics | Wrong passages retrieved |
| Confident claim not in the source | Ungrounded answer |

RAG is the right tool for "answer from our documents," and when it's built and maintained with care it's genuinely useful. But it is a pipeline of four fallible steps, not a black box that knows things. Understanding where it breaks is what lets you use it without getting burned - and what lets you ask the right question of any RAG product before you trust it with anything that matters.
