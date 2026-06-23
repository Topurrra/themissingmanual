---
title: "The Building Blocks (Across Vendors)"
guide: "cloud-platforms-explained"
phase: 2
summary: "The handful of cloud pieces that actually matter — compute (EC2/Compute Engine/VMs), object storage (S3/Cloud Storage/Blob), managed databases (RDS/Cloud SQL/Azure SQL), networking (VPC), and identity (IAM) — explained once and name-mapped across AWS, GCP, and Azure."
tags: [cloud, ec2, s3, rds, vpc, iam, compute, object-storage, managed-database, networking]
difficulty: intermediate
synonyms: ["what is ec2", "what is s3", "what is rds", "what is a vpc", "what is iam", "aws gcp azure service name mapping", "object storage vs database", "managed database explained"]
updated: 2026-06-19
---

# The Building Blocks (Across Vendors)

In Phase 1 you learned the four buckets. Now we open them and name the actual pieces — the five or six
you'll meet on almost any project. The goal here is not to teach you every option inside each one (there
are dozens). It's to make sure that when a teammate says "put it in S3" or "give the function an IAM
role," you know exactly what kind of thing they're talking about, on any of the three platforms.

We'll do each block the same way: what it is, what it's *for* (and what it is emphatically *not* for),
and what each vendor calls it. The full name-mapping table is at the end so you can keep it open as a
cheat sheet.

## 1. Compute — a machine to run your code

**What it actually is.** A computer you rent: CPU, memory, a disk, an operating system. You pick a size
(small and cheap, or large and expensive), it boots, and you run your program on it the same way you'd
run it on a laptop — except this one lives in the provider's data center and you reach it over the
network. The classic form is a **virtual machine (VM)**: a full computer, simulated in software, that
behaves like a real one.

📝 **Virtual machine (VM).** A complete simulated computer carved out of a bigger physical one. It has
its own OS and feels like a dedicated machine, but the provider may be running several VMs on the same
physical hardware. To your code, it's just "a Linux box."

**What it does in real life.** This is where your application server, your background workers, your batch
jobs — your actual code — run. When someone says "spin up an instance," they mean *rent one of these and
boot it*.

**A real example** (renting and listing an instance on AWS):
```console
$ aws ec2 run-instances --image-id ami-0abcd1234 --instance-type t3.micro --count 1
{
    "Instances": [
        {
            "InstanceId": "i-0a1b2c3d4e5f67890",
            "InstanceType": "t3.micro",
            "State": { "Name": "pending" }
        }
    ]
}
```
*What just happened:* You asked AWS for one small virtual machine (`t3.micro`) running a particular base
image (an OS template). It returned an `InstanceId` — your handle for that machine — and a state of
`pending`, meaning it's booting. From the moment it reaches `running`, the meter is on until you stop it.

**What each vendor calls it:** AWS **EC2** (Elastic Compute Cloud), GCP **Compute Engine**, Azure
**Virtual Machines**.

## 2. Object storage — a bottomless bucket for files

**What it actually is.** A place to store **files** — images, videos, backups, logs, uploads, anything —
that is effectively limitless, very durable, and reached by a name rather than a file path. You don't
get a disk you mount; you `put` a file under a key and later `get` it back by that key. Each file is
called an **object**, and they live in a container called a **bucket**.

⚠️ **Object storage is not a database and not a hard drive.** You can't run a query against it ("give me
all uploads from June"), and you can't open a file, edit byte 4,000 in place, and save — you replace the
whole object. It's brilliant for *whole files you read and write as a unit*, and wrong for *structured
data you query or rows you update*. Reaching for object storage when you needed a database is one of the
most common early cloud mistakes.

**What it does in real life.** User profile pictures, video files, nightly database backups, static
website assets, data-pipeline outputs — anything file-shaped lands here, because it's cheap per gigabyte
and you never run out of room.

**A real example** (uploading a file to an S3 bucket):
```console
$ aws s3 cp report.pdf s3://acme-uploads/reports/report.pdf
upload: ./report.pdf to s3://acme-uploads/reports/report.pdf
```
*What just happened:* You copied a local file into the bucket `acme-uploads` under the key
`reports/report.pdf`. That `reports/` looks like a folder, but it's really just part of the object's
name — object storage is a flat namespace of keys, with slashes for human readability. The file is now
stored redundantly across the provider's infrastructure and retrievable by that exact key.

**What each vendor calls it:** AWS **S3** (Simple Storage Service), GCP **Cloud Storage**, Azure **Blob
Storage**.

## 3. Managed databases — a database without the sysadmin job

**What it actually is.** This is the headline *managed service* from Phase 1. You still get a real
database — usually a normal one like PostgreSQL or MySQL — but you don't install it, patch it, configure
replication, or set up backups by hand. You choose the engine and size, click create, and the provider
hands you a hostname and port. They keep it running, patch it, and back it up on a schedule.

**Why people reach for it.** Running a production database yourself is a genuine specialty — backups that
actually restore, failover when a machine dies, security patches applied without downtime. A managed
database lets a small team have a well-run database without hiring the person who runs databases. The
trade is cost (you pay a premium over raw VMs) and some loss of control over the deep knobs.

**A real example** (creating a managed PostgreSQL instance on AWS RDS):
```console
$ aws rds create-db-instance \
    --db-instance-identifier acme-prod \
    --engine postgres \
    --db-instance-class db.t3.medium \
    --allocated-storage 50 \
    --master-username admin
{
    "DBInstance": {
        "DBInstanceIdentifier": "acme-prod",
        "Engine": "postgres",
        "DBInstanceStatus": "creating"
    }
}
```
*What just happened:* You asked RDS for a managed PostgreSQL database — a `db.t3.medium`-sized machine
with 50 GB of storage. Status `creating` means it's provisioning the machine, installing and configuring
PostgreSQL, and wiring up automated backups for you. In a few minutes you'll get an endpoint your app
can connect to, and you'll never have run an `apt install postgresql` yourself.

**What each vendor calls it:** AWS **RDS** (Relational Database Service), GCP **Cloud SQL**, Azure
**Azure SQL Database** / **Azure Database for PostgreSQL/MySQL**.

> 📝 The "relational" part means tables, rows, and SQL — the same Postgres/MySQL you may already know.
> All three also sell other database *kinds* (key-value, document, graph), but the managed-relational
> service above is the one you'll meet first and most often.

## 4. Networking (VPC) — your own private slice of the network

**What it actually is.** By default you don't want your database sitting on the open internet where
anyone can knock on it. A **VPC** (Virtual Private Cloud) is your own private, walled-off network
*inside* the provider, where your machines can talk to each other freely but the outside world can't
reach in unless you explicitly open a door. It's the part of the cloud that answers "who can talk to
what."

📝 **VPC (Virtual Private Cloud).** A logically isolated network you own within the provider. Your
instances, databases, and load balancers live inside it with private addresses; you control exactly
which traffic is allowed in from the internet and which stays internal.

**What it does in real life.** A typical setup: your web servers sit in a part of the VPC that *can* be
reached from the internet (through a load balancer), while your database sits in a part that *can't* — it
only accepts connections from the web servers inside the VPC. That separation is what stops a stranger
from connecting straight to your database.

**Why this is where outages and "it can't connect" bugs live.** Most "my app can't reach the database"
mysteries in the cloud are network rules, not code: a firewall rule (a *security group*) that doesn't
allow the connection, or a database placed in a private subnet the app can't reach. When connectivity
breaks, the VPC is the first place to look.

**What each vendor calls it:** AWS **VPC**, GCP **VPC**, Azure **Virtual Network (VNet)**. (Two of three
literally agree on the name.)

## 5. Identity & permissions (IAM) — who is allowed to do what

**What it actually is.** **IAM** (Identity and Access Management) is the system that decides *who* (a
person, or a piece of software) is allowed to do *what* (read this bucket, start that machine, touch
nothing else). Every action in the cloud passes through it. It's the lock on every door.

The crucial, non-obvious part: IAM isn't only for *people*. Your running code gets an identity too. An
application server can be given a **role** that says "this machine may read the `acme-uploads` bucket and
nothing else" — so your code reads files without you ever putting a password or key in it. That's the
secure, intended pattern, and it confuses everyone at first because we're used to identities being human.

📝 **Role.** A bundle of permissions that an identity — often a piece of running software, not a person —
*assumes* to do its job. "The role attached to this server lets it read S3 and write to one queue."
Roles are how code gets permissions without hard-coded credentials.

**A real example** (asking AWS who you currently are):
```console
$ aws sts get-caller-identity
{
    "UserId": "AIDAEXAMPLE12345",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/nika"
}
```
*What just happened:* You asked AWS to identify the credentials you're acting as. It says you're the IAM
user `nika` in account `123456789012`. Every command you run is checked against what *that* identity is
allowed to do — if `nika` has no permission to start an EC2 instance, `run-instances` would have been
denied, no matter how correct the command was.

⚠️ **IAM is where people grant too much "to make it work."** When something is denied, the tempting fix
is to hand the identity broad, sweeping permissions so the error goes away. That's how over-permissioned
systems are born — and a leaked over-permissioned credential is how small mistakes become big breaches.
The honest fix is to grant the *specific* permission the action needed. We come back to why IAM is the
gotcha that scales worst in [Phase 3](03-iaas-paas-serverless.md).

**What each vendor calls it:** AWS **IAM**, GCP **IAM** (Identity and Access Management), Azure **Entra
ID** (formerly Azure AD) for identities plus **RBAC** (role-based access control) for permissions.

## The cheat sheet: one concept, three names

Keep this open. The left column is what's worth learning; the rest is translation.

| Concept | What it's for | AWS | GCP | Azure |
|---|---|---|---|---|
| **Compute (VM)** | Run your code | EC2 | Compute Engine | Virtual Machines |
| **Object storage** | Store files / blobs | S3 | Cloud Storage | Blob Storage |
| **Managed relational DB** | A database, run for you | RDS | Cloud SQL | Azure SQL Database |
| **Private network** | Isolate & control traffic | VPC | VPC | Virtual Network (VNet) |
| **Identity / permissions** | Who can do what | IAM | IAM | Entra ID + RBAC |

💡 **Key point.** Five rows. That's the working vocabulary that covers the large majority of everyday
cloud conversation across all three platforms. The other one-hundred-and-ninety service names are
variations and specializations layered on top of these.

## Recap

1. **Compute** (EC2 / Compute Engine / VMs) — rented machines that run your code.
2. **Object storage** (S3 / Cloud Storage / Blob) — a bottomless bucket for *files*; not a database, not
   an editable disk.
3. **Managed databases** (RDS / Cloud SQL / Azure SQL) — a real database the provider runs, patches, and
   backs up for you.
4. **Networking** (VPC / VPC / VNet) — your private walled-off network; where connectivity is granted or
   denied.
5. **Identity** (IAM / IAM / Entra ID + RBAC) — who, human or code, is allowed to do what.

You now have the nouns. The last question is how *managed* you want each piece to be — and the trade-offs
hiding in that choice.

---

[← Phase 1: What "The Cloud" Actually Sells](01-what-the-cloud-sells.md) · [Guide overview](_guide.md) · [Phase 3: IaaS vs PaaS vs Serverless →](03-iaas-paas-serverless.md)
