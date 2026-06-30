---
title: "JUnit and Mockito"
guide: junit-and-mockito
phase: 0
summary: "The Java testing duo: JUnit 5 for structuring and running tests with assertions and lifecycle, and Mockito for mocking the collaborators you want to isolate."
tags: [junit, mockito, java, testing, unit-tests, mocking, jupiter]
category: tooling
group: "Testing Tools"
order: 36
difficulty: intermediate
synonyms: ["junit 5 tutorial", "mockito mock example", "java unit testing", "junit jupiter", "when thenReturn mockito", "verify mockito", "beforeeach junit", "parameterized test junit"]
updated: 2026-06-30
---

# JUnit and Mockito

You opened a Java repo, saw a `src/test/java` folder full of `@Test` methods and `mock(...)` calls, and felt the familiar dread: which annotation does what, why is half the test setting up fake objects, and how do you write one of these yourself without copy-pasting the rest of the suite. This guide gives you the two tools that 90% of Java test code is built from, and the mental model to use them without drowning in mocks.

## How to read this

Read the phases in order. Phase 1 builds the JUnit 5 mental model so the annotations stop being noise. Phase 2 puts Mockito next to it and shows the everyday isolate-the-unit workflow. Phase 3 is the part nobody warns you about: the ways these tools quietly lie to you, and how to keep your tests honest. If you've never written a unit test at all, /guides/your-first-unit-test is the gentler on-ramp; come back here for the Java specifics.

## The phases

1. [What JUnit 5 actually is](01-what-junit-5-actually-is.md) - the Jupiter model, `@Test`, lifecycle, and assertions.
2. [Mocking with Mockito](02-mocking-with-mockito.md) - isolate the unit, stub collaborators, verify interactions.
3. [When tests lie](03-when-tests-lie.md) - the mock-too-much trap, brittle verification, and production reality.

[Phase 1: What JUnit 5 actually is](01-what-junit-5-actually-is.md) →
