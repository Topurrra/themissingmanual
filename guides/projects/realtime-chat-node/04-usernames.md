---
title: "Usernames and Join/Leave"
guide: realtime-chat-node
phase: 4
summary: "Add a join message so each person picks a name, attach that name to every message, and announce when someone joins or leaves the room."
tags: [websockets, json, usernames, state, nodejs]
difficulty: intermediate
synonyms:
  - websocket usernames
  - join leave notification
  - json messages websocket
  - per connection state
  - name chat users
updated: 2026-06-30
---

# Usernames and Join/Leave

Anonymous text is hard to follow. "good morning" - from whom? This phase gives every message an owner. People pick a name when they join, that name rides along with everything they say, and the room announces when someone arrives or drops off.

To do this cleanly, we'll stop sending bare strings and start sending **structured messages** as JSON. That one change unlocks usernames, system notices, and - in the next phase - rooms.

Built on your machine. Server and `index.html` from before.

## From strings to JSON

So far a message is a string. But now a message needs more than text - it needs a type ("is this a chat line or a join announcement?") and a sender. A plain object handles that, and `JSON.stringify` turns it into a string the socket can carry.

We'll use a few message shapes:

| Type | Direction | Fields | Meaning |
|------|-----------|--------|---------|
| `join` | client → server | `name` | "I'm here, call me this" |
| `chat` | client → server | `text` | "broadcast this line" |
| `chat` | server → clients | `name`, `text` | "this person said this" |
| `system` | server → clients | `text` | "so-and-so joined/left" |

The trick that makes usernames work: the server remembers each socket's name. When phase 1 gave you a `socket` per connection, that object is yours to scribble on. We'll store the name right on it - `socket.username` - so the server always knows who owns which pipe.

## Update the server

Open `server.js`. We're replacing the message handling to parse JSON, track names, and send richer broadcasts:

```javascript
import { WebSocketServer } from "ws";

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`Chat server listening on ws://localhost:${PORT}`);

function broadcast(payload, sender) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    const isOpen = client.readyState === client.OPEN;
    if (isOpen && client !== sender) {
      client.send(message);
    }
  }
}

wss.on("connection", (socket) => {
  socket.username = null;
  console.log("A client connected.");

  socket.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return; // ignore anything that isn't valid JSON
    }

    if (msg.type === "join") {
      socket.username = String(msg.name || "anonymous").slice(0, 24);
      console.log(`${socket.username} joined.`);
      broadcast({ type: "system", text: `${socket.username} joined the chat` }, socket);
      return;
    }

    if (msg.type === "chat" && socket.username) {
      broadcast({ type: "chat", name: socket.username, text: String(msg.text) }, socket);
    }
  });

  socket.on("close", () => {
    if (socket.username) {
      console.log(`${socket.username} left.`);
      broadcast({ type: "system", text: `${socket.username} left the chat` }, socket);
    }
  });
});
```

What changed and why:

- **`broadcast` now takes an object** and stringifies it. Every client receives JSON now.
- **The `try/catch` around `JSON.parse`** matters. Anything can connect to a public socket and send garbage; if a non-JSON message arrives, parsing throws, and without the guard that exception crashes the handler. We catch it and ignore the message. This is a trust boundary - keep the guard.
- **`socket.username`** starts as `null` and gets set on `join`. We clamp the name to 24 characters with `.slice(0, 24)` so nobody sends a 10,000-character "name."
- **A `chat` message is only relayed if the socket has a name.** No name, no talking - that stops messages from people who never joined.
- **On `close`,** if the socket had a name, we announce the departure. If they never joined (closed before naming themselves), we stay quiet - there's nobody to say goodbye to.

## Update the client

Now the browser needs to ask for a name, send a `join`, and read the new JSON shapes. Open `index.html` and replace the `<script>` block with this:

```javascript
const status = document.getElementById("status");
const messages = document.getElementById("messages");
const form = document.getElementById("form");
const input = document.getElementById("input");

const username = (prompt("Pick a username:") || "anonymous").trim().slice(0, 24);

const socket = new WebSocket("ws://localhost:8080");

socket.addEventListener("open", () => {
  status.textContent = "Connected as " + username;
  socket.send(JSON.stringify({ type: "join", name: username }));
});

socket.addEventListener("close", () => {
  status.textContent = "Disconnected";
});

socket.addEventListener("message", (event) => {
  let msg;
  try {
    msg = JSON.parse(event.data);
  } catch {
    return;
  }
  if (msg.type === "chat") {
    addMessage(msg.name + ": " + msg.text);
  } else if (msg.type === "system") {
    addMessage(msg.text, true);
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  socket.send(JSON.stringify({ type: "chat", text }));
  addMessage("You: " + text);
  input.value = "";
});

function addMessage(text, isSystem) {
  const li = document.createElement("li");
  li.textContent = text;
  if (isSystem) li.style.color = "#888";
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}
```

The flow now:

- On load, the page asks for a name with `prompt()`. (It's the quickest input there is - you'd swap it for a proper form later.)
- When the socket opens, the client sends a `join` message with that name. This is why the server needs `join` separate from `chat`: the name has to register *before* any chatting.
- Incoming messages are parsed as JSON and routed by `type`. A `chat` becomes "name: text"; a `system` notice is shown in gray.
- Sending wraps the text in a `chat` object. Your own line still shows locally as "You: ...", same as before.

## Try it

Restart the server (Ctrl+C, then `node server.js` - it ingests no files, but you changed the code, so it needs a restart). Open `index.html` in two tabs.

Each tab prompts for a name. Call one "alice" and one "bob." As soon as bob joins, alice's window shows a gray line: **"bob joined the chat."** Now messages read "alice: hi" and "bob: hey" - you can tell who's talking. Close bob's tab and alice sees **"bob left the chat."**

## What you have now

A chat with identity. People have names, messages are attributed, and the room reacts when folks come and go - all carried over structured JSON instead of loose strings. That JSON foundation is exactly what we need for the last piece: rooms, so two separate conversations can run on the same server without mixing.
