---
title: "Adding and Writing Your Own"
guide: ai-skills-and-plugins
phase: 3
summary: "How to install a skill or plugin someone else built, then author a small skill of your own - its description, its instructions, and what makes it trigger."
tags: [skills, authoring, installing-plugins, ai-assistant, how-to]
difficulty: intermediate
synonyms:
  - "how to install an ai skill"
  - "write your own claude skill"
  - "add a plugin to ai assistant"
  - "skill description and trigger"
  - "author an agent skill"
updated: 2026-06-30
---

# Adding and Writing Your Own

Enough theory. Let's add both kinds to a real assistant, then build a skill from scratch - a small one, but yours.

The exact buttons and folders differ by product, so treat the specifics here as the shape of the thing rather than a literal click-path. The concepts carry across; the menus don't.

## Installing something someone else built

Most assistants give you a place to manage extensions - a settings panel, a marketplace, or a config file, depending on how technical the product is.

For a **plugin**, installation usually runs like this:

1. Find it in the assistant's directory or the vendor's site.
2. Install or enable it.
3. Authorize its access - this is where it asks to connect to your Slack, your Drive, your database. Read the request. Grant the narrowest scope that does the job.
4. Test it on something low-stakes before you trust it with anything that matters.

For a **skill**, installation is lighter because there's no live system to connect. You typically drop the skill's folder into a designated location, or import it through the assistant's interface, and it shows up as available. Some assistants ship a settings file where you list the skills and plugins you want active. It tends to look something like this:

```json
{
  "skills": [
    "brand-voice",
    "meeting-notes"
  ],
  "plugins": [
    "github-connector"
  ]
}
```

Once it's in, you generally don't summon a skill by name. The assistant notices when a task matches and reaches for it on its own - which is exactly why the next part matters so much.

## Writing a skill: the three pieces that matter

A skill comes down to three decisions. Get these right and the rest is detail.

### 1. The description - your triggering sentence

The description is one or two lines the assistant always sees, and it's the single most important thing you'll write. It's what the assistant uses to decide *whether this skill applies right now*. Think of it as a label on a drawer: it has to be specific enough that the assistant opens the drawer at the right moment and leaves it shut otherwise.

Vague descriptions are the number-one reason a skill never fires. "Helps with writing" is useless - almost everything is writing. Name the actual job and the cues that signal it:

```text
Weak:   "Helps with documents."
Strong: "Format quarterly board reports: applies our section
         order, tone, and the standard financial summary table.
         Use whenever the user mentions a board report or
         quarterly update."
```

Notice the strong one names the task *and* tells the assistant when to use it. That second part - the trigger condition - is what turns a description into a switch.

### 2. The instructions - the actual know-how

This is the body, and you write it the way you'd brief a capable new hire who's never seen your way of doing things. Concrete beats abstract every time. Don't say "write professionally" - say what professional means to you, with examples of right and wrong.

A workable instruction body has steps, rules, and at least one example:

```text
# Quarterly Board Report

## Steps
1. Open with a 3-sentence executive summary.
2. Then sections, in this order: Financials, Product,
   Hiring, Risks.
3. End with a "Decisions Needed" list, each item one line.

## Rules
- Numbers in tables, not prose.
- No hedging language ("we hope", "should be fine").
- Flag anything you had to assume in a note at the top.

## Example
[paste a real past report here, lightly redacted]
```

That example at the bottom does more work than any rule above it. Showing the assistant one good output teaches it faster than a page of description. If you have a template file, include it in the folder and tell the instructions to match it.

### 3. What it triggers on

Triggering is mostly handled by the description, but you can sharpen it. List the words and situations that should fire the skill, and - equally useful - the ones that shouldn't. If your "board report" skill keeps activating for casual status updates, add a line: "This is for formal quarterly board reports only, not weekly team updates."

You're steering attention. A skill that fires too eagerly is as annoying as one that never fires; a couple of lines about scope fixes both.

## Test it like you mean it

Don't assume it works. Give the assistant a request that *should* trigger the skill and check that it does - and that the output actually follows your instructions. Then give it a near-miss that *shouldn't* trigger it and confirm it stays quiet. Those two checks catch the two failure modes (never fires / always fires) that account for most broken skills.

When something's off, the fix is almost always in the description (for triggering) or in adding a concrete example (for output quality). Tweak, re-run, repeat. A skill is never finished the first time, and that's fine - you're encoding judgment, and judgment gets sharper with a few rounds of use.

Start with one. Pick the task you re-explain most often, write the three pieces, and let the assistant carry that know-how for you from now on. That's the whole point: you teach it once, and it remembers.
