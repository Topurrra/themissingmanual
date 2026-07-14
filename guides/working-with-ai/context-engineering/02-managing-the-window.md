---
title: "Managing the Window"
guide: context-engineering
phase: 2
summary: "The practical moves for filling the window well: choosing what to include, compressing long material, pulling in documents on demand, and giving a tool memory that survives across sessions."
tags: [context-window, rag, retrieval, memory, context-engineering]
difficulty: intermediate
synonyms:
  - how to give ai the right context
  - what is rag retrieval augmented generation
  - how to summarize long documents for ai
  - giving ai long term memory
  - selecting what to paste into a chatbot
updated: 2026-06-30
---

# Managing the Window

If phase one was the diagnosis - the model only knows what it sees - this is the treatment. There are four moves you reach for, roughly in order of effort: choose what to include, compress what's too long, pull in material on demand, and give the tool a memory that outlives the chat. You will use the first two constantly, the third when your material won't fit, and the fourth when you find yourself re-explaining the same things every session.

## Move 1: Choose what to include

The default mistake is dumping everything; the second mistake is dumping nothing and hoping. The target is in between: the relevant material, plus enough surrounding context to make sense of it, and not much more.

A workable habit before any non-trivial request - ask yourself what the model needs to see:

- **The goal.** What does a good answer look like? "Draft a refund email" is vague; "draft a refund email, apologetic but not groveling, offering store credit, under 120 words" gives the model a target.
- **The specifics.** The actual customer message, the actual numbers, the actual clause. Not your paraphrase - the source.
- **The constraints.** Tone, length, format, things to avoid. "Don't promise a refund date" prevents a whole class of bad output.
- **An example, when you can.** One sample of the output you want - a past email, a paragraph in your voice - teaches more than a paragraph of description. Showing beats telling.

What to leave out is half the craft. The legal footer on every email, the boilerplate, the eleven attachments when one is relevant - cut them. Each irrelevant block dilutes the model's attention and eats room you may need later.

## Move 2: Compress what's too long

Sometimes the material genuinely matters but won't fit, or fitting it would crowd out everything else. The answer is to compress before you feed.

The reliable pattern is summarize-then-work. Ask the model to distill the long thing first - "summarize this 30-page report into the ten decisions it asks me to make" - then work from the summary. You can even do this across a long chat: when a conversation gets unwieldy, ask "summarize what we've decided so far in a tight bullet list," then start fresh with that summary as your opening message. You've hand-rolled a clean window out of a messy one.

Be clear about the tradeoff: summarizing loses detail. If exact wording matters - a contract clause, a quoted figure - keep the original text for that part and summarize the rest. Compression is for the background, not the load-bearing details.

## Move 3: Pull in material on demand (retrieval / RAG)

When your knowledge is too big to ever fit - a 500-page handbook, three years of support tickets, a whole documentation site - you can't paste it. Instead, the tool fetches only the relevant slices at the moment you ask, and drops them into the window for that one answer. This is what people mean by **retrieval**, or **RAG** (retrieval-augmented generation). The name sounds technical; the idea is a librarian who, instead of handing you the whole library, pulls the three pages that answer your question.

You meet retrieval more often than you might think:

- A "chat with your documents" feature, where you upload a folder and ask questions across it.
- A customer-support bot that answers from your help center.
- An enterprise assistant wired into your company wiki or drive.

The practical thing to know as a user: retrieval is only as good as what it pulls. If the bot gives a wrong answer, the failure is usually that it pulled the wrong slice - or the right answer wasn't in the source at all - not that the model is dumb. That's why retrieval systems that show their sources are worth more than ones that don't: when you can see *which* pages it used, you can tell at a glance whether it grabbed the right ones. If you're choosing or configuring such a tool, that visibility is the feature to insist on.

## Move 4: Give it memory across sessions

Everything so far lives and dies inside one conversation. Memory is the layer that survives across them. Many tools now offer it: a place where the system stores durable facts about you - your role, your projects, your preferences - and quietly slips them into the window at the start of new chats so you stop repeating yourself.

It is worth understanding what's actually happening. The model still has no real long-term memory of its own. "Memory" is a notes file the tool keeps on the side and re-injects into the context window each time. It is the same mechanism - text in the window - with the tool doing the pasting for you.

That framing tells you how to use it well:

- **Put stable facts in memory, not transient ones.** "I manage a five-person support team" is durable. "I'm debugging a bug today" is not - that belongs in the chat.
- **Review what's stored.** Most tools let you see and edit the memory. A stale or wrong fact gets re-injected into *every* future chat, quietly poisoning answers. Prune it.
- **Mind the privacy line.** Whatever lands in memory rides along into future sessions. Don't store secrets or sensitive client details you wouldn't want resurfacing later.

These four moves cover the deliberate side of context: what you choose to put in. The next phase covers what creeps in on its own - the slow accumulation of clutter in a long session, and how to clear it before it drags the model down.
