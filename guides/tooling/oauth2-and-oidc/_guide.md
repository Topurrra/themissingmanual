---
title: "OAuth2 and OpenID Connect"
guide: oauth2-and-oidc
phase: 0
summary: "The standard behind 'Log in with Google': OAuth2 grants delegated access, OIDC adds identity on top, and the authorization-code-with-PKCE flow ties it together."
tags: [oauth, oidc, auth, tokens, security, identity]
category: tooling
group: "Auth & Identity"
order: 46
difficulty: intermediate
synonyms: ["log in with google", "oauth2 flow", "openid connect", "authorization code flow", "pkce", "access token vs refresh token", "id token", "social login", "delegated access"]
updated: 2026-06-30
---

# OAuth2 and OpenID Connect

You clicked "Log in with Google" a thousand times and never thought about it. Now you have to build it, and the spec reads like a tax form: grants, scopes, redirect URIs, three kinds of token that all look like the same blob of base64. The fear underneath is real, because the cost of getting auth wrong is an account takeover, not a styling bug.

Here is the relief. OAuth2 is one idea wearing a lot of jargon: let an app act on your behalf without handing it your password. OIDC is one small addition on top: prove who you are while you're at it. Once you see the four roles and the one flow that matters in 2026, the spec stops being a wall and becomes a checklist.

## How to read this

Go in order. Phase 1 builds the mental model: the problem these protocols solve and the four roles passing tokens around. Phase 2 walks the authorization-code-with-PKCE flow step by step and pulls apart the three token types. Phase 3 is production reality: token storage, the gotchas that leak accounts, and why "roll your own" is the line you do not cross.

This is a concepts-and-protocol guide. There is no single CLI to install; the examples are HTTP requests and token payloads, which is what you will actually be staring at in your network tab.

## The phases

1. [Phase 1: The Problem and the Four Roles](01-the-problem-and-the-roles.md) — why delegated access exists, and who plays what part.
2. [Phase 2: The Authorization Code Flow and the Three Tokens](02-the-flow-and-the-tokens.md) — the dance, PKCE, scopes, and access vs refresh vs ID tokens.
3. [Phase 3: Production Reality and the Gotchas](03-production-reality-and-gotchas.md) — storing tokens, the mistakes that leak accounts, and why you never roll your own.

[Phase 1: The Problem and the Four Roles](01-the-problem-and-the-roles.md) →
