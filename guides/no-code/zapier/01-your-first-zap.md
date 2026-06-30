---
title: "Your First Zap"
guide: zapier
phase: 1
summary: "Build a working trigger-and-action automation, connect your app accounts, learn the Zap editor, and understand what a Zap can and can't do."
tags: [zapier, zaps, trigger, action, getting-started]
difficulty: beginner
synonyms:
  - "build my first zap"
  - "zapier trigger and action"
  - "connect gmail to slack zapier"
  - "what is a zap in zapier"
  - "zapier editor basics"
updated: 2026-06-30
---

# Your First Zap

A **Zap** is one automation. It has two halves: a **trigger** (the thing that starts it) and one or more **actions** (the things it does in response). Read it as a sentence with a built-in "when" and "then":

> **When** a new email arrives in Gmail with a label, **then** post a message in Slack.

That's a Zap. The trigger is "new labeled email in Gmail." The action is "send a Slack message." Everything else in Zapier is variations on that one shape.

## Pick the two apps first

Before you touch the editor, finish this sentence out loud: "When ___ happens in ___, I want ___ to happen in ___." If you can say it, you can build it. If you can't, you're not ready to build yet - figure out the workflow on paper first.

Let's use a concrete one founders actually need:

> When a new response comes in from my Typeform, add a row to a Google Sheet.

Trigger app: Typeform. Action app: Google Sheets. Hold those two names in your head.

## Connect your accounts

Zapier can't watch your Typeform or write to your Sheet unless you give it permission. The first time you use an app, Zapier sends you through that app's normal login screen (a flow called OAuth - you log in to Typeform, it asks "let Zapier access this?", you click Allow). You're not handing Zapier your password; you're granting it a revocable key, which you can take back later from the app's own settings.

You connect each account once. After that it shows up in a dropdown for every future Zap. Connect both apps now - the trigger app and the action app - so you're not interrupted mid-build.

## The Zap editor, step by step

Create a new Zap and you land in the editor: a vertical stack of steps, top to bottom, that runs in that order. The top step is always the trigger.

1. **Choose the trigger app and event.** Pick Typeform, then the event "New Entry." Apps usually offer several trigger events - "new entry," "new contact," "updated record" - so read them and pick the one that matches your "when."
2. **Choose the account.** The Typeform account you connected appears in a dropdown.
3. **Set up the trigger.** Typeform asks *which* form to watch. Choose it.
4. **Test the trigger.** This is the step people skip and regret. Zapier reaches into Typeform and pulls a real recent response so you can see the actual data - the question answers, the submission time, the respondent's email. If nothing comes back, submit a test entry to your form and try again. You need real sample data here, because the next step depends on it.

Now the action:

5. **Choose the action app and event.** Pick Google Sheets, event "Create Spreadsheet Row."
6. **Choose the account**, then the specific spreadsheet and worksheet.
7. **Map the fields.** This is the heart of it. Google Sheets shows you its columns; next to each, you insert a value pulled from the trigger. Click the Name column, and choose the "Name" answer from the Typeform step. Click Email, choose the email answer. You are wiring the trigger's output into the action's input. Those inserted values look like little tagged tokens - they're placeholders that get filled with real data each time the Zap runs.
8. **Test the action.** Zapier writes one real row to your sheet using the sample data. Go look at the sheet. A row is there. That's the whole loop working end to end.

## Turn it on

Until you flip the switch to **On** (sometimes labeled "Publish"), nothing happens automatically - you've only been testing. Once it's on, Zapier watches Typeform on its own, and every new response lands in your sheet without you lifting a finger.

```text
TRIGGER  →  New Typeform entry
ACTION   →  Create a Google Sheets row
            (Name column  ← Typeform "Name")
            (Email column ← Typeform "Email")
STATUS   →  On
```

## What a Zap is - and isn't

A Zap is **event-driven and one-directional.** Something happens, then steps run, top to bottom, once. That mental model saves you from three common wrong expectations:

- **It's not a two-way sync.** A Zap pushes Typeform → Sheets. It does not also notice when you edit the sheet and update Typeform. If you want both directions, that's two separate Zaps, and you have to watch out for them triggering each other in a loop.
- **It doesn't run on a continuous loop over old data.** A Zap reacts to *new* events from the moment you turn it on. It won't go back and process the 400 responses you already had. (For bulk history you'd export and import by hand, or use a separate one-time transfer.)
- **It's not instant for every app.** Some triggers fire the moment something happens; others are checked on a schedule. We'll cover that timing - and why it matters - in Phase 3.

One Zap, one trigger, a chain of actions. Get this single trigger-and-action pattern working and feel it run on its own, because every workflow in the next phase is this exact idea with more steps, smarter branches, and a cleanup stage in the middle.
