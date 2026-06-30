---
title: "Maven, From Zero"
guide: maven-from-zero
phase: 0
summary: "Java's build tool and dependency manager: the POM, the build lifecycle, coordinates and repositories, and why 'it works on Maven Central' is the default."
tags: [maven, java, build-tools, dependency-management, pom]
category: tooling
group: "Build & Package Managers"
order: 7
difficulty: intermediate
synonyms: ["maven tutorial", "what is pom.xml", "maven dependencies explained", "maven build lifecycle", "maven central", "mvn install vs deploy", "transitive dependencies java", "multi-module maven"]
updated: 2026-06-30
---

# Maven, From Zero

You inherited a Java project, typed `mvn package`, and a wall of text scrolled past for two minutes before spitting out a `.jar`. Somewhere in there a hundred libraries got downloaded that nobody on your team wrote. The `pom.xml` is 300 lines of XML you're afraid to touch. This guide turns Maven from a magic incantation into a tool you understand, so you know exactly what each command does and why the XML is shaped the way it is.

## How to read this

Read the phases in order the first time. Phase 1 builds the mental model: Maven trades freedom for convention, and once you see the convention, the rest stops being arbitrary. Phase 2 is the day-to-day: editing the POM, adding dependencies, running the lifecycle. Phase 3 is what bites you in production: dependency conflicts, the local repo going stale, and multi-module builds. If you already use Maven and want the gotchas, skim 1 and 2 and slow down on 3.

## The phases

1. [The mental model: convention over configuration](01-convention-over-configuration.md) — what Maven is, why it exists, and the POM as a single source of truth.
2. [The everyday core: POM, coordinates, and the lifecycle](02-pom-coordinates-lifecycle.md) — dependencies, repositories, and the commands you actually run.
3. [Production reality: conflicts, the local repo, and multi-module](03-conflicts-and-multi-module.md) — transitive dependency hell, stale caches, and projects with more than one module.

[Phase 1: The mental model: convention over configuration](01-convention-over-configuration.md) →
