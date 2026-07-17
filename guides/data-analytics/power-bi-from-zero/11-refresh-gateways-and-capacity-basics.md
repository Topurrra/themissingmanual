---
title: "Refresh, Gateways & Capacity Basics"
guide: "power-bi-from-zero"
phase: 11
summary: "How a published Power BI report actually gets new data - scheduled refresh, why an on-premises gateway exists at all, and what capacity limits (rows, refreshes per day, dataset size) you'll bump into as a report grows up."
tags: [power-bi, refresh, gateway, capacity, scheduled-refresh, dataflows, incremental-refresh, data-analytics]
difficulty: intermediate
synonyms: ["power bi scheduled refresh", "power bi gateway explained", "power bi on premises data gateway", "power bi refresh failed", "power bi capacity limits", "power bi pro vs premium", "power bi incremental refresh", "power bi dataset size limit", "why does power bi need a gateway"]
updated: 2026-07-14
---

# Refresh, Gateways & Capacity Basics

Go back to phase 1 for a second: a Power BI report is a snapshot of a database, built by replaying a fixed set of Power Query steps against a source. That snapshot is frozen the moment you hit publish. Nobody looking at the report in the Service is running live queries against your source system (with a couple of exceptions we'll get to) - they're looking at whatever was in the model the last time it refreshed. This phase is about that last part: how "the last time it refreshed" actually happens, why it sometimes can't, and the limits you'll hit as a report grows from "thing I built for my team" into "thing three hundred people rely on every morning."

## The mental model: refresh is a replay, not a sync

When Power BI refreshes a dataset, it does not creep through your source data looking for what changed. It reopens the `.pbix` (or the published dataset's equivalent), reruns every Power Query step from phase 3 top to bottom against the live source, and rebuilds the VertiPaq model from scratch. Full replay, every time, by default.

That single fact explains almost everything confusing about refresh:

- **Why it's slow on huge tables.** A 50-million-row fact table gets re-pulled and re-compressed in full on every refresh, unless you've told Power BI otherwise.
- **Why a broken Power Query step breaks refresh entirely, not partially.** The replay either runs to completion or fails - there's no "load what worked, skip what didn't."
- **Why refresh needs a live path back to the source.** Something has to actually run those queries against SQL Server, the SharePoint list, the API - and that something has to run *on a schedule, without you sitting at your laptop*.

That last point is the whole reason gateways exist, so let's follow it through.

## Scheduled refresh: who presses the button when you're asleep

In Power BI Desktop, refresh is you, clicking Refresh, watching a progress bar. Once a report is published to the Service, nobody wants to be the person who opens Desktop every morning at 6am to keep the dashboard current. **Scheduled refresh** is the Service doing that click for you, automatically, on a timer.

You configure it on the dataset's settings page in the Service: pick times of day (up to 8 refreshes/day on Pro, up to 48/day on Premium capacities), and Power BI runs the same replay Desktop would have run - reconnect to every source in Get Data, rerun every Power Query step, rebuild the model.

The part people trip over: **scheduled refresh only works if the Service can reach every source unattended.** A cloud source like a public API or an Azure SQL database with a stored username and password is easy - the Service just calls it directly. A source that only exists *inside your company's network* (an on-premises SQL Server, a network file share, a local Excel file on someone's laptop) is not reachable from Microsoft's cloud at all. That gap is what a gateway closes.

## The gateway: a bridge, not a magic trick

**What it actually is.** The **On-premises Data Gateway** is a small Windows service you install on a machine that sits inside your network *and* can reach the internet - often a spare server, sometimes someone's always-on desktop. It holds an encrypted, outbound-only connection to the Power BI Service. When a scheduled refresh needs data from an on-prem SQL Server, the Service doesn't reach into your network - it asks the gateway, the gateway runs the query locally where it already has access, and sends the result back out.

**Why this exists.** Companies do not open inbound firewall ports for a cloud service to poke into their internal database. That would be a serious security hole for the entire company just so one report can refresh. The gateway flips the direction: all traffic is outbound from your network to Microsoft, initiated by a service you control, using credentials you registered with it - never an inbound connection initiated by the cloud.

**Two modes worth knowing apart:**

| | **Personal mode gateway** | **Standard (enterprise) mode gateway** |
|---|---|---|
| Who uses it | One person, one machine | Whole team/org, shared |
| Sources | Only that person's own reports | Any registered dataset that needs it |
| High availability | No - if that laptop is off, refresh fails | Yes - install on 2+ machines as a cluster |
| Typical use | "I have one Excel file on my desktop I refresh from" | "Our SQL Server needs to feed a dozen production reports" |

If you're the only person who'll ever touch this, personal mode is genuinely fine and takes ten minutes to set up. The moment a report matters to other people, move to standard mode on a machine that isn't going to get closed at 5pm.

**A refresh failure you'll actually hit:** "Failed to update data source credentials" or a timeout with no useful detail almost always traces back to one of three things - the gateway machine was off, the stored source credentials expired (a password rotated, an OAuth token lapsed), or a Power Query step references a local file path that only exists on your laptop, not the gateway machine. Check those three before you assume DAX or the model is at fault; refresh failures are usually plumbing, not logic.

## Why some sources skip the replay entirely: DirectQuery and dataflows

Two things bend the "full replay every time" rule, and it's worth knowing they exist even at from-zero level:

- **DirectQuery mode** (an alternative to the Import mode you've used all guide) doesn't store a copy of the data at all - every visual sends a live query straight to the source when someone opens the report. No refresh needed, no VertiPaq cache, but every click is only as fast as the source database, and DAX has real restrictions in this mode. It's a deliberate trade of speed for freshness, not a free upgrade.
- **Dataflows** let you run the Power Query transformation step *once*, centrally, in the Service, and have multiple datasets reuse that cleaned output instead of each one re-pulling and re-cleaning the same source table. Worth knowing the name exists; treat it as a "when a team outgrows copy-pasting Power Query steps between reports" tool, not a phase-11 requirement.

## Incremental refresh: stop re-pulling history that never changes

Full replay is wasteful for a very common shape of data: a fact table of dated transactions where last year's rows never change, only this month's do. **Incremental refresh** tells Power BI to partition the table by date and only reprocess the recent partitions - say, refresh the last 5 days in full, and leave the previous 3 years alone, untouched, every single run.

You set this up with two parameters, `RangeStart` and `RangeEnd`, applied as a filter on your date column in Power Query, then a policy in the dataset settings ("refresh rows from the last N days, keep M years of history"). The payoff is real: a refresh that took 40 minutes because it re-pulled 3 years of transactions can drop to 2 minutes once it's only re-pulling this week. Incremental refresh - including the scheduled, unattended runs in the Service - works on a plain Pro license; you do not need Premium for the basic partition-and-refresh-recent behavior. What Premium adds on top is the real-time DirectQuery "hybrid" partition and advanced partition management through the XMLA endpoint. Either way, treat it as the tool you reach for once a fact table gets large and slow, not day-one setup.

## Capacity: what Pro buys you vs. what Premium buys you

This is the part where "just publish it" quietly runs into a wall, so it's worth naming the limits plainly rather than letting you discover them the hard way:

| | **Pro (per user)** | **Premium (per capacity / per user)** |
|---|---|---|
| Dataset size | 1 GB per dataset | 100 GB+ per dataset |
| Scheduled refreshes | Up to 8/day | Up to 48/day |
| Sharing | Only with other Pro-licensed users | Anyone in the org, even without a license (capacity-based) |
| Incremental refresh | Yes - configure and run on a schedule | Yes - plus real-time DirectQuery partition |
| Dedicated hardware | No - shared infrastructure | Yes - your own reserved compute |

The practical read: Pro is where every report in this guide has lived, and it's genuinely enough for small teams and datasets under a gigabyte. You hit Premium's door when one of three things happens - your dataset crosses ~1GB (common with a few years of daily transactional detail), you need to share with people who don't have individual Pro licenses, or refresh performance becomes the bottleneck and even incremental refresh can't keep a run inside Pro's tighter refresh window and shared compute. None of that is a decision to make in phase 11 - it's a decision to make when your monitoring (which you set up in phase 10 with RLS and workspace roles) tells you refreshes are creeping past your window or a dataset is inching toward the 1GB ceiling.

## Recap

1. **Refresh is a full replay** of every Power Query step against the live source, not an incremental sync - that's why a broken step fails the whole thing and why huge tables refresh slowly by default.
2. **Scheduled refresh** is the Service running that replay on a timer so nobody has to click Refresh by hand; it needs an unattended, live path to every source.
3. **The gateway** bridges that gap for on-premises sources - an outbound-only, encrypted connection from a machine inside your network, in personal mode (one person) or standard mode (shared, can be clustered for high availability).
4. **Incremental refresh** partitions a fact table by date so only recent rows reprocess, turning a 40-minute refresh into minutes - it runs on Pro too, scheduled and unattended; Premium only adds the real-time DirectQuery partition and advanced XMLA partition control.
5. **Pro tops out around 1GB datasets and 8 refreshes/day**; Premium buys bigger datasets, more refreshes, dedicated capacity, and license-free sharing - reach for it when the numbers actually demand it, not before.

## Check yourself

Test yourself on the ideas that trip people up most - what refresh actually does, and which direction the gateway connection runs:

```quiz
[
  {
    "q": "A scheduled refresh runs on a dataset. What does Power BI actually do?",
    "choices": [
      "It scans the source for new or changed rows and appends only those",
      "It reruns every Power Query step from scratch against the live source and rebuilds the whole model",
      "It re-downloads the last published .pbix file",
      "It refreshes only the visuals that changed since the last refresh"
    ],
    "answer": 1,
    "explain": "Refresh is a full replay, not a sync - that's why one broken Power Query step fails the whole refresh instead of just skipping the bad part."
  },
  {
    "q": "Why doesn't the Power BI Service just connect directly into your company's network to query an on-premises SQL Server?",
    "choices": [
      "It does - the gateway just speeds that direct connection up",
      "Because that would require an inbound firewall port into your network, which companies don't open for a cloud service; the gateway instead makes an outbound-only connection and runs the query locally",
      "Because on-premises data can't be queried by any automated process, only by a human",
      "Because the gateway first copies the whole database into the cloud, so no live connection is ever needed"
    ],
    "answer": 1,
    "explain": "The gateway flips the direction: it's an outbound connection initiated from inside your network to Microsoft, so nobody has to open an inbound port for the cloud to reach in."
  },
  {
    "q": "You've set up incremental refresh with RangeStart/RangeEnd on a Pro-licensed dataset and want it to run automatically every night. What happens?",
    "choices": [
      "It runs on the schedule - incremental refresh, including scheduled unattended runs, is supported on Power BI Pro",
      "It fails - scheduled incremental refresh requires Premium or Premium-per-user",
      "Incremental refresh isn't available on Pro at all, even to configure",
      "It runs, but reprocesses all history every time instead of just the recent partitions"
    ],
    "answer": 0,
    "explain": "Incremental refresh is supported on Pro, Premium, PPU, and Embedded, and a Pro dataset can run it on a schedule. What Premium adds is the real-time DirectQuery hybrid partition and advanced XMLA partition management - not the scheduling itself."
  }
]
```

---

[← Phase 10: Publishing & Sharing](10-publishing-and-sharing-workspaces-apps-rls.md) · [Guide overview](_guide.md)
