---
title: "ESLint and Prettier"
guide: eslint-and-prettier
phase: 1
summary: "Stop arguing about code style: Prettier formats automatically, ESLint catches real bugs and bad patterns, and together they end the bikeshedding."
tags: [eslint, prettier, linting, formatting, javascript, code-quality, tooling]
difficulty: beginner
synonyms: ["eslint vs prettier", "eslint prettier setup", "javascript linter formatter", "prettier config", "eslint flat config", "how to set up eslint", "lint on save", "pre-commit lint format"]
updated: 2026-06-30
---

# Two tools, two jobs

Here's the moment that makes this click. You open a pull request and get two comments. One says "indent this with 2 spaces, not 4." The other says "you wrote `if (user = admin)` — that's an assignment, not a comparison; it'll always be true." Both are about your code. They are not the same kind of problem at all. The first is taste dressed up as a rule. The second is a bug that will page someone at 3am.

Prettier handles the first kind. ESLint handles the second. Once you feel that split in your bones, every confusing thing about these tools straightens out.

## Formatting versus linting

**Formatting** is about how the code looks: indentation, line length, single versus double quotes, where the line breaks, whether there's a trailing comma. None of it changes what the code *does*. Two files with identical logic but different formatting run exactly the same.

**Linting** is about what the code *means*: unused variables, comparing with `==` when you meant `===`, using a variable before it's defined, an `await` that does nothing, a React hook called inside a condition. These are correctness and quality problems. They can change behavior, hide bugs, or signal a misunderstanding.

```text
FORMATTING (Prettier)          LINTING (ESLint)
-------------------            ----------------
indentation                   unused variables
quote style                   == vs ===
line length                   unreachable code
trailing commas               missing await
semicolons                    React hook misuse
spacing                       accidental globals
```

*What just happened:* the left column is cosmetic and has one defensible answer per project; the right column is about whether your code is correct. Different problems want different tools.

The reason this matters: a formatter can be *deterministic*. Feed Prettier the same file twice and you get byte-for-byte the same output, every time, on every machine. It doesn't have opinions you argue with — it has one opinion and applies it everywhere. A linter can't work that way, because "is this a bug?" is a judgment call with hundreds of separate rules, each one on or off.

## Why Prettier wins the style argument

Before Prettier existed, teams spent real hours in code review arguing about spacing and quote style. Style guides ran to dozens of pages. People configured ESLint with a hundred stylistic rules and then fought about which ones to enable.

Prettier ended that by being deliberately stubborn. It takes your code, throws away most of your formatting, and reprints it from scratch according to its own rules. You get a handful of knobs (print width, single versus double quotes, semicolons, tab width) and that's close to all of them. This sounds limiting. It's the whole point. When there's exactly one way the code can come out, there's nothing left to argue about.

```js
// what you typed (messy but valid)
const user = {name:"Ada",
    role:'admin',   skills:["math","logic"]}

// what Prettier prints (every time, everywhere)
const user = { name: "Ada", role: "admin", skills: ["math", "logic"] };
```

*What just happened:* Prettier didn't ask your preference. It normalized spacing, unified the quotes, added the trailing semicolon, and collapsed the object onto one line because it fit within the print width. Run it on a teammate's machine and the output is identical.

> The deepest value of a formatter isn't pretty code — it's that formatting stops being a *decision*. A decision nobody has to make is a meeting nobody has to have.

## Why ESLint stays in its lane

ESLint is the opposite kind of tool: a big, configurable engine that walks your code's structure and checks it against rules you choose. `no-unused-vars`, `no-undef`, `eqeqeq` (require `===`), `no-console` — each is a separate rule you can turn on, turn off, or set to warn instead of error. Plugins add rules for React, TypeScript, accessibility, imports, and more.

Because ESLint *can* check formatting too (it has old rules for indentation and quotes), people used to make it do both jobs. That's the classic mistake. When ESLint and Prettier both have an opinion about indentation, they fight: Prettier reformats a line, ESLint flags it, you fix it to satisfy ESLint, Prettier reformats it back. You spend an afternoon refereeing two tools that should never have overlapped.

```text
The conflict (what NOT to do):
  Prettier:  "this line should be indented 2 spaces" → reformats
  ESLint:    "indent rule says 4 spaces"            → errors
  You:       fix it → Prettier undoes it → loop forever
```

*What just happened:* two tools claiming the same job is the single most common ESLint+Prettier pain. The fix is structural, not clever: take formatting away from ESLint entirely and give it to Prettier. You'll do that in Phase 2 by turning off ESLint's stylistic rules.

The clean mental model: **Prettier owns how the code looks. ESLint owns whether the code is sound.** They don't overlap, so they don't fight. If you remember nothing else from this phase, remember that sentence.

## For builders

If your project uses JavaScript or TypeScript — a Node service, a React app, a CLI — you almost certainly want both. Prettier alone leaves real bugs in your code. ESLint alone leaves you arguing about commas. The combination is the default for a reason: it splits a messy human problem into two clean machine problems. And if you're still shaky on the language itself, the [JavaScript from zero](/guides/javascript-from-zero) guide is the foundation these tools sit on top of.

```quiz
[
  {
    "q": "Which problem is Prettier's job, not ESLint's?",
    "choices": ["Using == instead of ===", "An unused variable", "Inconsistent indentation", "A React hook called inside an if"],
    "answer": 2,
    "explain": "Indentation is purely cosmetic formatting — Prettier's territory. The other three are correctness/quality concerns that ESLint catches."
  },
  {
    "q": "Why can Prettier be deterministic but ESLint cannot?",
    "choices": ["Prettier is written in a faster language", "Prettier has one fixed way to print code; linting is hundreds of separate judgment-call rules", "ESLint runs on the server only", "Prettier doesn't read your code"],
    "answer": 1,
    "explain": "A formatter reprints code one fixed way, so output is identical everywhere. A linter is many independent on/off rules about whether code is correct."
  },
  {
    "q": "What causes the classic ESLint-vs-Prettier fight?",
    "choices": ["Running them in the wrong order", "Both tools having opinions about formatting at the same time", "Using TypeScript", "Forgetting to install Prettier"],
    "answer": 1,
    "explain": "When ESLint's stylistic rules and Prettier both format, they undo each other. The fix is to let Prettier own formatting and turn ESLint's style rules off."
  }
]
```

[← Overview](_guide.md) · [Phase 2: Config and autofix](02-config-and-autofix.md) →
