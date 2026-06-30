---
title: "Azure Fundamentals"
guide: azure-fundamentals
phase: 0
summary: "Microsoft's cloud for people who know AWS or none: resource groups and subscriptions, the core compute/storage/database services, and Entra ID for identity."
tags: [azure, cloud, microsoft, entra-id, rbac, infrastructure]
category: tooling
group: "Cloud Platforms"
order: 28
difficulty: intermediate
synonyms: ["azure for aws people", "azure resource groups explained", "what is entra id", "azure rbac basics", "azure vs aws services", "azure subscriptions vs resource groups", "azure core services overview"]
updated: 2026-06-30
---

# Azure Fundamentals

You open the Azure portal and the first thing it asks for is a "resource group." Then a "subscription." Then something called "Entra ID" wants to assign you a "role." None of these are the thing you actually wanted to build, and the docs assume you already know why they exist. That friction is the whole point of this guide: once the organizing model clicks, the rest of Azure stops feeling like a maze of dropdowns and starts feeling like a filing cabinet you can navigate in the dark.

We'll build the mental model first (the container hierarchy nobody explains up front), then walk the handful of services you'll actually touch, then look at identity and the gotchas that bite people in production.

## How to read this

Read the phases in order; each one assumes the last. If you already know AWS, phase 2 has a translation table that will save you the most time. If you're brand new to cloud, don't skip phase 1 - the hierarchy is the thing that makes everything else make sense. For the bigger "why clouds exist at all" picture, see /guides/cloud-platforms-explained.

## The phases

1. [The container hierarchy: how Azure is organized](01-the-container-hierarchy.md)
2. [The services you'll actually use](02-the-services-you-use.md)
3. [Identity, access, and production reality](03-identity-and-production.md)

[Phase 1: The container hierarchy](01-the-container-hierarchy.md) →
