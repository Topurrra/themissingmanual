---
title: "JWT, In Depth"
guide: jwt-in-depth
phase: 0
summary: "What a JSON Web Token really is: three base64 parts, a signature you must verify, and the stateless-auth tradeoffs (plus the mistakes that cause breaches)."
tags: [jwt, authentication, tokens, security, web, api]
category: tooling
group: "Auth & Identity"
order: 47
difficulty: intermediate
synonyms: ["json web token", "jwt explained", "how jwt works", "jwt signature verify", "alg none attack", "jwt vs session", "decode jwt", "jwt claims exp iss aud"]
updated: 2026-06-30
---

# JWT, In Depth

You copied a JWT out of a request header, pasted it somewhere, and got back a wall of `eyJ...` that looked encrypted and important. Then someone said "don't put secrets in it" and you got confused, because if it's encrypted, why not? This guide clears that up. A JWT is not encrypted. It's a signed, readable note. Once you see what each of its three parts actually does, the security rules stop being magic words and start being obvious.

## How to read this

Read phase 1 first, slowly. The whole point of a JWT lives in the relationship between the three parts and the one signature, and if that mental model is solid, everything else is detail. Phase 2 is the everyday flow: issuing, sending, and verifying tokens, plus the claims that do the real work. Phase 3 is the part that keeps people employed in incident response: the attacks, the revocation problem, and the rules you break exactly once before you learn them.

## The phases

1. [Phase 1: Three Parts and a Signature](01-three-parts-and-a-signature.md) — what a JWT actually is and why it exists
2. [Phase 2: Issuing, Sending, and Verifying](02-issuing-sending-verifying.md) — how you really use tokens day to day
3. [Phase 3: Where It Breaks](03-where-it-breaks.md) — the attacks, the revocation problem, and production reality

[Phase 1: Three Parts and a Signature](01-three-parts-and-a-signature.md) →
