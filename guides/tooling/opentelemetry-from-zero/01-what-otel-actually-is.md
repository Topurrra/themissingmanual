---
title: "OpenTelemetry, From Zero"
guide: opentelemetry-from-zero
phase: 1
summary: "The vendor-neutral standard for telemetry: traces, metrics, and logs from one instrumentation, exported anywhere via the OTel collector."
tags: [opentelemetry, otel, observability, tracing, metrics, collector, instrumentation]
difficulty: intermediate
synonyms: ["opentelemetry tutorial", "otel collector", "what is opentelemetry", "distributed tracing setup", "otel spans context propagation", "instrument once export anywhere", "otel vs vendor agent"]
updated: 2026-06-30
---

# What OpenTelemetry actually is

Here's the situation OTel was born into. Every monitoring vendor used to ship its own SDK. You'd import their library, call their tracer, format logs their way, and name your metrics by their convention. Your telemetry — the data that describes how your system behaves — was written in *their* dialect. Switching vendors meant re-instrumenting every service by hand. The data was hostage, and everyone knew it.

OpenTelemetry (almost always written "OTel") flips that. It's an open standard for how telemetry is *produced* and *shaped*, governed by the CNCF, the same foundation behind Kubernetes. You instrument your code against OTel's API. Where the data finally lands — a SaaS backend, an open-source stack, a file — is a configuration choice you make later, and can change without touching code. That sentence is the whole guide: **instrument once, export anywhere.**

## The three signals

OTel organizes telemetry into three "signals." You don't have to adopt all three at once, but they're designed to fit together.

- **Traces** — the path of a single request as it moves through your system. A trace is a tree of **spans**, where each span is one unit of work (an HTTP handler, a DB query, a call to another service). Traces answer "*why was this one request slow?*"
- **Metrics** — numbers aggregated over time: request rate, error count, queue depth, p99 latency. Metrics answer "*is the system healthy right now, in aggregate?*"
- **Logs** — timestamped text records of discrete events. Logs answer "*what exactly happened at 14:03?*"

If those three categories are new to you, the [observability primer](/guides/observability-logs-metrics-traces) walks through each in depth. Here we care about what makes OTel special: it gives all three a *common* data model and a *common* way to ship them, so they can reference each other. An exemplar on a latency metric can point straight at the trace of a slow request.

## A span, concretely

A trace is the star of the show, so let's make a span real. Conceptually, one span carries a name, a start and end time, a status, and a bag of key/value **attributes**. Here's what a single span looks like when you print it:

```text
Span: "GET /checkout"
  trace_id:   4bf92f3577b34da6a3ce929d0e0e4736
  span_id:    00f067aa0ba902b7
  parent:     (none — this is the root)
  start:      14:03:12.114
  end:        14:03:12.461   (347 ms)
  status:     OK
  attributes:
    http.request.method = "GET"
    http.route          = "/checkout"
    http.response.status_code = 200
    user.id             = "u_8812"
```

*What just happened:* one request became one span with a unique `span_id`, grouped under a `trace_id` that ties it to every other span in the same request. The attributes are the searchable context — later you can ask "show me checkout spans for user u_8812 that took over 300 ms."

## How a trace crosses service boundaries

A single span is fine, but the magic is a trace that spans *services*. When service A calls service B, A has to tell B "you're part of trace `4bf9…`, and your parent span is `00f0…`." This handoff is called **context propagation**, and it rides along in request headers — for HTTP, a standard header called `traceparent` (the W3C Trace Context format OTel adopts).

```text
Service A (web)                    Service B (payments)
  span: GET /checkout                 span: POST /charge
  trace_id: 4bf9...                   trace_id: 4bf9...   (same!)
  span_id:  00f0...                   parent:   00f0...   (A's span)
        |                                   ^
        |   HTTP request with header        |
        +--- traceparent: 00-4bf9...-00f0...-01 ---+
```

*What just happened:* B read the `traceparent` header, saw it belonged to trace `4bf9…`, and made its own span a *child* of A's span. Now both spans share one `trace_id`, so your backend can draw the full waterfall — A waited on B — across two separate processes. No shared database, no manual correlation IDs. The propagation is the thing that turns isolated spans into one distributed trace.

> Lose context propagation and your traces shatter into disconnected single-service fragments. Most "my traces aren't connected" bugs come down to a hop where the headers weren't forwarded — a queue, a background job, a proxy that strips headers.

## Why OTel won

Standards usually lose to whoever has the biggest install base. OTel won anyway, for a few grounded reasons:

- **It merged the two main rivals.** OpenTracing and OpenCensus were competing open projects splitting the community. OTel is their merger, so the obvious alternatives folded into it instead of fighting it.
- **It's vendor-neutral by design, and vendors back it anyway.** The backends still compete on storage, querying, and UI — the parts that are genuinely hard. Owning the SDK was never their moat, so supporting a shared standard cost them little and won them goodwill.
- **The collector decouples everything.** Because there's a separate component that receives, transforms, and forwards telemetry, your apps never need to know who the backend is. (That's phase 2.)
- **It rides existing standards.** W3C Trace Context for propagation, a stable wire protocol (OTLP). It didn't reinvent the web's plumbing.

The practical payoff: the OTel API in your code is stable and neutral, so the "rip out the vendor SDK" project that used to eat a sprint becomes a config change.

```quiz
[
  {
    "q": "What does 'instrument once, export anywhere' mean in OpenTelemetry?",
    "choices": [
      "You can only export to one backend at a time",
      "Your code emits telemetry against a neutral standard, and the destination backend is a config choice you can change without editing code",
      "Instrumentation is automatic and never needs code",
      "You write separate instrumentation for each vendor"
    ],
    "answer": 1,
    "explain": "OTel separates how telemetry is produced from where it lands, so switching backends is configuration, not re-instrumentation."
  },
  {
    "q": "What ties multiple spans across different services into one distributed trace?",
    "choices": [
      "A shared database table of request IDs",
      "All services writing to the same log file",
      "Context propagation — a shared trace_id and parent span_id passed in headers like traceparent",
      "The collector guessing which spans belong together by timestamp"
    ],
    "answer": 2,
    "explain": "Context propagation carries the trace_id and parent span_id (e.g. via the W3C traceparent header) so a downstream span becomes a child of the upstream one."
  },
  {
    "q": "Which is NOT one of OpenTelemetry's three signals?",
    "choices": [
      "Traces",
      "Metrics",
      "Logs",
      "Dashboards"
    ],
    "answer": 3,
    "explain": "The three signals are traces, metrics, and logs. Dashboards are something a backend builds on top of that data, not a signal OTel produces."
  }
]
```

[← Overview](_guide.md) | [Phase 2: Instrumenting and exporting →](02-instrumenting-and-exporting.md)
