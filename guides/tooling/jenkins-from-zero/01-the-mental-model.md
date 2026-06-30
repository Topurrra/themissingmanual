---
title: "Jenkins, From Zero"
guide: jenkins-from-zero
phase: 1
summary: "The CI server that still runs much of enterprise: the Jenkinsfile pipeline-as-code, stages and steps, agents, and the plugin ecosystem for better and worse."
tags: [jenkins, ci, cd, pipeline, jenkinsfile, automation, devops]
difficulty: intermediate
synonyms: ["jenkins tutorial", "jenkinsfile", "declarative pipeline", "jenkins pipeline", "jenkins stages steps", "jenkins agent", "jenkins plugins", "jenkins credentials", "ci server jenkins"]
updated: 2026-06-30
---

# The mental model: what Jenkins is and why it won't die

Here is the reality you are probably standing in. There is a server somewhere with a name like `ci-prod-01`. It has a web UI from a design era you can date by the gradients. When you push code, something on that server runs your tests and tells you green or red. When it breaks, you open it up and find forty installed plugins, an `Execute shell` box with bash glued into a text field, and zero idea how any of it got there.

That feeling, that the box is unknowable, comes from one missing idea. Once you have the idea, the whole thing collapses into something simple. So let's build the idea first.

## What Jenkins actually is

Strip away the plugins and the UI and Jenkins is one sentence: **a long-running server that watches for events and runs jobs in response.**

That's it. An event is usually "someone pushed to Git" or "it's 2am" or "a human clicked a button." A job is a sequence of shell commands you want run reliably, on a clean machine, every time, with the output recorded. Jenkins sits there forever, waiting, and when the trigger fires it does the work and keeps a permanent record of what happened.

If you have read [/guides/what-cicd-does](/guides/what-cicd-does), this is the CI engine that idea describes, made concrete. Jenkins was one of the first tools to make "run my tests automatically on every commit" a normal thing teams did, and it predates almost every competitor you have heard of.

That history is the answer to "why won't it die." Jenkins is open source, runs on a box you control, and over nearly two decades grew a plugin for literally everything. A bank, a hospital, a defense contractor, an old factory's IT department: anyone who cannot or will not send their source code to a cloud SaaS has Jenkins. It is the old guard, and the old guard owns a lot of ground.

## The controller and the agents

Here is the single most important picture in Jenkins. Get this and the rest follows.

```text
        ┌─────────────────┐
        │   Controller    │  the brain: web UI, schedules,
        │  (the Jenkins   │  config, plugins, the record
        │     server)     │  of every build
        └────────┬────────┘
                 │ hands out work
        ┌────────┼────────┐
        ▼        ▼        ▼
    ┌───────┐┌───────┐┌───────┐
    │Agent 1││Agent 2││Agent 3│  the muscle: where your
    │linux  ││linux  ││windows│  build commands actually run
    └───────┘└───────┘└───────┘
```

*What just happened:* the **controller** is the Jenkins server itself, the part with the web UI and all the configuration. It does not, as a rule, run your build commands. It decides *what* should run and *when*, then hands the actual work to an **agent** (older docs and plugins call it a "node" or, in language now being retired, a "slave"). Agents are separate machines, or containers, that connect back to the controller and wait for jobs.

Why split it? Three reasons that all matter in production. First, **isolation**: a build that eats all the memory or runs hostile code shouldn't take down the brain that everyone depends on. Second, **scale**: ten agents run ten builds at once; the controller alone could not. Third, **environments**: you need a Windows agent to build a Windows app and a Linux agent for your containers, so the controller farms each job to a machine that fits.

> A small team often runs builds right on the controller to start, with no separate agents. That works, and it's how many Jenkins instances begin. The moment two builds need different environments, or one bad build risks the server, you reach for agents. Knowing the split exists is what matters.

## Jobs, and the leap to pipelines

The unit of work is a **job** (the UI also calls it a "project"). Historically you built jobs by clicking through the web UI: add a build step here, paste shell there, tick a checkbox for this plugin. These are called **Freestyle** jobs, and you will still meet them on older servers.

Freestyle jobs have a fatal flaw: the definition lives *only* inside Jenkins, as config buried in the controller's files. It isn't in your Git repo. You can't review it, diff it, or roll it back with your code. When the server dies, the job dies with it, and the person who configured it has long since left.

The fix, and the thing this guide is really about, is the **Pipeline**: the job's entire definition written as code, in a file named `Jenkinsfile`, checked into your repository right next to the code it builds.

```text
your-repo/
├── src/
├── tests/
└── Jenkinsfile   ← the build is now code, versioned with everything else
```

*What just happened:* the build process became pipeline-as-code. Now the recipe travels with the project. A new hire reads the `Jenkinsfile` to understand the build. A code review covers the pipeline change too. Revert the commit and you revert the build. This single shift, from clicking in a UI to committing a file, is the difference between a Jenkins you fear and one you can reason about.

For builders: if you have used GitHub Actions (see [/guides/your-first-pipeline-github-actions](/guides/your-first-pipeline-github-actions)), the `Jenkinsfile` is the same instinct as a workflow YAML file. Jenkins got there first; the syntax is different, but "your CI config is code in your repo" is the shared idea.

## So what is Jenkins, in one breath

A server (the controller) watches for triggers, and when one fires it hands a job to a worker (an agent), which runs the steps you defined, ideally as code in a `Jenkinsfile`, and records the result forever. Everything else, every plugin, every screen, every gotcha in Phase 3, hangs off that skeleton.

```quiz
[
  {
    "q": "In the controller/agent model, where do your actual build commands normally run?",
    "choices": ["On the controller, always", "On an agent (node)", "In the web browser", "Inside the Git server"],
    "answer": 1,
    "explain": "The controller is the brain that schedules and records; agents are the workers that run the build steps. Small setups may run on the controller, but the intended split puts work on agents."
  },
  {
    "q": "What is the main advantage of a Jenkinsfile over a Freestyle job configured in the UI?",
    "choices": ["It runs faster", "It needs fewer plugins", "The build definition is code, versioned in your repo and reviewable", "It uses less memory on the controller"],
    "answer": 2,
    "explain": "A Jenkinsfile makes the build pipeline-as-code: it lives in Git next to your code, so it can be diffed, reviewed, and rolled back. Freestyle config lives only inside the controller."
  },
  {
    "q": "Why does Jenkins remain common in enterprise despite newer tools?",
    "choices": ["It is the fastest CI tool available", "It is self-hosted and open source, so code never leaves machines you control", "It requires no configuration", "It has no plugins to maintain"],
    "answer": 1,
    "explain": "Organizations that cannot send source to cloud SaaS (banks, hospitals, defense) run Jenkins on their own infrastructure. Self-hosting plus a vast plugin ecosystem keeps it entrenched."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The Jenkinsfile →](02-the-jenkinsfile.md)
