---
title: "Domains & DNS"
guide: "ship-your-side-project"
phase: 4
summary: "Buy a domain, point its nameservers at a DNS provider, and add an A record for the apex and a CNAME for www - knowing that the apex usually can't be a CNAME, and that a .dev domain refuses to load over plain HTTP."
tags: [dns, domain, a-record, cname, apex, nameservers, hsts]
difficulty: intermediate
synonyms: ["how to point a domain at my server", "what is an a record vs cname", "apex vs www domain", "change nameservers", "why does my .dev domain not load", "dns for a side project"]
updated: 2026-06-19
---

# Domains & DNS

Your app answers at `203.0.113.10` - a number nobody will type or trust. A **domain** turns that number
into `yourproject.com`. The system that maps the name to the number is **DNS**; if the underlying
"names → addresses" machinery is new to you, [IP, DNS & Ports](/guides/ip-dns-and-ports) explains it from
the ground up. Here's the practical sequence to point a fresh domain at your box.

## Buy one, then choose who runs its DNS

Buy a domain from any **registrar**. Cheap and fine for a side project; pick the name, pay, done.

Then decide *who answers DNS queries* for it. Two options:

- **Use the registrar's DNS** - add records right there. Simple.
- **Point the registrar's nameservers at another DNS provider** (very commonly Cloudflare, which is
  [the next phase](05-behind-cloudflare.md)). You change the **nameservers** at the registrar to the two
  the provider gives you; from then on, you manage records at the provider.

```console
$ dig +short NS yourproject.com
amara.ns.cloudflare.com.
rob.ns.cloudflare.com.
```
*What just happened:* `dig` asked which nameservers are authoritative for the domain - here, Cloudflare's.
⚠️ Nameserver changes can take a while to propagate (minutes to a day). If your records "aren't working,"
confirm the nameservers switched *first* - nothing else matters until they have.

## The two records you need: A and CNAME

- **A record** maps a name straight to an **IP address**. Point the apex at your box:
  `yourproject.com → 203.0.113.10`.
- **CNAME** maps a name to **another name** (an alias). Point `www` at the apex:
  `www.yourproject.com → yourproject.com`.

```text
  Type   Name                  Value
  A      yourproject.com       203.0.113.10
  CNAME  www                   yourproject.com
```

## ⚠️ Apex vs www - the apex usually can't be a CNAME

This trips up nearly everyone. The **apex** (also "root" or "naked" domain - `yourproject.com` with no
subdomain) **cannot, by the DNS spec, be a CNAME.** Only an **A** record (or AAAA for IPv6) works at the
apex. So:

- **apex** (`yourproject.com`) → **A record** → your IP.
- **www** (`www.yourproject.com`) → **CNAME** → the apex.

⚠️ Many DNS providers (Cloudflare included) offer **CNAME flattening** that *lets* you put a CNAME-like
record at the apex by resolving it to an IP behind the scenes - handy, but if your provider doesn't,
remember: **apex = A record**. Decide which one is canonical (most pick the apex, redirecting `www` → it,
or vice versa) and be consistent, so links and cookies don't split across two hostnames.

## ⚠️ `.dev` (and `.app`) are HTTPS-only

If you bought a `.dev` domain because it's cute - know this before you lose an hour: **`.dev` and `.app`
are on the browser HSTS preload list, which means browsers *refuse* to load them over plain `http://` at
all.** There's no "I'll add HTTPS later" with a `.dev`; until HTTPS works, the site simply won't open -
not a warning, a hard fail. That's fine, because HTTPS is the very next phase - just don't panic when
`http://yourproject.dev` looks dead. (On a `.com` you'd see it over http first; on `.dev` you won't.)

## Recap

1. **Buy a domain**, then either use the registrar's DNS or **point its nameservers** at a DNS provider
   (often Cloudflare - next phase). Confirm the nameserver switch with `dig NS` before debugging anything
   else.
2. **A record** → name to IP (use it for the **apex**). **CNAME** → name to name (use it for **www**).
3. ⚠️ The **apex can't be a CNAME** - it needs an A record (unless your provider does CNAME flattening).
4. ⚠️ **`.dev`/`.app` won't load over HTTP at all** - they're HTTPS-only, so the site looks broken until
   the next phase is done.

The name resolves to your box. Now make it HTTPS, safe, and fast - with Cloudflare.

---

[← Phase 3: Docker & Your Private Repo](03-docker-and-your-repo.md) · [Guide overview](_guide.md) · [Phase 5: Behind Cloudflare →](05-behind-cloudflare.md)
