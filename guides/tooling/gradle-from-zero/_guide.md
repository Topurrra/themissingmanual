---
title: "Gradle, From Zero"
guide: gradle-from-zero
phase: 0
summary: "The flexible build tool behind Java, Kotlin, and Android: tasks and the build graph, the Groovy/Kotlin DSL, dependency configurations, and the build cache."
tags: [gradle, build-tools, java, kotlin, android, jvm]
category: tooling
group: "Build & Package Managers"
order: 8
difficulty: intermediate
synonyms: [gradle tutorial, gradle build, build.gradle, build.gradle.kts, gradle wrapper, gradle vs maven, gradle tasks, gradle dependencies, implementation vs api, gradlew]
updated: 2026-06-30
---

# Gradle, From Zero

You opened a Java or Android project, saw `build.gradle`, ran `./gradlew build`, and a wall of text scrolled past for ninety seconds. Then someone told you to "add a dependency" and you had no idea whether to write `implementation`, `api`, or `compile`, or why your change quietly broke a downstream module. Gradle feels like a black box that occasionally yells at you.

It isn't a black box. Gradle is a small, learnable idea wrapped in a big vocabulary: your build is a graph of tasks, your config is real code, and the speed comes from Gradle refusing to redo work it has already done. Once you see the graph, the rest stops being mysterious.

## How to read this

Go in order. Phase 1 gives you the mental model: tasks, the build graph, and why Gradle exists at all. Phase 2 is the everyday work: writing `build.gradle(.kts)`, applying plugins, and declaring dependencies the right way. Phase 3 is the speed and the sharp edges: incremental builds, the build cache, the wrapper, and the gotchas that bite real teams. Read with a terminal open; run the commands as you go.

## The phases

1. [Phase 1: The Build Is a Graph](01-the-build-is-a-graph.md) — what Gradle actually is, tasks, and the task DAG
2. [Phase 2: The Build Script You Live In](02-the-build-script-you-live-in.md) — the DSL, plugins, and dependency configurations
3. [Phase 3: Why It's Fast, and Where It Bites](03-why-its-fast-and-where-it-bites.md) — incremental builds, the cache, the wrapper, and gotchas

[Phase 1: The Build Is a Graph](01-the-build-is-a-graph.md) →
