---
title: "The Building Blocks (Across Vendors)"
guide: "cloud-platforms-explained"
phase: 2
summary: "The handful of cloud pieces that actually matter - compute (EC2/Compute Engine/VMs), object storage (S3/Cloud Storage/Blob), managed databases (RDS/Cloud SQL/Azure SQL), networking (VPC), and identity (IAM) - explained once and name-mapped across AWS, GCP, and Azure."
tags: [cloud, ec2, s3, rds, vpc, iam, compute, object-storage, managed-database, networking]
difficulty: intermediate
synonyms: ["what is ec2", "what is s3", "what is rds", "what is a vpc", "what is iam", "aws gcp azure service name mapping", "object storage vs database", "managed database explained"]
updated: 2026-07-10
---

# The Building Blocks (Across Vendors)

In Phase 1 you learned the four buckets. Now we open them and name the five or six pieces you'll meet on
almost any project - enough that when a teammate says "put it in S3" or "give the function an IAM role,"
you know exactly what they mean, on any of the three platforms. Each block gets what it is, what it's for
(and *not* for), a real command, and what each vendor calls it. The full name-mapping table is at the end.

## 1. Compute - a machine to run your code

A computer you rent: CPU, memory, a disk, an operating system. Pick a size, it boots, and you run your
program on it like a laptop, except it lives in the provider's data center. The classic form is a
**virtual machine (VM)**: a full computer, simulated in software, that behaves like a real one - this is
where your application server, background workers, and batch jobs run. "Spin up an instance" means *rent
one of these and boot it*.

📝 **Virtual machine (VM).** A complete simulated computer carved out of a bigger physical one. It has
its own OS and feels like a dedicated machine, though the provider may run several VMs on the same
hardware. To your code, it's just "a Linux box."

Example (AWS):
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
*What just happened:* AWS returned an `InstanceId` - your handle for that machine - with state
`pending`, meaning it's booting. From the moment it reaches `running`, the meter is on until you stop it.

**What each vendor calls it:** AWS **EC2** (Elastic Compute Cloud), GCP **Compute Engine**, Azure
**Virtual Machines**.

## 2. Object storage - a bottomless bucket for files

A place to store **files** - images, videos, backups, logs, uploads - that's effectively limitless, very
durable, and reached by a name rather than a file path. You `put` a file under a key and later `get` it
back by that key; no disk to mount. Each file is an **object**, living in a container called a
**bucket**. Anything file-shaped lands here because it's cheap per gigabyte and you never run out of room.

⚠️ **Object storage is not a database and not a hard drive.** You can't query it ("give me all uploads
from June"), and you can't edit byte 4,000 in place - you replace the whole object. It's for *whole files
you read and write as a unit*, not *structured data you query or rows you update*. Reaching for object
storage when you needed a database is one of the most common early cloud mistakes.

Example (S3):
```console
$ aws s3 cp report.pdf s3://acme-uploads/reports/report.pdf
upload: ./report.pdf to s3://acme-uploads/reports/report.pdf
```
*What just happened:* The file is stored under the key `reports/report.pdf` in bucket `acme-uploads`.
That `reports/` looks like a folder, but object storage is a flat namespace of keys - slashes are just
for readability.

**What each vendor calls it:** AWS **S3** (Simple Storage Service), GCP **Cloud Storage**, Azure **Blob
Storage**.

## 3. Managed databases - a database without the sysadmin job

The headline *managed service* from Phase 1. You still get a real database - usually PostgreSQL or
MySQL - but you don't install it, patch it, configure replication, or set up backups by hand. Choose the
engine and size, click create, and the provider hands you a hostname and port, then keeps it running,
patched, and backed up. This lets a small team have a well-run production database without hiring the
person who runs databases - the trade is cost (a premium over raw VMs) and less control over the deep
knobs.

Example (RDS):
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
*What just happened:* `creating` means RDS is provisioning the machine, installing PostgreSQL, and
wiring up automated backups. Minutes later you get an endpoint to connect to - no `apt install
postgresql` required.

**What each vendor calls it:** AWS **RDS** (Relational Database Service), GCP **Cloud SQL**, Azure
**Azure SQL Database** / **Azure Database for PostgreSQL/MySQL**.

> 📝 "Relational" means tables, rows, and SQL - the same Postgres/MySQL you may already know. All three
> also sell other database *kinds* (key-value, document, graph), but managed-relational is the one
> you'll meet first and most often.

## 4. Networking (VPC) - your own private slice of the network

By default you don't want your database exposed to the open internet. A **VPC** (Virtual Private Cloud)
is your own private, walled-off network *inside* the provider - machines talk to each other freely, but
the outside world can't reach in unless you explicitly open a door. A typical setup: web servers sit in a
part reachable from the internet (through a load balancer); the database sits in a part that isn't,
accepting connections only from those web servers. Most "my app can't reach the database" mysteries are
network rules, not code - a security group blocking the connection, or a database placed where the app
can't reach it - so when connectivity breaks, look here first.

📝 **VPC (Virtual Private Cloud).** A logically isolated network you own within the provider. Your
instances, databases, and load balancers live inside it with private addresses; you control exactly
which traffic is allowed in from the internet and which stays internal.

**What each vendor calls it:** AWS **VPC**, GCP **VPC**, Azure **Virtual Network (VNet)**. (Two of three
literally agree on the name.)

## 5. Identity & permissions (IAM) - who is allowed to do what

**IAM** (Identity and Access Management) decides *who* (a person, or a piece of software) is allowed to
do *what* (read this bucket, start that machine, touch nothing else) - it's the lock on every door in the
cloud. The non-obvious part: IAM isn't only for *people*. Your running code gets an identity too, via a
**role** - "this machine may read the `acme-uploads` bucket and nothing else" - so your code reads files
without a password or key hard-coded into it. That confuses everyone at first, because we're used to
identities being human.

📝 **Role.** A bundle of permissions that an identity - often running software, not a person - *assumes*
to do its job. Roles are how code gets permissions without hard-coded credentials.

Example (who am I):
```console
$ aws sts get-caller-identity
{
    "UserId": "AIDAEXAMPLE12345",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/nika"
}
```
*What just happened:* AWS identified the credentials you're acting as - IAM user `nika`. Every command
is checked against what *that* identity is allowed to do; if `nika` lacked permission, the command would
have been denied regardless of how correct it was.

⚠️ **IAM is where people grant too much "to make it work."** When something is denied, the tempting fix
is broad, sweeping permissions so the error goes away - that's how over-permissioned systems are born,
and a leaked over-permissioned credential turns a small mistake into a big breach. The honest fix: grant
the *specific* permission the action needed. More on why IAM is the gotcha that scales worst in
[Phase 3](03-iaas-paas-serverless.md).

**What each vendor calls it:** AWS **IAM**, GCP **IAM**, Azure **Entra ID** (formerly Azure AD) for
identities plus **RBAC** for permissions.

## The cheat sheet: one concept, three names

The left column is what's worth learning; the rest is translation.

| Concept | What it's for | AWS | GCP | Azure |
|---|---|---|---|---|
| **Compute (VM)** | Run your code | EC2 | Compute Engine | Virtual Machines |
| **Object storage** | Store files / blobs | S3 | Cloud Storage | Blob Storage |
| **Managed relational DB** | A database, run for you | RDS | Cloud SQL | Azure SQL Database |
| **Private network** | Isolate & control traffic | VPC | VPC | Virtual Network (VNet) |
| **Identity / permissions** | Who can do what | IAM | IAM | Entra ID + RBAC |

💡 **Key point.** Five rows cover the large majority of everyday cloud conversation across all three
platforms. The other one-hundred-and-ninety service names are variations and specializations layered on
top of these.

## Recap

1. **Compute** - rented machines that run your code.
2. **Object storage** - a bottomless bucket for *files*; not a database, not an editable disk.
3. **Managed databases** - a real database the provider runs, patches, and backs up for you.
4. **Networking** - your private walled-off network; where connectivity is granted or denied.
5. **Identity** - who, human or code, is allowed to do what.

You now have the nouns. The last question is how *managed* you want each piece to be - and the trade-offs
hiding in that choice.

---

[← Phase 1: What "The Cloud" Actually Sells](01-what-the-cloud-sells.md) · [Guide overview](_guide.md) · [Phase 3: IaaS vs PaaS vs Serverless →](03-iaas-paas-serverless.md)
