---
title: "Ports — One Machine, Many Doors"
guide: "ip-dns-and-ports"
phase: 3
summary: "A single machine runs many services at once, each behind a numbered port; the real address of a service is the IP plus the port, and common ports (80/443 web, 22 SSH) tell you what's listening where."
tags: [networking, ports, port-numbers, http, https, ssh]
difficulty: beginner
synonyms: ["what is a port", "what is port 80", "what is port 443", "ip and port together", "common port numbers", "why do urls have a colon and number", "what port does ssh use"]
updated: 2026-06-19
---

# Ports — One Machine, Many Doors

You now know how to find a machine: a name turns into an IP address, and the IP gets your request to that one computer. But here's a question that idea alone can't answer. A single server often runs a website, *and* a mail system, *and* a way for admins to log in remotely — all at the same time, all at the same IP. When your request arrives at that address, how does the machine know *which* of those services you wanted? An address gets you to the building. Something has to get you to the right room. That something is a **port**.

## What a port actually is

**What it actually is.** A port is a number that identifies one specific service on a machine. The IP gets you to the computer; the port gets you to the particular program listening there. Picture the IP address as a building's street address and ports as its numbered doors:

```text
                  IP address: 203.0.113.42
        ┌─────────────────────────────────────────┐
        │   ▢ 22    ▢ 80    ▢ 443   ▢ 25           │
        │  (SSH)   (web)   (web,   (email)         │
        │                  secure)                  │
        │                                           │
        │   one machine, many doors — each door     │
        │   leads to a different service inside     │
        └─────────────────────────────────────────┘
              knock on door 443 → you reach the secure web server
              knock on door 22  → you reach the remote-login service
```

**Why people get this wrong.** Beginners often picture a port as a physical thing — a socket on the back of the computer. It isn't hardware. A port is purely a number the operating system uses to sort incoming traffic and deliver it to the right program. Nothing is plugged into "port 443"; it's a label saying "traffic marked 443 goes to the web server."

**What it does in real life.** A program that wants to receive traffic *listens* on a port — it tells the OS "send me anything that arrives for door 80." When your request shows up tagged for port 80, the OS routes it to that program and to no other. Two services can run side by side precisely because they sit behind different door numbers.

📝 **Terminology.** A program waiting for connections is *listening* on a port. The combination of an IP address and a port — written `203.0.113.42:443` — is sometimes called a *socket*: the full address of one specific service on one specific machine.

## The real address is IP + port

This is the idea to hold onto: **an IP address alone is not a complete address for talking to a service.** The complete address is *IP plus port*.

```text
   203.0.113.42  :  443
   └────┬─────┘     └┬─┘
   which machine   which service on it
```

You use this constantly without noticing, because the common ports are filled in for you. When you type `https://example.com`, your browser quietly assumes port **443** (the standard door for secure web traffic). Type plain `http://`, and it assumes port **80**. The colon-number you occasionally see in a URL — `http://localhost:3000` — is you naming the door explicitly because it isn't the default one.

```console
$ curl -I https://example.com
HTTP/2 200
content-type: text/html; charset=UTF-8
content-length: 1256
```

*What just happened:* You fetched the headers of `example.com` over HTTPS. You never typed a port, but the request still went to port **443** because that's the default door for `https://`. The server's web program was listening there, answered with `200` (success), and the connection worked — IP found the machine, port 443 found the web service on it.

⚠️ **Gotcha.** "Connection refused" and "connection timed out" often mean the IP was reachable but *nothing was listening on that port* — you knocked on a door with no one behind it. That's different from the machine being unreachable. If the wrong port is the problem, the fix is finding the right door, not fixing the address.

## Common ports worth recognizing

Certain port numbers are conventions everyone agrees on, so services are predictable. You don't need to memorize these, but recognizing them tells you at a glance what a connection is for.

| Port | Service | What it's for |
|------|---------|---------------|
| 80   | HTTP    | Web pages (unencrypted) |
| 443  | HTTPS   | Web pages (encrypted — the modern default) |
| 22   | SSH     | Secure remote login to a machine's command line |
| 25   | SMTP    | Sending email between mail servers |
| 53   | DNS     | The name lookups from the last phase |
| 3306 | MySQL   | A common database (often only inside a private network) |

📝 **Terminology.** Ports 0–1023 are the *well-known ports* — reserved by convention for standard services like the ones above. Higher numbers are used freely by other programs (which is why a local dev server happily grabs something like `3000` or `8080`).

💡 **Key point.** The conventions are just agreements, not laws. A web server *can* listen on port 8080 instead of 80 — and then you'd reach it at `http://example.com:8080`, naming the non-standard door yourself. The defaults exist so you almost never have to.

## See what's listening

You can ask your own machine which programs are listening on which ports right now:

```console
$ lsof -i -P -n | grep LISTEN
node      4821  ada   23u  IPv4  ...  TCP 127.0.0.1:3000 (LISTEN)
postgres  1190  ada    7u  IPv4  ...  TCP 127.0.0.1:5432 (LISTEN)
```

*What just happened:* You listed the programs currently holding doors open on your machine. A `node` process is listening on port `3000` (a local web app you're probably developing) and `postgres` on `5432` (a local database). `127.0.0.1` is the machine talking to itself — those services are open to *this* computer only, not the wider network. (On Windows, `netstat -ano` shows the same listening ports; the command differs, the picture doesn't.)

**Why this saves you later.** "Port 3000 is already in use" — the bane of every developer's afternoon — now reads plainly: another program already grabbed that door, and two programs can't listen on the same port at once. The fix is to stop the other program or pick a different port. No mystery, just a door that's taken.

## Recap

1. **A port is a number that picks one service** on a machine — the IP finds the building, the port finds the door.
2. **A port is not hardware**; it's a label the OS uses to route incoming traffic to the right listening program.
3. **The full address of a service is IP + port** (`203.0.113.42:443`); your browser fills in `443` for HTTPS and `80` for HTTP so you rarely type it.
4. **Common ports are conventions** (80, 443, 22, 53…) — predictable by agreement, not locked by law.

## Putting all three together

Trace one ordinary action — visiting `https://example.com` — and you'll see every idea in this guide do its part:

```text
   you type  https://example.com
        │
        ▼
   DNS lookup        example.com  →  93.184.215.14     (Phase 2: name → number)
        │
        ▼
   connect to        93.184.215.14                     (Phase 1: the machine's IP)
        │
        ▼
   on port           443  (default for https)          (Phase 3: the right door)
        │
        ▼
   the page loads.
```

A name became a number, the number found a machine, and a port found the right service on it. That's the address book of the internet, top to bottom — and it's running behind every link you'll ever click.

> Where to go next: [How the Internet Works](/guides/how-the-internet-works) follows the data on its journey between machines, [HTTP, Explained](/guides/http-explained) covers the conversation once your request arrives, and [Your Home Network](/guides/your-home-network) digs into the router, NAT, and private addresses from Phase 1.

---

[← Phase 2: DNS — Names to Numbers](02-dns.md) · [Guide overview](_guide.md)
