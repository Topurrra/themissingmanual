---
title: "Skills: Reusable Know-How"
guide: ai-skills-and-plugins
phase: 1
summary: "A skill is packaged instructions and reference files the assistant loads only when a task calls for it, so you stop re-explaining the same thing every session."
tags: [skills, reusable-instructions, context, ai-assistant, prompting]
difficulty: intermediate
synonyms:
  - "what is an ai skill"
  - "how do agent skills work"
  - "packaged instructions for ai"
  - "reusable prompt vs skill"
  - "teach ai my workflow"
updated: 2026-06-30
---

# Skills: Reusable Know-How

Picture the colleague who's done a thing a hundred times. You hand them a messy task and they don't need a tutorial - they have a checklist in their head, the template saved somewhere, the three gotchas they always check. A skill is that, written down and handed to the assistant.

More concretely: a skill is a folder. Inside it sits a short description of what the skill is for, a set of instructions for how to do the task, and any files the assistant might need along the way - a style guide, a template, an example, a small script. The assistant keeps the description in view all the time, but only reads the full instructions when a task actually matches. That last part matters more than it sounds, so let's sit on it.

## Why not put everything in one big prompt

You could. Plenty of people stuff a giant system prompt with every rule they've ever wanted the assistant to follow, then wonder why it ignores half of them.

The problem is attention. An assistant has a working memory - the context window - and everything competing for space in it dilutes everything else. A 4,000-word block covering invoicing, brand voice, code review standards, and your meeting-notes format is mostly irrelevant to any single task. When you ask it to draft a tweet, the invoicing rules are still sitting there taking up room and muddying the signal.

Skills fix this with a two-stage trick. The assistant always sees a one-line description of each skill - something like "Format and validate customer invoices to spec." That's cheap; it's a single line. Only when your request actually looks like invoicing does it open the full skill and pull in the detailed instructions and the invoice template. The right knowledge shows up at the right moment, and the rest stays out of the way.

```text
Always loaded (cheap):
  - "Brand voice: how we write public copy"
  - "Invoice formatting: validate customer invoices"
  - "Meeting notes: turn transcripts into action items"

You ask: "draft the launch announcement"
  -> matches "Brand voice"
  -> assistant opens that skill, reads the full guide + examples
  -> the other two stay closed
```

## What goes in a skill

The heart of a skill is plain instructions written the way you'd brief a sharp new hire. Not abstract principles - concrete steps, named tools, real examples, and the mistakes to avoid.

A brand-voice skill might say: "We write in second person. No exclamation marks. Never call our product 'powerful' or 'seamless.' Here are three before-and-after rewrites." A meeting-notes skill might say: "Output three sections - Decisions, Action Items (with owner and due date), Open Questions. Ignore small talk. Here's an example from last week's standup."

Alongside the instructions, a skill can carry files. This is the quiet superpower. A template document, a checklist, a reference table of your product names, a sample of good output - the assistant reads these when it opens the skill. Instead of describing your invoice layout in words and hoping it reconstructs it, you hand it the actual template and say "match this."

## What a skill is not

A skill doesn't give the assistant new abilities. It can't make a model that can't browse the web suddenly browse the web, and it can't reach into your database or send an email on its own. A skill is knowledge and guidance - it sharpens how the assistant uses the powers it already has. Adding genuinely new powers is what plugins are for, and that's the next phase.

It's also worth being clear about the term. "Skill" in this packaged-folder sense became common through Anthropic's Claude tooling and similar agent platforms, and the exact shape - what files are required, how triggering works - varies between products and is still settling. The *idea* is consistent everywhere: bundled, reusable, loaded-on-demand know-how. The specific file format is not yet a universal standard, so check the docs for whichever assistant you're using.

## When a skill earns its keep

Reach for a skill the moment you notice yourself explaining the same thing twice. If every week you paste the same instructions for formatting a report, that's a skill waiting to be written. If you keep correcting the assistant's tone the same way, that correction belongs in a skill, not in your fingers.

The test is repetition plus specificity. A one-off request doesn't need a skill - ask. But a task you'll do again, with rules particular to you that the model can't guess, is exactly what skills are built for. You write the know-how once. After that, the assistant brings it to the table on its own.
