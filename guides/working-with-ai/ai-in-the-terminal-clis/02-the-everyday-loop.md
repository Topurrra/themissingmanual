---
title: "The Everyday Loop"
guide: ai-in-the-terminal-clis
phase: 2
summary: "How a normal session actually flows: describe the goal, let it work, read the diff, approve or correct — and how permission modes keep you in control."
tags: [cli, coding-agents, workflow, permissions, ai]
difficulty: intermediate
synonyms:
  - "how a coding agent session works"
  - "reviewing ai code changes diff"
  - "agent permission modes auto approve"
  - "staying in control of ai agent"
updated: 2026-06-30
---

# The Everyday Loop

Once you've got a terminal agent running, almost everything you do follows the same four-beat rhythm. Learn the rhythm and the specific tool barely matters.

1. **Describe the goal.** Tell it what you want, in plain language.
2. **Let it work.** It reads files, runs commands, and proposes changes.
3. **Review the diff.** You look at exactly what it changed.
4. **Approve or correct.** You keep it, tweak it, or tell it what's wrong and let it try again.

Then you loop. Most real tasks take two or three trips around this circle, not one perfect shot. That's normal and it's fine — the loop is the feature, not a sign it's failing.

## Beat one: describe the goal

The single biggest lever you have is how you describe the task. Vague in, vague out.

"Make the login better" gives the agent nothing to aim at. Compare:

```text
The login form lets you submit with an empty password field and
then shows a confusing server error. Make it block empty passwords
on the client side and show "Password is required" under the field.
```

That second version tells it the symptom, the desired behavior, and even the wording. You don't have to be this thorough every time, but when a result comes back wrong, the fix is usually upstream — you under-specified.

A good habit: state the goal, name any constraints ("don't touch the database schema," "keep the existing tests passing"), and mention where to look if you know ("it's in the auth folder"). You're not writing a spec. You're pointing.

## Beat two: let it work

Now you watch. The agent narrates what it's doing — opening files, running a search, running your tests. This part is genuinely useful to read, not noise to skip. It's where you catch a wrong turn early.

If you see it heading somewhere you didn't intend — editing the wrong file, about to install something you don't want — you can stop it and redirect. You don't have to wait for it to finish to course-correct.

## Beat three: review the diff

This is the beat you must not skip.

When the agent edits code, it shows you a **diff** — a before-and-after view of every line it changed. Removed lines are usually marked in red, added lines in green. Reading the diff is the moment you actually exercise judgment.

```text
  function login(user, pass) {
-   submit(user, pass);
+   if (!pass) {
+     showError("Password is required");
+     return;
+   }
+   submit(user, pass);
  }
```

You don't need to understand every character. You're checking three things: Did it do what you asked? Did it change anything you didn't ask it to? Does anything look wrong or risky? If the diff is huge and sprawling for a small request, that itself is a warning sign — ask why before you accept.

Treat every diff like a pull request from that eager junior colleague. The agent is confident even when it's wrong, so confidence in the explanation is not evidence the code is right. The diff is the evidence.

## Beat four: approve or correct

If it's good, approve it. If it's close, you can edit it yourself or describe the adjustment ("good, but also trim whitespace before checking"). If it's wrong, say what's wrong — specifically — and let it try again with that feedback. Specific correction ("you broke the case where the password is just spaces") works far better than "that's not right."

## Permission modes: how much rope

Here's the part that determines how safe and how fast the whole thing feels. Every serious terminal agent asks permission before it does something consequential — but you control how often it asks. The exact names differ per tool, but they land on roughly the same ladder:

| Mode | What it does | When to use it |
|------|-------------|----------------|
| Ask every time | Pauses for your approval before each file edit or command | New project, unfamiliar agent, anything important |
| Auto-approve reads | Lets it read files freely, asks before editing or running | The comfortable default for most work |
| Auto-approve edits | Edits files without asking, still asks before risky commands | A trusted, well-scoped task you're watching |
| Full auto / "yolo" | Does almost everything without asking | Throwaway code, sandboxes — not your real project |

The trade-off is plain: more autonomy is faster but gives you fewer chances to catch a mistake before it happens. The reads that the agent does are harmless; it's the writes and the commands that need a gate.

A sane starting policy: let it read freely, make it ask before it edits or runs anything, and only loosen that once you've watched a particular agent enough to trust its judgment on a particular kind of task. The danger isn't the agent reading your code — it's a command that deletes files, force-pushes, or installs something, run without you looking. Keep those gated.

One more guardrail worth the small effort: use version control. If your project is in git, you have an undo button for everything the agent does. Commit before you start a task, let the agent work, and if it makes a mess you roll back to the commit and lose nothing. That safety net is what lets you give the agent more rope without anxiety — the worst case is a `git reset`, not a ruined afternoon.

That's the loop. Describe, watch, review, decide — with permission modes setting how often you're pulled in and version control catching anything that slips through. Next we'll compare the actual tools you'd run this loop in.
