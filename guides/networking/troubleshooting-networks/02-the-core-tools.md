---
title: "The Core Tools"
guide: "troubleshooting-networks"
phase: 2
summary: "ping tells you reachability and latency, traceroute/tracert shows the path and where it dies, and dig/nslookup answers 'is it DNS?' - here's how to read what each one's output actually means."
tags: [networking, ping, traceroute, tracert, dig, nslookup, dns, latency]
difficulty: intermediate
synonyms: ["how to read ping output", "what does traceroute show", "traceroute timeout meaning", "how to use dig", "nslookup explained", "ping latency packet loss", "where does the connection die"]
updated: 2026-06-19
---

# The Core Tools

In [Phase 1](01-work-up-the-layers.md) you learned *which* question to ask at each rung. This phase hands you the three tools that answer the top three rungs, and - more importantly - teaches you to *read* their output. Most people run `ping` and `traceroute`, glance at the wall of numbers, and feel none the wiser. The numbers aren't the point; the *shape* of them is. Once you know what each tool is really telling you, a single run gives you a fact, not a vibe.

Three tools, three jobs:

- **`ping`** - *Can I reach it, and how fast?* (reachability + latency)
- **`traceroute`** / **`tracert`** - *What path do my packets take, and where do they die?*
- **`dig`** / **`nslookup`** - *Is it DNS? What address does this name actually resolve to?*

## `ping` - reachability and latency

**What it actually is.** `ping` sends a tiny "are you there?" probe to a host and waits for an "I'm here" reply, over and over. It's the simplest possible question - *can these two machines exchange a packet at all?* - and the round trip also happens to measure how long that exchange takes. (📝 *Round-trip time*, or RTT, is the time from sending a probe to getting its reply back - there and back, not one way.)

**What its output actually tells you.** Two things, and only two: **whether replies come back** (reachability) and **how long they take and how consistently** (latency and loss). That's it - and that's a lot.

```console
$ ping -c 5 example.com
PING example.com (93.184.216.34) 56(84) bytes of data.
64 bytes from 93.184.216.34: icmp_seq=1 ttl=56 time=11.4 ms
64 bytes from 93.184.216.34: icmp_seq=2 ttl=56 time=11.2 ms
64 bytes from 93.184.216.34: icmp_seq=3 ttl=56 time=11.9 ms
64 bytes from 93.184.216.34: icmp_seq=4 ttl=56 time=11.3 ms
64 bytes from 93.184.216.34: icmp_seq=5 ttl=56 time=11.5 ms

--- example.com ping statistics ---
5 packets transmitted, 5 received, 0% packet loss, time 4006ms
rtt min/avg/max/mdev = 11.2/11.4/11.9/0.24 ms
```
*What just happened:* The first line already did you a favor - it resolved `example.com` to `93.184.216.34`, so a successful ping quietly proves DNS worked too. Then five probes, each replied (`icmp_seq=1..5`), each around `11 ms` and tightly clustered. The summary is where you read the verdict: **`0% packet loss`** (every probe came back - solidly reachable) and **`min/avg/max/mdev = 11.2/11.4/11.9/0.24`** - the low `mdev` (mean deviation, i.e. jitter) of `0.24 ms` means rock-steady timing. Reachable and healthy. (Times and the IP here are illustrative.)

Now compare that to a sick connection - same command, very different shape:

```console
$ ping -c 5 example.com
64 bytes from 93.184.216.34: icmp_seq=1 ttl=56 time=11.5 ms
Request timeout for icmp_seq=2
64 bytes from 93.184.216.34: icmp_seq=3 ttl=56 time=410 ms
Request timeout for icmp_seq=4
64 bytes from 93.184.216.34: icmp_seq=5 ttl=56 time=388 ms

--- example.com statistics ---
5 packets transmitted, 3 received, 40% packet loss
rtt min/avg/max/mdev = 11.5/269.8/410/186.4 ms
```
*What just happened:* Same host, but now two probes never came back (`Request timeout`) and the ones that did swung between `11 ms` and `410 ms`. The summary spells out the trouble: **`40% packet loss`** (4 in 10 probes dropped - packets are being silently discarded somewhere) and a huge spread (`mdev` of `186 ms` - wild jitter). The host is technically reachable but the path between you is congested, overloaded, or failing. `ping` has told you *that* it's bad; it can't tell you *where*. That "where" is the next tool's whole job.

⚠️ **Gotcha.** "No ping reply" does **not** always mean "host is down." Plenty of servers and firewalls are deliberately configured to ignore ping (ICMP) while happily serving real traffic on, say, port 443. So a silent `ping` to a public website might just mean "this host doesn't answer pings," not "this host is unreachable." Use ping as a *positive* signal (replies = definitely reachable); treat *no* reply as "inconclusive, check another way," not proof of death.

💡 **Key point.** Read ping in this order: (1) the resolved IP on line 1 - DNS worked. (2) `% packet loss` - is it reachable at all, and reliably? (3) `avg` and `mdev` - is it fast and steady, or slow and jittery? Three glances, full diagnosis.

## `traceroute` / `tracert` - the path, and where it dies

**What it actually is.** Your packets don't teleport to the destination - they hop from router to router across the internet, each handoff a "hop." `traceroute` (it's `tracert` on Windows) reveals that hidden chain: it lists every router between you and the destination, in order, with the latency to each. Think of it as a receipt for the journey, one line per stop.

**The clever trick (so the output makes sense).** Every packet carries a TTL - "time to live" - a counter of how many hops it's allowed before a router throws it away and reports back. `traceroute` exploits this: it sends a packet with TTL 1 (dies at hop 1, which announces itself), then TTL 2 (dies at hop 2), and so on, mapping the path one router deeper each round. You don't need to remember the trick - but it explains *why* the output is a numbered list of routers getting progressively farther away.

**What its output actually tells you.** The *path* your traffic takes, and - the part you actually came for - **the hop where it stops getting through.** That stopping point is the location of the problem.

```console
$ traceroute example.com
traceroute to example.com (93.184.216.34), 30 hops max, 60 byte packets
 1  192.168.1.1 (192.168.1.1)        1.92 ms   1.88 ms   2.04 ms
 2  10.0.0.1 (10.0.0.1)             12.4 ms   12.1 ms   12.9 ms
 3  72.14.215.85 (72.14.215.85)     14.0 ms   13.8 ms   14.2 ms
 4  108.170.246.1 (108.170.246.1)   22.7 ms   22.3 ms   23.1 ms
 5  93.184.216.34 (93.184.216.34)   24.1 ms   23.9 ms   24.4 ms
```
*What just happened:* Five hops, start to finish. **Hop 1 is your own gateway** (`192.168.1.1`, ~2 ms - Rung 3 from Phase 1, confirmed). Hops 2–4 are routers out in your ISP and across the internet, each a little farther (latency climbing gently, which is normal - more distance, more time). **Hop 5 is the destination itself** (`93.184.216.34`) - the trace reached the end. A complete trace ending at your target = the path is intact end to end. (Each hop is probed three times, hence three times per line.)

Now the run that earns the tool its keep - a trace that *dies*:

```console
$ traceroute example.com
traceroute to example.com (93.184.216.34), 30 hops max, 60 byte packets
 1  192.168.1.1 (192.168.1.1)        1.95 ms   1.90 ms   2.01 ms
 2  10.0.0.1 (10.0.0.1)             12.2 ms   12.0 ms   12.6 ms
 3  72.14.215.85 (72.14.215.85)     14.1 ms   13.9 ms   14.3 ms
 4  * * *
 5  * * *
 6  * * *
```
*What just happened:* The trace got cleanly through hops 1, 2, and 3 - then hit `* * *` and never recovered. Each `*` is a probe that got no reply. The reading: **your packets travel fine up to hop 3, and something at or after hop 4 is swallowing them.** That's where the break is - out past your gateway and your ISP's first hops, at a router you don't control. This is the moment troubleshooting stops being "is *my* stuff broken" and becomes "the problem is *there*, several hops out" - a fact you can act on (wait it out, route around it, or report it) instead of a guess.

⚠️ **Gotcha.** A few `* * *` in the *middle* of an otherwise-complete trace are often harmless. Many routers are configured to *forward* your traffic perfectly but *not* reply to the traceroute probes themselves (again, ICMP de-prioritized or blocked). So a trace can show `* * *` at hop 7 and still reach the destination fine at hop 12 - that middle hop is just shy, not broken. The failure that *matters* is when the stars start and the trace **never reaches the destination** - that's where flow actually stops.

📝 **Terminology.** A *hop* is one router-to-router handoff. "Three hops out" means three routers between you and there. The hop count also tells you roughly how far, network-wise, a destination is.

## `dig` / `nslookup` - is it DNS?

**What it actually is.** `dig` ("domain information groper") asks a DNS server one direct question - *what address does this name map to?* - and shows you the raw answer. It's the tool that turns "I think it's DNS" into "it is/isn't DNS, here's the proof." (`nslookup` does the same job and ships on Windows by default; `dig` gives more detail and is the one most engineers reach for.)

**What its output actually tells you.** Whether a name resolves at all, *what* it resolves to, and which server gave you that answer. When Phase 1's IP-vs-name test pointed at Rung 4, this is the tool that confirms it and shows you the actual record.

```console
$ dig example.com

; <<>> DiG 9.18.1 <<>> example.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 54321
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; QUESTION SECTION:
;example.com.            IN  A

;; ANSWER SECTION:
example.com.        3600    IN  A   93.184.216.34

;; Query time: 24 msec
;; SERVER: 192.168.1.1#53(192.168.1.1)
```
*What just happened:* The two lines that matter are the **status** and the **answer**. `status: NOERROR` means the lookup succeeded. The `ANSWER SECTION` is the payoff: `example.com.` resolves to an **`A` record** (an IPv4 address) of `93.184.216.34`, with a `3600`-second TTL (how long this answer may be cached). At the bottom, `SERVER: 192.168.1.1#53` tells you *which* resolver answered - your gateway, on the standard DNS port 53. DNS is working; the name maps to a real address. (📝 An *A record* maps a name to an IPv4 address; `AAAA` does the same for IPv6.)

Here's the failure that confirms a DNS problem:

```console
$ dig doesnotexist.example

; <<>> DiG 9.18.1 <<>> doesnotexist.example
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 11111
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 0

;; QUESTION SECTION:
;doesnotexist.example.       IN  A
```
*What just happened:* **`status: NXDOMAIN`** - "non-existent domain" - and `ANSWER: 0`. DNS itself worked fine (it answered you promptly), and its answer is "that name does not exist." That's a very different thing from a network failure: the lookup machinery is healthy, the *name* is the problem (a typo, an expired record, or a domain that was never registered). If instead the command had hung and timed out with no answer at all, *that* points at the DNS server being unreachable - back down to a lower rung.

💡 **Key point.** `dig` separates two failures people constantly confuse: **`NXDOMAIN`** = "DNS works, the name is bad," versus **a timeout / no response** = "I can't even reach the DNS server." The first is a name problem; the second is a network problem one rung lower. Reading the status line tells you which.

🪖 **War story.** A deploy "broke the API" for half the users and not the others. `ping` to the API's IP was flawless from everywhere. But `dig api.internal` returned *different* `A` records depending on who ran it - one office's resolver still had the old, retired server cached, TTL not yet expired. The network was perfect; two populations were resolving the same name to two different machines. Without `dig` showing the actual record each side got, it looked like a baffling intermittent outage. With it, the cause was one line of output.

## Recap

1. **`ping`** answers *reachable + how fast*: read the resolved IP (DNS worked), then `% packet loss` (reachable/reliable?), then `avg`/`mdev` (fast/steady?). No reply ≠ definitely down.
2. **`traceroute`/`tracert`** answers *what path + where it dies*: hop 1 is your gateway, the last hop should be the destination. `* * *` that never reaches the end = the break, and it tells you *which hop out*.
3. **`dig`/`nslookup`** answers *is it DNS*: `NOERROR` + an `ANSWER` = name resolves; `NXDOMAIN` = DNS fine, name bad; timeout = can't reach the DNS server (lower rung).
4. Together they cover Rungs 3–5: gateway reachability, the path to the destination, and the name lookup in between.

These three tools see *summaries* - replies, hops, records. When even they can't tell you where a conversation broke, you drop down to watching the actual packets on the wire. That's the last tool, and it's next.

---

[← Phase 1: Work Up the Layers](01-work-up-the-layers.md) · [Guide overview](_guide.md) · [Phase 3: Reading a Packet Capture →](03-reading-a-packet-capture.md)
