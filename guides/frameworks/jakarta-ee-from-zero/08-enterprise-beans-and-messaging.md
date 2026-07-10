---
title: "Enterprise Beans & Messaging"
guide: "jakarta-ee-from-zero"
phase: 8
summary: "Enterprise beans (EJB) give you pooling, transactions, scheduling, and async for free; Jakarta Messaging lets services hand work to each other through queues — the enterprise way to stay loosely coupled."
tags: [jakarta-ee, ejb, stateless, jms, messaging, scheduling, async, enterprise-beans]
difficulty: intermediate
synonyms: ["jakarta ee ejb stateless stateful", "ejb vs cdi bean", "jakarta messaging jms", "jakarta ee scheduled task @Schedule", "jakarta ee async method", "message driven bean", "jakarta ee background jobs"]
updated: 2026-07-10
---

# Enterprise Beans & Messaging

By now you've met CDI beans (Phase 3) and watched the container build and wire your objects for you.
This phase introduces a second family of container-managed components — **enterprise beans (EJB)** — and
then steps outside the single application entirely to the question every real system eventually hits:
*how do my services hand work to each other when nobody's waiting for an answer?* That second half is
**messaging** — the part that keeps enterprise systems from collapsing under their own coupling.

Here's the mental model to carry through both halves: so far every call in your app has been *synchronous*
— someone calls a method, blocks, and gets a result. This phase is about everything that happens **on a
schedule**, **in the background**, or **between services that never block on each other**. Same platform,
new dimension: time.

## Enterprise Beans (EJB), honestly

📝 An **enterprise bean (EJB)** is a container-managed business component — a class where the application
server takes over the heavy lifting: transactions, pooling, concurrency, security, lifecycle. EJBs have a
*reputation*. In the Java EE 5 era they were genuinely painful — home interfaces, remote interfaces,
mountains of XML, one trivial bean spread across four files. That EJB is dead. The modern one is a single
annotated class, and it's worth knowing because it still does real work for you.

📝 The one you'll meet constantly is the **`@Stateless` session bean** — a *pooled* bean that's
**transactional by default**. "Pooled" means the container keeps a small stable of instances and hands one
to each caller, then takes it back; you never see two callers sharing the same instance at the same time.
"Transactional by default" means every public method runs inside a database transaction automatically —
no annotation required.

```java
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Stateless
public class ProductService {

    @PersistenceContext
    private EntityManager em;

    public void create(Product product) {
        em.persist(product); // runs inside a container-managed transaction, automatically
    }

    public Product findBySku(String sku) {
        return em.createQuery("SELECT p FROM Product p WHERE p.sku = :sku", Product.class)
                 .setParameter("sku", sku)
                 .getSingleResult();
    }
}
```
*What just happened:* `@Stateless` turns `ProductService` into a pooled, transactional bean. When some
caller invokes `create(...)`, the container grabs a free instance from the pool, opens a transaction,
runs the method, commits (or rolls back on exception), and returns the instance to the pool. You wrote
`em.persist(product)` and nothing about transactions — the container supplied all of that. One instance
is never used by two callers concurrently, so you don't synchronize anything.

📝 The three session-bean flavors, so you can read any enterprise codebase:

| Annotation | Lifecycle | Shared? | Reach for it when… |
|------------|-----------|---------|--------------------|
| `@Stateless` | Pooled; no per-client state kept between calls | One caller at a time (pool) | Almost always — stateless services, the default |
| `@Stateful` | One instance dedicated to one client across calls | Tied to a single client | A multi-step conversation holds state (a wizard, a cart) |
| `@Singleton` | Exactly one instance for the whole app | Shared by everyone | App-wide shared state or startup work (`@Startup`) |

⚠️ `@Stateful` is the one people misuse. It pins an instance to a client and keeps it alive between calls,
which means memory and cleanup concerns — and in a clustered deployment, the state has to follow the
client around. Most "I need stateful" turns out to be "I need to store this somewhere," and the honest
answer is usually a database or a session, not a stateful bean. Reach for `@Stateless` by default.

## EJB vs CDI bean (the honest take)

You may be squinting at `@Stateless ProductService` thinking it looks an awful lot like the
`@ApplicationScoped ProductService` from Phase 3. Good instinct — they overlap heavily, and choosing
between them trips up newcomers.

⚠️ **Modern Jakarta EE largely prefers a CDI bean + `@Transactional` over an EJB.** A plain
`@ApplicationScoped` class with `@Transactional` on its methods gives you the same declarative
transactions through CDI's interceptor machinery, using one consistent programming model for your whole
app — no separate EJB lifecycle to reason about.

```java
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@ApplicationScoped
public class ProductService {

    @PersistenceContext
    private EntityManager em;

    @Transactional                       // CDI interceptor wraps this call in a transaction
    public void create(Product product) {
        em.persist(product);
    }
}
```
*What just happened:* this is the Phase 3 CDI bean with one addition — `@Transactional` from Jakarta
Transactions. The interceptor wraps `create(...)` in a database transaction exactly like the `@Stateless`
version did, but the bean is an ordinary CDI bean: same `@Inject`, same scopes, same testing seam. No EJB
container behavior involved. For brand-new code, this is the path most teams take today.

So why learn EJB at all? Two reasons. First, **you will read it** — EJBs are everywhere in existing
enterprise code, and you can't maintain what you can't recognize. Second, `@Stateless` still hands you a
few things for free that you'd otherwise wire up: **instance pooling**, **declarative transactions
without annotating each method**, and — because of the one-caller-at-a-time pooling — **effective
thread-safety** inside the bean.

💡 The rule of thumb: **know EJBs to read enterprise code; reach for CDI + `@Transactional` in new code.**
They're not enemies — under the hood a modern EJB *is* a CDI-managed bean with extra container services
bolted on. Same family, different amount of magic.

## Scheduling: background jobs without a cron daemon

Real systems have chores: expire stale carts at midnight, recompute a sales rollup hourly, email a digest
every Monday. You *could* stand up an external scheduler (cron, a job server) — but Jakarta EE has a timer
service built in, and the `@Schedule` annotation drives it declaratively.

```java
import jakarta.ejb.Schedule;
import jakarta.ejb.Singleton;

@Singleton
public class ProductMaintenance {

    @Schedule(hour = "3", minute = "0", persistent = false)
    public void purgeDiscontinuedProducts() {
        // runs every night at 03:00, scheduled and invoked by the container
        // ... delete products flagged discontinued, in a container-managed transaction
    }
}
```
*What just happened:* `@Schedule` registers a timer with the container's timer service. The `hour`/`minute`
attributes are a cron-like calendar expression, so this fires at 03:00 every day with no external
scheduler involved — the container wakes the bean and calls the method for you, inside a transaction. We
put it on a `@Singleton` because there should be exactly one scheduler instance for the app, not a pool of
them all firing at once.

💡 `persistent = false` means "if the server is down at 03:00, skip that run — don't replay it later."
The default (`true`) stores missed timers and fires them on restart, which is what you want for jobs that
*must* eventually run (billing) and emphatically not what you want for jobs that are only useful *now*
(a cache refresh). Pick deliberately.

## Asynchronous methods: fire-and-forget

Sometimes a method does slow work the caller shouldn't have to wait on — generating a report, calling a
sluggish third-party API, sending a batch of emails. `@Asynchronous` tells the container to run the method
on a separate thread and return control to the caller immediately.

```java
import jakarta.ejb.Asynchronous;
import jakarta.ejb.Stateless;
import java.util.concurrent.Future;
import jakarta.ejb.AsyncResult;

@Stateless
public class ProductReportService {

    @Asynchronous
    public void reindexCatalog() {
        // slow work runs on a container thread; caller doesn't block
    }

    @Asynchronous
    public Future<Integer> countAndExport() {
        int rows = /* slow export */ 0;
        return new AsyncResult<>(rows); // caller can poll/await this later
    }
}
```
*What just happened:* calling `reindexCatalog()` returns instantly — the container schedules the body on
one of its managed threads and the caller moves on. The second method returns a `Future`, so a caller who
*does* eventually want the result can hold the handle and call `.get()` when ready. Either way, the slow
work is offloaded.

⚠️ Async changes the rules around context. The async method runs on a **different thread**, so it gets a
**new transaction** — it does not join the caller's. If the caller's transaction later rolls back, the
async work has already committed independently; they're decoupled by design. Request-scoped data and
security context don't automatically flow across the thread boundary either. Use `@Asynchronous` for work
that's genuinely independent of the caller's transaction — not as a way to "speed up" something that needs
to be part of the same atomic unit.

## Messaging: how services stay loosely coupled

Everything so far has lived inside one application. Now zoom out. You have an order service and an
inventory service and an email service, and an order needs to touch all three. If the order service calls
each one directly and waits, you've built a chain that's only as available as its weakest link — email
provider hiccups, the whole order stalls.

📝 **Messaging** breaks that chain. Instead of calling a service, a **producer** drops a **message** onto a
**queue** (or **topic**), and a **consumer** picks it up and processes it **asynchronously**, whenever it's
ready. The producer doesn't know or care who consumes it, or when. That's *decoupling*: the two sides are
connected only by the shape of the message, not by being up at the same instant.

This is the same machinery covered conceptually in
[/guides/webhooks-and-message-queues](/guides/webhooks-and-message-queues) — a message queue as a to-do
list between your own services, absorbing spikes and surviving outages. **Jakarta Messaging (JMS)** is the
standard Jakarta EE API for that pattern, and the application server gives you a message broker to talk to.

The producer side is small — inject a `JMSContext` and send:

```java
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.jms.JMSContext;
import jakarta.jms.Queue;
import jakarta.annotation.Resource;

@Stateless
public class ProductEventPublisher {

    @Inject
    private JMSContext jms;

    @Resource(lookup = "java:/jms/queue/ProductCreated")
    private Queue productCreatedQueue;

    public void announceNewProduct(Product product) {
        jms.createProducer().send(productCreatedQueue, product.sku());
        // returns immediately; the message now waits in the queue for a consumer
    }
}
```
*What just happened:* `announceNewProduct` puts a message (the new product's SKU) onto the
`ProductCreated` queue and returns. There's no consumer in sight, and that's the point — whoever cares
about new products reads from this queue on their own schedule. The broker holds the message safely until
someone picks it up, so a down consumer means a backlog, not a lost event.

The consumer side is a **message-driven bean (MDB)** — a bean the container invokes automatically whenever
a message arrives. You don't poll; you just declare what queue you listen to:

```java
import jakarta.ejb.MessageDriven;
import jakarta.ejb.ActivationConfigProperty;
import jakarta.jms.Message;
import jakarta.jms.MessageListener;
import jakarta.jms.TextMessage;

@MessageDriven(activationConfig = {
    @ActivationConfigProperty(propertyName = "destinationLookup",
                              propertyValue = "java:/jms/queue/ProductCreated")
})
public class ProductCreatedListener implements MessageListener {

    @Override
    public void onMessage(Message message) {
        // container calls this once per message, on its own thread
        // ... e.g. warm a cache or reindex search for the new product
    }
}
```
*What just happened:* `@MessageDriven` ties this bean to the `ProductCreated` queue. The container watches
the queue and calls `onMessage(...)` once for every message that lands — no loop, no polling code, no
thread management on your part. Each invocation runs in its own transaction, so a failure can put the
message back for a retry instead of dropping it.

💡 This is the heart of why enterprise systems use messaging: **loose coupling buys you resilience.** The
order service stays fast and available even when a downstream consumer is slow or down, spikes get
absorbed by the queue instead of toppling a service, and you can add new consumers (analytics, audit) to
the same event without touching the producer. The trade-offs — duplicate deliveries, retries, ordering,
dead-letter queues — are exactly the gotchas covered in
[/guides/webhooks-and-message-queues](/guides/webhooks-and-message-queues), and they apply here too.

## Recap

1. **Enterprise beans (EJB)** are container-managed business components. The modern EJB is a single
   annotated class, not the XML nightmare of old. The workhorse is `@Stateless` — a *pooled*, *transactional
   by default* session bean. `@Stateful` pins one instance to one client; `@Singleton` is one instance for
   the whole app.
2. **EJB vs CDI:** new code usually prefers a CDI bean (`@ApplicationScoped`) plus `@Transactional` — one
   consistent model. Learn EJBs to *read* enterprise code; `@Stateless` still hands you pooling,
   declarative transactions, and one-caller-at-a-time thread-safety for free.
3. **Scheduling:** `@Schedule` drives the built-in timer service with cron-like calendar expressions — no
   external scheduler. ⚠️ `persistent` decides whether missed runs replay on restart; choose deliberately.
4. **Asynchronous methods:** `@Asynchronous` offloads slow work to a container thread and returns
   immediately (optionally a `Future`). ⚠️ It runs in a *new* transaction and context doesn't flow across
   the thread — use it only for work independent of the caller.
5. **Messaging (Jakarta Messaging / JMS):** a producer sends a message to a queue; a message-driven bean
   (`@MessageDriven`) consumes it asynchronously. This decouples services — the producer never waits on the
   consumer — which is how enterprise systems stay loosely coupled and resilient.

With background, scheduled, and cross-service work covered, the remaining gap is keeping all of it safe.
Next phase locks the doors: authentication and authorization with Jakarta Security.

## Quick check

Test yourself on the ideas that have to stick from this phase:

```quiz
[
  {
    "q": "What does @Stateless give you that a plain Java class wouldn't?",
    "choices": [
      "Instance pooling, declarative transactions by default, and one-caller-at-a-time thread-safety",
      "Automatic REST endpoints for every public method",
      "A persistent timer that fires the methods on a schedule",
      "A new database connection created per method call"
    ],
    "answer": 0,
    "explain": "A @Stateless session bean is pooled (one caller at a time per instance, so it's effectively thread-safe inside), and every public method runs inside a container-managed transaction by default — none of which you wrote yourself."
  },
  {
    "q": "For brand-new code, which is the approach modern Jakarta EE generally prefers for transactional business logic?",
    "choices": [
      "A CDI bean (@ApplicationScoped) with @Transactional on its methods",
      "An EJB with home and remote interfaces plus deployment XML",
      "A @Stateful session bean shared across all clients",
      "A @MessageDriven bean that calls itself"
    ],
    "answer": 0,
    "explain": "New code usually reaches for a plain CDI bean plus @Transactional — one consistent programming model. EJBs are worth knowing mainly because you'll read them in existing enterprise code."
  },
  {
    "q": "In Jakarta Messaging, why does sending a message to a queue keep services loosely coupled?",
    "choices": [
      "The producer drops the message and returns; a consumer processes it asynchronously whenever it's ready, so neither blocks on the other",
      "The producer waits for the consumer to finish before returning a result",
      "The queue forces the producer and consumer to share the same transaction",
      "Each message is delivered only if the consumer is online at that exact moment"
    ],
    "answer": 0,
    "explain": "A producer sends to the queue and moves on; the broker holds the message until a consumer (a message-driven bean) picks it up. The two sides are connected only by the message shape, not by being up at the same instant — that decoupling is what buys resilience."
  }
]
```

---

[← Phase 7: Validation & JSON Binding](07-validation-and-json-binding.md) · [Guide overview](_guide.md) · [Phase 9: Jakarta Security →](09-jakarta-security.md)
