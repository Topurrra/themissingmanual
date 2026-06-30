---
title: "GCP Fundamentals"
guide: gcp-fundamentals
phase: 0
summary: "Google Cloud essentials: projects as the unit of organization, the core compute and storage services, and IAM — with a quick map from AWS terms."
tags: [gcp, google-cloud, cloud, iam, compute-engine, cloud-storage, bigquery]
category: tooling
group: "Cloud Platforms"
order: 29
difficulty: intermediate
synonyms: ["google cloud platform basics", "gcp for beginners", "gcp vs aws terms", "google cloud projects iam", "gcp core services", "learn google cloud"]
updated: 2026-06-30
---

# GCP Fundamentals

You opened the Google Cloud console and the left-hand menu kept scrolling. A hundred products, half of them with names that tell you nothing — Dataflow, Pub/Sub, Spanner, Anthos. You wanted a server and a place to put files, and now you're staring at a sidebar that looks like an airport departure board. The fear is real: pick wrong, get a surprise bill, or wire up something you can't undo.

Here's the relief. You don't need a hundred products. You need one organizing idea — the **project** — and about six services. Once those click, the rest of the console is more of the same shape, and you can ignore it until you actually need it. This guide gives you the mental model first, then the everyday services, then the parts that bite people in production.

## How to read this

Read the phases in order. Phase 1 is the map — the project, what it is, and why everything hangs off it. Don't skip it; the whole console makes sense or doesn't make sense based on this one idea. Phase 2 is the working core: the services you'll actually touch and how they fit together. Phase 3 is the reality check — IAM done right, billing surprises, and the AWS-to-GCP translation table for when your brain keeps reaching for the term it already knows.

If you've used another cloud before, the term map in Phase 3 will save you the most time. If you're brand new, start clean at Phase 1 and let the AWS comparisons wash over you.

For the bigger picture of how the major clouds compare and which one to reach for, see /guides/cloud-platforms-explained.

## The phases

1. [The project is the unit of everything](01-the-project-is-the-unit.md) — the mental model: resource hierarchy, projects, and why GCP organizes the way it does.
2. [The services you'll actually use](02-the-services-you-use.md) — Compute Engine, Cloud Storage, Cloud SQL, Cloud Run, Cloud Functions, and BigQuery.
3. [IAM, billing, and the AWS map](03-iam-billing-and-the-aws-map.md) — roles and service accounts done safely, where the bills come from, and the term-for-term translation.

[Phase 1: The project is the unit of everything](01-the-project-is-the-unit.md) →
