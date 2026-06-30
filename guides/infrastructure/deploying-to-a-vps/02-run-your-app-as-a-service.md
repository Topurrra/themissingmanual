---
title: "Run Your App as a Service"
guide: "deploying-to-a-vps"
phase: 2
summary: "Getting your code onto the box, running it once by hand, then handing it to systemd so it restarts on crash, comes back after a reboot, and survives your terminal closing. Plus how to confirm it's actually listening on its port."
tags: [systemd, deployment, services, git, scp, ports, logs, journalctl]
difficulty: intermediate
synonyms: ["run app as a systemd service", "keep app running after ssh closes", "restart app on crash", "start app on boot linux", "deploy code to server with git", "scp files to server", "check if app is listening on port", "systemd unit file for app", "journalctl read app logs"]
updated: 2026-06-19
---

# Run Your App as a Service

You've got a box. Now you need your app *on* it - and, more importantly, *staying* on it. Because here's
the trap everyone falls into the first time: you SSH in, you start your app, you see it working, you
close your laptop... and it dies. Or it crashes at 3am and nobody restarts it. Or the box reboots for a
kernel update and your app never comes back.

The fix isn't discipline or luck. It's handing your app to the part of Linux whose entire job is keeping
long-running programs alive: **systemd**. This phase gets your code onto the box, runs it once by hand to
prove it works, then makes it a real service. Let's start with the mental model, because the whole reason
this phase exists comes down to one fact about your shell.

## Why "just run it" doesn't work

**What it actually is.** When you start a program in your SSH session, that program is a *child* of your
shell, and your shell is tied to your *connection*. When the connection ends - you log out, your laptop
sleeps, the network blips - the shell goes away, and it takes your program down with it.

```text
   RUNNING IT BY HAND                      RUNNING IT AS A SERVICE
   ─────────────────────────────          ─────────────────────────────
   tied to your SSH session         │      owned by systemd (the init system)
   dies when you log out            │      runs unattended for months
   stays dead if it crashes         │      restarted automatically on crash
   gone after a reboot              │      started again on every boot
   logs scroll past and vanish      │      logs captured in the journal
```

**Why this matters.** A server's whole job is to keep services alive without a human watching (see
[Linux for Servers](/guides/linux-for-servers) for the full picture). A program tied to your terminal is
the opposite of that. So we run it by hand *once* - only to confirm it works - and then immediately hand
it off to something that won't let it die.

## Step 1: Get your code onto the box

You have two clean ways to move your app from your laptop to the server. Pick the one that fits.

**Option A - clone from Git (the usual choice).** If your code is in a Git repository, install Git on
the box and clone it:

```console
deploy@web-prod-1:~$ sudo apt install -y git
...
deploy@web-prod-1:~$ git clone https://github.com/you/your-app.git
Cloning into 'your-app'...
remote: Enumerating objects: 348, done.
remote: Counting objects: 100% (348/348), done.
...
Receiving objects: 100% (348/348), 1.21 MiB | 4.30 MiB/s, done.
Resolving deltas: 100% (180/180), done.
deploy@web-prod-1:~$ cd your-app
```

*What just happened:* You installed Git, then `git clone` downloaded a full copy of your repository into
`/home/deploy/your-app`. Updating later is `git pull` from inside that directory. For a private repo
you'll need to authenticate - a deploy key or token - which the repo host documents.

**Option B - copy files directly with `scp`.** If your app isn't in Git, or it's a built artifact (a
compiled binary, a bundled archive), copy it over from your **laptop**:

```console
$ scp ./my-app deploy@203.0.113.10:/home/deploy/
my-app                              100%   18MB  6.1MB/s   00:03
```

*What just happened:* `scp` (*secure copy*, SSH's file-transfer cousin) pushed the local file `./my-app`
to `/home/deploy/` on the server. It reads `destination:path` the same way `ssh` reads `user@host`. The
`100%` line is the transfer completing.

Once the code is on the box, install whatever runtime and dependencies it needs (Node, Python, a JVM,
nothing at all for a static binary) the same way you would anywhere - with `apt` or your language's own
tooling. That part is specific to your stack, so we won't guess at it here.

## Step 2: Run it once, by hand, to prove it works

Before automating anything, run the app directly and watch it start. You want to *see* it come up and
confirm the port it listens on.

```console
deploy@web-prod-1:~/your-app$ ./my-app
Starting server...
Listening on http://127.0.0.1:3000
```

*What just happened:* Your app started in the foreground and told you it's listening on port `3000` -
but note the address: `127.0.0.1`, which is *localhost*, reachable only from the box itself. That's
exactly what you want for now; the outside world will reach it through nginx in
[Phase 3](03-make-it-public-and-safe.md), not directly.

Leave it running and open a **second** SSH session to confirm it actually answers:

```console
deploy@web-prod-1:~$ curl http://127.0.0.1:3000
<!DOCTYPE html><html><head><title>My App</title>...
```

*What just happened:* `curl` made an HTTP request to your app from inside the box and got the response
body back - proof the app is up and serving. Now go back to the first session and stop it with
**Ctrl-C**. You've confirmed it works; time to make it permanent.

📝 **Terminology.** *localhost* / `127.0.0.1` = the box talking to itself; connections to this address
never leave the machine. *Binding* = which address and port a server listens on. An app bound to
`127.0.0.1:3000` is private to the box; one bound to `0.0.0.0:3000` would accept connections from
anywhere - which, for your app port, you do **not** want (more on that in Phase 3).

## Step 3: Hand it to systemd

**What it actually is.** **systemd** is the *init system* on modern Ubuntu - the very first process to
start at boot (PID 1) and the manager responsible for starting, stopping, supervising, and restarting
all the long-running services on the box. You describe your app to it in a small text file called a
**unit file**, and from then on systemd treats your app exactly like it treats SSH or nginx: a service
it keeps alive.

**A real example.** Create the unit file with `sudo` (it lives in a system directory):

```console
deploy@web-prod-1:~$ sudo nano /etc/systemd/system/my-app.service
```

Put this inside (adjust the paths and command for your app):

```text
[Unit]
Description=My App
After=network.target

[Service]
User=deploy
WorkingDirectory=/home/deploy/your-app
ExecStart=/home/deploy/your-app/my-app
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Here's what each line is telling systemd, because copy-pasting a unit file you don't understand is how
mysteries get created:

- **`Description`** - a human-readable label shown in status output.
- **`After=network.target`** - don't start my app until the network is up.
- **`User=deploy`** - run the app as the `deploy` user, *not* root. This matters: a service should run
  with the least privilege it needs, so a bug in your app can't trivially become a bug in your whole box.
- **`WorkingDirectory`** - the directory to run from (so relative paths in your app resolve correctly).
- **`ExecStart`** - the exact command to launch your app. Use the **full absolute path**; systemd
  doesn't use your shell's `PATH`.
- **`Restart=always`** with **`RestartSec=3`** - if the app exits for *any* reason, wait 3 seconds and
  start it again. This is the line that turns "it crashed and stayed down" into "it crashed and recovered."
- **`WantedBy=multi-user.target`** - when enabled, start this at boot, once the system reaches normal
  multi-user operation.

Save and exit (in `nano`: Ctrl-O, Enter, Ctrl-X). Now tell systemd about it, start it, and set it to run
on boot:

```console
deploy@web-prod-1:~$ sudo systemctl daemon-reload
deploy@web-prod-1:~$ sudo systemctl enable --now my-app
Created symlink /etc/systemd/system/multi-user.target.wants/my-app.service → /etc/systemd/system/my-app.service.
```

*What just happened:* `daemon-reload` told systemd to re-read its unit files so it notices the new one.
Then `enable --now my-app` did two things at once: **`enable`** wired the service to start automatically
on every boot (that's the symlink it reports creating), and **`--now`** also started it immediately. Your
app is running - and this time it isn't tied to your session at all.

## Step 4: Confirm it's alive (and check it's listening)

Always verify, don't assume. First, ask systemd how the service is doing:

```console
deploy@web-prod-1:~$ sudo systemctl status my-app
● my-app.service - My App
     Loaded: loaded (/etc/systemd/system/my-app.service; enabled; preset: enabled)
     Active: active (running) since Fri 2026-06-19 14:22:07 UTC; 12s ago
   Main PID: 8123 (my-app)
      Tasks: 7 (limit: 1131)
     Memory: 24.5M
        CPU: 180ms
     CGroup: /system.slice/my-app.service
             └─8123 /home/deploy/your-app/my-app

Jun 19 14:22:07 web-prod-1 systemd[1]: Started my-app.service - My App.
Jun 19 14:22:07 web-prod-1 my-app[8123]: Listening on http://127.0.0.1:3000
```

*What just happened:* The two lines that matter are **`Active: active (running)`** (the app is up) and
**`enabled`** (it'll come back after a reboot). You can also see its process ID, memory use, and the last
few log lines - including your app's own "Listening on..." message, which systemd captured for you.

Second, confirm the app is genuinely listening on its port:

```console
deploy@web-prod-1:~$ sudo ss -tlnp | grep 3000
LISTEN 0      511        127.0.0.1:3000       0.0.0.0:*    users:(("my-app",pid=8123,fd=6))
```

*What just happened:* `ss -tlnp` lists listening (`-l`) TCP (`-t`) sockets with numeric addresses (`-n`)
and the owning process (`-p`). The line shows your app (`my-app`, PID 8123) listening on
`127.0.0.1:3000` - bound to localhost, exactly as intended. (`ss` is the modern replacement for the
older `netstat`; if a tutorial shows `netstat -tlnp`, this is its equivalent.)

To watch the logs live - the server-world replacement for "the output that used to scroll past in my
terminal" - use the journal:

```console
deploy@web-prod-1:~$ sudo journalctl -u my-app -f
Jun 19 14:22:07 web-prod-1 my-app[8123]: Listening on http://127.0.0.1:3000
Jun 19 14:25:31 web-prod-1 my-app[8123]: GET / 200 14ms
```

*What just happened:* `journalctl -u my-app` shows the captured logs *for this unit* (`-u`), and `-f`
*follows* them - new lines appear as they happen, like `tail -f`. Press Ctrl-C to stop watching (it
doesn't stop the app - just your view of its logs). This is where you'll look first whenever something
seems wrong.

🪖 **War story.** The classic way to *think* you've deployed but actually haven't: you start the app in a
plain SSH session, it works, you close the laptop, and the demo dies five minutes into the meeting. The
whole point of the systemd dance above is that the app's life is no longer connected to yours. Run it as
a service, verify `active (running)` and `enabled`, and you can disconnect with confidence.

⚠️ **Gotcha.** If `systemctl status` shows `failed` or `activating (auto-restart)` flapping, your
`ExecStart` command, a path, or a missing dependency is almost always the cause. Read `journalctl -u
my-app` - your app's own startup error will be sitting right there. Don't keep re-running `systemctl
restart` hoping it'll catch; read the log and fix the actual error.

## Recap

1. A program started in your SSH session **dies with the session** - that's why "just run it" fails.
2. Get your code on the box with **`git clone`** (or **`scp`** for an artifact), then run it **once by
   hand** to confirm it works and see its port - bound to **`127.0.0.1`**, private to the box.
3. Describe it to **systemd** in a unit file: run as a **non-root user**, **`Restart=always`** so it
   recovers from crashes, and **`WantedBy=multi-user.target`** so it returns after a reboot.
4. **`systemctl enable --now`** starts it and wires it to boot; verify with **`systemctl status`**
   (look for `active (running)` *and* `enabled`), check the port with **`ss -tlnp`**, and read logs with
   **`journalctl -u my-app`**.

Your app now stays up on its own - but it's still hiding on localhost where nobody outside the box can
reach it. Next, we open the front door: a domain, a reverse proxy, and HTTPS.

---

[← Phase 1: Get a Box and Get In](01-get-a-box-and-get-in.md) · [Phase 3: Make It Public & Safe →](03-make-it-public-and-safe.md)
