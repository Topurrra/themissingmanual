---
title: "The Jenkinsfile: pipeline, agent, stages, steps"
guide: jenkins-from-zero
phase: 2
summary: "The CI server that still runs much of enterprise: the Jenkinsfile pipeline-as-code, stages and steps, agents, and the plugin ecosystem for better and worse."
tags: [jenkins, ci, cd, pipeline, jenkinsfile, automation, devops]
difficulty: intermediate
synonyms: ["jenkins tutorial", "jenkinsfile", "declarative pipeline", "jenkins pipeline", "jenkins stages steps", "jenkins agent", "jenkins plugins", "jenkins credentials", "ci server jenkins"]
updated: 2026-06-30
---

# The Jenkinsfile: pipeline, agent, stages, steps

You know the model now: controller hands work to an agent, and the work is defined as code. This phase is that code. By the end you will be able to read any `Jenkinsfile` on your server and write one that builds and tests a real project.

A warning that will save you an afternoon: there are **two** pipeline syntaxes, Declarative and Scripted. We teach **Declarative**, the one with the `pipeline { }` block. It is the modern default, it gives clear errors, and it is what you should write. Scripted (a raw Groovy script) is the older style; you'll meet it on legacy servers, but don't start there.

## The smallest pipeline that does something

Here is a complete, valid `Jenkinsfile`. Read it top to bottom before the breakdown.

```groovy
pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Compiling the project...'
                sh 'make build'
            }
        }
        stage('Test') {
            steps {
                echo 'Running the test suite...'
                sh 'make test'
            }
        }
    }
}
```

*What just happened:* this defines a pipeline with two stages. On the next push, the controller picks an available agent, checks out your code there, runs `make build`, then `make test`. If either `sh` command exits non-zero, the build goes red and stops. The whole recipe is four keywords deep, and those four keywords are the entire skeleton of Declarative Jenkins.

## The four keywords that are everything

Almost every `Jenkinsfile` you read is some arrangement of these. Learn them and the rest is detail.

**`pipeline`** is the outermost block. Everything lives inside it. There is exactly one per file.

**`agent`** answers "where does this run?" Remember from Phase 1 that agents are the workers. `agent any` means "any free agent will do." You can also pin to a specific kind of machine:

```groovy
pipeline {
    agent {
        label 'linux && docker'
    }
    // ...
}
```

*What just happened:* this tells the controller to only schedule this build on an agent tagged with both `linux` and `docker` labels. This is how you guarantee a Windows build lands on a Windows machine, or a Docker build lands somewhere Docker is installed. The `agent` can sit at the top (applies to the whole pipeline) or inside a single `stage` (applies to that stage only).

**`stages`** holds the ordered list of phases of your build. It's the plural container. Inside it are individual **`stage`** blocks, each with a name you choose. Those names are exactly what you see as boxes in the Jenkins UI, the row of blue and red orbs, so name them like a human reading a status board: `Build`, `Test`, `Deploy to Staging`.

**`steps`** is where actual commands live, inside each stage. The two steps you will use most:

- `sh 'some command'` runs a shell command on a Unix agent. On Windows agents you use `bat 'some command'` instead.
- `echo 'message'` prints to the build log.

```text
pipeline ─── the whole thing (one per file)
  └─ agent ──── where it runs
  └─ stages ─── the ordered list
       └─ stage('Build') ─── one named phase (a box in the UI)
            └─ steps ─── the commands
                 └─ sh 'make build'
```

*What just happened:* this is the nesting, drawn out. `pipeline` contains `agent` and `stages`; `stages` contains `stage`s; each `stage` contains `steps`; each step is a command. If you ever get a confusing syntax error, it's almost always a block at the wrong level of this tree.

## Environment, parameters, and `post`: the everyday extras

Three more blocks turn the toy above into something you'd actually run.

**`environment`** sets variables available to every step:

```groovy
pipeline {
    agent any
    environment {
        APP_ENV = 'staging'
        REGION  = 'us-east-1'
    }
    stages {
        stage('Deploy') {
            steps {
                sh 'echo Deploying to $APP_ENV in $REGION'
            }
        }
    }
}
```

*What just happened:* `APP_ENV` and `REGION` became shell environment variables that every `sh` step can read with `$APP_ENV`. This is the clean way to avoid hardcoding the same string in five places. (Secrets are a special case with their own handling, covered in Phase 3, never paste a password here.)

**`post`** runs *after* the stages finish, branching on the outcome. This is the block that emails the team or cleans up:

```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'make test'
            }
        }
    }
    post {
        success {
            echo 'All green. Build artifact is good.'
        }
        failure {
            echo 'Build failed. Notifying the team.'
        }
        always {
            echo 'Cleaning up the workspace.'
            sh 'make clean'
        }
    }
}
```

*What just happened:* after the stages run, exactly one of `success` or `failure` fires depending on the result, and `always` fires no matter what. `post` is where you put the "whatever happens, do this" logic, notifications, cleanup, publishing test reports, so it doesn't clutter your stages. Other conditions exist too, like `unstable` and `aborted`.

## A pipeline that looks like a real one

Putting it together, here is a `Jenkinsfile` shaped like one you'd actually inherit:

```groovy
pipeline {
    agent { label 'linux' }

    environment {
        IMAGE = 'myapp'
    }

    stages {
        stage('Build') {
            steps {
                sh 'docker build -t $IMAGE:$BUILD_NUMBER .'
            }
        }
        stage('Test') {
            steps {
                sh 'docker run --rm $IMAGE:$BUILD_NUMBER make test'
            }
        }
        stage('Push') {
            when {
                branch 'main'
            }
            steps {
                sh 'docker push $IMAGE:$BUILD_NUMBER'
            }
        }
    }

    post {
        failure {
            echo 'Pipeline failed - see the stage view above.'
        }
    }
}
```

*What just happened:* three stages build an image, test inside it, and push it, but the `Push` stage has a `when { branch 'main' }` guard, so it only runs on the `main` branch and is skipped on feature branches. `$BUILD_NUMBER` is one of many variables Jenkins injects automatically (it's the incrementing build counter). This is the everyday core of Jenkins: a handful of stages, a `when` guard or two, and a `post` block to catch failures.

In the wild: most teams keep one `Jenkinsfile` per repo at the root, and Jenkins is configured with a "Multibranch Pipeline" job that automatically builds every branch and pull request that contains one. You write the file; Jenkins finds it.

```quiz
[
  {
    "q": "In a Declarative pipeline, what does the `steps` block contain?",
    "choices": ["The list of agents to use", "The actual commands to run, like `sh` and `echo`", "The names of all stages", "Post-build notifications"],
    "answer": 1,
    "explain": "`steps` lives inside each `stage` and holds the real commands - `sh` for shell on Unix agents, `bat` on Windows, `echo` for log output."
  },
  {
    "q": "When does the `post { failure { ... } }` block run?",
    "choices": ["Before any stage starts", "After the stages finish, only if the build failed", "On every push regardless of result", "Only when manually triggered"],
    "answer": 1,
    "explain": "`post` runs after stages complete. Its `failure` condition fires only when the build failed; `success` fires on success, and `always` fires either way."
  },
  {
    "q": "What does `agent { label 'linux && docker' }` do?",
    "choices": ["Installs Docker on the agent", "Runs the build twice, once per label", "Schedules the build only on an agent tagged with both `linux` and `docker`", "Forces the build to run on the controller"],
    "answer": 2,
    "explain": "Labels let the controller route a job to a matching agent. Requiring both labels guarantees the build lands on a Linux machine that has Docker available."
  }
]
```

[← Phase 1: The mental model](01-the-mental-model.md) | [Overview](_guide.md) | [Phase 3: Production reality →](03-production-reality.md)
