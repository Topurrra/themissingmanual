---
title: "Publishing & Sharing (Workspaces, Apps, RLS)"
guide: "power-bi-from-zero"
phase: 10
summary: "How a report on your laptop becomes something a whole team can open on the web, and how to make sure each person only sees the rows they're allowed to see."
tags: [power-bi, publishing, workspaces, power-bi-service, apps, row-level-security, rls, sharing]
difficulty: intermediate
synonyms: ["power bi workspace vs app", "how to publish power bi report", "power bi row level security", "power bi rls tutorial", "power bi share report", "power bi app vs workspace", "view as role power bi", "power bi dynamic rls with username"]
updated: 2026-07-14
---

# Publishing & Sharing (Workspaces, Apps, RLS)

Everything so far has lived on your laptop, in Power BI Desktop, visible to exactly one person: you. This phase is where that changes. You'll take the `.pbix` file you've been building and turn it into something that lives on the web, that a manager can open from their phone, and that shows the sales director every region's numbers while showing a regional manager only their own region - from the *same* report, with no copies and no manual filtering.

Three ideas do all the work here: **workspaces** (where reports live once they leave your laptop), **apps** (how you hand a finished report to an audience without handing them a construction site), and **row-level security** (how one report shows different rows to different people). Get the mental model for each and the buttons are almost incidental.

## The mental model: workspace, app, audience

**A workspace is a shared folder with muscle.** In the Power BI Service (app.powerbi.com), a workspace holds the published reports, the semantic models (the data models behind them - Microsoft renamed these from "datasets" in late 2023, so older tutorials still call them that), and a list of people who can edit them - like a shared drive, except the "files" are live, queryable data models, not static documents. Everyone added to a workspace as a member or admin can open the raw report, poke at the model, and publish new versions. That's exactly right for the three or four people building the report together. It's exactly wrong for the two hundred people who just want to look at the numbers - giving all two hundred edit access to the workspace means any of them could accidentally rename a table or delete a page.

That's the problem an **app** solves. An app is a read-only, curated view of some (not necessarily all) of a workspace's reports, published separately and shared with an audience that never sees the workspace at all. Think of the workspace as the kitchen and the app as the dining room: the cooks need access to every drawer and the stove, the diners need a clean plate. You keep building and iterating in the workspace; when a version is ready, you publish it out as an app, and that's what the two hundred people actually open.

```
Power BI Desktop (.pbix, your laptop)
        │  Publish
        ▼
   Workspace  ──────────────►  built by 2-4 editors, changes constantly
        │  Publish app
        ▼
      App     ──────────────►  opened by 200 viewers, changes on your schedule
```

The gap between those two arrows matters: publishing a new app version is a deliberate step, not automatic. You can rework a broken visual in the workspace all afternoon without a single viewer seeing the mess, then publish the app once when it's actually done.

## Publishing from Desktop to a workspace

From Power BI Desktop, with your file saved: **Home ribbon → Publish**, pick a workspace (or create one), and Desktop uploads both the report and the semantic model behind it. The first time you do this you'll be prompted to sign in - this is the moment mentioned back in phase 1, where a Microsoft 365 / organizational account finally becomes necessary, because a workspace is a cloud object tied to your organization's tenant.

Two workspace types worth knowing apart:

- **My Workspace** - your personal sandbox, visible only to you. Fine for testing a publish, wrong for anything a second person needs to see.
- **A (proper) workspace** - created with a name, given members with roles (Viewer, Contributor, Member, Admin), and this is where real, shared work happens.

Once published, open the report in a browser at app.powerbi.com. It's the same report, live-querying the same in-memory model you built in phases 4-7 - just reachable from anywhere instead of from one laptop.

## Three ways to share, and when each is right

Power BI gives you three genuinely different sharing mechanisms, and picking the wrong one is the most common publishing mistake:

| Method | Who can do what | Best for |
|---|---|---|
| **Direct share** ("Share" button on a report) | One specific person gets viewer (or edit) access to that one report | A single colleague, a quick one-off |
| **Workspace access** | Members and admins get full editor access to every report/semantic model; viewers get read-only | The build team, 2-5 people, ongoing collaboration |
| **App** | Everyone in the audience gets read-only access to the curated set of reports you published | A department, a leadership team, anyone who should never see the underlying model |

If you find yourself adding twenty names to "Share" one at a time, that's a sign you want an app instead - it's built for exactly that fan-out, and it lets you update the audience list, the reports included, and the navigation in one place rather than twenty individual shares.

## Row-level security: one report, different rows per viewer

Here's the problem RLS solves. Say your Sales report has a Region column, and you want the East regional manager to see only East's numbers, West's manager to see only West's, and the VP to see everything - without maintaining three separate reports that all drift out of sync the moment someone edits a measure.

**What RLS actually is:** a filter, written once as a DAX expression, that Power BI silently applies to every query a given user runs against the model - on top of whatever slicers and filters are already on the page. The user never sees the filter; they just see fewer rows, as if that's all that ever existed.

You build it in Desktop under **Modeling → Manage Roles**. A role is a name plus a DAX filter expression applied to a table:

```dax
[Region] = "East"
```

That one line, saved as a role called `East Manager` and applied to the `Sales` table, means: anyone assigned this role only ever sees `Sales` rows where `Region` equals `"East"` - and because of how the relationships you built in phase 4 propagate filters, anything summarized from `Sales` (totals, charts, cards) inherits that restriction automatically. You don't have to repeat the filter on every visual.

Before publishing, test it in Desktop with **View as Roles** - pick the role, and the whole report re-renders as that user would see it. This step is not optional. RLS bugs are invisible to you (the report author, who normally sees everything) and glaringly obvious to the one person who suddenly can't see their own region - catch it here, not in a Monday morning email.

### Static vs. dynamic RLS

The `[Region] = "East"` role above is **static**: one role per region, and you manually assign users to roles after publishing (Workspace → semantic model → Security). That's fine for five regions. It falls over at fifty, because you're hand-maintaining fifty role-to-people mappings forever.

**Dynamic RLS** fixes this by looking up the viewer's own identity instead of hard-coding a value:

```dax
[Region] = LOOKUPVALUE(
    UserRegionMap[Region],
    UserRegionMap[Email], USERPRINCIPALNAME()
)
```

`USERPRINCIPALNAME()` returns the email of whoever is currently viewing the report. `LOOKUPVALUE` finds that email in a small mapping table (`UserRegionMap`, one row per person, sitting in your model just for this purpose) and pulls back their assigned region. One role, no per-person assignment - add a row to the mapping table when someone joins the sales team, and RLS just works for them. This is the version worth reaching for the moment you have more than a handful of viewer groups.

## Recap

1. **Workspaces** hold reports for the small team actually building them; give editor access there only to people who should be able to change the model.
2. **Apps** are the read-only, curated distribution layer - publish one when a workspace is ready for a real audience, and update it on your own schedule.
3. Pick sharing by audience size and access level: direct share for one person, workspace access for co-builders, an app for everyone else.
4. **RLS** is a DAX filter (`Manage Roles` in Desktop) applied automatically to every query a user makes; always verify it with **View as Roles** before publishing.
5. **Static RLS** hard-codes a value per role and needs manual user assignment; **dynamic RLS** looks up the viewer via `USERPRINCIPALNAME()` against a mapping table and scales to any number of people with zero per-person setup.

### Check yourself

```quiz
[
  {
    "q": "You need to give 200 people in the sales department read-only access to a finished report, without exposing the underlying semantic model. What should you use?",
    "choices": [
      "Add all 200 people as workspace members",
      "Publish an app and share it with them",
      "Use the direct-share Share button 200 times",
      "Give them all the Contributor role in the workspace"
    ],
    "answer": 1,
    "explain": "Workspace access hands out editor rights to the model itself, which is wrong for a read-only audience of that size - an app is the read-only, curated distribution layer built for exactly this fan-out."
  },
  {
    "q": "You wrote a role with the filter [Region] = \"East\" and assigned it to a user, but forgot to test it before publishing. What's the real risk?",
    "choices": [
      "None - RLS filters are validated automatically by the Power BI Service before publish",
      "The report will fail to publish until the role is tested",
      "The bug is invisible to you as the author (you see everything) and only shows up when that user opens the report and sees the wrong or missing rows",
      "The filter only applies to new rows added after publishing"
    ],
    "answer": 2,
    "explain": "As the report author you normally see all rows, so a broken RLS filter looks completely fine to you - View as Roles exists specifically to catch that mismatch before a real viewer does."
  },
  {
    "q": "A company has 50 regional managers, each needing to see only their own region. Why would you reach for dynamic RLS instead of static RLS?",
    "choices": [
      "Dynamic RLS runs faster because it skips the filter for small tables",
      "Static RLS can only support up to 10 roles, so 50 regions is impossible without dynamic RLS",
      "Dynamic RLS looks up each viewer's region from a mapping table via USERPRINCIPALNAME(), so adding a new manager means adding a row instead of hand-building and assigning a 51st role",
      "Dynamic RLS doesn't require testing with View as Roles"
    ],
    "answer": 2,
    "explain": "Static RLS needs one hard-coded role per region plus a manual user-to-role assignment for each person; dynamic RLS replaces all of that with a single role that looks up the current viewer's region from a mapping table, so it scales to any number of people with no per-person setup."
  }
]
```

---

[← Phase 9: Building Reports & Dashboards](09-building-reports-and-dashboards.md) · [Phase 11: Refresh, Gateways & Capacity Basics →](11-refresh-gateways-and-capacity-basics.md)
