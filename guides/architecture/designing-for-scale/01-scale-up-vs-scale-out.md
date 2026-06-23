---
title: "Scale Up vs Scale Out, and Why Statelessness Matters"
guide: "designing-for-scale"
phase: 1
summary: "Scaling up means a bigger box — simple, but capped and a single point of failure. Scaling out means more boxes — the real answer for big scale. The property that makes scaling out possible is statelessness: if any server can handle any request, you can add servers freely."
tags: [scaling, scale-up, scale-out, vertical-scaling, horizontal-scaling, statelessness, session-state]
difficulty: advanced
synonyms: ["scale up vs scale out", "vertical vs horizontal scaling", "what is a stateless server", "why do servers need to be stateless", "what is session state", "can i just buy a bigger server"]
updated: 2026-06-19
---

# Scale Up vs Scale Out, and Why Statelessness Matters

Before any diagrams, let's get the two ways to grow clear in your head — because almost every scaling decision is really a choice between them, and one of them has a hidden requirement that trips up everyone the first time.

You have one server. It's getting busy. There are exactly two directions you can go: make *that machine* more powerful, or run *more machines*. That's it. Everything in this guide is a consequence of which one you pick, and the second one — the one you'll need for real scale — only works if your servers have a specific property. We'll build to that property, because it's the single most important idea here.

## Scale up: a bigger box

📝 **Terminology.** *Scaling up*, also called *vertical scaling*, means giving your existing machine more resources — more CPU cores, more RAM, faster disks. Same machine, same setup, just beefier.

**What it actually is.** Scaling up is replacing your server with a bigger server (or, in the cloud, resizing it to a larger instance type). Nothing about your application changes. It's still one process on one machine; that machine just has more room to breathe.

**Why people reach for it first.** It's wonderfully simple. There's nothing to redesign, no new moving parts, no new failure modes. Your code doesn't know or care that it's running on a bigger box. For a long time, for a lot of applications, this is genuinely the right call — a single modern server is enormous, and resizing an instance is a five-minute job.

**Why it runs out.** Two walls, and you'll hit both eventually:

- **There's a biggest box.** Hardware has a ceiling. You can rent machines with hundreds of gigabytes of RAM, but you cannot rent an infinitely large one, and the price climbs much faster than the power as you approach the top of the range.
- **It's still one machine.** This is the quieter, more dangerous limit. A single box is a single point of failure. When it reboots, restarts, or dies, your *entire* application is down — there is nowhere else for requests to go. No amount of "bigger" fixes "only one."

💡 **Key point.** Scaling up buys time and simplicity, not headroom for the long run. It's the move you make until you can't — and "you can't" usually arrives as either a price you won't pay or an outage you can't afford.

## Scale out: more boxes

📝 **Terminology.** *Scaling out*, also called *horizontal scaling*, means running more machines and spreading the work across them. Instead of one server doing all the work, you have a *pool* of identical servers sharing it.

**What it actually is.** Scaling out is turning "my app server" into "my app servers" — several identical copies of the same application, each on its own machine, each capable of handling requests. When load grows, you add another copy. When it shrinks, you remove one. Capacity becomes a dial you can turn, not a box you have to replace.

**Why this is the real answer for big scale.** It removes both walls at once. There's no single biggest box to worry about, because you're adding boxes, not growing one. And there's no single point of failure, because if one server dies, the others keep serving — the pool absorbs it. This is how every system that handles serious traffic is built. Not one heroic machine; a herd of ordinary ones.

Here's the shape of the two approaches, side by side:

```text
   SCALE UP (vertical)                    SCALE OUT (horizontal)
   ─────────────────────────────         ─────────────────────────────
   one machine, made bigger        │     many identical machines
   nothing to redesign             │     needs stateless servers (below)
   simple, one mental model        │     a pool you add to / remove from
   capped — there's a biggest box  │     scales far past any single box
   one machine = one failure point │     one dies, the rest carry on
   resize and you're done          │     add a load balancer in front (Phase 2)
```

**The catch nobody mentions up front.** Scaling out *sounds* like the obvious win — so why doesn't everyone start here? Because it has a requirement that scaling up doesn't. If you have five identical servers and a request can land on *any* of them, then every server has to be able to handle *any* request, with no special knowledge that only it possesses. The moment one server knows something the others don't, your pool of interchangeable machines stops being interchangeable — and the whole model breaks. That property has a name, and it's the heart of this guide.

## Statelessness: the property that makes scale-out work

📝 **Terminology.** A server is *stateless* when it keeps no per-user, per-conversation information in its own memory between requests. Each request carries (or can look up) everything needed to handle it, so the server can treat every request as if it had never seen this user before. The opposite — *stateful* — means the server remembers things about you locally, and your next request has to come back to *that same server* to find them.

**What it actually is.** A stateless server is one where it genuinely does not matter which machine in the pool handles your request. Request one goes to server A, request two goes to server C, request three goes to server A again — and everything works identically, because none of them is hoarding anything about you in local memory. They're interchangeable. That interchangeability is the entire point: **if any server can handle any request, you can add servers freely.**

**Why this is the unlock.** Go back to the dial. To turn capacity up, you add a server — but a freshly booted server knows *nothing* about any user. If your application requires that the new server somehow already remembers your logged-in session, your shopping cart, or where you are in a multi-step form, then a new server is useless until it magically acquires that knowledge. Statelessness sidesteps the whole problem: there's nothing to remember locally, so a brand-new server is immediately as useful as an old one. Adding capacity becomes trivial precisely *because* no server holds anything special.

**A real example — the same request, two different servers.** Watch what a stateless request looks like. The client sends a token with the request; any server can verify it and respond. Here the same authenticated call hits two different machines and behaves identically:

```console
$ curl -s -H "Authorization: Bearer eyJhbGci..." https://api.example.com/me
{"served_by":"app-server-A","user":"ada","plan":"pro"}

$ curl -s -H "Authorization: Bearer eyJhbGci..." https://api.example.com/me
{"served_by":"app-server-C","user":"ada","plan":"pro"}
```

*What just happened:* The first request was routed to `app-server-A`, the second to `app-server-C` — and you got the same answer both times, with no error, no "who are you?", no re-login. Each server figured out who you were *from the request itself* (the `Authorization` token), not from anything it had stashed in its own memory from a previous request. Neither server needed to have met you before. That's statelessness in one transcript: the server identity changed and nothing else did.

⚠️ **Gotcha — in-memory session state quietly breaks all of this.** The classic mistake is to store per-user data in the server's own memory: the logged-in user object, the contents of a shopping cart, the step of a checkout wizard, an upload-in-progress. On *one* server this works perfectly and feels natural — so it sails through development and through your single-box production. Then you add a second server to scale out, requests start landing on whichever machine is free, and users get randomly logged out, see empty carts, or watch a multi-step form forget step two on step three. The data is sitting in server A's memory, but the request went to server B, which never heard of it. Nothing crashed; it just *forgets* intermittently, which is maddening to debug. The fix is the subject of [Phase 3](03-scaling-the-stateful-bits.md): take the state *out* of the server's local memory and put it somewhere all servers can reach.

🪖 **War story.** A team scaled from one app server to three to handle a launch, deployed on a Friday, and spent the weekend chasing a "random logout" bug that they could never reproduce on their laptops. Of course they couldn't — locally they only ran one server, so every request came back to the same memory. In production, the load balancer was doing exactly its job, fanning requests across all three, and one in three landed on a server that didn't hold the user's session. The bug wasn't random at all. It was the architecture telling them, loudly, that their servers were secretly stateful.

**Why this saves you later.** If you design for statelessness from the start — every request self-describing, nothing important kept in local memory — then scaling out is almost boring. You add a machine, point the load balancer at it, and you're done; there's no migration, no special handling, no "but what about the sessions on the old box?" You've made your servers *cattle, not pets* — identical, disposable, replaceable. That's the foundation the next two phases stand on.

## Recap

1. **Scale up** = a bigger box. Simple and requires no redesign, but it's capped (there's a biggest box) and it's a single point of failure (one machine, one outage).
2. **Scale out** = more identical boxes sharing the work. It's the real answer for serious scale: no single biggest box, and one failure doesn't take everything down.
3. **Scaling out has a requirement: statelessness.** If any server can handle any request, you can add servers freely. That only holds when no server keeps per-user state in its own local memory.
4. **In-memory session state is the silent killer** — it works on one box, then causes intermittent "forgot who you are" bugs the moment you add a second. The fix is to externalize state (Phase 3).

Next, the piece that actually sends each request to one of your interchangeable servers — and the trap that tries to make them stateful again.

---

[← Guide overview](_guide.md) · [Phase 2: Load Balancing →](02-load-balancing.md)
