---
title: "Debounce: wait for a pause"
guide: debouncing-and-throttling
phase: 2
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

# Debounce: wait for a pause

The search box from Phase 1 has a burst of events (one per keystroke) where only the very last one in the burst actually matters - the finished word or phrase. **Debouncing** is built exactly for this shape: it waits for a pause in the events before acting, and every new event within that waiting window cancels and restarts the wait.

> Debounce means: keep pushing the action back as long as new events keep arriving. Only act once things go quiet.

## The timer-reset idea

The mechanism is a single timer that gets reset on every event.

```text
each new event:
  1. cancel any timer that's currently waiting
  2. start a brand new timer for, say, 300ms
  3. when a timer finally finishes without being cancelled,
     THAT's when the real action runs
```

*What just happened:* as long as events keep arriving faster than the timer's delay, no timer ever gets the chance to finish - each new event kills the previous timer before it can fire and starts a fresh one. The moment there's a gap longer than the delay, whichever timer is currently running finally completes uninterrupted, and that's the one and only time the action fires.

Applied to the search box's eight keystrokes from Phase 1, with a 300ms debounce delay:

```text
's' at 0ms    -> timer set for 300ms
'u' at 90ms   -> cancel previous timer, set new one for 390ms
'b' at 180ms  -> cancel previous timer, set new one for 480ms
'e' at 270ms  -> cancel previous timer, set new one for 570ms
'r' at 340ms  -> cancel previous timer, set new one for 640ms
'n' at 410ms  -> cancel previous timer, set new one for 710ms
'e' at 480ms  -> cancel previous timer, set new one for 780ms
't' at 550ms  -> cancel previous timer, set new one for 850ms
... user stops typing ...
850ms         -> timer finally completes -> fetchSearchResults("kubernet") fires
```

*What just happened:* eight keystrokes, one API call, fired 300ms after the last keystroke - not 300ms after the first one, and not on some fixed schedule. If the user had kept typing at that pace for another twenty letters, the debounced action still wouldn't fire until 300ms after they finally stopped. The delay window follows the *last* event, always.

## Implementing it

The pattern behind most debounce implementations is small enough to write from scratch - worth doing once so the library-provided versions don't feel like magic:

```js
function debounce(fn, delayMs) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);              // cancel any pending timer
    timeoutId = setTimeout(() => {
      fn(...args);                        // run the real function
    }, delayMs);
  };
}

const debouncedSearch = debounce(fetchSearchResults, 300);

searchInput.addEventListener("input", (event) => {
  debouncedSearch(event.target.value);
});
```

*What just happened:* `debounce` wraps `fetchSearchResults` and returns a new function, `debouncedSearch`, that the input listener calls on every keystroke. Internally, that wrapper does exactly the cancel-and-restart dance from the diagram above: `clearTimeout` cancels whatever timer is currently waiting (if any), and `setTimeout` starts a fresh one. `fn(...args)` - the actual `fetchSearchResults` call - only ever runs from inside a timer that was allowed to complete, which only happens after 300ms of silence.

## Where else this pattern fits

The search box is the canonical example, but the same shape - a burst of events where only the final state matters - shows up wherever a user is actively adjusting something and you want to react once they've settled on a value, not on every intermediate step:

- **Window resize handlers** that recalculate an expensive layout. Dragging a window's edge fires dozens of resize events; you want the recalculation once the user releases the edge and the size stops changing, not on every pixel of the drag.
- **Auto-save in a text editor.** You don't want to save to a server on every keystroke - you want to save once the user pauses, which is exactly a debounced "on change" handler.
- **A form field validating itself as the user types**, where showing a "this email looks wrong" error on every half-typed character would be more annoying than helpful - waiting for a pause gives the user room to actually finish typing first.

All three share the same reasoning as the search box: the events arrive in a rapid burst, and reacting to the burst's end - not its every step - is both cheaper and more correct for what the user actually wants.

[← Phase 1: The firehose problem](01-the-firehose-problem.md) | [Overview](_guide.md) | [Phase 3: Throttle - cap the rate →](03-throttle.md)
