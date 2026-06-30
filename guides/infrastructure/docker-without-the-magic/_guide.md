---
title: "Docker Without the Magic"
guide: "docker-without-the-magic"
phase: 0
summary: "What a container actually is, how a Dockerfile builds an image layer by layer, and the gotchas that bite everyone - so 'works on my machine' stops being a thing that happens to you."
tags: [docker, containers, images, dockerfile, devops, infrastructure]
category: infrastructure
order: 3
difficulty: intermediate
synonyms: ["what is a docker container", "image vs container", "how does docker work", "what is a dockerfile", "docker vs virtual machine", "why is my docker image so big", "docker container data disappears"]
updated: 2026-06-19
---

# Docker Without the Magic

You've run `docker run` and watched a thing start. You've copied a `Dockerfile` off a blog and it
worked, mostly. But if someone asked you "what *is* a container, really?" - you'd hesitate. And when the
container runs fine but the port "isn't there," or the data vanishes on restart, or your image is somehow
two gigabytes, it all feels like magic that turned against you.

It isn't magic. Docker rests on a small handful of plain ideas, and once you have them, the weird behavior
stops being weird. This guide installs those ideas first, then shows you the everyday commands and the
traps - so the next time someone says "but it works on my machine," you can hand them a container and end
the conversation.

## How to read this

- **Hit a wall right now?** Jump to [Phase 3: Volumes & the Gotchas](03-volumes-and-the-gotchas.md) and
  use the cheat-card at the top - it maps the classic "why is it doing that" symptoms to calm fixes.
- **Want Docker to finally make sense?** Read in order. Each phase builds on the last: the mental model,
  then building images, then keeping data alive and dodging the traps.

## The phases

1. **[Image vs Container (and Why Not a VM)](01-image-vs-container.md)** - the one mental model the whole
   tool rests on: an image is a frozen snapshot, a container is a running instance of it, and both are far
   lighter than a virtual machine because they share the host's kernel.
2. **[Building an Image: the Dockerfile & Layers](02-the-dockerfile-and-layers.md)** - a Dockerfile is a
   recipe, each instruction is a cached *layer*, and once you see the layers you'll understand why build
   order makes the difference between a 2-second rebuild and a 2-minute one. Plus `build`, `run`, ports,
   and the registry.
3. **[Volumes & the Gotchas](03-volumes-and-the-gotchas.md)** - containers are throwaway, so your data
   needs somewhere safe to live (volumes), your config belongs in environment variables, and a short list
   of traps - huge images, secrets baked into layers, the unpublished port - are named before they bite.

> This guide gets you fluent with a single container. Running several containers together - a web app plus
> its database plus a cache, wired up and started with one command - is its own skill, and it has its own
> guide: [Docker Compose for Real Projects](/guides/docker-compose-for-real-projects).
