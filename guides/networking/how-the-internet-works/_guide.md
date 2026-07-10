---
title: "How the Internet Actually Works"
guide: "how-the-internet-works"
phase: 0
summary: "The absolute basics of networking: what happens when you open a web page - how your request travels to a server and back, how machines find each other by address and name, and how they agree on a shared language."
tags: [networking, internet, packets, dns, http, client-server, beginner-friendly]
category: networking
order: 1
difficulty: beginner
synonyms: ["how does the internet work", "what happens when i open a web page", "how does a website load", "what is a packet", "how do computers talk to each other"]
updated: 2026-07-10
---

# How the Internet Actually Works

You use the internet every waking hour and it feels like magic - you press Enter, and a page appears from a machine that might be on the other side of the planet. Nobody ever explained what actually happened in that half-second. This guide does. By the end, the internet feels less like magic and more like a stack of small, sensible agreements between machines - agreements you can reason about.

This is the very first "A" of networking. No prior knowledge assumed. We build the picture one layer at a time.

## How to read this
- **Just want the big picture fast?** Read [Phase 1: The Journey of One Request](01-the-journey-of-one-request.md) - it follows a single web page from your finger on the Enter key to the page on your screen. That one story carries most of the idea.
- **Want it to truly click?** Read all three in order. Each phase answers a question the last one opened up.

## The phases
1. **[The Journey of One Request](01-the-journey-of-one-request.md)** - follow what happens when you open a web page: your device, your router, your ISP, across the internet, to a server and back. Meet *packets* - the labeled chunks data travels in.
2. **[Addresses & Names](02-addresses-and-names.md)** - every machine has an *IP address* (a number), and *DNS* turns human names like `example.com` into those numbers. Why both exist.
3. **[Client, Server & Talking the Same Language](03-client-server-and-protocols.md)** - the client/server model, and how machines agree on *protocols* (HTTP to ask for pages, carried reliably by TCP). A gentle first look at the layered model - and why none of this is magic.

> This guide deliberately stays at the "what is happening, and why" level. The precise mechanics of addresses, ports, and name lookups live in [IP, DNS & Ports](/guides/ip-dns-and-ports); how a web request is actually phrased lives in [HTTP Explained](/guides/http-explained); and how the layers stack up formally lives in [The TCP/IP Model](/guides/tcp-ip-model). Read this guide first - then those, when you're ready to go deeper.
