---
title: "Reading a Packet Capture"
guide: "troubleshooting-networks"
phase: 3
summary: "A packet capture is every packet on the wire, in order; learn to read the handshake, retransmissions, resets, and which side went quiet — so you can pinpoint exactly where a conversation broke."
tags: [networking, wireshark, packet-capture, tcp, handshake, retransmission, reset]
difficulty: intermediate
synonyms: ["how to read wireshark", "what is a packet capture", "tcp handshake in wireshark", "what is a tcp retransmission", "rst packet meaning", "where did the connection break", "reading network traffic"]
updated: 2026-06-19
---

# Reading a Packet Capture

Sometimes the easy tools run out. `ping` says the host is reachable, `traceroute` says the path is clean, `dig` says the name resolves — and yet the app still hangs, the upload still stalls, the connection still "just doesn't work." Every summary tool is green, but the thing is broken. This is the moment you stop looking at summaries and look at the *actual conversation* — every packet, in order, on the wire. The tool for that is a **packet capture**, usually read in **Wireshark**.

This phase is not a tour of Wireshark's buttons. The buttons change; what matters is knowing *what a capture is* and *what to look for in it* — because once you can read the shape of a conversation, you can point at the exact packet where it went wrong. That's a different kind of power than the other tools give you: not "it's broken somewhere out there," but "here, at this packet, this side stopped talking."

## What a packet capture actually is

**What it actually is.** A packet capture is a recording of **every packet that crossed a network interface**, in the order it happened, with a timestamp on each. Where `ping` and `traceroute` send their *own* probes and show you summaries, a capture is passive: it just *watches* the real traffic your applications are already sending and writes down everything it sees. It's the difference between asking "is the road open?" and parking by the road and filming every car that drives past.

**Why this is so powerful.** Because there's no summarizing, no guessing, no "inconclusive." Every packet is *right there* — who sent it, to whom, what kind it was, when. If a conversation broke, the break is *in the recording*. Your job shrinks from "diagnose an invisible problem" to "read a transcript and find the line where it went silent."

📝 **Terminology.** A *packet* is one chunk of data sent across the network, wrapped in headers that say where it's from, where it's going, and what kind it is. A *capture* (or "pcap," after the file format) is just an ordered list of them. *Wireshark* is the program that records and displays captures in a readable table.

```text
   What a capture looks like — one row per packet, top to bottom in time:

   No.  Time     Source         Destination    Proto  Info
   ───────────────────────────────────────────────────────────────────────
    1   0.000    192.168.1.74   93.184.216.34  TCP    50312 → 443 [SYN]
    2   0.011    93.184.216.34  192.168.1.74   TCP    443 → 50312 [SYN, ACK]
    3   0.011    192.168.1.74   93.184.216.34  TCP    50312 → 443 [ACK]
    4   0.012    192.168.1.74   93.184.216.34  TLS    Client Hello
    5   0.024    93.184.216.34  192.168.1.74   TLS    Server Hello
   ───────────────────────────────────────────────────────────────────────
        │        └── who sent it   └── who it's for   │      └── what happened
        └── order + timestamp                         └── protocol
```

You read it top to bottom, like a chat log between two machines. **Source** and **Destination** tell you who's talking; **Time** tells you when; **Info** tells you *what kind* of packet it is. Learning to read network trouble is mostly learning to recognize a few patterns in that `Info` column.

## Pattern 1: the handshake — does the conversation even start?

**What it actually is.** Before two machines exchange any real data over TCP, they perform a three-step greeting called the **three-way handshake**: one side says "let's talk" (`SYN`), the other says "sure, let's talk" (`SYN, ACK`), and the first confirms "great, talking now" (`ACK`). Only after those three packets does actual data flow. (📝 *TCP* is the protocol that guarantees ordered, reliable delivery — most things you use, web and APIs included, ride on it. *SYN* and *ACK* are flags on a packet: "synchronize" and "acknowledge.")

**What to look for.** Those exact three packets at the *start* of a conversation, in order:

```text
    1   0.000  192.168.1.74   93.184.216.34  TCP  50312 → 443 [SYN]        ← "let's talk"
    2   0.011  93.184.216.34  192.168.1.74   TCP  443 → 50312 [SYN, ACK]   ← "sure"
    3   0.011  192.168.1.74   93.184.216.34  TCP  50312 → 443 [ACK]        ← "great, go"
```
*What just happened:* You client (`192.168.1.74`) opened a connection to the server on port 443 (HTTPS). The `SYN` went out, the `SYN, ACK` came back ~11 ms later, the `ACK` sealed it — a clean, complete handshake. **This is the single most useful thing to check first**, because it splits your problem in half: if the handshake completes, the two machines *can* reach each other and the trouble is in what comes after (the data, the TLS, the application). If the handshake *doesn't* complete, the problem is at the connection level and you never even got to the real conversation.

```text
   The telltale broken-start: SYN with no answer, again and again

    1   0.000  192.168.1.74   203.0.113.9   TCP  50318 → 443 [SYN]
    2   1.001  192.168.1.74   203.0.113.9   TCP  [TCP Retransmission] 50318 → 443 [SYN]
    3   3.005  192.168.1.74   203.0.113.9   TCP  [TCP Retransmission] 50318 → 443 [SYN]
```
*What just happened:* Your machine sent a `SYN` and got *nothing* back — so it tried again after 1 second, then again after 3 (TCP backs off and retries). The server is never completing the greeting. That's a connection that can't even start: the far end is down, a firewall is silently dropping the `SYN`, or it's the wrong address/port. Notice this is invisible to `ping` if the host answers pings but blocks port 443 — the capture shows you the truth the summary tools missed.

## Pattern 2: retransmissions — the conversation is struggling

**What it actually is.** TCP guarantees delivery, so when a packet goes unacknowledged (lost or too slow), the sender **retransmits** it — sends it again. A retransmission isn't itself a failure; it's TCP doing its job. But *lots* of them is the fingerprint of a lossy or congested path — the network equivalent of "sorry, you cut out, say that again" happening over and over.

**What to look for.** Wireshark flags these for you in the `Info` column, in tell-tale brackets:

```text
   42  2.104  192.168.1.74   93.184.216.34  TCP  [TCP Retransmission] 50312 → 443
   43  2.339  93.184.216.34  192.168.1.74   TCP  [TCP Dup ACK] 443 → 50312
   44  2.610  192.168.1.74   93.184.216.34  TCP  [TCP Retransmission] 50312 → 443
```
*What just happened:* You're seeing the same data sent more than once (`[TCP Retransmission]`) and the receiver repeatedly saying "I'm still missing that piece" (`[TCP Dup ACK]` — a duplicate acknowledgment, the receiver nudging the sender to resend). A handful is normal. A capture *littered* with these means packets are being lost in the path — exactly the "40% packet loss" you might have seen in `ping`, now shown packet by packet. The connection still *works*, but it's slow and stuttering because TCP is spending its time re-sending. This is what "the network is slow" looks like up close.

## Pattern 3: the reset — someone hung up hard

**What it actually is.** A normal connection closes politely with a `FIN` ("I'm done, let's wrap up") from each side. A **`RST` ("reset")** is the opposite: an abrupt "this conversation is over, *now*," with no negotiation. It's a door slammed rather than closed. Something *actively refused* or *killed* the connection.

**What to look for.** An `RST` packet, especially right after a request — and *which side sent it*:

```text
   18  0.140  192.168.1.74   203.0.113.9   HTTP  GET /api/orders HTTP/1.1
   19  0.151  203.0.113.9    192.168.1.74  TCP   443 → 50320 [RST, ACK]
```
*What just happened:* Your client sent a real request (`GET /api/orders`), and the **server immediately answered with `RST`** instead of data. The far end didn't time out or lose packets — it *deliberately* tore the connection down. Common causes: nothing is actually listening on that port, a firewall is configured to reject (not silently drop) the traffic, or the server's application crashed/refused the request. The crucial detail is the **direction**: the `RST` came *from* `203.0.113.9` (the server), so the rejection is at the far end, not yours. Reading *who sent the RST* points the finger at the right machine.

⚠️ **Gotcha.** Direction is everything in a capture, and it's the thing people misread. "Packets aren't getting through" is meaningless until you know *which side stopped sending or started rejecting.* Before blaming anyone, find the last packet *your* side sent and the last packet *their* side sent — whoever went quiet (or sent the `RST`) first is where to look. A capture's whole value is that it makes "whose fault" a fact you can read, not an argument.

## How to read any capture: find where it went quiet

You don't need to understand every packet. The method is always the same, and it's just Phase 1's "first failure wins" applied to a transcript:

```mermaid
flowchart TD
  q1{1. Did the handshake complete?}
  q1 -->|no| a1[connection can't start:<br/>down / firewall / wrong port]
  q1 -->|yes| q2{2. Did real data flow both ways?}
  q2 -->|no| a2[one side never replied —<br/>see who went silent]
  q2 -->|yes| q3{3. Lots of retransmissions?}
  q3 -->|yes| a3[lossy / congested path<br/>the slow fingerprint]
  q3 -->|no| q4{4. Any RST?}
  q4 -->|yes| a4[someone refused/killed it —<br/>read the DIRECTION]
  q4 -->|no| a5[5. Which side sent the last packet,<br/>and when did it stop? — that's where it broke]
```
*What just happened:* You walked the conversation the same way you walked the layers — top to bottom, stopping at the first thing that's wrong. The capture's gift is that "where did it break" is no longer a theory; it's a specific row, with a sender, a timestamp, and a packet type. That's the end of guessing.

🪖 **War story.** An upload "failed randomly" for one customer and no one else. Every summary tool was clean — ping fine, traceroute fine, DNS fine. The capture told the whole story in three rows: handshake completed, the client sent its data, and then the *server* sent a `RST` the instant the upload crossed a certain size. Not a network problem at all — a request-size limit on the server, rejecting big uploads with a hard reset. No amount of `ping` would ever have shown it. One look at the wire, and the `RST` from the server's address, pointed straight at the cause.

## Recap

1. A **packet capture** is every packet on the wire, in time order — a transcript of the real conversation, not a summary of it. The break, if there is one, is *in the recording*.
2. **The handshake** (`SYN` → `SYN, ACK` → `ACK`) tells you if the connection can even start. No completion = trouble at the connection level; complete = trouble is in what follows.
3. **Retransmissions** (and `Dup ACK`s) are TCP resending lost packets — a few are normal, a flood is a lossy/congested path. This is "slow" up close.
4. **An `RST`** is an abrupt refusal — read *which side sent it* to know who killed the connection.
5. To read any capture, walk it like the layers: handshake? data both ways? retransmissions? reset? **who went quiet first?** — and stop at the first wrong thing.

That's the full kit. You have the calm method (walk up the layers), the everyday tools that answer each rung (`ping`, `traceroute`, `dig`), and the deep tool for when the summaries lie (the packet capture). The next time something "just doesn't work," you won't be guessing — you'll be reading.

---

[← Phase 2: The Core Tools](02-the-core-tools.md) · [Guide overview](_guide.md)

Related guides: [IP, DNS, and Ports](/guides/ip-dns-and-ports) · [The TCP/IP Model](/guides/tcp-ip-model) · [How the Internet Works](/guides/how-the-internet-works)
