---
title: "IAM, least privilege, and what bites you"
guide: aws-core-services
phase: 3
summary: "The handful of AWS services behind most apps: S3, EC2, RDS, IAM, and Lambda - what each does, how they fit together, and the IAM model that gates it all."
tags: [aws, cloud, s3, ec2, rds, iam, lambda]
difficulty: intermediate
synonyms: ["aws basics", "aws core services explained", "s3 ec2 rds iam lambda", "aws for beginners", "what aws services do i need", "aws iam explained", "how aws services fit together"]
updated: 2026-06-30
---

# IAM, least privilege, and what bites you

This is the phase that earns the price of admission. Almost everyone who learns AWS learns the fun services first - spin up a server, store a file - and treats IAM as paperwork to skip. Then they spend a frustrating afternoon staring at `AccessDenied`, or worse, they read a headline about a company that left a bucket open. IAM is where AWS is genuinely hard and genuinely important. Understand its model and you've understood the thing that actually keeps your account safe.

## The shared-responsibility line

Start with the deal AWS is offering, because it sets up everything else. Security on AWS is split:

- **AWS secures the cloud** - the buildings, the hardware, the hypervisor, the network between data centers. Not your problem.
- **You secure what's *in* the cloud** - your data, who has access, how your app is configured, your IAM rules.

```text
   ┌─────────────────────────────────────────┐
   │  YOU:  data, access control, app config  │  ← your job
   ├─────────────────────────────────────────┤
   │  AWS:  hardware, network, data centers   │  ← AWS's job
   └─────────────────────────────────────────┘
```

*What just happened:* the line is drawn at the resources you create. AWS guarantees the floor is solid; what you put on it, and who you let in, is on you. Nearly every famous "AWS breach" is actually a customer-side misconfiguration - a permission left too wide - not AWS's infrastructure failing. Knowing which side of the line a problem sits on tells you who has to fix it.

## The four nouns of IAM

IAM has a small vocabulary. Learn these four and the policies stop looking like hieroglyphics.

| Term | What it is |
|------|-----------|
| **User** | A long-lived identity for a person (or sometimes a legacy script) |
| **Role** | An identity a service or person *assumes* temporarily, with no permanent password |
| **Policy** | A JSON document listing allowed (or denied) actions on resources |
| **Group** | A bucket of users that share a set of policies |

The one to internalize is **role**. A user has standing credentials that live forever until rotated. A role is borrowed: an EC2 instance or a Lambda function assumes a role and receives *temporary* credentials that expire on their own. That expiry is the whole point - there's no long-lived secret to leak.

## Reading a policy

A policy is the actual rulebook, and it's plain JSON. Here's one that lets something read and write objects in a single bucket - exactly what your app's role from Phase 2 would carry.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::my-app-uploads/*"
    }
  ]
}
```

*What just happened:* this grants two actions - `s3:GetObject` (read) and `s3:PutObject` (write) - and **only** on objects inside `my-app-uploads` (the `/*` means "every object in that bucket"). It says nothing about deleting, nothing about other buckets, nothing about any other service. Anything not explicitly allowed is denied. That default-deny is IAM's most important rule: permissions are additive from a starting point of "no."

The `arn:aws:s3:::my-app-uploads/*` is an **ARN** (Amazon Resource Name), AWS's universal address for a resource. You'll see ARNs everywhere; they're how a policy names exactly what it's talking about.

## Least privilege, made concrete

"Least privilege" sounds like a lecture. In practice it's one habit: **grant the narrowest permission that makes the task work, then stop.** The temptation, especially when you're fighting an `AccessDenied` at the end of a long day, is to reach for the wildcard:

```json
{
  "Effect": "Allow",
  "Action": "*",
  "Resource": "*"
}
```

*What just happened:* this says "this identity can do anything to everything in the account." It will absolutely make your error go away - and it's the policy attached to most of the credentials that have ever been stolen and used to ransack an account. A role this wide, if its credentials leak, hands an attacker your entire AWS footprint. The narrow policy from the previous section, leaked, costs you one bucket's contents. That gap is the entire argument for least privilege.

> The straightforward workflow: start with nothing, run your code, read the exact action it was denied, and add *that one action* on *that one resource*. It's slower than `"*"` for about ten minutes and saves you from a catastrophe you'll never see coming.

## The gotchas that actually bite

Here are the ones that cost people real time and real money.

**The public S3 bucket.** The single most famous AWS mistake. A bucket policy or ACL set to allow public access means anyone on the internet can read (or sometimes write) your files. AWS now blocks public access by default and warns loudly, but people still override it by accident.

```bash
# Check whether a bucket is exposing public access
aws s3api get-public-access-block --bucket my-app-uploads
```

*What just happened:* this asks AWS whether the four public-access guardrails are on for that bucket. If they're enabled, the bucket can't be made public even by a careless policy. Run this on anything holding private data, and treat "public" as a deliberate choice you make for a static-website bucket, never a default you drift into.

**Hardcoded access keys.** Pasting a long-lived access key and secret into source code, then committing it, is how credentials end up scraped from public repos within minutes. Bots watch for exactly this.

```text
BAD:   AWS_ACCESS_KEY_ID = "AKIA..."  hardcoded in app.py, pushed to GitHub
GOOD:  an IAM role attached to the EC2/Lambda - no key in the code at all
```

*What just happened:* the fix isn't "hide the key better," it's "don't have a key." Roles (Phase 2) give your running code temporary credentials with no secret to commit. For local development, keep keys in `~/.aws/credentials`, never in the repo, and add that path's equivalents to `.gitignore`.

**The root account.** Every AWS account has a root user tied to the sign-up email, and it can do *anything*, including things no IAM policy can restrict. Using it day-to-day is like doing your daily computing as the administrator with no password - one slip is total.

```text
Root account:  lock it down - strong password, MFA, then don't log in with it.
Daily work:    a separate IAM user (or SSO identity) with only the access you need.
```

*What just happened:* the convention is to secure root, turn on MFA (multi-factor authentication) for it, and then walk away from it for everyday tasks. You create regular IAM identities scoped to what each person actually does. The root user is the fire-axe behind glass, not the door you use every morning.

## In the wild

The mature pattern, once a team grows past one person, is to stop minting individual IAM users entirely and route human access through single sign-on (often AWS IAM Identity Center), with roles granting time-limited access. The machines - EC2, Lambda, and friends - keep using roles as we've described. The thread tying all of it together is the same one from Phase 1: every action is an identity asking permission, and IAM is the thing that says yes or no. Get comfortable reading and writing these small JSON policies and you've got the load-bearing skill for everything else AWS will throw at you.

```quiz
[
  {
    "q": "Under the AWS shared-responsibility model, who is responsible for setting correct access permissions on your data?",
    "choices": ["AWS - it's part of the infrastructure", "You - access control is the customer's side of the line", "It's split evenly by default", "The S3 service handles it automatically"],
    "answer": 1,
    "explain": "AWS secures the underlying hardware and network; you are responsible for your data and who can access it, including IAM rules."
  },
  {
    "q": "Why is an IAM role preferred over a long-lived access key for code running on EC2?",
    "choices": ["Roles are faster at runtime", "Roles provide temporary credentials with no permanent secret to leak", "Roles allow wildcard permissions by default", "Keys don't work on EC2"],
    "answer": 1,
    "explain": "A role supplies temporary, auto-expiring credentials, so there's no long-lived secret to hardcode, commit, or have stolen."
  },
  {
    "q": "What does the principle of least privilege tell you to do?",
    "choices": ["Grant Action '*' and Resource '*' to avoid AccessDenied errors", "Use the root account for all work to keep things simple", "Grant the narrowest permission that makes the task work, and no more", "Make S3 buckets public so any service can reach them"],
    "answer": 2,
    "explain": "Least privilege means granting only the specific actions on the specific resources needed - so a leaked credential does minimal damage."
  }
]
```

[← Phase 2: Wiring them into an app](02-wiring-an-app.md) | [Overview](_guide.md)
