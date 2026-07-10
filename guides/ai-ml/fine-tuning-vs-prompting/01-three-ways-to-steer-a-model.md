---
title: "Three Ways to Steer a Model"
guide: "fine-tuning-vs-prompting"
phase: 1
summary: "The three ways to change what a model gives you: prompting changes the instructions at request time, RAG injects knowledge at request time, and fine-tuning adjusts the model's weights to change its default behavior — RAG adds knowledge, fine-tuning teaches behavior."
tags: [prompting, rag, fine-tuning, mental-model, llm, weights, behavior]
difficulty: advanced
synonyms: ["difference between prompting rag and fine-tuning", "does fine-tuning add knowledge", "rag vs fine-tuning knowledge", "what does fine-tuning change", "how to steer an llm"]
updated: 2026-07-10
---

# Three Ways to Steer a Model

Out of the box, a large language model is a generalist. It will write you a sonnet, a SQL query, and a
breakup text with the same shrug of competence. Your job is almost never "use a model" — it's "make *this*
model reliably do *our specific thing*, in *our specific way*." That's steering.

There are exactly three levers you can pull, and the entire fine-tuning-vs-prompting debate comes down to
knowing which lever fixes which problem. Pull the wrong one and you'll spend weeks and a real budget solving
a problem the cheapest lever would have solved in an afternoon.

## The one picture to hold onto

A model's output depends on two things: the **weights** (the billions of numbers baked in during training —
the model's "instincts," its defaults) and the **context** (everything you hand it at request time — the
prompt, the conversation, any documents you paste in). Two of your three levers work on the context; one
works on the weights.

```mermaid
flowchart TD
  subgraph RT["REQUEST TIME — cheap, instant, reversible"]
    direction LR
    P["PROMPTING<br/>changes WHAT you ask for"]
    R["RAG<br/>changes WHAT facts it sees"]
  end
  subgraph TT["TRAINING TIME — expensive, slow, sticky"]
    F["FINE-TUNING<br/>changes HOW it answers by default"]
  end
  P -->|fed in as context| OUT[model output]
  R -->|fed in as context| OUT
  F -->|baked into the weights| OUT
```

*The dividing line that matters most:* **RAG adds knowledge. Fine-tuning teaches behavior.** Almost every
expensive mistake in this space is someone fine-tuning to add knowledge (which RAG does better and cheaper)
or someone trying to prompt their way to a consistent format at scale (which is exactly fine-tuning's job).

## Lever 1 — Prompting: change the instructions at request time

**What it actually is.** You write the model better instructions — that's the whole lever. Tell it who to be
("You are a terse senior code reviewer"), what to do, what format to use, and show it a couple of examples
right there in the prompt. Nothing about the model changes; you're feeding a generalist a clearer brief each
time you call it.

**What it does in real life.** It's the fastest, cheapest, most reversible way to steer. Edit a string and
the behavior changes on the next request — no training, no waiting, no infrastructure. Modern models are
startlingly steerable this way.

**A real example.** Showing the model two examples inside the prompt ("few-shot" prompting) often gets you
most of the way to a consistent format:

```text
System: Classify each support ticket as BUG, BILLING, or FEATURE.
        Reply with only the label.

User: "I was charged twice this month."        → BILLING
User: "The export button does nothing."        → BUG
User: "Can you add dark mode?"                  → FEATURE
User: "App crashes when I open settings."       →
```

*What just happened:* You didn't change the model at all — you showed it the pattern in the context, and a
capable model will continue it (`BUG`). This is the lever to exhaust before considering the others; it's
covered properly in [Prompt Engineering, Honestly](/guides/prompt-engineering-honestly).

**The gotcha.** Prompting has a ceiling. Stuff enough rules and examples into every request and three things
creep up: the prompt gets long (you pay per token, every call), the model starts ignoring instructions
buried in the middle, and behavior stays *mostly* consistent rather than *reliably* consistent. When you hit
that ceiling honestly — not in your imagination — that's the first real signal another lever might be
warranted.

## Lever 2 — RAG: inject knowledge at request time

**What it actually is.** RAG (Retrieval-Augmented Generation) means: before you call the model, go fetch the
relevant facts — from your docs, your database, your knowledge base — and paste them into the prompt. The
model answers using text you handed it a moment ago, instead of relying on whatever it happened to absorb
during training.

**What it does in real life.** It gives a general model *your* specific, current knowledge without changing
the model at all. Pricing page changed this morning? Update the document; the next answer is correct. A
customer asks about an internal policy the model has never seen? Retrieve the doc and hand it over — the
model reads it like an open-book exam.

**A real example.** Conceptually, RAG turns a closed-book question into an open-book one:

```text
Without RAG:  "What's our refund window?"  → model guesses from generic training → maybe wrong

With RAG:     [retrieve: refund-policy.md]
              "Using the policy below, what's our refund window?
               --- Refunds accepted within 30 days of purchase. ---"
                                          → model reads it → "30 days." (correct, sourced)
```

*What just happened:* The model didn't *learn* your refund policy — it *read* it, at request time, from
context you supplied. Change the policy file and the answer changes immediately, nothing to retrain. The
full machinery (chunking, embeddings, retrieval) lives in [RAG, Explained](/guides/rag-explained).

**The gotcha.** RAG fixes *what the model knows*, not *how it behaves*. It will happily retrieve your refund
policy and then answer in a rambling, off-brand, wrong-format way, because RAG never touched its behavior.
If your problem is "the model doesn't know our facts," RAG is your tool. If it's "the model knows plenty but
won't consistently answer in our voice/format," RAG won't help — that's the doorway to the third lever.

## Lever 3 — Fine-tuning: change the model's default behavior

**What it actually is.** Fine-tuning takes an existing trained model and nudges its **weights** — the numbers
that *are* the model — by training it further on hundreds or thousands of your own example input/output
pairs. You're not giving it instructions or documents; you're changing its instincts so the behavior you
want becomes its *default*, with no special prompting required.

📝 **Weights.** The billions of numbers learned during a model's original training. They encode everything
the model "knows" and every habit it has. Prompting and RAG leave the weights untouched; fine-tuning is the
only lever that edits them.

**What it does in real life.** After fine-tuning on, say, three thousand examples of your support replies,
the model writes in your support voice *by default* — terse where you're terse, with your standard sign-off —
even from a bare prompt. The behavior is baked in, so prompts get shorter (the rules live in the weights now,
not in every request) and consistency gets tighter than prompting alone reliably delivers.

**A real example.** The shape of fine-tuning is a file of demonstrations:

```text
{"input": "where's my order #4821",
 "output": "Hi! Order #4821 shipped Tuesday — tracking: <link>. Anything else? — Support"}

{"input": "this is broken and I'm furious",
 "output": "I'm really sorry. Let's fix this fast. Can you tell me what you were doing when it broke? — Support"}

   ... a few thousand more pairs in exactly the tone and format you want ...
```

*What just happened:* You're not telling the model rules in prose — you're showing it the behavior, over and
over, and training adjusts the weights until that behavior is the path of least resistance. The voice,
structure, and sign-off become *defaults*, not instructions you repeat every call.

**The gotcha — the one that costs the most.** Fine-tuning is a poor way to teach *facts*. People assume
"training it on our documents" will make the model *know* our documents. What it mostly learns is the
*style* and *shape* of those documents, not reliable recall of their contents — and any fact that changes
next week is now frozen into weights you'd have to retrain to update. For knowledge, RAG wins almost every
time. Hold this line: **fine-tune for behavior, retrieve for knowledge.**

**Why this saves you later.** When the budget-holder asks "should we train our own model so it knows our
product?", you have the honest answer ready: training won't reliably make it *know* the product (that's
RAG), and you almost certainly haven't exhausted prompting yet. You've just saved a quarter.

## Recap

1. A model's output comes from its **weights** (its defaults) plus its **context** (what you hand it per
   request). Prompting and RAG work on context; fine-tuning works on weights.
2. **Prompting** changes the *instructions* at request time — cheapest, fastest, fully reversible, but it has
   a ceiling.
3. **RAG** injects *knowledge* at request time — the right tool when the model doesn't know your facts, and
   facts change without retraining.
4. **Fine-tuning** changes the model's *default behavior* by editing its weights — the right tool for
   consistent voice/format/style, the wrong tool for teaching facts.
5. The line that drives every decision: **RAG adds knowledge, fine-tuning teaches behavior.**

Now that you can tell the levers apart, the next phase looks honestly at what pulling the fine-tuning lever
actually takes — because the cost is rarely where people expect it.

---

[← Guide overview](_guide.md) · [Phase 2: What Fine-Tuning Actually Involves →](02-what-fine-tuning-actually-involves.md)
