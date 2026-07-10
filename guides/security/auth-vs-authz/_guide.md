---
title: "Auth vs Authz (Sessions, JWT, OAuth)"
guide: "auth-vs-authz"
phase: 0
summary: "Authentication is proving who you are; authorization is what you're allowed to do - and after login, the server keeps you logged in with either a server-side session or a stateless token like a JWT. This guide untangles all of it, plus OAuth and 'Sign in with Google'."
tags: [auth, authentication, authorization, sessions, jwt, oauth, openid-connect, security]
category: security
order: 4
difficulty: intermediate
synonyms: ["difference between authentication and authorization", "authn vs authz", "what is a session vs a token", "what is a jwt", "how does sign in with google work", "what is oauth", "is a jwt encrypted", "session cookie vs jwt", "how does login stay logged in"]
updated: 2026-07-10
---

# Auth vs Authz (Sessions, JWT, OAuth)

You've wired up a login form, copy-pasted a JWT library, clicked "Sign in with Google" a thousand times - and yet asked to explain the difference between *authentication* and *authorization*, or whether a JWT is encrypted, you'd hedge. That's not a you-problem: the words look almost identical (*authn*, *authz*), and most tutorials hand you working code without showing the moving parts underneath.

This guide fixes that. By the end you'll have a clean mental model for each piece and be able to *reason* about an auth system instead of guessing.

## How to read this

- **Need one specific answer right now?** Jump to the phase that matches: identity vs permissions is [Phase 1](01-authentication-vs-authorization.md), staying logged in is [Phase 2](02-sessions-vs-tokens.md), "Sign in with…" is [Phase 3](03-oauth-and-sign-in-with.md).
- **Want it to finally click for good?** Read in order. Each phase builds on the last - Phase 1 gives you the vocabulary the other two lean on.

## The phases

1. **[Authentication vs Authorization](01-authentication-vs-authorization.md)** - *who you are* (proving identity) versus *what you're allowed to do* (permissions). Two different jobs, both required. The passport-vs-ticket mental model.
2. **[Keeping You Logged In: Sessions vs Tokens](02-sessions-vs-tokens.md)** - after login, the server has to remember you. Server-side sessions versus stateless tokens (JWT), with the honest trade-offs: revocation, size, scaling.
3. **[Delegated Access: OAuth & "Sign in with…"](03-oauth-and-sign-in-with.md)** - how an app gets limited access to your data without your password, the valet-key mental model, access vs refresh tokens, scopes, and how OAuth (authz) differs from OpenID Connect (authn).

> This guide deliberately stops at the concepts and the shapes of things. Picking a specific library, hardening a production login flow, and the deeper cryptography of token signing are their own topics - the goal here is the mental model that makes those next steps make sense. Related reading: [How Passwords Are Stored](/guides/how-passwords-are-stored), [HTTPS & TLS](/guides/https-and-tls), [What an API Is](/guides/what-an-api-is).
