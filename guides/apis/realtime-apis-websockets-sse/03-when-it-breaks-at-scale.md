---
title: "When It Breaks at Scale"
guide: "realtime-apis-websockets-sse"
phase: 3
summary: "One server is easy; many servers is the hard part. Sticky sessions, the fan-out problem, a pub/sub backplane, and the honest case for reaching for the simplest pattern that fits."
tags: [scaling, sticky-sessions, fan-out, pubsub, websockets, sse, realtime]
difficulty: intermediate
synonyms: ["how to scale websockets", "sticky sessions websocket", "websocket fan out", "redis pubsub websocket", "realtime scaling problem", "load balancer websocket", "how to broadcast to all clients"]
updated: 2026-07-10
---

# When It Breaks at Scale

Everything in Phase 2 works beautifully — on one server. You demo it, it's instant, everyone's happy.
Then traffic grows, you add a second server behind a load balancer, and realtime quietly breaks in a way
that's maddening to debug: messages arrive for *some* users and vanish for others, seemingly at random.
Nothing is wrong with your code. The problem is that a persistent connection and a stateless load
balancer fundamentally disagree, and this phase is about that fight.

This is the payoff phase. Once you see *why* one server is easy and many is hard, the whole landscape of
"realtime at scale" — sticky sessions, backplanes, fan-out — stops being jargon and becomes one
problem with a couple of standard solutions.

## Why one server is easy and many is hard

On a single server, every connected client is *right there* — they're entries in one in-memory list. To
broadcast a message, you loop over the list and write to each. Done.

Connections are long-lived and *pinned to whichever server accepted them.* Alice's WebSocket lives on
Server A; Bob's lives on Server B. Now Alice sends a chat message. It arrives at Server A. Server A loops
over *its* list of connections — which doesn't include Bob. Bob never hears it. The message is stranded
on the wrong machine.

```mermaid
flowchart TB
  A[Alice] -->|connected to| S1[Server A]
  B[Bob] -->|connected to| S2[Server B]
  A -->|sends message| S1
  S1 -.->|knows only A| A
  S1 -.x|can't reach Bob| B
```
Alice's message reached Server A, but Bob's connection lives on Server B. Server A has no way to push to
a client it isn't holding. With persistent connections, your clients are scattered across machines, and
no single machine can see them all.

📝 **Terminology.** This is the **fan-out** problem: one incoming event has to reach *many* connected
clients, but those clients are spread across servers that don't share memory. Solving fan-out is the
core of scaling any realtime system.

## Problem one: the load balancer keeps cutting the line

Before fan-out even bites, there's a more basic break. A normal load balancer spreads each *request*
across servers — that's its whole job. But a WebSocket or SSE stream is *one* long-lived connection that
must stay on the server that's holding it. Worse, the handshake and the upgrade can land on different
servers, and the connection dies before it starts.

**The fix: sticky sessions.** You configure the load balancer so that once a client lands on a server,
it *stays* on that server for the life of the connection (often keyed by a cookie or source IP).

```text
Without stickiness:  Alice's upgrade → Server A
                     Alice's frames  → Server B   ✗ (B never saw the handshake — dies)

With stickiness:     Alice's upgrade → Server A
                     Alice's frames  → Server A   ✓ (same server, connection survives)
```
Sticky sessions pin a client to one server so the long-lived connection isn't ripped apart by ordinary
load balancing. It's the first thing to check when WebSockets "randomly" disconnect behind a load
balancer — and a config most teams forget until it bites.

⚠️ **Stickiness is necessary but not sufficient.** Pinning Alice to Server A keeps *her* connection
alive, but it does nothing to get her message to Bob on Server B. Sticky sessions fix the connection
problem; they don't fix fan-out. People frequently turn on stickiness, see connections stabilize, and
are baffled that cross-server messages still vanish.

## Problem two: getting the message to the other servers

To deliver Alice's message to Bob, Server A needs a way to shout to *every* server "here's a message for
room `general`," and each server then pushes it to its own local connections in that room. That shared
shout-channel is a **backplane**, and it's almost always a pub/sub system.

**How it works.**
1. Every server **subscribes** to the backplane (commonly Redis pub/sub, or a message broker).
2. Alice's message hits Server A. Server A **publishes** it to the backplane instead of only looping its
   own list.
3. The backplane **fans it out** to every subscribed server.
4. Each server pushes the message to *its* local connections for that room. Bob, on Server B, finally
   gets it.

```mermaid
flowchart LR
  A[Alice] --> S1[Server A]
  S1 -->|publish| PS[(Pub/Sub backplane)]
  PS -->|fan-out| S1
  PS -->|fan-out| S2[Server B]
  S2 --> B[Bob]
```
No single server has to know every client anymore. Servers only know their *own* connections; the
backplane is the shared nervous system that carries every message to every server. This one pattern —
publish to a backplane, fan out to local connections — is how essentially all large realtime systems
scale.

🪖 **War story.** A chat app worked flawlessly in staging (one server) and broke the day it scaled to
three in production. Messages reached maybe a third of users — exactly the fraction who happened to share
a server with the sender. The team chased "dropped packets" for a week. The actual fix was one
component they'd never added because they'd never needed it on one box: a Redis pub/sub backplane. The
lesson — realtime bugs that only appear with more than one server are almost always fan-out.

💡 **Key point.** SSE has the *exact same* fan-out problem as WebSockets. It's one-directional, but the
server-to-many-clients broadcast still has to reach clients scattered across machines. SSE being simpler
on the connection side does not make it simpler to scale the *broadcast* — you still need a backplane.

## The honest tradeoff: cost grows with connections

Persistent connections don't scale like stateless requests. A stateless API server can handle a request
and forget it; a realtime server holds *every* connection open simultaneously, each consuming memory and
a file descriptor whether or not it's doing anything. Ten thousand idle WebSockets still cost ten
thousand connections.

That reframes the whole "which pattern" question one last time:

- **Polling** spreads load across short requests your existing infrastructure already handles — no sticky
  sessions, no backplane, no held connections. For rare updates it's not the lazy choice, it's the
  *operationally cheapest* one.
- **SSE** needs a backplane for fan-out but inherits the browser's reconnect and rides plain HTTP/2 — the
  middle of the road.
- **WebSockets** need sticky sessions, a backplane, *and* your own reconnect/heartbeat logic. Powerful,
  and the most to operate.

⚠️ **Don't pay for realtime you don't use.** Every persistent connection is a standing cost and a thing
that can break at scale. If a feature is fine updating on the user's next action, give it nothing. If it
needs live data one way, SSE. Only the genuinely two-way, high-traffic features have earned WebSockets
and the backplane that comes with them.

## For builders

When you design a realtime feature, design the *scaled* version on paper from day one, even if you ship
single-server first. Ask: when there are N servers, how does a message reach a client on a different one?
If the answer isn't "via a backplane," you have a bug that's invisible until your second server. And keep
climbing *down* the ladder when you can — the cheapest realtime system is the one that's actually plain
polling because the data didn't move fast enough to justify more.

For the cross-system cousin of this problem — services handing events to each other rather than to
browsers — the durable, queue-based tools live in [Webhooks & Message
Queues](/guides/webhooks-and-message-queues); a pub/sub backplane is the realtime, in-memory relative of
those same ideas.

## Recap

1. **One server is easy** (one in-memory list of clients); **many servers is hard** because connections
   are pinned to whichever machine accepted them.
2. **Sticky sessions** keep a long-lived connection on one server so the load balancer doesn't tear it
   apart — necessary, but it does *not* solve fan-out.
3. **Fan-out** (one event → many clients across servers) is solved with a **pub/sub backplane**: servers
   publish to it and each pushes to its own local connections. SSE needs this too.
4. **Connection cost is the real tradeoff.** Polling rides existing infra; SSE adds a backplane;
   WebSockets add stickiness, a backplane, and DIY reconnect. Pick the simplest that fits, and design the
   N-server version up front.

That's the whole arc: HTTP can't push, three patterns fake or build the push, and at scale they all bow
to the same fan-out problem. Reach for the lightest tool that does the job, and you'll ship realtime that
stays calm at 3am.

```quiz
[
  {
    "q": "Why do realtime messages reach only some users once you scale from one server to several?",
    "choices": [
      "The database can't keep up",
      "Each persistent connection is pinned to one server, and a server can only push to clients it's holding",
      "The browser limits messages per second",
      "TLS drops messages across servers"
    ],
    "answer": 1,
    "explain": "Connections live on whichever server accepted them. A message arriving at Server A can't reach a client whose connection lives on Server B — that's the fan-out problem."
  },
  {
    "q": "What do sticky sessions fix, and what do they NOT fix?",
    "choices": [
      "They fix fan-out but not reconnection",
      "They keep a connection pinned to one server, but they do not deliver a message to clients on other servers",
      "They fix everything about scaling realtime",
      "They replace the need for a backplane"
    ],
    "answer": 1,
    "explain": "Stickiness keeps a long-lived connection alive on one server. Getting a message to clients on other servers still requires a pub/sub backplane."
  },
  {
    "q": "How does a pub/sub backplane solve cross-server fan-out?",
    "choices": [
      "It moves all clients onto one server",
      "Each server publishes incoming messages to the backplane, which fans them out to all servers so each pushes to its own local connections",
      "It disables sticky sessions",
      "It converts WebSockets to polling"
    ],
    "answer": 1,
    "explain": "No server knows every client. Servers publish to the backplane, it relays to all subscribers, and each server delivers to the connections it holds — that's the standard scaling pattern."
  }
]
```

---

[← Phase 2: The Three Patterns in Practice](02-the-three-patterns.md) · [Guide overview](_guide.md)
