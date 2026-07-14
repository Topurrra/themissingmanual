---
title: "Automating the Boring Stuff (Ops Scripting)"
guide: "automating-the-boring-stuff"
phase: 0
summary: "Turn the manual tasks you keep redoing by hand into scripts that are faster, repeatable, and self-documenting - from the when-to-automate mindset to a real bash backup script to knowing when to reach for Python and cron."
tags: [automation, bash, shell-scripting, python, cron, ops, devops]
category: devops
order: 6
difficulty: intermediate
synonyms: ["how to automate repetitive tasks", "when should i write a script", "bash scripting for ops", "set -euo pipefail explained", "bash vs python for scripts", "how to schedule a script with cron", "idempotent scripts"]
updated: 2026-06-19
---

# Automating the Boring Stuff (Ops Scripting)

You know the task. The one you do by hand every few days: copy these files, restart that service, run these four commands in this exact order, check the output, hope you didn't fat-finger step three. It works - until the day you're tired, or in a hurry, or someone else has to do it without you. Then it doesn't.

This guide is about turning those repeated manual chores into scripts. Not because scripting is fashionable, but because a script is faster, doesn't forget a step, and - the part nobody tells you - is *documentation that actually runs*. By the end you'll have a clear sense of when to automate (and when not to bother), a real bash script you can adapt, and a straight answer to "should this be Python instead?"

This is an intermediate guide. It assumes you're comfortable in a terminal - running commands, moving around directories, editing files. If that's still shaky, start with [The Terminal and Shell](/guides/the-terminal-and-shell) and come back.

## How to read this

- **Not sure whether something is even worth automating?** Read [Phase 1: If You've Done It Twice, Script It](01-if-youve-done-it-twice.md) - it's the decision, not the code.
- **Ready to write a real script?** Go straight to [Phase 2: Shell Scripting Essentials](02-shell-scripting-essentials.md) for an annotated, working example.
- **Want it to finally make sense?** Read in order - each phase builds on the last.

## The phases

1. **[If You've Done It Twice, Script It](01-if-youve-done-it-twice.md)** - the mindset. Why manual steps are slow, error-prone, and unrepeatable, why a script is documentation that runs, and the clear-eyed test for when automating is worth it (and when it isn't).
2. **[Shell Scripting Essentials](02-shell-scripting-essentials.md)** - a real bash script, built up piece by piece: variables, arguments, conditionals, loops, exit codes, and the one line (`set -euo pipefail`) that turns a silent disaster into a loud, safe failure.
3. **[When to Reach for Python](03-when-to-reach-for-python.md)** - the point where bash starts hurting (data structures, parsing, anything cross-platform), how to tell, and how to *schedule* your automation with cron so it runs without you - safely, because it's idempotent, logged, and dry-runnable.

> Deliberately deferred to follow-up guides: full configuration management (Ansible, etc.), CI/CD pipelines, and infrastructure-as-code. This guide is about *your* repeated tasks - the scripts you write to save your own afternoons. Once those are second nature, the bigger tools make a lot more sense.

Related reading: [The Terminal and Shell](/guides/the-terminal-and-shell) for the shell fundamentals these scripts run on, and [Linux for Servers](/guides/linux-for-servers) for running and scheduling automation on a real machine.
