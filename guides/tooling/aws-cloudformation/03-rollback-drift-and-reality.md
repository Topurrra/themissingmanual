---
title: "AWS CloudFormation"
guide: aws-cloudformation
phase: 3
summary: "AWS's native infrastructure as code: declare resources in a template, and CloudFormation creates, updates, and rolls back the whole stack as one unit."
tags: [aws, cloudformation, infrastructure-as-code, devops, cloud]
difficulty: intermediate
synonyms: ["aws cloudformation tutorial", "cloudformation template yaml", "cloudformation vs terraform", "cloudformation stack", "cloudformation change set", "aws iac", "cloudformation rollback", "cloudformation drift detection"]
updated: 2026-06-30
---

# When it breaks: rollback, drift, and Terraform

Everything so far assumed the happy path. Production is where templates meet reality: an update half-applies, someone hotfixes a resource by hand, a stack gets wedged in a state you can't escape. This phase is the survival kit — what CloudFormation does automatically when things go wrong, how to spot the changes you didn't make, the stuck states and how to get out of them, and an honest comparison with Terraform so you pick the right tool instead of defending the one you know.

## Automatic rollback: the safety net you'll meet first

CloudFormation treats a stack operation as a transaction. If creating or updating a stack fails partway, it doesn't leave you with a half-built mess — it **rolls back**, undoing what it did to return the stack to the last known-good state.

```text
Events (most recent first):
  UPDATE_ROLLBACK_COMPLETE      app-prod
  UPDATE_ROLLBACK_IN_PROGRESS   app-prod   The following resource(s) failed to update: [Jobs]
  UPDATE_FAILED                 Jobs       Resource handler returned message: "Invalid retention period"
  UPDATE_IN_PROGRESS            Jobs
```

*What just happened:* the update to `Jobs` failed on a bad property, so CloudFormation reverted the whole update and the stack landed back at `UPDATE_ROLLBACK_COMPLETE` — its previous working configuration. You read these stack **events** bottom-to-top to find the *first* failure; everything above it is just the cleanup. The first `UPDATE_FAILED` line is almost always your real error message.

This is genuinely great default behavior. It also has a sharp edge: a rolled-back stack is back to working, but your *change* didn't apply. Don't celebrate the green `ROLLBACK_COMPLETE` as success — it means "I undid your change safely," not "your change worked."

## Drift: the gap between template and reality

The template is supposed to be the source of truth. Then someone opens the console at 2 a.m. during an incident, flips a setting on a resource by hand, and forgets to put it back in the template. Now the live resource and the template disagree. That gap is **drift**, and it quietly erodes the whole promise of infrastructure as code — because the template no longer describes what's actually running.

CloudFormation can detect it for you:

```bash
# Kick off a drift check (asynchronous)
aws cloudformation detect-stack-drift --stack-name app-prod

# Then read the per-resource results
aws cloudformation describe-stack-resource-drifts \
  --stack-name app-prod --stack-resource-drift-status-filters MODIFIED
```

A trimmed result:

```text
StackResourceDriftStatus: MODIFIED
LogicalResourceId: AppBucket
PropertyDifferences:
  - PropertyPath: /VersioningConfiguration/Status
    ExpectedValue: Suspended
    ActualValue: Enabled
    DifferenceType: NOT_EQUAL
```

*What just happened:* CloudFormation compared the live bucket to the template and found versioning was turned on by hand. The template still says `Suspended`. The fix is not to update the console again — it's to decide which side is right, put that truth into the template, and re-apply so the two agree. Run drift detection on a schedule; finding drift early is the difference between a one-line correction and an archaeology project.

> [!WARNING]
> CloudFormation detects drift but does not automatically *fix* it. And it doesn't see everything — some resource types and some property kinds aren't covered by drift detection. Treat a clean drift report as "no detected drift," not a guarantee of none.

## Stuck stacks and the moves that free them

A few failure states are common enough to keep in your back pocket:

- **`ROLLBACK_COMPLETE` after a failed *create*.** A brand-new stack that failed to create lands here and can't be updated — only deleted. Delete it, fix the template, create again.
- **`UPDATE_ROLLBACK_FAILED`.** The rollback itself couldn't finish (often a resource it can't revert). Use `continue-update-rollback`, optionally skipping the resources it's stuck on, to get back to a stable state.
- **Stuck `*_IN_PROGRESS` for a long time.** Usually a resource waiting on something that will never happen (a wait condition, a missing dependency, an IAM permission). Read the events for the resource that's hanging — the answer is almost always there.

```bash
# Nudge a wedged rollback past resources it can't revert
aws cloudformation continue-update-rollback \
  --stack-name app-prod \
  --resources-to-skip StuckResourceLogicalId
```

*What just happened:* you told CloudFormation to finish the rollback while skipping the resource it couldn't handle, returning the stack to a stable `UPDATE_ROLLBACK_COMPLETE` so you can try again. Skipping isn't free — that resource may now be inconsistent with the template, so reconcile it afterward.

## A deletion guard worth knowing

Because deleting a stack deletes everything in it, one habit prevents the worst day: protect the resources you can't afford to lose.

```yaml
Resources:
  CriticalDB:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Retain          # keep the DB even if the stack is deleted
    UpdateReplacePolicy: Retain     # keep the old one if an update forces replacement
    Properties:
      Engine: postgres
      AllocatedStorage: 20
      DBInstanceClass: db.t3.micro
```

*What just happened:* `DeletionPolicy: Retain` tells CloudFormation to leave this database alone if the stack is deleted, and `UpdateReplacePolicy: Retain` keeps the old instance if a change would otherwise rebuild it. For databases and anything holding state, set these on purpose. The default is to delete, and the default has ruined weekends.

## CloudFormation vs Terraform: where each wins

You can do infrastructure as code on AWS with CloudFormation (native) or [/guides/infrastructure-as-code-terraform](/guides/infrastructure-as-code-terraform) (third-party, from HashiCorp). Both are good. They win in different places, and choosing well matters more than loyalty.

**CloudFormation wins when:**

- **You're all-in on AWS.** It's native, free to use, needs no separate state file to host or lock, and supports new AWS features the day they ship.
- **You want managed rollback and drift built in.** Both are first-class, no extra tooling.
- **You're deep in the AWS ecosystem** — service catalog, StackSets across accounts, organizations integration all assume CloudFormation.

**Terraform wins when:**

- **You're multi-cloud or use third-party services.** One language and workflow covers AWS, other clouds, Cloudflare, Datadog, GitHub, and more. CloudFormation only speaks AWS.
- **You value the language and ecosystem.** HCL with modules, a huge registry of reusable modules, and `terraform plan` as a fast, readable preview many engineers find friendlier than change sets.
- **You want explicit state you control** — though that state file is also a thing you must store, lock, and secure, which CloudFormation spares you.

The honest summary: if your world is one AWS account or org and likely to stay that way, CloudFormation's nativeness and zero state-management overhead are a real edge. The moment a second provider enters the picture, Terraform's single workflow usually wins. Plenty of shops run both — CloudFormation for AWS-only foundations, Terraform where the estate spans providers. Pick for the estate you actually have, not the one on a slide.

## In the wild

A pragmatic split many teams settle on: CloudFormation (often via the higher-level AWS SAM or CDK, which both compile down to CloudFormation templates) for tightly AWS-coupled stacks like serverless apps, and Terraform for the cross-cutting platform layer. The shared discipline underneath both is the same — template in Git, preview every change, detect drift on a schedule, protect stateful resources from accidental deletion.

```quiz
[
  {
    "q": "Your stack update fails and ends at UPDATE_ROLLBACK_COMPLETE. What does that mean?",
    "choices": [
      "Your change applied successfully",
      "CloudFormation safely reverted the failed update, so your change did NOT apply",
      "The stack was deleted",
      "Drift was detected and fixed"
    ],
    "answer": 1,
    "explain": "Rollback returns the stack to its last working state. It's a safe undo, not a successful change."
  },
  {
    "q": "What is drift in CloudFormation?",
    "choices": [
      "A gradual increase in stack cost over time",
      "When live resources no longer match the template, usually from manual console changes",
      "A slow region-to-region replication delay",
      "The time it takes a stack to finish updating"
    ],
    "answer": 1,
    "explain": "Drift is the gap between the template (source of truth) and the actual resource state. CloudFormation can detect it but won't auto-fix it."
  },
  {
    "q": "Which scenario most favors Terraform over native CloudFormation?",
    "choices": [
      "An AWS-only serverless app that uses brand-new AWS features",
      "An estate spanning AWS plus Cloudflare, Datadog, and GitHub under one workflow",
      "A team that wants managed rollback with no extra tooling",
      "A team that wants to avoid hosting and locking a state file"
    ],
    "answer": 1,
    "explain": "Terraform's single workflow across many providers is its key edge. The other options are CloudFormation's strengths."
  }
]
```

[← Phase 2: Writing and changing stacks for real](02-writing-and-changing-stacks.md) | [Overview](_guide.md)
