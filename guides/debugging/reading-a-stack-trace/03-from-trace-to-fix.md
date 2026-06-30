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

You can now read a trace: error line, crash point, your code in the noise. This last phase closes the loop - turning a trace you've *read* into a bug you've *fixed*. The trick is knowing that the line that crashed is rarely the line that's *wrong*, and knowing where to look for the line that is.

## The crash line is the symptom - the cause is usually a few frames down

**Why people get this wrong.** The natural instinct is to fix the line at the crash point. Sometimes that's right. Often it's like treating a fever by smashing the thermometer. The crash point is where the bad value *finally* caused trouble - but the bad value was usually *created* somewhere earlier, in a frame below.

Look again at a `None`/null failure:

```console
Traceback (most recent call last):
  File "/app/views/orders.py", line 58, in create_order
    invoice = compute_invoice(order)
  File "/app/billing.py", line 17, in compute_invoice
    total = order.subtotal * rate
AttributeError: 'NoneType' object has no attribute 'subtotal'
```

*What just happened:* The crash point is `billing.py:17` - `order.subtotal` failed because `order` is `None`. But "make line 17 not crash" is the wrong question. The right question is: **why was `order` `None` when it got here?** Read the frame *below* the crash - `create_order` at line 58 called `compute_invoice(order)`. So `order` was already `None` *before* `compute_invoice` ran. The real bug lives in `create_order` (or wherever *it* got `order` from): something that was supposed to load an order returned nothing, and nobody noticed until line 17 tried to use it.

💡 **Key point.** Read the trace as a question that moves *downward* (toward where the program started): "this broke - who handed it the bad value?" The crash point tells you *what* is wrong (a `None`, a missing key); the frames below tell you *where it came from*. Following that chain one frame at a time is how you walk from symptom to cause.

⚠️ **Gotcha.** Patching only the crash point - wrapping line 17 in an `if order is not None:` - often just *hides* the bug. The order still failed to load; now it fails silently instead of loudly. Defensive checks have their place, but first make sure you're not muffling the alarm instead of putting out the fire.

## "Caused by:" - when a trace contains a trace

**What it actually is.** Sometimes one error happens *while handling another*. Languages capture this as a **chain**: the trace you see is the outer error, and below (or above) it is a second trace, introduced by a marker - **`Caused by:`** in Java/JVM, **`The above exception was the direct cause of...`** / **`During handling of the above exception...`** in Python. Each section is a full mini-trace.

📝 **Terminology.** A *chained* (or *nested*) exception is one error wrapped around another: the surface error your code threw, plus the original, lower-level error that triggered it. The chain preserves the *whole* story instead of throwing away the original cause.

Here's a realistic Java-style chained trace:

```console
Exception in thread "main" java.lang.RuntimeException: Failed to load user profile
    at com.shop.ProfileService.load(ProfileService.java:44)
    at com.shop.Main.main(Main.java:12)
Caused by: java.sql.SQLException: Connection refused: localhost:5432
    at com.shop.Db.connect(Db.java:88)
    at com.shop.ProfileService.load(ProfileService.java:41)
    ... 1 more
```

*What just happened:* The top section is the *outer* error - "Failed to load user profile" - which is your code politely re-reporting a failure. The interesting part is below the **`Caused by:`** line: the *real* root cause is a `SQLException: Connection refused: localhost:5432` - the database isn't accepting connections. The `... 1 more` just means "the rest of these frames are identical to the section above, trimmed to save space." When you see `Caused by:`, **read the lowest `Caused by:` block first** - that's the original sin; everything above it is consequence.

💡 **Key point.** In a chained trace, the **deepest `Caused by:` is the true root cause.** Read from the bottom-most cause upward: "the DB refused the connection → so loading the profile failed → so `main` blew up." Fix the bottom, and the whole chain disappears.

## When the entire trace is library code

Every so often you scan for your own file paths (the Phase 2 skill) and find… none. Every frame is in a dependency or the language runtime. This feels like the worst case. It's actually a strong clue.

```console
Traceback (most recent call last):
  File ".../site-packages/requests/models.py", line 971, in json
    return complexjson.loads(self.text, **kwargs)
  File ".../json/decoder.py", line 355, in raw_decode
    raise JSONDecodeError("Expecting value", s, err.value)
json.exceptions.JSONDecodeError: Expecting value: line 1 column 1 (char 0)
```

*What just happened:* Not one frame is yours - it's all `requests` and the `json` decoder. But here's the read: a library crashing entirely inside itself almost always means **you handed it something it couldn't handle.** This trace says the JSON decoder tried to parse a response and found nothing valid at "line 1 column 1" - i.e. the body was empty or wasn't JSON at all (an HTML error page, a blank 500 response). The bug isn't in `requests`; it's in *your* call that assumed the response would be JSON. The fix is back in your code: check the status code and content type before calling `.json()`.

💡 **Key point.** An all-library trace is the library saying *"you gave me bad input."* Your code is just one frame off-screen, calling in. Find the call *you* made into that library (it's the function whose name appears at the bottom of the library section, or the line in your code that you know triggered this path) and check what you passed it: the wrong type, an empty value, a malformed string, a `None`.

⚠️ **Gotcha.** The rare exception is an actual bug in the library - but assume it's *your* input first. It almost always is, and you'll fix it in minutes instead of filing a phantom bug report against a battle-tested package.

## The two-move close: reproduce, then search the top line

Once you've found the suspect frame, two cheap moves land the fix fast.

**Reproduce it deliberately.** A bug you can summon on demand is a bug you can kill. Use the trace as your recipe: it names the exact function and the exact bad value. Call that function with that input and watch it fail the same way. (This is its own skill - see [How to Reproduce a Bug](/guides/how-to-reproduce-a-bug) - but the trace hands you most of the ingredients for free.)

**Search the error line - the *type and message*, not your variable names.** Paste the top line into a search engine or your error tracker. Strip out the parts unique to your run (your file paths, your specific IDs) and keep the generic shape:

```text
   you saw:    KeyError: 'EU-WEST'  at billing.py line 17
   search for: python KeyError dict missing key handle default
                └ language ┘ └ error type ┘ └ what you're trying to do ┘
```

*What just happened:* You're searching for the *shape* of the problem, not your one-off details. `'EU-WEST'` and `billing.py` are unique to you and will match nothing; `python` + `KeyError` + the concept is what thousands of other people have already hit and answered. The error *type* plus the *kind* of operation is the searchable part.

> ⏭️ Traces are one window into a failing system; logs are another, and they often hold the *why* a trace can't show. When the trace alone isn't enough, see [Reading Logs Without Drowning](/guides/reading-logs-without-drowning).

## The trace is a map, not a tombstone

Here's where we end, because it's the whole point. A stack trace *looks* like an obituary - a record of the moment your program died. It isn't. It's a map drawn by the program in its final instant, marking exactly where it broke and tracing the full path that led there. The error line is the X. The frames are the trail back to the treasure.

Read calmly, in the order this guide gave you - error line, crash point, your code, then *downward* toward the cause - and the forty-line wall that made your stomach drop at 2am becomes the fastest, most honest debugging tool you have. The program is not yelling at you. It's handing you directions. Take them.

## Recap

1. The **crash point is the symptom**; the **cause is usually a frame or two below it** - read *downward* asking "who handed this the bad value?"
2. Don't reflexively patch the crash line - make sure you're fixing the cause, not muffling the alarm.
3. **`Caused by:` / chained exceptions:** the **deepest cause is the real root**; read it first, fix the bottom, and the chain collapses.
4. An **all-library trace** almost always means **you passed the library bad input** - find your call into it and check what you sent.
5. Close the loop: **reproduce** the failure using the trace as a recipe, and **search the error type + message** (the generic shape, not your unique details).

---

[← Guide overview](_guide.md) · [Related: How to Reproduce a Bug →](/guides/how-to-reproduce-a-bug)
