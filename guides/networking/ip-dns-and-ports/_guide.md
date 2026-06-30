---
title: "IP Addresses, DNS & Ports, Explained"
guide: "ip-dns-and-ports"
phase: 0
summary: "The address book of the internet: what an IP address really is, how DNS turns names like example.com into numbers, and how ports let one machine run many services at once."
tags: [networking, ip-address, dns, ports, beginner-friendly]
category: networking
order: 2
difficulty: beginner
synonyms: ["what is an ip address", "how does dns work", "what is a port", "ip vs dns vs port", "how do computers find each other on the internet", "what is example.com translated to"]
updated: 2026-06-19
---

# IP Addresses, DNS & Ports, Explained

You type `example.com`, press Enter, and a page appears. Somewhere between your keypress and that page, your computer found one specific machine out of the billions online, knocked on the right door, and asked for the right thing. It feels instant and invisible, so it's easy to treat it as magic. It isn't. It's an address book, a phone directory, and a building full of numbered doors - three plain ideas working together.

This guide installs those three ideas so the internet stops being a black box. By the end, "the site is down" and "it's probably DNS" will mean something specific to you, and you'll know where to look.

## How to read this

- **Just want one answer?** Each phase stands on its own - jump to [Ports](03-ports.md) if that's the piece you're missing.
- **Want it to finally make sense?** Read in order. IP comes first because DNS hands you an IP, and ports attach to an IP. Each phase builds on the one before.

## The phases

1. **[IP Addresses](01-ip-addresses.md)** - what an IP *actually is* (a machine's number), why there are two kinds (IPv4 and IPv6), and why all your home devices share one public address.
2. **[DNS - Names to Numbers](02-dns.md)** - the internet's phone book: how `example.com` becomes an IP, the chain of helpers that look it up, why caching makes it fast, and why so many outages are secretly DNS.
3. **[Ports - One Machine, Many Doors](03-ports.md)** - how a single machine runs the web, email, and SSH at once, each behind a numbered door, and why the real address of a service is *IP + port*.

> This guide is about *finding* and *addressing* machines. How data actually travels between them - packets, routing, the journey of a request - lives in [How the Internet Works](/guides/how-the-internet-works), and what your browser says once it reaches the server lives in [HTTP, Explained](/guides/http-explained).

---

[Phase 1: IP Addresses →](01-ip-addresses.md)
