---
title: "Dates and Time Zones"
guide: "dates-and-time-zones"
phase: 0
summary: "The bug that corrupts data and breaks launches: UTC versus local, offsets versus zones, DST, and the rules that keep time from wrecking your app."
tags: [time, timezones, utc, dst, datetime, unix-timestamp, programming-concepts]
category: programming-concepts
order: 9
difficulty: intermediate
synonyms: ["time zones programming", "utc vs local time", "how to store dates", "daylight saving time bug", "what is a unix timestamp", "offset vs timezone", "iana timezone database", "off by one hour bug", "store dates in utc"]
updated: 2026-06-30
---

# Dates and Time Zones

You've shipped the feature. It works on your machine. Then a user in another country says their appointment shows up an hour off, or the report that should cover "yesterday" is missing the last few rows, or once a year - always around 2am, always in the spring or fall - something silently breaks. Time looks like the easy part. It is not.

Here's the relief: almost every time bug comes from a small number of confusions, and they all have the same cure. Once you can tell a *moment* from how it's *displayed*, an *offset* from a *zone*, and you internalize the golden rules, the whole category of "time is haunted" bugs stops happening to you. You don't need to be clever. You need to stop being clever in the three places where clever is what bites you.

## How to read this
- **Want the one idea that fixes most bugs?** Read [Phase 1](01-a-moment-is-not-a-clock-reading.md). Separating the instant from its display is the whole game.
- **Want it to actually stick?** Read in order. Phase 2 is the rules you follow every day; Phase 3 is the day daylight saving time tries to ruin your life, and why your hand-rolled math can't survive it.

## The phases
1. **[A Moment Is Not a Clock Reading](01-a-moment-is-not-a-clock-reading.md)** - the core split: an instant on the timeline versus the local wall-clock string a human reads. UTC, Unix timestamps, and why "3pm" is not a moment until you say *where*.
2. **[Offsets, Zones, and the Golden Rules](02-offsets-zones-and-the-golden-rules.md)** - why `+02:00` is not the same thing as `Europe/Berlin`, what the IANA database actually is, and the small set of rules - store UTC, convert at the edges, never hand-roll, use a real library - that keep you safe.
3. **[The 2am That Happens Twice](03-the-2am-that-happens-twice.md)** - daylight saving time creates gaps where time skips and overlaps where it repeats. The off-by-one-hour bug, the ambiguous timestamp, and why these are the rocks every naive time library splits on.

[Phase 1: A Moment Is Not a Clock Reading](01-a-moment-is-not-a-clock-reading.md) →
