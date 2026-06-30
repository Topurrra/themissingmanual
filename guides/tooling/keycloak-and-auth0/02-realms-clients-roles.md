---
title: "Keycloak and Auth0"
guide: keycloak-and-auth0
phase: 2
summary: "Don't build auth yourself: a managed identity provider (Auth0) or a self-hosted one (Keycloak) gives you login, social sign-on, MFA, and OIDC out of the box."
tags: [keycloak, auth0, identity, oidc, sso, mfa, auth]
difficulty: intermediate
synonyms: ["keycloak vs auth0", "identity provider", "managed auth", "self hosted auth", "social login provider", "single sign on", "idp", "user management service", "auth as a service", "keycloak realm"]
updated: 2026-06-30
---

# Realms, Clients, and Roles

Open any identity provider for the first time and the dashboard throws nouns at you: realms, clients, tenants, applications, roles, scopes, mappers. It feels like learning a new language before you can do one useful thing. So learn the three words that carry the weight. We'll use Keycloak's names because they're the most explicit; Auth0 has the same ideas under slightly different labels, noted as we go.

## Realm: the walled garden of users

A **realm** is a self-contained universe of users, credentials, roles, and settings. Users in one realm cannot see or log into another. Everything you configure — login policy, social providers, MFA rules — lives inside a realm.

```text
Keycloak instance
├── realm: acme-staff        ← your employees
│     users, roles, login policy, MFA
├── realm: acme-customers    ← the people who buy from you
│     users, social login, self-signup
└── realm: master            ← admin-only; do NOT put app users here
```

*What just happened:* you separated two completely different populations. Staff and customers never mix, have different login rules, and can't authenticate across the boundary. The `master` realm exists only to administer Keycloak itself — putting application users there is a classic first mistake.

In Auth0 the equivalent boundary is the **tenant** (one per environment, e.g. `acme-dev`, `acme-prod`), with **connections** carrying the user populations inside it. Different word, same job: an isolated container of identities.

## Client: one app that trusts the realm

A **client** is a registration for one application that wants to use the realm to log people in. Your web frontend is a client. Your mobile app is another client. Your backend API is a third. Each gets its own ID and its own settings.

```text
realm: acme-customers
├── client: web-spa
│     type: public (no secret — runs in a browser)
│     redirect URIs: https://app.acme.com/callback
│     flow: authorization code + PKCE
├── client: mobile-app
│     type: public
│     redirect URIs: com.acme.app://callback
└── client: orders-api
      type: confidential (has a secret — runs on a server)
      used to validate incoming tokens
```

*What just happened:* each app declared who it is and where the IdP is allowed to send users back after login. That **redirect URI** is a security control, not a convenience: the IdP refuses to return a token to any URL not on the list, which is what stops an attacker from stealing the login response.

Two client types matter:

- **public** — runs somewhere a secret can't be hidden (a browser SPA, a mobile app). It proves itself with PKCE instead of a secret.
- **confidential** — runs on a server where a secret stays secret. It can use a client secret to authenticate.

Auth0 calls a client an **application**, with the same public/confidential split (it labels them "Single Page App," "Native," "Regular Web App," "Machine to Machine"). The mental model is identical.

## Wiring an app: the smallest real config

To connect an app you need three values from the realm and one decision. Here is what a frontend's config actually looks like:

```yaml
# what your app needs to talk to the IdP
issuer:    https://id.acme.com/realms/acme-customers
client_id: web-spa
redirect_uri: https://app.acme.com/callback
# no client_secret — this is a public client using PKCE
```

*What just happened:* `issuer` points at the realm, `client_id` names your registered client, and `redirect_uri` matches one you allow-listed. From the issuer URL the app can discover everything else automatically — every OIDC provider publishes its endpoints and signing keys at a well-known address:

```bash
curl https://id.acme.com/realms/acme-customers/.well-known/openid-configuration
```

```json
{
  "issuer": "https://id.acme.com/realms/acme-customers",
  "authorization_endpoint": "https://id.acme.com/realms/acme-customers/protocol/openid-connect/auth",
  "token_endpoint": "https://id.acme.com/realms/acme-customers/protocol/openid-connect/token",
  "jwks_uri": "https://id.acme.com/realms/acme-customers/protocol/openid-connect/certs",
  "userinfo_endpoint": "...",
  "end_session_endpoint": "..."
}
```

*What just happened:* you fetched the realm's public directory. Your auth library reads this once and knows where to send the user to log in, where to exchange the code for a token, and (via `jwks_uri`) which public keys verify the token's signature. You configured one URL; the standard filled in the rest. This is why swapping Auth0 for Keycloak later is mostly a change of issuer URL — both publish the same well-known document.

## Roles: who is allowed to do what

Login tells you *who* the user is. **Roles** are how the realm records *what they may do* — the authorization half of the story (the full distinction lives in /guides/auth-vs-authz). You define roles in the realm, assign them to users, and the IdP stamps them into the token.

```text
realm roles:  admin, editor, viewer

user: asha@example.com  →  roles: [editor]
user: ops@example.com   →  roles: [admin]
```

When `asha` logs in, her token carries her roles. Decoded, the relevant slice looks like this:

```json
{
  "sub": "8842-asha",
  "email": "asha@example.com",
  "realm_access": {
    "roles": ["editor"]
  },
  "exp": 1751299200
}
```

*What just happened:* your API doesn't query a database to learn Asha is an editor — it reads `realm_access.roles` straight out of the verified token. The IdP is the single source of truth for both identity and roles, and your app trusts the signature. (Auth0 delivers the same thing through roles/permissions surfaced as custom claims in the token.)

> Keep roles coarse — `admin`, `editor`, `viewer` — and decide fine-grained, data-specific permissions ("can edit *this* document") in your own app. The IdP knows roles; it does not know your business objects. Cramming per-record rules into the token bloats it and couples your domain to your auth vendor.

## The everyday loop

Day to day, working with an IdP looks like this, almost entirely through its admin console:

```text
1. create the realm/tenant once per environment
2. register a client/application per app
3. allow-list its redirect URIs
4. turn on the login methods you want (password, Google, MFA)
5. define a few roles
6. point your app at the issuer + client_id
7. let users sign up; assign roles as needed
```

*What just happened:* notice how little of this is code. Steps 1–5 are configuration in a UI (or a config file you commit, covered next phase). Step 6 is a handful of lines in your app. The IdP did the hard part.

## In the wild

A common production shape: one realm for customers with self-signup and social login switched on, a second realm for internal staff locked down with mandatory MFA and no self-signup, and each microservice registered as its own confidential client validating tokens against the realm's `jwks_uri`. Same instance, two walled gardens, every service trusting the same signed tokens.

```quiz
[
  {
    "q": "In Keycloak, what is a realm?",
    "choices": [
      "A single application registered to use login",
      "A self-contained set of users, roles, and settings, isolated from other realms",
      "A role assigned to an administrator",
      "The secret a confidential client uses to authenticate"
    ],
    "answer": 1,
    "explain": "A realm is an isolated universe of users and configuration; users in one realm cannot log into another. Auth0's equivalent is a tenant."
  },
  {
    "q": "Why does a client declare allow-listed redirect URIs?",
    "choices": [
      "To make the login page load faster",
      "So the IdP refuses to return a token to any URL not on the list, blocking token theft",
      "Because OIDC requires exactly one URI per realm",
      "To store the user's roles"
    ],
    "answer": 1,
    "explain": "The redirect URI is a security control: the IdP only sends the login response to pre-registered URLs, which stops attackers from capturing it."
  },
  {
    "q": "How does your API learn that a user has the 'editor' role?",
    "choices": [
      "It queries the realm database on every request",
      "It reads the roles claim out of the verified token the IdP issued",
      "It asks the user to re-enter their password",
      "Roles are not available to APIs, only to the login page"
    ],
    "answer": 1,
    "explain": "The IdP stamps roles into the token (e.g. realm_access.roles); the API trusts the signature and reads them directly, no extra lookup."
  }
]
```

[← Phase 1: Stop Building Auth](01-stop-building-auth.md) | [Overview](_guide.md) | [Phase 3: Managed vs Self-Hosted →](03-managed-vs-self-hosted.md)
