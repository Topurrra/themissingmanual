---
title: "Writing the same test in k6 and JMeter"
guide: load-testing-k6-jmeter
phase: 2
summary: "One realistic ramping scenario built twice, in k6's JavaScript and JMeter's GUI, plus thresholds, checks, and running it in CI."
tags: [k6, jmeter, load-testing, thresholds, ci, ramping-vus]
difficulty: intermediate
synonyms: [k6 example script, jmeter thread group setup, k6 thresholds, ramp up virtual users, k6 in ci, jmeter command line non-gui, k6 stages, k6 checks]
updated: 2026-06-30
---

# Writing the same test in k6 and JMeter

Now we build something real. The scenario: your API has a login endpoint and a "list my orders" endpoint, and you want to know whether it holds up when traffic ramps from nothing to 100 concurrent users over a couple of minutes, then comes back down. We will build this twice - once in k6, once in JMeter - so you can feel the difference in your hands instead of reading a feature matrix.

The shape of the load is the same in both: **ramp up, hold, ramp down**. Ramping matters. Slamming a server from zero to full load tests a cold, panicked system; ramping up the way real traffic arrives gives caches and pools a chance to warm and shows you a curve, not a single point.

## The scenario in k6

k6 is a single binary you install once. Your test is a JavaScript file with a `default` function (what each virtual user does on each loop) and an exported `options` object (how many users, for how long, and what counts as passing).

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },  // ramp 0 -> 100 VUs
    { duration: '1m',  target: 100 },  // hold at 100
    { duration: '30s', target: 0 },    // ramp back down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],   // p95 latency under 300ms
    http_req_failed:   ['rate<0.01'],   // error rate under 1%
  },
};

export default function () {
  const login = http.post('https://api.example.com/login',
    JSON.stringify({ user: 'demo', pass: 'demo' }),
    { headers: { 'Content-Type': 'application/json' } });

  check(login, { 'login is 200': (r) => r.status === 200 });

  const token = login.json('token');
  http.get('https://api.example.com/orders',
    { headers: { Authorization: `Bearer ${token}` } });

  sleep(1);  // think time: pause like a real user
}
```

*What just happened:* `stages` drew the ramp-hold-ramp curve. `thresholds` encoded your goals from Phase 1 as machine-checkable rules. Each VU logs in, reads the token, lists orders, then pauses one second - a small but realistic user journey, not a blind request flood.

You run it from the terminal. This is the whole workflow:

```console
$ k6 run orders-test.js

     ✓ login is 200

     http_req_duration..............: avg=88ms  p(95)=214ms
     http_req_failed................: 0.42%  ✓ 23  ✗ 5478
     http_reqs......................: 5501   42.3/s
     vus............................: 100    max=100

   ✓ THRESHOLDS PASSED
```

*What just happened:* the run printed exactly the three numbers that matter - p95 (214 ms), error rate (0.42%), and throughput (42.3 req/s) - and checked them against your thresholds. `THRESHOLDS PASSED` means k6 will exit with code 0; if a threshold fails, it exits non-zero, which is the hook that makes CI work.

## The same scenario in JMeter

JMeter comes at this from the GUI. You open the desktop app and build the test as a **test plan** tree: a **Thread Group** holds the load shape, **Samplers** are the requests, and **Listeners** show the results. You are clicking and filling in fields, not writing code.

```text
Test Plan
└── Thread Group         (100 threads, 30s ramp-up, loop for duration)
    ├── HTTP Request: POST /login
    │   └── JSON Extractor: pull "token" into a variable
    ├── HTTP Header Manager: Authorization: Bearer ${token}
    ├── HTTP Request: GET /orders
    ├── Constant Timer: 1000 ms        (think time)
    └── Listener: Summary Report / Aggregate Report
```

*What just happened:* every concept from the k6 script has a one-to-one twin here. Threads are VUs, ramp-up time is the first stage, the JSON Extractor replaces `login.json('token')`, the Header Manager carries the token, and the Constant Timer is `sleep(1)`. Same scenario, assembled with a mouse.

Reading results lives in the **Aggregate Report** listener, which gives you a table with a column literally labeled **95% Line** alongside **Throughput** and **Error %** - the same three numbers, named slightly differently.

> JMeter's built-in ramp shape is one number: ramp-up time, then hold. k6's `stages` describe an arbitrary curve (up, hold, spike, down) directly. For multi-step ramps in JMeter you reach for the Ultimate Thread Group plugin. If your load shape is complex, that difference alone may decide the tool.

## Running it without the GUI

Here is the rule that surprises newcomers: **never run a real JMeter load test from the GUI.** The graphical interface is for *building* and *debugging* the plan. The GUI itself consumes memory and CPU drawing live graphs, which steals resources from load generation and skews your results. For the real run, you go headless:

```console
$ jmeter -n -t orders-test.jmx -l results.jtl
```

*What just happened:* `-n` is non-GUI mode, `-t` points at the test plan you built in the GUI, and `-l` writes raw results to a `.jtl` file you analyze afterward. This is the mode you use for any run whose numbers you intend to trust, and the only mode that belongs anywhere near CI.

k6 has no such split - it is headless by nature. That is most of why it slots into pipelines so cleanly:

```yaml
# a CI step, conceptually
- run: k6 run orders-test.js
  # threshold failure -> non-zero exit -> red build
```

*What just happened:* because k6 returns a failing exit code when a threshold is breached, your performance goal becomes a build gate with no extra glue. JMeter can do this too, but you assert on the `.jtl` afterward rather than getting it from the run itself.

## Which one, and when

Neither tool is "better." They fit different teams.

- **Reach for k6** when your team lives in code and Git, when you want the test reviewed in a pull request, and when CI gating is the goal. Tests are diffable text; the learning curve is "do you know a little JavaScript."
- **Reach for JMeter** when you need protocols beyond HTTP (JDBC, JMS, FTP, LDAP and more), when the people writing tests prefer a GUI over code, or when you are inheriting an organization that already has a wall of `.jmx` files. Its maturity and protocol breadth are real and hard to match.

```quiz
[
  {
    "q": "In a k6 script, what does the `thresholds` block do?",
    "choices": ["Sets how many virtual users to run", "Defines pass/fail rules so k6 exits non-zero when goals are missed", "Controls the ramp-up duration", "Adds think time between requests"],
    "answer": 1,
    "explain": "Thresholds encode your performance goals (e.g. p(95)<300). A breach makes k6 exit non-zero, which is what gates a CI build."
  },
  {
    "q": "Why should you run a real JMeter load test with `-n` (non-GUI) instead of from the GUI?",
    "choices": ["The GUI cannot generate enough load", "The GUI consumes CPU/memory drawing live graphs, skewing results", "Non-GUI mode is the only one that supports HTTP", "Thresholds only work in non-GUI mode"],
    "answer": 1,
    "explain": "The GUI is for building and debugging. Its live rendering steals resources from load generation, so real runs go headless with -n -t -l."
  },
  {
    "q": "Your team wants load tests reviewed in pull requests and gating CI, written by developers comfortable with JavaScript. Which tool fits best?",
    "choices": ["JMeter, for its GUI", "k6, because tests are diffable code and it exits non-zero on threshold failure", "Neither can run in CI", "JMeter, because it supports more protocols"],
    "answer": 1,
    "explain": "k6's scripts are plain text (great for code review) and its threshold-driven exit code makes CI gating trivial. JMeter shines elsewhere: protocol breadth and GUI authoring."
  }
]
```

[← Phase 1: What load testing measures](01-what-load-testing-measures.md) · [Overview](_guide.md) · [Phase 3: When the numbers lie and the system breaks →](03-gotchas-and-production-reality.md)
