---
title: "Production: Actuator, Packaging & Deployment"
guide: "spring-boot-from-zero"
phase: 10
summary: "Take a Spring Boot app from 'runs on my machine' to production: Actuator health and metrics endpoints, building a self-contained fat jar, prod config, Dockerizing, and where it actually runs."
tags: [spring-boot, actuator, packaging, fat-jar, docker, deployment, health-checks, production]
difficulty: intermediate
synonyms: ["spring boot actuator health metrics", "spring boot fat jar packaging", "spring boot docker", "spring boot deploy production", "spring boot health check", "spring boot prod profile", "spring boot observability"]
updated: 2026-07-10
---

# Production: Actuator, Packaging & Deployment

Everything so far has run one way: hit the green arrow in your IDE, the app boots on `localhost:8081`, and you poke it from a browser. That's the inner loop, great for building. But "it runs on my machine" is not a deployment - it's a demo that happens to be on the right machine.

**Shipping a Spring Boot app is turning your source into one self-contained file and putting that file somewhere a server can run it.** No app server to install, no WAR to drop into Tomcat, no fragile setup script. You build a single jar that already *contains* a web server, feed it production config from the outside (the precedence rules from [Phase 4](04-configuration-and-profiles.md)), and run it with `java -jar`. Optionally wrap that jar in a container so the runtime is identical everywhere.

We'll go in the order you'd actually do it: first make the app *observable* (can a load balancer tell it's alive?), then *package* it, then *configure* it for prod, then *containerize* it, then talk about where it lands.

## Spring Boot Actuator - production endpoints for free

Before you deploy anything, you need to answer a deceptively important question: *how does the outside world know your app is healthy?* A load balancer or Kubernetes needs to ping something and get a yes/no. You could write that endpoint yourself, but Spring Boot already has it - plus metrics, build info, and more - in a module called **Actuator**.

📝 **Actuator** - a Spring Boot starter that adds a set of ready-made HTTP endpoints for monitoring and managing a running app: `/actuator/health` (is it alive and are its dependencies OK?), `/actuator/metrics` (memory, request counts, GC, and more), `/actuator/info` (build/version info you supply). You add one dependency; the endpoints appear.

You add it the same way you add any dependency (recall coordinates from the [Java tooling phase](/guides/java-from-zero) - `groupId:artifactId:version`):

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

*What just happened:* You pulled in the actuator starter. Note there's no `<version>` - Spring Boot's parent POM manages versions for its own starters, so they stay in lockstep with your Boot version. On the next restart, Actuator auto-configures itself and registers its endpoints. You wrote zero endpoint code.

The one endpoint you'll use constantly is health. Hit it:

```bash
curl http://localhost:8081/actuator/health
```

```json
{ "status": "UP" }
```

*What just happened:* Actuator reports the app is `UP`. That tiny response is exactly what a load balancer or container orchestrator polls - `UP` (200) keeps traffic flowing; `DOWN` (503) or no answer stops routing and may trigger a restart. The health check is also smart: it aggregates the health of things your app depends on, so a dead database connection flips it to `DOWN` automatically - adding the JPA datasource ([Phase 5](05-persistence-with-jpa.md)) registered that contributor for you.

By default, only `health` is exposed over HTTP. The rest are switched off until you opt in - and that default is a *security feature*, not an oversight:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
```

*What just happened:* You explicitly listed which actuator endpoints are reachable over HTTP - `health`, `info`, and `metrics`. Anything not in the list stays unreachable from the outside.

⚠️ **Never expose actuator endpoints carelessly in production.** Some leak serious internals. `/actuator/env` dumps your full configuration - *including resolved property values that may contain secrets*. `/actuator/heapdump` downloads a snapshot of your app's memory. `/actuator/shutdown` can stop the app. Do **not** write `include: "*"` in production. Expose the minimal set you need, and ideally put management endpoints behind authentication or on a separate, internal-only port. Treat the actuator surface as part of your attack surface.

💡 Actuator is your app's *first* observability - health and a handful of metrics out of the box. Real production systems build on this with proper metrics collection, dashboards, and tracing. Actuator exposes metrics in a format tools like Prometheus scrape directly. When you're ready to go deeper than "is it up?", see [/guides/observability-logs-metrics-traces](/guides/observability-logs-metrics-traces).

## Packaging: the fat jar

Now the app knows how to report its health. Time to turn it into something you can copy to a server. In old-school Java you'd build a WAR file and deploy it *into* a separately-installed application server (Tomcat, JBoss). Spring Boot threw that model out. Your build produces one runnable file with the server *inside* it.

📝 **Fat jar (a.k.a. uber jar)** - a single executable `.jar` that bundles three things: your compiled code, every dependency it needs, *and* an embedded web server (Tomcat by default). It has no external requirements beyond a Java runtime. That one file is your entire deployable.

You build it with one command. If you used Spring Initializr, your project came with the Maven wrapper (`mvnw`), so you don't even need Maven installed:

```bash
./mvnw clean package
```

```console
[INFO] --- spring-boot-maven-plugin:3.x.x:repackage ---
[INFO] Replacing main artifact with repackaged archive
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  18.421 s
```

*What just happened:* `clean` wiped the previous build output, then `package` compiled your code, ran your tests, and assembled the jar. The key line is `spring-boot-maven-plugin:repackage` - the plugin (included automatically in an Initializr project) rewriting the plain jar into a *fat* jar with the server and all dependencies tucked inside. The result lands in `target/`, named like `bookstore-0.0.1-SNAPSHOT.jar`.

Now run it the way a server would - no IDE, just Java:

```bash
java -jar target/bookstore-0.0.1-SNAPSHOT.jar
```

```console
 :: Spring Boot ::                (v3.x.x)
... : Starting BookstoreApplication using Java 21
... : Tomcat initialized with port 8081 (http)
... : Started BookstoreApplication in 2.3 seconds
```

*What just happened:* `java -jar` launched the fat jar. Notice Tomcat starts up *from inside the jar* - there's no separate server to install or configure, because it shipped with your code. This is the whole deployment story in one line: build the jar, copy it to a machine that has Java, run `java -jar`. That's it. (Gradle users get the same artifact from `./gradlew bootJar`.)

## Prod configuration: don't ship your dev defaults

The jar runs. But right now it's still wearing its development clothes - an in-memory H2 database, chatty DEBUG logging, maybe wide-open CORS. Shipping those to production ranges from embarrassing to dangerous. This is exactly what profiles and externalized config from [Phase 4](04-configuration-and-profiles.md) are for.

The pattern: keep dev-friendly defaults in your base/dev config, put the real production values in `application-prod.yml`, and feed secrets from the environment. Activate the prod profile when you run:

```bash
SPRING_PROFILES_ACTIVE=prod \
SPRING_DATASOURCE_URL=jdbc:postgresql://db.internal:5432/bookstore \
SPRING_DATASOURCE_USERNAME=bookstore_app \
DB_PASSWORD=$REAL_SECRET \
java -jar target/bookstore-0.0.1-SNAPSHOT.jar
```

*What just happened:* `SPRING_PROFILES_ACTIVE=prod` told Boot to layer `application-prod.yml` over the base config, swapping H2 for the real PostgreSQL and turning logging down to `WARN`. The datasource URL, username, and password came in as environment variables, which sit *above* the config file in precedence - so the real database and the real secret never had to be written into a committed file. Same jar you built a minute ago; production behavior, driven entirely by inputs.

⚠️ **Audit what leaks from dev to prod before you ship.** The usual offenders: the H2 in-memory database (data vanishes on restart), `spring.jpa.hibernate.ddl-auto=create` (drops and recreates your schema - catastrophic against a real DB), DEBUG logging (slow, noisy, and can log sensitive request data), and permissive CORS like `allowedOrigins("*")`. Make `application-prod.yml` an explicit, conservative override of every one - the defaults are tuned for your laptop, not the internet.

## Docker: make the runtime identical everywhere

`java -jar` on a server works, but it quietly assumes that server has the *right* Java version installed and configured. Multiply that across your laptop, a teammate's laptop, CI, staging, and prod, and "works on mine" creeps back in through version drift. A container freezes the entire runtime - the exact JDK, the OS libraries, your jar - into one image that runs identically wherever Docker runs.

A Spring Boot fat jar makes the Dockerfile almost trivial: start from a base image that has Java, copy the jar in, run it.

```dockerfile
# Start from a small image that already has a Java runtime
FROM eclipse-temurin:21-jre

# Where the app lives inside the container
WORKDIR /app

# Copy the fat jar built by `./mvnw package` into the image
COPY target/bookstore-0.0.1-SNAPSHOT.jar app.jar

# Document the port the app listens on
EXPOSE 8081

# The command that runs when the container starts
ENTRYPOINT ["java", "-jar", "app.jar"]
```

*What just happened:* `FROM eclipse-temurin:21-jre` picks a base with a Java 21 *runtime* (a JRE, not the full JDK - smaller, since you only need to *run* the jar). `COPY` drops your fat jar in as `app.jar`. `EXPOSE` is documentation. `ENTRYPOINT` is the command Docker runs on startup - the same `java -jar` you ran by hand, baked into the image. Because the fat jar already bundles Tomcat and every dependency, the Dockerfile needs nothing else.

Build the image and run it:

```bash
docker build -t bookstore:1.0 .
docker run -p 8081:8081 -e SPRING_PROFILES_ACTIVE=prod bookstore:1.0
```

*What just happened:* `docker build` turned the Dockerfile into a tagged image, `bookstore:1.0`. `docker run` started a container from it: `-p 8081:8081` maps the container's port to your host so you can reach it, and `-e SPRING_PROFILES_ACTIVE=prod` passes the active profile in as an environment variable - the *same* externalized-config mechanism, now flowing through Docker. That image is now a portable unit: it runs bit-for-bit identically on your machine, CI, and the production cluster, because the Java version and OS came along inside it.

💡 If Docker itself is still fuzzy - images vs containers, layers, why any of this is an improvement - read [/guides/docker-without-the-magic](/guides/docker-without-the-magic). For Spring Boot specifically, the win is that the fat jar and the container are a natural pair: the jar makes the app self-contained, the image makes the *runtime* self-contained.

## Where it actually runs - and why this is easy

You have a jar, or an image. Where does it go? You've got a spectrum, roughly from most-hands-on to least:

- **A plain VPS or VM.** Copy the jar up, run `java -jar` (usually managed by `systemd` so it restarts on crash/reboot), and put **nginx** in front as a reverse proxy to handle TLS and forward traffic to your app on `localhost:8081`. Maximum control, maximum manual work.
- **A container platform.** Push your image to a registry and let something (Kubernetes, ECS, Cloud Run) schedule and run it. This is where your `/actuator/health` endpoint earns its keep: the platform polls it for *liveness* and *readiness* probes, and that's what enables **zero-downtime rollouts** - it starts new instances, waits until their health says `UP`, shifts traffic over, then retires the old ones. No health endpoint, no safe rollout.
- **A PaaS.** Platforms like Railway, Render, Fly.io, or Heroku take your repo or image and handle the server, TLS, and scaling for you. Least control, least to manage - often the right call for a side project.

💡 The embedded server plus the fat jar is the entire reason Spring Boot deploys so much more easily than classic Java. The old model meant installing and tuning an application server, then deploying a WAR *into* it. Boot collapsed that: the server lives inside your one runnable artifact, so "deploy" becomes "run a file" (or "run an image").

For taking a real project the last mile to a live URL - domain, TLS, picking a host, the unglamorous final 20% - see [/guides/ship-your-side-project](/guides/ship-your-side-project).

## Recap

1. **Actuator** gives you production monitoring endpoints for free - add `spring-boot-starter-actuator` and you get `/actuator/health` (what load balancers and orchestrators poll), `/actuator/metrics`, and `/actuator/info`.
2. **Lock down the actuator surface.** Only `health` is exposed by default; opt others in explicitly with `management.endpoints.web.exposure.include`, and never expose everything - `/actuator/env` and `/actuator/heapdump` can leak secrets.
3. **`./mvnw package` builds a fat jar** - your code, all dependencies, and an embedded Tomcat in one self-contained file. Run it anywhere with `java -jar app.jar`. That file *is* your deployable.
4. **Configure prod from the outside.** Use the `prod` profile plus environment variables for the real database and secrets; never let dev defaults (H2, `ddl-auto=create`, DEBUG logging, wide-open CORS) reach production.
5. **Docker freezes the runtime.** A minimal Dockerfile (JRE base + the jar) produces an image that runs identically everywhere; pass config in with `-e`.
6. **Where it runs** ranges from a VPS behind nginx, to a container platform (where health checks enable zero-downtime rollouts), to a PaaS. The embedded server + fat jar is *why* Spring Boot deploys so easily compared to old WAR-on-Tomcat Java.

## Quick check

Make sure the production picture is solid before the guide wraps up:

```quiz
[
  {
    "q": "Why do load balancers and orchestrators care about /actuator/health?",
    "choices": [
      "It returns a simple UP/DOWN status they poll to decide whether to route traffic to an instance - and it enables zero-downtime rollouts",
      "It speeds up the application by caching responses",
      "It is required for the embedded Tomcat server to start at all",
      "It encrypts traffic between the app and the load balancer"
    ],
    "answer": 0,
    "explain": "Health is the endpoint infrastructure polls. UP (200) means keep sending traffic; DOWN (503) or no answer means stop routing and maybe restart. A container platform uses it for liveness/readiness probes, which is exactly what makes safe, zero-downtime rollouts possible."
  },
  {
    "q": "What makes a Spring Boot fat jar runnable on any machine with just `java -jar app.jar`?",
    "choices": [
      "It bundles your compiled code, all dependencies, AND an embedded web server inside one self-contained file",
      "It compiles your code to native machine code so no JVM is needed",
      "It downloads its dependencies from Maven Central at startup",
      "It includes a copy of the operating system"
    ],
    "answer": 0,
    "explain": "The fat (uber) jar packs your classes, every dependency, and an embedded Tomcat into a single file. There's nothing to install on the target beyond a Java runtime - which is why deployment collapses to copying one file and running it, unlike the old WAR-into-a-server model."
  },
  {
    "q": "Which actuator configuration is dangerous to use in production?",
    "choices": [
      "exposure.include: \"*\" - exposing every endpoint, including /env and /heapdump which can leak secrets and memory contents",
      "exposure.include: health - exposing only the health endpoint",
      "Putting management endpoints behind authentication",
      "Running management endpoints on a separate internal-only port"
    ],
    "answer": 0,
    "explain": "Exposing everything makes endpoints like /actuator/env (resolved config, possibly with secrets), /actuator/heapdump (a full memory snapshot), and /actuator/shutdown reachable. Expose only the minimal set you need, and ideally guard the management surface with auth or a separate port."
  }
]
```

---

[← Phase 9: Security with Spring Security](09-security-with-spring-security.md) · [Guide overview](_guide.md) · [Phase 11: Where to Go Next →](11-where-to-go-next.md)
