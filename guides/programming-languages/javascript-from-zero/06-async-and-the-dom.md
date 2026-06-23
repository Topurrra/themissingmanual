---
title: "Async & the DOM — JavaScript's Big Idea"
guide: "javascript-from-zero"
phase: 6
summary: "JavaScript runs on a single thread with an event loop, so slow work (network, timers) is handled asynchronously — callbacks gave way to Promises and then async/await; in the browser, JS reads and changes a live tree called the DOM and reacts to events."
tags: [javascript, async, event-loop, promises, async-await, dom, events]
difficulty: intermediate
synonyms: ["javascript single threaded", "what is the event loop", "javascript promises vs async await", "what is the dom", "javascript fetch then update page", "forgot to await javascript", "javascript button click event"]
updated: 2026-06-19
---

# Async & the DOM — JavaScript's Big Idea

By now you can write functions, loop over arrays, and split code into modules. This phase is where JavaScript stops feeling like "a language" and starts feeling like *the thing browsers run* — because two ideas define almost everything you'll do with it.

The first is **async**: JavaScript does one thing at a time, but it refuses to sit and wait for slow things. The second is the **DOM**: the live, in-memory model of the page that your JavaScript reads and rewrites while the user watches. Get these two, and "make the button fetch some data and update the page" goes from intimidating to obvious.

We'll build the mental model first, then write the real thing.

## The one-thread rule

**What it actually is.** JavaScript runs your code on a **single thread** — one worker, doing one thing at a time, in order. There is no second worker quietly running your other functions in the background. If your code is busy, it is busy; nothing else of yours runs until it finishes.

That sounds like a recipe for a frozen, useless program. The thing that saves it is the **event loop**.

📝 **Terminology.** A *thread* is a single sequence of execution — one worker, one task at a time. *Asynchronous* ("async") means "started now, finished later" — you kick off slow work and get on with other things instead of standing still until it's done.

**What it does in real life.** When your code starts something slow — a network request, a timer, waiting for a click — JavaScript doesn't block the thread waiting for it. It hands that job off (to the browser or to Node) and returns immediately. Later, when the slow thing is done, the *follow-up* code is dropped into a queue, and the event loop runs it when the thread is free.

```mermaid
flowchart LR
  Code[Your code] -->|starts slow work| Off[Hand off to browser/Node]
  Off -->|done later| Queue[Ready queue]
  Queue --> Loop[Event loop]
  Loop -->|thread free| Run[Run the follow-up]
```

*What this shows:* The slow work happens *off* your one thread. The event loop's only job is to pick the next ready piece of follow-up and run it when the thread isn't busy. One worker, many things in flight — because waiting doesn't occupy the worker.

⚠️ **Gotcha: don't block the event loop.** Because there's only one thread, a long *synchronous* task — a giant `for` loop, a heavy calculation — freezes everything. In the browser the page stops responding (no scrolling, no clicks). On a server, every request stalls. The fix is to not do heavy synchronous work on the main thread; let slow things be async, and break up big computations.

> 💡 This phase is the working mental model. For the full picture — the queue, microtasks vs. macrotasks, why one thread can feel concurrent — read [Async/Await and the Event Loop](/guides/async-await-and-the-event-loop). It's the deep version of everything here.

## Three generations of async syntax

The *idea* (start now, finish later) has stayed the same. The *syntax* for expressing it got dramatically nicer over the years. You'll see all three in real code, so let's meet them in order.

### Callbacks — the original

**What it actually is.** A **callback** is a function you hand to something slow, with the instruction "call this when you're done." The slow thing holds onto your function and runs it later.

```javascript
setTimeout(() => {
  console.log("2 seconds have passed");
}, 2000);
console.log("This runs first");
```
```console
This runs first
2 seconds have passed
```
*What just happened:* `setTimeout` registered your callback and returned immediately, so the line *after* it ran first. Two seconds later the browser dropped your callback into the queue and the event loop ran it. The order on screen — second line first — is the single-thread rule in action.

**The gotcha.** Callbacks nest. One async step that depends on another, that depends on another, marches your code rightward into a pyramid everyone calls *callback hell*:

```javascript
getUser(id, (user) => {
  getOrders(user, (orders) => {
    getDetails(orders[0], (details) => {
      // ...three levels deep and still going
    });
  });
});
```
*What just happened:* Each step can only start once the previous one's callback fires, so they nest. It works, but it's hard to read and harder to add error handling to. This pain is exactly what Promises were invented to fix.

### Promises — a value that arrives later

**What it actually is.** A **Promise** is an object that stands in for a result that isn't ready yet. It's a placeholder with three states: *pending* (still waiting), *fulfilled* (succeeded, here's the value), or *rejected* (failed, here's the error). You attach `.then()` for success and `.catch()` for failure.

```javascript
fetch("https://api.example.com/user/1")
  .then((response) => response.json())
  .then((user) => console.log(user.name))
  .catch((error) => console.log("Request failed:", error));
```
*What just happened:* `fetch` returns a Promise immediately — it hasn't waited for the network. Each `.then` says "when the previous step resolves, run this next." Crucially, the chain is *flat*, not nested: each step returns a new Promise, so success flows down the `.then`s and any error skips straight to `.catch`. The pyramid is gone.

📝 **Terminology.** A Promise *resolves* when it settles successfully (giving you a value) and *rejects* when it fails (giving you an error). "Settled" means it's done one way or the other.

### async/await — Promises that read like normal code

**What it actually is.** `async`/`await` is *syntax over Promises*. You mark a function `async`, and inside it you can `await` a Promise — which pauses that function until the Promise settles, then hands you the value as if it were a normal return. The code reads top-to-bottom like ordinary synchronous code, but it's still async underneath.

```javascript
async function showUser(id) {
  const response = await fetch(`https://api.example.com/user/${id}`);
  const user = await response.json();
  console.log(user.name);
}
```
*What just happened:* `await fetch(...)` pauses `showUser` until the response arrives, then resumes with the response in hand — no `.then` nesting, no callback. The function *looks* synchronous, but `await` is quietly doing the "start now, continue later" dance with the event loop. This is the style you'll write almost all the time.

⚠️ **Gotcha: forgetting `await`.** If you drop the `await`, you get the *Promise itself*, not the value inside it — and your code marches on before the work is done. This bites everyone:

```javascript
async function showUser(id) {
  const response = fetch(`https://api.example.com/user/${id}`); // no await!
  const user = await response.json(); // boom
}
```
```console
TypeError: response.json is not a function
```
*What just happened:* Without `await`, `response` is a pending Promise, not the resolved `Response` object — and a Promise has no `.json()` method, so you get a `TypeError`. The cure is almost always "you forgot an `await`." When something is `undefined` or "not a function" right after an async call, check for the missing `await` first.

> 💡 Rule of thumb: `await` lives inside an `async` function. `await` something that returns a Promise (`fetch`, `response.json()`, anything you wrote with `async`).

## The DOM — the page as a live object

Async gets data. The **DOM** is how you put it on screen.

**What it actually is.** When the browser loads your HTML, it parses it into a tree of objects in memory — one object per tag — called the **DOM** (Document Object Model). Your JavaScript doesn't edit the HTML text; it edits *this tree*. Change an object in the tree and the browser instantly re-renders that part of the page. The DOM is the live, two-way bridge between your code and what the user sees.

📝 **Terminology.** *DOM* = Document Object Model. An *element* is one node in that tree (a `<button>`, a `<div>`). `document` is the global object that is the root of the tree and your entry point to it.

**What it does in real life.** Three verbs cover most DOM work: **select** an element, **change** it, and **respond** to events on it.

```javascript
// Select
const button = document.querySelector("#load");
const output = document.querySelector("#output");

// Respond to an event
button.addEventListener("click", () => {
  // Change
  output.textContent = "Loading...";
});
```
*What just happened:* `querySelector` finds elements using CSS-selector syntax (`#load` = the element with `id="load"`). `addEventListener("click", fn)` tells the browser "run this function every time this button is clicked." Inside, setting `output.textContent` rewrites that element's text — and the user sees it change immediately.

⚠️ **Gotcha: use `textContent`, not `innerHTML`, for plain text.** `innerHTML` parses its input as HTML, so dropping user-supplied text into it can inject markup or scripts (an XSS hole). When you just want to show text, `textContent` is both safer and faster.

## Putting it together: click → fetch → update

Here's the canonical browser flow, and the reason both halves of this phase matter. The user clicks; you fetch data without freezing the page; the response updates the DOM. Watch the thread stay free the whole time:

```mermaid
sequenceDiagram
  participant User
  participant Button
  participant JS as Your JS
  participant API
  participant DOM
  User->>Button: clicks
  Button->>JS: click event fires
  JS->>API: await fetch(...)
  API-->>JS: JSON response
  JS->>DOM: set textContent
```

```javascript
const button = document.querySelector("#load");
const output = document.querySelector("#output");

button.addEventListener("click", async () => {
  output.textContent = "Loading...";
  try {
    const res = await fetch("https://api.example.com/quote");
    const data = await res.json();
    output.textContent = data.text;
  } catch (err) {
    output.textContent = "Could not load. Try again.";
  }
});
```
*What just happened:* The click handler is an `async` function, so it can `await`. The moment it starts, it shows "Loading..." and then awaits the fetch — and because that wait is async, the page stays fully responsive the entire time (the user can still scroll). When the JSON arrives, we write it into the DOM; if anything fails, the `catch` shows a friendly message instead of a silent break. This four-line pattern — set pending state, await, update, catch — is most of what front-end JavaScript *is*.

We slipped a `try/catch` in there because async code fails in its own particular ways. That's exactly where the next phase begins.

## Recap

1. JavaScript runs on **one thread**; the **event loop** runs slow work's follow-up later, so the thread never sits and waits.
2. Async syntax evolved: **callbacks** (nest badly) → **Promises** (`.then`/`.catch`, flat) → **async/await** (reads like normal code, still Promises underneath).
3. **`await`** pauses an `async` function until a Promise settles and hands you the value — forgetting it gives you the Promise itself, the #1 async bug.
4. The **DOM** is the page as a live tree of objects: **select** (`querySelector`), **change** (`textContent`), **respond** (`addEventListener`).
5. The everyday browser pattern is **click → `await fetch` → update the DOM**, wrapped in `try/catch`, with the page never freezing.

---

[← Phase 5: Modules & Project Layout](05-modules-and-project-layout.md) · [Guide overview](_guide.md) · [Phase 7: Errors & I/O →](07-errors-and-io.md)
