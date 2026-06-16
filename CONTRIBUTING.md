# Contributing — and the soul of this project

This file is the contract. If you write a guide for the Missing Manual, it should feel like it came
from the same person who wrote the others: a battle-hardened friend who *remembers being lost*,
sitting next to you, explaining the thing nobody ever explained.

Read this once before you write. It's short on purpose.

## 1. The one quality bar

Before you write a single word — and again before you publish — ask:

> **"Would this have saved me from a terrible day at work?"**

If yes, it belongs. If no — if it's a feature tour, a definition dump, or something the official docs
give you in five minutes — cut it. We are not competing with reference documentation. We are the
friend who pulls you aside and says, "okay, here's what's *actually* going on."

## 2. Who we write for

Picture a specific person. They've *used* the tool — they can run the basic commands. But nobody ever
taught them what those commands actually do, so they copy-paste from teammates and Stack Overflow and
quietly hope. When something breaks, their stomach drops — not because the fix is hard, but because
they have no mental model, so every error looks like a catastrophe.

That's our reader. Meet them exactly there.

- **Never assume knowledge silently.** If you use a term, define it in plain language first — even if
  it feels obvious to you. (It wasn't obvious to you once.)
- **Never condescend.** A stuck reader who's made to feel stupid closes the tab.
- **Assume intelligence, not knowledge.** Your reader is smart, busy, and on a deadline. They can
  handle depth — they just were never handed the map.

## 3. The voice — do and don't

**Do:**
- Write in second person ("you"), warm and direct, like you're pair-programming.
- Explain *what a thing actually is* before how to use it. Mental model first, commands second.
- Tell them *when they'll actually reach for this* — the real situation, not just the syntax.
- Show real output, not idealized output. Real tools are noisy; show the noise and point at the part
  that matters.
- Admit when something is genuinely confusing or badly designed. "This flag is named terribly — here's
  how I remember it" builds more trust than pretending it's all elegant.

**Don't:**
- Hand-wave. "Just run `git rebase -i`" is the *exact* failure this project exists to fix. Show what a
  command does and what you'd expect to see.
- Dump flags. Cover the ones people actually use; link the docs for the other forty.
- Use **"simply," "just," "obviously," "of course," "trivial."** If it were simple, they wouldn't be
  reading.
- Write a wall. Break it into phases (§4). No doorstops.

## 4. The anatomy of a guide

**Guides are split into phases.** A phase is a self-contained chunk you can read in one sitting, that
stands on its own and can be linked to directly. No single file should become a 1000-page reference —
that's the thing we're rebelling against. If a phase is getting long, it's probably two phases.

Within a phase, each teaching unit — a command, a concept, a scenario — follows the same shape:

1. **What it actually is** — the plain-language truth, in terms of the mental model.
2. **What it does in real life** — what actually happens when you run it, and why it exists.
3. **When you actually need it** — the real situation that sends you here.
4. **A real example** — an annotated terminal transcript (§5).
5. **The gotcha** — the thing that bites people; the part the docs leave out.

You don't have to print these as literal headings every time, but every unit should *contain* all
five. If you can't write "the gotcha," you probably haven't used the thing in anger yet — go find
someone who has.

## 5. Example format — the annotated terminal transcript

This is our signature device. Show the command, show realistic output, then translate it into plain
English:

```console
$ git status
On branch main
Changes not staged for commit:
  modified:   app.js
```
*What just happened:* Git is telling you `app.js` has edits it hasn't been told to save yet ("not
staged"). Nothing has been recorded — this command only *looks*; it never changes anything. Run it any
time you're unsure what state you're in. It's the safest command in Git.

Rules for transcripts:
- Use real, plausible output. Don't invent clean output the tool wouldn't actually print.
- Always follow with *"What just happened:"* (or similar) in plain language.
- One idea per transcript. Two small transcripts beat one giant one.

## 6. Diagrams

A picture of "a branch is a pointer" teaches more than three paragraphs. Use diagrams whenever
structure or spatial relationships matter.

- **ASCII-first.** ASCII diagrams render everywhere — raw GitHub, a plain terminal — and live right in
  the Markdown. Use them by default.
- Save SVG (in the guide's `assets/`) for when ASCII genuinely can't carry the idea. Don't reach for it
  early.

```text
C1 ◄── C2 ◄── C3      (commits, each pointing at its parent)
              ▲
              │
            main       (a branch is just a label on a commit)
```

## 7. The cheat-card rule

Some readers arrive mid-emergency. They don't want a lesson; they want the fix, *now*. Respect that.

Every guide that covers fixes opens with a **cheat-card**: a scannable table of "situation → the
one-line answer," each pointing to its full section. The calm, complete explanation lives below, for
when they have time to actually learn it. Serve both readers.

## 8. Frontmatter — required on every phase file

Every phase file starts with this YAML block. It isn't bureaucracy — it's what makes the whole library
searchable later. (Search will boost `title` and `tags`, show `summary` as the result snippet, and use
`synonyms` to match natural-language queries like "undo a commit" against a doc that says "revert/reset.")

```yaml
---
title: "Human-readable title"
guide: "guide-folder-slug"
phase: 1                 # order within the guide (the overview file uses 0)
summary: "One sentence used as the search-result snippet."
tags: [topic, subtopic]
difficulty: beginner     # beginner | intermediate | advanced
synonyms: ["natural language phrases a reader might actually search"]
updated: 2026-06-17
---
```

Fill `synonyms` with the actual questions a stuck developer would type. That field is doing real work.

## 9. A worked example: bad → good

The difference between this project and everything else, in one example.

**Don't:**
> To undo a commit, run `git reset --hard HEAD~1`.

Technically an answer. Also how people lose a day of work — because nobody told them `--hard` throws
their changes away.

**Do:**
> Want your last commit gone, but your work kept? Reach for `git reset --soft HEAD~1`. Remember from
> Phase 1 that a branch is just a label pointing at a commit — `--soft` moves that label back by one,
> so the commit is "uncommitted," but your actual changes are still sitting right there, staged,
> exactly as they were. It's as if you never hit commit.
>
> (There's also `--hard`, which moves the label back *and* throws your changes away. That's the one
> that ruins afternoons. We'll cover when each is safe in Phase 3.)

Same command family. One sentence of "what it actually is" turns a footgun into understanding. That's
the whole job.

---

*That's the soul. Now go write something that would've saved you a terrible day.*
