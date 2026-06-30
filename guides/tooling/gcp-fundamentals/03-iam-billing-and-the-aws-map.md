---
title: "IAM, billing, and the AWS map"
guide: gcp-fundamentals
phase: 3
summary: "Google Cloud essentials: projects as the unit of organization, the core compute and storage services, and IAM - with a quick map from AWS terms."
tags: [gcp, google-cloud, cloud, iam, compute-engine, cloud-storage, bigquery]
difficulty: intermediate
synonyms: ["google cloud platform basics", "gcp for beginners", "gcp vs aws terms", "google cloud projects iam", "gcp core services", "learn google cloud"]
updated: 2026-06-30
---

# IAM, billing, and the AWS map

This is the phase where theory meets the parts that actually hurt: who can do what (IAM), where the money goes (billing), and the term-for-term translation if your brain already speaks AWS. These are the three things that surprise people in production - an over-permissioned service account, a bill nobody predicted, and a word that means something different than you assumed.

## IAM: who can do what, on which resource

GCP's access model is one sentence: **a member has a role on a resource.** That's the whole grammar. Pin those three words down and IAM stops being mysterious.

- **Member** - the *who*. A user (`alice@example.com`), a group, or a **service account** (a robot identity for code).
- **Role** - the *what*. A bundle of permissions, like "can read storage" or "can administer Cloud SQL."
- **Resource** - the *where*. A project, a folder, the whole org, or sometimes a single bucket.

```bash
# Grant Alice the role to view (not change) everything in a project
gcloud projects add-iam-policy-binding my-project \
  --member="user:alice@example.com" \
  --role="roles/viewer"
```

*What just happened:* you bound a member to a role on a resource. That triple - member, role, resource - is called a **policy binding**, and it's the atomic unit of all GCP access. Note this grant was at the **project** level, so it covers every resource in the project. Remember Phase 1: grant it on a folder instead, and it would flow down to every project inside.

### The three flavors of role

```text
Basic roles:       Owner / Editor / Viewer   ← broad, blunt, project-wide
Predefined roles:  roles/storage.objectAdmin ← curated per-service, scoped
Custom roles:      you pick the exact permissions ← when predefined is too much
```

*What just happened:* you saw the role ladder from blunt to precise. **Basic** roles (Owner/Editor/Viewer) are the tempting default and the classic mistake - `Editor` can change almost anything in the project. **Predefined** roles are the right daily choice: hundreds of them, each scoped to one service and one job. **Custom** roles exist for when even predefined is broader than you want. The rule that keeps you safe: grant the narrowest role that gets the job done, never `Owner` "to keep things simple."

### Service accounts: the part people get wrong

A **service account** is an identity for code, not a person - your Cloud Run service, your VM, your CI pipeline all act *as* a service account. Two habits separate the safe from the breached:

1. **Give each workload its own service account with only the roles it needs.** If your thumbnail function only reads and writes one bucket, it gets exactly that - not `Editor`. When something is compromised, the blast radius is whatever that one account could do.
2. **Avoid downloadable service-account key files.** A JSON key is a long-lived password that doesn't expire and gets leaked into git history. On GCP, your code usually doesn't need one: a Cloud Run service or VM automatically *is* its attached service account, no key file involved.

> **The mistake that ends up in the postmortem:** giving a workload `Owner` or `Editor` because it was faster than figuring out the right predefined role, then exporting a key file "for local testing." Least privilege plus no key files is the difference between an incident and a non-event.

## Billing: where the money actually goes

Billing in GCP attaches to a **billing account**, which is linked to one or more projects. The bill is the project's; the payment method is the billing account's. Two things catch newcomers:

```text
Most common surprise charges:
  • Network egress  - data leaving GCP costs money; data in is usually free
  • Idle VMs        - Compute Engine bills while running, used or not
  • BigQuery scans  - SELECT * over a huge table can cost real money per run
  • Forgotten resources - a load balancer or static IP you stopped using
```

*What just happened:* you saw the usual culprits. The pattern behind all of them: **GCP bills for what's allocated, not only what's actively serving traffic.** A stopped-but-not-deleted VM with a disk still costs. The defense is cheap and built in - set a **budget alert** so an email lands when spend crosses a threshold you choose:

```bash
# List your billing accounts to find the one to attach a budget to
gcloud billing accounts list
# → ACCOUNT_ID            NAME                OPEN
#   0X0X0X-0X0X0X-0X0X0X  My Billing Account  True
```

*What just happened:* you found your billing account ID. From there you create a budget (in the console or `gcloud billing budgets`) that emails you at, say, 50% and 100% of a monthly cap. A budget alert doesn't stop spending - it warns you - but that warning is what turns a four-figure surprise into a same-day fix.

## The AWS → GCP term map

If you came from AWS, half your confusion is vocabulary. Here's the translation for the services and concepts in this guide:

```text
AWS                              GCP
------------------------------   --------------------------------
Account                          Project
Organizations / OUs              Organization / Folders
IAM user / role                  Member / Role (+ Service Account)
EC2                              Compute Engine
S3                              Cloud Storage (buckets)
RDS                             Cloud SQL
Lambda                          Cloud Functions
Fargate / App Runner            Cloud Run
Redshift / Athena              BigQuery
Availability Zone               Zone
Region                          Region
VPC                             VPC
CloudWatch                      Cloud Monitoring / Logging
```

*What just happened:* you got the cheat sheet. The one that reshapes your thinking is the first row: an **AWS account ≈ a GCP project**. In AWS, an account is a heavyweight thing you create sparingly; in GCP, projects are cheap and disposable, so you make many. That's why the GCP advice is "one project per environment" where the AWS instinct was "one account, separated by tags." Same isolation goal, different default-sized unit.

The other classic stumble: in AWS, **Redshift** and **Athena** are two different products (a cluster you size versus serverless query-on-S3). In GCP, **BigQuery** covers both jobs - it's serverless like Athena but a full warehouse like Redshift. If you're hunting the GCP "Redshift," stop; it's BigQuery.

## In the wild

When you land on a new GCP project, three questions tell you almost everything about its health: Who has Owner or Editor on it (run `gcloud projects get-iam-policy`)? Are there budget alerts? And are workloads using attached service accounts or leaked key files? Those three checks catch the overwhelming majority of "how did this happen" incidents - over-broad access, runaway spend, and stale credentials. For a wider comparison of GCP against the other major clouds and how to choose between them, see /guides/cloud-platforms-explained.

```quiz
[
  {
    "q": "What is the single-sentence grammar of GCP IAM?",
    "choices": ["A resource owns a member's role", "A member has a role on a resource", "A role contains members and resources", "A project grants policies to roles"],
    "answer": 1,
    "explain": "Every IAM grant is a binding of a member (who) to a role (what) on a resource (where) - that triple is the atomic unit of access."
  },
  {
    "q": "Which practice best limits damage if a workload's identity is compromised?",
    "choices": ["Give every workload the Editor role for convenience", "Use one shared service account across all workloads", "Give each workload its own service account with only the roles it needs", "Download a JSON key file for every workload"],
    "answer": 2,
    "explain": "Per-workload service accounts with least-privilege roles keep the blast radius to what that one account could do; avoiding key files removes a long-lived leakable credential."
  },
  {
    "q": "An engineer from AWS is looking for GCP's equivalent of an EC2 instance and an S3 bucket. Which pair is correct?",
    "choices": ["Cloud Run and BigQuery", "Compute Engine and Cloud Storage", "Cloud Functions and Cloud SQL", "Cloud SQL and Cloud Storage"],
    "answer": 1,
    "explain": "EC2 maps to Compute Engine (virtual machines) and S3 maps to Cloud Storage (object buckets)."
  }
]
```

[← Phase 2: The services you'll actually use](02-the-services-you-use.md) · [Overview](_guide.md)
