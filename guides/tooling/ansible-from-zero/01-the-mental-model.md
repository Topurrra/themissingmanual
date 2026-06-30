---
title: "Ansible, From Zero"
guide: ansible-from-zero
phase: 1
summary: "Configuration management without agents: SSH into your servers and run idempotent playbooks that bring them to a desired state, every time."
tags: [ansible, configuration-management, automation, devops, ssh, idempotency]
difficulty: intermediate
synonyms: [ansible tutorial, ansible playbook, ansible inventory, configuration management, ansible roles, ansible vs terraform, agentless automation, ansible handlers]
updated: 2026-06-30
---

# What Ansible Actually Is

Picture the manual version of the job. You SSH into a web server, install nginx, copy a config file, start the service. Then you do it again on the second server. And the third. By the fourth you've made a typo, and now one box runs a slightly different config than the others. Nobody notices until 2am, when that one box behaves differently under load and you're trying to remember what you typed three weeks ago.

That gap — between "what I think is on the server" and "what is actually on the server" — is the whole problem Ansible exists to close. It's a configuration management tool: you describe the state a machine should be in, and Ansible makes the machine match that description. Not the steps to get there. The destination.

## Agentless: it's SSH underneath

Most of Ansible's competitors (Puppet, Chef, Salt in its classic mode) need an agent — a daemon running on every managed server, phoning home to a central master. That's another service to install, secure, monitor, and upgrade on every box. It's infrastructure to manage your infrastructure.

Ansible threw that out. There is no agent. The machine you run Ansible from (your laptop, a CI runner, a bastion host — the "control node") connects to each target over plain SSH, the same protocol you already use to log in. It pushes over a little Python, runs it, collects the result, and disconnects. The target needs two things it almost certainly already has: an SSH server and a Python interpreter.

```text
  control node                          managed nodes
 ┌────────────┐      SSH (push)        ┌────────────┐
 │  ansible   │ ─────────────────────▶ │  web-01     │
 │  + your    │ ─────────────────────▶ │  web-02     │
 │  playbooks │ ─────────────────────▶ │  db-01      │
 └────────────┘    no agent installed  └────────────┘
```

*What just happened:* The control node does all the thinking. The managed nodes run nothing special between runs — Ansible connects, acts, leaves. That's why it's called "push" (the control node initiates) and "agentless" (nothing persistent lives on the targets).

This is a real architectural choice with consequences. Push-over-SSH means you control exactly when changes happen — Ansible only does something when you run it. There's no background daemon drifting servers on its own schedule. The tradeoff: scaling to thousands of nodes means opening thousands of SSH connections from one place, which we'll deal with in Phase 3.

> If your SSH keys and access aren't already sorted, that's the real prerequisite here. See [/guides/ssh-and-keys](/guides/ssh-and-keys) — Ansible inherits whatever SSH setup you already have, including agents, jump hosts, and key auth.

## Idempotency: the idea that makes it click

Here's the concept that separates Ansible from a glorified shell-script runner. Read this carefully, because everything else depends on it.

A bash script says *do these steps*. An Ansible task says *ensure this state*. The difference shows up the second time you run it.

```bash
# A shell script — imperative, describes STEPS
useradd deploy
mkdir /opt/app
echo "PORT=8080" >> /etc/app.conf
```

*What just happened:* Run this once, it works. Run it twice, `useradd` errors because the user already exists, and the `echo >>` appends a *second* `PORT=8080` line to the config. The script isn't safe to re-run. Imperative scripts accumulate damage.

Now the Ansible way:

```yaml
# An Ansible task — declarative, describes STATE
- name: Ensure deploy user exists
  ansible.builtin.user:
    name: deploy
    state: present
```

*What just happened:* The `user` module checks whether a user named `deploy` already exists. First run: it doesn't, so Ansible creates it and reports **changed**. Second run: it does, so Ansible does nothing and reports **ok**. Same task, run a hundred times, and the system ends up identical every time. That property — running it again is always safe and converges to the same state — is **idempotency**.

This is why Ansible runs report counts like `changed=3 ok=12`. The `ok` items were already correct and left alone. You're not firing commands blind; you're asserting facts about the system and letting Ansible reconcile the difference. A run where everything is already correct shows `changed=0`, and that's the goal: a system that matches its definition.

## Why "modules" instead of raw commands

You might wonder why you'd write `ansible.builtin.user` instead of running `useradd`. Because raw commands aren't idempotent — that's the whole point. Modules are the idempotent building blocks. There's one for users, one for packages (`apt`, `dnf`, the generic `package`), one for files and templates, one for services, one for git checkouts, and hundreds more. Each one knows how to check the current state and change it only if needed.

You *can* run raw commands when you have to (the `command` and `shell` modules exist), but every time you reach for them you give up idempotency and take responsibility for it yourself. The skill of writing good Ansible is largely the skill of finding the right module instead of shelling out.

> For builders: think of a module as a tiny program that takes "desired state" as arguments, inspects reality, and makes the smallest change to close the gap. That's the same loop a reconciler runs in Kubernetes or Terraform — Ansible runs it once, on demand, over SSH, instead of continuously.

```quiz
[
  {
    "q": "What does 'agentless' mean for Ansible?",
    "choices": [
      "It runs without any configuration files",
      "There is no persistent daemon on managed nodes; the control node connects over SSH on demand",
      "It does not require SSH keys",
      "It manages only the local machine"
    ],
    "answer": 1,
    "explain": "Ansible pushes over SSH from a control node. Managed nodes need only an SSH server and Python — nothing persistent runs between executions."
  },
  {
    "q": "You run an Ansible task to ensure a user exists, twice. What happens on the second run?",
    "choices": [
      "It errors because the user already exists",
      "It creates a duplicate user",
      "It checks, sees the user exists, makes no change, and reports 'ok'",
      "It deletes and recreates the user"
    ],
    "answer": 2,
    "explain": "That's idempotency: the module checks current state and only changes what's needed. An already-correct system reports changed=0."
  },
  {
    "q": "Why prefer a module like 'user' over the 'command' module running 'useradd'?",
    "choices": [
      "Modules run faster than commands",
      "Modules are idempotent and check state; raw commands are not, so you'd own that logic yourself",
      "The command module is deprecated",
      "Modules don't need SSH"
    ],
    "answer": 1,
    "explain": "Modules know how to inspect current state and change only what's needed. Reaching for command/shell gives up that idempotency."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The Everyday Loop →](02-the-everyday-loop.md)
