---
title: "The Config and the Commit Loop"
guide: pre-commit-hooks
phase: 2
summary: "Catch problems before they're committed: the pre-commit framework runs formatters, linters, and secret scanners automatically on every git commit."
tags: [git, hooks, linting, formatting, code-quality, ci]
difficulty: beginner
synonyms: ["pre-commit framework", "git pre-commit hook", "pre-commit-config.yaml", "run linter on commit", "block bad commits", "auto format on commit", "secret scanner git hook"]
updated: 2026-06-30
---

# The Config and the Commit Loop

You've got the model: a committed config file, turned into a real git hook by the framework. Now you'll actually wire it up and feel the loop. By the end of this phase you'll write `.pre-commit-config.yaml`, install it, and watch a commit get caught and fixed.

## Step one: install the tool, install the hook

There are two different installs here, and conflating them is the most common early stumble. First you install the `pre-commit` *program* (once per machine). Then, inside a repo, you run `pre-commit install` to write the git hook (once per clone).

```bash
pip install pre-commit      # the program, once per machine
cd my-project
pre-commit install          # the git hook, once per clone
```

```text
pre-commit installed at .git/hooks/pre-commit
```

*What just happened:* the framework generated `.git/hooks/pre-commit` for this clone. From now on, every `git commit` in this repo triggers the framework. Note what's still missing - you haven't told it *what to run* yet. That's the config file.

## Step two: write the config

The config is a list of repos, and from each repo you pick the hooks you want. Here's a realistic starter for a Python project.

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.9
    hooks:
      - id: ruff           # the linter
      - id: ruff-format    # the formatter
```

*What just happened:* you declared two source repos. `rev` pins each to an exact version - this is the "everyone runs the identical tool" guarantee from Phase 1. Under each, `hooks:` lists the specific checks by their `id`. The framework knows how to fetch and install each one; you don't manage their dependencies yourself.

A few of these earn their place in almost any repo, so it's worth knowing what they do:

```text
trailing-whitespace      strips trailing spaces from lines
end-of-file-fixer        ensures files end in exactly one newline
check-yaml               parses YAML files, fails on syntax errors
check-added-large-files  blocks accidentally committed big binaries
```

*What just happened:* these are cheap, language-agnostic safety nets. They catch the dull mistakes - a giant file you `git add`-ed by accident, a YAML you broke with a stray indent - that would otherwise surface much later.

## Step three: the commit loop

Now the payoff. You stage a change and commit. The framework runs your hooks **on the staged files only** - not your whole repo, only what this commit touches. That's what keeps it fast.

```console
$ git add app.py
$ git commit -m "add user lookup"
trim trailing whitespace.................................................Failed
- hook id: trailing-whitespace
- files were modified by this hook
Fixing app.py
ruff.....................................................................Passed
ruff-format..............................................................Passed
```

*What just happened:* `trailing-whitespace` found a problem **and fixed it** - see "files were modified by this hook." The overall run Failed, so the commit was *aborted*. This is the key behavior of fixing hooks: they edit the file, but the fix is now an *unstaged* change, so git won't include it silently. You're being told to look.

This trips up everyone once. A formatter that "passes by fixing" still fails the commit, on purpose, so a machine never rewrites your code into a commit without you seeing it. The fix is to re-stage and commit again.

```console
$ git add app.py          # stage the fix the hook made
$ git commit -m "add user lookup"
trim trailing whitespace.................................................Passed
ruff.....................................................................Passed
ruff-format..............................................................Passed
[main 3f1c9ab] add user lookup
```

*What just happened:* with the auto-fix staged, every hook passes and the commit lands. The loop is: commit → hook fixes or complains → you stage the fix → commit again. After a day of this it's muscle memory.

## Fixing hooks vs failing hooks

Hooks come in two flavors, and the difference shapes your day.

```text
FIXING hook   (formatter)   edits the file, fails the commit so you
                            re-stage. The fix is handed to you.
FAILING hook  (linter)      reports a problem it can't fix for you,
                            fails the commit. You edit, then re-stage.
```

*What just happened:* a formatter like `ruff-format` rewrites the file for you; a linter like `ruff` (without `--fix`) can only point at the line. Both block the commit; only one does the work for you. Knowing which is which tells you whether to expect an auto-edit or a to-do.

## Running it on demand

You don't have to commit to run the checks. This is essential the first time you adopt pre-commit on an existing repo, and for debugging.

```bash
pre-commit run --all-files
```

```text
trim trailing whitespace.................................................Passed
fix end of files.........................................................Passed
check yaml...............................................................Passed
ruff.....................................................................Passed
ruff-format..............................................................Passed
```

*What just happened:* `--all-files` ignores staging and checks the entire repo. Run this right after adding the config so you fix the whole codebase in one pass, instead of being ambushed file-by-file over the next week of commits.

> First-run note: the very first commit (or first `run`) after adding a hook is slow - the framework is downloading and building each tool's isolated environment. It caches them, so every run after is fast. Don't panic at the initial pause.

For builders: keep the config small at first. Three or four cheap hooks that everyone tolerates beat twenty strict ones that make people reach for `--no-verify` (Phase 3) on day one. You can always add more once the team trusts the loop.

```quiz
[
  {
    "q": "By default, which files does pre-commit run your hooks against during a commit?",
    "choices": ["Every file in the repository", "Only the staged files in that commit", "Only files changed since the last push", "Files listed in .gitignore"],
    "answer": 1,
    "explain": "It runs on the staged files only, which is what keeps each commit's checks fast."
  },
  {
    "q": "A formatter hook reports 'files were modified by this hook' and the commit fails. What do you do?",
    "choices": ["Run git commit --amend", "Delete the hook from the config", "Re-stage the fixed file with git add, then commit again", "Nothing - the commit already went through"],
    "answer": 2,
    "explain": "The auto-fix is left unstaged on purpose; stage it with git add and commit again."
  },
  {
    "q": "Why run `pre-commit run --all-files` right after first adding the config?",
    "choices": ["It's required before installing", "To fix the whole existing codebase in one pass instead of file-by-file", "It uninstalls old hooks", "It pushes the config to teammates"],
    "answer": 1,
    "explain": "--all-files checks the entire repo at once, so you clean up everything up front."
  }
]
```

[← Phase 1: What a Hook Actually Is](01-what-a-hook-is.md) | [Overview](_guide.md) | [Phase 3: Bypassing, CI, and the Gotchas →](03-bypassing-ci-and-gotchas.md)
