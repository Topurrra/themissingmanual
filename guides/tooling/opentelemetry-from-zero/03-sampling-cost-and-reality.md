---
title: "OpenTelemetry, From Zero"
guide: opentelemetry-from-zero
phase: 3
summary: "The vendor-neutral standard for telemetry: traces, metrics, and logs from one instrumentation, exported anywhere via the OTel collector."
tags: [opentelemetry, otel, observability, tracing, metrics, collector, instrumentation]
difficulty: intermediate
synonyms: ["opentelemetry tutorial", "otel collector", "what is opentelemetry", "distributed tracing setup", "otel spans context propagation", "instrument once export anywhere", "otel vs vendor agent"]
updated: 2026-06-30
---

# Sampling, cost, and reality

The first month with OTel is a honeymoon. Traces light up, you find a slow query you'd been blind to for a year, everyone's thrilled. Then the bill arrives, or a trace shows up half-empty, and you learn the parts the getting-started guides skip. This phase is those parts: keeping the volume sane, the failures that masquerade as OTel bugs, and the habits that keep traces trustworthy.

## Sampling: you can't keep every trace

A busy service produces an astonishing number of spans, and most traces are boring — a fast, successful request that looks like a million others. Storing all of them is expensive and tells you nothing extra. **Sampling** is deciding which traces to keep. There are two strategies, and the difference is the most consequential choice you'll make.

**Head sampling** decides at the *start* of a trace, before you know how it turns out. It's cheap and simple — flip a coin at the root span, keep 10%.

```yaml
# In the SDK / via env: keep ~10% of traces, chosen at the root.
export OTEL_TRACES_SAMPLER=parentbased_traceidratio
export OTEL_TRACES_SAMPLER_ARG=0.1
```

*What just happened:* the sampler keeps roughly one trace in ten. `parentbased_*` is the important half of the name — it means a child service respects the parent's decision, so an entire distributed trace is kept-or-dropped together. Without that, service A keeps the trace and service B drops it, and you get the shattered, half-missing traces that drive people up the wall.

The catch: head sampling can't know the request will error or be slow, because it decides *first*. You'll throw away exactly the traces you most wanted to see.

**Tail sampling** decides at the *end*, once the whole trace is complete and you can see latency and status. It runs in the collector, which buffers all spans of a trace, then applies rules: keep everything that errored, everything slow, plus a small percentage of the normal ones.

```yaml
processors:
  tail_sampling:
    decision_wait: 10s              # hold spans this long, waiting for the trace to finish
    policies:
      - name: keep-errors
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: keep-slow
        type: latency
        latency: { threshold_ms: 500 }
      - name: keep-some-normal
        type: probabilistic
        probabilistic: { sampling_percentage: 5 }
```

*What just happened:* the collector waits up to 10 seconds for a trace's spans, then keeps it if *any* policy matches — every error, every request over 500 ms, and 5% of the rest. You keep the interesting traces and a representative baseline, and drop the boring bulk. The price is memory and complexity: the collector has to hold spans in flight, which constrains where and how you can run it (all spans of one trace must reach the same collector instance).

> Rule of thumb: start with head sampling because it's trivial. Move to tail sampling when you realize you're missing the errors — which you will, because head sampling drops them blind.

## The cost trap nobody mentions

OTel itself is free; the data it produces is not. Most observability bills scale with **volume**, and the silent budget-killers are usually:

- **High-cardinality attributes.** Putting something unbounded — `user.id`, a request UUID, a full URL with query string — as a *metric* dimension explodes the number of time series and can dwarf everything else. Attributes on *spans* are fine and useful; the danger is unbounded values on *metrics*.
- **Over-instrumented spans.** Auto-instrumentation plus eager manual spans can produce dozens of spans per request. Most are noise.
- **Logs you forgot you forwarded.** Piping debug-level logs through OTel at full volume is a fast way to a surprising invoice.

The collector is your cost-control panel. The `filter`, `attributes`, and sampling processors let you drop health checks, strip high-cardinality dimensions, and thin volume *before* it hits the metered backend — and you tune it without redeploying a single service.

## Failures that look like OTel's fault (but aren't)

When traces go wrong, the cause is almost always one of these, and almost never a bug in OTel:

- **Broken traces across a hop.** A queue, a cron job, an outbound HTTP call, or a proxy didn't carry the `traceparent` context. The trace splits into disconnected fragments. Fix: ensure context is propagated (or manually re-attached) across every async boundary — message brokers especially, since they don't forward headers for you.
- **Nothing shows up at all.** Ninety percent of the time it's the endpoint or the protocol port: gRPC OTLP is `4317`, HTTP OTLP is `4318`, and mixing them up means your spans sail into a closed door. Add a `debug` exporter to the collector and watch whether spans even arrive.
- **Clock skew makes the waterfall look wrong.** Spans from a machine with a drifting clock render with impossible overlaps or negative gaps. The traces are real; the clocks lied. Fix it at the host with NTP, not in OTel.
- **Missing spans after enabling sampling.** Working as designed — you asked it to drop traces. Confirm your sampler ratio before assuming data loss.

## Semantic conventions: the boring habit that pays off

OTel publishes **semantic conventions** — standard names for common attributes, like `http.request.method`, `db.system`, `service.name`. They feel pedantic until the moment a backend's dashboard, alert, or service map *just works* because your attributes matched the names it expected. Custom-named attributes (`my_http_method`) leave you wiring everything by hand. Follow the conventions for anything standard; invent names only for genuinely domain-specific attributes (`cart.discount_total` is yours to name).

In the wild: teams that succeed with OTel treat it as a product with an owner, not a one-time install. Someone owns the collector config, the sampling policy, and the conventions — because telemetry that nobody curates degrades into expensive noise. Start small (auto-instrumentation, head sampling, one collector), then evolve sampling and processing as your volume and your questions grow.

```quiz
[
  {
    "q": "Why does head sampling tend to lose the traces you most want?",
    "choices": [
      "It keeps too many traces and hides errors in the noise",
      "It decides at the start of a trace, before it knows whether the request errored or was slow",
      "It only works inside the collector",
      "It always keeps errors but drops normal traces"
    ],
    "answer": 1,
    "explain": "Head sampling decides at the root span, before the outcome is known, so it can drop a trace that later turned out to be a slow error."
  },
  {
    "q": "Which is the classic silent driver of a high observability bill?",
    "choices": [
      "Following OTel's semantic conventions",
      "Running a collector",
      "Putting high-cardinality values like user IDs as metric dimensions",
      "Using head sampling"
    ],
    "answer": 2,
    "explain": "Unbounded values as metric dimensions explode the number of time series. (On spans, attributes are fine; the danger is on metrics.)"
  },
  {
    "q": "A trace splits into disconnected single-service fragments after passing through a message queue. The most likely cause is:",
    "choices": [
      "OpenTelemetry has a bug in its trace model",
      "Context (traceparent) wasn't propagated across the async boundary",
      "The backend rejected the spans",
      "Sampling dropped the middle spans"
    ],
    "answer": 1,
    "explain": "Queues and async boundaries don't forward trace context automatically; without propagating it, downstream spans start a new, disconnected trace."
  }
]
```

[← Phase 2: Instrumenting and exporting](02-instrumenting-and-exporting.md) | [Overview](_guide.md)
