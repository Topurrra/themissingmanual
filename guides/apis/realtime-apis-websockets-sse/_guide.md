---
title: "Realtime APIs: WebSockets vs SSE vs Polling"
guide: "realtime-apis-websockets-sse"
phase: 0
summary: "How to push live updates: the honest tradeoffs between polling, Server-Sent Events, and WebSockets, and which to reach for when."
tags: [realtime, websockets, sse, polling, streaming, apis]
category: apis
order: 10
difficulty: intermediate
synonyms: ["websockets vs sse", "how to push live updates", "server sent events explained", "realtime api", "long polling vs websockets", "do i need websockets", "live updates without polling", "sse vs websocket vs polling"]
updated: 2026-07-10
---

# Realtime APIs: WebSockets vs SSE vs Polling

You've built the feature, and now someone wants it *live*. The dashboard should tick up without a
refresh. The chat should land instantly. The "3 people are typing" dot should actually move. And you're
staring at a plain HTTP API thinking: it answers when I ask, but it can't tap me on the shoulder. That
gap — between request/response and "tell me the moment something changes" — is exactly the one this
guide closes.

The relief: there are only three patterns worth knowing, and they line up from simplest to most powerful.
**Polling** fakes realtime by asking on a loop. **Server-Sent Events** opens a one-way pipe so the server
can stream updates to the browser over plain HTTP. **WebSockets** open a two-way pipe for when both sides
need to talk. The whole skill is picking the *simplest one that fits* — and knowing the scaling traps
before they page you at 3am.

## How to read this

- **Need to ship something live this week?** Phase 1 names the three patterns and gives you a decision
  rule you can apply in a minute. Phase 2 is the hands-on core: real SSE and WebSocket code you can
  copy.
- **Want it to actually make sense?** Read in order. Phase 1 builds the mental model, Phase 2 shows how
  each one really works, and Phase 3 covers the parts that bite at scale — sticky sessions, fan-out, and
  knowing when *not* to reach for WebSockets.

## The phases

1. **[Why HTTP Can't Push](01-why-http-cant-push.md)** — the core mental model: request/response is a
   pull, realtime needs a push, and the three patterns (polling, SSE, WebSockets) are three different
   ways to fake or build that push.
2. **[The Three Patterns in Practice](02-the-three-patterns.md)** — the everyday core: long-polling,
   a real SSE stream with auto-reconnect, and a full-duplex WebSocket, with the comparison table that
   tells you which to grab.
3. **[When It Breaks at Scale](03-when-it-breaks-at-scale.md)** — the deeper payoff: why one server is
   easy and many servers are hard, sticky sessions, fan-out with a pub/sub backplane, and the honest
   case for reaching for the *simplest* pattern.

[Phase 1: Why HTTP Can't Push](01-why-http-cant-push.md) →
