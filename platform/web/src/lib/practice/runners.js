// Run + grade /practice lessons. Reuses the existing runnable-code adapters
// ($lib/runnable/adapters.js) - the same JS worker / Pyodide / sql.js runtimes the
// inline RunnableCode blocks use.
import { getAdapter } from '$lib/runnable/adapters.js';

// Best-effort error -> line number, for the "Line N" prefix in the output panel.
// null when the runtime gives no position info (sql.js errors carry none).
function parseErrorLine(language, err) {
  if (!err) return null;
  if (language === 'js') {
    const m = err.match(/<anonymous>:(\d+)/);
    return m ? Number(m[1]) : null;
  }
  if (language === 'python') {
    const m = err.match(/line (\d+)/i);
    return m ? Number(m[1]) : null;
  }
  return null;
}

// JS runs `eval` in the worker's persistent global scope (js-worker.js) - a second
// run re-declaring the same top-level `let`/`const` throws "already declared".
// Force a fresh worker before every JS run/test so each execution is isolated
// (a lesson is a one-shot exercise, not a REPL). Cheap: no WASM/network involved,
// just a new Worker() instantiation.
function freshRun(adapter, language, code, opts) {
  if (language === 'js') adapter.dispose();
  return adapter.run(code, opts);
}

// async runLesson(lesson, code, { onStatus } = {}) ->
//   { ok, logs, result, table, error, errorLine, timeMs }
export async function runLesson(lesson, code, { onStatus } = {}) {
  if (lesson.language === 'git') {
    const { runGitScript } = await import('$lib/practice/git/runtime.js');
    const t0 = performance.now();
    const res = await runGitScript(code, {
      seedFiles: lesson.setup,
      precommit: lesson.precommit,
      workdirEdits: lesson.workdirEdits,
      onStatus
    });
    return { ok: !res.error, logs: res.logs, result: undefined, table: undefined, error: res.error, errorLine: null, timeMs: Math.round(performance.now() - t0) };
  }
  const adapter = getAdapter(lesson.language);
  await adapter.load(onStatus);
  const runOpts = { onStatus };
  if (lesson.language === 'sql') runOpts.seed = lesson.setup || '';
  const t0 = performance.now();
  const res = await freshRun(adapter, lesson.language, code, runOpts);
  const timeMs = Math.round(performance.now() - t0);
  return {
    ok: !res.error,
    logs: res.logs,
    result: res.result,
    table: res.table,
    error: res.error,
    errorLine: parseErrorLine(lesson.language, res.error),
    timeMs
  };
}

function checkMode(lesson) {
  if (lesson.check) return lesson.check;
  if (lesson.language === 'sql') return 'rows';
  if (lesson.tests && lesson.tests.length) return 'tests';
  return 'output';
}

// SQL: run the user's code and the solution each against their own fresh DB
// (seeded with `setup`), then compare the final result table. Column count + row
// values (stringified) must match; column names don't (aliases ok). Row order
// matters only if the solution itself uses ORDER BY, otherwise rows compare as
// sorted multisets.
async function gradeRows(lesson, code) {
  const adapter = getAdapter('sql');
  await adapter.load();
  const seed = lesson.setup || '';
  const [userRes, solRes] = await Promise.all([
    adapter.run(code, { seed }),
    adapter.run(lesson.solution, { seed })
  ]);
  if (userRes.error) return { passed: false, mode: 'rows', detail: userRes.error };
  if (!userRes.table) {
    return { passed: false, mode: 'rows', detail: 'Query did not return any rows - did you write a SELECT?' };
  }
  if (solRes.error || !solRes.table) {
    return { passed: false, mode: 'rows', detail: 'Reference solution failed to run - check the lesson content.' };
  }

  const stringifyRow = (row) => row.map((c) => (c === null ? 'NULL' : String(c)));
  const userRows = userRes.table.rows.map(stringifyRow);
  const solRows = solRes.table.rows.map(stringifyRow);

  if (userRes.table.columns.length !== solRes.table.columns.length) {
    return {
      passed: false,
      mode: 'rows',
      detail: `Expected ${solRes.table.columns.length} column(s), got ${userRes.table.columns.length}.`
    };
  }
  if (userRows.length !== solRows.length) {
    return { passed: false, mode: 'rows', detail: `Expected ${solRows.length} row(s), got ${userRows.length}.` };
  }

  const orderMatters = /order\s+by/i.test(lesson.solution);
  const passed = orderMatters
    ? userRows.every((r, i) => JSON.stringify(r) === JSON.stringify(solRows[i]))
    : JSON.stringify(userRows.map((r) => JSON.stringify(r)).sort()) ===
      JSON.stringify(solRows.map((r) => JSON.stringify(r)).sort());
  return { passed, mode: 'rows', detail: passed ? undefined : 'Row values do not match the expected result.' };
}

// js/python: each test runs `userCode + "\n" + test.code` fresh; passes iff nothing
// throws (JS `throw`, Python assert/exception - both surface as `res.error`).
//
// ponytail: Python tests share Pyodide's persistent global namespace - adapters.js's
// PythonAdapter has no fresh-globals hook, and dispose()+reload would re-init the
// whole WASM runtime (multiple seconds) between every test. State can leak between
// Python tests/runs in the same page session; lesson authors should write tests
// that don't depend on prior-test isolation (each test already re-executes the full
// userCode prefix, which covers the common case). JS doesn't have this problem -
// freshRun() gives every JS run its own worker.
// The checklist shows a one-line reason, not a stack trace. JS worker errors are a
// single line with the eval stack appended (" at eval (eval at self.onmessage…") -
// cut it off. Python errors are multi-line tracebacks whose real message is the
// LAST line ("AssertionError: …").
function testFailureMessage(language, err) {
  if (!err) return '';
  if (language === 'js') return err.split(/\s+at\s+(?:eval|self\.onmessage)/)[0].trim();
  if (language === 'python') {
    const lines = err.trim().split('\n');
    return lines[lines.length - 1].trim();
  }
  return err;
}

async function gradeTests(lesson, code) {
  const adapter = getAdapter(lesson.language);
  await adapter.load();
  const tests = lesson.tests || [];
  const results = [];
  for (const test of tests) {
    const res = await freshRun(adapter, lesson.language, code + '\n' + test.code, {});
    results.push({ name: test.name, passed: !res.error, message: testFailureMessage(lesson.language, res.error) });
  }
  return { passed: results.length > 0 && results.every((r) => r.passed), mode: 'tests', tests: results };
}

// Git: run the learner's command script AND the solution's, each against
// their own fresh isolated repo (same seed/precommit/workdirEdits applied to
// both), then compare final branch + commit-message list + file contents.
// Commit hashes/timestamps/authors are never compared (see runtime.js) - they
// aren't meaningfully replayable across two independent runs.
//
// One lesson (the `git status` "detective" lesson) isn't about ending state
// at all - running `git status` changes nothing, so a full state comparison
// would trivially pass no matter what the learner typed. For that lesson the
// content sets `expectStatusContains: [...]` and grading instead checks that
// the learner's own transcript contains those substrings - a deliberate
// variant from the state-diff mode used everywhere else.
async function gradeGitState(lesson, code) {
  const { runGitScript, inspectRepoState } = await import('$lib/practice/git/runtime.js');
  const opts = { seedFiles: lesson.setup, precommit: lesson.precommit, workdirEdits: lesson.workdirEdits };

  if (lesson.expectStatusContains) {
    const userRun = await runGitScript(code, opts);
    const hay = userRun.logs || '';
    const missing = lesson.expectStatusContains.filter((s) => !hay.includes(s));
    return {
      passed: missing.length === 0,
      mode: 'gitState',
      detail: missing.length ? 'Run git status and check its output carefully - it should mention the modified file.' : undefined
    };
  }

  const [userState, solState] = await Promise.all([inspectRepoState(code, opts), inspectRepoState(lesson.solution, opts)]);
  if (userState.error) return { passed: false, mode: 'gitState', detail: userState.error };

  const branchMatch = userState.branch === solState.branch;
  const messagesMatch = JSON.stringify(userState.log.map((c) => c.message)) === JSON.stringify(solState.log.map((c) => c.message));
  const filesMatch = JSON.stringify(userState.files) === JSON.stringify(solState.files);
  const passed = branchMatch && messagesMatch && filesMatch;
  let detail;
  if (!passed) {
    if (!branchMatch) detail = `Expected to end up on branch "${solState.branch}", but ended on "${userState.branch || '(none)'}".`;
    else if (!messagesMatch) detail = 'Your commit history does not match what this task expects - check which commits you made.';
    else detail = 'File contents do not match what this task expects.';
  }
  return { passed, mode: 'gitState', detail };
}

async function gradeOutput(lesson, code) {
  const adapter = getAdapter(lesson.language);
  await adapter.load();
  const res = await freshRun(adapter, lesson.language, code, {});
  if (res.error) return { passed: false, mode: 'output', detail: res.error };
  const passed = (res.logs || '').trim() === (lesson.expectedOutput || '').trim();
  return { passed, mode: 'output', detail: passed ? undefined : 'Output did not match the expected output.' };
}

// async gradeLesson(lesson, code) -> { passed, mode, tests?: [{name, passed, message}], detail? }
export async function gradeLesson(lesson, code) {
  const mode = checkMode(lesson);
  if (mode === 'rows') return gradeRows(lesson, code);
  if (mode === 'tests') return gradeTests(lesson, code);
  if (mode === 'gitState') return gradeGitState(lesson, code);
  return gradeOutput(lesson, code);
}
