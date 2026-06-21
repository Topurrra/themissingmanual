// Check-your-understanding questions, keyed by "<guide-slug>/<phase-no>".
//
// AUTHORING: add an array of questions under the key. Each question is:
//   { q: 'the question', choices: ['a', 'b', 'c'], answer: 0, explain: 'why' }
// - `answer` is the 0-based index of the correct choice.
// - `explain` (optional) shows after the reader answers.
// A phase with no entry simply shows no quiz, so you can fill these in over time.
// Keep them short (2-3 per phase) and focused on the one idea that must stick.

export const QUIZZES = {
  // -- How the Internet Actually Works --------------------------------------
  'how-the-internet-works/1': [
    {
      q: 'Data travels across the internet in small labelled chunks. What are they called?',
      choices: ['Packets', 'Pixels', 'Cookies', 'Threads'],
      answer: 0,
      explain: 'A request is broken into packets - small labelled chunks - that travel independently and are reassembled at the other end.'
    },
    {
      q: "What is your ISP's job?",
      choices: [
        'It stores all the websites you visit',
        'It connects your home/neighbourhood to the rest of the internet',
        'It turns names like example.com into numbers',
        'It draws the web page on your screen'
      ],
      answer: 1,
      explain: 'Your Internet Service Provider runs the cables and equipment that link your neighbourhood to the wider internet.'
    },
    {
      q: 'After the server answers your request, the response...',
      choices: [
        'is stored permanently on the nearest router',
        'travels back the same kind of path in reverse, to your device',
        'is sent to every device on the internet',
        'stays on the server until you call again'
      ],
      answer: 1,
      explain: 'The answer makes the same journey in reverse: server to internet to your ISP to your router to your device.'
    }
  ],
  'how-the-internet-works/2': [
    {
      q: 'What is an IP address?',
      choices: [
        'The name of a website, like example.com',
        'A number that identifies a machine on the network',
        'A password your browser sends to a server',
        'A type of web page'
      ],
      answer: 1,
      explain: 'An IP address is the numeric address of a machine - like a street address for a building on the network.'
    },
    {
      q: 'What does DNS do?',
      choices: [
        "Encrypts your traffic so others can't read it",
        'Translates human-friendly names like example.com into IP addresses',
        'Speeds up your internet connection',
        'Blocks malicious websites'
      ],
      answer: 1,
      explain: "DNS is the internet's phone book: you give it a name, it gives back the number your device needs to send packets."
    },
    {
      q: 'At the routing level, the network actually moves packets using...',
      choices: ['names', 'numbers (IP addresses)', 'cookies', 'passwords'],
      answer: 1,
      explain: 'Routers only ever route by numbers. Names are the human convenience layered on top.'
    }
  ],
  'how-the-internet-works/3': [
    {
      q: 'In the client/server model, the server...',
      choices: [
        'starts every conversation by reaching out to clients',
        'waits, listening, and only responds when a client asks',
        'can only ever talk to one client at a time',
        'must be on the same network as the client'
      ],
      answer: 1,
      explain: "A server sits and waits; it only speaks when spoken to. That's why one server can quietly serve millions of clients."
    },
    {
      q: 'What is a protocol?',
      choices: [
        'A physical cable between two computers',
        'An agreed set of rules for how two machines communicate',
        'A program that runs on the server',
        'A type of IP address'
      ],
      answer: 1,
      explain: 'A protocol is a rulebook for a conversation - both sides follow the same script, so they understand each other.'
    },
    {
      q: 'HTTP is the protocol for...',
      choices: [
        'carrying packets reliably across the network',
        'requesting and delivering web pages',
        'turning names into numbers',
        'encrypting passwords'
      ],
      answer: 1,
      explain: 'HTTP defines how a client asks for a page and how a server answers. (TCP is the one that carries it reliably.)'
    }
  ],

  // -- Async, Await & the Event Loop ----------------------------------------
  'async-await-and-the-event-loop/1': [
    {
      q: 'What does making code non-blocking (async) actually improve?',
      choices: [
        'It makes each individual wait finish faster',
        'It keeps the worker productive during waits instead of frozen',
        'It adds more CPU cores to the program',
        'It compresses the data so less travels over the network'
      ],
      answer: 1,
      explain: "Async doesn't shorten a wait - it stops one wait from freezing all the other work."
    },
    {
      q: 'Async helps most with which kind of work?',
      choices: [
        'CPU-bound work like hashing a huge file',
        'I/O-bound work like waiting on the network, disk, or timers',
        'Math that runs in a tight loop',
        'Work that never waits on anything'
      ],
      answer: 1,
      explain: 'Overlapping only helps when the work is waiting; CPU-bound work has no idle time to fill.'
    }
  ],
  'async-await-and-the-event-loop/2': [
    {
      q: 'What is the event loop?',
      choices: [
        'Many threads each running a task in parallel',
        'A single thread plus a queue: take the next ready task, run it to completion, repeat',
        'A timer that fires your code every second',
        'A separate CPU core dedicated to async work'
      ],
      answer: 1,
      explain: 'The event loop is one worker plus a waiting line of ready tasks, handled one at a time to completion.'
    },
    {
      q: 'Why does a long synchronous task freeze everything?',
      choices: [
        'The queue runs out of memory',
        "The loop runs each task to completion and can't interrupt it, so the one thread is stuck",
        'Timers are given a lower priority',
        'The network stops responding'
      ],
      answer: 1,
      explain: 'With one thread running each task to completion, a long task traps the loop and nothing else can run.'
    },
    {
      q: 'Single-threaded but concurrent means...',
      choices: [
        'Two tasks run at the exact same instant on different cores',
        'One worker keeps many waiting tasks progressing by filling the gaps between them',
        'The thread is copied for each task',
        'Concurrency and parallelism are the same thing'
      ],
      answer: 1,
      explain: 'Concurrency is interleaving tasks on one worker; parallelism (simultaneous) needs multiple workers.'
    }
  ],
  'async-await-and-the-event-loop/3': [
    {
      q: 'What is a promise?',
      choices: [
        "A guarantee the operation can't fail",
        "A value that isn't here yet - a receipt for the eventual result of a wait",
        'A function that runs on a separate thread',
        'A type of error'
      ],
      answer: 1,
      explain: "A promise stands in for a value you'll have later; it's pending, then settles as fulfilled or rejected."
    },
    {
      q: 'What does await do?',
      choices: [
        'Blocks the whole event loop until the value arrives',
        'Pauses only its own function until the promise settles, freeing the thread for other work',
        'Cancels the async operation',
        'Converts a promise into a thread'
      ],
      answer: 1,
      explain: "await pauses just that function and hands the thread back to the loop, so it reads like blocking but isn't."
    },
    {
      q: 'You log a variable and see Promise { <pending> }. The likely cause?',
      choices: [
        'The network is down',
        "A missing await - you're holding the receipt, not the value",
        'The promise was rejected',
        'You used too many threads'
      ],
      answer: 1,
      explain: 'Forgetting await leaves you with the promise object instead of the unwrapped value.'
    }
  ],

  // -- Authentication vs Authorization --------------------------------------
  'auth-vs-authz/1': [
    {
      q: 'Authentication answers which question?',
      choices: [
        'What are you allowed to do?',
        'Who are you?',
        'Where is the server?',
        'How fast is the request?'
      ],
      answer: 1,
      explain: 'Authentication proves identity - who you are; authorization decides what you may do.'
    },
    {
      q: "A logged-in user tries to read someone else's invoice and gets 403 Forbidden. Which check failed?",
      choices: ['Authentication', 'Authorization', 'DNS', 'The TLS handshake'],
      answer: 1,
      explain: "401 means we don't know who you are (authn); 403 means we know who you are but you may not (authz)."
    },
    {
      q: 'Why must authentication come before authorization?',
      choices: [
        "You can't decide what someone may do until you know who they are",
        'Authorization is faster',
        'Browsers require that order',
        'They actually run in the opposite order'
      ],
      answer: 0,
      explain: 'Permissions depend on identity, so you identify first, then decide what is allowed.'
    }
  ],
  'auth-vs-authz/2': [
    {
      q: 'The core difference between server-side sessions and stateless tokens (JWT) is...',
      choices: [
        'Which encryption algorithm they use',
        'Where the state lives - on the server vs inside the token the client holds',
        'Whether they use HTTPS',
        'How many users they support'
      ],
      answer: 1,
      explain: 'A session keeps the data server-side behind a random id; a token writes the data into a signed string the client carries.'
    },
    {
      q: 'Which is true of a plain JWT?',
      choices: [
        'Its payload is encrypted and unreadable',
        "It's signed, not encrypted - anyone holding it can read the payload",
        "It can never be forged because it's secret",
        "It's stored on the server"
      ],
      answer: 1,
      explain: "A JWT's signature prevents tampering, not reading - never put secrets in the payload."
    },
    {
      q: 'Server-side sessions make which operation easy that JWTs make hard?',
      choices: [
        'Scaling across many servers',
        'Instant revocation / forced logout',
        'Reading the payload',
        'Signing the token'
      ],
      answer: 1,
      explain: 'Delete the session id and the next request is rejected; a JWT stays valid until it expires.'
    }
  ],
  'auth-vs-authz/3': [
    {
      q: "When you click 'Sign in with Google', where do you type your password?",
      choices: [
        'At the third-party app',
        'At Google - the app only ever receives tokens',
        "In the browser's URL bar",
        'Nowhere; OAuth needs no password'
      ],
      answer: 1,
      explain: 'You authenticate at the service that holds your data; the app gets scoped tokens, never your password.'
    },
    {
      q: 'What is a scope in OAuth?',
      choices: [
        'The encryption strength of the token',
        'A named permission the app requests, shown on the consent screen',
        "The token's expiry time",
        "The app's IP address"
      ],
      answer: 1,
      explain: 'Scopes are the specific permissions you approve - the consent screen is literally that list.'
    },
    {
      q: 'How do OAuth and OpenID Connect (OIDC) differ?',
      choices: [
        'OAuth proves identity; OIDC grants access',
        'OAuth grants delegated access (authz); OIDC adds authentication (authn) via an ID token',
        'They are identical',
        'Neither involves tokens'
      ],
      answer: 1,
      explain: "'Sign in with Google' is OIDC (login); 'connect my calendar' is plain OAuth (scoped access)."
    }
  ],

  // -- Automating the Boring Stuff ------------------------------------------
  'automating-the-boring-stuff/1': [
    {
      q: "The main reason to automate a recurring task usually isn't speed - it's that...",
      choices: [
        'Scripts are more fun to write',
        'The script becomes the single honest, runnable record of how the task is actually done',
        'Computers never make mistakes',
        'It uses less electricity'
      ],
      answer: 1,
      explain: "A script is documentation that runs - it can't drift out of date because it's the thing that does the work."
    },
    {
      q: 'Which task is the BEST candidate to automate?',
      choices: [
        "A genuinely one-time task you'll never repeat",
        'A repeated, repeatable, consequential task more than one person may run',
        "A process you don't yet understand",
        'Something that needs fresh human judgment every time'
      ],
      answer: 1,
      explain: "Automate repeated, repeatable, consequential, shared tasks - not true one-offs or things you don't understand yet."
    }
  ],
  'automating-the-boring-stuff/2': [
    {
      q: 'What does set -euo pipefail do?',
      choices: [
        'Speeds up the script',
        'Makes bash strict: exit on error, error on unset variables, catch failures in pipes',
        'Enables color output',
        'Runs the script as root'
      ],
      answer: 1,
      explain: "It's the single best reliability line - bash stops on failures instead of blundering onward."
    },
    {
      q: 'Why should you always quote variables like "$SOURCE_DIR"?',
      choices: [
        'It runs faster',
        'An unquoted value with a space splits into multiple arguments and breaks the command',
        'Bash requires quotes around every variable',
        'Quotes encrypt the value'
      ],
      answer: 1,
      explain: 'Quoting keeps a path with spaces as one value instead of two arguments.'
    },
    {
      q: "A script's exit code of 0 means...",
      choices: ['Failure', 'Success', 'The script is still running', 'No output'],
      answer: 1,
      explain: '0 is success, non-zero is failure - that is how cron and other tools know what happened.'
    }
  ],
  'automating-the-boring-stuff/3': [
    {
      q: 'You should switch from bash to Python when...',
      choices: [
        "You're just running a few commands in order",
        'You need real data structures or are parsing JSON/CSV/XML',
        'The script is short',
        'You want it to run faster'
      ],
      answer: 1,
      explain: 'Bash glues commands; reach for Python for structured data, real logic, or cross-platform needs.'
    },
    {
      q: "'Idempotent' means...",
      choices: [
        'The script runs only once ever',
        'Running it twice has the same result as running it once',
        'It encrypts its output',
        'It requires no arguments'
      ],
      answer: 1,
      explain: 'Idempotent scripts are safe to re-run - no duplicates or damage on repeated runs, which matters for scheduled jobs.'
    },
    {
      q: 'A common gotcha with cron is that...',
      choices: [
        'It can only run once per day',
        'It runs with almost no environment, so use absolute paths and log the output',
        'It needs the GUI to be open',
        'It deletes the script after running'
      ],
      answer: 1,
      explain: "Cron doesn't load your shell profile, so a script that works in your terminal can silently do nothing under cron."
    }
  ],

  // -- BI Dashboards That Work ----------------------------------------------
  'bi-dashboards-that-work/1': [
    {
      q: 'According to the guide, BI is fundamentally about...',
      choices: [
        'Making impressive-looking charts',
        'Helping a specific person make a specific decision with data',
        'Collecting as many metrics as possible',
        'Choosing the right chart colors'
      ],
      answer: 1,
      explain: 'The unit of value is a decision made better because of data, not a chart.'
    },
    {
      q: 'The right order to design a dashboard is...',
      choices: [
        'Data, then metric, then question, then decision',
        'Decision, then question, then metric, then data (touch the data last)',
        'Chart, then metric, then decision',
        'Metric, then chart, then data'
      ],
      answer: 1,
      explain: 'Start from the decision someone makes and work backward; the data comes last.'
    },
    {
      q: 'The test for whether a tile belongs on a dashboard is:',
      choices: [
        'Does it look good in a meeting?',
        'If this number changed, would someone do something differently?',
        'Is the data easy to query?',
        'Does it use a fancy chart type?'
      ],
      answer: 1,
      explain: "If you can't finish 'if this changed, someone would ___' with a real action, the tile is decoration."
    }
  ],
  'bi-dashboards-that-work/2': [
    {
      q: "What makes a metric a 'vanity metric'?",
      choices: [
        "It's inaccurate",
        "It feels good but wouldn't change any decision - often a cumulative all-time total",
        'It uses the wrong color',
        "It's measured weekly"
      ],
      answer: 1,
      explain: "Vanity metrics like 'total signups ever' only go up and can't deliver bad news, so they drive no decision."
    },
    {
      q: 'Eight sessions load under a second; one hangs at 14s. Which summary best shows the typical experience?',
      choices: ['The average (mean)', 'The median', 'The sum', 'The total count'],
      answer: 1,
      explain: 'The mean gets dragged up by the outlier; the median reflects the typical user. A high percentile surfaces the bad tail.'
    },
    {
      q: 'Support tickets tripled but active users grew 6x. What rescues the misleading raw count?',
      choices: [
        'Using a bigger font',
        'Dividing by a denominator (e.g. tickets per user)',
        'Summing more months',
        'Switching to a pie chart'
      ],
      answer: 1,
      explain: 'A rate per user survives growth - tickets per user actually halved even though the raw count tripled.'
    }
  ],
  'bi-dashboards-that-work/3': [
    {
      q: 'Where should the single most important answer go on a dashboard?',
      choices: [
        'Bottom-right, small',
        'Top-left and biggest - size is hierarchy',
        'Hidden behind a filter',
        'Spread evenly with everything else'
      ],
      answer: 1,
      explain: 'The eye reads top-left first; the headline answer goes there, big, so it lands before conscious reading.'
    },
    {
      q: "Why must a bar chart's value axis start at zero?",
      choices: [
        'It looks tidier',
        'Bars encode length, so a non-zero start inflates small differences into big-looking ones',
        'Tools require it',
        'To save space'
      ],
      answer: 1,
      explain: 'A bar twice as tall should mean twice as much; cutting the axis makes a 2-point gap look like a landslide.'
    },
    {
      q: 'The most common reason a dashboard fails is...',
      choices: [
        'Wrong chart colors',
        'It has no owner and no decision behind it, so it rots unused',
        'Too few metrics',
        'It loads slowly'
      ],
      answer: 1,
      explain: "Build only what serves a real decision for a real, named owner who'll notice when it breaks."
    }
  ],

  // -- Big-O Without the Math Panic -----------------------------------------
  'big-o-without-the-math-panic/1': [
    {
      q: 'Big-O measures...',
      choices: [
        'How many seconds your code takes',
        'How the amount of work grows as the input gets bigger',
        'Which computer is fastest',
        'How much memory a program uses'
      ],
      answer: 1,
      explain: "Big-O describes the shape of growth, not a time in seconds - it's machine-independent."
    },
    {
      q: 'The one question Big-O answers is:',
      choices: [
        'How fast is my CPU?',
        'If I double the input, what happens to the work?',
        'How many lines of code is this?',
        'Is the code readable?'
      ],
      answer: 1,
      explain: 'Double the input - does the work barely change, double, or square? That is the whole idea.'
    },
    {
      q: 'A faster computer...',
      choices: [
        'Changes an O(n^2) algorithm into O(n)',
        "Moves you along the same curve but doesn't give you a better one",
        'Removes the need for Big-O',
        'Makes all algorithms O(1)'
      ],
      answer: 1,
      explain: 'Hardware changes how long each step takes, not how the work grows.'
    }
  ],
  'big-o-without-the-math-panic/2': [
    {
      q: 'A loop inside a loop, both over the data, is usually...',
      choices: ['O(1)', 'O(n)', 'O(n^2)', 'O(log n)'],
      answer: 2,
      explain: 'Doing work proportional to all items for each item squares the work - double the input, quadruple the work.'
    },
    {
      q: 'Binary search on a sorted list is...',
      choices: ['O(n^2)', 'O(n)', 'O(log n) - it halves the problem each step', 'O(1)'],
      answer: 2,
      explain: 'Each step throws away half, so even a million items take about 20 steps.'
    },
    {
      q: 'The hidden O(n^2) trap to watch for is...',
      choices: [
        'A single loop',
        'A search, an in check, or .index() inside a loop',
        'Calling a built-in sort',
        'Reading one item by index'
      ],
      answer: 1,
      explain: 'A search inside a loop looks like one loop but scans everything each time - accidental quadratic.'
    }
  ],
  'big-o-without-the-math-panic/3': [
    {
      q: 'Code was instant at 100 items and now hangs at 10 million. The usual cause:',
      choices: [
        'The CPU got slower',
        'An accidental O(n^2) - a scan inside a loop that was invisible at small n',
        'A syntax error',
        'Too little memory'
      ],
      answer: 1,
      explain: "The code didn't change; the data grew big enough to expose the quadratic scan."
    },
    {
      q: 'How do you typically turn an O(n^2) lookup-in-a-loop into O(n)?',
      choices: [
        'Add more loops',
        'Build a dictionary/hash map for O(1) lookups instead of scanning a list',
        'Sort the list every iteration',
        'Use a faster language'
      ],
      answer: 1,
      explain: 'Your choice of data structure is a choice of Big-O - a dict lookup is O(1) vs an O(n) list scan.'
    },
    {
      q: 'Because Big-O ignores constants, it tells you...',
      choices: [
        'Exactly which option is fastest on your data',
        "Who wins eventually as n gets huge - not necessarily who's faster on small or real inputs",
        'The runtime in seconds',
        'Nothing useful'
      ],
      answer: 1,
      explain: 'Use Big-O to dodge the cliffs; measure with a profiler to pick between reasonable options on real data.'
    }
  ],

  // -- Bisecting a Bug ------------------------------------------------------
  'bisecting-a-bug/1': [
    {
      q: 'The core idea of bisecting is...',
      choices: [
        'Check every suspect one by one in order',
        "Test the midpoint and throw away the half the bug can't be in",
        'Rewrite the code from scratch',
        'Ask a teammate'
      ],
      answer: 1,
      explain: 'Halving the range collapses a thousand suspects to one in about ten tests instead of a thousand.'
    },
    {
      q: 'Bisecting needs which three things?',
      choices: [
        'Three developers',
        'A known-good point, a known-bad point, and a reliable yes/no test',
        'A debugger, a profiler, and a log',
        'Git, Python, and bash'
      ],
      answer: 1,
      explain: "You need a point where it worked, a point where it's broken, and a trustworthy 'is the bug here?' test."
    },
    {
      q: 'If the haystack doubles in size, bisecting costs...',
      choices: ['Double the tests', 'About one more test', 'The same number of tests', 'Half the tests'],
      answer: 1,
      explain: 'Halving means a million commits is ~20 tests - doubling the size adds just one more test.'
    }
  ],
  'bisecting-a-bug/2': [
    {
      q: 'What does git bisect hunt for?',
      choices: [
        'The newest commit',
        'The first bad commit - the earliest commit where the bug is present',
        'The largest commit',
        'The commit with the most files'
      ],
      answer: 1,
      explain: 'Everything before the first bad commit is good; it and everything after are bad - that change introduced the bug.'
    },
    {
      q: 'After a git bisect session you must run...',
      choices: [
        'git commit',
        'git bisect reset, to return from the detached commit to your branch',
        'git push',
        'git merge'
      ],
      answer: 1,
      explain: "Without reset you're left on a detached historical commit, a confusing place to start fixing."
    },
    {
      q: 'git bisect run <command> decides good/bad using...',
      choices: [
        'The commit message',
        "The command's exit code - 0 is good, non-zero is bad",
        'The file count',
        'Your manual input each round'
      ],
      answer: 1,
      explain: 'Hand it a test command and Git drives the whole search hands-free using the exit code.'
    }
  ],
  'bisecting-a-bug/3': [
    {
      q: 'The bisecting method applies to...',
      choices: [
        'Only git commit history',
        "Any 'worked before, broken now' problem - config lines, input rows, dependency sets, code blocks",
        'Only JavaScript projects',
        'Only production outages'
      ],
      answer: 1,
      explain: 'The move is always test the middle, keep the broken half, repeat - only the haystack changes.'
    },
    {
      q: 'What ruins a bisect?',
      choices: [
        'Too many commits',
        'A flaky (non-deterministic) test, because one wrong answer routes the search to a plausible-but-wrong culprit',
        'A slow computer',
        'Using git bisect run'
      ],
      answer: 1,
      explain: 'Every halving bets the rest of the search on one answer, so make the bug reproduce reliably first.'
    }
  ],

  // -- Build & Release Basics -----------------------------------------------
  'build-and-release-basics/1': [
    {
      q: "What does 'building' produce?",
      choices: [
        'More source code',
        'An artifact - a packaged, runnable thing (binary, bundle, or container image)',
        'A Git repository',
        'A database'
      ],
      answer: 1,
      explain: "Source goes in, a runnable artifact comes out; the code you write isn't the thing that runs."
    },
    {
      q: "A build is 'reproducible' when...",
      choices: [
        'It runs quickly',
        'The same recipe and source give the same artifact anywhere, because every ingredient is declared not assumed',
        'It only works on your laptop',
        'It produces a different output each time'
      ],
      answer: 1,
      explain: "Hidden ingredients (a tool only you installed) cause 'works on my machine' - declare every dependency."
    }
  ],
  'build-and-release-basics/2': [
    {
      q: 'In semantic versioning (e.g. 2.5.1), bumping the MAJOR number signals...',
      choices: [
        'A safe bug fix',
        'A breaking change users may need to adapt to',
        'A new backward-compatible feature',
        'Nothing in particular'
      ],
      answer: 1,
      explain: 'MAJOR = breaking, MINOR = new compatible features, PATCH = compatible bug fixes - it tells you how scared to be.'
    },
    {
      q: 'An immutable artifact means...',
      choices: [
        'You edit it in place when fixing bugs',
        'Once built and labeled it never changes - a fix is a new version, never an edit to the old one',
        "It can't be deployed",
        'It has no version number'
      ],
      answer: 1,
      explain: 'Immutability is what makes rollback real: redeploy the untouched old version and know it is exactly what worked.'
    },
    {
      q: 'Why build once and deploy the same artifact everywhere?',
      choices: [
        'To save disk space',
        'Rebuilding per destination produces possibly-different artifacts, breaking the link between what you tested and shipped',
        'Because builds are slow',
        'To avoid using a registry'
      ],
      answer: 1,
      explain: 'If you rebuild for prod, you tested one artifact and shipped another.'
    }
  ],
  'build-and-release-basics/3': [
    {
      q: "What is 'promotion' in a release process?",
      choices: [
        'Rebuilding the app for each environment',
        'Moving the same frozen artifact forward through environments (dev to staging to prod)',
        'Giving a developer a raise',
        'Deleting old versions'
      ],
      answer: 1,
      explain: 'You promote the identical artifact that passed; you never rebuild per environment.'
    },
    {
      q: 'The same artifact works in staging but breaks in prod. The most likely culprit:',
      choices: [
        "The artifact's code",
        'A difference in the environment or its config',
        'The version number',
        'The programming language'
      ],
      answer: 1,
      explain: 'The code is provably identical, so look at what differs - config, a missing key, an unreachable database.'
    },
    {
      q: 'How does one identical artifact talk to different databases per environment?',
      choices: [
        'The database address is baked into the artifact',
        'Config is supplied from outside; each environment feeds the same artifact different settings',
        "It's rebuilt for each database",
        'It guesses'
      ],
      answer: 1,
      explain: 'Per-place differences live in external config, which is exactly why you can ship one build everywhere.'
    }
  ],

  // -- Caching Explained ----------------------------------------------------
  'caching-explained/1': [
    {
      q: 'A cache is...',
      choices: [
        'A special kind of database you write to',
        'A copy of an expensive-to-produce answer kept somewhere fast, so you skip redoing the work',
        'A faster CPU',
        'A network protocol'
      ],
      answer: 1,
      explain: "It's a notepad of answers you already worked out - the truth lives elsewhere, the cache holds a copy."
    },
    {
      q: "A cache 'miss' means...",
      choices: [
        'The copy was there and returned fast',
        "The copy isn't there, so you do the real work and usually store a copy for next time",
        'The cache is broken',
        'The data is corrupted'
      ],
      answer: 1,
      explain: 'A hit returns the stored copy; a miss does the real work and saves the result.'
    },
    {
      q: 'Caching only pays off when...',
      choices: [
        'Every request is unique',
        'The same answer is requested repeatedly',
        'The data changes constantly',
        'The database is already fast'
      ],
      answer: 1,
      explain: 'No repetition, no benefit - caching wins on repeated requests for the same answer.'
    }
  ],
  'caching-explained/2': [
    {
      q: 'In the line of caches a request passes through, a hit closer to the user is...',
      choices: [
        'Slower and more expensive',
        'Faster and cheaper, and the layers behind it never hear about the request',
        'Always stale',
        'Identical to a miss'
      ],
      answer: 1,
      explain: 'Closer to the user = faster + cheaper; a hit anywhere turns the request around there.'
    },
    {
      q: "Why can't you remotely clear a file cached in someone's browser, and what's the workaround?",
      choices: [
        'You can clear it anytime; no workaround needed',
        "The copy lives on the user's device - put a content hash in filenames so a new build is a new name",
        'Browsers never cache files',
        'Use a bigger server'
      ],
      answer: 1,
      explain: 'A new filename like app.9f2a1c.js looks like new content, so the browser fetches it fresh.'
    },
    {
      q: 'A shared cache like Redis is preferred over per-process in-memory caching when...',
      choices: [
        'You want the absolute fastest single-server reads',
        'You want every app server to see the same cached answers instead of disagreeing',
        'You have only one server',
        'You never restart the app'
      ],
      answer: 1,
      explain: 'Per-process caches each hold their own copy and can disagree; Redis gives one shared copy across servers.'
    }
  ],
  'caching-explained/3': [
    {
      q: "'Staleness' is when...",
      choices: [
        'The cache crashes',
        'The cache serves a copy that is no longer true because the underlying data changed',
        'The cache is empty',
        'The network is slow'
      ],
      answer: 1,
      explain: 'The cache faithfully serves an old answer because nothing told it the truth changed - no crash, just a wrong value.'
    },
    {
      q: 'A TTL (time to live) on a cached item...',
      choices: [
        'Makes the cache infinitely large',
        'Caps how stale a copy can get by expiring it on a timer',
        'Encrypts the copy',
        'Prevents all cache misses'
      ],
      answer: 1,
      explain: 'Choosing a TTL is choosing how much staleness this data tolerates; long TTLs can hide a fix that already worked.'
    },
    {
      q: 'You should generally NOT cache data that...',
      choices: [
        'Is read repeatedly and tolerates being slightly old',
        'Must always be exact (like a bank balance) or is barely reused',
        'Is expensive to compute',
        'Is shared by many users'
      ],
      answer: 1,
      explain: 'Caching is a trade - skip it when correctness is critical or there is no repetition to benefit from.'
    }
  ],

  // -- Cloud Platforms Explained --------------------------------------------
  'cloud-platforms-explained/1': [
    {
      q: "What does 'the cloud' fundamentally sell?",
      choices: [
        'Magical software that never fails',
        'Rented computing on demand - machines you pay for by the hour instead of buying up front',
        'Free servers',
        'A faster internet connection'
      ],
      answer: 1,
      explain: 'It deletes the up-front cost and guesswork of owning physical servers; you rent capacity and a meter runs.'
    },
    {
      q: 'AWS, GCP, and Azure are best understood as...',
      choices: [
        'Three completely different worlds you must learn separately',
        'Three brands selling the same building blocks (compute, storage, network, managed services) with different names',
        'Identical in every detail',
        'Only useful for big companies'
      ],
      answer: 1,
      explain: "Learn the concepts; treat each vendor's service names as a translation layer."
    },
    {
      q: "The danger of metered 'pay for what you use' pricing is...",
      choices: [
        "It's too expensive for everyone",
        "The meter doesn't stop on its own - you pay for what you forgot you left running",
        'It requires a yearly contract',
        'It only bills for compute'
      ],
      answer: 1,
      explain: 'Anything you turn on bills you until you turn it off; a forgotten test server just keeps charging.'
    }
  ],
  'cloud-platforms-explained/2': [
    {
      q: 'Object storage (S3 / Cloud Storage / Blob) is...',
      choices: [
        'A relational database you can query',
        'A bottomless bucket for whole files, retrieved by key - not a database or an editable disk',
        'A virtual machine',
        'A private network'
      ],
      answer: 1,
      explain: "It's great for whole files read/written as a unit, wrong for structured data you query or rows you update."
    },
    {
      q: "A 'managed database' (RDS / Cloud SQL / Azure SQL) means...",
      choices: [
        'You install and patch the database yourself',
        'The provider runs, patches, and backs up a real database for you; you get a connection endpoint',
        "It's not a real database",
        'It has no cost premium'
      ],
      answer: 1,
      explain: 'You rent the outcome - a well-run database - instead of being its sysadmin, for a premium over raw VMs.'
    },
    {
      q: "In the cloud, an IAM 'role' is often given to...",
      choices: [
        'Only human users',
        'A piece of running code, so it gets permissions without hard-coded credentials',
        'The internet at large',
        'The billing system'
      ],
      answer: 1,
      explain: "A server can assume a role like 'may read this bucket and nothing else' - code gets an identity too."
    }
  ],
  'cloud-platforms-explained/3': [
    {
      q: 'Moving from IaaS to PaaS to Serverless means...',
      choices: [
        'More control and more ops work',
        'More managed: less ops work, less control, and tighter coupling to the provider',
        'Less reliability',
        'Higher up-front hardware cost'
      ],
      answer: 1,
      explain: 'It is one dial; pick a spot per workload, and most real systems mix all three.'
    },
    {
      q: 'A cloud budget with alerts...',
      choices: [
        'Automatically shuts off resources at the limit',
        'Warns you when spend crosses a threshold but does not stop the spending',
        'Makes the cloud free',
        'Caps the number of servers'
      ],
      answer: 1,
      explain: 'Treat it as a smoke detector, not a circuit breaker - stopping the spend is still your action.'
    },
    {
      q: 'The safest IAM habit is...',
      choices: [
        'Grant broad admin access to make errors go away',
        'Least privilege - grant exactly the specific permission an action needs',
        'Share one key everywhere',
        'Never use roles'
      ],
      answer: 1,
      explain: 'Over-permissioning turns a leaked credential into a catastrophe; grant only what the job needs.'
    }
  ],

  // -- CORS Explained -------------------------------------------------------
  'cors-explained/1': [
    {
      q: "An 'origin' is made of...",
      choices: [
        'Just the domain name',
        'Scheme + host + port - change any one and it is a different origin',
        'Only the port',
        'The full path including the page'
      ],
      answer: 1,
      explain: 'localhost and 127.0.0.1 differ, and different ports differ too - a classic dev gotcha.'
    },
    {
      q: 'The same-origin policy exists to...',
      choices: [
        'Make sites load faster',
        "Stop one origin's JavaScript from reading another origin's responses, protecting the logged-in user",
        'Block all cross-origin requests',
        'Encrypt traffic'
      ],
      answer: 1,
      explain: "It stops a sketchy tab from reading your bank's responses using your cookies; CORS is the opt-in exception."
    },
    {
      q: 'Does CORS protect your API from curl or scripts?',
      choices: [
        'Yes, it blocks all non-browser access',
        'No - CORS is enforced only by browsers; curl and scripts ignore it, so guard your API with real auth',
        'Yes, but only over HTTPS',
        'Only if you use a wildcard'
      ],
      answer: 1,
      explain: 'The browser enforces, the server permits - CORS decides which web pages may read responses, not who can call the API.'
    }
  ],
  'cors-explained/2': [
    {
      q: "A 'blocked by CORS' error means the problem is...",
      choices: [
        'A bug in your fetch() code',
        'A missing or wrong response header on the server',
        'A slow network',
        'A browser crash'
      ],
      answer: 1,
      explain: 'Your request was usually fine; the browser blocked reading the response because the server sent no permission header.'
    },
    {
      q: 'The two headers CORS comes down to are...',
      choices: [
        'Content-Type and Accept',
        'Origin (browser sends automatically) and Access-Control-Allow-Origin (server replies)',
        'Authorization and Cookie',
        'Host and User-Agent'
      ],
      answer: 1,
      explain: 'The browser announces its Origin; the server must echo a matching Access-Control-Allow-Origin.'
    },
    {
      q: 'A preflight OPTIONS request is sent...',
      choices: [
        'For every single request',
        'Before non-simple requests (PUT/DELETE/PATCH, JSON POST, custom headers) to ask permission first',
        'Only over HTTP, never HTTPS',
        'After the real request fails'
      ],
      answer: 1,
      explain: "The browser checks 'may I?' in advance for riskier requests, and only sends the real one if the server approves."
    }
  ],
  'cors-explained/3': [
    {
      q: 'Where is a CORS error fixed?',
      choices: [
        'In the frontend fetch() call',
        'On the server - by sending the right response headers',
        'In the browser settings',
        'In DNS'
      ],
      answer: 1,
      explain: "The browser is waiting for the server's permission slip; the fix is server-side headers."
    },
    {
      q: 'Why can you not combine Access-Control-Allow-Origin: * with credentials?',
      choices: [
        'Wildcards are deprecated',
        "Allowing any site to read responses with the user's cookies attached would reopen the hole the same-origin policy closes - so name a specific origin",
        'It is slower',
        'Credentials do not work in browsers'
      ],
      answer: 1,
      explain: 'With credentials you must name a single specific origin and set Access-Control-Allow-Credentials: true.'
    },
    {
      q: 'A dev proxy fixes CORS by...',
      choices: [
        'Disabling the same-origin policy in the browser',
        'Making the browser talk to only one origin (yours), while the cross-origin call happens server-to-server where CORS does not apply',
        'Adding a wildcard header',
        'Encrypting the request'
      ],
      answer: 1,
      explain: 'It is a dev convenience only - in production the right fix is still correct headers on the server you control.'
    }
  ],
  // -- CPU, RAM & Storage ---------------------------------------------------
  'cpu-ram-and-storage/1': [
    {
      q: 'What does the CPU repeatedly do (the fetch-execute cycle)?',
      choices: [
        'Stores your files permanently',
        'Fetches an instruction, decodes it, executes it - over and over, billions of times a second',
        'Draws the screen',
        'Connects to the network'
      ],
      answer: 1,
      explain: 'The CPU runs one simple loop relentlessly; the speed is the whole trick, not cleverness.'
    },
    {
      q: 'Comparing two CPUs, more cores helps most with...',
      choices: [
        'A single task that must run step-by-step in order',
        'Running many things at once, or work that splits into parallel pieces',
        'Raising the clock speed',
        'Making the cache bigger'
      ],
      answer: 1,
      explain: "Cores add parallel workers; a single in-order task can't be spread across them."
    },
    {
      q: 'Clock speed (GHz) is a fair comparison...',
      choices: [
        'Across any two CPUs ever made',
        'Only within the same chip generation - it measures heartbeat, not work done per tick',
        'Only for laptops',
        'Never, it is meaningless'
      ],
      answer: 1,
      explain: 'A newer 3.0 GHz chip can beat an older 3.5 GHz one because it does more per tick.'
    }
  ],
  'cpu-ram-and-storage/2': [
    {
      q: 'RAM is best described as...',
      choices: [
        'Permanent storage for your files',
        'Fast, temporary working space that is wiped when power is lost',
        'A faster CPU',
        'The network card'
      ],
      answer: 1,
      explain: 'RAM is volatile working memory - the desk, not the filing cabinet.'
    },
    {
      q: 'A computer that is "out of memory" usually...',
      choices: [
        'Crashes immediately',
        'Gets painfully slow, because it starts swapping idle data to slow storage',
        'Speeds up',
        'Deletes files to cope'
      ],
      answer: 1,
      explain: '"Slow when lots is open, fine when you close some" is the signature of not enough RAM.'
    },
    {
      q: 'In "16 GB RAM, 512 GB SSD", more RAM gives you...',
      choices: [
        'Room for more photos and files',
        'More space to keep apps running smoothly at once',
        'A faster internet connection',
        'A bigger screen'
      ],
      answer: 1,
      explain: 'RAM is desk size (how much runs at once); storage is the filing cabinet (how much you keep).'
    }
  ],
  'cpu-ram-and-storage/3': [
    {
      q: 'For storage, capacity (GB/TB) tells you...',
      choices: [
        'How fast it delivers data',
        'How much it can hold - not how fast it is',
        'The CPU speed',
        'How much RAM you have'
      ],
      answer: 1,
      explain: "A bigger drive holds more; it doesn't necessarily hand data over faster."
    },
    {
      q: 'The memory hierarchy (cache -> RAM -> storage) exists because...',
      choices: [
        'Engineers just like layers',
        'No single memory can be fast, huge, and permanent at once - so each layer trades speed for size',
        'Storage is faster than RAM',
        'Cache is the biggest of the three'
      ],
      answer: 1,
      explain: 'Closer to the CPU = faster but smaller; further away = bigger but slower.'
    }
  ],

  // -- Data Quality & Observability -----------------------------------------
  'data-quality-and-observability/1': [
    {
      q: 'A green checkmark in your orchestrator proves...',
      choices: [
        'The data is correct',
        'Only that the job ran - not that the output is true',
        'Nothing actually ran',
        'The dashboard numbers are right'
      ],
      answer: 1,
      explain: '"The machine ran" and "the output is true" are two completely different questions.'
    },
    {
      q: 'For data pipelines, why is a silent bug worse than a loud crash?',
      choices: [
        'Crashes are rare',
        'A crash contains the damage and pages someone; a silent failure ships wrong numbers everywhere unnoticed',
        'Silent bugs fix themselves',
        'They are equally harmful'
      ],
      answer: 1,
      explain: 'The goal of data quality is to convert silent failures into loud ones on purpose.'
    }
  ],
  'data-quality-and-observability/2': [
    {
      q: 'The four data-quality dimensions worth testing are...',
      choices: [
        'Color, font, size, layout',
        'Freshness, volume, schema, and validity',
        'CPU, RAM, disk, network',
        'Speed, cost, uptime, latency'
      ],
      answer: 1,
      explain: 'Together these few checks catch the overwhelming majority of silent breakage.'
    },
    {
      q: 'You should measure freshness from...',
      choices: [
        'Whether the job ran today',
        'A timestamp inside the data (created_at), since a job can run and still load nothing',
        'The server clock only',
        'The number of rows'
      ],
      answer: 1,
      explain: 'A job can run on schedule and load no new data; trust the data’s own clock.'
    },
    {
      q: 'Where should quality checks run?',
      choices: [
        'After the data reaches dashboards',
        'Early, as a gate that fails the run before bad data reaches downstream tables',
        'Only in a log file',
        'Nowhere - trust the source'
      ],
      answer: 1,
      explain: "Fail fast: a failed check halts the pipeline and goes red, it doesn't just log a warning."
    }
  ],
  'data-quality-and-observability/3': [
    {
      q: 'Lineage is...',
      choices: [
        'The age of your data',
        'The dependency map of which tables and dashboards are built from which, so you know a break’s blast radius',
        'A type of backup',
        'A query language'
      ],
      answer: 1,
      explain: 'It turns "something broke somewhere" into "these exact downstream things are at risk."'
    },
    {
      q: 'Alert fatigue is...',
      choices: [
        'Alerts being too quiet',
        'So many low-value alerts that people stop reading them, so the one that matters slips through',
        'A hardware failure',
        'Having too few checks'
      ],
      answer: 1,
      explain: 'Test what matters, route by severity, and kill flaky checks - every alert should be worth reading.'
    }
  ],

  // -- Data Structures Explained --------------------------------------------
  'data-structures-explained/1': [
    {
      q: 'Getting an item by index (list[3]) is...',
      choices: [
        'Slow - it walks the list to get there',
        'Fast - it jumps straight to the slot, regardless of list size',
        'Impossible',
        'Only fast for small lists'
      ],
      answer: 1,
      explain: 'Slots are a numbered row, so the computer computes where slot 3 lives and lands on it directly.'
    },
    {
      q: 'Which list operation gets slower as the list grows?',
      choices: [
        'Appending to the end',
        'Inserting or removing in the middle/front (everything after has to shuffle over)',
        'Reading by index',
        'Checking the length'
      ],
      answer: 1,
      explain: 'Squeezing into the middle shoves every later item one slot over to make room.'
    },
    {
      q: 'Searching a list for a value (e.g. "x" in list)...',
      choices: [
        'Is instant',
        'Walks the items one by one - slow for big lists',
        'Uses hashing to jump straight there',
        'Sorts the list first'
      ],
      answer: 1,
      explain: 'A list has no shortcut for value lookup; that pain is what a map or set solves.'
    }
  ],
  'data-structures-explained/2': [
    {
      q: 'A map (dict) lets you...',
      choices: [
        'Keep items in strict order',
        'Fetch a value by its key fast, without scanning',
        'Only store numbers',
        'Sort a list automatically'
      ],
      answer: 1,
      explain: 'A map is key -> value with fast lookup by key.'
    },
    {
      q: 'Why is map lookup fast?',
      choices: [
        'It sorts everything first',
        'Hashing computes the storage spot from the key, so it jumps straight there instead of searching',
        'It uses more RAM',
        'It walks every entry quickly'
      ],
      answer: 1,
      explain: 'The key is run through a hash function that points right at the value’s spot.'
    },
    {
      q: 'A set is for...',
      choices: [
        'Ordered sequences',
        'Unique items and fast "is this present?" checks',
        'Key-value pairs',
        'Storing files'
      ],
      answer: 1,
      explain: 'A set keeps each item at most once and answers membership instantly (same hashing trick).'
    }
  ],
  'data-structures-explained/3': [
    {
      q: 'The classic beginner slowdown is...',
      choices: [
        'Using a map when you needed a list',
        'Repeatedly searching a list by value when a set/map would be "constant" instead of "grows with size"',
        'Using too few variables',
        'Naming things badly'
      ],
      answer: 1,
      explain: '`x in big_list` over and over walks the list each time; a set makes it instant.'
    },
    {
      q: 'To choose a container, ask...',
      choices: [
        'Which one is newest',
        'What does my code keep asking of the data - order, lookup-by-key, or membership?',
        'Which has the most features',
        'Which uses the least memory'
      ],
      answer: 1,
      explain: 'Order/position -> list; lookup by key -> map; uniqueness/membership -> set.'
    }
  ],

  // -- Database Migrations ---------------------------------------------------
  'database-migrations/1': [
    {
      q: 'A migration is best described as...',
      choices: [
        'A one-off ALTER you type into production',
        'A versioned, ordered, source-controlled change to your schema - git for your database structure',
        'A backup of the database',
        'A type of query'
      ],
      answer: 1,
      explain: 'The ordered set of migration files is the single source of truth for the schema.'
    },
    {
      q: "A migration's down (rollback) step...",
      choices: [
        'Restores both structure and any lost data',
        'Reverses structure, but cannot bring back data that was destroyed',
        'Is never needed',
        'Runs automatically on every deploy'
      ],
      answer: 1,
      explain: 'A down that re-adds a dropped column gives you an empty column - the old values are gone.'
    }
  ],
  'database-migrations/2': [
    {
      q: 'The core danger when changing schema on live data is...',
      choices: [
        'The disk fills up',
        'The deploy gap - old app code still running against a schema that already changed',
        'Migrations are slow',
        'There is no danger'
      ],
      answer: 1,
      explain: "Don't make the app and the schema switch over in the same instant."
    },
    {
      q: 'The safe pattern for a live rename or type change is...',
      choices: [
        'One big ALTER at peak traffic',
        'Expand/contract: add new column, dual-write, backfill in batches, switch reads, drop old last',
        'Edit the column in place',
        'Drop the old column immediately'
      ],
      answer: 1,
      explain: 'Run old and new side by side so there is never a moment the app can only use one.'
    }
  ],
  'database-migrations/3': [
    {
      q: 'Adding a NOT NULL column without a default to a populated table...',
      choices: [
        'Always works fine',
        'Fails - existing rows have no value; add it nullable, backfill, then add the constraint',
        'Deletes the table',
        'Is instant at any size'
      ],
      answer: 1,
      explain: 'Add nullable (safe), fill every row in batches, then set NOT NULL.'
    },
    {
      q: 'Instead of one giant UPDATE to backfill millions of rows, you should...',
      choices: [
        'Just run it at midnight',
        'Batch it into bounded ranges so locks stay brief and each transaction is small',
        'Use a bigger server',
        'Skip the backfill'
      ],
      answer: 1,
      explain: 'A single huge UPDATE holds long locks and can make replicas fall behind.'
    }
  ],

  // -- Deploying to a VPS ----------------------------------------------------
  'deploying-to-a-vps/1': [
    {
      q: 'A VPS is...',
      choices: [
        'A managed hosting panel that sets up your app for you',
        'A rented slice of a Linux server - a bare box with root access that you set up yourself',
        'A type of database',
        'A content delivery network'
      ],
      answer: 1,
      explain: 'Total control, total responsibility - nobody installs or secures it for you.'
    },
    {
      q: 'When enabling the UFW firewall, you must...',
      choices: [
        'Block port 22 first',
        'Allow SSH (OpenSSH) before enabling, or you lock yourself out',
        'Open every port',
        'Disable SSH entirely'
      ],
      answer: 1,
      explain: 'Enabling a firewall that blocks port 22 cuts off your own connection.'
    }
  ],
  'deploying-to-a-vps/2': [
    {
      q: 'Why does "just run it in your SSH session" fail to keep an app alive?',
      choices: [
        "Apps can't run on servers",
        'The program is tied to your session and dies when you log out',
        'SSH is too slow',
        'Linux forbids it'
      ],
      answer: 1,
      explain: 'Hand it to systemd so it runs unattended, restarts on crash, and survives reboots.'
    },
    {
      q: 'In a systemd unit, Restart=always does what?',
      choices: [
        'Reboots the whole server',
        'Restarts the app automatically if it exits for any reason',
        'Runs the app as root',
        'Disables logging'
      ],
      answer: 1,
      explain: 'It turns "it crashed and stayed down" into "it crashed and recovered."'
    }
  ],
  'deploying-to-a-vps/3': [
    {
      q: 'Putting nginx in front of your app as a reverse proxy means...',
      choices: [
        'Your app faces the internet directly',
        'Only nginx is public (80/443); your app stays private on 127.0.0.1 behind it',
        'HTTPS becomes impossible',
        'You must open the app port in the firewall'
      ],
      answer: 1,
      explain: 'That separation is the safety - never expose the raw app port to the internet.'
    },
    {
      q: "Let's Encrypt certificates last 90 days and...",
      choices: [
        'Must be renewed by hand each month',
        'Renew automatically via a Certbot timer - verify it with "certbot renew --dry-run"',
        'Never expire',
        'Cost money to renew'
      ],
      answer: 1,
      explain: 'The dry-run confirms automatic renewal will work before the real expiry arrives.'
    }
  ],

  // -- Designing an Enterprise Network --------------------------------------
  'designing-an-enterprise-network/1': [
    {
      q: 'A flat network stops scaling because...',
      choices: [
        'It is too fast',
        'Broadcast contention grows with every device, and flat means every host is reachable (and attackable) by every other',
        'Cables get expensive',
        'DNS stops working'
      ],
      answer: 1,
      explain: 'Segmentation carves it into zones so a failure or breach has a small blast radius.'
    },
    {
      q: 'In CIDR, a bigger number after the slash (e.g. /26 vs /24) means...',
      choices: [
        'A bigger subnet',
        'A smaller subnet - more bits name the network, leaving fewer for hosts',
        'More broadcast traffic',
        'Faster speeds'
      ],
      answer: 1,
      explain: 'A /24 gives 254 usable hosts; a /26 gives 62.'
    },
    {
      q: 'A VLAN lets you...',
      choices: [
        'Run separate cabling for each group',
        'Make one physical switch act as several separate LANs, segmenting without rewiring',
        'Speed up the CPU',
        'Replace the router'
      ],
      answer: 1,
      explain: 'Map one VLAN to one subnet per zone; traffic between zones must go through a router.'
    }
  ],
  'designing-an-enterprise-network/2': [
    {
      q: "Beyond performance, a load balancer's other big value is...",
      choices: [
        'Encryption',
        'Availability - health checks pull dead backends from rotation so users never hit them',
        'Cheaper hardware',
        'Faster DNS'
      ],
      answer: 1,
      explain: 'One server can be down for maintenance and nobody files a ticket.'
    },
    {
      q: 'A single point of failure (SPOF) is...',
      choices: [
        'A very fast server',
        'Any one component whose failure takes down the whole system',
        'A backup device',
        'A type of router'
      ],
      answer: 1,
      explain: 'Redundancy gives each critical component a partner so losing one is survivable.'
    },
    {
      q: '"Untested failover is a guess" means...',
      choices: [
        'You never need backups',
        'A standby only helps if you periodically fail the primary on purpose and confirm it takes over',
        'Redundancy is pointless',
        'Failover is always automatic'
      ],
      answer: 1,
      explain: 'Untested failover has a way of failing exactly when you need it.'
    }
  ],
  'designing-an-enterprise-network/3': [
    {
      q: 'A stateful firewall...',
      choices: [
        'Judges each packet in isolation',
        'Tracks active connections, so replies to flows you started are allowed automatically while unsolicited inbound is dropped',
        'Allows all traffic by default',
        'Only works on one port'
      ],
      answer: 1,
      explain: 'You write rules about who may start a conversation; the return traffic takes care of itself.'
    },
    {
      q: 'A DMZ is...',
      choices: [
        'The fastest part of the network',
        'A separate, tightly-controlled zone for public-facing services, with tight rules into the internal network',
        'A backup datacenter',
        'A kind of VPN'
      ],
      answer: 1,
      explain: 'If an exposed server is compromised, the attacker stays trapped in the DMZ.'
    },
    {
      q: 'Zero-trust means...',
      choices: [
        'Trust everything inside the network',
        'Drop "inside = trusted" and verify every request regardless of where it comes from',
        'Remove all firewalls',
        'Block all traffic'
      ],
      answer: 1,
      explain: "It's segmentation taken to its conclusion - a breach meets another locked door at every hop."
    }
  ],

  // -- Designing APIs That Last ---------------------------------------------
  'designing-apis-that-last/1': [
    {
      q: "Your API's contract is...",
      choices: [
        'Only what you wrote in the docs',
        'Every observable behavior clients rely on - fields, types, status codes, meanings - documented or not',
        'A legal document',
        'The source code'
      ],
      answer: 1,
      explain: 'Clients integrate against what your API actually returned, not against your docs.'
    },
    {
      q: 'Which is the one reliably SAFE change?',
      choices: [
        'Removing a field',
        'Renaming a field',
        'Adding a new optional field or a new endpoint',
        "Changing a field's type"
      ],
      answer: 2,
      explain: "Old clients ignore what they don't read, so adding is the safe move."
    },
    {
      q: "Changing a field's meaning (same name and type, new semantics) is dangerous because...",
      choices: [
        'It always errors loudly',
        'It passes every type check and just produces wrong results silently',
        "Clients can't see it",
        'It is actually safe'
      ],
      answer: 1,
      explain: 'E.g. price switching from dollars to cents - no error, just wrong numbers everywhere.'
    }
  ],
  'designing-apis-that-last/2': [
    {
      q: 'Before cutting a new version, you should first...',
      choices: [
        'Delete the old version',
        'Exhaust additive changes - a new optional field, a new endpoint, an opt-in parameter',
        'Email all clients',
        'Rename everything'
      ],
      answer: 1,
      explain: 'A version bump is the most expensive tool; most "we need v2" instincts dissolve into an additive change.'
    },
    {
      q: 'A version bump is only humane if...',
      choices: [
        'The old version is removed immediately',
        'You run the old and new versions in parallel through a migration window',
        'Nobody is using the API',
        'It is done every week'
      ],
      answer: 1,
      explain: 'Versioning without overlap is just a breaking change in disguise.'
    },
    {
      q: '"Deprecated" means...',
      choices: [
        'Deleted right now',
        'Still works, but going away on a date you have communicated - announce it, signal it in headers, give a timeline',
        'Already broken',
        'Hidden from docs'
      ],
      answer: 1,
      explain: 'A deprecation clients only learn about by getting a 404 is just a scheduled outage.'
    }
  ],
  'designing-apis-that-last/3': [
    {
      q: 'Why paginate a list endpoint from day one?',
      choices: [
        'It looks more professional',
        'Adding pagination later is a breaking change - clients coded against "returns everything"',
        'It is faster to type',
        'Databases require it'
      ],
      answer: 1,
      explain: 'The breaking change is "unpaginated -> paginated"; you avoid it only by paginating from the start.'
    },
    {
      q: 'An idempotency key makes...',
      choices: [
        'Reads faster',
        'Retries of a write safe - the server returns the stored result instead of doing the work twice (no double charge)',
        'The API smaller',
        'Authentication unnecessary'
      ],
      answer: 1,
      explain: 'A lost response makes a client retry; the key lets the server recognize it already did the work.'
    },
    {
      q: 'Serializing your database rows straight to JSON is a trap because...',
      choices: [
        'It is slow',
        'Your internal schema becomes your public contract - every refactor leaks out as a breaking change',
        'JSON is insecure',
        'It uses more storage'
      ],
      answer: 1,
      explain: 'Put a mapping layer (a DTO/serializer) between storage and the API so you can refactor freely.'
    }
  ],

  // -- Designing for Failure ------------------------------------------------
  'designing-for-failure/1': [
    {
      q: "A network call has how many outcomes (vs a local call's two)?",
      choices: [
        'Two: it returns or it throws',
        'Three: succeed, fail, or hang - and the hang is where most outages start',
        'One: it always succeeds',
        'Four'
      ],
      answer: 1,
      explain: 'The third outcome, the hang, holds your resources hostage.'
    },
    {
      q: 'A single SLOW dependency can take down a whole service because...',
      choices: [
        'It crashes the CPU',
        'Each slow call ties up a worker until the finite worker pool fills - a cascading failure',
        'It deletes data',
        'It is a virus'
      ],
      answer: 1,
      explain: 'Slow is more dangerous than down: down often fails fast, slow ties everything up waiting.'
    }
  ],
  'designing-for-failure/2': [
    {
      q: 'The single most commonly-missing safeguard on remote calls is...',
      choices: [
        'Encryption',
        'A timeout - a deadline so a slow call cannot hang forever',
        'A bigger server',
        'More logging'
      ],
      answer: 1,
      explain: 'Many clients default to no timeout, so an innocent call quietly promises to wait forever.'
    },
    {
      q: 'Retries should use backoff and jitter, and run only on...',
      choices: [
        'Any failure at all',
        'Transient failures of idempotent operations (not, e.g., charging a card)',
        'Permanent 400/404 errors',
        'Every request, twice'
      ],
      answer: 1,
      explain: 'Backoff and jitter avoid a thundering herd; retrying a non-idempotent call can double-charge.'
    },
    {
      q: 'A circuit breaker, once tripped open...',
      choices: [
        'Retries faster',
        'Fails fast for a cooldown instead of hammering a dependency that is clearly down, then tests recovery',
        'Reboots the service',
        'Encrypts traffic'
      ],
      answer: 1,
      explain: 'It protects your own resources and gives the struggling dependency room to recover.'
    }
  ],
  'designing-for-failure/3': [
    {
      q: '"Fail soft" means...',
      choices: [
        'Crash quietly',
        'A failure should cost a feature, not the product - return a reduced-but-useful result',
        'Never show errors',
        'Retry forever'
      ],
      answer: 1,
      explain: 'When recommendations are down, the store should still take orders.'
    },
    {
      q: 'The bulkhead pattern...',
      choices: [
        'Adds more retries',
        'Gives each dependency its own isolated resource pool, so one saturated pool cannot starve the others',
        'Encrypts connections',
        'Speeds up the database'
      ],
      answer: 1,
      explain: 'It turns "the whole service is down" into "one feature is down."'
    },
    {
      q: 'A "retry storm" is when...',
      choices: [
        'There are too few retries',
        'Retries pile extra load onto a struggling dependency and amplify an outage',
        'The network is too fast',
        'Backups fail'
      ],
      answer: 1,
      explain: 'Pair retries with backoff, jitter, a cap, and a circuit breaker so they cannot become the load.'
    }
  ],

  // -- Designing for Scale --------------------------------------------------
  'designing-for-scale/1': [
    {
      q: 'Scaling out (horizontal) rather than scaling up (vertical) means...',
      choices: [
        'Buying one bigger box',
        'Running more identical machines and spreading the work across them',
        'Buying faster RAM',
        'Adding a GPU'
      ],
      answer: 1,
      explain: 'Scale up is one bigger box (capped, single point of failure); scale out is a pool you add to.'
    },
    {
      q: 'Scaling out requires servers to be...',
      choices: [
        'Stateful',
        'Stateless - any server can handle any request, with no per-user data kept in local memory',
        'Identical hardware',
        'On the same physical rack'
      ],
      answer: 1,
      explain: 'If a request can land on any server, none can hoard something only it knows.'
    },
    {
      q: "Storing a user's session in one server's local memory causes...",
      choices: [
        'Faster logins',
        "Intermittent 'forgot who you are' bugs once you add a second server",
        'Better security',
        'No problem at all'
      ],
      answer: 1,
      explain: 'Requests land on a server that never saw that user; the fix is to externalize state.'
    }
  ],
  'designing-for-scale/2': [
    {
      q: "A load balancer's two core jobs are...",
      choices: [
        'Encryption and compression',
        'Distribution (spreading requests) and health checks (pulling dead backends from rotation)',
        'Storage and backup',
        'DNS and caching'
      ],
      answer: 1,
      explain: 'Health checks are what make a pool resilient, not just bigger.'
    },
    {
      q: 'Sticky sessions are a trap because...',
      choices: [
        'They are slow to set up',
        'They hide local state instead of removing it - a dead backend loses its users and load gets lumpy',
        'They cost money',
        'They break DNS'
      ],
      answer: 1,
      explain: 'The clean fix is to externalize state so any server can serve any user.'
    }
  ],
  'designing-for-scale/3': [
    {
      q: 'When you make app servers stateless, the state...',
      choices: [
        'Disappears',
        'Moves to a few shared stores (session store, database, cache) that every server reaches',
        'Is lost on restart',
        'Stays inside each server'
      ],
      answer: 1,
      explain: 'Scaling is mostly pushing state to the edges so the middle can be cloned.'
    },
    {
      q: 'Externalizing sessions to a shared store like Redis...',
      choices: [
        'Removes all risk',
        'Concentrates the single point of failure into that store, which then needs its own redundancy',
        'Makes app servers stateful again',
        'Slows every request tenfold'
      ],
      answer: 1,
      explain: 'One well-run shared store is easier to make reliable than state smeared across many servers - but it still needs protecting.'
    }
  ],

  // -- Docker Compose for Real Projects -------------------------------------
  'docker-compose-for-real-projects/1': [
    {
      q: 'Running a multi-container stack by hand with docker run is fragile because...',
      choices: [
        'Docker is slow',
        'The setup (network, volumes, env, start order) lives in your shell history and head - impossible to reproduce or hand off',
        'Containers cannot network',
        'It costs money'
      ],
      answer: 1,
      explain: 'Compose lets you declare the whole stack in one file instead.'
    },
    {
      q: 'Docker Compose is "declarative", meaning...',
      choices: [
        'You type each run command yourself',
        'You describe the finished stack once in a file and one command makes reality match it',
        'It only runs one container',
        'It replaces Docker'
      ],
      answer: 1,
      explain: 'The file is readable, version-controlled documentation anyone can reproduce.'
    }
  ],
  'docker-compose-for-real-projects/2': [
    {
      q: 'In a compose ports entry like "8080:80", which side is your machine?',
      choices: [
        'The right side (80)',
        'The left side (8080) - the format is HOST:CONTAINER',
        'Neither',
        'Both'
      ],
      answer: 1,
      explain: 'Left of the colon is the host; right of the colon is inside the container.'
    },
    {
      q: 'Why give the db service a named volume?',
      choices: [
        'To make it faster',
        "A container's filesystem dies with it; a named volume keeps the data across container recreation",
        'To expose a port',
        'To set the password'
      ],
      answer: 1,
      explain: 'docker compose down keeps volumes; down -v destroys them.'
    },
    {
      q: 'depends_on: guarantees that a dependency is...',
      choices: [
        'Ready to accept connections',
        'Only *started* before the next service - not necessarily *ready*',
        'Healthy and tested',
        'Faster'
      ],
      answer: 1,
      explain: 'A database container can start before the database inside is ready; use a healthcheck for readiness.'
    }
  ],
  'docker-compose-for-real-projects/3': [
    {
      q: 'How do services find each other on a Compose network?',
      choices: [
        'By IP address',
        'By service name as a hostname (e.g. db:5432) - never localhost',
        'By --link flags',
        'Via DNS you configure manually'
      ],
      answer: 1,
      explain: 'Inside a container, localhost means that same container, not the database.'
    },
    {
      q: 'The real fix for "the API crashes because the DB is not ready yet" is...',
      choices: [
        'Add infinite retries',
        'A healthcheck plus depends_on with condition: service_healthy',
        'Remove depends_on',
        'Use a bigger server'
      ],
      answer: 1,
      explain: '"Started before" and "ready before" are different promises.'
    },
    {
      q: 'Your dev compose file should not be shipped to production because...',
      choices: [
        'It is too short',
        'Bind-mounts, plaintext secrets, and build: are dev conveniences that become liabilities in prod',
        'Compose cannot run in production',
        'It has no services'
      ],
      answer: 1,
      explain: 'Keep dev-only conveniences separate (e.g. in an override file); never deploy the dev file unchanged.'
    }
  ],
  // -- Docker Without the Magic ---------------------------------------------
  'docker-without-the-magic/1': [
    {
      q: 'The difference between a Docker image and a container is...',
      choices: [
        'They are the same thing',
        'An image is a read-only template (like a class); a container is a running instance of it (like an object)',
        'A container is the file; an image is the running thing',
        'An image runs; a container is frozen'
      ],
      answer: 1,
      explain: 'You build images and run containers; one image can spawn many containers.'
    },
    {
      q: 'How does a container differ from a virtual machine?',
      choices: [
        'A container boots its own full guest OS',
        "A container shares the host's kernel (light, fast); a VM runs its own full OS (heavy)",
        'They are identical',
        'A VM is the lighter option'
      ],
      answer: 1,
      explain: 'Sharing the host kernel is why containers are megabytes and start in moments.'
    }
  ],
  'docker-without-the-magic/2': [
    {
      q: 'Why order a Dockerfile from least- to most-frequently-changed?',
      choices: [
        'It looks neater',
        'The build cache reuses unchanged layers and rebuilds from the first changed step onward',
        'Docker requires it',
        'It makes the final image smaller'
      ],
      answer: 1,
      explain: 'Copy manifests and install deps before copying source, so a code edit does not re-run the install.'
    },
    {
      q: 'EXPOSE 3000 in a Dockerfile...',
      choices: [
        'Opens the port to your machine',
        'Is only documentation; you actually publish a port with -p HOST:CONTAINER on docker run',
        'Starts the app on port 3000',
        'Sets an environment variable'
      ],
      answer: 1,
      explain: 'Forgetting -p is the classic "works in the container but I can\'t reach it" mistake.'
    }
  ],
  'docker-without-the-magic/3': [
    {
      q: 'Where does data a container writes go by default, and what survives removal?',
      choices: [
        'A permanent disk; everything survives',
        "The container's throwaway writable layer; it is gone on docker rm unless you mount a volume",
        'RAM only',
        'Back into the image'
      ],
      answer: 1,
      explain: 'Treat containers as disposable; put anything that must persist in a volume.'
    },
    {
      q: 'Why pass secrets at run time (-e) instead of baking them into the image?',
      choices: [
        'It is faster',
        'Anything added at build time becomes a permanent layer anyone who pulls the image can extract - even if a later step deletes it',
        'Docker forbids build-time files',
        'It saves disk space'
      ],
      answer: 1,
      explain: 'Secrets are run-time input, never build-time content frozen into a distributable image.'
    }
  ],

  // -- Embeddings & Vector Search -------------------------------------------
  'embeddings-and-vector-search/1': [
    {
      q: 'An embedding is...',
      choices: [
        'A reversible code for the exact text',
        "A list of numbers (a vector) placing input as coordinates in a 'meaning space', where similar meanings sit near each other",
        'A compressed copy of a file',
        'A database ID'
      ],
      answer: 1,
      explain: 'Closeness equals similarity; the geometry is the meaning.'
    },
    {
      q: 'Real embeddings have how many dimensions, and can you eyeball closeness?',
      choices: [
        'Two; yes, just look at the map',
        'Hundreds or thousands; no, closeness must be computed with a formula',
        'Exactly one; yes',
        'Exactly 100; sometimes'
      ],
      answer: 1,
      explain: 'The 2D scatter is a teaching picture; real meaning space has far more directions.'
    }
  ],
  'embeddings-and-vector-search/2': [
    {
      q: 'Cosine similarity measures...',
      choices: [
        'The length of a vector',
        'Whether two vectors point the same direction: 1 = most similar, 0 = unrelated',
        'The number of shared words',
        'File size'
      ],
      answer: 1,
      explain: 'It ignores length and cares only about direction - exactly what you want for meaning.'
    },
    {
      q: 'Semantic search works by...',
      choices: [
        'Matching exact keywords',
        'Embedding the query with the same model, then returning the nearest stored vectors',
        'Sorting results alphabetically',
        'Counting word frequency'
      ],
      answer: 1,
      explain: 'It matches meaning (synonyms, paraphrase) for free, but is weak on exact identifiers like error codes.'
    }
  ],
  'embeddings-and-vector-search/3': [
    {
      q: "Why can't you compare vectors from two different embedding models?",
      choices: [
        'They are too big',
        "Each model has its own private 'map' - the coordinates live in incompatible spaces",
        'It is just too slow',
        'Models never change'
      ],
      answer: 1,
      explain: 'Embed documents and queries with the same model; upgrading a model means re-embedding everything.'
    },
    {
      q: 'An ANN (approximate nearest neighbor) index trades...',
      choices: [
        'Accuracy for nothing',
        'A tiny bit of accuracy for a huge speed gain, by skipping most of the collection',
        'Speed for perfect accuracy',
        'Memory for disk'
      ],
      answer: 1,
      explain: 'For ordinary search the occasional miss is invisible; exact scans get too slow at millions of vectors.'
    },
    {
      q: "'Similarity is not correctness' means...",
      choices: [
        'The search engine is broken',
        'The nearest match can still be wrong, stale, or off-topic - treat results as candidates to verify',
        'Vectors are random',
        'You should never use search'
      ],
      answer: 1,
      explain: 'This is exactly why RAG systems need careful retrieval and verification.'
    }
  ],

  // -- Environment Variables & Config ---------------------------------------
  'env-vars-and-config/1': [
    {
      q: 'Why keep config (DB URLs, API keys, log level) out of your code?',
      choices: [
        'It runs faster',
        'One codebase can run unchanged in every environment, secrets stay out of Git, and you can change settings without a redeploy',
        "Code can't hold strings",
        'It is legally required'
      ],
      answer: 1,
      explain: 'This is the Twelve-Factor recommendation: separate config from code.'
    },
    {
      q: "A quick test for whether something is 'config' is:",
      choices: [
        'Is it a number?',
        "Would it differ on someone else's machine or in production? If yes, it is config",
        'Is it secret?',
        'Is it a long value?'
      ],
      answer: 1,
      explain: 'If it is the same everywhere forever, it is probably just part of the code.'
    }
  ],
  'env-vars-and-config/2': [
    {
      q: 'An environment variable is...',
      choices: [
        'A Python invention',
        'A NAME=value pair the OS hands a running program, which the program reads by name',
        'A type of config file',
        'A database row'
      ],
      answer: 1,
      explain: 'Values are always strings - convert ports and numbers yourself.'
    },
    {
      q: 'The rule about a .env file is:',
      choices: [
        'Always commit it so teammates have it',
        'Never commit it (add it to .gitignore) - it holds secrets; commit a .env.example listing names instead',
        'Encrypt it and commit it',
        'Delete it after every run'
      ],
      answer: 1,
      explain: 'Committed secrets live in Git history forever; keep .env out and rotate anything leaked.'
    }
  ],
  'env-vars-and-config/3': [
    {
      q: 'The YAML gotcha that bites everyone is...',
      choices: [
        'Too many braces',
        'Indentation is meaning: tabs are forbidden (spaces only) and a misaligned level silently changes the structure',
        'It cannot nest data',
        'Comments are not allowed'
      ],
      answer: 1,
      explain: "If a YAML file won't load or settings come out wrong, suspect the indentation first."
    },
    {
      q: 'Config precedence (which source wins) is usually...',
      choices: [
        'The config file beats everything',
        'defaults < config file < environment variable - the most external source wins',
        'env var < file < defaults',
        'It is random'
      ],
      answer: 1,
      explain: "When a setting won't change, check the highest-priority source (the environment) first."
    }
  ],

  // -- ETL & ELT Pipelines --------------------------------------------------
  'etl-elt-pipelines/1': [
    {
      q: 'The three stages of a pipeline are...',
      choices: [
        'Read, write, delete',
        'Extract (read it), Transform (clean/reshape), Load (write it where used)',
        'Init, run, stop',
        'Plan, build, ship'
      ],
      answer: 1,
      explain: 'Think of an assembly line - one job per station, so a break tells you where to look.'
    },
    {
      q: 'Where does all of your business logic live?',
      choices: [
        'In Extract',
        'In Transform - cleaning, joining, and what "a valid order" or "revenue" means',
        'In Load',
        'In the scheduler'
      ],
      answer: 1,
      explain: 'When a number looks wrong, the cause is almost always a transform rule.'
    }
  ],
  'etl-elt-pipelines/2': [
    {
      q: 'The only difference between ETL and ELT is...',
      choices: [
        'The database brand',
        'Order: ETL transforms before loading; ELT loads raw first, then transforms in place',
        'ELT skips the transform',
        'ETL is the newer one'
      ],
      answer: 1,
      explain: 'Swapping the T and L changes where data is cleaned and what hardware does the work.'
    },
    {
      q: 'A key payoff of ELT (load raw first) is...',
      choices: [
        'It uses less storage',
        'Raw data is preserved and queryable - fix a transform bug and re-run without re-extracting',
        'Faster extraction',
        'No SQL is needed'
      ],
      answer: 1,
      explain: 'ETL still wins when compute is scarce or data must be masked before it can land at all.'
    }
  ],
  'etl-elt-pipelines/3': [
    {
      q: 'Why must pipeline steps be idempotent?',
      choices: [
        'For raw speed',
        'Retries, backfills, and re-runs all run a step again - if it is not idempotent, each becomes a corruption mechanism (e.g. doubled rows)',
        'To save memory',
        'Idempotency does not matter'
      ],
      answer: 1,
      explain: 'Overwrite the window or merge on a key so running twice equals running once.'
    },
    {
      q: 'A green checkmark on a pipeline run means...',
      choices: [
        'The numbers are correct',
        'Only that the code finished without error - it could have loaded nothing or wrong data',
        'The data is fresh',
        'Everything reconciled with the source'
      ],
      answer: 1,
      explain: '"It ran" is not "it ran correctly" - that is the job of data quality and observability.'
    }
  ],

  // -- Fine-Tuning vs Prompting ---------------------------------------------
  'fine-tuning-vs-prompting/1': [
    {
      q: 'The line that drives every model-steering decision is...',
      choices: [
        'Fine-tuning is always best',
        'RAG adds knowledge; fine-tuning teaches behavior',
        'Prompting is useless',
        'All three do the same thing'
      ],
      answer: 1,
      explain: 'Most expensive mistakes are fine-tuning to add knowledge, or prompting for consistency at scale.'
    },
    {
      q: "If the model doesn't know your specific or current facts, reach for...",
      choices: [
        'Fine-tuning on your documents',
        'RAG - inject the facts into the context at request time',
        'A longer prompt only',
        'Nothing can help'
      ],
      answer: 1,
      explain: 'Change a document and the next answer is correct - no retraining.'
    }
  ],
  'fine-tuning-vs-prompting/2': [
    {
      q: 'Where does the real cost of fine-tuning live?',
      choices: [
        'The training run, which is very expensive',
        'The dataset - curating hundreds/thousands of consistent, high-quality example pairs',
        'Hosting only',
        'Evaluation only'
      ],
      answer: 1,
      explain: 'Bad data makes a confidently-wrong model that is harder to fix than a base model.'
    },
    {
      q: 'LoRA (parameter-efficient fine-tuning)...',
      choices: [
        'Retrains every weight in the model',
        'Freezes the model and trains a small adapter - cheaper, faster, less lock-in, and softer forgetting',
        'Is a prompting technique',
        'Requires no data'
      ],
      answer: 1,
      explain: 'If you do fine-tune, parameter-efficient methods are usually where to start.'
    }
  ],
  'fine-tuning-vs-prompting/3': [
    {
      q: 'The honest order to steer a model is...',
      choices: [
        'Fine-tune, then RAG, then prompt',
        'Prompt -> RAG -> fine-tune; climb only as high as the problem forces you',
        'RAG first, always',
        'Whichever method is newest'
      ],
      answer: 1,
      explain: 'Each rung costs more and locks you in more; stop at the first one that solves your problem.'
    },
    {
      q: 'You should fine-tune when...',
      choices: [
        'You want the model to know your facts',
        'Prompting is genuinely exhausted and the problem is consistent behavior (voice/format) at scale',
        'Your facts change often',
        'Volume is very low'
      ],
      answer: 1,
      explain: 'Never fine-tune to teach facts (that is RAG); mind the staleness tax when better base models ship.'
    }
  ],

  // -- Git Disaster Recovery ------------------------------------------------
  'git-disaster-recovery/1': [
    {
      q: 'The reflog is...',
      choices: [
        'A list of remote branches',
        "Git's local diary of everywhere HEAD has been - it can reach commits git log can't",
        'A backup server',
        'A merge tool'
      ],
      answer: 1,
      explain: "A 'lost' commit usually just lost its label; find the hash in the reflog and point a label at it."
    },
    {
      q: 'After a bad `git reset --hard` threw away commits, you recover by...',
      choices: [
        'Re-typing the code from memory',
        'Finding the pre-reset hash in `git reflog`, then `git reset --hard <hash>`',
        'Cloning the repo again',
        'It is impossible to recover'
      ],
      answer: 1,
      explain: 'The commits were never deleted - the label just moved off them, and you move it back.'
    }
  ],
  'git-disaster-recovery/2': [
    {
      q: 'What does git rebase actually do?',
      choices: [
        'Deletes your commits',
        'Re-plays your commits onto a new base as brand-new commits (new hashes); the originals become unreachable',
        'Creates a merge commit tying two branches',
        'Pushes to the remote'
      ],
      answer: 1,
      explain: 'It gives a clean linear history; the reflog still keeps the originals if you need them.'
    },
    {
      q: 'The Golden Rule of rebase is...',
      choices: [
        'Always rebase main',
        'Never rebase commits that exist outside your own repository (that others may already have)',
        'Rebase before every commit',
        'Rebase only on Fridays'
      ],
      answer: 1,
      explain: 'Rewriting shared commits makes everyone\'s history disagree with yours.'
    }
  ],
  'git-disaster-recovery/3': [
    {
      q: 'To undo a commit on a SHARED branch like main, you use...',
      choices: [
        'git reset --hard',
        'git revert <hash> - a new commit that inverts the old one, so everyone\'s history still matches',
        'git commit --amend',
        'git push --force'
      ],
      answer: 1,
      explain: 'On shared history you undo by adding, not by rewriting.'
    },
    {
      q: 'When force-pushing your own rewritten branch, prefer...',
      choices: [
        'git push --force (unconditional)',
        'git push --force-with-lease - it refuses if the remote moved, protecting a teammate\'s commits',
        'never pushing again',
        'git pull --force'
      ],
      answer: 1,
      explain: 'None of these truly erase history - rotate any secret that was ever pushed.'
    }
  ],

  // -- Git Explained Like a Human -------------------------------------------
  'git-explained-like-a-human/1': [
    {
      q: 'A Git commit is...',
      choices: [
        'A diff of only your changes',
        'A complete snapshot of your whole project, with a name (hash) and a pointer to its parent',
        'A branch label',
        'A copy on the remote'
      ],
      answer: 1,
      explain: "Because old snapshots aren't destroyed, 'I lost my work' is almost always wrong."
    },
    {
      q: 'A branch is...',
      choices: [
        'A full copy of your project',
        'A movable sticky-note label pointing at one commit',
        'A folder of files',
        'The staging area'
      ],
      answer: 1,
      explain: 'That is why branching is instant - it is one line of bookkeeping, not a duplicate.'
    },
    {
      q: 'Your work passes through which three places?',
      choices: [
        'Local, staging server, production',
        'Working directory -> staging area (git add) -> repository (git commit)',
        'Branch, HEAD, remote',
        'RAM, disk, cloud'
      ],
      answer: 1,
      explain: '"Why is my change not in the commit?" is almost always confusion between these three.'
    }
  ],
  'git-explained-like-a-human/2': [
    {
      q: 'How does `git fetch` differ from `git pull`?',
      choices: [
        'fetch uploads your commits',
        "fetch downloads the remote's new commits but doesn't touch your files; pull = fetch + merge",
        'They are identical',
        'pull only downloads, never merges'
      ],
      answer: 1,
      explain: 'fetch lets you look before integrating; pull can drop you straight into a merge.'
    },
    {
      q: 'After you `git add` a file, plain `git diff` shows nothing for it because...',
      choices: [
        'The change was lost',
        'diff compares working-vs-staging, and add made them identical; use `git diff --staged` to see staged changes',
        'add deletes the file',
        'it is a bug in Git'
      ],
      answer: 1,
      explain: 'Plain diff = "not added yet"; diff --staged = "added, about to commit".'
    }
  ],
  'git-explained-like-a-human/3': [
    {
      q: 'A merge conflict means...',
      choices: [
        'You broke Git',
        "Two commits changed the same lines and Git won't guess - it paused for you to decide",
        'The repository is corrupt',
        'You must re-clone'
      ],
      answer: 1,
      explain: 'Edit the file, delete the <<<< ==== >>>> markers, add and commit - or git merge --abort.'
    },
    {
      q: 'To undo your last (unpushed) commit but KEEP the work...',
      choices: [
        'git reset --hard HEAD~1',
        'git reset --soft HEAD~1 - moves the label back and keeps the changes staged',
        'git revert HEAD',
        'git push --force'
      ],
      answer: 1,
      explain: '--hard would delete the changes; --soft and --mixed keep them.'
    }
  ],

  // -- Git from Zero --------------------------------------------------------
  'git-from-zero/1': [
    {
      q: 'Git versus GitHub:',
      choices: [
        'They are the same thing',
        'Git is the tool on your computer that takes snapshots; GitHub is an optional website that hosts copies',
        'GitHub is the tool, Git is the website',
        'Git needs the internet to work'
      ],
      answer: 1,
      explain: 'Git is like a word processor; GitHub is like Google Drive.'
    },
    {
      q: 'What must you set before your very first commit?',
      choices: [
        'A GitHub account',
        'Your identity: git config --global user.name and user.email',
        'An SSH key',
        'A branch name'
      ],
      answer: 1,
      explain: 'Skip it and the first commit fails with "Author identity unknown".'
    }
  ],
  'git-from-zero/2': [
    {
      q: '`git init` does what?',
      choices: [
        'Uploads your project to GitHub',
        'Turns a folder into a repo by creating the hidden .git folder where history is stored',
        'Deletes your files',
        'Creates a new branch'
      ],
      answer: 1,
      explain: 'Run it inside the folder you want to track.'
    },
    {
      q: 'The everyday Git loop is...',
      choices: [
        'clone, push, pull',
        'edit -> git add (stage) -> git commit (snapshot), with git log to look back',
        'init, branch, merge',
        'fetch, rebase, tag'
      ],
      answer: 1,
      explain: 'That add/commit rhythm is the heart of Git; everything else builds on it.'
    }
  ],
  'git-from-zero/3': [
    {
      q: 'When pushing to GitHub, you authenticate by...',
      choices: [
        'Typing your website password (removed in 2021)',
        'gh auth login, a personal access token, or SSH - not your account password on the command line',
        'Email confirmation each time',
        'No authentication is needed'
      ],
      answer: 1,
      explain: 'Old tutorials still say to type your password; it no longer works.'
    },
    {
      q: '`git clone <url>` does what?',
      choices: [
        'Creates an empty repo',
        'Downloads an existing repo and its full history, and sets up origin automatically',
        'Pushes your code up',
        'Deletes the remote'
      ],
      answer: 1,
      explain: 'A clone is ready to go - no git init or git remote add needed.'
    }
  ],
  'git-from-zero/4': [
    {
      q: '`Updates were rejected ... fetch first` on push means...',
      choices: [
        'Your repository is broken',
        "GitHub has commits you don't - run git pull, then push (it is a safety feature)",
        'You need a new account',
        'You should force-push immediately'
      ],
      answer: 1,
      explain: "Git refuses to overwrite history you haven't seen."
    },
    {
      q: '`fatal: not a git repository` means...',
      choices: [
        'Git is uninstalled',
        "You're not inside a repo folder - cd into one, or run git init here",
        'Your commit failed',
        'The remote is down'
      ],
      answer: 1,
      explain: 'Git commands only work inside a repository (a folder with a .git).'
    }
  ],

  // -- Git with Other People ------------------------------------------------
  'git-with-other-people/1': [
    {
      q: "Why don't you commit directly to main on a team?",
      choices: [
        'It is slower',
        'main is the always-working, shared, often-deployed branch - you work on a feature branch and merge it when reviewed',
        'Git forbids it',
        'main is read-only'
      ],
      answer: 1,
      explain: 'A feature branch keeps your messy middle invisible until you choose to share it.'
    },
    {
      q: '.gitignore only ignores files that...',
      choices: [
        'are large',
        "Git isn't already tracking - a file committed before being ignored stays tracked (use git rm --cached to stop)",
        'end in .log',
        'contain secrets'
      ],
      answer: 1,
      explain: 'And a secret that was ever pushed should be treated as compromised and rotated.'
    }
  ],
  'git-with-other-people/2': [
    {
      q: 'To keep your feature branch from drifting painfully far from main, you should...',
      choices: [
        'Just work faster',
        'Sync often - fold the latest main into your branch regularly so conflicts stay small',
        'Never pull',
        'Force-push daily'
      ],
      answer: 1,
      explain: 'Frequent small merges beat one giant end-of-week merge every time.'
    },
    {
      q: "A push rejected with 'fetch first' on a shared branch should be fixed by...",
      choices: [
        'git push --force',
        'git pull, then git push - never --force a shared branch',
        'deleting the branch',
        'ignoring the error'
      ],
      answer: 1,
      explain: '--force silences the error by overwriting (possibly erasing) teammates\' commits.'
    }
  ],
  'git-with-other-people/3': [
    {
      q: 'A pull request is...',
      choices: [
        'A git command',
        'A website (GitHub/GitLab) feature wrapping your branch in review and discussion, with a merge button - not a git command',
        'A way to download code',
        'A type of branch'
      ],
      answer: 1,
      explain: 'Git moves the commits; the website adds the conversation and the safety of review.'
    },
    {
      q: 'To address review feedback on a PR, you...',
      choices: [
        'Open a brand-new PR',
        'Commit more to the same branch and push - the PR updates itself',
        'Email the reviewer the changes',
        'Delete it and start over'
      ],
      answer: 1,
      explain: 'A PR is a living view of your branch; keep PRs small so review actually works.'
    }
  ],

  // -- Go from Zero ---------------------------------------------------------
  'go-from-zero/1': [
    {
      q: 'Because Go is a compiled language, installing it gives you...',
      choices: [
        'An interpreter that reads code line by line',
        'One `go` command that is the whole toolchain (compiler, package manager, test runner, formatter)',
        'A web-based IDE',
        'Just a library to import'
      ],
      answer: 1,
      explain: 'A Go program ships as one self-contained binary.'
    },
    {
      q: 'In Go, an unused import or unused variable is...',
      choices: [
        'A harmless warning',
        'A hard compile error, on purpose, to keep code clean',
        'Silently ignored',
        'A runtime panic'
      ],
      answer: 1,
      explain: 'It feels strict at first; the payoff is code that stays clean by force.'
    }
  ],
  'go-from-zero/2': [
    {
      q: 'Go being statically typed means...',
      choices: [
        'Types are checked while the program runs',
        'Every variable has a fixed type that is checked at compile time, before it runs',
        'A variable can hold anything',
        'Types are optional'
      ],
      answer: 1,
      explain: 'A whole class of "I thought it was a number" bugs is caught while you build.'
    },
    {
      q: "A 'zero value' in Go means...",
      choices: [
        'An error state',
        'A declared-but-unset variable gets a defined default (0, "", false, nil) - never uninitialized garbage',
        'The number zero only',
        'A null reference'
      ],
      answer: 1,
      explain: 'There is no uninitialized-variable surprise in Go.'
    },
    {
      q: 'The short declaration `:=` can be used...',
      choices: [
        'Anywhere in a file',
        'Only inside functions; at the top level you must use var',
        'Only at the top level',
        'Never'
      ],
      answer: 1,
      explain: 'Inside a func, := is your friend; outside, use var.'
    }
  ],
  'go-from-zero/3': [
    {
      q: 'Which do you reach for almost always in Go - an array or a slice?',
      choices: [
        'An array [N]T (fixed size)',
        'A slice []T (flexible length), grown with append',
        'Neither',
        'Both equally often'
      ],
      answer: 1,
      explain: "Always assign append's result back: s = append(s, x). Empty brackets [] = slice."
    },
    {
      q: 'Writing to a nil map...',
      choices: [
        'Works fine',
        'Panics at runtime - create it first with make (you can read a nil map, but not write to it)',
        'Returns an error value',
        'Is impossible to even write'
      ],
      answer: 1,
      explain: 'A common first-week panic: assignment to entry in nil map.'
    }
  ],
  'go-from-zero/4': [
    {
      q: 'How many loop keywords does Go have?',
      choices: [
        'Three (for, while, do)',
        'One: for - it covers counting, while (for cond), infinite (for {}), and for...range',
        'Two',
        'None'
      ],
      answer: 1,
      explain: 'Whenever you would write while in another language, Go writes for condition.'
    },
    {
      q: 'The defining Go function signature returns...',
      choices: [
        'Exactly one value',
        'Often multiple values - especially (result, error) - which is why Go does not need exceptions',
        'No values ever',
        'Only errors'
      ],
      answer: 1,
      explain: "Go's switch also does not fall through - no break needed."
    }
  ],
  'go-from-zero/5': [
    {
      q: "Go's entire visibility rule is...",
      choices: [
        'public and private keywords',
        'Capitalized identifiers are exported (visible to other packages); lowercase ones are private',
        'based on import order',
        'based on file location'
      ],
      answer: 1,
      explain: 'Making something public is a one-letter decision.'
    },
    {
      q: 'A package versus a module:',
      choices: [
        'They are the same thing',
        'A package is a folder of related code; a module is the whole project, defined by go.mod',
        'A module is a single file',
        'A package is the whole project'
      ],
      answer: 1,
      explain: 'A module is your project; packages are the folders inside it.'
    }
  ],
  'go-from-zero/6': [
    {
      q: 'A goroutine is...',
      choices: [
        'An operating-system thread',
        'A cheap, lightweight concurrent task started with `go f()` - thousands are fine',
        'A type of channel',
        'A kind of lock'
      ],
      answer: 1,
      explain: 'When main exits, all goroutines die, so you need an explicit way to wait.'
    },
    {
      q: 'A send on an unbuffered channel...',
      choices: [
        'Never blocks',
        'Blocks until a receiver is ready - it both moves a value and synchronizes the two goroutines',
        'Returns immediately',
        'Stores unlimited values'
      ],
      answer: 1,
      explain: "Sending with no receiver can deadlock; the mantra is 'share memory by communicating'."
    }
  ],
  'go-from-zero/7': [
    {
      q: 'In Go, an error is...',
      choices: [
        'An exception thrown up the stack',
        'Just a value - a fallible function returns (result, error) and you check `if err != nil` right there',
        'A panic',
        'Handled automatically'
      ],
      answer: 1,
      explain: 'You deal with the failure at the spot it happened, where you have the context.'
    },
    {
      q: 'The `%w` verb in fmt.Errorf does what?',
      choices: [
        'Prints a warning',
        'Wraps an error - adding your context while keeping the original recoverable (via errors.Is / errors.As)',
        'Formats a number',
        'Closes a file'
      ],
      answer: 1,
      explain: "Don't discard errors with _; reserve panic for unrecoverable bugs, not everyday failures."
    }
  ],
  'go-from-zero/8': [
    {
      q: '`go fmt` (gofmt)...',
      choices: [
        'Is optional and highly configurable',
        "Rewrites code into Go's one canonical format, ending style debates",
        'Runs your tests',
        'Builds a binary'
      ],
      answer: 1,
      explain: '"Run it through gofmt" is the entire formatting policy of the Go world.'
    },
    {
      q: "Go's testing is...",
      choices: [
        'A third-party framework you install',
        'Built into the toolchain: TestXxx(t *testing.T) in *_test.go files, run with go test ./...',
        'Not supported',
        'Done with an assert library'
      ],
      answer: 1,
      explain: 'go vet flags compiles-but-probably-wrong code; go mod tidy syncs dependencies.'
    }
  ],
  'go-from-zero/9': [
    {
      q: 'Go interfaces are satisfied...',
      choices: [
        'With an `implements` keyword',
        'Implicitly - a type fits an interface just by having the right methods; interfaces are usually tiny',
        'Through class inheritance',
        'Only by structs you register'
      ],
      answer: 1,
      explain: "Go favors composition (struct embedding) over inheritance; 'accept interfaces, return structs'."
    },
    {
      q: 'A subtle Go gotcha is that a nil interface...',
      choices: [
        'Always equals nil',
        'Is NOT equal to nil if it holds a typed-but-nil pointer - return a bare nil for "no error"',
        'Cannot exist',
        'Causes a compile error'
      ],
      answer: 1,
      explain: 'An interface is only nil when both its type and value are empty.'
    }
  ],
  'go-from-zero/10': [
    {
      q: 'Where does Go especially shine?',
      choices: [
        'Mobile UI apps',
        'Web services/APIs, CLI tools, and cloud/infrastructure (Docker and Kubernetes are written in Go)',
        'Spreadsheets',
        'Game graphics engines'
      ],
      answer: 1,
      explain: 'Fast compiles, single static binaries, and first-class concurrency suit infrastructure software.'
    },
    {
      q: 'The recommended habit when building Go is...',
      choices: [
        'Reach for many third-party packages first',
        'Lean on the standard library and the toolchain (go fmt, go vet, go test) before external packages',
        'Avoid writing tests',
        'Skip formatting'
      ],
      answer: 1,
      explain: 'That habit alone makes your Go look like a veteran wrote it.'
    }
  ],
  // -- GraphQL Explained ----------------------------------------------------
  'graphql-explained/1': [
    {
      q: "Both REST's over-fetching and under-fetching come from one root cause:",
      choices: [
        'Slow networks',
        'The server owns the shape of the response',
        'JSON is too verbose',
        'There are too few endpoints'
      ],
      answer: 1,
      explain: 'A REST endpoint is a fixed door; the server decides what comes through it, the same way for everyone.'
    },
    {
      q: "GraphQL's core pitch is...",
      choices: [
        'A faster network',
        'Let the client ask for exactly the fields it wants and get exactly those, in a single request',
        'Smaller JSON payloads',
        'No server is needed'
      ],
      answer: 1,
      explain: 'It moves the decision of what to return from the server to the client.'
    }
  ],
  'graphql-explained/2': [
    {
      q: 'In a GraphQL schema, what does the ! (bang) mean?',
      choices: [
        'The field is deprecated',
        'The field is non-nullable - guaranteed to have a value',
        'The field is private',
        'It marks a comment'
      ],
      answer: 1,
      explain: 'No bang means the field may be null; the schema tells you up front what you can rely on.'
    },
    {
      q: 'A GraphQL response...',
      choices: [
        'Has an unpredictable shape you must decode',
        'Mirrors the shape of the query you sent, under a top-level data object',
        'Is always the full resource',
        'Is binary'
      ],
      answer: 1,
      explain: 'Queries read, mutations write, and everything goes to one endpoint (POST /graphql).'
    }
  ],
  'graphql-explained/3': [
    {
      q: 'Compared to REST, caching in GraphQL is...',
      choices: [
        'Easier and free',
        "Harder - there's no URL-per-resource, and POST isn't cached by HTTP/CDN infrastructure",
        'Exactly the same',
        'Not needed at all'
      ],
      answer: 1,
      explain: 'Caching moves into a client library instead of being free HTTP/CDN infrastructure.'
    },
    {
      q: 'The N+1 problem in GraphQL resolvers is fixed by...',
      choices: [
        'Adding more resolvers',
        'Batching the related lookups into one query (e.g. with DataLoader)',
        'Switching to REST',
        'Caching the schema'
      ],
      answer: 1,
      explain: 'Per-field resolvers make it easy to accidentally fire one query per item; batching collapses them.'
    }
  ],

  // -- gRPC Explained -------------------------------------------------------
  'grpc-explained/1': [
    {
      q: "gRPC is 'contract-first', meaning...",
      choices: [
        'You write documentation first',
        'You define the functions and message shapes once in a .proto file, and both caller and callee generate code from it',
        'The client decides the response shape',
        'JSON is the contract'
      ],
      answer: 1,
      explain: 'The contract is the source of truth both sides are physically built from.'
    },
    {
      q: 'Two problems gRPC attacks versus JSON-over-HTTP are...',
      choices: [
        'Security and cost only',
        'Wasteful text serialization plus connection overhead, and the lack of an enforced contract between services',
        'Caching and routing',
        'Browser and mobile support'
      ],
      answer: 1,
      explain: 'Binary Protocol Buffers over reused HTTP/2 fix the waste; generated types fix silent contract drift.'
    }
  ],
  'grpc-explained/2': [
    {
      q: 'In a .proto file, the field tag numbers (= 1, = 2) are...',
      choices: [
        'Default values',
        "The permanent on-the-wire identity of each field - never reuse them, and renaming a field is safe because names don't travel",
        'Just the field order for display',
        'Encryption keys'
      ],
      answer: 1,
      explain: 'The number is the contract; reusing one makes old clients read new data into the wrong slot.'
    },
    {
      q: 'Beyond plain request/response (unary), gRPC also offers...',
      choices: [
        'Nothing else',
        'Server streaming, client streaming, and bidirectional streaming (over HTTP/2)',
        'Only batch calls',
        'SQL queries'
      ],
      answer: 1,
      explain: 'Streaming falls out of building on HTTP/2; unary is still the right boring default.'
    }
  ],
  'grpc-explained/3': [
    {
      q: "gRPC's home turf is...",
      choices: [
        'Public, browser-facing APIs',
        'Internal service-to-service calls at high volume, where you want speed and a strict contract',
        'Static websites',
        'Replacing all REST everywhere'
      ],
      answer: 1,
      explain: "It isn't directly browser-friendly (needs grpc-web plus a proxy), and binary is harder to debug."
    },
    {
      q: "A real cost of gRPC's binary (Protocol Buffers) format is...",
      choices: [
        'It is slower than JSON',
        "You can't read it with your eyes the way you can read JSON - inspecting it needs special tooling",
        "It can't carry types",
        'It only works in Go'
      ],
      answer: 1,
      explain: 'The compactness that makes it fast is exactly what makes it unreadable by hand.'
    }
  ],

  // -- How a Computer Works -------------------------------------------------
  'how-a-computer-works/1': [
    {
      q: 'The one idea a computer rests on is...',
      choices: [
        'It thinks like a brain',
        'It follows a list of instructions, one after another, very fast',
        'It stores everything in the cloud',
        'It guesses answers'
      ],
      answer: 1,
      explain: 'Every part exists to store, fetch, run, or remember those instructions and results.'
    },
    {
      q: 'The most common confusion in computing is mixing up...',
      choices: [
        'CPU and GPU',
        'RAM (fast, temporary workspace that forgets on power off) and storage (big, permanent, remembers)',
        'Input and output',
        'Cores and GHz'
      ],
      answer: 1,
      explain: 'Saving means copying from the forgetful desk (RAM) into the permanent cabinet (storage).'
    }
  ],
  'how-a-computer-works/2': [
    {
      q: 'Why does opening any program first copy it from storage into RAM?',
      choices: [
        'To make a backup',
        'Storage is far too slow to feed the CPU; the CPU works fast from RAM',
        'To compress it',
        'To encrypt it'
      ],
      answer: 1,
      explain: 'The little "loading" spinner is largely this copy from the slow cabinet to the fast desk.'
    },
    {
      q: 'The memory hierarchy (cache -> RAM -> storage) means...',
      choices: [
        'All memory is equally fast',
        'Closer to the CPU is faster but smaller; further away is bigger but slower',
        'Storage is the fastest layer',
        'Cache is the largest layer'
      ],
      answer: 1,
      explain: 'Being out of RAM makes everything crawl because the computer leans on slow storage.'
    }
  ],
  'how-a-computer-works/3': [
    {
      q: "When the computer is slow and improves as you close apps/tabs, the culprit is usually...",
      choices: [
        'A slow CPU',
        'Not enough RAM (the desk is too small)',
        'A full disk',
        'A virus'
      ],
      answer: 1,
      explain: 'Everyday slowness is usually too many things open for the RAM you have.'
    },
    {
      q: 'For overall snappiness, what matters most about storage?',
      choices: [
        'Its capacity (GB/TB)',
        'Whether it is an SSD versus an old spinning hard drive',
        'Its color',
        'The brand name'
      ],
      answer: 1,
      explain: 'Everything you open is read up from storage first; an SSD makes that quick.'
    }
  ],

  // -- How a Model Learns ---------------------------------------------------
  'how-a-model-learns/1': [
    {
      q: 'What does training actually change in a model?',
      choices: [
        'The recipe/architecture',
        'Only the weights - the adjustable numbers',
        'The training data',
        'The hardware'
      ],
      answer: 1,
      explain: "A model doesn't store its training data; the data shapes the numbers and then leaves the room."
    },
    {
      q: 'Given an input it has no business answering, a trained model...',
      choices: [
        "Says 'I don't know'",
        'Confidently returns some answer anyway - the recipe always produces something',
        'Crashes',
        'Refuses to respond'
      ],
      answer: 1,
      explain: 'A model never says "I don\'t know" unless specifically built to.'
    }
  ],
  'how-a-model-learns/2': [
    {
      q: 'How does a model learn which way to adjust its weights?',
      choices: [
        'It copies the right answer',
        'It measures how wrong each guess is (the loss) and nudges the weights to make the loss smaller',
        'It asks a human each time',
        'It tries random numbers until one is perfect'
      ],
      answer: 1,
      explain: 'Rolling downhill on the loss is gradient descent: feel which way is down, take a small step, repeat.'
    },
    {
      q: "Why does 'AI need lots of data'?",
      choices: [
        'Marketing',
        'Each example earns only a tiny nudge, so it takes many examples for the weights to settle',
        'Bigger files are simply better',
        'To fill up the disk'
      ],
      answer: 1,
      explain: 'Small steps, one example at a time, must add up - hence many examples over many epochs.'
    }
  ],
  'how-a-model-learns/3': [
    {
      q: 'Overfitting is when a model...',
      choices: [
        'Trains too slowly',
        'Memorizes the training examples (and their noise) instead of learning the pattern, so it fails on new data',
        'Has too few weights',
        'Runs out of memory'
      ],
      answer: 1,
      explain: 'Low training loss alone can mean memorizing, not learning - like acing a memorized answer key.'
    },
    {
      q: 'Why split data into training, validation, and test sets?',
      choices: [
        'To save disk space',
        'So you can measure the model on data it never learned from - the only honest test of generalization',
        'To train faster',
        'Just tradition'
      ],
      answer: 1,
      explain: 'A model also inherits the biases and gaps of its data; the test set must stay sealed to stay honest.'
    }
  ],

  // -- How Data Moves Inside a Machine --------------------------------------
  'how-data-moves-inside-a-machine/1': [
    {
      q: 'A bus is...',
      choices: [
        'A dedicated wire from each part to every other part',
        'Shared wiring that many components hang off, where only one transfer happens at a time',
        'A type of CPU',
        'A storage device'
      ],
      answer: 1,
      explain: 'Sharing is the point (easy to add parts); the cost is that something must coordinate whose turn it is.'
    },
    {
      q: 'An address (and a pointer) is...',
      choices: [
        'The data itself',
        'A number naming one specific memory slot; a pointer is a value that holds an address',
        'An encryption key',
        'A device name'
      ],
      answer: 1,
      explain: 'Addresses are just numbers, which is why a wrong one (a bad pointer) can corrupt unrelated data.'
    }
  ],
  'how-data-moves-inside-a-machine/2': [
    {
      q: 'DMA (Direct Memory Access) lets...',
      choices: [
        'The CPU copy each byte itself',
        'A device move data to/from RAM by itself; the CPU sets up the transfer once and walks away',
        'RAM run programs',
        'The GPU replace the CPU'
      ],
      answer: 1,
      explain: "It's why moving a big file or streaming video doesn't pin a CPU core at 100%."
    },
    {
      q: 'Memory-mapped I/O means...',
      choices: [
        'Devices get their own separate port numbers',
        "A device's registers get real memory addresses, reached with the same read/write mechanism as RAM",
        'Storage is mapped into RAM',
        'Nothing in particular'
      ],
      answer: 1,
      explain: 'The CPU needs no special instructions for devices - it reuses load/store. (Port I/O is the alternative.)'
    }
  ],
  'how-data-moves-inside-a-machine/3': [
    {
      q: 'Polling versus interrupts:',
      choices: [
        'Polling lets the device signal the CPU',
        'With interrupts the device taps the CPU only when something happens; polling has the CPU repeatedly ask, wasting time on rare or unpredictable events',
        'They are the same thing',
        'Interrupts are always slower'
      ],
      answer: 1,
      explain: 'Polling can still win for events you know arrive in nanoseconds; for a keyboard it is the wrong fit.'
    },
    {
      q: 'An interrupt causes the CPU to...',
      choices: [
        'Crash',
        'Pause its current work, run a short handler, then resume exactly where it left off',
        'Restart the machine',
        'Ignore the device'
      ],
      answer: 1,
      explain: 'Handling events the instant they happen is what makes a computer feel responsive.'
    }
  ],

  // -- How Devices Connect --------------------------------------------------
  'how-devices-connect/1': [
    {
      q: 'USB is built on a...',
      choices: [
        'Connection between two equals',
        'Host/device model - the host (computer) is in charge and starts every conversation; devices only answer',
        'Peer-to-peer mesh',
        'Wireless link'
      ],
      answer: 1,
      explain: "It's why you can't normally connect two laptops with a plain USB-A cable - both think they're the host."
    },
    {
      q: "'Enumeration' is...",
      choices: [
        'Counting your USB ports',
        'The plug-in ceremony: detect, then address, then interview (descriptors), then match a driver',
        'Formatting a drive',
        'Encrypting data'
      ],
      answer: 1,
      explain: 'A charge-only cable (power wires but no data wires) is a real cause of "USB device not recognized".'
    }
  ],
  'how-devices-connect/2': [
    {
      q: 'PCIe bandwidth is the product of...',
      choices: [
        'Voltage and current',
        'Lane count (width, e.g. x4 or x16) and generation (per-lane speed, Gen 3/4/5)',
        'Cable length and color',
        'RAM and CPU speed'
      ],
      answer: 1,
      explain: 'A newer generation can match more lanes of an older one, since each generation roughly doubles per-lane speed.'
    },
    {
      q: 'Put a PCIe card in a slot with fewer lanes or an older generation and...',
      choices: [
        'It refuses to work',
        'It negotiates down and runs slower, usually with no error - silently capping the card below its rating',
        'It overclocks itself',
        'It damages the board'
      ],
      answer: 1,
      explain: 'A new GPU or SSD that "feels slower than the reviews" is often a Gen or lane mismatch with the slot.'
    }
  ],
  'how-devices-connect/3': [
    {
      q: 'Why is a GPU good at both graphics and machine learning?',
      choices: [
        'It has one very fast core',
        "Both are the same 'simple math, millions of times, in parallel' pattern - and a GPU has thousands of simple cores",
        'It has more RAM than the CPU',
        'It is simply newer than the CPU'
      ],
      answer: 1,
      explain: 'Low GPU utilization usually means starved cores (a feeding/bandwidth problem), not a weak GPU.'
    },
    {
      q: 'Why does an unknown-brand keyboard work the instant you plug it in?',
      choices: [
        'Magic',
        'Device classes - it claims a standard category (HID), so one generic OS driver handles thousands of models',
        'It secretly downloads a driver',
        'All keyboards are physically identical'
      ],
      answer: 1,
      explain: 'Only non-standard extras (macro keys, RGB) need the manufacturer\'s own software.'
    }
  ],

  // -- How Passwords Are Stored ---------------------------------------------
  'how-passwords-are-stored/1': [
    {
      q: 'How should passwords be stored?',
      choices: [
        'Encrypted so they can be read back when needed',
        'As a one-way hash - never the password itself, and never reversible encryption',
        'In plain text in a protected column',
        'Not stored in any form'
      ],
      answer: 1,
      explain: 'A leaked table of hashes reveals no passwords - that is the whole point.'
    },
    {
      q: 'Hashing differs from encryption in that...',
      choices: [
        'Hashing is reversible with a key',
        'Hashing is one-way (no key turns it back); encryption is reversible by design',
        'They are identical',
        'Encryption is the one-way one'
      ],
      answer: 1,
      explain: "Encrypting passwords means a key exists that turns them all back to plain text - the wrong tool."
    }
  ],
  'how-passwords-are-stored/2': [
    {
      q: 'A per-user salt...',
      choices: [
        'Encrypts the password',
        'Is random data mixed in before hashing, so identical passwords hash differently and rainbow tables become useless',
        'Must be kept secret',
        'Speeds up hashing'
      ],
      answer: 1,
      explain: 'The salt is stored next to the hash and is not secret - it just needs to be unique and random.'
    },
    {
      q: 'Why is plain SHA-256 the wrong hash for passwords?',
      choices: [
        'It is cryptographically weak',
        'It is too fast - attackers can make enormous numbers of guesses per second; you want a deliberately slow hash',
        "It can't be salted",
        'It is deprecated'
      ],
      answer: 1,
      explain: 'Salt defeats precomputed tables but does nothing about raw guessing speed - you need both salt and slowness.'
    }
  ],
  'how-passwords-are-stored/3': [
    {
      q: 'The right tools for storing passwords are...',
      choices: [
        'MD5 or SHA-256',
        'Argon2, bcrypt, or scrypt - slow, salted password-hashing functions, via a vetted library',
        'Your own custom scheme',
        'Base64 encoding'
      ],
      answer: 1,
      explain: 'Never roll your own crypto, and use the library\'s constant-time verify rather than comparing strings.'
    },
    {
      q: "A password hash's 'work factor' (cost/rounds)...",
      choices: [
        'Is the salt',
        'Dials in slowness - set it so one login takes a noticeable fraction of a second, and raise it over the years',
        'Encrypts the output',
        'Is the password length'
      ],
      answer: 1,
      explain: 'It is stored inside the hash so verification knows how much work to redo.'
    }
  ],

  // -- How to Reproduce a Bug -----------------------------------------------
  'how-to-reproduce-a-bug/1': [
    {
      q: "Why is reproduction called 'the whole game'?",
      choices: [
        'Managers require it',
        'A bug you can trigger on demand becomes an experiment you can observe and fix; one you can\'t is a rumor',
        'It documents the bug for later',
        'It is faster than reading code'
      ],
      answer: 1,
      explain: '"I can\'t fix this bug" almost always means "I can\'t reproduce it yet."'
    },
    {
      q: 'The two moves of reproduction, in order, are...',
      choices: [
        'Read the code, then guess',
        "Trigger (make it happen reliably), then shrink (remove everything that isn't load-bearing)",
        'Fix it, then test it',
        'Shrink first, then trigger'
      ],
      answer: 1,
      explain: '"It didn\'t happen when I tried" is not "fixed" - that\'s an experiment with no control.'
    }
  ],
  'how-to-reproduce-a-bug/2': [
    {
      q: 'When a bug reproduces for one person but not another, the difference hides in one of four places:',
      choices: [
        'Luck, mood, weather, phase of the moon',
        'Steps, environment, data, or state/timing',
        'CPU, RAM, disk, network',
        'Frontend, backend, database, cache'
      ],
      answer: 1,
      explain: 'A program is deterministic - some condition is different, and there are only four places it can hide.'
    },
    {
      q: "'Works on my machine' is best read as...",
      choices: [
        'The reporter is imagining it',
        'A diagnosis: the bug depends on an environment difference - find which part differs',
        'A dead end',
        'A compliment'
      ],
      answer: 1,
      explain: 'A minimal reproduction is built by subtraction - remove what isn\'t needed until only the cause is left.'
    }
  ],
  'how-to-reproduce-a-bug/3': [
    {
      q: 'An intermittent bug (a heisenbug) really means...',
      choices: [
        'The code is non-deterministic',
        "A hidden input you haven't pinned yet - some condition varying behind your back",
        'The computer is haunted',
        'A hardware fault'
      ],
      answer: 1,
      explain: 'Find that input and clamp it (timing, fresh state, a dependency, a cache, a seed/clock) and it becomes triggerable.'
    },
    {
      q: 'Why does a bug often vanish the moment you attach a debugger or add logging?',
      choices: [
        'The debugger fixes it',
        'Your observation changes the timing the bug depended on (a race condition)',
        'Logging deletes the bug',
        'It was never real'
      ],
      answer: 1,
      explain: 'For a suspected race, force the timing or log to a buffer rather than reaching for the debugger first.'
    }
  ],

  // -- HTTP & JSON API Basics -----------------------------------------------
  'http-and-json-api-basics/1': [
    {
      q: 'Every API call is...',
      choices: [
        'An always-on connection',
        'A request (method + URL + headers + optional body) and a response (status + headers + body)',
        'One-way',
        'Binary only'
      ],
      answer: 1,
      explain: 'Each call is a fresh, self-contained question-and-answer exchange.'
    },
    {
      q: "A status code's first digit tells you...",
      choices: [
        'The response size',
        'The category: 2xx worked, 3xx moved, 4xx you erred, 5xx the server erred',
        'The HTTP method used',
        'Nothing useful'
      ],
      answer: 1,
      explain: 'A 200 means the response was delivered, not that the data inside is correct - read the body too.'
    }
  ],
  'http-and-json-api-basics/2': [
    {
      q: 'JSON is built from how many value types?',
      choices: [
        'Dozens',
        'Six: object, array, string, number, boolean, and null',
        'Two',
        'Unlimited'
      ],
      answer: 1,
      explain: 'Values nest (objects and arrays can hold more of each), so JSON can describe anything.'
    },
    {
      q: 'Two JSON rules that bite everyone are...',
      choices: [
        'Tabs versus spaces',
        'Double quotes only (keys included) and no trailing comma',
        'Semicolons and indentation',
        'Keys must be uppercase'
      ],
      answer: 1,
      explain: 'If a parser rejects your JSON, check these two first - usually a stray comma or single quotes.'
    }
  ],
  'http-and-json-api-basics/3': [
    {
      q: 'To send JSON in a POST, you must...',
      choices: [
        'Just include the body',
        'Send valid JSON in the body AND set the Content-Type: application/json header',
        'Use a GET instead',
        'Encrypt the body'
      ],
      answer: 1,
      explain: 'A missing Content-Type header is the usual reason a perfectly good JSON body gets rejected.'
    },
    {
      q: 'The typical success status when a POST creates something is...',
      choices: ['200 OK', '201 Created', '204 No Content', '404 Not Found'],
      answer: 1,
      explain: '201 Created is a more specific 2xx meaning "I made the new thing", often with a Location header.'
    }
  ],

  // -- HTTP Explained -------------------------------------------------------
  'http-explained/1': [
    {
      q: 'HTTP is fundamentally...',
      choices: [
        'A server broadcasting to clients',
        'One repeated move: the client asks (request), the server answers (response)',
        'An always-on stream',
        'Peer-to-peer'
      ],
      answer: 1,
      explain: 'Nothing arrives until the client asks; a self-updating page is just more background requests.'
    },
    {
      q: 'A URL breaks into...',
      choices: [
        'Just a domain name',
        'Scheme (how), host (who), path (which thing), and query (extra name=value instructions after a ?)',
        'Only a path',
        'Random text'
      ],
      answer: 1,
      explain: 'The query string is visible in history and logs - fine for filters, wrong for secrets.'
    }
  ],
  'http-explained/2': [
    {
      q: 'Which HTTP method only reads and changes nothing?',
      choices: ['POST', 'GET', 'DELETE', 'PUT'],
      answer: 1,
      explain: 'Never put a consequential action behind a GET - browsers and bots can fire it without a real click.'
    },
    {
      q: 'For status codes, 4xx versus 5xx means...',
      choices: [
        'Both are server errors',
        '4xx = your request was wrong (fix it); 5xx = the server broke (wait or report it)',
        '4xx = success',
        '5xx = a redirect'
      ],
      answer: 1,
      explain: 'Read the first digit first: 2 worked, 3 moved, 4 your fault, 5 the server\'s fault.'
    }
  ],
  'http-explained/3': [
    {
      q: "A cookie solves HTTP's forgetfulness by...",
      choices: [
        'Encrypting every request',
        'The server sending Set-Cookie, and the browser handing it back in a Cookie header on every later request',
        'Storing all data on the server only',
        'Keeping one connection open forever'
      ],
      answer: 1,
      explain: 'That round trip is how a stack of independent requests adds up to "staying logged in".'
    },
    {
      q: 'What does HTTPS actually guarantee?',
      choices: [
        'That the website is honest and safe',
        'Privacy (no eavesdropping) and integrity (no tampering) of the conversation - not that the site is trustworthy',
        'Faster page loads',
        'That no cookies are used'
      ],
      answer: 1,
      explain: 'A scam site can have a perfect padlock; HTTPS protects the conversation, not the intentions behind it.'
    }
  ],
  // -- HTTPS & TLS ----------------------------------------------------------
  'https-and-tls/1': [
    {
      q: 'TLS (the S in HTTPS) provides which three guarantees?',
      choices: [
        'Speed, caching, compression',
        "Encryption (can't read it), integrity (can't tamper undetected), and authentication (you reached the real server)",
        'Anonymity, honesty, uptime',
        'Backups, logging, monitoring'
      ],
      answer: 1,
      explain: 'Encryption without authentication is a sealed envelope handed to a stranger; TLS does both.'
    },
    {
      q: 'The padlock in your browser means...',
      choices: [
        'This website is safe and honest',
        'The connection is encrypted to whoever holds the certificate - NOT that the site itself is trustworthy',
        'The site was verified by a government',
        'No cookies are used'
      ],
      answer: 1,
      explain: 'A scammer can get a valid padlock for a lookalike domain in minutes - read the domain yourself.'
    }
  ],
  'https-and-tls/2': [
    {
      q: 'How does TLS use both kinds of encryption?',
      choices: [
        'Only symmetric, always',
        'Slow asymmetric (public/private keys) once to agree on a fast symmetric session key, then symmetric for all the data',
        'Only asymmetric, for everything',
        'Neither - it sends plain text'
      ],
      answer: 1,
      explain: 'Asymmetric crypto exists to bootstrap a fast symmetric key - the handshake before the fast conversation.'
    },
    {
      q: 'In asymmetric (public-key) cryptography...',
      choices: [
        'The same key locks and unlocks',
        'Anything locked with the public key can only be unlocked with the matching private key',
        'Both keys are kept secret',
        'The public key unlocks messages'
      ],
      answer: 1,
      explain: 'You can hand out the public key freely; only the private-key holder can unlock.'
    }
  ],
  'https-and-tls/3': [
    {
      q: "A TLS certificate's one job is to...",
      choices: [
        'Encrypt the data itself',
        'Bind a public key to a domain name, signed by a Certificate Authority',
        'Prove the site is legitimate and honest',
        'Speed up the handshake'
      ],
      answer: 1,
      explain: 'It only ties a key to a domain - which is why the padlock can never vouch for honesty.'
    },
    {
      q: 'Why does your browser trust a certificate?',
      choices: [
        "Because it's encrypted",
        "A chain of trust: the cert is signed by a CA, traced up to a root CA already in your browser's root store",
        'Because it shows a padlock',
        "It doesn't actually check"
      ],
      answer: 1,
      explain: 'Never click through a certificate warning on a real site - that warning is what an attacker needs you to ignore.'
    }
  ],

  // -- Infrastructure as Code (Terraform) -----------------------------------
  'infrastructure-as-code-terraform/1': [
    {
      q: 'The three failures of click-ops (managing cloud by hand in a console) are...',
      choices: [
        'Slow, expensive, ugly',
        'Unrepeatable, undocumented, and it drifts',
        'Insecure, illegal, deprecated',
        "None - it's fine at any scale"
      ],
      answer: 1,
      explain: 'Drift is the dangerous one: reality silently diverges from what everyone believes.'
    },
    {
      q: 'Infrastructure as Code is declarative, meaning...',
      choices: [
        'You write step-by-step commands',
        'You describe the desired end state and the tool works out the steps to reach it',
        'You just click through menus faster',
        'You document but never run it'
      ],
      answer: 1,
      explain: 'Putting desired state in version-controlled files makes infrastructure repeatable, documented, and drift-visible.'
    }
  ],
  'infrastructure-as-code-terraform/2': [
    {
      q: 'The Terraform core loop is...',
      choices: [
        'build, test, ship',
        'init (get providers), plan (preview the diff), apply (make it real)',
        'clone, push, pull',
        'start, stop, restart'
      ],
      answer: 1,
      explain: 'plan changes nothing - read it every time, especially any "to destroy" count.'
    },
    {
      q: 'Terraform state (terraform.tfstate) is...',
      choices: [
        'A disposable cache you can delete',
        "Terraform's memory mapping your config to the real cloud resources - for teams it must be shared and locked (a remote backend)",
        'Just the config files',
        'A log of past commands'
      ],
      answer: 1,
      explain: 'Lose or corrupt state and Terraform forgets it owns your resources and may try to duplicate everything.'
    }
  ],
  'infrastructure-as-code-terraform/3': [
    {
      q: 'The one habit that keeps Terraform safe is...',
      choices: [
        'Apply quickly to save time',
        'Plan before apply, always - read the plan (especially the "to destroy" count) before letting apply touch anything',
        'Skip the plan once you trust it',
        'Edit the state file by hand'
      ],
      answer: 1,
      explain: 'On teams, make the plan a reviewed pull-request artifact, like a code diff.'
    },
    {
      q: 'Why must you never commit terraform.tfstate to Git?',
      choices: [
        'It is too large',
        'It can contain secrets in plain text - guard the state backend like a password vault',
        'It changes too often',
        'It is a binary file'
      ],
      answer: 1,
      explain: '"sensitive = true" hides a value from output, not from state; a hidden -/+ replacement is a destroy.'
    }
  ],

  // -- Inside a Server & Data Center ----------------------------------------
  'inside-a-server-and-data-center/1': [
    {
      q: 'A server differs from a laptop mainly because it is optimized for...',
      choices: [
        'A nice screen and battery life',
        'Uptime and density - serving many requests unattended, packed tight in a rack',
        'Portability',
        'Gaming performance'
      ],
      answer: 1,
      explain: 'Every physical difference (ECC, dual PSUs, rack form factor) falls out of that one trade.'
    },
    {
      q: 'ECC memory...',
      choices: [
        'Is just faster RAM',
        "Detects and corrects spontaneous bit flips, so a long-running machine doesn't silently serve corrupted data",
        'Encrypts what is in memory',
        'Is only used in laptops'
      ],
      answer: 1,
      explain: 'A rising count of corrected errors warns you a memory module is dying.'
    },
    {
      q: 'A BMC (iDRAC/iLO/IPMI) lets admins...',
      choices: [
        'Type commands faster',
        'Power-cycle, watch the screen, and install the OS remotely - even while the main machine is off',
        'Replace the CPU remotely',
        'Cool the server'
      ],
      answer: 1,
      explain: "It's a tiny always-on computer on the motherboard; keep it strictly off the public internet."
    }
  ],
  'inside-a-server-and-data-center/2': [
    {
      q: 'The core reliability principle for servers is...',
      choices: [
        'Buy the fastest parts',
        'Eliminate single points of failure - no one component whose failure stops the whole machine',
        'Never reboot',
        'Add more RAM'
      ],
      answer: 1,
      explain: 'Two PSUs, RAID across disks, hot-swap parts - all the same idea: two of anything you can\'t lose.'
    },
    {
      q: 'RAID is...',
      choices: [
        'A backup system',
        'Combining several disks into one logical drive for redundancy and/or speed (levels 0/1/5/10)',
        'A form of encryption',
        'A type of CPU'
      ],
      answer: 1,
      explain: 'RAID is NOT a backup - it protects against a disk dying, not deletion, corruption, or losing the whole box.'
    }
  ],
  'inside-a-server-and-data-center/3': [
    {
      q: "A data center's hardest limits are usually...",
      choices: [
        'Floor space and CPU',
        'Power and cooling - redundant feeds/UPS/generators, plus hot-aisle/cold-aisle airflow',
        'Internet speed',
        'Disk space'
      ],
      answer: 1,
      explain: 'A room can run out of watts or cooling long before it runs out of room for racks.'
    },
    {
      q: "Precisely, 'the cloud' is...",
      choices: [
        'Software that runs with no servers',
        'Real physical servers in someone else\'s buildings, sliced by virtualization (a hypervisor) into rentable VMs',
        'A purely magical abstraction',
        'Just remote storage'
      ],
      answer: 1,
      explain: '"Serverless" still runs on those servers - the name describes your experience, not their absence.'
    }
  ],

  // -- IP, DNS & Ports ------------------------------------------------------
  'ip-dns-and-ports/1': [
    {
      q: 'An IP address is...',
      choices: [
        'A permanent serial number etched into a device',
        'A number identifying where a device is on the network right now (it can change)',
        'A website name',
        'A password'
      ],
      answer: 1,
      explain: "It's more like a hotel room number than a passport - where you are, not who you are."
    },
    {
      q: 'Why does IPv6 exist?',
      choices: [
        'It is more secure than IPv4',
        "IPv4's roughly 4.3 billion addresses ran out; IPv6 has vastly more",
        'It is faster',
        'To replace DNS'
      ],
      answer: 1,
      explain: 'Both run side by side today; a machine often has an IPv4 and an IPv6 address at once.'
    }
  ],
  'ip-dns-and-ports/2': [
    {
      q: 'What does DNS do?',
      choices: [
        'Encrypts your traffic',
        'Translates a name like example.com into an IP address - the internet\'s phone book',
        'Routes packets between machines',
        'Assigns ports to services'
      ],
      answer: 1,
      explain: 'Caching with a TTL makes lookups fast but makes changes take time to spread.'
    },
    {
      q: "When a healthy website 'appears down' for only you, a likely cause is...",
      choices: [
        'The server crashed',
        'DNS - a stale cached answer or a failed lookup, so you never reach the real server',
        'A global power outage',
        'Your CPU'
      ],
      answer: 1,
      explain: 'Check whether the name resolves (dig/ping) before assuming the server is down - "it\'s probably DNS".'
    }
  ],
  'ip-dns-and-ports/3': [
    {
      q: 'A port is...',
      choices: [
        'A physical socket on the back of the computer',
        'A number identifying one specific service on a machine - the IP finds the building, the port finds the door',
        'A type of cable',
        'Another name for an IP address'
      ],
      answer: 1,
      explain: "It's not hardware - it's a label the OS uses to route incoming traffic to the right program."
    },
    {
      q: 'The complete address of a service is...',
      choices: [
        'Just the IP address',
        'IP + port (e.g. 203.0.113.42:443); browsers default to 443 for https and 80 for http',
        'Just the domain name',
        'Just the port number'
      ],
      answer: 1,
      explain: '"Connection refused" often means nothing was listening on that port - a door with no one behind it.'
    }
  ],

  // -- JavaScript from Zero -------------------------------------------------
  'javascript-from-zero/1': [
    {
      q: 'JavaScript runs in two main runtimes with different tools:',
      choices: [
        'Two different browsers',
        'The browser (window/document, no filesystem) and Node.js (fs, servers, no DOM)',
        'Chrome and Edge only',
        'A compiler and an interpreter'
      ],
      answer: 1,
      explain: '"document is not defined" in Node means you reached for a browser-only tool.'
    },
    {
      q: 'You run a JavaScript file with...',
      choices: [
        'Compiling it to a binary first',
        'node hello.js - Node reads and runs the source directly',
        'A build button',
        'npm build'
      ],
      answer: 1,
      explain: 'Edit a .js file, run it with node, read the output - that is the whole loop.'
    }
  ],
  'javascript-from-zero/2': [
    {
      q: 'Which variable keyword should you default to?',
      choices: [
        'var',
        'const - use let only when you must reassign, and avoid var entirely',
        'let, always',
        'No keyword at all'
      ],
      answer: 1,
      explain: 'Code where most names are const is easier to reason about because fewer things move.'
    },
    {
      q: 'Why always use === instead of ==?',
      choices: [
        'It is shorter to type',
        '== coerces types and gives surprises (0 == "" is true); === compares value and type with no conversion',
        '== is deprecated',
        'They are identical'
      ],
      answer: 1,
      explain: 'Also: NaN is not equal to itself (use Number.isNaN), and 0.1 + 0.2 !== 0.3 (work in integer cents for money).'
    }
  ],
  'javascript-from-zero/3': [
    {
      q: 'The two workhorse collections are...',
      choices: [
        'Map and Set',
        'Arrays (ordered lists, indexed from 0) and objects (key:value bundles)',
        'Stacks and queues',
        'Strings and numbers'
      ],
      answer: 1,
      explain: 'map/filter/reduce transform an array into a new value without mutating the original.'
    },
    {
      q: 'Objects and arrays are assigned by...',
      choices: [
        'Value (a full copy)',
        'Reference - two names can point at the same object, so changing one changes the other (copy with {...o} / [...a])',
        'They cannot be assigned',
        'Always cloning'
      ],
      answer: 1,
      explain: 'This is why a const array can still be mutated, and why {x:1} === {x:1} is false.'
    }
  ],
  'javascript-from-zero/4': [
    {
      q: "A 'callback' is...",
      choices: [
        'A returned value',
        'A function passed to another function to be called later - functions are values you can pass around',
        'An error object',
        'A type of loop'
      ],
      answer: 1,
      explain: 'This is exactly what map/filter/reduce and event handlers do - you hand them a function.'
    },
    {
      q: 'In JavaScript, the falsy values are...',
      choices: [
        'Only false',
        'false, 0, "" (empty string), null, undefined, and NaN - everything else is truthy',
        'Only null and undefined',
        'Only 0'
      ],
      answer: 1,
      explain: 'So if (count) skips a real 0; check count > 0 when zero is a valid value.'
    }
  ],
  'javascript-from-zero/5': [
    {
      q: 'A JavaScript module...',
      choices: [
        'Shares everything by default',
        'Keeps its contents private and shares only what it exports; other files import what they need',
        'Is the same thing as a function',
        "Can't be split across files"
      ],
      answer: 1,
      explain: 'Use named exports for several helpers, a default export when a file is about one thing.'
    },
    {
      q: 'The node_modules folder should be...',
      choices: [
        'Committed to Git',
        'Gitignored - it is huge and rebuildable from package.json with npm install',
        'Deleted after every install',
        'Edited by hand'
      ],
      answer: 1,
      explain: 'Commit the recipe (package.json + lockfile), not the meal (node_modules).'
    }
  ],
  'javascript-from-zero/6': [
    {
      q: 'JavaScript runs on one thread but stays responsive because of...',
      choices: [
        'Multiple CPUs',
        'The event loop - slow work is handed off and its follow-up runs later, so the thread never just waits',
        'Extra RAM',
        'Background threads you create'
      ],
      answer: 1,
      explain: 'A long synchronous task blocks the event loop and freezes everything - keep slow things async.'
    },
    {
      q: 'What does await do?',
      choices: [
        'Blocks the whole program',
        'Pauses its async function until a Promise settles, then hands you the value - forgetting it gives you the Promise itself',
        'Creates a new thread',
        'Cancels a fetch'
      ],
      answer: 1,
      explain: 'async/await reads like normal code but is still Promises underneath.'
    }
  ],
  'javascript-from-zero/7': [
    {
      q: 'A surprising fetch gotcha is that fetch...',
      choices: [
        'Always throws on success',
        'Does NOT reject on HTTP errors like 404/500 - you must check res.ok yourself and throw',
        "Can't return JSON",
        'Is synchronous'
      ],
      answer: 1,
      explain: 'fetch only rejects when the request can\'t complete at all (no network); a 500 still resolves.'
    },
    {
      q: 'To catch a rejected Promise with try/catch, you...',
      choices: [
        'Wrap the plain call (no await)',
        'await it inside the try/catch - then a rejection is thrown right there',
        'Use .finally instead',
        "Can't - Promises ignore try/catch"
      ],
      answer: 1,
      explain: 'Throw Error objects (not strings); an unhandled rejection can crash Node.'
    }
  ],
  'javascript-from-zero/8': [
    {
      q: 'npm does two jobs:',
      choices: [
        'Compile and run code',
        'Installs packages into node_modules and runs scripts defined in package.json',
        'Lint and format',
        'Test and deploy'
      ],
      answer: 1,
      explain: 'npm run <name> runs a script; npm test and npm start are special and drop the "run".'
    },
    {
      q: 'Which tool flags likely bugs without running the code?',
      choices: [
        'Prettier (a formatter)',
        'ESLint (a linter) - static analysis for suspect code; Prettier only reformats',
        'Vite (a bundler)',
        'Vitest (a test runner)'
      ],
      answer: 1,
      explain: 'Linting inspects code without running it; formatting is purely cosmetic.'
    }
  ],
  'javascript-from-zero/9': [
    {
      q: '?. (optional chaining) and ?? (nullish coalescing)...',
      choices: [
        'Are the same as . and ||',
        '?. safely reads a maybe-missing property; ?? supplies a fallback only on null/undefined',
        'Are deprecated',
        'Only work on arrays'
      ],
      answer: 1,
      explain: 'Use ?? (not ||) for defaults when 0 or "" are legitimate values.'
    },
    {
      q: 'Inside a plain-function callback, the keyword this...',
      choices: [
        'Always refers to the object',
        "Often isn't what you expect - arrow functions keep the outer this, so prefer them for callbacks",
        'Is always undefined',
        "Can't be used in callbacks"
      ],
      answer: 1,
      explain: 'this is set by how a function is called, not where it is defined.'
    }
  ],
  'javascript-from-zero/10': [
    {
      q: 'The standout recommended next step after JavaScript is...',
      choices: [
        'A completely different language',
        'TypeScript - typed JavaScript that catches bugs early; a short leap because you know the JS underneath',
        'Assembly',
        'Quitting while ahead'
      ],
      answer: 1,
      explain: 'Learn JavaScript first and TypeScript second - you did it in the right order.'
    },
    {
      q: 'The best way to make JavaScript stick is to...',
      choices: [
        'Read more guides',
        'Build small things and finish them - a plain-JS app, an API-fetching page, then rebuild it in a framework',
        'Memorize the language spec',
        'Watch more videos'
      ],
      answer: 1,
      explain: 'A finished rough project teaches more than three polished half-projects abandoned at 80%.'
    }
  ],

  // -- Kubernetes Without the Hype ------------------------------------------
  'kubernetes-without-the-hype/1': [
    {
      q: 'Kubernetes is declarative, meaning...',
      choices: [
        'You run one-off commands like Docker',
        "You declare the desired state ('3 of these, reachable here') and a control loop keeps it true",
        'You manually place each container',
        'It only runs one container'
      ],
      answer: 1,
      explain: 'A deleted Pod comes back because you still declared you wanted it; change what you declared to remove it.'
    },
    {
      q: "What is the 'control loop'?",
      choices: [
        'A for-loop in your application',
        "Controllers constantly comparing actual state to desired and acting to close the gap - that's 'self-healing'",
        'A networking feature',
        'A kind of Pod'
      ],
      answer: 1,
      explain: 'The loop always wins, so you change things by changing what you declared, not by fighting running copies.'
    }
  ],
  'kubernetes-without-the-hype/2': [
    {
      q: 'The object you write and edit most is the...',
      choices: [
        'Pod',
        'Deployment - it declares desired replicas, a Pod template, and performs safe rolling updates',
        'Service',
        'Node'
      ],
      answer: 1,
      explain: 'You rarely create Pods directly; the Deployment creates and replaces them.'
    },
    {
      q: 'A Service exists to...',
      choices: [
        'Run your containers',
        'Give a stable address that load-balances across disposable Pods, finding them by label',
        'Store your data',
        'Build container images'
      ],
      answer: 1,
      explain: 'Pods are disposable cattle with changing IPs; labels + selectors are the glue that ties it together.'
    }
  ],
  'kubernetes-without-the-hype/3': [
    {
      q: 'For most small apps, you should...',
      choices: [
        'Always reach for Kubernetes',
        'Lean toward a VPS, a PaaS, or Docker Compose - Kubernetes is a large ongoing cost for problems you may not have',
        'Avoid containers entirely',
        'Build your own orchestrator'
      ],
      answer: 1,
      explain: 'You can move to Kubernetes later, better-informed, once you actually hit the problems it solves.'
    },
    {
      q: 'Kubernetes genuinely earns its keep when...',
      choices: [
        'You want it on your resume',
        'You have many services, real variable scale, and the people to operate it',
        'You have a single small app',
        'Never, under any circumstances'
      ],
      answer: 1,
      explain: 'Managed Kubernetes eases the control-plane burden but does not remove the rest of the cost or the need to learn it.'
    }
  ],

  // -- Languages Explained Like a Human -------------------------------------
  'languages-explained-like-a-human/1': [
    {
      q: 'Static vs dynamic typing is about...',
      choices: [
        'Whether the language has types at all',
        'When types are checked: before it runs (static, safer) vs as it runs (dynamic, looser and quicker to write)',
        'The speed of the CPU',
        'How much memory it uses'
      ],
      answer: 1,
      explain: 'Dynamic languages still have types - they just check them later, at runtime.'
    },
    {
      q: 'The three approaches to memory management are...',
      choices: [
        'Fast, slow, and medium',
        'Manual (control, danger), garbage collected (easy, occasional pauses), and ownership (fast + safe, steep to learn)',
        'RAM, disk, and cache',
        'Read, write, and execute'
      ],
      answer: 1,
      explain: 'This is the axis with no free lunch - each option trades something real.'
    }
  ],
  'languages-explained-like-a-human/2': [
    {
      q: "Python's defining strength is...",
      choices: [
        'Raw execution speed',
        'Readability and an enormous ecosystem (especially data/AI); it is dynamic, interpreted, garbage-collected',
        'Memory safety with no GC',
        'Running natively in the browser'
      ],
      answer: 1,
      explain: '"Python is slow" is a half-truth - for most work the slow part is waiting on a network or database.'
    },
    {
      q: "Rust's signature trade is...",
      choices: [
        'Easy to learn but slow',
        'C-level speed AND memory safety with no garbage collector - via ownership - at the cost of a steep learning curve',
        'Dynamic typing for flexibility',
        'Running only on servers'
      ],
      answer: 1,
      explain: 'It aims for the fast-and-safe corner that used to require choosing one or the other.'
    }
  ],
  'languages-explained-like-a-human/3': [
    {
      q: 'The strongest signal for choosing a language is...',
      choices: [
        'Which one is fastest',
        'What you are building - browser -> JavaScript, data/AI -> Python, cloud tooling -> Go, systems -> Rust',
        'Which one is newest',
        'Which has the shortest syntax'
      ],
      answer: 1,
      explain: 'The people around you (who can help) is the underrated second signal.'
    },
    {
      q: 'The reassuring truth about your first language is...',
      choices: [
        'It locks in your whole career',
        'It matters far less than the internet says - the real skills (problem-solving, debugging) are portable',
        'You must pick the perfect one',
        'All languages are identical'
      ],
      answer: 1,
      explain: 'Your second language is far easier than your first, because you already own the ideas.'
    }
  ],

  // -- Linux for Servers ----------------------------------------------------
  'linux-for-servers/1': [
    {
      q: 'A server is...',
      choices: [
        'A completely different operating system',
        'The same Linux, run headless (no GUI) and reached over SSH, built to keep long-running services alive unattended',
        'A Windows machine',
        'A graphical desktop'
      ],
      answer: 1,
      explain: 'Config lives in plain text under /etc, which is what makes servers scriptable and reproducible.'
    },
    {
      q: 'On the first SSH connection you verify the host key fingerprint because...',
      choices: [
        'It is required by law',
        'It proves which machine you are talking to, so nobody can impersonate it later',
        'It speeds up the login',
        'It sets your password'
      ],
      answer: 1,
      explain: 'A loud "HOST IDENTIFICATION HAS CHANGED" warning later means confirm why before trusting it.'
    }
  ],
  'linux-for-servers/2': [
    {
      q: 'systemd is...',
      choices: [
        'A text editor',
        'PID 1 (the first process) and the service manager that starts, supervises, and restarts long-running services',
        'A firewall',
        'A package manager'
      ],
      answer: 1,
      explain: 'You describe what should run in a unit file; systemd babysits it whether or not you are logged in.'
    },
    {
      q: 'In systemctl, the difference between start and enable is...',
      choices: [
        'They are the same',
        'start/stop act now; enable/disable control start-at-boot; --now does both',
        'enable runs the service once',
        'start makes it survive a reboot'
      ],
      answer: 1,
      explain: '"Gone after reboot" usually means a service was started but never enabled; journalctl -u reads its logs.'
    }
  ],
  'linux-for-servers/3': [
    {
      q: 'When setting up the ufw firewall, you must...',
      choices: [
        'Block SSH first',
        'Allow SSH (OpenSSH) BEFORE you enable, or you lock yourself out; default-deny incoming',
        'Open all ports',
        'Disable the firewall'
      ],
      answer: 1,
      explain: 'Enabling a default-deny firewall before allowing SSH cuts off your own connection.'
    },
    {
      q: 'Hardening SSH means...',
      choices: [
        'Using a longer password',
        'Key-based auth, then PasswordAuthentication no and PermitRootLogin no - and keep a second session open to verify',
        'Changing the password daily',
        'Disabling SSH entirely'
      ],
      answer: 1,
      explain: 'Least privilege overall: work as a normal user, sudo per-command, and keep packages updated.'
    }
  ],

  // -- Linux from Zero ------------------------------------------------------
  'linux-from-zero/1': [
    {
      q: "Strictly speaking, 'Linux' is...",
      choices: [
        'A complete operating system',
        'A kernel (the engine); a distribution is the kernel plus surrounding software (the whole car)',
        'A company',
        'A programming language'
      ],
      answer: 1,
      explain: 'The hundreds of distros are mostly the same kernel and tools, differing in package manager and defaults.'
    },
    {
      q: 'Where does Linux actually run?',
      choices: [
        'Mostly enthusiast laptops',
        'Nearly everywhere that matters - most servers, every Android phone, countless devices, and the cloud',
        'Only supercomputers',
        'Only Raspberry Pis'
      ],
      answer: 1,
      explain: 'That is why learning Linux pays off even if your own laptop runs Windows or macOS.'
    }
  ],
  'linux-from-zero/2': [
    {
      q: 'The Linux filesystem is...',
      choices: [
        'Many separate drives like C:, D:, E:',
        'One single tree starting at root (/); other drives are mounted into it',
        'Hidden from users',
        'Organized by drive letters'
      ],
      answer: 1,
      explain: '/home is your stuff, /etc is settings, /var is changing data and logs, /usr and /bin are installed programs.'
    },
    {
      q: 'On Linux you install software by...',
      choices: [
        'Downloading an installer from a website',
        'Asking a package manager (apt on Debian/Ubuntu, dnf on Fedora)',
        'Copying files into Program Files',
        'Compiling everything yourself'
      ],
      answer: 1,
      explain: '"command not found" usually means it is not installed; "Unable to locate package" means run apt update first.'
    }
  ],
  'linux-from-zero/3': [
    {
      q: 'What does sudo do?',
      choices: [
        'Logs you in as root permanently',
        'Runs one command with root\'s power after asking for YOUR password, then drops back to normal',
        'Deletes protected files',
        'Changes your password'
      ],
      answer: 1,
      explain: "Don't live as root; work as a normal user so an ordinary mistake stays ordinary."
    },
    {
      q: "A file's permissions (rwx) apply separately to...",
      choices: [
        'Read, write, and execute only',
        'The owner, the group, and others - each with its own read/write/execute',
        'Just the owner',
        'All users equally'
      ],
      answer: 1,
      explain: '"permission denied" usually means the system is working as designed; avoid the chmod 777 "fix".'
    }
  ],
  'linux-from-zero/4': [
    {
      q: 'A service (daemon) is...',
      choices: [
        'A command you run and watch finish',
        'A long-running background program with no interactive screen (e.g. sshd, a web server)',
        'An evil program',
        'A type of file'
      ],
      answer: 1,
      explain: 'On modern Linux you manage services with systemctl.'
    },
    {
      q: "When a service won't start, the disciplined loop is...",
      choices: [
        'Reboot repeatedly',
        'systemctl status <name> (confirms it is down), then journalctl -u <name> (shows why)',
        'Reinstall Linux',
        'Guess and retry'
      ],
      answer: 1,
      explain: 'Status first, journal second, fix third - you almost never have to guess.'
    }
  ],

  // -- Load & Performance Testing -------------------------------------------
  'load-and-performance-testing/1': [
    {
      q: 'Load testing answers a different question than correctness tests:',
      choices: [
        'Is it correct? vs is it pretty?',
        "'Is it correct?' (unit/e2e tests, one path) vs 'does it hold under a crowd?' (load test, many at once)",
        'Both ask the same thing',
        'Is it cheap? vs is it fast?'
      ],
      answer: 1,
      explain: 'Correct code falls over because a shared finite resource (connections, memory) is exhausted by a crowd.'
    },
    {
      q: "A load test's purpose is to...",
      choices: [
        'Give a pass/fail checkmark like a unit test',
        'Learn your real capacity, how it behaves at the edge, and whether it stays healthy over time',
        'Find the exact buggy line of code',
        'Replace your unit tests'
      ],
      answer: 1,
      explain: 'Load testing finds the symptom (it breaks at N users); profiling finds the cause.'
    }
  ],
  'load-and-performance-testing/2': [
    {
      q: 'Why read latency percentiles (p95/p99) instead of the average?',
      choices: [
        'Percentiles are easier to compute',
        'The average hides the slow tail - the p99 is the felt experience of your unluckiest real users',
        'Averages are deprecated',
        'They are the same number'
      ],
      answer: 1,
      explain: 'A user who waited 5 seconds is not comforted that the average was 100 ms.'
    },
    {
      q: 'The three metrics to read together are...',
      choices: [
        'CPU, RAM, and disk',
        'Throughput (work per second), latency percentiles (how it feels), and error rate (is it still working?)',
        'Cost, speed, and uptime',
        'Users, sessions, and clicks'
      ],
      answer: 1,
      explain: 'Four test shapes use one tool: load, stress, soak, and spike.'
    }
  ],
  'load-and-performance-testing/3': [
    {
      q: 'Why ramp load up gradually instead of slamming all users in at once?',
      choices: [
        'It is gentler on the server',
        'A gradual ramp lets you see the breaking point arrive and read the exact level where it turns',
        'Slamming is impossible',
        'To save money'
      ],
      answer: 1,
      explain: 'Slamming everyone in at once is a spike test; for finding capacity, you ramp.'
    },
    {
      q: "The 'knee' (breaking point) is where...",
      choices: [
        'The test starts',
        'Throughput flattens, latency curves sharply up, and errors begin to climb - your honest capacity',
        'The test ends',
        'Users first log in'
      ],
      answer: 1,
      explain: 'Test like production (data volume, environment, varied inputs) or the numbers are confident fiction.'
    }
  ],
  // -- Load Balancers & nginx -----------------------------------------------
  'load-balancers-and-nginx/1': [
    {
      q: 'A reverse proxy is...',
      choices: [
        'A proxy that sits in front of clients',
        'A server in front of your app that receives every request and forwards it to the app',
        'A database',
        'Only a CDN'
      ],
      answer: 1,
      explain: 'TLS, serving static files, one public entry point, and hiding/centralizing all live at the proxy.'
    },
    {
      q: 'The classic reverse-proxy gotcha is that, after forwarding, your app sees the client IP as...',
      choices: [
        'The real visitor',
        "nginx itself (127.0.0.1) - unless you pass X-Forwarded-For/X-Real-IP and configure the app to trust them",
        'The DNS server',
        'A random address'
      ],
      answer: 1,
      explain: 'Otherwise every request looks like it came from your own server, breaking rate limits and logs.'
    }
  ],
  'load-balancers-and-nginx/2': [
    {
      q: 'Load balancing requires your app to be...',
      choices: [
        'Stateful',
        "Stateless - any instance can handle any request, so shared state goes in a database/cache, not one instance's memory",
        'Single-threaded',
        'Written in a specific language'
      ],
      answer: 1,
      explain: 'Otherwise a user sent to a different instance loses their session or cart.'
    },
    {
      q: "nginx's default load-balancing strategy is...",
      choices: [
        'least_conn',
        'Round-robin (even rotation); reach for least_conn when request times vary a lot',
        'Random',
        'IP hash'
      ],
      answer: 1,
      explain: 'Passive health checks (max_fails/fail_timeout) route around a failing instance.'
    }
  ],
  'load-balancers-and-nginx/3': [
    {
      q: 'TLS termination means...',
      choices: [
        'The app handles certificates itself',
        'nginx ends the HTTPS connection and forwards plain HTTP to the app, which never deals with certificates',
        'HTTPS is disabled',
        'The app encrypts every response'
      ],
      answer: 1,
      explain: 'Pass X-Forwarded-Proto so the app knows it was HTTPS, or risk an endless redirect loop.'
    },
    {
      q: 'The safe way to apply an nginx config change is...',
      choices: [
        'Restart immediately',
        'Test with nginx -t, then nginx -s reload (no dropped connections) - reload for config, restart only when you must',
        'Edit and hope',
        'Delete and recreate the config'
      ],
      answer: 1,
      explain: 'A typo in the config can take the whole site down; test first, every time.'
    }
  ],

  // -- macOS Under the Hood -------------------------------------------------
  'macos-under-the-hood/1': [
    {
      q: 'macOS is...',
      choices: [
        'Unix-like as a marketing word only',
        "A real Unix system: Apple's open-source core is Darwin, with the XNU kernel",
        'The same as Linux underneath',
        'Based on Windows'
      ],
      answer: 1,
      explain: "macOS and Linux are Unix siblings with different kernels - terminals feel alike, but binaries don't transfer."
    },
    {
      q: 'On a Mac, your home folder is at...',
      choices: [
        '/home/you, like Linux',
        "/Users/you - the friendly 'Home' Finder shows, in its true Unix path",
        'C:\\Users\\you',
        '/root'
      ],
      answer: 1,
      explain: 'Copying a Linux script that writes to /home/you fails on a Mac - that path does not exist.'
    }
  ],
  'macos-under-the-hood/2': [
    {
      q: 'A .app on macOS is...',
      choices: [
        'A single executable file',
        "Actually a folder (a 'bundle') holding the executable, resources, and Info.plist",
        'A compressed archive',
        'A shortcut'
      ],
      answer: 1,
      explain: 'Installing = copy to /Applications; uninstalling = drag to trash. Settings live separately in ~/Library.'
    },
    {
      q: 'Your personal app settings live in...',
      choices: [
        '/System/Library',
        '~/Library (hidden by default) - Preferences/ (.plist files), Application Support/, and Caches/',
        '/Applications',
        'Inside the app bundle'
      ],
      answer: 1,
      explain: "That's why reinstalling an app doesn't fix corrupted settings - the settings are elsewhere."
    }
  ],
  'macos-under-the-hood/3': [
    {
      q: 'On a modern Mac, the default shell is...',
      choices: [
        'bash, configured via ~/.bashrc',
        'zsh, configured via ~/.zshrc (not ~/.bashrc)',
        'fish',
        'cmd'
      ],
      answer: 1,
      explain: 'Editing ~/.bashrc and wondering why nothing changes is a classic first-week Mac mistake.'
    },
    {
      q: 'launchd is...',
      choices: [
        'A text editor',
        "macOS's service manager (PID 1) - the counterpart to Linux's systemd",
        'A package manager',
        'The kernel'
      ],
      answer: 1,
      explain: 'It starts and supervises background services, even while the rest of the Mac runs.'
    }
  ],

  // -- Memory & Garbage Collection ------------------------------------------
  'memory-and-garbage-collection/1': [
    {
      q: 'Objects live on the heap (rather than the stack) because...',
      choices: [
        'The heap is faster',
        'They need to outlive the function that created them; the stack frame dies when the function returns',
        "The stack can't hold objects",
        'It is random'
      ],
      answer: 1,
      explain: 'A variable on the stack often holds a pointer to an object living on the heap.'
    },
    {
      q: 'The hard problem with heap memory is...',
      choices: [
        'Allocating it',
        "Knowing when it's safe to reclaim - too early causes use-after-free (a dangling pointer), too late causes a leak",
        'Reading it',
        'Naming it'
      ],
      answer: 1,
      explain: 'How a language answers "is anyone still using this?" defines whole families of languages.'
    }
  ],
  'memory-and-garbage-collection/2': [
    {
      q: 'Manual memory (C/C++) versus garbage collection is a trade of...',
      choices: [
        'Speed vs nothing',
        'Control vs safety - manual gives total control but footguns (leaks, use-after-free); GC removes those bugs at the cost of pauses and less control',
        'Old vs new',
        'Cost vs free'
      ],
      answer: 1,
      explain: 'The right choice is a property of the problem, not a measure of skill.'
    },
    {
      q: "Rust's ownership is a third way that...",
      choices: [
        'Uses a garbage collector',
        'Gets memory safety with no GC - the compiler proves at build time when each value can be freed',
        'Is just manual memory',
        'Ignores the problem'
      ],
      answer: 1,
      explain: 'Use-after-free is caught before the program ever runs - paid for with a stricter compiler.'
    }
  ],
  'memory-and-garbage-collection/3': [
    {
      q: 'A garbage collector decides what to reclaim based on...',
      choices: [
        "What you're done with",
        'Reachability - can the program still reach the object from a root? If not, it is garbage',
        'Object age only',
        'File size'
      ],
      answer: 1,
      explain: 'Mark-and-sweep: trace from the roots, mark everything reachable, sweep away the rest.'
    },
    {
      q: 'Memory leaks still happen in GC languages because...',
      choices: [
        'The GC is broken',
        "You forgot to let go - a live reference (an ever-growing cache, a forgotten listener) keeps an object reachable",
        'The heap is too small',
        'Of use-after-free'
      ],
      answer: 1,
      explain: 'The tell is resident memory that climbs and never comes back down; the cure is releasing references.'
    }
  ],

  // -- ML Basics for Data People --------------------------------------------
  'ml-basics-for-data-people/1': [
    {
      q: 'The core shift of machine learning is...',
      choices: [
        'Faster computers',
        'From you writing the rules to handing the computer historical examples and letting it learn the patterns (producing a model)',
        'Bigger databases',
        'Using SQL'
      ],
      answer: 1,
      explain: "The model finds correlations; it doesn't truly 'understand', so it's only as good as the examples."
    },
    {
      q: 'Supervised learning needs...',
      choices: [
        'No data',
        'Historical examples WITH known answers (labels); classification predicts a category, regression predicts a number',
        'Only unlabeled data',
        'A neural network'
      ],
      answer: 1,
      explain: 'Unsupervised learning (e.g. clustering) finds structure when there is no answer key.'
    }
  ],
  'ml-basics-for-data-people/2': [
    {
      q: 'Why split data into a training set and a hidden test set?',
      choices: [
        'To train faster',
        'So you measure on data the model never saw - the only honest gauge of real-world performance',
        'To save disk space',
        'Just tradition'
      ],
      answer: 1,
      explain: 'The test set is sacred - judge yourself on it once; do not tune against it.'
    },
    {
      q: 'Why can accuracy mislead on rare events (like fraud)?',
      choices: [
        'It is hard to compute',
        "A model that always says 'not fraud' scores high accuracy but catches zero fraud - use precision and recall instead",
        'Accuracy is deprecated',
        'It is always wrong'
      ],
      answer: 1,
      explain: 'Precision = few false alarms; recall = few misses; the right balance depends on what a mistake costs.'
    }
  ],
  'ml-basics-for-data-people/3': [
    {
      q: 'The decisive bottleneck in real ML projects is usually...',
      choices: [
        'A smarter algorithm',
        'The data - messy inputs, weak features, broken pipelines, or leakage; the model is the easy part',
        'Faster GPUs',
        'More RAM'
      ],
      answer: 1,
      explain: 'Garbage in, garbage out: a model faithfully learns whatever is in the data, including the mistakes.'
    },
    {
      q: 'Data leakage is...',
      choices: [
        'Losing data',
        'A feature that is only known AFTER the outcome sneaking into training, so the model looks brilliant in testing and fails in production',
        'A memory leak',
        'A security breach'
      ],
      answer: 1,
      explain: 'Suspiciously good results should make you check for leakage first, not assume genius.'
    }
  ],

  // -- Mocking & Test Doubles -----------------------------------------------
  'mocking-and-test-doubles/1': [
    {
      q: 'You replace a real dependency with a test double when keeping it real would make the test...',
      choices: [
        'Shorter',
        'Slow, unreliable, expensive/irreversible, or impossible to set up (like forcing an API to fail on demand)',
        'Longer',
        'Pass automatically'
      ],
      answer: 1,
      explain: 'Faking works because your code depends on a shape (an interface), not a specific object.'
    },
    {
      q: "Which is also a dependency worth faking, even though it doesn't look like one?",
      choices: [
        'A local variable',
        'The clock (new Date()) and randomness - code using them silently depends on when the test runs',
        'A constant',
        'A loop'
      ],
      answer: 1,
      explain: 'A "this coupon is expired" test passes today and fails in the future unless you fake time.'
    }
  ],
  'mocking-and-test-doubles/2': [
    {
      q: 'A stub versus a mock:',
      choices: [
        'They are identical',
        'A stub returns canned answers to FEED your code a situation; a mock also pre-declares how it must be called and fails the test itself if you do not',
        'A mock is simpler',
        'A stub verifies the calls'
      ],
      answer: 1,
      explain: 'The dividing line: dummy/stub/fake provide inputs; spy/mock verify interactions.'
    },
    {
      q: "A 'fake' is...",
      choices: [
        'An empty placeholder object',
        'A real, working, lightweight implementation (like an in-memory database) - genuine logic and state',
        'A canned answer',
        'An assertion'
      ],
      answer: 1,
      explain: 'Reach for a fake when a stub would need so many canned answers it stops being simpler.'
    }
  ],
  'mocking-and-test-doubles/3': [
    {
      q: 'The rule that prevents most mocking pain is...',
      choices: [
        'Mock everything',
        'Mock at the boundary (external systems), not inside it - use the real thing for your own code',
        'Never use doubles',
        'Only mock the database'
      ],
      answer: 1,
      explain: 'When your service calls your validator, let it call the real one - that interaction is what you test.'
    },
    {
      q: 'Over-mocking produces lying tests because...',
      choices: [
        'Tests run slower',
        'A mock freezes your belief about a dependency - it can stay green while the real dependency changed and production breaks',
        'Mocks delete data',
        'It uses more memory'
      ],
      answer: 1,
      explain: 'Walk the ladder: real object -> fake -> stub -> mock; doubles thin out up the testing pyramid.'
    }
  ],

  // -- Monolith vs Microservices --------------------------------------------
  'monolith-vs-microservices/1': [
    {
      q: 'A monolith is...',
      choices: [
        'Messy, tangled code',
        'One application built, deployed, and run as a single unit - the defining trait is the deploy unit, not code quality',
        'Always a bad idea',
        'Many small services'
      ],
      answer: 1,
      explain: 'Real strengths: simple to run, one stack trace to debug, easy DB transactions, safe cross-feature refactoring.'
    },
    {
      q: 'Where does a monolith genuinely strain?',
      choices: [
        'Small teams',
        'When one big team shares one deploy, and when one part needs very different scaling from the rest',
        'Reading logs',
        'Database transactions'
      ],
      answer: 1,
      explain: 'Most "monolith pain" is tangled code, not the monolith itself - splitting tangled code makes it worse.'
    }
  ],
  'monolith-vs-microservices/2': [
    {
      q: 'The defining change with microservices is...',
      choices: [
        'Smaller folders',
        'The calls between pieces become network calls between separately-deployed programs - the source of every benefit and cost',
        'Using more languages',
        'Faster code'
      ],
      answer: 1,
      explain: 'Real wins: independent scaling, independent deploys/team autonomy, and fault isolation.'
    },
    {
      q: 'A cost microservices add that a monolith never had is...',
      choices: [
        'Slower compiles',
        'No single transaction can span services - you build consistency yourself (sagas, retries, eventual consistency)',
        'More folders',
        'Fewer log files'
      ],
      answer: 1,
      explain: 'Also: network calls can vanish silently, debugging is distributed (correlation IDs), ops overhead multiplies.'
    }
  ],
  'monolith-vs-microservices/3': [
    {
      q: 'The honest default for most teams is...',
      choices: [
        'Microservices from day one',
        'Start with a well-structured (modular) monolith, keeping clean seams to split later if a specific pain appears',
        'No architecture at all',
        'Serverless everything'
      ],
      answer: 1,
      explain: 'A monolith is not a one-way door; clean module boundaries are the seams you cut along later.'
    },
    {
      q: "A 'distributed monolith' is...",
      choices: [
        'A very large monolith',
        'Services that are still tightly coupled (deploy together, share a database) - all the costs of microservices, none of the benefits',
        'A fast monolith',
        'A backup system'
      ],
      answer: 1,
      explain: 'Split out a service for a specific named pain (scaling, autonomy, fault isolation); do not migrate as a goal.'
    }
  ],

  // -- Observability: Logs, Metrics, Traces ---------------------------------
  'observability-logs-metrics-traces/1': [
    {
      q: 'Monitoring versus observability:',
      choices: [
        'They are the same thing',
        'Monitoring watches known things against known thresholds (questions you prepared for); observability lets you ask NEW questions of the data the system already emits',
        'Observability is just nicer dashboards',
        'Monitoring is the newer term'
      ],
      answer: 1,
      explain: "The painful outages are 'unknown unknowns', which monitoring alone can't explain."
    },
    {
      q: 'A green dashboard means...',
      choices: [
        'Everything is healthy',
        'No KNOWN alarm is firing - not that nothing is wrong',
        'The system is fully observable',
        'Nothing at all'
      ],
      answer: 1,
      explain: 'The most dangerous outage is the one your dashboards are silent about because nobody predicted it.'
    }
  ],
  'observability-logs-metrics-traces/2': [
    {
      q: 'The three pillars answer different shapes of question:',
      choices: [
        "They all answer 'why'",
        'Logs = what happened (one event), metrics = how much/how often (numbers over time), traces = where the time went (one request across services)',
        'Logs are the only one you need',
        'They are interchangeable'
      ],
      answer: 1,
      explain: 'Reaching for the right pillar on instinct is the whole skill.'
    },
    {
      q: 'For latency, you usually want which metric type?',
      choices: [
        'A counter',
        'A histogram - it gives distributions and percentiles (p95/p99); averages hide the slow tail',
        'A gauge',
        'A log line'
      ],
      answer: 1,
      explain: 'Counters only go up; gauges are "right now"; histograms capture the shape of latency.'
    }
  ],
  'observability-logs-metrics-traces/3': [
    {
      q: 'The debugging chain (the order to reach for the pillars) is...',
      choices: [
        'Log, then metric, then trace',
        'Metric (that it is wrong) -> trace (where the time went) -> log (why)',
        'Trace first, always',
        'Whichever is fastest to open'
      ],
      answer: 1,
      explain: 'Each pillar hands off to the next, zooming from "something is wrong" down to one line of detail.'
    },
    {
      q: 'What stitches a log, a trace, and a metric together for one request?',
      choices: [
        'The timestamp alone',
        'A shared trace_id (correlation ID) attached to the request as it crosses services',
        'The service name',
        'Nothing - they stay separate'
      ],
      answer: 1,
      explain: 'You search logs by the trace_id to find the exact request a slow span belongs to.'
    }
  ],

  // -- OOP vs Functional ----------------------------------------------------
  'oop-vs-functional/1': [
    {
      q: 'The core idea of OOP is...',
      choices: [
        'Inheritance',
        'Bundling data together with the behavior that acts on it, into objects (made from classes)',
        'Writing everything as pure functions',
        'Avoiding all state'
      ],
      answer: 1,
      explain: 'Encapsulation hides internals; polymorphism lets many types answer the same call their own way.'
    },
    {
      q: 'The classic OOP trap is...',
      choices: [
        'Too few classes',
        "Inheritance overuse (deep chains, fake 'is-a' relationships) - the guideline is 'favor composition over inheritance'",
        'Using encapsulation',
        'Using polymorphism'
      ],
      answer: 1,
      explain: 'Use inheritance only for genuine, lasting "is-a" relationships, and keep the chains shallow.'
    }
  ],
  'oop-vs-functional/2': [
    {
      q: 'A pure function...',
      choices: [
        'Prints to the screen',
        'Returns the same output for the same input and has no side effects - which makes it trivial to test',
        'Reads and updates a global',
        'Mutates its arguments'
      ],
      answer: 1,
      explain: "You can't make everything pure - push side effects to the edges, keep a large pure core."
    },
    {
      q: 'Immutability means...',
      choices: [
        "Variables can't be named",
        "You don't change data in place; you return a new value, so nothing changes under anyone's feet",
        'Data is encrypted',
        'All functions are constants'
      ],
      answer: 1,
      explain: 'It removes a whole category of "who changed this?" bugs and makes safe concurrency possible.'
    }
  ],
  'oop-vs-functional/3': [
    {
      q: 'How should you choose between OOP and FP?',
      choices: [
        'Pick one for life',
        'You usually don\'t choose - most languages are multi-paradigm; use objects for stateful entities and pure functions for transforming data',
        'FP is always better',
        'OOP is obsolete'
      ],
      answer: 1,
      explain: 'Healthy codebases mix them: objects at stateful boundaries, pure functions for the logic between.'
    },
    {
      q: 'Functional programming especially shines at...',
      choices: [
        'Modeling stateful entities with identity',
        'Transforming data, concurrency (immutable data is safe to share), and testability (pure functions need no setup)',
        'Deep inheritance hierarchies',
        'Hiding mutable state'
      ],
      answer: 1,
      explain: 'OOP, by contrast, shines at modeling stateful things and giving large teams a clear structure.'
    }
  ],

  // -- Optimizing Real Systems ----------------------------------------------
  'optimizing-real-systems/1': [
    {
      q: 'The biggest mistake in optimization is...',
      choices: [
        'Using the wrong language',
        "Optimizing with no baseline and no target - you can't prove a change helped or know when to stop",
        'Writing too few tests',
        'Reading too many logs'
      ],
      answer: 1,
      explain: 'Set a target first; it defines "done" and gives you permission to stop.'
    },
    {
      q: 'Amdahl\'s law says you should...',
      choices: [
        'Optimize everything equally',
        'Attack the bottleneck (the largest share of time) - optimizing a 5% component caps the win at 5%',
        'Optimize the smallest part',
        'Always rewrite in C'
      ],
      answer: 1,
      explain: 'Change one thing per loop so the re-measurement actually means something.'
    }
  ],
  'optimizing-real-systems/2': [
    {
      q: 'In a data-backed web system, the bottleneck is most often...',
      choices: [
        'Your CPU-bound code',
        'At a boundary - usually the database (N+1 queries, missing indexes), then network, then I/O; CPU comes last',
        'The programming language',
        'Available memory'
      ],
      answer: 1,
      explain: 'The CPU is mostly waiting on the database, network, and disk - count your queries first.'
    },
    {
      q: 'The biggest optimization lever is...',
      choices: [
        'A faster CPU',
        'Doing less work - caching deletes the work rather than speeding it up (at the cost of freshness)',
        'More threads',
        'Micro-optimizing loops'
      ],
      answer: 1,
      explain: 'Batching, pagination, and reuse all follow the same idea: the fastest work is the work you avoid.'
    }
  ],
  'optimizing-real-systems/3': [
    {
      q: 'Why watch percentiles (p95/p99) instead of averages in production?',
      choices: [
        'They are easier to read',
        'The average hides the slow tail - p95/p99 are what your unluckiest real users actually feel',
        'Averages are deprecated',
        'They are the same thing'
      ],
      answer: 1,
      explain: 'A benchmark is a hypothesis; verify in production behind a flag or canary, on real traffic.'
    },
    {
      q: 'A measured speedup can still be a net loss if you...',
      choices: [
        'Use a profiler',
        'Trade away correctness or readability for speed nobody needed, or fix the wrong layer (symptom, not cause)',
        'Set a target',
        'Measure a baseline'
      ],
      answer: 1,
      explain: 'Once you hit the target, stop - a deferred bug or unreadable code outweighs a millisecond no one asked for.'
    }
  ],

  // -- OWASP Top 10 ---------------------------------------------------------
  'owasp-top-10/1': [
    {
      q: 'The OWASP Top 10 is...',
      choices: [
        'A software product you buy',
        'A free list of the ten broad CATEGORIES of risk that most commonly and seriously affect web apps',
        'A certification you pass',
        'A government regulation'
      ],
      answer: 1,
      explain: 'OWASP is the nonprofit organization; the Top 10 is one document it publishes.'
    },
    {
      q: 'The Top 10 lists broad categories rather than specific bugs because...',
      choices: [
        'It is lazy',
        'Specific bugs come and go, but the underlying mistakes repeat across every framework and decade',
        'There are only ten bugs total',
        'Bugs are kept secret'
      ],
      answer: 1,
      explain: 'It gives the whole industry a shared checklist and shared vocabulary.'
    }
  ],
  'owasp-top-10/2': [
    {
      q: 'Broken Access Control is...',
      choices: [
        'Failing to log in',
        "You're correctly logged in, but the app lets you reach data or actions that aren't yours - authorization failing",
        'Weak encryption',
        'A network flood'
      ],
      answer: 1,
      explain: 'Check authorization on the SERVER for every request; hiding a UI button is not access control.'
    },
    {
      q: 'Injection (SQL injection, XSS) happens when...',
      choices: [
        'Passwords are weak',
        'Untrusted input is treated as code instead of content; the fix is parameterized queries and output encoding',
        'Dependencies are outdated',
        'The server is misconfigured'
      ],
      answer: 1,
      explain: 'Never build a query or command by gluing strings together with user input.'
    }
  ],
  'owasp-top-10/3': [
    {
      q: 'The Top 10 should be treated as...',
      choices: [
        'A final exam you pass once',
        'A living checklist threaded into design, code review, and dependency updates - a floor, not a ceiling',
        'A guarantee of security',
        'Optional reading'
      ],
      answer: 1,
      explain: '"We checked the Top 10" means you covered the usual suspects, not that you are secure.'
    },
    {
      q: 'A huge share of real breaches come through which category, fixed by the least glamorous work?',
      choices: [
        'Cryptographic Failures',
        'Vulnerable & Outdated Components - keep dependencies patched (wire a scanner like npm audit into CI)',
        'Injection',
        'SSRF'
      ],
      answer: 1,
      explain: 'Defense in depth: layer controls so no single failure is fatal.'
    }
  ],
  'processes-memory-and-cpu/1': [
    {
      q: 'What is a PID?',
      choices: [
        'A unique number the OS assigns to each running process',
        'The name of the program, like firefox',
        'The amount of memory a process uses',
        'The priority level of a process'
      ],
      answer: 0,
      explain: 'The PID is the handle every tool uses to refer to a process; the human-readable name is just a label.'
    },
    {
      q: 'What does a plain `kill <PID>` send by default, despite its scary name?',
      choices: [
        'SIGKILL, which removes the process immediately with no cleanup',
        'SIGTERM, a polite request to wrap up and exit cleanly',
        'Nothing until you add -9',
        'A signal that pauses the process'
      ],
      answer: 1,
      explain: 'Plain kill sends SIGTERM, letting the process finish writing files and close connections; SIGKILL (kill -9) is the no-cleanup nuke.'
    },
    {
      q: 'Which process state is the only one that actually burns CPU?',
      choices: [
        'Sleeping',
        'Zombie',
        'Running',
        'Waiting'
      ],
      answer: 2,
      explain: 'Sleeping processes wait using almost no CPU, and a zombie is just harmless leftover bookkeeping; only running burns CPU.'
    },
  ],
  'processes-memory-and-cpu/2': [
    {
      q: 'What does 100% CPU actually mean?',
      choices: [
        'The computer is broken and needs a restart',
        'The CPU is fully booked - doing the maximum work it can, with demand exceeding supply',
        'The memory is full',
        'A virus is running'
      ],
      answer: 1,
      explain: '100% CPU means fully booked, not broken; the useful question is who is taking it all, which you can read off a sorted list.'
    },
    {
      q: 'How should you read a load average number?',
      choices: [
        'Compare it to your number of CPU cores',
        'It should always be below 1.0',
        'Higher is always better',
        'It measures memory, not CPU'
      ],
      answer: 0,
      explain: 'Load average is roughly how many processes wanted a core; compare it to your core count - around your core count is healthy, well above means queueing.'
    },
    {
      q: 'What distinguishes a runaway process from one that is merely busy?',
      choices: [
        'A runaway uses lots of memory; a busy one uses CPU',
        'A runaway never sleeps and its work is endless and pointless; busy work is purposeful and finite',
        'There is no difference',
        'A runaway always has a low PID'
      ],
      answer: 1,
      explain: 'A video export or compile should use lots of CPU and will finish; a runaway loops forever with no progress - check before you kill -9.'
    },
  ],
  'processes-memory-and-cpu/3': [
    {
      q: 'Why does a machine low on memory feel like molasses before it says out of memory?',
      choices: [
        'The CPU overheats',
        'The OS is constantly paging memory out to the slow disk and back - thrashing',
        'The screen refresh rate drops',
        'The network slows down'
      ],
      answer: 1,
      explain: 'Long before giving up, the OS shuffles memory to disk to keep going; constant paging while you work is thrashing, and that fight is the slowness.'
    },
    {
      q: 'When hunting a memory hog, which number should you look at?',
      choices: [
        'Virtual memory (VIRT), the total address space claimed',
        'Resident memory (RES / Memory), the actual RAM used right now',
        'The PID',
        'The CPU percentage'
      ],
      answer: 1,
      explain: 'A process can claim 30 GB of virtual memory while holding under 1 GB of real RAM; resident memory is what counts toward running out.'
    },
    {
      q: 'What does the OOM killer explain?',
      choices: [
        'Why the fan spins up',
        'Why a program can vanish with no error or crash dialog',
        'Why PIDs get reused',
        'Why a process sleeps'
      ],
      answer: 1,
      explain: 'When RAM and swap are exhausted, Linux SIGKILLs a big process to survive - so it disappears with no warning; dmesg records it.'
    },
  ],
  'profiling-101/1': [
    {
      q: 'What does a profiler do?',
      choices: [
        'Guesses where your code is probably slow',
        'Watches your program run and reports where the time actually went',
        'Automatically rewrites slow functions',
        'Counts the lines of code'
      ],
      answer: 1,
      explain: 'A profiler is like an itemized receipt - it measures real execution and hands you a ranked breakdown of where time went.'
    },
    {
      q: 'Why is your intuition about the bottleneck usually unreliable?',
      choices: [
        'The expensive thing is usually boring and hidden in calls you do not see, and confidence does not mean correctness',
        'Profilers are always wrong',
        'Your code is too short to profile',
        'Intuition is actually very reliable'
      ],
      answer: 0,
      explain: 'The real cost is often a dull helper called many times, three layers down - and the strength of your conviction has no bearing on whether you are right.'
    },
    {
      q: 'What does the 80/20 rule tell you about performance work?',
      choices: [
        'You must make all your code faster',
        'A small fraction of the code accounts for most of the runtime, so find and fix the tall bar',
        '20% of bugs cause 80% of crashes',
        'Optimization is impossible'
      ],
      answer: 1,
      explain: 'Performance cost is lopsided; fix the one or two tall bars and ignore the rest - that is also how you know when to stop.'
    },
  ],
  'profiling-101/2': [
    {
      q: 'What is the difference between self time and cumulative time?',
      choices: [
        'They are the same thing',
        'Self time is a function\'s own code; cumulative time includes everything it called down the chain',
        'Self time includes called functions; cumulative does not',
        'Cumulative time is always smaller'
      ],
      answer: 1,
      explain: 'Self (exclusive) time is the work a function does with its own hands; cumulative (inclusive) time adds the work it delegated.'
    },
    {
      q: 'A function with high cumulative time but low self time is...',
      choices: [
        'The actual bottleneck to optimize',
        'A manager, not a worker - it just contains the slow thing',
        'A bug',
        'Impossible'
      ],
      answer: 1,
      explain: 'High cumulative, low self means it is slow only because something it calls is slow; chase that, and sort by self time to find the real worker.'
    },
    {
      q: 'A cheap function with a huge call count suggests which fix?',
      choices: [
        'Make each call faster',
        'Call it fewer times - move work out of the loop, batch, or cache',
        'Delete the function',
        'Add more calls'
      ],
      answer: 1,
      explain: '50,000 calls of near-zero cost still add up; the win is usually in calling it fewer times, not shaving each call.'
    },
  ],
  'profiling-101/3': [
    {
      q: 'What is the core optimization loop?',
      choices: [
        'Change everything at once and hope',
        'Measure, hypothesize the why, change one thing, re-measure against the before number',
        'Rewrite the whole module',
        'Buy faster hardware'
      ],
      answer: 1,
      explain: 'Change exactly one thing per loop so every re-measure has a clear verdict; if it did not measurably help, revert.'
    },
    {
      q: 'Across the common wins (O(n-squared), N+1 queries, repeated work), what is the recurring best fix?',
      choices: [
        'Making each unit of work faster',
        'Doing the work fewer times',
        'Adding more threads',
        'Adding more memory'
      ],
      answer: 1,
      explain: 'Squashing O(n-squared) into O(n), collapsing N+1 into one query, and caching all remove work rather than speeding it up.'
    },
    {
      q: 'Why must you profile a realistic workload?',
      choices: [
        'Dev data is faster to load',
        'An O(n-squared) bottleneck is invisible on tiny dev data and catastrophic at production scale',
        'Production data is illegal to use',
        'It does not matter what data you use'
      ],
      answer: 1,
      explain: 'A profile of an unrealistic workload is worse than none, because it is confidently wrong - the real bottleneck only wakes up at scale.'
    },
  ],
  'programming-from-zero/1': [
    {
      q: 'What is a program, at its core?',
      choices: [
        'A smart system that understands what you mean',
        'A list of instructions a computer carries out one at a time, in order, exactly as written',
        'A set of suggestions the computer interprets',
        'A spell that produces results'
      ],
      answer: 1,
      explain: 'The computer is perfectly literal - it does exactly what you wrote, never what you meant, which is what makes bugs findable.'
    },
    {
      q: 'In `print("Hello")`, what is `"Hello"` called?',
      choices: [
        'A function',
        'An argument - the value you hand to the instruction',
        'A variable',
        'A syntax error'
      ],
      answer: 1,
      explain: 'Running an instruction like print(...) is calling it, and the value in the parentheses is the argument it works with.'
    },
    {
      q: 'What is a syntax error?',
      choices: [
        'A wrong answer from a correct program',
        'Code that broke the language\'s grammar rules, so the computer cannot even run it',
        'A slow program',
        'A missing file'
      ],
      answer: 1,
      explain: 'A missing quote or parenthesis breaks the grammar; the error message points at the file, line, and roughly where the problem is.'
    },
  ],
  'programming-from-zero/2': [
    {
      q: 'What is a variable?',
      choices: [
        'A fixed value that never changes',
        'A name attached to a value so you can refer to it later',
        'A type of error',
        'A kind of function'
      ],
      answer: 1,
      explain: 'Picture a labeled box: you put a value in and refer to it by name; the value can be replaced later, which is why it is variable.'
    },
    {
      q: 'Why does `"2" + "2"` give `"22"` instead of `4`?',
      choices: [
        'It is a bug in Python',
        'The values are strings (text), so + glues them together instead of adding',
        'The quotes are optional',
        'Strings cannot be added'
      ],
      answer: 1,
      explain: 'Type changes what an operator does: with numbers + adds, with strings it concatenates - which is why type is not a fussy detail.'
    },
    {
      q: 'What is the difference between `=` and `==`?',
      choices: [
        'They are interchangeable',
        '`=` assigns a value to a variable; `==` compares two values and produces a boolean',
        '`=` compares; `==` assigns',
        'Both compare values'
      ],
      answer: 1,
      explain: 'Plain = means set this to that; the doubled == asks is this equal to that - mixing them up is the most common beginner bug.'
    },
  ],
  'programming-from-zero/3': [
    {
      q: 'In an if/elif/else chain, which branch runs?',
      choices: [
        'All branches whose conditions are true',
        'The first branch whose condition is true, then the rest are skipped',
        'Only the else branch',
        'The last true branch'
      ],
      answer: 1,
      explain: 'First match wins and stops, so exactly one branch runs - which is why you order the conditions carefully.'
    },
    {
      q: 'What does `range(1, 6)` produce?',
      choices: [
        '1, 2, 3, 4, 5, 6',
        '1, 2, 3, 4, 5',
        '0, 1, 2, 3, 4, 5',
        '1 through 6 inclusive'
      ],
      answer: 1,
      explain: 'range(start, stop) includes start but stops before stop, so range(1, 6) gives 1 through 5 - the off-by-one that catches everyone.'
    },
    {
      q: 'What is the difference between `print` and `return` in a function?',
      choices: [
        'They do the same thing',
        'print shows a value to a human; return hands a value back to the program to keep using',
        'return shows text on screen; print gives a value back',
        'Both display text'
      ],
      answer: 1,
      explain: 'A function that prints its answer but does not return it cannot have that answer used in the next calculation - the value was shown then thrown away.'
    },
  ],
  'prometheus-and-grafana/1': [
    {
      q: 'What is the division of labor between Prometheus and Grafana?',
      choices: [
        'Grafana stores metrics; Prometheus draws them',
        'Prometheus collects and stores the metrics; Grafana queries and displays them',
        'They both store and display metrics independently',
        'Prometheus is just a backup for Grafana'
      ],
      answer: 1,
      explain: 'Prometheus holds the truth (the stored numbers); Grafana is a window onto it - delete Grafana and your data is fine.'
    },
    {
      q: 'How does Prometheus get metrics from your services?',
      choices: [
        'Services push metrics to Prometheus',
        'Prometheus pulls - it scrapes a text /metrics page from each target on a timer',
        'It reads them from a log file',
        'It queries a SQL database'
      ],
      answer: 1,
      explain: 'Prometheus visits each scrape target on a schedule and reads the /metrics page, which gives it a free is-it-up signal too.'
    },
    {
      q: 'A Grafana panel shows "No data" during an incident. What is the right first thought?',
      choices: [
        'Grafana lost the metrics',
        'The query found nothing in Prometheus, or the data source is misconfigured - the data lives in Prometheus',
        'Prometheus deleted the dashboard',
        'The panel needs to be rebuilt'
      ],
      answer: 1,
      explain: 'Grafana stores no metrics; check whether Prometheus is actually scraping that target before blaming the picture.'
    },
  ],
  'prometheus-and-grafana/2': [
    {
      q: 'What is a counter metric?',
      choices: [
        'A number that goes up and down, like current memory',
        'A number that only ever goes up, resetting only on process restart',
        'A bucketed distribution of values',
        'A yes/no value'
      ],
      answer: 1,
      explain: 'A counter climbs from zero; on its own the raw value (total ever) is nearly useless - you care how fast it is climbing.'
    },
    {
      q: 'Why do you wrap a counter in `rate()` instead of graphing it raw?',
      choices: [
        'To save storage',
        'rate() turns total-ever into per-second-now, revealing the actual traffic shape a raw climbing line hides',
        'Raw counters cannot be graphed',
        'rate() makes the line go up and to the right'
      ],
      answer: 1,
      explain: 'A raw counter always rises, hiding the signal in its slope; rate() does the differencing and also handles counter resets for you.'
    },
    {
      q: 'Why must you avoid putting unbounded values like user IDs in a label?',
      choices: [
        'Labels must be numbers',
        'Each distinct label combination is a new time series, so unbounded values cause a cardinality explosion that can take Prometheus down',
        'Labels are case-sensitive',
        'It makes queries shorter'
      ],
      answer: 1,
      explain: 'Labels are for small, bounded value sets (method, status code); a user ID or full URL generates millions of series.'
    },
  ],
  'prometheus-and-grafana/3': [
    {
      q: 'What should a good dashboard panel start from?',
      choices: [
        'A metric you want to display',
        'A specific question it exists to answer',
        'As many metrics as possible',
        'The default template'
      ],
      answer: 1,
      explain: 'Finish the sentence this panel exists so I can tell whether ___; if you cannot fill the blank, do not add the panel.'
    },
    {
      q: 'The RED method (Rate, Errors, Duration) is for charting what?',
      choices: [
        'Resources that get consumed, like CPU and disk',
        'Request-driven services, like an API or web app',
        'Database tables',
        'Network cables'
      ],
      answer: 1,
      explain: 'RED is for things that serve requests; USE (Utilization, Saturation, Errors) is for resources that get consumed - pick the right lens.'
    },
    {
      q: 'What is alert fatigue and why does it matter?',
      choices: [
        'Alerts that fire too slowly',
        'Too many noisy, non-actionable alerts make people mute the channel - then they miss the real incident',
        'When Prometheus runs out of memory',
        'A dashboard with too few panels'
      ],
      answer: 1,
      explain: 'Alert on symptoms not causes, make every page actionable, and use for: generously - alert fatigue is how monitoring dies.'
    },
  ],
  'prompt-engineering-honestly/1': [
    {
      q: 'What is a language model fundamentally doing?',
      choices: [
        'Looking up facts in a database',
        'Predicting the most plausible text that comes next, given your input',
        'Choosing whether to be helpful or lazy',
        'Reasoning like a human expert'
      ],
      answer: 1,
      explain: 'There is no hidden good mode to unlock with magic words; change the text and you change the most likely continuation.'
    },
    {
      q: 'Why does a vague prompt produce a generic answer?',
      choices: [
        'The model is being lazy',
        'An open-ended request gives nothing to aim at, so the safest, most generic continuation fits best',
        'Vague prompts trigger an error',
        'The model dislikes short prompts'
      ],
      answer: 1,
      explain: 'Vague in, vague out - the model is not withholding effort; generic genuinely is the best fit for a generic request.'
    },
    {
      q: 'When an answer disappoints, what should you reach for first?',
      choices: [
        'A fancier phrase like act as a senior expert',
        'Specificity - audience, length, purpose, format',
        'A different model',
        'Repeating the request louder'
      ],
      answer: 1,
      explain: 'Nine times out of ten the answer was vague because the question was; add information that narrows the target.'
    },
  ],
  'prompt-engineering-honestly/2': [
    {
      q: 'What does giving the model a role and audience actually change?',
      choices: [
        'How much the model knows',
        'The style, framing, vocabulary, and depth of the answer - not its knowledge or accuracy',
        'Whether the answer is true',
        'Nothing at all'
      ],
      answer: 1,
      explain: 'You are a world-class cardiologist changes how the answer sounds, not whether it is true; a role nudges style, not facts.'
    },
    {
      q: 'What is few-shot prompting?',
      choices: [
        'Asking the model to be brief',
        'Showing one or two completed examples so the model picks up the pattern and continues it',
        'Running the prompt several times',
        'Giving the model a role'
      ],
      answer: 1,
      explain: 'Examples teach format and tone better than adjectives - especially when the pattern is fiddly or hard to put into words.'
    },
    {
      q: 'When does step-by-step (chain-of-thought) prompting help?',
      choices: [
        'On every task, as a universal booster',
        'On reasoning tasks like math and logic - not on simple lookups or creative writing',
        'Only on lookups',
        'Never'
      ],
      answer: 1,
      explain: 'Match the technique to the task; bolting step by step onto write me a haiku just makes it longer, not better.'
    },
  ],
  'prompt-engineering-honestly/3': [
    {
      q: 'What is the hard limit no clever prompt can overcome?',
      choices: [
        'Making the output shorter',
        'Adding knowledge the model never learned - for that, use retrieval, not rephrasing',
        'Changing the tone',
        'Asking for a list'
      ],
      answer: 1,
      explain: 'If the answer depends on your private docs or fresh news, wording it better will not conjure it; reach for RAG instead.'
    },
    {
      q: 'Why must you verify a model\'s output for anything that matters?',
      choices: [
        'The model is always wrong',
        'A good prompt makes a correct answer more likely, not certain - it predicts a plausible continuation, not a guaranteed fact',
        'Verification is required by law',
        'The model refuses to answer otherwise'
      ],
      answer: 1,
      explain: 'The same prompt can be right today and subtly wrong tomorrow; a confident, well-formatted citation can be entirely fabricated.'
    },
    {
      q: 'What is prompt injection?',
      choices: [
        'A way to speed up the model',
        'Untrusted text you include (a review, web page, email) smuggling in instructions the model may follow',
        'A formatting technique',
        'A type of fine-tuning'
      ],
      answer: 1,
      explain: 'The model cannot reliably tell your instructions from instructions hidden in the data, and the risk scales with what the model is wired to do.'
    },
  ],
  'python-from-zero/1': [
    {
      q: 'What is the Python interpreter?',
      choices: [
        'A text editor for Python',
        'The program (python or python3) that reads your .py files and executes the instructions',
        'A website for running code',
        'The standard library'
      ],
      answer: 1,
      explain: 'When people say run it in Python, they mean hand this file to the interpreter.'
    },
    {
      q: 'On macOS and Linux, what is the most common command name, and what causes command not found?',
      choices: [
        'python; a syntax error',
        'python3; a PATH problem - the interpreter is installed but the terminal cannot find it',
        'py; a missing file',
        'run; an outdated OS'
      ],
      answer: 1,
      explain: 'On macOS/Linux it is usually python3 (Windows uses python or py); not found means PATH, fixed by reinstalling with PATH enabled and opening a fresh terminal.'
    },
    {
      q: 'What is the REPL?',
      choices: [
        'A saved program file',
        'An interactive prompt that reads a line, evaluates it, prints the result, and loops - a throwaway scratchpad',
        'The Python installer',
        'A type of error'
      ],
      answer: 1,
      explain: 'REPL stands for Read-Eval-Print Loop; it forgets everything when it closes, which is why real programs live in files.'
    },
  ],
  'python-from-zero/2': [
    {
      q: 'In Python, what marks where a block of code begins and ends?',
      choices: [
        'Curly braces { }',
        'Indentation - the whitespace is the grammar, not decoration',
        'Semicolons',
        'Parentheses'
      ],
      answer: 1,
      explain: 'A : opens a block and the indented lines under it belong to it; getting it wrong is a real IndentationError, not a style nitpick.'
    },
    {
      q: 'What does `7 / 2` produce in Python, and how do you get whole-number division?',
      choices: [
        '3, an int; use / for decimals',
        '3.5, a float; use // for floor (whole-number) division',
        '3, because / truncates',
        'An error; integers cannot be divided'
      ],
      answer: 1,
      explain: 'Plain / always gives a float even when it divides evenly; // does floor division and % gives the remainder.'
    },
    {
      q: 'What does dynamic typing mean in Python?',
      choices: [
        'You must declare each variable\'s type',
        'A name can point at a value of one type now and a different type later - the value has a type, the name is just a label',
        'Python has no types',
        'Types are checked before the program runs'
      ],
      answer: 1,
      explain: 'It is flexible but has a cost: nothing stops you putting the wrong kind of value in a name, so keep each name to one kind of thing.'
    },
  ],
  'python-from-zero/3': [
    {
      q: 'Which collection is ordered and changeable, written with square brackets?',
      choices: [
        'Tuple',
        'List',
        'Dict',
        'Set'
      ],
      answer: 1,
      explain: 'A list is your default ordered sequence; it is mutable, so you can append, replace, and reorder. Index from 0, with -1 as the last.'
    },
    {
      q: 'When should you use a dict\'s `.get(key)` instead of `[key]`?',
      choices: [
        'Always - they are identical',
        'When the key might not exist - .get returns None (or a default) instead of crashing with KeyError',
        'Only for numeric keys',
        'Never; brackets are safer'
      ],
      answer: 1,
      explain: 'Looking up a missing key with [] raises KeyError; .get(key) or .get(key, default) returns gracefully.'
    },
    {
      q: 'What does `b = a` do when `a` is a list?',
      choices: [
        'Makes an independent copy of the list',
        'Makes b a second name for the same list - changing one shows through the other',
        'Creates an empty list',
        'Raises an error'
      ],
      answer: 1,
      explain: 'Assignment never copies; it makes another name for the same object. Use .copy() (or list(a)) when you need an independent list.'
    },
  ],
  'python-from-zero/4': [
    {
      q: 'In Python, which values are falsy?',
      choices: [
        'Only False',
        'Empty/zero/nothing values: 0, empty string, empty list, None',
        'Only None',
        'Negative numbers'
      ],
      answer: 1,
      explain: 'Empty or zero or nothing is falsy; everything else is truthy, so if my_list: reads as if the list has anything in it.'
    },
    {
      q: 'What is the difference between `return` and printing in a function?',
      choices: [
        'They are the same',
        'return hands a usable value back to the program; a function with no return yields None',
        'print gives a value back; return shows it on screen',
        'Both return values'
      ],
      answer: 1,
      explain: 'Printing is for showing a human; returning is for feeding the rest of your program - return what you want to reuse.'
    },
    {
      q: 'Why should you never use a mutable default argument like `def f(x, items=[]):`?',
      choices: [
        'It is a syntax error',
        'The default list is created once at definition and shared across calls, so it accumulates between calls',
        'Lists cannot be parameters',
        'It runs too slowly'
      ],
      answer: 1,
      explain: 'Default to None and build the real value inside the function; this comes straight from aliasing - the default list is one shared object.'
    },
  ],
  'python-from-zero/5': [
    {
      q: 'What is a module in Python?',
      choices: [
        'A special keyword',
        'A single .py file whose functions and variables can be imported into another file',
        'A folder of files',
        'A type of loop'
      ],
      answer: 1,
      explain: 'Writing greetings.py already makes a module named greetings; import it by name, without the .py extension.'
    },
    {
      q: 'What does `if __name__ == "__main__":` do?',
      choices: [
        'Defines a function',
        'Runs the guarded block only when the file is executed directly, not when it is imported',
        'Imports the main module',
        'Marks the file as a package'
      ],
      answer: 1,
      explain: '__name__ is "__main__" when you run the file directly but the module\'s name when imported, so importing the file stays silent.'
    },
    {
      q: 'What is the standard library?',
      choices: [
        'External packages you install with pip',
        'A large collection of ready-made modules (math, random, and more) that ship with Python - no install needed',
        'Your own modules',
        'A paid add-on'
      ],
      answer: 1,
      explain: 'Is there already a module for this? is the right first question in Python; reach for existing, tested code before writing your own.'
    },
  ],
  'python-from-zero/6': [
    {
      q: 'What is the one core idea behind classes and objects?',
      choices: [
        'Making code run faster',
        'Bundling data together with the behavior that acts on it',
        'Avoiding the use of functions',
        'Hiding code from other files'
      ],
      answer: 1,
      explain: 'A class is the blueprint and an object is one instance built from it; the data and its behavior live together in the object.'
    },
    {
      q: 'What is `self` in a method?',
      choices: [
        'A copy of the class',
        'A reference to the specific instance the method was called on - how a method reads its own data',
        'A reserved keyword you never write',
        'The parent class'
      ],
      answer: 1,
      explain: 'When you write rex.bark(), Python passes rex in as self; forget the self parameter and you get a TypeError.'
    },
    {
      q: 'What does inheritance let you do?',
      choices: [
        'Copy a class into many files',
        'Build a child class on a parent, reusing everything and overriding only what differs',
        'Delete a parent class',
        'Run two classes at once'
      ],
      answer: 1,
      explain: 'Pull common parts into a parent like Animal and let Dog override only its sound; favor it for genuine is-a relationships, sparingly.'
    },
  ],
  'python-from-zero/7': [
    {
      q: 'What does `try` / `except` do?',
      choices: [
        'Prevents all errors from ever happening',
        'Catches failures you know how to handle - and you should name the specific exception, never use a bare except:',
        'Speeds up the program',
        'Defines a function'
      ],
      answer: 1,
      explain: 'A bare except: swallows everything including bugs you did not anticipate; name the exception you actually expect.'
    },
    {
      q: 'Why use `with open(...)` to work with files?',
      choices: [
        'It makes files load faster',
        'It is a context manager that guarantees the file is closed when the block ends, even if an exception fires',
        'It is the only way to read a file',
        'It encrypts the file'
      ],
      answer: 1,
      explain: 'with does the finally-cleanup for you; just mind that "w" overwrites the file and "a" appends.'
    },
    {
      q: 'What is the Pythonic EAFP style?',
      choices: [
        'Look before you leap - check everything first',
        'Easier to Ask Forgiveness than Permission - try the operation and catch the specific failure',
        'Avoid exceptions entirely',
        'Always validate input twice'
      ],
      answer: 1,
      explain: 'EAFP avoids the race condition that check-first quietly has, where the file could vanish between the check and the open.'
    },
  ],
  'python-from-zero/8': [
    {
      q: 'What is pip?',
      choices: [
        'A code formatter',
        'Python\'s package installer - it downloads libraries from PyPI and makes them importable',
        'A test runner',
        'The interpreter'
      ],
      answer: 1,
      explain: 'Prefer python -m pip so you install into the right Python, not some other one on your PATH.'
    },
    {
      q: 'What problem does a virtual environment solve?',
      choices: [
        'It makes code run faster',
        'It gives each project its own isolated box of packages, so projects do not fight over shared library versions',
        'It encrypts your code',
        'It replaces pip'
      ],
      answer: 1,
      explain: 'Make one per project the moment you start it; the (.venv) prompt prefix is your sign you are inside the box, and the folder is disposable.'
    },
    {
      q: 'What does each of black, ruff, and pytest do?',
      choices: [
        'They all run tests',
        'black formats code, ruff lints (flags likely bugs without running), pytest runs tests',
        'black lints, ruff formats, pytest installs packages',
        'They are all the same tool'
      ],
      answer: 1,
      explain: 'A formatter changes how code looks; a linter warns about what code does; the test runner checks it works.'
    },
  ],
  'python-from-zero/9': [
    {
      q: 'What is a comprehension?',
      choices: [
        'A type of error',
        'A way to build a new collection by describing it in one expression, instead of looping and appending',
        'A comment style',
        'A kind of function'
      ],
      answer: 1,
      explain: '[n * n for n in nums] replaces a four-line loop; keep them simple - a comprehension with nested loops and two filters is worse than a plain loop.'
    },
    {
      q: 'Why use `==` rather than `is` to compare values?',
      choices: [
        'is is faster',
        'is checks whether two names point at the same object in memory, not whether their values are equal - reserve is for None',
        '== only works on strings',
        'They are identical'
      ],
      answer: 1,
      explain: 'is happens to work for small cached ints and then fails on bigger ones like 257; use == for value equality.'
    },
    {
      q: 'What does Python\'s GIL mean for threads?',
      choices: [
        'Threads make CPU-bound work twice as fast',
        'Only one thread runs Python bytecode at a time, so CPU-bound threads do not run in parallel - use multiprocessing for CPU work',
        'Threads are forbidden',
        'The GIL only affects I/O'
      ],
      answer: 1,
      explain: 'Threads are still fine for I/O-bound waiting; for CPU-bound work reach for multiprocessing or a native library.'
    },
  ],
  'python-from-zero/10': [
    {
      q: 'Which branch is for building a website or an API in Python?',
      choices: [
        'Data (NumPy, pandas)',
        'Web (Django for full apps, FastAPI for APIs)',
        'Automation',
        'Packaging'
      ],
      answer: 1,
      explain: 'Django is batteries-included for full applications; FastAPI is a lightweight framework focused on APIs.'
    },
    {
      q: 'What are pandas and NumPy for?',
      choices: [
        'Building web servers',
        'Data work - NumPy for fast numerical arrays, pandas for tables (DataFrames) you can filter, group, and join',
        'Sharing your code as a package',
        'Running tests'
      ],
      answer: 1,
      explain: 'If you have ever wished a spreadsheet were programmable, pandas (built on NumPy) is that.'
    },
    {
      q: 'What is the guide\'s honest advice for learning the next layer?',
      choices: [
        'Read every tutorial start to finish first',
        'Build something that needs it, get stuck, and look up exactly the piece you are stuck on',
        'Memorize the standard library',
        'Learn all four branches before building'
      ],
      answer: 1,
      explain: 'A project you fight through teaches you to build; pick the smallest version of the thing you want to exist and build that.'
    },
  ],
  'querying-basics-select-where/1': [
    {
      q: 'What two essential parts does a SELECT query have?',
      choices: [
        'A name and a password',
        'What you want (the columns) and where it lives (the table) - SELECT ... FROM ...',
        'A condition and a sort order',
        'An insert and a delete'
      ],
      answer: 1,
      explain: 'SELECT name, email FROM users reads almost like English: get these columns from that table.'
    },
    {
      q: 'What does `SELECT *` return, and when should you avoid it in real code?',
      choices: [
        'Only the first column; avoid it always',
        'Every column; avoid it in real code because it pulls unneeded data and can break if columns are reordered',
        'A random column; avoid it on small tables',
        'Nothing; it is only for deletes'
      ],
      answer: 1,
      explain: 'SELECT * is great for exploring by hand, but naming columns in real code is a kindness to future-you.'
    },
    {
      q: 'What is the result set of a query?',
      choices: [
        'A permanent new table in the database',
        'A temporary grid of matching rows built just to answer your question - the table is untouched',
        'The number of rows changed',
        'An error log'
      ],
      answer: 1,
      explain: 'SELECT only reads; the result set vanishes once you have read it and does not live in the database.'
    },
  ],
  'querying-basics-select-where/2': [
    {
      q: 'What does the WHERE clause do?',
      choices: [
        'Sorts the rows',
        'Keeps only the rows where a condition is true - text values go in single quotes, numbers do not',
        'Limits how many rows come back',
        'Adds new rows'
      ],
      answer: 1,
      explain: 'WHERE is the difference between all users and the users you care about; WHERE city = \'London\' keeps only the matching rows.'
    },
    {
      q: 'How do you correctly test for a missing (NULL) value?',
      choices: [
        'WHERE email = NULL',
        'WHERE email IS NULL - NULL is not equal to anything, so = NULL silently returns no rows',
        'WHERE email == NULL',
        'WHERE email = \'\''
      ],
      answer: 1,
      explain: 'Because NULL means unknown, any = comparison with it is unknown and matches nothing; use IS NULL / IS NOT NULL.'
    },
    {
      q: 'Why does LIMIT almost always travel with ORDER BY?',
      choices: [
        'LIMIT requires ORDER BY to run',
        'LIMIT takes the first n rows of whatever order you established, so without ORDER BY the first n is meaningless',
        'ORDER BY is faster with LIMIT',
        'They are the same clause'
      ],
      answer: 1,
      explain: 'Without ORDER BY, rows come back in any order the database finds convenient, so a meaningful top N needs both.'
    },
  ],
  'querying-basics-select-where/3': [
    {
      q: 'What is the career-defining gotcha with UPDATE and DELETE?',
      choices: [
        'They are too slow on big tables',
        'With no WHERE clause they hit every row - rewriting or erasing the whole table, with no confirmation prompt',
        'They require a password',
        'They only work inside transactions'
      ],
      answer: 1,
      explain: 'SQL does exactly what you tell it; the fix is the WHERE-first habit - and run a SELECT with the same WHERE to preview the rows.'
    },
    {
      q: 'What is a transaction?',
      choices: [
        'A single SELECT query',
        'A group of changes treated as one all-or-nothing unit - BEGIN, then COMMIT to keep or ROLLBACK to undo',
        'A backup of the database',
        'A type of index'
      ],
      answer: 1,
      explain: 'Wrap a risky change in BEGIN, run it, SELECT to verify, then COMMIT or ROLLBACK - it turns oh no into phew.'
    },
    {
      q: 'When does a transaction stop protecting you?',
      choices: [
        'As soon as you type BEGIN',
        'Once you COMMIT - the change is permanent and ROLLBACK can no longer help',
        'It never stops protecting you',
        'After one minute'
      ],
      answer: 1,
      explain: 'Many tools autocommit each statement unless you BEGIN first, so the protection is not automatic; when it matters, type BEGIN.'
    },
  ],
  'rag-explained/1': [
    {
      q: 'Why does an LLM on its own hallucinate facts about your company?',
      choices: [
        'It is deliberately lying',
        'It only knows its fixed training data and fills gaps by inventing plausible-sounding text rather than saying it does not know',
        'It is connected to the wrong database',
        'It runs out of memory'
      ],
      answer: 1,
      explain: 'Its knowledge is stale and generic, with no live connection to your files; when it does not know, it produces the most plausible-sounding answer.'
    },
    {
      q: 'What does RAG stand for, and what is the core idea?',
      choices: [
        'Rapid Answer Generation - answer faster',
        'Retrieval-Augmented Generation - fetch the relevant facts, add them to the prompt, then let the model generate from them',
        'Random Access Grouping - shuffle the data',
        'Recall And Guess - rely on memory'
      ],
      answer: 1,
      explain: 'Stop relying on the model\'s memory; the mental model is an open-book exam - you look up the page, the model reads it and answers.'
    },
    {
      q: 'Why use retrieval instead of retraining the model on your data?',
      choices: [
        'Retraining is illegal',
        'Retrieval is cheap, fast to update, and lets you point to your sources - when a doc changes you re-index a file, not retrain a model',
        'Retraining produces worse grammar',
        'There is no difference'
      ],
      answer: 1,
      explain: 'Because the facts sit in the prompt, you can show the user where the answer came from - the difference between trust me and here is the source.'
    },
  ],
  'rag-explained/2': [
    {
      q: 'What is an embedding?',
      choices: [
        'A compressed copy of a document',
        'A list of numbers (a vector) representing the meaning of text, so texts with similar meaning land at nearby points',
        'A keyword index',
        'A database backup'
      ],
      answer: 1,
      explain: 'How do I run the tests? and executing the test suite end up close even with no shared words - meaning, not keywords.'
    },
    {
      q: 'Why do you chunk documents before embedding them?',
      choices: [
        'To save disk space',
        'So retrieval can return the relevant paragraph, not a whole manual, and each vector represents one focused idea',
        'Because embeddings only accept one sentence',
        'To remove duplicate text'
      ],
      answer: 1,
      explain: 'You want to spend the finite context window on signal; a vector that averages a whole document is far less useful for matching.'
    },
    {
      q: 'At query time, why must you embed the question with the same model used on the chunks?',
      choices: [
        'To save money',
        'Both must live in the same meaning space for the closeness comparison to be meaningful',
        'Different models are faster',
        'The question is shorter than a chunk'
      ],
      answer: 1,
      explain: 'You then ask the vector store for the top-k nearest chunks - the open-book pages you hand the model.'
    },
  ],
  'rag-explained/3': [
    {
      q: 'What is the one sentence worth tattooing on a RAG project?',
      choices: [
        'More context is always better',
        'The model can only be as good as what you retrieve - garbage in, confident garbage out',
        'Fine-tuning beats retrieval',
        'Bigger models fix everything'
      ],
      answer: 1,
      explain: 'The generation step gets attention because it talks, but retrieval is usually the real bottleneck - if the right chunk never arrives, no prompting saves you.'
    },
    {
      q: 'The vector store always returns your top-k nearest chunks. Why is that a trap?',
      choices: [
        'It returns too many chunks',
        'Nearest is not the same as relevant - if your docs lack the answer, it still hands back the least-irrelevant chunks',
        'It only returns one chunk',
        'It returns chunks at random'
      ],
      answer: 1,
      explain: 'Use the similarity scores: set a floor, and if nothing clears it, treat that as no good context rather than forcing an answer.'
    },
    {
      q: 'What is the difference between RAG and fine-tuning?',
      choices: [
        'They are the same technique',
        'RAG adds knowledge (facts in the prompt); fine-tuning adds behavior (style, format, tone)',
        'RAG changes behavior; fine-tuning adds facts',
        'Fine-tuning is just a faster RAG'
      ],
      answer: 1,
      explain: 'If the model does not know your stuff, that is RAG; if it does not answer in your style, that is fine-tuning - serious systems often do both.'
    },
  ],
  'reading-a-stack-trace/1': [
    {
      q: 'What is a stack trace a picture of?',
      choices: [
        'The contents of a file',
        'The call stack - a pile of frames, one per function that has started but not finished - frozen at the moment of failure',
        'The program\'s memory usage',
        'A list of all functions in the program'
      ],
      answer: 1,
      explain: 'The bottom frame is where the program started; the top is what it was doing the instant it broke.'
    },
    {
      q: 'What is a stack frame?',
      choices: [
        'A line of output',
        'The program\'s bookmark for one in-progress function call: which function, where in it, and its local variables',
        'An error message',
        'A type of loop'
      ],
      answer: 1,
      explain: 'A new frame is pushed when a function is called and popped when it returns; a trace is a printout of the whole pile.'
    },
    {
      q: 'Why do you need to know which end of a trace is the crash point?',
      choices: [
        'Traces are random',
        'Languages print from opposite ends - some put the crash at the top, others (with most recent call last) at the bottom',
        'The crash is always in the middle',
        'It does not matter'
      ],
      answer: 1,
      explain: 'Same picture, printed from opposite ends; one end is the crash point and the other is where it all started.'
    },
  ],
  'reading-a-stack-trace/2': [
    {
      q: 'What should you read first when facing a stack trace?',
      choices: [
        'The longest frame',
        'The error line - its type (the category) and message (the specific detail), which say what went wrong in one sentence',
        'The bottom of the file',
        'The framework frames'
      ],
      answer: 1,
      explain: 'Everything else is where; the error line is what. Read both the type and the message slowly.'
    },
    {
      q: 'In a Python traceback that begins "Traceback (most recent call last):", where is the crash point?',
      choices: [
        'The first frame listed',
        'The frame just above the error line at the bottom - in Python you start reading at the bottom and work up',
        'The middle frame',
        'There is no crash point'
      ],
      answer: 1,
      explain: 'Python promises the last line is the most recent call; JavaScript and Java instead put the crash at the top, under the error.'
    },
    {
      q: 'What is the fastest way to read a big trace full of framework frames?',
      choices: [
        'Read every frame top to bottom with equal attention',
        'Skip frames in dependency directories (site-packages/, node_modules/) and read the frames in your own source tree',
        'Read only the first line',
        'Count the total frames'
      ],
      answer: 1,
      explain: 'That single noise-filter habit turns a 40-line trace into a 2-line one - the bug is almost always in a frame you wrote.'
    },
  ],
  'reading-a-stack-trace/3': [
    {
      q: 'Why is the crash line often not the line that is actually wrong?',
      choices: [
        'The trace lies',
        'The crash point is where a bad value finally caused trouble, but the value was usually created earlier, in a frame below',
        'The crash line is always correct',
        'Errors are random'
      ],
      answer: 1,
      explain: 'Read the trace as a question moving downward: this broke - who handed it the bad value? Patching only the crash line can just hide the bug.'
    },
    {
      q: 'In a chained exception with "Caused by:", which part is the true root cause?',
      choices: [
        'The outer error at the top',
        'The deepest Caused by: block - read it first, fix the bottom, and the whole chain collapses',
        'The middle of the trace',
        'The first frame'
      ],
      answer: 1,
      explain: 'The outer error is your code re-reporting a failure; the deepest cause (e.g. a refused DB connection) is the original sin.'
    },
    {
      q: 'When an entire trace is library code with none of your files, what does it usually mean?',
      choices: [
        'The library is buggy and you should report it',
        'You handed the library bad input - find your call into it and check what you passed',
        'Your code is fine and the trace is useless',
        'The program has no bug'
      ],
      answer: 1,
      explain: 'An all-library trace is the library saying you gave me bad input; assume your input first - it almost always is.'
    },
  ],
  'reading-api-docs-postman/1': [
    {
      q: 'API docs are best read as what?',
      choices: [
        'Prose to read top to bottom',
        'A reference - a form with five fields (base URL, endpoint+method, parameters, auth, example) you scan to fill in',
        'A tutorial',
        'A changelog'
      ],
      answer: 1,
      explain: 'Put base URL + endpoint + parameters together and you have the URL; add auth and it is allowed; check the example to confirm.'
    },
    {
      q: 'What does the method tell you in an endpoint like `GET /books/{id}`?',
      choices: [
        'Which server to use',
        'What action you want - GET reads, POST creates, PUT/PATCH updates, DELETE removes',
        'The response format',
        'The authentication scheme'
      ],
      answer: 1,
      explain: 'Endpoint and method read like a sentence; the {id} in braces is a path parameter - a blank you fill with a real value.'
    },
    {
      q: 'What is the difference between a 401 and a 403 response?',
      choices: [
        'They are the same',
        '401 means authentication failed (who are you?); 403 means you are known but not allowed (forbidden)',
        '401 is forbidden; 403 is unauthorized',
        'Both mean the server crashed'
      ],
      answer: 1,
      explain: '401: the secret is missing or wrong; 403: your key is valid but lacks permission for that action.'
    },
  ],
  'reading-api-docs-postman/2': [
    {
      q: 'What is the key idea that makes Postman and curl feel calm?',
      choices: [
        'curl is always better than Postman',
        'Both build the same HTTP request - method, URL, headers, body - just clicked versus typed',
        'They send to different servers',
        'Only Postman can send auth'
      ],
      answer: 1,
      explain: 'A header is a header and a method is a method; learn the request once and translate between the tools freely.'
    },
    {
      q: 'In a curl command, what does the `-H` (or `--header`) flag do, and what is the common gotcha?',
      choices: [
        'Sets the method; no gotcha',
        'Adds a header (like Authorization) - and you must quote the value, or the shell splits it at the space',
        'Hides the response; quotes are optional',
        'Sets the URL; never use quotes'
      ],
      answer: 1,
      explain: 'Wrap the header value in double quotes; missing or mismatched quotes are the first suspect when a curl call fails confusingly.'
    },
    {
      q: 'Why is exporting a failing request as curl so useful?',
      choices: [
        'curl runs faster than Postman',
        'The curl line shows the exact request with nothing hidden, so a teammate can reproduce it and spot the problem',
        'curl encrypts the request',
        'It deletes the bad request'
      ],
      answer: 1,
      explain: 'You can import curl into Postman and export Postman as curl - reach for curl when you need to show someone the exact request.'
    },
  ],
  'reading-api-docs-postman/3': [
    {
      q: 'What should you read first in an HTTP response, and why?',
      choices: [
        'The body, to get your data',
        'The status code - it is the server\'s one-word verdict, and a 401 body needs a completely different reaction than a 200 body',
        'The response time',
        'The headers only'
      ],
      answer: 1,
      explain: 'Read the headline (status) before the detail (body); the code tells you which kind of response you are holding.'
    },
    {
      q: 'What does the first digit of a status code tell you?',
      choices: [
        'Nothing useful',
        '2xx = it worked, 4xx = you sent something wrong (fixable by you), 5xx = their server broke (not your fault)',
        'The size of the response',
        'How long the request took'
      ],
      answer: 1,
      explain: 'You read the first digit, not the whole table - it tells you which direction to look before you read a word of the body.'
    },
    {
      q: 'A request returns 404. What does that point to?',
      choices: [
        'The server is down',
        'Not found - a wrong URL or id; check the base URL, endpoint, and the id',
        'You are rate limited',
        'Your token is missing'
      ],
      answer: 1,
      explain: '404 is a 4xx (your fault) code; a 429 means slow down (rate limit) and a 500 is their server breaking.'
    },
  ],
  'reading-dynatrace/1': [
    {
      q: 'What are all of Dynatrace\'s screens (Smartscape, traces, problems) actually views onto?',
      choices: [
        'Separate, unrelated tools',
        'One shared, continuously-updated model of your whole system',
        'Hand-built dashboards',
        'Log files'
      ],
      answer: 1,
      explain: 'Dynatrace keeps a single live picture of every host, service, and database and how they connect; each view is a lens on that one model.'
    },
    {
      q: 'How does OneAgent collect distributed traces?',
      choices: [
        'You add tracing libraries to your code',
        'It auto-instruments supported runtimes, so traces appear without you writing tracing code',
        'It reads them from log files',
        'You configure each trace manually'
      ],
      answer: 1,
      explain: 'Automatic is not total - an unsupported runtime or exotic protocol can show up as a vague external box or a gap, which looks like a fast hop.'
    },
    {
      q: 'What does Smartscape show, and what does it not prove?',
      choices: [
        'It proves the root cause',
        'It shows topology and direction (who calls whom) but not causation - a red downstream service may be cause or just the loudest victim',
        'It shows only one service at a time',
        'It stores the metrics'
      ],
      answer: 1,
      explain: 'The map narrows where to look; the trace and Problem analysis are where you confirm cause.'
    },
  ],
  'reading-dynatrace/2': [
    {
      q: 'How should you read a trace waterfall?',
      choices: [
        'Top to bottom, like a to-do list where each bar happens after the one above',
        'As nesting - a child bar runs inside its parent\'s time, so it shows who is blocked on whom',
        'Right to left',
        'By bar color only'
      ],
      answer: 1,
      explain: 'A parent is waiting while its child runs; the shape is who waits on whom, not a sequence of independent steps.'
    },
    {
      q: 'What is the single most useful split when reading a service\'s response time?',
      choices: [
        'Total time vs. error count',
        'Self time (its own code) vs. waiting time (blocked on something downstream)',
        'CPU vs. memory',
        'Requests vs. users'
      ],
      answer: 1,
      explain: 'Read it first: if the bulk is its own code, dig into this service; if it is waiting downstream, follow the arrow to what it waits on.'
    },
    {
      q: 'When a trace shows a failure, where is the true origin?',
      choices: [
        'The top span, which returned the error to the user',
        'The span where the error first appears (the origin) - the spans above it are impact, not cause',
        'Always the database',
        'The longest span'
      ],
      answer: 1,
      explain: 'Incident time gets wasted debugging the impact; trace the error down to its origin span first.'
    },
  ],
  'reading-dynatrace/3': [
    {
      q: 'What is a Dynatrace Problem?',
      choices: [
        'A single failed request',
        'Many correlated symptoms grouped into one incident, using the dependency graph plus timing',
        'A type of dashboard',
        'An uninstrumented hop'
      ],
      answer: 1,
      explain: 'A slow database makes everything above it slow, tripping five alerts; a Problem recognizes those are one incident so you are not paged five times.'
    },
    {
      q: 'In a Problem, what is the list of affected entities?',
      choices: [
        'The root cause',
        'The impact (the blast radius) - who is hurting, not who is guilty',
        'The fix',
        'The earliest symptom'
      ],
      answer: 1,
      explain: 'The top of the impact list is usually the most visible victim, which is the furthest thing from the cause; read it for scope, look elsewhere for cause.'
    },
    {
      q: 'How should you treat Dynatrace\'s proposed root cause?',
      choices: [
        'As a proven verdict to act on immediately',
        'As your #1 lead - confirm it with timeline order, a real trace, and a correlated change before acting',
        'As always wrong',
        'As impact'
      ],
      answer: 1,
      explain: 'It is an inference from correlation plus topology, which has honest failure modes; the trace is the judge.'
    },
  ],
  'reading-graylog/1': [
    {
      q: 'Why does grep on one box stop working for modern systems?',
      choices: [
        'grep is too slow',
        'One request is spread across many machines that come and go, so the file you need may be on a box you are not on - or one that no longer exists',
        'grep cannot read log files',
        'Logs are encrypted'
      ],
      answer: 1,
      explain: 'Containers make it sharper: a crashed container can be gone, with its log file, before you ever log in - so logs must be shipped somewhere durable.'
    },
    {
      q: 'How are logs stored in a centralized system like Graylog?',
      choices: [
        'As one giant text file you grep',
        'As records with named fields (a labeled card), not just a blob of text',
        'As images',
        'As compressed archives only'
      ],
      answer: 1,
      explain: 'Because the pieces are named, you can search precisely with service:checkout AND status:500 instead of hoping the right text appears.'
    },
    {
      q: 'What is the key limitation of centralized logging?',
      choices: [
        'It cannot search by time',
        'It can only show what your apps actually logged - a field never emitted cannot be searched',
        'It only works on one machine',
        'It deletes old logs'
      ],
      answer: 1,
      explain: 'The search tool is a magnifying glass, not a microscope that invents detail; logs are only as good as the data your apps emit - and never log secrets.'
    },
  ],
  'reading-graylog/2': [
    {
      q: 'What is the single biggest lever when searching logs during an incident?',
      choices: [
        'Typing a longer query',
        'Scoping the time range to the incident window first',
        'Adding more fields',
        'Using OR everywhere'
      ],
      answer: 1,
      explain: 'Every other filter narrows what; the time range narrows how much - scoping to the 15 minutes around the alert often cuts the haystack by orders of magnitude.'
    },
    {
      q: 'What does searching a correlation/request id alone do?',
      choices: [
        'Returns one log line',
        'Reassembles one request\'s story across every service into a single timeline',
        'Deletes the request',
        'Filters by time'
      ],
      answer: 1,
      explain: 'The scattered diary entries snap back into order - if a service did not log the id, there will be a gap, which is a logging gap, not proof nothing happened.'
    },
    {
      q: 'What does the histogram above the results tell you?',
      choices: [
        'The total disk usage',
        'The shape of the problem over time - a sudden cliff means a change (a deploy), a slow ramp means degradation',
        'Which fields exist',
        'The number of services'
      ],
      answer: 1,
      explain: 'Read the shape before the lines; the histogram answers when did this start faster than reading any individual log line.'
    },
  ],
  'reading-graylog/3': [
    {
      q: 'What is a stream in Graylog?',
      choices: [
        'A one-off search you type',
        'A standing filter - a rule that continuously routes matching log lines into a named pile',
        'A dashboard widget',
        'A type of alert destination'
      ],
      answer: 1,
      explain: 'Instead of typing level:error AND env:prod for the hundredth time, you define it once as a Production Errors stream that stays populated.'
    },
    {
      q: 'What is the difference between a dashboard and an alert?',
      choices: [
        'They are the same',
        'A dashboard is a view you must be looking at; an alert notifies you even when you are not watching',
        'A dashboard sends pages; an alert is glanceable',
        'An alert is slower'
      ],
      answer: 1,
      explain: 'A dashboard shows the spike only if you happen to be looking; for tell me even when I am not watching, you need an alert.'
    },
    {
      q: 'Why must you tune an alert\'s threshold carefully?',
      choices: [
        'To save storage',
        'Set it too low and it fires on normal noise; people mute the channel and then miss the real alert - alert fatigue',
        'Thresholds are optional',
        'To make alerts faster'
      ],
      answer: 1,
      explain: 'An alert is a search plus a threshold plus a window plus a destination; a badly tuned one trains everyone to ignore it.'
    },
  ],
  'reading-logs-without-drowning/1': [
    {
      q: 'What is a log, fundamentally?',
      choices: [
        'An error report that only appears when things break',
        'A program\'s running diary - short notes, in time order, mostly about normal events',
        'A list of all functions',
        'A configuration file'
      ],
      answer: 1,
      explain: 'A healthy program writes logs constantly, almost all boring; the errors are a small fraction mixed into a long, calm diary.'
    },
    {
      q: 'What are the four parts of a typical log line?',
      choices: [
        'Author, title, body, footer',
        'Timestamp (when), level (how serious), source (who), and message (what)',
        'Error code, fix, retry, result',
        'Date, size, owner, permissions'
      ],
      answer: 1,
      explain: 'Learn to spot these four once and you can read logs you have never seen before; watch the timestamp\'s zone, since servers often log in UTC.'
    },
    {
      q: 'Why are log levels your fastest first filter?',
      choices: [
        'They sort alphabetically',
        'They tag each line by severity (DEBUG to FATAL), so in a crisis you can show only ERROR and FATAL and shrink thousands of lines to a handful',
        'They hide errors',
        'They translate the message'
      ],
      answer: 1,
      explain: 'Levels are the compromise between logging everything and logging too little - one dial, set by importance.'
    },
  ],
  'reading-logs-without-drowning/2': [
    {
      q: 'What does `tail -f app.log` do?',
      choices: [
        'Shows the start of the file',
        'Shows the end of the file and keeps printing each new line live as it is written',
        'Deletes old lines',
        'Sorts the file'
      ],
      answer: 1,
      explain: 'It is a live window onto the diary - pair it with grep (tail -f app.log | grep ERROR) to watch only what matters as you reproduce a bug. Ctrl-C stops it.'
    },
    {
      q: 'Why reach for `grep -B 5 -A 5` around an error?',
      choices: [
        'To delete surrounding lines',
        'Because the why of an error is often in the lines just before it - context turns an error happened into the story of how',
        'To count matches',
        'To sort by time'
      ],
      answer: 1,
      explain: 'Instead of a lone error line, you see the lead-up; reach for -B and -A almost every time you grep for an error.'
    },
    {
      q: 'What is the trap that wastes the most time when reading logs?',
      choices: [
        'Logs are too short',
        'The loud ERROR is not always the real cause - the cause is often a quieter WARN above it',
        'Timestamps are always wrong',
        'grep is case-insensitive'
      ],
      answer: 1,
      explain: 'Read upward from the error: the earliest sign of trouble (e.g. an exhausted connection pool in a WARN) is usually the real cause.'
    },
  ],
  'reading-logs-without-drowning/3': [
    {
      q: 'What separates a useful log line from a useless one?',
      choices: [
        'Length',
        'Enough context to act without reading the code, an honest level, and the error\'s cause - not just that it happened',
        'Using all capital letters',
        'Including the function name only'
      ],
      answer: 1,
      explain: 'Something went wrong tells you nothing; charge failed for order 4821: card declined answers when, where, which, what, and why.'
    },
    {
      q: 'What is a structured log?',
      choices: [
        'A log sorted alphabetically',
        'One that records each fact as a labeled key=value pair (or JSON) instead of prose, so any field is exactly searchable',
        'A log with no timestamps',
        'A compressed log'
      ],
      answer: 1,
      explain: 'The trade-off is it is a touch less skimmable by eye, which is worth it at scale where a search box runs on those fields.'
    },
    {
      q: 'Which habit should you always follow when writing logs?',
      choices: [
        'Log every line of every loop',
        'Never log secrets - passwords, tokens, full card numbers; logs are widely readable and long-retained',
        'Always use DEBUG level',
        'Avoid timestamps'
      ],
      answer: 1,
      explain: 'Also: log decisions not every step, include a greppable ID, and write the message for the stressed person reading at 2am.'
    },
  ],
  'regular-expressions-explained/1': [
    {
      q: 'What is a regex, fundamentally?',
      choices: [
        'Code you run step by step',
        'A description you write of the shape of text, handed to a regex engine that does the searching',
        'A programming language',
        'A command that deletes text'
      ],
      answer: 1,
      explain: 'You describe what the text looks like; the engine searches, and the tool you give it to (editor, grep) decides the action.'
    },
    {
      q: 'On its own, what does a regex actually do?',
      choices: [
        'Searches, replaces, and deletes text',
        'Only answers whether a shape appears in some text, and if so where - the actions come from the tool you hand it to',
        'Runs a loop over the text',
        'Formats the text'
      ],
      answer: 1,
      explain: 'Pattern describes, tool acts - keeping that separation in your head avoids a lot of confusion.'
    },
    {
      q: 'What does it mean that the pattern `cat` matches `category`?',
      choices: [
        'Regex only matches whole words',
        'Match means the shape was found somewhere inside the text, not that the text equals the pattern',
        'category is a special case',
        'The match failed'
      ],
      answer: 1,
      explain: 'A bare pattern matches anywhere by default, and matching is case-sensitive - CAT would not match cat.'
    },
  ],
  'regular-expressions-explained/2': [
    {
      q: 'What does the character class `\\d` match?',
      choices: [
        'One or more digits',
        'Exactly one digit (one position in the text)',
        'Any letter',
        'A literal d'
      ],
      answer: 1,
      explain: 'A character class matches exactly one character; to match several digits you add a quantifier like +.'
    },
    {
      q: 'What does the quantifier `+` mean?',
      choices: [
        'Zero or more',
        'One or more',
        'Exactly one',
        'Optional (zero or one)'
      ],
      answer: 1,
      explain: 'So \\d+ means one or more digits in a row, grabbing all of 2026 rather than stopping at the first digit.'
    },
    {
      q: 'What do the anchors `^` and `$` let you demand?',
      choices: [
        'A case-insensitive match',
        'A whole match - ^ pins to the start and $ to the end, so ^cat$ matches only the exact text cat',
        'Any character',
        'A repeated group'
      ],
      answer: 1,
      explain: 'Anchors match a position, not a character; wrapping a pattern in ^...$ turns find-anywhere into must-be-exactly-this.'
    },
  ],
  'regular-expressions-explained/3': [
    {
      q: 'Your regex `.*` grabs way too much text. What is the cause and fix?',
      choices: [
        'The engine is broken; restart it',
        'A greedy quantifier - make it lazy with .*? so it matches as little as possible',
        'A missing anchor; add ^',
        'Wrong character class; use \\d'
      ],
      answer: 1,
      explain: 'Greedy quantifiers grab as much as they can; the lazy form .*? grabs the minimum, which is usually what you wanted.'
    },
    {
      q: 'A special character like `.` or `(` is not matching literally. What do you do?',
      choices: [
        'Use a different engine',
        'Escape it with a backslash: \\. or \\( so it means the literal character',
        'Wrap it in anchors',
        'Make it lazy'
      ],
      answer: 1,
      explain: 'A bare dot is special (it means any character); escaping with a backslash makes it match an actual dot.'
    },
    {
      q: 'Why is chasing the perfect email regex a trap?',
      choices: [
        'Email cannot be matched at all',
        'The rules are strange and sprawling; the complete regex is huge, unreadable, and still not fully correct - aim for a good-enough, readable shape check instead',
        'Regex is too slow for email',
        'Email has no @ symbol'
      ],
      answer: 1,
      explain: 'Regex checks shape, not meaning; a practical pattern catches obvious typos and stays readable, then you confirm by sending a message.'
    },
  ],
  'relationships-and-keys/1': [
    {
      q: 'What is the core problem with cramming customers and orders into one big table?',
      choices: [
        'It uses too much disk',
        'Data duplication - the same fact stored in many places can drift apart and contradict itself',
        'Queries run faster',
        'It cannot store numbers'
      ],
      answer: 1,
      explain: 'Repeated data is data waiting to disagree with itself; the danger is not wasted space, it is copies drifting apart.'
    },
    {
      q: 'Which three anomalies does duplication cause?',
      choices: [
        'Syntax, runtime, and logic errors',
        'Update (copies drift apart), insertion (cannot store a customer with no order), and deletion (deleting an order erases the person)',
        'Read, write, and execute errors',
        'Lag, staleness, and downtime'
      ],
      answer: 1,
      explain: 'All three share one cause: two different kinds of thing crammed into one table.'
    },
    {
      q: 'What is normalization?',
      choices: [
        'Making all values lowercase',
        'Organizing data so each fact lives in one place, with tables referencing each other instead of duplicating',
        'Deleting old rows',
        'Encrypting the database'
      ],
      answer: 1,
      explain: 'If you are copying the same fact into many rows, pull it out into its own table and point at it instead; the trade is reassembly at read time (a JOIN).'
    },
  ],
  'relationships-and-keys/2': [
    {
      q: 'What is a primary key?',
      choices: [
        'Any column with a number',
        'The unique, permanent name for each row - give the database its value and it finds exactly one row',
        'The first column in a table',
        'A password for the table'
      ],
      answer: 1,
      explain: 'It turns that one over there, roughly into row 1, precisely - which is what lets other tables point at this one.'
    },
    {
      q: 'What two rules must a primary key always obey?',
      choices: [
        'It must be a number and be the first column',
        'Unique (no two rows share it) and stable (it must never change, because other things point at it)',
        'Unique and encrypted',
        'Short and memorable'
      ],
      answer: 1,
      explain: 'It can also never be empty (NULL), because no value is not a name; the database enforces uniqueness and non-emptiness for you.'
    },
    {
      q: 'Why prefer a surrogate auto-increment id over a natural key like email?',
      choices: [
        'Numbers are faster to type',
        'Real-world values like email change, and changing a key breaks every pointer to the row; a meaningless number has no reason to change',
        'Emails are too long',
        'Natural keys are illegal'
      ],
      answer: 1,
      explain: 'The id\'s lack of meaning is its strength - default to a surrogate id unless you have a value truly fixed forever.'
    },
  ],
  'relationships-and-keys/3': [
    {
      q: 'What is a foreign key?',
      choices: [
        'A key from another company',
        'A column in one table that holds a primary key value from another table - a pointer the database can protect',
        'An encrypted password',
        'A backup of the primary key'
      ],
      answer: 1,
      explain: 'It lives on the child (referencing) table and points at the parent (referenced) table\'s primary key.'
    },
    {
      q: 'What is referential integrity?',
      choices: [
        'That keys must be integers',
        'The database\'s refusal to create orphans - every foreign key value must point at a row that actually exists',
        'That every table needs a backup',
        'That rows must be sorted'
      ],
      answer: 1,
      explain: 'Try to add an order for a customer who does not exist and the database rejects it at write time, doing your data-quality checking for you.'
    },
    {
      q: 'How do you model a many-to-many relationship (students and courses)?',
      choices: [
        'Put a foreign key on both tables',
        'Add a junction table whose rows are the pairings, each holding two foreign keys',
        'It is impossible',
        'Duplicate the data'
      ],
      answer: 1,
      explain: 'A single foreign key column could only hold one value per row; the junction table turns one many-to-many into two ordinary one-to-many relationships.'
    },
  ],
  'rest-apis-explained/1': [
    {
      q: 'In REST, what does a URL name?',
      choices: [
        'The action to perform',
        'The resource (the thing) - a collection like /users or an item like /users/42; the action comes from the HTTP method',
        'The server\'s location only',
        'The response format'
      ],
      answer: 1,
      explain: 'Putting the action in the URL (/getUser) throws away the whole idea; the URL names the thing, the method says what to do to it.'
    },
    {
      q: 'What is the difference between PUT and PATCH?',
      choices: [
        'They are identical',
        'PUT replaces the whole resource (omitted fields get blanked); PATCH changes only the fields you send',
        'PATCH replaces everything; PUT is partial',
        'PUT only works on collections'
      ],
      answer: 1,
      explain: 'The classic data-loss bug: a PUT with a partial body silently deletes the fields you did not mention - use PATCH for partial updates.'
    },
    {
      q: 'What does statelessness mean for a REST API?',
      choices: [
        'The server stores no data',
        'The server keeps no memory of previous requests, so each request carries everything needed (like a token) every time',
        'Requests must be sent in order',
        'The API has no database'
      ],
      answer: 1,
      explain: 'It is why any server behind a load balancer can answer any request, and why you can replay a single request in curl to reproduce a bug.'
    },
  ],
  'rest-apis-explained/2': [
    {
      q: 'How should you name a REST endpoint?',
      choices: [
        'With a verb: /getOrders',
        'With a plural noun: /orders - the method supplies the action',
        'With a unique random string',
        'With the action and id: /deleteOrder?id=42'
      ],
      answer: 1,
      explain: 'Repeating the verb in the path breaks the pattern that makes APIs predictable; consistency beats cleverness.'
    },
    {
      q: 'Which status code says a POST created a new resource?',
      choices: [
        '200 OK',
        '201 Created (and return its Location)',
        '204 No Content',
        '400 Bad Request'
      ],
      answer: 1,
      explain: '200 is standard success, 204 is success with nothing to send back (a delete), and 201 specifically signals a new resource exists.'
    },
    {
      q: 'What are query parameters for in a REST API?',
      choices: [
        'Identifying the resource',
        'Filtering, sorting, and paginating a list - shaping a read, not identifying the resource',
        'Authentication only',
        'Replacing the HTTP method'
      ],
      answer: 1,
      explain: 'The path names the collection; the query string (?status=open&sort=-created&page=2) refines which slice you get and how it is arranged.'
    },
  ],
  'rest-apis-explained/3': [
    {
      q: 'What does the first digit of an HTTP status code tell you?',
      choices: [
        'The response size',
        'Whose problem it is: 2xx worked, 3xx redirect, 4xx the caller\'s fault, 5xx the server\'s fault',
        'The time taken',
        'The API version'
      ],
      answer: 1,
      explain: 'That single digit is enough to know which direction to look before reading the body.'
    },
    {
      q: 'What is the difference between 401 and 403?',
      choices: [
        'They are interchangeable',
        '401 means unauthenticated (I do not know who you are, log in); 403 means authenticated but not permitted',
        '401 is forbidden; 403 is not found',
        'Both mean the server crashed'
      ],
      answer: 1,
      explain: 'Sending 403 for a missing login tells the client to fix the wrong thing.'
    },
    {
      q: 'Why should a good 4xx response include a body?',
      choices: [
        'To make the response bigger',
        'The status code tells the client\'s code how to branch; the message body tells the human what to fix',
        'Bodies are required by HTTP',
        'To slow down attackers'
      ],
      answer: 1,
      explain: 'Returning 400 with a blank body is technically correct and practically useless; a good error names what was wrong and where.'
    },
  ],
  'running-models-locally/1': [
    {
      q: 'What is the single biggest reason to run a model locally?',
      choices: [
        'It is always faster',
        'Privacy - the prompt, documents, and answers never leave your machine',
        'The models are smarter',
        'It needs no setup'
      ],
      answer: 1,
      explain: 'For sensitive code, private documents, or anything under a confidentiality obligation, that is often the whole reason - and sometimes the only acceptable option.'
    },
    {
      q: 'What is the main honest trade-off against running locally?',
      choices: [
        'It costs more per token',
        'The models you can run at home are usually smaller and weaker than the best hosted ones, and your hardware is the hard ceiling',
        'It only works online',
        'It cannot be automated'
      ],
      answer: 1,
      explain: 'The largest, sharpest models are too big for a personal machine; going in expecting parity is the fastest route to disappointment.'
    },
    {
      q: 'What does open-weights mean?',
      choices: [
        'The model is free of any license',
        'The trained model\'s parameters are published for you to download and run yourself',
        'The model has no parameters',
        'The source code is open'
      ],
      answer: 1,
      explain: 'It is what makes local running possible at all, but it is not the same as open source, and the license can still restrict use.'
    },
  ],
  'running-models-locally/2': [
    {
      q: 'In the Ollama mental model, what is the runtime versus the model?',
      choices: [
        'They are the same thing',
        'Ollama is the runtime (the record player) that loads model files (the records) and does the math',
        'The model is the runtime',
        'Ollama is a hosted API'
      ],
      answer: 1,
      explain: 'You install the runtime once and download as many models as you like, swapping between them - pulling a second model reinstalls nothing.'
    },
    {
      q: 'What does `ollama pull <model>` do?',
      choices: [
        'Runs the model',
        'Downloads the model\'s weight files to your disk (once); the size roughly tells you the disk and memory it needs',
        'Deletes a model',
        'Starts a chat'
      ],
      answer: 1,
      explain: 'From then on the model lives on your machine; pull once, run as often as you like.'
    },
    {
      q: 'How does your own code talk to a local Ollama model?',
      choices: [
        'It cannot - only the terminal works',
        'Via the local API at http://localhost:11434 - POST a JSON body with the model and prompt, read the response field',
        'By editing the model file',
        'Through a hosted endpoint'
      ],
      answer: 1,
      explain: 'localhost means the request never touches the network; anything that can make an HTTP request can use your local model.'
    },
  ],
  'running-models-locally/3': [
    {
      q: 'What does a model\'s parameter count (7B, 70B) determine?',
      choices: [
        'Its download speed only',
        'How much memory it needs - every parameter must be loaded into memory at once, so size scales with parameter count',
        'Its license',
        'The programming language it uses'
      ],
      answer: 1,
      explain: 'It is arithmetic, not subtle: a 70B model will not load on an 8 GB laptop; match the model to the machine before you pull it.'
    },
    {
      q: 'What is quantization, and what is its trade-off?',
      choices: [
        'Encrypting the weights; slower but safer',
        'Storing each parameter in fewer bits - much less memory for a little quality loss; it is how big models become runnable',
        'Splitting the model across machines; more complex',
        'Deleting unused parameters; loses features'
      ],
      answer: 1,
      explain: 'That lopsided trade (a little quality for a lot of memory) is why a Q4-style build is a common default for running locally.'
    },
    {
      q: 'You pulled a model and it is crawling. What is the usual cause?',
      choices: [
        'The license expired',
        'It barely fit and is spilling between memory tiers, or it is running on the CPU instead of the GPU',
        'The model is corrupted',
        'The network is slow'
      ],
      answer: 1,
      explain: 'GPUs run models much faster than CPUs; the fix is the same as for fitting - a smaller or more quantized model that comfortably fits the faster memory.'
    },
  ],
  'rust-from-zero/1': [
    {
      q: 'What is the difference between rustc and cargo?',
      choices: [
        'They are the same tool',
        'rustc is the compiler; cargo is the build tool and package manager you actually drive day to day',
        'cargo is the compiler; rustc manages packages',
        'rustc installs Rust versions'
      ],
      answer: 1,
      explain: 'Think of cargo as the friendly front desk and rustc as the machinery in the back; you use cargo almost always.'
    },
    {
      q: 'What does `cargo run` do?',
      choices: [
        'Only checks that the code compiles',
        'Compiles your project and then runs the resulting program, in one step',
        'Downloads dependencies only',
        'Formats your code'
      ],
      answer: 1,
      explain: 'cargo build builds without running, and cargo check just checks it compiles (fastest) without producing a program.'
    },
    {
      q: 'Why is Rust\'s first compile noticeably slow?',
      choices: [
        'It is downloading the whole internet',
        'Rust compiles a lot up front to do its safety checks and produce fast code; this is normal, and re-builds are quick',
        'Your machine is misconfigured',
        'cargo is broken'
      ],
      answer: 1,
      explain: 'After the first build cargo caches the work; cargo check especially is near-instant - do not let the first slow build scare you off.'
    },
  ],
  'rust-from-zero/2': [
    {
      q: 'In Rust, what is true of a value bound with `let` by default?',
      choices: [
        'It can be changed freely',
        'It is immutable - you cannot change it unless you opt in with mut',
        'It must be a number',
        'It is always global'
      ],
      answer: 1,
      explain: 'When you read let total = ... with no mut, you know for certain total is never modified later - removing a whole category of bugs.'
    },
    {
      q: 'What is shadowing in Rust?',
      choices: [
        'Changing a value in place with mut',
        'Writing let again with the same name to create a new value (the type can even change) that hides the old one',
        'Hiding a variable from other files',
        'A compile error'
      ],
      answer: 1,
      explain: 'Shadowing makes a new value with let (type may change); mut changes the same value in place (type must stay the same).'
    },
    {
      q: 'What happens on integer overflow in a debug build?',
      choices: [
        'It silently wraps to zero',
        'It panics with attempt to add with overflow; pick an integer type big enough for your values',
        'The program hangs',
        'It rounds down'
      ],
      answer: 1,
      explain: 'The subtle part: release builds turn the check off and wrap instead, so do not rely on the debug panic when overflow is genuinely possible.'
    },
  ],
  'rust-from-zero/3': [
    {
      q: 'What is Vec<T> in Rust?',
      choices: [
        'A fixed-size array',
        'A growable list of one type - the workhorse collection you reach for by default',
        'A key-value map',
        'A single character'
      ],
      answer: 1,
      explain: 'vec![...] builds one and .push() grows it; use an array only when the count is truly fixed and small.'
    },
    {
      q: 'What is the rule for String versus &str?',
      choices: [
        'Always use String',
        'Read with &str, own with String - String is an owned growable buffer; &str is a borrowed read-only view',
        '&str can be modified; String cannot',
        'They are interchangeable'
      ],
      answer: 1,
      explain: 'A function taking &str accepts both a literal and a borrow of a String, so it is the most flexible choice for parameters.'
    },
    {
      q: 'What does HashMap\'s `.get(key)` return?',
      choices: [
        'The value directly, or crashes if missing',
        'Some(value) if the key exists, or None if it does not - so you must handle the missing case',
        'Always None',
        'A list of all values'
      ],
      answer: 1,
      explain: 'Rust makes you handle the missing-key case right there, so you can never accidentally use a value that was not found. HashMaps also have no guaranteed order.'
    },
  ],
  'rust-from-zero/4': [
    {
      q: 'Why does Rust have no ternary `? :` operator?',
      choices: [
        'It was forgotten',
        'Because if/else is an expression that produces a value, so you assign its result directly',
        'Ternaries are unsafe',
        'It uses match instead'
      ],
      answer: 1,
      explain: 'let label = if temp > 25 { "hot" } else { "mild" } catches the value; both branches must produce the same type.'
    },
    {
      q: 'What makes `match` special in Rust?',
      choices: [
        'It is faster than if',
        'It must be exhaustive - cover every possible case, or the program will not compile',
        'It only works on numbers',
        'It can only have two arms'
      ],
      answer: 1,
      explain: 'Forget an enum variant and it will not build; when you add a variant later, the compiler points you to every match that needs updating.'
    },
    {
      q: 'How does a Rust function return its value?',
      choices: [
        'Always with the return keyword and a semicolon',
        'The last expression with no semicolon becomes the return value',
        'By printing it',
        'By assigning to a special variable'
      ],
      answer: 1,
      explain: 'A stray semicolon on the last line turns the expression into a statement that produces no value - the classic mismatched-types beginner bug.'
    },
  ],
  'rust-from-zero/5': [
    {
      q: 'What is the difference between src/main.rs and src/lib.rs?',
      choices: [
        'They are the same',
        'main.rs is the entry point of a binary you run (has fn main); lib.rs is a library other code reuses (no main)',
        'lib.rs is the binary; main.rs is the library',
        'Only main.rs can have dependencies'
      ],
      answer: 1,
      explain: 'A binary is a thing you run; a library is a thing you reuse - many projects have both, a lib for logic and a thin main that calls into it.'
    },
    {
      q: 'By default, what is the visibility of items in a Rust module?',
      choices: [
        'Public to everyone',
        'Private - usable only inside that module, until you mark them pub',
        'Public within the crate only',
        'Hidden even from the same module'
      ],
      answer: 1,
      explain: 'Private-by-default is the same philosophy as immutable-by-default: the safe, restrictive choice is the default and you opt out with pub.'
    },
    {
      q: 'What is the difference between `mod` and `use`?',
      choices: [
        'They do the same thing',
        'mod declares that a module exists; use brings an existing name into scope for convenience',
        'use declares modules; mod imports names',
        'Both download dependencies'
      ],
      answer: 1,
      explain: 'You declare a module once with mod; you can use names from it as often as you like - unresolved import usually means a use for something never mod-declared or made pub.'
    },
  ],
  'rust-from-zero/6': [
    {
      q: 'What are the three rules of ownership in Rust?',
      choices: [
        'Values are global, shared, and permanent',
        'Each value has exactly one owner; only one owner at a time; the value is dropped (freed) when the owner goes out of scope',
        'Values must be cloned, locked, and freed manually',
        'Every value needs a garbage collector'
      ],
      answer: 1,
      explain: 'That third rule is the quiet miracle: the compiler knows exactly where each owner ends, so it inserts cleanup automatically - memory safety at compile time.'
    },
    {
      q: 'What happens when you assign a heap-owning value like `let t = s` where s is a String?',
      choices: [
        's is copied, both are usable',
        'Ownership moves to t, and s is no longer valid',
        'Both point at the same memory and both free it',
        'It is a compile error always'
      ],
      answer: 1,
      explain: 'Making it a move guarantees exactly one owner does the cleanup, preventing a double-free; using s afterward gives error E0382.'
    },
    {
      q: 'What is Rust\'s one rule that governs all borrowing?',
      choices: [
        'You can have as many mutable references as you want',
        'At any time, either one mutable reference or any number of shared references - never both (many readers, or one writer)',
        'References are not allowed',
        'Only the owner can read a value'
      ],
      answer: 1,
      explain: 'If something can be changed, nothing else may be looking at it - this is what kills data races and aliasing bugs; breaking it gives error E0499.'
    },
  ],
  'rust-from-zero/7': [
    {
      q: 'What are Option<T> and Result<T, E> for?',
      choices: [
        'Speeding up the program',
        'Option is a value or nothing (Rust\'s null replacement); Result is a value if it worked, or an error if it did not',
        'Storing collections',
        'Defining modules'
      ],
      answer: 1,
      explain: 'Failure and absence are written into the type, so a function\'s type tells you how it can fail - no hidden exceptions to ambush you.'
    },
    {
      q: 'What does the `?` operator do?',
      choices: [
        'Asks the user a question',
        'On Ok/Some it unwraps the value and keeps going; on Err/None it returns that error from the current function immediately',
        'Prints a value',
        'Catches all panics'
      ],
      answer: 1,
      explain: 'It keeps the happy path readable and only works in a function whose return type can carry the error.'
    },
    {
      q: 'When is `.unwrap()` not okay?',
      choices: [
        'In tests',
        'In real application or library code on anything that can fail in production - it panics on Err/None, a crash waiting for a bad day',
        'On hard-coded constants you wrote',
        'In quick experiments'
      ],
      answer: 1,
      explain: 'In real code use ? to bubble the error or match to handle it; reserve unwrap (or expect with a reason) for proven-impossible cases.'
    },
  ],
  'rust-from-zero/8': [
    {
      q: 'What is Cargo?',
      choices: [
        'Just a compiler',
        'Rust\'s build tool, package manager, and test runner rolled into one',
        'A text editor',
        'A web framework'
      ],
      answer: 1,
      explain: 'Every Rust project is built and tested the same way, so you can drop into any repo and already know the commands.'
    },
    {
      q: 'What is the difference between Cargo.toml and Cargo.lock?',
      choices: [
        'They are the same file',
        'Cargo.toml is the manifest you edit (what you asked for); Cargo.lock is the auto-generated exact versions resolved (what you got)',
        'Cargo.lock is edited by hand',
        'Cargo.toml lists exact versions'
      ],
      answer: 1,
      explain: 'You commit Cargo.lock so teammates and CI build the identical dependency set, but you never hand-edit it.'
    },
    {
      q: 'What does clippy do that the compiler does not?',
      choices: [
        'It compiles faster',
        'It flags code that works but is not idiomatic, explaining the better way - like a patient senior reviewer',
        'It runs your tests',
        'It downloads dependencies'
      ],
      answer: 1,
      explain: 'Where the compiler tells you what is wrong, clippy tells you what is not idiomatic; the everyday loop is cargo fmt, clippy, then test.'
    },
  ],
  'rust-from-zero/9': [
    {
      q: 'What makes Rust enums more powerful than integer-constant enums?',
      choices: [
        'They are faster',
        'Each variant can carry its own data, and exhaustive match forces you to handle every variant',
        'They use less memory',
        'They can only hold numbers'
      ],
      answer: 1,
      explain: 'It lets you make illegal states unrepresentable; add a variant and the compiler hands you a to-do list of every match to fix (error E0004).'
    },
    {
      q: 'How does Rust do shared behavior without class inheritance?',
      choices: [
        'With global functions',
        'With traits - a set of methods a type promises to provide, then functions accept anything implementing the trait',
        'With copy-paste',
        'It cannot share behavior'
      ],
      answer: 1,
      explain: 'Dog and Robot share no parent but both implement Greet, so both can be passed to announce(thing: &impl Greet); #[derive(Debug)] is itself implementing a trait.'
    },
    {
      q: 'What is true of iterator combinators like `.filter().map().collect()`?',
      choices: [
        'They run immediately',
        'They are lazy - nothing happens until a consumer like .collect() or a for loop pulls the values through',
        'They are slower than a loop',
        'They only work on numbers'
      ],
      answer: 1,
      explain: 'They read top to bottom like a pipeline and are just as fast as a hand-written loop; forget the consuming step and the transformation silently does nothing.'
    },
  ],
  'scaling-a-database/1': [
    {
      q: 'What should you do before adding any hardware to a slow database?',
      choices: [
        'Add more machines immediately',
        'Scale the query before the hardware - fix missing indexes, N+1 queries, and SELECT * first; it is free and the biggest win',
        'Buy the largest server available',
        'Shard the data'
      ],
      answer: 1,
      explain: 'The slow-database feeling is far more often a bad query than a capacity problem; a well-placed index can turn seconds into milliseconds.'
    },
    {
      q: 'Why scale up (a bigger box) before scaling out (more machines)?',
      choices: [
        'Bigger boxes are always cheaper',
        'One bigger box keeps the simple single-database mental model; multiple machines impose a permanent coordination tax',
        'Scaling out is impossible',
        'Bigger boxes never fail'
      ],
      answer: 1,
      explain: 'Most apps never truly outgrow one well-tuned server; bugs, backups, and transactions are all trivial on one box and genuinely hard across many.'
    },
    {
      q: 'Why must you diagnose read-heavy versus write-heavy before choosing a scaling tool?',
      choices: [
        'It does not matter',
        'Reads are scaled with replication and writes with sharding - reach for the wrong tool and the pain will not go away',
        'Writes are always the problem',
        'Both are scaled the same way'
      ],
      answer: 1,
      explain: 'Teams add read replicas to a database drowning in writes and are baffled when nothing improves - replicas do not take writes off the leader.'
    },
  ],
  'scaling-a-database/2': [
    {
      q: 'How is a replicated database arranged?',
      choices: [
        'Every machine accepts writes equally',
        'One leader accepts all writes and streams its change-log to followers, which are read-only mirrors serving reads',
        'Followers accept writes; the leader serves reads',
        'All machines hold different data'
      ],
      answer: 1,
      explain: 'A read can be answered by any copy, so more copies means more read capacity - reads are the easy thing to scale.'
    },
    {
      q: 'What is replication lag, and what bug does it cause?',
      choices: [
        'A network outage; it causes downtime',
        'Followers always trail the leader slightly, so a read from a follower can be stale - causing the read-your-own-writes bug',
        'A failed write; it loses data',
        'A slow query; it causes timeouts'
      ],
      answer: 1,
      explain: 'A user saves, then re-reads from a follower that has not caught up, sees old data, and thinks the save failed; route reads-after-writes to the leader.'
    },
    {
      q: 'What does replication NOT solve?',
      choices: [
        'Read scaling',
        'Write scaling - every write still funnels through the single leader, and each follower adds a little load',
        'Failover',
        'Redundancy'
      ],
      answer: 1,
      explain: 'Adding followers gives more places to read, not one extra ounce of write capacity; when writes are the wall, you need sharding.'
    },
  ],
  'scaling-a-database/3': [
    {
      q: 'How does sharding differ from replication?',
      choices: [
        'They are the same',
        'Sharding splits the data so each machine holds only a slice (each row on one shard); replication copies all data everywhere',
        'Sharding copies all data; replication splits it',
        'Sharding only works for reads'
      ],
      answer: 1,
      explain: 'Splitting lets shards absorb writes in parallel, which is what scales writes - the thing replication could never give you.'
    },
    {
      q: 'Why is choosing the shard key the make-or-break decision?',
      choices: [
        'It sets the database password',
        'It decides load balance and which queries stay fast, and it is nearly impossible to change later',
        'It only affects backups',
        'It can be changed anytime'
      ],
      answer: 1,
      explain: 'Changing it means physically moving most of your data while live; choose as if you cannot change it, because in practice you almost cannot.'
    },
    {
      q: 'What do you largely lose when you shard?',
      choices: [
        'The ability to read data',
        'Cross-shard transactions - an atomic all-or-nothing operation no longer spans shards cheaply',
        'All your indexes',
        'The ability to add machines'
      ],
      answer: 1,
      explain: 'Much of sharding\'s pain is losing easy transactions; cross-shard joins are also slow or impossible, which is why sharding is the last resort.'
    },
  ],
  'secrets-management/1': [
    {
      q: 'What actually makes a value a secret?',
      choices: [
        'It looks random',
        'What it unlocks - if a stranger could use it to spend your money, read your data, or impersonate you, it is a secret',
        'It is stored in config',
        'It is a long string'
      ],
      answer: 1,
      explain: 'The test is consequence, not appearance: a short DB password is a secret; a long random public identifier is not.'
    },
    {
      q: 'What is the property shared by API keys, passwords, tokens, and private keys?',
      choices: [
        'They are all numbers',
        'Possession is permission - whoever holds the value can use it, with no second factor or are-you-sure',
        'They all expire',
        'They are all encrypted'
      ],
      answer: 1,
      explain: 'That is why you guard the value itself so fiercely - there is no second check between having it and using it.'
    },
    {
      q: 'What is the number-one way secrets leak?',
      choices: [
        'Sophisticated hacking',
        'A developer hardcodes the secret into source code and commits it',
        'Encryption failures',
        'Database breaches'
      ],
      answer: 1,
      explain: 'It is private is not protection - repos go public, laptops get stolen, and committed secrets stay in Git history; bots can abuse a pushed key within minutes.'
    },
  ],
  'secrets-management/2': [
    {
      q: 'Where should a secret go instead of being a literal in your code?',
      choices: [
        'A comment',
        'Read from the environment at runtime - the code mentions the name (e.g. STRIPE_SECRET_KEY), never the value',
        'A public config file',
        'The README'
      ],
      answer: 1,
      explain: 'The source becomes safe to commit; the value lives in the environment, which is per-machine - laptop, staging, and production each supply their own.'
    },
    {
      q: 'What is the key split between `.env` and `.env.example`?',
      choices: [
        'They are identical',
        '.env is real and git-ignored; .env.example is fake (placeholder values) and committed so teammates know what to fill in',
        '.env is committed; .env.example is ignored',
        'Both are committed'
      ],
      answer: 1,
      explain: 'One tells your app what to do; the other tells your teammates what to fill in.'
    },
    {
      q: 'If you committed `.env` before adding it to `.gitignore`, what must you do?',
      choices: [
        'Nothing - the ignore rule handles it',
        'Explicitly untrack it with git rm --cached .env, because .gitignore only ignores files Git is not already tracking',
        'Delete the whole repo',
        'Rename the file'
      ],
      answer: 1,
      explain: 'git rm --cached removes it from tracking without deleting your local file - but the secret was already committed, so it must also be rotated, not just deleted.'
    },
  ],
  'secrets-management/3': [
    {
      q: 'A secret leaked. What is the correct order of response?',
      choices: [
        'Scrub Git history first',
        'Revoke (disable the key), rotate (issue a new one), then audit (check logs and find how it leaked)',
        'Audit, then revoke',
        'Tell no one and hope'
      ],
      answer: 1,
      explain: 'Speed beats perfection - a dead key cannot be abused; do not try to scrub history first, because revoking makes the leaked copy harmless instantly.'
    },
    {
      q: 'What does a secrets manager give you that a .env file cannot?',
      choices: [
        'Faster code',
        'Encrypted central storage, access control (who can read which secret), an audit trail, and one place to rotate',
        'Free hosting',
        'Automatic backups of your code'
      ],
      answer: 1,
      explain: 'The secret stops being a thing you copy and starts being a thing you request; tools include Vault, AWS Secrets Manager, and Azure Key Vault.'
    },
    {
      q: 'Why apply least privilege to every key?',
      choices: [
        'To make keys shorter',
        'Because possession is permission, a leaked key\'s damage equals the permissions you gave it - scoping caps the blast radius',
        'It speeds up rotation',
        'It is required by law'
      ],
      answer: 1,
      explain: 'A leaked read-only key is an annoyance; a leaked admin key is a catastrophe - you are not preventing the leak, you are capping what it can cost.'
    },
  ],
  'ship-your-side-project/1': [
    {
      q: 'When picking a cheap VPS, what should you size the box for?',
      choices: [
        'The app\'s idle memory use',
        'The build\'s peak memory use - building can momentarily need far more RAM than running',
        'The largest tier available',
        'The disk only'
      ],
      answer: 1,
      explain: 'Your app might run in 200 MB but a docker build can OOM a 1 GB box; the cheapest tier plus a swap file covers most first deploys.'
    },
    {
      q: 'On a tiny box, a `docker compose up --build` dies with `Killed` (exit 137). What happened?',
      choices: [
        'Your code has a bug',
        'The OOM killer reaped the build because it ran the box out of RAM',
        'The network dropped',
        'Docker is misconfigured'
      ],
      answer: 1,
      explain: 'The build failed because the machine ran out of room to build it; add swap, build elsewhere and pull the image, or temporarily resize.'
    },
    {
      q: 'How do you actually stop being billed for a VPS?',
      choices: [
        'Power it off',
        'Delete/destroy the server (snapshot first if you want to keep it) - powering off does not stop the bill',
        'Disconnect the network',
        'Stop the Docker containers'
      ],
      answer: 1,
      explain: 'The provider still reserves your CPU, RAM, and disk while it is off; powered off is not free.'
    },
  ],
  'ship-your-side-project/2': [
    {
      q: 'What is the right way to log into a fresh server, and what should you do once it works?',
      choices: [
        'Use a strong password',
        'Use an SSH key, then disable password login (PasswordAuthentication no) - but confirm the key in a second terminal first',
        'Open the web console',
        'Allow root with no password'
      ],
      answer: 1,
      explain: 'Bots hammer password login within minutes; with keys no password travels, and confirming first avoids locking yourself out.'
    },
    {
      q: '`Permission denied (publickey)` on a fresh cloud box is most often caused by what?',
      choices: [
        'A broken SSH server',
        'The wrong username (root vs ubuntu vs the provider\'s user)',
        'A corrupted key',
        'The firewall'
      ],
      answer: 1,
      explain: 'The username is part of who you prove to be; right key, wrong user still fails. Then check the key is installed, the right key is offered, and permissions.'
    },
    {
      q: 'What is the quirk of a provider\'s web/VNC console?',
      choices: [
        'It is faster than SSH',
        'Pasting text with special characters into it often garbles them',
        'It does not support keyboards',
        'It logs your password'
      ],
      answer: 1,
      explain: 'The console emulates a keyboard, so pasting a long key or a password with @ / $ | { } can silently drop or change characters - type sensitive strings by hand.'
    },
  ],
  'ship-your-side-project/3': [
    {
      q: 'How do you give a server read access to your private repo safely?',
      choices: [
        'Put your personal SSH key on the box',
        'Use a deploy key - generate it on the server and register its public half as a read-only deploy key on that one repo',
        'Make the repo public',
        'Email yourself the password'
      ],
      answer: 1,
      explain: 'A deploy key is scoped to a single repository, so if the box is compromised the blast radius is read access to one repo.'
    },
    {
      q: 'A `$` in a value in your `.env` gets mangled by Docker Compose. Why and what is the fix?',
      choices: [
        'Compose encrypts $; remove it',
        'Compose does variable substitution and treats $ as inserting a variable - escape each $ as $$',
        '$ is illegal in env files',
        'Use single quotes around the value'
      ],
      answer: 1,
      explain: 'A password like pa$$w0rd becomes paw0rd; doubling each $ leaves a single $ in the value the container receives.'
    },
    {
      q: 'After editing `.env`, why does `docker compose restart` not apply your change?',
      choices: [
        'restart is broken',
        'restart just stops and starts existing containers - it does not re-read .env; use up -d --force-recreate',
        'You must reboot the box',
        'The change needs a rebuild'
      ],
      answer: 1,
      explain: 'up -d --force-recreate reconciles to the current .env and forces new containers, so edited values are actually picked up.'
    },
  ],
  'ship-your-side-project/4': [
    {
      q: 'What is the difference between an A record and a CNAME?',
      choices: [
        'They are the same',
        'An A record maps a name to an IP address; a CNAME maps a name to another name (an alias)',
        'A CNAME maps to an IP; A maps to a name',
        'A is for HTTPS, CNAME for HTTP'
      ],
      answer: 1,
      explain: 'Point the apex at your box with an A record (name to IP), and point www at the apex with a CNAME (name to name).'
    },
    {
      q: 'Why can\'t the apex (naked) domain usually be a CNAME?',
      choices: [
        'CNAMEs are deprecated',
        'By the DNS spec the apex cannot be a CNAME - only an A record (or AAAA) works there, unless your provider does CNAME flattening',
        'The apex must be HTTPS',
        'Apex domains do not resolve'
      ],
      answer: 1,
      explain: 'So apex = A record to your IP; www = CNAME to the apex. Cloudflare and some providers offer CNAME flattening as an exception.'
    },
    {
      q: 'Why do `.dev` and `.app` domains look broken until HTTPS works?',
      choices: [
        'They are not real domains',
        'They are on the browser HSTS preload list, so browsers refuse to load them over plain http at all',
        'They require a special registrar',
        'They only work with Cloudflare'
      ],
      answer: 1,
      explain: 'There is no add HTTPS later with a .dev - until HTTPS works the site simply will not open, a hard fail rather than a warning.'
    },
  ],
  'ship-your-side-project/5': [
    {
      q: 'Why is a Cloudflare Tunnel preferable to proxied DNS for a side project?',
      choices: [
        'It is faster',
        'The tunnel makes an outbound-only connection, so your server needs no inbound ports open at all - nothing to port-scan or firewall',
        'It is the only way to get HTTPS',
        'It hides your domain'
      ],
      answer: 1,
      explain: 'With a tunnel the firewall problem simply cannot exist, because there is nothing listening to the public internet.'
    },
    {
      q: 'Behind a proxy, login silently fails with mysterious 403s. What is a likely cause?',
      choices: [
        'The database is down',
        'The app does not know its real public origin, so its CSRF check compares against the wrong origin - set SITE_URL / trusted origins',
        'The image is too big',
        'DNS has not propagated'
      ],
      answer: 1,
      explain: 'The app sees requests from Cloudflare as http on an internal host, so CSRF rejects valid requests; tell it its public https URL.'
    },
    {
      q: 'If you use proxied DNS (Option A) and leave ports 80/443 open to everyone, what is the risk?',
      choices: [
        'Nothing',
        'Anyone who discovers your origin IP can hit the box directly, bypassing Cloudflare\'s HTTPS and protection - firewall the origin to Cloudflare\'s IPs (allow SSH first)',
        'The site loads slower',
        'Cloudflare blocks you'
      ],
      answer: 1,
      explain: 'All the edge security becomes optional for an attacker; with a Tunnel there are no inbound ports to lock at all.'
    },
  ],
  'ship-your-side-project/6': [
    {
      q: 'What is the shape of auto-deploy on merge with GitHub Actions?',
      choices: [
        'The box polls GitHub',
        'On push to main, a workflow SSHes into the box using a deploy key stored as a secret and runs the deploy script (git pull + compose up)',
        'GitHub runs your app directly',
        'You email the server'
      ],
      answer: 1,
      explain: 'Merging becomes deploying - no SSH, no remembering commands.'
    },
    {
      q: 'Why must the deploy script use `--force-recreate` rather than `restart`?',
      choices: [
        'restart is slower',
        'A deploy that only changed an env value or rebuilt an image would silently keep the old containers with restart - the Action goes green but nothing changed',
        'force-recreate is required by GitHub',
        'restart deletes data'
      ],
      answer: 1,
      explain: 'It is the Phase 3 trap, now automated: recreate, do not restart.'
    },
    {
      q: 'What is the better way to avoid OOM on every deploy to a tiny box?',
      choices: [
        'Always build on the box',
        'Build the image in the Action (which has plenty of RAM) and have the box just pull it - no build on the box',
        'Disable the tests',
        'Use a smaller image base only'
      ],
      answer: 1,
      explain: 'Or keep building on the box but guarantee swap so the deploy build cannot get OOM-killed mid-deploy.'
    },
  ],
  'spreadsheets-to-sql-to-pipelines/1': [
    {
      q: 'What are spreadsheets genuinely great at?',
      choices: [
        'Storing millions of rows',
        'Being visible, flexible, and instant - perfect for small, exploratory, one-person, one-time work',
        'Enforcing data types',
        'Being a single source of truth for a team'
      ],
      answer: 1,
      explain: 'The data is the interface and feedback is instant; that same yardstick tells you when you have outgrown it.'
    },
    {
      q: 'What does it mean that a spreadsheet has no real types?',
      choices: [
        'It cannot hold text',
        'Every cell decides its own type and the tool guesses - so it auto-converts IDs and dates (SEPT2 becomes a date, 00123 loses its zeros)',
        'It only holds numbers',
        'Types are declared per column'
      ],
      answer: 1,
      explain: 'Four cells that look like the same date can be four different things; sort or sum and the mismatches scatter or get silently dropped.'
    },
    {
      q: 'Which spreadsheet weakness is the deepest, pushing you toward a pipeline later?',
      choices: [
        'Limited colors',
        'Manual work is unrepeatable - the steps live in your head, so the process cannot be trusted to run the same way twice',
        'Small fonts',
        'No charts'
      ],
      answer: 1,
      explain: 'A spreadsheet stores results, not the steps that produced them; miss one step and the report is wrong.'
    },
  ],
  'spreadsheets-to-sql-to-pipelines/2': [
    {
      q: 'How does the guide describe a database table relative to a spreadsheet?',
      choices: [
        'A completely different concept',
        'A spreadsheet\'s ideas made sturdy - rows and columns, but with declared, enforced types',
        'A slower spreadsheet',
        'A spreadsheet with more tabs'
      ],
      answer: 1,
      explain: 'The pieces map almost one-to-one; the difference is everything around them - declared types, one shared store, and SQL.'
    },
    {
      q: 'What does declaring a column\'s type buy you?',
      choices: [
        'Faster typing',
        'The database enforces the rule on every row, catching bad data at the door instead of in a broken report weeks later',
        'Smaller files',
        'Prettier output'
      ],
      answer: 1,
      explain: 'Constraints kill the class of bug where one stray text cell silently breaks a SUM - the wrong shape is not allowed in.'
    },
    {
      q: 'What problem does moving from spreadsheet files to a database solve about versions?',
      choices: [
        'It makes files smaller',
        'There is one table everyone connects to - connections, not copies - so the which-version-is-current question disappears',
        'It backs up automatically',
        'It adds version numbers to files'
      ],
      answer: 1,
      explain: 'When two reports disagree, you do not hunt for the right file; there is one table and the answer is whatever it says right now.'
    },
  ],
  'spreadsheets-to-sql-to-pipelines/3': [
    {
      q: 'What is a pipeline?',
      choices: [
        'A faster spreadsheet',
        'Your manual steps written as code and run automatically by a scheduler - the process moved out of your head into something durable',
        'A type of database',
        'A backup system'
      ],
      answer: 1,
      explain: 'The steps are no longer a habit you perform; they are an artifact that can be read, fixed, and runs whether or not you are awake.'
    },
    {
      q: 'What does a pipeline cost?',
      choices: [
        'Nothing',
        'Up-front engineering, new ways to break, and ongoing maintenance - automation is paid for once, in advance',
        'Only money for servers',
        'It cannot scale'
      ],
      answer: 1,
      explain: 'Manual is cheap to start and expensive forever; a pipeline is costly to build and cheap to run.'
    },
    {
      q: 'What is the most important judgment call about pipelines?',
      choices: [
        'Always build one',
        'Build one only when the work genuinely repeats and genuinely matters - do not over-engineer a task you will do twice',
        'Never build one',
        'Use the fanciest tool'
      ],
      answer: 1,
      explain: 'Let the pain make the case; spreadsheet for one-time work, database for shared querying, pipeline only when the work truly repeats.'
    },
  ],
  'sql-injection-and-xss/1': [
    {
      q: 'What is the one bug underneath both SQL injection and XSS?',
      choices: [
        'Weak passwords',
        'Data being able to become code - user input reaching an interpreter in a way that lets it be read as code instead of data',
        'Slow queries',
        'Missing encryption'
      ],
      answer: 1,
      explain: 'The wall between your instructions and their values has a hole; the user stops filling in a blank and starts rewriting your program\'s instructions.'
    },
    {
      q: 'What is the usual cause of both holes?',
      choices: [
        'Using a database',
        'Building code by gluing strings together with user input in the middle, which erases the data/code boundary before the interpreter sees it',
        'Forgetting to validate emails',
        'Using HTTPS'
      ],
      answer: 1,
      explain: 'By the time the interpreter receives the string, the boundary that existed only in your head is gone - it is just one run of characters.'
    },
    {
      q: 'Why is input validation not the real fix for injection?',
      choices: [
        'Validation is too slow',
        'It asks does this look reasonable - a question with no reliable answer for free-text like names or comments; the real fixes keep the data/code boundary intact no matter the input',
        'Validation is illegal',
        'It only works for numbers'
      ],
      answer: 1,
      explain: 'Blocklists fail because attackers have endless ways to write the same thing; keeping data on its own channel cannot be tricked.'
    },
  ],
  'sql-injection-and-xss/2': [
    {
      q: 'What is the fix for SQL injection?',
      choices: [
        'Strip out quote characters',
        'Parameterized queries / prepared statements - send the SQL (with placeholders) and the values on separate channels so values are never parsed as SQL',
        'Validate input length',
        'Hide the database'
      ],
      answer: 1,
      explain: 'The database compiles the SQL structure first, then slots the value in as pure data; there is no string for the attacker\'s quote to break out of.'
    },
    {
      q: 'Why shouldn\'t you rely on stripping out quote characters to stop SQL injection?',
      choices: [
        'Quotes are needed for dates',
        'It is a blocklist, and blocklists lose - numeric contexts need no quote, databases differ, and attackers have endless tricks; the hole is that input got parsed as SQL at all',
        'Stripping quotes is too slow',
        'It breaks the UI'
      ],
      answer: 1,
      explain: 'Close the parse-as-SQL channel and you stop playing whack-a-mole forever.'
    },
    {
      q: 'ORMs parameterize for you on the normal path. Where are you still responsible?',
      choices: [
        'Nowhere',
        'The raw-SQL escape hatch - if you build that raw string by concatenation, the ORM\'s protection does nothing',
        'Only on SELECT queries',
        'Only on the first query'
      ],
      answer: 1,
      explain: 'Never assemble SQL by concatenation; placeholders are for values, and structural choices (table/column names) should be gated by an allowlist.'
    },
  ],
  'sql-injection-and-xss/3': [
    {
      q: 'What makes XSS feel crueler than SQL injection?',
      choices: [
        'It is harder to fix',
        'The attacker\'s code runs in other users\' browsers, with their logged-in session - the victim is your user, not you',
        'It deletes the database',
        'It only affects the attacker'
      ],
      answer: 1,
      explain: 'The script you accidentally served executes with the victim\'s session; the user is trusting your site.'
    },
    {
      q: 'What is the difference between stored and reflected XSS?',
      choices: [
        'They are the same',
        'Stored XSS is saved and served to everyone who views the page; reflected XSS bounces straight back in one response, hitting whoever follows a crafted link',
        'Stored is harmless; reflected is dangerous',
        'Reflected is saved to the database'
      ],
      answer: 1,
      explain: 'Same root cause and same fix; they differ only in how the malicious input reaches the page.'
    },
    {
      q: 'What is the shape of the XSS fix?',
      choices: [
        'Block the word script',
        'Encode the input on output so the characters that mean this is markup arrive as harmless text instead',
        'Validate the input length',
        'Disable JavaScript'
      ],
      answer: 1,
      explain: 'Encoding keeps the user\'s value as data when it lands in a place the browser would otherwise read as code - the same keep-data-as-data instinct.'
    },
  ],
  'sql-joins-explained/1': [
    {
      q: 'What is a join, fundamentally?',
      choices: [
        'A way to delete rows',
        'An instruction to match rows in one table to rows in another using a value they share, gluing them into wider rows',
        'A backup of two tables',
        'A way to sort a table'
      ],
      answer: 1,
      explain: 'You tell it how matching works in the ON clause - almost always where this column equals that column.'
    },
    {
      q: 'Why is data split into separate tables in the first place, if it means you need joins?',
      choices: [
        'To make querying harder',
        'So each fact is stored once - put the name in every order and changing it means updating every copy, with data disagreeing if you miss one',
        'To save disk space',
        'Because tables are limited in size'
      ],
      answer: 1,
      explain: 'A join is the tool that pays that back: it recombines the split tables for one question without duplicating anything on disk.'
    },
    {
      q: 'In `FROM orders JOIN users ON orders.user_id = users.id`, what does the ON clause do?',
      choices: [
        'Sorts the result',
        'Defines the matching rule - a row in orders matches a row in users when the order\'s user_id equals the user\'s id',
        'Limits the rows returned',
        'Renames the tables'
      ],
      answer: 1,
      explain: 'Whenever a join surprises you, the first thing to check is the ON clause - it is the rule the whole result is built from.'
    },
  ],
  'sql-joins-explained/2': [
    {
      q: 'What does an INNER JOIN keep?',
      choices: [
        'Every row from the left table',
        'Only rows that find a match on both sides - unmatched rows on either side are dropped',
        'Every row from both tables',
        'Only rows with NULLs'
      ],
      answer: 1,
      explain: 'A user with no orders and an order pointing at a nonexistent user both vanish; INNER is ruthless about both directions.'
    },
    {
      q: 'What does a LEFT JOIN do that an INNER JOIN doesn\'t?',
      choices: [
        'Run faster',
        'Keep every row from the left (first-named) table, filling the right table\'s columns with NULL where there is no match',
        'Sort the results',
        'Drop duplicate rows'
      ],
      answer: 1,
      explain: 'That NULL row is how this user has zero orders shows up in your results instead of silently vanishing.'
    },
    {
      q: 'What is the difference between the join types in one line?',
      choices: [
        'INNER is faster than LEFT',
        'INNER answers where both exist; LEFT answers everything on the left, plus the right where it exists',
        'LEFT drops non-matches; INNER keeps them',
        'They return the same rows'
      ],
      answer: 1,
      explain: 'Choosing wrong is how you accidentally hide your zero-order users, or include rows you meant to filter out.'
    },
  ],
  'sql-joins-explained/3': [
    {
      q: 'What causes a cartesian explosion in a join?',
      choices: [
        'Too many columns',
        'A missing or always-true ON clause, so every row on the left is paired with every row on the right',
        'An INNER JOIN',
        'Sorting by the wrong column'
      ],
      answer: 1,
      explain: '10,000 users times 50,000 orders is 500 million rows; always join on a key that uniquely identifies a row.'
    },
    {
      q: 'Your LEFT JOIN\'s no-match rows vanished after you added a WHERE on the right table. Why?',
      choices: [
        'The data changed',
        'A WHERE on a right-table column filters out the NULL rows (NULL > 20 is not true), turning the LEFT JOIN back into an INNER JOIN',
        'WHERE is not allowed with LEFT JOIN',
        'The ON clause was wrong'
      ],
      answer: 1,
      explain: 'Put match conditions about the right table in the ON clause, which is applied during matching, so unmatched left rows are still kept.'
    },
    {
      q: 'What is the cheapest way to catch all the join gotchas?',
      choices: [
        'Run the query twice',
        'Predict the row count first, then check it - up means duplication, an unexpected drop means lost matches, exact means you are good',
        'Add more indexes',
        'Always use LEFT JOIN'
      ],
      answer: 1,
      explain: 'A join you cannot predict the row count of is a join you do not understand yet.'
    },
  ],
  'sql-vs-nosql/1': [
    {
      q: 'What does the relational model store data in, and how are tables connected?',
      choices: [
        'Documents linked by id',
        'Tables (rows and columns with declared types), connected by shared values called keys, queried with SQL',
        'Key-value pairs',
        'Nodes and edges'
      ],
      answer: 1,
      explain: 'A join stitches rows from separate tables together by matching keys at query time, so each fact is stored once and recombined on demand.'
    },
    {
      q: 'What does NoSQL actually mean?',
      choices: [
        'No SQL allowed',
        'Not the relational model - an umbrella defined by absence, covering very different tools (document, key-value, wide-column, graph)',
        'A single specific database',
        'A faster version of SQL'
      ],
      answer: 1,
      explain: 'Treating NoSQL as one thing to compare to SQL is like comparing cars to non-cars; the useful comparison is to a specific family for a specific job.'
    },
    {
      q: 'Which NoSQL family is shaped for blazing lookups by key, like caching and sessions?',
      choices: [
        'Document (MongoDB)',
        'Key-value (Redis)',
        'Graph (Neo4j)',
        'Wide-column (Cassandra)'
      ],
      answer: 1,
      explain: 'A key points to a value like a dictionary; you do not query inside the value, you get and set by key - extremely fast at exactly that.'
    },
  ],
  'sql-vs-nosql/2': [
    {
      q: 'What is the honest framing of schema flexibility versus enforced integrity?',
      choices: [
        'Flexible always wins',
        'The database guarantees your structure versus you guarantee your structure - validation does not disappear, it moves into your code',
        'Rigid always wins',
        'Neither enforces anything'
      ],
      answer: 1,
      explain: 'A relational schema rejects a bad write at the door; a schema-flexible store lets it in unless your application code catches it.'
    },
    {
      q: 'What is the trade-off of denormalization (storing related data together)?',
      choices: [
        'It is always slower',
        'Read simplicity now (one lookup, no join) versus update complexity later (duplicated data you must keep in sync)',
        'It uses no extra space',
        'It prevents all bugs'
      ],
      answer: 1,
      explain: 'If an address is copied into a thousand order documents and the customer moves, you update a thousand copies or accept stale ones.'
    },
    {
      q: 'In the CAP trade-off, what do many distributed NoSQL stores favor?',
      choices: [
        'Perfect consistency always',
        'Availability with eventual consistency - a write shows up everywhere soon, but a read right after a write might briefly see the old value',
        'Neither availability nor consistency',
        'Strong consistency on one machine'
      ],
      answer: 1,
      explain: 'When the network splits the machines for a moment, you cannot have both perfect consistency and full availability - you favor one.'
    },
  ],
  'sql-vs-nosql/3': [
    {
      q: 'What is the boring-correct default database choice for most apps?',
      choices: [
        'A document store',
        'A relational database - integrity for free, flexible queries, and maturity; you should need a reason to deviate',
        'A graph database',
        'Whatever is newest'
      ],
      answer: 1,
      explain: 'Most apps are things with relationships between them, the relational model\'s home turf; a single well-indexed server handles more load than most apps ever reach.'
    },
    {
      q: 'What does NoSQL is not no schema mean?',
      choices: [
        'NoSQL has no data',
        'Your data always has a structure; the only question is who enforces it - the database, or your code (or nobody, and malformed records pile up)',
        'Schemas are optional in SQL too',
        'NoSQL schemas are faster'
      ],
      answer: 1,
      explain: 'Schemaless means the schema moved out of the database into your code and discipline - a relocation of the work, never a deletion.'
    },
    {
      q: 'What is polyglot persistence?',
      choices: [
        'Writing queries in many languages',
        'Using more than one type of data store in a single system, matching each store to the job it fits',
        'A type of NoSQL database',
        'Avoiding databases entirely'
      ],
      answer: 1,
      explain: 'A relational core plus Redis for hot reads and a search engine for text is normal and often right - mix deliberately, since each store adds operational cost.'
    },
  ],
  'ssh-and-keys/1': [
    {
      q: 'What does SSH actually give you?',
      choices: [
        'A way to transfer files',
        'A command line on another computer, with every keystroke and byte of output encrypted on the wire',
        'A website',
        'A backup tool'
      ],
      answer: 1,
      explain: 'SSH stands for Secure Shell; if you can use a terminal, you already know how to use a machine over SSH - the only new part is getting in.'
    },
    {
      q: 'What is the first-connection fingerprint prompt for?',
      choices: [
        'Setting your password',
        'Confirming the server is really who you meant to reach - SSH saves the answer in ~/.ssh/known_hosts and checks it on every future connection',
        'Choosing an encryption type',
        'Speeding up the connection'
      ],
      answer: 1,
      explain: 'It only appears once per machine; if the fingerprint later changes, SSH loudly refuses, because a changed key can mean an impostor.'
    },
    {
      q: 'When SSH asks for a password and your terminal shows nothing as you type, what is happening?',
      choices: [
        'The keyboard is broken',
        'It is invisible by design, so nobody reads your password length over your shoulder - keep typing and press Enter',
        'The connection dropped',
        'You must use a key instead'
      ],
      answer: 1,
      explain: 'It makes everyone think the keyboard is broken the first time; keys (Phase 2) skip this prompt entirely.'
    },
  ],
  'ssh-and-keys/2': [
    {
      q: 'In the padlock analogy, which key do you share and which do you guard?',
      choices: [
        'Share the private key, guard the public',
        'Share the public key (the padlock); guard the private key (the one key that opens it), which never leaves your computer',
        'Share both',
        'Guard both'
      ],
      answer: 1,
      explain: 'Handing someone your padlock tells them nothing about your key; the names sound symmetric but the private key is the secret.'
    },
    {
      q: 'Why do SSH keys beat passwords?',
      choices: [
        'Keys are shorter',
        'No secret travels on login (only a one-time proof) and a private key is too large to brute-force',
        'Keys never expire',
        'Passwords are encrypted, keys are not'
      ],
      answer: 1,
      explain: 'Passwords prove who you are by sending a shared secret; keys prove it by demonstrating you hold the private key without revealing it.'
    },
    {
      q: 'What is the single most important rule about your private key?',
      choices: [
        'Back it up to GitHub',
        'Never share or commit it - it is the only thing standing between you and anyone who wants to log in as you',
        'Email it to teammates',
        'Store it on a shared machine'
      ],
      answer: 1,
      explain: 'The .pub (public) file is the opposite - share it freely; accidentally pushing a private key to GitHub is a common, bad mistake that bots scan for.'
    },
  ],
  'ssh-and-keys/3': [
    {
      q: 'What does the `~/.ssh/config` file let you do?',
      choices: [
        'Change your encryption',
        'Save long connection details under a short nickname you make up, so ssh myserver expands to the full user@host with the right key',
        'Disable passwords',
        'Store your private key'
      ],
      answer: 1,
      explain: 'It is pure convenience and changes nothing about security; the moment you have more than one server you will want it.'
    },
    {
      q: 'What does the ssh-agent do?',
      choices: [
        'Stores your password on the server',
        'Holds your unlocked private key in memory for the session, so you type its passphrase once instead of every connection',
        'Generates new keys',
        'Encrypts the network'
      ],
      answer: 1,
      explain: 'You hand it the key once with ssh-add; it forgets everything on logout or reboot, by design - a session convenience, not permanent storage.'
    },
    {
      q: 'You get WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED. What should you do?',
      choices: [
        'Immediately clear it and reconnect',
        'Confirm the change was expected (you or your provider rebuilt the box) first, then remove the stale entry with ssh-keygen -R hostname',
        'Ignore it forever',
        'Reinstall SSH'
      ],
      answer: 1,
      explain: 'Usually it is innocent (the server was rebuilt), but the warning exists for the rare time it is real - do not reflexively clear it on a machine you did not change.'
    },
  ],
  'storage-hdd-ssd-nvme/1': [
    {
      q: 'Why is random access slow on an HDD?',
      choices: [
        'The platters are too small',
        'It has moving parts - reaching scattered data costs seek time (move the arm) plus rotational latency (wait for the platter to spin around)',
        'The cable is slow',
        'It has no cache'
      ],
      answer: 1,
      explain: 'Sequential reads pay that cost once and then stream, which is why a big-file copy is fine but booting (thousands of scattered small reads) crawls.'
    },
    {
      q: 'What is an HDD still genuinely good for?',
      choices: [
        'Running a database',
        'Storing a lot of data cheaply - it is the cheapest per gigabyte, great for backups and archives read sequentially',
        'Booting an OS fast',
        'Random small reads and writes'
      ],
      answer: 1,
      explain: 'A database does the most random thing imaginable, the worst match; bulk/archive storage is mostly sequential, so slow random access barely matters.'
    },
    {
      q: 'Why should you never defragment an SSD?',
      choices: [
        'It corrupts the data',
        'Defragmenting exists to make an HDD\'s head travel less; an SSD has no head, so it does nothing useful and just adds writes that wear the flash',
        'It is too slow',
        'It deletes files'
      ],
      answer: 1,
      explain: 'On an HDD, scattered file pieces mean lots of random seeks; on flash, scattered costs nothing, so defragging only wears cells.'
    },
  ],
  'storage-hdd-ssd-nvme/2': [
    {
      q: 'Why is random access dramatically faster on an SSD than an HDD?',
      choices: [
        'The flash is denser',
        'There are no moving parts - the controller addresses any cell electronically, so seek time and rotational latency are gone',
        'It has more cache',
        'It uses a faster cable'
      ],
      answer: 1,
      explain: 'Reaching cell 5 and cell 5 million take essentially the same tiny time; that is the speedup you feel when an old laptop feels new with an SSD.'
    },
    {
      q: 'What are the two real trade-offs of an SSD versus an HDD?',
      choices: [
        'It is bigger and louder',
        'It costs more per gigabyte, and its flash cells wear out with writes (not reads)',
        'It is slower and hotter',
        'It needs more power and a fan'
      ],
      answer: 1,
      explain: 'The sweet spot is often both - a small fast SSD for the OS and apps, a large cheap HDD for bulk files.'
    },
    {
      q: 'What is wear-leveling?',
      choices: [
        'A way to defragment flash',
        'The controller spreading writes evenly across all cells so they age together, rather than a few being hammered to death',
        'A backup feature',
        'A way to speed up reads'
      ],
      answer: 1,
      explain: 'Reading does not wear a cell; writing does. With wear-leveling, a typical SSD comfortably outlasts the computer under everyday use - and let the OS run TRIM, not a defragmenter.'
    },
  ],
  'storage-hdd-ssd-nvme/3': [
    {
      q: 'What is the key difference between SATA and NVMe?',
      choices: [
        'They are storage technologies like flash',
        'They are interfaces - SATA was designed in the HDD era with a narrow path; NVMe over PCIe was built for flash with a wider, massively parallel path',
        'NVMe is a type of HDD',
        'SATA is faster than NVMe'
      ],
      answer: 1,
      explain: 'Two SSDs with the same flash chips can perform very differently because the connection between drive and computer can be a bottleneck.'
    },
    {
      q: 'Why is M.2 the great confuser?',
      choices: [
        'M.2 drives are always the fastest',
        'M.2 is a physical shape/slot, not an interface - most M.2 drives are NVMe, but some speak SATA over the same slot',
        'M.2 only fits HDDs',
        'M.2 is an old standard'
      ],
      answer: 1,
      explain: 'It\'s an M.2 does not guarantee it\'s NVMe; check what the drive actually reports (e.g. lsblk on Linux) rather than trusting the connector.'
    },
    {
      q: 'Which storage upgrade do you feel the most?',
      choices: [
        'SATA SSD to NVMe SSD',
        'HDD to any SSD - that is where you escape the moving parts; SATA to NVMe is a real but smaller everyday step',
        'Adding more RAM',
        'A bigger HDD'
      ],
      answer: 1,
      explain: 'If you can only make one move, make HDD to SSD; NVMe\'s advantage shows up mainly under heavy, parallel load.'
    },
  ],
  'tcp-ip-model/1': [
    {
      q: 'Why is the internet built as a stack of layers?',
      choices: [
        'To slow it down',
        'The internet is too complex for one program, so the problem is split so each layer does one job and trusts the layer below it',
        'To use more memory',
        'For legal reasons'
      ],
      answer: 1,
      explain: 'Trust flows downward and nobody reaches sideways - which is also why you can debug a layered system one layer at a time.'
    },
    {
      q: 'What is encapsulation in the TCP/IP model?',
      choices: [
        'Transforming data from one protocol to another',
        'Wrapping, not transforming - each layer seals the package from above inside its own envelope (header) on the way down',
        'Encrypting every layer',
        'Compressing the data'
      ],
      answer: 1,
      explain: 'Your actual data sits untouched at the center the whole trip; HTTP does not become TCP, it gets wrapped by it.'
    },
    {
      q: 'Who reads each layer\'s wrapper?',
      choices: [
        'Every layer along the way',
        'Only its counterpart on the receiving end - routers peek at the outer wrappers they handle and leave the inner ones sealed',
        'The application only',
        'The sender re-reads them'
      ],
      answer: 1,
      explain: 'A router moving your packet does not open your HTTP request, which is why one layer can change (Wi-Fi to Ethernet) without disturbing the layers inside it.'
    },
  ],
  'tcp-ip-model/2': [
    {
      q: 'What is the Internet (IP) layer responsible for, and what does it not promise?',
      choices: [
        'Delivering to the right program; guaranteed delivery',
        'Addressing every machine and routing packets across networks - but it is best-effort: no guarantee of arrival or order',
        'Encrypting data; perfect security',
        'The physical wire; guaranteed speed'
      ],
      answer: 1,
      explain: 'Best-effort keeps routers simple and fast; fixing lost or out-of-order packets is the job of the layer above, which is why TCP exists.'
    },
    {
      q: 'What does the Transport layer add that the Internet layer doesn\'t?',
      choices: [
        'Encryption',
        'Delivery to the right program on a machine, using ports - the IP address gets you to the building, the port to the right apartment',
        'The physical connection',
        'The web page itself'
      ],
      answer: 1,
      explain: 'It also decides how careful to be about delivery, which is the TCP-versus-UDP fork.'
    },
    {
      q: 'What does Connection refused versus Connection timed out tell you?',
      choices: [
        'They mean the same thing',
        'Refused means the machine answered but nothing was listening on that port; timed out means nothing answered at all (look lower, at Internet or Link)',
        'Refused is a server bug; timed out is yours',
        'Both mean the DNS failed'
      ],
      answer: 1,
      explain: 'Knowing which layer owns the error tells you where to point your attention.'
    },
  ],
  'tcp-ip-model/3': [
    {
      q: 'What does TCP guarantee that UDP does not?',
      choices: [
        'Faster delivery',
        'It sets up a connection (the three-way handshake) and guarantees every byte arrives, in order, re-sending anything lost',
        'Encryption',
        'A lower port number'
      ],
      answer: 1,
      explain: 'Use TCP when a missing piece ruins the result - a half-downloaded program will not run, a corrupted page will not render.'
    },
    {
      q: 'When is UDP the right choice?',
      choices: [
        'Downloading a file',
        'When a late or missing piece is merely stale, not ruinous - live video, voice, games, DNS',
        'Sending email',
        'Loading a web page'
      ],
      answer: 1,
      explain: 'In a video call a late packet is worthless - you would rather drop it and show the next frame than freeze waiting for a re-send.'
    },
    {
      q: 'How do the OSI 7-layer and TCP/IP 4-layer models relate?',
      choices: [
        'They describe different networks',
        'They describe the same reality at different resolutions - OSI just has more lines; its numbers (layer 7, layer 3) are the ones engineers quote',
        'OSI replaced TCP/IP',
        'TCP/IP is a subset of one OSI layer'
      ],
      answer: 1,
      explain: 'OSI\'s top three fold into TCP/IP\'s Application layer and its bottom two into Link; the two different counts do not mean you misunderstood something.'
    },
  ],
  'tdd-and-bdd-honestly/1': [
    {
      q: 'What is TDD really for, beyond catching bugs?',
      choices: [
        'Making code run faster',
        'Forcing you to decide what you want before you build it - you cannot test a function until you have named it, its input, and its output',
        'Replacing documentation',
        'Avoiding code review'
      ],
      answer: 1,
      explain: 'It makes you answer those design questions in code, up front, where they are cheap.'
    },
    {
      q: 'What is the TDD loop?',
      choices: [
        'Write all tests, then all code',
        'Red (write a failing test) to green (simplest code that passes) to refactor (clean up under a passing test), in tiny increments',
        'Code, then test, then deploy',
        'Plan, build, ship'
      ],
      answer: 1,
      explain: 'The loop is small - often a single test and a few lines at a time - not a big upfront test-writing phase.'
    },
    {
      q: 'Why does watching the test fail first (red) matter?',
      choices: [
        'It is just a formality',
        'It proves the test actually runs and checks something - a test that passes before you write any code tests nothing',
        'It makes the code faster',
        'It is required by the framework'
      ],
      answer: 1,
      explain: 'Red first means that when it goes green, you know your code is why.'
    },
  ],
  'tdd-and-bdd-honestly/2': [
    {
      q: 'What is BDD\'s Given/When/Then format for?',
      choices: [
        'Speeding up tests',
        'Describing behavior in near-English so non-developers can read a scenario and confirm it is the behavior they want',
        'Replacing the database',
        'Encrypting tests'
      ],
      answer: 1,
      explain: 'Given some context, when something happens, then expect some result - catching the misunderstanding in a readable test before you write the wrong code.'
    },
    {
      q: 'How does BDD relate to TDD?',
      choices: [
        'They are unrelated',
        'BDD is the same red-green-refactor loop pitched at the level of behavior instead of individual functions - the outside-in framing over TDD\'s inside-out construction',
        'BDD replaces TDD',
        'TDD is a type of BDD'
      ],
      answer: 1,
      explain: 'Teams often use both: a BDD scenario describes the outer behavior, and TDD drives the small units inside that make it work.'
    },
    {
      q: 'What is the real cost of BDD\'s plain-English scenarios?',
      choices: [
        'They run slower',
        'They (and the step definitions wiring them to code) must be maintained - if nobody outside the dev team reads them, you are paying for a translation layer with no audience',
        'They cannot be automated',
        'They require a special database'
      ],
      answer: 1,
      explain: 'BDD pays off when real non-developers read and shape the scenarios; otherwise it is BDD\'s costs without its benefit.'
    },
  ],
  'tdd-and-bdd-honestly/3': [
    {
      q: 'Where does TDD genuinely shine?',
      choices: [
        'Exploratory prototyping',
        'Well-understood logic with clear right answers, bug reproduction, and tricky edge cases - where you can state the expected output before writing code',
        'UI look-and-feel',
        'Throwaway scripts'
      ],
      answer: 1,
      explain: 'Before fixing a bug, write a test that reproduces it and watch it fail - you prove you understand it and inoculate against that regression forever.'
    },
    {
      q: 'Where does TDD fight you?',
      choices: [
        'Pricing rules',
        'Exploratory work where you do not yet know what you want, and UI look-and-feel judged by eyes, not assertions - explore first, then test the keeper',
        'Date math',
        'Validation logic'
      ],
      answer: 1,
      explain: 'You cannot write a test for behavior you have not decided on; forcing TDD there means writing and rewriting tests for code you throw away.'
    },
    {
      q: 'What is cargo-culting in testing?',
      choices: [
        'Writing too many tests',
        'Imitating the visible rituals while missing the substance - test-first theater, meaningless coverage, BDD with no business readers; the ritual is present but the benefit is absent',
        'Using the wrong framework',
        'Testing in production'
      ],
      answer: 1,
      explain: 'TDD and BDD are tools, not religion; reach for them when they solve a problem you have, and drop them when they do not.'
    },
  ],
  'testing-in-ci/1': [
    {
      q: 'What is CI, at its core?',
      choices: [
        'A deployment robot',
        'A server that automatically runs your test suite on a clean machine every time anyone pushes code',
        'A code editor',
        'A type of database'
      ],
      answer: 1,
      explain: 'It runs the same pytest or npm test you already run, just on a fresh machine, automatically, without anyone remembering to.'
    },
    {
      q: 'How does a CI check usually become a gate?',
      choices: [
        'It posts a comment',
        'The repo is configured so the merge button stays blocked until the check is green, so broken code cannot reach main',
        'It emails the team',
        'It deletes failing branches'
      ],
      answer: 1,
      explain: 'CI turns we should run the tests (a hope) into you cannot merge unless they pass (a guarantee), enforced by a machine for everyone equally.'
    },
    {
      q: 'Why does CI beat it passed on my machine?',
      choices: [
        'CI has faster hardware',
        'CI starts from a clean checkout - nothing installed and nothing on disk except what is committed - which is the only state that matters',
        'CI runs more tests',
        'CI is run by a person'
      ],
      answer: 1,
      explain: 'Your machine lies via forgotten installed tools, uncommitted files, and leftover state; when they disagree, trust CI - a clean checkout is what production gets.'
    },
  ],
  'testing-in-ci/2': [
    {
      q: 'What does a single CI run do, in order?',
      choices: [
        'Just run the tests',
        'Check out the code, set up the runtime, install dependencies, lint, run the tests, and report green or red',
        'Deploy, then test',
        'Build an image only'
      ],
      answer: 1,
      explain: 'The early steps are where many test failures actually come from - if install fails, the run goes red before a single test executes.'
    },
    {
      q: 'How does CI know whether a step passed without understanding your test framework?',
      choices: [
        'It parses the output text',
        'It reads the exit code - your test runner exits 0 on success and non-zero on failure',
        'It counts the lines',
        'It asks the developer'
      ],
      answer: 1,
      explain: 'That is the entire contract; the log also names the exact failing test, expected versus actual, and the file and line.'
    },
    {
      q: 'What is a build matrix, and what does it cost?',
      choices: [
        'A way to encrypt builds',
        'Running the same job across a grid of versions/OSes to catch works-on-mine bugs - at the cost of more CI time (each combination is a full run)',
        'A faster single run',
        'A way to skip tests'
      ],
      answer: 1,
      explain: 'Add OSes and versions only where you genuinely support them; a red Windows cell with a green Linux cell reveals an OS-specific assumption for free.'
    },
  ],
  'testing-in-ci/3': [
    {
      q: 'What is a flaky test, and why is it so dangerous?',
      choices: [
        'A slow test',
        'A test that passes or fails randomly on the exact same code - it teaches the team that red does not necessarily mean broken, so eventually a real bug gets ignored',
        'A test with no assertions',
        'A test that only runs locally'
      ],
      answer: 1,
      explain: 'A flaky suite is worse than no suite, because it lulls you into false confidence; it slowly costs the team\'s trust in every test.'
    },
    {
      q: 'What is the most common source of test flakiness?',
      choices: [
        'Too many assertions',
        'Fixed sleeps that race the clock - a CI machine under load is slower than your laptop, so the guess sometimes loses; wait for conditions, not for time',
        'Using a real database',
        'Running tests in order'
      ],
      answer: 1,
      explain: 'Other sources are shared state between tests and uncontrolled external dependencies like the network, a live clock, or randomness.'
    },
    {
      q: 'You found a flaky test but can\'t fix it right now. What is the right move?',
      choices: [
        'Add a retry and move on',
        'Quarantine it - mark it skipped with a tracking ticket, so the build goes reliably green again while the test waits to be fixed',
        'Delete it',
        'Leave it failing randomly'
      ],
      answer: 1,
      explain: 'A retry hides flakiness rather than fixing it; quarantine is a holding cell, not a graveyard - the goal is always to fix and restore it.'
    },
  ],
  'the-filesystem-explained/1': [
    {
      q: 'What is a filesystem?',
      choices: [
        'A type of hard drive',
        'The story the OS tells on top of dumb numbered storage - turning it into named files organized in a tree of folders',
        'A physical part of the disk',
        'A backup program'
      ],
      answer: 1,
      explain: 'The disk is a flat wall of numbered boxes; the folders-and-files tree is a structure the OS imposes to make that storage usable.'
    },
    {
      q: 'What is the difference between an absolute and a relative path?',
      choices: [
        'They are the same',
        'Absolute starts at the root (begins with / or C:\\) and means the same file everywhere; relative starts from where you are standing',
        'Absolute is shorter',
        'Relative always starts with /'
      ],
      answer: 1,
      explain: 'When a relative path should work but does not, run pwd - the path was probably fine, your location was not.'
    },
    {
      q: 'What does `~` mean in a Unix shell?',
      choices: [
        'A folder literally named tilde',
        'Shorthand the shell replaces with the absolute path of your home folder',
        'The root directory',
        'The current folder'
      ],
      answer: 1,
      explain: 'Two different users typing ~ get two different real paths; ~/projects is shorthand for the full path to your home\'s projects folder.'
    },
  ],
  'the-filesystem-explained/2': [
    {
      q: 'What does Permission denied usually mean?',
      choices: [
        'The file is corrupted',
        'The rules on this file do not grant you the action you tried - act as an allowed user, change the rules, or accept you should not',
        'The disk is full',
        'A bug in the OS'
      ],
      answer: 1,
      explain: 'It is the system doing its job, stopping an action that would have been a mistake or a security hole.'
    },
    {
      q: 'In the rwx model, what does `x` mean on a file versus a folder?',
      choices: [
        'The same thing for both',
        'On a file, x means run it as a program; on a folder, x means you may enter it / pass through it',
        'x means read on a file, write on a folder',
        'x is unused on folders'
      ],
      answer: 1,
      explain: 'A folder you can read but not enter lets you see the names inside but not open them - a baffling situation until you know this rule.'
    },
    {
      q: 'Why is reflexively adding `sudo` to make errors disappear dangerous?',
      choices: [
        'sudo is slow',
        'sudo removes the guardrail - you can damage the system or end up owning files as root you can no longer edit normally',
        'sudo deletes files',
        'sudo is illegal'
      ],
      answer: 1,
      explain: 'If a normal action needs sudo, pause and ask why the file is protected before forcing past it.'
    },
  ],
  'the-filesystem-explained/3': [
    {
      q: 'On macOS/Linux, what makes a file hidden?',
      choices: [
        'A special attribute you toggle',
        'Its name starts with a dot - that is the entire rule; ls -a reveals them',
        'It is in a system folder',
        'It has no extension'
      ],
      answer: 1,
      explain: 'These dotfiles hold config and tool state; hidden does not mean protected - the dot only hides it from casual listing, it is tidiness not security.'
    },
    {
      q: 'If you rename `report.pdf` to `report.txt`, what happens to the file?',
      choices: [
        'It becomes a text file',
        'Nothing - the extension is a naming hint, not magic; the bytes are unchanged and it is still a PDF',
        'It is corrupted',
        'It is deleted'
      ],
      answer: 1,
      explain: 'Renaming changes which program tries to open it, not the contents; to truly convert a file you need a program that reads one format and writes another.'
    },
    {
      q: 'How does the OS turn a path like /home/ada/notes.txt into bytes?',
      choices: [
        'It jumps straight to the file',
        'It walks the tree one folder at a time, top down, checking permission at each step',
        'It searches the whole disk',
        'It reads an index of all files'
      ],
      answer: 1,
      explain: 'This is why not found can mean a folder partway up is wrong, and why denied can come from a folder you did not even name (you lacked x to pass through it).'
    },
  ],
  'the-terminal-and-shell/1': [
    {
      q: 'What is the difference between a terminal and a shell?',
      choices: [
        'They are the same',
        'The terminal is the window (it draws text and captures keystrokes); the shell is the program inside it that reads and runs your commands',
        'The shell is the window; the terminal runs commands',
        'The terminal is a type of shell'
      ],
      answer: 1,
      explain: 'bash, zsh, and PowerShell are shells - same job, different syntax; the terminal is just the pane of glass with a keyboard.'
    },
    {
      q: 'What is the prompt (the `$` or `%` or `>`)?',
      choices: [
        'Part of the command',
        'The shell saying I am ready, type something - and you do not type the leading prompt character from a guide',
        'An error indicator',
        'The name of the shell'
      ],
      answer: 1,
      explain: 'Pasting the leading $ into a command is a common first-day stumble that gives a baffling command not found error.'
    },
    {
      q: 'Why do developers type commands instead of clicking?',
      choices: [
        'It is harder, which is the point',
        'Precision (exactly what you want), repeatability (text can be saved and rerun), and reach (servers often have no desktop at all)',
        'It looks more professional',
        'Clicking is not possible on a computer'
      ],
      answer: 1,
      explain: 'Text is precise, saveable, and works everywhere - even on a machine you will never physically see.'
    },
  ],
  'the-terminal-and-shell/2': [
    {
      q: 'In `ls -l Documents`, what are the three parts?',
      choices: [
        'Three separate commands',
        'The command (ls), an option/flag (-l, how to do it), and an argument (Documents, what to act on)',
        'A path, a file, and a folder',
        'Three arguments'
      ],
      answer: 1,
      explain: 'Parts are separated by spaces; almost any command also accepts --help to summarize its options.'
    },
    {
      q: 'What does `cd ..` do?',
      choices: [
        'Deletes the current folder',
        'Moves up one level - .. always means the parent folder',
        'Goes to your home folder',
        'Lists the directory'
      ],
      answer: 1,
      explain: 'Plain cd with nothing after it jumps straight to your home folder; cd - returns you to the folder you were in just before.'
    },
    {
      q: 'What is the most important thing to know about `rm`?',
      choices: [
        'It is slow',
        'It does not move files to a Recycle Bin or Trash - there is no undo, the deletion is immediate and permanent',
        'It asks for confirmation',
        'It only works on empty files'
      ],
      answer: 1,
      explain: 'Silence means it worked; run ls first to confirm you are deleting what you think you are - the terminal does exactly what you said, instantly.'
    },
  ],
  'transactions-and-acid/1': [
    {
      q: 'What is a transaction?',
      choices: [
        'A single SQL statement',
        'A bundle of changes the database treats as all-or-nothing - apply all of them, or if anything goes wrong, none of them',
        'A backup of the database',
        'A type of index'
      ],
      answer: 1,
      explain: 'Wrap related writes in BEGIN ... COMMIT so they live or die together; the money transfer is the canonical case - two updates that must succeed or fail together.'
    },
    {
      q: 'What do BEGIN, COMMIT, and ROLLBACK do?',
      choices: [
        'They create tables',
        'BEGIN opens the bundle; COMMIT makes everything in it permanent at once; ROLLBACK discards everything in it at once',
        'BEGIN commits; COMMIT undoes; ROLLBACK opens',
        'They are all the same'
      ],
      answer: 1,
      explain: 'Inside an open bundle you see your own provisional changes; the outside world sees nothing until COMMIT.'
    },
    {
      q: 'Why should you keep transactions short?',
      choices: [
        'They are billed by time',
        'An open transaction holds locks and resources until you close it - other transactions pile up behind it and cleanup cannot reclaim space',
        'Long transactions are illegal',
        'It makes COMMIT faster'
      ],
      answer: 1,
      explain: 'Open a transaction as late as you can and close it as soon as you can; do not do slow, unrelated work in the middle of one.'
    },
  ],
  'transactions-and-acid/2': [
    {
      q: 'What does Atomicity guarantee?',
      choices: [
        'Data is encrypted',
        'Every change in a transaction happens or none do - there is no halfway',
        'Reads are fast',
        'Many users can connect'
      ],
      answer: 1,
      explain: 'It is what makes ROLLBACK trustworthy - because the bundle is indivisible, undoing it cannot leave debris behind.'
    },
    {
      q: 'What does the Consistency in ACID mean?',
      choices: [
        'All servers agree on the latest value',
        'A transaction can only move the database from one valid state to another - it cannot commit a state that breaks your declared rules (constraints)',
        'Reads never change',
        'Data is duplicated everywhere'
      ],
      answer: 1,
      explain: 'This is a different thing from the C in the CAP theorem (whether all servers agree); same word, different conversation.'
    },
    {
      q: 'What does Durability promise?',
      choices: [
        'Transactions never fail',
        'Once a transaction has committed, its changes survive any crash, power loss, or reboot',
        'Data is never deleted',
        'Backups run automatically'
      ],
      answer: 1,
      explain: 'It is a promise about committed transactions only - the database writes the change somewhere permanent before telling you COMMIT succeeded.'
    },
  ],
  'transactions-and-acid/3': [
    {
      q: 'What is a dirty read?',
      choices: [
        'Reading a corrupted file',
        'Reading a change another transaction made but has not committed yet - and then that transaction rolls back, so you acted on data that never existed',
        'Reading too many rows',
        'A read that takes too long'
      ],
      answer: 1,
      explain: 'It is the worst anomaly, so most databases forbid it by default; non-repeatable reads and phantom reads are subtler.'
    },
    {
      q: 'What is an isolation level?',
      choices: [
        'A security setting',
        'A dial trading safety against speed - each level blocks more anomalies (dirty/non-repeatable/phantom reads) at more cost, from Read Uncommitted to Serializable',
        'The number of users allowed',
        'A type of index'
      ],
      answer: 1,
      explain: 'Defaults and exact behavior differ by database - Postgres defaults to Read Committed, MySQL InnoDB to Repeatable Read; look up yours, do not assume.'
    },
    {
      q: 'What is a deadlock, and how do real apps handle it?',
      choices: [
        'A corrupted database; restore from backup',
        'Two transactions each waiting on a lock the other holds; the database kills one as a victim and rolls it back - the app catches the error and retries',
        'A slow query; add an index',
        'A network failure; reconnect'
      ],
      answer: 1,
      explain: 'Prevent most deadlocks by locking rows in a consistent order and keeping transactions short.'
    },
  ],
  'troubleshooting-networks/1': [
    {
      q: 'What is the method for troubleshooting a network problem?',
      choices: [
        'Guess and restart things',
        'Walk up the layers from the bottom, testing one yes/no question at a time, and stop at the first no',
        'Replace the hardware',
        'Reboot everything at once'
      ],
      answer: 1,
      explain: 'Once you hit a no, everything below it is proven healthy and everything above is irrelevant until you fix this one rung.'
    },
    {
      q: 'If a name fails to resolve but pinging a raw IP works, what does that point to?',
      choices: [
        'A dead server',
        'A DNS problem - the network carries packets fine, it is the name-to-address lookup that is broken',
        'A firewall',
        'A bad cable'
      ],
      answer: 1,
      explain: 'Is it DNS? is the most useful single question in network troubleshooting; the joke it is always DNS exists because this rung fails constantly and looks like a total outage.'
    },
    {
      q: 'You see only a `169.254.x.x` address on your interface. What does that mean?',
      choices: [
        'You have a valid IP',
        'A self-assigned address - your machine asked for a real one via DHCP, got no answer, and made one up; treat it as a Rung-2 failure',
        'The network is fast',
        'You are connected to the gateway'
      ],
      answer: 1,
      explain: 'It is not you have an IP, it is you failed to get one - the DHCP server (often the router) did not respond.'
    },
  ],
  'troubleshooting-networks/2': [
    {
      q: 'What two things does `ping` tell you?',
      choices: [
        'The route and the DNS record',
        'Whether replies come back (reachability) and how long they take and how consistently (latency and loss)',
        'The file size and speed',
        'The IP and the port'
      ],
      answer: 1,
      explain: 'Read it in order: the resolved IP on line 1 (DNS worked), then % packet loss (reachable and reliable?), then avg and mdev (fast and steady?).'
    },
    {
      q: 'Why is no ping reply not always proof a host is down?',
      choices: [
        'Ping is unreliable',
        'Many servers and firewalls are deliberately configured to ignore ping (ICMP) while happily serving real traffic',
        'Ping only works locally',
        'The host must be rebooted'
      ],
      answer: 1,
      explain: 'Use ping as a positive signal (replies = definitely reachable); treat no reply as inconclusive, not proof of death.'
    },
    {
      q: 'In a `traceroute`, what does it mean when the trace hits `* * *` and never reaches the destination?',
      choices: [
        'The trace finished successfully',
        'Your packets travel fine up to the last responding hop, and something at or after the next hop is swallowing them - that is where the break is',
        'The destination is fast',
        'DNS failed'
      ],
      answer: 1,
      explain: 'A few * * * in the middle of an otherwise-complete trace are often harmless (routers that forward but do not reply); the failure that matters is when it never reaches the destination.'
    },
  ],
  'unit-integration-e2e/1': [
    {
      q: 'What single decision drives where a test sits on the pyramid?',
      choices: [
        'Which framework you use',
        'How much of the system it runs - one piece (unit), a few real pieces (integration), or the whole thing as a user (E2E)',
        'How long it takes to write',
        'Who writes it'
      ],
      answer: 1,
      explain: 'That one choice drives how fast the test is and how precisely it points at the bug when it fails.'
    },
    {
      q: 'Why is the testing pyramid wide at the base (many unit tests)?',
      choices: [
        'Unit tests are easier to write',
        'Fast tests actually get run, and narrow tests point straight at the bug when they fail',
        'E2E tests are deprecated',
        'Unit tests catch more bugs'
      ],
      answer: 1,
      explain: 'More-of-the-system means slower and flakier, so you write fewer; a base of thousands of unit tests finishes before you take your hand off the keyboard.'
    },
    {
      q: 'Why do you need the top of the pyramid at all, if unit tests are fast and precise?',
      choices: [
        'For appearances',
        'Units are blind to the seams between pieces - only a test that runs more than one real piece can catch that the pieces actually fit together',
        'E2E tests run faster',
        'To increase the coverage number'
      ],
      answer: 1,
      explain: 'Each function can pass every unit test while expecting a date in one shape that the database returns in another; integration and E2E exist to test the connections.'
    },
  ],
  'unit-integration-e2e/2': [
    {
      q: 'What does an integration test catch that a unit test cannot?',
      choices: [
        'Logic bugs in one function',
        'The seams - that your code and a real collaborator (like the database) actually agree',
        'Visual layout bugs',
        'Nothing different'
      ],
      answer: 1,
      explain: 'saveCart and loadCart might each pass their unit tests and still disagree about how a cart is stored; an integration test that saves and reads it back catches that.'
    },
    {
      q: 'What is the number-one source of flaky integration tests?',
      choices: [
        'Slow hardware',
        'Leftover state - if one test does not start from a clean slate, the next can pass or fail depending on what ran before it',
        'Too many assertions',
        'Using a real database'
      ],
      answer: 1,
      explain: 'Reset the data between tests (a rolled-back transaction or a truncate) so every test starts from the same known state; a test that depends on run order is testing your luck.'
    },
    {
      q: 'What does an end-to-end (E2E) test cost the most of, on both axes?',
      choices: [
        'Money',
        'Speed (seconds per test) and flakiness (timing, network, rendering can fail it while your code is fine)',
        'Disk space',
        'Developer skill'
      ],
      answer: 1,
      explain: 'That is the tax for testing everything at once - everything that can wobble, does; so you write few of them, on the journeys that matter.'
    },
  ],
  'unit-integration-e2e/3': [
    {
      q: 'What is the guiding rule for placing a test?',
      choices: [
        'Always use E2E for confidence',
        'Push every test down to the lowest level that can honestly catch the bug you are worried about',
        'Always use unit tests',
        'Match the level to who is available'
      ],
      answer: 1,
      explain: 'Reserve slow, blunt E2E tests for the handful of journeys where the whole thing works end to end is the actual risk; let units and integration carry everything below.'
    },
    {
      q: 'What is the ice-cream cone anti-pattern?',
      choices: [
        'Too many unit tests',
        'The pyramid flipped - mostly E2E tests on almost no units, so the suite is slow, flaky, and its failures point nowhere',
        'A type of integration test',
        'Testing in production'
      ],
      answer: 1,
      explain: 'It grows by accident because testing through the UI feels most real; the cure is to invert it by moving coverage down, not by adding more E2E.'
    },
    {
      q: 'Why does more E2E not mean more confidence?',
      choices: [
        'E2E tests are inaccurate',
        'An E2E test is slow and, when it fails, points at a whole region instead of a bug - a suite of them is slow to run and slow to diagnose',
        'E2E tests cannot fail',
        'They test less of the system'
      ],
      answer: 1,
      explain: 'You get the most realistic tests and the least usable suite; confidence you cannot run often, and cannot act on quickly, is not worth what it costs.'
    },
  ],
  'using-a-debugger/1': [
    {
      q: 'What does a debugger let you do that print() does not?',
      choices: [
        'Run code faster',
        'Pause your running program and see all the live state at once - no guessing what to observe, no edit-and-rerun for each new question',
        'Fix bugs automatically',
        'Test the code'
      ],
      answer: 1,
      explain: 'print makes you predict what to look at and pay an edit-rerun tax for every new question; a breakpoint shows you all the state at once.'
    },
    {
      q: 'When is print()/logging honestly still the better tool?',
      choices: [
        'Never',
        'Strong hunches, patterns across many runs, production you cannot attach to, and timing-sensitive concurrent code',
        'Only for beginners',
        'Only for small programs'
      ],
      answer: 1,
      explain: 'A debugger pauses one execution; to understand a pattern across thousands of requests, or a failure you cannot reproduce locally, persistent logging is the right tool.'
    },
    {
      q: 'What is a breakpoint?',
      choices: [
        'A bug in the code',
        'A line you mark so the program runs normally until it reaches it, then pauses before running it and hands you control',
        'A point where the program crashes',
        'A type of print statement'
      ],
      answer: 1,
      explain: 'The program runs at full speed until the breakpoint, then freezes so you can poke around the frozen snapshot.'
    },
  ],
  'using-a-debugger/2': [
    {
      q: 'What is the difference between step over and step into?',
      choices: [
        'They are the same',
        'Step over runs the current line whole (including any function it calls); step into descends inside a function call to inspect it',
        'Step over goes inside; step into stays out',
        'Step into is faster'
      ],
      answer: 1,
      explain: 'Step into is the move that answers is the bug in this function, or in the one it calls; step out finishes the current function and pops you up one level.'
    },
    {
      q: 'Why might your breakpoint do nothing when you run the program?',
      choices: [
        'The breakpoint is broken',
        'You ran in normal mode instead of debug mode - a breakpoint only fires if the debugger is attached',
        'The line never runs',
        'Breakpoints expire'
      ],
      answer: 1,
      explain: 'Hit plain Run and your breakpoints sit there doing nothing; you have to launch with the Debug button or the debugger attached.'
    },
    {
      q: 'What does the call stack tell you?',
      choices: [
        'The current value of variables',
        'How you got here - the chain of function calls that led to where you are paused; click a frame to see its variables',
        'How fast the program is',
        'Which line will run next only'
      ],
      answer: 1,
      explain: 'Variables answer what is true here; the call stack answers how did we get into this situation - most real bugs need both.'
    },
  ],
  'using-a-debugger/3': [
    {
      q: 'What is a conditional breakpoint good for?',
      choices: [
        'Pausing on every line',
        'Pausing only when a condition you write is true - so a bug on the 200th loop iteration fires once, at the moment it goes wrong',
        'Speeding up the program',
        'Skipping all breakpoints'
      ],
      answer: 1,
      explain: 'Instead of clicking continue 199 times, a condition like item.id == 4096 drops you straight into the scene of the crime.'
    },
    {
      q: 'What does a watchpoint (data breakpoint) do?',
      choices: [
        'Watches a line of code',
        'Pauses the program the instant a particular variable or field changes, no matter which line did it',
        'Times how long the program runs',
        'Watches the network'
      ],
      answer: 1,
      explain: 'It solves this value is wrong by the time I look at it but I have no idea where it got set - it stops on the exact line that wrote the bad value.'
    },
    {
      q: 'How can a debugger lie to you?',
      choices: [
        'It shows fake values',
        'Pausing at a breakpoint changes when things happen, which can make a timing-sensitive race condition vanish or shift',
        'It rewrites your code',
        'It only works on Python'
      ],
      answer: 1,
      explain: 'For concurrent, timing-sensitive code, logging observes without stopping the clock, where a breakpoint would alter the very behavior you are chasing.'
    },
  ],
  'using-an-llm-api/1': [
    {
      q: 'What is calling a hosted LLM, technically?',
      choices: [
        'A special AI connection you install',
        'An ordinary HTTP POST - a URL, your key in a header, and a JSON body with a messages list',
        'A model loaded into your process',
        'A websocket stream only'
      ],
      answer: 1,
      explain: 'No GPU, no model download, no special protocol; you send a conversation and get back the next message.'
    },
    {
      q: 'What are the three main message roles?',
      choices: [
        'input, output, error',
        'system (your standing instructions), user (what the person typed), and assistant (the model\'s earlier replies)',
        'get, post, put',
        'admin, user, guest'
      ],
      answer: 1,
      explain: 'You read the answer from choices[0].message.content; the system message is how you set the model\'s behavior for the whole conversation.'
    },
    {
      q: 'The LLM server is stateless. What does that mean for a multi-turn conversation?',
      choices: [
        'The server remembers everything',
        'There is no session on the server - to continue, you resend the prior turns yourself each time',
        'Conversations are impossible',
        'You must keep one connection open'
      ],
      answer: 1,
      explain: 'Memory is something you provide by carrying and resending the earlier turns; it is also exactly why long chats get expensive.'
    },
  ],
  'using-an-llm-api/2': [
    {
      q: 'What is a token?',
      choices: [
        'One word',
        'A chunk of text, usually a bit smaller than a word - the unit both your input and the model\'s output are measured in',
        'One character',
        'One sentence'
      ],
      answer: 1,
      explain: 'A rough rule is a token is a bit less than a word, but use the provider\'s counter or the usage field for anything that matters.'
    },
    {
      q: 'What is the context window, and what does input and output sharing it cause?',
      choices: [
        'The model\'s training data',
        'The fixed token budget that input and output share - overflow it and replies get cut off (finish_reason length) or the request is rejected',
        'The size of the screen',
        'The number of conversations allowed'
      ],
      answer: 1,
      explain: 'This is the real reason a long-running chat eventually breaks or forgets the beginning; trim or summarize old turns rather than blindly resending everything.'
    },
    {
      q: 'Why do long conversations get more expensive and slower with every message?',
      choices: [
        'The model charges more over time',
        'Because you resend the whole history each turn, each new message makes the next request bigger - and eventually too big',
        'The network degrades',
        'Tokens cost more at night'
      ],
      answer: 1,
      explain: 'A naive chat that just keeps appending turns catches people in production after the demo worked with three short messages; cap or summarize the history.'
    },
  ],
  'using-an-llm-api/3': [
    {
      q: 'What does the temperature setting control?',
      choices: [
        'The speed of the response',
        'How much randomness goes into each token pick - low is focused and repeatable, higher is more varied and creative',
        'The cost per token',
        'The model\'s knowledge'
      ],
      answer: 1,
      explain: 'Low temperature makes output more consistent but not guaranteed-identical or guaranteed-correct; do not build logic assuming the exact same string every time.'
    },
    {
      q: 'What is a hallucination, and how should you treat model output?',
      choices: [
        'A crash',
        'Fluent, confident, but false output - treat all output as a draft from a fast, sometimes-mistaken assistant, never as a source of truth',
        'A slow response',
        'A network error'
      ],
      answer: 1,
      explain: 'Wrong answers do not look wrong - verify anything load-bearing against a real source, and keep a human in the loop for high-stakes cases.'
    },
    {
      q: 'How should you handle the fact that an LLM call can be slow or fail?',
      choices: [
        'Wait forever and retry infinitely',
        'Set a timeout, retry transient failures with backoff and a cap, fail fast on permanent errors, and have a fallback',
        'Never call the model',
        'Ignore failures'
      ],
      answer: 1,
      explain: 'A naive integration with no timeout and infinite retries can turn one slow upstream moment into a pile-up that takes your own app down.'
    },
  ],
  'warehouses-vs-lakes/1': [
    {
      q: 'What is the difference between OLTP and OLAP?',
      choices: [
        'They are the same',
        'OLTP is your app\'s database (lots of tiny fast reads/writes); OLAP is the warehouse\'s job (a few enormous questions scanning and aggregating huge ranges)',
        'OLTP is for analytics; OLAP runs the app',
        'OLAP is faster at everything'
      ],
      answer: 1,
      explain: 'A warehouse exists so heavy analytical questions live somewhere they cannot hurt production - on hardware shaped for that work.'
    },
    {
      q: 'Why is columnar storage the reason warehouses are fast at analytics?',
      choices: [
        'It uses more servers',
        'Analytical queries touch a few columns across many rows; storing column-by-column means a query reads only the columns it needs and they compress well',
        'It stores data row by row',
        'It caches everything'
      ],
      answer: 1,
      explain: 'To total amount, a column store reads only the amount column and skips everything else - the same trait makes it slow at the OLTP job.'
    },
    {
      q: 'What does schema-on-write mean for a warehouse, and its downside?',
      choices: [
        'Structure is decided at query time',
        'Structure is decided up front (the price of admission), which makes queries fast and trustworthy but makes change slow - new fields mean evolving the schema and often backfilling',
        'There is no schema',
        'It only works for small data'
      ],
      answer: 1,
      explain: 'Structure that is great for querying is friction when reality shifts - exactly what the lake trades away.'
    },
  ],
  'warehouses-vs-lakes/2': [
    {
      q: 'What is a data lake, at its core?',
      choices: [
        'A queryable database engine',
        'A big pile of files in cheap object storage (S3/GCS/Azure Blob) - storage, not a database, with no shared schema enforced',
        'A type of warehouse',
        'A spreadsheet'
      ],
      answer: 1,
      explain: 'Its whole trick is that storing is dumb and cheap, and the cleverness happens later, at query time.'
    },
    {
      q: 'What does schema-on-read mean?',
      choices: [
        'Structure is forced at storage time',
        'You impose structure at the moment you query, by telling the engine how to interpret the raw files - structure is a lens you put on at read time, not a cage at write time',
        'There is never any structure',
        'Reads are slower than writes'
      ],
      answer: 1,
      explain: 'Schema-on-write (warehouse) front-loads the discipline; schema-on-read (lake) defers it - neither is better, they move the same work to different moments.'
    },
    {
      q: 'What is a data swamp?',
      choices: [
        'A flooded server room',
        'An ungoverned, uncataloged lake nobody can use - files with no owners, no docs, duplicates, no idea which dataset is current or trustworthy',
        'A fast lake',
        'A type of warehouse'
      ],
      answer: 1,
      explain: 'The same flexibility that makes a lake powerful is how it rots; governance and cataloging are the deliberate discipline a lake does not enforce for you.'
    },
  ],
  'warehouses-vs-lakes/3': [
    {
      q: 'Is the choice between a warehouse and a lake usually either/or?',
      choices: [
        'Yes, you must pick one',
        'No - they solve different problems and the most common real-world setup uses both, each doing the part it is good at',
        'Lakes always win',
        'Warehouses always win'
      ],
      answer: 1,
      explain: 'The question is mostly a false choice; the warehouse handles fast curated analytics, the lake handles cheap raw history and unstructured/ML data.'
    },
    {
      q: 'What is a lakehouse?',
      choices: [
        'A small warehouse',
        'A table layer (Iceberg/Delta/Hudi) over cheap lake object storage that gives warehouse-like tables, schemas, and reliable updates on the same storage as the raw data',
        'A type of spreadsheet',
        'A faster lake with no structure'
      ],
      answer: 1,
      explain: 'It converges the two - but lakehouse is also a marketing term and adds its own complexity, so it is not automatically the right choice.'
    },
    {
      q: 'Which is the failure mode that quietly sinks lake projects?',
      choices: [
        'Running out of storage',
        'Lack of governance - without cataloging, ownership, and documented zones, the lake becomes a data swamp',
        'Too much structure',
        'Slow hardware'
      ],
      answer: 1,
      explain: 'Schema-on-write forced someone to think about structure at load time; the lake removes that forcing function, so discipline must deliberately replace it.'
    },
  ],
  'webhooks-and-message-queues/1': [
    {
      q: 'What is the difference between polling and a webhook?',
      choices: [
        'They are the same',
        'Polling is you asking are we there yet over and over; a webhook flips it - you register a URL once and they POST to it the moment an event happens',
        'A webhook is slower than polling',
        'Polling pushes; webhooks pull'
      ],
      answer: 1,
      explain: 'Polling is either expensive (poll often) or slow (poll rarely), never both cheap and fast; a webhook removes that tension.'
    },
    {
      q: 'When a webhook delivery arrives, why should you return 2xx fast and offload slow work?',
      choices: [
        '2xx is required by law',
        'If your handler is slow, the sender may time out, decide the delivery failed, and retry - and now you process the same event twice',
        'It makes the response prettier',
        'Slow handlers are not allowed'
      ],
      answer: 1,
      explain: 'The common pattern: validate, drop the work onto an internal queue, return 200 immediately, and let a worker do the slow part.'
    },
    {
      q: 'Why must you verify a webhook\'s signature?',
      choices: [
        'To speed it up',
        'Your webhook URL is a public endpoint - anyone who learns it can POST a forged event; the signature proves the request came from the provider and was not tampered with',
        'Signatures compress the data',
        'It is optional hardening'
      ],
      answer: 1,
      explain: 'Recompute the HMAC of the raw body with the shared secret and check it matches - no match, no action; an endpoint without verification is an open door.'
    },
  ],
  'webhooks-and-message-queues/2': [
    {
      q: 'What is a message queue?',
      choices: [
        'A type of database',
        'A buffer between two services - a producer writes short messages in, a consumer reads them out and acts at its own pace',
        'A faster webhook',
        'A backup system'
      ],
      answer: 1,
      explain: 'Like a diner ticket rail: the server clips an order and walks away, the cook pulls tickets at the cook\'s pace; nobody on the left waits for anybody on the right.'
    },
    {
      q: 'What is the main point of a message queue - what does decoupling buy you?',
      choices: [
        'Faster code',
        'The producer\'s job ends the moment the message is in the queue - the two sides need not share a language, runtime, or even uptime, so one can be down without failing the other',
        'Less storage',
        'Guaranteed ordering'
      ],
      answer: 1,
      explain: 'When the email service breaks, signups keep working - the messages quietly wait; the queue is a stable contract in the middle that lets the system evolve.'
    },
    {
      q: 'What makes work survive a consumer crashing?',
      choices: [
        'The queue runs the code itself',
        'Acknowledgment - the broker only removes a message once the consumer acks it as done; an unacked message comes back for another worker',
        'Messages are saved to a file',
        'The producer retries'
      ],
      answer: 1,
      explain: 'The flip side is that a worker can finish the work then crash before acking, so the broker hands the message out again - a message can be delivered more than once.'
    },
  ],
  'webhooks-and-message-queues/3': [
    {
      q: 'What is the one-line rule for webhooks versus queues?',
      choices: [
        'They are interchangeable',
        'Use a webhook when another system tells yours something happened; use a queue when your own services hand work to each other',
        'Webhooks for big data, queues for small',
        'Always use both'
      ],
      answer: 1,
      explain: 'They pair beautifully: receive a webhook, verify and ack fast, then drop its payload onto an internal queue for your workers.'
    },
    {
      q: 'Both webhooks and queues are at-least-once. What does that mean and how do you handle it?',
      choices: [
        'Messages are never repeated',
        'Never lost, possibly delivered more than once - make your handler idempotent (record each event\'s unique ID and skip work you have already done)',
        'At-most-once, so plan for loss',
        'Exactly-once, so do nothing'
      ],
      answer: 1,
      explain: 'You cannot prevent duplicates at the delivery layer; you neutralize them at the handling layer - make the consumer idempotent.'
    },
    {
      q: 'What is a dead-letter queue (DLQ) for?',
      choices: [
        'Storing successful messages',
        'A separate queue where a message goes after it fails too many times, so one poison message cannot retry forever and stall everything behind it',
        'Speeding up delivery',
        'Encrypting messages'
      ],
      answer: 1,
      explain: 'It turns one bad message silently stalled our pipeline at 3am into the pipeline kept running, with four messages in the DLQ to inspect on Monday.'
    },
  ],
  'what-a-database-is/1': [
    {
      q: 'A database is two things, not one. What are they?',
      choices: [
        'A table and a query',
        'An organized store of data plus a program that manages all access to it - the DBMS',
        'A file and a folder',
        'A server and a client'
      ],
      answer: 1,
      explain: 'When people say the database is down they usually mean the DBMS, the running program; with a database you never touch the data directly, you ask the DBMS.'
    },
    {
      q: 'What are the three problems a DBMS handles that a spreadsheet cannot?',
      choices: [
        'Color, fonts, and charts',
        'Many users at once (concurrency), keeping data honest (integrity), and answering sharp questions fast (querying at scale)',
        'Backups, sharing, and printing',
        'Speed, size, and cost'
      ],
      answer: 1,
      explain: 'These problems are invisible while data is small and only you use it, and arrive at once the day a second user shows up - usually the worst possible day.'
    },
    {
      q: 'When do you actually need a database?',
      choices: [
        'When the data gets big',
        'When more than one person/program touches the same data, when bad data would cause real harm, or when you must ask sharp questions of many records',
        'Only for web apps',
        'Never for small projects'
      ],
      answer: 1,
      explain: 'Size is the least important reason; the DBMS earns its keep on correctness and sharing long before it earns it on scale.'
    },
  ],
  'what-a-database-is/2': [
    {
      q: 'What is the difference between a row and a column?',
      choices: [
        'They are the same',
        'A row is one complete record (one customer); a column is one field every row has (name, email), and each column has a fixed type the DBMS enforces',
        'A column is a record; a row is a field',
        'Rows hold types, columns hold data'
      ],
      answer: 1,
      explain: 'Almost everything you do is do something to some rows - read, add, change, or delete them - and fixed column types make a whole category of bugs impossible.'
    },
    {
      q: 'What is a schema?',
      choices: [
        'The data itself',
        'The agreed shape - the tables, their columns, and their types - defined up front, which every row must follow',
        'A query',
        'A backup'
      ],
      answer: 1,
      explain: 'It is the blueprint; the rows are the building. Changing it later (a migration) is a deliberate, planned operation, especially with live data.'
    },
    {
      q: 'Why use an auto-generated id as a primary key instead of something like a name or email?',
      choices: [
        'Numbers are faster to type',
        'A key must be unique and unchanging; names repeat and emails change, so a pointer to them eventually breaks - an id never repeats and never changes',
        'Names are not allowed',
        'Emails are too long'
      ],
      answer: 1,
      explain: 'A key turns a table from an isolated grid into something you can reliably point at - the foundation that lets tables connect to each other.'
    },
  ],
  'what-a-database-is/3': [
    {
      q: 'Where does the database actually live, relative to your app?',
      choices: [
        'Inside your app as a file it opens',
        'It is a separate program, often on a separate machine, that your app talks to over a connection',
        'It is part of the operating system',
        'It runs in the browser'
      ],
      answer: 1,
      explain: 'People imagine the database lives inside their app, but for the databases you use at work it is a separate program you communicate with.'
    },
    {
      q: 'What language do you use to talk to a relational database?',
      choices: [
        'Python',
        'SQL (Structured Query Language) - you send queries and the DBMS answers',
        'HTML',
        'JSON'
      ],
      answer: 1,
      explain: 'SQL is how you ask the DBMS to fetch, filter, add, or change data; you describe what you want and the engine figures out how to get it.'
    },
    {
      q: 'What does it mean that the database is a separate program your app connects to?',
      choices: [
        'The app and database must be the same language',
        'Your app opens a connection and sends queries over it; the database can serve many apps at once and lives independently of any one of them',
        'The database only works with one app',
        'The app must restart the database'
      ],
      answer: 1,
      explain: 'That separation is what lets the DBMS guard the data, serve many users safely, and outlive any single program that talks to it.'
    },
  ],
  'the-terminal-and-shell/3': [
    {
      q: 'What does a pipe `|` do?',
      choices: [
        'Saves output to a file',
        'Sends one command\'s text output into the next command as its input - read it as the word then',
        'Deletes the output',
        'Runs two commands at once independently'
      ],
      answer: 1,
      explain: 'ls | grep report means list the files, then keep the ones matching report - small commands snap together into a tool you invent on the spot.'
    },
    {
      q: 'What is the difference between `>` and `>>`?',
      choices: [
        'They are the same',
        '>  writes output to a file (overwriting it completely); >> appends to the end without disturbing what is there',
        '>  appends; >> overwrites',
        'Both append'
      ],
      answer: 1,
      explain: 'A single > overwrites with no warning; when unsure use >>, the one that cannot silently erase your file.'
    },
    {
      q: 'What is PATH, and what does command not found really mean?',
      choices: [
        'A file location; the file is corrupted',
        'PATH is the list of folders the shell searches to find the program behind a command name; command not found means it was not in any of them',
        'The current directory; a typo',
        'A network address; the server is down'
      ],
      answer: 1,
      explain: 'A command name is a filename the shell looks up in PATH; the fix is to install the program or add its folder to PATH - which is what an installer\'s add to PATH checkbox does.'
    },
  ],
  'troubleshooting-networks/3': [
    {
      q: 'What is a packet capture?',
      choices: [
        'A summary of network health',
        'A recording of every packet that crossed an interface, in time order with timestamps - a transcript of the real conversation, not a summary',
        'A type of firewall',
        'A ping with more detail'
      ],
      answer: 1,
      explain: 'Where ping and traceroute send their own probes and show summaries, a capture passively watches the real traffic; if a conversation broke, the break is in the recording.'
    },
    {
      q: 'In a packet capture, what does an incomplete TCP handshake tell you?',
      choices: [
        'The connection is healthy',
        'The connection cannot even start - a SYN with no answer (retransmitted again and again) means the far end is down, a firewall is dropping it, or it is the wrong address/port',
        'Data is flowing fine',
        'DNS failed'
      ],
      answer: 1,
      explain: 'Checking the handshake first splits the problem in half: if it completes, the machines can reach each other and trouble is in what follows.'
    },
    {
      q: 'In a capture, what does an `RST` (reset) packet mean, and what is crucial to read?',
      choices: [
        'A normal, polite close',
        'An abrupt refusal - someone actively killed the connection; the crucial detail is the direction (which side sent it) to know who refused',
        'A retransmission',
        'A successful request'
      ],
      answer: 1,
      explain: 'Direction is everything in a capture: whoever went quiet or sent the RST first is where to look - it makes whose fault a fact you can read, not an argument.'
    },
  ],
  'what-a-server-is/1': [
    {
      q: 'What is a server, at its core?',
      choices: [
        'A giant refrigerator-sized box in a locked room',
        'An ordinary computer running a program that waits for requests and answers them',
        'A type of database only',
        'A piece of networking hardware'
      ],
      answer: 1,
      explain: 'The word means both the software (the waiting program) and the hardware (the machine it runs on); context tells you which.'
    },
    {
      q: 'What does it mean that being a server is a role, not a kind of machine?',
      choices: [
        'Only special hardware can serve',
        'Any computer - even your laptop - is a server the moment it runs a program that waits for and answers requests',
        'Servers must be in data centers',
        'A server cannot also be a client'
      ],
      answer: 1,
      explain: 'Run python3 -m http.server and your laptop is the server; press Ctrl+C and it goes back to being just a laptop - the role was temporary.'
    },
    {
      q: 'In the client/server model, who starts the conversation?',
      choices: [
        'The server calls the client first',
        'The client asks; the server waits to be asked and answers - the server never calls you first',
        'They start simultaneously',
        'Neither; it is peer to peer'
      ],
      answer: 1,
      explain: 'That asymmetry is the heart of the model: one side reaches out, the other stands ready - which is why Connection refused means nothing was listening.'
    },
  ],
  'what-a-server-is/2': [
    {
      q: 'What does it mean that a server runs headless?',
      choices: [
        'It has no operating system',
        'It runs with no monitor, keyboard, or mouse - you operate it remotely over the network',
        'It has no CPU',
        'It cannot run programs'
      ],
      answer: 1,
      explain: 'The screen exists for a human\'s benefit; a web server answering requests has no human in front of it, so it does not get one.'
    },
    {
      q: 'Why are serious servers kept always-on in data centers?',
      choices: [
        'To save electricity',
        'A request could arrive at any hour, so they must keep running continuously - data centers provide backup power, cooling, and redundant network',
        'Because they cannot be turned off',
        'To make them harder to hack'
      ],
      answer: 1,
      explain: 'Always-on describes the intent, not a guarantee - servers do go down, and the whole discipline of infrastructure exists to get as close to always as possible.'
    },
    {
      q: 'Why does a server need a stable address?',
      choices: [
        'To look professional',
        'Clients need to find it and come back to the same place every time - usually an IP address behind a friendlier domain name',
        'To run faster',
        'So it can change networks'
      ],
      answer: 1,
      explain: 'Your laptop\'s address usually changes and is not meant to be found from outside; a lot of works-on-my-machine pain is really a reachability problem.'
    },
  ],
  'what-a-server-is/3': [
    {
      q: 'What does a hypervisor do?',
      choices: [
        'Speeds up a single program',
        'Splits one physical server into several independent virtual machines, each with its own slice of CPU, memory, and disk',
        'Connects servers to the internet',
        'Stores data permanently'
      ],
      answer: 1,
      explain: 'This is the breakthrough the cloud is built on: a server stops being a physical object and becomes a configuration of software you can create, copy, and destroy.'
    },
    {
      q: 'Why is the cloud is just someone else\'s computer literally true?',
      choices: [
        'The cloud is imaginary',
        'A cloud instance is a real computer (a VM on a physical box) in the provider\'s data center that you rent instead of own',
        'The cloud has no servers',
        'Cloud servers run in the sky'
      ],
      answer: 1,
      explain: 'You rent the parts you do not want to deal with - the metal, the building, power, cooling - and handle only the software.'
    },
    {
      q: 'What does serverless actually mean?',
      choices: [
        'There are no servers involved',
        'You hand the provider code and a rule for when to run it; they run it on their servers on demand - the server is fully managed and invisible to you',
        'Your code runs without a CPU',
        'A server that needs no electricity'
      ],
      answer: 1,
      explain: 'The name describes your experience, not reality - the server is still there, you just never pick its size, patch it, or keep it running.'
    },
  ],
  'what-ai-and-ml-are/1': [
    {
      q: 'How do AI, machine learning, deep learning, and LLMs relate?',
      choices: [
        'They are four competing technologies',
        'They are nested circles: AI contains machine learning, which contains deep learning, which contains today\'s LLMs',
        'They are unrelated fields',
        'LLMs are the biggest category'
      ],
      answer: 1,
      explain: 'Every inner circle is an example of the one around it, so we use AI and machine learning might describe the same system at different zoom levels.'
    },
    {
      q: 'What is artificial intelligence (the outermost circle)?',
      choices: [
        'A conscious thinking machine',
        'The broad goal of getting a machine to do something that would be called intelligent if a human did it - it says nothing about how',
        'Only neural networks',
        'A marketing term with no meaning'
      ],
      answer: 1,
      explain: 'The Pac-Man ghosts and an old chess program were both AI; AI is a goal, not a claim about consciousness, which is why powered by AI tells you almost nothing.'
    },
    {
      q: 'What distinguishes machine learning from traditional AI?',
      choices: [
        'It is faster',
        'The machine figures out the rules itself by studying examples, instead of a human writing the rules by hand',
        'It uses more memory',
        'It requires the internet'
      ],
      answer: 1,
      explain: 'Not all AI is machine learning - a clever rule-based system is AI but not ML, because a human still wrote every rule; ML makes the stronger claim that it learned.'
    },
  ],
  'what-ai-and-ml-are/2': [
    {
      q: 'What is the core shift from traditional code to machine learning?',
      choices: [
        'From slow to fast',
        'Traditional code is rules a human writes; machine learning is rules the machine learns from examples - same goal, opposite method',
        'From local to cloud',
        'From text to images'
      ],
      answer: 1,
      explain: 'Everything strange and powerful about AI flows from this single change in how the rules get made.'
    },
    {
      q: 'When does machine learning earn its keep over hand-written rules?',
      choices: [
        'Always - AI is the smarter choice',
        'When the pattern is real but too messy, fuzzy, or fast-changing to write down - like spam, where you know it when you see it but cannot finish the rule list',
        'Only for math problems',
        'When you have no data'
      ],
      answer: 1,
      explain: 'That gap - I know it when I see it but cannot write the rule - is exactly what machine learning was built to fill.'
    },
    {
      q: 'When do hand-written rules still win over machine learning?',
      choices: [
        'Never',
        'When the logic is simple, known, stable, or must be exact and explainable - like calculating sales tax or an age check',
        'Only on small computers',
        'When you have lots of data'
      ],
      answer: 1,
      explain: 'Reaching for ML when a five-line rule would do is a classic, expensive mistake; AI is not automatically the smarter answer.'
    },
  ],
  'what-ai-and-ml-are/3': [
    {
      q: 'What is today\'s AI actually doing when it answers you?',
      choices: [
        'Looking up facts and reasoning like a person',
        'Predicting the next likely piece of text from patterns it absorbed - powerful pattern-matching, not understanding',
        'Consulting an internal ledger of truth',
        'Thinking the way you do'
      ],
      answer: 1,
      explain: 'It is extraordinary at producing text that sounds right because sounding right is literally what it learned to do - keep human verbs like thinks and knows for humans.'
    },
    {
      q: 'What is a hallucination, and why is confidence not accuracy?',
      choices: [
        'A crash; confidence means it is right',
        'Fluent, confident, but false output - the model has the same assured tone whether right or wrong, because tone is part of the pattern and truth is not something it checks',
        'A slow response',
        'A network error'
      ],
      answer: 1,
      explain: 'Never read confidence as a signal of correctness; for anything that matters, verify against a real source.'
    },
    {
      q: 'Why does an AI model reproduce bias from its training data?',
      choices: [
        'It chooses to be unfair',
        'A model knows only what it learned from, so biases in the data get baked in and reproduced fluently - the model is a mirror of its inputs',
        'Bias is added on purpose',
        'Models are always objective'
      ],
      answer: 1,
      explain: 'A hiring tool trained on skewed past decisions learns the skew - the bias was in the data, and the model just made it scalable with an authoritative voice.'
    },
  ],
  'what-an-api-is/1': [
    {
      q: 'In the restaurant analogy, what is the API?',
      choices: [
        'The kitchen that does the work',
        'The menu and the waiter - the agreed way you ask and the agreed thing you get back',
        'The customer placing the order',
        'The food itself'
      ],
      answer: 1,
      explain: 'The API is the thin, public front of a much bigger thing you never see; you program against the menu, not the kitchen.'
    },
    {
      q: 'Why is an API called a contract?',
      choices: [
        'It is a legal document',
        'It is a promise with two halves: what requests you can make, and what response you will get back - both sides can rely on it',
        'It costs money to use',
        'It expires after a year'
      ],
      answer: 1,
      explain: 'The program offering it promises if you ask this way, I respond this way; neither side needs to know how the other is built internally.'
    },
    {
      q: 'Why is hiding the internals (abstraction) a feature, not a limitation?',
      choices: [
        'It keeps secrets from you',
        'Because the internals are hidden, the other side can rewrite everything and your code still works, as long as they keep honoring the menu',
        'It makes the API slower',
        'It is required by law'
      ],
      answer: 1,
      explain: 'You depend on the promise, not the plumbing - which is exactly what lets independently-built software work together for years.'
    },
  ],
  'what-an-api-is/2': [
    {
      q: 'What does the reuse reason for APIs let you do?',
      choices: [
        'Rebuild everything yourself',
        'Use someone else\'s hard work (maps, payments, email) by placing an order from their menu, without rebuilding or even understanding it',
        'Make your code run faster',
        'Avoid writing any code'
      ],
      answer: 1,
      explain: 'This is why apps almost never handle credit cards with their own banking code - they use a payments API and let a specialist\'s system do the risky part.'
    },
    {
      q: 'How do the frontend and backend of one app communicate?',
      choices: [
        'They share the same code directly',
        'Through an API - the frontend sends requests across a clean contract to the backend, so each half can change independently',
        'They cannot communicate',
        'Through the database only'
      ],
      answer: 1,
      explain: 'This is why a website can change its entire look overnight while your data and login stay the same - they changed the frontend, not the backend or the contract.'
    },
    {
      q: 'Why is breaking an API a big deal?',
      choices: [
        'It is illegal',
        'If a service changes its menu - renames a request, drops a field - every app that depended on the old contract can break at once, often without warning',
        'It makes the API slower',
        'Nothing happens'
      ],
      answer: 1,
      explain: 'An API is a stable boundary you depend on while the other side is free to change; that is why serious APIs go to great lengths to keep old contracts working (versioning).'
    },
  ],
  'what-an-api-is/3': [
    {
      q: 'What is the big split between kinds of APIs?',
      choices: [
        'Free vs paid',
        'Library/local (the other code is inside your own program; calls are instant) vs web (the other program is across a network; requests travel)',
        'Fast vs slow languages',
        'Old vs new'
      ],
      answer: 1,
      explain: 'A library call never leaves your machine; a web API request has to travel to a server and back.'
    },
    {
      q: 'What is the single biggest thing to internalize about web API calls?',
      choices: [
        'They are always free',
        'They can be slow and can fail, in ways a local function call effectively cannot - code that talks to web APIs must expect waiting and failure',
        'They never return data',
        'They only work in browsers'
      ],
      answer: 1,
      explain: 'A lot of real-world bugs come from treating a request across the internet as if it were as instant and reliable as calling code next door.'
    },
    {
      q: 'What is REST, in one line?',
      choices: [
        'A way to make code run faster',
        'The most common web-API style: treat everything as a resource you fetch and change with simple, standard actions',
        'A programming language',
        'A type of database'
      ],
      answer: 1,
      explain: 'Web API is not one thing - it is a family with dialects (REST, GraphQL, gRPC), and REST is the one you are most likely to meet first.'
    },
  ],
  'what-an-error-message-tells-you/1': [
    {
      q: 'What is an error message, really?',
      choices: [
        'The computer judging you',
        'A status report - the program hit a step it could not complete and is telling you it got this far, then could not continue, and why',
        'A sign your code is bad',
        'Random noise'
      ],
      answer: 1,
      explain: 'The computer cannot judge you; fear makes you skim and miss the one line with the answer, while calm makes you read.'
    },
    {
      q: 'What three parts does almost every error contain?',
      choices: [
        'Author, date, and severity',
        'Where it happened (file + line), what type of problem (the category), and the message (the specific detail)',
        'Input, output, and result',
        'A code, a fix, and a retry'
      ],
      answer: 1,
      explain: 'Once you can pluck out those three, you can read an error in a language you have never used - the structure is universal even when the words are not.'
    },
    {
      q: 'In a Python traceback, which direction should you read?',
      choices: [
        'Top to bottom',
        'Bottom to top - the last line (type + message) is the headline; the lines above are the trail of how it got there',
        'Middle outward',
        'It does not matter'
      ],
      answer: 1,
      explain: 'New readers start at the top, drown in file paths, and miss the one line that matters; the bottom line is the actual failure.'
    },
  ],
  'what-an-error-message-tells-you/2': [
    {
      q: 'What is the difference between a syntax error and a runtime error?',
      choices: [
        'They are the same',
        'Syntax error: the language could not read your code, so nothing ran (look for a typo); runtime error: it ran fine, then hit bad data or a missing thing while running',
        'Syntax errors happen at runtime',
        'Runtime errors are typos'
      ],
      answer: 1,
      explain: 'This single distinction tells you whether you are hunting a typo near the named line or a bad value at that line.'
    },
    {
      q: 'In a null/undefined error, where is the real bug usually located?',
      choices: [
        'At the exact crash line',
        'Upstream - the crash points at where you used the emptiness, but the real bug is wherever the value became empty',
        'In the language itself',
        'In a library you imported'
      ],
      answer: 1,
      explain: 'Train yourself to ask why was this nothing? rather than just guarding the crash line; the crash location is the symptom, not the cause.'
    },
    {
      q: 'What does a not-found error (file, module, key, variable) almost always come down to?',
      choices: [
        'A deep bug',
        'One of three things: a typo in the name, a wrong path/location, or a thing you forgot to create or install',
        'A broken computer',
        'A permissions problem'
      ],
      answer: 1,
      explain: 'Run through those three before assuming anything deeper - nine times out of ten it is one of them. (Permission denied is different: the thing is there but you cannot touch it.)'
    },
  ],
  'what-an-error-message-tells-you/3': [
    {
      q: 'What is the first move when facing a wall of red error text?',
      choices: [
        'Rewrite the code',
        'Find the headline - the type + message line (the bottom line in Python) - and read it literally, word by word, as a sentence',
        'Restart the computer',
        'Search the whole error online'
      ],
      answer: 1,
      explain: 'Half of all I-have-no-idea-what-this-means moments dissolve the instant you read the message slowly instead of glancing at it.'
    },
    {
      q: 'When an error lists several files, which line matters most?',
      choices: [
        'The topmost file',
        'The first line that points at a file you actually wrote - the library frames above it are usually working correctly',
        'The last file',
        'All of them equally'
      ],
      answer: 1,
      explain: 'Beginners try to fix code they have never seen; almost always the bug is at your line, feeding bad input into library code that is fine.'
    },
    {
      q: 'Why reproduce an error small before fixing it?',
      choices: [
        'To make it happen more often',
        'An error you can trigger on demand is one you can fix; shrinking it to the minimum that still breaks rules out everything you removed',
        'To impress your team',
        'It is required by the language'
      ],
      answer: 1,
      explain: 'An error that happens randomly is one you do not understand yet; strip away everything that is not needed to cause it.'
    },
  ],
  'what-an-operating-system-is/1': [
    {
      q: 'What is an operating system?',
      choices: [
        'The desktop wallpaper and icons',
        'The layer between your programs and the hardware - the manager in the middle that shares the machine\'s resources among everything that wants them',
        'A single application',
        'The CPU itself'
      ],
      answer: 1,
      explain: 'The desktop is just the OS\'s face; the actual OS is mostly invisible, deciding which program gets the CPU and where each app\'s data lives.'
    },
    {
      q: 'What is the kernel?',
      choices: [
        'The user interface',
        'The core of the OS that actually talks to the hardware and enforces all the rules; everything else goes through it',
        'A type of application',
        'The screen'
      ],
      answer: 1,
      explain: 'Programs run in user space and must make a system call to ask the kernel (in kernel space) for anything powerful - which is why permissions exist.'
    },
    {
      q: 'Why does the user-space/kernel-space line matter?',
      choices: [
        'It makes the computer faster',
        'It explains real behavior: this app needs admin permission (asking the trusted side), and one app crashing without taking down the machine (a user-space failure the kernel cleans up)',
        'It is just academic',
        'It controls the wallpaper'
      ],
      answer: 1,
      explain: 'Knowing which side of the line a problem is on is the first step to understanding it - the whole system freezing is rarer, because it means the kernel itself is stuck.'
    },
  ],
  'what-an-operating-system-is/2': [
    {
      q: 'What is the difference between a program and a process?',
      choices: [
        'They are the same',
        'A program is the app sitting on disk, not running (the recipe); a process is that program actually running, with its own memory and a slice of CPU (the meal)',
        'A process is on disk; a program runs',
        'A process has no memory'
      ],
      answer: 1,
      explain: 'The same program can be several processes at once - each browser tab is often its own.'
    },
    {
      q: 'How does an OS share one CPU among dozens of processes?',
      choices: [
        'It runs them all literally at once',
        'Scheduling - it runs one process for a few milliseconds, pauses it, runs the next, cycling so fast they look simultaneous',
        'It picks one and ignores the rest',
        'It buys more CPUs'
      ],
      answer: 1,
      explain: 'This is why your music keeps playing while your browser loads; slow usually means too many processes fighting over too little CPU.'
    },
    {
      q: 'What is a driver?',
      choices: [
        'A person who maintains servers',
        'The translator between the OS and one kind of hardware, so your programs can say print this without learning each device\'s private language',
        'A type of process',
        'A storage format'
      ],
      answer: 1,
      explain: 'Install the printer driver means give the OS the translator for this printer; device problems are usually driver problems - missing, outdated, or confused.'
    },
  ],
  'what-an-operating-system-is/3': [
    {
      q: 'What do Task Manager, Activity Monitor, and `top` all show?',
      choices: [
        'The wallpaper settings',
        'The OS\'s live report on the same jobs - processes, CPU, and memory - as real numbers',
        'Only crashed programs',
        'The network speed'
      ],
      answer: 1,
      explain: 'Seeing it shrinks problems from the computer is haunted to that process, right there, misbehaving.'
    },
    {
      q: 'What is booting?',
      choices: [
        'Restarting a frozen app',
        'The hand-off from firmware to the kernel to the first process to services to your desktop - hardware bringing itself fully to life',
        'Installing the OS',
        'Logging in'
      ],
      answer: 1,
      explain: 'The name comes from pulling yourself up by your bootstraps - a computer starting from nothing and one layer starting the next.'
    },
    {
      q: 'How do Windows, macOS, and Linux relate, under the hood?',
      choices: [
        'They are completely different and share nothing',
        'They are the same model in different clothes - a kernel doing the four jobs (processes, memory, files, devices), with different names and menus',
        'Only Linux has a kernel',
        'They run on different hardware only'
      ],
      answer: 1,
      explain: 'macOS and Linux are both Unix-like and share a lot; Windows took its own path - but learn the model once and you can reason about any of them.'
    },
  ],
  'what-architecture-means/1': [
    {
      q: 'What is software architecture?',
      choices: [
        'The code itself - files and functions',
        'The high-level shape of a system: the major components (boxes) and how they talk to each other (arrows)',
        'The programming language chosen',
        'The user interface design'
      ],
      answer: 1,
      explain: 'Architecture lives above the code - you could rewrite every line inside a box without changing the architecture, as long as it still connects the same way.'
    },
    {
      q: 'What is the most common architecture shape?',
      choices: [
        'One giant program with everything in it',
        'Web (browser) to API (server) to database - the UI asks, the server decides, the database remembers',
        'A peer-to-peer mesh',
        'A single spreadsheet'
      ],
      answer: 1,
      explain: 'You click in the browser, which requests the server, which asks the database; the answer flows back the other way - three boxes, arrows between them.'
    },
    {
      q: 'What is the floor-plan-not-furniture idea?',
      choices: [
        'Architecture is about visual design',
        'Architecture is the high-level shape decided before the detailed building - like a building\'s floor plan, not its paint and furniture',
        'The furniture matters most',
        'Code comes before architecture'
      ],
      answer: 1,
      explain: 'Deciding the shape up front gives everyone a shared map; when something breaks, the diagram tells you where to look.'
    },
  ],
  'what-architecture-means/2': [
    {
      q: 'What makes a decision an architecture decision?',
      choices: [
        'It involves the database',
        'It is expensive and hard to change later - the choice gets baked into the foundation and everything is built on top of it',
        'It is made by a senior engineer',
        'It is written in a diagram'
      ],
      answer: 1,
      explain: 'Button color is easy to change (not architecture); which database holds all your data is hard to undo (architecture). The skill is recognizing which decisions are the expensive ones.'
    },
    {
      q: 'What does the cost-of-change curve show?',
      choices: [
        'Costs always stay flat',
        'The cost of changing an architecture decision rises sharply over time - an eraser stroke at design time, a months-long migration after years in production',
        'Early changes are the most expensive',
        'Cost depends only on team size'
      ],
      answer: 1,
      explain: 'The decision did not get harder; the cost of undoing it grew, because more and more was built on top - so spend your caution where the curve is steep.'
    },
    {
      q: 'What drives the big shape of a system as much as features do?',
      choices: [
        'The programming language',
        'Non-functional needs - scale, reliability, security, and team size - which describe how well, how fast, how safely, at what size',
        'The color scheme',
        'The number of files'
      ],
      answer: 1,
      explain: 'These are invisible in a demo and brutal in production if ignored; most we-had-to-re-architect stories are scale stories.'
    },
  ],
  'what-architecture-means/3': [
    {
      q: 'Which architecture is the best one?',
      choices: [
        'Microservices, always',
        'There is no best, only fitting - the right shape depends on the problem, the team, and the constraints; best for what?',
        'A monolith, always',
        'Whatever is newest'
      ],
      answer: 1,
      explain: 'Anyone who says an architecture is always the answer regardless of the problem is selling a hammer and calling everything a nail.'
    },
    {
      q: 'What is Conway\'s Law?',
      choices: [
        'Code should be written in one language',
        'A system\'s shape ends up mirroring the organization that built it - the boxes line up with the teams',
        'Bigger teams write better code',
        'Architecture must be documented'
      ],
      answer: 1,
      explain: 'Three teams that do not talk much tend to produce three components that do not share much; you can use it - organize teams to match the system you want.'
    },
    {
      q: 'What is the golden rule for beginners in architecture?',
      choices: [
        'Build for a million users from day one',
        'Start with the simplest architecture that solves your actual problem; add complexity only when a real, specific problem forces you to',
        'Always use the most boxes possible',
        'Copy a big company\'s design'
      ],
      answer: 1,
      explain: 'Over-engineering up front pays the full cost of complexity for benefits you may never collect; simple-and-working beats clever-and-theoretical at the start.'
    },
  ],
  'what-cicd-does/1': [
    {
      q: 'What problem does Continuous Integration solve?',
      choices: [
        'Slow computers',
        'Integration hell - instead of combining everyone\'s work rarely and painfully, you merge constantly and a machine checks every combination automatically',
        'Writing tests',
        'Choosing a language'
      ],
      answer: 1,
      explain: 'Small merges, checked often, never grow into a knot; the automated build-and-test is the enforcement mechanism that makes frequent integration safe.'
    },
    {
      q: 'What is the red/green gate in CI?',
      choices: [
        'A traffic light in the office',
        'A rule that a pull request cannot be merged until its checks are green (built and tests passed); a failure points at your change, minutes after you made it',
        'A way to skip tests',
        'A type of branch'
      ],
      answer: 1,
      explain: 'It moves the discovery of problems from much later, mixed with everything to right now, on the one change that caused it.'
    },
    {
      q: 'Why does CI run on a clean machine, and what does it reveal?',
      choices: [
        'To save money',
        'It starts fresh with only what your project declares, so a works-on-my-machine failure usually means your code leans on something hidden on your laptop that is not in the repo',
        'To run faster',
        'To test the hardware'
      ],
      answer: 1,
      explain: 'When CI disagrees with your laptop, CI is usually right - it is telling you the project does not actually contain everything it needs to build.'
    },
  ],
  'what-cicd-does/2': [
    {
      q: 'What is the difference between Continuous Delivery and Continuous Deployment?',
      choices: [
        'They are the same',
        'Delivery automates everything up to production, where a human clicks deploy; Deployment automates production too - green code ships itself with no human',
        'Delivery ships automatically; Deployment needs a human',
        'Deployment is slower'
      ],
      answer: 1,
      explain: 'Same first letters, one crucial difference: who - or whether anyone - pushes the final button. Ask: does a human approve the production release, or is it automatic?'
    },
    {
      q: 'What are the typical stages of a CI/CD pipeline?',
      choices: [
        'Plan, design, code, ship',
        'Build, test, staging, deploy - each stage gates the next, so a change only advances if it cleared the one before',
        'Write, review, merge, archive',
        'Compile, run, log, delete'
      ],
      answer: 1,
      explain: 'Staging is a rehearsal environment that mirrors production, so problems show up there instead of in front of customers.'
    },
    {
      q: 'What do deploy strategies like canary and blue-green actually do?',
      choices: [
        'Make a bad release good',
        'Limit the blast radius and make backing out fast - canary catches a bad deploy on a small slice of users, blue-green lets you flip back instantly',
        'Guarantee the release is correct',
        'Speed up the tests'
      ],
      answer: 1,
      explain: 'They manage risk, they do not replace tests; the correctness still comes from the tests.'
    },
  ],
  'what-cicd-does/3': [
    {
      q: 'Why are small, frequent releases safer than big rare ones?',
      choices: [
        'They are not - big releases are safer',
        'When a small release breaks there is basically one suspect; a big release bundles a hundred changes, so you hunt through a hundred suspects under pressure',
        'Small releases skip testing',
        'Big releases cannot be rolled back'
      ],
      answer: 1,
      explain: 'Smaller releases make risk legible - when little changes, the cause of a problem is obvious and the fix is small.'
    },
    {
      q: 'Why does rollback confidence change how teams ship?',
      choices: [
        'It does not matter',
        'When rolling back to the previous known-good version is fast and routine, a bad deploy becomes an inconvenience, so teams ship more boldly and often',
        'It makes deploys slower',
        'It removes the need for tests'
      ],
      answer: 1,
      explain: 'Confidence to deploy comes from confidence to un-deploy; the pipeline you trust for shipping is the same one you trust for un-shipping.'
    },
    {
      q: 'Why do flaky tests poison a whole pipeline?',
      choices: [
        'They make builds slower only',
        'A flaky test fails randomly on the same code, so people learn to re-run until green - which trains the whole team to ignore red, so a real bug gets the same shrug',
        'They delete code',
        'They only affect one developer'
      ],
      answer: 1,
      explain: 'A green check only means tests passed, so a pipeline is only as trustworthy as its tests; treat a flaky test as a genuine bug and fix or remove it quickly.'
    },
  ],
  'what-devops-is/1': [
    {
      q: 'What was the wall that DevOps tears down?',
      choices: [
        'A network firewall',
        'The split between developers (who build and throw code over the wall) and operations (who run it), set against each other with a painful hand-off and nobody owning failures',
        'A literal wall in the office',
        'A type of database'
      ],
      answer: 1,
      explain: 'Dev wanted change, ops wanted stability; when production broke at 2am, ops could not fix code they did not write and dev said it works on my machine.'
    },
    {
      q: 'What is DevOps, actually?',
      choices: [
        'A job title you hire for',
        'A way of working that removes the wall - the same people, sharing one set of goals, own software across its whole life: build, ship, and run it',
        'A software product you buy',
        'The operations team renamed'
      ],
      answer: 1,
      explain: 'Putting DevOps on a door does not remove the wall - it is something a whole team does, not a department you can point at.'
    },
    {
      q: 'What does you build it, you run it mean?',
      choices: [
        'Developers must build their own servers',
        'The team that writes a piece of software is also on the hook for operating it in production - so they write it to be robust, because its problems are now their problems',
        'Only run code you wrote yourself',
        'Build and run are separate jobs'
      ],
      answer: 1,
      explain: 'When you know you will be woken at 2am if your code falls over, you add logging, handle the slow database, and make it easy to roll back.'
    },
  ],
  'what-devops-is/2': [
    {
      q: 'What is the DevOps loop?',
      choices: [
        'A straight line from start to done',
        'A continuous cycle: build, test, ship, observe - and what you observe in production feeds straight into the next thing you build',
        'Plan, code, archive',
        'Write, delete, rewrite'
      ],
      answer: 1,
      explain: 'It is a loop, not a line, because software is never done and the output of running it (what you observe) is the input to improving it.'
    },
    {
      q: 'What is the observe stage, and why is it the secret?',
      choices: [
        'Checking the code compiles',
        'Watching the software as it runs in production (logs, metrics, traces), so what you learn becomes the next thing you build - it closes the loop',
        'Reviewing pull requests',
        'Testing before shipping'
      ],
      answer: 1,
      explain: 'This stage did not exist for developers before the wall came down - they shipped and walked away; observing turns the cycle into a loop instead of a line.'
    },
    {
      q: 'How does DevOps escape the old fast-or-safe trade-off?',
      choices: [
        'By going slower',
        'Automation makes the loop fast (machines build, test, and ship the same way every time) and feedback makes it safe (tests catch problems before shipping, observing catches them after)',
        'By hiring more people',
        'By shipping less often'
      ],
      answer: 1,
      explain: 'That is why deploy fifty times a day is safer than it sounds - each deploy is small, automatically tested, and watched after it ships.'
    },
  ],
  'what-devops-is/3': [
    {
      q: 'Why can\'t you buy or hire your way to DevOps?',
      choices: [
        'Tools are too expensive',
        'DevOps is a culture a whole team lives, not a tool or a job title - hiring one DevOps engineer or buying one platform usually just renames the ops team and rebuilds the wall',
        'It requires special hardware',
        'Only big companies can do it'
      ],
      answer: 1,
      explain: 'A team with the culture and crude tools is doing DevOps; a team with perfect tools and a wall down the middle is not.'
    },
    {
      q: 'What is a blameless postmortem, and why does blame poison a team?',
      choices: [
        'A report naming who to fire',
        'A calm review focused on systemic causes and fixes, deliberately avoiding individual blame - because if people get punished for mistakes, they hide mistakes, and you cannot fix what you cannot see',
        'A way to avoid documenting incidents',
        'A meeting to assign fault'
      ],
      answer: 1,
      explain: 'When someone junior takes down production, the fix is not firing them; it is adding a safeguard so the next tired human cannot make the same mistake.'
    },
    {
      q: 'Why are small, frequent changes a core DevOps habit?',
      choices: [
        'They are easier to write',
        'When a small release breaks, you know exactly what caused it and rolling back is easy; a release with 300 changes means hunting through all of them',
        'They require less testing',
        'They impress customers'
      ],
      answer: 1,
      explain: 'Frequent shipping is not recklessness; it is how you keep each step small enough to stay safe.'
    },
  ],
  'what-happens-when-code-runs/1': [
    {
      q: 'Why does source code have to be translated before it runs?',
      choices: [
        'To make it shorter',
        'The CPU only understands machine code - tiny numeric instructions; it cannot read the human-readable text you wrote, so something must cross that gap',
        'To save disk space',
        'To hide it from other people'
      ],
      answer: 1,
      explain: 'The whole compiled-vs-interpreted debate is just about when and how that crossing from source to machine-runnable instructions happens.'
    },
    {
      q: 'What does a compiler do?',
      choices: [
        'Runs your code line by line',
        'Translates your entire source file ahead of time into a ready-to-run executable, then steps out of the way (Go, Rust, C)',
        'Translates as the program runs',
        'Checks spelling'
      ],
      answer: 1,
      explain: 'Because translation is done up front, the program runs fast, but you need a build step and the executable is built for one kind of machine.'
    },
    {
      q: 'How does an interpreter differ from a compiler?',
      choices: [
        'It is always faster',
        'It reads and runs your source directly, a piece at a time, translating live every time - no separate executable (Python, JavaScript)',
        'It produces an executable first',
        'It only works on small files'
      ],
      answer: 1,
      explain: 'You get instant feedback with no build step, but the translating happens while the program runs, so the same work tends to run slower. The labels describe how a language is usually run, not a law.'
    },
  ],
  'what-happens-when-code-runs/2': [
    {
      q: 'What is the stack used for?',
      choices: [
        'Long-lived data',
        'Each function call\'s local variables, in a stack frame added on call and removed on return - automatic, orderly, and fast',
        'Storing files',
        'Network connections'
      ],
      answer: 1,
      explain: 'A local variable lives exactly as long as its function call, then vanishes on its own when the function returns - you get this for free.'
    },
    {
      q: 'What is the heap for?',
      choices: [
        'Function call bookkeeping',
        'Data that must outlive the function that created it, or that is large or dynamically sized - flexible, but it must be cleaned up rather than vanishing on its own',
        'Only numbers',
        'Temporary local variables'
      ],
      answer: 1,
      explain: 'A list a function builds and returns cannot live on its stack frame (destroyed on return), so it lives on the heap, which outlasts the call.'
    },
    {
      q: 'What causes a stack overflow?',
      choices: [
        'A virus',
        'Function calls piling up frames faster than they are removed - classically bottomless recursion with no base case - until the stack exceeds its fixed size limit',
        'Too much heap memory',
        'A slow CPU'
      ],
      answer: 1,
      explain: 'The fix is almost never a bigger stack; it is a base case that lets the recursion actually stop.'
    },
  ],
  'what-happens-when-code-runs/3': [
    {
      q: 'What is a process?',
      choices: [
        'A program file on disk',
        'A program actually running - its instructions loaded into RAM, its stack and heap set up, with an identity the OS tracks',
        'A type of CPU',
        'A compiler'
      ],
      answer: 1,
      explain: 'The executable on disk is like a recipe in a cookbook; the process is what exists when someone is actually cooking it.'
    },
    {
      q: 'What are the distinct jobs of RAM and the CPU for a running process?',
      choices: [
        'They do the same thing',
        'RAM is the fast working memory where the process lives (code, stack, heap); the CPU reads those instructions from RAM and executes them one step at a time',
        'The CPU stores data; RAM executes it',
        'RAM is permanent storage'
      ],
      answer: 1,
      explain: 'That is why a program must be loaded into RAM before it runs - copied from slow disk into fast memory the CPU can reach quickly.'
    },
    {
      q: 'What does running actually mean, given many processes and few CPU cores?',
      choices: [
        'Your program owns the machine continuously',
        'The OS schedules your process onto the CPU in rapid slices, sharing it among the many processes alive at once - so it runs in bursts, not all at once',
        'All processes run at the exact same instant',
        'Only one program can ever run'
      ],
      answer: 1,
      explain: 'It looks continuous, but zoomed in your process gets the CPU in quick turns with pauses in between.'
    },
  ],
  'what-is-data-engineering/1': [
    {
      q: 'What is data engineering?',
      choices: [
        'Working with databases',
        'Building the plumbing that moves data from where it is created (messy) to where it is useful (clean) - and cleans it up along the way',
        'Designing user interfaces',
        'Writing machine-learning models'
      ],
      answer: 1,
      explain: 'Picture a river: muddy upstream (raw data), clean at the tap (a dashboard or model); the job is building and maintaining that river so the water keeps flowing and stays clean.'
    },
    {
      q: 'Why is raw data not usable on arrival?',
      choices: [
        'It is encrypted',
        'It comes in different shapes, with missing and duplicated rows, scattered across systems, and at volumes too big to eyeball',
        'It is too small',
        'It is always perfect'
      ],
      answer: 1,
      explain: 'The pipeline absorbs all of this - reconciling formats, removing duplicates, filling or flagging gaps, joining scattered pieces - so people downstream never have to.'
    },
    {
      q: 'What does trusted mean, and why does it matter most?',
      choices: [
        'The data is encrypted',
        'The output is dependable enough to bet a decision on - a confidently wrong number is dangerous because people act on it and cannot tell it is wrong',
        'The data loads quickly',
        'Only admins can see it'
      ],
      answer: 1,
      explain: 'Almost every data-engineering tool and practice - testing, monitoring, documentation - exists to protect that trust.'
    },
  ],
  'what-is-data-engineering/2': [
    {
      q: 'What are the five stages of the data pipeline?',
      choices: [
        'Plan, build, test, ship, observe',
        'Sources, ingestion, storage, transform, serve',
        'Read, write, update, delete, archive',
        'Extract, compress, encrypt, send, store'
      ],
      answer: 1,
      explain: 'Sources create data; ingestion collects it; storage holds it; transform cleans and reshapes it into something trusted; serve delivers it to dashboards, reports, and models.'
    },
    {
      q: 'What is the transform stage, and why does it matter most?',
      choices: [
        'Where data is collected',
        'Where raw becomes trusted - cleaning, joining, and aggregating (usually in SQL); it is where most bad-number bugs hide',
        'Where data is deleted',
        'Where dashboards are drawn'
      ],
      answer: 1,
      explain: 'When you see a dashboard number you do not trust, look here first: a wrong join, a forgotten filter like counting refunds as revenue, a bad assumption about the raw data.'
    },
    {
      q: 'What distinguishes a data engineer, analyst, and scientist?',
      choices: [
        'They are the same role',
        'The engineer builds the river (ingestion, storage, transform); the analyst reads from the tap to answer business questions; the scientist builds predictive models on top - though the lines blur in real life',
        'The engineer reads dashboards; the analyst builds pipelines',
        'Only the scientist touches data'
      ],
      answer: 1,
      explain: 'It is mostly about which part of the river you live in - building the pipeline vs analyzing what is in it vs modeling on top of it.'
    },
  ],
  'what-is-data-engineering/3': [
    {
      q: 'Why does scale make data engineering its own discipline?',
      choices: [
        'Big data is just slower',
        'It is the point where you can no longer fix things by looking - you must build systems that stay correct without a human checking each row, and stay fast and affordable at huge volume',
        'Scale does not matter',
        'It only affects storage cost'
      ],
      answer: 1,
      explain: 'A query that runs instantly on a thousand rows can grind for a long time on a billion; a small inefficiency multiplied across billions becomes real cost.'
    },
    {
      q: 'What is reproducibility, and why does it matter?',
      choices: [
        'Backing up the data',
        'Running the pipeline again on the same input always gives the same output - if you cannot, you can never trust a number, because you cannot even confirm it',
        'Making the pipeline faster',
        'Copying data between systems'
      ],
      answer: 1,
      explain: 'A transform that depends on now or on the order rows arrived in will quietly give different answers on different runs - that is broken reproducibility.'
    },
    {
      q: 'What is schema drift, and why is it so dangerous?',
      choices: [
        'The data moving servers',
        'Sources changing their data shape (a renamed column, a field\'s type) without warning - dangerous because the failure can be silent, producing a clean-looking but wrong result',
        'The schema being deleted',
        'A slow query'
      ],
      answer: 1,
      explain: 'You cannot prevent it - it is other people\'s systems - so the job is to detect it fast and fail loudly, rather than letting bad data slip through with a confident face.'
    },
  ],
  'what-performance-means/1': [
    {
      q: 'What is the difference between latency and throughput?',
      choices: [
        'They are the same thing',
        'Latency is how long one operation takes (a duration); throughput is how many operations finish per second (a rate)',
        'Latency is a rate; throughput is a duration',
        'Both measure memory'
      ],
      answer: 1,
      explain: 'Latency is about waiting; throughput is about volume - a system can be great at one while terrible at the other.'
    },
    {
      q: 'In the highway analogy, what does adding lanes change?',
      choices: [
        'Each car arrives sooner',
        'It raises throughput (more cars per minute) without changing latency (one car\'s drive takes the same time)',
        'It lowers latency only',
        'Nothing'
      ],
      answer: 1,
      explain: 'More lanes (more servers, more parallel processing) serves more users at once but does nothing for the user stuck behind a slow operation.'
    },
    {
      q: 'How can batching raise throughput while hurting latency?',
      choices: [
        'It cannot affect both',
        'One trip carries 100 items so more move per second (higher throughput), but each item waits for the batch to fill (higher latency)',
        'It lowers both',
        'It only affects memory'
      ],
      answer: 1,
      explain: 'It is a deliberate trade; the trap is optimizing throughput and degrading the latency users actually feel - know which number your users care about.'
    },
  ],
  'what-performance-means/2': [
    {
      q: 'What is the cardinal rule of performance work?',
      choices: [
        'Optimize the scariest-looking code first',
        'Measure first, find the real bottleneck, then fix that - do not trust your gut about what is slow',
        'Always add more servers',
        'Rewrite everything in a faster language'
      ],
      answer: 1,
      explain: 'Humans are terrible at guessing what is slow; the scary code is often fine and the culprit is some boring line you would never suspect.'
    },
    {
      q: 'What is a bottleneck, and why does it cap the whole system?',
      choices: [
        'The fastest stage',
        'The slowest stage - work flows through stages in order, so the slowest one limits how fast anything gets through the whole thing',
        'The first stage',
        'The amount of memory'
      ],
      answer: 1,
      explain: 'Effort spent anywhere except the bottleneck is mostly wasted; fix one and a new one appears, which is why you measure again after every change.'
    },
    {
      q: 'What is premature optimization?',
      choices: [
        'Optimizing after measuring',
        'Making code faster before you know it is a problem - trading clarity and simplicity for a speedup you may never need',
        'A type of bottleneck',
        'Testing too early'
      ],
      answer: 1,
      explain: 'Write the clear version first, measure, and optimize only the bottleneck the measurement reveals; clear-but-slow you can always speed up, clever-but-tangled is just a mess.'
    },
  ],
  'what-performance-means/3': [
    {
      q: 'What does fast enough actually depend on?',
      choices: [
        'The fastest possible speed',
        'A requirement - a search box should feel instant, a monthly report can take 30 seconds, a background import can run an hour; the first question is fast enough for what?',
        'The programming language',
        'The number of servers'
      ],
      answer: 1,
      explain: 'As fast as possible is a budget with no bottom; performance work has a destination, and the destination is a requirement, not maximum speed.'
    },
    {
      q: 'Why do you measure percentiles (like p99) instead of the average?',
      choices: [
        'Averages are hard to compute',
        'The average blends fast and slow requests into a number describing nobody\'s experience; users feel the slow tail (p99), and over a session they are likely to hit one',
        'p99 is always lower',
        'Percentiles measure throughput'
      ],
      answer: 1,
      explain: 'Your p50 can look fantastic while your p99 quietly ruins the experience - watch the tail, because the slowest requests are the ones that get complained about.'
    },
    {
      q: 'When should you stop optimizing?',
      choices: [
        'Never - always make it faster',
        'When it is fast enough - it meets the requirement and feels good to users (tail included); the next millisecond is almost never worth what it costs',
        'After exactly three rounds',
        'When the average looks good'
      ],
      answer: 1,
      explain: 'Optimization has a cost (time, complexity, servers); weigh it against the benefit, and chasing speed past the point anyone benefits quietly hurts the project.'
    },
  ],
  'what-security-means/1': [
    {
      q: 'What three things does the CIA triad cover?',
      choices: [
        'Cost, Integration, Availability',
        'Confidentiality (who can see it), Integrity (who can change it and how), and Availability (can the right people use it)',
        'Code, Infrastructure, Access',
        'Cryptography, Identity, Authentication'
      ],
      answer: 1,
      explain: 'To decide if something is a security problem, ask which of those three it threatens; almost every security problem is one of them breaking.'
    },
    {
      q: 'What is the core mindset shift in security?',
      choices: [
        'From slow to fast',
        'From the use case (does it work when used right?) to the abuse case (how could this be misused on purpose?)',
        'From frontend to backend',
        'From testing to deploying'
      ],
      answer: 1,
      explain: 'Building is about use cases; security is about abuse cases - you start expecting that some inputs are hostile, like a search box that gets fed a SQL fragment.'
    },
    {
      q: 'Who is the attacker, realistically?',
      choices: [
        'Always a genius targeting you personally',
        'Usually automated scripts scanning the whole internet, opportunists, insiders, or people tricking people - and they only have to find one unlocked door',
        'Nobody real',
        'Only competitors'
      ],
      answer: 1,
      explain: 'The asymmetry at the heart of security: you have to cover every door; they only have to find one that is unlocked.'
    },
  ],
  'what-security-means/2': [
    {
      q: 'What are the four questions of lightweight threat modeling?',
      choices: [
        'Who, what, when, where',
        'What are we protecting? Who would attack it and why? How could they get in (the attack surface)? What do we do about it?',
        'Plan, build, test, ship',
        'Read, write, execute, delete'
      ],
      answer: 1,
      explain: 'The point is not to predict every attack - it is to stop and think about abuse on purpose, before the code ships, while changing things is cheap.'
    },
    {
      q: 'What is the attack surface, and why does shrinking it help?',
      choices: [
        'The user interface',
        'The sum of all points where the outside world can touch your system (every input, endpoint, form); a smaller surface is safer almost for free because there are fewer doors to defend',
        'The amount of code',
        'The number of servers'
      ],
      answer: 1,
      explain: 'Every feature or input you do not expose is one you never have to defend - Do we even need this door? is one of the most powerful security questions.'
    },
    {
      q: 'What is a trust boundary, and what is the rule about it?',
      choices: [
        'The firewall',
        'The line where data crosses from the untrusted world into your trusted system - everything crossing into the trusted side must be checked, because the other side can lie',
        'A type of password',
        'The network cable'
      ],
      answer: 1,
      explain: 'Nearly every classic vulnerability is trusting data that crossed a boundary without checking it; front-end checks help honest users but cannot stop an attacker who skips your page.'
    },
  ],
  'what-security-means/3': [
    {
      q: 'What is defense in depth?',
      choices: [
        'Finding the one perfect lock',
        'Assuming any single defense will eventually fail, and putting another behind it - layers, so getting past one still leaves an attacker outside the next',
        'Hiding how the system works',
        'Using one very strong password'
      ],
      answer: 1,
      explain: 'If your whole defense is one wall, the day it cracks an attacker has everything; layers mean no single failure is fatal.'
    },
    {
      q: 'What does the principle of least privilege do?',
      choices: [
        'Speeds up the system',
        'Gives every person and component the minimum access it needs and nothing more - which makes a breach cheap instead of catastrophic',
        'Encrypts all data',
        'Removes all access'
      ],
      answer: 1,
      explain: 'It does not stop the break-in; it caps the blast radius - a leaked read-only key is an annoyance, a leaked admin key is a disaster.'
    },
    {
      q: 'Why is security by obscurity not real security?',
      choices: [
        'Obscurity is too slow',
        'Hiding how something works is at best a thin extra layer, never the one you rely on - a real lock works even when the attacker knows exactly how it works',
        'Obscurity is illegal',
        'It only works for big companies'
      ],
      answer: 1,
      explain: 'If your security depends on the attacker not knowing your method, you have built on sand; serious cryptography is published openly and still holds because the strength is in the key.'
    },
  ],
  'when-prod-is-down/1': [
    {
      q: 'What is the actual goal of the first minute of an outage?',
      choices: [
        'Fix the outage immediately',
        'Don\'t make it worse and understand what you are dealing with - change nothing you cannot explain and cannot undo',
        'Find someone to blame',
        'Restart everything'
      ],
      answer: 1,
      explain: 'The jittery urge to start typing is adrenaline, not a plan; panic-actions are the number-one way a small outage becomes a big one.'
    },
    {
      q: 'What is blast radius, and why assess it first?',
      choices: [
        'How fast the fix is',
        'Who is affected, what they cannot do, and how badly - the real-world impact, which sets the severity of your whole response',
        'The size of the codebase',
        'The number of servers down'
      ],
      answer: 1,
      explain: 'Who times what times how bad: slow checkout for everyone is an all-hands emergency; a broken internal report is a ticket for tomorrow. When unsure, round up.'
    },
    {
      q: 'In the first five minutes, what comes before diagnosing the root cause?',
      choices: [
        'A full investigation',
        'Stop the bleeding - mitigate first (roll back, flag off, scale, fail over) to restore service; understand later',
        'Writing the postmortem',
        'Blaming the last deploy'
      ],
      answer: 1,
      explain: 'Like applying pressure to a wound before investigating which vessel you nicked - a restored service buys you time to think clearly instead of under fire.'
    },
  ],
  'when-prod-is-down/2': [
    {
      q: 'What is the single most common fix in incident response?',
      choices: [
        'Buying more servers',
        'Rolling back the last deploy - if the outage started right after a deploy, it undoes the prime suspect, fast and usually reversibly',
        'Clearing all caches',
        'Rewriting the code'
      ],
      answer: 1,
      explain: 'Reach for it before anything cleverer; the one gotcha is an irreversible database migration, where rolling back code can be unsafe.'
    },
    {
      q: 'What is the role of the incident commander (IC)?',
      choices: [
        'The most senior engineer who fixes it',
        'The single person who coordinates the response - usually not hands-on-keyboard; they track what is being tried, decide next steps, and keep comms flowing',
        'The person who caused the outage',
        'The one who writes the code'
      ],
      answer: 1,
      explain: 'Exactly one person holds it so there is always a single answer to what are we doing and who is deciding; if nobody else has stepped up, you are IC until you hand it off.'
    },
    {
      q: 'Who is the most dangerous person on an incident call?',
      choices: [
        'The incident commander',
        'The silent hero - the engineer who quietly fixes something and tells no one, so nobody can tell what caused a change and the timeline gets a hole',
        'The newest team member',
        'The person asking questions'
      ],
      answer: 1,
      explain: 'Announce every change before you make it, in the channel - even when the silent fixer is right, they turn a 20-minute incident into a 2-hour mystery.'
    },
  ],
  'when-prod-is-down/3': [
    {
      q: 'Why write the incident timeline live, during the incident?',
      choices: [
        'To assign blame faster',
        'Adrenaline scrambles memory, so reconstructing it later is unreliable - live timestamped notes give you an accurate timeline (and your detect/mitigate metrics) for free',
        'It is required by law',
        'To make the incident longer'
      ],
      answer: 1,
      explain: 'Time to detect and time to mitigate are only trustworthy if you wrote them down as things happened.'
    },
    {
      q: 'What is the difference between root cause and contributing factors?',
      choices: [
        'They are the same',
        'The root cause is the technical trigger; contributing factors are everything that let it become a customer-facing outage - and the factors are where the real leverage is',
        'Root cause is less important',
        'Contributing factors are bugs in your code only'
      ],
      answer: 1,
      explain: 'Fixing the trigger prevents that exact bug; fixing a contributing factor like no canary stage prevents an entire class of future outages.'
    },
    {
      q: 'What does blameless really mean, and why is it non-negotiable?',
      choices: [
        'Nobody is ever accountable',
        'Treat the failure as a property of the system, not a person\'s fault - because blame makes people hide what they did, and you cannot fix what you cannot see',
        'Nobody made a mistake',
        'Only managers get blamed'
      ],
      answer: 1,
      explain: 'Punish honesty and you get silence; reward it and you get the information that prevents the next outage - the person who pushed the button is rarely the cause.'
    },
  ],
  'why-is-my-query-slow/1': [
    {
      q: 'What is a full-table scan?',
      choices: [
        'A backup of the table',
        'With no help, the database reads every row in the table to find your matches - its fallback when it has no shortcut to your data',
        'A way to sort the table',
        'Scanning for viruses'
      ],
      answer: 1,
      explain: 'A plain table is an unordered pile of rows; asking it which of you has this email has no clever answer without an index, so it checks each row one at a time.'
    },
    {
      q: 'Why is a query fast on your laptop but slow in production?',
      choices: [
        'Production hardware is worse',
        'The query always did the same expensive thing (a scan); scan cost grows with table size, so 100 rows hides it and 10 million rows does not',
        'The network is slower',
        'You wrote it wrong for prod'
      ],
      answer: 1,
      explain: 'Nothing got slower - the table got bigger, and the cost was always proportional to the table. Small test data hides the scan.'
    },
    {
      q: 'What is the smell that a full-table scan is a problem?',
      choices: [
        'Read a little, return a lot',
        'Read a lot, return a little - scanning millions of rows to return a handful; a scan that returns most of the table is often fine',
        'Any use of SELECT',
        'Sorting by a column'
      ],
      answer: 1,
      explain: 'EXPLAIN showing rows=1 (returns one) under a Seq Scan plan (reads the whole table) is the gap that is the whole problem.'
    },
  ],
  'why-is-my-query-slow/2': [
    {
      q: 'What is a database index?',
      choices: [
        'A copy of the whole table',
        'A separate, sorted structure with pointers back to rows - like the index at the back of a book that lets you jump to the right page instead of reading all of them',
        'A faster hard drive',
        'A type of query'
      ],
      answer: 1,
      explain: 'The table stays an unordered pile; the index is a second, sorted copy of just the keyword with pointers to where each row lives.'
    },
    {
      q: 'Why not put an index on every column?',
      choices: [
        'Indexes are illegal in some databases',
        'Indexes slow down writes (every insert/update/delete must update every index) and use disk and memory - it is a trade: faster reads for slower writes and more space',
        'Indexes make reads slower',
        'There is no downside'
      ],
      answer: 1,
      explain: 'On a write-heavy table, over-indexing can make the whole thing slower; index the columns you actually search by.'
    },
    {
      q: 'Which columns should you index?',
      choices: [
        'Every column, just in case',
        'The columns you filter on (WHERE), join on (ON), and sort on (ORDER BY) - not columns you only read back as output',
        'Only the primary key',
        'Columns with the longest names'
      ],
      answer: 1,
      explain: 'Index for the queries you actually run; a primary key is already indexed for you automatically, and an unindexed join column is a common cause of a slow join.'
    },
  ],
  'why-is-my-query-slow/3': [
    {
      q: 'What is the difference between EXPLAIN and EXPLAIN ANALYZE?',
      choices: [
        'They are the same',
        'EXPLAIN shows the plan and estimates without running the query; EXPLAIN ANALYZE actually runs it and reports real timings and row counts',
        'EXPLAIN runs the query; ANALYZE does not',
        'ANALYZE is faster'
      ],
      answer: 1,
      explain: 'Careful with EXPLAIN ANALYZE on an UPDATE/DELETE/INSERT - it really executes them and modifies your data; wrap a write in a transaction and roll it back.'
    },
    {
      q: 'In an EXPLAIN plan, what is the missing-index alarm?',
      choices: [
        'An Index Scan',
        'A Seq Scan with a big Rows Removed by Filter next to a tiny returned-row count - the database read everything to return a little',
        'A low execution time',
        'An Index Cond'
      ],
      answer: 1,
      explain: 'After adding the right index, the plan changes to Index Scan using an Index Cond, with no Rows Removed by Filter line and a far lower execution time.'
    },
    {
      q: 'Why must you always re-check with EXPLAIN ANALYZE after adding an index?',
      choices: [
        'To make the query slower',
        'Creating an index does not guarantee the database will use it - a function on the column, a leading-wildcard LIKE, or stale stats can leave it unused; only re-running proves it worked',
        'Indexes always work',
        'It is required syntax'
      ],
      answer: 1,
      explain: 'The loop is measure, add the right index, re-check - measure the fix, do not trust it; the plan tells you exactly which index to add so you do not have to guess.'
    },
  ],
  'why-test-at-all/1': [
    {
      q: 'What is the real value of tests, framed as a feeling?',
      choices: [
        'Proving code works once',
        'Removing the fear of touching working code - the what else might I break? hesitation that makes you ship nervously or not change it at all',
        'Making code run faster',
        'Impressing your manager'
      ],
      answer: 1,
      explain: 'Tests are a safety net: they let you change your code a hundred times and instantly know whether each change kept everything else working.'
    },
    {
      q: 'What is a regression?',
      choices: [
        'A new feature',
        'Something that used to work stopping because of a later change - the feature did not change, you changed something nearby and it regressed',
        'A type of test',
        'A slow query'
      ],
      answer: 1,
      explain: 'Regressions are the nastiest bugs precisely because nobody was looking at that code; in a connected codebase they are inevitable, not a sign of carelessness.'
    },
    {
      q: 'Why are tests freedom rather than paperwork?',
      choices: [
        'They restrict what you can do',
        'They give permission - to refactor messy code, to call things done with evidence, and to change unfamiliar code without praying',
        'They slow you down',
        'They replace documentation only'
      ],
      answer: 1,
      explain: 'Messy code stays messy when everyone is too scared to clean it; with tests you can rip it apart and rebuild it cleanly, knowing passing tests mean the behavior is unchanged.'
    },
  ],
  'why-test-at-all/2': [
    {
      q: 'What is a test, mechanically?',
      choices: [
        'A special exam your code must pass',
        'A small program that runs your real code with chosen inputs and compares the result against what you expected, shouting if they do not match',
        'A code formatter',
        'A type of comment'
      ],
      answer: 1,
      explain: 'There is no magic - a test is ordinary code that calls your ordinary code and checks the answer; the shout is an assertion.'
    },
    {
      q: 'What three steps does every test follow?',
      choices: [
        'Read, write, delete',
        'Arrange (set up inputs), Act (call your code once), Assert (check the result)',
        'Plan, build, ship',
        'Compile, run, log'
      ],
      answer: 1,
      explain: 'Arrange-Act-Assert: set things up, do the thing, check the thing - you will spot it in every test you ever read.'
    },
    {
      q: 'Why must you make sure a test can actually fail?',
      choices: [
        'To slow down the suite',
        'A test that never fails never helped - a surprising number of tests are written so they can never fail, and those are worse than no test because they give false confidence',
        'Failing tests look bad',
        'It is required by the runner'
      ],
      answer: 1,
      explain: 'Green is not the goal; trustworthy green is - a passing test is only meaningful if you believe it would go red when the thing it guards actually breaks.'
    },
  ],
  'why-test-at-all/3': [
    {
      q: 'What kind of code is most worth testing?',
      choices: [
        'Trivial getters and one-line passthroughs',
        'Real logic where a wrong answer hurts (calculations, rules, parsing), the bug you just fixed, and tricky edge cases - test where mistakes are likely and expensive',
        'Code you will delete next week',
        'Code that forwards to a trusted library'
      ],
      answer: 1,
      explain: 'Beginners test the easy stuff because it is easy and skip the scary stuff because it is hard - exactly backwards; put effort where the thinking is.'
    },
    {
      q: 'Why write a regression test after fixing a bug?',
      choices: [
        'To prove you found it',
        'It is the cheapest, highest-value test - a test that fails on the broken code and passes on the fix stands guard so that exact bug can never quietly come back',
        'Because the runner requires it',
        'To increase the line count'
      ],
      answer: 1,
      explain: 'A bug fix without a regression test is a bug you have agreed to fix again later; you already did the hard part by knowing what was wrong.'
    },
    {
      q: 'Why is code coverage a hint rather than a goal?',
      choices: [
        'Coverage measures speed',
        'Coverage measures how much code ran, not how much is protected - 100% can be all tests that test nothing, a green dashboard over an unprotected codebase',
        'Coverage is always wrong',
        'High coverage means no bugs'
      ],
      answer: 1,
      explain: 'Chasing the last few percent usually means writing pointless or brittle tests; aim to cover the logic that matters, the bugs you fixed, and the edges.'
    },
  ],
  'windows-for-power-users/1': [
    {
      q: 'What is the NT kernel, and what runs on top of it?',
      choices: [
        'A type of application',
        'The trusted core of Windows that controls the hardware; the desktop, File Explorer, and your apps all run on top of it in user space',
        'The Start menu',
        'A driver'
      ],
      answer: 1,
      explain: 'When the taskbar freezes but music keeps playing, that is the desktop shell (the face) hanging while the NT kernel underneath is fine.'
    },
    {
      q: 'What is the AppData folder, and why does it explain so many mysteries?',
      choices: [
        'A folder for installed programs',
        'A hidden folder in your home directory where apps stash your settings, caches, and save data - the answer to where did my app save its config?',
        'The Windows system folder',
        'A backup of your documents'
      ],
      answer: 1,
      explain: 'It has Local (machine-specific, big caches) and Roaming (smaller, follows you between PCs); it is hidden, so people think it does not exist.'
    },
    {
      q: 'What does Run as administrator (and the UAC prompt) actually do?',
      choices: [
        'Logs you in as a different user',
        'Grants a program elevated privileges for a task - normally even admins\' programs run with limited rights, and the UAC prompt is the consent before crossing that line',
        'Speeds up the program',
        'Disables the antivirus'
      ],
      answer: 1,
      explain: 'Half of all it-wont-let-me-save and installer-failed problems are this - you are on the wrong side of the privilege boundary; do not run everything elevated to be safe, it is the opposite of safe.'
    },
  ],
  'windows-for-power-users/2': [
    {
      q: 'What is a Windows service?',
      choices: [
        'An app with a window you click',
        'A long-running background program with no window, often started by Windows at boot before you even log in - the print spooler, Windows Update, antivirus',
        'A type of file',
        'A registry key'
      ],
      answer: 1,
      explain: 'Services are why your computer can do things while you are not looking; when something runs and you cannot find a window for it, it is probably a service (check services.msc).'
    },
    {
      q: 'Which Task Manager tab tells you why your boot is slow?',
      choices: [
        'The Processes tab',
        'The Startup apps tab - every program that auto-launches at login, with a startup-impact rating you can disable',
        'The Details tab',
        'The Performance tab'
      ],
      answer: 1,
      explain: 'Disabling a startup app stops it auto-launching but does not uninstall it - low risk, easily reversed; half of slow-boot complaints are a pile of self-added updaters and helpers.'
    },
    {
      q: 'What is the Windows registry?',
      choices: [
        'A list of installed programs only',
        'A single central database where Windows and most apps store settings - organized as hives (roots), keys (folders), and values (the settings), instead of scattered text config files',
        'A type of service',
        'A backup system'
      ],
      answer: 1,
      explain: 'It is the deepest cultural difference from Unix, which uses plain-text config files; the registry is fast and central but not human-friendly text, with no just-delete-the-config escape hatch.'
    },
  ],
  'windows-for-power-users/3': [
    {
      q: 'What is PowerShell\'s defining idea?',
      choices: [
        'It is faster than other shells',
        'Commands pass objects (structured data with named properties) between each other, not plain text - so you work with data instead of scraping it',
        'It only runs on servers',
        'It uses no commands'
      ],
      answer: 1,
      explain: 'Whenever you see a PowerShell command, ask what object does this produce and what properties does it have? - that question is the key to the whole shell.'
    },
    {
      q: 'How are PowerShell cmdlets named?',
      choices: [
        'Random short names',
        'Verb-Noun (Get-Process, Stop-Service, New-Item) - the verb says what you are doing, the noun says what to, so you can guess commands',
        'All lowercase',
        'By number'
      ],
      answer: 1,
      explain: 'The verbs come from a small standard list (Get, Set, Start, Stop, New, Remove), making the language far more predictable than cryptic short names.'
    },
    {
      q: 'What is the execution policy, and what is the safe fix when a script is blocked?',
      choices: [
        'A firewall setting; turn it off',
        'A safety setting that blocks running script files by default; fix it deliberately with Set-ExecutionPolicy -Scope CurrentUser RemoteSigned, not by turning the safety off entirely',
        'A type of permission; use Bypass',
        'A virus scanner; disable it'
      ],
      answer: 1,
      explain: 'It is a speed bump, not a security boundary - RemoteSigned lets your own local scripts run but requires downloaded ones to be signed; reaching for Unrestricted or Bypass is a flag to slow down.'
    },
  ],
  'your-first-pipeline-github-actions/1': [
    {
      q: 'What are the five nested ideas of a GitHub Actions pipeline?',
      choices: [
        'Build, test, ship, observe, repeat',
        'An event triggers a workflow, which contains jobs, each running steps on a fresh runner',
        'Plan, code, review, merge, deploy',
        'Input, process, output, log, archive'
      ],
      answer: 1,
      explain: 'Read it as a sentence; every workflow you ever read is just those five ideas in a slightly different arrangement.'
    },
    {
      q: 'What is the most surprising fact about a job\'s runner?',
      choices: [
        'It is your own computer',
        'Every job starts on a brand-new, empty machine that is thrown away when the job finishes - nothing survives unless you explicitly pass it along',
        'It remembers the last run',
        'It has your code pre-loaded'
      ],
      answer: 1,
      explain: 'Newcomers assume the runner is their computer in the cloud with their code on it; it is a blank box, which is why the first step is almost always check out my code.'
    },
    {
      q: 'What determines YAML structure, and what is the classic gotcha?',
      choices: [
        'Curly braces',
        'Indentation with spaces, never tabs - a step nested one level wrong is a different meaning, and the error is usually cryptic rather than your indentation is wrong',
        'Semicolons',
        'The filename'
      ],
      answer: 1,
      explain: 'Each level of nesting is two more spaces than its parent; configure your editor to show whitespace and insert spaces for Tab.'
    },
  ],
  'your-first-pipeline-github-actions/2': [
    {
      q: 'Why is actions/checkout the step nobody can skip?',
      choices: [
        'It runs the tests',
        'The runner starts empty without your repo on it; checkout clones your repo onto the runner so every later step can see your files',
        'It installs the language',
        'It deploys the code'
      ],
      answer: 1,
      explain: 'The number-one why-is-my-workflow-failing mystery is writing npm test first and getting package.json not found - the file is in your repo, but not yet on the blank machine.'
    },
    {
      q: 'Why use `npm ci` instead of `npm install` in CI?',
      choices: [
        'It is shorter to type',
        'npm ci installs exactly what the lockfile says (reproducible) and fails loudly if the lockfile disagrees with package.json, where npm install can quietly update versions',
        'npm ci is faster only',
        'There is no difference'
      ],
      answer: 1,
      explain: 'In CI you want precisely what the lockfile says every time, so a surprise dependency bump cannot break a run - the same principle as pip install -r requirements.txt for Python.'
    },
    {
      q: 'How does GitHub know whether a step passed or failed?',
      choices: [
        'It reads the log text',
        'By the exit code - 0 means success, anything else means failure; test runners exit non-zero when a test fails, which is what turns a step red',
        'It asks the developer',
        'It times the step'
      ],
      answer: 1,
      explain: 'To debug a red run, find the first red step and read its output - that is where the truth is; a later step being red is usually just a consequence.'
    },
  ],
  'your-first-pipeline-github-actions/3': [
    {
      q: 'What does caching dependencies (e.g. `cache: "npm"`) buy you, and what must it never affect?',
      choices: [
        'Correctness; it changes results',
        'Speed only - it restores downloaded packages instead of re-fetching when the lockfile is unchanged; it must never change what a step does, only how fast',
        'Security; it hides secrets',
        'Nothing useful'
      ],
      answer: 1,
      explain: 'A cache is a speed optimization, never a correctness dependency; if a run ever behaves differently because of a cache, something is wrong.'
    },
    {
      q: 'What does a build matrix do?',
      choices: [
        'Encrypts the build',
        'Runs one job once per value in a list (e.g. Node 18, 20, 22) in parallel, so you write the job once and get several real test runs',
        'Combines all jobs into one',
        'Skips slow tests'
      ],
      answer: 1,
      explain: 'If only Node 18 fails, you learn something precise - your code relies on something newer - before a user on Node 18 finds out for you.'
    },
    {
      q: 'By default, does a red pipeline stop someone from merging?',
      choices: [
        'Yes, always',
        'No - a red check is advisory by default; you must turn on a branch protection rule marking the CI check as required to actually block the merge',
        'Only on weekends',
        'Only for the repo owner'
      ],
      answer: 1,
      explain: 'Required-check names track the job name, so renaming a job can quietly disable its protection - revisit the rule after renaming.'
    },
  ],
  'your-first-unit-test/1': [
    {
      q: 'What is a unit test?',
      choices: [
        'A test of the whole running system',
        'A small piece of code that runs one other piece (usually a single function) with known inputs and checks it produces the expected result',
        'A code formatter',
        'A type of deployment'
      ],
      answer: 1,
      explain: 'It is not a special kind of program - just a function you write that calls your function and checks the answer.'
    },
    {
      q: 'What are the three parts of a test (AAA)?',
      choices: [
        'Add, Act, Archive',
        'Arrange (set up inputs), Act (call the code once), Assert (check the result)',
        'Allocate, Assign, Assess',
        'Apply, Audit, Approve'
      ],
      answer: 1,
      explain: 'An assertion (assert result == 110) states what must be true; if it is false, Python raises an error and the runner knows the test failed.'
    },
    {
      q: 'Why keep the Act step to a single call?',
      choices: [
        'To make it faster',
        'If a test calls three functions and then asserts, a failure does not tell you which one broke - one test, one behavior, one act',
        'Assertions are expensive',
        'The runner requires it'
      ],
      answer: 1,
      explain: 'The easiest code to test is a function that takes inputs and returns a value with no surprises - no printing, no saving, no network.'
    },
  ],
  'your-first-unit-test/2': [
    {
      q: 'What naming rule does pytest use to find tests?',
      choices: [
        'Any function works',
        'Tests live in files named test_*.py and test functions start with test - misname either and pytest silently skips it',
        'Files must be named main.py',
        'Functions must start with check_'
      ],
      answer: 1,
      explain: 'A test that never runs is worse than no test, because you will think you are covered; pytest only looks in test_*.py and runs functions whose names start with test.'
    },
    {
      q: 'When reading pytest output, what do you read first?',
      choices: [
        'The first line',
        'The last line - 1 passed (green) or 1 failed (red) - then dig into details only when something is red',
        'The middle',
        'The version number'
      ],
      answer: 1,
      explain: 'On failure pytest shows assert <actual> == <expected> with real values plus the file and line; read it bottom-up.'
    },
    {
      q: 'Why should you always watch a test fail at least once?',
      choices: [
        'To slow down development',
        'A passing test only tells you something if it would fail when the code is wrong - a test you have never seen fail might be a test that cannot fail',
        'Failures look impressive',
        'It is required by pip'
      ],
      answer: 1,
      explain: 'Break the code on purpose and confirm the test goes red; that round trip is what makes the green mean something.'
    },
  ],
  'your-first-unit-test/3': [
    {
      q: 'Why test one behavior per test instead of cramming several asserts in?',
      choices: [
        'It runs faster',
        'pytest stops at the first failing assert and never reaches the rest, and the failure just names the test, not which check broke - split them so each behavior stands alone',
        'Multiple asserts are illegal',
        'It uses less memory'
      ],
      answer: 1,
      explain: 'Now if the zero-tax case breaks, pytest names that test by name and the others still run and report - one red line, one precise meaning.'
    },
    {
      q: 'Why must tests be independent (not order-dependent)?',
      choices: [
        'To run in parallel only',
        'Each test must pass or fail on its own; if one leaves state behind that another depends on, they pass together but fail alone or in a different order',
        'Order does not matter',
        'The runner shuffles randomly to be cruel'
      ],
      answer: 1,
      explain: 'pytest can run tests in different orders between machines; the fix is each test arranges its own inputs from scratch and cleans up - if two cannot run in either order, one is lying.'
    },
    {
      q: 'What is the most dangerous kind of test?',
      choices: [
        'A slow test',
        'One that passes even when the code is wrong - usually because it has no real assertion (calls the function but never checks the result), giving a green dot and zero protection',
        'A test with many asserts',
        'A test with a long name'
      ],
      answer: 1,
      explain: 'It looks like protection but checks nothing; the cure is the same habit - make the code wrong once and confirm the test catches it.'
    },
  ],
  'your-home-network/1': [
    {
      q: 'What is the difference between a modem and a router?',
      choices: [
        'They are the same box',
        'The modem translates your ISP\'s signal and is the single bridge to the internet (one device); the router shares that one connection among all your devices and broadcasts the Wi-Fi',
        'The router talks to the ISP; the modem shares Wi-Fi',
        'The modem is faster'
      ],
      answer: 1,
      explain: 'A modem alone connects exactly one device with no Wi-Fi; many ISPs ship a combined gateway box, which is why people mix the two jobs up.'
    },
    {
      q: 'What is the default gateway?',
      choices: [
        'The ISP\'s main server',
        'Your device\'s name for the router - the box it sends traffic to when the destination is not on your local network',
        'A type of firewall',
        'The Wi-Fi password'
      ],
      answer: 1,
      explain: 'It is almost always the address you would type into a browser to open the router\'s settings page (commonly 192.168.1.1).'
    },
    {
      q: 'How does knowing modem vs router help when the internet goes down?',
      choices: [
        'It does not',
        'You can reason instead of panic - no internet on any device with a dark modem light points at the modem/ISP, while a working cable but no Wi-Fi points at the router\'s wireless side',
        'You just restart everything',
        'You call the ISP first always'
      ],
      answer: 1,
      explain: 'Ask which job is failing: cannot reach the ISP (modem job) is a different problem from devices cannot get addresses (router job).'
    },
  ],
  'your-home-network/2': [
    {
      q: 'What is the difference between a public and a private IP?',
      choices: [
        'They are the same',
        'One public IP is given to your whole home by the ISP (your address on the open internet); private IPs (192.168.x.x) are handed to each device and only mean something inside your home',
        'Private IPs are on the internet; public ones are local',
        'Public IPs change every second'
      ],
      answer: 1,
      explain: 'Millions of homes use the same 192.168.1.x numbers at once, and that is fine, because those addresses never leave the building.'
    },
    {
      q: 'What does NAT do?',
      choices: [
        'Speeds up Wi-Fi',
        'Translates between your many private addresses and your one public address - swapping the from address on the way out and using a table to route each reply back to the device that asked',
        'Encrypts your traffic',
        'Assigns Wi-Fi passwords'
      ],
      answer: 1,
      explain: 'It is a large part of how the internet coped with not having enough addresses - your home gets one public address and NAT multiplexes all your devices through it.'
    },
    {
      q: 'Why does outbound traffic work by default but inbound is closed?',
      choices: [
        'The ISP blocks inbound',
        'NAT translation only exists for conversations your devices start, so a reply has a table entry to route back; an unsolicited inbound knock has no entry, so the router drops it',
        'Inbound is slower',
        'Wi-Fi only allows outbound'
      ],
      answer: 1,
      explain: 'That one-way default is quiet security work, and it is also why your friend cannot reach a game server on your PC without deliberate port forwarding.'
    },
  ],
  'your-home-network/3': [
    {
      q: 'What is the trade-off between the 2.4 GHz and 5 GHz Wi-Fi bands?',
      choices: [
        '5 GHz is always better',
        '2.4 GHz travels farther and through walls but is slower and crowded; 5 GHz is much faster with less interference but has shorter range',
        '2.4 GHz is faster',
        'They are identical'
      ],
      answer: 1,
      explain: 'Close and needs speed to 5 GHz; far away or just needs to stay connected to 2.4 GHz - and a smart-home gadget that will not connect often only speaks 2.4 GHz.'
    },
    {
      q: 'Which security setting matters most on a home router?',
      choices: [
        'The network name',
        'Changing the router\'s admin password from the factory default - it is the master key to the router\'s settings, and the defaults are printed in manuals anyone can find',
        'Hiding the SSID',
        'The channel number'
      ],
      answer: 1,
      explain: 'Default admin credentials are the single most common way home networks get taken over; the admin login is not the same as your Wi-Fi password.'
    },
    {
      q: 'Why turn on a guest network?',
      choices: [
        'It is faster',
        'It is a separate Wi-Fi walled off from your main devices - put visitors on it so you do not share your real password, and put cheap smart gadgets on it so a compromised one cannot reach your laptop',
        'It hides your IP',
        'It disables the firewall'
      ],
      answer: 1,
      explain: 'Those cheap IoT devices are the ones most likely to have security holes; a guest network keeps a compromised gadget from being a doorway.'
    },
  ],
  'rust-from-zero/10': [
    {
      q: 'What is the best way to get fluent in Rust from here?',
      choices: [
        'Read three more books first',
        'Build something real in the area that excites you - a CLI, a web endpoint, a number-cruncher - and finish it',
        'Memorize the standard library',
        'Re-read the borrow checker chapter repeatedly'
      ],
      answer: 1,
      explain: 'You will learn more from one completed small thing than from three chapters you only read; the best next step is building, not more reading.'
    },
    {
      q: 'Which crate is the low-friction starting point for a first real Rust project?',
      choices: [
        'axum, for web backends',
        'clap, for command-line tools - fast, single-binary, easy to share',
        'wasm-bindgen, for WebAssembly',
        'serde, for serialization'
      ],
      answer: 1,
      explain: 'Command-line tools are Rust\'s sweet spot for a first project; clap gives you a polished CLI with help text and flags in an afternoon.'
    },
    {
      q: 'What is the honest truth about the borrow checker, looking ahead?',
      choices: [
        'It fights you forever',
        'It stops fighting you sooner than you think - after a project or two you write code it accepts on the first try, because you have absorbed how it thinks',
        'You should disable it',
        'It only matters for embedded work'
      ],
      answer: 1,
      explain: 'That early frustration is temporary and productive; the up-front thinking buys you fast programs that do not crash from memory bugs or data races.'
    },
  ],
};

export function quizFor(slug, phase) {
  return QUIZZES[`${slug}/${phase}`] || [];
}
