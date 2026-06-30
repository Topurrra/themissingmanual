---
title: "Object Storage (S3)"
guide: object-storage-s3
phase: 2
summary: "Buckets, keys, and signed URLs — how cloud object storage really works, what it is good and bad at, and the public-bucket leak that makes the news."
tags: [object-storage, s3, cloud, buckets, infrastructure]
difficulty: intermediate
synonyms: [what is s3, how does object storage work, s3 bucket explained, signed url, presigned url, s3 public bucket leak, store files in the cloud]
updated: 2026-06-30
---

# How you really work with it: keys, uploads, and signed URLs

Now you've got the model — bucket plus key, flat strings, no folders. This phase is the day-to-day: how the four operations work, how you choose good keys, and the one mechanism that solves the question every app eventually asks — *"how do I let this one user download this one private file without making it public to the whole internet?"*

## There are basically four verbs

Object storage gives you a tiny, blunt API. Once you see it, the rest is detail:

```text
PUT     bucket + key + bytes   ->  store (or fully overwrite) the object
GET     bucket + key           ->  fetch the object's bytes
DELETE  bucket + key           ->  remove the object
LIST    bucket + prefix        ->  return keys that start with that prefix
```

*What just happened:* that's the whole vocabulary. Notice what's missing — there's no APPEND, no "edit byte 500," no "rename." PUT writes the *entire* object every time. We'll come back to that limitation in phase 3; for now, just register that writes are whole-object.

Here's a real session with the AWS CLI so the verbs feel concrete:

```bash
# PUT: upload a local file to a key
aws s3 cp ./profile.jpg s3://acme-prod-uploads/avatars/u-1843/profile.jpg

# LIST: every key under a prefix (the fake "folder")
aws s3 ls s3://acme-prod-uploads/avatars/u-1843/

# GET: download it back
aws s3 cp s3://acme-prod-uploads/avatars/u-1843/profile.jpg ./got.jpg

# DELETE: remove it
aws s3 rm s3://acme-prod-uploads/avatars/u-1843/profile.jpg
```

*What just happened:* `s3 cp` is PUT or GET depending on direction, `s3 ls` is LIST scoped to a prefix, `s3 rm` is DELETE. The `s3://bucket/key` form is the address from phase 1 written as a URL.

## Choosing keys: this is your real "schema"

Because there are no folders to organize you, your **key naming convention is your data model.** Good prefixes make listing and lifecycle rules easy; bad ones make your life hard later. A pattern that holds up:

```text
<entity>/<id>/<purpose>/<filename>

users/1843/avatar/profile.jpg
orders/90021/invoice/inv-90021.pdf
backups/db/2026-06-30/full.sql.gz
```

*What just happened:* putting the stable, high-level grouping first (`users/`, `backups/db/`) means you can later say "list everything under `backups/db/2026-06-30/`" or "delete everything under `users/1843/`" with a single prefix. Date components in `YYYY-MM-DD` order sort correctly as plain strings, which makes "delete backups older than X" trivial.

> One caution: avoid putting a value that's identical across millions of objects at the *very front* of every key (like `uploads/<everything>`) if you're writing at extreme volume — historically that could concentrate load. For normal apps this never matters; mentioning it so the term "key prefix performance" isn't a mystery if you meet it.

## The access problem, and why "make it public" is the wrong reflex

Your app stores a user's private invoice at `orders/90021/invoice/inv-90021.pdf`. The user clicks "Download." How do you serve them the bytes?

The tempting answer is to flip the object (or worse, the whole bucket) to **public** so a plain URL works. Don't. Public means *the entire internet* can read it if they guess or discover the key — and keys are guessable (`inv-90021`, `inv-90022`...). That reflex is exactly what causes the leaks in phase 3.

The two correct patterns are:

- **Proxy it through your server.** Your app authenticates the user, fetches the object with its own credentials, and streams the bytes back. Simple and safe, but every byte flows through your server, which costs you bandwidth and CPU.
- **Hand out a signed URL.** Let the user download straight from the storage service, but only via a URL that's cryptographically stamped to expire. This is usually what you want.

## Signed URLs: a temporary, self-expiring key to one object

A **signed URL** (AWS calls it a *presigned URL*) is a normal-looking URL with extra query parameters: who's allowed, what action (GET or PUT), and crucially an **expiry**. The storage service checks the signature; if it's valid and unexpired, it serves the object. No login needed by the recipient — the URL *is* the credential.

```bash
# Generate a URL that lets the holder GET this one object for 15 minutes
aws s3 presign s3://acme-prod-uploads/orders/90021/invoice/inv-90021.pdf \
  --expires-in 900
```

It returns something shaped like this:

```text
https://acme-prod-uploads.s3.amazonaws.com/orders/90021/invoice/inv-90021.pdf
  ?X-Amz-Algorithm=AWS4-HMAC-SHA256
  &X-Amz-Credential=...
  &X-Amz-Date=20260630T120000Z
  &X-Amz-Expires=900
  &X-Amz-Signature=4a7c... (the cryptographic stamp)
```

*What just happened:* you generated, on your server (where your secret credentials live), a URL that grants exactly one action (GET) on exactly one object for exactly 900 seconds. You hand it to the authenticated user; their browser downloads directly from S3; fifteen minutes later the link is dead. The object stayed private the whole time — the bucket was never public.

The same trick works in reverse for **uploads**: generate a presigned PUT URL and the browser uploads the file straight to the bucket without the bytes ever touching your server. That's how big-file uploads avoid melting your app server.

```text
1. Browser asks your server: "I want to upload avatar.jpg"
2. Server (authenticated) generates a presigned PUT URL, scoped to one key, expiring soon
3. Browser PUTs the file directly to S3 using that URL
4. Browser tells your server "done"; server records the key in its database
```

*What just happened:* your server only handled a tiny signing request and a tiny confirmation. The heavy file transfer went browser-to-storage, which is faster for the user and cheaper for you. The URL's short expiry and single-key scope keep it safe even if it leaks.

For builders: think of a signed URL like a hotel key card. It opens one room, expires at checkout, and works without the front desk re-verifying who you are each time. You'd never make every room permanently unlocked (that's a public bucket) — you hand out a card that stops working soon.

```quiz
[
  {
    "q": "What does a PUT do to an object that already exists at that key?",
    "choices": [
      "Appends the new bytes to the end",
      "Fails with a conflict error",
      "Fully overwrites it with the new bytes",
      "Edits only the changed bytes in place"
    ],
    "answer": 2,
    "explain": "Writes are whole-object. PUT replaces the entire object; there's no append or in-place edit."
  },
  {
    "q": "What is the defining property of a signed (presigned) URL?",
    "choices": [
      "It makes the bucket public to everyone",
      "It grants a specific action on one object and expires after a set time",
      "It encrypts the object's contents",
      "It permanently authenticates the user's account"
    ],
    "answer": 1,
    "explain": "A signed URL is a scoped, time-limited credential: one action, one object, an expiry — no public bucket needed."
  },
  {
    "q": "Why use a presigned PUT URL for browser uploads?",
    "choices": [
      "It compresses the file automatically",
      "The file uploads directly to storage, never flowing through your app server",
      "It bypasses all permission checks",
      "It's the only way to upload files larger than 1 MB"
    ],
    "answer": 1,
    "explain": "The browser uploads straight to the bucket, so the heavy transfer skips your server — faster and cheaper, while the short-lived scoped URL stays safe."
  }
]
```

[← Phase 1: The mental model](01-the-mental-model.md) · [Overview](_guide.md) · [Phase 3: Where it bites →](03-where-it-bites.md)
