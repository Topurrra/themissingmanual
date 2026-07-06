---
title: "Errors & I/O - When Things Go Wrong and Data Comes In"
guide: "javascript-from-zero"
phase: 7
summary: "Handle failures with try/catch/finally and throw, catch rejected Promises by wrapping await in try/catch, and read the outside world the way each runtime does it: fetch in the browser, fs in Node - with JSON parsing in both."
tags: [javascript, errors, try-catch, throw, promises, fetch, fs, json, node]
difficulty: intermediate
synonyms: ["javascript try catch", "javascript throw error", "catch rejected promise", "try catch around await", "unhandled promise rejection", "read file in node", "fetch json javascript", "parse json javascript"]
updated: 2026-06-19
---

# Errors & I/O - When Things Go Wrong and Data Comes In

Two things every real program does: touch the outside world (files, networks, user input), and get let down by it - the file isn't there, the network times out, the JSON is malformed. A program that assumes everything works is a program that crashes in front of a user.

This phase is about handling failure on purpose, and about reading the outside world - **I/O** ("input/output"). The error-handling tools are the same everywhere; the I/O tools differ by *runtime* (browser vs. Node), so we'll cover both.

## try / catch / finally - handling the explosion

When JavaScript hits something it can't do - calling a method on `undefined`, parsing broken JSON - it **throws** an error, stopping the current code and looking for someone to catch it. If nobody does, the program (or that operation) crashes. `try/catch` is how you volunteer to catch it.

```javascript
try {
  const data = JSON.parse(text);
  console.log(data.name);
} catch (err) {
  console.log("Bad JSON:", err.message);
} finally {
  console.log("Done either way");
}
```
*What just happened:* The `try` block runs normally; if anything inside it throws, execution jumps straight to `catch` with the error object (`err`), skipping the rest of `try`. `finally` runs no matter what - use it for cleanup you can't skip (closing a connection, hiding a spinner).

📝 **Terminology.** An *error* (or *exception*) is an object describing what went wrong - `err.message` the human text, `err.name` the type (e.g. `TypeError`). To *throw* is to raise one; to *catch* is to handle it.

## throw - raising your own errors

You don't only catch errors the language throws - you `throw` your own when your code hits a situation it can't honor. Throwing an `Error` says "this is broken; whoever called me needs to deal with it."

```javascript runnable
function withdraw(balance, amount) {
  if (amount > balance) {
    throw new Error("Insufficient funds");
  }
  return balance - amount;
}

try {
  withdraw(100, 150);
} catch (err) {
  console.log(err.message);
}
```
```console
Insufficient funds
```
*What just happened:* `throw new Error(...)` immediately stopped `withdraw` and sent the error up to the caller's `try/catch`. Throwing beats returning a magic value like `-1` or `null`, since an error can't be silently ignored - it forces a decision.

⚠️ **Gotcha: throw `Error` objects, not strings.** `throw "oops"` technically works, but a bare string has no stack trace, so you lose the line-number trail. Always `throw new Error("message")`.

## Errors in async code - the part that surprises people

Here's the trap: a rejected Promise is *not* caught by a plain `try/catch` around the call that returns it, because the call returns immediately, before the rejection happens - the error arrives later, on the queue.

**The fix, and the whole reason `async/await` is lovely:** `await`ing a Promise throws its rejection *right there*, so an ordinary `try/catch` around the `await` catches it.

```javascript
async function loadUser(id) {
  try {
    const res = await fetch(`https://api.example.com/user/${id}`);
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.log("Could not load user:", err.message);
    return null;
  }
}
```
*What just happened:* Wrapping the `await`s in `try/catch` catches both kinds of failure: a *network* failure (`fetch`'s Promise rejects) and a *bad response* we `throw` ourselves. Note the `res.ok` check - a gotcha of its own, below.

⚠️ **Gotcha: `fetch` does not reject on HTTP errors.** A 404 or 500 is a *successful* round-trip to `fetch`, so its Promise **resolves**, not rejects - it only rejects when the request can't complete at all (no network, DNS failure). Check `res.ok` yourself and throw, as above; skipping this is the single most common `fetch` mistake.

⚠️ **Gotcha: unhandled promise rejections.** A rejected Promise that nothing catches doesn't vanish - it surfaces as a warning, and in modern Node can **crash the process**:

```console
$ node app.js
UnhandledPromiseRejection: This error originated either by throwing
inside of an async function without a catch block...
node:internal/process/promises ... (Use `node --trace-warnings ...`)
```
*What just happened:* An async function rejected and no `try/catch` or `.catch()` was waiting. Every Promise needs a home for its failure - `await` it inside a `try/catch`, or attach a `.catch()`.

## I/O #1 - the network, in the browser: `fetch`

`fetch` is the browser's built-in way to make HTTP requests, returning a Promise of a `Response`. Reading JSON is two steps, and each can fail.

```javascript
async function getQuote() {
  const res = await fetch("https://api.example.com/quote");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json(); // parses the body as JSON
  return data;
}
```
*What just happened:* `res.json()` reads the response body and parses it as JSON, and is *also* async (the body may still be streaming in), so it needs its own `await`. If the body isn't valid JSON, `res.json()` rejects, caught by your surrounding `try/catch`.

> 💡 Same `fetch`, deeper dive: status codes, headers, request bodies, and what JSON actually is live in [HTTP and JSON API Basics](/guides/http-and-json-api-basics).

## I/O #2 - files, in Node: `fs`

The browser can't read your hard drive (good - imagine if web pages could). **Node** can, through its built-in **`fs`** ("file system") module. The modern, Promise-based version lives at `node:fs/promises`, so you `await` it just like `fetch`.

```javascript
import { readFile } from "node:fs/promises";

async function loadConfig() {
  try {
    const text = await readFile("config.json", "utf8");
    return JSON.parse(text);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log("No config file; using defaults.");
      return {};
    }
    throw err; // some other problem - let it bubble up
  }
}
```
*What just happened:* `readFile(path, "utf8")` returns a Promise of the file's contents as a string (`"utf8"` means text, not raw bytes); `JSON.parse` turns that text into an object. The `catch` inspects `err.code`: `ENOENT` ("Error NO ENTry") means the file doesn't exist, handled gracefully - any *other* error is re-thrown, since we don't know how to fix it.

📝 **Terminology.** `ENOENT` is a standard OS error code meaning "no such file or directory," surfaced on `err.code`. Checking `err.code` (rather than the message text) is the reliable way to branch on *which* failure happened.

⚠️ **Gotcha: don't blindly `JSON.parse`.** It throws a `SyntaxError` on malformed input - a stray trailing comma, an empty file, an HTML error page where you expected JSON. Always parse inside a `try/catch` so one bad file doesn't take down your whole program.

## The pattern that ties it together

Every example has the same skeleton, whether the data comes from a network or a disk:

```mermaid
flowchart LR
  Start[await the I/O] --> Ok{Worked?}
  Ok -->|yes| Use[parse + use the data]
  Ok -->|no| Catch[catch: handle or re-throw]
```

*What this shows:* `await` the slow input, branch on success, and always have a `catch` that either recovers or deliberately passes the error up. You don't need to memorize APIs - just this shape, and the discipline to never leave a failure path empty.

## Recap

1. **`try/catch/finally`** handles thrown errors; `finally` always runs (use it for cleanup).
2. **`throw new Error("...")`** raises your own errors - use `Error` objects, not strings, to keep the stack trace.
3. In async code, **wrap `await` in `try/catch`** to catch rejected Promises; an **unhandled rejection** can crash Node.
4. **`fetch` doesn't reject on 404/500** - check `res.ok` and throw yourself; `res.json()` is async and can also fail.
5. I/O is runtime-specific: **`fetch`** for the browser network, **`node:fs/promises`** for Node files - **always guard `JSON.parse`**.

---

[← Phase 6: Async & the DOM](06-async-and-the-dom.md) · [Guide overview](_guide.md) · [Phase 8: The Ecosystem & Tooling →](08-ecosystem-and-tooling.md)
