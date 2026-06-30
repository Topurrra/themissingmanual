---
title: "Safer Habits and Org Rules"
guide: ai-privacy-and-safety
phase: 3
summary: "The everyday habits that let you keep using AI safely - redacting before you paste, sticking to approved tools, knowing when a local model fits, and actually reading your organization's AI policy."
tags: [privacy, data-safety, ai-policy, redaction, local-models]
difficulty: beginner
synonyms:
  - "how to use AI safely at work"
  - "redact sensitive data before AI"
  - "approved AI tools at work"
  - "when to use a local AI model"
  - "reading my company AI policy"
updated: 2026-06-30
---

# Safer Habits and Org Rules

The previous phases drew the line. This one is about living comfortably on the right side of it without turning every task into a chore. The good news: a few small habits cover the vast majority of cases, and once they're muscle memory you stop thinking about them.

## Redact before you paste

Most documents you want help with are 95% harmless and 5% sensitive. You don't have to throw away the whole thing - strip the 5% and paste the rest. The model almost never needs the real names and numbers to do the job.

The move is to replace specifics with placeholders:

```text
Before: "Draft a refund reply to Maria Gonzalez, account 4471-8832,
         who was double-charged $89.99 on her Visa ending 4012."

After:  "Draft a refund reply to [CUSTOMER], account [ACCT],
         who was double-charged [AMOUNT] on her card."
```

The reply you get back is identical in quality - you fill the real details back in yourself afterward. A few practical notes:

- **Watch the corners.** People redact the obvious name and forget the phone number three lines down, or the email address in the signature, or the case number in the subject. Read the whole thing before pasting.
- **Beware "anonymized" that isn't.** Removing a name doesn't help if you leave "the only left-handed VP in our Tokyo office." Combinations of small details can re-identify someone. When in doubt, generalize harder.
- **Don't redact secrets - kill them.** A redacted password is still a leaked password if you fat-finger it. Credentials get rotated, not masked.
- **Files are sneaky.** Uploading a document or spreadsheet sends everything in it, including hidden columns, tracked changes, comments, and metadata you forgot were there. Uploading is pasting the whole file.

## Use the tools your org actually approved

If your company has chosen a sanctioned AI tool - an enterprise ChatGPT, a Microsoft Copilot tenant, a Claude for Work account, an internal wrapper - use that one, even if your personal account feels faster. The approved tool usually sits behind a business agreement that says they won't train on your data, an admin who controls retention, and logging that protects both you and the company.

The opposite of this is "shadow AI": people quietly using personal accounts and random browser extensions for work because IT was slow or said no. It's understandable and it's a real problem - it's how sensitive data ends up in places nobody is tracking. If the sanctioned tool is missing a feature you need, that's a conversation to have with IT, not a reason to route company data through your personal login.

Be especially wary of free AI browser extensions, "summarize this page" plugins, and no-name apps. Many send whatever they touch to servers with terms nobody has read. A flashy free tool is often paying its bills with your data.

## When a local model helps

For the most sensitive work, there's an option that sidesteps the whole "where does it go" question: run the model on your own machine. Tools like Ollama or LM Studio let you download an open-weights model (such as Llama or Mistral) and run it entirely offline. Nothing leaves your computer, so there's no third party to worry about.

This is genuinely useful for confidential drafts, sensitive analysis, or regulated data where you can't risk a cloud service. But be honest about the trade-offs:

- **Quality is lower.** A model that fits on your laptop is smaller and less capable than the big cloud ones. Fine for many tasks, frustrating for hard ones.
- **It needs decent hardware.** A capable machine with plenty of memory; modest laptops struggle.
- **"Local" only counts if it's actually local.** Plenty of tools say "private" while still calling a cloud API. Verify it runs offline - pull your network connection and see if it still answers.
- **You own the security now.** No vendor is encrypting and patching for you. The data's safety is your machine's safety.

Local models are a specialized tool, not the default. For everyday work, an approved cloud business account is the right balance of safety and capability. Reach for local when the data is too sensitive to leave the building at all.

## Read your org's AI policy

This is the step everyone skips, and it's the one that keeps you out of trouble. Most organizations of any size now have an AI policy - and if yours doesn't yet, assume it will, possibly retroactively. Find it before you need it. It's usually in the employee handbook, the IT or security wiki, or a one-pager from legal.

When you read it, look for the answers to these specific questions:

- **Which tools are approved**, and for what kinds of data?
- **What's explicitly banned** - customer data, code, financials?
- **Do you need to disclose** when AI helped produce work?
- **Who owns AI output** and who's accountable if it's wrong?
- **Who do you ask** when you're unsure?

If there is no policy, that's not a green light - it's a gap, and you'll be the example if something goes wrong. Ask. A two-line email to IT or your manager ("Is it okay to use [tool] for [task]? Anything I should keep out of it?") protects you and pushes the org to think it through.

## The whole guide in one breath

Everything you type into a cloud chatbot leaves your machine, may be stored, and on the wrong account may train a model. So: turn off training where you can, never paste secrets or credentials or other people's personal or regulated data, redact the sensitive bits out of everything else, stick to the tools your org blessed, keep a local model in your back pocket for the truly sensitive stuff, and read the policy before someone reads it to you. Do that, and you get almost all of AI's speed with almost none of the regret.
