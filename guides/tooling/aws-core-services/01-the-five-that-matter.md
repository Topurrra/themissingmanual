---
title: "The five services that matter"
guide: aws-core-services
phase: 1
summary: "The handful of AWS services behind most apps: S3, EC2, RDS, IAM, and Lambda - what each does, how they fit together, and the IAM model that gates it all."
tags: [aws, cloud, s3, ec2, rds, iam, lambda]
difficulty: intermediate
synonyms: ["aws basics", "aws core services explained", "s3 ec2 rds iam lambda", "aws for beginners", "what aws services do i need", "aws iam explained", "how aws services fit together"]
updated: 2026-06-30
---

# The five services that matter

Open the AWS console and you're greeted by a search box and a graveyard of acronyms: EKS, ECS, SQS, SNS, EBS, EFS, ELB, KMS, VPC, on and on. It feels like you're supposed to know all of them. You're not. That long list exists because AWS sells to everyone from a solo developer to a bank's payments division, and most of those services solve problems you will never have.

Strip it down and a normal web application - the kind you'd actually build - leans on a small core. Here's the whole mental model in one breath: you need somewhere to keep files, somewhere to run code, somewhere to store structured data, a way to say who's allowed to touch what, and a way to run small bits of code without managing a server. That's five things.

## The five, in plain language

| Service | What it is | The everyday job |
|---------|-----------|------------------|
| **S3** | Object storage | Holds files: images, uploads, backups, static sites |
| **EC2** | Virtual machines | A rented computer you SSH into and run things on |
| **RDS** | Managed relational database | A PostgreSQL/MySQL database AWS babysits for you |
| **IAM** | Identity and access management | The rules for who-can-do-what across everything above |
| **Lambda** | Serverless functions | Run a function on an event; no server to keep alive |

Read that table twice. Almost every "how do I do X on AWS" question for a typical app resolves to one of these five, or to a combination of them.

## S3 - the bucket you throw files into

S3 (Simple Storage Service) is where files live. Not a filesystem with folders and a disk you mount - an **object store**. You give it a key (a string that looks like a path) and some bytes, and it hands them back later when you ask for that key. It's effectively bottomless, durable, and cheap, and it's usually the first AWS service anyone actually uses.

```bash
# Upload a file to a bucket named "my-app-uploads"
aws s3 cp ./avatar.png s3://my-app-uploads/users/42/avatar.png

# List what's in there
aws s3 ls s3://my-app-uploads/users/42/
```

*What just happened:* you stored `avatar.png` under the key `users/42/avatar.png`. That slash-separated key *looks* like a folder path, but there are no real folders - it's one flat namespace of keys, and the slashes are a convention the console renders as folders. Your app fetches that object later by the exact same key.

If you want the full mental model of object storage - why it's flat, how durability works, presigned URLs - there's a dedicated guide at [/guides/object-storage-s3](/guides/object-storage-s3). For now, "files go in S3" is enough.

## EC2 - a computer you rent by the hour

EC2 (Elastic Compute Cloud) is a virtual machine: a Linux (or Windows) box running in an AWS data center that you control. You pick a size, it boots, you SSH in, and from there it's a normal server - install your runtime, run your app, open a port.

```bash
# Connect to an EC2 instance by its public address
ssh -i my-key.pem ec2-user@ec2-13-57-1-99.compute.amazonaws.com

# Now you're on the box - it's just Linux
[ec2-user@ip-10-0-1-23 ~]$ sudo dnf install -y nodejs
[ec2-user@ip-10-0-1-23 ~]$ node server.js
```

*What just happened:* you logged into a machine that didn't exist an hour ago and ran your app on it. The `-i my-key.pem` is your SSH private key - EC2 hands you the matching public key at launch, and that key pair is how you prove it's you. The instance is yours until you stop or terminate it, and you pay for the time it runs.

EC2 is the "give me a server, I'll handle the rest" option. Maximum control, maximum responsibility: patching, scaling, and uptime are now your job.

## RDS - a database without the babysitting

You *could* install PostgreSQL on an EC2 box yourself. RDS (Relational Database Service) is the version where AWS does the tedious, easy-to-get-wrong parts: backups, version patching, failover to a standby if the primary dies. You choose the engine (PostgreSQL, MySQL, MariaDB, and others) and the size; AWS runs the database and hands you a connection endpoint.

```bash
# Connect to an RDS PostgreSQL database, same as any Postgres
psql -h mydb.abc123.us-east-1.rds.amazonaws.com -U appuser -d production
```

*What just happened:* you connected to a managed Postgres instance using the ordinary `psql` client. From your application's point of view it's a normal database at a hostname. The difference from self-hosting is invisible until 2am, when a hardware failure that would have woken you up instead triggers an automatic failover you read about in the morning.

> The trade is control for convenience. You can't `ssh` into an RDS box or touch the OS - AWS owns that layer. In exchange, the boring, high-stakes database chores stop being yours.

## IAM - the rulebook everything obeys

IAM (Identity and Access Management) is the one that's different in kind, not only in job. The other four *do* something - store, compute, query. IAM **governs** all of them. It answers one question, constantly: *is this identity allowed to perform this action on this resource?*

Every API call to AWS - your `aws s3 cp` above, your Lambda reading from a bucket, a teammate clicking a button in the console - is checked against IAM before it runs. Get IAM right and the rest is safe. Get it wrong and you've either locked yourself out or left the front door open. Phase 3 is devoted to it, because it's the part most worth understanding deeply.

## Lambda - code without a server to keep alive

Lambda runs a single function in response to an event - an HTTP request, a file landing in S3, a message on a queue, a timer. You upload the function; AWS runs it when the event fires and bills you for the milliseconds it executes. No server to provision, patch, or keep idling.

```python
# A Lambda handler - AWS calls this function when an event arrives
def handler(event, context):
    name = event.get("name", "world")
    return {"statusCode": 200, "body": f"Hello, {name}!"}
```

*What just happened:* you defined a function AWS invokes on demand. The `event` is the trigger's payload (the HTTP request, the S3 notification, etc.); `context` carries runtime metadata. Between invocations there is no running process and no bill. This is the opposite end of the spectrum from EC2: EC2 is a machine you keep; Lambda is a function that materializes only when called.

## How to hold the five in your head

Line them up on a single axis - *how much do you manage versus how much AWS manages* - and they stop being a random list:

```text
You manage MORE                                    AWS manages MORE
   EC2  ───────────  RDS  ───────────────────────  Lambda
 (whole VM)     (managed DB,        (just your function;
                you skip the OS)     AWS runs everything else)
```

*What just happened:* the same spectrum explains S3 too - you manage *nothing* about the storage hardware, you only put and get objects. IAM sits off to the side as the gatekeeper for every box on this line. Once you see services as points on "how much is my problem," picking the right one becomes a question you can actually answer.

```quiz
[
  {
    "q": "Which AWS service is the right home for user-uploaded image files?",
    "choices": ["RDS", "S3", "IAM", "EC2"],
    "answer": 1,
    "explain": "S3 is object storage - its whole job is holding files like images, uploads, and backups by key."
  },
  {
    "q": "What does IAM actually do?",
    "choices": ["Runs your application code on a schedule", "Stores relational data with automatic backups", "Decides whether an identity may perform an action on a resource", "Provides a virtual machine you SSH into"],
    "answer": 2,
    "explain": "IAM governs the others - it answers 'is this identity allowed to do this action on this resource?' for every AWS API call."
  },
  {
    "q": "Compared to running a database yourself on EC2, what does RDS take off your plate?",
    "choices": ["Writing SQL queries", "Choosing the database engine", "Backups, patching, and failover", "Connecting with a client like psql"],
    "answer": 2,
    "explain": "RDS manages the tedious, high-stakes chores - backups, version patching, and failover - while you still write SQL and pick the engine."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Wiring them into an app →](02-wiring-an-app.md)
