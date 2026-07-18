// ponytail: no test framework wired up for platform/web (same as related-guides/selfcheck.mjs
// and dom-grader.selfcheck.mjs) - this is the one runnable check for Retry-After parsing, the
// part of the cooldown logic with real edge cases (seconds vs HTTP date, absent, garbage, cap).
// Run: node src/lib/server/providers.selfcheck.mjs
import { parseRetryAfter } from './providers.js';

let failures = 0;
function check(name, cond) {
  if (!cond) {
    failures++;
    console.error('FAIL: ' + name);
  }
}

// Minimal Response stand-in: only .headers.get is used.
const res = (retryAfter) => ({
  headers: { get: (k) => (k.toLowerCase() === 'retry-after' && retryAfter != null ? String(retryAfter) : null) },
});

// delta-seconds form
check('30s -> 30000ms', parseRetryAfter(res(30)) === 30_000);
check('0s -> 0 (no cooldown override)', parseRetryAfter(res(0)) === 0);

// absent / malformed headers fall back to 0 so the caller uses its flat cooldown
check('absent header -> 0', parseRetryAfter(res(null)) === 0);
check('garbage -> 0', parseRetryAfter(res('soon')) === 0);
check('no headers object -> 0', parseRetryAfter({}) === 0);
check('undefined response -> 0', parseRetryAfter(undefined) === 0);

// HTTP-date form
const in20s = new Date(Date.now() + 20_000).toUTCString();
const ms = parseRetryAfter(res(in20s));
check('http-date ~20s', ms > 15_000 && ms <= 21_000);

// a date in the past must not produce a negative cooldown
const past = new Date(Date.now() - 60_000).toUTCString();
check('past date -> 0', parseRetryAfter(res(past)) === 0);

// cap: a provider (or a bug) must not bench itself for hours
check('3h capped to 15m', parseRetryAfter(res(3 * 60 * 60)) === 15 * 60_000);

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('providers selfcheck: all checks passed');
