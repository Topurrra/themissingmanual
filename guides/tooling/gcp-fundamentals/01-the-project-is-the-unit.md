---
title: "The project is the unit of everything"
guide: gcp-fundamentals
phase: 1
summary: "Google Cloud essentials: projects as the unit of organization, the core compute and storage services, and IAM — with a quick map from AWS terms."
tags: [gcp, google-cloud, cloud, iam, compute-engine, cloud-storage, bigquery]
difficulty: intermediate
synonyms: ["google cloud platform basics", "gcp for beginners", "gcp vs aws terms", "google cloud projects iam", "gcp core services", "learn google cloud"]
updated: 2026-06-30
---

# The project is the unit of everything

Before you spin up a single server, there's one idea that decides whether GCP feels organized or chaotic: the **project**. Every virtual machine, every storage bucket, every database, every API key, every dollar of billing — all of it lives inside a project. There is no "loose" resource floating outside one. Get this, and the console stops being scary.

Think of a project as a labeled box. Everything you create goes in a box. Boxes have their own bill, their own access rules, and their own enabled features. You can have many boxes — one for your side project, one for a client, one for "experiments I'll delete next week" — and they don't leak into each other. Delete the box, and everything inside it goes too. That last part is a feature: a project is the cleanest delete button in the cloud.

## A project has three names, and that trips everyone up

When you create a project, GCP asks for a display name and generates an ID. People conflate them and then can't figure out why a command fails. There are three identifiers:

```text
Project name:    "My Side Project"      ← human label, you can change it
Project ID:      my-side-project-481923 ← globally unique, permanent, used in commands
Project number:  738201947562           ← auto-assigned integer, used by some APIs
```

*What just happened:* you saw the three IDs side by side. The **Project ID** is the one you'll type all day — it's globally unique across all of Google Cloud, so GCP often appends random digits to keep it unique, and you can never change it after creation. Pick it deliberately.

When a command or config asks for a project, it almost always wants the **ID**, not the name:

```bash
# Set the active project for every gcloud command that follows
gcloud config set project my-side-project-481923

# Confirm what you're pointed at
gcloud config get-value project
# → my-side-project-481923
```

*What just happened:* you told the `gcloud` CLI which box to operate in. Every resource you create from here lands in that project until you change it. Running a `create` command without knowing your active project is how people accidentally build things in the wrong box.

## Why projects? Because the alternative is a mess

Other clouds let you pile resources into one big account and sort them out later with tags. That works until it doesn't — your dev experiment and your production database share a billing total, share permission boundaries, and one fat-fingered delete can hit the wrong thing.

GCP made the boundary structural instead of optional. Because billing, IAM, and enabled APIs all attach to the project, isolation is the default, not something you remember to configure. Want to give a contractor access to one app and nothing else? Put that app in its own project and grant them access to that project. Done — there's no way for them to wander into your other work.

## The hierarchy above the project

Projects don't float in a vacuum. In a company, they sit inside a tree:

```text
Organization (your-company.com)
└── Folder: Engineering
    ├── Folder: Production
    │   ├── Project: web-prod
    │   └── Project: data-prod
    └── Folder: Staging
        └── Project: web-staging
```

*What just happened:* you saw the resource hierarchy. The **Organization** maps to your company's domain. **Folders** group projects (by team, environment, whatever). **Projects** hold the actual resources. The point of the tree: permissions and policies set high up flow **downward**. Grant someone a role at the Engineering folder, and it applies to every project beneath it. Set a policy on the Organization, and it covers everything.

If you're an individual with a personal Google account, you skip the Organization and Folders entirely — you have projects directly under your account. That's completely normal and everything in this guide still applies.

> **The big idea:** A resource inherits permissions from its project, its folder, and its organization, top to bottom. When you're confused about why someone can (or can't) access something, walk up the tree. The grant is almost always at a level above where you were looking.

## For builders

The practical habit that pays off forever: **one project per environment**, never one project for everything. A `myapp-dev`, a `myapp-prod`, and maybe a `myapp-staging`. It costs nothing to have extra projects, and it means a mistake in dev can't physically reach prod — different box, different billing line, different access list. When you eventually automate deploys, your scripts target a project ID, and swapping `-dev` for `-prod` is the whole difference between environments.

```quiz
[
  {
    "q": "Which project identifier is globally unique, permanent, and what most gcloud commands expect?",
    "choices": ["Project name", "Project ID", "Project number", "Billing account ID"],
    "answer": 1,
    "explain": "The Project ID is globally unique and cannot be changed after creation; the name is a mutable human label and the number is an auto-assigned integer."
  },
  {
    "q": "In the GCP resource hierarchy, how do permissions and policies flow?",
    "choices": ["Upward, from project to organization", "Downward, from organization/folder to project", "Sideways between sibling projects", "They don't inherit; each resource is independent"],
    "answer": 1,
    "explain": "Roles and policies set at the organization or folder level are inherited by everything beneath them, so isolation and access are managed top-down."
  },
  {
    "q": "What is the recommended way to isolate a development environment from production in GCP?",
    "choices": ["Use tags on resources in one shared project", "Put each environment in its own project", "Use one project but separate regions", "Use one project with different service accounts"],
    "answer": 1,
    "explain": "Because billing, IAM, and enabled APIs attach to the project, one project per environment gives structural isolation a mistake in dev cannot cross."
  }
]
```

[← Overview](_guide.md) · [Phase 2: The services you'll actually use →](02-the-services-you-use.md)
