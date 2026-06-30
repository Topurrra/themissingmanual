---
title: "The mental model: convention over configuration"
guide: maven-from-zero
phase: 1
summary: "Java's build tool and dependency manager: the POM, the build lifecycle, coordinates and repositories, and why 'it works on Maven Central' is the default."
tags: [maven, java, build-tools, dependency-management, pom]
difficulty: intermediate
synonyms: ["maven tutorial", "what is pom.xml", "maven dependencies explained", "maven build lifecycle", "maven central", "mvn install vs deploy", "transitive dependencies java", "multi-module maven"]
updated: 2026-06-30
---

# The mental model: convention over configuration

Before Maven, building a Java project meant writing a script that compiled every source file, copied resources, ran the tests, and zipped the result. Every project did it differently. Open someone else's repo and you had to read their build script line by line to find out where the source code even lived. Maven's founding idea is a reaction to that: stop describing *how* to build, and instead *declare what the project is*. Maven already knows how to build a Java project — as long as your project looks the way it expects.

That trade is the whole story. You give up the freedom to lay out your project however you like. In return, you never write build logic again, and any Maven project is instantly legible to anyone who knows Maven.

## The convention: where things live

When Maven builds your project, it does not ask you where the source code is. It looks in the place it has always looked:

```text
my-app/
├── pom.xml                  ← the project descriptor
├── src/
│   ├── main/
│   │   ├── java/            ← your production code
│   │   └── resources/       ← config files, bundled into the jar
│   └── test/
│       ├── java/            ← your test code
│       └── resources/       ← test-only config
└── target/                  ← build output (compiled classes, the jar) — gitignored
```

*What just happened:* you saw the entire layout you need to memorize. Put `.java` files under `src/main/java` and Maven compiles them. Put tests under `src/test/java` and Maven runs them. The `target/` directory is generated — you never commit it. There is no setting that says "the source is here." The location *is* the setting.

This is the meaning of **convention over configuration**: the default behavior is correct for the common case, so configuration is only needed when you deviate. A standard Java project needs almost no build instructions because almost nothing is unusual about it.

> A useful instinct: if you find yourself writing XML to tell Maven where your source files are, stop. You are fighting the tool. Move the files to where Maven expects them and delete the configuration.

## The POM: one file that describes the project

The other half of Maven is the **POM** — the Project Object Model — written as `pom.xml`. This is the single file that declares what your project is. The smallest meaningful POM looks like this:

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.example</groupId>
  <artifactId>my-app</artifactId>
  <version>1.0.0</version>
  <packaging>jar</packaging>
</project>
```

*What just happened:* you declared an identity, not a procedure. `groupId`, `artifactId`, and `version` together are the project's **coordinates** — its globally unique name (more on these in phase 2). `packaging` says what to produce: a `jar`. Nothing here says "compile then test then zip." Maven knows that part. The POM only states the facts that make this project *this* project.

The POM is declarative on purpose. You describe the desired end state — these are my coordinates, these are my dependencies, this is what I produce — and Maven figures out the steps. Compare that to a shell script, where you spell out every command in order. The declarative style is why two unrelated Maven projects feel the same: they are both facts in the same shape.

## Why "it's on Maven Central" is the default

Here is the part that quietly changed Java forever. Maven didn't only standardize *how you build* — it standardized *how libraries are named and shared*. Because every project has unique coordinates, a library can be published once to a shared server and any project anywhere can pull it in by name.

That shared server is **Maven Central**. It is the default public repository, and it is enormous — effectively the canonical home for open-source Java libraries.

```xml
<dependencies>
  <dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>33.0.0-jre</version>
  </dependency>
</dependencies>
```

*What just happened:* you didn't download anything, didn't find a website, didn't copy a `.jar` into your repo. You wrote three lines naming a library by its coordinates. The next time Maven builds, it fetches Guava from Maven Central and puts it on your classpath. "It's on Maven Central" became shorthand for "you can use it with three lines of XML."

This is why the Java ecosystem leans so hard on Maven coordinates. Even tools that aren't Maven — Gradle, sbt, Bazel — speak the same coordinate language and pull from the same Central repository. The naming convention outgrew the tool that invented it. If you want the broader picture of how source becomes a shippable artifact, see [Build & Release Basics](/guides/build-and-release-basics); if Java itself is still new to you, [Java, From Zero](/guides/java-from-zero) is the place to start.

## For builders

The mental shift that makes Maven click: **the POM is a description, not a script.** Every time you reach to "make Maven do X," first ask whether X is already the convention. Most of the time the answer is yes, and the right move is to write less XML, not more. The teams that fight Maven are the ones trying to make it behave like the custom build script they had before. The teams that love it are the ones who leaned into the convention and stopped thinking about builds at all.

```quiz
[
  {
    "q": "What does \"convention over configuration\" mean in Maven?",
    "choices": [
      "You must configure every build step explicitly in XML",
      "Sensible defaults handle the common case, so you only configure deviations",
      "Conventions are suggestions Maven ignores at build time",
      "Configuration files override the project's source layout"
    ],
    "answer": 1,
    "explain": "Maven assumes a standard layout and build process, so a normal project needs almost no configuration. You only write XML when you depart from the defaults."
  },
  {
    "q": "Where does Maven expect your production Java source files to live?",
    "choices": [
      "src/main/java",
      "src/java",
      "source/main",
      "target/classes"
    ],
    "answer": 0,
    "explain": "The standard layout puts production code in src/main/java and test code in src/test/java. target/ holds generated build output."
  },
  {
    "q": "Why is \"it's on Maven Central\" enough to use a library?",
    "choices": [
      "Maven Central emails you the jar to install manually",
      "Every library has unique coordinates, so naming them in the POM lets Maven fetch them automatically",
      "Maven Central rewrites your source code to include the library",
      "Libraries on Central require no version number"
    ],
    "answer": 1,
    "explain": "Unique coordinates (groupId/artifactId/version) let any project name a published library and have Maven download it from the shared Central repository."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The everyday core →](02-pom-coordinates-lifecycle.md)
