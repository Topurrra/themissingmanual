---
title: "Describing Software Into Existence"
guide: vibe-coding
phase: 1
summary: "What vibe coding means, who named it, and what the describe-run-react loop feels like when you're not an engineer."
tags: [vibe-coding, ai-coding, workflow, prototyping, ai]
difficulty: beginner
synonyms:
  - "what does vibe coding mean"
  - "who coined vibe coding"
  - "how does vibe coding work"
  - "describe an app and ai builds it"
  - "vibe coding workflow for beginners"
updated: 2026-06-30
---

# Describing Software Into Existence

## The name and where it came from

The term "vibe coding" came from Andrej Karpathy, a well-known AI researcher, in a short post in early 2025. He described a way of working where you "give in to the vibes, embrace exponentials, and forget that the code even exists." You talk to the AI, accept what it produces, run it, and if something's wrong you describe the problem and let the AI fix it. You're not reading the code. You're reacting to the behavior.

The phrase caught on fast because it named something a lot of people were already doing. Worth being honest, though: it's a new term, and people use it loosely. Some mean "I built a whole app without writing a line." Others mean "I let AI write most of it but I still check the important parts." When someone says they vibe-coded something, ask which one they mean. The gap between those two is the whole subject of this guide.

## What the loop actually feels like

Strip away the jargon and vibe coding is one loop repeated:

1. **Describe** what you want in plain language.
2. **Run** what the AI gives you.
3. **React** — say what's wrong or what's next, and go back to step one.

You never leave that loop. You don't open a textbook between rounds. The AI handles the parts that used to require years of learning: which language to use, how to structure files, what to type into the terminal. Your job shrinks down to two things you're already good at — knowing what you want, and noticing when what you got isn't it.

Here's a real exchange, the kind that happens dozens of times in a session:

```text
You:  Make me a page where I can paste a list of names and it
      removes duplicates and sorts them alphabetically.

AI:   [writes the code, shows you a running page]

You:  Good, but it's treating "Anna" and "anna" as different.
      They should count as the same.

AI:   [fixes it, shows the updated page]

You:  Perfect. Now add a button to copy the cleaned list.
```

Notice what you didn't do. You didn't learn what "case-insensitive comparison" is called. You described the symptom — "Anna and anna should count as the same" — and the AI translated that into the fix. That translation, from human intention to working code, is the entire value of vibe coding.

## The tools people use

You don't need to know how these work to start, but it helps to know the shapes they come in:

| Kind of tool | What it is | Good for |
|---|---|---|
| Chat assistants | ChatGPT, Claude, Gemini in a browser | Scripts, snippets, learning, one-off tasks |
| Browser builders | Lovable, Bolt, v0, Replit | Whole web apps, no setup, runs in the browser |
| Editor agents | Cursor, Windsurf, Claude Code | Bigger projects; closer to real development |

The browser builders are where most non-engineers start. You type a description, an app appears in a preview window, and you keep refining it by chatting. There's no install, no terminal, no "set up your environment" — which removes the wall that used to stop people on day one.

## What's really happening underneath

The AI isn't thinking about your problem the way you do. It has read an enormous amount of existing code and learned the patterns — what a "remove duplicates" function usually looks like, how a login page is usually built. When you describe what you want, it produces the most likely-looking code for that description. Most of the time, for common requests, that's exactly right, because your request is one a thousand other people have made before.

This is also the seed of every problem in phase three. The AI is great at the common case and shaky at the unusual one. It produces code that looks correct and runs — but "looks correct and runs" is not the same as "is correct and safe." For a tool only you will use, that gap rarely matters. For something handling other people's money or data, it matters enormously.

For now, hold onto the good part. The describe-run-react loop genuinely collapses the distance between having an idea and holding something that works. That used to take weeks of learning. Now it can take an afternoon. The next phase is about the afternoons where that's exactly the right trade.
