use std::collections::HashMap;
use std::io::{self, Write};
use std::sync::OnceLock;

use comrak::adapters::SyntaxHighlighterAdapter;
use comrak::{markdown_to_html_with_plugins, ComrakOptions, ComrakPlugins};
use syntect::html::{ClassStyle, ClassedHTMLGenerator};
use syntect::parsing::SyntaxSet;
use syntect::util::LinesWithEndings;

/// Token classes are emitted as `tok-…` so the frontend owns the palette via CSS
/// (the code-block background stays whatever the design system sets — we never bake colors in).
const CLASS_STYLE: ClassStyle = ClassStyle::SpacedPrefixed { prefix: "tok-" };

/// Highlights fenced code with syntect, emitting CSS *classes* (not inline colors).
struct ClassedHighlighter {
    syntaxes: SyntaxSet,
}

impl ClassedHighlighter {
    fn new() -> Self {
        Self {
            syntaxes: SyntaxSet::load_defaults_newlines(),
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
        // which arrive in write_code_tag — after this call. So both the <pre> and <code> tags are
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
        // language — and so ```mermaid blocks stay detectable for client-side rendering.
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
    // Surface a fence's post-language info (e.g. `runnable`) so the highlighter can act on it.
    opts.render.full_info_string = true;

    let mut plugins = ComrakPlugins::default();
    plugins.render.codefence_syntax_highlighter = Some(highlighter());

    markdown_to_html_with_plugins(md, &opts, &plugins)
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
    fn mermaid_fences_keep_their_language_class() {
        let html = render_markdown("```mermaid\nflowchart LR\n  A --> B\n```\n");
        assert!(
            html.contains("language-mermaid"),
            "mermaid blocks must stay detectable for the frontend: {html}"
        );
    }

    #[test]
    fn syntax_css_is_non_empty_and_prefixed() {
        let css = syntax_css();
        assert!(css.contains(".tok-"), "expected tok- prefixed classes");
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
