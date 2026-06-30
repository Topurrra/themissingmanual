---
title: "The Browser Client"
guide: realtime-chat-node
phase: 3
summary: "Build an HTML page that opens a WebSocket to your server, sends what you type, and shows a live, scrolling list of incoming messages."
tags: [html, javascript, websockets, browser, client]
difficulty: intermediate
synonyms:
  - browser websocket client
  - html chat page
  - websocket frontend
  - send message input box
  - live message list
updated: 2026-06-30
---

# The Browser Client

You've been talking to your server with throwaway scripts. Time to give it a real face. This phase builds a single HTML page — input box, send button, scrolling message list — that connects to your server over a WebSocket. When you finish, you'll open this page in two browser tabs and chat between them.

The browser is the best WebSocket client there is, because it ships with one built in. No library, no install. You write `new WebSocket(...)` and it works.

Built on your machine. Make sure your server from phase 2 is running.

## The page

Create a file called `index.html` in your project folder, next to `server.js`. It's all in one file — markup, style, and script — so there's nothing to wire together.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Realtime Chat</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        max-width: 600px;
        margin: 2rem auto;
        padding: 0 1rem;
      }
      #messages {
        list-style: none;
        padding: 0;
        height: 320px;
        overflow-y: auto;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 0.5rem;
      }
      #messages li {
        padding: 0.25rem 0;
        border-bottom: 1px solid #eee;
      }
      form {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      #input {
        flex: 1;
        padding: 0.5rem;
      }
      button {
        padding: 0.5rem 1rem;
      }
      #status {
        color: #888;
        font-size: 0.85rem;
      }
    </style>
  </head>
  <body>
    <h1>Realtime Chat</h1>
    <p id="status">Connecting…</p>
    <ul id="messages"></ul>
    <form id="form">
      <input id="input" autocomplete="off" placeholder="Type a message…" />
      <button type="submit">Send</button>
    </form>

    <script>
      const status = document.getElementById("status");
      const messages = document.getElementById("messages");
      const form = document.getElementById("form");
      const input = document.getElementById("input");

      const socket = new WebSocket("ws://localhost:8080");

      socket.addEventListener("open", () => {
        status.textContent = "Connected";
      });

      socket.addEventListener("close", () => {
        status.textContent = "Disconnected";
      });

      socket.addEventListener("message", (event) => {
        addMessage(event.data);
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        socket.send(text);
        addMessage("You: " + text);
        input.value = "";
      });

      function addMessage(text) {
        const li = document.createElement("li");
        li.textContent = text;
        messages.appendChild(li);
        messages.scrollTop = messages.scrollHeight;
      }
    </script>
  </body>
</html>
```

It looks like a lot, but most of it is the markup and a little styling. The interesting part is the script, so let's read that.

## How the client works

`const socket = new WebSocket("ws://localhost:8080")` opens a connection to your server the moment the page loads. Same address your test clients used.

The browser's WebSocket uses `addEventListener` for events, mirroring the Node side:

- `"open"` fires once the connection is live. We flip the status text to "Connected" so you get visible proof.
- `"close"` fires if the connection drops — handy when you stop the server and want the page to admit it.
- `"message"` fires for every relayed message. `event.data` is the text the server sent, and we drop it into the list.

The form's `submit` handler is where you send. We `preventDefault()` so the page doesn't reload, grab the trimmed input, and bail out if it's empty. Then `socket.send(text)` ships it to the server.

Here's the piece that ties back to phase 2: right after sending, we also call `addMessage("You: " + text)` locally. Remember, the server broadcasts to everyone *except* the sender — so your own message never comes back to you. The client shows it itself, instantly, with no round trip. That's the convention we set up on purpose.

`addMessage` builds a list item, appends it, and nudges the scroll to the bottom so the newest line is always visible. Using `textContent` (not `innerHTML`) means a message containing something like `<script>` shows up as literal text instead of running — a small habit worth keeping.

## Open it

Here's a subtlety worth knowing. You can open `index.html` by double-clicking it (a `file://` URL) and it'll work, because the page connects to `ws://localhost:8080` regardless of how the page itself was loaded. The WebSocket address is hardcoded, so the page's origin doesn't matter for this.

So: with your server running, open `index.html` in your browser. The status should switch from "Connecting…" to "Connected" within a blink.

Now open the **same file in a second tab.** Two tabs, two clients, both connected to the one server.

Type a message in tab one and hit Send. It appears in tab one as "You: ..." immediately, and a moment later it appears in tab two as the relayed text. Reply from tab two. You're chatting — two browser tabs passing messages through a Node server you wrote.

## When it doesn't connect

If the status sticks on "Connecting…" or jumps to "Disconnected," run through this:

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Stuck on "Connecting…" | Server isn't running | Start it: `node server.js` |
| "Disconnected" right away | Wrong port or address | Confirm the page uses `ws://localhost:8080` and the server logs that port |
| Works in one tab, not the other | Second tab opened a stale page | Refresh the second tab |
| Console shows a connection error | Server crashed | Check the server terminal for an exception |

Open your browser's developer console (F12) when in doubt — WebSocket errors show up there with a clear message.

## What you have now

A real chat client. Type, send, read, all live, no refresh. It's anonymous, though — every message is only text with no idea who said it. In the next phase we fix that: each person picks a username when they join, and the room announces arrivals and departures.
