---
title: "Pinning, scanning, and seeing what you ship"
guide: supply-chain-security
phase: 2
summary: "Your dependencies are your attack surface: the npm install that owned you, lockfiles, typosquatting, and how to trust code you did not write."
tags: [security, supply-chain, dependencies, npm, sbom, ci]
difficulty: intermediate
synonyms: [supply chain attack, npm install hacked, malicious package, typosquatting, dependency confusion, sbom, lockfile security, software supply chain]
updated: 2026-06-30
---

# Pinning, scanning, and seeing what you ship

You cannot read five thousand packages. Good news: you do not have to. The everyday defense is not heroic auditing, it is a handful of habits that make your dependency tree *boring and visible*. Boring means it does not change without you noticing. Visible means you can answer, at any moment, "exactly what is in here, and does any of it have a known hole?" That is the whole game for the normal Tuesday.

## Pin it, or it isn't pinned

Open a `package.json` and you will see version ranges, not versions.

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "~1.6.0"
  }
}
```

*What just happened:* The carets and tildes are *ranges*, not pins. `^4.18.2` means "any 4.x at or above 4.18.2." So two developers, or your laptop and the CI server, can run `npm install` an hour apart and get *different* code. That gap is exactly where a freshly poisoned patch release sneaks in.

The fix is the lockfile. It records the exact resolved version *and a cryptographic hash* of every package, direct and transitive.

```text
# inside package-lock.json (npm) — one entry, simplified
"node_modules/axios": {
  "version": "1.6.2",
  "resolved": "https://registry.npmjs.org/axios/-/axios-1.6.2.tgz",
  "integrity": "sha512-7Pj1...exact-hash-of-this-tarball..."
}
```

*What just happened:* The lockfile nails `axios` to `1.6.2` and stores the `integrity` hash. If the registry ever serves a tarball that does not match that hash, the install fails loudly instead of silently accepting tampered bytes. The lockfile is your "nothing changed without me knowing" guarantee.

But the guarantee only holds if you *use* it correctly. The plain install command will happily update the lockfile. In automation, you want the strict mode that refuses to.

```bash
# Local dev: may update the lockfile (fine, you're choosing to)
$ npm install

# CI / production: FAIL if anything doesn't match the lockfile exactly
$ npm ci
```

*What just happened:* `npm ci` installs strictly from the lockfile and errors out if `package.json` and the lockfile disagree, or if a hash is wrong. The equivalents elsewhere are the same idea: `pip install -r requirements.txt` with hashes, `poetry install --no-update`, `cargo build --locked`, `bundle install --frozen`. Rule of thumb: **lockfile in version control, strict install in CI.**

> [!TIP]
> Commit your lockfile. A lockfile that is gitignored is a lockfile that protects no one. Reviewers should see lockfile changes in the diff, that diff is often the first place a sketchy version bump becomes visible.

## Scan for the holes you already know about

Pinning stops *silent* changes. It does nothing about a version you pinned that turns out to have a public vulnerability. For that, scan against the known-vulnerability databases.

```bash
$ npm audit

found 3 vulnerabilities (1 moderate, 2 high)
  high  Prototype Pollution in lodash  <4.17.21
        fix available via `npm audit fix`
```

*What just happened:* `npm audit` cross-referenced your locked versions against a database of disclosed flaws and found a `lodash` with a known prototype-pollution bug. The equivalents: `pip-audit` for Python, `cargo audit` for Rust, `bundle audit` for Ruby, or a cross-ecosystem tool. None of these find *unknown* attacks, they find *published* ones, which is most of what actually bites people.

The trap with scanners is alert fatigue. A "high" deep in a transitive dev-only tool that never touches production is not the same as a "high" in your request handler. Triage on two axes:

```text
DOES IT REACH PRODUCTION?   IS THERE A REACHABLE PATH TO THE BUG?
        |                              |
   yes  |  no                     yes  |  no
   -----+-----                   -----+-----
  FIX   | note &                 FIX   | lower priority
  NOW   | defer                  NOW   | (still patch when easy)
```

*What just happened:* A vulnerability only matters if attacker-controlled input can actually reach the flawed code in a deployed path. Fix the ones that do, first. Do not let a wall of dev-dependency criticals bury the one that is genuinely exploitable.

## Read the install scripts before you run them

Phase 1 showed that `postinstall` runs code automatically. You can put a gate in front of that.

```bash
# See which packages even HAVE install scripts (npm 9+ style)
$ npm install --ignore-scripts

# Then, deliberately, allow only what you trust to run its scripts
```

*What just happened:* `--ignore-scripts` installs everything but refuses to execute lifecycle scripts. Some legitimate packages (native modules that compile on install) genuinely need them, so you cannot leave this on blindly forever, but it turns "every package runs arbitrary code on my laptop" into "I decide which ones do." For a new or suspicious dependency, installing with scripts ignored and reading the script yourself first is cheap insurance.

> [!WARNING]
> The riskiest moment is adding a *new* dependency you have not used before. That is the install where a typosquat or a fresh hijack does its damage. Slow down for the first install of anything unfamiliar.

## Know exactly what you ship: the SBOM

When something does go wrong upstream, say a CVE drops in `log4j`-style at 2am, the only question that matters is "are we affected, and where?" If your answer is "let me grep around for a while," you have already lost hours. The fix is a **Software Bill of Materials**: a machine-readable manifest listing every component and version in your build.

```bash
# Generate an SBOM in a standard format (CycloneDX example)
$ npm sbom --sbom-format cyclonedx > sbom.json

# Now answering "do we ship the bad version?" is one query
$ jq '.components[] | select(.name=="log4j-core") | .version' sbom.json
"2.14.1"
```

*What just happened:* The SBOM turned a frantic codebase-wide hunt into a single lookup. You shipped `log4j-core 2.14.1`, you know it instantly, across every service that has an SBOM. SBOMs come in standard formats (CycloneDX, SPDX) so tools can ingest them, and increasingly customers and regulators ask for one. Generate it as part of your build and store it with the release artifact, an SBOM you produce only during the incident is too late.

## For builders

Wire these into the pipeline, not your memory. Make CI run the strict install (`npm ci` and friends), run the audit and fail on high-severity reachable issues, and emit an SBOM as a build artifact. The point is that the *machine* enforces "boring and visible," so a tired human at the end of a sprint cannot accidentally ship an unpinned, unscanned, unknown tree. Pair this with [/guides/secrets-management](/guides/secrets-management): even a perfect scan will not catch a brand-new malicious package, so the credentials it could steal should be scoped and short-lived in the first place.

```quiz
[
  {
    "q": "What is the practical difference between `npm install` and `npm ci` for a CI pipeline?",
    "choices": [
      "`npm ci` is faster but otherwise identical",
      "`npm ci` installs strictly from the lockfile and fails on any mismatch, while `npm install` may update the lockfile",
      "`npm ci` skips transitive dependencies",
      "`npm install` is for production and `npm ci` is for development"
    ],
    "answer": 1,
    "explain": "`npm ci` enforces the lockfile exactly and errors on mismatches or bad hashes — the strict, reproducible install you want in automation."
  },
  {
    "q": "A scanner reports a 'high' vulnerability in a transitive dev-only dependency that never runs in production. What is the right first move?",
    "choices": [
      "Treat it identically to a high in your production request handler",
      "Triage by reachability: confirm whether attacker input can reach it, and prioritize production-reachable issues first",
      "Ignore all scanner output as noise",
      "Immediately delete the dependency without checking"
    ],
    "answer": 1,
    "explain": "Severity is not the same as exploitability. Prioritize vulnerabilities on a path that reaches production with reachable attacker input."
  },
  {
    "q": "When a critical CVE drops in a widely-used component at 2am, what makes an SBOM valuable?",
    "choices": [
      "It automatically patches the vulnerability",
      "It encrypts your dependencies",
      "It lets you answer 'do we ship the affected version, and where?' with a single lookup instead of a frantic hunt",
      "It blocks the package from installing"
    ],
    "answer": 2,
    "explain": "An SBOM is a precomputed manifest of every component and version, turning incident triage into a fast query rather than a codebase-wide search."
  }
]
```

[← Phase 1](01-the-real-attack-surface.md) | [Overview](_guide.md) | [Phase 3: The terrible day, and what stops it →](03-when-it-breaks.md)
