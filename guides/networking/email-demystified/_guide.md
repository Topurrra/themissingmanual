---
title: "Email, Demystified (SPF, DKIM, DMARC)"
guide: "email-demystified"
phase: 0
summary: "How email really travels and why yours lands in spam: SMTP, plus the three DNS records that prove a message is truly from your domain."
tags: [networking, email, smtp, spf, dkim, dmarc]
category: networking
order: 9
difficulty: intermediate
synonyms: ["how does email work", "what is spf dkim dmarc", "why does my email go to spam", "how to stop email going to spam", "set up spf dkim dmarc records", "email authentication explained", "how smtp works"]
updated: 2026-06-30
---

# Email, Demystified (SPF, DKIM, DMARC)

You sent a perfectly normal email and it landed in spam. Or worse: someone sent mail *as you* - your domain, your name - and your customers got it. Email feels like one of the oldest, simplest things on the internet, yet the moment deliverability breaks, the advice you find is a wall of acronyms with no model underneath. SPF, DKIM, DMARC, "soft fail," "alignment" - what *are* these things?

This guide gives you the model first. You'll follow one email on its real journey, see exactly why spoofing was so easy for so long, and then meet the three DNS records that fix it - what each one actually proves, the literal text you put in DNS, and why you need all three working together. By the end, "it's going to spam" will be a problem you can diagnose, not a curse.

## How to read this

- **Deliverability is on fire right now?** Skip to [Phase 3](03-fixing-deliverability.md) - it's the cure, the record-by-record checklist, and how to read a DMARC report.
- **Want it to actually make sense?** Read in order. The journey (Phase 1) explains *why* spoofing works; the three records (Phase 2) only make sense once you've seen the hole they plug.

## The phases

1. **[The Journey of One Email](01-the-journey-of-one-email.md)** - what SMTP really is, the hop-by-hop trip from your app to the recipient's inbox, and the open door that lets anyone claim to be you.
2. **[The Three Proofs: SPF, DKIM, DMARC](02-spf-dkim-dmarc.md)** - the three DNS records that authenticate your mail: who may send, a tamper-proof signature, and the policy that ties them together. The actual records, line by line.
3. **[Fixing Deliverability](03-fixing-deliverability.md)** - why mail still goes to spam after you "set up SPF," the alignment trap, reading a DMARC report, and a working checklist.

> This guide assumes you're comfortable with the basics of how machines find each other. If DNS records and ports feel fuzzy, read [IP Addresses, DNS & Ports](/guides/ip-dns-and-ports) first - email leans hard on DNS, and that foundation makes everything here click.

---

[Phase 1: The Journey of One Email →](01-the-journey-of-one-email.md)
