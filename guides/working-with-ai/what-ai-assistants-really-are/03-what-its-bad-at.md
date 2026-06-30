---
title: "What It Is Bad At"
guide: what-ai-assistants-really-are
phase: 3
summary: "The honest failure modes — confident wrong answers, no real memory, shaky exact math, and blindness to your private facts and recent events — and how to work around each."
tags: [llm, limits, hallucination, mental-model, how-ai-works]
difficulty: beginner
synonyms:
  - why does ai make things up
  - ai hallucination explained
  - does ai remember conversations
  - why is ai bad at math
  - limits of ai assistants
  - can ai access my private data
updated: 2026-06-30
---

# What It Is Bad At

Every tool has an edge where it stops working, and knowing that edge is what separates people who use a tool well from people who get burned by it. AI assistants are genuinely useful — and they fail in specific, repeatable ways that come straight from how they're built. None of these are bugs that a future update quietly erases. They're consequences of "a model that predicts text," and they're worth knowing cold.

## It will be confidently wrong

This is the big one. Because the model produces text that *sounds right* rather than text it has verified, it will sometimes state false things in the exact same calm, fluent tone it uses for true things. The industry word is **hallucination**, and it's not rare or exotic — it's the normal behavior of a system optimized to sound plausible.

The dangerous part isn't that it's wrong. Everything is sometimes wrong. The dangerous part is that *the tone doesn't change.* A made-up court case, a fake statistic, a citation to a study that doesn't exist — all delivered with the same confidence as 2 + 2. There's no built-in "I'm not sure" wobble in the voice. It cannot reliably tell you when it's guessing, because from the inside, guessing and knowing are the same operation: predict the next plausible words.

What to do about it: treat fluent output as a *draft*, not a *fact*. Anything you'd be embarrassed to get wrong — names, numbers, dates, quotes, legal or medical claims, citations — verify against a real source before you rely on it. Ask "where did you get that?" and check the answer; a fabricated source looks as real as a true one until you click it. The model is a fast, tireless first-drafter. It is not a fact-checker, and it should never be the last word on anything that matters.

## It has no real memory by default

It feels like the assistant remembers you. It doesn't, at least not the way you'd assume. Each time it responds, it's working from the text in front of it right now — this conversation, on its desk. Start a brand-new chat and, by default, it has no idea who you are or what you said yesterday. The slate is blank.

Within one conversation it "remembers" only because the earlier messages are still on the desk (that context window from Phase 1). Make the conversation long enough and the early parts slide off the edge — which is why a very long chat sometimes seems to forget how it started.

Some products bolt on a memory feature that saves notes about you between sessions, and that genuinely helps. But it's a feature layered on top, not something the model does on its own, and it's saving short summaries — not a perfect transcript of everything. So: don't assume it recalls a detail from three chats ago. If something matters, put it in front of the model again. Re-paste the key facts. Repetition isn't a failure on your part; it's how the thing actually works.

## It is shaky at exact math

You'd expect a computer to nail arithmetic. This one often doesn't — because it isn't calculating, it's predicting what the answer *looks like*. For small, common sums it's usually right (it has seen them written out a million times). For long multiplication, precise percentages, or anything with many digits, it can produce a number that's confidently, specifically wrong.

The fix is built into many tools already: give the model a calculator or code tool (Phase 1's tools again) and the loop hands the actual computation to real software, then reads back the exact result. So the practical move is to prefer assistants that *run* the math over ones that *narrate* it — and for anything where the digits matter, like money or measurements, check the number yourself or have it use a tool. Treat raw mental arithmetic from the model the way you'd treat a colleague doing sums in their head: probably fine, occasionally off, worth confirming.

## It doesn't know your private facts or this week's news

Two blind spots, same root. The model learned from text up to a **training cutoff** — a date after which it has seen nothing. Ask it about an event from last week, a price that changed yesterday, or a product released this morning, and it's either guessing or working from stale information. It may not even tell you it's out of date.

And it has never seen your private world. Your company's internal numbers, your unpublished docs, your customer list, what you decided in yesterday's meeting — none of that was in its training, so it cannot know it. If it answers a question about your internal data without being given that data, it's inventing.

Both gaps get patched the same way: tools. Web search closes the recency gap by fetching current pages. A connection to your documents or systems closes the private-knowledge gap by feeding it your actual files. This is why "can it search the web?" and "can it see my documents?" are the questions that decide whether an assistant is useful for a given task. Without those tools, assume two hard limits: it doesn't know what happened after its cutoff, and it doesn't know anything specific to you.

## The through-line

Look back and every one of these traces to a single sentence: **it predicts plausible text, it doesn't verify truth.** Confident errors, no built-in memory, shaky math, no recent or private knowledge — all the same fact wearing different clothes. That's not a reason to avoid these tools. It's the manual for using them well: lean on them for drafts, ideas, explanations, and tireless first passes; keep a human and a real source between their output and anything that counts. Used that way, the limits stop being traps and become the edges you steer around.
