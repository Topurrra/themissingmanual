---
title: "Writing and changing stacks for real"
guide: aws-cloudformation
phase: 2
summary: "AWS's native infrastructure as code: declare resources in a template, and CloudFormation creates, updates, and rolls back the whole stack as one unit."
tags: [aws, cloudformation, infrastructure-as-code, devops, cloud]
difficulty: intermediate
synonyms: ["aws cloudformation tutorial", "cloudformation template yaml", "cloudformation vs terraform", "cloudformation stack", "cloudformation change set", "aws iac", "cloudformation rollback", "cloudformation drift detection"]
updated: 2026-06-30
---

# Writing and changing stacks for real

The single-bucket template in Phase 1 was honest but lonely. Real stacks have parts that talk to each other, values that change between environments, and outputs other systems need to read. This phase is the day-to-day craft: making a template flexible with parameters, wiring resources together with intrinsic functions, handing results out with outputs, and - the habit that will save you most often - previewing every change before it lands.

## Parameters: one template, many environments

You don't want a separate template for staging and production that differ by one bucket name. You want one template with knobs. Those knobs are **parameters**.

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: Bucket with an environment knob

Parameters:
  EnvName:
    Type: String
    Default: staging
    AllowedValues: [staging, production]
    Description: Which environment this stack is for

Resources:
  AppBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "missing-manual-${EnvName}-data"
```

*What just happened:* `Parameters` declares an input named `EnvName` that defaults to `staging` and refuses anything but the two allowed values. Down in the bucket, `!Sub` substitutes the parameter into a string, so the bucket comes out named `missing-manual-staging-data` or `missing-manual-production-data` depending on what you pass.

You pass parameters when you create or update the stack:

```bash
aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name app-prod \
  --parameter-overrides EnvName=production
```

*What just happened:* the `deploy` command sends the template plus your parameter values to AWS. `deploy` is the friendly wrapper - it creates the stack if it doesn't exist and updates it if it does, so you run the same command every time.

## Intrinsic functions: how resources reference each other

`!Sub` is one of CloudFormation's **intrinsic functions** - the small built-in operations that let a static text file express relationships. You'll reach for a handful constantly:

- **`!Ref`** - get the value of a parameter, or the physical name/ID of a resource.
- **`!GetAtt`** - get a specific *attribute* of a resource (an ARN, a URL, an endpoint).
- **`!Sub`** - substitute variables into a string.
- **`!Join`** - glue a list of strings together with a separator.

Here's a queue and a role where the role's policy points at the queue:

```yaml
Resources:
  Jobs:
    Type: AWS::SQS::Queue
    Properties:
      MessageRetentionPeriod: 345600   # 4 days, in seconds

  WorkerRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal: { Service: lambda.amazonaws.com }
            Action: sts:AssumeRole
      Policies:
        - PolicyName: read-jobs
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action: [sqs:ReceiveMessage, sqs:DeleteMessage]
                Resource: !GetAtt Jobs.Arn   # <-- the link
```

*What just happened:* `!GetAtt Jobs.Arn` pulls the queue's ARN - a value that doesn't exist until AWS creates the queue. CloudFormation reads that reference, realizes the role *depends on* the queue, and creates the queue first. **Dependencies are inferred from references.** You almost never order resources by hand; you reference them and CloudFormation works out the graph.

> [!TIP]
> If two resources genuinely depend on each other but don't reference one another, use `DependsOn:` to state the order explicitly. Reach for it only when an implicit reference can't express the relationship - overusing it turns a clean dependency graph into hand-maintained ordering.

## Outputs: handing values back out

A stack often produces values other people or systems need - a bucket name, a queue URL, an endpoint. Don't make them dig through the console. Declare **outputs**.

```yaml
Outputs:
  JobsQueueUrl:
    Description: URL of the jobs queue
    Value: !Ref Jobs
  JobsQueueArn:
    Value: !GetAtt Jobs.Arn
    Export:
      Name: shared-jobs-queue-arn
```

*What just happened:* after the stack settles, `JobsQueueUrl` and `JobsQueueArn` show up in the stack's Outputs, queryable by CLI or console. The `Export` on the second one publishes it account-wide so a *different* stack can import it - that's how you share a value across stacks without copy-pasting an ARN.

## Change sets: look before you leap

This is the habit that separates calm operators from people who break production on a Friday. When you change a template, you don't have to apply it blind. A **change set** is a dry run: CloudFormation computes exactly what it *would* do and shows you, and nothing happens until you say go.

```bash
# 1. Create a change set from your edited template
aws cloudformation create-change-set \
  --stack-name app-prod \
  --change-set-name bump-retention \
  --template-body file://template.yaml \
  --parameters ParameterKey=EnvName,ParameterValue=production

# 2. See what it plans to do
aws cloudformation describe-change-set \
  --stack-name app-prod --change-set-name bump-retention
```

A trimmed view of what comes back:

```text
Changes:
  - ResourceChange:
      Action: Modify
      LogicalResourceId: Jobs
      ResourceType: AWS::SQS::Queue
      Replacement: False        # <-- in-place edit, not a rebuild
      Details: [ MessageRetentionPeriod ]
```

*What just happened:* CloudFormation tells you it will *modify* the `Jobs` queue and, critically, `Replacement: False` - it'll edit in place rather than destroy and recreate. That `Replacement` flag is the one to read every time. Some property changes force a replacement, which for a database or a queue can mean data loss or a new endpoint. The change set surfaces that *before* you commit.

When the plan looks right, execute it:

```bash
aws cloudformation execute-change-set \
  --stack-name app-prod --change-set-name bump-retention
```

*What just happened:* now - and only now - does CloudFormation make the change. The console's "preview changes" button does the same thing under the hood. Treat the change set as your seatbelt: cheap to create, free to throw away, and the only honest preview of what an update will really do.

## In the wild

A common, sane workflow: keep templates in Git, run `create-change-set` in CI on every pull request, and post the described changes as a comment so reviewers see the blast radius before approving. The merge then runs `execute-change-set`. Infrastructure changes get reviewed exactly like code, with a real diff attached. This is the same review-before-apply loop you'd build around any IaC tool - see [/guides/infrastructure-as-code-terraform](/guides/infrastructure-as-code-terraform) for how the pattern looks elsewhere.

```quiz
[
  {
    "q": "How does CloudFormation usually decide the order to create resources?",
    "choices": [
      "Alphabetically by logical ID",
      "Top to bottom as written in the template",
      "From references between resources (e.g. !GetAtt and !Ref build a dependency graph)",
      "It creates everything simultaneously regardless of dependencies"
    ],
    "answer": 2,
    "explain": "References imply dependencies, so CloudFormation infers the order. DependsOn is only for cases a reference can't express."
  },
  {
    "q": "What is a change set?",
    "choices": [
      "A backup of the current stack",
      "A dry-run preview of what an update would do, which you must execute separately to apply",
      "A list of parameters with default values",
      "A way to delete several stacks at once"
    ],
    "answer": 1,
    "explain": "A change set computes and shows the planned changes; nothing happens until you execute it."
  },
  {
    "q": "In a change set, why does the Replacement field matter most?",
    "choices": [
      "It shows how much the change will cost",
      "Replacement: True means the resource will be destroyed and recreated, which can cause data loss or a new endpoint",
      "It indicates whether the template is valid YAML",
      "It controls which region the change applies to"
    ],
    "answer": 1,
    "explain": "A replacement rebuilds the resource. For stateful resources that can mean lost data or changed identifiers, so always check it."
  }
]
```

[← Phase 1: The mental model](01-templates-and-stacks.md) | [Overview](_guide.md) | [Phase 3: When it breaks →](03-rollback-drift-and-reality.md)
