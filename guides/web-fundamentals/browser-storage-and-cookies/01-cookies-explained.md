---
title: "Cookies: What They Are and Why They Got Complicated"
guide: "browser-storage-and-cookies"
phase: 1
summary: "A cookie is a small name=value string the browser stores and automatically attaches to every matching request - and that automatic behavior is both why cookies power login sessions and why they're a security surface."
tags: [cookies, httponly, samesite, csrf, xss, web-fundamentals]
difficulty: intermediate
synonyms: ["what is a cookie", "httponly vs secure vs samesite", "why are cookies sent automatically", "third party cookies explained"]
updated: 2026-07-06
---

# Cookies: What They Are and Why They Got Complicated

A cookie is a string, capped around 4KB, stored as a `name=value` pair. That's the entire idea. The
part that makes cookies useful - and occasionally dangerous - is what happens after the browser stores
one: it attaches that cookie to every subsequent request that matches the cookie's domain and path,
without your JavaScript doing anything.

That's the whole mechanism behind "staying logged in." Your server sets a session cookie once; the
browser replays it automatically on every request to that site, so the server recognizes you without
you re-entering a password on every page.

## Setting a cookie

The server sets a cookie via the `Set-Cookie` response header:

```
Set-Cookie: session_id=a1b2c3d4; HttpOnly; Secure; SameSite=Lax; Max-Age=3600; Path=/
```

From JavaScript, you can read and write the non-`HttpOnly` ones through `document.cookie`:

```js
// Set a cookie (JS can only touch cookies without HttpOnly)
document.cookie = "theme=dark; Max-Age=31536000; Path=/";

// Read all accessible cookies - comes back as one semicolon-joined string
console.log(document.cookie); // "theme=dark; other_cookie=value"
```

Notice `document.cookie` gives you one flat string, not a map. Parsing it yourself for every cookie
you need gets tedious fast - one more reason cookies aren't a great fit for anything beyond small
identifiers.

## The attribute that matters most: automatic sending

Every attribute below exists to control that one behavior: which requests get the cookie attached.
Get this part wrong and you've either broken your login flow or opened a hole for an attacker.

**`HttpOnly`** - blocks JavaScript from reading the cookie via `document.cookie`. It's still sent on
requests; your code can't see its value. This is the single most effective defense against
session-token theft via XSS: if an attacker injects a `<script>` into your page, `HttpOnly` means
`document.cookie` won't hand over the session ID no matter what that script does.

**`Secure`** - the browser only sends the cookie over HTTPS. Without it, a cookie set on a secure page
can still leak in plaintext if any request to that domain happens to go out over HTTP (a mixed-content
edge case, a stray `http://` link, a downgrade attack). Always set this in production.

**`SameSite`** - controls whether the cookie is sent on cross-site requests, and it's the main defense
against CSRF (Cross-Site Request Forgery - a malicious site tricking your browser into making a request
to a site you're logged into). Three values:

| Value | Sent on cross-site requests? | Typical use |
|---|---|---|
| `Strict` | Never | Banking, anything where losing the session on external links is fine |
| `Lax` | Only on top-level navigation (clicking a link), not on background requests | Default for most session cookies |
| `None` | Always (requires `Secure`) | Third-party embeds, payment widgets |

A concrete CSRF scenario `SameSite=Lax` blocks: you're logged into `bank.com`. You visit
`evil.com`, which has a hidden form auto-submitting a POST to `bank.com/transfer`. Without
`SameSite`, your browser happily attaches your `bank.com` session cookie to that forged request, and
the bank's server can't tell it apart from a real one. `SameSite=Lax` or `Strict` stops the cookie
from riding along on that background POST.

## Why third-party cookies are going away

A "third-party cookie" is one set by a domain other than the one in your address bar - an ad network
embedded on a hundred different sites, using cookies to recognize the same browser across all of them
and build a cross-site profile. That tracking use case is why browsers (Safari and Firefox already,
Chrome moving the same direction) increasingly block third-party cookies by default. If you're
building anything that depends on cross-site cookie tracking, plan for it to stop working - the
industry is shifting toward first-party data and server-side alternatives instead.

## Quick check

```quiz
[
  {
    "q": "Why does HttpOnly protect against XSS-based session theft?",
    "choices": ["It encrypts the cookie value", "It blocks document.cookie from reading the cookie, even though the cookie still gets sent on requests", "It prevents the cookie from being set at all"],
    "answer": 1,
    "explain": "HttpOnly cookies are invisible to JavaScript but still sent automatically by the browser - the server can use them, but an injected script can't read and exfiltrate them."
  },
  {
    "q": "A malicious site auto-submits a hidden form that POSTs to your bank's transfer endpoint while you're logged in elsewhere. Which attribute stops your session cookie from riding along?",
    "choices": ["Secure", "SameSite=Strict or Lax", "Max-Age"],
    "answer": 1
  },
  {
    "q": "What does the Secure attribute do?",
    "choices": ["Encrypts the cookie's contents", "Restricts the cookie to HTTPS requests only", "Makes the cookie HttpOnly automatically"],
    "answer": 1
  }
]
```

---

[Guide overview](_guide.md) · [Phase 2: localStorage, sessionStorage, and IndexedDB →](02-storage-apis.md)
