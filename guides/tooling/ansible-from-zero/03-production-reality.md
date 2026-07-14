---
title: "Production Reality"
guide: ansible-from-zero
phase: 3
summary: "Configuration management without agents: SSH into your servers and run idempotent playbooks that bring them to a desired state, every time."
tags: [ansible, configuration-management, automation, devops, ssh, idempotency]
difficulty: intermediate
synonyms: [ansible tutorial, ansible playbook, ansible inventory, configuration management, ansible roles, ansible vs terraform, agentless automation, ansible handlers]
updated: 2026-06-30
---

# Production Reality

The first time Ansible bites you, it's usually one of a few well-worn ways: a playbook that *looks* idempotent but isn't, secrets sitting in plain text, a run that hangs on three hundred hosts, or the slow realization that you're trying to use Ansible to do a job Terraform should be doing. Let's walk through each before it walks through you.

## The idempotency trap: command and shell

Phase 1 said modules are idempotent. The escape hatches - `command` and `shell` - are not, and they're the single most common source of "why does this report changed every time."

```yaml
# NOT idempotent - runs every time, always reports 'changed'
- name: Build the app
  ansible.builtin.shell: make build
```

*What just happened:* The `shell` module has no idea what "build the app" means or whether it's already done, so it runs `make build` on every single playbook execution and always reports `changed`. Your run never converges to `changed=0`.

You fix this by telling Ansible how to check:

```yaml
- name: Build the app
  ansible.builtin.shell: make build
  args:
    creates: /opt/app/dist/bundle.js   # skip if this file exists
```

*What just happened:* `creates:` tells the task "if this file already exists, you're done - skip me." Now it runs once and reports `ok` thereafter. For the inverse there's `removes:`, and for arbitrary conditions you pair a check task with `changed_when:` and `when:`. The rule of thumb: every `command`/`shell` task needs a guard, or it's a lie about idempotency.

## Secrets: never commit them in plain text

Database passwords, API tokens, TLS private keys - they end up in variables, and variables end up in git. Ansible ships a built-in answer: **Ansible Vault**, which encrypts files (or individual values) with a passphrase, so the ciphertext is safe to commit.

```console
$ ansible-vault encrypt group_vars/production/secrets.yml
New Vault password:
Confirm New Vault password:
Encryption successful

$ ansible-playbook -i inventory.ini site.yml --ask-vault-pass
Vault password:
```

*What just happened:* `ansible-vault encrypt` turned the secrets file into an encrypted blob - open it and you'll see ciphertext, not your password. At run time, `--ask-vault-pass` (or a password file referenced by `--vault-password-file`) decrypts it in memory. The plaintext never touches disk in the repo. Commit the encrypted file freely; guard the passphrase like any other credential.

## Scaling: SSH fan-out has limits

Agentless is elegant, but "one control node opens an SSH connection to every target" has a ceiling. By default Ansible runs against a batch of hosts at a time (the `forks` setting), so a run across hundreds of hosts proceeds in waves, not all at once.

```console
# crank up parallelism for a big fleet
$ ansible-playbook -i inventory.ini site.yml --forks 50
```

*What just happened:* `--forks 50` lets Ansible work 50 hosts in parallel instead of the conservative default. Higher fan-out finishes faster but loads the control node's CPU, memory, and network harder. For genuinely large fleets people add SSH pipelining, mitogen, or pull-mode (`ansible-pull`, where each node pulls and runs its own config from git on a schedule - flipping the push model). The straight summary: Ansible is superb for tens to low hundreds of hosts and needs care beyond that.

## Order, failure, and not breaking everything at once

A naive run hits every host in a group at full speed. For a rolling deploy you want the opposite - update a few, verify, move on - so one bad change doesn't take down the whole fleet simultaneously.

```yaml
- name: Rolling update
  hosts: web
  serial: 2            # two hosts at a time
  max_fail_percentage: 25
  tasks:
    - name: Deploy new release
      ansible.builtin.git:
        repo: https://example.com/app.git
        dest: /opt/app
        version: v2.1.0
```

*What just happened:* `serial: 2` updates the web group two hosts at a time instead of all at once, so a broken release fails on a small batch first. `max_fail_percentage: 25` aborts the whole run if more than a quarter of hosts fail - a circuit breaker that stops a bad change before it reaches everything. This is how you turn "config management" into a safe deploy.

## The big one: config management vs provisioning

This is the distinction that decides whether you've picked the right tool at all.

Ansible configures machines that **already exist**. It assumes there's a server at an IP, reachable over SSH, and it installs packages, writes configs, and starts services on it. It does not natively create the server, the network, the load balancer, or the DNS record. It's weak at managing the *lifecycle* of cloud resources, because it has no real state model of "what should exist."

Terraform is the mirror image. It **provisions** infrastructure - it creates and destroys cloud resources (VMs, networks, DNS, IAM) and tracks them in a state file so it knows exactly what exists and can reconcile drift in the resource graph. It's weak at the inside-the-box config that Ansible is great at.

```text
  Terraform                          Ansible
 ┌──────────────────────┐          ┌──────────────────────┐
 │ CREATE the servers,   │  hand    │ CONFIGURE the servers:│
 │ network, DNS, LB.     │   off →  │ packages, files,      │
 │ Tracks state of what  │          │ services, deploys.    │
 │ EXISTS.               │          │ Assumes they exist.   │
 └──────────────────────┘          └──────────────────────┘
```

*What just happened:* The common production pattern is both, in sequence: Terraform stands up the boxes and outputs their IPs, then Ansible configures what's inside them. They're complementary, not competing. If you find yourself fighting Ansible to manage cloud resources, that's the signal you want a provisioning tool. See [/guides/infrastructure-as-code-terraform](/guides/infrastructure-as-code-terraform) for the other half of this pairing.

> The shorthand that's stuck with me: Terraform owns the *shape* of your infrastructure (what exists and how it's wired); Ansible owns the *state inside* each piece. Reach for the one whose job matches your problem, and don't make either do the other's work.

```quiz
[
  {
    "q": "Why does a task using the 'shell' module to run 'make build' report 'changed' on every run?",
    "choices": [
      "shell is slower than other modules",
      "shell has no knowledge of whether the work is already done, so it always executes",
      "make is not supported by Ansible",
      "It needs become: true to be idempotent"
    ],
    "answer": 1,
    "explain": "command/shell aren't idempotent. Add a guard like creates:/removes: or changed_when: so the task can skip when already done."
  },
  {
    "q": "What does Ansible Vault give you?",
    "choices": [
      "A way to store inventory in the cloud",
      "Encryption of secret files/values with a passphrase so ciphertext is safe to commit to git",
      "Faster SSH connections",
      "Automatic provisioning of cloud servers"
    ],
    "answer": 1,
    "explain": "Vault encrypts secrets at rest; the passphrase decrypts them in memory at run time, so plaintext never lands in the repo."
  },
  {
    "q": "Which split between Terraform and Ansible is correct?",
    "choices": [
      "Terraform configures software inside servers; Ansible provisions cloud resources",
      "Terraform provisions/creates infrastructure and tracks its state; Ansible configures servers that already exist",
      "They do the same thing; pick either one",
      "Ansible tracks infrastructure state in a state file like Terraform"
    ],
    "answer": 1,
    "explain": "Terraform owns the shape of infra (what exists, tracked in state); Ansible owns the config inside existing machines. They're complementary."
  }
]
```

[← Phase 2](02-the-everyday-loop.md) | [Overview](_guide.md)
