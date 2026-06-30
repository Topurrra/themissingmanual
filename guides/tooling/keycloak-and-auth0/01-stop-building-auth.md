---
title: "Stop Building Auth"
guide: keycloak-and-auth0
phase: 1
summary: "Don't build auth yourself: a managed identity provider (Auth0) or a self-hosted one (Keycloak) gives you login, social sign-on, MFA, and OIDC out of the box."
tags: [keycloak, auth0, identity, oidc, sso, mfa, auth]
difficulty: intermediate
synonyms: ["keycloak vs auth0", "identity provider", "managed auth", "self hosted auth", "social login provider", "single sign on", "idp", "user management service", "auth as a service", "keycloak realm"]
updated: 2026-06-30
---

# Stop Building Auth

You have done this before, or you are about to. A `users` table. A column for the password hash. A signup form, a login form, a "forgot password" email. It feels like a Tuesday-afternoon task. It is not.

## The swamp you are about to walk into

Write down everything "let users log in" actually contains:

```text
- password hashing (which algorithm? what cost factor?)
- password reset (email tokens, expiry, single-use)
- email verification
- rate limiting on login (or you invite credential stuffing)
- account lockout and the lockout-as-DoS problem it creates
- session management and cookie security
- "Log in with Google / GitHub / Microsoft"
- multi-factor auth (TOTP apps, SMS, passkeys)
- the enterprise customer who demands SAML SSO
- an admin screen to find a user and reset their access
- audit logs for "who logged in, from where, when"
- GDPR-style account deletion and data export
```

*What just happened:* the line item "login" exploded into a dozen sub-projects, each with its own security failure mode. Every one of these is a place an attacker probes, and getting any single one wrong can hand over accounts.

This is the core insight of the whole guide: **identity is not a feature of your app, it is a product in its own right** - one that other people have already built, hardened over years, and been attacked through so you don't have to be.

> The cost of getting auth wrong is not a bug ticket. It is an account takeover, a breach disclosure, and a customer who never comes back. That asymmetry is why "buy or host, don't build" is the default for everyone who has been burned once.

## What an identity provider actually is

An **identity provider** (IdP) is a separate service whose entire job is to answer one question for your app: *who is this person, and are they who they claim to be?* You hand off login to it and get back a signed token that says "this is user 8842, email asha@example.com, verified." Your app trusts the token, not a password it stored.

```text
        ┌─────────┐   1. "log me in"    ┌──────────────┐
 user → │ your app │ ──────────────────→ │ identity     │
        │          │ ←────────────────── │ provider     │
        └─────────┘   2. signed token    │ (Auth0 /     │
            │  3. trust the token,        │  Keycloak)   │
            ▼     never see the password  └──────────────┘
        your business logic
```

*What just happened:* your app never touches the password. The IdP runs the login screen, checks credentials (or a Google account, or a passkey), and returns a token your app verifies with a public key. Your codebase shrinks to "validate this token, read the user out of it."

The protocol underneath that token exchange is OIDC - the same authorization-code flow covered in /guides/oauth2-and-oidc. An IdP is, in one sentence, a polished product wrapped around an OIDC server plus a user database plus an admin console.

## What you get the day you adopt one

The same checklist from the swamp, except now it ships in the box:

```text
✓ login + signup UI (hosted, branded to look like yours)
✓ password reset + email verification flows
✓ social login: Google, GitHub, Microsoft, Apple, ...
✓ MFA: TOTP authenticator apps, SMS, passkeys/WebAuthn
✓ SSO: SAML and OIDC for enterprise customers
✓ user management console (find, edit, disable, reset)
✓ RBAC: define roles, assign them, read them in the token
✓ audit logs, brute-force protection, session control
✓ standards-based tokens any language can verify
```

*What just happened:* the three-week project from the intro collapsed into a configuration task. You are no longer writing security-critical code; you are turning features on.

## The two doors: managed and self-hosted

There are two shapes of IdP, and the whole rest of this guide hangs on the difference:

- **Auth0** - *managed.* A company runs the servers; you sign up, configure through a dashboard, and pay per active user. Zero ops, fastest to a working login, priced by usage.
- **Keycloak** - *self-hosted, open source.* You run the server (a Java application, usually in a container) on your own infrastructure. No per-user fee, full control of the data, and you own the upgrades, backups, and uptime.

```text
 MANAGED (Auth0)              SELF-HOSTED (Keycloak)
 ─────────────────           ──────────────────────
 someone else runs it        you run it
 pay per active user         pay for the servers + your time
 ops handled for you         you own upgrades & backups
 data lives in their cloud   data lives where you put it
 fastest to "it works"       most control, no vendor lock-in
```

*What just happened:* you saw the trade in one frame. Managed buys you time with money and a vendor relationship; self-hosted buys you control and data ownership with operational work. Phase 3 turns this into an actual decision.

The good news: both speak the same protocols. Whichever door you walk through, your app verifies an OIDC token the same way. The IdP is replaceable; the standard is not.

## For builders

Reach for an IdP the moment auth stops being trivial - the first time someone asks for "Log in with Google," for MFA, or for SSO. Even a weekend project benefits, because the hosted login screen and password-reset flow alone save you the riskiest code you'd otherwise write. The rare case for building it yourself is when your auth requirements are genuinely strange and tiny, and even then most teams regret it by the second feature request.

```quiz
[
  {
    "q": "What is the core mental-model claim of this phase?",
    "choices": [
      "Identity is a small feature you should hand-roll to save money",
      "Identity is a product in its own right, already built and hardened by others",
      "Auth0 and Keycloak are databases you query directly",
      "OIDC replaces the need for any identity provider"
    ],
    "answer": 1,
    "explain": "Auth ('login') explodes into a dozen security-critical sub-projects, so you adopt a finished identity product rather than rebuild it."
  },
  {
    "q": "After adopting an identity provider, what does your app store and check?",
    "choices": [
      "The user's raw password, hashed with bcrypt",
      "Nothing about the user; it only logs requests",
      "A signed token from the IdP, which it verifies rather than the password",
      "A session row keyed by the user's SMS code"
    ],
    "answer": 2,
    "explain": "The IdP runs login and returns a signed token; your app verifies the token with a public key and never touches the password."
  },
  {
    "q": "Which statement correctly contrasts Auth0 and Keycloak?",
    "choices": [
      "Auth0 is open source and self-hosted; Keycloak is managed and paid",
      "Auth0 is managed and priced per user; Keycloak is self-hosted and open source",
      "Both are managed services with no self-hosting option",
      "Both require you to implement OIDC yourself"
    ],
    "answer": 1,
    "explain": "Auth0 is a managed, pay-per-active-user service; Keycloak is open source and runs on your own infrastructure."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Realms, Clients, and Roles →](02-realms-clients-roles.md)
