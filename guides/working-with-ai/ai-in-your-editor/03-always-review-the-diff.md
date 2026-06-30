---
title: "Always Review the Diff"
guide: ai-in-your-editor
phase: 3
summary: "The one non-negotiable habit of editor AI: reading every change before you accept it, and how to spot edits that look right but quietly aren't."
tags: [diff, code-review, ai, pair-programming, cursor]
difficulty: beginner
synonyms:
  - "should i review ai generated code"
  - "how to check ai code changes"
  - "ai code looks right but is wrong"
  - "reviewing copilot suggestions"
  - "accepting ai edits safely"
updated: 2026-06-30
---

# Always Review the Diff

Here is the whole discipline in one sentence: you read every change the AI proposes before you accept it. Not most changes. Every one. If you take nothing else from this guide, take this.

## Why this is the hard part

The danger of editor AI isn't that it produces nonsense. Nonsense is quick to catch - it doesn't run, or it's visibly gibberish, and you throw it away. The real danger is the opposite: code that looks completely reasonable, reads cleanly, and is wrong in a way you won't notice until it bites.

The AI is, in effect, a confident pattern-matcher. It produces text that *resembles* correct code because it has seen mountains of correct code. Resemblance is not correctness. It will invent a function that doesn't exist because a function with that name *should* exist. It will swap `>` for `>=` in a way that's subtly off. It will "fix" your bug by deleting the check that was protecting you. None of these look alarming on the page. That's exactly the problem.

## What a diff is, and why you read it

When the AI changes code, it shows you a *diff* - the before and after, with removed lines marked one way (usually red) and added lines another (usually green). This is your review surface. Reading the diff means looking at every red and every green line and asking: do I understand why this changed, and is it right?

Don't accept a multi-file agent edit by glancing at the summary and clicking the button. Open the changes. Walk them. The few seconds you save by accepting blind is borrowed against the hour you'll spend later figuring out why something broke.

## The specific things to look for

You're hunting for plausible-but-wrong. A checklist that catches most of it:

- **Did it change something you didn't ask about?** The AI sometimes "helpfully" rewrites nearby code, renames a variable, or reformats a block. Each unrequested change is a place a bug can hide. If you asked for one thing and the diff touches four, be suspicious.
- **Did it delete a check?** Removed validation, a dropped null/empty test, a deleted error handler. The AI loves to make code "cleaner" by removing the guard that was doing real work. Red lines that remove a safety check deserve a hard second look.
- **Did it invent something?** A called function, a config key, an imported package that doesn't exist in your project. If you don't recognize a name, confirm it's real before you trust it.
- **Did the boundaries shift?** Off-by-one changes, `<` becoming `<=`, a loop that now runs one time too few or too many. These are tiny on the page and large in effect.
- **Does the comment match the code?** The AI may keep a comment that describes the old behavior while changing what the code does underneath. Trust the code, not the comment, and fix the mismatch.
- **Hardcoded answers.** Watch for a "fix" that returns the exact value your test expected instead of actually computing it. It passes, and it's hollow.

## A worked example

Say you asked it to handle the case where a list might be empty. You get back:

```text
- average = sum(scores) / len(scores)
+ average = sum(scores) / len(scores) if scores else 0
```

Reads fine. But pause: is `0` the right answer for "no scores," or should it be `None`, or should the function refuse to run? The AI picked the answer that made the line valid, not the answer your situation needs. The diff is correct *as code* and possibly wrong *as a decision*. Only you know which. That judgment is the part you can't delegate.

## Run it, don't only read it

Reading catches a lot. Running catches the rest. After you accept a change, exercise it - run the tests, click the button, hit the endpoint. The AI can write code that passes your eyes and fails on real input. The loop that actually keeps you safe is: review the diff, accept what you understand, then run it to confirm reality agrees.

## The mindset that makes this sustainable

Treat the AI as a fast, tireless junior who writes a lot of code and is wrong often enough that you can never rubber-stamp it. You'd never merge a junior's work unread. Same rule here. The speed-up is real - the AI handles the boring bulk and you stay in the judgment seat - but it only stays a speed-up if you keep reading.

People who get burned by editor AI almost always got burned the same way: they stopped reading the diffs. The suggestions were good for long enough that they got comfortable, started accepting on faith, and one confident wrong edit sailed through. The habit isn't paranoia. It's the price of going fast without falling.

So: let the AI write. Give it the context to write well. And read every change before it's yours. Do those three things and editor AI becomes one of the most useful tools you own - a genuine accelerant that almost never costs you what an unread bad edit would.
