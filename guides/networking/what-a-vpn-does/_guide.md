---
title: "What a VPN Actually Does"
guide: "what-a-vpn-does"
phase: 0
summary: "What a VPN really routes and hides, and what it does not: the encrypted-tunnel model, who can see what, and when a VPN is mostly theater."
tags: [networking, vpn, privacy, encryption, beginner-friendly]
category: networking
order: 8
difficulty: beginner
synonyms: ["what is a vpn", "does a vpn make me anonymous", "what does a vpn actually hide", "is a vpn worth it", "does a vpn protect my privacy", "vpn vs https", "can my isp see my traffic with a vpn"]
updated: 2026-06-30
---

# What a VPN Actually Does

You've seen the ads - a hooded figure, a world map, the promise that one app makes you invisible, untraceable, safe. Then you turned it on and nothing visibly changed, and you were left wondering what you actually bought. The confusion isn't your fault: VPNs are sold on a feeling and explained almost nowhere.

This guide replaces the feeling with a model you can reason from. By the end you'll know exactly what a VPN moves, exactly who can see what before and after, and exactly when turning one on changes nothing real. No fear, no hype - only the wiring.

## How to read this

- **Want the one-sentence answer?** A VPN is an encrypted tunnel to a relay server: your provider sees encrypted traffic to the VPN, websites see the VPN's address instead of yours. Phase 1 makes that picture solid.
- **Want to stop being fooled by marketing?** Read in order. Phase 2 walks the "who sees what" ledger, and Phase 3 is the clear-eyed part - where the promises quietly break.

## The phases

1. **[The Tunnel - What a VPN Really Is](01-the-tunnel.md)** - the encrypted-tunnel mental model: a VPN doesn't hide you, it *relays* you through one trusted server, and that single move is the whole product.
2. **[Who Sees What - The Visibility Ledger](02-who-sees-what.md)** - exactly what changes when the tunnel is on: your ISP goes blind to your destinations, websites see the VPN's address, and one party gains the view your ISP lost.
3. **[Where the Promises Break](03-where-the-promises-break.md)** - the clear-eyed part: HTTPS already encrypted your pages, you are not anonymous, and the VPN provider is now the one you're trusting. When a VPN actually helps, and when it's theater.

> This guide assumes the basics of how traffic moves and gets addressed. If "ISP," "IP address," or "request" feel shaky, skim [How the Internet Works](/guides/how-the-internet-works) and [IP, DNS & Ports](/guides/ip-dns-and-ports) first - they make this one click into place.

---

[Phase 1: The Tunnel - What a VPN Really Is →](01-the-tunnel.md)
