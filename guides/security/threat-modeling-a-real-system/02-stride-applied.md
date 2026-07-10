---
title: "STRIDE, Applied"
guide: "threat-modeling-a-real-system"
phase: 2
summary: "Walking each STRIDE category against a real app's trust boundaries - concrete findings on the file-sharing example, not abstract definitions."
tags: [security, threat-modeling, stride, appsec, risk-assessment]
difficulty: advanced
synonyms: ["stride model explained", "what does stride stand for security", "how to apply stride to an application", "stride threat categories examples"]
updated: 2026-07-11
---

# STRIDE, Applied

STRIDE is six questions, one per letter, that you ask at every trust boundary from Phase 1. Most explanations stop at definitions - "Spoofing is pretending to be something you're not" - and leave you no closer to finding anything in your own system. The definitions matter less than the habit of asking each question at each boundary and writing down what you find, even when the answer is "already handled."

Working through the file-sharing app's boundaries: browser-to-server, server-to-database, server-to-storage, server-to-payment-API (both directions), and the shared-link path.

## Spoofing - is anyone able to pretend to be someone else?

**Finding:** The upload endpoint accepts a `filename` and a `uploaded_by` display field in the form data. If `uploaded_by` is trusted as-is and shown next to the file in another user's shared view, an attacker can upload a file that displays someone else's username - spoofing identity in the UI without touching the auth system at all. The fix isn't at the login boundary; it's realizing that identity can be spoofed *downstream* of a correct login, anywhere the server trusts a client-supplied label instead of deriving it from the session.

**Finding:** The payment webhook boundary is a spoofing target too - if the webhook handler trusts the request just because it hit the right URL, anyone who finds that URL can POST a fake "payment succeeded" event and upgrade their own account for free. This is the payment API pretending to be itself, from an attacker who never touched the real payment API.

## Tampering - can someone modify data they shouldn't touch?

**Finding:** Share links are often just a token in a URL (`/share/a1b2c3`). If that token is short or sequential, an attacker can tamper with it - guess or increment their way into someone else's shared files - without ever hitting an authentication check, because the whole point of a share link is that it bypasses one.

**Finding:** At the server-to-storage boundary, if the upload path is built from user input (`/uploads/{username}/{filename}`) without sanitizing `filename`, a value like `../../other-user/secret.pdf` tampers with the intended storage location. This is the classic path-traversal shape, but framed as a STRIDE finding it's specifically about *tampering with where data lands*, which is a narrower and more actionable statement than "check for path traversal."

## Repudiation - can someone deny having done something, with no way to prove otherwise?

**Finding:** If file deletions and share-link creation aren't logged with a user ID, timestamp, and source IP, a user who deletes another account's file (via a tampering bug, or an insider with database access) can plausibly deny it - there's no record. Repudiation findings are almost always "we have no log for X," which is why this category gets skipped: it's not a bug in code, it's an absence.

**Finding:** The payment webhook again - if a "payment succeeded" event isn't logged with the raw payload before your handler acts on it, a disputed charge or a fraud investigation has nothing to point to. You can't reconstruct what the payment API actually sent versus what your handler did with it.

## Information disclosure - is data reaching someone who shouldn't see it?

**Finding:** A share-link page that returns a 404 for "link doesn't exist" but a 403 for "link exists, but it's expired" discloses information through the *shape* of the response - an attacker enumerating tokens learns which guesses are close. Small, but exactly the kind of leak that only shows up when you're deliberately looking at what a response reveals, not just what it's supposed to return.

**Finding:** File storage URLs - if files are served from predictable, unauthenticated storage URLs (common with misconfigured S3-style buckets) rather than through the web server's auth check, the storage boundary itself leaks every file to anyone with the URL, regardless of what the application layer enforces.

## Denial of service - can someone degrade or take down the system?

**Finding:** Uploads are the obvious target: no per-user quota or file-size cap on the upload endpoint means one account can fill shared storage or exhaust server memory processing a multi-gigabyte file. The trust boundary insight here is that "logged-in user" is not the same as "trusted not to abuse capacity" - authentication doesn't bound resource use.

**Finding:** The payment webhook endpoint, if it does expensive work synchronously (re-verifying with the payment API, updating multiple tables) before responding, is a target for anyone who can guess the URL and flood it - even without valid signatures, if the handler does its expensive work *before* checking the signature.

## Elevation of privilege - can someone get more access than they were granted?

**Finding:** If the premium-tier check happens in application code (`if user.plan == "premium"`) rather than being enforced wherever storage quota is actually allocated, a race condition or a missed check on one code path (say, a bulk-import feature added later) lets a free user get premium storage - privilege elevation through an inconsistently enforced boundary, not through breaking auth.

**Finding:** The webhook boundary, once more: if a successful spoofed "payment succeeded" event (from the Spoofing finding above) also grants an *admin* role rather than just a paid plan - because some setup script uses the same webhook path for both - one weak boundary elevates privilege far past what "faked a payment" should buy an attacker.

Notice the payment webhook shows up in four of six categories. That repetition is the method working as intended - STRIDE doesn't spread your attention evenly, it concentrates it on the boundaries doing the most trust-shifting - exactly what Phase 1's boundary-marking surfaces.

```quiz
[
  {
    "q": "Why does the payment webhook boundary generate findings across four different STRIDE categories in this walkthrough?",
    "choices": ["Because webhooks are always the least secure part of any system", "Because it's a boundary where an external system sends commands that change internal state, which concentrates risk", "Because STRIDE requires every boundary to have at least four findings"],
    "answer": 1,
    "explain": "A boundary where an outside party can trigger state changes (not just send data) tends to concentrate risk across spoofing, repudiation, DoS, and elevation - that's the signal STRIDE is designed to surface."
  },
  {
    "q": "A share link uses a short, sequential token. Which STRIDE category does that finding fall under?",
    "choices": ["Tampering - an attacker can guess/increment into another user's data", "Denial of service - short tokens run out faster", "Repudiation - the user can deny sharing the link"],
    "answer": 0,
    "explain": "Guessing or incrementing into a resource you shouldn't be able to reach is a tampering finding - you're modifying (here, gaining) access to data through a boundary that should have blocked it."
  },
  {
    "q": "Why is 'we have no log for X' a legitimate finding under Repudiation, even though there's no faulty code to point to?",
    "choices": ["It isn't - repudiation only applies to authentication bugs", "Repudiation findings are about missing evidence, not broken logic - an absence of logging is itself the gap", "Logging is a performance concern, not a security one"],
    "answer": 1,
    "explain": "Repudiation is about accountability: if an action can't be tied to who did it, that's a real gap even when every other control worked correctly."
  }
]
```

---

[← Phase 1: Drawing the System](01-drawing-the-system.md) · [Guide overview](_guide.md) · [Phase 3: From Threats to Action →](03-from-threats-to-action.md)
