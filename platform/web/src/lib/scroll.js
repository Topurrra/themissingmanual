// Read-depth tracking for guide reader pages - privacy-safe, no cookies, no id.
//
// Fires kind='read' with value in {25,50,75,100} the first time the scroll
// position reaches each milestone of the article's height, at most once each per
// pageview. Mirrors lib/dwell.js's start/stop-per-route shape.

let el = null; // article element currently being measured
let path = null; // path it belongs to (null = not tracking)
let fired = null; // Set of milestones already sent for this pageview
let wired = false;
let raf = 0;

const MILESTONES = [25, 50, 75, 100];

function send(value) {
  if (!path || typeof navigator === 'undefined' || !navigator.sendBeacon) return;
  try {
    navigator.sendBeacon('/analytics/collect', JSON.stringify({ path, kind: 'read', value }));
  } catch {}
}

function checkDepth() {
  raf = 0;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  if (rect.height <= 0) return;
  // % of the article that's scrolled past the bottom of the viewport.
  const pct = (Math.min(window.innerHeight, rect.bottom) - rect.top) / rect.height * 100;
  for (const m of MILESTONES) {
    if (pct >= m && !fired.has(m)) {
      fired.add(m);
      send(m);
    }
  }
}

function onScroll() {
  if (!raf) raf = requestAnimationFrame(checkDepth);
}

// Begin measuring `article` for `newPath`. Call again (with a new element/path)
// on every reader navigation - resets the fired-milestone set.
export function startScrollTracking(article, newPath) {
  stopScrollTracking();
  if (!article || typeof window === 'undefined') return;
  el = article;
  path = newPath;
  fired = new Set();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  wired = true;
  checkDepth(); // short articles may already satisfy milestones on load
}

export function stopScrollTracking() {
  if (wired) {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    wired = false;
  }
  if (raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
  el = null;
  path = null;
  fired = null;
}
