---
title: "localStorage, sessionStorage, and IndexedDB"
guide: "browser-storage-and-cookies"
phase: 2
summary: "Three client-side storage APIs that, unlike cookies, never get sent over the network: localStorage persists indefinitely, sessionStorage dies with the tab, and IndexedDB handles the size and structure localStorage can't."
tags: [localstorage, sessionstorage, indexeddb, web-storage, web-fundamentals]
difficulty: intermediate
synonyms: ["localstorage vs sessionstorage", "what is indexeddb for", "how much data can localstorage hold", "web storage api"]
updated: 2026-07-06
---

# localStorage, sessionStorage, and IndexedDB

Cookies get sent to the server on every request. `localStorage`, `sessionStorage`, and IndexedDB never
do - they live entirely in the browser, and only your JavaScript reads them. That single difference
shapes what each one is good for: nothing here belongs in a network request unless your code sends it
there deliberately.

## localStorage

Persists until a script or the user explicitly clears it - no expiry date, survives browser restarts.
Roughly 5-10MB per origin depending on the browser. The API is synchronous: every call blocks the main
thread until it completes.

```js
localStorage.setItem("theme", "dark");
localStorage.getItem("theme");      // "dark"
localStorage.removeItem("theme");
localStorage.clear();               // wipes everything for this origin

// Values are always strings - objects need JSON round-tripping
localStorage.setItem("prefs", JSON.stringify({ theme: "dark", fontSize: 16 }));
const prefs = JSON.parse(localStorage.getItem("prefs"));
```

Synchronous means fine for small reads/writes (a theme flag, a feature toggle) but a real cost if you
call it in a hot loop or store something large - it can block rendering.

## sessionStorage

Same API, different lifetime: cleared when the tab closes. Reloading the page or navigating within the
tab keeps it; opening a new tab to the same site does not share it (each tab gets its own).

```js
sessionStorage.setItem("draft_id", "abc123");
sessionStorage.getItem("draft_id");
```

Good fit for anything that shouldn't outlive the current visit - a multi-step form's in-progress state,
a "don't show this banner again this session" flag.

## IndexedDB

The one for when localStorage's limits actually bite: you need to store more than a few MB, you need
structured records instead of flat strings, or synchronous calls are blocking work you can't afford to
block. IndexedDB is asynchronous, transactional, and holds hundreds of MB to GB (browser- and
disk-dependent) of structured, queryable data - think of it as a database that ships inside the
browser.

The raw API is verbose - opening a database, defining object stores, wrapping everything in
transactions and `onsuccess`/`onerror` callbacks. Most real projects reach for a thin wrapper library
(like `idb`) rather than hand-writing it. At this stage, know what it's for rather than its full
surface:

```js
// Opening a database and reading a record - illustrative, not exhaustive
const request = indexedDB.open("notes-app", 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  db.createObjectStore("notes", { keyPath: "id" });
};

request.onsuccess = (event) => {
  const db = event.result;
  const tx = db.transaction("notes", "readonly");
  const getReq = tx.objectStore("notes").get("note-1");
  getReq.onsuccess = () => console.log(getReq.result);
};
```

Reach for IndexedDB when you're building offline-first apps, caching large API responses, or storing
files/blobs client-side. For a settings flag or a cart with a dozen items, it's overkill.

## The three side by side

| | Lifetime | Size | Access | Sent to server? |
|---|---|---|---|---|
| Cookie | Set via `Expires`/`Max-Age` | ~4KB | Sync (`document.cookie`) | Yes, automatically |
| `localStorage` | Until cleared | ~5-10MB | Sync | No |
| `sessionStorage` | Until tab closes | ~5-10MB | Sync | No |
| IndexedDB | Until cleared | Hundreds of MB+ | Async | No |

Check the [DOM guide](/guides/the-dom-explained) if the event-driven callback style in the IndexedDB
example feels unfamiliar - it's the same pattern as DOM event listeners.

## Quick check

```quiz
[
  {
    "q": "You need to store a 50MB offline dataset for a PWA. What should you reach for?",
    "choices": ["localStorage", "sessionStorage", "IndexedDB"],
    "answer": 2,
    "explain": "IndexedDB is built for large, structured data - localStorage and sessionStorage cap out around 5-10MB and only hold strings."
  },
  {
    "q": "What's the key lifetime difference between localStorage and sessionStorage?",
    "choices": ["localStorage is per-tab, sessionStorage is shared across tabs", "sessionStorage clears when the tab closes; localStorage persists until explicitly cleared", "They have identical lifetimes but different size limits"],
    "answer": 1
  },
  {
    "q": "Does data in localStorage get sent to the server automatically like a cookie?",
    "choices": ["Yes, on every request", "No, only your JavaScript can read or send it", "Only over HTTPS"],
    "answer": 1
  }
]
```

---

[← Phase 1: Cookies](01-cookies-explained.md) · [Guide overview](_guide.md) · [Phase 3: Choosing the Right Storage for the Job →](03-choosing-storage.md)
