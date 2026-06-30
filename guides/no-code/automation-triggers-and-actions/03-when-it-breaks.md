---
title: "When Automations Break"
guide: automation-triggers-and-actions
phase: 3
summary: "The failure modes nobody warns you about - errors, retries, rate limits, duplicate runs, silent failures - and how to monitor a flow you actually rely on."
tags: [automation, errors, retries, rate-limits, idempotency]
difficulty: beginner
synonyms:
  - my zapier stopped working
  - automation ran twice duplicate
  - what is a rate limit
  - how to monitor an automation
  - automation failed silently
updated: 2026-06-30
---

# When Automations Break

An automation that works on the day you build it is a demo. An automation you can depend on for a year is a different thing. The gap between them is everything in this phase: the ways flows fail, why they sometimes do the wrong thing instead of nothing, and how to set up so you find out fast. The cruel part is that automation breaks quietly. A human who can't do their job complains. A broken flow stops silently, and you discover it three weeks later when your bookkeeper asks where half the orders went.

## Errors: a step couldn't do its job

The most common failure is a single step erroring out. The CRM was down for a minute. A required field came through empty. An app changed its login and your connection expired. When a step errors, the run usually stops at that step - the actions above it already happened, the ones below never will.

That half-finished state is the thing to watch for. If step 2 logged the order and step 3 (charge, email, whatever) errored, you now have a logged order with no follow-up. Errors don't roll back the steps that already succeeded.

Most tools keep a **run history** (Zapier's *Task History*, Make's *History*, Power Automate's *Run history*) showing every execution, which step it reached, and the exact error. When something's wrong, that log is the first place to look - it tells you which step, which run, and usually why.

## Retries: the tool tries again

For transient hiccups - a service briefly unreachable - automation tools often **retry** automatically. They wait a bit and run the failed step again, sometimes several times with growing gaps between attempts (called *backoff*). Retries are helpful: a one-second outage fixes itself and you never notice.

Retries are also the source of the next problem.

## Duplicate runs and idempotency

Sometimes a flow runs twice for one event. A retry fires the step again after it actually *did* succeed (the tool didn't get the confirmation). A polling trigger double-counts a row. A webhook gets delivered twice - networks do that. The result: two thank-you emails, two charges, two spreadsheet rows for one order.

The defense is a fifty-cent word worth knowing: **idempotency**. An idempotent action is one that's safe to run more than once - running it twice leaves the same result as running it once. "Set the status to paid" is idempotent (setting it to paid twice changes nothing). "Add $5 to the balance" is *not* (run it twice and you've added $10).

You can't always make an action idempotent, but you can guard it:

```text
Before charging the card:
  Lookup: is there already a charge for this order ID?
  Filter: only continue if no charge exists
  Then:   charge
```

That dedupe check - "have I already done this for this exact record?" - is the single most valuable habit for any flow that sends money, emails, or messages. When in doubt, look before you leap.

## Rate limits: too much, too fast

Every app caps how often you can call it - say, 100 requests per minute. Cross the line and it starts rejecting your calls with a **rate limit** error (often shown as HTTP 429). This bites hardest when a flow runs in a burst: you import 5,000 contacts, the flow fires 5,000 times, and the destination app slams the door after the first few hundred.

Signs you've hit one: a flood of failures that all start at the same moment, error messages mentioning "rate limit," "too many requests," or "429." The fixes are about slowing down - process in smaller batches, add a short delay step between calls, or spread a bulk job over time instead of all at once. Some tools throttle for you; many leave it to you to be polite.

## Silent failures: the dangerous kind

The errors above at least announce themselves. The truly dangerous failures make no noise:

- A **filter** quietly stops the flow because a condition you didn't expect failed - that's a non-error stop, so it won't show as a failure even though nothing happened.
- A trigger silently stops firing because the connection expired or the source app changed, so the flow doesn't run *at all* - and a flow that never runs generates no error log.
- A field maps to empty, so you send "Hi ," and an action technically "succeeds" while doing something useless.

None of these page you. You have to go looking. The most reliable trap for a flow that stops firing is a **dead-man's switch**: a separate scheduled check that expects to see activity and alerts you when it *doesn't*. "If no orders were logged in the last 24 hours, message me." Absence is the alarm.

## How to monitor a flow you depend on

Treat anything load-bearing like the small piece of infrastructure it is.

```text
1. Turn on failure notifications.
   Every tool can email/Slack you when a run errors. Enable it. This is the floor.

2. Add an error-handling path for critical steps.
   Make has error handlers; Zapier/Power Automate let you branch on failure.
   At minimum: on error, post to a channel you actually read.

3. Build a heartbeat for silent stops.
   A scheduled "did this run today?" check that alerts on absence,
   not just on errors. Catches the trigger that quietly died.

4. Read the run history weekly for important flows.
   Two minutes of skimming catches the slow-burn problems
   before they become a month of missing data.

5. Guard money and messages with a dedupe lookup.
   Cheap insurance against the double-run that emails a
   customer twice or charges them twice.
```

The mindset shift is this: a flow you rely on is not "set and forget," it's "set and watch." The watching is light - a few notifications and one weekly skim - but it's the difference between catching a broken automation in an hour and explaining to a customer why they got charged twice. Build the flow, then build the thing that tells you when the flow stopped working.
