---
title: "Security & the Edge"
guide: "designing-an-enterprise-network"
phase: 3
summary: "The perimeter and beyond — firewalls and stateful filtering, the DMZ that keeps public-facing services apart from the internal network, VPNs for secure remote access, and why zero-trust thinking replaces blind faith in the perimeter. Ties the whole design back to segmentation."
tags: [networking, security, firewall, stateful-firewall, dmz, vpn, zero-trust, perimeter, network-security]
difficulty: advanced
synonyms: ["what is a firewall", "stateful vs stateless firewall", "what is a dmz network", "how does a vpn work", "what is zero trust networking", "how to secure an enterprise network edge"]
updated: 2026-06-19
---

# Security & the Edge

Everything so far has been about *shape* — dividing the network and keeping it standing. This phase is about *defense*: the line where your network meets the internet, and the uncomfortable modern realization that a single line was never going to be enough.

The old mental model was a castle: a hard wall around the outside, and everything inside trusted because it was inside. That model has a fatal flaw, and naming it now sets up the whole phase: **a flat trusted interior is a breach waiting to spread.** Once an attacker is past the wall — through a phished password, a compromised laptop, a vulnerable public service — a castle gives them free run of everything inside. So we build a strong edge *and* we stop trusting the interior blindly. The edge tools (firewall, DMZ, VPN) are the wall and its gates; zero-trust is the admission that you need locks on the inside doors too — which is exactly what Phase 1's segmentation was quietly building toward.

## Firewalls — the gate that decides

**What it actually is.** A **firewall** is a device or service that sits at a network boundary and decides, packet by packet, what's allowed to pass. It enforces a policy — a set of rules saying which traffic may cross between which zones — and its default disposition, on any firewall worth the name, is *deny*: if no rule explicitly permits a flow, it's blocked.

**Why people get this wrong.** The naive picture is a firewall as a simple checklist: "allow port 443, block port 23," judging each packet in isolation. That's a **stateless** firewall, and it's clumsy — to allow a reply to a connection you started, you'd have to permit a wide range of inbound traffic, which is exactly what you don't want. Real firewalls are **stateful**.

📝 **Terminology.** *Stateless filtering* = each packet judged on its own, by fixed rules, with no memory. *Stateful filtering* = the firewall tracks active connections (a "state table") and judges packets in the context of the conversation they belong to.

**What stateful really buys you.** A stateful firewall remembers the connections it has allowed. When an internal user opens a connection out to a web server, the firewall notes that conversation; the server's replies are recognized as *part of a connection we permitted* and let back in automatically — while an *unsolicited* inbound packet, one that isn't part of any established conversation, is dropped. You write rules about who may *start* a conversation, and the return traffic takes care of itself.

```text
   STATEFUL FIREWALL — judges packets in the context of a conversation

   inside ──► "start a connection to web server :443"  ──►  ALLOWED
                              │  (firewall records this flow in its state table)
                              ▼
   web server's reply  ──────────────────────────────►  ALLOWED
                              (recognized as part of the permitted flow)

   random inbound packet, no matching flow  ──────────►  DROPPED
                              (nobody on the inside asked for this)

   default disposition: anything not explicitly permitted is DENIED.
```

**A real example.** Firewall rules read as a top-to-bottom policy. Here's a small stateful ruleset and what it's saying:

```console
# policy: default deny; allow outbound web; allow established replies back in
$ sudo nft list ruleset
table inet filter {
    chain input {
        type filter hook input priority 0; policy drop;
        ct state established,related accept   # replies to flows we started
        ct state invalid drop                 # malformed / orphaned packets
        iif "lo" accept                       # the host's own loopback
        tcp dport 22 ip saddr 10.10.20.0/24 accept   # SSH only from the admin subnet
    }
}
```

*What just happened:* The chain's `policy drop` sets the default to **deny** — the safe starting point. The `ct state established,related accept` line is the stateful heart: traffic belonging to a connection already permitted is allowed back, so you never write rules for return packets. `ct state invalid drop` discards packets that match no real conversation. The last line shows segmentation and the firewall working *together*: SSH is permitted, but only when the source address is in the admin subnet (`10.10.20.0/24`) from Phase 1 — a rule that would be impossible to write on a flat network where "the admin subnet" doesn't exist as a concept.

**Why this saves you later.** When an audit asks "what can reach the database?", the firewall policy *is* the answer, in writing. And because the default is deny, the failure mode of a forgotten rule is "something is blocked" (annoying, safe) rather than "something is wide open" (quiet, catastrophic).

## The DMZ — a place for things the public must reach

Here's a tension. Some of your services *have* to be reachable from the internet — a public website, a mail server, a VPN gateway. But anything reachable from the internet is, by definition, exposed to attack. You can't put those services deep inside the trusted network (a compromise would land an attacker right among your crown jewels), and you can't leave them fully outside (you still need to manage them).

**What it actually is.** A **DMZ** (demilitarized zone) is a separate, tightly-controlled segment that sits between the internet and your internal network, holding exactly the services that must face the public. It's its own zone — its own VLAN and subnet, in Phase 1's terms — with firewall rules on *both* sides.

**What it does in real life.** The firewall lets the internet reach the DMZ on specific ports (the website on 443, say) — and that's *all* the internet can touch. Critically, the rules from the DMZ *into* the internal network are extremely tight: the public web server can reach the one internal database it needs, on the one port it needs, and nothing else. So if that public-facing server is compromised — and public-facing servers are the ones most likely to be — the attacker is stuck in the DMZ, holding a box that can't freely reach anything valuable.

```text
                          ┌───────────┐
        INTERNET ───────► │ FIREWALL  │
                          └─────┬─────┘
                  allow :443    │    deny everything else inbound
                                ▼
                       ┌─────────────────┐
                       │      DMZ         │   public web / mail / VPN gateway
                       │  (own VLAN+subnet)│   reachable from the internet
                       └────────┬─────────┘
                  VERY TIGHT rules: DMZ → internal only on the
                  exact port(s) a public service legitimately needs
                                │
                          ┌─────┴─────┐
                          │ FIREWALL  │
                          └─────┬─────┘
                                ▼
                       ┌─────────────────┐
                       │ INTERNAL NETWORK │   workstations, servers, databases
                       │ (the zones from  │   NOT directly reachable from outside
                       │   Phase 1)       │
                       └─────────────────┘
```

⚠️ **Gotcha.** A DMZ only works if the inward rules stay tight. The slow failure is convenience creep — over months, someone needs the DMZ server to reach "just one more" internal system, then another, until the DMZ can reach half the internal network and the whole separation is hollow. A DMZ that can reach everything inside isn't a DMZ; it's an attacker's launchpad with extra steps. Review those inbound-to-internal rules like they matter, because they do.

## VPNs — letting the right people in from outside

Your people aren't always in the building. They work from home, from hotels, from cafés — and they need to reach internal systems that, correctly, are *not* exposed to the public internet. The wrong fix is to poke holes in the firewall for each remote person. The right fix is a VPN.

**What it actually is.** A **VPN** (Virtual Private Network) builds an encrypted tunnel across the untrusted internet, so a remote device behaves, network-wise, as if it were plugged in *inside* the network. Traffic in the tunnel is encrypted end to end, so even though it crosses the public internet, nobody in between can read or tamper with it.

📝 **Terminology.** *Tunnel* = an encrypted connection that carries your private network's traffic inside it across a public network. *VPN gateway / concentrator* = the device at the network edge (often living in the DMZ) that terminates remote VPN connections and authenticates the users behind them.

**What it does in real life.** The remote user authenticates to the VPN gateway — ideally with more than a password (a second factor: a code, a hardware key). Once the tunnel is up, their laptop is handed an internal-style address and can reach internal resources *through the gateway*, subject to the same firewall and segmentation rules as anyone inside. The VPN doesn't bypass your security model; it extends the *edge* out to the remote user and then applies the same rules.

⚠️ **Gotcha.** A VPN that grants full, flat access to the entire internal network the instant someone connects re-creates the very castle problem we're trying to escape — now with the drawbridge handed to anyone who can phish one password. This is precisely why a second authentication factor on the VPN is non-negotiable, and why what a connected user can *reach* should still be limited by zone, not flung wide open. Which brings us to the idea that ties this whole guide together.

## Zero-trust — locks on the inside doors

The castle model trusts the interior: get inside, and you're trusted. Every gotcha in this phase has been a variation on the same wound — the breached DMZ server, the over-broad VPN, the compromised laptop — and each is only catastrophic *because* the interior is trusted and flat.

**What it actually is.** **Zero-trust** is a design philosophy that drops the assumption that "inside" equals "trusted." Instead, every request to reach a resource is verified — *who* is asking, *what* device they're on, *whether* they're authorized for that specific resource — regardless of where the request comes from. The slogan is "never trust, always verify." There's no soft, trusting interior to exploit, because there's no interior the system trusts by default.

**How it ties back to segmentation.** You don't reach zero-trust by buying a product; you reach it by taking Phase 1 to its conclusion. Segmentation already gave you zones with rules at every boundary. Zero-trust pushes that further — smaller zones, verification at *every* hop rather than only at the outer wall, identity checked per request — until "I'm inside the network" grants you nothing on its own. The firewall, the DMZ, and the VPN are the strong edge; zero-trust is the recognition that the edge will eventually be crossed, and that a breach should find *another locked door* at every step instead of an open hallway.

> 💡 **The one idea to keep.** A strong perimeter is necessary and not sufficient. Build the wall — *and* assume it will be breached, and make sure the breach hits a contained zone, not the whole company. That single sentence is segmentation, scaling, and security all arguing for the same thing.

## Recap

1. The shift: a **flat trusted interior is a breach waiting to spread** — build a strong edge *and* stop trusting the inside blindly.
2. **Firewalls** enforce a default-**deny** policy at boundaries; **stateful** filtering tracks connections so replies to flows you started are allowed automatically while unsolicited inbound traffic is dropped.
3. The **DMZ** isolates public-facing services in their own zone with tight rules on both sides, so a compromise of an exposed server stays trapped — *if* you resist convenience creep on the inward rules.
4. A **VPN** extends the edge to remote users with an encrypted tunnel; demand a second authentication factor and keep their reach limited by zone, never flat-and-full.
5. **Zero-trust** drops "inside = trusted" and verifies every request — it's segmentation taken to its conclusion, so a breach meets another locked door at every hop.
6. The whole guide, in one line: **divide it, keep it standing, and assume the wall will fall — so the blast radius is one zone, not everything.**

You can now look at a real enterprise network diagram and reason about why each box sits where it does. For the machinery beneath this model — routing protocols, switch-loop prevention, and vendor configuration — see the follow-up guides noted in the overview.

---

[← Guide overview](_guide.md) · [Phase 2: Scaling & Reliability ←](02-scaling-and-reliability.md)
