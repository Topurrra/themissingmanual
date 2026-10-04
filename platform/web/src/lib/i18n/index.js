import en from './en.js';
import ptBr from './pt-br.js';

const CATALOGS = { en, 'pt-br': ptBr };

// t('pt-br', 'quiz.score', { correct: 2, total: 3 }) - unknown lang or missing key
// falls back to English; an unknown key returns the key itself.
export function t(lang, key, vars) {
  let s = CATALOGS[lang]?.[key] ?? en[key] ?? key;
  if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, String(vars[k]));
  return s;
}
