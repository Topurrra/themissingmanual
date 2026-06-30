---
title: "Pick a Cheap VPS"
guide: "ship-your-side-project"
phase: 1
summary: "A small VPS is plenty to start - but the box has to survive the build, not just the run, and the billing keeps charging while it's powered off. Pick for build-RAM, and delete (not stop) to stop paying."
tags: [vps, hosting, ram, billing, build-oom, swap]
difficulty: intermediate
synonyms: ["what vps specs do i need", "cheapest vps for a side project", "vps build out of memory", "am i billed when vps is off", "how much ram does my app need", "build ram vs runtime ram"]
updated: 2026-06-19
---

# Pick a Cheap VPS

The first decision is also the first place people overspend or under-provision: which box to rent. A
**VPS** (virtual private server) is a slice of a real server in a data center that's yours to do anything
with - your own Linux machine, always on, with a public IP. (If "what's a server, really?" is fuzzy,
[What a Server Is](/guides/what-a-server-is) covers it from scratch.)

For a side project you need far less than you'd think - with one catch that surprises everybody.

## What specs you actually need

For a typical small web app + database in Docker:

- **CPU:** 1 vCPU is fine to start; 2 if you can spare it. Side-project traffic is tiny.
- **Disk:** 20–25 GB is plenty - until Docker images and logs pile up (we'll watch that later).
- **RAM:** this is the one that matters, and the one with the trap below.

A typical cheapest tier (around **1 vCPU / 1 GB RAM / 25 GB disk**) will *run* most small apps
comfortably. The problem isn't running it. It's *building* it.

## ⚠️ Build-RAM vs runtime-RAM - the box must survive the build

Here's the trap. Your app might happily *run* in 200 MB. But **building** it - compiling code, installing
`node_modules`, bundling assets, `docker build` - can momentarily need *much* more, often more than a
1 GB box has. The build is the spike, not the steady state.

⚠️ **Cheap-VPS build OOM.** On a 1 GB box, `docker compose up --build` can die mid-build with a cryptic
`Killed` or exit code `137`. That's the **OOM killer** ([What "Out of Memory" Really Means](/guides/processes-memory-and-cpu))
reaping your build because it ran the box out of RAM. The build didn't fail because your code is wrong -
the machine ran out of room to build it. Three ways out:

1. **Add swap** - give the box emergency overflow memory on disk. Slow, but it lets a memory-hungry build
   *finish* instead of getting killed:
   ```console
   $ sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
   $ sudo mkswap /swapfile && sudo swapon /swapfile
   $ echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
   *What just happened:* you created a 2 GB swap file, switched it on, and added it to `/etc/fstab` so it
   survives a reboot. The build now has headroom to spill into.
2. **Build somewhere else, ship the image.** Build the Docker image on your laptop or in CI, push it to a
   registry, and have the box just *pull and run* it - no build on the box at all. This is the grown-up
   answer, and [Phase 6](06-auto-deploy-on-merge.md) leans toward it.
3. **Temporarily resize.** Bump the box to more RAM for the build, then size back down. Fiddly; swap is
   usually easier.

💡 **Key point.** Choose the box for the *build's* peak, not the app's idle. The cheapest tier plus a
swap file covers most first deploys.

## ⚠️ You're billed while it's powered off - *delete* to stop paying

This one costs people real money. With a VPS, **stopping or powering off the server does not stop the
bill.** The provider is still reserving your CPU, RAM, and - especially - your disk, whether the machine
is "on" or not. "Powered off" is not "free."

To actually stop being charged, you must **destroy / delete** the server (the provider may call it
"Destroy," "Terminate," or "Delete"). If you want to keep the work first, take a **snapshot** (a saved
image you can restore later - note snapshots usually cost a small amount to store too).

⚠️ The classic version of this: you spin up a box to experiment over a weekend, "turn it off" Sunday
night thinking you're done, and find it on next month's invoice the whole time. Powering off saves you
nothing. Delete it.

## Recap

1. **1 vCPU / 1 GB / ~25 GB** runs most small apps - pick for the *build's* memory spike, not the app's
   idle.
2. ⚠️ **Builds OOM on tiny boxes** (`Killed` / exit 137) - add **swap**, or build elsewhere and pull the
   image, or temporarily resize.
3. ⚠️ **Powering off does NOT stop billing** - *delete* the server (snapshot first if you want to keep
   it) to actually stop paying.

You've got a box and an IP. Next, get into it - securely.

---

[← Guide overview](_guide.md) · [Phase 2: SSH In With a Key →](02-ssh-in-with-a-key.md)
