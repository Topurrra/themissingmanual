---
title: "The Tab, Stale Builds, and Why It Endures"
guide: make-and-makefiles
phase: 3
summary: "The 50-year-old build tool that still runs everything: targets, prerequisites, and recipes - a dependency graph that rebuilds only what changed."
tags: [make, makefile, build, automation, task-runner, cli]
difficulty: beginner
synonyms: ["makefile tutorial", "how does make work", "phony targets", "make tab error", "makefile variables", "make vs scripts"]
updated: 2026-06-30
---

# The Tab, Stale Builds, and Why It Endures

You understand the graph and you can write task targets. Now for the part nobody warns you about until you have already lost an hour to it. Make has a handful of legendary sharp edges - one of them is over fifty years old and still claims victims every day. This phase walks you through the traps so you recognize them on sight, then steps back to ask the real question: why is a tool this quirky still everywhere?

## The tab. Always the tab.

Recipe lines must be indented with a literal **TAB character**, not spaces. This is the single most infamous gotcha in all of Make. Your editor may have helpfully inserted spaces, and the error you get does not mention tabs at all:

```console
$ make build
Makefile:2: *** missing separator.  Stop.
```

*What just happened:* line 2 was indented with spaces instead of a tab, so Make could not tell it was a recipe line. "missing separator" is Make's cryptic way of saying "I expected a tab here." This is the bug everyone hits at least once, and the error message gives you almost nothing to go on.

The fix: make sure recipe lines start with a real tab. Most editors can show whitespace or be told to keep tabs in Makefiles. If you suspect a file, you can ask Make to point at the line, or check for stray spaces:

```console
$ cat -A Makefile | head -3
build:$
        gcc -o app main.c$
```

*What just happened:* `cat -A` reveals whitespace. A correct recipe line shows `^I` (a tab) at the start; if you instead saw leading spaces, that is your culprit. The TAB requirement is a historical accident from 1976 that the maintainers have kept for compatibility - generations of source files would break if it changed.

> Each recipe line runs in its **own separate shell**. So `cd build` on one line does not affect the next line - the directory change is gone when that shell exits. To chain them, put both commands on one line joined with `&&`, or use a backslash to continue: `cd build && cmake ..`.

## Stale builds: when the graph lies

Make's whole correctness rests on prerequisites being accurately declared. If a target secretly depends on a file you did not list, Make will not rebuild when that file changes - and you get a *stale build*: output that does not match your source, with no error at all.

```makefile
app: main.c
	gcc -o app main.c config.h
```

*What just happened:* the recipe reads `config.h`, but `config.h` is not in the prerequisites. Edit `config.h` and run `make` - Make sees `main.c` unchanged, declares `app` up to date, and skips the rebuild. Your binary now uses the old `config.h`. The build is silently wrong.

The cure is to list every input as a prerequisite:

```makefile
app: main.c config.h
	gcc -o app main.c config.h
```

When a stale build has you cornered and you need a clean slate, the blunt instrument is to wipe the outputs and rebuild - which is exactly why that `clean` target from Phase 2 exists:

```console
$ make clean && make
```

*What just happened:* `clean` deleted the build outputs, so every target is now missing and Make rebuilds everything from scratch. Reach for this when you suspect the graph is lying; fix the missing prerequisite so you do not have to.

## A few more edges worth knowing

```console
$ make -n build
gcc -o app main.c config.h
```

*What just happened:* `-n` (dry run) prints the recipes Make *would* run without running them. It is the safest way to understand or debug a Makefile before you let it loose. Pair it with `make -j4` (run up to 4 recipes in parallel) once your prerequisites are accurate - parallelism only works if the graph is correct, because Make uses the dependencies to know what is safe to run at the same time.

By default, if any recipe line returns a non-zero exit code, Make stops immediately. That is usually what you want - a failed compile should not march on to the link step. If you genuinely want to ignore a failure (say, a `rm` of a file that may not exist), prefix the command with `-`:

```makefile
clean:
	-rm dist/app
	rm -rf build/
```

*What just happened:* the leading `-` on the first line tells Make to keep going even if that `rm` fails. The second line has no `-`, so a failure there still stops the build. Use this sparingly - swallowing errors is how stale and broken builds hide.

## Why it endures

Step back and look at what Make actually is: a tiny, dependency-aware command runner that ships on essentially every Unix-like machine, depends on nothing, and uses a model you can hold in your head. That combination is rare.

- **It is everywhere.** No install step, no version manager, no lockfile. If there is a terminal, there is probably a `make`.
- **It is universal.** The graph engine does not care whether you compile C, render PDFs, or run linters. One tool, every stack.
- **The model is small.** Targets, prerequisites, recipes, timestamps. You learned it in Phase 1 and it has not grown since.
- **It is upfront about being a wrapper.** Newer tools hide your commands behind layers; a Makefile shows you the exact shell commands it runs. When something breaks, you can read it.

The quirks are real - the tab, the per-line shells, the silent stale builds. But for "run these tasks, rebuild only what changed," nothing has matched its blend of ubiquity and simplicity in five decades.

For builders: even when a project's real build lives in a heavier tool, a thin Makefile on top - `make test`, `make deploy` - is a kindness to everyone who clones the repo. It gives them one front door regardless of what is behind it. That habit slots neatly into the release flow in [/guides/build-and-release-basics](/guides/build-and-release-basics).

```quiz
[
  {
    "q": "You get `Makefile:2: *** missing separator. Stop.` What is the most likely cause?",
    "choices": [
      "A missing prerequisite",
      "The recipe line is indented with spaces instead of a tab",
      "A typo in the target name",
      "The shell is not installed"
    ],
    "answer": 1,
    "explain": "Recipe lines must start with a literal TAB. Spaces produce the cryptic 'missing separator' error. This is Make's most infamous gotcha."
  },
  {
    "q": "A target's recipe reads a file that is NOT listed in its prerequisites. What happens when that file changes?",
    "choices": [
      "Make errors and refuses to build",
      "Make rebuilds the target anyway",
      "Make may skip the rebuild, producing a silently stale build",
      "Make warns you about the missing prerequisite"
    ],
    "answer": 2,
    "explain": "Make only compares declared prerequisites. An undeclared input that changes won't trigger a rebuild, so the output silently goes stale. List every input."
  },
  {
    "q": "What does `make -n build` do?",
    "choices": [
      "Runs the build with no output",
      "Prints the recipes it would run, without executing them (dry run)",
      "Forces a rebuild ignoring timestamps",
      "Runs the build with no parallelism"
    ],
    "answer": 1,
    "explain": "`-n` is a dry run: it prints the commands Make would execute without running them - the safest way to understand or debug a Makefile."
  }
]
```

[← Phase 2: Targets, Tasks, and Variables](02-targets-tasks-variables.md) | [Overview](_guide.md)
