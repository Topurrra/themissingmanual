---
title: "Docker & Your Private Repo"
guide: "ship-your-side-project"
phase: 3
summary: "Install Docker, pull your PRIVATE repo onto the box with a read-only deploy key, and bring it up with compose - dodging the two .env traps that waste everyone's first afternoon: a $ in a value, and restart not re-reading .env."
tags: [docker, docker-compose, deploy-key, private-repo, dotenv, force-recreate]
difficulty: intermediate
synonyms: ["install docker on vps", "clone private repo on server", "what is a github deploy key", "docker compose env not updating", "dollar sign in env file docker", "docker compose restart not picking up env"]
updated: 2026-06-19
---

# Docker & Your Private Repo

The box is yours and you're logged in. Now get your app *running* on it. We'll assume your project already
has a `docker-compose.yml` (if Docker or Compose themselves are fuzzy,
[Docker Without the Magic](/guides/docker-without-the-magic) and
[Docker Compose for Real Projects](/guides/docker-compose-for-real-projects) are the foundations this
phase stands on). Three moves: install Docker, get your code onto the box, bring it up.

## Install Docker

The official convenience script is the fastest path on a fresh Linux box:

```console
$ curl -fsSL https://get.docker.com | sh
$ sudo docker compose version
Docker Compose version v2.29.7
```
*What just happened:* the script installed Docker Engine and the Compose plugin. If `docker compose
version` answers, you're set. (Add your user to the `docker` group to drop the `sudo`:
`sudo usermod -aG docker $USER`, then log out and back in.)

## Get your PRIVATE repo onto the box: a deploy key

If your repo is **private**, `git clone` will be refused - the box has no permission to read it. The clean
fix is a **deploy key**: an SSH key pair whose public half you register on *that one repository*, granting
read-only access. Generate it **on the server** (so the private key never leaves the box), add the public
half to the repo, then clone over SSH.

```console
$ ssh-keygen -t ed25519 -C "deploy@myserver" -f ~/.ssh/deploy_key   # make a key ON the box
$ cat ~/.ssh/deploy_key.pub                                          # paste this into GitHub
```
On GitHub: **repo → Settings → Deploy keys → Add deploy key**, paste the `.pub`, leave "Allow write
access" **unchecked** (read-only is all a deploy needs). Then tell the box to use that key and clone:

```console
$ git clone git@github.com:you/your-project.git
Cloning into 'your-project'...
remote: Enumerating objects: 312, done.
Receiving objects: 100% (312/312), done.
```
*What just happened:* the deploy key proved the box is allowed to read *this* repo (and no other), so the
clone succeeded over SSH. 📝 **Deploy key** = an SSH key scoped to a single repository - safer than
putting your personal account's key on a server, because if the box is compromised, the blast radius is
read access to one repo.

## Bring it up

```console
$ cd your-project
$ cp .env.example .env && nano .env     # fill in your real secrets
$ docker compose up -d
[+] Running 3/3
 ✔ Container your-project-db-1   Started
 ✔ Container your-project-api-1  Started
 ✔ Container your-project-web-1  Started
```
*What just happened:* Compose built/pulled the images and started every service in the background (`-d`).
Your app is now *running* on the box - reachable at the server's IP on whatever port you exposed. (Not at
a domain or over HTTPS yet - that's the next two phases.)

⚠️ **Build OOM, again.** If `docker compose up` *builds* on a tiny box, it can get `Killed` (exit 137) for
the out-of-memory reason from [Phase 1](01-pick-a-vps.md). Same fixes: add swap, or build the image
elsewhere and pull it.

## ⚠️ The two `.env` traps that eat your afternoon

These are the deploy bugs that make people question reality, because nothing is "wrong" - the tool is
behaving exactly as designed, just not as you assumed.

⚠️ **A `$` in a value gets mangled.** Docker Compose performs *variable substitution* - it treats `$NAME`
and `${NAME}` in values as "insert another variable here." So a password like `pa$$w0rd` in your `.env`
becomes `paw0rd` (it tried to expand `$$` and `$w0rd`), and your database auth fails with a password you'd
*swear* is correct. The fix: **escape each `$` as `$$`** in values Compose reads, or generate secrets
without `$`:
```text
# .env  - a literal $ must be doubled so Compose doesn't try to expand it
DB_PASSWORD=pa$$$$w0rd      # the value the container receives is  pa$$w0rd
```
*What just happened:* each real `$` is written as `$$`, so Compose's substitution leaves a single `$`
behind in the value the container actually gets. This one is invisible until a login or DB connection
fails for no reason you can see.

⚠️ **`restart` does NOT re-read `.env`.** You change a value in `.env`, run `docker compose restart`, and
your change *doesn't take effect.* That's because `restart` just stops and starts the **existing**
containers - it does not re-read `.env` or the compose file. To actually apply new env or image changes,
**recreate** the containers:
```console
$ docker compose up -d --force-recreate
```
*What just happened:* `up -d` reconciles to the current `.env`/compose definition, and `--force-recreate`
forces new containers even if Compose thinks nothing changed - so your edited values are actually picked
up. Reach for this, not `restart`, whenever you touch `.env`. (Burn it in now; it comes back in
[Phase 6](06-auto-deploy-on-merge.md).)

> ⏭️ Why config lives in `.env` at all, and how `${...}` interpolation works, is
> [Environment Variables & Config](/guides/env-vars-and-config).

## Recap

1. **Install Docker** with the official script; `docker compose version` to confirm.
2. **Private repo → deploy key:** generate the key *on the box*, register its public half as a read-only
   deploy key on the repo, clone over SSH.
3. **`docker compose up -d`** brings the stack up in the background. ⚠️ Building on a tiny box can OOM -
   swap, or build elsewhere.
4. ⚠️ **A `$` in `.env` is mangled** by Compose substitution - double it (`$$`).
5. ⚠️ **`restart` ignores `.env` changes** - use **`docker compose up -d --force-recreate`** to apply
   them.

It's running - but only reachable by raw IP. Let's give it a real name.

---

[← Phase 2: SSH In With a Key](02-ssh-in-with-a-key.md) · [Guide overview](_guide.md) · [Phase 4: Domains & DNS →](04-domains-and-dns.md)
