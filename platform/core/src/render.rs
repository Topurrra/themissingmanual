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
        output: &mut dyn Write,
        _attributes: HashMap<String, String>,
    ) -> io::Result<()> {
        output.write_all(b"<pre>")
    }

    fn write_code_tag(
        &self,
        output: &mut dyn Write,
        attributes: HashMap<String, String>,
    ) -> io::Result<()> {
        // Keep the language class (e.g. `language-rust`) so the frontend can still see the
        // language — and so ```mermaid blocks stay detectable for client-side rendering.
        match attributes.get("class") {
            Some(class) => write!(output, "<code class=\"{class}\">"),
            None => output.write_all(b"<code>"),
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
}
