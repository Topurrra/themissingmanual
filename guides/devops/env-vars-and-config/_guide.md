---
title: "Environment Variables & Config (.env, YAML)"
guide: "env-vars-and-config"
phase: 0
summary: "What config files really do, why settings live outside your code, how environment variables and .env files work, and how YAML/JSON/TOML and config precedence fit together."
tags: [config, environment-variables, dotenv, yaml, twelve-factor, beginner-friendly]
category: devops
difficulty: beginner
order: 2
synonyms: ["what is a config file", "what does .env do", "how do environment variables work", "why is config separate from code", "what is yaml used for", "how to read env vars in code"]
updated: 2026-06-19
---

# Environment Variables & Config (.env, YAML)

You cloned a project, ran it, and it died with `Error: DATABASE_URL is not set`. Or you opened a repo
and found a file called `config.yaml`, a file called `.env.example`, and a warning in the README saying
**never commit your `.env`** - with no explanation of why. None of this was ever taught to you; it just
showed up in every project and you were expected to already know.

This guide makes it knowable. By the end you'll understand what a config file *actually does*, why your
settings live outside your code in the first place, what an environment variable really is, and how the
common config formats (YAML and friends) work - including the indentation trap in YAML that bites
everyone exactly once.

## How to read this

- **Just need to get a project running?** Skim [Phase 2: Environment Variables & .env Files](02-env-vars-and-dotenv.md)
 - it covers reading variables and the `.env` file most projects expect.
- **Want it to finally make sense?** Read in order. Each phase builds on the one before, starting with
  the mental model that makes the rest obvious.

## The phases

1. **[Why Config Lives Outside Code](01-why-config-lives-outside-code.md)** - the same app runs on your
   laptop, on staging, and in production with different settings; config is how you separate
   what-changes-per-environment from the code itself.
2. **[Environment Variables & .env Files](02-env-vars-and-dotenv.md)** - what an environment variable
   actually is, how to read one from the shell and from code, and how `.env` files make local
   development sane (and why you must never commit them).
3. **[Config Files: YAML & Friends](03-config-files-yaml.md)** - YAML, JSON, and TOML for structured
   config, the YAML indentation gotcha, and the precedence order that decides which setting wins.

> Deeper material - *how* to store production secrets safely (vaults, encrypted secrets, cloud secret
> managers) - lives in its own guide: [Secrets Management](/guides/secrets-management). This guide gets
> you to the point where you understand *why* secrets belong in config and out of Git.

---

[Phase 1: Why Config Lives Outside Code →](01-why-config-lives-outside-code.md)
