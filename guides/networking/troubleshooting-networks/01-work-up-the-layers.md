---
title: "Work Up the Layers"
guide: "troubleshooting-networks"
phase: 1
summary: "Instead of guessing, ask one yes/no question per rung - link up? have an IP? reach the gateway? resolve a name? reach the destination? - and the first 'no' is your answer."
tags: [networking, troubleshooting, method, dns, gateway, tcp-ip, layers]
difficulty: intermediate
synonyms: ["how to debug network step by step", "network troubleshooting checklist", "can't reach gateway", "do i have an ip address", "is it dns or the network", "network layers troubleshooting"]
updated: 2026-07-10
---

# Work Up the Layers

When the network is down, the room fills with theories - "it's the DNS," "it's the firewall," "it's their server" - and every guess costs a restart, a config change, a few more minutes of the page still not loading. A network connection isn't one thing; it's a stack of things, each depending on the one beneath it. A guess picks a rung at random.

The fix: **don't guess which rung broke - test them one at a time, bottom up, and stop at the first failure.** Each rung is a single yes/no question. Hit a "no," and you're done diagnosing: everything *below* is proven healthy, everything *above* is irrelevant until this one's fixed. [Phase 2](02-the-core-tools.md) covers the tools that answer these questions.

## The symptom cheat-card

> **Read your symptom, jump to the rung it points at, breathe. You're not guessing anymore.**

| The symptom | What it usually means | Start at |
|---|---|---|
| **Nothing loads** - every site, every app, all at once | Something low broke: no link, no IP, or no gateway | Rung 1 → 2 → 3 (§ below) |
| **One site/service is down**, everything else is fine | The low layers are healthy; it's name resolution or that one destination | Rung 4 (DNS), then Rung 5 |
| **Names fail but raw IPs work** (a URL hangs, but pinging an IP succeeds) | Classic DNS failure - the lookup, not the network | Rung 4 (DNS) |
| **Everything is slow / times out intermittently**, but does eventually work | The path exists but a hop is congested or lossy | Rung 5 (latency + path) - `ping`/`traceroute` |
| **"It's down" but you can't even tell where** | You don't have a fact yet | Rung 1 and walk up - collect facts, not theories |

Now the rungs themselves, bottom to top.

## The layers you're walking up

Each rung maps onto a layer of the TCP/IP model - a network built in stacked levels, each relying on the level below. (If that model is new, [The TCP/IP Model](/guides/tcp-ip-model) is the grounding; you can also just follow the picture below.)

```mermaid
flowchart TD
  r1["Rung 1 - Is the LINK up? (cable / Wi-Fi connected) - Link"]
  r2["Rung 2 - Do I have an IP ADDRESS? (am I a citizen of a net?) - Internet (addressing)"]
  r3["Rung 3 - Can I reach the GATEWAY? (the router off my network) - Internet (routing)"]
  r4["Rung 4 - Can I RESOLVE A NAME? (DNS: turn name → IP) - Application"]
  r5["Rung 5 - Can I reach the DESTINATION? (the far server / API) - Transport/App"]
  r1 -->|yes, walk up| r2 -->|yes| r3 -->|yes| r4 -->|yes| r5
```

📝 **Terminology.** Your *gateway* (or *default gateway*) is the router that connects your local network to everything else. If you can't reach the gateway, you can't reach the internet at all, no matter how healthy your laptop is.

### Rung 1 - Is the link up?

Is there a physical (or Wi-Fi) connection at all? An unplugged cable, a dropped Wi-Fi association, a disabled interface - the network equivalent of "is it plugged in." It's first because nothing above it can work without it, and it's the rung people skip because it feels too dumb to check. Check it anyway.

```console
$ ip link show
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 ...
2: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 ...
```
*What just happened:* `ip link show` lists your network interfaces and their state. `wlan0` is the Wi-Fi adapter; the flags in angle brackets tell the story. `UP` means the interface is administratively enabled; **`LOWER_UP` means the physical/radio link is actually live** - a cable is seated, or Wi-Fi is associated. Missing `LOWER_UP` (or `state DOWN`) means stop here: the cable's out or Wi-Fi dropped. (Windows: `ipconfig`; macOS: `ifconfig` or the Wi-Fi menu.)

⚠️ **Gotcha.** `lo` (loopback) is *always* `UP` - it's the interface your machine uses to talk to itself (`127.0.0.1`). Seeing `lo: UP` tells you nothing about your real connection. Look at the named adapter (`wlan0`, `eth0`, `en0`), never loopback.

### Rung 2 - Do I have an IP address?

Did I get an address on this network? The link can be up, but if your machine never got an IP (usually via DHCP), it isn't a participant - it can send and receive nothing useful.

```console
$ ip addr show wlan0
2: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 ...
    inet 192.168.1.74/24 brd 192.168.1.255 scope global dynamic wlan0
```
*What just happened:* `inet 192.168.1.74/24` is a real, DHCP-assigned address (`scope global dynamic`). You have an IP; move up.

⚠️ **Gotcha.** An address starting with **`169.254.x.x`** (or `fe80::` for IPv6 link-local) is *self-assigned* - your machine asked DHCP for a real one, got no answer, and made one up. That's not "you have an IP," it's "you failed to get one." Treat `169.254.*` as a Rung-2 failure: the DHCP server (often the router) didn't respond. (📝 *DHCP* = the service that automatically leases IP addresses to devices that join the network.)

### Rung 3 - Can I reach the gateway?

Can I talk to the router that's my door to the outside world? You have an address; now prove you can reach the one machine everything off-network depends on. Find the gateway, then ping it.

```console
$ ip route show
default via 192.168.1.1 dev wlan0 ...
$ ping -c 3 192.168.1.1
PING 192.168.1.1 (192.168.1.1) 56(84) bytes of data.
64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=2.31 ms
64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=1.98 ms
64 bytes from 192.168.1.1: icmp_seq=3 ttl=64 time=2.10 ms

--- 192.168.1.1 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
```
*What just happened:* `ip route show` gave the `default` route - the gateway, `192.168.1.1`. `ping` sent three probes and got three replies, `0% packet loss` - your conversation with the router works; any problem is *above* this rung. (Ping details in [Phase 2](02-the-core-tools.md); for now, replies = reachable.) Timeouts here would mean the break is local - your router or the link to it - not some distant server.

### Rung 4 - Can I resolve a name? (DNS)

Can I turn a human name like `example.com` into an IP address? Almost everything you type is a name, and names mean nothing until DNS translates them. This rung is special because it's the single most common cause of "the internet is broken" that *isn't* the network - the path is fine, the lookup is what failed.

The clean test is to compare a *name* against a raw *IP*:

```console
$ ping -c 2 example.com
ping: example.com: Name or service not known
$ ping -c 2 93.184.216.34
64 bytes from 93.184.216.34: icmp_seq=1 ttl=56 time=11.4 ms
64 bytes from 93.184.216.34: icmp_seq=2 ttl=56 time=11.2 ms
```
*What just happened:* pinging the *name* failed with `Name or service not known` - the resolver couldn't find an address. Pinging a raw IP directly *worked*. That split is the signature of a DNS problem: the network carries packets fine (the IP ping proves it), it's the **name-to-address lookup** that's broken. Raw IPs work, names don't → go straight to `dig`/`nslookup` in [Phase 2](02-the-core-tools.md). (See [IP, DNS, and Ports](/guides/ip-dns-and-ports) for how names, addresses, and ports fit together.)

💡 **Key point.** "Is it DNS?" is the most useful single question in network troubleshooting, and the IP-vs-name comparison answers it in two commands. The community joke "It's always DNS" exists because this rung fails *constantly* and looks like a total outage when it isn't.

### Rung 5 - Can I reach the destination?

With a name resolved to an IP, can I actually reach *that specific server* - and how well? This is the top of the stack: link, address, gateway, and DNS are all proven, so anything wrong now is out in the path or at the far end. Two things matter here: does it reply at all (reachability), and how slowly/reliably (latency and loss).

```console
$ ping -c 4 93.184.216.34
64 bytes from 93.184.216.34: icmp_seq=1 ttl=56 time=11.4 ms
64 bytes from 93.184.216.34: icmp_seq=2 ttl=56 time=11.2 ms
64 bytes from 93.184.216.34: icmp_seq=3 ttl=56 time=243 ms
64 bytes from 93.184.216.34: icmp_seq=4 ttl=56 time=11.6 ms

--- 93.184.216.34 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 11.2/69.3/243/100.1 ms
```
*What just happened:* all four probes came back (`0% packet loss`) - reachable - but probe 3 spiked to `243 ms` against a ~11 ms baseline. One slow spike is normal jitter; if *most* probes were that high, or some never returned, that's a path problem (a congested or failing hop) - reach for `traceroute` to find *where*.

🪖 **War story.** "The whole site is down." Walking the rungs: link up, IP fine, gateway pings in 2 ms, raw IP to the server pings fine too - but the site's *name* wouldn't resolve. Rung 4. A DNS record had quietly expired; the servers, network, and path were healthy the entire time. Ten minutes of "restart the load balancers" would have changed nothing.

## Recap

1. A connection is a **stack of layers**; debug by walking *up* it and stopping at the first "no."
2. **Rung 1 - link:** is the interface `LOWER_UP`? (Ignore `lo`.)
3. **Rung 2 - IP:** do you have a real address, not a `169.254.*` self-assigned one?
4. **Rung 3 - gateway:** can you ping the `default` route? If not, the break is local.
5. **Rung 4 - DNS:** name fails but raw IP works = it's DNS, the most common "outage" that isn't one.
6. **Rung 5 - destination:** reachable? how's the latency and loss? This hands you off to `traceroute`.

You now have the method. Next, the three tools that answer rungs 3 through 5 - and what their output is really telling you.

---

[← Guide overview](_guide.md) · [Phase 2: The Core Tools →](02-the-core-tools.md)
