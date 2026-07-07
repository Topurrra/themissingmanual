// Word-search generator for /train. Pure + framework-free so it can be unit-checked
// (see wordsearch.test.mjs). Places each word in one of 8 directions (incl. reversed
// via the negative directions), allowing shared-letter overlaps, then fills the rest
// with random letters.
import { rand } from './games.js';

const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1]];
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function tryBuild(words, size) {
  const grid = new Array(size * size).fill('');
  const placements = [];
  // Longest first packs better.
  for (const word of [...words].sort((a, b) => b.length - a.length)) {
    let placed = false;
    for (let attempt = 0; attempt < 250 && !placed; attempt++) {
      const [dr, dc] = DIRS[rand(0, 7)];
      const r0 = rand(0, size - 1), c0 = rand(0, size - 1);
      const rEnd = r0 + dr * (word.length - 1), cEnd = c0 + dc * (word.length - 1);
      if (rEnd < 0 || rEnd >= size || cEnd < 0 || cEnd >= size) continue;
      const cells = [];
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const k = (r0 + dr * i) * size + (c0 + dc * i);
        if (grid[k] && grid[k] !== word[i]) { ok = false; break; }
        cells.push(k);
      }
      if (!ok) continue;
      for (let i = 0; i < word.length; i++) grid[cells[i]] = word[i];
      placements.push({ word, cells });
      placed = true;
    }
    if (!placed) return null; // crowded grid - caller retries from scratch
  }
  return { grid, placements };
}

// words: array of strings (any case/punctuation). size: grid dimension.
// Returns { size, grid:[size*size], placements:[{word, cells:[idx]}], words:[placed] }.
export function makeWordSearch(words, size) {
  const clean = [...new Set(words.map((w) => w.toUpperCase().replace(/[^A-Z]/g, '')))]
    .filter((w) => w.length >= 3 && w.length <= size);
  let built = null;
  for (let t = 0; t < 60 && !built; t++) built = tryBuild(clean, size);
  if (!built) built = { grid: new Array(size * size).fill(''), placements: [] };
  for (let k = 0; k < built.grid.length; k++) if (!built.grid[k]) built.grid[k] = ALPHA[rand(0, 25)];
  return { size, grid: built.grid, placements: built.placements, words: built.placements.map((p) => p.word) };
}

// Curated single-word term packs (A–Z only; kept <= 11 so they fit a 12-grid).
// 'general' is a cross-topic mix, listed first so it's the default pick.
export const WS_PACKS = [
  { id: 'general', name: 'General Mix', words: ['API', 'CACHE', 'KERNEL', 'LATENCY', 'ALGORITHM', 'CONTAINER', 'ENCRYPT', 'RECURSION', 'PIPELINE', 'GRAVITY'] },
  { id: 'git', name: 'Git', words: ['COMMIT', 'BRANCH', 'MERGE', 'REBASE', 'STASH', 'REMOTE', 'CLONE', 'REFLOG', 'CONFLICT', 'CHECKOUT'] },
  { id: 'web', name: 'Web & HTTP', words: ['COOKIE', 'HEADER', 'REQUEST', 'RESPONSE', 'SESSION', 'BROWSER', 'CACHE', 'REDIRECT', 'PAYLOAD', 'DOMAIN'] },
  { id: 'data', name: 'Databases', words: ['QUERY', 'INDEX', 'SCHEMA', 'PRIMARY', 'FOREIGN', 'COLUMN', 'ROLLBACK', 'TRIGGER', 'CURSOR', 'MIGRATE'] },
  { id: 'sec', name: 'Security', words: ['CIPHER', 'HASHING', 'TOKEN', 'EXPLOIT', 'FIREWALL', 'MALWARE', 'PHISHING', 'INJECTION', 'ENCRYPT', 'BREACH'] },
  { id: 'ai', name: 'AI & ML', words: ['NEURON', 'TENSOR', 'GRADIENT', 'TRAINING', 'EMBEDDING', 'INFERENCE', 'DATASET', 'OVERFIT', 'FEATURE', 'CLUSTER'] },
  { id: 'prog', name: 'Programming', words: ['FUNCTION', 'VARIABLE', 'POINTER', 'COMPILER', 'RUNTIME', 'BOOLEAN', 'INTEGER', 'RECURSION', 'ITERATOR', 'CLOSURE'] },
  { id: 'net', name: 'Networking', words: ['PACKET', 'ROUTER', 'SUBNET', 'GATEWAY', 'LATENCY', 'PROTOCOL', 'BANDWIDTH', 'SWITCH', 'PROXY', 'SOCKET'] },
  { id: 'os', name: 'Operating Systems', words: ['KERNEL', 'PROCESS', 'THREAD', 'SCHEDULER', 'INTERRUPT', 'DAEMON', 'SANDBOX', 'SYSCALL', 'SEMAPHORE', 'BOOTLOADER'] },
  { id: 'hw', name: 'Hardware', words: ['PROCESSOR', 'MOTHERBOARD', 'FIRMWARE', 'REGISTER', 'TRANSISTOR', 'THROUGHPUT', 'PERIPHERAL', 'CHIPSET', 'VOLTAGE', 'CACHE'] },
  { id: 'devops', name: 'DevOps', words: ['PIPELINE', 'DEPLOYMENT', 'CONTAINER', 'ARTIFACT', 'RUNBOOK', 'CANARY', 'ROLLOUT', 'MONITORING', 'PROVISION', 'AUTOMATION'] },
  { id: 'infra', name: 'Infrastructure', words: ['FAILOVER', 'SCALING', 'TERRAFORM', 'KUBERNETES', 'STORAGE', 'REDUNDANCY', 'UPTIME', 'REPLICA', 'ELASTIC', 'VIRTUALIZE'] },
  { id: 'test', name: 'Testing', words: ['ASSERTION', 'COVERAGE', 'REGRESSION', 'MOCKING', 'FIXTURE', 'INTEGRATION', 'STUBBING', 'FLAKY', 'SNAPSHOT', 'UNITTEST'] },
  { id: 'perf', name: 'Performance', words: ['LATENCY', 'THROUGHPUT', 'BOTTLENECK', 'PROFILING', 'CACHING', 'OPTIMIZE', 'BENCHMARK', 'CONCURRENCY', 'MEMORY', 'INDEXING'] },
  { id: 'math', name: 'Mathematics', words: ['DERIVATIVE', 'INTEGRAL', 'MATRIX', 'VECTOR', 'PROBABILITY', 'FACTORIAL', 'LOGARITHM', 'EXPONENT', 'THEOREM', 'SEQUENCE'] },
  { id: 'logic', name: 'Logic', words: ['PREDICATE', 'SYLLOGISM', 'CONJUNCTION', 'NEGATION', 'INFERENCE', 'FALLACY', 'TAUTOLOGY', 'QUANTIFIER', 'IMPLICATION', 'PARADOX'] },
  { id: 'physics', name: 'Physics', words: ['MOMENTUM', 'VELOCITY', 'GRAVITY', 'FRICTION', 'ENTROPY', 'QUANTUM', 'RELATIVITY', 'ELECTRON', 'PHOTON', 'MAGNETISM'] },
  { id: 'framework', name: 'Frameworks', words: ['COMPONENT', 'MIDDLEWARE', 'LIFECYCLE', 'DEPENDENCY', 'ROUTING', 'RENDERING', 'SCAFFOLD', 'BOILERPLATE', 'MONOREPO', 'HOOK'] },
  { id: 'arch', name: 'Architecture', words: ['MONOLITH', 'ENDPOINT', 'RESILIENCE', 'COUPLING', 'COHESION', 'LAYERED', 'PATTERN', 'TOPOLOGY', 'MODULAR', 'INTERFACE'] },
  { id: 'analytics', name: 'Data & Analytics', words: ['DASHBOARD', 'METRIC', 'WAREHOUSE', 'AGGREGATE', 'VISUALIZE', 'ANALYTICS', 'CORRELATION', 'OUTLIER', 'SEGMENT', 'PIVOT'] },
  { id: 'concepts', name: 'Programming Concepts', words: ['ABSTRACTION', 'INHERITANCE', 'ALGORITHM', 'MUTABLE', 'IMMUTABLE', 'SCOPE', 'LAMBDA', 'GENERIC', 'INSTANCE', 'MODULE'] },
  { id: 'workingai', name: 'Working with AI', words: ['PROMPT', 'CONTEXT', 'RETRIEVAL', 'FINETUNE', 'AGENT', 'TOKENIZE', 'GROUNDING', 'JAILBREAK', 'COPILOT', 'HALLUCINATE'] }
];
