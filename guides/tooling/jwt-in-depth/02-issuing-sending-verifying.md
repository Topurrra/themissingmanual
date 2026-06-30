---
title: "Issuing, Sending, and Verifying"
guide: jwt-in-depth
phase: 2
summary: "What a JSON Web Token really is: three base64 parts, a signature you must verify, and the stateless-auth tradeoffs (plus the mistakes that cause breaches)."
tags: [jwt, authentication, tokens, security, web, api]
difficulty: intermediate
synonyms: ["json web token", "jwt explained", "how jwt works", "jwt signature verify", "alg none attack", "jwt vs session", "decode jwt", "jwt claims exp iss aud"]
updated: 2026-06-30
---

# Issuing, Sending, and Verifying

You've got the mental model: a signed note you carry. Now we walk the note through its life. A token gets born at login, rides along on every request, and gets checked on arrival. Three moments. Each has a job, and each has one place people get it wrong.

## The round trip, end to end

Here's the whole flow in one picture before we zoom into the pieces:

```mermaid
sequenceDiagram
    participant U as Browser
    participant S as Server
    U->>S: POST /login (username + password)
    S->>S: check password, build claims, SIGN token
    S-->>U: returns JWT
    U->>S: GET /orders (Authorization: Bearer <jwt>)
    S->>S: VERIFY signature, check exp/iss/aud
    S-->>U: 200 + data (or 401 if verify fails)
```

*What just happened:* login produces a signed token once; every later request carries it and the server verifies it every time. The expensive part (checking a password) happens once. The cheap part (verifying a signature) happens on every request. That asymmetry is the point of tokens.

## Moment one: issuing

The user proves who they are the slow, careful way — a password (stored hashed, never plaintext; see [/guides/how-passwords-are-stored](/guides/how-passwords-are-stored)). Once that checks out, the server builds the claims and signs them.

```text
POST /login
{ "username": "sam", "password": "hunter2" }

--- server: password verified, now build + sign the token ---

header  = { "alg": "HS256", "typ": "JWT" }
payload = {
  "sub":  "1234",
  "name": "Sam",
  "role": "editor",
  "iss":  "auth.myapp.com",
  "aud":  "api.myapp.com",
  "iat":  1719759600,
  "exp":  1719763200
}
signature = HMAC-SHA256( base64url(header) + "." + base64url(payload), SECRET )
```

*What just happened:* the server packaged Sam's identity and permissions into claims and stamped them. The result is the `eyJ...` string handed back to the browser. Note what's *not* in there: no password, no anything secret. Only facts that are safe to be public-but-tamper-proof.

### The standard claims worth knowing

Most claims are short, three-letter names. They're abbreviated on purpose (tokens travel on every request, so smaller is better). The ones you'll use constantly:

| Claim | Name | What it means |
|-------|------|---------------|
| `sub` | subject | who the token is about — the user id |
| `iss` | issuer | who minted the token (`auth.myapp.com`) |
| `aud` | audience | who the token is *for* (`api.myapp.com`) |
| `exp` | expiration | Unix time after which the token is dead |
| `iat` | issued at | Unix time the token was created |
| `nbf` | not before | Unix time before which it's not yet valid |

`exp`, `iss`, and `aud` are the three that earn their keep:

- **`exp`** is your seatbelt. A token is a bearer credential — whoever holds it *is* you, no questions asked. So you want it to die quickly. Short lifetimes (minutes, not weeks) limit the blast radius if one leaks. More on this tension in phase 3.
- **`iss`** lets a verifier reject tokens from the wrong source.
- **`aud`** stops a token meant for one service from being replayed against another. A token your billing API issued shouldn't unlock your admin API.

> Adding your own claims (like `role` or `tenant_id`) is normal and useful — that's how you avoid a database lookup on every request. The rule from phase 1 still holds: nothing secret. A `role` is fine; a credit card number is not.

## Moment two: sending

The browser holds the token and attaches it to every request that needs auth. The convention is the `Authorization` header with the `Bearer` scheme:

```text
GET /orders HTTP/1.1
Host: api.myapp.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI...
```

*What just happened:* "Bearer" literally means "the bearer of this token is authorized." That word is a warning label: anyone who gets the token gets your access. Treat it like cash. Send it only over HTTPS, never log it, and store it somewhere a stray script can't scrape it. (Where exactly to store it — cookie versus JS-readable storage — is a real debate with real tradeoffs; the short version is that a cookie with the right flags resists token theft better than putting it where page scripts can read it.)

## Moment three: verifying

This is the moment that matters most, and the one people skip when they're moving fast. On every protected request, the server must **verify** the token before trusting a single byte of it.

Verification is not "decode the payload and read the role." Decoding is free and meaningless — an attacker can hand you any payload they like. Verification is the full check:

```text
1. Split into header.payload.signature
2. Read alg from header — but VERIFY against the algorithm YOU expect, not what the token claims
3. Recompute the signature over header.payload using YOUR key
4. Constant-time compare: does it match the attached signature?   -> if no, REJECT
5. Check exp:  is it past?         -> if expired, REJECT
6. Check iss:  is it who we trust? -> if not, REJECT
7. Check aud:  is it for us?       -> if not, REJECT
8. Only now: trust the claims (sub, role, ...)
```

*What just happened:* the signature check proves the token is genuine; the claim checks prove it's still valid and meant for you. Skip step 4 and any forged token passes. Skip step 5 and a stolen token works forever. Every step is load-bearing.

In real code you never hand-roll this — you use a vetted library and let it do all eight steps. The shape, in pseudocode:

```text
try:
    claims = jwt.verify(
        token,
        key = SECRET,
        algorithms = ["HS256"],     # <-- pin it. critical. see phase 3.
        issuer   = "auth.myapp.com",
        audience = "api.myapp.com",
    )
    # claims now trustworthy: claims["sub"], claims["role"], ...
except InvalidSignature, ExpiredToken, InvalidAudience:
    return 401 Unauthorized
```

*What just happened:* one call did the signature recompute, the comparison, and the `exp`/`iss`/`aud` checks, and threw if anything failed. The single most important argument there is `algorithms = ["HS256"]` — you are telling the library which algorithm to accept, instead of trusting the token's own header. Phase 3 shows the breach that happens when you forget it.

> **For builders:** the line that separates "I decoded a JWT" from "I verified a JWT" is the secret key and the algorithm pin. If your verify call doesn't take a key, you didn't verify anything — you merely parsed attacker-controlled JSON. Libraries sometimes offer a `decode` that skips verification for debugging; never let that path touch a real request.

## Why bother with all this? The stateless payoff

After all these steps, here's the reward: the server verified Sam, learned his id, name, and role, and decided what he's allowed to do — **without touching a database or session store.** The token carried everything. That's stateless auth.

That's genuinely powerful at scale. Ten API servers behind a load balancer don't need a shared session store or sticky sessions; each one can verify a token on its own with only the key. Add a server, it works immediately. There's no "where do sessions live" problem.

But — and phase 3 is built around this — statelessness has a sharp edge. If the server doesn't look anything up, the server can't easily *un*-trust a token mid-life. You handed out a signed note that says "valid until 3:00"; you can't reach into the user's pocket and tear it up. That's the revocation problem, and it's where the next phase begins.

```quiz
[
  {
    "q": "Which step turns 'decoding' a JWT into actually 'verifying' it?",
    "choices": [
      "Base64-decoding the payload to read the claims",
      "Recomputing the signature with your key and comparing it to the attached one",
      "Pretty-printing the JSON",
      "Checking that the token has two dots in it"
    ],
    "answer": 1,
    "explain": "Decoding is free and proves nothing. Verification recomputes the signature using your secret/key and rejects the token if it doesn't match — that's what catches forgeries."
  },
  {
    "q": "What is the `aud` (audience) claim for?",
    "choices": [
      "It stores the user's role and permissions",
      "It records when the token was issued",
      "It names which service the token is for, so a token can't be replayed against a different service",
      "It is the secret used to sign the token"
    ],
    "answer": 2,
    "explain": "`aud` declares the intended recipient. A verifier checks it so a token minted for one API can't be reused against another."
  },
  {
    "q": "What is the main payoff of stateless JWT auth?",
    "choices": [
      "Tokens can never be stolen",
      "The server verifies identity from the token alone, with no session store or database lookup",
      "Tokens are encrypted end to end",
      "Revoking a token is instant and easy"
    ],
    "answer": 1,
    "explain": "Statelessness means each server verifies a token using only the key — no shared session store. The cost is that revocation becomes hard, which phase 3 covers."
  }
]
```

[← Phase 1: Three Parts and a Signature](01-three-parts-and-a-signature.md) | [Overview](_guide.md) | [Phase 3: Where It Breaks →](03-where-it-breaks.md)
