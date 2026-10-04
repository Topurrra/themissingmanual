import { splitLocale } from '$lib/i18n/locales.js';

// Translated guide pages live at /<locale>/guides/... but render the same route
// files as English: map them onto /guides/... (the browser URL is unchanged, and
// hooks.server.js reads the locale from it into event.locals.lang).
export function reroute({ url }) {
  const { lang, path } = splitLocale(url.pathname);
  if (lang !== 'en' && path.startsWith('/guides/')) return path;
}
