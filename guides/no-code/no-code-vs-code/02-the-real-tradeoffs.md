---
title: "The Real Tradeoffs"
guide: no-code-vs-code
phase: 2
summary: "Speed now versus control later, vendor lock-in, the capability ceiling, what your bill does as you scale, and who maintains it once the builder leaves."
tags: [no-code, low-code, vendor-lock-in, total-cost-of-ownership, maintenance]
difficulty: beginner
synonyms:
  - "no-code tradeoffs and downsides"
  - "no-code vendor lock-in"
  - "no-code cost at scale"
  - "limitations of no-code platforms"
  - "who maintains no-code apps"
updated: 2026-06-30
---

# The Real Tradeoffs

Every tier on the dial buys you something and charges you something. The demos only show you the buying. This phase is the bill — five tradeoffs that decide whether a choice you make this quarter still feels good next year.

## Speed now versus control later

No-code's headline feature is real: you can have a working thing today instead of in three weeks. For a lot of jobs, that's the right trade — the speed is worth more than the control you give up, because you'll never need that control.

The trap is that the two costs land at different times. **Speed is paid up front and felt immediately. Control is paid later and felt suddenly** — the day you need the tool to do one specific thing it can't, and there's no workaround, and the business needs it by Thursday. The earlier you'd have been able to predict that need, the more carefully you should weight it now.

A clean way to hold it: no-code optimizes for *time to first version*. Code optimizes for *time to any version you can imagine*. Ask which one your project will care about more, and when.

## Vendor lock-in

When you build in a no-code tool, you're building inside someone else's house. Your forms, logic, and often your data live in their system, in their format. That's fine right up until you want to leave — because the price of leaving was set the day you moved in, and it's usually high.

Lock-in shows up in a few flavors:

- **Logic lock-in:** the workflows you built can't be exported as anything you can run elsewhere. Switching tools means rebuilding from scratch.
- **Data lock-in:** you can often export your raw data, but the *structure* and relationships are tangled up in the tool. A CSV dump is not the same as a working system.
- **Skills lock-in:** your team learned *this* tool. Moving means re-learning, and the people who knew the old setup are the ones holding the institutional memory.

Lock-in isn't automatically bad — you're "locked in" to your bank and your email host too. It becomes a problem only when the tool stops serving you and leaving is expensive. The defense is to know the exit cost *before* you commit, not after.

## The capability ceiling

Every no-code tool has a menu, and the menu has an edge. Inside the menu, you fly. At the edge, you hit the **capability ceiling** — the first thing the tool was never designed to do.

The dangerous part isn't the ceiling itself; it's *where* it sits. You can't see it during the demo, because demos stay comfortably inside the menu. You discover it months in, when 95% of your app works and the last 5% — the part that's genuinely specific to your business — turns out to be the part the tool can't express. And the last 5% is often the part that mattered most.

```text
No-code capability over a project's life:

  works │ ████████████████████░░░░░
        │ ████████████████████  ←  the ceiling: the custom 5%
        │                          that won't bend
        └────────────────────────────────► your needs grow →
```

Low-code raises this ceiling with its escape hatch — when you hit the edge, you write a snippet and keep going. That's the whole reason low-code exists. But the escape hatch only helps if someone on the team can use it.

## Cost as you scale

No-code pricing usually looks cheap at the start and is often billed per user, per task run, per record, or per active app. Early on that's a bargain — a handful of seats and a few thousand automation runs a month costs less than an hour of a developer's time.

The shape of the curve is the catch. Many no-code tools price along a dimension that **grows with your success**: more customers means more records, more automation runs, more seats. So the bill climbs exactly as the tool becomes load-bearing. Custom code has the opposite shape — high fixed cost to build, but running it for ten thousand users often costs little more than running it for ten.

| | Up-front cost | Cost as usage grows |
|---|---|---|
| No-code | Low | Climbs, sometimes steeply, with usage |
| Low-code | Medium | Climbs, but you can optimize hot spots |
| Code | High | Mostly flat after build |

This is why "we'll start on no-code and switch if we get big" is a reasonable plan *and* a trap at the same time. It's reasonable because you might never get big. It's a trap because if you do, the switch lands right when you're busiest and the bill is highest — i.e. the worst possible time to rebuild. Budget for that possibility on day one.

## Who maintains it when the builder leaves

This is the tradeoff nobody puts on a slide, and it's the one that bites quietly.

No-code lowers the bar to *build* something, which means the person who built your critical workflow might be an ops manager, a marketer, or an intern — not someone whose job is software. That's a feature: more people can solve their own problems. It's also a risk: when that person leaves, they take the only mental model of how the thing works with them.

No-code tools are often undocumented by nature. The logic lives as clicks inside a visual editor, with no comments, no change history you can read, and no one who remembers why the workflow branches the way it does. The result is **"citizen-developer debt"** — a sprawl of small tools, each holding up part of the business, each understood by exactly one person who may already be gone.

A few questions to ask of anything important enough to depend on:

- If the person who built this won the lottery tomorrow, who could change it?
- Is there a written record of what it does and why?
- How many of these one-person tools are we quietly accumulating?

None of these tradeoffs argue against no-code. They argue against choosing it *blindly*. Hold all five in your head — speed timing, lock-in, the ceiling, the cost curve, the maintainer question — and you're ready for the framework in the next phase that turns them into a decision.
