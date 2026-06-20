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
  ]
};

export function quizFor(slug, phase) {
  return QUIZZES[`${slug}/${phase}`] || [];
}
