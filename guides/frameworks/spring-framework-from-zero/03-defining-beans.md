---
title: "Defining Beans: @Configuration & @Bean"
guide: "spring-framework-from-zero"
phase: 3
summary: "The two ways to put beans in the container — @Bean factory methods and component scanning — when to reach for each, and why @Bean methods are the manual version of Boot's auto-configuration."
tags: [spring, configuration, bean, component-scan, java-config, bean-definition, auto-configuration]
difficulty: intermediate
synonyms: ["spring @Configuration @Bean", "spring java config", "spring component scanning vs @Bean", "spring how to define a bean", "spring bean methods", "spring auto configuration manual equivalent"]
updated: 2026-06-22
---

# Defining Beans: @Configuration & @Bean

In the last phase you met the container — the `ApplicationContext` that builds your objects and hands them to each other so you stop writing `new` everywhere. But we glossed over a question that turns out to be the whole game: *how does the container know which objects to build in the first place?* It doesn't read your mind. You have to tell it. And there are exactly two ways to do that.

Here's the mental model to carry through this phase. The container is a registry of recipes. Every bean in the application started life as a *recipe* you registered — a description that says "here's a thing I want managed, and here's how to make it." The container reads all the recipes at startup, makes one of each, and keeps them. The two ways to define beans are just two ways of writing recipes: one where **you write the factory method by hand**, and one where **Spring discovers your classes and writes the recipe for you**. Same registry, same beans at the end. Different ergonomics. Once you can see them as two doors into the same room, the rest of Spring's configuration stops being a grab-bag of annotations and becomes a single, simple choice.

## Two ways to register a bean

📝 **The two doors:**

1. **`@Configuration` + `@Bean` methods.** You write a configuration class with methods annotated `@Bean`. Each method *is* the recipe — it constructs an object and returns it, and the return value becomes a bean. This is the **explicit** door: you control every detail of how the object is built.
2. **`@Component` (and friends like `@Service`) + component scanning.** You annotate the class itself, and Spring scans your packages, finds the annotated classes, and registers a recipe for each one automatically. This is the **discovery** door: Spring does the registering, you just mark what's eligible.

Both produce real beans the container manages identically. A bean defined by `@Bean` and a bean defined by `@Component` are indistinguishable once they're in the container — the difference is purely in *how the recipe got written*. Let's see our `NotificationService` and `MessageSender` through each door.

Here's the discovery door, which you already glimpsed in Phase 2:

```java
@Service
public class EmailSender implements MessageSender {
    public void send(String to, String body) {
        System.out.println("EMAIL → " + to + ": " + body);
    }
}

@Service
public class NotificationService {
    private final MessageSender sender;

    public NotificationService(MessageSender sender) {
        this.sender = sender;
    }

    public void notifyUser(String user, String message) {
        sender.send(user, message);
    }
}
```

*What just happened:* nothing here registers a bean *explicitly* — there's no factory method anywhere. The `@Service` annotation marks each class as something Spring should pick up during component scanning. At startup Spring finds both classes, sees `NotificationService` needs a `MessageSender` in its constructor, spots that `EmailSender` is a `MessageSender`, and wires them together. You described *what* the classes are; Spring figured out *how* to build and connect them.

Now the explicit door — same two beans, but you write the recipes yourself:

```java
@Configuration
public class AppConfig {

    @Bean
    public MessageSender messageSender() {
        return new EmailSender();
    }

    @Bean
    public NotificationService notificationService() {
        return new NotificationService(messageSender());
    }
}
```

*What just happened:* `AppConfig` is a plain class marked `@Configuration`, which tells Spring "this class contains bean recipes." Each `@Bean` method is a recipe: `messageSender()` builds an `EmailSender` and returns it, and `notificationService()` builds a `NotificationService`, passing it the sender by *calling the other bean method*. Notice the classes here need **no annotations at all** — `EmailSender` and `NotificationService` could be untouched plain Java. All the wiring lives in the config class. You did by hand exactly what component scanning did automatically.

## @Bean methods: the explicit version of auto-config

Look again at that `notificationService()` method. It's a factory: it returns an object, fully constructed, ready to use. The container calls it once, keeps the result, and that result is a bean. That's the entire idea of a `@Bean` method — **a method whose return value the container adopts and manages**.

The power of writing it yourself is *control*. You decide which implementation to use, what to pass into the constructor, how to configure it before returning:

```java
@Configuration
public class AppConfig {

    @Bean
    public MessageSender messageSender(
            @Value("${notify.from-address}") String fromAddress) {
        EmailSender sender = new EmailSender();
        sender.setFromAddress(fromAddress);
        return sender;
    }

    @Bean
    public NotificationService notificationService(MessageSender sender) {
        return new NotificationService(sender);
    }
}
```

*What just happened:* the `messageSender()` recipe now reads a configuration value (`notify.from-address`) and uses it to set up the `EmailSender` before returning it — that's construction *you* fully own. The `notificationService()` method takes `MessageSender` as a parameter instead of calling `messageSender()` directly; Spring sees the parameter and injects the existing sender bean. Both styles work (we'll get to the subtle difference in calling-vs-injecting shortly), but the point stands: inside a `@Bean` method, you have a normal Java method body and can do whatever construction the object needs.

💡 **Insight — this is exactly what auto-configuration is.** When you used Spring Boot and "magic" beans appeared — a `DataSource`, a JSON serializer, a web server — every one of them came from a `@Bean` method just like these, written by the Spring team instead of by you. Boot ships *thousands* of `@Bean` methods bundled into its auto-configuration classes. There is no separate, mysterious mechanism: auto-configuration is plain `@Bean` methods you didn't have to type. The first time this clicks, Boot stops being a black box. You're learning to read the source code Boot generates on your behalf. (More on Boot in [/guides/spring-boot-from-zero](/guides/spring-boot-from-zero).)

## Component scanning: let Spring find them

The discovery door is powered by `@ComponentScan`. In a plain Spring app you point it at a package; in Spring Boot, `@SpringBootApplication` includes it pointed at your main class's package (which is why Boot apps "just find" your services).

```java
@Configuration
@ComponentScan("com.example.app")
public class AppConfig {
    // No @Bean methods needed — scanning finds the @Service / @Component classes.
}
```

*What just happened:* `@ComponentScan("com.example.app")` tells Spring to walk that package and every sub-package, looking for classes marked with stereotype annotations — `@Component` and its specializations `@Service`, `@Repository`, `@Controller`. Each match becomes a bean automatically, no factory method required. This config class has *zero* `@Bean` methods because it doesn't need any; the recipes are written by Spring from the annotated classes themselves.

📝 The stereotype annotations are all `@Component` underneath — `@Service`, `@Repository`, and `@Controller` are `@Component` with a label that documents the class's role (and occasionally enables extra behavior, like exception translation for `@Repository`). For our `MessageSender` and `NotificationService`, `@Service` is the natural fit: they hold business logic.

So when do you use which door? Here's the rule that settles almost every case:

⚠️ **The rule: `@Component` for code you own, `@Bean` for code you don't.** If it's *your* class, annotate it with `@Service`/`@Component` and let scanning find it — that's the least ceremony. But you can't add an annotation to a class you didn't write: a `DataSource` from a database library, an HTTP client, a third-party `MessageSender`. You can't open their source and slap `@Component` on it. For those, you write a `@Bean` method that constructs the third-party object and returns it. That's the *only* way to get someone else's class into the container.

This is also exactly why Boot's auto-config is built from `@Bean` methods and not component scanning: Boot is configuring *other people's* libraries (Tomcat, Jackson, Hibernate). It can't annotate their classes, so it writes `@Bean` methods — the same tool you'd reach for.

## The @Configuration proxying gotcha

Now a subtle one that bites people who think they understand `@Bean`. Look back at this:

```java
@Configuration
public class AppConfig {

    @Bean
    public MessageSender messageSender() {
        return new EmailSender();
    }

    @Bean
    public NotificationService notificationService() {
        return new NotificationService(messageSender()); // calling another @Bean method
    }
}
```

That `messageSender()` call inside `notificationService()` looks like a plain Java method call. If it *were* a plain call, it would run `messageSender()` again and create a **second, brand-new** `EmailSender` — separate from the one the container made when it processed the `messageSender()` bean. You'd end up with two senders, and your singleton wouldn't be a singleton. That would quietly break things: anything else injected with `MessageSender` gets a *different* instance than `NotificationService` is holding.

📝 But that's not what happens. Inside a `@Configuration` class, calling one `@Bean` method from another returns the **same singleton instance** the container already created — not a new object. You get exactly one `EmailSender`, shared, as you'd expect.

💡 **Why it works: Spring proxies the `@Configuration` class.** At startup Spring doesn't use your `AppConfig` directly — it creates a *subclass proxy* of it and registers that. The proxy intercepts every call to a `@Bean` method: the first call really runs your method and stores the result; every later call to that method returns the stored bean instead of running the method again. So `messageSender()` inside `notificationService()` is intercepted, and it hands back the singleton. This interception is *the* reason `@Configuration` exists as its own annotation rather than just `@Component`.

⚠️ **Gotcha — the proxy only applies inside `@Configuration`.** If you put `@Bean` methods on a `@Component` class instead (which is technically allowed, "lite mode"), there's no proxy, and calling one `@Bean` method from another *does* create a new object every time. Same code, different annotation, completely different behavior — and no error to warn you. The safe habit: put `@Bean` methods in `@Configuration` classes, full stop. Then inter-bean calls always give you singletons. (We'll meet this proxy machinery again in [Phase 6](06-spring-aop-and-proxies.md) — it's the same trick Spring uses for transactions and AOP.)

## Conditions: the layer that turns @Bean into auto-config

One last piece connects everything back to Boot. You now know auto-configuration is just `@Bean` methods. But if Boot blindly ran every one of its thousands of `@Bean` methods, you'd get a `DataSource` even in an app with no database. That's clearly not what happens. The missing ingredient is **conditions**.

💡 **Boot's `@Bean` methods are guarded by `@Conditional` annotations.** Spring lets you attach a condition to a `@Bean` method so it only fires when the condition holds. Boot leans on a few constantly:

- `@ConditionalOnClass(...)` — "create this bean only if *this class is on the classpath*" (i.e. the relevant library is present).
- `@ConditionalOnMissingBean(...)` — "create this bean only if *the developer hasn't defined their own* of this type."

Conceptually, a Boot auto-config method reads:

```java
@Bean
@ConditionalOnClass(MessageSender.class)
@ConditionalOnMissingBean
public MessageSender messageSender() {
    return new EmailSender();   // a sensible default
}
```

*What just happened:* this is a normal `@Bean` method — but the two conditions turn it into auto-configuration. `@ConditionalOnClass(MessageSender.class)` means it only even *considers* running if a `MessageSender` type is on the classpath. `@ConditionalOnMissingBean` means it backs off entirely the moment *you* define your own `MessageSender` bean. So you get a working default for free, but the instant you want control, your bean wins and Boot's steps aside silently. That "default unless you override" behavior you felt in Boot? It's literally these two annotations on plain `@Bean` methods.

📝 So here's the full picture, end to end: **a `@Bean` method is a recipe → a condition is a guard on that recipe → thousands of guarded `@Bean` methods *is* auto-configuration.** There was never any magic. You now understand the mechanism from the bottom up: when Boot wires something for you, it's running a conditional `@Bean` method, and you could read every one of them. That's the payoff of learning core Spring before — or alongside — Boot.

## Recap

- **Two doors to register a bean:** `@Configuration` + `@Bean` methods (explicit, you write the factory), and `@Component`/`@Service` + `@ComponentScan` (discovery, Spring finds your classes). Both produce identical, container-managed beans.
- **A `@Bean` method is a factory recipe** — it constructs and returns an object the container adopts. You control which implementation, what gets passed in, and any setup before returning.
- **`@Bean` methods are auto-configuration.** Boot's "magic" beans are thousands of `@Bean` methods written by the Spring team. Same mechanism you use by hand — no separate machinery.
- **The rule: `@Component` for code you own, `@Bean` for code you don't.** You can't annotate a third-party class, so a `@Bean` method is the only way to put someone else's object in the container — which is exactly why Boot configures libraries with `@Bean` methods.
- **The `@Configuration` proxy gotcha:** inside a `@Configuration` class, calling one `@Bean` method from another returns the *same singleton* (Spring proxies the class to intercept the call). Put `@Bean` methods on a plain `@Component` and you lose that — you get new objects every call.
- **Conditions turn `@Bean` into auto-config.** `@ConditionalOnClass` and `@ConditionalOnMissingBean` guard Boot's `@Bean` methods so a sensible default appears only when the library is present and you haven't defined your own. Guarded `@Bean` methods *are* auto-configuration.

## Quick check

Make sure the two doors and the proxy gotcha actually stuck:

```quiz
[
  {
    "q": "You need to register a MessageSender that comes from a third-party library you can't modify. Which approach do you use?",
    "choices": [
      "Add @Component to the third-party class",
      "Write a @Bean method in a @Configuration class that constructs and returns it",
      "Nothing — Spring registers all classes on the classpath automatically",
      "Use @ComponentScan pointed at the library's package"
    ],
    "answer": 1,
    "explain": "You can't annotate a class you don't own, so component scanning can't reach it. A @Bean method is the only way to put a third-party object into the container — the same reason Boot's auto-config uses @Bean methods to configure libraries."
  },
  {
    "q": "Inside a @Configuration class, one @Bean method calls another @Bean method directly. What does that inner call return?",
    "choices": [
      "A brand-new object every time the call runs",
      "Null, because @Bean methods can't call each other",
      "The same singleton instance the container already created",
      "A copy of the original bean"
    ],
    "answer": 2,
    "explain": "Spring proxies @Configuration classes and intercepts @Bean method calls, returning the already-created singleton instead of running the method again. (This only holds inside @Configuration — on a plain @Component you'd get a new object each time.)"
  },
  {
    "q": "What makes Spring Boot's auto-configuration different from the @Bean methods you write by hand?",
    "choices": [
      "Auto-config uses a special hidden mechanism unrelated to @Bean",
      "Auto-config @Bean methods are guarded by @Conditional annotations so they only fire when a library is present and you haven't defined your own bean",
      "Auto-config beans are not managed by the container",
      "Auto-config can only register your own classes, not third-party ones"
    ],
    "answer": 1,
    "explain": "Auto-configuration IS plain @Bean methods — the only addition is conditions like @ConditionalOnClass and @ConditionalOnMissingBean, which make each default appear only when appropriate and back off the moment you define your own."
  }
]
```

---

[← Phase 2: The IoC Container & ApplicationContext](02-the-ioc-container.md) · [Guide overview](_guide.md) · [Phase 4: Dependency Injection, Deep →](04-dependency-injection-deep.md)
