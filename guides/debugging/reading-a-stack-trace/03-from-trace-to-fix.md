---
title: "From Trace to Fix"
guide: "reading-a-stack-trace"
phase: 3
summary: "The crash line is the symptom; the cause is often a few frames below it. How to follow 'Caused by:' / chained exceptions, what to do when the whole trace is library code (you passed it something bad), and how to reproduce and search the top line to land the fix."
tags: [debugging, stack-trace, root-cause, caused-by, chained-exceptions, reproduce]
difficulty: beginner
synonyms: ["how to fix a bug from a stack trace", "what does caused by mean in a stack trace", "stack trace is all library code", "how to find root cause from stack trace", "chained exception meaning", "how to search an error message"]
updated: 2026-06-19
---

# From Trace to Fix

You can read a trace now: error line, crash point, your code in the noise. This phase turns a trace *read* into a bug *fixed*. The trick: the line that crashed is rarely the line that's *wrong*.

## The crash line is the symptom - the cause is usually a few frames down

**Why people get this wrong.** The instinct is to fix the crash line - sometimes right, often like treating a fever by smashing the thermometer. The crash point is where the bad value *finally* caused trouble, but it was usually *created* earlier, in a frame below.

A `None`/null failure:

```console
Traceback (most recent call last):
  File "/app/views/orders.py", line 58, in create_order
    invoice = compute_invoice(order)
  File "/app/billing.py", line 17, in compute_invoice
    total = order.subtotal * rate
AttributeError: 'NoneType' object has no attribute 'subtotal'
```

*What just happened:* Crash point `billing.py:17` - `order.subtotal` failed because `order` is `None`. "Make line 17 not crash" is the wrong question; the right one is **why was `order` `None` here?** The frame below shows `create_order` at line 58 calling `compute_invoice(order)` - so `order` was already `None` before that. The real bug is in `create_order` (or wherever it got `order` from): something that should have loaded an order returned nothing, unnoticed until line 17.

💡 **Key point.** Read the trace as a question moving *downward*: "who handed this the bad value?" The crash point is *what* is wrong; the frames below are *where it came from*.

⚠️ **Gotcha.** Patching only the crash point - wrapping line 17 in `if order is not None:` - often just *hides* the bug: the order still fails to load, now silently. Defensive checks have their place, but don't muffle the alarm instead of putting out the fire.

## "Caused by:" - when a trace contains a trace

**What it actually is.** Sometimes one error happens *while handling another*. Languages capture this as a **chain**: the outer error, plus a second trace below or above it, introduced by a marker - **`Caused by:`** in Java/JVM, **`The above exception was the direct cause of...`** / **`During handling of the above exception...`** in Python. Each section is a full mini-trace.

📝 **Terminology.** A *chained* (or *nested*) exception wraps one error around another - the surface error your code threw, plus the original, lower-level error that triggered it - preserving the whole story instead of discarding the cause.

A realistic Java-style chained trace:

```console
Exception in thread "main" java.lang.RuntimeException: Failed to load user profile
    at com.shop.ProfileService.load(ProfileService.java:44)
    at com.shop.Main.main(Main.java:12)
Caused by: java.sql.SQLException: Connection refused: localhost:5432
    at com.shop.Db.connect(Db.java:88)
    at com.shop.ProfileService.load(ProfileService.java:41)
    ... 1 more
```

*What just happened:* The top section, "Failed to load user profile," is your code re-reporting a failure. Below **`Caused by:`** is the real root cause: `SQLException: Connection refused: localhost:5432` - the database isn't accepting connections. `... 1 more` means the rest of those frames match the section above, trimmed to save space.

💡 **Key point.** The **deepest `Caused by:` is the true root cause** - read it first, that's the original sin, everything above is consequence. Bottom-up: "the DB refused the connection → loading the profile failed → `main` blew up." Fix the bottom and the chain disappears.

## When the entire trace is library code

Every so often you scan for your own file paths and find none - every frame is in a dependency or the runtime. Feels like the worst case; it's actually a strong clue.

```console
Traceback (most recent call last):
  File ".../site-packages/requests/models.py", line 971, in json
    return complexjson.loads(self.text, **kwargs)
  File ".../json/decoder.py", line 355, in raw_decode
    raise JSONDecodeError("Expecting value", s, err.value)
json.exceptions.JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

*What just happened:* Not one frame is yours - all `requests` and the `json` decoder. A library crashing entirely inside itself almost always means **you handed it something it couldn't handle.** Here, the decoder found nothing valid at "line 1 column 1" - the body was empty or wasn't JSON at all (an HTML error page, a blank 500 response). The bug is in *your* call, which assumed the response would be JSON. Fix: check status code and content type before calling `.json()`.

💡 **Key point.** An all-library trace is the library saying *"you gave me bad input."* Find the call you made into it (named at the bottom of the library section) and check what you passed: wrong type, empty value, malformed string, `None`.

⚠️ **Gotcha.** The rare exception is an actual bug in the library - but assume it's your input first. It almost always is, and you'll fix it in minutes instead of filing a phantom bug report against a battle-tested package.

## The two-move close: reproduce, then search the top line

Once you've found the suspect frame, two cheap moves land the fix.

**Reproduce it deliberately.** A bug you can summon on demand is a bug you can kill. The trace is your recipe - it names the exact function and bad value; call it with that input and watch it fail the same way. (Its own skill - see [How to Reproduce a Bug](/guides/how-to-reproduce-a-bug) - but the trace gives most of the ingredients free.)

**Search the error line - type and message, not your variable names.** Paste the top line into a search engine or error tracker, stripped of parts unique to your run (file paths, IDs), keeping the generic shape:

```text
   you saw:    KeyError: 'EU-WEST'  at billing.py line 17
   search for: python KeyError dict missing key handle default
                └ language ┘ └ error type ┘ └ what you're trying to do ┘
```

*What just happened:* You're searching for the *shape* of the problem, not your one-off details. `'EU-WEST'` and `billing.py` match nothing; `python` + `KeyError` + the concept is what thousands of others have already hit and answered. The error *type* plus the *kind* of operation is the searchable part.

> ⏭️ Traces are one window into a failing system; logs are another, and often hold the *why* a trace can't show. When the trace alone isn't enough, see [Reading Logs Without Drowning](/guides/reading-logs-without-drowning).

## The trace is a map, not a tombstone

A stack trace *looks* like an obituary. It isn't - it's a map drawn in the program's final instant, marking exactly where it broke and the path that led there. The error line is the X; the frames are the trail back to the treasure.

Read calmly, in order - error line, crash point, your code, then *downward* toward the cause - and the forty-line wall that dropped your stomach at 2am becomes the fastest, most honest debugging tool you have.

## Recap

1. The **crash point is the symptom**; the **cause is usually a frame or two below it** - read *downward* asking "who handed this the bad value?"
2. Don't reflexively patch the crash line - fix the cause, don't muffle the alarm.
3. **`Caused by:` / chained exceptions:** the **deepest cause is the real root**; read it first, fix the bottom, the chain collapses.
4. An **all-library trace** almost always means **you passed the library bad input** - find your call into it and check what you sent.
5. Close the loop: **reproduce** the failure using the trace as a recipe, and **search the error type + message** (the generic shape, not your unique details).

---

[← Guide overview](_guide.md) · [Related: How to Reproduce a Bug →](/guides/how-to-reproduce-a-bug)
