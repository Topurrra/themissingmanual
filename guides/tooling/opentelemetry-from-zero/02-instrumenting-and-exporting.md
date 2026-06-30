---
title: "Instrumenting and exporting"
guide: opentelemetry-from-zero
phase: 2
summary: "The vendor-neutral standard for telemetry: traces, metrics, and logs from one instrumentation, exported anywhere via the OTel collector."
tags: [opentelemetry, otel, observability, tracing, metrics, collector, instrumentation]
difficulty: intermediate
synonyms: ["opentelemetry tutorial", "otel collector", "what is opentelemetry", "distributed tracing setup", "otel spans context propagation", "instrument once export anywhere", "otel vs vendor agent"]
updated: 2026-06-30
---

# Instrumenting and exporting

You understand the model. Now the question is the one you actually showed up with: *how do I get spans out of my service and onto a screen?* There are exactly two jobs. First, your application has to **produce** telemetry - that's instrumentation. Second, that telemetry has to **travel** somewhere - that's exporting, and the piece in the middle is the collector. We'll do them in that order.

## Auto vs manual instrumentation

You have two ways to produce telemetry, and you'll use both.

**Auto-instrumentation** wires up the libraries you already use - your web framework, HTTP client, database driver - without you editing application code. Each language ships its own auto-instrumentation, and the activation differs by ecosystem. In some it's a packaged agent you attach at startup; in others you install instrumentation packages and call a setup function. The shape varies, but the idea is identical: known libraries get spans for free.

```bash
# Python: install the instrumentation packages, let the tooling
# detect your libraries, then run your app under it.
pip install opentelemetry-distro opentelemetry-exporter-otlp
opentelemetry-bootstrap -a install      # detects installed libs, adds matching instrumentation

# Point it at a collector and run your app through the wrapper:
export OTEL_SERVICE_NAME=checkout-api
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
opentelemetry-instrument python app.py
```

*What just happened:* with zero changes to `app.py`, your Flask/Django/FastAPI routes, your `requests` calls, and your DB queries now emit spans, already connected by context propagation. `OTEL_SERVICE_NAME` is the label that tells your traces apart from other services; the endpoint is where spans go.

> Auto-instrumentation gets you 80% of the value for roughly zero effort. Start here every time. Reach for manual spans only where auto-instrumentation can't see - your own business logic.

**Manual instrumentation** is you creating spans by hand for the work that matters to *your* domain - the loop auto-instrumentation has no way to know is important.

```python
from opentelemetry import trace

tracer = trace.get_tracer("checkout")

def apply_discounts(cart):
    with tracer.start_as_current_span("apply_discounts") as span:
        span.set_attribute("cart.item_count", len(cart.items))
        total = run_discount_rules(cart)        # your real logic
        span.set_attribute("cart.discount_total", total)
        return total
```

*What just happened:* you created a span named `apply_discounts` that automatically becomes a child of whatever span is currently active (the HTTP handler auto-instrumentation already started). Because it's the "current span," any DB call inside `run_discount_rules` nests under it too. The attributes turn this into something you can query: "discount runs where `item_count > 50`."

## The SDK: what's actually running

The OTel **API** is the surface you call (`get_tracer`, `start_as_current_span`). The OTel **SDK** is the implementation that does the real work: it batches spans, applies sampling, attaches resource info (service name, host, version), and hands finished spans to an **exporter**. The standard exporter speaks **OTLP** - the OpenTelemetry Protocol - which is the native wire format every OTel-aware backend and the collector understand.

That API/SDK split matters: a library author can call the API and emit spans, and if no SDK is configured, those calls are harmless no-ops. The application decides whether and how telemetry actually flows.

## The collector: receive, process, export

You *can* export straight from your app to a backend. For anything beyond a toy, don't - put the **collector** in between. The collector is a standalone binary (or sidecar, or cluster service) that does three things, in a pipeline, for each signal:

```text
            ┌──────────────── OpenTelemetry Collector ────────────────┐
 your apps  │  RECEIVERS  →  PROCESSORS  →  EXPORTERS                  │  backends
 (OTLP)  ───┼──►  otlp     →  batch        →  otlp/<vendor>  ──────────┼──►  Vendor A
            │              →  filter       →  prometheus    ──────────┼──►  Grafana stack
            │              →  attributes   →  logging (debug) ────────┼──►  stdout
            └──────────────────────────────────────────────────────────┘
```

*What just happened:* the collector **receives** telemetry (commonly over OTLP on ports 4317 for gRPC and 4318 for HTTP), **processes** it (batch it for efficiency, drop noisy spans, scrub a PII attribute, add metadata), and **exports** it to one or more destinations at once. Your apps only ever know the collector's address.

Here's a minimal collector config - three blocks defined, then a `pipelines` section that wires them together:

```yaml
receivers:
  otlp:
    protocols:
      grpc:                 # listens on :4317
      http:                 # listens on :4318

processors:
  batch:                    # group spans before export - fewer, bigger sends
  attributes:
    actions:
      - key: user.email     # never let PII reach the backend
        action: delete

exporters:
  otlp/vendor:
    endpoint: ingest.example-backend.com:443
  debug:                    # print to the collector's own logs while testing
    verbosity: detailed

service:
  pipelines:
    traces:
      receivers:  [otlp]
      processors: [attributes, batch]
      exporters:  [otlp/vendor, debug]
```

*What just happened:* defining a receiver, processor, or exporter does nothing on its own - it has to be listed in a pipeline under `service`. This `traces` pipeline takes OTLP in, deletes the `user.email` attribute, batches, and fans out to both the vendor and the debug log. Want to add a second backend or send metrics somewhere else? You edit this YAML and restart the collector - your application code never changes. That's the decoupling from phase 1, made concrete.

## Why the collector earns its keep

It looks like an extra moving part, and it is - but it pays for itself fast:

- **One place to switch backends.** Re-point the exporter, restart the collector, done. No redeploy of N services.
- **One place to scrub and shape.** PII deletion, attribute renaming, dropping health-check spans - centralized, not copy-pasted into every service.
- **A buffer.** The collector batches and retries, so a backend hiccup doesn't back up into your application.
- **Protocol translation.** Receive OTLP, export Prometheus-format metrics for a [Prometheus and Grafana](/guides/prometheus-and-grafana) setup, or speak a vendor's dialect - the collector adapts so your code doesn't.

For builders: a common production shape is a lightweight collector running as an **agent** next to each app (or as a sidecar), forwarding to a horizontally-scaled **gateway** collector pool that does the heavy processing and talks to backends. Start with one collector; split into agent + gateway only when volume demands it.

```quiz
[
  {
    "q": "When should you reach for manual instrumentation instead of auto-instrumentation?",
    "choices": [
      "Always - auto-instrumentation is unreliable",
      "For your own business logic that auto-instrumentation can't see, after auto-instrumentation covers the standard libraries",
      "Only when you have no framework",
      "Never - manual spans are deprecated"
    ],
    "answer": 1,
    "explain": "Start with auto-instrumentation for frameworks/clients/DBs, then add manual spans for domain logic the auto layer has no way to know matters."
  },
  {
    "q": "What are the three stages of a collector pipeline, in order?",
    "choices": [
      "Export, process, receive",
      "Receive, process, export",
      "Ingest, store, query",
      "Sample, batch, drop"
    ],
    "answer": 1,
    "explain": "A collector pipeline receives telemetry, processes it (batch, filter, scrub), then exports it to one or more backends."
  },
  {
    "q": "In a collector config, what makes a defined exporter actually do anything?",
    "choices": [
      "Defining it under the exporters block is enough",
      "It must be listed in a pipeline under the service section",
      "It activates automatically on restart",
      "You must set its verbosity to detailed"
    ],
    "answer": 1,
    "explain": "Receivers, processors, and exporters are inert until wired into a pipeline under service.pipelines - that's what connects them."
  }
]
```

[← Phase 1: What OpenTelemetry actually is](01-what-otel-actually-is.md) | [Overview](_guide.md) | [Phase 3: Sampling, cost, and reality →](03-sampling-cost-and-reality.md)
