---
title: "Cloud Platforms, Explained (AWS / GCP / Azure)"
guide: "cloud-platforms-explained"
phase: 0
summary: "What 'the cloud' actually sells, the handful of building blocks that matter across AWS, GCP, and Azure, and how to stay sane about bills, permissions, and lock-in."
tags: [cloud, aws, gcp, azure, infrastructure, iaas, paas, serverless]
category: infrastructure
difficulty: intermediate
synonyms: ["what is the cloud", "difference between aws gcp azure", "what does aws actually do", "iaas vs paas vs serverless", "aws s3 vs gcp cloud storage", "how does cloud billing work", "what is iam"]
order: 7
updated: 2026-06-19
---

# Cloud Platforms, Explained (AWS / GCP / Azure)

You've heard "we run on AWS" or "let's spin up a VM on GCP" a hundred times, and you've probably nodded
along. Then you opened the AWS console once, saw a sidebar with two hundred service names you'd never
heard of, and quietly closed the tab. That reaction is correct. Nobody knows all of them. Nobody is
supposed to.

Here's the secret the console hides: underneath the sprawl, a cloud platform sells a very small number of
things, and AWS, Google Cloud, and Azure all sell the *same* small number of things with different
names. Once you have that mental model, the two hundred service names stop being a wall and become a
catalog you can skim. This guide gives you that model - the shape, not the encyclopedia.

## How to read this

- **Want the gist fast?** Read [Phase 1](01-what-the-cloud-sells.md) - it installs the one idea
  everything else hangs on. Then skim the vendor-mapping table in [Phase 2](02-the-building-blocks.md).
- **Want it to finally make sense?** Read in order. Each phase builds on the last: what the cloud
  *is*, the blocks it's made of, and how to choose among them without getting burned.

## The phases

1. **[What "The Cloud" Actually Sells](01-what-the-cloud-sells.md)** - renting computing on demand
   instead of owning servers, and why all three big platforms are the same shape underneath.
2. **[The Building Blocks (Across Vendors)](02-the-building-blocks.md)** - the five or six pieces that
   matter - compute, object storage, managed databases, networking, identity - name-mapped across AWS,
   GCP, and Azure in one table.
3. **[IaaS vs PaaS vs Serverless, and Staying Sane](03-iaas-paas-serverless.md)** - the spectrum from
   raw VMs to managed platforms to functions, and the three gotchas that actually hurt: surprise bills,
   IAM complexity, and lock-in.

> Deliberately out of scope: this is the mental model, not a certification course. We don't walk through
> the console click-by-click, and we don't cover any single service in depth. When you're ready to
> *manage* cloud resources as code instead of clicking, that's a different skill -
> [Infrastructure as Code with Terraform](/guides/infrastructure-as-code-terraform).

---

[Phase 1: What "The Cloud" Actually Sells →](01-what-the-cloud-sells.md)
