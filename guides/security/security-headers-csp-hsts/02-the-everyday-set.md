---
title: "The Everyday Hardening Set"
guide: "security-headers-csp-hsts"
phase: 2
summary: "The headers you set on nearly every site — HSTS, X-Content-Type-Options, frame defenses, Referrer-Policy, and the cookie flags — each explained by the exact attack it stops."
tags: [security, hsts, clickjacking, x-frame-options, frame-ancestors, cookies, samesite, referrer-policy, intermediate]
difficulty: intermediate
synonyms: ["what does hsts do", "stop downgrade attack header", "prevent clickjacking x-frame-options", "frame-ancestors vs x-frame-options", "httponly secure samesite cookie flags", "x-content-type-options nosniff", "referrer-policy explained", "mime sniffing attack"]
updated: 2026-06-30
---

# The Everyday Hardening Set

This is the set you reach for on almost every site — the headers that aren't dramatic to configure but each shut a specific door. We'll go one at a time, and for every one the format is the same: the attack it stops, then the line you set. No magic blocks. By the end you'll be able to look at any of these in a response and know exactly what it's defending against and why it's there.

## HSTS: force HTTPS, stop the downgrade

You redirect HTTP to HTTPS, so you might think you're done. You're not. The danger lives in that *very first* request, before the redirect happens.

Picture a user on coffee-shop Wi-Fi typing `example.com`. The browser's first guess is `http://example.com`. That plaintext request crosses the network, and an attacker on the same Wi-Fi intercepts it before your redirect ever runs — a **downgrade** (or SSL-stripping) attack. They keep the user on `http` and quietly read everything.

`Strict-Transport-Security` (HSTS) closes that window. It tells the browser: *"for the next N seconds, never even attempt HTTP for this site — go straight to HTTPS, no plaintext request at all."*

```text
strict-transport-security: max-age=31536000; includeSubDomains; preload
```
*What just happened:* `max-age=31536000` is one year in seconds — the browser remembers this rule for a year. `includeSubDomains` extends it to every subdomain. `preload` is your opt-in to a list browsers ship *built in*, so the protection applies on the very first visit, before the user has ever seen your site. After the first successful HTTPS visit, the browser refuses to talk HTTP to you, and the downgrade attack has nothing to grab.

⚠️ **HSTS is a commitment, not a toggle.** Once a browser has seen `max-age=31536000`, it will refuse plaintext HTTP to your domain for a year — you cannot take that back by removing the header. If your TLS certificate lapses or a subdomain genuinely needs HTTP, users are locked out with no override. Start with a small `max-age` (a few minutes), confirm everything works on HTTPS, then ramp up. Only add `preload` once you're certain — getting *off* the preload list is slow.

For the transport mechanics underneath all of this, see [HTTPS & TLS](/guides/https-and-tls). HSTS is the header that makes that encryption non-optional.

## X-Content-Type-Options: stop MIME sniffing

Browsers used to be "helpful": if a server labeled a file `text/plain` but the bytes looked like HTML or JavaScript, the browser would second-guess the label and run it as code. That "helpfulness" is an attack vector. If your site lets users upload a file and you serve it back, an attacker can upload something you *think* is a harmless text file but the browser decides to execute.

```text
x-content-type-options: nosniff
```
*What just happened:* `nosniff` tells the browser to *trust the `Content-Type` you sent* and never guess. A file labeled `text/plain` is treated as plain text, full stop — even if its contents look like a script. One value, one line, no downside. Set it everywhere.

## X-Frame-Options and frame-ancestors: stop clickjacking

**Clickjacking** is sneaky: an attacker loads your real site inside an invisible `<iframe>` on *their* page, then lays their own buttons over the top. The user thinks they're clicking "Watch video" on the attacker's page — but their click lands on your "Delete account" or "Transfer money" button underneath. Your site rendered perfectly; the user was tricked into clicking it.

The defense is to forbid your pages from being framed by other sites. There are two headers for this, old and new:

```text
x-frame-options: DENY
content-security-policy: frame-ancestors 'none'
```
*What just happened:* `X-Frame-Options: DENY` is the older header — it says *"never let any site put me in a frame."* The CSP directive `frame-ancestors 'none'` is the modern equivalent and it's more flexible: you can write `frame-ancestors 'self'` to allow your own pages to frame each other, or list specific trusted origins. When both are present, browsers honor `frame-ancestors`, so it's the one that matters going forward — but `X-Frame-Options` is harmless to keep for older clients.

💡 **`frame-ancestors` lives inside Content-Security-Policy**, the big header we cover in Phase 3. You can set it on its own today as a standalone CSP, and it's one of the safest CSP directives to start with — it rarely breaks anything.

## Referrer-Policy: stop leaking URLs

When a user clicks a link from your site to another, the browser tells the destination where they came from — the `Referer` header. If your URLs contain anything sensitive — a password-reset token, a session id, an internal path — you've handed it to whatever site they clicked through to.

```text
referrer-policy: strict-origin-when-cross-origin
```
*What just happened:* this policy sends the *full* URL only when staying on your own origin, sends just the **origin** (scheme + host, no path or query) when crossing to another HTTPS site, and sends **nothing** when downgrading to HTTP. The sensitive part of the URL — the path and query string — never leaves your site. This is also the modern browser default, but setting it explicitly means you're not relying on a default that could change.

## Cookie flags: protect the session

Cookies aren't a header you set once globally — each flag rides along on the `Set-Cookie` for *each* cookie. But they belong here because the session cookie is the crown jewel: steal it, and an attacker *is* the user. Three flags guard it.

```text
set-cookie: session=abc123; HttpOnly; Secure; SameSite=Lax
```
*What just happened:* three separate protections on one cookie:

- **`HttpOnly`** — JavaScript cannot read this cookie via `document.cookie`. This is the direct counter to XSS stealing your session: even if an attacker runs a script on your page, the session cookie is invisible to it.
- **`Secure`** — the browser only sends this cookie over HTTPS, never plaintext HTTP. Pairs with HSTS to keep the session off the wire in the clear.
- **`SameSite=Lax`** — the browser won't attach this cookie to most cross-site requests (like a form auto-submitted from a malicious page), which blunts **CSRF** (cross-site request forgery). `Lax` still sends the cookie on top-level navigations so normal links from other sites keep working; `Strict` is tighter but can log users out when they arrive via an external link.

⚠️ **Set all three on every session/auth cookie.** Missing `HttpOnly` turns any XSS bug into a session theft. Missing `Secure` lets the cookie leak over HTTP. Missing `SameSite` leaves the door open for CSRF. These three are non-negotiable on anything that authenticates a user.

**For builders:** put HSTS, `nosniff`, `frame-ancestors`, and `Referrer-Policy` in one shared middleware or proxy block so every response gets them automatically. Cookie flags are the exception — set them where you create the cookie, and audit your auth code specifically to confirm all three are present.

## Recap

| Header | Attack it stops |
|---|---|
| `Strict-Transport-Security` | Downgrade / SSL-stripping — forces HTTPS, even the first request |
| `X-Content-Type-Options: nosniff` | MIME sniffing — browser runs a mislabeled file as code |
| `X-Frame-Options` / `frame-ancestors` | Clickjacking — your site framed invisibly under fake buttons |
| `Referrer-Policy` | URL leakage — sensitive paths/tokens handed to other sites |
| Cookie `HttpOnly` / `Secure` / `SameSite` | Session theft via XSS, plaintext leak, and CSRF |

```quiz
[
  {
    "q": "Why isn't an HTTP→HTTPS redirect enough on its own, and what does HSTS add?",
    "choices": ["Redirects are slow; HSTS caches the page", "The first plaintext request can be intercepted before the redirect runs; HSTS makes the browser skip HTTP entirely", "HSTS encrypts the cookies", "Redirects only work on mobile; HSTS covers desktop"],
    "answer": 1,
    "explain": "The vulnerable moment is the initial http request. HSTS tells the browser never to attempt HTTP for the domain, closing that window."
  },
  {
    "q": "Which cookie flag specifically stops a successful XSS attack from reading the session cookie?",
    "choices": ["Secure", "SameSite=Lax", "HttpOnly", "Path=/"],
    "answer": 2,
    "explain": "HttpOnly hides the cookie from document.cookie, so JavaScript injected via XSS can't read it. Secure and SameSite address different threats."
  },
  {
    "q": "An attacker loads your real site in an invisible iframe and overlays fake buttons so users click your real ones. What is this, and which directive stops it?",
    "choices": ["MIME sniffing — stopped by nosniff", "Clickjacking — stopped by frame-ancestors / X-Frame-Options", "CSRF — stopped by Referrer-Policy", "Downgrade — stopped by HSTS"],
    "answer": 1,
    "explain": "That's clickjacking. Forbidding framing with frame-ancestors (or X-Frame-Options) stops your pages from being embedded by other sites."
  }
]
```

[← Phase 1: Headers Are a Fence, Not a Lock](01-headers-are-a-fence.md) · [Guide overview](_guide.md) · [Phase 3: Rolling Out CSP Without Breaking the Site →](03-rolling-out-csp.md)
