---
title: "The terrible day, and what stops it"
guide: supply-chain-security
phase: 3
summary: "Your dependencies are your attack surface: the npm install that owned you, lockfiles, typosquatting, and how to trust code you did not write."
tags: [security, supply-chain, dependencies, npm, sbom, ci]
difficulty: intermediate
synonyms: [supply chain attack, npm install hacked, malicious package, typosquatting, dependency confusion, sbom, lockfile security, software supply chain]
updated: 2026-06-30
---

# The terrible day, and what stops it

Every defense in Phase 2 sounds like overhead until the morning it would have saved you. So let's spend this phase in the aftermath of real incidents, the kind that have actually happened to real teams, told as the bad days they were. For each one: how the attacker got in, what it cost, and the specific habit that would have shortened or stopped it. None of these are hypothetical genres. They are the doors from Phase 1, kicked in.

## The terrible day: the dependency you trusted turned

Picture the maintainer of a tiny, beloved utility, the kind of package that does one small thing and is depended on by thousands of bigger packages, which are depended on by millions of apps. One day a "helpful new contributor" offers to take over maintenance. The tired maintainer, who never wanted the burden, hands over the keys. A few weeks later, a new version ships with an obfuscated payload buried in it. This exact shape has played out more than once in the npm ecosystem (the `event-stream` incident is the textbook case).

```text
THE CHAIN

  attacker gains publish rights to  tiny-popular-lib
        |
  publishes  tiny-popular-lib@3.3.6  (looks normal, has payload)
        |
  big-framework  depends on ^3.3.0  → resolves to 3.3.6 automatically
        |
  YOUR app runs `npm install` next Tuesday → payload runs as you
```

*What just happened:* You never depended on `tiny-popular-lib` directly. You never even heard its name. A version range four levels up resolved to the poisoned release, and because your install was not pinned, your next routine `npm install` pulled it in. The payload typically reaches for what is nearby: environment variables, tokens, wallet keys, `.npmrc` credentials.

**What would have stopped or shrunk it:** a committed lockfile means your build keeps using the known-good resolved version until *you* deliberately update, and that update shows as a reviewable diff. The hash in the lockfile means a swapped tarball fails the install. And least-privilege secrets (next section) mean that even on the machine where it *did* run, there is far less worth stealing.

## The terrible day: you typed it wrong

A developer in a hurry runs an install. Their finger slips, or autocomplete betrays them, and they fetch a package one character off from the real one. The typosquat is a working copy of the real library, so nothing looks broken, the app runs fine. In the background, its install script has already shipped the contents of `.env` to a server in who-knows-where.

```bash
# What they meant:
$ npm install crossenv

# Wait — the real one is `cross-env`. `crossenv` was a known typosquat.
# It bundled the real behavior PLUS stole environment variables on install.
```

*What just happened:* The malicious package worked correctly *as a library*, which is exactly why it survived, the developer's code passed its tests. The damage happened silently at install time, before any test ran. Typosquats cluster around the most popular packages precisely because slips on those names are most common.

**What would have stopped or shrunk it:** copy-paste the exact name from the official docs instead of typing it; review the lockfile diff (`crossenv` appearing where you expected `cross-env` is glaring once you look); and `--ignore-scripts` on first install of anything unfamiliar would have neutered the exfiltration script entirely.

## The terrible day: the build server, not the code

This one is the worst because the source code is clean. A maintainer commits perfectly fine code. But the build pipeline that turns that code into a published artifact has been compromised, a stolen CI token, a poisoned build step, and the payload is injected *after* the clean commit, into the binary or bundle that actually ships. (The SolarWinds breach is the famous large-scale version of this shape.)

```text
clean source commit  ✓
        |
  [ compromised build server injects payload here ]
        |
  signed, published artifact  ✗  ← looks official, is poisoned
        |
  every customer who updates  ✗
```

*What just happened:* Auditing the source repository would have found *nothing*, because the source was never the problem. The trust boundary that failed was the build infrastructure and the credentials it held. This is why supply-chain security is not only about *which* packages you pick, but about protecting the pipeline that produces your *own* releases.

**What would have stopped or shrunk it:** treating CI like production, least-privilege tokens, signed builds with verifiable provenance, and reproducible builds so an injected payload shows up as a mismatch. Which brings us to the lever you most control.

## The one knob that limits every blast radius: least privilege in CI

You cannot guarantee a dependency will never turn malicious. What you *can* control is how much that malicious code can do once it runs. The biggest, most common mistake is handing CI a token that can do everything.

```yaml
# DANGEROUS: a CI job with god-mode credentials in the environment
env:
  NPM_TOKEN: ${{ secrets.NPM_PUBLISH_TOKEN }}   # can publish ANY package
  AWS_ACCESS_KEY_ID: ${{ secrets.PROD_ADMIN }}  # full prod admin, always present
```

*What just happened:* Now *every* package in that build, all 1,243 of them, runs with the power to publish packages as you and administer your production cloud. A single poisoned `postinstall` script in any transitive dependency inherits all of it. You handed the keys to the entire tree.

```yaml
# BETTER: scoped, short-lived, present only where needed
permissions:
  contents: read            # the job can read the repo, nothing more
jobs:
  publish:
    # publish credentials exist ONLY in this one job, ONLY at release time
    environment: release
    steps:
      - run: npm publish --provenance   # short-lived OIDC token, not a long-lived secret
```

*What just happened:* The build-and-test job no longer has any publish or prod credentials at all, so a malicious install script there finds nothing worth stealing. The powerful credential exists only in the `publish` job, only during a release, and ideally as a short-lived OIDC token rather than a long-lived secret sitting in a variable. Same attack, drastically smaller blast radius.

> [!TIP]
> Audit your CI secrets by asking, for each one: "if a random transitive dependency read this during a build, how bad would it be?" Anything that answers "catastrophic" should not be present in the test job at all. Push it into a separate, gated, minimal job.

## The survivable response

When you suspect a compromise, the order of operations matters more than the speed. Panic-deleting things destroys the evidence you need.

```text
1. CONTAIN   Revoke the credentials that build/CI could reach. Assume
             anything in that environment is now the attacker's.
2. ASSESS    Use your SBOM + lockfile to find exactly which version
             you ran, where, and for how long.
3. ERADICATE Pin to a known-good version, purge caches, rebuild clean.
4. RECOVER   Rotate every secret the malicious code could have seen.
5. LEARN     Write down which door it came through and which gate was open.
```

*What just happened:* Notice that steps 1 and 4 are about *secrets*, and step 2 is impossible without the *SBOM and lockfile* from Phase 2. The work you did on a calm Tuesday is what makes the terrible day survivable instead of catastrophic. A team with pinned dependencies, an SBOM, and least-privilege tokens spends the incident doing lookups and rotations. A team without them spends it guessing.

## For builders

Run the drill once before you need it: pretend a package you ship turned malicious last night, and try to answer "which version, where, for how long, and what could it have stolen?" The gaps you hit are your real backlog. Tie this to [/guides/secrets-management](/guides/secrets-management) for the rotation and short-lived-credential muscles, and to [/guides/owasp-top-10](/guides/owasp-top-10) where vulnerable-and-outdated components and software-integrity failures are named risks. The whole discipline reduces to one sentence: you will run code you did not write, so make sure you can *see* it, *pin* it, and *limit* what it can do.

```quiz
[
  {
    "q": "In the hijacked-maintainer scenario, why did a poisoned version reach an app that never directly depended on the tiny library?",
    "choices": [
      "The app's firewall was misconfigured",
      "A version range several levels up resolved to the poisoned release, and the install was not pinned to a known-good version",
      "The library was preinstalled with the operating system",
      "The developer manually installed it"
    ],
    "answer": 1,
    "explain": "Unpinned transitive ranges resolve to whatever is 'newest in range' — including a freshly poisoned release — which is exactly what a committed lockfile prevents."
  },
  {
    "q": "Why is putting a long-lived prod-admin token in the build-and-test CI job dangerous?",
    "choices": [
      "It slows the build down",
      "Every dependency in that build — including malicious install scripts — runs with access to that token's full power",
      "Tokens expire too quickly to be useful there",
      "It is only dangerous if the repo is public"
    ],
    "answer": 1,
    "explain": "A token in the environment is available to all code that runs there, including a poisoned transitive postinstall. Least privilege keeps powerful credentials out of the test job."
  },
  {
    "q": "During incident response, why is revoking credentials the first step rather than deleting the suspicious package?",
    "choices": [
      "Deleting packages is impossible",
      "Containing access stops ongoing theft and preserves evidence, while deleting first can destroy what you need to assess the scope",
      "Credentials cannot be revoked once leaked",
      "The package deletes itself automatically"
    ],
    "answer": 1,
    "explain": "Contain first: revoke reachable credentials to stop the bleeding and assume the environment is compromised, then assess scope with your SBOM and lockfile before eradicating."
  }
]
```

[← Phase 2](02-everyday-defenses.md) | [Overview](_guide.md)
