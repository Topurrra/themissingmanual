---
title: "The 2am That Happens Twice"
guide: "dates-and-time-zones"
phase: 3
summary: "Daylight saving creates gaps where time skips and overlaps where it repeats. The off-by-one-hour bug, the ambiguous timestamp, and why naive math breaks."
tags: [time, dst, daylight-saving, ambiguous-time, gap, overlap, bugs]
difficulty: intermediate
synonyms: ["daylight saving time bug", "2am happens twice", "spring forward fall back bug", "off by one hour bug", "ambiguous timestamp dst", "nonexistent time daylight saving", "dst gap and overlap"]
updated: 2026-06-30
---

# The 2am That Happens Twice

This is the phase where you learn *why* the rules from Phase 2 aren't bureaucratic fussiness — they're armor against one specific, recurring disaster. Twice a year, in any region that observes daylight saving time, the local clock does something genuinely strange: it skips an hour, and six months later it repeats an hour. Every naive assumption about time — "each hour happens once," "I can add an hour by adding 3600 seconds to the clock reading" — breaks on exactly these two instants.

## Spring forward: the hour that never existed

In spring, clocks jump ahead. At the switch instant, the local clock goes straight from 1:59am to 3:00am. The hour from 2:00am to 2:59am *does not happen* on that calendar day. It's a **gap**.

```text
Local clock on the spring-forward day:

   1:58  1:59  ──jump──  3:00  3:01
                  ^
         2:00–2:59 never occurs locally
```

*What just happened:* if a user (or your code) constructs the local time "2:30am" on that day, you've named a wall-clock reading that *did not exist*. Ask a naive library to convert it and you get garbage, an error, or a silent guess. This is the **nonexistent time** problem — and you hit it any time you build a local time programmatically near a spring switch (think: a daily 2:30am cron job, or a "remind me at 2:30" that lands on the wrong day).

## Fall back: the hour that happens twice

In autumn, clocks fall back. At the switch instant, the local clock goes from 1:59am back to 1:00am and replays the whole hour. So "1:30am" happens *twice* — once before the fall-back, once after — and the two are different instants, an hour apart.

```text
Local clock on the fall-back day:

   1:00  1:30  1:59  ──fall back──  1:00  1:30  1:59  2:00
   \________first 1:30________/      \_______second 1:30______/
         offset +02:00                       offset +01:00
```

*What just happened:* "1:30am" is now **ambiguous** — it names two different instants. If you stored a local time "01:30" with no offset, you literally cannot tell which one you meant. Was the transaction at the first 1:30 or the second? An hour of difference, and the data can't say. This is why storing local wall-clock time as your source of truth (Phase 2, rule 1) loses information you can never recover.

## The off-by-one-hour bug, dissected

Now the classic. Someone needs "one hour after a local time" and writes the tempting thing:

```text
WRONG:  take the wall-clock reading, add 1 to the hour field
        1:30am  ->  2:30am     "see? one hour later."
```

On 363 days a year, that's correct and the bug hides. But do it across a spring-forward gap and "2:30am" never existed; do it across fall-back and the real elapsed time was *two* hours, not one, because an hour got replayed. The wall clock and the actual passage of time disagreed, and the naive code trusted the wall clock.

The correct version never touches the clock fields. It works on the instant:

```text
RIGHT:  convert local -> instant (UTC),
        add 3600 seconds to the INSTANT,
        convert back -> local for display
```

*What just happened:* by doing the arithmetic on the instant and letting the zone's rules handle the conversion back, "one hour later" means *one real hour of elapsed time*, every day of the year — including the two weird ones. The gap and the overlap are handled by the IANA rules inside your library, not by you. This is rule 3 ("never hand-roll") and rule 4 ("use a real library") earning their keep.

```python runnable
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

berlin = ZoneInfo("Europe/Berlin")

# An instant just before Berlin's autumn fall-back (clocks go +02:00 -> +01:00).
before = datetime(2026, 10, 25, 0, 30, tzinfo=ZoneInfo("UTC")).astimezone(berlin)

# Add one REAL hour by adding to the instant, then view it locally:
after = (before.astimezone(ZoneInfo("UTC")) + timedelta(hours=1)).astimezone(berlin)

print("Local before:", before.strftime("%H:%M %Z (offset %z)"))
print("Local after: ", after.strftime("%H:%M %Z (offset %z)"))
print("Wall clock read the same hour, but the offset (and the instant) moved.")
```

*What just happened:* across the fall-back, one real hour of elapsed time can leave the *displayed* hour looking unchanged while the offset shifts from `+0200` to `+0100`. If you'd "added one to the hour field" instead, you'd have skipped a real hour entirely. The library got it right because it reasoned about the instant, not the clock face.

## Why this is the deeper payoff

Daylight saving is the stress test that proves the whole mental model. The split from Phase 1 (instant vs. clock reading) and the rules from Phase 2 (UTC core, edge conversions, no hand-rolling, real library) aren't four unrelated tips — they're a single design that makes the gap and the overlap *somebody else's problem*. Get them right and the haunted 2am is another instant flowing through a system that only ever reasoned about instants. Get them wrong and you'll meet this bug once a year, always in production, always confusing, until you do.

## For builders

The two times a year the switch happens are the only times these bugs are observable — which is exactly why they survive code review and slip into production. Don't wait for the calendar to find them. Write a test that constructs an instant inside a known gap and a known overlap for a real zone (`Europe/Berlin` and `America/New_York` both work) and asserts your "add an hour" and "what's yesterday" logic does the right thing. A handful of such tests will catch the entire family before a user ever does.

```quiz
[
  {
    "q": "On the spring-forward day, the local clock jumps from 1:59am to 3:00am. What happens if your code constructs the local time \"2:30am\" that day?",
    "choices": [
      "It's fine — 2:30am is a normal time",
      "It names a nonexistent local time (a gap), so a naive conversion gives an error or a silent wrong guess",
      "It automatically becomes 3:30am with no issues",
      "It only matters if the user is awake at 2:30am"
    ],
    "answer": 1,
    "explain": "Spring-forward creates a gap: 2:00–2:59 never occurs locally that day. Building a time inside the gap is the nonexistent-time bug."
  },
  {
    "q": "On the fall-back day, \"1:30am\" occurs twice. Why is storing a local time \"01:30\" with no offset a problem?",
    "choices": [
      "It takes up more storage than UTC",
      "The two 1:30s are the same instant, so it doesn't matter",
      "It's ambiguous — \"01:30\" names two different instants an hour apart, and you can no longer tell which one you meant",
      "Local times can never be stored at all"
    ],
    "answer": 2,
    "explain": "Fall-back replays an hour, so the wall-clock reading maps to two instants. Without an offset or UTC, that information is lost permanently."
  },
  {
    "q": "What's the correct way to compute \"one hour after\" a local time so it works every day of the year?",
    "choices": [
      "Add 1 to the hour field of the wall-clock reading",
      "Convert to an instant (UTC), add 3600 seconds to the instant, then convert back to local with a zone-aware library",
      "Add 3600 seconds to the wall-clock string directly",
      "Avoid daylight-saving zones entirely"
    ],
    "answer": 1,
    "explain": "Doing the arithmetic on the instant — not the clock fields — means \"one hour\" is one real elapsed hour even across a gap or overlap. The library's IANA rules handle the conversion back."
  }
]
```

[← Phase 2](02-offsets-zones-and-the-golden-rules.md) | [Overview](_guide.md)
