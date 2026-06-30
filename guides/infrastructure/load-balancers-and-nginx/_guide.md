---
title: "Load Balancers & Reverse Proxies (nginx)"
guide: "load-balancers-and-nginx"
phase: 0
summary: "What a reverse proxy actually is, why you put nginx in front of your app, how load balancing spreads traffic across instances, and what nginx really does in production - TLS, gzip, caching, and rate limiting."
tags: [nginx, reverse-proxy, load-balancer, tls, https, infrastructure, upstream]
category: infrastructure
order: 6
difficulty: intermediate
synonyms: ["what is a reverse proxy", "what is nginx for", "how does load balancing work", "nginx proxy_pass explained", "nginx upstream round robin", "terminate tls in nginx", "X-Forwarded-For real client ip", "nginx reload vs restart"]
updated: 2026-06-19
---

# Load Balancers & Reverse Proxies (nginx)

You've got an app running. It listens on some port - `3000`, `8080`, whatever your framework picked - and
on your laptop you hit `localhost:3000` and it works. Then someone says "put it behind nginx" or "we need a
load balancer," and suddenly there's a second piece of software in front of your app that you don't really
understand. It has its own config language, it terminates your HTTPS, and when it breaks, your whole site is
down even though your app is fine.

This guide makes that front-door piece knowable. By the end you'll understand what a reverse proxy *is*
(it's simpler than it looks), why nearly every production app has one, how it spreads traffic across multiple
copies of your app, and what nginx is actually doing for you when it sits out front.

## How to read this

- **Just need the mental model fast?** Read [Phase 1](01-what-a-reverse-proxy-is.md) - that's the whole
  idea in one picture, with a working config.
- **Want it to finally make sense?** Read in order. Each phase builds on the last: what a proxy is, then
  what happens when you need more than one app instance, then what nginx does for you day to day.

## The phases

1. **[What a Reverse Proxy Is](01-what-a-reverse-proxy-is.md)** - a server that sits in front of your app
   and forwards requests to it. Why you want one (TLS, static files, one public entry point), the
   receptionist mental model, and an annotated minimal nginx config.
2. **[Load Balancing](02-load-balancing.md)** - when one instance of your app isn't enough, the proxy
   spreads requests across a pool. Health checks, round-robin vs least-connections, and why your app needs
   to be stateless first.
3. **[What nginx Does in Practice](03-what-nginx-does-in-practice.md)** - TLS termination, gzip, caching
   static assets, rate limiting, and the day-to-day skill of editing and reloading config safely without
   taking the site down.

> Deep nginx tuning - module compilation, fine-grained `proxy_cache` zones, Lua scripting, and the
> differences between nginx and alternatives like HAProxy, Caddy, or Traefik - is deliberately left out.
> This guide is the working understanding you need to run a normal app behind nginx with confidence.
