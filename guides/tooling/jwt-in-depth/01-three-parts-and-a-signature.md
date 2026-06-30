---
title: "Three Parts and a Signature"
guide: jwt-in-depth
phase: 1
summary: "What a JSON Web Token really is: three base64 parts, a signature you must verify, and the stateless-auth tradeoffs (plus the mistakes that cause breaches)."
tags: [jwt, authentication, tokens, security, web, api]
difficulty: intermediate
synonyms: ["json web token", "jwt explained", "how jwt works", "jwt signature verify", "alg none attack", "jwt vs session", "decode jwt", "jwt claims exp iss aud"]
updated: 2026-06-30
---

# Three Parts and a Signature

The first time you really look at a JWT, it's intimidating in a specific way: it's long, it's full of random-looking characters, and it shows up in places that feel important, like the `Authorization` header of every request after you log in. So your brain files it under "encrypted secret thing, handle with care."

That instinct is half right. It is a thing you handle with care. But it is not encrypted, and that one fact reorganizes everything. A JWT is a **signed note**, not a sealed envelope. Anyone can read it. The care you take is not about hiding what's inside — it's about trusting that nobody changed it.

## What a token even is, before we get to JWT

Step back to the problem JWTs solve. HTTP is stateless: the server forgets you the instant your request finishes. So after you log in, every single later request has to re-prove "I'm the same person who logged in a minute ago." A token is the proof you carry. You log in once, the server hands you a token, and you attach it to every request after that. The server reads the token and goes "ah, this is Sam, logged in, here's your data."

The old way to do this was a **session**: the server stores a record ("session abc123 = user Sam"), hands you a meaningless ID, and looks you up in its store on every request. A JWT flips that. Instead of a pointer to a record on the server, the JWT *is* the record. Your identity travels with you, inside the token. The server doesn't look anything up — it reads the token and trusts it. That's the whole pitch: **stateless** auth. We'll come back to what that buys you and what it costs.

> If "who you are" (authentication) versus "what you're allowed to do" (authorization) feels blurry, the [/guides/auth-vs-authz](/guides/auth-vs-authz) guide untangles them. A JWT mostly answers "who you are," and sometimes carries hints about "what you can do."

## The three parts

A JWT is one long string with two dots in it. Those dots split it into three parts:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0Iiwibm
FtZSI6IlNhbSIsImV4cCI6MTcxOTc2MzIwMH0.dBjftJeZ4CVP-mB92K27uh
bUJU1p1r_wW1gFWFOEjXk
   └─────── header ───────┘ └────── payload ──────┘ └── signature ──┘
```

*What just happened:* one string, two dots, three parts — `header.payload.signature`. Every JWT on earth has exactly this shape. The first two parts are data; the third is the proof that the first two haven't been tampered with.

Each part is **base64url-encoded**. Base64url is not encryption — it's a way to write bytes using only URL-safe characters so the token survives being shoved into headers and URLs. Decoding it takes no key and no secret. That's why the header and payload are readable by anyone who has the token, including the user holding it.

Decode the first part and you get the **header** — metadata about the token itself:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

*What just happened:* the header says "I'm a JWT, and I was signed with the HS256 algorithm." That `alg` field is small and looks boring. Remember it. In phase 3 it's the star of the two most famous JWT attacks.

Decode the second part and you get the **payload** — the actual claims, the statements the token is making about you:

```json
{
  "sub": "1234",
  "name": "Sam",
  "role": "editor",
  "exp": 1719763200
}
```

*What just happened:* the payload claims "this token is about user 1234, named Sam, who is an editor, and it expires at this Unix timestamp." These are called **claims**. Phase 2 goes deep on the standard ones (`exp`, `iss`, `aud` and friends).

Now sit with this: **you can read that payload with no key at all.** Paste any JWT into a base64 decoder and the user's id, name, and role are right there in plain text.

```bash
# split on the dots, grab the middle part, base64-decode it
echo 'eyJzdWIiOiIxMjM0Iiwibm...' | base64 -d
# => {"sub":"1234","name":"Sam","role":"editor","exp":1719763200}
```

*What just happened:* no secret, no permission, no decryption — the payload fell right out. This is the single most important thing to internalize. **A JWT hides nothing.** Which leads straight to the first rule you'll ever hear about them.

> **Never put a secret in a JWT payload.** No passwords, no API keys, no private personal data you wouldn't print on the user's forehead. The payload is public to anyone holding the token. It's signed, not sealed. (If you genuinely need the contents hidden, there's an encrypted variant called JWE — but plain JWTs, the kind everyone means by "JWT," are readable.)

## So what is the signature actually for?

If anyone can read the payload, and the user holds their own token, what stops them from editing `"role": "editor"` to `"role": "admin"` and handing themselves the keys to the kingdom?

The **signature**. The third part.

When the server creates the token, it takes the header and payload, and runs them through a signing function along with a **secret key that only the server knows**. The output is the signature. Here's the relationship in plain terms:

```text
signature = sign( base64url(header) + "." + base64url(payload),  SECRET )
```

*What just happened:* the signature is a fingerprint of the exact header and payload, computed using a secret only the server has. Change even one character of the payload and the fingerprint no longer matches.

So when the attacker flips `editor` to `admin`, the payload changes, but they **can't recompute a matching signature** — they don't have the secret. The server, on receiving the token, re-runs the same signing function on the header and payload it received, and checks whether the result equals the signature attached. If it doesn't match, the token is forged, and it's rejected.

```text
1. attacker edits payload:  role: editor  ->  role: admin
2. attacker sends token with the OLD signature (can't make a new one)
3. server recomputes signature over the NEW payload
4. recomputed signature != attached signature
5. server rejects: tampered token
```

*What just happened:* tampering is detected because the attacker can change the data but can't change the proof to match. The secret is the entire foundation. This is why the signature is everything, and why phase 2's core lesson is: **always verify it.** A JWT you read but didn't verify is a string an attacker handed you.

## Signed by a shared secret, or a key pair

Two families of signing algorithms show up constantly, and the difference matters for who can verify your tokens:

- **HMAC (HS256, HS384, HS512)** — one shared secret. The same secret both signs and verifies. Fast and simple. The catch: everyone who can verify can also sign, because it's the same key. Fine when one service issues *and* checks its own tokens.
- **RSA / ECDSA (RS256, ES256, and similar)** — a key *pair*. A **private** key signs; a **public** key verifies. The issuer keeps the private key locked away; anyone can hold the public key and verify tokens without being able to forge new ones. This is what you want when one service (an identity provider) issues tokens that many other services need to trust.

```text
HMAC:   [secret]  signs  ---  [same secret]  verifies     (symmetric)
RSA:    [private] signs  ---  [public]        verifies     (asymmetric)
```

*What just happened:* HMAC uses one key for both jobs; RSA splits signing and verifying across a key pair. Keep this picture handy — the gap between "the key that signs" and "the key that verifies" is exactly the seam the `alg`-confusion attack pries open in phase 3.

## The mental model, in one breath

A JWT is a **note the server wrote about you, stamped with a signature only the server can produce.** You carry the note. Anyone can read it. Nobody can change it without breaking the stamp. The server trusts the note because it trusts its own stamp — not because it looked anything up. Hold that, and the rest of this guide is detail.

```quiz
[
  {
    "q": "Is the payload of a standard JWT encrypted?",
    "choices": [
      "Yes, you need the secret key to read it",
      "No, it is only base64url-encoded and anyone with the token can read it",
      "Yes, but only the user can decrypt their own token",
      "Only the header is encrypted, not the payload"
    ],
    "answer": 1,
    "explain": "Base64url is encoding, not encryption. A standard JWT's payload is readable by anyone holding the token, which is why you never put secrets in it."
  },
  {
    "q": "What stops a user from editing their own JWT payload to give themselves admin rights?",
    "choices": [
      "The payload is encrypted so they cannot read or change it",
      "The signature: changing the payload breaks it, and they lack the secret to recompute a valid one",
      "The browser refuses to send a modified token",
      "Nothing — JWTs are inherently insecure"
    ],
    "answer": 1,
    "explain": "The signature is a keyed fingerprint of the header and payload. Tamper with the payload and it no longer matches, and the attacker can't forge a new signature without the secret."
  },
  {
    "q": "With an RSA-signed JWT (RS256), which key verifies the token?",
    "choices": [
      "The same secret used to sign it",
      "The private key",
      "The public key, which can verify but not forge tokens",
      "No key is needed to verify"
    ],
    "answer": 2,
    "explain": "RSA is asymmetric: the private key signs and the public key verifies. The public key can be shared freely because it cannot produce new valid signatures."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Issuing, Sending, and Verifying →](02-issuing-sending-verifying.md)
