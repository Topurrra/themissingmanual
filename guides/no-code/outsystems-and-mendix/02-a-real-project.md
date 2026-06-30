---
title: "What a Real Project Looks Like"
guide: outsystems-and-mendix
phase: 2
summary: "A walkthrough of building a real business app on these platforms — data model, screens, logic, integrations, the deployment pipeline, and the team roles around it."
tags: [outsystems, mendix, low-code, deployment, team-roles]
difficulty: intermediate
synonyms:
  - "what does an outsystems project look like"
  - "mendix app development process"
  - "low-code deployment pipeline"
  - "low-code team roles"
  - "building an enterprise app low-code"
updated: 2026-06-30
---

# What a Real Project Looks Like

Let's build something concrete: a field-inspection app for a facilities company. Inspectors visit buildings, fill out a checklist on a tablet, attach photos, and flag issues. Managers see a dashboard of open issues and assign repairs. It is exactly the kind of internal tool these platforms exist for — not flashy, but real, and a nightmare of plumbing to build from scratch.

Here is what the build looks like, layer by layer, and who does each part.

## The data model

You start with the data, because everything hangs off it. In the modeler you draw entities and the relationships between them.

```text
Building (1) ----< (many) Inspection ----< (many) IssueFlag
Inspector (1) ----< (many) Inspection
```

You define `Inspection` with fields like `date`, `status`, `inspector`, and a link to a `Building`. You add an `IssueFlag` entity with `severity`, `description`, and a photo attachment. As you draw, the platform provisions the underlying database tables and the data-access layer. There is no SQL to write for the common cases — you query and filter through visual data sources. When you later add an `assigned_to` field, the platform handles the schema change and updates everything that reads the entity.

This is the layer where getting it right matters most. A clean data model makes the rest of the app fall into place; a messy one means you fight the platform for the whole project. The modeling skill transfers directly from traditional database design — entities are tables, relationships are foreign keys.

## The screens

Next, the UI. You drag pre-built screen templates onto a canvas — a list screen, a detail/edit screen, a dashboard. You bind them to your entities, so the "inspection list" screen automatically shows your inspection data with sorting, paging, and search. You arrange widgets (input fields, dropdowns, date pickers, image uploaders) and the platform makes them responsive across phone, tablet, and desktop without you writing CSS for every breakpoint.

Both platforms ship a component library and a theming system so your app inherits a consistent look. For the inspector's tablet flow you would use the mobile-optimized screens; for the manager's dashboard, the desktop layout. When the stock widgets are not enough — a custom map view of flagged buildings, say — this is where you drop into hand-written front-end code or pull in a custom component.

## The logic

Business logic is drawn as flowcharts, called "action flows" in OutSystems and "microflows/nanoflows" in Mendix. For our app:

```text
[Inspector submits inspection]
        |
   any IssueFlag with severity = "High"?
      /                    \
    yes                     no
     |                       |
 create repair task     mark Inspection
 notify manager         as "Closed"
 set status "Urgent"
```

You build that by dropping action boxes onto a flow and connecting them. Decisions are diamonds, data operations are boxes, and you can call one flow from another to reuse logic. For genuinely complex computation you write a code expression or a custom action, but the orchestration stays visual so the next person can read the intent without reverse-engineering nested code.

## The integrations

No business app lives alone. Our inspection app needs to pull the building list from the company's facilities system and push repair tasks into the existing maintenance ticketing tool. Both platforms consume REST and SOAP APIs by pointing at the endpoint or definition file and generating typed actions you can drag into a flow. There are pre-built connectors for common systems (SAP, Salesforce, databases, the corporate directory for login) in their marketplaces. Authentication against the corporate single sign-on is configuration, not code.

Integrations are usually where a low-code project earns its surprises. The visual side is smooth until an upstream API is flaky, paginated oddly, or returns data in a shape the platform's generated structure dislikes — then you are debugging the seam between two systems, which is hard everywhere.

## The deployment pipeline

This is the governance layer in action and a real strength. Your app lives in environments — typically Development, Test/QA, and Production — that the platform manages as first-class objects. You publish to Development with one click. When it is ready, you promote the exact same versioned package up the chain: Dev to Test, Test to Production. The platform tracks versions, shows you what changed, runs dependency checks, and can roll back to a previous version. Who is allowed to promote to Production is a permission, with an audit trail of every deploy.

```text
Develop  -->  Test/QA  -->  Production
  (devs)      (testers)     (release manager approves)
   one-click promote of a versioned package, with rollback
```

Compared to wiring up your own CI/CD, this comes nearly for free, and it is a large part of what enterprises are paying for.

## The team around it

A real project is not one person. Typical roles:

- **Low-code developers** — build the entities, screens, and flows. The core builders.
- **Solution/technical architect** — owns the data model, sets standards, decides what gets reused, keeps the app from rotting.
- **Business analyst / product owner** — defines requirements; on Mendix especially, may build small flows directly.
- **Release manager / platform admin** — controls environments, permissions, and promotions to production.
- **Traditional developers** — write the custom code, components, and tricky integrations the visual tools can't reach.

The team is smaller than an equivalent hand-coded project, which is the speed dividend. But "fewer people" is not "no expertise" — a badly architected low-code app rots exactly like a badly architected coded one. The platform speeds up the typing, not the thinking. Which brings us to the part you weigh before committing: what it costs, what you can't take with you, and when it's the wrong tool.
