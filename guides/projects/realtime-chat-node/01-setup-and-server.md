---
title: "Setup and a WebSocket Server"
guide: realtime-chat-node
phase: 1
summary: "Set up a Node project, install the ws library, and run a server that accepts WebSocket connections and logs every message it receives."
tags: [nodejs, websockets, ws, setup, server]
difficulty: intermediate
synonyms:
  - install ws node
  - npm init project
  - websocket server setup
  - node server connection log
  - first websocket server
updated: 2026-06-30
---

# Setup and a WebSocket Server

Everything you build this weekend stands on a running Node program. So that's where we start: a folder, one dependency, and a server that listens. By the end of this phase you'll have a process that accepts a WebSocket connection and prints whatever gets sent to it. No browser yet — we'll poke it with a tiny test client so you can see the wire light up.

This is built on your machine. Open a terminal, and let's make the project.

## Make the project

Pick a folder and create the project with npm. Run these one at a time:

```bash
mkdir realtime-chat
cd realtime-chat
npm init -y
```

`npm init -y` writes a `package.json` with default answers — that's the file npm uses to track your dependencies and scripts. The `-y` skips the questionnaire.

Now install the one thing we need:

```bash
npm install ws
```

`ws` is a WebSocket implementation for Node. It handles the protocol's handshake and the byte-level framing of messages so you can think in terms of "a client connected" and "a message arrived" instead of socket plumbing.

One small thing that saves headaches later: tell Node we're writing modern module syntax. Open `package.json` and add a `"type"` line so it looks roughly like this:

```json
{
  "name": "realtime-chat",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "dependencies": {
    "ws": "^8.18.0"
  }
}
```

The `"type": "module"` lets you use `import` instead of `require`. Your exact version numbers may differ — that's fine.

## Write the server

Create a file called `server.js` next to `package.json`:

```javascript
import { WebSocketServer } from "ws";

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`Chat server listening on ws://localhost:${PORT}`);

wss.on("connection", (socket) => {
  console.log("A client connected.");

  socket.on("message", (data) => {
    const text = data.toString();
    console.log("Received:", text);
  });

  socket.on("close", () => {
    console.log("A client disconnected.");
  });
});
```

Let's read it top to bottom, because every line here comes back later.

`new WebSocketServer({ port: 8080 })` starts a server listening on port 8080. It speaks the WebSocket protocol, not HTTP, which is why the address is `ws://` and not `http://`.

`wss.on("connection", ...)` runs once for **each** client that connects. The `socket` it hands you represents that one client's open pipe. Hold onto that idea — in the next phase you'll keep a list of these sockets so you can talk to all of them at once.

Inside, we listen for three things on that socket:

- `"message"` fires when the client sends data. WebSocket data arrives as a buffer, so we call `.toString()` to read it as text.
- `"close"` fires when the client goes away — tab closed, network dropped, whatever.

Right now we don't reply to anything. We're confirming the connection works and that messages reach us.

## Run it

Start the server:

```bash
node server.js
```

You should see:

```
Chat server listening on ws://localhost:8080
```

Leave that terminal running. The server stays up until you stop it with Ctrl+C.

## Poke it with a test client

A server with nothing connected is hard to believe in. Open a **second** terminal in the same folder and write a throwaway client, `test-client.js`:

```javascript
import { WebSocket } from "ws";

const socket = new WebSocket("ws://localhost:8080");

socket.on("open", () => {
  console.log("Connected to server.");
  socket.send("hello from the test client");
  setTimeout(() => socket.close(), 500);
});
```

Run it:

```bash
node test-client.js
```

In the **test client** terminal you'll see `Connected to server.` and then the process ends. In the **server** terminal you'll see this appear:

```
A client connected.
Received: hello from the test client
A client disconnected.
```

That's the whole loop working: a client opened a socket, sent a string, the server received and logged it, then the client closed and the server noticed. The connection is real and bidirectional — we tested one direction, and the next phase uses the other.

## What you have now

A Node process that accepts WebSocket connections and reports every message. It doesn't do anything *with* those messages yet — it can hear, but it can't speak to the room.

Keep `test-client.js` around for quick checks, but the real client is a browser page we'll build in phase 3. Next up: take a message that lands on one socket and send it out to every other connected client. That's broadcasting, and it's what turns a logger into a chat server.
