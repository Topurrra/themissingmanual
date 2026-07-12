// Engaged-time (dwell) tracking for the current page — privacy-safe, no cookies, no id.
//
// Measures ACTIVE reading time only: the timer pauses whenever the tab is hidden
// (Page Visibility API), so a guide left open in a background tab doesn't inflate the
// number. Time is flushed as DELTAS via navigator.sendBeacon on three triggers:
//   - tab hidden        (visibilitychange -> 'hidden' — the last reliable moment on mobile)
//   - page going away   (pagehide — covers real unloads + bfcache)
//   - SPA route change  (startDwell for the next page flushes the previous one)
// Deltas (not one lump sum on exit) mean a read -> tab-away -> come-back -> read session
// is captured in full and never double-counted: the server sums all deltas per path.
//
// Naive "exit timestamp - entry timestamp" is deliberately NOT used — it misses the last
// page's time entirely and is wildly inflated by idle background tabs.

let path = null; // path currently being measured (null = not tracking, e.g. /admin)
let activeMs = 0; // engaged ms accumulated for `path` since the last flush
let resumedAt = null; // performance.now() when the timer last (re)started; null = paused
let wired = false;

const MIN_FLUSH_MS = 1000; // don't beacon sub-second slivers (keeps the events table lean)

const now = () =>
  typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

// Fold the currently-running interval into the accumulator and restart the clock.
// `resumedAt` is null (not 0) while paused, since now() can legitimately be 0.
function accumulate() {
  if (resumedAt !== null) {
    activeMs += now() - resumedAt;
    resumedAt = now();
  }
}

// Send the accumulated engaged time for `path` as one delta, then reset the accumulator.
function flush() {
  accumulate();
  const ms = Math.round(activeMs);
  activeMs = 0;
  if (!path || ms < MIN_FLUSH_MS) return;
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) return;
  try {
    navigator.sendBeacon('/analytics/collect', JSON.stringify({ path, kind: 'dwell', value: ms }));
  } catch {}
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    resumedAt = now(); // resume the clock
  } else {
    accumulate();
    resumedAt = null; // pause the clock (no time accrues while hidden)
    flush(); // send now — a backgrounded tab may be killed before it comes back
  }
}

// Begin measuring `newPath`, flushing whatever the previous page accrued first.
// Called on every SPA navigation. /admin pages are not tracked.
export function startDwell(newPath) {
  if (path) flush(); // close out the page we're leaving
  if (newPath && !newPath.startsWith('/admin')) {
    path = newPath;
    activeMs = 0;
    const visible = typeof document === 'undefined' || document.visibilityState === 'visible';
    resumedAt = visible ? now() : null;
  } else {
    path = null;
    resumedAt = null;
  }
}

// Wire the global visibility/unload listeners once (call from onMount in the shell).
export function initDwell() {
  if (wired || typeof document === 'undefined') return;
  wired = true;
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', flush);
}
