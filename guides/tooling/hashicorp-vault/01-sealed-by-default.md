---
title: "Sealed by Default"
guide: hashicorp-vault
phase: 1
summary: "Stop hardcoding secrets: Vault stores them encrypted, gates access by policy, issues short-lived dynamic credentials, and keeps an audit trail."
tags: [vault, secrets, security, dynamic-secrets, encryption, devops]
difficulty: intermediate
synonyms: ["hashicorp vault", "vault secrets", "what is vault", "dynamic secrets", "vault unseal", "vault policy", "vault kv", "vault dynamic database credentials", "vault auth methods", "transit encryption"]
updated: 2026-06-30
---

# Sealed by Default

Picture the state your secrets are in today. A database password lives in `application.yml`, which lives in a repo, which lives on every laptop that ever cloned it. An AWS key is in a CI variable that ten people can read. None of these secrets has an expiry date, none of them is logged when read, and revoking one means a frantic grep across every service that might use it. This is *secrets sprawl*, and it's not laziness — it's the default. Every shortcut was reasonable in the moment. The problem is that the moments add up into a blast radius nobody can measure.

Vault's whole pitch is to collapse that blast radius. Instead of secrets scattered as plaintext, there's one service that holds them encrypted, hands them out only to identities that policy allows, can make many of them short-lived, and writes down every access. Before any of that makes sense, you need the one idea the rest hangs from: Vault spends most of its life **sealed**.

## What "sealed" actually means

When Vault stores a secret, it doesn't write it to disk in the clear. It encrypts it with an internal *encryption key*. That encryption key is itself encrypted by a *root key* (sometimes called the master key). So far that's normal at-rest encryption. The twist is where the root key lives: it does **not** live on disk in usable form.

When the Vault process starts, it's *sealed*. It has the encrypted data and the encrypted root key, but it cannot decrypt anything, because it's missing the piece that unlocks the root key. In that state Vault can do almost nothing — it can't read secrets, can't issue tokens, can't serve requests. It's a locked safe whose combination isn't in the building.

```text
                sealed                          unsealed
        ┌─────────────────┐             ┌─────────────────────┐
        │ encrypted data  │  unseal     │ encrypted data      │
        │ encrypted root  │ ─────────►  │ root key in memory  │
        │ (no root key)   │  keys       │ can decrypt + serve │
        └─────────────────┘             └─────────────────────┘
```

*What just happened:* a sealed Vault is inert by design. The root key only ever exists in memory, only after an explicit unseal, and it's gone the moment the process restarts.

## Unsealing, and why it's split into pieces

You might expect one unseal password. Vault deliberately avoids that, because one password is one person who can be coerced, phished, or fired. Instead, the classic setup uses **Shamir's Secret Sharing**: at initialization, the root key is split into several *unseal keys* (shares), and you set a *threshold* of how many are needed to reconstruct it.

```console
$ vault operator init -key-shares=5 -key-threshold=3
Unseal Key 1: hf2k...    Unseal Key 2: 9xQp...
Unseal Key 3: Lm4v...    Unseal Key 4: bN7c...
Unseal Key 5: Tz0a...
Initial Root Token: hvs.AbCdEf...
```

*What just happened:* Vault generated 5 unseal keys and decided that any 3 of them, together, can reconstruct the root key. No single key does anything alone. The threshold means no one person can unseal Vault, and losing one or two keys doesn't lock you out forever.

To unseal, you feed in keys one at a time until you hit the threshold:

```console
$ vault operator unseal hf2k...
Sealed   true    Unseal Progress   1/3
$ vault operator unseal Lm4v...
Sealed   true    Unseal Progress   2/3
$ vault operator unseal Tz0a...
Sealed   false   Unseal Progress   0/3
```

*What just happened:* three of the five share-holders showed up, the root key got reassembled in memory, and Vault is now serving requests. Restart the process and you're back to sealed — you unseal again.

> In real production, almost nobody types unseal keys by hand. Vault is configured with **auto-unseal**, where a cloud KMS or HSM holds the unlocking key and Vault asks it on startup. Shamir is the model to understand; auto-unseal is the model you run. Phase 3 returns to this.

## The pieces Vault is made of

Once unsealed, Vault is a set of pluggable parts. You don't need them all on day one, but the names will keep coming up:

- **Secrets engines** — mounted at a path, each one *does* something with secrets. The `kv` engine stores static key-value secrets. The `database` engine *generates* credentials on demand. The `transit` engine encrypts data without ever storing it. Different engines, mounted at different paths, same Vault.
- **Auth methods** — how a human or machine proves who they are *before* Vault gives them a token. A person might log in with their company SSO; a Kubernetes pod proves itself with its service-account token; a CI job uses AppRole. Each method maps an external identity to Vault policies.
- **Policies** — written rules saying which paths an identity may read, write, or delete. No policy, no access. This is how Vault turns "who are you" into "what may you touch."
- **Tokens** — the currency of every request. After you authenticate, you get a token; every later call carries it. Tokens have a lease and expire.
- **Audit devices** — the tamper-evident log of every request and response (with secrets hashed, not printed).

```text
   identity ──auth method──► token ──(carries)──► request
                                                    │
                                              policy check
                                                    │
                                          secrets engine at a path
```

*What just happened:* every interaction follows the same spine — prove identity, get a token, make a request, policy decides, an engine serves it, the audit device records it. Hold that shape and the rest of Vault is detail.

## Why this beats a config file

The payoff of all this structure is concrete. Secrets are encrypted at rest under a key that isn't sitting on disk. Access is governed by policy you can read and review, not by file permissions scattered across hosts. Many secrets can be *dynamic* — generated when asked and revoked automatically — so a leaked credential is worth little because it expires. And the audit log means "who read the prod database password, and when" has an actual answer.

For the bigger picture of why teams move off plaintext and what other tools play in this space, see [/guides/secrets-management](/guides/secrets-management). Vault is one strong answer to the problem that guide frames.

```quiz
[
  {
    "q": "What does it mean that Vault is 'sealed' when it starts?",
    "choices": ["It refuses network connections", "It can't decrypt its data because the root key isn't reconstructed yet", "Its data is deleted until you log in", "It runs in read-only mode"],
    "answer": 1,
    "explain": "Sealed Vault holds encrypted data and an encrypted root key, but lacks the means to unlock the root key, so it can decrypt nothing until unsealed."
  },
  {
    "q": "With -key-shares=5 -key-threshold=3, how many unseal keys are needed to unseal?",
    "choices": ["All 5", "Any 3", "Just 1", "Exactly 2"],
    "answer": 1,
    "explain": "Shamir's Secret Sharing splits the root key into 5 shares, any 3 of which reconstruct it. No single key works alone."
  },
  {
    "q": "Which part of Vault decides whether an identity may read a given path?",
    "choices": ["The auth method", "A policy", "The audit device", "The unseal key"],
    "answer": 1,
    "explain": "Auth methods establish identity; policies map that identity to which paths it may read, write, or delete."
  }
]
```

[← Overview](_guide.md) · [Phase 2: The Daily Loop →](02-the-daily-loop.md)
