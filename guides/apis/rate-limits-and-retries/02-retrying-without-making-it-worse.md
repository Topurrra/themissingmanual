---
title: "Retrying Without Making It Worse"
guide: "rate-limits-and-retries"
phase: 2
summary: "Exponential backoff, why jitter is non-negotiable, a retry budget so you give up gracefully, and the golden rule of only retrying requests that are safe to repeat."
tags: [retries, exponential-backoff, jitter, retry-budget, idempotency, idempotency-key, apis]
difficulty: intermediate
synonyms: ["how to retry a failed api call", "exponential backoff explained", "why add jitter to retries", "what is a retry budget", "how many times should i retry", "what is an idempotency key", "safe to retry post request", "avoid charging a card twice on retry"]
updated: 2026-07-10
---

# Retrying Without Making It Worse

You know the failure is probably temporary, so retrying feels obvious - and it is, right up until the
naive version bites you. Two failure stories haunt this phase. One: you retry in a tight `while` loop and
turn a momentary blip into a self-inflicted flood. Two: you retry a "create charge" call that *actually
succeeded* but timed out on the reply - and bill the customer twice. This phase gives you the recipe that
avoids both: wait longer each time, add randomness, cap your effort, and only retry what's safe to repeat.

## Don't retry instantly: exponential backoff

The first instinct - retry immediately, maybe in a loop - is the worst one. If the service is struggling,
a wall of instant retries is more load, which makes it struggle more. The fix is to **wait longer after
each failure**, and the standard pattern is **exponential backoff**: each wait roughly doubles.

```text
attempt 1  ->  fails  ->  wait ~1s
attempt 2  ->  fails  ->  wait ~2s
attempt 3  ->  fails  ->  wait ~4s
attempt 4  ->  fails  ->  wait ~8s
attempt 5  ->  give up (out of budget)
```

Instead of hammering, you backed off - 1, 2, 4, 8 seconds - giving the service room to recover. A short
hiccup gets caught by the early, quick retries; a longer outage doesn't get a flood from you, because your
waits stretch out fast. The doubling means you make only a handful of attempts even across many seconds.

📝 **Terminology.** *Backoff* = the wait you insert before a retry. *Exponential* = that wait grows
multiplicatively (×2 each time here), not by a fixed step. The base delay (1s here) and the multiplier
(2×) are yours to tune; doubling from ~1s is a sane default.

## The bit everyone forgets: jitter

Here's the trap that catches teams who "did backoff right." Imagine the service blips and a thousand of
your clients all fail at the same instant. With pure exponential backoff, all thousand wait *exactly* 1
second, then all thousand retry *at the same moment*. You've synchronized a thousand clients into a
drumbeat of simultaneous spikes - every retry round lands as one giant wave. That's a self-made
**thundering herd** (much more on this in Phase 3).

The fix is **jitter**: add randomness to each wait so the retries spread out instead of clumping.

```text
without jitter (everyone waits exactly 2s):
   all clients ->|             |<- one big spike at t=2s

with jitter (each waits a random slice up to 2s):
   clients spread ->| . . . . . |<- load smeared across the window
```

Jitter smeared the retry wave across the whole window instead of stacking it into one spike. The service
sees a gentle trickle it can actually absorb, rather than a synchronized wall.

A simple, widely used recipe is **"full jitter"**: instead of waiting the full computed backoff, wait a
*random* amount between zero and that backoff.

```python runnable
import random

base = 1.0          # base delay in seconds
cap = 30.0          # never wait longer than this
for attempt in range(5):
    backoff = min(cap, base * (2 ** attempt))   # 1, 2, 4, 8, 16
    wait = random.uniform(0, backoff)           # full jitter: random slice of it
    print(f"attempt {attempt + 1}: backoff window={backoff:.0f}s, actually wait={wait:.2f}s")
```

The backoff *window* still doubles (1, 2, 4, 8, 16s), but the actual wait is a random point inside that
window - so two clients running this same code almost never wait the same amount, and their retries don't
collide. The `cap` keeps a long outage from producing absurd 10-minute waits.

💡 **Key point.** Exponential backoff *without* jitter is a known foot-gun: it turns many clients into a
synchronized herd. Backoff decides *how long*; jitter decides *who goes when*. You need both.

## Know when to stop: a retry budget

Retrying forever is its own bug. If the service is genuinely down for an hour, infinite retries pile up
work, hold connections open, and can take *your* service down too. So you give yourself a **budget** and
give up gracefully when it's spent.

A budget is usually one or both of:

- **Max attempts** - e.g. "try at most 5 times, then fail."
- **A deadline** - e.g. "keep retrying, but stop after 30 seconds total, no matter the attempt count."

```text
budget: 5 attempts OR 30s total, whichever comes first

if attempts >= 5            -> stop, surface the error
if elapsed_seconds >= 30    -> stop, surface the error
otherwise                   -> back off (with jitter) and try again
```

You bounded the effort in *both* dimensions. The deadline matters because a few exponential backoffs can
quietly add up to a long time - you want a hard ceiling so a stuck operation doesn't hang a user's request
for minutes. When the budget runs out, you stop and report a clean failure rather than retrying into the
void.

⚠️ **Beware nested retries.** If your client retries, and the library *it* calls also retries, and the
service behind *that* retries too, the attempts multiply: 3 × 3 × 3 = 27 real requests for one logical
call. This "retry amplification" is a notorious way to accidentally DDoS yourself. Pick *one* layer to
own retries and turn the others off.

## The golden rule: only retry what's safe to repeat

This is the rule that separates a safe retry from a money-losing one. Before retrying, ask: **if this
request already ran, is running it again harmless?**

That property has a name you met if you read the webhooks guide: **idempotency**. An operation is
idempotent if doing it twice has the same effect as doing it once.

- `GET /users/42` - reading. Run it a hundred times; nothing changes. **Safe to retry.**
- `DELETE /sessions/abc` - deleting. Already gone? Deleting again is still "gone." **Safe to retry.**
- `PUT /users/42 {name: "Sam"}` - setting to a value. Same result every time. **Safe to retry.**
- `POST /charges {amount: 5000}` - *creating* a charge. Retry a timed-out one and you might **bill twice.**
  **Not safe** - unless you make it safe.

The danger case is the timed-out write. Your `POST` to create a charge may have *succeeded* on the server
while the *response* got lost on the way back. From your side it looks like a failure. Retry it naively
and you've created a second charge.

```text
you: POST /charges  ----------------->  server: charge created
you: (no response - network dropped it)  <-- response lost here
you: "looks failed, retry!"  -------->  server: ANOTHER charge created  💸
```

The lost *response*, not a lost request, is what makes blind retries dangerous on writes. The work
happened; only your confirmation went missing. A naive retry does the work a second time.

## The fix for unsafe retries: idempotency keys

You can't make "create a charge" naturally idempotent - each call is meant to create something new. So
serious APIs give you a tool: an **idempotency key**. You generate a unique ID for the *logical*
operation and send it with the request. The server remembers that key. If it sees the same key twice, it
returns the *original* result instead of doing the work again.

```http
POST /v1/charges HTTP/1.1
Idempotency-Key: a1b2c3-charge-order-9921
Content-Type: application/json

{ "amount": 5000, "currency": "usd", "source": "tok_visa" }
```

You stamped this charge with a key tied to the *order*, not the attempt. The first time the server sees
`a1b2c3-charge-order-9921`, it creates the charge and records the result against the key. When your retry
arrives with the *same* key, the server recognizes it, skips creating a second charge, and returns the
first charge's response. One key, one charge - no matter how many times the network makes you retry.

📝 **Terminology.** *Idempotency key* = a caller-generated unique ID for one logical operation, sent so
the server can deduplicate retries. Generate it *once per operation* and reuse it across that operation's
retries - if you make a fresh key every attempt, you've defeated the whole point.

💡 **Key point.** Retry idempotent requests freely. For non-idempotent ones (most `POST`s that create or
charge), either don't retry, or use an idempotency key so the server can make the retry safe. "Could this
double-charge?" is the question to ask before every retry of a write.

## Putting it together

A safe retry loop, in plain terms:

```text
for each attempt, until the budget is spent:
    send the request
    if it succeeded                      -> return the result
    if it failed with a 4xx (not 429)    -> stop; retrying won't help
    if it failed with 429 or 5xx:
        if the response had Retry-After  -> wait that long
        else                             -> wait backoff(attempt) with jitter
        (writes carry the same idempotency key on every attempt)
budget spent -> surface a clean error
```

Every habit from this phase is in there - honor `Retry-After` when given, otherwise exponential backoff
*with jitter*, stop on permanent errors, respect a budget, and keep the idempotency key constant across
attempts. That loop turns a flaky dependency into a non-event.

## For builders

Reach for a battle-tested retry library before hand-rolling this - most ecosystems have one that gives you
backoff, jitter, and budgets in a few lines, and they've already fixed the bugs you'd hit. Your real job
is *configuration with judgment*: set sane caps, add jitter (confirm the default actually does), retry
only transient statuses, and decide per-endpoint whether a retry could double a side effect. Phase 3
covers what to do when even a perfect retry policy isn't enough - when a dependency is *down*.

```quiz
[
  {
    "q": "Why is jitter added on top of exponential backoff?",
    "choices": [
      "To make retries happen faster overall",
      "To spread retries out in time so many clients don't all retry at the exact same instant",
      "To encrypt the request so it can't be replayed",
      "Because the Retry-After header requires it"
    ],
    "answer": 1,
    "explain": "Pure exponential backoff makes many clients wait the same fixed amount and retry in sync - a self-made thundering herd. Jitter randomizes each wait so the load spreads out."
  },
  {
    "q": "A POST that creates a charge times out with no response. Why is blindly retrying it dangerous?",
    "choices": [
      "POST requests can never be retried under any circumstances",
      "The charge may have actually succeeded and only the response was lost, so a retry could create a second charge",
      "The server will reject any retry automatically",
      "Retrying a POST always corrupts the request body"
    ],
    "answer": 1,
    "explain": "A lost response, not a lost request, is the trap: the work may already be done. A naive retry repeats a non-idempotent operation and can double-charge - unless you use an idempotency key."
  },
  {
    "q": "What is the correct way to use an idempotency key across retries of the same charge?",
    "choices": [
      "Generate a brand-new key for every retry attempt",
      "Use the same key on every attempt of that one logical operation so the server deduplicates them",
      "Only send the key on the final attempt",
      "Let the server generate the key and ignore it on the client"
    ],
    "answer": 1,
    "explain": "The key identifies the logical operation, not the attempt. Keeping it constant across retries lets the server recognize duplicates and return the original result instead of redoing the work."
  }
]
```

---

[← Phase 1: Why APIs Push Back](01-why-apis-push-back.md) · [Guide overview](_guide.md) · [Phase 3: When Retrying Isn't Enough →](03-when-retrying-isnt-enough.md)
