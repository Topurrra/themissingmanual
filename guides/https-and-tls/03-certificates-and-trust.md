---
title: "Certificates & Trust"
guide: "https-and-tls"
phase: 3
summary: "A certificate binds a domain to a public key and is signed by a Certificate Authority your browser already trusts — that chain of trust is what lets you believe you reached the real server. How Let's Encrypt made certificates free and automatic, and how to read certificate errors (expired, name mismatch, self-signed) calmly without clicking through warnings on real sites."
tags: [security, certificates, certificate-authority, chain-of-trust, lets-encrypt, tls, browser-warnings]
difficulty: intermediate
synonyms: ["what is an ssl certificate", "what is a certificate authority", "how does the chain of trust work", "why does my browser say certificate expired", "what does name mismatch mean", "what is a self-signed certificate", "should i click through a certificate warning", "what is lets encrypt"]
updated: 2026-06-19
---

# Certificates & Trust

Phase 2 left one promise unkept. During the handshake, the server hands you a **certificate** containing its public key — and you're supposed to *verify* it before trusting anything. But verify against what? If a stranger hands you an ID badge, how do you know the badge isn't forged? You can't just take their word for it — that's the whole problem we're trying to solve.

This phase answers that. It's the part of HTTPS people understand least and meet most often, usually as a scary full-page browser warning. By the end you'll know what a certificate is, who signs it, why your browser believes that signature, and exactly what each error means — so the next warning is information, not a panic.

## When a warning appears: the calm cheat-card

People reach this page *while staring at a red error*. So here's the quick reference first; the explanations are underneath.

| What the warning says | What it actually means | Calm response |
|---|---|---|
| **Certificate expired** | The cert was valid but its date passed; nobody renewed it in time. | On a site you trust, it's usually their ops mistake — but you can't tell an expired cert from a stale attack, so don't enter anything sensitive. Wait, or contact them. |
| **Name mismatch** (`NET::ERR_CERT_COMMON_NAME_INVALID`) | The cert is valid but for a *different* domain than the one in your address bar. | Treat as untrusted. Often a misconfiguration, but it's also exactly what an interception looks like. Don't proceed on a real site. |
| **Self-signed / unknown issuer** | The cert wasn't signed by a CA your browser trusts — the server vouched for itself. | Fine on your own dev machine. **Never** click through on a real public site you didn't set up. |
| **Revoked** | The CA has officially cancelled this cert (often after a key compromise). | Do not proceed. This is a strong signal something is wrong. |

⚠️ **The one rule that matters:** On a real site — your bank, your email, your company's tools — **do not click through a certificate warning.** The warning is your browser saying "I cannot prove this is who it claims to be." That is *precisely* the moment an attacker needs you to ignore it. The "Advanced → proceed anyway" link exists for developers testing their own servers, not for getting past your bank's broken cert.

Now let's understand *why* each of those means what it means.

## What a certificate actually is

**What it actually is.** A certificate is a small file that makes one core claim and backs it with a signature:

> "The public key inside this file belongs to the owner of `yourbank.com`." — signed, a Certificate Authority.

It bundles together: the **domain name(s)** it's valid for, the server's **public key** (the one from Phase 2's handshake), a **validity period** (not-before and not-after dates), the **issuer** (which CA signed it), and the CA's **digital signature** over all of that.

**Why people get this wrong.** It's tempting to think the certificate *is* the encryption, or that it's some kind of license proving the site is legitimate. It's neither. A certificate does exactly one job: it ties a *public key* to a *domain name*, with a trusted third party's signature as proof. That's it. (Recall Phase 1: this is why the padlock can't vouch for honesty — the cert only ever claimed "this key belongs to this domain.")

## The chain of trust — why your browser believes the signature

So the certificate is signed by a CA. But that's the same puzzle one level up: why trust the CA's signature? The answer is a deliberate, finite chain.

📝 A **Certificate Authority (CA)** is an organization whose entire business is verifying that whoever asks for a cert for `yourbank.com` actually controls `yourbank.com`, then signing a certificate to that effect. Examples: Let's Encrypt, DigiCert, Sectigo.

The trust is anchored by a short list your browser and operating system ship with — the **root store**, a few hundred CA certificates the vendors have vetted. The chain works like this:

```text
   ┌──────────────────────────┐
   │  ROOT CA certificate      │  ← pre-installed in your browser/OS.
   │  (you trust this already)  │     This is the anchor.
   └────────────┬─────────────┘
                │ signs
                ▼
   ┌──────────────────────────┐
   │  INTERMEDIATE CA cert      │  ← the root vouches for this one
   └────────────┬─────────────┘
                │ signs
                ▼
   ┌──────────────────────────┐
   │  yourbank.com's cert       │  ← the one the server handed you
   │  (contains its public key) │     in the handshake
   └──────────────────────────┘
```

*What just happened:* Your browser follows the chain upward. The server's cert was signed by an intermediate CA; the intermediate was signed by a root; and the root is one your browser *already* trusts because it shipped with it. Each link is verified by a signature. If every link checks out and the chain ends at a trusted root, the browser accepts the certificate and the padlock appears. If the chain breaks anywhere — a signature doesn't verify, or it ends at a root nobody trusts — you get a warning. You don't have to trust the website; you only have to trust the handful of roots, and they vouch down the chain.

💡 **The key point:** you don't verify the world. You trust a small, vetted set of root CAs, and they extend that trust downward through signatures. That's the entire "chain of trust."

## Let's Encrypt — why HTTPS is everywhere now

For years, certificates cost money and took manual paperwork, so plenty of small sites stayed on plain HTTP. **Let's Encrypt**, a nonprofit CA launched to change that, issues certificates **free** and **automatically** over a protocol called ACME — a program on your server proves it controls the domain and gets a cert, with no human in the loop.

**What it does in real life.** A tool like `certbot` requests, installs, and renews your certificate on a schedule. Here's the shape of it:

```console
$ sudo certbot --nginx -d example.com
Requesting a certificate for example.com
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/example.com/fullchain.pem
This certificate expires on 2026-09-17.
Certbot has set up a scheduled task to automatically renew this certificate.
```

*What just happened:* certbot proved to Let's Encrypt that this server controls `example.com`, received a signed certificate valid for about 90 days, installed it into the web server, and — crucially — set up automatic renewal. The short lifetime is on purpose: if a key is ever compromised, the damage window is small. The automation is what makes a 90-day cert practical instead of a chore.

⚠️ **The gotcha: renew before expiry.** Let's Encrypt certs are short-lived *by design*. If automatic renewal silently breaks (a permissions change, a moved file, a firewall rule), the cert expires and **every visitor hits a full-page "certificate expired" warning** — the exact error at the top of this phase. This is one of the most common self-inflicted outages on the web. Monitor your expiry dates; don't assume "set up auto-renew" means "never think about it again."

## Reading the errors calmly

Now the cheat-card makes sense. Each error is the chain-of-trust check failing in a specific way:

- **Expired** — the certificate's *not-after* date has passed. The chain may be perfect, but a stale cert is rejected because validity dates are part of what's verified. Usually an ops slip-up; occasionally a sign of a stale or replayed cert. You can't tell which, so don't trust it with secrets.
- **Name mismatch** — the cert is valid and trusted, but it's for `example.com` while you're on `secure.example.net`. The domain binding is the *core* claim of a certificate (Phase 1), so if it doesn't match the address bar, the proof is meaningless here.
- **Self-signed / unknown issuer** — the chain doesn't reach a trusted root. The server signed its own cert, or used a CA your browser doesn't know. Perfectly normal for a server on your own laptop; a red flag on a public site, because anyone can self-sign a cert claiming to be anyone.

🪖 **War story.** A team shipped a new subdomain, `api.theircompany.com`, but pointed it at a load balancer still serving the certificate for `www.theircompany.com`. Every API call failed with a name mismatch. Nothing was hacked — the cert just didn't cover the new name. Five minutes of "what does this error literally mean?" beat an hour of guessing. Reading the error *as information* is the whole skill.

## Why this saves you later

This is the knowledge that turns a 2am page — "the site is throwing cert errors!" — from dread into a checklist. Expired? Renew it. Name mismatch? The cert doesn't cover the hostname being requested. Untrusted issuer? The chain doesn't reach a root, or an intermediate is missing from the server config. And on the user side, you'll never again be the person who clicked "proceed anyway" past their bank's certificate warning straight into an attacker's hands. The padlock protects the tokens that keep you logged in (see [Authentication vs. Authorization](/guides/auth-vs-authz)) — and now you know what's actually behind it.

## Recap

1. A **certificate** binds a *domain name* to a *public key*, signed by a CA. That's its one job — not encryption, not a seal of legitimacy.
2. Your browser trusts a small **root store** of CAs; they sign **intermediates**, which sign site certs. Following that **chain of trust** to a known root is what makes the padlock appear.
3. **Let's Encrypt** made certs free and automatic (via ACME/`certbot`), which is why nearly everything is HTTPS now. Its certs are short-lived on purpose.
4. **Renew before expiry** — broken auto-renewal causes a full-page expiry warning for every visitor. It's a common, avoidable outage.
5. Read errors as facts: **expired** = stale dates, **name mismatch** = wrong domain, **self-signed/unknown issuer** = chain doesn't reach a trusted root.
6. **Never click through a certificate warning on a real site.** That warning is exactly what an attacker needs you to ignore.

---

[← Phase 2: The Handshake & Keys](02-the-handshake-and-keys.md) · [Guide overview →](_guide.md)
