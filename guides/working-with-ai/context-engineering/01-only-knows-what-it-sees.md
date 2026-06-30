---
title: "The Model Only Knows What It Sees"
guide: context-engineering
phase: 1
summary: "The context window is the model's working memory, and what you put in it matters more than how cleverly you word the request."
tags: [context-window, working-memory, prompting, ai, context-engineering]
difficulty: intermediate
synonyms:
  - what is a context window
  - why does ai forget what i told it
  - does ai remember previous chats
  - how much can ai read at once
  - why ai ignores my attached document
updated: 2026-06-30
---

# The Model Only Knows What It Sees

Picture a brilliant contractor who shows up to your house, does excellent work, and then gets their memory wiped the second they walk out the door. Every visit, they arrive knowing nothing about your house except what you hand them on a sheet of paper at the front door. That sheet is the only thing they read. If the answer to "where's the water shutoff?" is on the sheet, they nail it. If it's not, they guess - and a confident guess from a skilled contractor sounds exactly like knowledge.

That is the model, and that sheet of paper is the context window.

## The window is the whole world

The context window is the block of text the model reads to produce its answer. It holds your current message, any files or images you attached, the system instructions the tool sets behind the scenes, and the back-and-forth so far in this conversation. That is the complete set of things the model can use. It has training knowledge baked in - general facts about the world - but anything specific to *you*, *your* company, *today*, has to be in the window or it doesn't exist for this answer.

This explains a pile of behavior that otherwise looks like the model being broken:

- You ask about a document "you sent earlier" in a different chat, and it has no idea. Different chat, different window. Nothing carried over.
- You correct it, it agrees, and ten messages later it makes the same mistake. The correction scrolled far back; in a long enough conversation, older material gets crowded out.
- It cites a policy that sounds plausible but is wrong. The real policy wasn't in the window, so it filled the gap with something shaped like an answer. People call this a hallucination. Often it's a context gap.

Once you internalize "the window is the whole world," you stop asking *why did it forget* and start asking *was it ever in front of the model in the first place*.

## Working memory, not a hard drive

Think of the window as working memory - like the few things you can hold in your head at once - not as long-term storage. It is finite. Every model has a limit on how much text fits, measured in tokens (roughly, chunks of words; a token is about three-quarters of a word). Modern tools hold a lot - many thousands of words, sometimes the equivalent of a small book - but it is still a ceiling, and you share that ceiling with everything else in the conversation.

Two consequences follow.

First, more is not always better. If you paste a 40-page contract to ask one question about the cancellation clause, the relevant clause is now floating in a sea of mostly irrelevant text. The model can find it, but its attention is split, and the odds of a clean answer drop. Giving it the two relevant pages beats giving it everything.

Second, what falls out of the window is gone. As a chat grows past the limit, tools quietly drop or compress the oldest turns to make room. That early instruction you gave - "always write in British English" - can silently age out. The model isn't disobeying. It can no longer see the rule.

## Why content beats wording

There is a whole industry of advice about magic phrases: say "you are an expert," promise it a tip, threaten it, ask it to "think step by step." Some phrasing tweaks help at the margins. But they are a rounding error next to *what information is in the window*.

Run the comparison in your head. A perfectly worded prompt asking the model to summarize a meeting it cannot see will produce a confident, fictional summary. A clumsy, one-line prompt - "summarize this" - pasted above the actual transcript will produce a real summary. The second one wins, and it isn't close. The transcript did the work, not the wording.

So the first question for any AI task is not "how do I phrase this?" It is "does the model have what it needs to answer?" If you want feedback on your pricing page, paste the pricing page. If you want it to match your brand voice, give it two examples of your writing. If it keeps getting your product's name wrong, put the correct name and a one-line description right there in the message. You are not training the model. You are setting the table.

A useful gut check before you hit send: *if a sharp new hire read only what I typed - nothing else - could they do this?* If the answer is no, the model can't either. Add the missing piece. That instinct - noticing the gap and filling it - is the entire skill. The next phase turns it into a set of repeatable moves: what to include, how to compress long material, how to pull in documents on demand, and how to give a tool memory that outlives a single chat.
