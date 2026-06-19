---
title: "How to Actually Use It"
guide: "owasp-top-10"
phase: 3
summary: "The OWASP Top 10 is a checklist, not a guarantee — thread it into design, code review, and dependency updates, lean on defense in depth, and never treat 'we checked it once' as 'we're secure.'"
tags: [security, owasp, code-review, defense-in-depth, dependencies, checklist]
difficulty: intermediate
synonyms: ["how to use owasp top 10", "owasp top 10 in code review", "is owasp top 10 enough", "defense in depth", "keep dependencies patched", "owasp cheat sheets"]
updated: 2026-06-19
---

# How to Actually Use It

You've got the map. The last question is the one that actually keeps apps safe: *what do you do with it on a Tuesday?* The trap here is treating the Top 10 like a final exam — run through it once, tick the boxes, declare victory. That's exactly the mindset that gets teams breached. The list is a **living checklist**, not a certificate. Here's how to thread it into work that's already happening, so it protects you continuously instead of once.

## Thread it into the three places work already happens

You don't need a separate "security phase." You need the Top 10 present at three moments you already have.

**At design time.** Before you build a feature, ask the Top 10's questions of the *plan*: Who's allowed to do this, and where do we check it? What user input do we trust, and should we? What happens if someone hammers this endpoint? This is how you catch **Insecure Design** — the flaws you can't patch later because they're baked into the shape of the thing. Designing the control in costs minutes; retrofitting it costs a rewrite.

**At code review.** Make the relevant categories part of how you read a diff. A reviewer with the list in mind sees the string-concatenated query (Injection), the missing ownership check (Broken Access Control), the user-supplied URL the server fetches (SSRF).

```text
   Reviewing this diff, run the relevant suspicions:

     ┌─ touches a DB query?      → is it parameterized?         (Injection)
     ├─ touches user data/IDs?   → does it check ownership?     (Broken Access Control)
     ├─ touches login/sessions?  → rate-limited? MFA? safe cookies? (Auth Failures)
     ├─ makes an outbound call?  → is the destination trusted?  (SSRF)
     └─ added a dependency?      → known CVEs? still maintained? (Vulnerable Components)
```

**At dependency-update time.** A huge share of real breaches come through **Vulnerable & Outdated Components** — a library with a publicly known hole that nobody updated. This is the least glamorous and most cost-effective security work you'll ever do: keep your dependencies patched.

**A real example.**
```console
$ npm audit
# npm audit report

ws  <8.17.1
Severity: high
ws affected by a DoS when handling a request with many HTTP headers
fix available via `npm audit fix`
1 high severity vulnerability
```
*What just happened:* The tooling cross-referenced your installed packages against a public database of known vulnerabilities and found one you'd never have spotted by reading your own code — the bug is in someone else's library. Most ecosystems have an equivalent (`pip-audit`, `cargo audit`, `govulncheck`, GitHub's Dependabot). Wiring one into CI turns "Vulnerable Components" from a landmine into a routine chore.

## Defense in depth — no single check is the wall

**What it actually is.** Defense in depth means layering protections so that when one fails — and one always eventually fails — another still stands. The Top 10 is one layer: a list of the most likely failures to guard against. It is not the whole wall.

**Why this matters.** A single control is a single point of failure. Validate input *and* use parameterized queries *and* enforce least privilege on the database account, so that a slip in one place doesn't hand over everything. The Top 10 tells you *which* layers are worth having; defense in depth is the principle that you want several of them.

> ⏭️ For the bigger picture of what "being secure" even means — threat models, trade-offs, and why there's no such thing as "done" — see [what security actually means](/guides/what-security-means).

## The trap: "we checked the Top 10, so we're secure"

This is the single most important warning in the guide, so it gets stated bluntly.

⚠️ **Gotcha.** The Top 10 is a floor, not a ceiling. It covers the *most common* risks — by definition, not *all* of them. "We reviewed against the Top 10" means "we checked for the usual suspects," which is genuinely valuable and absolutely not the same as "we are secure." Treating a one-time pass as a guarantee is how teams get comfortable right before they get breached.

⚠️ **Gotcha.** It's a *living* list, and so is your app. New dependencies arrive with new holes; new features add new attack surface; OWASP itself updates the list every few years. A security review is a snapshot of one moment. Re-run your suspicions as the code and the list both change — and keep those dependencies patched, because that clock never stops.

## Go deeper at the source

When you need specifics — exactly how to defend a given category, with concrete code patterns — OWASP publishes **Cheat Sheets**: focused, practical how-to pages for individual topics (input validation, password storage, session management, and many more). The current Top 10 and the full Cheat Sheet Series both live at **[owasp.org](https://owasp.org)**, free. The list in this guide tells you *what* to worry about; the cheat sheets tell you *exactly how* to fix each one.

## Recap

1. The Top 10 is a **checklist, not a guarantee** — it's the floor, never the ceiling.
2. Thread it into work you already do: **design** (catch Insecure Design early), **code review** (run the relevant suspicions on every diff), and **dependency updates** (patch known holes).
3. Wire a dependency scanner into CI so **Vulnerable & Outdated Components** becomes a routine chore, not a landmine.
4. Lean on **defense in depth** — layer controls so no single failure is fatal; see [what security means](/guides/what-security-means).
5. Never treat "we checked it once" as "we're secure"; re-check as the app and the list evolve, and use the OWASP **Cheat Sheets** at [owasp.org](https://owasp.org) for the how-to.

---

[← Guide overview](_guide.md) · [Phase 2: The Big Categories, in Plain English ←](02-the-big-categories.md)
