---
title: "What Not to Paste"
guide: ai-privacy-and-safety
phase: 2
summary: "A concrete list of the data that should never go into a general chatbot - secrets, credentials, customer personal information, regulated data, and unreleased company plans - with examples of each."
tags: [privacy, pii, credentials, compliance, data-safety]
difficulty: beginner
synonyms:
  - "what data should I not put in ChatGPT"
  - "is it safe to paste API keys into AI"
  - "customer PII and AI chatbots"
  - "regulated data AI rules"
  - "company secrets and AI tools"
updated: 2026-06-30
---

# What Not to Paste

Here's the rule of thumb that does most of the work: before you paste, ask "if this exact text showed up in a news article, or in a stranger's inbox, would I be in trouble?" If the answer is yes, don't paste it into a general chatbot. Everything below is a category where the answer is usually yes.

A useful mental test alongside it: would you put this on a whiteboard in a coffee shop and walk away? A pasted prompt is closer to that than to a private notebook.

## Secrets and credentials

These are the worst offenders because the damage is immediate and total. A leaked password isn't embarrassing - it's a working key to a real lock.

- **Passwords and PINs** - yours or anyone else's.
- **API keys, access tokens, secret keys** - the long random strings that let software talk to other software. Pasting your AWS or payment-processor key into a chatbot to "help debug this error" is one of the most common real-world leaks.
- **Private keys and certificates** - SSH keys, signing keys, anything starting with `-----BEGIN PRIVATE KEY-----`.
- **Connection strings** - database URLs often have the username and password baked right in: `postgres://admin:hunter2@db.internal:5432`. That one line is full credentials.
- **Two-factor codes and recovery codes.**

Why it bites: credentials are designed to be used by whoever holds them. The moment a key sits in a chat log on a server you don't control, you have to assume it could be used. The fix isn't redaction here - it's *rotate it*. If you've already pasted a key, go invalidate it and generate a new one. Today.

## Customer and personal information (PII)

PII is any data that identifies a specific living person. It's the category most people leak without noticing, because it's sitting inside the very documents they want help with - the support ticket, the spreadsheet, the email thread.

- Full names paired with contact details, addresses, dates of birth.
- Government IDs: Social Security numbers, passport numbers, national insurance numbers, driver's licenses.
- Financial details: credit card numbers, bank account and routing numbers.
- Anything tied to an identifiable person that they'd consider private.

Concrete example: you paste a customer's angry email so the AI can draft a calm reply. That email has their name, their account number, their phone, and a line about their billing dispute. You've now sent a real person's data to a third party they never consented to. Strip the identifying bits first - the AI can write an equally good reply to "[Customer]" about "[the billing issue]."

## Regulated data

Some data isn't only sensitive - it's governed by law, and the penalties are real money. You may be personally fine pasting it and still put your employer in legal jeopardy.

- **Health information (HIPAA in the US, and similar elsewhere):** diagnoses, treatments, medical records, anything linking a person to a health condition.
- **Children's data (COPPA):** information about kids under 13 carries special rules.
- **EU/UK personal data (GDPR):** strict consent and transfer rules; sending an EU resident's personal data to a US AI service can itself be a violation.
- **Payment card data (PCI DSS):** full card numbers have their own handling standard.
- **Financial and legal records** under sector-specific rules (banking, insurance, securities).

Why it bites: with regulated data, "nothing bad happened" doesn't save you. The act of mishandling it is the violation, fine or no fine, breach or no breach. If your work touches any of these, this is exactly the conversation to have with whoever owns compliance before you build AI into your routine.

## Unreleased and confidential company information

This one feels lower-stakes because it's "just internal." It isn't.

- **Unannounced products, features, launch dates.**
- **Financials before they're public** - revenue, fundraising terms, an acquisition in progress. (For public companies, leaking these can be a securities-law problem, not a privacy one.)
- **Source code and proprietary algorithms**, especially anything that's a competitive advantage.
- **Internal strategy, legal matters, HR cases, layoffs in planning.**
- **Anything under an NDA** - yours or a partner's. If you signed a contract promising to keep it confidential, a chatbot is a third party.

Concrete example: pasting your entire codebase or a strategy deck into a consumer chatbot to "summarize it for the team." On a free tier that might train future models, you've handed your edge to a system that millions of people query.

## The quick gut-check table

| You're about to paste... | General chatbot? |
|---|---|
| An API key or password | No - and rotate it if you already did |
| A customer's email with their details | No - redact the personal bits first |
| Patient health info, kids' data, EU personal data | No - regulated, check compliance first |
| An unreleased product plan or financials | No - confidential, use an approved tool |
| A public blog post you want shortened | Yes - it's already public |
| Generic code with no secrets or business logic | Usually fine - strip keys first |

The pattern across every category is the same: the chatbot is a third party, and pasting is publishing to it. Public or anonymous, paste freely. Identifying, secret, regulated, or confidential - don't, or strip it down until it isn't. Next we turn that "strip it down" instinct into a handful of habits that let you keep almost everything on the green list.
