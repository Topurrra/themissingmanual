---
title: "Lock-In, Cost & When It Fits"
guide: outsystems-and-mendix
phase: 3
summary: "The honest tradeoffs: how licensing is priced, how deep the vendor lock-in runs, what the skills market looks like, where the escape hatches are, and when to choose it or walk away."
tags: [outsystems, mendix, low-code, vendor-lock-in, pricing]
difficulty: intermediate
synonyms:
  - "is outsystems worth the cost"
  - "low-code vendor lock-in risk"
  - "mendix pricing model"
  - "when not to use low-code"
  - "low-code escape hatch"
updated: 2026-06-30
---

# Lock-In, Cost & When It Fits

The previous phases were the brochure: fast, governed, real. This phase is the conversation you have after the demo, when the contract is in front of you. Both platforms are genuinely good at what they do. They are also expensive, sticky, and wrong for plenty of projects. Here is the straight version.

## How the licensing actually works

Neither vendor publishes straightforward per-seat pricing the way a SaaS app does, and both have reshaped their pricing more than once - so treat any specific number you read as a starting point for a sales conversation, not a quote. The shape is what matters.

Pricing is built around a few levers, usually combined:

- **Application size / consumption.** How big and complex your apps are - often measured in something like "application objects" (entities, screens, logic units). More app, more cost.
- **End users.** Internal users versus external (customer-facing) users are usually priced very differently, with external users costing more.
- **Environments and capacity.** Each environment (dev, test, prod) and the compute behind it factors in.
- **Tier.** Both sell ascending tiers - a smaller starting plan up to large enterprise agreements with negotiated pricing.

The honest summary: a serious production deployment is a five-to-six-figure annual commitment, and the bill grows with usage. There are free or low-cost tiers for learning and small apps (Mendix has long offered a free tier; OutSystems offers a free developer edition), which are great for evaluation but not where the real money or the real apps live. Budget for the platform fee as an ongoing operating cost, not a one-time license - and model how it scales if your user count or app count grows, because that is where teams get surprised.

## The lock-in, named honestly

This is the single most important thing to understand before you commit. Your application is not portable. You are not writing code in a language you could move elsewhere; you are building inside a proprietary model that only that vendor's runtime can execute.

```text
What you can take with you:        What you cannot:
- your data (it's in a DB)         - the screens
- the requirements/knowledge       - the logic flows
- custom code you wrote            - the data model definitions
                                   - the whole app, as a running thing
```

If you decide to leave OutSystems or Mendix, there is no export-to-portable-code button. Migrating off means rebuilding the application on the new platform - re-implementing the screens, the flows, the integrations - from scratch. Your data comes with you because it lives in a real database, and the institutional knowledge of what the app does comes with you. The app itself does not.

This is not a flaw they hid; it is structural to the model-driven approach. The same tight coupling that gives you the speed is the thing that locks you in. Go in with eyes open: you are renting velocity, and the rent includes a switching cost that compounds with every app you build on the platform.

## The skills market

The flip side of lock-in is that the skills are scarce and therefore valued. "OutSystems developer" and "Mendix developer" are real, paid career tracks with vendor certifications that employers ask for by name. The talent pool is smaller than for mainstream languages, which cuts two ways: if you are hiring, expect a thinner market and to pay a premium or train people up; if you are building a career, certification in one of these can be a durable, well-paid niche precisely because the supply is limited and the customers are large enterprises with budget.

Worth noting: the skills are somewhat platform-specific. A strong Mendix developer is not automatically an OutSystems developer. The transferable parts are the fundamentals - data modeling, logic design, integration thinking - not the tool muscle memory.

## Performance and the escape hatches

For the apps these platforms are aimed at - internal business tools, forms-over-data, workflows for hundreds or thousands of users - performance is fine. The generated apps are real running applications, not interpreted toys.

When you hit the platform's ceiling, both give you escape hatches. You can write custom code (extensions, custom actions, hand-coded front-end components), call out to external services, and drop to lower-level logic for the parts the visual tools can't express. That means you rarely hit a true dead end on functionality.

But the escape hatches have a cost of their own: every line of custom code is a place the low-code promise breaks down - it needs a traditional developer, it is harder to maintain, and it erodes the "anyone on the team can read this" benefit. A project that is 90% visual and 10% code is healthy. A project that is 50% custom code is a sign you picked the wrong tool, paying enterprise platform fees to mostly write code by hand.

## When it fits, and when it doesn't

**It fits when:**

- You are an organization with a backlog of internal business apps and not enough developers.
- Governance, audit, and IT control are genuine requirements (regulated industries especially).
- The apps are forms, workflows, dashboards, and integrations over existing systems - the platform's sweet spot.
- You can absorb an ongoing platform fee and accept the lock-in as a deliberate trade for speed.

**It does not fit when:**

- You are a startup building your core product. The lock-in, the cost, and the ceiling on differentiation make it a poor bet for the thing your company lives or dies on.
- Your app needs deep custom logic, unusual performance characteristics, or pixel-perfect bespoke UX - you will fight the platform and pay for the privilege.
- Budget is tight and the app count is low. The per-app economics only make sense at volume or at enterprise scale.
- You need full portability and want to avoid betting on a single vendor's roadmap.

The clean mental test: **enterprise low-code is for the apps that run your business, not the app that is your business.** If you are clearing an internal backlog under IT's watch, OutSystems and Mendix are strong, sensible choices and the lock-in is a fair trade. If you are building the product customers pay you for, the same lock-in that buys speed becomes a cage. Know which one you are doing before you sign.
