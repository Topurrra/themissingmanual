---
title: "AWS Core Services"
guide: aws-core-services
phase: 0
summary: "The handful of AWS services behind most apps: S3, EC2, RDS, IAM, and Lambda - what each does, how they fit together, and the IAM model that gates it all."
tags: [aws, cloud, s3, ec2, rds, iam, lambda]
category: tooling
group: "Cloud Platforms"
order: 27
difficulty: intermediate
synonyms: ["aws basics", "aws core services explained", "s3 ec2 rds iam lambda", "aws for beginners", "what aws services do i need", "aws iam explained", "how aws services fit together"]
updated: 2026-06-30
---

# AWS Core Services

The AWS console lists hundreds of services, and that wall of three-letter names is enough to make anyone close the tab. Here's the secret nobody puts on the front page: most real applications run on about five of them. Learn those five and how they snap together, and the other several hundred become "things I'll look up if I ever need them" instead of "things I'm failing to understand."

This guide hands you the small, durable core - object storage, virtual machines, managed databases, the permission model, and serverless functions - plus the one mental model (who-can-do-what) that everything else hangs from.

## How to read this

Read the phases in order; they build. Phase 1 gives you the map and the names so the rest stops feeling like alphabet soup. Phase 2 wires the five services into the shape of a real app, which is where it clicks. Phase 3 is the part that saves your weekend: the IAM permission model and the mistakes that page people at 3am.

You don't need an AWS account open to follow along - every command is annotated so you can read it like prose. If you want broader context on what "cloud" even means first, see [/guides/cloud-platforms-explained](/guides/cloud-platforms-explained).

## The phases

1. [The five services that matter](01-the-five-that-matter.md) - the mental model and what each core service actually does.
2. [Wiring them into an app](02-wiring-an-app.md) - how S3, EC2, RDS, IAM, and Lambda fit together in a typical stack.
3. [IAM, least privilege, and what bites you](03-iam-and-what-bites-you.md) - the permission model in depth, plus the production gotchas.

[Phase 1: The five services that matter](01-the-five-that-matter.md) →
