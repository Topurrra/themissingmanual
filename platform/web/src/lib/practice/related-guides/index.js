import { RELATED as REGEX } from './regex.js';
import { RELATED as JAVASCRIPT } from './javascript.js';
import { RELATED as PYTHON } from './python.js';
import { RELATED as SQL } from './sql.js';
import { RELATED as TYPESCRIPT } from './typescript.js';
import { RELATED as GIT } from './git.js';
import { RELATED as POSTGRES } from './postgres.js';
import { RELATED as WEBASSEMBLY } from './webassembly.js';
import { RELATED as MATH } from './math.js';
import { RELATED as PHYSICS } from './physics.js';

const BY_MODULE = {
  regex: REGEX,
  javascript: JAVASCRIPT,
  python: PYTHON,
  sql: SQL,
  typescript: TYPESCRIPT,
  git: GIT,
  postgres: POSTGRES,
  webassembly: WEBASSEMBLY,
  math: MATH,
  physics: PHYSICS
};

export function relatedGuideFor(module, phaseNo) {
  return BY_MODULE[module]?.[phaseNo] ?? null;
}

// Reverse-derived once at import time: 'guide-slug#phase' -> { module, phaseNo }.
const REVERSE = {};
for (const [module, map] of Object.entries(BY_MODULE)) {
  for (const [phaseNo, target] of Object.entries(map)) {
    REVERSE[target] = { module, phaseNo: Number(phaseNo) };
  }
}

export function practiceLessonFor(guideSlug, phaseNo) {
  return REVERSE[`${guideSlug}#${phaseNo}`] ?? null;
}
