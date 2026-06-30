---
title: "Security Headers: CSP, HSTS, and Friends"
guide: "security-headers-csp-hsts"
phase: 0
summary: "The HTTP response headers that harden a website - Content-Security-Policy, HSTS, and the rest - explained by the exact attack each one stops."
tags: [security, http-headers, csp, hsts, clickjacking, xss, cookies, intermediate]
category: security
order: 10
difficulty: intermediate
synonyms: ["what is content security policy", "how to set up csp", "what is hsts header", "x-frame-options vs frame-ancestors", "secure cookie flags httponly samesite", "security headers checklist", "csp report-only how to roll out", "harden http response headers"]
updated: 2026-06-30
---

# Security Headers: CSP, HSTS, and Friends

You shipped the site. Auth works, the database is locked down, you ran a scanner - and it still flags a list of "missing security headers" you've never heard of. It feels like busywork, a checklist someone invented to make you feel bad. It isn't. These headers are some of the cheapest, highest-leverage defense you will ever add: a few lines of config that quietly close off whole categories of attack.

This guide walks you through what each header actually does and the specific attack it stops - so you stop copy-pasting a magic block from a blog post and start understanding what you're turning on. By the end you'll be able to roll out the scariest one, Content-Security-Policy, without taking your own site down.

## How to read this

- **Want the mental model first?** Read in order. Phase 1 reframes headers as a layered fence, Phase 2 walks the everyday set you'll set on nearly every site, and Phase 3 is the careful rollout of CSP - the one that breaks things if you rush it.
- **Already shipping and need the dangerous one done right?** Go straight to [Phase 3: Rolling Out CSP Without Breaking the Site](03-rolling-out-csp.md) - but skim Phase 2 first so the cookie flags and clickjacking defenses are in place.

## The phases

1. **[Headers Are a Fence, Not a Lock](01-headers-are-a-fence.md)** - why response headers are cheap, high-leverage defense, how the browser is the thing that enforces them, and what they can and can't protect.
2. **[The Everyday Hardening Set](02-the-everyday-set.md)** - HSTS, X-Content-Type-Options, X-Frame-Options / frame-ancestors, Referrer-Policy, and the cookie flags (HttpOnly, Secure, SameSite), each tied to the attack it stops.
3. **[Rolling Out CSP Without Breaking the Site](03-rolling-out-csp.md)** - Content-Security-Policy from scratch: what it blunts, why report-only comes first, reading the violation reports, and tightening the policy until it's tight but not broken.

[Phase 1: Headers Are a Fence, Not a Lock](01-headers-are-a-fence.md) →
