---
title: "Why Environments Exist (and the Global-Install Trap)"
guide: python-packaging-pip-poetry-uv
phase: 1
summary: "Taming Python environments: virtual environments, pip and requirements, the modern pyproject.toml with Poetry, and uv's blazing resolver — without dependency hell."
tags: [python, packaging, pip, venv, poetry, uv, dependencies, virtualenv]
difficulty: intermediate
synonyms:
  - how do python virtual environments work
  - why use a virtual environment python
  - what is site-packages
  - what does venv actually do
  - python global install problem
updated: 2026-06-30
---

# Why Environments Exist (and the Global-Install Trap)

Here's the moment this guide is really about. You've got Project A that needs an old version of a library — call it `requests 2.20` — because some other piece of A depends on its exact behavior. Project B, written last week, needs `requests 2.31`. Both projects run on the same laptop, with the same Python. You install one, and you break the other. There is no version of `pip install` that fixes this by itself, because the problem isn't pip — it's that you only have one place to put libraries.

That one place has a name, and once you understand it, everything else clicks.

## The one shelf problem

When you install Python and run `pip install requests`, the library doesn't go "into Python" in some abstract way. It gets copied into a real folder on disk called `site-packages`. Every package you install lands on that same shelf. There's one shelf per Python installation, and by default every project shares it.

```console
$ python -c "import site; print(site.getsitepackages())"
['/usr/lib/python3.11/site-packages']
```

*What just happened:* Python told you the actual directory where installed packages live. That's the shelf. A library is "installed" when its files sit in that folder; it's "available" to your code because Python searches that folder on `import`.

Now the trap is obvious. A folder can only hold one version of a file. If Project A and Project B both want `requests` but different versions, the shelf can't satisfy both — whoever installed last wins, and the other project silently runs against the wrong version. Pin enough projects to one shelf and you get *dependency hell*: a tangle where upgrading anything for one project risks breaking another, and you're afraid to touch `pip install` at all.

> The global shelf isn't only inconvenient — on many systems it's dangerous. Your operating system uses its system Python for its own tools. Running `sudo pip install` to force something onto that shelf can overwrite a library the OS depends on and break parts of your machine. The rule that prevents this is short: never install project libraries into the system Python.

## A virtual environment is a second shelf

The fix is not cleverer version management. It's *more shelves* — one per project. That's all a virtual environment is: a private copy of the Python machinery with its own `site-packages` folder, belonging to a single project.

```console
$ python -m venv .venv          # create a fresh environment in ./.venv
$ source .venv/bin/activate     # macOS / Linux
$ .venv\Scripts\activate        # Windows (PowerShell)
(.venv) $ which python
/home/you/projectA/.venv/bin/python
```

*What just happened:* `python -m venv .venv` built a brand-new, empty environment in a folder named `.venv`. Activating it rewired your shell so that `python` and `pip` now point *inside* that folder. The `(.venv)` prefix on your prompt is the visible proof: any `pip install` from here lands on Project A's private shelf, untouched by Project B.

The `venv` module ships with Python itself — nothing to install. The folder it creates is disposable: delete `.venv` and you've deleted the environment with zero consequences, because nothing of value lives there except copies of libraries you can reinstall. That disposability is a feature, not a footnote — it's why you should *never* commit `.venv` to git and why the cure for a corrupted environment is "delete it and rebuild," not "debug it."

```text
projectA/
├── .venv/            ← private shelf, git-ignored, disposable
│   └── lib/python3.11/site-packages/   ← requests 2.20 lives here
├── src/
└── pyproject.toml    ← the recipe to rebuild .venv (you DO commit this)
```

*What just happened:* the layout shows the split that makes everything reproducible. The environment is throwaway. The *recipe* for it — which we'll build in the next phase — is what you keep and share.

## Activate is convenience, not magic

A lot of confusion melts away once you see what "activate" actually does: it puts the environment's `bin` folder first on your shell's `PATH`. You don't strictly need it. Running the environment's Python directly works identically:

```console
$ .venv/bin/python -m pip install requests   # no activation needed
$ .venv/bin/python script.py
```

*What just happened:* you called the environment's own Python by its full path, so its `pip` installed into its own shelf and its interpreter ran your script — all without ever typing `activate`. This is exactly how editors, CI pipelines, and tools like uv operate under the hood. Activation is a human convenience for an interactive shell; the real mechanism is just "which Python binary am I running."

## For builders

Every modern tool in this guide — Poetry, uv, even plain pip workflows — is built on this one idea: each project gets its own isolated shelf, and the recipe to rebuild that shelf lives in version control. The tools differ in how *nicely* they create the environment and how *precisely* they record the recipe. They do not differ on the fundamental model. Get the model and the tools become interchangeable details.

```quiz
[
  {
    "q": "What is a virtual environment, concretely?",
    "choices": [
      "A cloud server that runs your Python code remotely",
      "A private copy of Python's machinery with its own site-packages folder for one project",
      "A setting that tells pip to download faster",
      "A separate operating system for each project"
    ],
    "answer": 1,
    "explain": "It's a per-project shelf: an isolated site-packages plus interpreter, so projects don't fight over library versions."
  },
  {
    "q": "Why can't two projects with conflicting library versions safely share the global Python install?",
    "choices": [
      "pip refuses to run without a virtual environment",
      "The global install is read-only by design",
      "There's one shared site-packages folder, which can hold only one version of a package at a time",
      "Python caches the first version permanently in memory"
    ],
    "answer": 2,
    "explain": "One shelf, one version. Whoever installs last wins, silently breaking the other project."
  },
  {
    "q": "What does activating a virtual environment actually do?",
    "choices": [
      "Compiles your dependencies into a binary",
      "Puts the environment's bin folder first on PATH so 'python' and 'pip' point inside it",
      "Uploads your packages to a registry",
      "Permanently modifies the system Python"
    ],
    "answer": 1,
    "explain": "Activation is a PATH convenience. Calling .venv/bin/python directly does the same thing without it."
  }
]
```

[← Overview](_guide.md) | [Phase 2: The Daily Driver: pip, requirements, and Poetry →](02-pip-requirements-poetry.md)
