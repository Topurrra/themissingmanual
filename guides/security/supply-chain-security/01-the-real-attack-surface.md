---
title: "Your code is mostly other people's code"
guide: supply-chain-security
phase: 1
summary: "Your dependencies are your attack surface: the npm install that owned you, lockfiles, typosquatting, and how to trust code you did not write."
tags: [security, supply-chain, dependencies, npm, sbom, ci]
difficulty: intermediate
synonyms: [supply chain attack, npm install hacked, malicious package, typosquatting, dependency confusion, sbom, lockfile security, software supply chain]
updated: 2026-06-30
---

# Your code is mostly other people's code

You ran `npm install`. It printed a wall of green, maybe a deprecation warning, and a friendly "added 1,243 packages in 8s." You moved on. That moment, repeated daily across the industry, is the single most trusting thing most developers do, and almost nobody thinks of it as a trust decision at all.

Here is the reframe: the code *you* wrote is a thin shell. Underneath it sits a mountain of code written by people you have never met, pulled from a server you do not control, executed with the full privileges of your own process. Your authentication logic, your database driver, your date formatter, your tiny "is this string a valid email" helper, all of it runs in the same memory, reads the same environment variables, and reaches the same network as the code you actually reviewed.

## Count what you actually trust

Pull up a real project and look at the gap between what you wrote and what you ship.

```bash
# How many packages are actually installed?
$ find node_modules -name package.json -maxdepth 2 | wc -l
1243

# How many did YOU list as direct dependencies?
$ jq '.dependencies | length' package.json
14
```

*What just happened:* You declared 14 dependencies. You got 1,243. The other ~1,229 are transitive, dependencies of your dependencies, pulled in automatically and silently. You never chose them, you cannot name them, and they run with the same rights as everything else.

This is not a Node problem. Python has the same shape with `pip`, Ruby with `gem`, Rust with `cargo`, every modern ecosystem. The numbers differ, the structure does not: a small chosen surface sitting on a huge unchosen one.

> The mental model to carry: **a dependency is not a feature you borrowed. It is a person you let run code on your machine, plus everyone *they* trust, recursively.**

## Where the trust actually breaks

An attacker does not need to find a bug in your code if they can get *their* code into your dependency tree. There are a handful of well-worn ways they do it. Knowing the names matters, because the defenses in Phase 2 each target one of these.

```text
THE FOUR DOORS

1. Malicious / hijacked package
   A maintainer goes rogue, OR their account gets phished, OR a popular
   package is sold to someone who slips in a payload. Same package name,
   poisoned new version.

2. Typosquatting
   You meant `lodash`. You typed `lodahs`. A package sits at the typo,
   waiting, doing what lodash does PLUS exfiltrating your env vars.

3. Dependency confusion
   Your company has a private package `acme-utils`. An attacker publishes
   a PUBLIC `acme-utils` with a higher version. Your installer, seeing a
   "newer" version, grabs the attacker's.

4. Compromised maintainer infrastructure
   Not the code, the pipeline. Stolen npm token, hijacked CI, a
   build server that injects a payload AFTER the maintainer's clean commit.
```

*What just happened:* Every real-world incident in Phase 3 walks through one of these four doors. They share a theme: the attacker never touches your repository. They touch the supply *upstream* of you, and the poison flows downhill into your `install`.

## The part people forget: install runs code

The dangerous assumption is that downloading a package is passive, like saving a file. It is not. Many ecosystems let a package run scripts *at install time*, before you have imported anything, before your tests, before you have read a single line.

```json
// package.json inside a malicious dependency
{
  "name": "helpful-looking-utility",
  "version": "2.1.0",
  "scripts": {
    "postinstall": "node ./scripts/setup.js"
  }
}
```

*What just happened:* The instant `npm install` finishes fetching this package, it executes `setup.js` automatically. That script runs as you, with your shell, your `~/.aws/credentials`, your `.env`, your SSH keys. "I only installed it, I never used it" is no defense at all, the harm happens at install, not at import.

> [!WARNING]
> A package can do everything *you* can do from a terminal: read files, make network calls, spawn processes. There is no sandbox by default. Treat `npm install <new-thing>` with the same caution you would treat `curl ... | bash`.

## For builders

When you pick a dependency, you are not evaluating one library, you are adopting its entire tree and every maintainer in it. Before you add one, glance at the cost: How many transitive packages does it drag in? When was it last published, and by how many maintainers? A "tiny" utility that pulls 80 sub-dependencies is a bigger trust decision than a slightly larger library with zero. The cheapest supply-chain defense is the dependency you decided not to add. This connects directly to [/guides/secrets-management](/guides/secrets-management), because the thing a malicious package wants most is the credentials sitting in your environment, and to [/guides/owasp-top-10](/guides/owasp-top-10), where vulnerable-and-outdated components are a named category for exactly this reason.

```quiz
[
  {
    "q": "In a typical project with 14 direct dependencies and 1,243 installed packages, who chose the other ~1,229?",
    "choices": [
      "You did, during npm install",
      "Nobody — they are transitive dependencies pulled in automatically by your dependencies",
      "The npm registry curators",
      "Your operating system"
    ],
    "answer": 1,
    "explain": "The ~1,229 extra packages are transitive: dependencies of your dependencies, pulled in silently. You never chose or reviewed them, yet they run with full privileges."
  },
  {
    "q": "Why is 'I installed the package but never imported it' a weak defense?",
    "choices": [
      "Because npm logs every install to a public registry",
      "Because install-time scripts (e.g. postinstall) run automatically, before you import anything",
      "Because unimported packages are deleted automatically",
      "Because importing is the only way code can run"
    ],
    "answer": 1,
    "explain": "Lifecycle scripts like postinstall execute the moment the package is fetched, with your full privileges — no import required."
  },
  {
    "q": "An attacker publishes a PUBLIC package with the same name as your company's PRIVATE package, at a higher version, and your installer grabs it. What is this called?",
    "choices": [
      "Typosquatting",
      "Dependency confusion",
      "A hijacked maintainer account",
      "Cross-site scripting"
    ],
    "answer": 1,
    "explain": "Dependency confusion exploits installers preferring the 'newer' version, pulling the attacker's public package over your intended private one."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Pinning, scanning, and seeing what you ship →](02-everyday-defenses.md)
