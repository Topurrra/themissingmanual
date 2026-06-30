---
title: "ESLint and Prettier"
guide: eslint-and-prettier
phase: 2
summary: "Stop arguing about code style: Prettier formats automatically, ESLint catches real bugs and bad patterns, and together they end the bikeshedding."
tags: [eslint, prettier, linting, formatting, javascript, code-quality, tooling]
difficulty: beginner
synonyms: ["eslint vs prettier", "eslint prettier setup", "javascript linter formatter", "prettier config", "eslint flat config", "how to set up eslint", "lint on save", "pre-commit lint format"]
updated: 2026-06-30
---

# Config and autofix

Now the everyday part. You know the two jobs; here's how you wire the tools into a project and run them. The good news: the modern setup is smaller than the old one. The pieces are a Prettier config (tiny), an ESLint config (a flat array these days), and two commands you'll run constantly — one to format, one to fix.

## Installing the pieces

Both tools live as dev dependencies in your project, not global installs. A global install means "works on my machine"; a project install means "works for everyone who clones this repo."

```bash
npm install --save-dev prettier eslint
```

*What just happened:* `--save-dev` records both in `package.json` under `devDependencies`. Anyone who runs `npm install` afterward gets the exact same tools, so the team lints and formats identically.

For ESLint, the quickest honest start is its own setup command, which asks a few questions and writes a starter config for you:

```bash
npm init @eslint/config@latest
```

*What just happened:* ESLint scaffolds a config tailored to your answers (framework, TypeScript or not, browser or Node) and installs the plugins those answers imply. You'll still want to read what it wrote — a generated config you don't understand is a config you can't fix later.

## Prettier config: small on purpose

Prettier's config is deliberately tiny because Prettier doesn't have many knobs. A `.prettierrc.json` at your project root is enough:

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all"
}
```

*What just happened:* you set four preferences — keep semicolons, prefer single quotes, wrap lines around 100 characters, add trailing commas everywhere they're legal. Everything else uses Prettier's defaults. Resist the urge to tweak more; the whole value is that the team stops debating these.

Pair it with a `.prettierignore` so Prettier skips files it shouldn't touch:

```text
dist
build
coverage
package-lock.json
```

*What just happened:* generated and vendored files are now off-limits to the formatter. Reformatting `package-lock.json` or your build output creates noisy diffs and helps nobody.

## ESLint flat config: the modern shape

Modern ESLint uses **flat config**: a single `eslint.config.js` file exporting an array of config objects. This replaced the older `.eslintrc` style. The array shape is the thing to understand — each object can target certain files and set rules, and later objects override earlier ones. That ordering is exactly what makes the Prettier handshake work.

```js
// eslint.config.js
import js from "@eslint/js";

export default [
  js.configs.recommended,        // ESLint's sensible default rules
  {
    rules: {
      eqeqeq: "error",           // require === over ==
      "no-unused-vars": "warn",  // flag unused vars, don't fail the build
    },
  },
];
```

*What just happened:* you started from ESLint's `recommended` ruleset, then layered your own object on top. Because your object comes later in the array, your `eqeqeq` and `no-unused-vars` settings win over anything earlier. `"error"` fails; `"warn"` shows a yellow warning but doesn't block.

## The handshake: turn off ESLint's style rules

This is the step that ends the fight from Phase 1. You install `eslint-config-prettier`, whose entire job is to switch *off* every ESLint rule that overlaps with formatting. After that, ESLint never has an opinion about a space or a quote, so it can never disagree with Prettier.

```bash
npm install --save-dev eslint-config-prettier
```

```js
// eslint.config.js
import js from "@eslint/js";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  {
    rules: {
      eqeqeq: "error",
      "no-unused-vars": "warn",
    },
  },
  prettier,   // MUST be last: disables ESLint's formatting rules
];
```

*What just happened:* `prettier` sits last in the array on purpose. Since later objects win, it turns off ESLint's stylistic rules *after* everything else has had its say. Now the division of labor is enforced in code: ESLint checks correctness, Prettier owns formatting, and they physically cannot collide. The order is the whole trick — put `prettier` anywhere but last and an earlier formatting rule can sneak back in.

> One sentence to memorize: `eslint-config-prettier` goes last and turns ESLint's formatting rules off. That's the entire peace treaty.

## The two commands you'll live in

Both tools have an autofix mode, and it's where most of the value is. You rarely fix style by hand — you let the machine do it.

```bash
# format every file in place
npx prettier --write .

# lint, and auto-fix the fixable problems
npx eslint . --fix
```

*What just happened:* `prettier --write .` rewrites every non-ignored file to match your config. `eslint . --fix` reports problems and automatically repairs the ones it safely can (like swapping `==` for `===`), leaving the judgment calls for you to fix by hand. The `.` means "this whole directory."

Wire them into `package.json` so nobody has to remember the flags:

```json
{
  "scripts": {
    "format": "prettier --write .",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

*What just happened:* now `npm run format` and `npm run lint` are the team's shared vocabulary. New contributors don't need to know `npx` incantations — they run the named scripts, which is also exactly what your CI will call in Phase 3.

## In the wild

A common rhythm on a healthy team: format-on-save in the editor (so you never think about it), `npm run lint` while you work (to catch bugs early), and both enforced in CI (so nothing slips through). You'll set up that enforcement next — the configs you wrote above are what every layer points at.

```quiz
[
  {
    "q": "What does eslint-config-prettier do, and where must it go?",
    "choices": ["Adds formatting rules to ESLint; goes first", "Turns off ESLint's formatting rules; goes last in the config array", "Replaces Prettier entirely; goes anywhere", "Installs Prettier; goes in package.json"],
    "answer": 1,
    "explain": "It disables ESLint's formatting rules so the two tools don't conflict. It must be last because later config objects override earlier ones."
  },
  {
    "q": "What is ESLint flat config?",
    "choices": ["A .eslintrc file in YAML", "A single eslint.config.js exporting an array of config objects", "A Prettier plugin", "A way to flatten nested folders"],
    "answer": 1,
    "explain": "Flat config is the modern format: one eslint.config.js that exports an array, where later objects override earlier ones."
  },
  {
    "q": "What does `eslint . --fix` do?",
    "choices": ["Reformats whitespace like Prettier", "Reports problems and auto-repairs the ones it safely can, leaving judgment calls for you", "Deletes files with errors", "Installs missing plugins"],
    "answer": 1,
    "explain": "--fix auto-corrects safely fixable issues (e.g. == to ===) and reports the rest. Whitespace formatting is Prettier's job, not ESLint's."
  }
]
```

[← Phase 1: Two tools, two jobs](01-two-tools-two-jobs.md) · [Overview](_guide.md) · [Phase 3: Enforcement and gotchas](03-enforcement-and-gotchas.md) →
