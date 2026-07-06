---
title: "Picking Where to Start"
guide: "what-tooling-even-is"
phase: 4
summary: "Concrete first-tool picks by common situation - starting backend work, joining a Kubernetes team, doing observability for the first time, or picking up CI/CD or auth cold."
tags: [tooling, devops, beginner, getting-started]
difficulty: beginner
synonyms:
  - what devops tool should I learn first
  - where to start with tooling
  - first tool to learn as a backend developer
  - beginner devops tool roadmap
updated: 2026-07-06
---

# Picking Where to Start

Theory is over. Here are real starting points, matched to situations you're actually likely to be in. Find the one closest to yours and open that guide - ignore the rest of this category until it's relevant.

**Just started backend work.** Start with your database's migration tool and your CI pipeline - these two show up in nearly every backend job, day one. Read [`/guides/flyway-database-migrations`](/guides/flyway-database-migrations) for the migration mental model (it transfers even if your team uses a different specific tool), and [`/guides/gitlab-ci-cd`](/guides/gitlab-ci-cd) to understand what happens the moment you push code.

**Just joined a team using Kubernetes.** Start with [`/guides/kubectl-day-to-day`](/guides/kubectl-day-to-day) before anything else in the container space. You'll spend far more early days reading pod status and logs than writing Kubernetes manifests from scratch - Helm and infrastructure-as-code tools can wait until you're comfortable navigating a cluster someone else built.

**Doing observability for the first time.** Start with [`/guides/opentelemetry-from-zero`](/guides/opentelemetry-from-zero) before any vendor-specific dashboard. It's the instrumentation layer underneath most observability stacks, so the concepts - traces, spans, metrics - transfer no matter which vendor your company happens to display them in.

**Your team just adopted CI/CD and you've never touched a pipeline.** Read [`/guides/gitlab-ci-cd`](/guides/gitlab-ci-cd). The specific YAML dialect varies by provider, but the shape - stages, jobs, artifacts, triggers - is close enough to Jenkins or CircleCI that you'll recognize it instantly if you switch employers later.

**You're implementing login or API access for the first time.** Start with [`/guides/oauth2-and-oidc`](/guides/oauth2-and-oidc) for the protocol-level "how does delegated login actually work," then [`/guides/jwt-in-depth`](/guides/jwt-in-depth) for the token format you'll see passed around once auth is working. Auth is one of the few themes where getting the concept wrong causes real security bugs, so this is worth reading before you copy-paste a login flow from somewhere.

**You inherited a codebase with messy formatting and inconsistent style.** [`/guides/eslint-and-prettier`](/guides/eslint-and-prettier) is a same-afternoon win - it's mechanical, low-risk, and immediately visible, a good first tool to introduce to a team.

**You're testing something for the first time and don't know where to begin.** [`/guides/pytest-from-zero`](/guides/pytest-from-zero) if you're in Python; the concepts (fixtures, assertions, test discovery) map directly onto whatever testing tool your actual language uses.

## If none of these match

Go back to [Phase 2](02-the-themes-underneath-the-tool-names.md), find the theme that matches your actual task, and pick the one guide under it that fits your stack. That's the whole method - this category was never meant to be read start to finish, and the fact that you skipped straight to the one guide you needed is the category working as intended.

You don't graduate from this guide by reading every tool guide that follows it. You graduate by using it exactly once: to find the one thing you need right now, and coming back the next time something new lands on your desk.

```quiz
[
  {
    "q": "If you're joining a team that already runs Kubernetes, which guide does this phase point to first?",
    "choices": ["A Helm deep-dive", "kubectl day-to-day", "An infrastructure-as-code guide"],
    "answer": 1,
    "explain": "You'll spend early days reading cluster state before you write manifests - kubectl comes first."
  },
  {
    "q": "What should you do if none of the situations on this page match yours?",
    "choices": ["Read all 54 guides to be safe", "Go back to the themes map in Phase 2 and match your actual task to a theme", "Give up and ask a coworker to do it"],
    "answer": 1
  },
  {
    "q": "How do you 'graduate' from this guide, per its closing point?",
    "choices": ["By reading every guide it links to", "By using it once to find what you need, then returning next time something new comes up", "You never graduate, it must be reread monthly"],
    "answer": 1
  }
]
```

---

[← Phase 3: How to Learn a New Tool Fast](03-how-to-learn-a-new-tool-fast.md) · [Guide overview](_guide.md)
