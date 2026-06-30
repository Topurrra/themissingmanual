---
title: "Enforcement and gotchas"
guide: eslint-and-prettier
phase: 3
summary: "Stop arguing about code style: Prettier formats automatically, ESLint catches real bugs and bad patterns, and together they end the bikeshedding."
tags: [eslint, prettier, linting, formatting, javascript, code-quality, tooling]
difficulty: beginner
synonyms: ["eslint vs prettier", "eslint prettier setup", "javascript linter formatter", "prettier config", "eslint flat config", "how to set up eslint", "lint on save", "pre-commit lint format"]
updated: 2026-06-30
---

# Enforcement and gotchas

A config that lives only on your laptop helps only you. The point of these tools is that the *whole team* writes consistent, bug-checked code — and that takes enforcement at three layers, each catching what the one before it missed. Then there are the few traps that waste an afternoon the first time you hit them. Let's cover both so they don't surprise you.

## Three layers, each a safety net for the last

Think of enforcement as nested nets. The editor catches things instantly. Pre-commit catches what you forgot to fix before committing. CI catches what slipped past a teammate whose editor wasn't set up. You want all three, because each layer assumes the one before it can be skipped.

```text
EDITOR        → fixes on save, instant feedback     (can be skipped)
PRE-COMMIT    → blocks the commit if it's not clean  (can be bypassed)
CI            → blocks the merge, no exceptions       (the real gate)
```

*What just happened:* the editor is convenience, pre-commit is a polite gate, CI is the gate that actually holds. The deeper you go, the harder it is to bypass — which is exactly the order you want, because the last layer is the one that protects the shared codebase.

### Layer 1: the editor

Install the Prettier and ESLint extensions for your editor and turn on format-on-save. In VS Code, that's a `.vscode/settings.json` committed to the repo so every contributor gets it:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

*What just happened:* every save now runs Prettier (formatting) and applies ESLint's safe fixes. Committing this file into `.vscode/` means a new teammate gets the behavior automatically instead of being told to "set up your editor" in an onboarding doc nobody reads.

### Layer 2: pre-commit hook

A pre-commit hook runs before a commit is recorded and can reject it. The standard combo is **husky** (manages the git hook) plus **lint-staged** (runs the tools on *only the files you're committing*, not the whole repo — fast).

```bash
npm install --save-dev husky lint-staged
npx husky init
```

```json
{
  "lint-staged": {
    "*.{js,ts,jsx,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

*What just happened:* `husky init` wires a git pre-commit hook. The `lint-staged` config says: for staged JS/TS files, run ESLint's fix then Prettier; for other files, format only. Because it touches only staged files, it stays fast even in a big repo. A commit with unfixable lint errors gets blocked before it exists.

### Layer 3: CI

Editors can be misconfigured and hooks can be bypassed with `--no-verify`. CI is the layer with no escape hatch. In CI you run the tools in *check* mode — they don't fix anything, they fail if the code isn't already clean.

```bash
# in CI: check only, never write
npx prettier --check .
npx eslint .
```

*What just happened:* `prettier --check` exits with an error if any file isn't already formatted (note `--check`, not `--write` — CI reports, it doesn't edit). `eslint .` fails on any error-level rule. A pull request that isn't clean can't merge. This is the layer that actually keeps the codebase consistent, because it's the one nobody can skip.

## Gotchas that waste an afternoon

**The conflict loop is back.** If Prettier and ESLint seem to undo each other's work, you almost certainly forgot `eslint-config-prettier`, or it isn't last in your flat-config array. Re-read Phase 2's handshake — order is everything.

**`--write` versus `--check`.** Run `prettier --write` in CI by accident and CI will silently "pass" by reformatting files in a throwaway container, fixing nothing in your repo. CI must use `--check`. Use `--write` only locally and in pre-commit.

**Linting the wrong files.** Flat config lints what it's pointed at, but you'll still want to ignore generated output. Add an ignores entry so ESLint doesn't waste time (and throw confusing errors) on `dist/` or `node_modules`:

```js
// eslint.config.js
export default [
  { ignores: ["dist", "build", "coverage"] },
  // ...rest of your config
];
```

*What just happened:* a config object with only an `ignores` key tells ESLint to skip those paths entirely. `node_modules` is ignored by default, but your own build output is not — list it explicitly or you'll get errors about code you didn't write.

**Don't fix the whole repo in one commit.** The first time you add Prettier to an old codebase, `prettier --write .` will touch hundreds of files. Do that as a *single isolated commit* with no logic changes, and record it so `git blame` can skip it:

```bash
# do the mass-format alone, then record the commit hash here:
echo "<commit-hash>" >> .git-blame-ignore-revs
```

*What just happened:* `.git-blame-ignore-revs` tells `git blame` to look past that giant formatting commit, so blame still points at whoever wrote the real logic instead of "the day we adopted Prettier." Keeping the reformat separate from feature work also keeps your diffs reviewable.

**Warnings that everyone ignores.** If a rule is set to `"warn"`, it shows up but never fails CI — and warnings nobody is forced to fix pile up until they're noise. Decide deliberately: a rule that matters should be `"error"`; a rule that's truly advisory can be `"warn"`; a rule you don't care about should be `"off"`, not a warning that trains the team to ignore the linter.

> The honest test of your setup: clone the repo fresh, make a deliberately messy and slightly buggy change, and try to merge it. If the editor cleans the mess, the hook catches what's left, and CI blocks the bug — your three nets hold.

## In the wild

Mature teams treat a clean lint as non-negotiable as a passing test suite — same CI gate, same "fix it before merge" expectation. The payoff compounds: reviewers stop commenting on style entirely and spend their attention on logic and design, which is the only place human review was ever worth more than a machine.

```quiz
[
  {
    "q": "Why must CI use `prettier --check` instead of `prettier --write`?",
    "choices": ["--check is faster", "--write in CI reformats files in a throwaway container and falsely passes without catching anything", "--check also runs ESLint", "There is no difference in CI"],
    "answer": 1,
    "explain": "--write edits files (pointless in CI's disposable checkout), so it would always pass. --check fails when code isn't already formatted, which is what a gate needs."
  },
  {
    "q": "What is the role of lint-staged in a pre-commit hook?",
    "choices": ["It replaces ESLint", "It runs the tools on only the staged files, keeping the hook fast", "It pushes to CI", "It formats node_modules"],
    "answer": 1,
    "explain": "lint-staged runs ESLint/Prettier on just the files being committed, so the hook stays fast even in a large repo."
  },
  {
    "q": "Why record the mass-format commit in `.git-blame-ignore-revs`?",
    "choices": ["To delete the commit", "So git blame skips it and still attributes lines to whoever wrote the real logic", "To make CI ignore the files", "To re-run Prettier automatically"],
    "answer": 1,
    "explain": "A repo-wide reformat touches every line; without ignoring that commit, git blame would credit it instead of the original author."
  }
]
```

[← Phase 2: Config and autofix](02-config-and-autofix.md) · [Overview](_guide.md)
