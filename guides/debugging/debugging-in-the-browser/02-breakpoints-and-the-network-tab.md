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

The Console got you a long way. But there's a wall you hit: `console.log` only tells you what you *thought
to print*, after the fact. Bug deeper than that — a value that's wrong somewhere in the middle of a
function, a loop that does the wrong thing on iteration nine — and you find yourself adding log, refresh,
read, add another log, refresh again. Each round costs a refresh and a fresh dose of frustration.

There's a better tool sitting in the **Sources** panel, and a second panel — **Network** — that solves the
single most common frontend bug class: "the data won't load." This phase is those two.

## Breakpoints: freeze the code and look

A breakpoint is a marker you put on a line of code that tells the browser: *stop right before running this
line and hand me control.* The page runs at full speed until it hits that line, then **freezes** — and now
you can see every variable's real value at that exact instant. No printing. No guessing. You look.

You set one in the **Sources** panel: open your JS file, click the line number in the left margin, and a
blue marker appears.

```text
Sources panel — checkout.js

  39   function applyDiscount(cart, code) {
  40     const subtotal = cart.total;
● 41     const rate = DISCOUNTS[code];        ◄── breakpoint set here
  42     return subtotal - subtotal * rate;
  43   }
```
*What just happened:* You marked line 41. Next time the page runs `applyDiscount`, it'll pause *before* line
41 executes — with `cart`, `subtotal`, and `code` already holding their real values, and `rate` not computed
yet. You're standing inside the function, mid-run.

When it pauses, DevTools shows you three things — and these three are the whole game:

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
*What just happened:* Look at the Watch panel — `DISCOUNTS[code]` is `undefined`. The discount code
`"SUMMER"` isn't in the `DISCOUNTS` object. You found the bug without a single `console.log`: the lookup
returns nothing, so the math will produce garbage. That's the power — *all* the local state is right there.

### The controls you actually use

Once paused, you don't have to let the page run free. You drive it forward one piece at a time:

- **Resume** (▷) — let the page run until the next breakpoint (or until it's done).
- **Step over** (⤼) — run the current line whole, *including any function it calls*, and stop on the next
  line here. Use it when you trust what a line calls and only want the result.
- **Step into** (↓) — if the current line calls a function *you* want to inspect, descend into it and pause
  on its first line. This is how you follow a bug down into a helper.
- **Step out** (↥) — finish the current function and pop back up to whoever called it. Use it when you
  stepped into something and the bug isn't there.

```text
# Paused at: return subtotal - subtotal * rate   (line 42, rate = undefined)
> step over
# Page resumes... returns NaN. There's the symptom: undefined rate → NaN total.
```
*What just happened:* Stepping over line 42 with `rate` being `undefined` produced `NaN` (`80 - 80 *
undefined` is `NaN`). You've now traced the bug from cause (`DISCOUNTS["SUMMER"]` is missing) all the way to
the visible symptom (a `NaN` price). That's a complete diagnosis.

### Watch expressions and the call stack

The **Watch** panel holds little expressions you pin, and DevTools re-evaluates them *every time the page
pauses.* Add `DISCOUNTS[code]` once and you see its value at every stop — no re-typing, no mental math.

The **call stack** is the chain of calls that got you here: `onClick` called `handleCheckout` called
`applyDiscount`. Click any frame and DevTools jumps you into *that* function with *its* variables, so you can
ask "wait, what did `handleCheckout` pass in?" without re-running. If reading those frames feels shaky,
[Reading a Stack Trace](/guides/reading-a-stack-trace) walks through them properly.

💡 **Why this beats scattering logs:** a `console.log` shows one value you guessed you'd need. A breakpoint
shows you *every* value, lets you step forward at your own pace, and lets you ask new questions you didn't
anticipate — all from a single pause, no refresh between guesses.

⚠️ **Gotcha — your code might be minified.** In a built app, `checkout.js` may arrive as one unreadable line.
Look for **source maps**: if your build emits them (most dev setups do), DevTools shows the *original*
readable source for breakpoints. If you only see minified soup, your source maps aren't loading — fix that
first, or debugging will be misery.

## The Network tab: when the data won't load

The other giant bug class isn't in your code at all — it's in the conversation between the page and the
server. The page asks for data; something comes back wrong, or nothing comes back. The **Network** tab
records every one of those requests.

Open Network, **then reload the page** (it only records while it's open), and you get a list:

```text
Name              Status   Type    Size    Time
─────────────────────────────────────────────────
index.html        200      doc     4.2 kB   80 ms
app.js            200      script  120 kB   40 ms
GET /api/user     200      fetch   1.1 kB   95 ms
GET /api/orders   500      fetch   612 B   210 ms   ◄── red row
```
*What just happened:* One row is red: `GET /api/orders` came back **500**. That status code is the headline —
the server hit an error trying to fulfill the request. The page's order list is empty not because *your* code
is broken, but because the data never arrived. You've moved the investigation from frontend to backend.

### Reading a status code at a glance

The status code tells you who's at fault, roughly:

```text
2xx  → it worked.            200 OK, 201 Created
3xx  → redirect.             301, 302
4xx  → YOU asked wrong.      400 bad request, 401 unauthorized,
                             403 forbidden, 404 not found
5xx  → the SERVER broke.     500 internal error, 502, 503
```
*What just happened:* A quick rule of thumb — `4xx` usually means *your request* was wrong (bad URL, missing
auth token, malformed body), and `5xx` means *the server* fell over. That one digit aims you at the right
half of the system before you read anything else.

### Click a request to see everything

Click any row and a detail pane opens with tabs — and this is where the real answers live:

- **Headers** — the full URL, the method (GET/POST), the status, and the request/response headers (this is
  where you confirm an auth token was actually sent).
- **Payload** (or **Request**) — what your code *sent*. Did you POST the fields the server expected?
- **Response** (or **Preview**) — what came *back*. For a `500`, this often contains the actual server error
  message; for a `200` with wrong data, this shows you the real shape of what you got.
- **Timing** — how long each phase took (waiting, downloading). This is how you catch "it's not broken, it's
  merely slow."

```text
GET /api/orders  →  Response tab:
  { "error": "column \"user_id\" does not exist" }
```
*What just happened:* The 500's Response body handed you the real cause — a database column name is wrong on
the server. You didn't have to guess what the backend did; it told you, right there in the Response tab.
That's a bug report you can hand off with confidence.

## For builders

Two habits pay off fast. First, when a frontend feature "doesn't work," check Network *before* you read your
own code — half the time the request itself failed and your code is fine. Second, the **Preview/Response** tab
is the fastest way to confirm an API actually returns the shape your code expects; a `200` with the wrong
JSON keys breaks the UI as thoroughly as a `500`.

## Recap

1. A **breakpoint** (Sources panel, click the line number) freezes the page before a line runs and shows you
   every local value — no `console.log`, no refresh-and-guess loop.
2. **Step over / into / out** drive the paused code forward; **watch expressions** re-check on every pause;
   the **call stack** shows how you got there.
3. The **Network tab** records every request — reload with it open. The **status code** points the finger
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
      "Your request was malformed — fix the frontend",
      "The page was redirected somewhere else",
      "The server hit an error fulfilling the request — the problem is likely on the backend",
      "The resource was not found"
    ],
    "answer": 2,
    "explain": "5xx codes mean the server broke. 4xx codes mean your request was wrong. The 500 points you at the backend, and the Response tab often contains the actual server error message."
  },
  {
    "q": "The Network tab is empty when you open it after the page already loaded. Why?",
    "choices": [
      "The page made no requests at all",
      "Network only records while it's open — you need to reload with it open",
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
