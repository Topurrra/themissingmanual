---
title: "Throttle: cap the rate"
guide: debouncing-and-throttling
phase: 3
summary: "Two related techniques for taming a firehose of events — waiting for a pause versus capping the rate — and how to pick between them."
tags: [performance, debouncing, throttling, events, frontend]
difficulty: intermediate
synonyms:
  - what is debouncing
  - what is throttling
  - debounce vs throttle
  - search as you type performance
  - scroll event firing too often
  - rate limiting events in javascript
updated: 2026-07-04
---

# Throttle: cap the rate

Debounce is the wrong tool for the scroll handler from Phase 1. If you debounced a scroll handler, it would only run once scrolling *stops* — but a parallax effect or a "sticky header that fades in" needs to update *while* the user is scrolling, not only at the very end. Waiting for a pause would mean the page visibly does nothing for the entire duration of the scroll, then suddenly catches up all at once. That's not what anyone wants.

**Throttling** solves a different problem: guarantee the handler runs at most once every fixed interval, no matter how many events fire in that interval. Events keep being allowed through at a steady, capped rate, instead of being collapsed down to a single one at the end.

> Throttle means: let the action run regularly, but never more often than a fixed interval, no matter how fast the events are actually arriving.

## The rate-cap idea

The mechanism tracks whether the interval has elapsed since the last time the action ran, and ignores events that arrive before it has.

```text
each new event:
  1. has at least `interval` ms passed since the action last ran?
  2. if yes -> run the action now, record this moment as "last ran"
  3. if no  -> ignore this event entirely, do nothing
```

*What just happened:* unlike debounce, nothing gets rescheduled or delayed here — an event either qualifies to trigger the action right now, or it's dropped. There's no waiting for quiet; there's only a gate that only opens once every `interval` milliseconds.

Applied to a scroll handler throttled to 100ms, during one second of continuous fast scrolling that fires roughly 200 scroll events:

```text
scroll events arrive:     roughly every 5ms (200 events in 1000ms)
throttle interval:        100ms

event at 0ms    -> 100ms have passed since last run (none yet) -> RUN, last ran = 0ms
events 5-95ms   -> less than 100ms since last run -> ignored (~19 events)
event at 100ms  -> exactly 100ms since last run -> RUN, last ran = 100ms
events 105-195ms -> ignored (~19 events)
event at 200ms  -> RUN, last ran = 200ms
... repeats every 100ms ...
```

*What just happened:* out of roughly 200 events in that second, only about 10 actually ran the handler — one every 100ms, like clockwork. Compare that to debounce, which would have produced zero runs during the scroll and exactly one run after it stopped. Throttle keeps the page updating *throughout* the scroll, at a rate the eye can actually follow, instead of either running 200 times (wasteful) or 0 times until the end (unresponsive).

## Implementing it

```js
function throttle(fn, intervalMs) {
  let lastRan = 0;

  return function (...args) {
    const now = Date.now();
    if (now - lastRan >= intervalMs) {
      lastRan = now;
      fn(...args);                 // run the real function
    }
    // otherwise: this event is dropped, nothing happens
  };
}

const throttledParallax = throttle(updateParallaxPosition, 100);

window.addEventListener("scroll", throttledParallax);
```

*What just happened:* `lastRan` remembers the timestamp of the most recent time `fn` actually ran. Every call checks `now - lastRan` against the interval — if enough time has passed, it runs `fn` and updates `lastRan`; if not, the call does nothing at all. Note the structural difference from `debounce`'s implementation in Phase 2: debounce always eventually calls `fn` (once things go quiet), while throttle may call `fn` many times across a long event stream, spaced out, and drops whichever events land in between without rescheduling them.

A common refinement is to also fire on the *last* event of a burst even if it lands inside the cooldown window, so the final state (like the exact scroll position where the user stopped) still gets reflected — but the core mechanism above is the part worth understanding first.

## Choosing between them

The two techniques answer different questions, and the question your situation is actually asking determines which one fits:

```text
"Do I only care about the FINAL state, once things settle?"
  -> DEBOUNCE (search box, auto-save, resize-triggered relayout)

"Do I need ONGOING updates throughout the activity, bounded to
 a fixed rate rather than unbounded?"
  -> THROTTLE (scroll effects, drag-to-resize previews, mousemove
     tracking for a cursor trail)
```

*What just happened:* the search box never benefits from an update mid-typing — a partial word isn't a valid search, so waiting for the pause is strictly correct, not a performance shortcut taken at the expense of correctness. A parallax effect is the opposite: it needs to look continuous *during* the scroll, so collapsing it down to one update after scrolling stops would make the effect disappear entirely while it matters most.

A shorthand worth keeping: **debounce waits for silence; throttle keeps things flowing but capped.** If your instinct says "I want this to feel continuous while it's happening," reach for throttle. If your instinct says "I only care what things look like once they stop changing," reach for debounce. Both exist because "run the handler on literally every event" was never actually the requirement in either case — the real requirement was always more specific than that, and naming which kind of "less often" you need is what picks the tool.

```quiz
[
  {
    "q": "What does a throttled function do when an event arrives before the interval has elapsed since the last run?",
    "choices": [
      "It queues the event and runs it later, once the interval passes",
      "It ignores that event entirely — the call does nothing and is not rescheduled",
      "It runs the function immediately anyway",
      "It resets the interval timer, the same way debounce does"
    ],
    "answer": 1,
    "explain": "Throttle drops events that arrive inside the cooldown window rather than queuing or rescheduling them. This is the key structural difference from debounce, which reschedules on every event."
  },
  {
    "q": "Why is debounce the wrong choice for a scroll-triggered parallax effect?",
    "choices": [
      "Debounce is always slower than throttle",
      "Debounce would only trigger once scrolling fully stops, so the effect would be invisible during the scroll itself, when it needs to be seen",
      "Debounce can't be used with scroll events at all",
      "Parallax effects require more than one event listener"
    ],
    "answer": 1,
    "explain": "Debounce collapses a burst down to a single action after things go quiet. A parallax effect needs continuous updates while scrolling is happening, which is exactly what throttle provides instead."
  },
  {
    "q": "What's the shorthand for choosing between debounce and throttle?",
    "choices": [
      "Debounce is for images, throttle is for text",
      "Debounce waits for silence and acts once at the end; throttle keeps updates flowing but caps how often they happen",
      "Debounce is faster, so always prefer it",
      "Throttle is only for mobile devices"
    ],
    "answer": 1,
    "explain": "If only the final settled state matters, debounce fits. If ongoing, continuous-feeling updates are needed throughout an activity, throttle fits."
  }
]
```

Watch it animated: [debouncing](/explainers/Debouncing.dc.html)

[← Phase 2: Debounce — wait for a pause](02-debounce.md) | [Overview](_guide.md)
