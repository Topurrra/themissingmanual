---
title: "CORS, Explained (and Why It Keeps Blocking You)"
guide: "cors-explained"
phase: 0
summary: "What CORS actually is - the browser protecting users by refusing to let one site read another's responses - how to read the error and the headers, and how to fix it on the server without opening a security hole."
tags: [cors, security, browser, http, frontend, beginner]
category: security
difficulty: beginner
synonyms: ["what is cors", "cors error explained", "how to fix cors", "no access-control-allow-origin header", "blocked by cors policy", "cors preflight options request"]
order: 3
updated: 2026-06-19
---

# CORS, Explained (and Why It Keeps Blocking You)

You wrote some perfectly reasonable code. Your frontend on `localhost:5173` calls your API on
`localhost:3000`, and the browser slams the door: *"blocked by CORS policy."* You can see the response
sitting right there in the Network tab - the API answered fine - but your JavaScript can't touch it. It
feels like the browser is sabotaging you for no reason.

It isn't. CORS is a safety rule the browser enforces *on behalf of the person using it*, and once you see
what it's actually protecting against, the error stops being mysterious and the fix becomes obvious. This
guide walks you from the mental model to the exact headers to a copy-from cheat-card.

## How to read this

- **Blocked right now and just need the fix?** Jump to [Phase 3: Fixing It Properly](03-fixing-it-properly.md)
  and use the cheat-card at the top - but read the one ⚠️ about `*` before you ship it.
- **Want it to finally make sense?** Read in order. Each phase builds on the last: the *why* (Phase 1), the
  *what you're seeing* (Phase 2), then the *fix* (Phase 3).

## The phases

1. **[Why the Browser Blocks You](01-why-the-browser-blocks-you.md)** - the same-origin policy, and the
   one idea that makes all of CORS click: the browser enforces, the server permits.
2. **[Reading the Error & the Headers](02-reading-the-error-and-the-headers.md)** - decode the console
   message, the `Origin` request header, the `Access-Control-Allow-Origin` response header, and the
   preflight `OPTIONS` request.
3. **[Fixing It Properly](03-fixing-it-properly.md)** - set the right headers on the *server*, why
   credentials and wildcards don't mix, and a symptom-to-fix cheat-card.

> Deeper material - fine-grained per-route policies, caching preflights with `Access-Control-Max-Age`,
> and CORS in front of CDNs and gateways - is deferred to a follow-up guide. This one gets you unblocked,
> safely.

## Related

- [HTTP, Explained](/guides/http-explained)
- [What an API Is](/guides/what-an-api-is)
