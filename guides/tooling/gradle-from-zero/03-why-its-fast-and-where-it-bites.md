---
title: "Why It's Fast, and Where It Bites"
guide: gradle-from-zero
phase: 3
summary: "The flexible build tool behind Java, Kotlin, and Android: tasks and the build graph, the Groovy/Kotlin DSL, dependency configurations, and the build cache."
tags: [gradle, build-tools, java, kotlin, android, jvm]
difficulty: intermediate
synonyms: [gradle tutorial, gradle build, build.gradle, build.gradle.kts, gradle wrapper, gradle vs maven, gradle tasks, gradle dependencies, implementation vs api, gradlew]
updated: 2026-06-30
---

# Why It's Fast, and Where It Bites

The first time you run a Gradle build it's slow — minutes, maybe. The second time, if you changed nothing, it finishes in under a second. That isn't magic and it isn't caching gone wrong. It's the core reason teams tolerate Gradle's complexity: it works hard to never redo work it has already done. This phase explains how that speed actually works, the one file that makes your builds reproducible everywhere, and the gotchas that turn a fast build slow.

## Up-to-date checks: the foundation of speed

Remember from Phase 1 that every task has inputs and outputs. Gradle uses that. Before running a task, it hashes the inputs and outputs and compares them to last time. If nothing changed, it skips the task entirely and marks it `UP-TO-DATE`.

```console
$ ./gradlew build        # first run
> Task :compileJava
> Task :test
BUILD SUCCESSFUL in 47s

$ ./gradlew build        # second run, no changes
> Task :compileJava UP-TO-DATE
> Task :test UP-TO-DATE
BUILD SUCCESSFUL in 0.8s
```

*What just happened:* On the second run, Gradle hashed each task's inputs (your source files, the dependencies, the task settings) and found them identical to the recorded outputs from last time. So it skipped the actual work and reported `UP-TO-DATE`. This is **incremental building**: only the tasks whose inputs actually changed get rerun. Change one `.java` file and only the tasks downstream of it rerun; the rest stay cached.

## The build cache: speed across machines and branches

Up-to-date checks help *one* checkout over time. The **build cache** goes further: it stores task outputs keyed by a hash of their inputs, so a result computed once can be reused by a *different* checkout, a *different* branch, or a *different* machine.

```
# gradle.properties — turn on the build cache for the project
org.gradle.caching=true
```

*What just happened:* With caching enabled, when Gradle is about to run a task it computes the input hash and checks the cache first. A hit means it pulls the prior output instead of recomputing. Switch to a teammate's branch and back, and the tasks you already built come straight from the local cache. Teams point this at a shared remote cache so CI builds and developer laptops reuse each other's compiled output — the first person to compile a given input pays the cost, everyone else gets it free.

> The mental model: up-to-date checks ask "did *I* already do this?" The build cache asks "did *anyone* already do this?" Same input hash, same output, no reason to recompute.

For a task to be cacheable, its inputs and outputs must be fully declared and it must be deterministic — same inputs always produce the same output. A task that reads the system clock or a random value breaks this, which is a classic cause of a build that "should be cached but never is."

## The wrapper: the file that makes "works on my machine" true

Open almost any Gradle project and you'll see `gradlew`, `gradlew.bat`, and a `gradle/wrapper/` folder. This is the **Gradle Wrapper**, and it solves a real pain: everyone needs the *same* Gradle version, or builds drift and break.

```
gradlew                              # Unix launcher script
gradlew.bat                          # Windows launcher script
gradle/wrapper/
├── gradle-wrapper.jar               # the bootstrap code
└── gradle-wrapper.properties        # pins the exact Gradle version
```

```
# gradle/wrapper/gradle-wrapper.properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.7-bin.zip
```

*What just happened:* The wrapper properties file pins the exact Gradle version this project uses. When you run `./gradlew build`, the wrapper script reads that URL, downloads that exact Gradle version if it isn't already present, and runs your build with it. Nobody has to install Gradle by hand, and everybody — your laptop, a new hire, the CI server — uses the identical version. This is why the rule is **always run `./gradlew`, never a globally installed `gradle`**. The wrapper files belong in version control; commit them.

To move the whole team to a new Gradle version, you change it in one place:

```console
$ ./gradlew wrapper --gradle-version 8.8
$ git add gradle/wrapper gradlew gradlew.bat
$ git commit -m "Bump Gradle wrapper to 8.8"
```

*What just happened:* The `wrapper` task rewrote the properties file (and refreshed the scripts) to point at 8.8. You commit the change, and the next time any teammate runs `./gradlew`, they transparently get 8.8. One commit migrates the entire team — no "please install Gradle X" message in the group chat.

## Where it bites: the real gotchas

Gradle's flexibility is also its sharpest edge. The same "it's all code" power that lets you do anything lets you do anything *wrong*.

**Configuration-phase work.** As covered in Phase 1, code in a bare task body runs on *every* build during configuration. Put an expensive operation there — a network call, a file scan — and every single build pays for it, even `./gradlew help`. Symptom: builds feel slow even when nothing changed. Fix: move real work into `doLast` or a proper task action.

**Cache misses from undeclared inputs.** If a task reads a file it didn't declare as an input, Gradle can't see the change and may wrongly report `UP-TO-DATE` — or, if the task is non-deterministic, never cache at all. Symptom: stale outputs, or a task that always reruns. Fix: declare every input and output honestly.

**Reaching for `clean` reflexively.** Coming from other tools, people run `./gradlew clean build` out of habit. But `clean` deletes the build directory, which throws away exactly the up-to-date state that makes Gradle fast — you've forced a full rebuild. Use `clean` only when you genuinely suspect corrupted output, not as a ritual.

```console
$ ./gradlew clean build     # almost always slower than you want
$ ./gradlew build           # let incremental builds do their job
```

*What just happened:* The first command nukes all cached task outputs and rebuilds from scratch, every time. The second lets Gradle skip the unchanged tasks. If your `clean build` is "to be safe," you're paying a tax on every build for a problem you probably don't have.

**Dependency version conflicts.** Two libraries pull in different versions of a third. Gradle picks the highest by default, which is usually right but occasionally surprises you. Symptom: a `NoSuchMethodError` at runtime. Fix: run `./gradlew dependencies` (from Phase 2) to see what was actually resolved, then pin or constrain the version if needed.

## In the wild

A team's build went from forty seconds to four after one change: someone had a JSON config being parsed in a bare `build.gradle` body, so it reparsed on every invocation of every task. Moving it into the task that needed it fixed the configuration-phase tax. The lesson generalizes — when a Gradle build is slow, suspect the configuration phase and undeclared inputs before you suspect Gradle itself. The graph (Phase 1) and `--dry-run` are still your best diagnostic tools. For shipping the artifacts you build, the broader release picture lives over at [/guides/build-and-release-basics](/guides/build-and-release-basics).

```quiz
[
  {
    "q": "What is the difference between Gradle's up-to-date checks and its build cache?",
    "choices": ["They are the same thing", "Up-to-date checks reuse work within one checkout over time; the build cache reuses work across branches and machines by input hash", "The build cache only works on CI", "Up-to-date checks require gradle.properties"],
    "answer": 1,
    "explain": "Up-to-date asks 'did I already do this in this checkout?' The build cache asks 'did anyone already do this?' and shares outputs across branches and machines."
  },
  {
    "q": "Why should you always run ./gradlew instead of a globally installed gradle?",
    "choices": ["It is shorter to type", "The wrapper pins and downloads the exact Gradle version the project expects, so everyone builds identically", "Global gradle is deprecated", "It enables the build cache automatically"],
    "answer": 1,
    "explain": "The wrapper reads gradle-wrapper.properties to use the exact version the project pins, so laptops, new hires, and CI all use the same Gradle."
  },
  {
    "q": "A teammate runs './gradlew clean build' on every change 'to be safe.' What is the cost?",
    "choices": ["No cost, it is best practice", "clean deletes the build directory, discarding the up-to-date state that makes incremental builds fast, forcing a full rebuild", "It corrupts the build cache", "It changes the Gradle version"],
    "answer": 1,
    "explain": "clean wipes cached task outputs, so every build starts from scratch. Use it only when you suspect corrupted output, not as a ritual."
  }
]
```

[← Phase 2](02-the-build-script-you-live-in.md) | [Overview](_guide.md)
