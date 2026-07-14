---
title: "What \"The Cloud\" Actually Sells"
guide: "cloud-platforms-explained"
phase: 1
summary: "The cloud rents you computing on demand - compute, storage, network, and managed services - instead of making you own servers; you pay for what you use, and the big three are the same shape with different names."
tags: [cloud, mental-model, pay-as-you-go, aws, gcp, azure, managed-services]
difficulty: intermediate
synonyms: ["what is the cloud really", "what does the cloud sell", "is the cloud just someone else's computer", "why use the cloud instead of own servers", "what is pay as you go cloud"]
updated: 2026-07-10
---

# What "The Cloud" Actually Sells

The word "cloud" does a lot of damage. It sounds like a place, something far away and slightly magical.
That framing is exactly why the AWS console feels overwhelming - you're looking for a *place* and
finding a hardware store with two hundred aisles.

So let's swap the metaphor for something true. The cloud is a company that owns enormous buildings full
of computers, and rents them to you by the hour. That's the whole business. Everything else - the two
hundred service names, the dashboards, the acronyms - is just different *ways* of renting those
computers and the things attached to them. Once you believe that, the rest is detail.

## The thing it replaces: owning the servers

Before the cloud, running software for other people meant *buying physical machines*. You'd estimate how
much traffic you might get, buy enough servers to handle the busiest day you could imagine, rack them in
a room (or rent data-center space), keep them powered and cooled, and replace the disks when they died -
paying for all of it up front, whether anyone used your software or not. Every painful part of that - the
up-front cost, the guessing, the idle machines, the 3am drive to swap a dead drive - is a problem the
cloud was built to delete. Hold the old way in your head and the cloud's whole pitch becomes obvious.

**The old way, drawn out:**

```text
   OWNING SERVERS                          THE CLOUD
   ─────────────                           ─────────
   Buy 10 machines up front       →        Rent 1 machine, by the hour
   (guess your busiest day)                Need 10 more at lunch? Rent them.
                                           Quiet at 3am? Give them back.
   Pay whether used or not        →        Pay only for the hours you used
   You replace dead disks         →        Someone else's job
```

## What it sells, in four buckets

Strip away the names and a cloud platform sells four kinds of thing. Almost every service you'll ever
see is one of these wearing a costume.

**1. Compute - rented machines that run your code.** A computer with a CPU and memory that you can turn
on, run your program on, and turn off. Sometimes it's a whole virtual machine you control; sometimes
it's a smaller slice (a container, or just a single function). This is the engine.

**2. Storage - places to keep data that don't vanish when a machine turns off.** Compute is temporary by
nature; turn the machine off and its local disk may go with it. Storage is the durable shelf: files,
images, backups, database contents - things that must still be there tomorrow.

**3. Network - the wiring that connects all of it.** Private networks so your machines can talk to each
other safely, public addresses so the internet can reach the parts you *want* reached, load balancers to
spread traffic, and the rules (firewalls) that say who's allowed in.

**4. Managed services - the cloud running a hard piece of software *for* you.** This is the bucket that
makes the cloud feel huge, and it's the most valuable one. Instead of installing, configuring, patching,
and babysitting a database (or a message queue, or a search index) yourself, you click a button and the
cloud runs it, keeps it alive, backs it up, and hands you a connection string. You rent the *outcome*,
not just the machine.

📝 **Managed service.** A piece of infrastructure software (a database, a queue, a cache, etc.) that the
cloud provider operates on your behalf - installation, patching, scaling, and backups are their job, not
yours. You pay more than running it raw, and in return you stop being its sysadmin.

> ⏭️ Fuzzy on what a "server" even is under all this? The ground-level version -
> what a server is, what runs on it, how requests reach it - is in
> [What a Server Is](/guides/what-a-server-is). This guide assumes that much.

## The pricing model: you pay for what you use

The default cloud deal is *metered*, like electricity. You don't buy a server; you rent capacity and a
meter runs while you use it. Leave a machine running 24/7 and you pay for 24/7; run it for an hour and
shut it down, and (for many services) you pay for roughly an hour. Storage is metered by how much data
you're keeping and how often you read it; network often charges for data flowing *out* to the internet.

This is the whole appeal, and the whole danger. The upside is real: a two-person startup can rent the
same caliber of infrastructure as a giant company and pay only for what it actually uses. The danger is
the mirror image: a meter that runs while you're not looking doesn't stop on its own. A machine you
forgot to turn off, or a job stuck in a loop, bills you the entire time.

⚠️ **The meter never sleeps.** "Pay for what you use" quietly includes "pay for what you *forgot you
were using*." A test server left running over a long weekend, an oversized database nobody downsized
after launch - these don't error out, they just bill. We come back to taming this with budgets and
alerts in [Phase 3](03-iaas-paas-serverless.md); for now, just hold the instinct: *anything you turn on,
you are paying for until you turn it off.*

## The big three are the same shape

Here's the part that makes the whole landscape navigable. **AWS, Google Cloud (GCP), and Azure are not
three different worlds - they're three brands selling the same four buckets.** Each one has compute,
object storage, managed databases, networking, and an identity system. They named everything
differently, the consoles look different, and the deep details differ. But the *shape* is shared.

```text
                  COMPUTE      OBJECT       MANAGED       PRIVATE      IDENTITY /
                  (a VM)       STORAGE      DATABASE      NETWORK      PERMISSIONS
                  ─────────    ─────────    ──────────    ─────────    ──────────
   AWS            EC2          S3           RDS           VPC          IAM
   Google (GCP)   Compute      Cloud        Cloud SQL     VPC          IAM
                  Engine       Storage
   Azure          Virtual      Blob         Azure SQL     Virtual      Entra ID /
                  Machines     Storage      Database      Network      RBAC
```

*What this table is telling you:* the columns are the concepts worth learning; the cells are just what
each vendor decided to call them. Learn the columns once and you can read all three platforms. We unpack
each column properly in [Phase 2](02-the-building-blocks.md).

💡 **Key point.** Don't learn "AWS." Learn the *concepts* - compute, storage, network, managed services,
identity - and treat each vendor's service names as a translation layer. That knowledge moves with you
between jobs; memorized service names mostly don't.

## A note on plain talk: which one is "best"?

You'll see endless arguments about AWS vs GCP vs Azure. The real answer: for the building blocks in
this guide, they're far more alike than different, and which one a company uses is usually decided by
history, existing contracts, and which one the team already knows - not a clean technical win. AWS is
the oldest and broadest; GCP is often praised for data and Kubernetes heritage; Azure tends to show up
where an organization already lives in the Microsoft world. Those are tendencies, not laws - any concrete
"X is faster/cheaper" claim depends on the specific service and workload, so don't trust a blanket
version of it (including from me).

## Recap

1. The cloud is **rented computing on demand** - it deletes the up-front cost and guesswork of owning
   physical servers.
2. It sells four buckets: **compute** (machines), **storage** (durable data), **network** (the wiring),
   and **managed services** (the cloud running hard software for you).
3. Pricing is **metered** - pay for what you use, which is the appeal *and* the trap, because the meter
   doesn't stop on its own.
4. **AWS, GCP, and Azure are the same shape** with different names; learn the concepts, treat the names
   as translation.

Now that you know the buckets, let's open them and name the pieces across all three vendors.

---

[← Guide overview](_guide.md) · [Phase 2: The Building Blocks (Across Vendors) →](02-the-building-blocks.md)
