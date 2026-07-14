---
title: "The firehose problem"
guide: debouncing-and-throttling
phase: 1
summary: "Two related techniques for taming a firehose of events - waiting for a pause versus capping the rate - and how to pick between them."
tags: [performance, debouncing, throttling, events, frontend]
difficulty: intermediate
synonyms:
  - what is debouncing
  - what is throttling
  - debounce vs throttle
  - search as you type performance
  - scroll event firing too often
  - rate limiting events in javascript
updated: 2026-07-10
---

# The firehose problem

Some events fire once, cleanly, when something happens - a button click, a form submission. Others fire in rapid, continuous bursts as a single ongoing action unfolds - every keystroke while someone types, every pixel of movement while someone scrolls or drags. The second category is where a perfectly reasonable-looking handler quietly becomes a performance problem.

## Search-as-you-type, hitting the API on every keystroke

Picture a search box that queries an API as the user types, so results update live instead of waiting for a submit button.

```js
searchInput.addEventListener("input", (event) => {
  fetchSearchResults(event.target.value);
});
```

*What just happened:* this looks correct, and functionally it is - every keystroke does trigger a fresh search, which is the intended behavior. But watch what happens when someone types a seven-letter word at a normal pace:

```text
user types "kubernet" ...

's' -> fetchSearchResults("k")
'u' -> fetchSearchResults("ku")
'b' -> fetchSearchResults("kub")
'e' -> fetchSearchResults("kube")
'r' -> fetchSearchResults("kuber")
'n' -> fetchSearchResults("kubern")
'e' -> fetchSearchResults("kuberne")
't' -> fetchSearchResults("kubernet")
```

*What just happened:* eight keystrokes fired eight separate API requests, seven of which were for a search the user never actually wanted - they wanted the last one, for the whole word. Each of those seven wasted requests still costs a full round trip: network latency, server processing, a database query, a response payload. Multiply this across every user typing every search on your site, and you're running server capacity almost entirely on throwaway queries for search terms nobody was actually searching for.

There's a second problem hiding here too: **out-of-order responses**. A slow network can mean the request for `"ku"` takes longer to come back than the request for `"kubernet"` that was fired six keystrokes later. If your code overwrites the results with whatever response arrives last, with no check for which one it actually is, the user can end up staring at results for `"ku"` even though they finished typing `"kubernet"` - because that response happened to land after the correct one.

## Scroll handlers firing hundreds of times a second

Scroll events are worse in a different way: not only do they fire often, they fire at a rate tied to the display's refresh rate and the speed of the scroll gesture, which can mean dozens to hundreds of firings per second during a fast scroll or drag.

```js
window.addEventListener("scroll", () => {
  updateParallaxPosition();   // recalculates and repaints an element
});
```

*What just happened:* `updateParallaxPosition` does real work - reading the scroll position, computing a new transform, applying it to the DOM. If the scroll event fires 200 times in the second it takes to flick-scroll down a page, that function runs 200 times, each run reading layout information, writing a style change, and potentially triggering a repaint. Do enough of this and the page starts to visibly stutter, because a browser typically renders around 60 frames per second - anything beyond roughly 60 updates in that second was never going to be visible anyway.

```text
scroll event fires:        ~200 times in one second of fast scrolling
frames the browser draws:   ~60 times in that same second
work that was actually
visible to the user:        at most 60 of those 200 updates
```

*What just happened:* more than two-thirds of the work in that second produced no visible difference to the user - it was calculated, applied, and then immediately overwritten by the next update before a frame was ever drawn showing it. That's not a subtle inefficiency; it's the majority of the work being thrown away by construction.

## The shared shape of the problem

Both examples - the search box and the scroll handler - share the same underlying issue: **the event fires far more often than the desired outcome needs to happen.** Nobody wants search results for every partial word typed on the way to a full one, and nobody can perceive a parallax update happening more often than the screen can redraw. Running the handler on literally every event does work in service of a granularity nobody asked for and nobody benefits from.

> The event firing isn't the problem. Running expensive work on every single firing, when only the last one (or a bounded number per second) actually matters, is the problem.

That distinction - "wait until things settle" versus "allow updates, but cap how often" - is exactly the fork between the two techniques ahead. Debounce handles the first shape: a burst of events where only the final one matters. Throttle handles the second: an ongoing stream where you want steady updates, capped at a bounded rate rather than an unbounded one.

[← Overview](_guide.md) | [Phase 2: Debounce - wait for a pause →](02-debounce.md)
