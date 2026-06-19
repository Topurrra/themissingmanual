---
title: "Push vs Pull: Webhooks"
guide: "webhooks-and-message-queues"
phase: 1
summary: "Polling means asking 'any news?' over and over and mostly hearing 'no'; a webhook flips it so the other service POSTs to your URL the moment something happens — and because anyone can POST to that URL, you must verify the request is genuine."
tags: [webhooks, polling, http, signatures, hmac, event-driven]
difficulty: intermediate
synonyms: ["what is a webhook", "polling vs webhooks", "how do webhooks work", "how to verify a webhook signature", "webhook security", "stripe webhook example"]
updated: 2026-06-19
---

# Push vs Pull: Webhooks

You integrated with a payment provider. A customer pays, but the money doesn't land instantly — it
clears a few seconds (sometimes minutes) later. You need to know the moment it clears so you can ship
the order. So you do the obvious thing: every few seconds, you ask. "Did it clear yet?" "No." "Did it
clear yet?" "No." "Did it clear yet?" "Yes."

That's **polling**, and it works, but it's the integration equivalent of a kid in the back seat asking
"are we there yet?" You make a thousand calls to hear "no" nine hundred and ninety-nine times. A
webhook flips the whole thing around: instead of you asking, *they* tell you. This phase is about that
flip — what it really is, how to wire it up, and the one security step that everyone skips and later
regrets.

## Polling: the model you already have

**What it actually is.** Polling is request/response on a loop. You repeatedly call an API endpoint to
check whether some state has changed yet. The "push" is really still a "pull" — you're pulling
status, over and over, hoping this is the time the answer is different.

**What it does in real life.** Most of your calls return nothing new. You're paying for the network
round-trips, the other side is paying to answer "nothing changed," and there's always lag: if you poll
every 30 seconds, you can be up to 30 seconds late noticing the thing you cared about.

**A real example.**
```console
$ curl https://api.payments.example/v1/charges/ch_8Hk2
{"id":"ch_8Hk2","status":"pending"}

$ curl https://api.payments.example/v1/charges/ch_8Hk2
{"id":"ch_8Hk2","status":"pending"}

$ curl https://api.payments.example/v1/charges/ch_8Hk2
{"id":"ch_8Hk2","status":"succeeded"}
```
*What just happened:* You asked the same question three times. The first two calls were pure waste —
the charge hadn't changed. Only the third told you anything new, and you still don't know how long it
had already been `succeeded` before you happened to ask.

⚠️ **The polling tax.** Polling tightens into a bad corner: poll *often* and you drown both sides in
useless traffic and may hit rate limits; poll *rarely* and you're slow to react. There's no setting
that's both cheap and fast. That tension is exactly what webhooks remove.

## The webhook: they call you

**What it actually is.** A webhook is a reversed API call. Instead of *you* calling *them*, you give
them a URL, and *they* send an HTTP POST to that URL whenever a specific event happens. Your server
stops asking and starts listening.

📝 **Terminology.** A *webhook* is sometimes called a "reverse API," an "HTTP callback," or a "web
callback." It's the same idea each time: an event happens on their side, so they make an HTTP request
to an endpoint on your side. The *event* is the thing that happened (payment succeeded, PR opened,
email bounced); the *delivery* is the individual HTTP POST that tells you about it.

**The flip, in one picture.**
```text
   POLLING (you pull)                      WEBHOOK (they push)

   YOU ──"any news?"──► THEM              THEM ──"it happened!"──► YOU
   YOU ◄────"no"─────── THEM              (one POST, only when there's
   YOU ──"any news?"──► THEM               actually something to say)
   YOU ◄────"no"─────── THEM
   YOU ──"any news?"──► THEM              you registered a URL once;
   YOU ◄───"yes!"────── THEM              now they do the talking
```

**How it works, step by step.**
1. You register a URL with the provider — usually in their dashboard or via an API call — and pick
   which events you care about (`charge.succeeded`, `pull_request.opened`, and so on).
2. The event happens on their side.
3. Their server sends an HTTP POST to your URL, with the event details in the request body (almost
   always JSON).
4. Your endpoint does its work and replies with a `2xx` status code to say "got it."

**A real example — receiving the delivery.** Here's what a real webhook POST looks like arriving at
your server. This is the raw HTTP request *they* send *you*:
```console
POST /webhooks/payments HTTP/1.1
Host: yourapp.example
Content-Type: application/json
Webhook-Signature: t=1718800000,v1=5257a869e7...

{
  "id": "evt_9aB",
  "type": "charge.succeeded",
  "data": { "id": "ch_8Hk2", "amount": 4200, "currency": "usd" }
}
```
*What just happened:* The payment provider made an HTTP request *to you* the instant the charge cleared.
The body tells you exactly what happened and to which charge. You didn't ask — you got told, with no
lag and no wasted "are we there yet" calls. Your job now is to read `type`, do the right thing (ship the
order), and return a `2xx`.

**Replying correctly.** The status code you send back is a signal, not a formality. A `2xx` means
"received, you're done." Anything else (a `500`, a timeout) tells the sender you *didn't* get it — and
most providers will then **retry** the delivery later. That retry behavior is a feature, but it has
sharp edges we'll cover in [Phase 3](03-when-to-use-which.md).

⚠️ **Return `2xx` fast, then do the heavy work.** Don't run a 30-second job before replying. If your
handler is slow, the sender may give up waiting, decide the delivery failed, and retry — and now you're
processing the same event twice. The common pattern: validate the request, drop the work onto an
internal queue (that's Phase 2), return `200` immediately, and let a worker do the slow part.

## Anyone can POST to your URL

Here's the part people skip, and it's the most important paragraph in this phase. Your webhook URL is
just a public HTTP endpoint sitting on the internet. The provider can POST to it — but so can anyone
else who learns the address. Nothing about receiving a POST proves it came from who you think.

🪖 **War story.** A team once wired up an "order paid" webhook and shipped goods the moment it fired.
The URL leaked. Someone POSTed a hand-crafted `charge.succeeded` body to it, and the system happily
shipped a real product for a payment that never happened. The fix was already sitting in the docs they
hadn't read: verify the signature.

**What it actually is — signature verification.** Reputable providers sign every delivery. They take
the raw request body, combine it with a **shared secret** that only you and they know, run it through a
hashing function (typically HMAC-SHA256), and put the result in a header. You repeat the exact same
computation on your side and check that your result matches theirs. If it matches, the request genuinely
came from someone holding the secret — the provider — and the body wasn't tampered with in transit.

📝 **Terminology.** *HMAC* (Hash-based Message Authentication Code) is a way to produce a fingerprint of
some data *using a secret key*. Without the key you can't produce the right fingerprint, and you can't
forge the data without changing the fingerprint. The provider gives you the secret once (you store it
like a password); it never travels in the request itself.

**A real example — verifying in Node.js.**
```javascript
const crypto = require("crypto");

// rawBody is the EXACT bytes of the request body, before any JSON parsing.
function isGenuine(rawBody, signatureHeader, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Constant-time compare so attackers can't guess the signature byte by byte.
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader)
  );
}
```
*What just happened:* You recomputed the fingerprint of the body using the secret only you and the
provider share. If your `expected` value equals the signature they sent, the delivery is authentic. If
it doesn't, you reject it — return a `400` and do nothing. The forged `charge.succeeded` from the war
story fails this check, because the attacker didn't have the secret.

⚠️ **Verify against the raw body, not the parsed object.** The signature is computed over the exact
bytes that were sent. If your web framework parses the JSON and re-serializes it before you check the
signature, even a difference in spacing or key order will make the fingerprint mismatch and reject a
legitimate request. Capture the raw body *first*, verify, *then* parse. This trips up almost everyone
once.

💡 **Key point.** A webhook endpoint without signature verification is an open door. Treat verification
as part of "wiring up the webhook," not an optional hardening step you'll get to later.

## Recap

1. **Polling** is request/response on a loop — you keep asking "any news?" and mostly hear "no." It's
   either expensive or slow, never both cheap and fast.
2. **A webhook** flips it: you register a URL once, and the other service POSTs to it the moment an
   event happens. No asking, no lag.
3. The delivery is **an HTTP POST with the event in the body**; you reply `2xx` to confirm receipt, and
   you reply *fast* — offload slow work so the sender doesn't time out and retry.
4. **Anyone can POST to a public URL**, so you must **verify the signature**: recompute the HMAC of the
   raw body with the shared secret and check it matches. No match, no action.

That's how another company tells *you* something happened. Next, the mirror image: how your *own*
services hand work to each other without anyone waiting around.

---

[← Guide overview](_guide.md) · [Phase 2: Message Queues →](02-message-queues.md)
