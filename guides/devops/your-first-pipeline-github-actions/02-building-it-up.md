---
title: "Building It Up"
guide: "your-first-pipeline-github-actions"
phase: 2
summary: "A real .github/workflows/ci.yml that checks out your code, sets up the language, installs dependencies, and runs tests — every line explained, with a green run log and a failing one so you can read both."
tags: [github-actions, ci, ci-yml, checkout, setup-node, npm, tests, workflow]
difficulty: intermediate
synonyms: ["write a ci.yml file", "github actions run tests on push", "actions/checkout setup-node example", "how to read a github actions log", "what does actions/checkout do"]
updated: 2026-07-10
---

# Building It Up

With the mental model in hand — event → jobs → steps on a runner — let's build a workflow that earns its place: one that actually runs your test suite on every push and pull request. We'll write it one step at a time, explaining what each line *means*, not just what to type. Then we'll read a passing run and a failing run, because reading the log is half the skill.

The example uses a Node.js project, because it's the most common starting point and the steps are short. The *shape* is identical for any language — only the "set up the language" and "install dependencies" steps change, and we'll note the swaps as we go.

## The whole file first

Here's the complete `.github/workflows/ci.yml`. Don't worry about the details yet — we'll take it apart line by line right after. Seeing the destination first makes the pieces easier to place.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Check out the code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
```

*What just happened:* That's a real, working CI pipeline. On every push to `main` and every pull request, GitHub spins up a fresh Ubuntu runner and runs four steps in order: get the code, install Node, install the project's packages, run the tests. Tests pass and the job goes green; any step exits with an error and the job goes red and stops. Now let's understand each step well enough that you could have written it yourself.

## The header — when and where (lines 1–10)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
```

*What just happened:* This is everything from Phase 1, now doing real work. `name: CI` is the label in the Actions tab. The `on:` block triggers on pushes to `main` and on any pull request. `jobs:` opens the list of jobs; `test:` is our one job; `runs-on: ubuntu-latest` asks for a fresh Ubuntu runner. The four steps below all run on that one machine, in order.

## Step 1 — check out the code (the one nobody can skip)

```yaml
      - name: Check out the code
        uses: actions/checkout@v4
```

**What it actually is.** Remember from Phase 1: the runner starts *empty*. It does not have your repository on it. `actions/checkout` is the official action whose entire job is to clone your repo onto the runner and switch it to the exact commit being tested.

**Why people get this wrong.** This is the number-one "why is my workflow failing" mystery for beginners. They write `run: npm test` as the first step, the runner says `package.json not found`, and they're baffled — *the file is right there in my repo!* It's there in your repo, yes, but not yet on this blank machine. Without a checkout step, the runner has nothing of yours to test.

*What just happened:* `uses: actions/checkout@v4` runs the version-4 release of the official checkout action. The `@v4` part pins which version you want — always pin to a major version like `@v4` so a future breaking change to the action doesn't silently alter your pipeline. After this step, your project's files exist on the runner and everything after it can see them. The `name:` line is optional but makes the log readable; without it the step is labeled with the raw `uses:` value.

📝 **Terminology.** `actions/checkout` reads as *owner/repo* on GitHub — it's an action published in the `actions` organization. `with:` (which the next step uses) passes inputs *to* an action, like arguments to a function.

## Step 2 — set up the language

```yaml
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
```

**What it actually is.** The runner comes with *some* version of Node already, but you don't want to depend on whatever happens to be there — it can change without warning. `actions/setup-node` installs the exact Node version you ask for and puts it on the runner's `PATH`, so the commands you run next use *that* version.

*What just happened:* This installs Node.js 20 on the runner and makes `node` and `npm` point to it. The `with:` block passes the input `node-version: "20"` to the action — quote the version so YAML reads it as text, not a number (an unquoted `20.10` would be misread). This is the step that changes per language: Python uses `actions/setup-python` with `python-version`, Go uses `actions/setup-go`, and so on. Same idea every time — pin the language version so your CI is reproducible.

⚠️ **Gotcha.** Pin a real, specific major version (`"20"`), not a moving target you don't control. If you let the language version drift, a test that passes today can fail next month for reasons that have nothing to do with your code — and chasing *that* down is a genuinely bad afternoon.

## Step 3 — install dependencies

```yaml
      - name: Install dependencies
        run: npm ci
```

**What it actually is.** This is a `run:` step — a plain shell command, not an action. `npm ci` ("clean install") installs the project's dependencies *exactly* as locked in your `package-lock.json`, deleting any existing `node_modules` first.

**Why `npm ci` and not `npm install`?** `npm install` can quietly *update* your lockfile to newer versions that satisfy your ranges. In CI you want the opposite: install precisely what the lockfile says, every time, so the build is reproducible and a surprise dependency bump can't break a run. `npm ci` fails loudly if the lockfile and `package.json` disagree — exactly the safety you want here. (For Python this step might be `pip install -r requirements.txt`; for Go, `go mod download` — same principle: install pinned dependencies deterministically.)

*What just happened:* The runner downloaded and installed every package your project needs, matching the lockfile. After this step, `node_modules/` exists on the runner and your tests have everything they need to run.

## Step 4 — run the tests

```yaml
      - name: Run tests
        run: npm test
```

**What it actually is.** Another `run:` step. `npm test` executes whatever you've defined under `"test"` in your `package.json` scripts — your actual test command.

💡 **Key point.** A step succeeds or fails based on its **exit code**: `0` means success, anything else means failure. Test runners follow this convention — they exit non-zero when a test fails. That's the entire mechanism behind the green check and red X: GitHub just watches whether each step exited `0`. If `npm test` exits non-zero, this step fails, the job stops, and the run goes red.

*What just happened:* The runner ran your test suite. Every test passing means the command exited `0`, the step went green, and — since it's the last step — the whole job went green. Any test failing means the command exited non-zero, this step (and the job) went red, and any steps after it would have been skipped.

## Reading a passing run

After you commit this file and push, open the **Actions** tab on GitHub, click the run, then the `test` job. You'll see something like this:

```console
Set up job
✓ Check out the code
✓ Set up Node.js
✓ Install dependencies
✓ Run tests

  > my-project@1.0.0 test
  > vitest run

   ✓ src/math.test.js (3 tests) 8ms

   Test Files  1 passed (1)
        Tests  3 passed (3)

Post Run actions/checkout@v4
Complete job
```

*What just happened:* Each step ran in order and got a green check. The `Run tests` step expanded to show your test runner's own output — 3 tests, all passing. `Set up job` and `Complete job` are GitHub provisioning and tearing down the runner around your steps. A clean run like this is what produces the green check mark on your commit or PR.

## Reading a failing run — the more useful skill

Green runs teach you nothing. The day that matters is when it's red. Here's the same workflow when one test breaks:

```console
Set up job
✓ Check out the code
✓ Set up Node.js
✓ Install dependencies
✗ Run tests

  > my-project@1.0.0 test
  > vitest run

   ❯ src/math.test.js (3 tests | 1 failed) 11ms
     ✓ adds two numbers
     ✗ subtracts two numbers
       → expected 1 to be 2

   Test Files  1 failed (1)
        Tests  1 failed | 2 passed (3)

Error: Process completed with exit code 1.
Complete job
```

*What just happened:* The first three steps passed, so your code checked out, Node installed, and dependencies installed fine — the problem is in the code itself. `Run tests` is the one with the red ✗. Read it top-down: the test `subtracts two numbers` failed, `expected 1 to be 2`. The crucial last line — `Error: Process completed with exit code 1` — is GitHub telling you the command exited non-zero, which is *why* the step is red.

The discipline that saves you: **find the first red step and read its output, ignore everything after.** A later step being skipped or red is usually just a consequence of the first failure. Ninety percent of "debugging CI" is scrolling to the first ✗ and reading the actual error underneath it — which, almost always, is your test runner telling you exactly what's wrong.

⚠️ **Gotcha.** If the *checkout* or *install* step is the red one (not your tests), the failure is about the environment, not your code: a bad lockfile, a private dependency the runner can't reach, or a wrong language version. The fix lives in the workflow or your dependencies, not in your test files. Knowing *which* step went red tells you *where* to look.

## Recap

1. **`actions/checkout@v4`** clones your repo onto the empty runner — without it, nothing works.
2. **`actions/setup-node@v4` (`with: node-version`)** installs a pinned language version; swap for `setup-python`, `setup-go`, etc.
3. **`npm ci`** installs dependencies deterministically from the lockfile — reproducible, unlike `npm install`.
4. **`npm test`** runs your suite; a non-zero **exit code** is what turns a step (and the run) red.
5. To debug a red run, **find the first red step and read its output** — that's where the truth is.

You now have a working pipeline and can read its verdicts. Next, we make it fast and trustworthy: caching, testing multiple versions, secrets, and blocking bad merges.

---

[← Phase 1: The Anatomy of a Workflow](01-anatomy-of-a-workflow.md) · [Guide overview](_guide.md) · [Phase 3: Beyond the Basics →](03-beyond-the-basics.md)
