---
title: "Identity, access, and production reality"
guide: azure-fundamentals
phase: 3
summary: "Microsoft's cloud for people who know AWS or none: resource groups and subscriptions, the core compute/storage/database services, and Entra ID for identity."
tags: [azure, cloud, microsoft, entra-id, rbac, infrastructure]
difficulty: intermediate
synonyms: ["azure for aws people", "azure resource groups explained", "what is entra id", "azure rbac basics", "azure vs aws services", "azure subscriptions vs resource groups", "azure core services overview"]
updated: 2026-06-30
---

# Identity, access, and production reality

This is the phase where Azure trips up the most people, including experienced AWS engineers. The reason is one design decision: Azure splits *who you are* from *what you're allowed to do* into two separate systems. AWS folds both into IAM; Azure does not. Once that split clicks, the permission errors stop feeling random and the production gotchas become predictable.

## Entra ID: who you are

**Entra ID** (formerly Azure Active Directory) is the identity service. It answers one question: *is this person or program who they claim to be?* It holds your users, groups, and the identities of applications. When you sign into the portal, Entra ID is what authenticated you.

Crucially, Entra ID does **not** decide what you can do with resources. It only proves identity. A brand-new user in Entra ID can sign in and see nothing - because identity and permission are separate.

> If you know AWS: Entra ID is the directory-of-users half of IAM, pulled out into its own service. It also doubles as the identity provider for Microsoft 365, which is why org accounts and Azure accounts are the same login.

## RBAC: what you're allowed to do

**Azure RBAC** (Role-Based Access Control) is the permission system. It answers: *what is this identity allowed to do, and where?* You grant access by creating a **role assignment**, which is always three things bolted together:

```text
Role assignment = WHO  +  WHAT  +  WHERE
                  (identity) (role) (scope)
```

*What just happened:* every grant of access in Azure is this triple. "Who" is an Entra ID user, group, or app. "What" is a role (a bundle of permissions like Reader, Contributor, or Owner). "Where" is the scope - a management group, subscription, resource group, or a single resource. Miss any of the three and the grant is meaningless.

Here's a real assignment:

```bash
# Give the user "dana" the Contributor role, scoped to the blog-prod resource group
az role assignment create \
  --assignee dana@acme.com \
  --role "Contributor" \
  --scope "/subscriptions/<sub-id>/resourceGroups/blog-prod"
```

*What just happened:* Dana can now create, modify, and delete resources - but *only inside blog-prod*. She has no access to anything else in the subscription. Scope is the dial that limits blast radius.

The three roles you'll use constantly:

- **Reader** - can look, can't touch. Good for auditors and dashboards.
- **Contributor** - can create, change, and delete resources, but *cannot grant access to others*. The everyday working role.
- **Owner** - Contributor plus the power to assign roles. Hand this out sparingly; an Owner can give anyone any access.

## Scope inheritance: the thing that surprises people

Permissions flow **downward**. A role assigned at the subscription level applies to every resource group and resource beneath it. This is convenient and dangerous in equal measure.

```text
Subscription      ← assign "Reader" here...
└── blog-prod     ← ...and it's inherited here automatically
    └── web-01    ← ...and here too
```

*What just happened:* one assignment at the top covers everything below - you don't re-grant at each level. The flip side: assigning at too high a scope gives someone broad access without meaning to. The fix is the same principle every time - **assign at the narrowest scope that does the job.** Don't grant at the subscription when the resource group would do.

## Managed identities: stop putting passwords in code

A classic production mistake is hardcoding a database password or storage key into your app's config. Azure's answer is the **managed identity**: an Entra ID identity that Azure creates and rotates for a resource (like your App Service), so the app authenticates to other Azure services *with no credentials in your code at all*.

```text
App Service (with managed identity)  →  needs to read Blob Storage
   1. Azure gives the app an Entra ID identity automatically
   2. You assign that identity a role (e.g. "Storage Blob Data Reader") on the storage account
   3. The app requests a token at runtime - no key stored anywhere
```

*What just happened:* the app proves its identity to storage without you ever handling a secret. There's no key to leak in a Git commit and nothing to rotate by hand. If you take one production habit from this guide, take this one.

## The gotchas that bite in production

A short list of the things that cost people a real afternoon:

- **"Access denied" with a valid login.** Almost always RBAC, not Entra ID. The user is authenticated but has no role at the right scope. Check the role assignments on the resource group, not the sign-in.
- **Subscription quota walls.** You try to create more VM cores than your subscription allows in a region and the deploy fails. Quotas are per-subscription, per-region, and per-VM-family - request an increase before a big rollout, not during.
- **Region mismatch latency.** Putting your app in one region and its database in another adds a network hop to every query. Keep tightly-coupled resources in the same region.
- **Forgotten resources keep billing.** A VM you "stopped" in the OS is still allocated and still charging unless you *deallocate* it (`az vm deallocate`). Stopping inside the guest OS is not the same as releasing the hardware.
- **Owner sprawl.** Handing out Owner because Contributor "didn't work" usually means the real need was a narrower role at a narrower scope. Owner should be rare.

> The single most common Azure support question is some flavor of "I can sign in but can't do anything." Train yourself to immediately separate the two questions - *am I authenticated?* (Entra ID) and *am I authorized?* (RBAC) - and you'll diagnose it in seconds instead of minutes.

**In the wild:** a healthy small-team setup looks like this - users grouped in Entra ID by team, Contributor granted to those groups at the resource-group scope (never the subscription), Owner held by one or two admins, and every app talking to storage and databases through managed identities with zero secrets in config. That's not advanced Azure; it's the baseline that keeps you out of trouble.

For the broader picture of how cloud platforms compare and when to pick one, see /guides/cloud-platforms-explained.

```quiz
[
  {
    "q": "A user can sign into the Azure portal but gets 'access denied' when creating a resource. Where is the problem most likely?",
    "choices": [
      "Entra ID - their identity is broken",
      "RBAC - they're authenticated but have no role at the right scope",
      "Blob Storage tiering",
      "The management group region setting"
    ],
    "answer": 1,
    "explain": "Signing in proves identity (Entra ID works). Being unable to act means no role assignment at the right scope - an RBAC issue. Azure separates who you are from what you can do."
  },
  {
    "q": "What three parts make up an Azure role assignment?",
    "choices": [
      "Region, tier, and quota",
      "Identity (who), role (what), and scope (where)",
      "VM, storage, and database",
      "Subscription, billing, and policy"
    ],
    "answer": 1,
    "explain": "Every grant of access in Azure is the triple: an identity, a role bundling permissions, and a scope defining where it applies. Miss one and the grant means nothing."
  },
  {
    "q": "Why use a managed identity for your App Service?",
    "choices": [
      "It makes the app run in more regions",
      "It lets the app authenticate to other Azure services with no credentials stored in code",
      "It lowers the storage tier automatically",
      "It assigns the Owner role to every user"
    ],
    "answer": 1,
    "explain": "A managed identity is an Entra ID identity Azure creates and rotates for the resource, so the app gets tokens at runtime with no secret to leak or rotate by hand."
  }
]
```

[← Phase 2](02-the-services-you-use.md) | [Overview](_guide.md)
