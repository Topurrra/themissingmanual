---
title: "Give the AI Your Documents"
guide: rag-explained-simply
phase: 1
summary: "Why a plain chatbot can't answer from your private or current files, and what retrieval changes about that."
tags: [rag, knowledge-base, ai, retrieval, context]
difficulty: intermediate
synonyms:
  - "why doesnt chatgpt know my documents"
  - "ai cant answer about my company"
  - "frozen training data problem"
  - "rag vs fine tuning difference"
  - "make ai use my files"
updated: 2026-06-30
---

# Give the AI Your Documents

Ask a plain AI chatbot "what's our refund window for enterprise customers?" and watch what happens. It has never seen your refund policy. So it answers from the average of everything it read during training — "typically 30 days" — in a confident tone that gives you no signal that it's guessing. The answer might be right. It might be six months out of date. You have no way to tell from the reply.

This is the core problem, and it has two halves.

## The model's memory is frozen and generic

An AI model learns from a giant pile of text up to a cutoff date, and then it stops. It's a snapshot. After that, it knows nothing new unless you tell it. Last week's price change, the policy you shipped yesterday, the contract you signed this morning — none of it is in there.

And even for things that *were* in the training data, the model absorbed the public internet, not your private drive. Your internal runbooks, your customer records, your unreleased product specs were never part of it. The model is a brilliant generalist who has read a library but never set foot in your office.

So when you ask it about your world, it has two failure modes. It admits it doesn't know — honest but useless. Or it pattern-matches to something plausible and states it as fact. That second one is the dangerous default, because the confidence never drops to match the ignorance.

## Two ways to fix it (and why one wins)

There are really only two ways to get private or current knowledge into an AI's answers.

**Fine-tuning** retrains the model on your data so the knowledge gets baked in. It sounds like the obvious move, but it's the wrong tool for facts. It's slow and expensive to do, you have to redo it every time a document changes, and — the killer — the model still can't tell you *where* an answer came from. Your refund policy changes Tuesday, and your fine-tuned model happily quotes the old one until you retrain. Fine-tuning is good at teaching a model a *style* or a *format*. It's bad at keeping it current on *facts*.

**Retrieval** leaves the model alone and changes what you hand it at question time. Right before the model answers, a search step finds the relevant passages in your documents and pastes them into the prompt. The model reads them on the spot and answers from them. This is RAG.

The difference matters in practice:

| | Fine-tuning | Retrieval (RAG) |
|---|---|---|
| Update a fact | Retrain the model | Edit the document |
| Cost to change | High, every time | Roughly free |
| Can cite the source | No | Yes |
| Good for | Tone, format, behavior | Current, private facts |

For "answer from our documents," retrieval wins on every line that matters. That's why almost every "chat with your docs" product you've seen is RAG under the hood, not a custom-trained model.

## The open-book exam analogy

Here's the mental model to carry through the rest of this guide.

A plain chatbot is a student taking an exam from memory. Smart, well-read, but stuck with whatever they happened to study, and prone to bluffing on the questions they didn't.

RAG is the same student taking an *open-book* exam. Before each question, someone hands them the two or three pages most likely to contain the answer. The student is as smart, but now they're reading the actual source instead of straining to recall it. The answers get more accurate, more current, and — because they're working from specific pages — they can point at where the answer came from.

That last part is the quiet superpower. A good RAG system can show you the passages it used. "Here's the answer, and here are the three paragraphs from the employee handbook I based it on." Now you can check its work. A plain chatbot gives you a verdict with no evidence; RAG gives you a verdict with a paper trail.

## When you actually need it

You don't need RAG for everything. If you're asking the AI to brainstorm names, rewrite an email, or explain a general concept, its built-in memory is plenty.

You need RAG when the answer has to come from a specific, trusted body of text:

- A support bot that answers from *your* product docs, not generic advice.
- An internal tool that answers questions from policies, contracts, or wikis.
- Anything where being current matters — prices, inventory, this quarter's numbers.
- Anything where a wrong answer is expensive and you need to show the source.

The pattern in all of these is the same: the truth lives in documents you control, and you want the AI to read from them instead of from a hazy memory of the public internet. The next phase opens up the box and shows how that retrieval step actually finds the right pages.
