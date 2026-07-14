---
title: "Fine-Tuning vs Prompting, Plainly"
guide: "fine-tuning-vs-prompting"
phase: 0
summary: "When training your own model is - and isn't - worth it: prompting steers at request time, RAG adds knowledge, fine-tuning changes the model's default behavior, and the no-nonsense order is to try them cheapest-first."
tags: [fine-tuning, prompting, rag, llm, lora, machine-learning, model-training]
category: ai-ml
difficulty: advanced
synonyms: ["should i fine-tune or prompt", "when to fine-tune an llm", "fine-tuning vs rag", "is fine-tuning worth it", "do i need to train my own model", "fine-tuning vs prompt engineering", "when does fine-tuning make sense"]
order: 8
updated: 2026-07-10
---

# Fine-Tuning vs Prompting, Plainly

At some point - usually after a demo goes well and someone with a budget gets excited - the question lands
on your desk: *"Should we fine-tune our own model?"* It sounds like the serious, grown-up answer. It sounds
like what real AI teams do. And it is, sometimes, exactly the wrong move that costs a quarter and ships
nothing.

The plain truth is that most teams reaching for fine-tuning didn't need it. They needed a better prompt, or
they needed to feed the model the right documents at request time. Fine-tuning is a real tool with a real
job - but it's the most expensive way to steer a model, it locks you in the hardest, and it's the one people
reach for first for the wrong reasons.

This guide gives you the mental model to tell the three approaches apart, a clear-eyed look at what fine-tuning
actually costs, and a decision order you can defend in a meeting. This is the capstone of the AI/ML track - 
it assumes you've met prompting, RAG, and calling an LLM API in the sibling guides, and pulls them together
into one decision.

## How to read this

- **Need to decide right now?** Jump to [Phase 3: Choosing - the No-Nonsense Order](03-choosing-the-honest-order.md)
  and use the decision table at the top.
- **Want it to finally make sense?** Read in order - each phase builds on the last. Phase 1 gives you the
  three-way mental model, Phase 2 shows what fine-tuning really involves, and Phase 3 turns it into a
  decision.

## The phases

1. **[Three Ways to Steer a Model](01-three-ways-to-steer-a-model.md)** - the mental model: prompting changes
   the *instructions*, RAG changes the *knowledge*, fine-tuning changes the *behavior*. The distinction that
   the whole decision rests on.
2. **[What Fine-Tuning Actually Involves](02-what-fine-tuning-actually-involves.md)** - the dataset (where the
   real cost lives), the training run, hosting your tuned model, the lighter LoRA approach, and how you'd
   know if it worked.
3. **[Choosing - the No-Nonsense Order](03-choosing-the-honest-order.md)** - try prompt → RAG → fine-tune, in that
   order, because each step costs more and locks you in more. A decision table, and the two traps that catch
   everyone.

> Deeper material - building a training pipeline, distillation, RLHF, and serving infrastructure at scale - 
> is deliberately out of scope here. This guide is about the *decision*, not the implementation. Once you've
> clearly decided fine-tuning is right, your model provider's tuning docs are your next stop.

**Related guides:** [Prompt Engineering, Honestly](/guides/prompt-engineering-honestly) ·
[RAG, Explained](/guides/rag-explained) · [Using an LLM API](/guides/using-an-llm-api)
