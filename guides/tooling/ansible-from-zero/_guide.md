---
title: "Ansible, From Zero"
guide: ansible-from-zero
phase: 0
summary: "Configuration management without agents: SSH into your servers and run idempotent playbooks that bring them to a desired state, every time."
tags: [ansible, configuration-management, automation, devops, ssh, idempotency]
category: tooling
group: "Infrastructure as Code"
order: 24
difficulty: intermediate
synonyms: [ansible tutorial, ansible playbook, ansible inventory, configuration management, ansible roles, ansible vs terraform, agentless automation, ansible handlers]
updated: 2026-06-30
---

# Ansible, From Zero

You have a handful of servers, and right now they drift. You SSH in, run a few commands, edit a config by hand, forget which box got the fix and which didn't. Three months later nobody knows what's actually installed where. Ansible kills that whole class of problem: you write down the state you want once, run it, and every server matches. Run it again next week and nothing changes, because everything is already correct.

## How to read this

Go in order. Phase 1 builds the mental model: agentless push over SSH, and the one idea that makes Ansible click — idempotency. Phase 2 is the everyday loop: inventory, playbooks, variables, roles, handlers. Phase 3 is production reality — what breaks, where Ansible is the wrong tool, and how it sits next to provisioning tools. You can run every example on one Linux box or a cheap VM; you don't need a fleet.

## The phases

1. [What Ansible Actually Is](01-the-mental-model.md) — agentless config management, push over SSH, and why idempotency changes everything.
2. [The Everyday Loop](02-the-everyday-loop.md) — inventory, playbooks, modules, variables, roles, and handlers in the order you'll actually use them.
3. [Production Reality](03-production-reality.md) — gotchas, scaling, secrets, and where Ansible ends and Terraform begins.

[Phase 1: What Ansible Actually Is](01-the-mental-model.md) →
