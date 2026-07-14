---
title: "Infrastructure as Code (Terraform Basics)"
guide: "infrastructure-as-code-terraform"
phase: 0
summary: "Stop clicking around in cloud consoles. Define your servers, networks, and databases in version-controlled files you can review and apply - that's Infrastructure as Code, and Terraform is how a huge slice of the industry does it."
tags: [terraform, infrastructure-as-code, iac, devops, hcl, cloud, state]
category: devops
order: 7
difficulty: advanced
synonyms: ["what is infrastructure as code", "how does terraform work", "terraform for beginners", "terraform plan apply explained", "what is terraform state", "why use terraform instead of clicking in the console", "iac vs clickops"]
updated: 2026-06-19
---

# Infrastructure as Code (Terraform Basics)

You've built a server by clicking through a cloud console. It worked. Then three months later someone asks "how exactly is the staging environment set up?" and the real answer is: nobody knows. Somebody clicked some things, once, and the only record is the running machine itself. Rebuild it from scratch and you'll get something *close*, but not the same.

This guide is about getting out of that trap. **Infrastructure as Code (IaC)** means you describe your servers, networks, databases, and DNS in plain-text files - the same kind of files you already commit, review, and diff - and a tool reads those files and makes the cloud match them. We'll use **Terraform**, because it's the tool you're most likely to meet at work, and because once you understand its three ideas, you understand the whole category.

By the end you'll know *why* click-ops doesn't scale, *how* Terraform's core loop works, and *how* to use it without the two or three mistakes that scare people off it.

## How to read this

- **Want it to finally make sense?** Read in order - each phase builds on the last. The whole guide rests on one idea (you declare *desired state*, not steps), and Phase 1 installs it.
- **Already using Terraform and something bit you?** Phase 3 is the safety-and-danger phase: drift, destroy, and secrets in state. Start there.

## The phases

1. **[Why Click-Ops Doesn't Scale](01-why-click-ops-doesnt-scale.md)** - why clicking in a console is unrepeatable, undocumented, and quietly drifts, and the mental shift IaC asks of you: declare *what you want*, not *what to do*.
2. **[How Terraform Works](02-how-terraform-works.md)** - the `.tf` files that describe resources, the core loop `init` → `plan` → `apply`, and **state**, the file where Terraform records what it built. Annotated HCL and real `plan` output.
3. **[Using It Safely](03-using-it-safely.md)** - plan-before-apply as a habit, modules for reuse, and the real dangers: drift, destroy operations, and secrets ending up in state.

> This is the *basics*. Deeper material - writing your own modules, workspaces and environments, CI/CD pipelines that run Terraform, and the testing tools around it - is deliberately left for a follow-up guide so this one stays a clean on-ramp.

**Related guides:** [Cloud Platforms Explained](/guides/cloud-platforms-explained) (what the resources Terraform creates actually *are*) · [Git With Other People](/guides/git-with-other-people) (the review-and-merge habits that make IaC safe on a team).
