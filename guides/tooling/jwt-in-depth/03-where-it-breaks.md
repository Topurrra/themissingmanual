---
title: "Where It Breaks"
guide: jwt-in-depth
phase: 3
summary: "What a JSON Web Token really is: three base64 parts, a signature you must verify, and the stateless-auth tradeoffs (plus the mistakes that cause breaches)."
tags: [jwt, authentication, tokens, security, web, api]
difficulty: intermediate
synonyms: ["json web token", "jwt explained", "how jwt works", "jwt signature verify", "alg none attack", "jwt vs session", "decode jwt", "jwt claims exp iss aud"]
updated: 2026-06-30
---

# Where It Breaks

JWTs don't usually fail because the math is weak. They fail because of how they're *used* - a verify step skipped, an algorithm trusted that shouldn't be, a token that lives too long. The good news: the famous breaches all come from a short list of mistakes, and once you've seen them, you won't make them. Let's walk the list.

## Attack one: alg=none

Remember the `alg` field in the header from phase 1? The JWT spec defines a valid value of `"none"`, meaning "this token is unsigned." It exists for niche cases where signing happens at a different layer. It is also a loaded gun pointed at naive verifiers.

The attack: take a real token, change the payload to `"role": "admin"`, set the header's `alg` to `"none"`, and **delete the signature entirely** (the token now ends with a trailing dot and nothing after it).

```text
header:    { "alg": "none", "typ": "JWT" }
payload:   { "sub": "1234", "role": "admin" }
signature: (empty)

token:  eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0Iiwicm9sZSI6ImFkbWluIn0.
                                                                     ^ nothing here
```

*What just happened:* the attacker forged an admin token with no secret at all. If your verifier reads `alg` from the token and obediently does "no signature to check, looks fine!" - it's game over. A library that honors `alg: none` will happily accept this.

**The fix is one line, the same one from phase 2:** pin the algorithm. Tell your verifier exactly which algorithm(s) to accept, so the token's claimed `alg` can't override your decision.

```text
jwt.verify(token, key=SECRET, algorithms=["HS256"])   # "none" is rejected outright
```

*What just happened:* by listing only `HS256`, a token claiming `alg: none` is rejected before its missing signature even matters. Never let the token tell the server how to verify itself.

## Attack two: RS256-to-HS256 key confusion

This one is sneakier and trickier to see. Recall the two algorithm families from phase 1:

- **RS256** is asymmetric: a *private* key signs, a *public* key verifies. The public key is, by design, public - you might publish it openly.
- **HS256** is symmetric: the *same* secret both signs and verifies.

Now picture a verifier that reads `alg` from the token and picks its key accordingly. The attacker takes a token, changes the header's `alg` from `RS256` to `HS256`, and signs the forged payload using the server's **public RSA key as the HMAC secret**.

```text
1. Server expects RS256 (public key verifies, private key signs - attacker lacks private key)
2. Attacker flips header:  alg: RS256  ->  alg: HS256
3. Attacker signs the forged token with HMAC, using the PUBLIC key as the secret
4. Naive server sees alg: HS256, grabs "its key" (the public key), runs HMAC verify
5. It matches - because the attacker signed with that exact value. Forged token accepted.
```

*What just happened:* the attacker turned the public key - which was safe to share when it was only used for RSA verification - into a forging secret, by tricking the server into treating it as an HMAC key. The public key was never supposed to be a signing secret. The algorithm switch made it one.

**The fix, again:** pin the algorithm. If your verifier only accepts `RS256`, a token claiming `HS256` is rejected and this entire attack evaporates. Both of the two most infamous JWT attacks die to the same one habit - never trust the token's own `alg`.

> **The single rule that defeats both attacks:** the verifier decides the algorithm, never the token. Pass an explicit allow-list of algorithms to your verify call, every time. This is also why you should reach for a maintained, well-reviewed JWT library rather than parsing tokens yourself - the good ones force you to specify the algorithm and refuse `none` by default.

## The hard one: revocation

This isn't an attack - it's a structural tradeoff, and it's the price of statelessness from phase 2. A signed token is valid until it expires, full stop. The server doesn't look anything up, so there's no record to flip to "revoked." If a token leaks, or a user logs out, or you fire an employee, that token **keeps working until `exp`.**

Sit with how uncomfortable that is. You clicked "log out," and your token still opens every door for the next however-long. With server-side sessions, logout is instant - you delete the session row. With pure JWTs, you can't, because there's no row.

There's no perfect fix, only a set of mitigations you combine:

- **Short lifetimes.** Make access tokens expire in minutes. A leaked token is dangerous for a small window instead of forever. This is the single most effective lever, and it's why phase 2 leaned on `exp`.
- **Refresh tokens.** Pair a short-lived access token with a long-lived refresh token. The access token does the work and dies fast; the refresh token is used only to mint new access tokens, and *it* can be stored server-side and revoked. You get most of the stateless speed for normal requests, with a revocation point at refresh time.
- **A denylist (blocklist).** Keep a small server-side list of revoked token ids (the `jti` claim) and check it on each request. This works - but notice you've reintroduced a server-side lookup, partly giving back the statelessness you came for. It's a deliberate trade, fine for "revoke on logout" if the list stays small.

```text
Short access token (5 min)  +  long refresh token (days, revocable server-side)
   |                              |
   does every request            used only to get a new access token
   expires fast = small risk     can be torn up to truly log someone out
```

*What just happened:* you stopped trying to revoke the unrevocable access token and instead made it expire so fast that revocation barely matters, with the refresh token as your real off-switch. This pattern is what most production systems land on.

## The everyday mistakes, rapid-fire

The attacks above are dramatic. These are the quiet ones that actually show up in code review:

- **Trusting an unverified token.** Decoding the payload and reading `role` without checking the signature. The whole guide warned about this; it's still the most common bug.
- **A weak HMAC secret.** `HS256` is only as strong as its secret. `"secret"` or `"password123"` can be brute-forced offline once an attacker has any valid token to test against. Use a long, random, high-entropy secret.
- **Leaking the secret.** Hardcoded in the repo, printed in logs, baked into a client bundle. Whoever has the HMAC secret can forge any token. Treat it like the master key it is.
- **No expiration.** A token with no `exp` is a permanent credential. Always set one.
- **Putting secrets in the payload.** Phase 1's first rule, and it keeps happening. The payload is public.
- **Skipping `aud`/`iss` checks.** Accepting any validly-signed token, even one minted for a different service or by a different issuer.

> **In the wild:** when a JWT incident hits the news, the root cause is almost never broken cryptography. It's one of these - an unpinned algorithm, an unverified token, a leaked or guessable secret, or a token that lived too long. The crypto is sound. The usage is where it breaks. Which means the defense is sound too: pin the algorithm, always verify, guard the secret, expire fast.

## Where this leaves you

A JWT is a signed, readable note. Its security rests entirely on (1) verifying the signature, (2) deciding the algorithm yourself, and (3) keeping the signing secret secret. Statelessness is real power and a real cost - you trade easy revocation for not needing a session store, and you buy most of it back with short lifetimes and refresh tokens. None of this is magic now. It's a note, a stamp, and the discipline to check the stamp every single time.

```quiz
[
  {
    "q": "What single practice defeats both the alg=none attack and the RS256-to-HS256 confusion attack?",
    "choices": [
      "Encrypting the payload",
      "Pinning the accepted algorithm(s) in the verifier instead of trusting the token's alg header",
      "Using a longer secret key",
      "Setting a shorter expiration time"
    ],
    "answer": 1,
    "explain": "Both attacks work by making the server trust the token's claimed alg. Passing an explicit algorithm allow-list to the verifier rejects the mismatched/none algorithm before it can do harm."
  },
  {
    "q": "Why is revoking a pure JWT before it expires hard?",
    "choices": [
      "The token is encrypted and can't be modified",
      "It's stateless: the server doesn't store the token, so there's no record to mark as revoked",
      "Browsers cache tokens and ignore revocation",
      "The exp claim cannot be read by the server"
    ],
    "answer": 1,
    "explain": "Statelessness means the server keeps no per-token record. With nothing to flip to 'revoked,' a signed token stays valid until exp unless you add a denylist or use revocable refresh tokens."
  },
  {
    "q": "Which is the most effective single mitigation for the revocation problem?",
    "choices": [
      "Making the HMAC secret longer",
      "Adding more claims to the payload",
      "Short access-token lifetimes paired with revocable refresh tokens",
      "Switching from RS256 to HS256"
    ],
    "answer": 2,
    "explain": "Short-lived access tokens shrink the danger window to minutes, and a server-side-revocable refresh token gives you a real off-switch while keeping normal requests stateless."
  }
]
```

[← Phase 2: Issuing, Sending, and Verifying](02-issuing-sending-verifying.md) | [Overview](_guide.md)
