---
title: "URLs, DNS, and HTTP, Together"
guide: "what-the-web-actually-is"
phase: 2
summary: "A URL is a structured address, DNS turns its hostname into an IP address, and HTTP is the actual message format underneath. This phase connects all three into one picture."
tags: [web, url, dns, http, ip-address, status-codes, beginner-friendly]
difficulty: beginner
synonyms: ["parts of a url explained", "how does dns work", "what does an http request look like", "what is a status code", "how does a domain name become an ip address"]
updated: 2026-07-06
---

# URLs, DNS, and HTTP, Together

Phase 1 showed the request/response loop as a black box: browser asks, server answers. This phase
opens the box. A URL is where the request is headed, DNS is how that address gets found on the
network, and HTTP is the actual language the request and response are written in.

## Anatomy of a URL

Take this address apart:

```text
   https://shop.example.com/products/shoes?color=blue#reviews
   └─┬─┘   └──────┬───────┘└─────┬──────┘└────┬─────┘└──┬───┘
   scheme        host           path         query    fragment
```

- **Scheme** (`https`) - which protocol to speak. `https` is HTTP over an encrypted connection; plain
  `http` is the same protocol without encryption.
- **Host** (`shop.example.com`) - which server to talk to, by name. This is the piece DNS turns into an
  actual network address.
- **Path** (`/products/shoes`) - which resource on that server. Think of the host as a building and the
  path as the room number.
- **Query** (`?color=blue`) - optional `name=value` pairs after a `?`, joined by `&` if there's more
  than one. Extra instructions that don't change which path is being requested.
- **Fragment** (`#reviews`) - a pointer to a spot *within* the page, handled entirely by the browser
  after the page loads. It never gets sent to the server at all.

📝 **Terminology.** People say "link," "web address," and "URL" interchangeably. They're the same
thing - Uniform Resource Locator is the formal name.

⚠️ **Gotcha.** Because the fragment never reaches the server, a server has no way to know which
`#section` a visitor is jumping to. That's purely a browser-side behavior - relevant later when you
build single-page apps that use the fragment for routing.

## From hostname to IP address: DNS

Servers on a network are found by numeric address, an **IP address** like `93.184.216.34` - not by
name. `shop.example.com` is a name a human can remember; something still has to convert it to that
number before any request can be sent. That translation service is **DNS** (Domain Name System),
and it runs before HTTP ever starts.

The short version: your computer asks a DNS resolver "what's the IP for shop.example.com?", the
resolver looks it up (checking caches, then asking authoritative servers if needed), and hands back an
IP address. Only then does the browser open a connection to that address and send the actual HTTP
request.

💡 **Key point.** DNS runs *before* the request/response cycle from Phase 1, not as part of it. No IP
address, no connection, no request.

That's the whole picture at this altitude - DNS's caching layers, record types, and failure modes get
the full treatment in [How the Internet Works](/guides/how-the-internet-works).

## What HTTP actually looks like

HTTP is the format both sides speak once the connection is open. A request, written out in full:

```http
GET /products/shoes?color=blue HTTP/1.1
Host: shop.example.com
Accept: text/html
```

`GET` is the method - what kind of action this is. `/products/shoes?color=blue` is the path and query
from the URL. `Host` tells the server which site, since one server can answer for many hostnames. The
response looks like this:

```http
HTTP/1.1 200 OK
Content-Type: text/html
Content-Length: 3241

<!DOCTYPE html>
<html>...</html>
```

The first line is the **status code** - a three-digit verdict. You don't need to memorize the full
list, but recognizing the ranges gets you far:

| Range | Meaning | Example |
|-------|---------|---------|
| 2xx | Success | `200 OK` |
| 3xx | Redirected somewhere else | `301 Moved Permanently` |
| 4xx | The client's request was bad | `404 Not Found` |
| 5xx | The server broke | `500 Internal Server Error` |

📝 **Terminology.** **Method** = the verb of a request (`GET`, `POST`, and others). **Status code** =
the three-digit verdict at the top of a response. **Headers** = the labeled extra lines in both
messages (`Host`, `Content-Type`, and so on).

This is enough to read a request or response on sight. The full set of methods, the complete status
code table, headers, cookies, and HTTPS get their own dedicated guide:
[HTTP, Explained](/guides/http-explained).

See a full request travel from URL to response:

```playground-http
```

Lock in the pieces before moving to what actually renders once the response arrives:

```quiz
[
  {
    "q": "In https://shop.example.com/products/shoes?color=blue#reviews, which part is the path?",
    "choices": ["shop.example.com", "/products/shoes", "?color=blue", "#reviews"],
    "answer": 1,
    "explain": "The path identifies which resource on the server - the host is the server's name, the query and fragment come after it."
  },
  {
    "q": "What does DNS do?",
    "choices": ["Encrypts the connection", "Turns a hostname into an IP address", "Renders the HTML"],
    "answer": 1,
    "explain": "DNS resolves a name like shop.example.com to a numeric IP address before any request can be sent."
  },
  {
    "q": "A response starting with 404 means:",
    "choices": ["The server crashed", "The request succeeded", "The requested resource wasn't found"],
    "answer": 2,
    "explain": "4xx codes mean something about the client's request was the problem - 404 specifically means not found."
  }
]
```

---

[← Phase 1: The Client-Server Model](01-the-client-server-model.md) · [Guide overview](_guide.md) · [Phase 3: HTML, CSS, and JavaScript →](03-html-css-and-javascript-three-jobs-three-languages.md)
