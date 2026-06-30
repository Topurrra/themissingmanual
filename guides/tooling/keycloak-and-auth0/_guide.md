---
title: "Keycloak and Auth0"
guide: keycloak-and-auth0
phase: 0
summary: "Don't build auth yourself: a managed identity provider (Auth0) or a self-hosted one (Keycloak) gives you login, social sign-on, MFA, and OIDC out of the box."
tags: [keycloak, auth0, identity, oidc, sso, mfa, auth]
category: tooling
group: "Auth & Identity"
order: 48
difficulty: intermediate
synonyms: ["keycloak vs auth0", "identity provider", "managed auth", "self hosted auth", "social login provider", "single sign on", "idp", "user management service", "auth as a service", "keycloak realm"]
updated: 2026-06-30
---

# Keycloak and Auth0

You need login. So you start a `users` table, a password hash, a reset-email flow, and three weeks later you are reading about timing attacks at midnight and still have no social sign-on, no MFA, no SSO for that enterprise customer who signed last week. The dread is correct: auth is a swamp that never stops asking for more.

Here is the relief. You do not have to live in that swamp. An identity provider is a finished product that does login, social sign-on, MFA, user management, and OIDC for you. You pick one - managed (Auth0) or self-hosted (Keycloak) - point your app at it, and get back to building the thing people actually pay for.

## How to read this

Go in order. Phase 1 is the mental model: why you outsource identity, and what an identity provider hands you the moment you adopt one. Phase 2 is the everyday core, taught through Keycloak's vocabulary - realms, clients, roles - because those words map onto every IdP once you know them. Phase 3 is the real decision: managed versus self-hosted, what each costs you, and the gotchas that bite in production.

This guide assumes you know roughly what OIDC is. If "ID token" and "redirect URI" are fuzzy, read /guides/oauth2-and-oidc first; the difference between login and permissions lives in /guides/auth-vs-authz.

## The phases

1. [Phase 1: Stop Building Auth](01-stop-building-auth.md) - why identity is a buy-or-host decision, and what an IdP gives you for free.
2. [Phase 2: Realms, Clients, and Roles](02-realms-clients-roles.md) - the everyday vocabulary, wiring an app, and where users and permissions live.
3. [Phase 3: Managed vs Self-Hosted, and the Gotchas](03-managed-vs-self-hosted.md) - Auth0 vs Keycloak in production, costs, lock-in, and what breaks.

[Phase 1: Stop Building Auth](01-stop-building-auth.md) →
