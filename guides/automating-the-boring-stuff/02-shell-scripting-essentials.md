---
title: "Shell Scripting Essentials"
guide: "automating-the-boring-stuff"
phase: 2
summary: "Build a real bash script piece by piece — variables, arguments, conditionals, loops, exit codes — and learn the one line, set -euo pipefail, that turns a silent disaster into a loud, safe failure."
tags: [bash, shell-scripting, variables, arguments, exit-codes, set-euo-pipefail, loops]
difficulty: intermediate
synonyms: ["how to write a bash script", "set -euo pipefail meaning", "bash variables and arguments", "bash exit codes", "bash if statement", "bash for loop", "shebang line"]
updated: 2026-06-19
---

# Shell Scripting Essentials

A bash script is nothing exotic: it's the exact same commands you'd type at the prompt, saved in a file so you can run them all at once, the same way, every time. If you can use the terminal, you can already read most of a script. This phase fills in the handful of pieces that turn a list of commands into something robust enough to trust — and shows you the one line that separates "a script" from "a safe script."

We'll build one real example end to end: a script that backs up a directory and keeps only the most recent few backups (rotation), so it doesn't slowly fill the disk. Don't just read it — type it into a file and run it. The pieces make sense fastest when you watch them work.

## The shebang and your first run

Create a file called `backup.sh`:

```bash
#!/usr/bin/env bash
echo "Hello from a script"
```

That first line is the **shebang** (`#!`). It tells the system which program should run this file. `/usr/bin/env bash` means "find bash on this machine and use it" — more portable than hardcoding a path. Now make it runnable and run it:

```console
$ chmod +x backup.sh
$ ./backup.sh
Hello from a script
```
*What just happened:* `chmod +x` ("change mode, add execute") flipped the file's permission so the system is allowed to run it as a program. Then `./backup.sh` ran it — the `./` means "the file right here in this folder." Bash read the file top to bottom and executed each line as if you'd typed it. That's the whole trick: **a script is just typed-ahead terminal commands.**

📝 **Terminology.** A `#` starts a **comment** — bash ignores the rest of the line. (The shebang is special only because it's the very first line and starts with `#!`.) Use comments to explain *why*, not *what*; the commands already say what.

## The safety line: `set -euo pipefail`

Here is the most important line in this entire guide. Put it right after the shebang in almost every script you write:

```bash
#!/usr/bin/env bash
set -euo pipefail
```

By default, bash is alarmingly forgiving. If a command fails partway through your script, bash shrugs and runs the *next* line anyway. If you use a variable you never set, bash treats it as an empty string and carries on. For a backup script, "carry on after a failure" is exactly how you end up deleting good backups because the step that made the new one silently failed. `set -euo pipefail` makes bash strict instead. Three flags, plus one:

- **`-e`** — **exit on error.** If any command fails (returns a non-zero exit code), the script stops immediately instead of blundering onward.
- **`-u`** — **error on unset variables.** Using a variable you forgot to set is now a loud error, not a silent empty string. This catches typos like `$BACKUP_DIRR` before they erase the wrong thing.
- **`-o pipefail`** — in a pipeline like `a | b`, if `a` fails, the whole pipeline is considered failed. Without this, only the *last* command's success counts, so failures hide in the middle of a pipe.

⚠️ **Gotcha.** Without `set -e`, a script that fails on line 3 happily runs lines 4 through 40 against a broken state. That is how "the backup script" becomes "the script that quietly stopped backing up six weeks ago and nobody noticed." Adding this one line is the cheapest reliability you will ever buy. Add it first, before you write anything else.

(Strict mode has sharp edges — sometimes you *expect* a command to fail and want to handle it yourself. The pattern for that is `if ! some_command; then ...`, which we use below. It doesn't trip `-e` because the failure is part of an `if` test.)

## Variables — name the things that might change

Hardcoding paths all over a script means changing them in ten places later. Pull them into **variables** at the top, where they're easy to find and edit:

```bash
SOURCE_DIR="$HOME/projects/myapp"
BACKUP_ROOT="$HOME/backups"
KEEP=5
```
*What just happened:* `NAME="value"` defines a variable. **No spaces around the `=`** — `NAME = "value"` is an error in bash, which trips up everyone at least once. You read a variable back with a `$` in front: `$SOURCE_DIR`. `$HOME` is one bash gives you for free: your home directory.

⚠️ **Gotcha — always quote your variables.** Write `"$SOURCE_DIR"`, not `$SOURCE_DIR`. If a path contains a space (and one day it will — `My Documents`), an unquoted variable splits into two arguments and your command does something wild. Quoting keeps it as one value. This single habit prevents a whole category of "it worked on my machine" bugs.

## Arguments — let the caller pass values in

You don't want to edit the script every time you back up a different folder. Let the caller pass the source directory as an **argument**:

```console
$ ./backup.sh /home/ada/projects/myapp
```

Inside the script, arguments arrive as `$1`, `$2`, and so on (`$1` is the first). It's good manners to check the caller actually provided one:

```bash
if [ -z "${1:-}" ]; then
  echo "Usage: $0 <source-directory>" >&2
  exit 1
fi
SOURCE_DIR="$1"
```
*What just happened:* `[ -z "${1:-}" ]` tests whether the first argument is empty (`-z` = "zero length"). The `${1:-}` is a small dance for `set -u`: it means "`$1`, or empty if it's unset," so checking a missing argument doesn't itself trip the unset-variable error. If it's empty, we print a usage message to **standard error** (`>&2`, the proper channel for messages meant for humans, not data) and `exit 1`.

## Exit codes — how a script says "it worked" or "it didn't"

`exit 1` above is doing something important. Every command — and every script — ends with an **exit code**: `0` means success, anything else means a specific kind of failure. This is how scripts talk to each other, to `set -e`, and to schedulers like cron. You can see the last command's exit code in the special variable `$?`:

```console
$ ls /tmp >/dev/null; echo $?
0
$ ls /does-not-exist >/dev/null 2>&1; echo $?
2
```
*What just happened:* `ls` on a real directory succeeded, so `$?` is `0`. `ls` on a missing one failed, so `$?` is non-zero (`2`, ls's code for "serious trouble"). `>/dev/null` throws away the normal output and `2>&1` throws away the error text — we only wanted to see the *code* here. The rule to internalize: **end your script with `exit 0` on success, and `exit 1` (or another non-zero) on failure**, so whatever runs your script knows what happened. Cron, in particular, decides whether to alert you based on this number.

## Conditionals — check before you act

We've already used `if`. The full shape is worth seeing once:

```bash
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Source directory does not exist: $SOURCE_DIR" >&2
  exit 1
fi

mkdir -p "$BACKUP_ROOT"
```
*What just happened:* `[ ! -d "$SOURCE_DIR" ]` reads as "if NOT (`!`) a directory (`-d`) exists at this path." If the source is missing, we fail loudly and early rather than backing up nothing. `mkdir -p` creates the backup folder — and the `-p` ("parents") means it won't complain if the folder already exists, which makes the script safe to run repeatedly. (That property has a name — *idempotency* — and it's a big enough deal that Phase 3 is partly about it.)

## Putting it together: backup + rotate

Now the whole script. Read it top to bottom — every piece is something we just covered:

```bash
#!/usr/bin/env bash
set -euo pipefail

# --- configuration (the things you might change) ---
BACKUP_ROOT="$HOME/backups"
KEEP=5                      # how many recent backups to keep

# --- argument check ---
if [ -z "${1:-}" ]; then
  echo "Usage: $0 <source-directory>" >&2
  exit 1
fi
SOURCE_DIR="$1"

if [ ! -d "$SOURCE_DIR" ]; then
  echo "Source directory does not exist: $SOURCE_DIR" >&2
  exit 1
fi

# --- make the backup ---
mkdir -p "$BACKUP_ROOT"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"          # e.g. 20260619-142530
ARCHIVE="$BACKUP_ROOT/backup-$TIMESTAMP.tar.gz"

echo "Backing up $SOURCE_DIR -> $ARCHIVE"
tar -czf "$ARCHIVE" "$SOURCE_DIR"

# --- rotate: delete all but the newest $KEEP archives ---
echo "Keeping the $KEEP most recent backups; removing older ones."
ls -1t "$BACKUP_ROOT"/backup-*.tar.gz | tail -n +$((KEEP + 1)) | while read -r old; do
  echo "Removing old backup: $old"
  rm -f "$old"
done

echo "Done."
exit 0
```

A few lines deserve a closer look:

- `TIMESTAMP="$(date +%Y%m%d-%H%M%S)"` — the `$(...)` is **command substitution**: it runs the command inside and drops its output into the variable. So `TIMESTAMP` becomes something like `20260619-142530`. Putting the timestamp in the filename means each run makes a *new* archive instead of clobbering the last one.
- `tar -czf "$ARCHIVE" "$SOURCE_DIR"` — **c**reate a **z** (gzip-compressed) archive into the **f**ile we name. This is the actual backup.
- The rotation line is a small pipeline: `ls -1t` lists the archives **newest first** (one per line), `tail -n +$((KEEP + 1))` skips the first `KEEP` of them and prints the rest (the *old* ones), and the `while read` **loop** deletes each one it's handed. `$((KEEP + 1))` is bash doing arithmetic — if `KEEP` is 5, we keep lines 1–5 and start deleting from line 6.

Here's a real run, the second time (so there's already an old backup to clean up):

```console
$ ./backup.sh ~/projects/myapp
Backing up /home/ada/projects/myapp -> /home/ada/backups/backup-20260619-142530.tar.gz
Keeping the 5 most recent backups; removing older ones.
Removing old backup: /home/ada/backups/backup-20260612-090210.tar.gz
Done.
$ echo $?
0
```
*What just happened:* The script created a fresh timestamped archive, then found it now had six backups, kept the five newest, and removed the oldest one — and exited `0` to say it all worked. Run it again tomorrow and it does the same thing, correctly, without you remembering a single flag. That's the payoff from Phase 1, made real: the process is now a file, not a memory.

💡 **Key point.** A reliable script is mostly *guard rails*: `set -euo pipefail` at the top, quote every variable, check arguments and paths before acting, and end with a clear exit code. The actual work — `tar`, `rm` — is the easy part. The robustness is what makes it safe to run unattended, which is exactly what Phase 3 needs.

## Recap

1. A script is typed-ahead terminal commands; the **shebang** (`#!/usr/bin/env bash`) says what runs it, and `chmod +x` lets you run it.
2. Put **`set -euo pipefail`** right after the shebang — exit on error, error on unset variables, catch failures inside pipes. The single best line for reliability.
3. **Variables** (`NAME="value"`, no spaces; read as `$NAME`) — and always **quote** them.
4. **Arguments** arrive as `$1`, `$2`; check they exist before using them.
5. **Exit codes**: `0` is success, non-zero is failure — end with `exit 0`/`exit 1` so other tools know what happened.
6. **Conditionals** (`if [ ... ]`) check before acting; **loops** (`while read`) handle many items.

You can now write a script that does real work and fails safely. Next: how to tell when bash is the wrong tool, and how to schedule a script so it runs without you.

---

[← Phase 1: If You've Done It Twice, Script It](01-if-youve-done-it-twice.md) · [Guide overview](_guide.md) · [Phase 3: When to Reach for Python →](03-when-to-reach-for-python.md)
