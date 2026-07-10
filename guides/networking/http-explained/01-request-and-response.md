---
title: "Request & Response - the core model"
guide: "http-explained"
phase: 1
summary: "The whole of HTTP is one pattern: the client sends a request, the server sends a response. This phase shows that exchange annotated, then breaks down a URL into its parts - scheme, host, path, and query."
tags: [http, request, response, client, server, url, query-string]
difficulty: beginner
synonyms: ["what is an http request", "what is an http response", "client and server explained", "parts of a url", "what is a query string", "what does the path in a url mean"]
updated: 2026-07-10
---

# Request & Response - the core model

Here's the secret that makes all of HTTP click: it's one move, repeated forever. One side asks; the other answers. Your browser sends a **request**, and a server sends back a **response**. Every page you've ever loaded, every image, every login - all of it is this same back-and-forth, happening faster than you can see. Once you can picture that one exchange, nothing else in this guide is mysterious.

## The two roles: client and server

A **client** is whoever starts the conversation - almost always your web browser, but it could be a phone app or a script. A **server** is the computer sitting there waiting to answer. The client speaks first, always. The server never randomly calls you up; it only ever replies to something asked.

📝 **Terminology.** **Client** = the side that asks (your browser). **Server** = the side that answers (the machine hosting the website). The whole pattern is **request–response**.

It's tempting to imagine the website "sending you" a page out of the blue, like a TV channel broadcasting. It doesn't work that way - nothing arrives until your browser asks for it. When a page seems to update on its own, your browser is quietly sending more requests in the background - still the same one move.

```mermaid
sequenceDiagram
  participant Client as Client (your browser)
  participant Server as Server (example.com)
  Client->>Server: request: GET me the page at /about, please
  Note right of Server: looks it up
  Server-->>Client: response: 200 OK - here's the HTML
```

One arrow out, one arrow back. Hold onto this picture - everything below just fills in what those two arrows actually contain.

## A real request and response

When you visit a page, your browser sends a request that, written out in plain text, looks roughly like this:

```http
GET /about HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0
Accept: text/html
```
*What just happened:* your browser asked for one specific thing. The first line is the heart of it: `GET` is the **method** (the verb - "fetch me this," covered in [Phase 2](02-methods-and-status-codes.md)), `/about` is the **path** (which page), and `HTTP/1.1` is the version being spoken. The lines below are **headers** - extra notes like `Host` (which site, since one server can host many) and `Accept` (what format the browser wants back). More on headers in [Phase 3](03-headers-cookies-and-https.md); for now, a request is a verb, a path, and some notes.

The server reads that, finds the page, and sends a response:

```http
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 1256

<!DOCTYPE html>
<html>
  <head><title>About Us</title></head>
  <body>...</body>
</html>
```
*What just happened:* the server answered. The first line is its verdict: `200 OK` means "found it, here you go" (status codes are all of [Phase 2](02-methods-and-status-codes.md)). Then a couple of headers describing the answer - `Content-Type: text/html` says "what follows is a web page" - a blank line, then the **body**: the actual HTML your browser draws on screen. Request had a verb and a path; response has a status and a body. That symmetry is the whole protocol.

💡 **Key point.** A request is *"verb + address + notes."* A response is *"status + notes + the actual content."* Read those two messages and you can read HTTP.

## The anatomy of a URL

Every request starts with an address - a **URL** - and it's more structured than it looks. Learning to read it is like learning to read a postal address: once you see the parts, you know exactly where a request is headed.

📝 **Terminology.** **URL** stands for Uniform Resource Locator. In everyday speech it's just "the link" or "the web address" - the thing in your browser's address bar.

Take this one apart:

```text
   https://shop.example.com/products/shoes?color=blue&size=10
   └─┬─┘   └──────┬───────┘└─────┬──────┘└────────┬─────────┘
   scheme       host           path             query
```

- **Scheme** (`https`) - *how* to talk. `https` means "HTTP, but encrypted" (the whole point of [Phase 3](03-headers-cookies-and-https.md)); plain `http` means unencrypted. It tells the browser which rules to use before it says a word.
- **Host** (`shop.example.com`) - *who* to talk to, the server's name. Behind the scenes it gets translated into a numeric address so your request can find the machine - that translation is DNS, covered in [IP, DNS, and Ports](/guides/ip-dns-and-ports).
- **Path** (`/products/shoes`) - *which thing* on that server you want. Think of the host as a building and the path as the room number - each path is a different resource the server can hand back.
- **Query** (`?color=blue&size=10`) - *extra instructions* tacked on. It starts with a `?`, and each instruction is a `name=value` pair joined by `&`. Here it says "the shoes page, but filtered to blue, size 10" - a way to carry parameters without changing which path is asked for.

The next time a link looks like a wall of `?utm_source=...&ref=...&id=842`, you won't be intimidated: it's a path, a `?`, and a list of `name=value` instructions. When a developer says "pass it as a query parameter," you'll know exactly which part of the URL they mean.

⚠️ **Gotcha.** The query string is *visible* - it sits in the address bar, your browser history, and often the server's logs. Fine for a search term or a filter, a poor place for anything secret. Putting a password or token in the query (`?password=hunter2`) writes it down in several places you don't control. Secrets travel in headers or the request body instead - both covered in [Phase 3](03-headers-cookies-and-https.md).

## Recap

1. HTTP is one repeated move: the **client** (your browser) sends a **request**, the **server** sends a **response**.
2. A **request** is a verb + a path + some header notes. A **response** is a status + some headers + the body (the actual content).
3. A **URL** breaks into **scheme** (how), **host** (who), **path** (which thing), and **query** (extra `name=value` instructions after a `?`).
4. The query string is visible to many eyes - fine for filters, wrong for secrets.

You now have the skeleton. Next, let's name the verbs a request can use, and learn to read the three-digit replies a server sends back - including the famous `404`.

Watch it animated: [an HTTP request/response](/explainers/HTTPRequest.dc.html)

---

[← Guide overview](_guide.md) · [Phase 2: Methods & Status Codes →](02-methods-and-status-codes.md)

## See it move

Step through the journey of one request - the DNS lookup, the request out, and the response back:

```playground-network
```
