---
title: "Shell Scripting Essentials"
guide: "automating-the-boring-stuff"
phase: 2
summary: "Build a real bash script piece by piece - variables, arguments, conditionals, loops, exit codes - and learn the one line, set -euo pipefail, that turns a silent disaster into a loud, safe failure."
tags: [bash, shell-scripting, variables, arguments, exit-codes, set-euo-pipefail, loops]
difficulty: intermediate
synonyms: ["how to write a bash script", "set -euo pipefail meaning", "bash variables and arguments", "bash exit codes", "bash if statement", "bash for loop", "shebang line"]
updated: 2026-07-10
---

# Shell Scripting Essentials

A bash script is the exact same commands you'd type at the prompt, saved in a file so you can run them all at once, the same way, every time. This phase fills in the pieces that turn a list of commands into something robust enough to trust - including the one line that separates "a script" from "a safe script."

We'll build one real example end to end: a script that backs up a directory and rotates out old backups so they don't fill the disk. Type it in and run it as you go - the pieces click fastest when you watch them work.

## The shebang and your first run

Create a file called `backup.sh`:

```bash
#!/usr/bin/env bash
echo "Hello from a script"
```

That first line is the **shebang** (`#!`) - it tells the system which program runs the file. `/usr/bin/env bash` finds bash wherever it lives, more portable than hardcoding a path. Make it runnable and run it:

```console
$ chmod +x backup.sh
$ ./backup.sh
Hello from a script
```
*What just happened:* `chmod +x` flips the file's permission so the system can run it as a program; `./backup.sh` then runs it. Bash reads the file top to bottom and executes each line as if you'd typed it. **A script is just typed-ahead terminal commands.**

📝 **Terminology.** A `#` starts a **comment** (bash ignores the rest of the line) except on the first line, where `#!` is the shebang. Use comments for *why*, not *what*.

## The safety line: `set -euo pipefail`

Put this line right after the shebang in almost every script you write - it's the most important one in this guide:

```bash
#!/usr/bin/env bash
set -euo pipefail
```

By default, bash is alarmingly forgiving: a failed command doesn't stop the script, and an unset variable is silently treated as empty. For a backup script, that's exactly how you end up deleting good backups because the step that made the new one silently failed. `set -euo pipefail` makes bash strict instead - three flags, plus one:

- **`-e`** - **exit on error.** A failed command (non-zero exit) stops the script immediately instead of blundering onward.
- **`-u`** - **error on unset variables.** Using a variable you forgot to set is now a loud error, not a silent empty string - catches typos like `$BACKUP_DIRR` before they erase the wrong thing.
- **`-o pipefail`** - in a pipeline like `a | b`, if `a` fails, the whole pipeline is considered failed. Without this, only the *last* command's success counts, so failures hide mid-pipe.

⚠️ **Gotcha.** Without `set -e`, a script that fails on line 3 happily runs lines 4 through 40 against a broken state - how "the backup script" becomes "the script that quietly stopped backing up six weeks ago and nobody noticed." Adding this one line is the cheapest reliability you will ever buy.

(Sometimes you *expect* a command to fail and want to handle it yourself - use `if ! some_command; then ...`, as below. It doesn't trip `-e` because the failure is part of an `if` test.)

## Variables - name the things that might change

Hardcoding paths all over a script means changing them in ten places later. Pull them into **variables** at the top, where they're easy to find and edit:

```bash
SOURCE_DIR="$HOME/projects/myapp"
BACKUP_ROOT="$HOME/backups"
KEEP=5
```
*What just happened:* `NAME="value"` defines a variable - **no spaces around the `=`** (`NAME = "value"` is an error, and trips up everyone at least once). Read it back with `$SOURCE_DIR`. `$HOME` is one bash gives you free: your home directory.

⚠️ **Gotcha - always quote your variables.** Write `"$SOURCE_DIR"`, not `$SOURCE_DIR`. If a path contains a space (and one day it will - `My Documents`), an unquoted variable splits into two arguments and your command does something wild. Quoting keeps it one value - this single habit prevents a whole category of "it worked on my machine" bugs.

## Arguments - let the caller pass values in

You don't want to edit the script every time you back up a different folder. Let the caller pass the source directory as an **argument**:

```console
$ ./backup.sh /home/ada/projects/myapp
```

Arguments arrive as `$1`, `$2`, and so on (`$1` is first). Check the caller actually provided one:

```bash
if [ -z "${1:-}" ]; then
  echo "Usage: $0 <source-directory>" >&2
  exit 1
fi
SOURCE_DIR="$1"
```
*What just happened:* `[ -z "${1:-}" ]` tests whether the first argument is empty (`-z` = "zero length"). The `${1:-}` is a small dance for `set -u` - "`$1`, or empty if unset" - so checking a missing argument doesn't itself trip the unset-variable error. If it's empty, we print a usage message to **standard error** (`>&2`) and `exit 1`.

## Exit codes - how a script says "it worked" or "it didn't"

`exit 1` above matters: every command and script ends with an **exit code** - `0` for success, anything else for failure. It's how scripts talk to `set -e` and to schedulers like cron. See the last one in `$?`:

```console
$ ls /tmp >/dev/null; echo $?
0
$ ls /does-not-exist >/dev/null 2>&1; echo $?
2
```
*What just happened:* `ls` on a real directory succeeded, so `$?` is `0`. On a missing one it failed, so `$?` is non-zero (`2`, ls's code for "serious trouble"). `>/dev/null` and `2>&1` just discard the output - we only wanted to see the code. The rule to internalize: **end your script with `exit 0` on success, `exit 1` (or another non-zero) on failure**, so whatever runs it knows what happened. Cron, in particular, decides whether to alert you based on this number.

## Conditionals - check before you act

We've already used `if`. The full shape is worth seeing once:

```bash
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Source directory does not exist: $SOURCE_DIR" >&2
  exit 1
fi

mkdir -p "$BACKUP_ROOT"
```
*What just happened:* `[ ! -d "$SOURCE_DIR" ]` reads as "if NOT (`!`) a directory (`-d`) exists here." A missing source fails loudly and early rather than backing up nothing. `mkdir -p` creates the backup folder - `-p` means it won't complain if the folder already exists, making the script safe to re-run. (That property is *idempotency* - Phase 3 covers it.)

## Putting it together: backup + rotate

Now the whole script. Read it top to bottom - every piece is something we just covered:

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

- `TIMESTAMP="$(date +%Y%m%d-%H%M%S)"` - `$(...)` is **command substitution**: it runs the command and drops its output into the variable. Putting the timestamp in the filename means each run makes a *new* archive instead of clobbering the last one.
- `tar -czf "$ARCHIVE" "$SOURCE_DIR"` - **c**reate a **z** (gzip) archive into the named **f**ile. This is the actual backup.
- The rotation line is a pipeline: `ls -1t` lists archives **newest first**, `tail -n +$((KEEP + 1))` skips the first `KEEP` and prints the rest, and `while read` **loops** over deleting each one. If `KEEP` is 5, lines 1–5 stay and deletion starts at line 6.

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
*What just happened:* The script created a fresh timestamped archive, found it now had six backups, kept the five newest, and removed the oldest - exiting `0` to say it worked. Run it again tomorrow and it does the same thing correctly, without you remembering a single flag. That's the payoff from Phase 1: the process is now a file, not a memory.

💡 **Key point.** A reliable script is mostly *guard rails*: `set -euo pipefail`, quote every variable, check arguments and paths before acting, end with a clear exit code. `tar` and `rm` are the easy part - the guard rails are what make it safe to run unattended, which Phase 3 needs.

## Recap

1. A script is typed-ahead terminal commands; the **shebang** (`#!/usr/bin/env bash`) says what runs it, and `chmod +x` lets you run it.
2. Put **`set -euo pipefail`** right after the shebang - exit on error, error on unset variables, catch failures inside pipes. The single best line for reliability.
3. **Variables** (`NAME="value"`, no spaces; read as `$NAME`) - and always **quote** them.
4. **Arguments** arrive as `$1`, `$2`; check they exist before using them.
5. **Exit codes**: `0` is success, non-zero is failure - end with `exit 0`/`exit 1` so other tools know what happened.
6. **Conditionals** (`if [ ... ]`) check before acting; **loops** (`while read`) handle many items.

You can now write a script that does real work and fails safely. Next: how to tell when bash is the wrong tool, and how to schedule a script so it runs without you.

---

[← Phase 1: If You've Done It Twice, Script It](01-if-youve-done-it-twice.md) · [Guide overview](_guide.md) · [Phase 3: When to Reach for Python →](03-when-to-reach-for-python.md)

## Try it yourself

Decode any cron schedule - edit it and see the plain-English meaning plus the next run times:

```playground-cron
*/15 9-17 * * 1-5
```
