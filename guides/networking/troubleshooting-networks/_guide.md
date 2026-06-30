---
title: "Troubleshooting Networks"
guide: "troubleshooting-networks"
phase: 0
summary: "A calm, methodical way to debug 'the internet is broken' - work up the layers (link, IP, gateway, DNS, destination), then use ping, traceroute, dig, and a packet capture to read exactly where the conversation died."
tags: [networking, troubleshooting, ping, traceroute, dns, dig, wireshark]
category: networking
order: 6
difficulty: intermediate
synonyms: ["how to troubleshoot a network", "internet not working how to debug", "is it dns", "ping traceroute dig explained", "where is my connection breaking", "how to read a packet capture", "network debugging method"]
updated: 2026-06-19
---

# Troubleshooting Networks

Something doesn't load. A page hangs on "Connecting…", an API call times out, the whole office Slack goes quiet at once. The instinct is to start poking - toggle Wi-Fi, reload, blame the router, restart the laptop, maybe the server. That's guessing, and guessing is slow and stressful because you never know if the thing you just changed was the thing that mattered.

There's a calmer way, and it's the way the people who fix networks for a living actually work. A network connection is a stack of layers, each one depending on the one below it. When something breaks, you don't guess - you walk *up* the stack, asking one yes/no question at each rung: is the link up? do I have an address? can I reach the gateway? can I turn a name into an address? can I reach the far end? The first "no" is your answer. Everything above it is irrelevant, everything below it is fine. This guide teaches you that method, then hands you the small set of tools that answer each question.

## How to read this

- **In a panic right now?** Jump to the symptom cheat-card at the top of [Phase 1: Work Up the Layers](01-work-up-the-layers.md) - it points "can't load anything" / "one site only" / "slow" straight at the rung to check.
- **Want it to finally make sense?** Read in order. Phase 1 gives you the method, Phase 2 gives you the everyday tools, and Phase 3 shows you how to read the wire itself when the easy tools run out.

## The phases

1. **[Work Up the Layers](01-work-up-the-layers.md)** - the method: a short list of yes/no checks, from "is the cable plugged in" to "can I reach the destination," mapped onto the TCP/IP layers. Stop guessing; isolate.
2. **[The Core Tools](02-the-core-tools.md)** - annotated transcripts of `ping`, `traceroute`/`tracert`, and `dig`/`nslookup`. For each: what its output *actually tells you*, so you can read the answer instead of memorizing flags.
3. **[Reading a Packet Capture](03-reading-a-packet-capture.md)** - what a capture *is*, what you can *see* in it (the handshake, retransmissions, resets, which side went quiet), and how to read it to answer "where exactly did the conversation break." Concept-first, not a button tour.

> This guide is about *diagnosis* - finding where it breaks. Configuring networks (subnets, routing tables, firewall rules) and the deeper protocol mechanics are their own topics; where you need that grounding, we link to [The TCP/IP Model](/guides/tcp-ip-model) and [IP, DNS, and Ports](/guides/ip-dns-and-ports).

---

Related guides: [IP, DNS, and Ports](/guides/ip-dns-and-ports) · [The TCP/IP Model](/guides/tcp-ip-model) · [How the Internet Works](/guides/how-the-internet-works)
