---
title: "Wiring them into an app"
guide: aws-core-services
phase: 2
summary: "The handful of AWS services behind most apps: S3, EC2, RDS, IAM, and Lambda - what each does, how they fit together, and the IAM model that gates it all."
tags: [aws, cloud, s3, ec2, rds, iam, lambda]
difficulty: intermediate
synonyms: ["aws basics", "aws core services explained", "s3 ec2 rds iam lambda", "aws for beginners", "what aws services do i need", "aws iam explained", "how aws services fit together"]
updated: 2026-06-30
---

# Wiring them into an app

Knowing what each service does is half the picture. The other half - the half that makes AWS finally feel like one system instead of five separate products - is seeing how they connect. So let's build the shape of an ordinary web app: a service where users sign up, upload a profile picture, and read some data. Nothing exotic. This is the stack under a huge fraction of what's running in production today.

## The shape of a typical stack

Here's the whole thing in one diagram. Read it top to bottom: the request comes in, hits your app, which talks to a database and a file store.

```text
        Browser
          │  HTTPS
          ▼
   ┌──────────────┐        ┌─────────────┐
   │  EC2 instance│──SQL──▶│     RDS     │  (your data: users, posts)
   │  (your app)  │        └─────────────┘
   └──────┬───────┘
          │ put/get objects
          ▼
   ┌──────────────┐
   │      S3      │  (profile pictures, uploads)
   └──────────────┘
```

*What just happened:* your application code runs on **EC2**, structured data (the users table, their posts) lives in **RDS**, and the heavy files (profile pictures) live in **S3**. The app is the hub; RDS and S3 are the two stores it reaches for. That triangle - compute plus a database plus a file store - is the backbone of most web apps, on AWS or anywhere.

## The request, step by step

Walk through one user uploading a profile picture, and watch the services hand off to each other.

1. The browser sends the image to your app on the EC2 instance.
2. Your app stores the bytes in S3 and gets back a key.
3. Your app saves *that key* (a short string) in RDS, on the user's row.
4. Later, to show the picture, the app reads the key from RDS and fetches the file from S3.

```sql
-- In RDS, you store the S3 key, never the image bytes themselves
UPDATE users
SET avatar_key = 'users/42/avatar.png'
WHERE id = 42;
```

*What just happened:* notice the division of labor. RDS holds a tiny string - the **key** - not the megabytes of image data. The actual bytes sit in S3, which is built for exactly that. Stuffing image blobs into your database is a classic early mistake: it bloats backups, slows queries, and costs more. The pattern "files in S3, the pointer to them in the database" is one you'll reuse forever.

## Where Lambda fits in

You don't strictly need Lambda for this app - EC2 can do everything. But Lambda shines for work that happens *in reaction to something* and doesn't need a server sitting idle. The cleanest example: the moment a file lands in S3, run code on it.

```text
   User uploads ──▶  S3  ──(object-created event)──▶  Lambda
                                                        │
                                                        ▼
                                              make a thumbnail,
                                              write it back to S3
```

*What just happened:* S3 emits an event whenever an object is created, and that event triggers a Lambda function automatically. The function generates a thumbnail and saves it back to S3 - all without your EC2 app lifting a finger or a dedicated server running 24/7 waiting for uploads. This **event-driven** style is where serverless earns its keep: spiky, occasional work that would otherwise need an always-on machine.

> A useful instinct: reach for EC2 for the long-running app that's always handling requests, and reach for Lambda for the bursty side-jobs hanging off events. Many real systems run both.

## The glue you can't see: IAM connects them too

Here's the part that surprises people. When your EC2 app writes to S3, or your Lambda reads from a bucket, *that's an AWS API call, and IAM checks it.* These services don't trust each other by default - every cross-service action needs permission.

The right way to grant it is a **role**: a bundle of permissions you attach to the EC2 instance or the Lambda function. The code then talks to S3 with no hardcoded keys at all, because the role provides temporary credentials automatically.

```python
# Code running on EC2 or Lambda with an attached role.
# Notice: no access keys anywhere - the role supplies them.
import boto3

s3 = boto3.client("s3")
s3.put_object(
    Bucket="my-app-uploads",
    Key="users/42/avatar.png",
    Body=image_bytes,
)
```

*What just happened:* `boto3` (the AWS SDK for Python) found credentials from the attached role automatically - you never wrote an access key or secret. The role says "this instance may put objects into `my-app-uploads`," IAM checks that on the call, and it succeeds. If you'd skipped the role, this exact code would fail with an access-denied error. We'll dig into how roles and policies are written in the next phase; for now, hold onto the idea that **IAM is the wiring between the services, not a thing off to the side.**

## For builders: the smallest viable AWS app

If you were standing up this app today, the minimum is smaller than you'd think:

```text
1 EC2 instance        →  runs your app
1 RDS database        →  holds your data
1 S3 bucket           →  holds your files
1 IAM role on the EC2 →  lets the app reach S3 and RDS safely
( Lambda - add later when you have event-driven work )
```

*What just happened:* four pieces get a real application online. You can grow from here - load balancers, multiple instances, caching - but none of that is required to ship. Starting with the core and adding only when a real need shows up keeps both your bill and your mental load down.

```quiz
[
  {
    "q": "When a user uploads a profile picture, what gets stored in RDS?",
    "choices": ["The full image bytes", "The S3 key pointing to the image", "Nothing - RDS isn't involved", "A thumbnail of the image"],
    "answer": 1,
    "explain": "RDS stores the short S3 key (a string); the actual image bytes live in S3. Files in S3, the pointer to them in the database."
  },
  {
    "q": "What's the best fit for generating a thumbnail the moment a file is uploaded to S3?",
    "choices": ["A cron job on the RDS instance", "A Lambda function triggered by the S3 object-created event", "Polling S3 from the browser", "A second EC2 instance running constantly"],
    "answer": 1,
    "explain": "S3 emits an event on object creation that triggers Lambda automatically - ideal for bursty, event-driven work with no idle server."
  },
  {
    "q": "How should code on EC2 get permission to write to an S3 bucket?",
    "choices": ["Hardcode an access key and secret in the source", "Use an IAM role attached to the instance", "Make the bucket fully public", "It doesn't need permission - same account"],
    "answer": 1,
    "explain": "An attached IAM role supplies temporary credentials automatically, so the code needs no hardcoded keys and IAM still checks every call."
  }
]
```

[← Phase 1: The five services that matter](01-the-five-that-matter.md) | [Overview](_guide.md) | [Phase 3: IAM, least privilege, and what bites you →](03-iam-and-what-bites-you.md)
