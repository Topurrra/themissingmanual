---
title: "AWS CloudFormation"
guide: aws-cloudformation
phase: 0
summary: "AWS's native infrastructure as code: declare resources in a template, and CloudFormation creates, updates, and rolls back the whole stack as one unit."
tags: [aws, cloudformation, infrastructure-as-code, devops, cloud]
category: tooling
group: "Infrastructure as Code"
order: 26
difficulty: intermediate
synonyms: ["aws cloudformation tutorial", "cloudformation template yaml", "cloudformation vs terraform", "cloudformation stack", "cloudformation change set", "aws iac", "cloudformation rollback", "cloudformation drift detection"]
updated: 2026-06-30
---

# AWS CloudFormation

You have a pile of AWS resources that belong together: a bucket, a queue, a role, a function. Today they live in your head and your click history in the console. Tomorrow you need the same thing in staging, or you need to tear it all down cleanly, or a teammate needs to know what exists and why. CloudFormation lets you write that pile down as one file, hand it to AWS, and get back a managed group of resources that creates, updates, and deletes as a single unit. No more guessing what's running. No more orphaned resources nobody dares touch.

## How to read this

Three phases, in order. Phase 1 builds the mental model: what a template and a stack actually are, and why a managed unit beats a folder of scripts. Phase 2 is the everyday work: writing templates with parameters and outputs, previewing changes before they land, and wiring resources together. Phase 3 is production reality: rollbacks, drift, the failure modes that bite, and a clear-eyed look at where Terraform wins instead.

If you have never touched infrastructure as code, the broader idea is worth a detour: see [/guides/infrastructure-as-code-terraform](/guides/infrastructure-as-code-terraform) for the tool-agnostic concept. And if AWS itself is new, [/guides/cloud-platforms-explained](/guides/cloud-platforms-explained) sets the scene.

## The phases

1. [The mental model: templates and stacks](01-templates-and-stacks.md) - what you're actually declaring, and why a stack is one unit.
2. [Writing and changing stacks for real](02-writing-and-changing-stacks.md) - parameters, outputs, intrinsic functions, and change sets.
3. [When it breaks: rollback, drift, and Terraform](03-rollback-drift-and-reality.md) - the gotchas, the recovery moves, and where each tool wins.

[Phase 1: The mental model: templates and stacks](01-templates-and-stacks.md) →
