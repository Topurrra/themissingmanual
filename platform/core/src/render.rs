use std::collections::HashMap;
use std::io::{self, Write};
use std::sync::OnceLock;

use comrak::adapters::SyntaxHighlighterAdapter;
use comrak::{markdown_to_html_with_plugins, ComrakOptions, ComrakPlugins};
use syntect::html::{ClassStyle, ClassedHTMLGenerator};
use syntect::parsing::SyntaxSet;
use syntect::util::LinesWithEndings;

/// Token classes are emitted as `tok-…` so the frontend owns the palette via CSS
/// (the code-block background stays whatever the design system sets - we never bake colors in).
const CLASS_STYLE: ClassStyle = ClassStyle::SpacedPrefixed { prefix: "tok-" };

/// Highlights fenced code with syntect, emitting CSS *classes* (not inline colors).
struct ClassedHighlighter {
    syntaxes: SyntaxSet,
}

impl ClassedHighlighter {
    fn new() -> Self {
        Self {
            // NOT syntect's `load_defaults_newlines()`: that bundled set has no TypeScript,
            // Kotlin or Svelte, so those fences silently fell back to plain text (119
            // TypeScript blocks across 24 files, including every phase of
            // `typescript-from-zero`). two-face ships the extended, bat-derived set.
            // `extra_newlines` is required because we feed lines *with* their newline via
            // `parse_html_for_line_which_includes_newline` below.
            syntaxes: two_face::syntax::extra_newlines(),
        }
    }
}

impl SyntaxHighlighterAdapter for ClassedHighlighter {
    fn write_highlighted(
        &self,
        output: &mut dyn Write,
        lang: Option<&str>,
        code: &str,
    ) -> io::Result<()> {
        let syntax = lang
            .map(str::trim)
            .filter(|l| !l.is_empty())
            .and_then(|l| self.syntaxes.find_syntax_by_token(l))
            .unwrap_or_else(|| self.syntaxes.find_syntax_plain_text());
        let mut generator =
            ClassedHTMLGenerator::new_with_class_style(syntax, &self.syntaxes, CLASS_STYLE);
        for line in LinesWithEndings::from(code) {
            generator
                .parse_html_for_line_which_includes_newline(line)
                .map_err(|e| io::Error::new(io::ErrorKind::Other, e.to_string()))?;
        }
        output.write_all(generator.finalize().as_bytes())
    }

    fn write_pre_tag(
        &self,
        _output: &mut dyn Write,
        _attributes: HashMap<String, String>,
    ) -> io::Result<()> {
        // Intentionally emit nothing here. comrak surfaces a fence's extra info words (e.g. the
        // `runnable` flag in ```python runnable) only on the *code* attributes (`data-meta`),
        // which arrive in write_code_tag - after this call. So both the <pre> and <code> tags are
        // emitted there, where we can stamp data-runnable onto the <pre>. (Our render options set
        // no <pre> attributes, so nothing is lost by skipping them here.)
        Ok(())
    }

    fn write_code_tag(
        &self,
        output: &mut dyn Write,
        attributes: HashMap<String, String>,
    ) -> io::Result<()> {
        // Keep the language class (e.g. `language-rust`) so the frontend can still see the
        // language - and so ```mermaid blocks stay detectable for client-side rendering.
        let class = attributes.get("class").map(String::as_str).unwrap_or("");
        let lang = class.strip_prefix("language-").unwrap_or("");

        // A fence flagged `runnable` (```python runnable) becomes an in-browser runnable block:
        // the frontend mounts a WASM editor on any <pre data-runnable="<lang>">. comrak puts the
        // post-language info into `data-meta` (full_info_string is enabled in render_markdown).
        let runnable = attributes
            .get("data-meta")
            .is_some_and(|m| m.split_whitespace().any(|t| t == "runnable"))
            && !lang.is_empty()
            && lang.chars().all(|c| c.is_ascii_alphanumeric() || c == '+' || c == '-');

        if runnable {
            write!(output, "<pre data-runnable=\"{lang}\">")?;
        } else {
            output.write_all(b"<pre>")?;
        }

        if class.is_empty() {
            output.write_all(b"<code>")
        } else {
            write!(output, "<code class=\"{class}\">")
        }
    }
}

fn highlighter() -> &'static ClassedHighlighter {
    static HIGHLIGHTER: OnceLock<ClassedHighlighter> = OnceLock::new();
    HIGHLIGHTER.get_or_init(ClassedHighlighter::new)
}

/// Render CommonMark + GitHub-flavored Markdown to HTML, with syntax-highlighted code fences.
pub fn render_markdown(md: &str) -> String {
    let mut opts = ComrakOptions::default();
    opts.extension.table = true;
    opts.extension.strikethrough = true;
    opts.extension.autolink = true;
    // Stable ids on every heading: deep-linkable subsections, and lets AI/search
    // engines cite a specific section instead of the whole page.
    opts.extension.header_ids = Some(String::new());
    // Surface a fence's post-language info (e.g. `runnable`) so the highlighter can act on it.
    opts.render.full_info_string = true;

    let mut plugins = ComrakPlugins::default();
    plugins.render.codefence_syntax_highlighter = Some(highlighter());

    let html = markdown_to_html_with_plugins(md, &opts, &plugins);
    // Bake ```mermaid fences to themed SVG so the browser never loads mermaid.js.
    // The highlighter keeps the `language-mermaid` class above so inject can find the
    // block; a diagram that fails to render is left as its code block.
    crate::mermaid_ssr::inject_mermaid_svgs(html)
}

/// CSS for the `tok-`-prefixed highlight classes, generated from a dark syntect theme.
/// Code blocks are dark in both site themes, so one palette covers both. The frontend
/// includes this once; the code-block background keeps coming from the design system.
pub fn syntax_css() -> String {
    use syntect::highlighting::ThemeSet;
    let themes = ThemeSet::load_defaults();
    let theme = &themes.themes["base16-ocean.dark"];
    syntect::html::css_for_theme_with_class_style(theme, CLASS_STYLE).unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_headings_tables_and_highlights_code() {
        let md = "# Title\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n```rust\nfn main() {}\n```\n";
        let html = render_markdown(md);
        assert!(html.contains("<h1>"));
        assert!(html.contains("<table>"));
        assert!(
            html.contains("tok-"),
            "code fence should be highlighted with token classes: {html}"
        );
    }

    #[test]
    fn mermaid_fences_render_to_svg() {
        let html = render_markdown("```mermaid\nflowchart LR\n  A --> B\n```\n");
        assert!(html.contains("class=\"mmd-ssr\""), "mermaid renders to an SVG figure: {html}");
        assert!(html.contains("<svg"), "{html}");
        assert!(!html.contains("language-mermaid"), "raw fence is replaced: {html}");
    }

    #[test]
    fn syntax_css_is_non_empty_and_prefixed() {
        let css = syntax_css();
        assert!(css.contains(".tok-"), "expected tok- prefixed classes");
    }

    /// Distinct `tok-…` classes a fence produced, sorted - a fingerprint of how a
    /// language was highlighted.
    fn tok_classes(lang: &str, code: &str) -> Vec<String> {
        let html = render_markdown(&format!("```{lang}\n{code}\n```\n"));
        let mut found: Vec<String> = html
            .split("class=\"")
            .skip(1)
            .filter_map(|s| s.split('"').next())
            .flat_map(|c| c.split_whitespace())
            .filter(|c| c.starts_with("tok-"))
            .map(str::to_string)
            .collect();
        found.sort();
        found.dedup();
        found
    }

    /// syntect's bundled `load_defaults_newlines()` set has no TypeScript or Kotlin, so
    /// those fences silently rendered as plain text - on 119 TypeScript blocks across 24
    /// files, including every phase of `typescript-from-zero`. We now load an extended
    /// set (two-face). This test pins BOTH halves: the previously-missing languages must
    /// highlight, and the languages that already worked must keep producing token classes
    /// (the 7 themes are styled against these class names, so a silent scope rename would
    /// blank out code blocks site-wide).
    #[test]
    fn highlights_typescript_kotlin_and_keeps_existing_languages() {
        for (lang, code) in [
            ("typescript", "type A = { n: number };\nconst x: A = { n: 1 };"),
            ("ts", "const y: string = \"hi\";"),
            ("kotlin", "fun main() { val x = 1 }"),
        ] {
            let classes = tok_classes(lang, code);
            // The plain-text fallback still emits a `tok-text tok-plain` wrapper, so
            // "has tok- classes" is NOT enough - require real syntax scopes beyond it.
            let real: Vec<_> = classes
                .iter()
                .filter(|c| *c != "tok-text" && *c != "tok-plain")
                .collect();
            assert!(
                !real.is_empty(),
                "`{lang}` fell back to plain text (no syntax scopes): {classes:?}"
            );
        }

        // Regression guard for languages that already highlighted.
        for (lang, code) in [
            ("python", "def f(x):\n    return x + 1"),
            ("javascript", "const a = 1;"),
            ("rust", "fn main() {}"),
            ("sql", "SELECT 1;"),
        ] {
            let classes = tok_classes(lang, code);
            assert!(
                classes.iter().any(|c| c.starts_with("tok-keyword"))
                    || classes.len() > 1,
                "`{lang}` lost highlighting after the syntax-set swap: {classes:?}"
            );
        }
    }

    #[test]
    fn runnable_fence_gets_a_data_attribute() {
        let html = render_markdown("```python runnable\nprint(1)\n```\n");
        assert!(
            html.contains("<pre data-runnable=\"python\">"),
            "runnable fence should be marked for the editor: {html}"
        );
        assert!(html.contains("language-python"), "language class preserved: {html}");
    }

    #[test]
    fn plain_fence_is_not_runnable() {
        let html = render_markdown("```python\nprint(1)\n```\n");
        assert!(!html.contains("data-runnable"), "a plain fence stays static: {html}");
        assert!(html.contains("<pre><code class=\"language-python\">"), "{html}");
    }

    #[test]
    fn mermaid_fence_is_not_runnable() {
        let html = render_markdown("```mermaid\nflowchart LR\n  A --> B\n```\n");
        assert!(!html.contains("data-runnable"), "mermaid is not a runnable block: {html}");
    }
}

#[cfg(test)]
mod header_id_tests {
    #[test]
    fn headings_get_stable_ids() {
        let html = super::render_markdown("## Hello World\n\ntext\n\n### Sub Section Two\n");
        assert!(html.contains("id=\"hello-world\""), "h2 id missing: {html}");
        assert!(html.contains("id=\"sub-section-two\""), "h3 id missing: {html}");
    }
}
