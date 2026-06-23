---
title: "Dependency Injection, Deep"
guide: "spring-framework-from-zero"
phase: 4
summary: "Constructor vs setter vs field injection and why constructor wins, exactly how @Autowired resolves a bean, fixing ambiguity with @Primary and @Qualifier, injecting collections of beans, and @Value for config."
tags: [spring, dependency-injection, autowired, qualifier, primary, constructor-injection, ambiguity]
difficulty: intermediate
synonyms: ["spring dependency injection deep", "spring @Autowired how it works", "spring constructor vs field injection", "spring @Qualifier @Primary", "spring multiple beans same type", "spring NoUniqueBeanDefinitionException", "spring inject list of beans"]
updated: 2026-06-22
---

# Dependency Injection, Deep

You already met dependency injection in [Spring Boot From Zero](/guides/spring-boot-from-zero) — a class
asks for what it needs in its constructor, and the container hands it over. That was the happy path: one
bean of each type, everything resolves cleanly. This phase is about what happens when reality gets messier
— two beans that fit the same slot, optional dependencies, a whole *list* of implementations you want to
loop over. These are the situations where Boot users hit a wall and the error messages stop making sense.

Here's the mental model to carry through: **injection is the container playing matchmaker.** Your class
declares "I need a `MessageSender`," and Spring goes shopping in its bag of beans for something that fits.
Most of this phase is understanding the *matching rules* — how Spring decides which bean fits, what it does
when several fit, and how you can put your thumb on the scale to pick the winner. Once you can predict
those rules, the scary exceptions become obvious and the fixes become one-liners.

Our cast for the whole phase: a `NotificationService` that needs to send messages, a `MessageSender`
interface, and **two** implementations — `EmailSender` and `SmsSender`. That second implementation is
deliberate: it's what creates the ambiguity that the back half of this phase is all about.

```java
public interface MessageSender {
    void send(String to, String message);
}
```
*What just happened:* one tiny interface — the slot. Anything that implements `MessageSender` can be
dropped into that slot, and `NotificationService` won't know or care which one it got. That's the
substitutability DI is built to give you.

## The three injection styles

There are three ways to get a dependency into a bean. They are not equal — one is recommended, one is
situational, one is discouraged. Let's see all three for `NotificationService`, then make the case.

📝 **Constructor injection** — dependencies arrive as constructor parameters. This is the one to reach for.

```java
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final MessageSender sender;

    public NotificationService(MessageSender sender) {   // Spring supplies one
        this.sender = sender;
    }

    public void notify(String to, String message) {
        sender.send(to, message);
    }
}
```
*What just happened:* `NotificationService` declares its dependency right in the constructor signature.
At startup Spring sees this class needs a `MessageSender`, finds the matching bean, and passes it in. The
field is `final`, so once set it can never change — the object is fully built and valid the instant it
exists. 💡 With exactly **one constructor**, you don't write `@Autowired` on it anymore — Spring uses the
sole constructor for injection automatically. (Older code puts `@Autowired` there; it's redundant now.)

📝 **Setter injection** — the dependency arrives through a setter method after construction.

```java
@Service
public class NotificationService {
    private MessageSender sender;

    @Autowired                       // setter injection
    public void setSender(MessageSender sender) {
        this.sender = sender;
    }
}
```
*What just happened:* Spring constructs the object first, then calls `setSender` to supply the dependency.
The field can't be `final` (it's assigned after construction), and there's a window where the object exists
but `sender` is still `null`. Setter injection earns its keep for genuinely **optional** dependencies — a
dependency the bean can work without — or for things you want to be able to reconfigure later. For required
collaborators, it's the weaker choice.

⚠️ **Field injection** — `@Autowired` straight onto a field. Avoid this.

```java
@Service
public class NotificationService {
    @Autowired                       // ⚠️ field injection — discouraged
    private MessageSender sender;
}
```
*What just happened:* Spring reaches in via reflection and sets the private field directly — no constructor,
no setter. It looks the shortest, and that's the bait. The field can't be `final` (mutable, `null` until
Spring fills it), the dependency is **hidden** (the constructor no longer advertises what this class needs —
you have to scan for annotations to find out), and it's painful to test: you can't write
`new NotificationService(fake)`; you need reflection or a full Spring context just to inject a stand-in.

**Why constructor injection wins:** it's explicit (the signature is an honest list of every dependency),
immutable (`final` fields, no half-built window), and trivially testable (the constructor *is* the seam —
`new NotificationService(fakeSender)`, no Spring required). Reach for constructor injection by default;
use setter injection only for optional dependencies; skip field injection in new code.

## How `@Autowired` resolves a bean

When Spring needs to fill an injection point, it follows a definite order. Knowing it turns every wiring
error from a mystery into a lookup.

📝 The resolution order:

1. **By type first.** Spring looks for a bean whose type matches the parameter's type (`MessageSender`).
2. **If exactly one matches** — done, inject it. This is the common case.
3. **If several match** — Spring tries to break the tie **by name**: it compares the parameter/field name
   against the candidate bean names. If one bean's name equals the injection point's name, that one wins.
4. **If still ambiguous** (multiple matches, no name tiebreak) — Spring gives up and throws an error.

Let's make step 3 concrete. Suppose two `MessageSender` beans exist, named `emailSender` and `smsSender`.
This resolves cleanly *because of the parameter name*:

```java
@Service
public class NotificationService {
    private final MessageSender emailSender;   // name matches the bean "emailSender"

    public NotificationService(MessageSender emailSender) {
        this.emailSender = emailSender;
    }
}
```
*What just happened:* two beans match by type, so Spring goes to the name tiebreak. The parameter is named
`emailSender`, and there's a bean named `emailSender` — match. Spring injects that one. Rename the parameter
to `smsSender` and you'd get the SMS bean instead. This name-based fallback is real and easy to trip over:
a rename of a variable can silently change *which* bean you get. It works, but relying on it is fragile —
the explicit tools in the next section say what you mean out loud.

## The ambiguity problem & fixes

Now the failure that sends Boot users to a search engine. Define both implementations as beans:

```java
@Service
public class EmailSender implements MessageSender {
    public void send(String to, String message) {
        System.out.println("EMAIL -> " + to + ": " + message);
    }
}

@Service
public class SmsSender implements MessageSender {
    public void send(String to, String message) {
        System.out.println("SMS -> " + to + ": " + message);
    }
}
```
*What just happened:* two beans now implement `MessageSender`. If `NotificationService` asks for a plain
`MessageSender` with a parameter name that matches *neither* bean (say, the parameter is just called
`sender`), Spring matches two beans by type, finds no name tiebreak, and refuses to guess:

```console
APPLICATION FAILED TO START

Description:
Parameter 0 of constructor in com.example.NotificationService required a single bean,
but 2 were found:
	- emailSender: defined in file [.../EmailSender.class]
	- smsSender: defined in file [.../SmsSender.class]

Action:
Consider marking one of the beans as @Primary, updating the consumer to accept
multiple beans, or using @Qualifier to identify the bean that should be consumed
```
⚠️ That's `NoUniqueBeanDefinitionException` — "I found more than one and I won't pick for you." Spring even
lists your two fixes. Here they are.

**Fix 1 — `@Primary`: declare a default winner.** Mark one bean as the one to choose when there's a tie.

```java
import org.springframework.context.annotation.Primary;

@Service
@Primary                              // the default MessageSender
public class EmailSender implements MessageSender {
    public void send(String to, String message) {
        System.out.println("EMAIL -> " + to + ": " + message);
    }
}
```
*What just happened:* now an unqualified `MessageSender` injection point resolves to `EmailSender`
everywhere, no other change needed. `@Primary` is for "there's an obvious default, and the exceptions are
rare." It's a property of the *bean*, set once, applied to every injection that doesn't ask for something
more specific.

**Fix 2 — `@Qualifier`: pick explicitly at the injection point.** Name exactly which bean you want.

```java
import org.springframework.beans.factory.annotation.Qualifier;

@Service
public class NotificationService {
    private final MessageSender sender;

    public NotificationService(@Qualifier("emailSender") MessageSender sender) {
        this.sender = sender;
    }
}
```
*What just happened:* `@Qualifier("emailSender")` tells Spring "skip the guessing — inject the bean named
`emailSender`." This is per-injection-point and beats the parameter-name guesswork: it's explicit and
survives renames. The default bean name is the class name with a lowercase first letter (`EmailSender` →
`emailSender`), which is what we're referencing here. 💡 Use `@Primary` for the project-wide default and
`@Qualifier` when a *particular* consumer needs a *particular* implementation — they compose: `@Primary`
sets the fallback, `@Qualifier` overrides it locally.

## Injecting collections & optionals

Here's a pattern most Boot users never realize they have. When several beans share a type, you don't have to
*choose* one — you can ask for **all of them**.

📝 Inject `List<MessageSender>` and Spring hands you every implementation:

```java
import java.util.List;

@Service
public class NotificationService {
    private final List<MessageSender> senders;

    public NotificationService(List<MessageSender> senders) {   // ALL MessageSender beans
        this.senders = senders;
    }

    public void broadcast(String to, String message) {
        for (MessageSender sender : senders) {
            sender.send(to, message);
        }
    }
}
```
*What just happened:* no ambiguity error this time — by asking for a `List<MessageSender>`, you told Spring
"I want the whole collection," so it injects both `EmailSender` and `SmsSender`. Now `broadcast` fires the
message through every channel at once. This is the backbone of the **strategy / plugin pattern**: add a new
`MessageSender` implementation (a `PushSender`, a `SlackSender`) and it joins the list automatically — no
edit to `NotificationService`. The consumer never changes; the set of strategies grows by itself.

💡 Prefer keying by name? Inject `Map<String, MessageSender>` and the keys are the bean names:

```java
import java.util.Map;

@Service
public class NotificationService {
    private final Map<String, MessageSender> sendersByName;   // "emailSender" -> EmailSender, etc.

    public NotificationService(Map<String, MessageSender> sendersByName) {
        this.sendersByName = sendersByName;
    }

    public void sendVia(String channel, String to, String message) {
        sendersByName.get(channel).send(to, message);   // pick a strategy by name at runtime
    }
}
```
*What just happened:* the map's keys are bean names and the values are the beans, so you can select a
strategy at runtime — `sendVia("smsSender", ...)`. Great for dispatching on a config value or a request
parameter.

📝 For a dependency that **might not exist**, you have three options:

```java
import java.util.Optional;

// 1. Optional<T> — empty if no bean exists
public NotificationService(Optional<MessageSender> maybeSender) { ... }

// 2. required = false — leaves the field null if absent
@Autowired(required = false)
private MessageSender sender;

// 3. @Nullable — same idea, on a constructor/setter param
public NotificationService(@Nullable MessageSender sender) { ... }
```
*What just happened:* all three tell Spring "don't fail if this bean is missing." `Optional<T>` is the
cleanest — you get an empty `Optional` instead of a `null` to forget about. Use these only when absence is
genuinely valid; a *required* collaborator should fail loudly at startup, not silently inject `null`.

## `@Value` and the bigger picture

Not everything you inject is a bean — sometimes it's a plain config value. `@Value("${...}")` pulls a value
from your properties (the same `application.properties` Boot uses) straight into a field or parameter.

```java
@Service
public class NotificationService {
    private final MessageSender sender;
    private final String fromAddress;

    public NotificationService(MessageSender sender,
                               @Value("${notifications.from:noreply@acme.com}") String fromAddress) {
        this.sender = sender;
        this.fromAddress = fromAddress;
    }
}
```
*What just happened:* Spring injects the `MessageSender` bean *and* reads `notifications.from` from config
into `fromAddress` in the same constructor. The `:noreply@acme.com` part is a default used when the property
isn't set. Same injection mechanism, different source — beans come from the container, `@Value` comes from
config.

💡 Step back and see the whole point. **Dependency injection is the reason the container exists.** You
declare what you need *by type*, the container finds it and supplies it, and because you depend on the
`MessageSender` *interface* rather than a concrete class, you can swap the implementation — real `EmailSender`
in production, a recording fake in tests — **without touching `NotificationService` at all.** Everything in
this phase (qualifiers, primaries, collections, optionals) is just refinements of that one matchmaking act:
giving you precise control over *which* bean lands in *which* slot. Next we look at the beans themselves —
how long they live, how many copies exist, and what happens to them from birth to shutdown.

## Recap

1. **Three injection styles, ranked.** Constructor injection is the default — explicit, immutable (`final`),
   testable. Setter injection suits *optional* dependencies. Field `@Autowired` is discouraged: hidden
   dependencies, no `final`, hard to test. A single constructor needs no `@Autowired`.
2. **`@Autowired` resolves by type first**, then breaks ties by **name** (parameter/field name vs bean
   name), then errors if it still can't choose. Relying on the name tiebreak is fragile.
3. **Two beans of one type → `NoUniqueBeanDefinitionException`.** Fix with `@Primary` (a project-wide
   default winner on the bean) or `@Qualifier("beanName")` (an explicit pick at the injection point); they
   compose.
4. **Inject the whole set.** `List<MessageSender>` gives you every implementation, `Map<String, MessageSender>`
   keys them by bean name — the foundation of the strategy/plugin pattern. New implementations join
   automatically.
5. **Optionals and config.** `Optional<T>`, `@Autowired(required=false)`, and `@Nullable` allow a missing
   bean; `@Value("${...}")` injects config values. DI's payoff: depend on interfaces, swap implementations
   without touching the consumer.

## Quick check

Make sure the matching rules and the ambiguity fixes have stuck:

```quiz
[
  {
    "q": "Why is constructor injection preferred over field @Autowired?",
    "choices": [
      "Dependencies are explicit in the constructor signature, fields can be final/immutable, and the class is trivially testable with `new Service(fake)` — no Spring needed",
      "It runs faster because Spring avoids reflection entirely",
      "Field injection is not supported outside Spring Boot",
      "Only constructor injection can inject interfaces"
    ],
    "answer": 0,
    "explain": "Constructor injection makes every dependency a visible parameter, allows final (immutable, never-null) fields, and lets a test construct the object directly with a fake. Field @Autowired hides dependencies, can't be final, and resists plain testing."
  },
  {
    "q": "Two beans implement MessageSender. You inject a plain `MessageSender` whose parameter name matches neither bean name. What happens?",
    "choices": [
      "Spring throws NoUniqueBeanDefinitionException — it found more than one and won't pick for you",
      "Spring picks the first one it scanned",
      "Spring injects null and logs a warning",
      "Spring merges both into one proxy bean"
    ],
    "answer": 0,
    "explain": "Resolution is by type, then by name. Two beans match by type and the name tiebreak fails, so Spring refuses to guess and throws NoUniqueBeanDefinitionException. Fix it with @Primary or @Qualifier."
  },
  {
    "q": "You want NotificationService to send through every available channel. What do you inject?",
    "choices": [
      "List<MessageSender> — Spring injects all beans of that type, and new implementations join the list automatically",
      "A single @Primary MessageSender and call it in a loop",
      "@Qualifier(\"allSenders\") MessageSender",
      "@Autowired(required=false) MessageSender to get them all"
    ],
    "answer": 0,
    "explain": "Injecting List<MessageSender> (or Map<String, MessageSender>) gives you every implementation — the strategy/plugin pattern. Adding another MessageSender bean later joins the collection with no change to NotificationService."
  }
]
```

---

[← Phase 3: Defining Beans: @Configuration & @Bean](03-defining-beans.md) · [Guide overview](_guide.md) · [Phase 5: Bean Scopes & Lifecycle →](05-bean-scopes-and-lifecycle.md)