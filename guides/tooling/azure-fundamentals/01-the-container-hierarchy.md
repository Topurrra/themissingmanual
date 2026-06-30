---
title: "The container hierarchy: how Azure is organized"
guide: azure-fundamentals
phase: 1
summary: "Microsoft's cloud for people who know AWS or none: resource groups and subscriptions, the core compute/storage/database services, and Entra ID for identity."
tags: [azure, cloud, microsoft, entra-id, rbac, infrastructure]
difficulty: intermediate
synonyms: ["azure for aws people", "azure resource groups explained", "what is entra id", "azure rbac basics", "azure vs aws services", "azure subscriptions vs resource groups", "azure core services overview"]
updated: 2026-06-30
---

# The container hierarchy: how Azure is organized

Here's the thing that trips up almost everyone on day one: in Azure, you can't create a single thing — not a server, not a database, not a storage bucket — until you've decided which *container* it lives in. The portal asks for a "resource group" before it asks for anything you care about, and it feels like bureaucracy blocking your path.

It isn't bureaucracy. It's the spine of the whole platform. Azure's billing, permissions, and lifecycle all hang off a four-level hierarchy. Learn the hierarchy and you've learned the part of Azure that everything else assumes you already understand.

## The four levels, top to bottom

Picture a set of nested boxes. From widest to narrowest:

```text
Management Group   →  optional grouping of subscriptions (org-wide policy)
  Subscription     →  the billing + quota boundary
    Resource Group →  a folder for things that share a lifecycle
      Resource     →  the actual VM, database, storage account, etc.
```

*What just happened:* every resource you ever create sits inside a resource group, which sits inside a subscription, which may sit inside a management group. You start reading from the bottom (the resource is what you want) but Azure makes you fill in the boxes from the top down.

Let's take them one at a time, because each box exists for a specific reason.

## Resource: the thing you actually wanted

A **resource** is any single managed service instance: one virtual machine, one storage account, one database, one web app. Each resource has a type (like `Microsoft.Compute/virtualMachines`) and lives in exactly one region (East US, West Europe, and so on). That's it — a resource is the leaf of the tree.

## Resource group: the folder with a lifecycle

A **resource group** is a folder, but a folder with opinions. The rule of thumb that actually matters: *put things in the same resource group when they live and die together.*

A web app, its database, and its storage account for one project? Same resource group. When the project is retired, you delete the resource group and everything inside it goes with it — one click, no orphans left billing you.

```bash
# Create a resource group named "blog-prod" in the East US region
az group create --name blog-prod --location eastus

# Later, tear the whole thing down — every resource inside it goes too
az group delete --name blog-prod --yes
```

*What just happened:* `az group delete` is the cleanest teardown in Azure. Anything you created inside `blog-prod` — the VM, the database, the disks — is deleted in one command. This is why grouping by lifecycle matters: the resource group is the unit of deletion.

A resource group itself has a region, but that region only stores the group's *metadata*. The resources inside it can live in different regions. Don't overthink the group's region — pick one near you and move on.

## Subscription: the billing and quota wall

A **subscription** is where money and limits live. Every resource bills to exactly one subscription, and quotas (like "how many CPU cores can you spin up in this region") are enforced at the subscription level.

This is the single most important boundary to get right early, because people use subscriptions to separate environments and teams:

```text
Subscription: "Acme Production"   → prod resource groups, locked-down access, the real bill
Subscription: "Acme Dev/Test"     → dev resource groups, looser access, separate budget
```

*What just happened:* by splitting prod and dev into separate subscriptions, a runaway script in dev can't blow the production budget, and a junior dev with full access to "Dev/Test" has zero access to "Production." The boundary does the enforcing for you.

> A common beginner mistake is cramming everything into one subscription and using resource groups to separate prod from dev. Resource groups are folders, not walls — they don't bound billing or quotas. Use subscriptions for that hard separation.

## Management group: the org-wide policy layer

A **management group** sits above subscriptions and exists for one job: applying rules across many subscriptions at once. If your company has fifty subscriptions and wants a policy like "no one may create resources outside European regions," you set that policy once on the management group and every subscription beneath it inherits it.

If you're an individual or a small team, you may never touch management groups — you'll have one or two subscriptions and that's plenty. They matter at organizational scale, where applying a setting fifty times by hand is how mistakes happen.

```text
Management Group: "Acme Corp" (policy: allowed regions = EU only)
├── Subscription: Acme Production
└── Subscription: Acme Dev/Test
```

*What just happened:* both subscriptions inherit the "EU only" guardrail from above. Policy flows *down* the tree — set it high, and everything below obeys.

## Why this design, not a flat list?

You might wonder why Azure didn't give you a flat bucket of resources with tags. The hierarchy buys you three things a flat list can't: a clean **deletion unit** (the resource group), a hard **billing and security boundary** (the subscription), and **inherited policy** (the management group). Each level answers a different question — "what gets cleaned up together," "who pays and who has access," and "what rules apply everywhere." Tags are still useful for cross-cutting labels like cost-center, but they don't replace the boxes.

**For builders:** when you script infrastructure, this hierarchy becomes your deployment scope. A Bicep or ARM template deploys *into* a resource group; a policy assignment targets a management group or subscription. Knowing which level a thing attaches to tells you where your automation has to point.

```quiz
[
  {
    "q": "You finish a project and want to delete the web app, its database, and its storage account in one action. What's the cleanest way?",
    "choices": [
      "Delete each resource individually from the portal",
      "Put them in one resource group and delete the resource group",
      "Delete the subscription",
      "Apply a management group policy that removes them"
    ],
    "answer": 1,
    "explain": "Resources in a resource group share a lifecycle; deleting the group deletes everything inside it with no orphans left billing you."
  },
  {
    "q": "Which level is the hard boundary for billing and quotas?",
    "choices": [
      "Resource group",
      "Resource",
      "Subscription",
      "Tag"
    ],
    "answer": 2,
    "explain": "Every resource bills to exactly one subscription, and quotas are enforced at the subscription level. Resource groups are folders, not billing walls."
  },
  {
    "q": "What is the main purpose of a management group?",
    "choices": [
      "To store the actual VMs and databases",
      "To apply policy across many subscriptions at once",
      "To act as a billing account for a single project",
      "To define the region a resource runs in"
    ],
    "answer": 1,
    "explain": "Management groups sit above subscriptions so a single policy (like allowed regions) is inherited by every subscription beneath them."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The services you'll actually use →](02-the-services-you-use.md)
