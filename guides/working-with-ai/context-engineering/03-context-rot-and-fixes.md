---
title: "Context Rot and Fixes"
guide: context-engineering
phase: 3
summary: "Why long sessions slowly fill with noise and the model loses the plot, and the handful of fixes - compaction, fresh starts, and pruning - that keep the signal high."
tags: [context-rot, long-conversations, compaction, memory, context-engineering]
difficulty: intermediate
synonyms:
  - why does ai get worse in long chats
  - ai losing track in long conversation
  - when to start a new chat with ai
  - how to fix a confused chatbot
  - context window getting cluttered
updated: 2026-06-30
---

# Context Rot and Fixes

You've all had the long session that started sharp and went soft. The first hour, the model was nailing every request. By hour three it's contradicting earlier decisions, reintroducing a bug you fixed together, ignoring an instruction you gave at the top. Nothing changed about the model. What changed is the window - it filled up with hours of back-and-forth, and the useful signal got buried in the noise.

That slow decline has a name people are starting to use: **context rot**. It is not an official term - the vocabulary here is still settling, and you'll see it called context pollution, context decay, or "the model getting confused in long chats." The label matters less than recognizing the pattern, because once you see it you can fix it in about thirty seconds.

## What actually goes wrong

A few distinct problems hide under the same symptom, and they compound:

- **Crowding.** The window is finite. As the chat grows, the oldest turns get dropped or compressed to make room. Your careful opening instructions can age out entirely. The model isn't ignoring the rule - it can no longer see it.
- **Distraction.** Even when everything still fits, more text means the model's attention is spread thinner. Three abandoned tangents, two pasted error messages you've moved past, a draft you rejected - all still sitting in the window, all still competing for attention against the thing you actually care about now.
- **Stale state.** Long sessions accumulate decisions that got reversed. "Let's use approach A... actually, B." Both are in the window. The model can pick up the dead one and run with it, because to the model, text that's still present is still live.

The through-line: the window doesn't clean itself. Everything you and the model said is still in there, weighted roughly the same, whether it's the current goal or a wrong turn from forty messages ago.

## The fixes

The good news is that the cure is cheap. The instinct to fight against is "let me explain it *again*, more forcefully." Re-explaining adds *more* text to an already-crowded window - you're treating the disease with more of the disease. Reach for these instead.

**Start fresh - the most underused move there is.** When a chat has gone sideways, a new conversation is a blank window with none of the accumulated junk. The fear is losing what you built up, so bridge it: ask the current chat to "summarize everything we've decided and the current state in a tight brief," copy that summary, and paste it as the opening message of a new chat. You keep the signal, drop the noise, and the model is sharp again. Make this a reflex, not a last resort - a fresh start every time the topic shifts cleanly costs you nothing.

**Compaction.** Some tools do a version of the fresh-start automatically: when the window fills, they summarize the older part of the conversation in place and continue from the summary. This is called compaction. It buys room, but it's lossy - details get smoothed away in the summary. If you notice the model getting vaguer about specifics after a long run, compaction may have quietly eaten the detail. The fix is the same: if a precise fact matters, restate it explicitly rather than trusting it survived.

**Prune as you go.** You don't have to wait for a full reset. If you've pasted a long block - a log, a document, a draft - and you're done with it, say so: "we're finished with that error log, ignore it from here." It stays in the window, but you've told the model what's live. Better still, in tools that let you edit or delete earlier messages, remove the dead weight outright. One clean correction beats five increasingly frustrated repeats.

**Keep the goal in front.** In a genuinely long working session, periodically restate where you are: "current goal: finish the onboarding email sequence; tone decided: warm and brief; still open: the subject line for email three." It costs a few seconds and re-anchors the model's attention on what matters now, near the front of the window where it carries the most weight.

## The mindset that ties it together

Step back and the whole guide collapses to one habit: **treat the context window as something you actively curate, not a bucket you keep tossing things into.** A good answer comes from a clean, relevant window. A bad answer usually comes from a window that's missing what it needed, or drowning in what it didn't.

So the moves all rhyme. Include what's needed; cut what isn't. Compress what's too long. Pull in references on demand. Store durable facts as memory, transient ones in the chat. And when a session rots, start fresh with a clean summary rather than shouting into the clutter.

You will never have perfect control over what the model can see - tools do things behind the scenes, windows have limits, summaries lose detail. But you have far more control than most people use. The difference between someone who finds AI unreliable and someone who gets steady, useful work out of it is rarely the model. It's whether they manage the window or let it manage them.
