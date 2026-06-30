---
title: "Managed vs Self-Hosted, and the Gotchas"
guide: keycloak-and-auth0
phase: 3
summary: "Don't build auth yourself: a managed identity provider (Auth0) or a self-hosted one (Keycloak) gives you login, social sign-on, MFA, and OIDC out of the box."
tags: [keycloak, auth0, identity, oidc, sso, mfa, auth]
difficulty: intermediate
synonyms: ["keycloak vs auth0", "identity provider", "managed auth", "self hosted auth", "social login provider", "single sign on", "idp", "user management service", "auth as a service", "keycloak realm"]
updated: 2026-06-30
---

# Managed vs Self-Hosted, and the Gotchas

By now the question is no longer "should I use an IdP" but "which one, and what will it cost me later." This is where the calm decision matters, because both choices are easy to start and expensive to reverse once thousands of users live inside.

## The real trade: where the work goes

Both options remove the security-critical code from your app. What differs is where the remaining work and the bill land.

```text
                    Auth0 (managed)        Keycloak (self-hosted)
 who runs it        the vendor             you
 the bill scales    per active user        per server (flat-ish)
 ops burden         near zero              real: upgrades, HA, backups
 data residency     vendor's cloud         wherever you host
 time to first login fastest               slower (stand up a server)
 lock-in            higher                 lower (open source, OIDC std)
 outage = your      vendor's status page   your pager
```

*What just happened:* the table reframes the choice as "rent versus own." Auth0 converts auth into a predictable line item and someone else's pager. Keycloak converts it into infrastructure you control and operate. Neither is wrong; they fail differently.

## When managed (Auth0) makes sense

Reach for managed when your scarce resource is *time and people*, not money:

```text
- small team, no one who wants to own an identity server
- you need login working this week, not this quarter
- user counts are modest, or revenue-per-user is healthy
- you have no hard data-residency / on-prem requirement
- you'd rather page a vendor than yourself at 3am
```

*What just happened:* you matched the tool to a team that values shipping over control. The classic regret here is the bill: per-active-user pricing is gentle at 500 users and a board-meeting topic at 500,000. Model the cost at your *target* scale, not today's.

## When self-hosted (Keycloak) makes sense

Reach for self-hosted when control, cost-at-scale, or data location dominate:

```text
- data must stay in your cloud / region / on-prem (compliance)
- very large or fast-growing user base (per-user pricing hurts)
- you already run infrastructure and ops is a muscle you have
- you want zero vendor lock-in (it's open source + standards)
- you need deep customization of the auth flows
```

*What just happened:* you matched the tool to a team that can absorb operational work in exchange for control and a flatter cost curve. The classic regret here is underestimating ops: Keycloak is a stateful Java service backed by a database, and *you* now own its upgrades, high availability, and backups.

## Self-hosted reality: config as code

The professional way to run Keycloak is not clicking in the admin UI in production - it's exporting realm configuration to a file you commit, so environments are reproducible:

```bash
# export a realm to a JSON file you can version-control
kc.sh export --dir /tmp/export --realm acme-customers
```

```bash
# import it when standing up a fresh instance
kc.sh import --dir /tmp/export
```

*What just happened:* your realm - clients, roles, login settings - became a reviewable artifact in git, not a pile of manual clicks someone has to remember. This is the difference between "we have an auth server" and "we can rebuild our auth server." Auth0 has the same discipline via its CLI/Terraform provider; whichever you pick, config-as-code is the line between hobby and production.

## The gotchas that bite everyone

These cut across both Auth0 and Keycloak. Each has wrecked a real launch.

```text
- token lifetime: too long = a stolen token is valid for hours.
  Keep access tokens short; rely on refresh tokens to renew.
- the master/management realm: never put app users in it, and
  lock down its admin account hard - it owns everything.
- redirect URI sloppiness: a wildcard or a forgotten dev URL
  on the allow-list is an open door for token theft.
- clock skew: token validation checks 'exp'; if your server's
  clock drifts, valid tokens get rejected. Sync your clocks (NTP).
- HTTPS everywhere: tokens in transit over plain HTTP are
  credentials in plaintext. Keycloak refuses non-HTTPS by default
  outside localhost for exactly this reason.
- Keycloak upgrades: it's stateful with a DB schema. Read the
  upgrade notes, back up the database, and test before prod.
```

*What just happened:* every item is a place where a default left alone leaks accounts. Auth handed off is not auth ignored - you still own the configuration choices, and these are the ones that matter.

> The cardinal rule survives the handoff: do not roll your own. Adopting an IdP and then reaching back into its token signing, password hashing, or flow internals to "improve" them rebuilds the swamp you escaped. Configure it; don't reinvent it.

## A migration note, so you don't get trapped

Because both speak OIDC, moving between them is *possible* but not free. The protocol-facing parts of your app (token validation, the issuer URL) port cleanly. What doesn't port automatically: password hashes (you may need a gradual "rehash on next login" migration), vendor-specific extensions, and the exact shape of custom claims. Plan migrations as a project, not a config swap - and lean on standards (OIDC, standard claims) over vendor extensions so the door stays open.

## In the wild

A frequent path: a startup launches on Auth0 to get to market fast, runs happily for a couple of years, then watches the per-user bill cross the cost of an engineer and migrates to self-hosted Keycloak. Because they kept to standard OIDC and standard claims, the app code barely changed; the work was operational - stand up Keycloak, migrate users, cut over the issuer URL. The teams that suffer are the ones who leaned hard on one vendor's proprietary features and found the exit welded shut.

```quiz
[
  {
    "q": "What is the central trade-off between Auth0 and Keycloak?",
    "choices": [
      "Auth0 is less secure than Keycloak",
      "Managed trades money and some lock-in for near-zero ops; self-hosted trades operational work for control and a flatter cost curve",
      "Keycloak does not support OIDC",
      "Only Auth0 can do social login and MFA"
    ],
    "answer": 1,
    "explain": "Both remove security-critical code; the difference is where the work and bill land - rent (Auth0) versus own (Keycloak)."
  },
  {
    "q": "Why export a Keycloak realm to a committed file?",
    "choices": [
      "It encrypts the user passwords",
      "It makes realm config a versioned, reviewable artifact so environments are reproducible",
      "It is the only way to enable social login",
      "It disables HTTPS for local testing"
    ],
    "answer": 1,
    "explain": "Config-as-code (export/import to git) turns manual clicks into a reproducible artifact - the line between hobby and production."
  },
  {
    "q": "Which is a genuine production gotcha that applies to both providers?",
    "choices": [
      "Putting application users in the master/management realm",
      "Using HTTPS for token transport",
      "Keeping access-token lifetimes short",
      "Storing realm config in version control"
    ],
    "answer": 0,
    "explain": "App users belong in their own realm; the master realm administers the server itself and must be locked down. The other three are the correct practices."
  }
]
```

[← Phase 2: Realms, Clients, and Roles](02-realms-clients-roles.md) | [Overview](_guide.md)
