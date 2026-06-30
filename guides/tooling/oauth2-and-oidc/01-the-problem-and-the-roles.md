---
title: "The Problem and the Four Roles"
guide: oauth2-and-oidc
phase: 1
summary: "The standard behind 'Log in with Google': OAuth2 grants delegated access, OIDC adds identity on top, and the authorization-code-with-PKCE flow ties it together."
tags: [oauth, oidc, auth, tokens, security, identity]
difficulty: intermediate
synonyms: ["log in with google", "oauth2 flow", "openid connect", "authorization code flow", "pkce", "access token vs refresh token", "id token", "social login", "delegated access"]
updated: 2026-06-30
---

# The Problem and the Four Roles

Picture the moment before any of this existed. A printing service wants to pull the photos out of your Google account so it can mail you a calendar. The only way it knows to ask is the old way: "give me your Google username and password, I'll log in and grab them."

Stop and feel how bad that is. You're handing a third party the keys to your entire account — email, contacts, everything — so they can read one folder of photos. They store your password somewhere. They can do anything you can do, forever, until you change it. And the only way to revoke them is to change your password, which logs out everything else too. This pattern even had a name: the *password anti-pattern*.

OAuth2 exists to kill that anti-pattern. The whole point is **delegated access**: let an app do one specific thing on your behalf, without ever seeing your password, with access you can revoke independently.

## Authorization is not authentication

Before the roles, nail down the one distinction that confuses everyone. There are two different questions hiding inside "log in":

- **Authentication** — *who are you?* Proving identity.
- **Authorization** — *what are you allowed to do?* Granting permission.

OAuth2 was designed for the second question. It is an **authorization** framework. It answers "is this app allowed to read your photos?" — not "who is the person sitting at the keyboard?"

That gap is exactly why OpenID Connect (OIDC) was created. OIDC is a thin layer on top of OAuth2 that adds the missing piece: a trustworthy answer to *who are you?*. So the slogan to carry through this whole guide is:

> **OAuth2 = authorization (delegated access). OIDC = authentication (identity), built on top of OAuth2.**

When you click "Log in with Google," you are using both at once: OIDC to learn who you are, OAuth2 to (optionally) grant the app some access. If you want the deeper split between these two words, see [/guides/auth-vs-authz](/guides/auth-vs-authz).

## The four roles

Every OAuth2 interaction is four parties passing messages. Learn the roles and the rest of the protocol is bookkeeping. Using the photo-printing example:

- **Resource Owner** — *you*. The human who owns the data and can grant access to it.
- **Client** — *the printing app*. The thing that wants access. It is never trusted with your password; it gets tokens instead.
- **Authorization Server** — *Google's login + consent screens*. It authenticates you, asks "do you allow this app to read your photos?", and issues tokens. This is the party that holds your real credentials.
- **Resource Server** — *the Google Photos API*. It holds the actual data and accepts a token as proof the client is allowed in.

```text
   Resource Owner (you)
        │  approve
        ▼
  Authorization Server  ──issues token──►  Client (the app)
  (Google login/consent)                        │
                                                │ token
                                                ▼
                                      Resource Server (Photos API)
```

*What just happened:* You approve once at the Authorization Server. It hands the Client a token. The Client shows that token to the Resource Server to get the data — and at no point did the password anti-pattern happen. The Client never touched your password.

A subtle but important point: the **Authorization Server and Resource Server are often run by the same company** (Google runs both), but they are *different roles*. One issues tokens, the other accepts them. Keeping them separate in your head explains why a token is a thing that gets handed from one place to another, rather than a magic password.

## Why tokens instead of passwords

The token is the whole innovation. Instead of a password — which is one secret that unlocks everything, forever — the Authorization Server issues a token that is:

- **Scoped** — it grants only specific permissions (read photos), not full account access.
- **Expiring** — it stops working after a while, so a leaked token has a short blast radius.
- **Revocable independently** — you can kill *this app's* access without changing your password or affecting any other app.

That trio — scoped, expiring, revocable — is the entire reason OAuth2 is worth its complexity. Hold onto it; everything in Phase 2 is the machinery that produces such a token safely.

> A common myth: "OAuth logs me in." Plain OAuth2 does *not* log you in — it gets the client permission to call an API. The "log in" feeling comes from OIDC's ID token, which you'll meet next phase. An app that uses raw OAuth2 access tokens as a login mechanism is making a classic security mistake, because an access token says *what you can do*, not *who you are*.

## In the wild

Look at any "Connect your GitHub account" or "Allow this app to post to your calendar" button. That consent screen listing exactly what the app may do — "See your email address," "Manage your repositories" — is the Authorization Server showing you the scopes before it issues a token. The fact that you can later visit a "Connected apps" page and revoke one app without touching the others is the *revocable independently* property, made visible.

```quiz
[
  {
    "q": "What problem was OAuth2 primarily designed to solve?",
    "choices": [
      "Encrypting data in transit between servers",
      "Letting an app act on your behalf without handing it your password",
      "Making login pages load faster",
      "Storing passwords securely in a database"
    ],
    "answer": 1,
    "explain": "OAuth2 kills the 'password anti-pattern' by issuing scoped, revocable tokens for delegated access instead of sharing credentials."
  },
  {
    "q": "Which statement correctly separates the two protocols?",
    "choices": [
      "OAuth2 handles authentication; OIDC handles authorization",
      "OAuth2 handles authorization; OIDC adds authentication on top",
      "They are two names for exactly the same thing",
      "OIDC replaces OAuth2 entirely"
    ],
    "answer": 1,
    "explain": "OAuth2 is an authorization framework (delegated access). OIDC is a thin identity layer (authentication) built on top of it."
  },
  {
    "q": "In the photo-printing example, who is the Resource Server?",
    "choices": [
      "You, the human owner of the photos",
      "The printing app that wants the photos",
      "The Google Photos API that holds the photos and accepts tokens",
      "The Google login and consent screen"
    ],
    "answer": 2,
    "explain": "The Resource Server holds the data and accepts a token as proof of access. The Authorization Server (login/consent) is a separate role even when the same company runs both."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The Authorization Code Flow and the Three Tokens →](02-the-flow-and-the-tokens.md)
