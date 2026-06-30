---
title: "The Everyday Loop"
guide: ansible-from-zero
phase: 2
summary: "Configuration management without agents: SSH into your servers and run idempotent playbooks that bring them to a desired state, every time."
tags: [ansible, configuration-management, automation, devops, ssh, idempotency]
difficulty: intermediate
synonyms: [ansible tutorial, ansible playbook, ansible inventory, configuration management, ansible roles, ansible vs terraform, agentless automation, ansible handlers]
updated: 2026-06-30
---

# The Everyday Loop

Now the hands-on part. Day to day, Ansible is four things in a stack: an **inventory** that lists your machines, **playbooks** that say what to do to them, **variables** that let one playbook serve many machines, and **roles** that package it all up so you can reuse it. We'll build them in that order, because that's the order they depend on each other.

## Inventory: who am I talking to

Ansible needs to know what machines exist and how to reach them. That's the inventory. The simplest form is an INI-style file, usually named `hosts` or `inventory.ini`.

```ini
# inventory.ini
[web]
web-01 ansible_host=10.0.1.11
web-02 ansible_host=10.0.1.12

[db]
db-01 ansible_host=10.0.1.20

[production:children]
web
db

[web:vars]
ansible_user=deploy
```

*What just happened:* We defined two groups, `web` and `db`, with hosts in each. `production:children` makes a parent group containing both, so `production` means all five-ish boxes at once. `[web:vars]` sets `ansible_user=deploy` for every web host. Groups are how you target a slice of your fleet — "run this on `web`" — without listing machines one by one.

You can sanity-check what Ansible thinks your inventory looks like before touching anything:

```console
$ ansible-inventory -i inventory.ini --graph
@all:
  |--@production:
  |  |--@web:
  |  |  |--web-01
  |  |  |--web-02
  |  |--@db:
  |  |  |--db-01
  |--@ungrouped:
```

*What just happened:* `ansible-inventory --graph` renders the group tree so you can confirm grouping before you run a playbook. Cheap insurance against accidentally targeting the wrong set of hosts.

A quick connectivity check uses the `ping` module — which isn't ICMP ping, it's "can I SSH in and run Python here":

```console
$ ansible -i inventory.ini web -m ping
web-01 | SUCCESS => { "ping": "pong" }
web-02 | SUCCESS => { "ping": "pong" }
```

*What just happened:* The ad-hoc `ansible` command (not `ansible-playbook`) ran the `ping` module against the `web` group. `pong` back from both means SSH auth and Python are working. If this fails, fix it before writing playbooks — every playbook depends on this working.

## Playbooks: plays, tasks, modules

A playbook is a YAML file describing what to do. The structure has three nested layers, and the names matter:

- A **play** maps a group of hosts to a list of tasks (`hosts: web` plus the tasks for web servers).
- A **task** is one step — it calls one module with some arguments and gets a `name` for the run log.
- A **module** is the idempotent unit of work from Phase 1 (`apt`, `copy`, `service`).

```yaml
# site.yml
- name: Configure web servers       # this is a PLAY
  hosts: web
  become: true                      # run tasks with sudo
  tasks:
    - name: Install nginx           # this is a TASK
      ansible.builtin.apt:          # this is a MODULE
        name: nginx
        state: present
        update_cache: true

    - name: Start and enable nginx
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true
```

*What just happened:* One play targets the `web` group, escalates to root with `become: true`, then runs two tasks. `apt` ensures nginx is installed; `service` ensures it's running now (`started`) and set to start on boot (`enabled`). Run it:

```console
$ ansible-playbook -i inventory.ini site.yml

PLAY [Configure web servers] ***************************
TASK [Install nginx] **********************************
changed: [web-01]
changed: [web-02]
TASK [Start and enable nginx] *************************
changed: [web-01]
changed: [web-02]

PLAY RECAP ********************************************
web-01  : ok=3  changed=2  unreachable=0  failed=0
web-02  : ok=3  changed=2  unreachable=0  failed=0
```

*What just happened:* Both tasks reported `changed` on the first run because nginx wasn't there yet. The `ok=3` includes an implicit fact-gathering step Ansible runs first. Run the exact same command again and you'll get `changed=0` — everything is already in the desired state. That `changed=0` on a re-run is your proof the playbook is idempotent.

> Before a risky change, run with `--check` (a dry run that reports what *would* change without doing it) and `--diff` (shows the actual file/line differences). Together they're your "show me what you're about to do" button.

## Variables: one playbook, many machines

Hardcoding `nginx` and version numbers into tasks doesn't scale. Variables let you parameterize. They can live in the playbook, in the inventory, or — the clean way — in `group_vars/` and `host_vars/` directories that Ansible loads automatically by group or host name.

```yaml
# group_vars/web.yml  — applies to every host in the 'web' group
app_port: 8080
worker_count: 4
```

```yaml
# in a task, used via Jinja2 templating
- name: Deploy nginx config
  ansible.builtin.template:
    src: nginx.conf.j2
    dest: /etc/nginx/nginx.conf
  notify: reload nginx
```

```text
# templates/nginx.conf.j2
worker_processes {{ worker_count }};
server {
    listen {{ app_port }};
}
```

*What just happened:* The `template` module renders `nginx.conf.j2` through Jinja2, substituting `{{ worker_count }}` and `{{ app_port }}` from `group_vars/web.yml`, and writes the result to the target. Change the variable, re-run, and the config updates everywhere — one source of truth, many machines. The `notify:` line is a trigger we'll explain next.

## Handlers: do something only when something changed

Restarting nginx on every run is wasteful and disruptive. You only want to reload it when its config actually changed. That's what handlers are for: a handler is a task that runs *only if* it was notified, and only *once* at the end of the play, no matter how many tasks notified it.

```yaml
  handlers:
    - name: reload nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded
```

*What just happened:* The `template` task above had `notify: reload nginx`. If the template task reports `changed` (the config differed), it queues the `reload nginx` handler. If the config was already correct, nothing is notified and nginx is left running undisturbed. The handler fires once at the end even if three different tasks notified it. This is how you get "reload the service, but only when its config actually moved."

## Roles: packaging it so you can reuse it

Once a playbook grows past a screen or two, you'll want structure. A **role** is a standard directory layout that bundles tasks, handlers, templates, defaults, and files for one responsibility — say, "set up an nginx web server" — so you can drop it into any playbook.

```text
roles/
  nginx/
    tasks/main.yml        # the tasks (auto-loaded)
    handlers/main.yml     # the handlers (auto-loaded)
    templates/nginx.conf.j2
    defaults/main.yml     # default variable values
```

```yaml
# site.yml — now it just composes roles
- name: Configure web servers
  hosts: web
  become: true
  roles:
    - nginx
    - app_deploy
```

*What just happened:* Ansible auto-discovers `tasks/main.yml`, `handlers/main.yml`, and `templates/` inside a role by convention — no paths to wire up. The playbook shrinks to a list of roles, and each role is independently reusable across projects. This is also how you consume other people's work: the public Ansible Galaxy registry is full of community roles for common software, installable with `ansible-galaxy`.

> In the wild: most real Ansible repos are a thin top-level playbook plus a `roles/` tree and `group_vars/`. The playbook reads like a table of contents; the roles hold the actual logic. When you inherit an Ansible codebase, read `site.yml` first, then the roles it lists.

```quiz
[
  {
    "q": "In Ansible's structure, what is a 'play'?",
    "choices": [
      "A single call to one module",
      "A mapping of a group of hosts to a list of tasks",
      "A directory of reusable templates",
      "The output recap of a run"
    ],
    "answer": 1,
    "explain": "A play binds hosts (like 'web') to the tasks that should run on them. Tasks call modules; a playbook is a list of plays."
  },
  {
    "q": "When does a handler actually run?",
    "choices": [
      "On every playbook run, always",
      "Before any tasks, at the start of the play",
      "Only if a task notified it, once, at the end of the play",
      "Once per task that notifies it"
    ],
    "answer": 2,
    "explain": "Handlers run only when notified by a changed task, and run a single time at the play's end no matter how many tasks notified them."
  },
  {
    "q": "What is the main benefit of organizing work into a role?",
    "choices": [
      "Roles run faster than plain playbooks",
      "Roles bundle tasks, handlers, templates, and defaults in a conventional layout you can reuse across playbooks",
      "Roles remove the need for an inventory",
      "Roles make tasks non-idempotent"
    ],
    "answer": 1,
    "explain": "A role is a standard directory structure that packages one responsibility so it's reusable and auto-discovered by Ansible."
  }
]
```

[← Phase 1](01-the-mental-model.md) | [Overview](_guide.md) | [Phase 3: Production Reality →](03-production-reality.md)
