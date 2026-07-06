---
title: "Breakpoints and the Network Tab"
guide: "debugging-in-the-browser"
phase: 2
summary: "Pause your JavaScript with breakpoints in the Sources panel instead of scattering logs, then use the Network tab to find the request that failed and read what came back."
tags: [debugging, breakpoints, sources, network, devtools, javascript]
difficulty: intermediate
synonyms: ["how to set a breakpoint in the browser", "sources panel debugger", "step over step into devtools", "watch expression browser", "network tab explained", "find failed api request", "read http status code", "inspect request payload", "console.log vs breakpoint"]
updated: 2026-06-30
---

# Breakpoints and the Network Tab

`console.log` only tells you what you *thought to print*, after the fact - a value wrong mid-function, a loop
misbehaving on iteration nine, and you're stuck in a log-refresh-read loop. This phase covers two better
tools: **Sources**, for pausing code instead of guessing what to print, and **Network**, for the single most
common frontend bug class - "the data won't load."

## Breakpoints: freeze the code and look

A breakpoint marks a line and tells the browser: *stop right before it runs and hand me control.* The page
runs full speed until it hits that line, then **freezes** - now you see every variable's real value at that
instant. No printing, no guessing. You look.

Set one in **Sources**: open your JS file, click the line number in the left margin, and a blue marker appears.

```text
Sources panel - checkout.js

  39   function applyDiscount(cart, code) {
  40     const subtotal = cart.total;
● 41     const rate = DISCOUNTS[code];        ◄── breakpoint set here
  42     return subtotal - subtotal * rate;
  43   }
```
*What just happened:* Next time `applyDiscount` runs, it pauses *before* line 41 - `cart`, `subtotal`, and
`code` already hold their real values, `rate` isn't computed yet. You're standing inside the function, mid-run.

When paused, DevTools shows three things:

```text
┌─ PAUSED on checkout.js:41 ──────────────────────────────────────┐
│                                                                 │
│  SCOPE (what's true right now)      CALL STACK (how we got here)│
│    code     = "SUMMER"                ▶ applyDiscount  :41       │
│    subtotal = 80                        handleCheckout :120      │
│    cart     = {total: 80, items: 3}     onClick        :12       │
│                                                                 │
│  WATCH                              CONTROLS                     │
│    DISCOUNTS[code]  = undefined       ▷ resume   ⤼ step over     │
│    subtotal * 0.2   = 16              ↓ step into ↥ step out     │
└─────────────────────────────────────────────────────────────────┘
```
*What just happened:* Watch shows `DISCOUNTS[code]` is `undefined` - `"SUMMER"` isn't in the `DISCOUNTS`
object. Bug found without a single `console.log`: the lookup returns nothing, so the math produces garbage.

### The controls you actually use

Once paused, drive the page forward one piece at a time:

- **Resume** (▷) - run until the next breakpoint (or the end).
- **Step over** (⤼) - run the current line whole, *including any function it calls*, stop on the next line.
  Use when you trust what a line calls and only want the result.
- **Step into** (↓) - descend into a called function and pause on its first line - follow a bug into a helper.
- **Step out** (↥) - finish the current function, pop back to the caller. Use when the bug wasn't in what you
  stepped into.

```text
# Paused at: return subtotal - subtotal * rate   (line 42, rate = undefined)
> step over
# Page resumes... returns NaN. There's the symptom: undefined rate → NaN total.
```
*What just happened:* Stepping over line 42 with `rate` as `undefined` produced `NaN` (`80 - 80 * undefined`).
Bug traced from cause (`DISCOUNTS["SUMMER"]` missing) to symptom (`NaN` price) - a complete diagnosis.

### Watch expressions and the call stack

The **Watch** panel holds expressions you pin, re-evaluated *every time the page pauses* - add
`DISCOUNTS[code]` once and see its value at every stop, no re-typing.

The **call stack** is the chain of calls that got you here: `onClick` called `handleCheckout` called
`applyDiscount`. Click any frame to jump into *that* function with *its* variables - no re-running needed.
See [Reading a Stack Trace](/guides/reading-a-stack-trace) if frames feel shaky.

💡 **Why this beats scattering logs:** `console.log` shows one guessed value; a breakpoint shows *every*
value, lets you step at your own pace, and answers questions you didn't anticipate.

⚠️ **Gotcha - your code might be minified.** In a built app, `checkout.js` may arrive as one unreadable line.
Check for **source maps**: if your build emits them (most dev setups do), DevTools shows the original source
for breakpoints. Minified soup means they aren't loading - fix that first.

## The Network tab: when the data won't load

The other giant bug class isn't in your code - it's in the conversation between page and server. The
**Network** tab records every request the page makes.

Open Network, **then reload the page** (it only records while open), and you get a list:

```text
Name              Status   Type    Size    Time
─────────────────────────────────────────────────
index.html        200      doc     4.2 kB   80 ms
app.js            200      script  120 kB   40 ms
GET /api/user     200      fetch   1.1 kB   95 ms
GET /api/orders   500      fetch   612 B   210 ms   ◄── red row
```
*What just happened:* One row is red: `GET /api/orders` came back **500** - the server errored fulfilling the
request. The order list is empty because the data never arrived, not because *your* code is broken.

### Reading a status code at a glance

The status code tells you who's at fault, roughly:

```text
2xx  → it worked.            200 OK, 201 Created
3xx  → redirect.             301, 302
4xx  → YOU asked wrong.      400 bad request, 401 unauthorized,
                             403 forbidden, 404 not found
5xx  → the SERVER broke.     500 internal error, 502, 503
```
*What just happened:* `4xx` means *your request* was wrong (bad URL, missing auth token, malformed body);
`5xx` means *the server* fell over - one digit aims you at the right half of the system.

### Click a request to see everything

Click any row and a detail pane opens with tabs - where the real answers live:

- **Headers** - full URL, method, status, request/response headers (confirms an auth token was actually sent).
- **Payload/Request** - what your code *sent*: did you POST the fields the server expected?
- **Response/Preview** - what came *back*: often the actual server error for a `500`, or the real data shape
  for a `200` with wrong data.
- **Timing** - how long each phase took - catches "it's not broken, it's slow."

```text
GET /api/orders  →  Response tab:
  { "error": "column \"user_id\" does not exist" }
```
*What just happened:* The Response body handed you the real cause - a wrong database column name on the
server. No guessing what the backend did; a bug report you can hand off with confidence.

## For builders

Check Network *before* your own code when a feature "doesn't work" - half the time the request failed and
your code is fine. And use **Preview/Response** to confirm an API returns the shape your code expects: a
`200` with wrong JSON keys breaks the UI as thoroughly as a `500`.

## Recap

1. A **breakpoint** (Sources panel, click the line number) freezes the page before a line runs and shows you
   every local value - no `console.log`, no refresh-and-guess loop.
2. **Step over / into / out** drive the paused code forward; **watch expressions** re-check on every pause;
   the **call stack** shows how you got there.
3. The **Network tab** records every request - reload with it open. The **status code** points the finger
   (`4xx` = your request, `5xx` = the server), and the **Response** tab usually hands you the real cause.

Next: one real "why is this broken?" bug, walked end to end across all four panels.

```quiz
[
  {
    "q": "Why does a breakpoint generally beat scattering console.log statements?",
    "choices": [
      "It runs the code faster",
      "It pauses the code so you can inspect every local value and ask new questions, without refreshing between guesses",
      "It automatically fixes the bug it pauses on",
      "It works even when JavaScript is disabled"
    ],
    "answer": 1,
    "explain": "A breakpoint freezes execution and exposes all live state at once. A console.log only shows the one value you thought to print, and each new guess costs another edit and refresh."
  },
  {
    "q": "In the Network tab, a request shows status 500. What does that tell you?",
    "choices": [
      "Your request was malformed - fix the frontend",
      "The page was redirected somewhere else",
      "The server hit an error fulfilling the request - the problem is likely on the backend",
      "The resource was not found"
    ],
    "answer": 2,
    "explain": "5xx codes mean the server broke. 4xx codes mean your request was wrong. The 500 points you at the backend, and the Response tab often contains the actual server error message."
  },
  {
    "q": "The Network tab is empty when you open it after the page already loaded. Why?",
    "choices": [
      "The page made no requests at all",
      "Network only records while it's open - you need to reload with it open",
      "You need a paid plan to see requests",
      "The requests were all cached and are never shown"
    ],
    "answer": 1,
    "explain": "The Network tab records requests as they happen. Requests that fired before you opened it (or before a reload) aren't captured, so reload the page with the tab open."
  }
]
```

---

[← Phase 1: The DevTools Map and the Console](01-the-devtools-map-and-the-console.md) · [Guide overview](_guide.md) · [Phase 3: A Real Investigation →](03-a-real-investigation.md)
