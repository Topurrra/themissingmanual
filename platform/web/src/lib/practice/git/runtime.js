// Browser-only "git in a box" runtime for the /practice git module. Parses a
// tiny `git <subcommand> ...` script (one command per line, like a terminal
// session) and executes it for real against an isolated isomorphic-git repo,
// producing a git-CLI-flavored transcript. No server involved.
//
// isomorphic-git + lightning-fs are dynamic-imported (not top-level) so Vite
// code-splits them into their own lazy chunk, loaded only when a git lesson
// actually runs - same reasoning as the CDN-loaded WASM adapters in
// runnable/adapters.js, just via the bundler instead of a <script> tag since
// these are plain npm packages.
//
// Three things below were flagged by a prior Node+memfs feasibility spike and
// independently RE-VERIFIED here against a real (non-memfs) fs before writing
// this file, per the round's contract:
//
// 1. `git.merge()` moves the branch ref but does NOT update the in-memory
//    working directory to match (confirmed: reading a file right after
//    `merge()` returns still shows the pre-merge content). Every ref-changing
//    op in this file (checkout / checkout -b / merge) therefore re-runs
//    `git.checkout({ ref, force: true })` afterwards to resync the working
//    tree - checkout itself already does this as part of what it *is*, merge
//    alone does not, so merge gets the extra call.
// 2. A real overlapping-line conflict throws `MergeConflictError` with
//    `err.data.filepaths` / `err.data.bothModified`. With the DEFAULT options
//    (no `abortOnConflict` passed), the working tree is left completely
//    untouched - no partial `<<<<<<<` markers get written. (Passing
//    `abortOnConflict: false` explicitly *does* write real conflict markers,
//    but we deliberately never pass that in v1 - see the merge command below.)
//    So: catch it, print a real-git-flavored CONFLICT message, move on.
// 3. `git.statusMatrix()` works fine on a zero-commit repo (no throw) -
//    `git.log()` is what throws (`NotFoundError`) before the first commit.
// 4. GOTCHA FOR LESSON AUTHORS (found while real-browser-testing the stash
//    lesson, not fixable from this file): isomorphic-git's WORKDIR walker
//    trusts the git index's CACHED stat entry instead of re-hashing content
//    when a fresh `lstat()` of the working file matches the stat recorded at
//    add-time on every field `compareStats()` checks - mode/mtime/ctime/size/
//    ino (see node_modules/isomorphic-git's WORKDIR.oid(), which calls
//    `compareStats()` before deciding whether to re-read+hash the file). This
//    is the "racy git" edge case (kernel.org/racy-git.txt) and isomorphic-git
//    doesn't implement the usual protection for it. In THIS sandbox, seed
//    (`precommit`) and `workdirEdits` writes happen back-to-back within the
//    same execScript call, so mtime/ctime never tick between them - meaning a
//    `workdirEdits` overwrite of a precommitted file is invisible to
//    `computeStatus`/`git status`/stash's change-detection UNLESS its new
//    content is a DIFFERENT BYTE LENGTH than what was committed (confirmed by
//    testing both ways in a real browser: same-length edit -> invisible,
//    different-length edit -> detected correctly). Any lesson (or future
//    command) that needs `workdirEdits` to register as a real change to an
//    already-committed file MUST make that edit a different length, not just
//    different content.


const AUTHOR = { name: 'learner', email: 'learner@example.com', timestamp: 1700000000 };
// ^ fixed author + timestamp: commit hashes/timestamps are never compared for
// grading (see runners.js gradeGitState), but keeping them fixed means two
// runs of the identical script produce byte-identical transcripts, which
// makes this file's own manual testing/debugging saner.

const DIR = '/repo';
let _seq = 0;

async function loadLibs() {
  // isomorphic-git's hashing (sha.js) reaches for Node's `Buffer` global, which
  // no browser provides and Vite doesn't polyfill by default - without this,
  // every git.add()/commit() throws "Buffer is not defined" deep inside the
  // library (confirmed by running this in a real browser page, not assumed).
  if (typeof globalThis.Buffer === 'undefined') {
    const { Buffer } = await import('buffer');
    globalThis.Buffer = Buffer;
  }
  const [git, lfsMod] = await Promise.all([
    import('isomorphic-git'),
    import('@isomorphic-git/lightning-fs')
  ]);
  const LightningFS = lfsMod.default;
  return { git, LightningFS };
}

// A fresh, uniquely-named FS per call (lightning-fs backs each name with its
// own IndexedDB database - reusing a name would let one run's repo leak into
// the next, which is exactly what grading must never do). `wipe: true` is
// belt-and-suspenders in case a prior run's cleanup (destroyFs) ever failed to
// actually delete the DB.
function freshFs(LightningFS) {
  const name = `tmm-practice-git-${Date.now()}-${++_seq}-${Math.random().toString(36).slice(2)}`;
  const fs = new LightningFS(name, { wipe: true });
  return { fs, name };
}

function destroyFs(name) {
  // Best-effort: an IndexedDB delete failing here never affects correctness
  // (the next run gets its own unique name regardless), only leaves an orphan
  // DB behind, so this is fire-and-forget rather than awaited/thrown on.
  try {
    indexedDB.deleteDatabase(name);
    indexedDB.deleteDatabase(name + '_lock');
  } catch (e) {
    /* ignore */
  }
}

async function writeFileDeep(fs, filepath, content) {
  const parts = filepath.split('/');
  let cur = DIR;
  for (let i = 0; i < parts.length - 1; i++) {
    cur += '/' + parts[i];
    try {
      await fs.promises.mkdir(cur);
    } catch (e) {
      /* EEXIST - fine */
    }
  }
  await fs.promises.writeFile(`${DIR}/${filepath}`, content, 'utf8');
}

// `ignore` (optional Set<string>) excludes exact relative-path matches, e.g. a
// name read straight from .gitignore - see readGitignore below.
async function listAllFiles(fs, ignore) {
  const out = [];
  async function walk(rel) {
    const abs = rel ? `${DIR}/${rel}` : DIR;
    const entries = await fs.promises.readdir(abs);
    for (const entry of entries) {
      if (entry === '.git') continue;
      const relPath = rel ? `${rel}/${entry}` : entry;
      const stat = await fs.promises.stat(`${DIR}/${relPath}`);
      if (stat.isDirectory()) await walk(relPath);
      else out.push(relPath);
    }
  }
  await walk('');
  return (ignore && ignore.size ? out.filter((p) => !ignore.has(p)) : out).sort();
}

// Minimal .gitignore support: exact-filename lines only (no globs/dirs) - a
// full pattern matcher is out of scope for this beginner sandbox. Missing
// file -> empty ignore set.
async function readGitignore(fs) {
  try {
    const content = await fs.promises.readFile(`${DIR}/.gitignore`, 'utf8');
    return new Set(content.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));
  } catch (e) {
    return new Set();
  }
}

// Splits `"foo bar"` / `'foo bar'` / `foo` tokens, so `git commit -m "two words"`
// keeps the message as one token.
function tokenize(line) {
  const tokens = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m;
  while ((m = re.exec(line))) tokens.push(m[1] ?? m[2] ?? m[3]);
  return tokens;
}

function parseCommandLines(script) {
  return (script || '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

// -- status -------------------------------------------------------------
// Real git status text, close enough that a learner who's used a real
// terminal recognizes it (not byte-identical to real git's exact wording in
// every edge case - see the report).
async function computeStatus(git, fs) {
  const branch = (await git.currentBranch({ fs, dir: DIR })) || 'main';
  const hasCommits = !!(await git.currentBranch({ fs, dir: DIR, test: true }));
  const matrix = await git.statusMatrix({ fs, dir: DIR });
  const ignore = await readGitignore(fs);
  const staged = [];
  const unstaged = [];
  const untracked = [];
  for (const [path, head, workdir, stage] of matrix) {
    if (head === 0 && stage === 0 && workdir === 2) {
      // Ignored files only ever affect the untracked bucket, same as real git -
      // a file that's already tracked stays tracked regardless of .gitignore.
      if (!ignore.has(path)) untracked.push(path);
      continue;
    }
    if (stage !== head) staged.push({ path, kind: head === 0 ? 'new file' : stage === 0 ? 'deleted' : 'modified' });
    if (workdir !== stage) unstaged.push({ path, kind: workdir === 0 ? 'deleted' : 'modified' });
  }
  return { branch, staged, unstaged, untracked, noCommitsYet: !hasCommits };
}

function formatStatus({ branch, staged, unstaged, untracked, noCommitsYet }) {
  const lines = [`On branch ${branch}`];
  if (noCommitsYet) lines.push('', 'No commits yet');

  const sections = [];
  if (staged.length) {
    const unstageHint = noCommitsYet
      ? '  (use "git rm --cached <file>..." to unstage)'
      : '  (use "git restore --staged <file>..." to unstage)';
    sections.push(
      ['Changes to be committed:', unstageHint, ...staged.map((f) => `        ${f.kind}:   ${f.path}`)].join('\n')
    );
  }
  if (unstaged.length) {
    sections.push(
      [
        'Changes not staged for commit:',
        '  (use "git add <file>..." to update what will be committed)',
        ...unstaged.map((f) => `        ${f.kind}:   ${f.path}`)
      ].join('\n')
    );
  }
  if (untracked.length) {
    sections.push(
      [
        'Untracked files:',
        '  (use "git add <file>..." to include in what will be committed)',
        ...untracked.map((p) => `        ${p}`)
      ].join('\n')
    );
  }

  if (sections.length) lines.push('', sections.join('\n\n'));

  if (!sections.length) {
    lines.push(
      noCommitsYet ? 'nothing to commit (create/copy files and use "git add" to track)' : 'nothing to commit, working tree clean'
    );
  } else if (!staged.length) {
    lines.push(
      '',
      unstaged.length
        ? 'no changes added to commit (use "git add" and/or "git commit -a")'
        : 'nothing added to commit but untracked files present (use "git add" to track)'
    );
  }
  return lines.join('\n');
}

// -- one command ----------------------------------------------------------
async function cmdAdd(git, fs, args) {
  if (!args.length) return 'Nothing specified, nothing added.';
  const isAll = args.length === 1 && (args[0] === '.' || args[0] === '-A' || args[0] === '--all');
  const paths = isAll ? await listAllFiles(fs, await readGitignore(fs)) : args.filter((a) => a !== '-A' && a !== '--all');
  try {
    for (const p of paths) await git.add({ fs, dir: DIR, filepath: p });
    return '';
  } catch (err) {
    return `fatal: pathspec '${paths.join(' ')}' did not match any files`;
  }
}

async function cmdCommit(git, fs, args) {
  const mIdx = args.indexOf('-m');
  const message = mIdx >= 0 ? args[mIdx + 1] : undefined;
  if (!message) return 'fatal: no commit message given (use -m "message")';
  const branch = (await git.currentBranch({ fs, dir: DIR })) || 'main';
  const matrix = await git.statusMatrix({ fs, dir: DIR });
  const stagedRows = matrix.filter(([, head, , stage]) => stage !== head);
  if (!stagedRows.length) return `On branch ${branch}\nnothing to commit, working tree clean`;
  const isRoot = !(await git.currentBranch({ fs, dir: DIR, test: true }));
  const oid = await git.commit({ fs, dir: DIR, message, author: AUTHOR });
  const rootTag = isRoot ? ' (root-commit)' : '';
  const n = stagedRows.length;
  return `[${branch}${rootTag} ${oid.slice(0, 7)}] ${message}\n ${n} file${n === 1 ? '' : 's'} changed`;
}

async function cmdBranch(git, fs, args) {
  const name = args[0];
  if (!name) return '';
  try {
    await git.branch({ fs, dir: DIR, ref: name });
    return '';
  } catch (err) {
    return `fatal: a branch named '${name}' already exists.`;
  }
}

async function cmdCheckout(git, fs, args) {
  const create = args[0] === '-b';
  const name = create ? args[1] : args[0];
  if (!name) return 'fatal: missing branch name';
  try {
    if (create) await git.branch({ fs, dir: DIR, ref: name });
    await git.checkout({ fs, dir: DIR, ref: name, force: true });
    return create ? `Switched to a new branch '${name}'` : `Switched to branch '${name}'`;
  } catch (err) {
    return `error: pathspec '${name}' did not match any file(s) known to git`;
  }
}

async function cmdMerge(git, fs, args) {
  const theirs = args[0];
  if (!theirs) return 'fatal: no branch specified for merge';
  const ours = (await git.currentBranch({ fs, dir: DIR })) || 'main';
  try {
    const result = await git.merge({ fs, dir: DIR, ours, theirs, author: AUTHOR });
    // GOTCHA (see file header, point 1): merge() moved the ref but left the
    // working tree stale - force a real checkout of our own branch to sync it.
    await git.checkout({ fs, dir: DIR, ref: ours, force: true });
    if (result.alreadyMerged) return 'Already up to date.';
    if (result.fastForward) return `Updating ${(result.oid || '').slice(0, 7)}\nFast-forward`;
    return `Merge made by the 'ort' strategy.`;
  } catch (err) {
    // GOTCHA (see file header, point 2): default options -> working tree is
    // untouched on conflict. Report it the way real git does; don't attempt
    // to hand-generate conflict markers (v2 scope).
    if (err && err.data && err.data.filepaths) {
      const files = err.data.filepaths.join(', ');
      return `Auto-merging ${files}\nCONFLICT (content): Merge conflict in ${files}\nAutomatic merge failed; fix conflicts and then commit the result.`;
    }
    return `fatal: '${theirs}' - not something we can merge`;
  }
}

// -- stash ------------------------------------------------------------
// isomorphic-git has no native stash API. v1 keeps this to a single slot
// (not a real stack) scoped to one execScript run via `state` - plenty for a
// beginner lesson, per the round's contract.
async function cmdStash(git, fs, args, state) {
  if (args[0] === 'pop') {
    if (!state.stash) return 'No stash entries found.';
    for (const [path, content] of Object.entries(state.stash)) {
      await writeFileDeep(fs, path, content);
    }
    state.stash = null;
    return 'Dropped refs/stash@{0}';
  }
  const st = await computeStatus(git, fs);
  const changedPaths = [...new Set([...st.staged.map((f) => f.path), ...st.unstaged.map((f) => f.path)])];
  if (!changedPaths.length) return 'No local changes to save';
  const holding = {};
  for (const p of changedPaths) holding[p] = await fs.promises.readFile(`${DIR}/${p}`, 'utf8');
  const branch = (await git.currentBranch({ fs, dir: DIR })) || 'main';
  // Save the diff ourselves, then force-checkout our own branch to resync the
  // working tree AND index back to HEAD - same resync trick cmdMerge uses.
  await git.checkout({ fs, dir: DIR, ref: branch, force: true });
  state.stash = holding;
  return `Saved working directory and index state WIP on ${branch}: stash@{0}`;
}

// -- revert -------------------------------------------------------------
// isomorphic-git has no native revert either. v1 only supports `revert HEAD`:
// build a new commit whose tree matches HEAD's parent (undoing whatever HEAD
// changed), staying on the current branch the whole time - no detached HEAD.
async function cmdRevert(git, fs, args) {
  const target = args[0];
  if (!target) return 'fatal: no commit specified for revert';
  if (target !== 'HEAD') {
    return `fatal: '${target}' - this sandbox only supports "git revert HEAD"`;
  }
  let commits;
  try {
    commits = await git.log({ fs, dir: DIR, depth: 2 });
  } catch (err) {
    return 'fatal: your current branch does not have any commits yet';
  }
  if (commits.length < 2) {
    return `fatal: commit ${commits[0] ? commits[0].oid.slice(0, 7) : target} has no parent - nothing to revert to`;
  }
  const [headCommit, parentCommit] = commits;
  const branch = (await git.currentBranch({ fs, dir: DIR })) || 'main';

  const headFiles = await git.listFiles({ fs, dir: DIR, ref: headCommit.oid });
  const parentFiles = await git.listFiles({ fs, dir: DIR, ref: parentCommit.oid });

  // Anything HEAD added that the parent didn't have gets removed.
  for (const p of headFiles) {
    if (!parentFiles.includes(p)) {
      await fs.promises.unlink(`${DIR}/${p}`);
      await git.remove({ fs, dir: DIR, filepath: p });
    }
  }
  // Everything else is restored to exactly what the parent's tree had.
  for (const p of parentFiles) {
    const { blob } = await git.readBlob({ fs, dir: DIR, oid: parentCommit.oid, filepath: p });
    await writeFileDeep(fs, p, new TextDecoder().decode(blob));
    await git.add({ fs, dir: DIR, filepath: p });
  }

  const message = `Revert "${headCommit.commit.message.trim()}"`;
  const oid = await git.commit({ fs, dir: DIR, message, author: AUTHOR });
  const n = new Set([...headFiles, ...parentFiles]).size;
  return `[${branch} ${oid.slice(0, 7)}] ${message}\n ${n} file${n === 1 ? '' : 's'} changed`;
}

async function cmdLog(git, fs, args) {
  let commits;
  try {
    commits = await git.log({ fs, dir: DIR });
  } catch (err) {
    return "fatal: your current branch does not have any commits yet";
  }
  if (args.includes('--oneline')) {
    return commits.map((c) => `${c.oid.slice(0, 7)} ${c.commit.message.trim()}`).join('\n');
  }
  return commits
    .map((c) => `commit ${c.oid}\nAuthor: ${c.commit.author.name} <${c.commit.author.email}>\n\n    ${c.commit.message.trim()}\n`)
    .join('\n');
}

async function runOneCommand(git, fs, line, state) {
  const tokens = tokenize(line);
  if (tokens[0] !== 'git') {
    const e = new Error(`${tokens[0]}: command not found (this sandbox only runs git commands)`);
    e.__unsupported = true;
    throw e;
  }
  const [, sub, ...rest] = tokens;
  switch (sub) {
    case 'init':
      // The repo is always created already-initialized (see execScript) -
      // an explicit `git init` line in the script matches real git re-running
      // init on an existing repo.
      return 'Reinitialized existing Git repository in /repo/.git/';
    case 'add':
      return cmdAdd(git, fs, rest);
    case 'commit':
      return cmdCommit(git, fs, rest);
    case 'branch':
      return cmdBranch(git, fs, rest);
    case 'checkout':
      return cmdCheckout(git, fs, rest);
    case 'merge':
      return cmdMerge(git, fs, rest);
    case 'stash':
      return cmdStash(git, fs, rest, state);
    case 'revert':
      return cmdRevert(git, fs, rest);
    case 'log':
      return cmdLog(git, fs, rest);
    case 'status': {
      const st = await computeStatus(git, fs);
      return formatStatus(st);
    }
    default: {
      const e = new Error(`git: '${sub}' is not a supported command in this practice sandbox.`);
      e.__unsupported = true;
      throw e;
    }
  }
}

// Shared execution engine behind both exported functions below: creates an
// isolated repo, seeds it, runs the script line by line building a terminal
// transcript, and returns the still-open {git, fs} handle so the caller can
// choose to inspect final state before disposing.
async function execScript(commands, { seedFiles, precommit, workdirEdits, onStatus } = {}) {
  onStatus && onStatus('Starting in-browser git…');
  const { git, LightningFS } = await loadLibs();
  const { fs, name } = freshFs(LightningFS);
  const transcript = [];
  let firstError;
  const state = { stash: null }; // single-slot stash, scoped to this one run

  try {
    await fs.promises.mkdir(DIR);
    await git.init({ fs, dir: DIR, defaultBranch: 'main' });

    if (seedFiles) {
      for (const [path, content] of Object.entries(seedFiles)) await writeFileDeep(fs, path, content);
    }
    if (precommit) {
      const paths = await listAllFiles(fs);
      for (const p of paths) await git.add({ fs, dir: DIR, filepath: p });
      if (paths.length) {
        await git.commit({ fs, dir: DIR, message: typeof precommit === 'string' ? precommit : 'Initial commit', author: AUTHOR });
      }
    }
    if (workdirEdits) {
      for (const [path, content] of Object.entries(workdirEdits)) await writeFileDeep(fs, path, content);
    }

    onStatus && onStatus('');
    for (const line of parseCommandLines(commands)) {
      transcript.push(`$ ${line}`);
      try {
        const out = await runOneCommand(git, fs, line, state);
        if (out) transcript.push(out);
      } catch (err) {
        transcript.push(err.message || String(err));
        if (firstError === undefined) firstError = err.message || String(err);
        if (!err.__unsupported) break; // a genuine internal failure - stop, state may be inconsistent
      }
    }
  } catch (err) {
    transcript.push(String((err && err.message) || err));
    if (firstError === undefined) firstError = String((err && err.message) || err);
  }

  return { git, fs, name, logs: transcript.join('\n'), error: firstError };
}

// async runGitScript(commands, { seedFiles, precommit, workdirEdits, onStatus }) ->
//   { logs, error } - same RunResult shape as the other /practice adapters, so
// it slots into PracticeIde's existing plain-text output rendering unchanged.
export async function runGitScript(commands, opts = {}) {
  const { name, logs, error } = await execScript(commands, opts);
  destroyFs(name); // fs itself has no explicit close; only the IndexedDB backing it needs cleanup
  return { logs, error };
}

// async inspectRepoState(commands, opts) -> { logs, error, branch, log, files }
// Runs the SAME script fresh (its own isolated repo, exactly like
// runGitScript) and also returns the final state for grading. Deliberately
// NOT the literal `inspectRepoState(dir)` shape sketched in the contract -
// that would require keeping a live fs handle around between a "run" call and
// a separate "inspect" call, and this repo's fs is destroyed the moment we're
// done with it (see freshFs/destroyFs above) to guarantee grading isolation.
// Folding "run" and "inspect" into one call sidesteps that lifecycle problem
// entirely while still exposing exactly the state gradeGitState() needs.
export async function inspectRepoState(commands, opts = {}) {
  const { git, fs, name, logs, error } = await execScript(commands, opts);
  let branch = null;
  let log = [];
  let files = {};
  try {
    branch = (await git.currentBranch({ fs, dir: DIR })) || null;
  } catch (e) {
    /* leave null */
  }
  try {
    log = (await git.log({ fs, dir: DIR })).map((c) => ({ message: c.commit.message.trim() }));
  } catch (e) {
    log = []; // no commits yet
  }
  try {
    const paths = await listAllFiles(fs);
    for (const p of paths) files[p] = await fs.promises.readFile(`${DIR}/${p}`, 'utf8');
  } catch (e) {
    files = {};
  }
  destroyFs(name);
  return { logs, error, branch, log, files };
}
