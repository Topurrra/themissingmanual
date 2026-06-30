---
title: "Production Reality and the Gotchas"
guide: oauth2-and-oidc
phase: 3
summary: "The standard behind 'Log in with Google': OAuth2 grants delegated access, OIDC adds identity on top, and the authorization-code-with-PKCE flow ties it together."
tags: [oauth, oidc, auth, tokens, security, identity]
difficulty: intermediate
synonyms: ["log in with google", "oauth2 flow", "openid connect", "authorization code flow", "pkce", "access token vs refresh token", "id token", "social login", "delegated access"]
updated: 2026-06-30
---

# Production Reality and the Gotchas

The flow works in the demo. Now it has to survive real users, real attackers, and the 3am page. This phase is the stuff the spec mentions in passing and the tutorials skip - the parts that decide whether your auth is solid or a breach waiting to happen.

## Where do you put the tokens?

The first real decision is storage, and it trips up a lot of single-page apps. The question is: after login, where do the tokens live?

```text
localStorage          → readable by ANY JavaScript on the page.
                        One XSS bug = every token stolen. Avoid for tokens.

JS-readable memory    → gone on refresh; XSS during the session can still read it.

httpOnly cookie       → set by the server, invisible to JavaScript.
                        XSS can't read it. Needs CSRF protection (SameSite).

Back-end session      → tokens never reach the browser at all.
                        Browser holds only a session cookie. Safest.
```

*What just happened:* The safer you go down that list, the less an XSS bug can steal. The pattern that ages best is the **Backend-for-Frontend (BFF)**: your server completes the OAuth flow, keeps the access and refresh tokens server-side, and gives the browser only an `httpOnly`, `Secure`, `SameSite` session cookie. The tokens never touch JavaScript, so a script-injection bug can't exfiltrate them.

If tokens *must* live in the browser (a pure SPA with no back end), keep them in memory, never in `localStorage`, and lean on short access-token lifetimes plus PKCE. But given the choice, push token handling to a back end.

> **Cookies still need TLS.** Everything here assumes the whole flow runs over HTTPS. Authorization codes, tokens, and session cookies are bearer secrets - anyone who reads them in transit owns the session. Mark cookies `Secure` and serve over TLS end to end. If TLS itself is fuzzy, read [/guides/https-and-tls](/guides/https-and-tls).

## The gotchas that actually leak accounts

These are the recurring mistakes. Each one has caused real breaches.

**1. Not validating the ID token.** Reading the JWT claims without checking the signature, `iss`, `aud`, and `exp` means accepting forged identities. A signed token you don't verify is decoration.

**2. Open redirect via `redirect_uri`.** The Authorization Server must match `redirect_uri` against a **pre-registered exact value**, not a prefix or wildcard. A loose match lets an attacker redirect the code to their own server.

```text
Registered:  https://yourapp.com/callback
Attacker tries:
  https://yourapp.com.evil.com/callback     ← different host, must be rejected
  https://yourapp.com/callback/../steal     ← path trick, must be rejected
```

*What just happened:* Exact-match registration is what keeps the authorization code flowing only to *you*. Most providers enforce this; the gotcha is registering a sloppy URI (or a wildcard) on your side and opening the hole yourself.

**3. Forgetting `state`.** Skip the CSRF check from Phase 2 and an attacker can stitch their account onto your user's session. Generate `state` randomly, store it, and reject any callback where it doesn't match.

**4. Using the access token to identify the user.** Said in Phase 2, repeated because it keeps happening: the access token is for the *API*, the ID token is for *identity*. Treating an access token as proof of who someone is - especially one minted for a different app - is a known account-takeover vector.

**5. Mismatched `aud`.** A token issued for *another* client is still a valid, correctly-signed token. If you don't check that `aud` equals *your* `client_id`, you'll accept tokens minted for someone else. This is the "confused deputy" trap.

## Expiry, revocation, and logout

Tokens expire, and "logout" is messier than it looks.

- **Access tokens expire fast** (often around an hour). That's a feature - a leaked one dies quickly. Your back end refreshes silently using the refresh token.
- **Refresh tokens can be revoked.** When a user clicks "remove this app" or you detect compromise, revoke the refresh token at the Authorization Server. Better providers also do **refresh-token rotation**: each use issues a new refresh token and invalidates the old one, so a stolen-and-reused token gets caught.
- **Logout has layers.** Clearing your own session cookie logs the user out of *your* app. It does **not** log them out of Google. OIDC defines separate end-session / front-channel logout mechanisms for that - know that "log out" usually means only your session unless you wire up the rest.

```text
User clicks "Log out":
  1. Destroy your back-end session  ← logs out of YOUR app  (the common case)
  2. (optional) Revoke refresh token at the Authorization Server
  3. (optional) Redirect to provider end-session endpoint  ← logs out of the IdP
```

*What just happened:* Step 1 is what most apps mean by logout. Steps 2 and 3 are deliberate extra work; if you assume a single "logout" nukes everything, you'll be surprised when the user is still signed into the provider.

## Why you never roll your own

You might be tempted to hand-build the token endpoints, the JWT verification, the PKCE math. Don't. Not because you can't - because the failure mode is silent.

A bug in your business logic throws an error someone notices. A bug in your auth - a skipped `aud` check, a timing leak in signature comparison, a wildcard redirect - produces software that *works perfectly in every demo* and quietly grants account takeover. There's no failing test, no error in the logs, until it's a disclosure email.

The lazy move here is also the correct one:

- **Use a battle-tested library** for the client side (the well-known certified OIDC/OAuth client for your language and framework). It handles PKCE, state, and JWT validation correctly so you don't reinvent the subtle parts.
- **Use an established Authorization Server / IdP** rather than writing one - a hosted provider or a mature self-hostable identity server. Issuing tokens correctly (key rotation, consent, revocation, rate limits) is a product, not a weekend.

You still need to understand the flow - that's why this guide exists - so you can configure it correctly, read the network tab when it breaks, and catch a misconfigured `redirect_uri`. But the cryptographic and protocol plumbing is solved. Reach for the proven implementation.

## In the wild

When you wire up "Log in with Google" through a mature library, almost everything in this guide happens for you: the library builds the `/authorize` URL with PKCE and `state`, handles the callback, exchanges the code, and validates the ID token's signature and claims. Your job shrinks to three things - register an exact `redirect_uri`, request least-privilege scopes, and keep the refresh token on a trusted back end. Get those three right and you've used the standard the way it was meant to be used.

```quiz
[
  {
    "q": "What is the safest place to keep OAuth tokens for a web app?",
    "choices": [
      "In localStorage so they survive page refreshes",
      "On a trusted back end, with the browser holding only an httpOnly session cookie",
      "In a JavaScript variable shared across all scripts",
      "In a regular cookie readable by JavaScript"
    ],
    "answer": 1,
    "explain": "The Backend-for-Frontend pattern keeps tokens server-side so an XSS bug can't read them; the browser only gets an httpOnly, Secure, SameSite session cookie."
  },
  {
    "q": "Why must the Authorization Server match redirect_uri against a pre-registered exact value?",
    "choices": [
      "To make the URL shorter",
      "To let the user bookmark the callback",
      "A loose or wildcard match lets an attacker redirect the authorization code to their own server",
      "Exact matching makes the token larger and harder to forge"
    ],
    "answer": 2,
    "explain": "Exact-match registration ensures the code only ever lands at your real callback. A wildcard or prefix match opens an account-takeover hole."
  },
  {
    "q": "What's the strongest argument against hand-rolling your own OAuth/OIDC implementation?",
    "choices": [
      "Libraries are always faster to run",
      "Auth bugs fail silently - they work in every demo while granting account takeover",
      "It's against the OAuth2 specification to write your own",
      "Modern languages can't do the required cryptography"
    ],
    "answer": 1,
    "explain": "A skipped aud check or wildcard redirect produces software that passes every demo and quietly enables takeover, with no error until a breach. Use battle-tested libraries and IdPs."
  }
]
```

[← Phase 2: The Authorization Code Flow and the Three Tokens](02-the-flow-and-the-tokens.md) | [Overview](_guide.md)
