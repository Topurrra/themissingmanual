---
title: "Fixing Deliverability"
guide: "email-demystified"
phase: 3
summary: "How email really travels and why yours lands in spam: SMTP, plus the three DNS records that prove a message is truly from your domain."
tags: [networking, email, smtp, spf, dkim, dmarc]
difficulty: intermediate
synonyms: ["how does email work", "what is spf dkim dmarc", "why does my email go to spam", "how to stop email going to spam", "set up spf dkim dmarc records", "email authentication explained", "how smtp works"]
updated: 2026-06-30
---

# Fixing Deliverability

You added an SPF record. You're still in spam. This is the moment most people give up and blame "the algorithm." But deliverability failures are almost never mysterious — they're a short list of specific, checkable mistakes. This phase is the cure: why mail still fails after a partial setup, how to read the report that tells you the truth, and a checklist you can run today.

## The number one cause: alignment, not authentication

Here's the trap that catches nearly everyone. You set up SPF. Your mail *passes SPF*. And it still fails DMARC, because passing isn't enough — it has to **align**.

Remember from Phase 2: SPF checks the hidden `MAIL FROM` envelope address, not the visible `From:`. When you send through a vendor, the envelope often belongs to *the vendor's* domain, while your `From:` says `you@yourcompany.com`. SPF passes — for the vendor — but the domains don't match, so DMARC sees a misalignment and fails.

```text
Envelope MAIL FROM:  bounce@mail.somevendor.com   <- SPF passes for THIS
Visible   From:      you@yourcompany.com           <- DMARC checks alignment to THIS
Result:   SPF=pass, but SPF-alignment=fail
```

*What just happened:* SPF gave a green light to the vendor's domain, but DMARC asks "does the authenticated domain match the From: domain?" and the answer is no. The fix is **DKIM** — sign with `d=yourcompany.com` and DKIM aligns to your visible `From:` regardless of whose servers relayed it. This is exactly why DKIM is non-negotiable, not optional.

## Read the report — it tells you who's failing

DMARC's `rua=` address gets you a daily XML report from every major receiver. It's ugly raw, but it answers the only question that matters: *which of my sending sources are passing, and which are failing?* Trimmed to the human-readable core, one record looks like this:

```text
source_ip:        198.51.100.24
header_from:      yourcompany.com
count:            42
spf:   result=pass   domain=mail.somevendor.com   aligned=no
dkim:  result=pass   domain=yourcompany.com        aligned=yes
disposition:      none   (DMARC overall: PASS via DKIM)
```

*What just happened:* 42 messages came from one source. SPF passed but *didn't align* (vendor's domain). DKIM passed *and aligned* to `yourcompany.com`. Because DMARC needs only one aligned pass, the overall verdict is PASS — saved by DKIM. If both `aligned` columns said `no`, you'd see your policy applied and your real mail getting quarantined. The report is how you find the *one* sending source you forgot to set up DKIM for.

> Reading raw DMARC XML by hand is miserable. Point your `rua` at a free or paid DMARC report aggregator — it turns the XML into a dashboard of "source X is failing." That's the single highest-leverage move for diagnosing deliverability.

## Roll out DMARC safely — don't start at reject

A common self-inflicted outage: publishing `p=reject` on day one. If any legitimate sending source isn't fully set up — a CRM, an old script, a billing system you forgot — its mail gets *rejected* the moment you flip the switch. Roll out in stages:

```text
Week 1+:  p=none        <- monitor only; collect reports, change nothing
Then:     p=quarantine  <- once reports show all real sources passing
Finally:  p=reject      <- when you're confident every source is aligned
```

*What just happened:* `p=none` lets you watch reality through the reports without affecting delivery. You only tighten to `quarantine` and then `reject` after the reports confirm every legitimate source authenticates and aligns. The reports are your runway; don't take off blind.

## Beyond the three records

Authentication gets you *eligible* for the inbox; it doesn't guarantee it. A few things still move the needle:

- **Reputation.** Receivers track how your domain and sending IP behave over time. New domains and IPs start cold and must warm up with consistent, wanted mail.
- **Content and lists.** Spammy subject lines, image-only emails, and sending to people who never opted in all push you toward spam regardless of perfect records.
- **PTR / reverse DNS.** If you run your own sending server, its IP should have a reverse DNS record matching its hostname. Mismatches look suspicious.
- **TLS.** Modern receivers expect mail over encrypted connections; bare port 25 with no TLS reads as old or sketchy.

Authentication is the floor, not the ceiling — but without it, nothing else matters, because you can't even prove you're you.

## The working checklist

Run this top to bottom for any domain that sends mail:

```text
[ ] MX record points to your real mail host
[ ] SPF: one TXT record, lists every sending source, ends in ~all or -all
[ ] SPF: under 10 DNS lookups (no permerror)
[ ] DKIM: public key published per vendor selector (s=...)
[ ] DKIM: vendor is actually signing with d=yourdomain.com
[ ] DMARC: _dmarc record exists with rua= reporting address
[ ] DMARC: started at p=none, watching reports before tightening
[ ] Reports: every legitimate source shows an aligned pass
[ ] Then and only then: move p= to quarantine, then reject
```

*What just happened:* you turned a vague "fix my email" into nine verifiable steps. Each line is checkable in DNS or in a report — no guessing, no blaming the algorithm.

## For builders

Bake this into onboarding, not firefighting. When your app adds a new way to send mail, the pull request that wires up the vendor should also note the SPF `include:`, the DKIM selector, and a check of the next DMARC report. Treat the three records as part of "shipping email," the same way you'd treat a database migration as part of shipping a feature. The teams that never think about deliverability are the ones who built it in from the start.

```quiz
[
  {
    "q": "Your mail passes SPF but still fails DMARC. What's the most likely cause?",
    "choices": ["Port 25 is blocked", "SPF passed for the vendor's domain, which doesn't align with your visible From: — and DKIM isn't set up to fix it", "The recipient's server is down", "Your MX record is missing"],
    "answer": 1,
    "explain": "SPF checks the envelope domain, often the vendor's. Without aligned DKIM signing as your domain, DMARC sees a mismatch and fails."
  },
  {
    "q": "Why start a DMARC rollout at p=none instead of p=reject?",
    "choices": ["p=none is more secure", "p=none lets you collect reports and confirm every legitimate source passes before any mail gets blocked", "reject doesn't work on most servers", "none enables encryption"],
    "answer": 1,
    "explain": "p=none is monitor-only. It gives you a safe window to find unconfigured sending sources via reports before tightening to quarantine and reject."
  },
  {
    "q": "What does the DMARC aggregate report (rua) most usefully tell you?",
    "choices": ["The content of each email", "Which of your sending sources are passing or failing authentication and alignment", "The recipients' passwords", "Your server's CPU usage"],
    "answer": 1,
    "explain": "The report breaks delivery down by source IP, showing SPF/DKIM results and alignment — so you can pinpoint the source you forgot to configure."
  }
]
```

[← Phase 2: The Three Proofs](02-spf-dkim-dmarc.md) | [Overview](_guide.md)
