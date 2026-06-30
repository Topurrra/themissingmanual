---
title: "Prompting Inside the IDE"
guide: ai-in-your-editor
phase: 2
summary: "How to feed editor AI the right context - selections, specific files, and project rules - so its suggestions match your code instead of a generic version."
tags: [copilot, cursor, context, prompting, ai]
difficulty: beginner
synonyms:
  - "how to give copilot context"
  - "cursor add files to chat"
  - "why are ai suggestions wrong for my code"
  - "project rules for ai editor"
  - "ai context window in ide"
updated: 2026-06-30
---

# Prompting Inside the IDE

The single biggest reason editor AI gives you a wrong or generic answer isn't that the model is dumb. It's that it answered the question without the information it needed - because you didn't give it. Editor AI only knows what it can see, and what it can see is something you control more than you might think.

## The mental model: a sharp colleague who reads only what you hand them

Picture a sharp colleague who's new to your project. Ask them "is this right?" while pointing at nothing, and you'll get a generic answer. Hand them the exact function, tell them what it's supposed to do, mention the team rule about how you name things - now they're useful. The AI is the same. The quality of what comes back tracks the quality of what you put in front of it.

Three levers control that input: selection, files, and rules.

## Lever one: select before you ask

The fastest way to focus the AI is to highlight the exact code you mean before you start a chat. Select the function, then ask "why does this crash on an empty list?" Now the AI knows precisely what "this" refers to. Without a selection, it has to guess from whatever's open, and it often guesses the wrong scope.

This sounds obvious and almost nobody does it consistently. Highlight first, then ask. It's the difference between "what's wrong here?" gesturing vaguely at a wall and pointing at the one line.

## Lever two: name the files that matter

Chat and agent modes can pull in other files, but they're working within a limited window - there's only so much text the AI can hold at once, so it doesn't read your entire project for every question. When the answer depends on code that lives elsewhere, tell it where.

Both Copilot and Cursor let you reference specific files in a chat. In Cursor you type `@` and pick a file to attach; Copilot Chat has its own way to add files and the current selection to the conversation. The exact keystrokes shift between versions, so the habit matters more than the syntax: when your question touches more than the open file, pull those files in explicitly.

A concrete example. You ask "make this form match how we validate the signup form." If the signup form is in another file, the AI can't match it unless that file is in the conversation. Attach it, and the answer goes from a plausible guess to something that actually mirrors your real pattern.

## Lever three: set project rules once

The newest and most useful lever is standing instructions - a small file in your project that tells the AI how *your* code should look, applied to every suggestion automatically. Cursor calls these "rules" (often `.cursor/rules`); Copilot reads a `.github/copilot-instructions.md` file. Other tools have their own equivalent.

This is where you write down the things you'd otherwise repeat in every prompt:

```text
- Use tabs, not spaces.
- Prefer plain functions over classes unless state is needed.
- All dates are stored in UTC.
- Don't add new dependencies without asking.
- Error messages should be lowercase and not end with a period.
```

Once that file exists, the AI's suggestions start arriving in your house style instead of some internet-average style you then have to fix by hand. It's the highest-leverage five minutes you'll spend, because it pays off on every single interaction afterward. Keep it short and specific - a wall of vague preferences gets ignored; a handful of concrete rules gets followed.

## Writing the request itself

With the right material in front of it, the request can be ordinary plain language. A few things sharpen it:

- **Say what, and why.** "Add a check that the email field isn't empty, because right now it saves blank rows" beats "fix the email." The reason narrows the solution.
- **Name the constraint.** "Without adding a new library" or "keep it under twenty lines" steers the AI away from over-building.
- **Ask for one thing.** A request that bundles three changes produces a tangled diff you can't review. Do them in sequence.
- **When you don't know the term, describe the behavior.** "The thing that runs before each request" is enough; you don't need the jargon. The AI is good at translating intent into the right name.

## When the answer is still off

If a suggestion is wrong even with good context, don't fight it line by line. Reject it, add the missing context - the file it didn't see, the rule it didn't know - and ask again. You're not arguing with a person; you're improving the inputs. Most "the AI is bad at this" moments are really "the AI couldn't see the thing that mattered" moments.

Good context turns editor AI from a generator of plausible-looking code into something that fits your actual project. But "fits your project" is not the same as "correct." Even with perfect context, the AI will sometimes hand you something wrong that looks completely right. Catching that is the next phase, and it's the one habit you never skip.
