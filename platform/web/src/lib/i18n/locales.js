// Registered guide-translation locales (mirror of platform/core/src/locales.rs).
// English is implicit ('en') and never listed. v1 localizes guide pages only:
// /<code>/guides/<slug>[/<phase>] - see hooks.js (reroute) and hooks.server.js.
export const LOCALES = [{ code: 'pt-br', hreflang: 'pt-BR', name: 'Português (Brasil)' }];

export const isLocale = (code) => LOCALES.some((l) => l.code === code);

// 'en' -> 'en', 'pt-br' -> 'pt-BR' (for <html lang>, hreflang, utterance.lang).
export const hreflangOf = (lang) => LOCALES.find((l) => l.code === lang)?.hreflang ?? 'en';

// '/pt-br/guides/x/2' -> { lang: 'pt-br', path: '/guides/x/2' }; anything else is English.
// Leading slashes/backslashes collapse to one so `path` is always same-origin
// ('/pt-br//evil.com' must not become a protocol-relative redirect).
export function splitLocale(pathname) {
  const m = pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/.*)?$/);
  if (m && isLocale(m[1])) return { lang: m[1], path: '/' + (m[2] || '').replace(/^[/\\]+/, '') };
  return { lang: 'en', path: pathname };
}

// The URL of an English path in `lang` ('/guides/x' -> '/pt-br/guides/x').
export const localePath = (lang, path) => (!lang || lang === 'en' ? path : `/${lang}${path}`);

// hreflang alternates for a guide/phase page (`path` is the English path): en, every
// locale it is published in, and x-default (= en). Empty when untranslated, so English
// pages without translations emit nothing new. Identical on every language version.
export function alternatesFor(origin, path, translations) {
  if (!translations?.length) return [];
  return [
    { hreflang: 'en', href: origin + path },
    ...translations.filter(isLocale).map((code) => ({ hreflang: hreflangOf(code), href: origin + localePath(code, path) })),
    { hreflang: 'x-default', href: origin + path }
  ];
}
