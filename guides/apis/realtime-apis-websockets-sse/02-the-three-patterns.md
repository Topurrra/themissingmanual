---
title: "The Three Patterns in Practice"
guide: "realtime-apis-websockets-sse"
phase: 2
summary: "Hands-on: long-polling that holds the request open, a real SSE stream the browser reconnects for free, and a full-duplex WebSocket - plus the comparison table that tells you which to grab."
tags: [sse, websockets, long-polling, eventsource, realtime, code]
difficulty: intermediate
synonyms: ["how to use server sent events", "eventsource example", "websocket example javascript", "long polling example", "sse vs websocket code", "how to stream updates to browser", "realtime api tutorial"]
updated: 2026-07-10
---

# The Three Patterns in Practice

You've got the mental model: HTTP can't push, and there are three ways around it. Now let's make them
real. We'll go up the ladder - polling, then SSE, then WebSockets - and for each one you'll see the
actual code on both ends and exactly what travels over the wire. By the end you'll be able to copy the
right pattern, not only name it.

A small grounding note before we start: all three of these run *over the same TCP connections your
browser already uses.* Nothing magic, no new network. They're different conventions for keeping a
conversation going past the usual one-request-one-reply.

## Polling and its smarter cousin, long-polling

**Plain polling - ask on a timer.**
```javascript
// Client: ask every 5 seconds, forever.
setInterval(async () => {
  const res = await fetch("/api/messages?since=" + lastId);
  const msgs = await res.json();
  if (msgs.length) render(msgs);
}, 5000);
```
Every 5 seconds you fire a request asking "anything after `lastId`?" Most of the time the answer is an
empty array - wasted round-trips - and a new message can sit unseen for up to 5 seconds. Cheap to build,
but it's a tax you pay forever.

**Long-polling - let the server hold the line.** The trick: the server *doesn't answer immediately.* It
holds your request open until it actually has something, or until a timeout, then replies. The client
gets the answer the moment it exists, then immediately reconnects.

```javascript
// Client: reconnect the instant the server answers.
async function longPoll() {
  while (true) {
    const res = await fetch("/api/messages?since=" + lastId);
    const msgs = await res.json();   // resolves only when there's news (or a timeout)
    if (msgs.length) { render(msgs); lastId = msgs.at(-1).id; }
  }
}
longPoll();
```
The `await` parks here until the server sends something back, instead of you hammering on a timer. You
get near-instant delivery with no persistent connection - but you're still opening a fresh HTTP request
per message, and a held-open request ties up a server slot. Long-polling is the plain fallback when SSE
and WebSockets aren't available; otherwise, climb the ladder.

📝 **Terminology.** "Long-polling" sounds like a kind of polling, but it behaves like a push: the latency
is "as soon as there's news," not "next time the timer fires." The cost is connection churn - a new
request after every single delivery.

## Server-Sent Events: one stream, server to client

This is the one most people *should* be reaching for and don't. SSE keeps a single HTTP response open
and dribbles events down it. The browser's `EventSource` handles the connection - including reconnecting
if it drops - so you write almost nothing.

**The client - the whole thing.**
```javascript
const stream = new EventSource("/api/stream");

stream.onmessage = (event) => {
  const data = JSON.parse(event.data);
  render(data);
};

stream.onerror = () => {
  // EventSource is ALREADY retrying. You don't reconnect by hand.
  console.log("connection dropped - browser is reconnecting...");
};
```
Three lines and you have a live feed. `onmessage` fires every time the server sends an event. When the
line drops, `EventSource` reconnects on its own and even tells the server where you left off - that
auto-reconnect is the single biggest reason to prefer SSE over a hand-rolled WebSocket for one-way data.

**The server - what it actually sends.** SSE isn't JSON-over-HTTP; it's a tiny text format. The
content type is `text/event-stream`, and each event is `data:` lines ending in a blank line.

```text
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"price": 142.10}

data: {"price": 142.35}

id: 48
data: {"price": 142.80}
```
One response that never ends. Each `data:` block is one event the browser hands to `onmessage`. The `id:`
line is the magic behind reconnect - the browser remembers the last id and sends it back as a
`Last-Event-ID` header when it reconnects, so the server can resume from where you dropped instead of
replaying everything.

**The server side, in code.**
```javascript
// Express-style handler.
app.get("/api/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const tick = setInterval(() => {
    res.write(`data: ${JSON.stringify({ price: nextPrice() })}\n\n`);
  }, 1000);

  req.on("close", () => clearInterval(tick));  // stop when the client leaves
});
```
You set the streaming headers, then `res.write()` an event whenever you have news - note the `\n\n` that
ends each event. Crucially, you clean up on `close`, or you'll leak a timer (and eventually a connection)
for every client who ever wandered off. That cleanup is the most-forgotten line in SSE code.

⚠️ **The six-connection cap (HTTP/1.1).** Over HTTP/1.1 a browser allows only ~6 connections per domain,
and an open SSE stream eats one of them *per tab.* Open the app in a few tabs and you can starve your own
page of connections. The fix is HTTP/2, which multiplexes many streams over one connection - so serve
SSE over HTTP/2 in production and the cap effectively disappears.

## WebSockets: a two-way pipe

When both sides need to talk, you want a WebSocket. It starts life as a normal HTTP request that asks to
*upgrade* the connection, and once that handshake succeeds, the same TCP connection becomes a two-way
channel where either side sends whenever it likes.

**The handshake - how a WebSocket is born.**
```console
GET /chat HTTP/1.1
Host: yourapp.example
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
```
The client asked HTTP to "upgrade" to the WebSocket protocol; the server agreed with a
`101 Switching Protocols`. From this point the connection is no longer request/response - it's an open,
two-way pipe. That `101` is the moment a WebSocket exists.

**The client.**
```javascript
const ws = new WebSocket("wss://yourapp.example/chat");

ws.onopen  = () => ws.send(JSON.stringify({ type: "join", room: "general" }));
ws.onmessage = (event) => render(JSON.parse(event.data));

ws.onclose = () => {
  // Unlike SSE, NOTHING reconnects for you. You must do it yourself.
  setTimeout(connect, 1000);
};
```
You can `send()` to the server *and* receive via `onmessage`, both directions, any time - that's the
full-duplex superpower SSE doesn't have. But notice `onclose`: WebSockets give you *no* automatic
reconnect. If you want it (and you do), you write the retry loop, the backoff, and the heartbeats
yourself. That extra labor is the real price of WebSockets.

💡 **Key point.** Use `wss://` (TLS), never `ws://`, in production - same reasoning as `https`. Plenty of
corporate proxies also drop plain `ws://` while letting `wss://` through, so TLS isn't only about
secrecy here, it's about the connection surviving at all.

## The comparison table

Pin this. It's the whole guide compressed:

| | Polling | Long-polling | SSE | WebSockets |
|---|---|---|---|---|
| **Direction** | client pulls | client pulls | server → client | both ways |
| **Connection** | new each time | held, then re-opened | one, long-lived | one, long-lived |
| **Protocol** | plain HTTP | plain HTTP | plain HTTP | upgraded from HTTP |
| **Auto-reconnect** | n/a | manual | **built in** | **manual** |
| **Browser API** | `fetch` | `fetch` | `EventSource` | `WebSocket` |
| **Latency** | up to interval | near-instant | near-instant | near-instant |
| **Best for** | rare updates | fallback | feeds, notifications, dashboards | chat, games, collaboration |
| **Main cost** | wasted requests | connection churn | one-way only | most complexity |

⚠️ **Don't open a connection per number.** A persistent SSE or WebSocket connection has a real cost - it
holds a server resource for as long as it's open. For a value that changes every few minutes, polling is
genuinely the *better* engineering, not the lazy one. Reserve persistent connections for genuinely live
data.

## For builders

Start at the bottom of the table and stop the moment a row fits. Most "live" features are feeds or
dashboards - that's SSE, and the browser does the hard part (reconnect, resume) for free. Only climb to
WebSockets when you can point at a client→server message that has to fly *upward* constantly. And before
either, ask whether plain polling at a sane interval is genuinely good enough; very often it is, and it's
the only one of the four with no persistent-connection bill.

## Recap

1. **Polling** asks on a timer (wasteful); **long-polling** holds the request open so the answer arrives
   the instant there's news - the plain fallback when SSE/WebSockets aren't options.
2. **SSE** is a one-way `text/event-stream` the server keeps open; `EventSource` reconnects and resumes
   for free. Clean up on client `close`, and serve over HTTP/2 to dodge the 6-connection cap.
3. **WebSockets** upgrade an HTTP request (the `101`) into a two-way pipe - full-duplex, but you write
   your own reconnect, backoff, and heartbeats. Use `wss://`.
4. **The table picks for you:** receive-only feed → SSE; both sides talk constantly → WebSockets; rare
   updates → polling.

You can now build any of the three. The last thing that separates a demo from production is what happens
when one server becomes ten - and that's where realtime gets genuinely hard.

```quiz
[
  {
    "q": "What makes long-polling feel like a push even though it uses ordinary HTTP requests?",
    "choices": [
      "It sends many requests per second",
      "The server holds the request open until it has news, so the answer arrives the moment it exists",
      "It uses a special long-polling protocol",
      "It keeps one connection open forever like SSE"
    ],
    "answer": 1,
    "explain": "Long-polling parks the request on the server until there's something to say (or a timeout), so latency is 'as soon as there's news' rather than 'next timer tick'."
  },
  {
    "q": "Why is SSE often preferred over a hand-rolled WebSocket for a one-way feed?",
    "choices": [
      "SSE is binary and therefore faster",
      "SSE supports two-way messaging",
      "The browser's EventSource reconnects automatically and can resume via Last-Event-ID, so you write almost nothing",
      "WebSockets can't carry JSON"
    ],
    "answer": 2,
    "explain": "For one-way data, EventSource handles reconnect and resume for free. WebSockets give you no automatic reconnect - you'd build it yourself."
  },
  {
    "q": "What does the HTTP 101 Switching Protocols response signify in a WebSocket setup?",
    "choices": [
      "An error opening the stream",
      "The server agreed to upgrade the HTTP connection into a two-way WebSocket pipe",
      "The client must poll instead",
      "The TLS handshake completed"
    ],
    "answer": 1,
    "explain": "A WebSocket starts as an HTTP request asking to upgrade; the server's 101 Switching Protocols confirms it, and the connection becomes full-duplex from then on."
  }
]
```

---

[← Phase 1: Why HTTP Can't Push](01-why-http-cant-push.md) · [Guide overview](_guide.md) · [Phase 3: When It Breaks at Scale →](03-when-it-breaks-at-scale.md)
