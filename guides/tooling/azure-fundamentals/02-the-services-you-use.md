---
title: "The services you'll actually use"
guide: azure-fundamentals
phase: 2
summary: "Microsoft's cloud for people who know AWS or none: resource groups and subscriptions, the core compute/storage/database services, and Entra ID for identity."
tags: [azure, cloud, microsoft, entra-id, rbac, infrastructure]
difficulty: intermediate
synonyms: ["azure for aws people", "azure resource groups explained", "what is entra id", "azure rbac basics", "azure vs aws services", "azure subscriptions vs resource groups", "azure core services overview"]
updated: 2026-06-30
---

# The services you'll actually use

Azure has hundreds of services and a marketing page for every one of them. You will use maybe six of them ninety percent of the time. This phase is those six: how to think about each one, when to reach for it, and - if you already know AWS - what it maps to so you can stop translating in your head.

We'll group them the way you'll reach for them: compute (run my code), storage (hold my files), and databases (hold my structured data).

## The AWS-to-Azure map (read this first if you know AWS)

If you've used AWS, the fastest way into Azure is a translation table. The concepts are nearly identical; the names are different and occasionally the boundaries are drawn in slightly different places.

```text
AWS                          Azure
-----------------------------------------------------
EC2                       →  Virtual Machines (VMs)
S3                        →  Blob Storage (in a Storage Account)
RDS (managed SQL)         →  Azure SQL Database
Lambda                    →  Azure Functions
Elastic Beanstalk        →  App Service
IAM (identity)            →  Entra ID + Azure RBAC
VPC                       →  Virtual Network (VNet)
CloudFormation           →  ARM / Bicep templates
Account (per env)         →  Subscription
```

*What just happened:* most of your AWS instincts transfer directly. The biggest mental shift is identity - AWS folds users, roles, and permissions into one service (IAM), while Azure splits *who you are* (Entra ID) from *what you can do* (RBAC). We cover that split in phase 3.

## Compute: three ways to run your code

Azure gives you a ladder of compute, from "I manage everything" to "I manage almost nothing." Climb only as high as you need.

**Virtual Machines (VMs)** are a whole server you rent - you pick the OS, you patch it, you install your stack. Maximum control, maximum responsibility. Reach for a VM when you have software that needs a specific OS setup, or you're lifting an existing server into the cloud as-is.

```bash
# Spin up an Ubuntu VM in the blog-prod resource group
az vm create \
  --resource-group blog-prod \
  --name web-01 \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys
```

*What just happened:* you now have a full Linux box you can SSH into. You also now own its security patches, its uptime, and its disk. That's the tradeoff for total control.

**App Service** runs your web app or API without you touching the server. You hand it your code (or a container) and it handles the OS, patching, scaling, and HTTPS. This is the sweet spot for most web apps - far less to manage than a VM, far more structure than raw functions.

```bash
# Deploy a web app onto a shared App Service plan
az webapp up --name acme-blog --resource-group blog-prod --runtime "NODE:20-lts"
```

*What just happened:* `az webapp up` packaged your local app, created the hosting plan if needed, and deployed it behind a public HTTPS URL - no VM, no OS to patch.

**Azure Functions** run a single piece of code in response to an event (an HTTP request, a queue message, a timer) and bill you only while it runs. This is serverless: no server to think about, scales to zero when idle. Reach for Functions when your work is bursty or event-driven - a webhook handler, a nightly job, an image-resize trigger.

> Rule of thumb for compute: start at App Service for web apps and Functions for event-driven snippets. Drop down to a VM only when you genuinely need to own the operating system. Every rung down the ladder is more work you're signing up to do forever.

## Storage: the Storage Account and Blob Storage

Almost all unstructured storage in Azure lives inside a **Storage Account** - a top-level container that holds blobs (files), queues, tables, and file shares. The piece you'll use most is **Blob Storage**, which is object storage for files of any size: images, backups, logs, videos, static website assets. It's the S3 equivalent.

The structure is: a storage account holds *containers*, and containers hold *blobs*.

```bash
# Upload a file to a blob container
az storage blob upload \
  --account-name acmestorage \
  --container-name uploads \
  --name avatar.png \
  --file ./avatar.png
```

*What just happened:* your file now lives as a blob in the `uploads` container inside the `acmestorage` account, reachable by URL and durable across hardware failures. You didn't provision a disk or worry about size - blob storage grows as you add to it and you pay for what you store.

Blob storage also has **access tiers** - Hot for data you read often, Cool for infrequent access, and Archive for long-term cold storage you rarely touch. Moving stale data to a colder tier cuts cost; the colder the tier, the cheaper the storage but the slower (and pricier) the retrieval.

## Databases: Azure SQL and the managed-database idea

When you need a real relational database without running the database server yourself, reach for **Azure SQL Database** - a fully managed SQL Server engine. Microsoft handles patching, backups, and high availability; you connect, create tables, and run queries.

```sql
-- Once connected to your Azure SQL Database, it's ordinary SQL
CREATE TABLE posts (
  id        INT IDENTITY PRIMARY KEY,
  title     NVARCHAR(200) NOT NULL,
  body      NVARCHAR(MAX),
  published DATETIME2 DEFAULT SYSUTCDATETIME()
);
```

*What just happened:* this is plain T-SQL against a database you never installed or patched. The "managed" part means the operational chores - backups, failover, version upgrades - are Microsoft's job, not yours. You're paying for someone else to be on call for the database.

Azure also offers managed PostgreSQL and MySQL (the **Azure Database for PostgreSQL/MySQL** family) and a multi-model NoSQL service called **Cosmos DB** for globally distributed, low-latency workloads. Start with Azure SQL or managed Postgres unless you have a specific reason - Cosmos DB is powerful but priced and modeled differently, and overspending is easy if you adopt it without needing its global-scale features.

**In the wild:** a typical small web product on Azure is one resource group containing an App Service for the app, an Azure SQL Database for the data, and a Storage Account for user uploads - three resources, one lifecycle, deleted together when the project ends. That's the shape most projects converge on, and it maps cleanly onto the hierarchy from phase 1.

```quiz
[
  {
    "q": "You're deploying a standard web API and want minimal server management without going fully serverless. Which compute service fits best?",
    "choices": [
      "Virtual Machines",
      "App Service",
      "A management group",
      "Blob Storage"
    ],
    "answer": 1,
    "explain": "App Service runs your web app without you managing the OS, patching, or scaling - the sweet spot for most web apps, between a raw VM and event-driven Functions."
  },
  {
    "q": "In AWS terms, Azure Blob Storage is most like which service?",
    "choices": [
      "EC2",
      "RDS",
      "S3",
      "Lambda"
    ],
    "answer": 2,
    "explain": "Blob Storage is object storage for files of any size - Azure's equivalent of S3. It lives inside a Storage Account."
  },
  {
    "q": "What does 'managed' mean when describing Azure SQL Database?",
    "choices": [
      "You must manually patch and back up the database server",
      "Microsoft handles patching, backups, and high availability for you",
      "It can only be created through a management group",
      "It stores files instead of relational tables"
    ],
    "answer": 1,
    "explain": "A managed database means the operational chores - patching, backups, failover, upgrades - are the provider's responsibility; you just connect and run SQL."
  }
]
```

[← Phase 1](01-the-container-hierarchy.md) | [Overview](_guide.md) | [Phase 3: Identity, access, and production reality →](03-identity-and-production.md)
