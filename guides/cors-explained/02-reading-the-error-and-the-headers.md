---
title: "Reading the Error & the Headers"
guide: "cors-explained"
phase: 2
summary: "Decode the classic 'blocked by CORS policy' console error, the request's Origin header, the response's Access-Control-Allow-Origin header, and the preflight OPTIONS request that fires before non-simple requests."
tags: [cors, http-headers, preflight, options, origin, access-control-allow-origin, beginner]
difficulty: beginner
synonyms: ["blocked by cors policy no access-control-allow-origin", "what is the origin header", "what is a cors preflight request", "why is there an options request", "access-control-allow-origin meaning"]
updated: 2026-06-19
---

# Reading the Error & the Headers

The CORS error in the console looks like a wall of jargon, but it's actually telling you exactly what's
wrong — once you know which words to read. In this phase you'll learn to decode the message, then see the
two headers that the whole dance comes down to, and finally meet the surprise extra request (the
*preflight*) that confuses people the first time they spot it in the Network tab.

> ⏭️ New here? Read [Phase 1](01-why-the-browser-blocks-you.md) first — "the browser enforces, the server
> permits" makes everything below land.

## Decoding the classic error

Here's the message you came for, straight from a browser console:

```text
Access to fetch at 'http://localhost:3000/api/users' from origin
'http://localhost:5173' has been blocked by CORS policy: No
'Access-Control-Allow-Origin' header is present on the requested resource.
```

Read it slowly, phrase by phrase — it's a complete diagnosis:

```text
   Access to fetch at 'http://localhost:3000/api/users'   ← WHAT you tried to read
   from origin 'http://localhost:5173'                    ← WHERE your page is running
   has been blocked by CORS policy:                       ← the browser enforced the rule
   No 'Access-Control-Allow-Origin' header is present     ← WHY: the server sent no
       on the requested resource.                            permission slip
```

*What this is telling you:* your page on `localhost:5173` asked `localhost:3000` for data, the browser
checked the response for a permission header, found none, and refused to hand you the body. The fix lives
entirely on the server at `localhost:3000` — it needs to send that header. (Phase 3.)

⚠️ **Don't get sent on a wild goose chase by the word "fetch."** The error is not about your `fetch()`
code being wrong. Your request was fine. The browser blocked the *reading of the response*. No amount of
editing the frontend `fetch` call will fix a missing server header.

You'll see a few variants of this message; they all point at the same server-side cause:

| What the console says | What it actually means |
|---|---|
| `No 'Access-Control-Allow-Origin' header is present` | The server sent no CORS permission at all |
| `The 'Access-Control-Allow-Origin' header has a value '...' that is not equal to the supplied origin` | The server allowed a *different* origin than yours |
| `Response to preflight request doesn't pass access control check` | The preflight `OPTIONS` request was rejected (see below) |
| `...does not have HTTP ok status` | The server answered the preflight `OPTIONS` with an error instead of a success |

## The two headers it all comes down to

CORS, in its simplest form, is a short conversation between exactly two headers.

**The request header — `Origin`.** The browser adds this *automatically* to cross-origin requests. You
don't set it; you can't fake it from JavaScript. It tells the server where the calling page lives.

**The response header — `Access-Control-Allow-Origin`.** The server sends this back to name which origin
is allowed to read the response. The browser compares it against the `Origin` it sent.

Here is a healthy exchange, annotated:

```http
GET /api/users HTTP/1.1
Host: localhost:3000
Origin: http://localhost:5173          ← browser added this: "I'm calling from here"
```
```http
HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:5173   ← server: "that origin may read this"

[{"id":1,"name":"Ada"}]
```
*What just happened:* the browser announced its origin, the server echoed back the *same* origin in
`Access-Control-Allow-Origin`, the browser saw a match, and your JavaScript got the JSON. When the server
*omits* that response header — or returns a different origin — the body is the same, but the browser
refuses to let you read it, and you get the console error above.

💡 **Key point:** the browser doesn't trust *intent*, it checks a *header*. The server has to literally
say the magic words in the response. Silence means "no."

## The plot twist: the preflight `OPTIONS` request

The first time you open the Network tab and see an `OPTIONS` request you never wrote, sitting right before
your actual request, it's genuinely baffling. Here's what's going on.

📝 **Preflight request.** For requests that could *change data* or carry unusual headers, the browser
sends a small `OPTIONS` request *first* — a "may I?" — and only sends the real request if the server says
yes. This is the **preflight**.

**Why it exists.** Some requests are too risky to fire blindly. A `DELETE`, or a `POST` with a JSON
content type, or any request with a custom header like `Authorization` could cause real damage if the
server wasn't expecting cross-origin callers. So the browser checks *permission in advance* instead of
sending the dangerous request and apologizing afterward.

**Simple vs. non-simple — what triggers a preflight.** Not every request gets one. A "simple" request
skips the preflight; anything else triggers it.

```text
   SIMPLE (no preflight)              NON-SIMPLE (preflight fires first)
   ─────────────────────              ─────────────────────────────────
   • GET or HEAD or POST          vs. • PUT, DELETE, PATCH
   • only basic headers               • custom headers (e.g. Authorization,
   • POST body is a form or             X-API-Key)
     plain text                        • POST with Content-Type:
                                         application/json
                                       • requests sending credentials in
                                         some cases
```

Most real API calls — a JSON `POST`, anything with an auth token — are *non-simple*, which is why you see
preflights so often. Here's a preflight conversation in full:

```http
OPTIONS /api/users HTTP/1.1
Host: localhost:3000
Origin: http://localhost:5173
Access-Control-Request-Method: POST              ← "I want to do a POST"
Access-Control-Request-Headers: content-type     ← "…and send this header"
```
```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:5173   ← "that origin is okay"
Access-Control-Allow-Methods: GET, POST, DELETE      ← "…these methods are okay"
Access-Control-Allow-Headers: content-type           ← "…that header is okay"
```
*What just happened:* before sending your real `POST`, the browser asked the server "I'm from
`localhost:5173`, I want to `POST` with a `content-type` header — allowed?" The server answered "yes, that
origin, those methods, that header." The browser saw approval and *then* sent the actual `POST`. If the
server had not approved the method or header, the browser would stop here — and you'd see *"Response to
preflight request doesn't pass access control check."*

⚠️ **The preflight is a separate request with its own rules.** Your real request can fail at the
preflight stage and never even run. If the error mentions "preflight," the problem is the `OPTIONS`
response — the server isn't allowing your method or your headers, not (yet) the data request itself.

**Why this saves you later.** When you can read the error and know the two headers, debugging becomes
mechanical: open the Network tab, find the failing request (or its `OPTIONS` preflight), look at the
`Origin` it sent, and check whether the response's `Access-Control-Allow-*` headers cover it. The mismatch
is always right there.

## Recap

1. The console error names *where you called from*, *what you tried to read*, and *which header was
   missing* — read it phrase by phrase.
2. "Blocked by CORS" is a **server header problem**, not a bug in your `fetch`.
3. The browser auto-sends **`Origin`**; the server must answer with a matching
   **`Access-Control-Allow-Origin`**.
4. **Non-simple** requests (PUT/DELETE/PATCH, JSON POST, custom headers) trigger a **preflight `OPTIONS`**
   request that must be approved before the real request runs.
5. An error mentioning "preflight" means the `OPTIONS` response didn't allow your method or headers.

---

[← Phase 1: Why the Browser Blocks You](01-why-the-browser-blocks-you.md) · [Phase 3: Fixing It Properly →](03-fixing-it-properly.md)
