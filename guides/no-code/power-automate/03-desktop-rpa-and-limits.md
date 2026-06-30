---
title: "Desktop RPA, Governance & Limits"
guide: power-automate
phase: 3
summary: "Power Automate Desktop for clicking through legacy apps that have no API, the licensing gotchas that catch RPA builders, and the admin governance that keeps it all from becoming a mess."
tags: [power-automate, rpa, desktop, governance, licensing, dlp]
difficulty: intermediate
synonyms:
  - "power automate desktop rpa"
  - "automate legacy app without api"
  - "attended vs unattended rpa"
  - "power automate governance dlp"
  - "rpa licensing cost"
  - "power automate environments"
updated: 2026-06-30
---

# Desktop RPA, Governance & Limits

Cloud flows are great when the things you're automating have a connector. But plenty of business software doesn't - the ancient accounting program from 2009, the green-screen terminal nobody will touch, the website with no API. For those, Microsoft has a second tool with the same name: **Power Automate Desktop**. It's robotic process automation, or RPA, and it works by driving the screen the way a person would.

## What desktop RPA actually does

A **desktop flow** automates the user interface directly. It opens an application, clicks the buttons, types into the fields, reads values off the screen, copies data between windows. You build it by recording your clicks or by dragging steps in the desktop designer - open this app, click that field, extract that table, type this value.

The honest mental model: it's a very fast, very literal intern with no judgment. It does exactly what you taught it, in exactly the order you taught it. That's the strength - it can finally automate the legacy app that has no other way in - and the weakness, because anything that moves on screen can break it.

Use desktop RPA when there's **no connector and no API**. If a connector exists, use the cloud flow - it's faster, sturdier, and doesn't depend on a screen. RPA is the tool of last resort, not the default. People who lead with RPA end up with brittle automations that snap every time a vendor ships a UI update.

## Attended vs unattended - and why it matters for the bill

There are two ways to run a desktop flow, and the difference is mostly about licensing.

| Mode | Runs when | Needs |
|------|-----------|-------|
| Attended | A person is signed in and watching the machine | A user-level RPA license; included in some Windows 11 / Power Automate scenarios |
| Unattended | On a machine with nobody logged in, on a schedule, hands-off | An add-on (the unattended RPA license) - this is the expensive one |

**Attended** is a person kicking off an automation on their own PC and letting it run while they grab coffee. **Unattended** is the dream - a bot machine churning through work overnight with nobody there. Unattended is also where the cost lands. The unattended capability is a paid add-on, and it's typically the single biggest line item in an RPA project. Microsoft has bundled some attended desktop usage with Windows 11 over the years, but unattended is the one you budget for.

## The licensing gotchas, plainly

The licensing is the part that derails projects, so here's the short, honest version:

- **Premium connectors aren't free.** Anything beyond standard 365 connectors needs a premium plan. (Covered last phase - it still applies the moment a desktop flow hands off to a cloud flow that calls something premium.)
- **Unattended RPA is a separate, paid add-on.** Don't design an overnight bot before you've confirmed someone's paying for unattended.
- **Plans and prices shift.** Microsoft has reshuffled per-user, per-flow, and "hosted process" RPA licensing repeatedly. Whatever number you read in a blog post is probably stale.
- **Check your tenant, not the marketing page.** Before promising an automation, confirm what your organization is actually licensed for. The cheapest mistake is the one you catch before you build.

```text
BEFORE you build an RPA project, answer:
  1. Is there a connector/API? -> if yes, don't use RPA.
  2. Attended or unattended? -> unattended = paid add-on, confirm budget.
  3. Does it hand off to a premium connector? -> another license to check.
  4. Who maintains it when the target app's UI changes? -> someone must own it.
```

## Governance: when one flow becomes five hundred

A single person's flow is harmless. Power Automate's real risk shows up at scale: a few hundred employees each building flows, and now sensitive data is flowing through automations nobody's tracking. This is where admins earn their keep, and where a builder should understand the guardrails they're working inside.

**Environments** are the containers. An environment is a separate space - Default, plus ones admins create for a team, a project, or to split production from testing. Flows, connections, and Dataverse data live inside an environment, so they're the boundary for who-can-touch-what.

**Data Loss Prevention (DLP) policies** are the big one. A DLP policy sorts connectors into groups - typically "business" (work data) and "non-business" (everything else) - and **forbids a flow from mixing data across the groups**. The practical effect: an admin can stop anyone from building a flow that pulls data out of SharePoint and pushes it to a personal Dropbox or a public social account. The connectors won't combine in the same flow. It's the main lever stopping accidental data leaks.

**The Power Platform admin center** is where this is run - admins manage environments, set DLP policies, see who's building what, and decide who's even allowed to create flows. They can also limit who gets premium and RPA licenses, which is its own form of control.

Two failure modes to design against:

- **Flows owned by people who left.** A flow runs as the person who built it. When they leave and the account is disabled, the flow dies - often silently. Use service accounts or shared ownership for anything important, so a flow doesn't depend on one human's login surviving.
- **Sprawl with no inventory.** Hundreds of undocumented flows is a maintenance and security problem. Give things clear names, keep critical flows in a managed environment, and let admins see the landscape.

That's the full shape of Power Automate: cloud flows that react to events across 365, connectors and approvals that turn events into real workflows, and desktop RPA for the stubborn old apps - all sitting inside governance that decides what's safe, what's allowed, and what it costs. Build with the license check up front and the maintenance owner named, and it'll serve you for years. Skip those, and you'll spend more time fixing automations than the manual work ever took.
