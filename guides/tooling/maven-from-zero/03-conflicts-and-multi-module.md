---
title: "Production reality: conflicts, the local repo, and multi-module"
guide: maven-from-zero
phase: 3
summary: "Java's build tool and dependency manager: the POM, the build lifecycle, coordinates and repositories, and why 'it works on Maven Central' is the default."
tags: [maven, java, build-tools, dependency-management, pom]
difficulty: intermediate
synonyms: ["maven tutorial", "what is pom.xml", "maven dependencies explained", "maven build lifecycle", "maven central", "mvn install vs deploy", "transitive dependencies java", "multi-module maven"]
updated: 2026-06-30
---

# Production reality: conflicts, the local repo, and multi-module

Everything in phase 2 works on a clean, small project. The trouble starts when your dependencies have dependencies, when the local repo holds a stale or corrupt jar, and when one project grows into several that depend on each other. None of these are exotic — you will hit all three. Here is what is actually happening and how to get unstuck without flailing.

## Transitive dependencies: the libraries you didn't ask for

When you depend on a library, you also get *its* dependencies, and theirs, all the way down. These are **transitive dependencies**, and they are the reason `mvn package` downloads a hundred jars when you named three. This is mostly a gift — you would never want to hand-list every dependency of every dependency. The problem is when two of your dependencies need *different versions* of the same third library.

```console
$ mvn dependency:tree
[INFO] com.example:my-app:jar:1.0.0
[INFO] +- com.lib:alpha:jar:2.0.0:compile
[INFO] |  \- com.shared:util:jar:1.4.0:compile
[INFO] \- com.lib:beta:jar:3.0.0:compile
[INFO]    \- (com.shared:util:jar:1.2.0:compile - omitted for conflict with 1.4.0)
```

*What just happened:* `dependency:tree` printed the full graph of what you actually pull in. Both `alpha` and `beta` need `com.shared:util`, but at different versions — `1.4.0` and `1.2.0`. Maven cannot put both on the classpath, so it picks one. The line `omitted for conflict with 1.4.0` tells you Maven kept `1.4.0` and dropped `1.2.0`. This is the single most useful Maven command for debugging; reach for it first whenever a dependency behaves strangely.

## How Maven picks a winner: nearest wins

When versions conflict, Maven uses **nearest-wins** (more formally, *dependency mediation*): the version closest to your project in the tree is the one selected. "Closest" means fewest hops from your POM. A direct dependency you declare yourself is at depth one and beats anything transitive.

This is also the cause of the classic production failure: your code compiles fine, then at runtime throws `NoSuchMethodError` or `ClassNotFoundException`. What happened is Maven resolved a version of a shared library that one of your dependencies wasn't built against — the method exists in the version that library expected, but not in the version that won. The fix is to take control:

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>com.shared</groupId>
      <artifactId>util</artifactId>
      <version>1.4.0</version>     <!-- force this version everywhere -->
    </dependency>
  </dependencies>
</dependencyManagement>
```

*What just happened:* you declared a version in `<dependencyManagement>`, which is a *policy*, not a dependency. It says "whenever anything in this project resolves `com.shared:util`, use `1.4.0`." It does not add the library to your classpath — it only pins the version when something else pulls it in. This is the clean way to end a version war: decide the winner explicitly instead of letting nearest-wins decide for you.

> When you only want to *remove* one bad transitive dependency rather than pin a version, add an `<exclusion>` inside the dependency that drags it in. Use exclusions surgically — each one is a small claim that you know better than the library author about what it needs.

## The local repository: powerful, occasionally treacherous

Every artifact Maven downloads or installs lands in your **local repository**, by default `~/.m2/repository`. On the next build, Maven finds the jar there and skips the download. That cache is why your second build is fast and why CI machines warm it up. Most of the time it is invisible and helpful.

It betrays you in two specific ways. First, a download can get interrupted and leave a corrupt or partial jar, and Maven will keep trusting it — you get baffling errors that survive every rebuild. Second, after a network blip you may see the dreaded `Could not resolve dependencies`, where Maven has cached the *failure* and refuses to retry.

```console
$ mvn package
[ERROR] Failed to execute goal ... Could not resolve dependencies for project com.example:my-app:jar:1.0.0:
[ERROR] Failure to find com.shared:util:jar:1.4.0 in https://repo.maven.apache.org/maven2
[ERROR] was cached in the local repository, resolution will not be reattempted until the update interval has elapsed

$ mvn package -U
[INFO] Downloading from central: https://repo.maven.apache.org/maven2/com/shared/util/1.4.0/util-1.4.0.jar
[INFO] BUILD SUCCESS
```

*What just happened:* the first build failed because Maven had cached an earlier failure to find the artifact. The `-U` flag (`--update-snapshots`) forces Maven to re-check remote repositories instead of trusting the cached miss, and the build recovered. When a build fails with "cached in the local repository," `-U` is the first thing to try. For a genuinely corrupt jar, delete that artifact's folder under `~/.m2/repository` and rebuild — Maven re-downloads a clean copy.

## Multi-module: one build, many parts

Eventually one project becomes several — a `core` library, a `web` app, a `cli` — that all build together and depend on each other. Maven handles this with a **parent POM** that lists child **modules**. The parent's packaging is `pom` (it produces no jar of its own; it exists to coordinate):

```xml
<!-- parent pom.xml -->
<project>
  <groupId>com.example</groupId>
  <artifactId>my-app-parent</artifactId>
  <version>1.0.0</version>
  <packaging>pom</packaging>      <!-- a coordinator, not a jar -->

  <modules>
    <module>core</module>          <!-- each is a subdirectory with its own pom.xml -->
    <module>web</module>
    <module>cli</module>
  </modules>
</project>
```

*What just happened:* you declared an aggregator. `packaging` is `pom` because the parent builds nothing itself — its job is to tie the modules together. Each `<module>` names a subdirectory holding its own `pom.xml`. Running `mvn package` from the parent builds all three modules in the right order: Maven reads the dependency graph between them and builds `core` before `web` if `web` depends on `core`. This ordering — the **reactor** — is automatic; you never sequence the modules by hand.

The payoff is shared configuration and coordinated builds. Children declare the parent and inherit its `dependencyManagement`, its plugin versions, and its properties, so you set the Java version once in the parent and every module obeys. Within the build, modules refer to each other by coordinates exactly like any external dependency — `web` depending on `core` is the same `<dependency>` block you would write for a library from Central, because to Maven there is no difference. That uniformity is the whole point: your own modules and the rest of the world play by one set of rules.

## In the wild

The Maven skills that separate a fluent user from a stuck one are diagnostic, not declarative. `mvn dependency:tree` to see what you really depend on; `-U` to break a stale-cache deadlock; deleting an artifact's folder under `~/.m2` to clear a corrupt jar; reading the reactor order to understand a multi-module build. The POM tells Maven what you want — these tools tell *you* what Maven actually did, which is exactly what you need when the gap between the two is causing the bug.

```quiz
[
  {
    "q": "Two of your dependencies pull in different versions of the same library. How does Maven decide which version to use?",
    "choices": [
      "It always uses the highest version number",
      "It fails the build and asks you to choose",
      "Nearest-wins: the version closest to your project in the dependency tree",
      "It includes both versions on the classpath"
    ],
    "answer": 2,
    "explain": "Maven uses dependency mediation — nearest-wins. The version with the fewest hops from your POM is selected; a direct dependency always beats a transitive one."
  },
  {
    "q": "A build fails with \"was cached in the local repository, resolution will not be reattempted.\" What is the quickest fix to try?",
    "choices": [
      "Run with -U to force Maven to re-check remote repositories",
      "Delete the entire ~/.m2 directory before every build",
      "Add the dependency twice in the POM",
      "Switch the dependency to test scope"
    ],
    "answer": 0,
    "explain": "Maven cached the earlier failure. The -U (--update-snapshots) flag forces a re-check of remote repositories instead of trusting the cached miss."
  },
  {
    "q": "In a multi-module project, what packaging does the parent POM use, and why?",
    "choices": [
      "jar, because it bundles all modules into one archive",
      "pom, because it is a coordinator that produces no artifact of its own",
      "war, because multi-module always means web apps",
      "It needs no packaging element"
    ],
    "answer": 1,
    "explain": "The parent uses packaging 'pom' — it builds nothing itself and exists to list modules and share configuration. Maven's reactor then builds the modules in dependency order."
  }
]
```

[← Phase 2](02-pom-coordinates-lifecycle.md) | [Overview](_guide.md)
