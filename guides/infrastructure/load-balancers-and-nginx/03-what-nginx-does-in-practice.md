---
title: "What nginx Does in Practice"
guide: "load-balancers-and-nginx"
phase: 3
summary: "The jobs nginx actually does day to day in front of your app — terminating TLS/HTTPS, gzip compression, caching static assets, and rate limiting — plus the everyday skill of testing and reloading config safely without restarting and dropping connections."
tags: [nginx, tls, https, gzip, caching, rate-limiting, nginx-reload, x-forwarded-for]
difficulty: intermediate
synonyms: ["terminate tls in nginx", "nginx https config", "nginx gzip compression", "nginx cache static files", "nginx rate limiting", "nginx -t test config", "nginx reload vs restart", "nginx real client ip X-Forwarded-For", "nginx config reload without downtime"]
updated: 2026-06-19
---

# What nginx Does in Practice

You've got the mental model: nginx is the receptionist out front, optionally spreading work across a pool.
Now let's make it concrete. In a real deployment, nginx isn't just blindly forwarding — it's quietly doing a
handful of jobs that would be painful to build into your app. This phase walks through the four you'll meet
most, then the one operational skill that matters more than any of them: changing the config without breaking
the site.

## The "what nginx is doing for me" cheat-card

> **Want to know what each piece of your config buys you? Find it here, then read the section.**

| Job | What it does | Directive you'll see |
|---|---|---|
| TLS termination | Handles HTTPS so your app speaks plain HTTP (§1) | `listen 443 ssl;` `ssl_certificate` |
| Compression | Shrinks text responses before sending (§2) | `gzip on;` |
| Static caching | Serves & caches CSS/JS/images without touching your app (§3) | `location` + `expires` / `root` |
| Rate limiting | Caps how fast a client can hammer you (§4) | `limit_req_zone` / `limit_req` |
| Safe reload | Apply config changes with no dropped connections (§5) | `nginx -t` then `nginx -s reload` |

---

## 1. TLS termination — HTTPS stops here

**What it actually is.** TLS termination means nginx is the place where the encrypted HTTPS connection ends.
The visitor's browser and nginx do the encrypted handshake; nginx decrypts the request and forwards it to your
app over plain, unencrypted HTTP on a private local port. On the way back, nginx encrypts the response again.

The point: **your app never deals with certificates or encryption.** It speaks ordinary HTTP, as if it were
still on your laptop, while the public connection is fully HTTPS.

```nginx
server {
    listen 443 ssl;                                  # listen for HTTPS
    server_name yoursite.com;

    ssl_certificate     /etc/letsencrypt/live/yoursite.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yoursite.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;            # plain HTTP to the app
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;  # tell the app it was HTTPS
    }
}

# A second tiny server block to send plain HTTP visitors to HTTPS.
server {
    listen 80;
    server_name yoursite.com;
    return 301 https://$host$request_uri;            # permanent redirect to HTTPS
}
```

*What just happened:* The first block accepts HTTPS on port 443 using your certificate files, then forwards
decrypted requests to the app on plain HTTP. The `X-Forwarded-Proto $scheme` header tells your app "the
original request came in over HTTPS" — important, because to the app the connection looks like plain HTTP and
it would otherwise have no idea. The second block catches anyone who typed `http://` and redirects them to the
secure version.

📝 **Terminology — `301`.** That's the HTTP status code for "moved permanently." Browsers remember it and go
straight to HTTPS next time, instead of asking for the HTTP version again.

⚠️ **Gotcha — the redirect loop from a missing `X-Forwarded-Proto`.** If your app does its own "force HTTPS"
redirect but can't tell it's *already* on HTTPS (because nginx forwarded plain HTTP and you didn't pass
`X-Forwarded-Proto`), the app keeps redirecting to HTTPS, nginx keeps forwarding as HTTP, and the browser
spins in an endless redirect loop. Passing that header — and configuring your framework to trust it — is the
cure. This is the same family of problem as the real-client-IP gotcha from
[Phase 1](01-what-a-reverse-proxy-is.md): when a proxy sits in front, your app only knows about the original
request through the headers you choose to forward.

## 2. gzip — making responses smaller

**What it actually is.** gzip is compression. nginx can squeeze text-based responses — HTML, CSS, JavaScript,
JSON — down to a fraction of their size before sending them over the wire, and the browser unpacks them on
arrival. Less data on the wire means faster page loads, especially on slow connections.

```nginx
gzip on;
gzip_types text/css application/javascript application/json text/plain;
```

*What just happened:* You turned compression on and told nginx which content types are worth compressing.
nginx now compresses matching responses on the fly before sending them.

💡 **Key point.** Compress text, not media. Images, video, and most fonts are *already* compressed — running
gzip over them wastes CPU for no real gain, which is why you list specific text types rather than "everything."

## 3. Caching and serving static assets

**What it actually is.** Your CSS, JavaScript, images, and fonts don't change between requests. There's no
reason to wake up your app to hand out the same logo a thousand times. nginx can serve those files straight
from disk, and tell browsers to *cache* them so they don't even re-request them next time.

```nginx
location /static/ {
    root /var/www/yoursite;          # serve files from /var/www/yoursite/static/
    expires 30d;                     # tell browsers to cache for 30 days
}
```

*What just happened:* Requests starting with `/static/` are served by nginx directly off the disk — your app
is never involved. The `expires 30d` adds a caching header so a returning visitor's browser reuses its saved
copy for 30 days instead of asking again. Two wins: your app does less work, and repeat visits feel instant.

⚠️ **Gotcha — caching and updates fight each other.** If you tell browsers to cache `app.js` for 30 days and
then ship a new version, returning visitors keep the old one for up to 30 days. The standard fix is
*cache-busting*: change the filename when the content changes (e.g. `app.a1b2c3.js`), so a new version is a new
URL the browser hasn't cached. Most build tools do this for you — the thing to *know* is that long cache times
and changing files only coexist when the filename changes with the content.

## 4. Rate limiting — capping the firehose

**What it actually is.** Rate limiting caps how many requests a single client can make in a window of time. It
protects your app from being overwhelmed — whether by a misbehaving script, a scraper, or a brute-force login
attempt — by having nginx turn away the excess before it ever reaches your app.

```nginx
# Define a shared limit: 10 requests per second per client IP.
limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;

server {
    location /api/ {
        limit_req zone=mylimit burst=20 nodelay;     # apply it to the API
        proxy_pass http://127.0.0.1:3000;
    }
}
```

*What just happened:* The `limit_req_zone` line defines a limit of 10 requests per second, tracked per client
IP, using a shared 10-megabyte memory area named `mylimit` to remember everyone's recent rate. Applying it to
`/api/` means a client going faster than that gets turned away with an error instead of reaching your app. The
`burst=20` allows a short spike of up to 20 queued requests so normal bursty traffic isn't punished, and
`nodelay` lets that burst through immediately rather than dribbling it out.

⚠️ **Gotcha — rate limiting by IP needs the *real* IP.** `$binary_remote_addr` is the address of whoever
opened the connection. If there's *another* proxy or a CDN in front of nginx, that address is the upstream
proxy's, not the visitor's — so every visitor shares one rate limit, or one visitor can dodge it. This is the
real-client-IP problem from [Phase 1](01-what-a-reverse-proxy-is.md) again, one layer up: when you're behind
another proxy, you have to teach nginx to read the forwarded IP (via the `realip` module) before rate limiting
behaves the way you expect.

## 5. The skill that matters most: testing and reloading config safely

Everything above lives in config files. Here's the operational reality: **a typo in your nginx config can take
your entire site down.** So the single most valuable habit is checking before you apply, and applying without
dropping connections.

**Always test first.** Before applying any change, ask nginx to parse the config and tell you if it's valid:

```console
$ sudo nginx -t
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

*What just happened:* `nginx -t` ("test") parsed your config without touching the running server. It found no
errors, so it's safe to apply. If you'd made a typo, it would print the file and line number instead — and
you'd fix it *before* anything went live. Running `-t` every single time is a cheap habit that prevents the
worst kind of outage.

**Reload, don't restart.** Once the test passes, apply the change:

```console
$ sudo nginx -s reload
```

*What just happened:* `reload` tells the running nginx to re-read its config and gracefully hand over to new
worker processes. In-flight requests on the old workers finish normally; new requests use the new config.
**No connections are dropped.** A *restart*, by contrast, stops nginx entirely and starts it again — there's a
brief window where nothing is listening and visitors get connection errors.

⚠️ **Gotcha — reload vs restart.** Reach for **reload** for config changes; it's seamless. Save **restart**
for the rare cases that genuinely need it (changing certain startup-level settings, or recovering a wedged
process). And never run `reload` without running `nginx -t` first — reloading a broken config can leave the
running server in a bad state. Test, then reload. Every time.

**Why this saves you later.** The difference between a calm config change and a 2am outage is almost always
this discipline: test with `-t`, apply with `reload`. Build the habit now, while nothing's on fire, and it'll
be automatic when something is.

## Recap

1. **TLS termination** ends HTTPS at nginx; your app speaks plain HTTP. Pass `X-Forwarded-Proto` so it knows
   the request was secure — or risk a redirect loop.
2. **gzip** compresses text responses (not already-compressed media) for faster loads.
3. **Static caching** lets nginx serve assets off disk and tells browsers to cache them — pair long cache
   times with cache-busting filenames.
4. **Rate limiting** caps per-client request rate before traffic hits your app — and depends on nginx seeing
   the real client IP.
5. **Test then reload** (`nginx -t`, then `nginx -s reload`) applies config changes with no dropped
   connections. Reload for config; restart only when you must.

That's the working picture: a reverse proxy is a forwarder, a load balancer is a forwarder with a pool, and
nginx in practice is the place all your infrastructure concerns live. The natural next step is putting one in
front of a real server you control.

> Ready to actually stand this up? [Deploying to a VPS](/guides/deploying-to-a-vps) walks through getting an
> app onto a server with nginx in front of it, end to end — this guide is the "why" behind the front-door
> piece you'll configure there.

---

[← Phase 2: Load Balancing](02-load-balancing.md) · [Guide overview](_guide.md)
