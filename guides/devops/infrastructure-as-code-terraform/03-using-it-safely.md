---
title: "Using It Safely"
guide: "infrastructure-as-code-terraform"
phase: 3
summary: "The safety habits that make Terraform trustworthy: always read the plan before you apply, use modules to reuse infrastructure instead of copy-pasting, and respect the three dangers — drift when someone changes things by hand, destroy operations that delete real resources, and secrets that end up readable in state."
tags: [terraform, terraform-plan, modules, drift, terraform-destroy, secrets, state, security, devops]
difficulty: advanced
synonyms: ["how to use terraform safely", "terraform plan before apply", "what are terraform modules", "how to fix terraform drift", "terraform destroy danger", "are secrets stored in terraform state", "terraform state security", "terraform best practices for beginners"]
updated: 2026-07-10
---

# Using It Safely

You can now read a `.tf` file, run the loop, and explain what state is. This last phase is about the difference between *using* Terraform and using it *without scaring yourself* — one habit and three dangers. Let's start with a panic-moment cheat-card, since some of you arrived here mid-incident.

## Cheat-card: "something feels wrong"

| Symptom | Calm move |
|---|---|
| `plan` wants to **destroy** something you didn't expect | **Stop. Don't type `yes`.** Read *why* it's destroying. Often a config change forced a replace — see [Destroy operations](#danger-2-destroy-operations) below. |
| `plan` shows changes you **didn't make** (it wants to "fix" things) | Someone changed it by hand. That's **drift** — see [Drift](#danger-1-drift-someone-changed-it-by-hand). Decide: update your code to match, or let Terraform revert reality. |
| "Error acquiring the state lock" | Someone else is running `apply` (or one crashed mid-run). **Wait.** Don't force-unlock unless you've confirmed no one is actually running. |
| You're about to commit and worried a password is in the files | Check **state**, not just `.tf` — secrets leak into state even when they're not in your config. See [Secrets in state](#danger-3-secrets-in-state). |
| `apply` failed halfway | Terraform is usually safe to re-run — it picks up from the real state. Run `plan` again first to see where you actually are. |

Now the habit and the dangers, properly.

## The one habit: plan before apply, always

**What it actually is.** Plan-before-apply is the discipline of *always* reading `terraform plan` output and understanding it before you let `apply` touch anything. You met `plan` in [Phase 2](02-how-terraform-works.md) as a command; here it becomes a *rule you don't break* — the single thing standing between "I changed a tag" and "I deleted the production database."

**Why it matters more than it looks.** Terraform is powerful in both directions. The same tool that builds your whole environment from a file can tear it down from a file. The plan is the moment you see which one is about to happen, in plain symbols, before it's real. Skipping it to "save time" is the infrastructure version of merging without reading the diff.

**What it does in real life on a team.** The grown-up version isn't a person squinting at a terminal — it's automation. Open a pull request changing a `.tf` file; CI runs `terraform plan` and posts the output as a comment; a human reviews *that diff* before approving; only a merge to main triggers `apply`. The plan becomes a reviewable artifact, exactly like a code diff. (Same review habit as [Git With Other People](/guides/git-with-other-people), pointed at infrastructure.)

💡 **Key point.** A `plan` that says `0 to change, 0 to destroy` when you only meant to change one thing is *good news* — it means you understand your blast radius. A plan with a surprise `destroy` you can't explain is a *full stop*, not a speed bump.

## Modules: reuse instead of copy-paste

**What it actually is.** A *module* is a reusable bundle of Terraform configuration — a folder of `.tf` files that describes a set of resources together (say, "a web server plus its disk plus its security group"), parameterized by inputs. Instead of copy-pasting that block for every environment, you call the module and pass it different values.

📝 **Terminology.** Every Terraform configuration is technically a module — the top-level one is the *root module*. When people say "a module," they usually mean a *child module*: a folder you reference from elsewhere with a `module` block, reusing its resources without duplicating them.

**Why people get this wrong.** The first instinct in IaC is to copy your working `web-1` block, paste it, change the name to `web-2`, and repeat. That's just click-ops with extra steps — the same drift-between-copies problem, only in text. The two servers were supposed to be identical, and now differ because someone edited one copy and forgot the other.

```hcl
# Define the shape once in modules/web_server/, then call it
# three times with different inputs — one source of truth.
module "web_staging" {
  source        = "./modules/web_server"
  instance_type = "t3.micro"
  environment   = "staging"
}

module "web_prod" {
  source        = "./modules/web_server"
  instance_type = "t3.large"   # prod is bigger; everything else identical
  environment   = "prod"
}
```

*What just happened:* You described one kind of web server *once* (inside `modules/web_server/`), then asked for two that differ only in the inputs you chose to vary — size and environment name. Fix a security setting in the module and *both* environments get the fix on the next apply. That's the reuse click-ops can never give you.

⚠️ **Gotcha.** Don't build a module before you have a reason. A module abstracting a single resource you use once adds indirection for no reuse — now you hop between files to read one server. Reach for a module when you're about to copy-paste the *second* time, not preemptively (the "no abstractions for single-use code" instinct, applied to infrastructure).

## The three dangers

Terraform doesn't bite often, but when it does it's almost always one of these three. Knowing them by name is most of the defense.

### Danger 1: Drift (someone changed it by hand)

You met drift in [Phase 1](01-why-click-ops-doesnt-scale.md) as the click-ops killer. Terraform doesn't *prevent* drift — someone can always open the console and change a thing Terraform manages. What Terraform gives you is the power to **see** drift and decide what to do about it.

**What it does in real life.** Because Terraform compares your config and state against the real cloud, drift shows up as a `plan` proposing changes *you* didn't write — Terraform wanting to "fix" reality back to match your code.

```console
$ terraform plan

Note: Objects have changed outside of Terraform

Terraform detected the following changes made outside of Terraform since the
last "terraform apply" which may have affected this plan:

  # aws_instance.web has been changed
  ~ resource "aws_instance" "web" {
        id            = "i-0a1b2c3d4e5f67890"
      ~ instance_type = "t3.large" -> "t3.micro"
    }

Terraform will perform the following actions:

  # aws_instance.web will be updated in-place
  ~ resource "aws_instance" "web" {
      ~ instance_type = "t3.large" -> "t3.micro"
    }

Plan: 0 to add, 1 to change, 0 to destroy.
```

*What just happened:* Terraform noticed the real instance is now `t3.large`, but your code still says `t3.micro` — someone resized it by hand (probably during an incident, exactly the 2am story from Phase 1). Terraform offers to drag reality *back* to `t3.micro`. Now you have an honest decision, not a silent mystery: either the bigger size was intentional, so update your code to `t3.large` and commit it, or it was a temporary hack, so let the apply revert it. Either way, drift is visible and resolved instead of festering.

⚠️ **Gotcha.** Don't reflexively `apply` a drift-correcting plan. If someone scaled production up to survive load, blindly reverting to the old size *reintroduces the outage*. Read what changed and *why* before you let Terraform "fix" it. The plan gave you the information precisely so you could make this call.

### Danger 2: Destroy operations

Terraform deletes things. That's a feature — `terraform destroy` cleanly tears down everything in a config, which is wonderful for temporary environments. It's also the command most likely to ruin your day if it runs against the wrong thing.

**Two ways resources get destroyed**, and you must recognize both in a plan:

- **An explicit `terraform destroy`** — you asked to tear it all down.
- **A `-/+` replacement inside a normal `apply`** — you changed an attribute that *can't* be modified in place, so Terraform's only option is destroy-then-recreate. This is the sneaky one: a small change, with a destroy hiding inside it.

```console
$ terraform plan

  # aws_instance.web must be replaced
-/+ resource "aws_instance" "web" {
      ~ ami           = "ami-0abcdef1234567890" -> "ami-0newimage99999" # forces replacement
        instance_type = "t3.micro"
      ~ id            = "i-0a1b2c3d4e5f67890" -> (known after apply)
    }

Plan: 1 to add, 0 to change, 1 to destroy.
```

*What just happened:* You changed the `ami` (the base image). You can't swap a running machine's underlying image in place, so Terraform reports `-/+ must be replaced`, and `# forces replacement` tells you exactly which attribute caused it. The summary's `1 to destroy` is what matters: your existing server will be **deleted** and a new one created. If that server held data on its local disk, or its IP was hard-coded somewhere, the destroy is the part that hurts.

⚠️ **Gotcha — read the summary line, every time.** `1 to add, 0 to change, 1 to destroy` looks almost like the harmless create-only plan from Phase 2 — the difference is one number, and that number is a deletion. For irreplaceable resources, especially databases, Terraform supports a guard: `prevent_destroy = true` makes it *refuse* to produce any plan that would delete the resource, turning a catastrophe into an error message. Use it on anything you can't afford to lose.

🪖 **War story.** The canonical Terraform horror story: a tiny change to a database resource that, because of how that attribute works, forces a replacement — and the engineer, watching the change they *intended*, types `yes` without registering the `1 to destroy`. The database is gone, recreated empty. Every word they needed was on screen. The lesson isn't "Terraform is dangerous"; it's "the plan is the safety device, and it only works if you read the destroy count."

### Danger 3: Secrets in state

This one surprises people because it's invisible until you go looking. **Sensitive values can end up stored in plain text inside your state file** — even if they're nowhere in your `.tf` files.

**Why it happens.** State is Terraform's record of what it *built*. If a resource has a password, a private key, or a generated token as one of its attributes, Terraform stores that value in state so it can detect future changes. A database resource with an initial password, for example, writes that password into `terraform.tfstate` — which is, by default, unencrypted JSON.

**What this means in real life:**

- ⚠️ **Never commit `terraform.tfstate` to Git.** It can contain secrets in clear text, and Git history is forever. Add it to `.gitignore` on day one. (This is one more reason remote state from Phase 2 is the right default — it keeps state out of the repo entirely.)
- ⚠️ **Treat the state backend as a secret store.** Whoever can read the state bucket can read those secrets. Lock down access to it the way you'd lock down a password vault: tight permissions, and encryption-at-rest enabled on the bucket.
- **Marking a variable `sensitive` hides it from console output, not from state.** `sensitive = true` stops Terraform from *printing* a value in `plan`/`apply` output — useful, but the value is still written to the state file. Hiding it from your terminal is not the same as protecting it at rest.

💡 **Key point.** The mental model: *your `.tf` files describe intent and are safe to share with reviewers; your state file is a record of reality that can contain real secrets and must be guarded.* Conflating the two — committing state, or leaving the state bucket world-readable — is how IaC setups leak credentials. Keep secrets out of the config where you can (inject them at apply time from a real secrets manager), and protect the state regardless.

## Recap

1. **Plan before apply, always** — reading the plan is the one habit that stands between a tag change and a deleted database. On teams, make the plan a reviewed PR artifact.
2. **Modules** let you describe a piece of infrastructure once and reuse it with different inputs — real reuse, not copy-paste drift. Build them when you'd otherwise copy, not before.
3. **Drift**: Terraform can't stop hand-changes, but it *shows* them as unexpected plan changes. Decide whether to revert reality or update your code — don't blindly apply.
4. **Destroy**: deletions come from explicit `destroy` *and* hidden `-/+` replacements. Read the `to destroy` count every time; use `prevent_destroy` on irreplaceable resources.
5. **Secrets in state**: state can hold secrets in plain text. Never commit it, guard the backend like a vault, and know that `sensitive` hides output, not state.

That's the foundation. You can now reason about Terraform instead of fearing it: declare desired state, run the loop, respect state, read every plan. The deeper craft — authoring modules well, multi-environment workspaces, full CI/CD pipelines — builds directly on these ideas, and is the subject of the follow-up guide.

---

[← Guide overview](_guide.md) · [Phase 2: How Terraform Works ←](02-how-terraform-works.md)
