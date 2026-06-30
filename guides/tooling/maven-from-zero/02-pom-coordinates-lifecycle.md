---
title: "The everyday core: POM, coordinates, and the lifecycle"
guide: maven-from-zero
phase: 2
summary: "Java's build tool and dependency manager: the POM, the build lifecycle, coordinates and repositories, and why 'it works on Maven Central' is the default."
tags: [maven, java, build-tools, dependency-management, pom]
difficulty: intermediate
synonyms: ["maven tutorial", "what is pom.xml", "maven dependencies explained", "maven build lifecycle", "maven central", "mvn install vs deploy", "transitive dependencies java", "multi-module maven"]
updated: 2026-06-30
---

# The everyday core: POM, coordinates, and the lifecycle

Now you live in the tool. Day to day, Maven is three things: coordinates that name everything, dependencies and plugins you declare in the POM, and a lifecycle of phases you trigger from the command line. Get these three solid and the 300-line POM you were afraid of becomes readable - it is the same handful of ideas repeated.

## Coordinates: the address of everything

Every artifact in the Maven world - your project, every library you depend on, every plugin - has the same three-part address:

```text
groupId    : com.fasterxml.jackson.core    ← who publishes it (reverse-domain namespace)
artifactId : jackson-databind              ← the specific project
version    : 2.17.0                         ← which release
```

*What just happened:* you saw the universal naming scheme. Written compactly, coordinates are `groupId:artifactId:version` - so the above is `com.fasterxml.jackson.core:jackson-databind:2.17.0`. The `groupId` is a reverse-domain name to keep namespaces from colliding; the `artifactId` is the project's short name; the `version` pins the exact release. These three values are how Maven finds anything, locally or in a repository.

This matters because coordinates are the *only* identity that exists. There is no "the latest Jackson" floating around - there is `2.17.0` and `2.18.1` and so on, each a distinct, immutable artifact. Pinning versions is not bureaucracy; it is what makes a build reproducible.

## Dependencies: declaring what you need

You add a library by adding its coordinates under `<dependencies>`. The interesting extra knob is **scope**, which controls *when* the dependency is on the classpath:

```xml
<dependencies>
  <dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.17.0</version>
    <!-- no scope = "compile": available everywhere, the default -->
  </dependency>

  <dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.2</version>
    <scope>test</scope>          <!-- only when compiling and running tests -->
  </dependency>
</dependencies>
```

*What just happened:* you declared two dependencies with different reach. Jackson has the default `compile` scope, so it is available to your production code, your tests, and the packaged jar. JUnit has `test` scope, so it is present while compiling and running tests but is *not* bundled into your application or available to production code. Scope is how you keep your test framework out of your shipped artifact. The two scopes you will use constantly are the implicit `compile` and the explicit `test`.

## The build lifecycle: phases in a fixed order

This is the idea that unlocks the command line. Maven defines a **lifecycle**: an ordered sequence of **phases**. When you run a phase, Maven runs *every phase before it too*, in order. The default lifecycle, in the order that matters:

```text
validate  →  compile  →  test  →  package  →  verify  →  install  →  deploy
```

*What just happened:* you saw the spine of every Maven build. `validate` checks the project is sane. `compile` compiles `src/main/java`. `test` runs unit tests. `package` bundles compiled code into a `jar` (or `war`). `verify` runs integration checks. `install` copies the artifact into your **local repository** so other projects on your machine can use it. `deploy` uploads it to a remote repository for the whole team. Each phase is a checkpoint, and they always run front to back.

The consequence trips up newcomers, so say it plainly: you never run `compile` and `test` and `package` separately. You run the *last* phase you want, and Maven runs everything up to and including it.

```console
$ mvn package
[INFO] --- compiler:compile (default-compile) ---
[INFO] --- surefire:test (default-test) ---
[INFO]  T E S T S
[INFO]  Tests run: 14, Failures: 0, Errors: 0, Skipped: 0
[INFO] --- jar:jar (default-jar) ---
[INFO] Building jar: /home/you/my-app/target/my-app-1.0.0.jar
[INFO] BUILD SUCCESS
```

*What just happened:* one command, `mvn package`, ran four phases. It validated, compiled, ran all 14 tests, and only then built the jar. If a test had failed, the build would have stopped before `package` - you would get no jar, by design. The jar lands in `target/`, named from your coordinates: `my-app-1.0.0.jar`.

> A clean rebuild is `mvn clean package`. `clean` is a different lifecycle whose job is to delete `target/`. Chaining it guarantees no stale class files from a previous build sneak into the new jar.

## install vs deploy: the most common confusion

These two sound alike and do very different things:

```text
mvn install   →  puts your jar in the LOCAL repo (~/.m2/repository on your machine)
mvn deploy    →  uploads your jar to a REMOTE repo (shared, e.g. a company Nexus/Artifactory)
```

*What just happened:* `install` is local and offline - it makes your artifact available to other Maven projects *on your own machine*, which is exactly what you want when project B depends on a library you are actively developing in project A. `deploy` is the publish step - it pushes to a server so other people and CI can pull your artifact. You run `install` constantly during local development; you run `deploy` rarely, usually only from a release pipeline. For where `deploy` fits in shipping software, see [Build & Release Basics](/guides/build-and-release-basics).

## Plugins: where the actual work happens

One more layer to make the POM fully readable. Maven's core does almost nothing on its own - every phase is implemented by a **plugin** bound to it. Compiling is the `maven-compiler-plugin`; running tests is `maven-surefire-plugin`; building the jar is `maven-jar-plugin`. You mostly never name these because the defaults are wired in. You configure a plugin only to override a default - for example, to set the Java version you compile against:

```xml
<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-compiler-plugin</artifactId>
      <configuration>
        <release>21</release>     <!-- compile for Java 21 -->
      </configuration>
    </plugin>
  </plugins>
</build>
```

*What just happened:* you reached into one phase - compilation - and changed one setting, the target Java version, without touching anything else. That is the normal shape of POM customization: find the plugin behind the phase, configure the one knob you need, leave the rest of the convention alone. When you read a long POM, most of its bulk is exactly this - plugins with a few overrides each.

## In the wild

A real project's `pom.xml` looks long, but skim it and you will see only these pieces: coordinates at the top, a `<dependencies>` block with scopes, and a `<build>` block of plugins with small `<configuration>` overrides. The fear comes from the volume of XML, not from complexity. Once you can name each section - *that is coordinates, that is a test-scoped dependency, that is the compiler plugin set to Java 21* - the file goes quiet.

```quiz
[
  {
    "q": "You run `mvn package`. Which phases execute?",
    "choices": [
      "Only package, in isolation",
      "package and deploy",
      "validate, compile, test, then package - every phase up to and including package",
      "compile and package, but tests are skipped by default"
    ],
    "answer": 2,
    "explain": "Running a phase runs every preceding phase in order. mvn package therefore validates, compiles, runs tests, and only then packages."
  },
  {
    "q": "What is the difference between `mvn install` and `mvn deploy`?",
    "choices": [
      "install compiles, deploy only copies files",
      "install puts the artifact in your local repo; deploy uploads it to a remote shared repo",
      "They are aliases for the same operation",
      "deploy is local, install is remote"
    ],
    "answer": 1,
    "explain": "install writes to ~/.m2 on your machine for local reuse; deploy publishes to a remote repository for the whole team and CI."
  },
  {
    "q": "What does giving a dependency `<scope>test</scope>` accomplish?",
    "choices": [
      "It makes the dependency available everywhere including the shipped jar",
      "It downloads the dependency only when tests fail",
      "It limits the dependency to compiling and running tests, keeping it out of the production artifact",
      "It marks the dependency as optional and ignores it"
    ],
    "answer": 2,
    "explain": "test scope keeps a dependency (like JUnit) on the classpath for tests only, so it is not bundled into or available to production code."
  }
]
```

[← Phase 1](01-convention-over-configuration.md) | [Overview](_guide.md) | [Phase 3: Production reality →](03-conflicts-and-multi-module.md)
