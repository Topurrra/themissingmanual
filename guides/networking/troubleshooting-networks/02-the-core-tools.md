---
title: "The Core Tools"
guide: "troubleshooting-networks"
phase: 2
summary: "ping tells you reachability and latency, traceroute/tracert shows the path and where it dies, and dig/nslookup answers 'is it DNS?' - here's how to read what each one's output actually means."
tags: [networking, ping, traceroute, tracert, dig, nslookup, dns, latency]
difficulty: intermediate
synonyms: ["how to read ping output", "what does traceroute show", "traceroute timeout meaning", "how to use dig", "nslookup explained", "ping latency packet loss", "where does the connection die"]
updated: 2026-07-10
---

# The Core Tools

Phase 1 taught you *which* question to ask at each rung. This phase hands you the three tools that answer the top three rungs, and - more importantly - teaches you to *read* their output. Most people run `ping` and `traceroute`, glance at the wall of numbers, and feel none the wiser. The numbers aren't the point; the *shape* of them is. Once you know what each tool is really telling you, a single run gives you a fact, not a vibe.

Three tools, three jobs:

- **`ping`** - *Can I reach it, and how fast?* (reachability + latency)
- **`traceroute`** / **`tracert`** - *What path do my packets take, and where do they die?*
- **`dig`** / **`nslookup`** - *Is it DNS? What address does this name actually resolve to?*

## `ping` - reachability and latency

`ping` sends a tiny "are you there?" probe to a host and waits for an "I'm here" reply, over and over. It's the simplest possible question - *can these two machines exchange a packet at all?* - and the round trip also measures how long that exchange takes. (📝 *Round-trip time*, or RTT, is the time from sending a probe to getting its reply - there and back, not one way.)

Its output tells you two things, and only two: **whether replies come back** (reachability) and **how long they take and how consistently** (latency and loss).

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
*What just happened:* the first line already did you a favor - it resolved `example.com` to `93.184.216.34`, so a successful ping quietly proves DNS worked too. Five probes replied, each around `11 ms` and tightly clustered. The summary is the verdict: **`0% packet loss`** (solidly reachable) and a low `mdev` (jitter) of `0.24 ms` - rock-steady timing.

Now a sick connection - same command, very different shape:

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
*What just happened:* two probes never came back (`Request timeout`), and the ones that did swung between `11 ms` and `410 ms`. The summary spells out the trouble: **`40% packet loss`** and huge spread (`mdev` of `186 ms`). The host is technically reachable but the path is congested, overloaded, or failing. `ping` has told you *that* it's bad; it can't tell you *where*. That's the next tool's job.

⚠️ **Gotcha.** "No ping reply" does **not** always mean "host is down." Plenty of servers and firewalls are deliberately configured to ignore ping (ICMP) while happily serving real traffic on, say, port 443. Use ping as a *positive* signal (replies = definitely reachable); treat *no* reply as "inconclusive, check another way," not proof of death.

💡 **Key point.** Read ping in order: (1) the resolved IP on line 1 - DNS worked. (2) `% packet loss` - reachable at all, and reliably? (3) `avg` and `mdev` - fast and steady, or slow and jittery? Three glances, full diagnosis.

## `traceroute` / `tracert` - the path, and where it dies

Your packets don't teleport to the destination - they hop from router to router, each handoff a "hop." `traceroute` (`tracert` on Windows) reveals that hidden chain: it lists every router between you and the destination, in order, with the latency to each - a receipt for the journey, one line per stop.

**The clever trick.** Every packet carries a TTL - "time to live" - a counter of how many hops it's allowed before a router discards it and reports back. `traceroute` sends a packet with TTL 1 (dies at hop 1, which announces itself), then TTL 2 (dies at hop 2), and so on, mapping the path one router deeper each round. You don't need to remember the trick - it just explains why the output is a numbered list of routers getting progressively farther away.

Its output tells you the *path* your traffic takes, and - the part you came for - **the hop where it stops getting through**, which is the location of the problem.

```console
$ traceroute example.com
traceroute to example.com (93.184.216.34), 30 hops max, 60 byte packets
 1  192.168.1.1 (192.168.1.1)        1.92 ms   1.88 ms   2.04 ms
 2  10.0.0.1 (10.0.0.1)             12.4 ms   12.1 ms   12.9 ms
 3  72.14.215.85 (72.14.215.85)     14.0 ms   13.8 ms   14.2 ms
 4  108.170.246.1 (108.170.246.1)   22.7 ms   22.3 ms   23.1 ms
 5  93.184.216.34 (93.184.216.34)   24.1 ms   23.9 ms   24.4 ms
```
*What just happened:* five hops, start to finish. **Hop 1 is your own gateway** (`192.168.1.1`, ~2 ms - Rung 3 from Phase 1, confirmed). Hops 2-4 are routers across your ISP and the internet, latency climbing gently (normal - more distance, more time). **Hop 5 is the destination itself** - the trace reached the end, meaning the path is intact end to end. (Each hop is probed three times, hence three numbers per line.)

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
*What just happened:* the trace got cleanly through hops 1-3, then hit `* * *` and never recovered - each `*` is a probe with no reply. Reading: **your packets travel fine to hop 3, and something at or after hop 4 is swallowing them** - out past your gateway and ISP's first hops, at a router you don't control. That's a fact you can act on (wait it out, route around it, report it), not a guess.

⚠️ **Gotcha.** A few `* * *` in the *middle* of an otherwise-complete trace are often harmless - many routers forward your traffic perfectly but don't reply to the traceroute probes themselves (ICMP de-prioritized or blocked). A trace can show `* * *` at hop 7 and still reach the destination fine at hop 12. The failure that *matters* is when the stars start and the trace **never reaches the destination**.

📝 **Terminology.** A *hop* is one router-to-router handoff. "Three hops out" means three routers between you and there.

## `dig` / `nslookup` - is it DNS?

`dig` ("domain information groper") asks a DNS server one direct question - *what address does this name map to?* - and shows the raw answer. It's the tool that turns "I think it's DNS" into "it is/isn't DNS, here's the proof." (`nslookup` does the same job and ships on Windows by default; `dig` gives more detail and is the one most engineers reach for.)

Its output tells you whether a name resolves at all, *what* it resolves to, and which server gave the answer. When Phase 1's IP-vs-name test pointed at Rung 4, this is the tool that confirms it and shows the actual record.

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
*What just happened:* the two lines that matter are **status** and **answer**. `status: NOERROR` means the lookup succeeded. The `ANSWER SECTION` is the payoff: `example.com.` resolves to an **`A` record** (an IPv4 address) of `93.184.216.34`, with a `3600`-second TTL (how long this answer may be cached). `SERVER: 192.168.1.1#53` shows which resolver answered - your gateway, on standard DNS port 53. (📝 An *A record* maps a name to an IPv4 address; `AAAA` does the same for IPv6.)

Here's the failure that confirms a DNS problem:

```console
$ dig doesnotexist.example

; <<>> DiG 9.18.1 <<>> doesnotexist.example
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 11111
;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 1, ADDITIONAL: 0

;; QUESTION SECTION:
;doesnotexist.example.       IN  A
```
*What just happened:* **`status: NXDOMAIN`** - "non-existent domain" - and `ANSWER: 0`. DNS itself worked fine (it answered you promptly); its answer is "that name does not exist." Very different from a network failure: the lookup machinery is healthy, the *name* is the problem (a typo, an expired record, an unregistered domain). If the command had hung and timed out instead, that points at the DNS server being unreachable - a lower rung.

💡 **Key point.** `dig` separates two failures people constantly confuse: **`NXDOMAIN`** = "DNS works, the name is bad," versus **a timeout / no response** = "I can't even reach the DNS server." The first is a name problem; the second is a network problem one rung lower.

🪖 **War story.** A deploy "broke the API" for half the users and not the others. `ping` to the API's IP was flawless everywhere. But `dig api.internal` returned *different* `A` records depending on who ran it - one office's resolver still had the old, retired server cached, TTL not yet expired. The network was perfect; two populations were resolving the same name to two different machines. Without `dig` showing the actual record each side got, it looked like a baffling intermittent outage.

## Recap

1. **`ping`** answers *reachable + how fast*: read the resolved IP (DNS worked), then `% packet loss` (reachable/reliable?), then `avg`/`mdev` (fast/steady?). No reply ≠ definitely down.
2. **`traceroute`/`tracert`** answers *what path + where it dies*: hop 1 is your gateway, the last hop should be the destination. `* * *` that never reaches the end = the break, and tells you *which hop out*.
3. **`dig`/`nslookup`** answers *is it DNS*: `NOERROR` + an `ANSWER` = name resolves; `NXDOMAIN` = DNS fine, name bad; timeout = can't reach the DNS server (lower rung).
4. Together they cover Rungs 3-5: gateway reachability, the path to the destination, and the name lookup in between.

These three tools see *summaries* - replies, hops, records. When even they can't tell you where a conversation broke, you drop down to watching the actual packets on the wire. That's the last tool, and it's next.

---

[← Phase 1: Work Up the Layers](01-work-up-the-layers.md) · [Guide overview](_guide.md) · [Phase 3: Reading a Packet Capture →](03-reading-a-packet-capture.md)
