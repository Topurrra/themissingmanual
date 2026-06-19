---
title: "HTTPS / TLS, Explained"
guide: "https-and-tls"
phase: 0
summary: "What the padlock in your browser actually means: how TLS adds encryption, integrity, and server authentication on top of plain HTTP, how the handshake agrees on a key, and how certificates and Certificate Authorities decide who to trust."
tags: [security, https, tls, encryption, certificates, padlock, web]
category: security
order: 5
difficulty: intermediate
synonyms: ["what does the padlock mean", "how does https work", "what is tls", "is https safe", "what is an ssl certificate", "why does my browser say not secure", "difference between http and https"]
updated: 2026-06-19
---

# HTTPS / TLS, Explained

You've seen the little padlock in the address bar a thousand times. Maybe someone told you it means "the site is safe," and you half-believed them. Then one day a page threw a full-screen red warning about a certificate, and you had to decide — on the spot — whether to click through or back away. That moment is exactly where this guide helps. By the end, you'll know what the padlock *actually* promises (and the dangerous thing it does **not** promise), how your browser and a server agree on a secret without ever mailing it to each other, and how to read a certificate error calmly instead of guessing.

This is an intermediate guide. It assumes you know roughly what HTTP is — a browser asking a server for a page. If that's fuzzy, read [HTTP Explained](/guides/http-explained) first, then come back. We build the picture one layer at a time, and we never wave our hands.

## How to read this
- **Want the one idea to carry around?** Read [Phase 1: What HTTPS Protects (and Doesn't)](01-what-https-protects.md). It installs the mental model that fixes the most common and most dangerous misunderstanding about the padlock.
- **Want it to truly click?** Read all three in order. Phase 2 shows *how* the secret gets agreed on, and Phase 3 shows *who* decides the server is who it claims to be — each answers a question the last one opened.

## The phases
1. **[What HTTPS Protects (and Doesn't)](01-what-https-protects.md)** — TLS adds three things to HTTP: *encryption* (eavesdroppers can't read it), *integrity* (nobody can tamper with it undetected), and *authentication* (you're talking to the real server). And the big gotcha: the padlock means "encrypted to whoever holds the certificate," **not** "this site is honest."
2. **[The Handshake & Keys](02-the-handshake-and-keys.md)** — how two strangers agree on a shared secret over an open wire. The trick: slow *asymmetric* keys to bootstrap, then fast *symmetric* encryption for the actual data. An annotated ASCII handshake.
3. **[Certificates & Trust](03-certificates-and-trust.md)** — a *certificate* binds a domain to a public key, signed by a *Certificate Authority* your browser already trusts. The chain of trust, why Let's Encrypt changed everything, and how to read "expired," "name mismatch," and "self-signed" errors without panic.

> This guide deliberately stays at "what is happening, and why." The exact byte-level mechanics of TLS 1.3, cipher suites, and certificate revocation live in deeper material; the difference between proving *who you are* and proving *what you're allowed to do* lives in [Authentication vs. Authorization](/guides/auth-vs-authz). Read this guide first — then those, when you want to go deeper.
