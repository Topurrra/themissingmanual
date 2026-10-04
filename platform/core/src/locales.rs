//! Registry of guide-translation locales. English is implicit (code `en`) and never listed;
//! only locales registered here are ingested from `translations/<code>/` and served.
//! Mirrored on the web side by `platform/web/src/lib/i18n/locales.js` - keep them in sync.

use tantivy::tokenizer::Language;

pub struct Locale {
    /// URL / directory code, e.g. `pt-br` (`/pt-br/guides/...`, `translations/pt-br/...`).
    pub code: &'static str,
    /// BCP 47 tag for `<html lang>` and hreflang alternates.
    pub hreflang: &'static str,
    /// Native display name for the language switcher.
    pub name: &'static str,
    /// Stemmer for this locale's search index.
    pub stemmer: Language,
}

pub static LOCALES: &[Locale] = &[Locale {
    code: "pt-br",
    hreflang: "pt-BR",
    name: "Português (Brasil)",
    stemmer: Language::Portuguese,
}];

/// Look up a registered locale by code. `en` is not a registered locale.
pub fn find(code: &str) -> Option<&'static Locale> {
    LOCALES.iter().find(|l| l.code == code)
}
