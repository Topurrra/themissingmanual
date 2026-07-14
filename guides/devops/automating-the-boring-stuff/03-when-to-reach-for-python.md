---
title: "When to Reach for Python"
guide: "automating-the-boring-stuff"
phase: 3
summary: "The clear signs that bash is the wrong tool - data structures, parsing, cross-platform - and how to schedule automation with cron, made safe by idempotency, dry-run, and logging."
tags: [python, bash, cron, scheduling, idempotency, dry-run, logging, automation]
difficulty: intermediate
synonyms: ["bash vs python for scripting", "when to use python instead of bash", "how to schedule a script with cron", "what is an idempotent script", "dry run flag", "logging in scripts", "cron job not running"]
updated: 2026-07-10
---

# When to Reach for Python

Bash is wonderful glue - it's on every Unix machine and pipes commands together effortlessly. But there's a point where a script stops feeling clever and starts feeling like wrestling. Recognizing that point, and switching tools instead of pushing through, is part of the craft. Then: *scheduling* automation to run without you, and making it safe to leave alone.

## The signs bash is the wrong tool

You don't abandon bash because someone said Python is better. You switch when bash is actively fighting you. The usual three signals:

**You need real data structures.** Bash has strings and clumsy arrays, and that's about it. Track a list of records with several fields, build a lookup table, or nest data, and bash turns into string-splitting hacks that break the first time a value has a space or comma. Python just has lists and dictionaries that hold your data.

**You're parsing structured text - JSON, CSV, XML, an API response.** This is the big one. People do parse JSON in bash (usually shelling out to `jq`), but once the logic gets real - "for each user, if their plan is expired, call this endpoint" - you're hand-rolling a parser out of `grep`, `cut`, and `sed`, and it's fragile. Python reads JSON in one line and gives you real objects:

```python
import json
with open("users.json") as f:
    users = json.load(f)

for user in users:
    if user["plan"] == "expired":
        print(f"Would notify {user['email']}")
```
*What just happened:* `json.load` turns the file into a real Python list of dictionaries - no parsing by hand - and a plain loop walks it, reading fields by name. The same job in bash would be a tangle of text-slicing that breaks on the first unusual character. When input is structured, reach for a language that understands structure.

**It needs to run on Windows too.** Bash scripts assume a Unix world - `tar`, `rm`, `/`-style paths. If your automation has to run on Windows as well as Linux/macOS, bash is the wrong foundation. Python runs the same code across all three, with cross-platform helpers like `pathlib` for file paths built in.

⚠️ **Gotcha - don't over-correct.** This isn't "Python good, bash bad." For gluing a few commands together, bash is *less* ceremony and more upfront about what it's doing - reaching for Python to run three commands in a row is its own kind of overkill. The rule: **bash to orchestrate commands; Python when there's real logic or real data.** Many good setups are a short bash script that calls Python for the gnarly middle bit.

```text
   the task is mostly...         reach for...

   running commands in order  ──►   bash
   simple checks + loops      ──►   bash
   ─────────────────────────────────────────
   structured data (JSON/CSV) ──►   Python
   nested logic / many fields ──►   Python
   must run on Windows too    ──►   Python
```

## Scheduling: making it run without you

A script you still remember to run by hand has only solved half the problem. The other half is **scheduling** - having the machine run it for you, on time, forever. On Linux and macOS, the classic tool is **cron**.

📝 **Terminology.** **cron** is a background service that runs commands on a schedule. A single scheduled entry is a **cron job**, and the list of them is your **crontab** ("cron table").

You edit your schedule with `crontab -e`, and each line is *five time fields plus the command*:

```text
 ┌───────── minute (0–59)
 │ ┌─────── hour (0–23)
 │ │ ┌───── day of month (1–31)
 │ │ │ ┌─── month (1–12)
 │ │ │ │ ┌─ day of week (0–6, Sun=0)
 │ │ │ │ │
 0 2 * * *   /home/ada/backup.sh /home/ada/projects/myapp
```

That line means: at **minute 0 of hour 2** (2am), **every day** (the `*`s mean "any"), run the backup script. A `*` is "every," so `0 2 * * *` is "once a day at 2am." (If cron's five fields make your eyes cross, you're in good company - most people keep a reference handy.)

⚠️ **Gotcha - cron runs with almost no environment.** This bites everyone exactly once. Cron doesn't load your shell profile, so your usual `PATH` and environment variables may be missing - a script that runs perfectly in your terminal mysteriously does nothing under cron. Defend against it: **use absolute paths** everywhere (`/home/ada/backup.sh`, not `./backup.sh`; `/usr/bin/tar`, not `tar` if unsure), and **capture output to a log** (next section). For scheduling on an actual server - including the systemd timers many modern systems prefer over cron - see [Linux for Servers](/guides/linux-for-servers).

## The three rules for automation you can walk away from

Once a script runs *unattended*, you can't be there to catch it - it has to be safe to run on its own, and safe to run *again*. Three properties make that true; build them in from the start.

### 1. Idempotent - safe to run more than once

📝 **Terminology.** **Idempotent** means running the script twice has the same result as running it once. No duplicates, no damage, no "it only works the first time."

This matters because scheduled scripts *will* re-run - cron fires again, a job gets retried, you run it manually to test. A non-idempotent script that *appends* a line to a config file every run will have added it fifty times by next month. Make operations safe to repeat: use `mkdir -p` (no error if the folder exists), check whether work is already done before redoing it, and prefer "make the end state correct" over "blindly perform an action."

```bash
# NOT idempotent - adds the line every single run:
echo "127.0.0.1 myapp.local" >> /etc/hosts

# Idempotent - only adds it if it's not already there:
if ! grep -q "myapp.local" /etc/hosts; then
  echo "127.0.0.1 myapp.local" >> /etc/hosts
fi
```
*What just happened:* The first version appends unconditionally - run it ten times, get ten copies. The second checks first with `grep -q` ("quietly look for the line") and only adds it if missing. Run *that* ten times and the file is identical to running it once. (The `if !` also sidesteps `set -e`: a "not found" from grep is expected here, not a failure.)

### 2. Dry-run - let it tell you what it *would* do

Before you trust a script to delete files or hit an API on its own, you want to see its plan *without* it doing anything. A **dry-run** mode does exactly that: it prints every action it would take and changes nothing.

```bash
DRY_RUN="${DRY_RUN:-false}"

remove_file() {
  if [ "$DRY_RUN" = "true" ]; then
    echo "[dry-run] would remove: $1"
  else
    rm -f "$1"
  fi
}
```
*What just happened:* The `remove_file` helper checks a `DRY_RUN` flag: run the script normally and it deletes; run it with `DRY_RUN=true ./backup.sh ...` and it just *narrates* what it would delete. This is how you safely test a destructive script against real data - turn on dry-run, read the plan, and only then let it loose. For anything that deletes, moves, or overwrites, dry-run pays for itself the first time it stops you from wiping the wrong directory.

### 3. Logging - so you know what happened while you weren't looking

An unattended script that prints to a screen nobody is watching might as well be silent. **Logging** means recording what it did, when, and whether it worked, so there's a trail when you check in or something breaks. At its simplest, redirect output to a file in your cron line:

```text
0 2 * * *  /home/ada/backup.sh /home/ada/projects/myapp >> /home/ada/logs/backup.log 2>&1
```
*What just happened:* `>> .../backup.log` *appends* the script's output to a log file (so each run adds rather than wipes it), and `2>&1` sends error messages to the same place. Now every nightly run leaves a dated record. A tiny timestamp helper inside the script makes the log readable:

```bash
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "Starting backup of $SOURCE_DIR"
```
*What just happened:* `log` prefixes whatever you pass it with a timestamp, so the file reads like `[2026-06-19 02:00:01] Starting backup of ...`. When a teammate asks "did the backup run last night?", you have an answer instead of a shrug. Combined with exit codes, this is how cron-driven automation stays trustworthy: it tells you when it worked, and it's loud when it didn't.

💡 **Key point.** Unattended automation lives or dies on three properties: **idempotent** (safe to re-run), **dry-runnable** (shows its plan before acting), and **logged** (leaves a trail). A fast script without these is a fast way to cause an incident at 2am while you sleep.

## Recap

1. Switch from bash to **Python** when you need real **data structures**, you're **parsing structured text** (JSON/CSV/XML/APIs), or it must run **cross-platform** - but keep bash for gluing commands together.
2. **cron** schedules scripts to run on their own; remember its five time fields and that it runs with **almost no environment** - use absolute paths and log the output.
3. Make unattended scripts **idempotent** (safe to run twice), give them a **dry-run** mode (narrate, don't act), and add **logging** (a timestamped trail).
4. These safety properties matter *more* the less you're watching - which is the whole point of scheduling.

That's the arc: notice the repeated task (Phase 1), turn it into a safe bash script (Phase 2), and know when to upgrade to Python and how to schedule it safely (here). You now have what you need to start deleting boring tasks from your week - carefully.

---

[← Phase 2: Shell Scripting Essentials](02-shell-scripting-essentials.md) · [Guide overview](_guide.md)
