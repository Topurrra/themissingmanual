// Core Web Vitals (LCP/INP/CLS) + client JS error capture - privacy-safe, no
// cookies, no id, no error args/user data (just a short deduped signature).
//
// Native PerformanceObserver only (no web-vitals dependency). LCP/CLS/INP are
// measured for the initial hard page load only (SPA client-side navigations
// don't reset these browser-native metrics), flushed once via sendBeacon on
// tab-hide/pagehide. Errors are attributed to whatever page is current when
// they fire, since JS errors can happen after an SPA navigation.

let loadPath = '/'; // page the LCP/CLS/INP sample belongs to
let currentPath = '/'; // updated on SPA nav - used for error attribution
let lcp = null;
let cls = 0;
let inp = 0;
let flushed = false;
let wired = false;

const seenErrors = new Set();
let errCount = 0;
const MAX_ERRORS_PER_LOAD = 5;

function send(kind, extra, path) {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) return;
  try {
    navigator.sendBeacon('/analytics/collect', JSON.stringify({ path, kind, ...extra }));
  } catch {}
}

function observe(type, cb) {
  if (typeof PerformanceObserver === 'undefined') return;
  if (PerformanceObserver.supportedEntryTypes && !PerformanceObserver.supportedEntryTypes.includes(type)) return;
  try {
    new PerformanceObserver(cb).observe({ type, buffered: true });
  } catch {}
}

function wireObservers() {
  observe('largest-contentful-paint', (list) => {
    const entries = list.getEntries();
    const last = entries[entries.length - 1];
    if (last) lcp = last.startTime;
  });

  // ponytail: naive cumulative CLS (sum of every shift without recent input),
  // not the official windowed max-session-cluster algorithm. Directionally
  // fine for a dashboard; swap in the web-vitals lib if precision matters.
  observe('layout-shift', (list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) cls += entry.value;
    }
  });

  // ponytail: INP approximated as the single largest interaction duration
  // observed, not the true 98th-percentile INP algorithm.
  observe('event', (list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > inp) inp = entry.duration;
    }
  });
}

function flushVitals() {
  if (flushed) return;
  flushed = true;
  if (lcp !== null) send('vital', { query: 'LCP', value: Math.round(lcp) }, loadPath);
  if (cls > 0) send('vital', { query: 'CLS', value: Math.round(cls * 1000) }, loadPath);
  if (inp > 0) send('vital', { query: 'INP', value: Math.round(inp) }, loadPath);
}

function shortSig(name, message, filename, lineno) {
  const file = (filename || '').split('/').pop() || '';
  return `${name || 'Error'}: ${message || ''} @ ${file}:${lineno || 0}`.slice(0, 200);
}

// Browser-extension / crypto-wallet noise that fires on our pages but isn't our
// bug (e.g. "Failed to connect to MetaMask"). Dropped so the tracker stays signal.
const NOISE = /metamask|ethereum|web3|solana|phantom|walletconnect|coinbase|chrome-extension|moz-extension|safari-web-extension|ResizeObserver loop/i;

function recordError(sig) {
  if (NOISE.test(sig)) return;
  if (errCount >= MAX_ERRORS_PER_LOAD || seenErrors.has(sig)) return;
  seenErrors.add(sig);
  errCount++;
  send('err', { query: sig, value: 0 }, currentPath);
}

function onWindowError(event) {
  recordError(shortSig(event.error && event.error.name, event.message, event.filename, event.lineno));
}

function onUnhandledRejection(event) {
  const reason = event.reason;
  const name = (reason && reason.name) || 'UnhandledRejection';
  const message = typeof reason === 'string' ? reason : (reason && reason.message) || String(reason);
  recordError(shortSig(name, message, '', 0));
}

// Wire everything once (call from the root layout onMount).
export function initVitals(initialPath) {
  if (wired || typeof document === 'undefined') return;
  wired = true;
  loadPath = initialPath || '/';
  currentPath = loadPath;
  wireObservers();
  window.addEventListener('error', onWindowError);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushVitals();
  });
  window.addEventListener('pagehide', flushVitals);
}

// Keep error attribution accurate across SPA navigations (call from afterNavigate).
export function setVitalsPath(path) {
  currentPath = path;
}
