---
title: "Object Storage (S3)"
guide: object-storage-s3
phase: 0
summary: "Buckets, keys, and signed URLs - how cloud object storage really works, what it is good and bad at, and the public-bucket leak that makes the news."
tags: [object-storage, s3, cloud, buckets, infrastructure]
category: infrastructure
order: 11
difficulty: intermediate
synonyms: [what is s3, how does object storage work, s3 bucket explained, signed url, presigned url, s3 public bucket leak, store files in the cloud]
updated: 2026-06-30
---

# Object Storage (S3)

You have files to store - user uploads, backups, a pile of images - and the disk on your server keeps filling up. Someone says "put it on S3," and you nod, but the moment you open the console it feels like a weird filesystem that lies to you: folders that aren't folders, permissions that bite, and a "Make public" button that has ended careers. This guide gives you the real mental model so object storage stops feeling like magic and starts feeling like a tool you trust.

## How to read this

Read the phases in order the first time. Phase 1 rewires how you picture the thing - and almost everything confusing about S3 comes from picturing it wrong. Phase 2 is the daily working knowledge. Phase 3 is where it bites people, including the leak you've read about in the news. If you only have five minutes, read phase 1; it's the part that saves you.

## The phases

1. [What it actually is: a giant key-to-blob map](01-the-mental-model.md)
2. [How you really work with it: keys, uploads, and signed URLs](02-keys-and-access.md)
3. [Where it bites: leaks, edits, and consistency](03-where-it-bites.md)

[Phase 1: What it actually is](01-the-mental-model.md) →
