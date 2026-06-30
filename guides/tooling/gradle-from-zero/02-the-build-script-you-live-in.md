---
title: "The Build Script You Live In"
guide: gradle-from-zero
phase: 2
summary: "The flexible build tool behind Java, Kotlin, and Android: tasks and the build graph, the Groovy/Kotlin DSL, dependency configurations, and the build cache."
tags: [gradle, build-tools, java, kotlin, android, jvm]
difficulty: intermediate
synonyms: [gradle tutorial, gradle build, build.gradle, build.gradle.kts, gradle wrapper, gradle vs maven, gradle tasks, gradle dependencies, implementation vs api, gradlew]
updated: 2026-06-30
---

# The Build Script You Live In

You'll spend most of your Gradle time in one file: `build.gradle` or `build.gradle.kts`. It's where you declare which plugins to apply, which libraries you depend on, and any custom behavior you need. The day-to-day work isn't writing tasks from scratch — it's reading this file, adding a dependency without breaking anything, and knowing which of the near-identical keywords (`implementation` vs `api`) to pick. This phase makes that file legible.

## Groovy or Kotlin: two dialects, one model

Gradle scripts come in two flavors. `build.gradle` is Groovy. `build.gradle.kts` is Kotlin. They describe the exact same build model — same tasks, same plugins, same dependencies — with slightly different syntax.

```groovy
// build.gradle (Groovy DSL)
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies {
    implementation 'com.google.guava:guava:33.0.0-jre'
    testImplementation 'org.junit.jupiter:junit-jupiter:5.10.0'
}
```

```kotlin
// build.gradle.kts (Kotlin DSL)
plugins {
    java
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.google.guava:guava:33.0.0-jre")
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")
}
```

*What just happened:* Both files do the same three things — apply the `java` plugin, point at Maven Central for downloads, and declare two dependencies. The Kotlin version uses parentheses and quotes like a normal function call; the Groovy version is looser. The practical difference: Kotlin gives you autocomplete and compile-time checking in your IDE, which is why newer projects lean toward `.kts`. Pick one per project and stay consistent.

## Plugins: where your tasks come from

Remember from Phase 1 that you didn't write `compileJava` or `test` — a plugin did. Applying a plugin is how you pull in a whole bundle of tasks and conventions. The `java` plugin alone gives you `compileJava`, `test`, `jar`, `build`, and the standard `src/main/java` layout.

```kotlin
plugins {
    java
    application                    // adds the 'run' task
    id("org.jetbrains.kotlin.jvm") version "1.9.22"  // third-party, needs a version
}

application {
    mainClass.set("com.example.Main")
}
```

*What just happened:* Three plugins applied. `java` and `application` are built into Gradle, so they need no version. The Kotlin plugin is third-party, so you pin a version. The `application` plugin contributed a `run` task wired to the `mainClass` you set, so now `./gradlew run` launches your program. Plugins are the main way you get power without writing it yourself.

> The mental shortcut: when you wonder "where did this task come from?", the answer is almost always a plugin. Run `./gradlew tasks` and the grouping hints at which plugin contributed what.

## Dependencies and the repository

A dependency is an external library you want on your classpath. You declare it by its coordinates — `group:name:version` — and Gradle downloads it from the repositories you listed.

```kotlin
repositories {
    mavenCentral()
}

dependencies {
    implementation("org.apache.commons:commons-lang3:3.14.0")
}
```

*What just happened:* You told Gradle to look in Maven Central and to put `commons-lang3` version 3.14.0 on the compile and runtime classpath. Gradle downloads the JAR (and anything *it* depends on — transitive dependencies) into a local cache so the next build doesn't re-download it. You can see the full resolved tree:

```console
$ ./gradlew dependencies --configuration runtimeClasspath
runtimeClasspath
\--- org.apache.commons:commons-lang3:3.14.0
```

*What just happened:* Gradle printed the dependency tree for the runtime classpath. A bigger library would show its transitive dependencies indented underneath. This command is your first stop when you hit a version conflict or a "class not found" error — it shows exactly what's on the classpath and why.

## The keyword that trips everyone: implementation vs api

This is the single most misunderstood part of Gradle, so slow down here. Both `implementation` and `api` add a library to your module's compile classpath. The difference is what happens to **modules that depend on you**.

- `implementation` — the dependency is for your eyes only. Modules that depend on your module do **not** see it on their compile classpath.
- `api` — the dependency leaks through. Modules that depend on you **do** see it, as if they declared it themselves.

```kotlin
dependencies {
    // Guava is part of THIS module's public API — a method returns a Guava type.
    api("com.google.guava:guava:33.0.0-jre")

    // Jackson is an internal detail — used inside, never exposed in a signature.
    implementation("com.fasterxml.jackson.core:jackson-databind:2.16.1")
}
```

*What just happened:* You declared Guava as `api` because your public methods return Guava types — a consumer of your module needs Guava to even compile against you. Jackson you declared as `implementation` because it's a private detail; consumers should never know it exists. Get this wrong in the safe direction (using `implementation` when you meant `api`) and downstream code fails to compile. Get it wrong the other way (over-using `api`) and you bloat everyone's classpath and trigger needless recompiles when Jackson updates.

The rule of thumb: **default to `implementation`**. Only reach for `api` when a dependency's types appear in your module's public method signatures or return types. There's also `testImplementation` for dependencies only your tests need (like JUnit), and `runtimeOnly` for things needed at runtime but not at compile time (like a JDBC driver).

```kotlin
dependencies {
    implementation("org.slf4j:slf4j-api:2.0.12")       // compile + runtime, hidden from consumers
    runtimeOnly("org.postgresql:postgresql:42.7.1")    // runtime only, not on compile classpath
    testImplementation("org.junit.jupiter:junit-jupiter:5.10.0")  // tests only
}
```

*What just happened:* Three different **configurations**, each putting its dependency on a different classpath at a different time. `slf4j-api` is needed to compile and run but hidden from consumers. The Postgres driver is loaded at runtime by reflection, so it never needs to be on the compile classpath. JUnit exists only for tests and never ships in your artifact. Choosing the tightest configuration that works keeps classpaths lean and builds fast.

## For builders

In a multi-module project — a `core` module, a `web` module, an `app` — getting `implementation` vs `api` right is what keeps your modules genuinely decoupled. If `core` declares everything as `api`, then `web` accidentally compiles against `core`'s internal libraries, and a year later you can't upgrade one of those libraries without touching three modules. Defaulting to `implementation` is how you keep the option to change `core`'s internals without a ripple effect.

```quiz
[
  {
    "q": "You add a library that is used only inside your module and never appears in a public method signature. Which configuration?",
    "choices": ["api", "implementation", "runtimeOnly", "compileOnly"],
    "answer": 1,
    "explain": "Default to implementation. It puts the library on your compile and runtime classpath but hides it from modules that depend on you."
  },
  {
    "q": "What does declaring a dependency as 'api' do that 'implementation' does not?",
    "choices": ["Downloads it faster", "Exposes it on the compile classpath of modules that depend on yours", "Makes it test-only", "Skips the version number"],
    "answer": 1,
    "explain": "api leaks the dependency through to your consumers' compile classpath. Use it only when the dependency's types appear in your public API."
  },
  {
    "q": "Where do tasks like compileJava and test come from in a standard build.gradle?",
    "choices": ["You must write them by hand", "They are built into the gradlew script", "An applied plugin (such as the java plugin) registers them", "They are downloaded from Maven Central"],
    "answer": 2,
    "explain": "Plugins contribute tasks and conventions. The java plugin alone registers compileJava, test, jar, build, and the standard source layout."
  }
]
```

[← Phase 1](01-the-build-is-a-graph.md) | [Overview](_guide.md) | [Phase 3: Why It's Fast, and Where It Bites →](03-why-its-fast-and-where-it-bites.md)
