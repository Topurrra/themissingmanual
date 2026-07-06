---
title: "Packages, Build & Tooling - From Files to a Real Project"
guide: "java-from-zero"
phase: 8
summary: "How Java organizes code into packages, how the classpath lets the JVM find your classes and libraries, why Maven and Gradle exist, and what JARs and dependencies really are."
tags: [java, packages, classpath, maven, gradle, jar, build-tools, dependencies]
difficulty: intermediate
synonyms: ["java packages explained", "java classpath", "maven vs gradle", "java jar file", "java build tools", "java dependency management", "java import statement"]
updated: 2026-06-22
---

# Packages, Build & Tooling - From Files to a Real Project

Up to now your Java has lived in loose `.java` files, compiled with `javac` and run with `java`. That works for learning, but falls apart once a project grows past a dozen classes or needs a library someone else wrote - and *every* real project needs both.

This phase is about the gap between "I can write a class" and "I can work on an actual Java project." The mental model: a real Java project isn't a pile of files you compile by hand. It's a *named, organized structure* (packages) that a *build tool* (Maven or Gradle) compiles, tests, and bundles for you - pulling in other people's code (dependencies) automatically. Once you see how those pieces fit, an unfamiliar Java repo stops being intimidating.

## Packages - namespaces that keep classes from colliding

**What it actually is.** A **package** is a named group of related classes, declared as the very first line of a file: `package com.example.app;`. That name does two jobs at once - groups your classes logically, and maps directly to a folder on disk. A class in package `com.example.app` lives in `com/example/app/`.

📝 **Package** - a namespace for your classes, written as a dotted name like `com.example.billing`. It maps one-to-one to a directory path (`com/example/billing/`), groups related code, and prevents name clashes: your `User` and a library's `User` coexist because their *full* names differ (`com.example.User` vs `org.lib.User`).

**Why this exists.** Without packages, every class name would need to be globally unique - impossible once you pull in libraries, since two might both define a `Logger`. Packages also control visibility: a class or member with no access modifier (met in [Phase 4](05-classes-and-objects.md)) is *package-private* - visible only within the same package.

To use a class from another package, you `import` it:

```java
package com.example.app;

import java.util.ArrayList;       // pull in one class from java.util
import com.example.model.User;    // pull in your own class from another package

public class Main {
    public static void main(String[] args) {
        ArrayList<User> users = new ArrayList<>();
        users.add(new User("Ada"));
        System.out.println("users: " + users.size());
    }
}
```

*What just happened:* The `package` line says "this file belongs to `com.example.app`," so on disk it sits at `com/example/app/Main.java`. The two `import` lines bring `ArrayList` and `User` into scope by short name, so we write `ArrayList` instead of `java.util.ArrayList`. Imports don't *do* anything at runtime - a compiler convenience, telling it which full name a short name refers to. (One package is special: everything in `java.lang` - `String`, `System`, `Integer` - is imported automatically.)

💡 **Key point.** The package name *is* the folder structure. A file saying `package com.example.app;` but sitting in the wrong directory fails to compile.

## The classpath - how the JVM finds your classes

You've written packages and imports. But when the program runs, how does the JVM locate `com.example.model.User` on disk, or a class buried inside some downloaded library? The answer: the **classpath**, explaining one of the most common beginner errors.

**What it actually is.** The **classpath** is the list of locations - folders and JAR files - where the JVM looks for compiled `.class` files, at compile time and run time. Referencing `com.example.model.User`, the JVM walks each classpath entry looking for `com/example/model/User.class`. Find it, great. Miss it, and you get the infamous `ClassNotFoundException` or `NoClassDefFoundError`.

📝 **Classpath** - the search path the JVM uses to find classes: a list of roots (directories and `.jar` files). The JVM resolves a class's full name into a relative path under each root until it finds the matching `.class`. Set it with `-cp` (or `-classpath`), or the `CLASSPATH` environment variable.

**A real example.** Say you compiled into a folder `out/` and depend on a library `gson.jar`. Running by hand looks like this:

```bash
java -cp "out:libs/gson.jar" com.example.app.Main
```

```console
users: 1
```

*What just happened:* The `-cp` flag listed two places to find classes: your compiled output (`out/`) and the Gson JAR. The JVM searched both roots to resolve every class the program touched. The final argument is the *full name* of the class with `main()`, not a file path. Miss one classpath entry and the program dies with `ClassNotFoundException`. (On Windows the separator is `;` instead of `:`.)

⚠️ **This is exactly why managing the classpath by hand doesn't scale.** A toy program has one or two entries; a real one has *dozens* of library JARs, each possibly needing *other* JARs, all at specific versions. Assembling and maintaining that string is miserable and error-prone - the entire reason build tools exist.

## Build tools: Maven & Gradle

A **build tool** does everything tedious about turning source into a runnable, shippable artifact - so you never touch `javac` or a raw classpath again.

**What it actually does.** Given a single config file, a build tool will: compile your code, **download and manage dependencies** (resolving the whole classpath, versions and all), run tests, and package the result into a JAR. One command does the lot. **Maven** and **Gradle** dominate Java.

📝 **Build tool** - automation that compiles, tests, packages, and (crucially) manages dependencies from a declarative config file. You describe *what* your project needs; the tool figures out *how* to assemble it, including the classpath.

**Maven** is the older, convention-heavy one. You describe your project in a `pom.xml` file (XML). Maven prizes "convention over configuration": follow its standard folder layout (`src/main/java`, `src/test/java`) and you barely configure anything. Here's the part of a `pom.xml` declaring a dependency:

```xml
<dependencies>
    <dependency>
        <groupId>com.google.code.gson</groupId>
        <artifactId>gson</artifactId>
        <version>2.11.0</version>
    </dependency>
</dependencies>
```

*What just happened:* Those three coordinates - `groupId`, `artifactId`, `version` - uniquely identify Gson. Maven reads them, fetches from **Maven Central** (a huge public repository of open-source Java libraries), downloads that exact version, and adds it to your classpath automatically. No JAR file, no `-cp` flag - add five lines of XML and let Maven fetch. That single idea - "name a library by coordinates, the tool wires it up" - makes Java's ecosystem usable.

**Gradle** is the newer alternative. Instead of XML, you write the build in a DSL - Groovy or Kotlin - more programmable and flexible. The same dependency in Gradle's Kotlin DSL is one line:

```text
dependencies {
    implementation("com.google.code.gson:gson:2.11.0")
}
```

*What just happened:* Same three coordinates (`group:artifact:version`), same result - Gradle resolves from Maven Central and builds the classpath. The difference is style: Gradle's build files are real code, expressing logic XML can't, at the cost of being less predictable than Maven's rigid conventions. Android standardized on Gradle; much server-side Java still runs on Maven. Both solve the same problem; the choice is mostly team preference.

💡 **Key point.** In real projects you almost never call `javac` directly. Run `mvn package` or `./gradlew build`, and the tool compiles, resolves every dependency, runs your tests, and produces a JAR - all from one config file.

## JARs & dependencies - bundling code to share and ship

The build tool keeps producing something called a JAR - worth knowing exactly what that is.

**What it actually is.** A **JAR** (Java ARchive) is just a ZIP file with a `.jar` extension, holding compiled `.class` files plus a little metadata. It's how Java code is packaged for sharing - every library on Maven Central is a JAR, and your own built project becomes one too. Put a JAR on the classpath, and the JVM reads classes straight out of it.

📝 **JAR** - a zipped bundle of compiled `.class` files (and resources), the unit of distribution in Java: one file you can drop on a classpath, publish to a repository, or hand to someone else.

A normal library JAR contains only *that* library's classes. But to *run* an application you need it plus everything it depends on. That's where a **fat JAR** (*uber JAR*) comes in: a single JAR bundling your code *and* all its dependencies, running standalone with nothing else on the classpath:

```bash
java -jar myapp.jar
```

```console
Server started on port 8080
```

*What just happened:* `java -jar myapp.jar` ran the application from one self-contained file - no `-cp` listing a dozen library JARs, since they're all *inside* `myapp.jar`. Build tools produce these with a plugin (Maven's Shade, Gradle's Shadow). Simplest way to deploy a Java service: build one fat JAR, copy it to a server, run.

One more piece you get for free: **transitive dependencies**. Depend on library A, and if A depends on B and C, the build tool pulls those in automatically - you only declared A. The tool resolves the whole graph from Maven Central. (This has a dark side - version conflicts deep in the tree, "JAR hell" - but declaring one library quietly brings its friends along.)

## The wider toolchain

Beyond the language and the build tool, Java has a mature, batteries-included ecosystem. A quick orientation so the names aren't a mystery later:

- **IDEs.** Most Java is written in a full IDE rather than a plain editor, since the language's verbosity pays off when a tool understands it deeply. **IntelliJ IDEA** is the de facto standard (Eclipse and VS Code with Java extensions are common too). The IDE handles imports, refactoring, navigation, and runs your build tool for you.
- **Formatters & linters.** Tools like **Spotless** (formatting) and **Checkstyle** (style/lint rules) keep a codebase consistent and catch issues before review, wired into the build so rules are enforced, not argued about.
- **Testing & profiling.** The standard test framework is **JUnit**, and the JVM has excellent profiling tools for performance and memory problems - big enough topics for their own treatment in [Phase 16](16-testing-and-profiling.md).

💡 **Key point.** Java's ecosystem is old, deep, and well-supported: for almost any problem - JSON, HTTP, databases, logging, testing - there's a mature library a single dependency line away.

## Recap

1. A **package** (`package com.example.app;`) is a namespace that groups classes, maps to a folder on disk, controls visibility (package-private), and prevents name clashes. `import` brings other packages' classes into scope by short name.
2. The **classpath** is where the JVM searches for `.class` files and libraries; an entry it can't find is the cause of `ClassNotFoundException`. Managing it by hand doesn't scale - which is why build tools exist.
3. A **build tool** compiles, tests, packages, and - most importantly - resolves dependencies for you. **Maven** uses `pom.xml` (XML, convention-heavy); **Gradle** uses a Groovy/Kotlin DSL (flexible). Both pull libraries from **Maven Central** by `group:artifact:version` coordinates.
4. You rarely call `javac` directly in real projects; you run `mvn package` or `./gradlew build` instead.
5. A **JAR** is a zipped bundle of compiled classes - the unit of distribution. A **fat/uber JAR** bundles your dependencies inside so it runs standalone. **Transitive dependencies** are pulled in automatically.
6. The wider toolchain - **IntelliJ IDEA**, formatters/linters like **Spotless**/**Checkstyle**, and **JUnit** (Phase 16) - is mature and batteries-rich.

You can now read the shape of a real Java repository: the package folders, the `pom.xml` or `build.gradle`, the dependency list. Next: closing the guide with the idioms and gotchas that separate Java that *compiles* from Java that *looks like Java*.

## Quick check

Test yourself on the ideas that make a Java project a project, not just a folder of files:

```quiz
[
  {
    "q": "What does the line `package com.example.billing;` at the top of a file determine?",
    "choices": [
      "The class's namespace and the folder it must live in (com/example/billing/)",
      "Which build tool - Maven or Gradle - will compile the file",
      "The version of Java the file requires to run",
      "Which libraries the file is allowed to import"
    ],
    "answer": 0,
    "explain": "A package is a namespace that maps one-to-one to a directory path. The file must physically live at com/example/billing/, and the package name becomes part of every class's full name - which is how the JVM and tools locate it."
  },
  {
    "q": "Why do Maven and Gradle exist instead of just running `javac` and `java -cp` by hand?",
    "choices": [
      "They automatically resolve and download dependencies and build the whole classpath, which is unmanageable by hand once a project has many library versions",
      "They make Java code run faster than plain javac",
      "They are required by the JVM to load any class at all",
      "They replace the need to write packages and imports"
    ],
    "answer": 0,
    "explain": "A real project has dozens of library JARs at specific versions, plus their transitive dependencies. Assembling and maintaining that classpath manually is error-prone and miserable; the build tool resolves the whole dependency graph from Maven Central and wires it up for you."
  },
  {
    "q": "What is a 'fat JAR' (uber JAR), and why is it useful?",
    "choices": [
      "A single JAR bundling your code plus all its dependencies, so it runs standalone with `java -jar`",
      "A JAR that has been compressed twice to take less disk space",
      "A JAR containing only documentation and source, not compiled classes",
      "A JAR that automatically updates its dependencies at runtime"
    ],
    "answer": 0,
    "explain": "A normal library JAR holds only its own classes. A fat/uber JAR bundles your application together with every dependency inside one file, so you can deploy and run it with `java -jar myapp.jar` - no separate classpath of library JARs needed."
  }
]
```

---

[← Phase 7: Errors & I/O](07-errors-and-io.md) · [Guide overview](_guide.md) · [Phase 9: Idioms & Gotchas →](09-idioms-and-gotchas.md)
