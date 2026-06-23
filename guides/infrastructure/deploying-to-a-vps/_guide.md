---
title: "Deploying to a VPS (From Zero to Live)"
guide: "deploying-to-a-vps"
phase: 0
summary: "How to get your app onto a rented Linux box and reachable on the real internet — from spinning up the server and SSHing in, to running your app as a service that survives crashes and reboots, to a domain, a reverse proxy, and HTTPS."
tags: [vps, deployment, linux, systemd, nginx, https, dns, ssh, infrastructure]
category: infrastructure
order: 5
difficulty: intermediate
synonyms: ["how to deploy to a vps", "deploy app to linux server", "get my app on the internet", "vps deployment for beginners", "host my own app on a server", "deploy node app to vps", "point a domain at a server", "run app with systemd", "nginx reverse proxy https"]
updated: 2026-06-19
---

# Deploying to a VPS (From Zero to Live)

Your app runs on your laptop. It works. And now you need it to run *somewhere else* — somewhere that's
on all night, that strangers can reach at a real URL, that doesn't vanish when you close the lid. That
gap, between "works on my machine" and "live on the internet," is where a lot of otherwise-confident
developers freeze. Not because it's hard, but because nobody ever walked them through the whole arc:
the box, getting in, keeping the app alive, the domain, and the lock icon in the browser.

This guide is that walkthrough. By the end you'll have rented a Linux box, hardened it just enough to
sleep at night, run your app as a proper background service that restarts itself, pointed a domain at
it, put a reverse proxy in front, and earned a real HTTPS certificate. From zero to a real URL.

## How to read this

- **Want it to finally make sense?** Read in order. Each phase hands the next one a working server,
  and the mental models stack: a box you can reach → an app that stays up → a public, safe front door.
- **Already have a box and SSH access?** Skip to [Phase 2: Run Your App as a Service](02-run-your-app-as-a-service.md).
- **App's running but the world can't reach it?** Go straight to
  [Phase 3: Make It Public & Safe](03-make-it-public-and-safe.md).

This is an intermediate guide. It assumes you're comfortable in a terminal and have an app that runs
locally. It does *not* assume you've ever touched a server.

## The phases

1. **[Get a Box and Get In](01-get-a-box-and-get-in.md)** — what a VPS actually is, renting one, your
   first SSH login, and the three pieces of first-login hardening (a non-root user, updates, a firewall)
   that everyone skips and later regrets.
2. **[Run Your App as a Service](02-run-your-app-as-a-service.md)** — getting your code onto the box,
   running it, and then handing it to **systemd** so it restarts on crash, comes back after a reboot, and
   doesn't die when you close your terminal. Plus how to confirm it's actually listening on its port.
3. **[Make It Public & Safe](03-make-it-public-and-safe.md)** — pointing a domain at the box with a DNS
   **A record**, putting **nginx** in front as a reverse proxy, and getting a free **HTTPS** certificate
   from Let's Encrypt — without exposing your app port directly to the world.

> This guide gets you to a single live box running your app behind HTTPS. Multi-server setups, zero-
> downtime deploys, containers, and CI/CD pipelines are bigger topics that build on this foundation —
> they each deserve their own guide rather than a rushed paragraph here.

**Related guides:** [SSH and Keys](/guides/ssh-and-keys) · [Linux for Servers](/guides/linux-for-servers) ·
[Load Balancers and nginx](/guides/load-balancers-and-nginx)
