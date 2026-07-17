---
title: "DAX, Deep Dive"
guide: "power-bi-dax-deep-dive"
phase: 0
summary: "Why does the same DAX measure show a different number on a card, in a table, and next to a slicer? This guide teaches the real reasoning underneath DAX - row context, filter context, CALCULATE, and the patterns and performance habits that come from actually understanding it."
tags: [power-bi, dax, row-context, filter-context, calculate, vertipaq, measures, performance, advanced]
category: data-analytics
order: 41
difficulty: advanced
synonyms: ["dax deep dive", "why does my dax measure give different numbers", "power bi calculate explained", "dax row context vs filter context", "dax context transition", "dax running total year over year", "how to debug dax measures", "vertipaq engine explained", "power bi dax performance", "advanced dax tutorial"]
updated: 2026-07-14
---

# DAX, Deep Dive

You've got a working model. You've written a few measures - a `SUM`, maybe a ratio, maybe your first
`CALCULATE`. Then it happens: the same measure shows one number on a card visual, a different number
in a table broken out by month, and a number you can't explain at all next to a slicer. Nothing crashed.
There's no red squiggly line. The formula is just... telling you something different depending on where
you put it.

That's not a bug in Power BI, and it's not you being bad at this. It's DAX doing exactly what it was
designed to do, and the design is the part nobody explained to you. Every DAX formula is evaluated
inside an invisible, shifting frame called **context** - and until you can see that frame, DAX looks
like magic that occasionally turns on you. Once you can see it, the "weird" behavior turns out to be
the single most useful feature in the language.

This guide is the missing explanation. Not a syntax reference, not a list of functions to memorize -
the actual mental model: what row context and filter context *are*, why `CALCULATE` is the function
that bends them, what "context transition" really does when a measure meets a row, and how to write DAX
you can read six months from now and still trust. We finish with the part almost nobody teaches until
something is already slow: how the VertiPaq engine actually stores your data, and why that explains
which formulas are fast and which ones quietly ruin your refresh time.

This is the deep half. It assumes you can already build a model and write a basic measure - if `SUM`,
relationships, and your first `CALCULATE` still feel shaky, spend time with
[Power BI From Zero](/guides/power-bi-from-zero) phases 4 through 7 first, then come back. Everything
here builds directly on that foundation.

## How to read this

- **Read phases 1 and 2 in order, slowly.** Row context vs. filter context (phase 1) and CALCULATE's
  context transition (phase 2) are the two ideas everything else in DAX is built from. Rush these and
  every later phase will feel like memorizing tricks instead of understanding a system.
- **Already comfortable with context and CALCULATE?** Jump straight to
  [Phase 3: Common DAX Patterns](03-common-dax-patterns-running-totals-yoy-ranking-t.md) for the running-totals, year-over-year,
  ranking, and top-N formulas you'll actually reuse on the job.
- **Writing DAX that works but that you can't explain to a teammate?** Phase 4 is for you - variables,
  debugging technique, and what makes a measure readable instead of a wall of nested functions.
- **Model works but refresh or visuals feel sluggish?** Phase 5 covers the VertiPaq engine and the
  performance habits that follow from how it actually stores and scans your data.

## The phases

1. **[Row Context vs Filter Context](01-row-context-vs-filter-context.md)** 🔴 - the two invisible frames every DAX formula runs inside, and why the same measure reads differently depending on which one it's in.
2. **[CALCULATE and Context Transition](02-calculate-and-context-transition.md)** 🔴 - the function you reach for to rewrite filter context, and the automatic row-to-filter conversion that trips everyone up first.
3. **[Common DAX Patterns](03-common-dax-patterns-running-totals-yoy-ranking-t.md)** 🔴 - running totals, year-over-year, ranking, and top-N: the formulas you'll actually reuse, built from context you now understand instead of copy-pasted blind.
4. **[Variables, Debugging & Readable DAX](04-variables-debugging-and-readable-dax.md)** 🔴 - `VAR`/`RETURN`, how to actually debug a wrong number, and writing measures your future self can still read.
5. **[Performance & the VertiPaq Engine](05-performance-and-the-vertipaq-engine.md)** 🔴 - how Power BI actually stores your data in memory, and why that explains which DAX is fast and which DAX quietly isn't.

> This guide stays inside DAX itself - modeling choices like star schema design and relationship types
> live in [Power BI From Zero](/guides/power-bi-from-zero) and [Star Schema Explained](/guides/star-schema-explained).

---

[Phase 1: Row Context vs Filter Context →](01-row-context-vs-filter-context.md)
