---
title: "Installing, Updating, and Workspaces"
guide: "npm-pnpm-yarn"
phase: 2
summary: "The everyday commands across npm, pnpm, and Yarn; how semver caret and tilde ranges decide what an update actually changes; and how workspaces hold many packages in one repo."
tags: [npm, pnpm, yarn, install, update, semver, caret, tilde, workspaces, monorepo, scripts]
difficulty: intermediate
synonyms: ["npm install vs add", "what does caret mean in version", "tilde vs caret semver", "npm update vs install", "how to add a dev dependency", "pnpm workspaces monorepo", "yarn workspaces", "run script in workspace", "semver range meaning"]
updated: 2026-06-30
---

# Installing, Updating, and Workspaces

You'll spend most of your package-manager life in about six commands. The good news: npm, pnpm, and Yarn share the same shape, so learning one mostly teaches you all three. The part that actually trips people isn't the commands - it's the tiny version symbols (`^`, `~`) that quietly decide whether tomorrow's install upgrades half your tree. We'll get the commands out of the way fast, then slow down on the part that bites.

## The everyday commands, side by side

Three managers, the same handful of jobs. Here's the translation table you can keep on a sticky note:

```text
job                         npm                      pnpm                  yarn
--------------------------  -----------------------  --------------------  --------------------
install everything (lock)   npm install              pnpm install          yarn install
add a runtime dependency    npm install express      pnpm add express      yarn add express
add a dev-only dependency   npm install -D vitest    pnpm add -D vitest    yarn add -D vitest
remove a dependency         npm uninstall express    pnpm remove express   yarn remove express
run a script                npm run dev              pnpm dev              yarn dev
update within ranges        npm update               pnpm update           yarn upgrade
```

*What just happened:* the verbs differ (`install` vs `add`, `uninstall` vs `remove`) but the model is identical. Adding a dependency does three things at once: downloads it, writes it into `package.json`, and updates the lockfile. The `-D` flag (short for `--save-dev`) sends it to `devDependencies` instead of `dependencies` - use it for anything that doesn't ship to production: test runners, bundlers, linters, type definitions.

📝 **Terminology.** `npm install` with no package name means "install the whole tree from the manifest/lock." `npm install <name>` means "add this one package." Same command, two jobs, decided by whether you name a package. pnpm and Yarn split these more clearly with `install` versus `add`.

## Semver: the version numbers have grammar

Every version is three numbers: `MAJOR.MINOR.PATCH`, like `4.19.2`. This is **semantic versioning** - semver - and the promise behind it is what makes ranges safe-ish:

- **PATCH** (`4.19.2` → `4.19.3`): bug fixes only. Nothing you use should change behavior.
- **MINOR** (`4.19.2` → `4.20.0`): new features added, but old code keeps working (backward-compatible).
- **MAJOR** (`4.19.2` → `5.0.0`): breaking changes. Your code might need edits.

The promise: a properly versioned package only breaks you on a MAJOR bump. The range symbols in `package.json` are you telling the resolver *how far you trust that promise.*

```text
"express": "4.19.2"     exact      → only 4.19.2, nothing else
"express": "~4.19.2"    tilde      → 4.19.x  (patch updates only: 4.19.2, 4.19.3, ...)
"express": "^4.19.2"    caret      → 4.x.x   (minor + patch: up to but not 5.0.0)
"express": "*"          wildcard   → anything (don't)
```

*What just happened:* the caret `^` - the default when you run `npm install express` - allows minor and patch upgrades but stops before the next major. The tilde `~` is stricter: patch only. Both bet on semver being honored. The caret bets *more*, because it lets in new minor versions you've never tested.

⚠️ **Gotcha - the surprise upgrade.** This is the classic 2am story. Your `package.json` says `^4.19.2`. It's worked for months. A teammate (or CI on a fresh machine with no lockfile, or you after deleting the lock) runs an install, and because the caret allows it, they pull in `4.25.0` that shipped last week - which has a regression. Nothing in *your* code or `package.json` changed. The lockfile is exactly what prevents this: with the lock committed and respected, the range is only consulted *once*, when a version is first resolved. After that, everyone installs the pinned version. **The caret is your ceiling; the lockfile is your floor.**

## install vs update - they are not the same

This catches everyone, so be precise:

- **`npm install`** (with a lockfile present) installs *exactly what the lockfile says*. It does **not** go looking for newer versions. It respects the pin.
- **`npm update`** deliberately moves dependencies *up to the newest version your ranges allow*, and **rewrites the lockfile** to the new pins.

```console
$ npm update
changed 6 packages in 1s

$ git diff package-lock.json
-      "version": "4.19.2",
+      "version": "4.20.1",
```

*What just happened:* `npm update` walked your ranges, found newer versions within them (a caret let `4.19.2` move to `4.20.1`), installed them, and edited the lockfile. This is the *intended* way to take upgrades: run it on purpose, review the lockfile diff, run your tests, commit. The danger is never `update` itself - it's an *accidental* upgrade from a missing or ignored lockfile, which we close off for good in [Phase 3](03-store-and-gotchas.md).

📝 **Terminology.** To cross a *major* version (`4.x` → `5.x`) you can't use `update` - the caret won't allow it. You change `package.json` yourself (or run `npm install express@5`), then read the package's migration notes, because a major bump means something will break on purpose.

## Workspaces: many packages, one repo

Real projects rarely stay a single package. You end up with a web app, a shared UI library, and a backend that all live together and depend on each other. **Workspaces** let one repository hold multiple packages and wire them up locally - the foundation of a *monorepo*.

You declare the member packages in the root `package.json` (npm and Yarn) or in a `pnpm-workspace.yaml` (pnpm):

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["packages/*", "apps/*"]
}
```

```yaml
# pnpm-workspace.yaml (pnpm uses this instead)
packages:
  - "packages/*"
  - "apps/*"
```

*What just happened:* the root is marked `"private": true` (a workspace root is never published) and points at folders of packages. Now one install at the root resolves *all* of them at once, and when `apps/web` depends on `packages/ui`, the manager links the local `ui` directly instead of downloading a published copy. Edit `ui`, and `web` sees the change immediately - no publish step.

Running a script in a specific member:

```console
$ pnpm --filter web dev          # pnpm: run "dev" in the web package
$ npm run test --workspace=ui    # npm: run "test" in the ui package
$ yarn workspace ui test         # yarn: same, yarn syntax
```

*What just happened:* each manager has its own flag for "do this in that member" - pnpm's `--filter`, npm's `--workspace`, Yarn's `workspace` subcommand. Same idea, three spellings. This is how you build or test one app in a big repo without touching the others.

⚠️ **Gotcha.** A workspace links local packages by their declared version range too. If `apps/web` depends on `"ui": "^1.0.0"` but your local `ui` is at `2.1.0`, the range won't match and the manager may try to fetch `ui` from the registry (and fail, if it was never published). For internal-only packages, point workspace dependents at the local version explicitly - pnpm offers `"ui": "workspace:*"` to mean "always the local one, whatever its version."

## In the wild

Big JavaScript codebases lean hard on workspaces. A typical setup keeps shared code (design system, API client, config) in `packages/` and deployable things in `apps/`, with one lockfile at the root governing the entire tree. It's the same reason monorepos exist anywhere: one install, one consistent dependency set, atomic changes across packages. The package manager is doing the unglamorous wiring that makes it hold together.

## Recap

1. The three managers share one model - **install / add / remove / run / update** - with different verbs (`install` vs `add`, etc.).
2. **Semver is `MAJOR.MINOR.PATCH`**; the promise is that only a MAJOR bump may break you.
3. **Caret `^` allows minor + patch; tilde `~` allows patch only.** The caret is the source of the classic *surprise upgrade* - and the committed lockfile is what neutralizes it.
4. **`install` respects the lockfile; `update` deliberately moves up within ranges and rewrites the lock.** Take upgrades on purpose, then review the diff and test.
5. **Workspaces** put many packages in one repo and link them locally - the backbone of a monorepo.

Next, the part everyone has *felt* but few have had explained: why `node_modules` ballooned, how pnpm makes installs fast and strict at once, and the traps that catch every team.

```quiz
[
  {
    "q": "In package.json, what does \"express\": \"^4.19.2\" allow?",
    "choices": [
      "Only the exact version 4.19.2",
      "Patch updates only, up to 4.19.x",
      "Minor and patch updates, up to but not including 5.0.0",
      "Any version including 5.x and beyond"
    ],
    "answer": 2,
    "explain": "The caret allows minor and patch upgrades but stops before the next major. So 4.20.0 and 4.25.3 are fine, but 5.0.0 is not - that would be a breaking change."
  },
  {
    "q": "With a committed lockfile present, what does a plain install do versus update?",
    "choices": [
      "Both install the newest versions in range",
      "Install respects the locked versions; update moves up within ranges and rewrites the lock",
      "Install rewrites the lock; update only reads it",
      "They are aliases for the same operation"
    ],
    "answer": 1,
    "explain": "Install honors the pins in the lockfile and does not seek newer versions. Update intentionally pulls the newest versions your ranges allow and updates the lockfile to match."
  },
  {
    "q": "What problem do workspaces solve?",
    "choices": [
      "They encrypt node_modules",
      "They let one repo hold multiple packages and link interdependent ones locally",
      "They replace the lockfile",
      "They convert npm projects to pnpm automatically"
    ],
    "answer": 1,
    "explain": "Workspaces are the monorepo foundation: many packages in one repo, one install resolving all of them, and local packages linked directly so edits are seen immediately without publishing."
  }
]
```

---

[← Phase 1: The Manifest and the Lockfile](01-manifest-and-lockfile.md) · [Guide overview](_guide.md) · [Phase 3: node_modules, the pnpm Store, and the Gotchas →](03-store-and-gotchas.md)
