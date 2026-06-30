---
title: "Why APIs Push Back"
guide: "rate-limits-and-retries"
phase: 1
summary: "Rate limits aren't an insult — they're how a shared service stays up for everyone. Token buckets, the 429 status, and the Retry-After header that tells you exactly how long to wait."
tags: [rate-limiting, 429, retry-after, token-bucket, http, apis]
difficulty: intermediate
synonyms: ["why do apis have rate limits", "what does 429 mean", "http 429 too many requests", "what is the retry-after header", "how do token buckets work", "what is rate limiting", "x-ratelimit headers"]
updated: 2026-06-30
---

# Why APIs Push Back

The first time you see a `429 Too Many Requests` come back from an API you've been calling happily for
weeks, it feels personal — like the service singled you out and slammed a door. It didn't. Rate limiting
is one of the most boringly reasonable things a service does, and once you see it from the *server's*
side, you'll stop fighting it and start working with it. That shift is the whole point of this phase.

## The reader's reality: a shared restaurant kitchen

Picture an API as one kitchen serving thousands of customers at once. If a single customer could fire
ten thousand orders a second, the kitchen would grind to a halt and *everyone* — including you — would
wait forever or get nothing. So the kitchen sets a pace: each customer gets a fair number of orders per
minute. That's a rate limit. It exists to keep the kitchen *up*, which is the only way you get served at
all.

A rate limit protects three things at once:

- **The service's stability** — no single caller can overwhelm it and take it down for everyone.
- **Fairness** — your noisy neighbor can't starve you of capacity.
- **Cost and abuse control** — it caps runaway scripts, scrapers, and accidental infinite loops.

> The mental flip that helps: a rate limit is not a punishment for *you*. It's a promise to *everyone*
> that the service will still be there in a minute. You're one of the "everyone" it's protecting.

## How limits are usually counted: the token bucket

You'll hear "100 requests per minute" and imagine a strict odometer that resets on the minute. Real
systems are usually gentler and smarter than that, and the most common model is the **token bucket**.

Picture a bucket that holds, say, 100 tokens. Every request you make takes one token out. The bucket
refills steadily — for example, a token or two every second — up to its maximum of 100. As long as the
bucket has tokens, your request goes through. When it's empty, you're throttled until it refills a bit.

```text
bucket capacity: 100 tokens        refill: ~2 tokens/second

[||||||||||||||||||||] 100   <- full: you can burst 100 requests right now
   you fire 100 fast
[                    ] 0     <- empty: the next request gets a 429
   wait ~5 seconds
[||||||||||          ] ~10   <- refilled a little: ~10 requests allowed again
```

*What just happened:* the bucket let you **burst** — fire a clump of requests quickly using saved-up
tokens — but it caps your *sustained* rate at the refill speed. Burst for the spike, then settle into the
steady pace. This is why "100 per minute" doesn't mean "exactly one every 0.6 seconds": you can spend
fast for a moment, you cannot spend fast *forever*.

📝 **Terminology.** *Burst* = a short clump of requests above your steady rate, allowed because tokens
accumulated while you were idle. *Sustained rate* = the long-run average the bucket refills at. Other
models exist (fixed windows, sliding windows, leaky buckets), but token bucket is the one to picture
first — it explains both the bursting and the throttling you'll actually see.

## What the server tells you: the 429 and friends

When you've run out, a well-behaved API doesn't go silent — it answers with a clear status and, often,
instructions. The signal you'll see most is:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
Content-Type: application/json

{ "error": "rate_limited", "message": "Too many requests. Try again in 30 seconds." }
```

*What just happened:* the server said **429 Too Many Requests** — "I heard you, but you're going too
fast" — and the `Retry-After: 30` header is it *telling you exactly how long to wait*: 30 seconds. This
is the single most useful header in this whole guide. When the server hands you a number, you don't have
to guess your backoff — you obey the number.

⚠️ **`429` is not an error you caused by being wrong.** Your request was *valid*; you were merely too
frequent. That's different from a `400` (your request is malformed) or a `403` (you're not allowed). A
`429` means "good request, bad timing" — so retrying it later is the *right* move, where retrying a `400`
would be pointless.

Two more things you'll commonly meet:

- **`Retry-After` can be a date instead of seconds.** Some servers send `Retry-After: Wed, 21 Oct 2026
  07:28:00 GMT` — an absolute time to wait until. Same meaning, different format; handle both.
- **`X-RateLimit-*` headers (a widespread convention, not an official standard).** Many APIs include
  hints on *every* response, not only the `429`:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1730531280
```

*What just happened:* even on a successful `200`, the server quietly told you the bucket holds **100**,
you have **7** left, and it resets at that Unix timestamp. A thoughtful client watches `Remaining` and
*slows down on its own* as it approaches zero — getting throttled is something you can often see coming
and avoid.

## A status-code cheat sheet for "should I even retry?"

Not every failure is a rate limit, and not every failure is worth retrying. Here's the quick read:

| Status | Means | Retry? |
|---|---|---|
| `429 Too Many Requests` | You're going too fast | **Yes** — wait (use `Retry-After`), then retry |
| `503 Service Unavailable` | Server is overloaded or down briefly | **Yes** — back off and retry |
| `502 / 504` Gateway errors | A proxy couldn't reach the real server in time | **Usually** — transient; retry with backoff |
| `500 Internal Server Error` | Something broke server-side | **Maybe** — could be transient; retry cautiously |
| `400 Bad Request` | Your request is malformed | **No** — retrying sends the same bad request |
| `401 / 403` | Not authenticated / not allowed | **No** — fix credentials/permissions instead |
| `404 Not Found` | The thing isn't there | **No** — it won't appear by asking again |

💡 **Key point.** Retry the *transient* failures (`429`, `5xx`) and leave the *permanent* ones (`4xx`
except `429`) alone. Retrying a `400` in a loop is the classic way to turn one bug into a storm of
identical, doomed requests.

## For builders

If you're building the *client*, the cheapest reliability win is reading what the server already tells
you: honor `Retry-After`, and if `X-RateLimit-Remaining` is getting low, ease off before you hit the
wall instead of bouncing off it. The server has done the hard work of telling you how to behave well —
most rate-limit pain comes from clients that ignore those signals and retry blindly. Phase 2 turns
"retry later" into a precise, safe recipe.

```quiz
[
  {
    "q": "What does an HTTP 429 status code mean?",
    "choices": [
      "Your request was malformed and should be fixed before retrying",
      "Your request was valid but you're sending too many too quickly",
      "You're not authorized to access the resource",
      "The server has permanently shut down the endpoint"
    ],
    "answer": 1,
    "explain": "429 Too Many Requests means a valid request arrived too frequently — good request, bad timing. That's why retrying later is the correct response."
  },
  {
    "q": "In a token-bucket rate limiter, why can you sometimes fire a burst of requests faster than the stated steady rate?",
    "choices": [
      "The limit only applies to POST requests, not GET",
      "Tokens accumulate up to the bucket's capacity while you're idle, so you can spend a saved-up clump at once",
      "The server ignores the first minute of any session",
      "Bursting is a bug that providers haven't fixed yet"
    ],
    "answer": 1,
    "explain": "The bucket fills up to its capacity when you're not using it; a burst spends those accumulated tokens. Your sustained rate is still capped at the refill speed."
  },
  {
    "q": "A 429 response includes a `Retry-After: 30` header. What's the right thing to do?",
    "choices": [
      "Retry immediately — the header is only a suggestion",
      "Treat it as a permanent failure and stop calling the API",
      "Wait 30 seconds before retrying, because the server told you exactly how long",
      "Double the value and wait 60 seconds to be safe"
    ],
    "answer": 2,
    "explain": "Retry-After is the server explicitly telling you how long to wait. When you get a concrete number, honor it instead of guessing."
  }
]
```

---

[← Guide overview](_guide.md) · [Phase 2: Retrying Without Making It Worse →](02-retrying-without-making-it-worse.md)
