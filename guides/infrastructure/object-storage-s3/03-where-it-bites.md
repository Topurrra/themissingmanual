---
title: "Where it bites: leaks, edits, and consistency"
guide: object-storage-s3
phase: 3
summary: "Buckets, keys, and signed URLs — how cloud object storage really works, what it is good and bad at, and the public-bucket leak that makes the news."
tags: [object-storage, s3, cloud, buckets, infrastructure]
difficulty: intermediate
synonyms: [what is s3, how does object storage work, s3 bucket explained, signed url, presigned url, s3 public bucket leak, store files in the cloud]
updated: 2026-06-30
---

# Where it bites: leaks, edits, and consistency

You now know enough to use object storage well. This last phase is the part that keeps people out of the news and out of 3am pages: the famous public-bucket leak and how to never be it, the operations object storage is genuinely bad at, and the consistency gotcha that confused a generation of engineers. Plus the two things it's *perfect* for, so you reach for it at the right moments.

## The leak that makes the news

You've seen the headlines: "Company exposes millions of customer records in misconfigured S3 bucket." Almost every one of those is the same mistake. Someone needed one file reachable, flipped the bucket (or an object's access) to **public**, and forgot — or never understood — that "public" means *the entire internet can list and read it.*

Here's why it's so dangerous and so common:

```text
Public bucket "acme-uploads"
  ->  Anyone can do:  GET https://acme-uploads.s3.amazonaws.com/<any-key>
  ->  Anyone can do:  LIST the bucket and see EVERY key
```

*What just happened:* once a bucket is public, an attacker doesn't need to guess keys — they can list the whole thing and download everything. There's no login wall, no rate limit on curiosity. Researchers and bots scan for public buckets continuously; an exposed one is often found within hours.

The trap is that "public" feels like a reasonable answer to a reasonable question ("how do I serve this file?"). It is almost never the right answer for anything user-specific. The fix is the previous phase: keep buckets private, serve private files with **signed URLs**, and only ever make something public when it's *meant* for the whole world (your site's logo, public CSS).

> Modern S3 ships with **Block Public Access** turned on by default at the account and bucket level — a deliberate guardrail so you can't accidentally make a bucket public without consciously turning protections off. Treat that switch as a smoke detector: if you ever find yourself disabling it, stop and ask whether you really want the literal entire internet to have this data. The honest answer is usually no.

The checklist that prevents the headline:

- **Default to private.** Leave Block Public Access on. Assume every object is sensitive until proven otherwise.
- **Serve private files via signed URLs**, not by toggling public.
- **Make public only what's genuinely public** — and even then, a dedicated bucket for public assets, separate from anything private, so a mistake can't expose customer data.
- **Don't rely on key obscurity.** A "secret" key like `exports/a8f3.../data.csv` is not access control; if the bucket is public, listing reveals it.

## What it's genuinely bad at

Object storage is a key-to-blob map, and that simplicity has real costs. Knowing them tells you when *not* to use it:

- **No in-place edits.** You cannot change byte 500 of an object. Every write is a full PUT of the whole object. Storing a frequently-mutated file (a database file, a log you append to constantly) means rewriting the entire thing on every change — wasteful and slow. Object storage is for *whole files you replace occasionally*, not data you poke at.
- **Higher latency than a local disk.** A GET is a network request to a remote service — tens of milliseconds, sometimes more, versus microseconds for local disk or RAM. Fine for serving an image or downloading a backup; a poor fit for anything in a tight loop that needs each byte *now*.
- **Listing is not a fast index.** LIST walks keys in lexical order with paging. It's great for "everything under this prefix," but it is not a query engine. You can't ask "all objects bigger than 1 MB modified last Tuesday." If you need to query *about* your files, keep that metadata in a real database and store only the bytes in the bucket.

The throughline: object storage is the wrong home for anything that wants to be edited in place, read with microsecond latency, or queried by attributes. It's the right home for the opposite — large, mostly-immutable blobs you fetch whole.

## The consistency gotcha (mostly history now)

For years, S3 was **eventually consistent** for some operations: you could write an object and a read a moment later might still return the *old* version (or a 404 for a brand-new key), because the change hadn't propagated to every replica yet. This bit people hard — "I uploaded it, why does my code say it's not there?"

```text
T+0ms   PUT  invoices/new.pdf        (write accepted)
T+5ms   GET  invoices/new.pdf        -> 404 Not Found   (replica hadn't caught up)
T+50ms  GET  invoices/new.pdf        -> 200 OK          (now it's there)
```

*What just happened:* the write succeeded, but a read a few milliseconds later hit a replica that didn't have it yet. The data wasn't lost — the system just hadn't finished agreeing with itself.

The good news: **S3 now provides strong read-after-write consistency** — a successful write is immediately visible to a following read. You generally don't have to engineer around this on S3 anymore. But keep the concept in your pocket, because (a) plenty of older code still has sleeps and retries built to dodge it, and (b) other object stores and distributed systems may still be eventually consistent. When a freshly-written object "isn't there yet," eventual consistency is the first suspect on systems that have it.

## What it's perfect for

End on the bright side — the two jobs object storage was born to do:

- **Static hosting.** Your site's images, CSS, JS, downloads — large, immutable, requested by everyone. Object storage serves them cheaply and durably, usually with a CDN in front for speed. These are the *legitimately public* objects; a dedicated public bucket is exactly right here.
- **Backups and archives.** Database dumps, log archives, "we might need this in three years" data. Cheap per gigabyte, eleven-nines durable, and you can set lifecycle rules to auto-delete old backups or move cold data to even cheaper tiers. This is the canonical use: write once, read rarely, keep forever, pay little.

For builders: a clean default architecture is *private bucket + signed URLs for user files, separate public bucket + CDN for static assets, lifecycle rules for backups.* That covers the vast majority of real apps and keeps you off the leak list. If "where does the bucket live and who runs it" is still hazy, /guides/cloud-platforms-explained puts object storage next to the other cloud building blocks.

```quiz
[
  {
    "q": "What is the root cause of the classic 'company leaked data in S3' headline?",
    "choices": [
      "A bug in S3's encryption",
      "A bucket or object set to public, exposing it to the entire internet",
      "Hackers brute-forcing AWS passwords",
      "Signed URLs that never expired"
    ],
    "answer": 1,
    "explain": "Public buckets let anyone list and download everything. The fix is to stay private and use signed URLs for private files."
  },
  {
    "q": "Which workload is object storage a POOR fit for?",
    "choices": [
      "Serving your website's images and CSS",
      "Storing nightly database backups",
      "A database file that's edited in place many times per second",
      "Holding user-uploaded photos"
    ],
    "answer": 2,
    "explain": "There are no in-place edits — every write is a full PUT. Frequently-mutated files are exactly what object storage is bad at."
  },
  {
    "q": "On modern S3, what consistency do you get after a successful write?",
    "choices": [
      "Strong read-after-write consistency — a following read sees the new data immediately",
      "Eventual consistency, so you must sleep and retry",
      "No consistency guarantees at all",
      "Consistency only if you pay for a premium tier"
    ],
    "answer": 0,
    "explain": "S3 now provides strong read-after-write consistency. Older code may still have retries from the eventually-consistent days, and other stores may still be eventual."
  }
]
```

[← Phase 2: Keys and access](02-keys-and-access.md) · [Overview](_guide.md)
