---
title: "Auto-Deploy on Merge"
guide: "ship-your-side-project"
phase: 6
summary: "Close the loop: a GitHub Actions workflow that, on every merge to main, SSHes into your box and pulls + recreates the stack - so shipping is a merge, not a chore - with the build-OOM and restart-vs-recreate traps handled."
tags: [ci-cd, github-actions, auto-deploy, ssh, docker-compose, force-recreate]
difficulty: intermediate
synonyms: ["auto deploy on merge to main", "github actions deploy over ssh", "ci cd for a side project", "deploy docker compose with github actions", "git pull and compose up on deploy"]
updated: 2026-06-19
---

# Auto-Deploy on Merge

Right now, shipping a change means: SSH in, `git pull`, recreate the containers, by hand, every time.
That's fine once; it's friction forever, and friction is where bugs and stale deploys live. The finish
line is **merge to `main` → it's live**, automatically. We'll use GitHub Actions; for how pipelines work
in general, [Your First Pipeline (GitHub Actions)](/guides/your-first-pipeline-github-actions) and
[What a CI/CD Pipeline Actually Does](/guides/what-cicd-does) are the foundations - here's the deploy-over-SSH
shape specifically.

## The shape: push → Action → SSH → pull + recreate

```mermaid
flowchart LR
  Merge[merge to main] --> Action[GitHub Actions] --> SSH[SSH into the box] --> Deploy[git pull + compose up -d]
```

On every push to `main`, a workflow runs on GitHub's machines, opens an SSH connection to your box using a
key you've stored as a **secret**, and runs the same commands you'd type by hand.

## The deploy key and the secret

Give the Action its own way in (never your personal key):

1. Generate a **deploy SSH key pair** for CI. Put the **public** half in the box's `~/.ssh/authorized_keys`
   (so the Action can log in), and store the **private** half in **GitHub → repo → Settings → Secrets and
   variables → Actions** as, say, `DEPLOY_SSH_KEY`. Add `DEPLOY_HOST` and `DEPLOY_USER` too.
2. Secrets are encrypted and injected at run time - never printed, never committed.

## The workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]      # only merges/pushes to main deploy

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: SSH in and update the stack
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd ~/your-project
            git pull
            docker compose up -d --force-recreate
```
*What just happened:* on a push to `main`, GitHub spins up a runner, connects to your box with the secret
key, and runs the deploy script - `git pull` to fetch the merged code, then `docker compose up -d
--force-recreate` to bring the stack up on it. From now on, **merging is deploying.** No SSH, no
remembering the commands.

## ⚠️ The two traps, one last time

⚠️ **`--force-recreate`, not `restart`.** The script uses `docker compose up -d --force-recreate` on
purpose. If it ran `docker compose restart`, a deploy that only changed an env value or rebuilt an image
would **silently keep running the old containers** - the Action goes green, and nothing actually changed.
This is the [Phase 3](03-docker-and-your-repo.md) trap, now automated: recreate, don't restart.

⚠️ **Don't build on the tiny box if you can help it.** `git pull` + `docker compose up -d --build` builds
*on the server* - straight back into the [Phase 1](01-pick-a-vps.md) OOM risk, now on every deploy. Two
better shapes:
- **Build in the Action, pull the image on the box.** The runner has plenty of RAM: build the image there,
  push it to a registry, and have the box's compose file just *pull* it (`docker compose pull && up -d`).
  No build on the box, ever.
- **Or keep building on the box but guarantee swap** ([Phase 1](01-pick-a-vps.md)) so the build can't get
  OOM-killed mid-deploy.

💡 **Key point.** A deploy should be boring. The recipe - pull, recreate, prefer a pre-built image - makes
every future change a merge and nothing more.

## You shipped it

Step back at what you built across these six phases: a box you chose wisely and won't get surprise-billed
for, a locked-down SSH key login, your private app running in Docker, a real domain, free HTTPS behind
Cloudflare with the cookie/CSRF/firewall traps handled - and now a one-merge deploy. The gap between "works
on my laptop" and "a stranger uses it at a URL" is closed, and you know where every trap was hiding.

The next time someone says "just deploy it," that word won't make your stomach drop. You've done the whole
journey once, with eyes open - and that's the only time it's ever hard.

## Recap

1. **GitHub Actions on push to `main`** SSHes into the box (with a **deploy key in Secrets**) and runs
   your deploy script - merging becomes deploying.
2. ⚠️ Use **`docker compose up -d --force-recreate`**, not `restart`, or deploys silently keep the old
   containers.
3. ⚠️ **Avoid building on the tiny box** - build in the Action and **pull the image**, or guarantee
   **swap** so the deploy build can't OOM.

---

[← Phase 5: Behind Cloudflare](05-behind-cloudflare.md) · [Guide overview](_guide.md)
