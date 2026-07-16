//! Renders ` ```mermaid ` fences to static SVG at markdown-render time, instead of
//! shipping mermaid.js to the browser.
//!
//! Theming: the engine bakes colors as hex, but it emits them as SVG *presentation
//! attributes* (`fill="…"`, `stroke="…"`), which CSS overrides through the normal
//! cascade. So we render each diagram ONCE with unmistakable **sentinel** colors,
//! then app.css `.mmd-ssr` remaps each sentinel to a live design token. Every site
//! theme (light/dark/sepia/nord/dracula/contrast, and any future one) themes the
//! diagram live — no per-theme baking, no JS, tokens stay in CSS. Keep this sentinel
//! map in sync with the app.css `.mmd-ssr` rules:
//!   node fill #ff00f1 · node border #ff00f2 · text #ff00f3 · edges/arrows #ff00f4
//!   subgraph fill #ff00f5 · subgraph border #ff00f6 · background transparent
//!
//! A diagram that fails to parse/render (or panics) is left as its raw ` ```mermaid `
//! code block, so the reader sees the source rather than a broken figure.
//!
//! erDiagram, sequenceDiagram, and gitGraph paint via an internal `<style>`/class
//! names or a few hardcoded colors; app.css `.mmd-ssr` remaps those classes too
//! (keeping gitGraph branches distinct). If a diagram shows raw magenta, that's an
//! unmapped sentinel (a loud, not silent, failure).

use std::panic::{catch_unwind, AssertUnwindSafe};
use std::sync::OnceLock;

use mermaid_to_svg::{render_mermaid_to_svg, MermaidTheme};
use regex::Regex;

/// The theme handed to the engine: each field is a sentinel color that app.css
/// remaps to a design token. `background` is transparent so the figure's themed
/// surface shows through.
fn sentinel_theme() -> MermaidTheme {
    MermaidTheme {
        background: "transparent".to_string(),
        node_fill: "#ff00f1".to_string(),
        node_stroke: "#ff00f2".to_string(),
        text_color: "#ff00f3".to_string(),
        edge_color: "#ff00f4".to_string(),
        subgraph_fill: "#ff00f5".to_string(),
        subgraph_stroke: "#ff00f6".to_string(),
    }
}

fn block_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r#"(?s)<pre><code class="language-mermaid">(.*?)</code></pre>"#).unwrap()
    })
}

fn tag_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"<[^>]*>").unwrap())
}

/// Replace each rendered ` ```mermaid ` code block with a sentinel-colored SVG
/// figure (app.css remaps the sentinels to live theme tokens). Blocks that fail are
/// left untouched (client-side fallback).
pub fn inject_mermaid_svgs(html: String) -> String {
    let re = block_re();
    if !re.is_match(&html) {
        return html;
    }
    let theme = sentinel_theme();
    re.replace_all(&html, |caps: &regex::Captures| {
        let source = decode_source(&caps[1]);
        match render_theme(&source, &theme) {
            Some(svg) => {
                format!("<figure class=\"mmd-ssr\" role=\"img\" aria-label=\"Diagram\">{svg}</figure>")
            }
            // Render failed: keep the original block for client-side fallback.
            None => caps[0].to_string(),
        }
    })
    .into_owned()
}

fn render_theme(source: &str, theme: &MermaidTheme) -> Option<String> {
    // catch_unwind guards an engine panic. It only unwinds in dev/debug builds; the
    // release profile is panic=abort, where this is a no-op and a panicking diagram
    // aborts the process. That's why this spike is meant to run under `cargo run`.
    match catch_unwind(AssertUnwindSafe(|| render_mermaid_to_svg(source, Some(theme)))) {
        Ok(Ok(svg)) => Some(svg),
        _ => None,
    }
}

/// The block's inner HTML is syntect-highlighted, entity-escaped text (possibly
/// wrapped in `<span>` tags). Strip tags and unescape to recover the raw diagram
/// source, exactly what the frontend's `code.textContent` does.
fn decode_source(inner: &str) -> String {
    tag_re()
        .replace_all(inner, "")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'")
        .replace("&amp;", "&") // must be last
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_diagram_becomes_sentinel_svg() {
        let html =
            r#"<pre><code class="language-mermaid">flowchart LR\n  A --&gt; B</code></pre>"#
                .replace("\\n", "\n");
        let out = inject_mermaid_svgs(html);
        assert!(out.contains(r#"<figure class="mmd-ssr""#), "{out}");
        assert_eq!(out.matches("<svg").count(), 1, "single svg: {out}");
        // Sentinel colors must survive verbatim so the CSS remap can find them.
        assert!(out.contains("#ff00f1"), "node-fill sentinel present: {out}");
        assert!(out.contains("#ff00f4"), "edge sentinel present: {out}");
        assert!(!out.contains("language-mermaid"), "block replaced: {out}");
    }

    #[test]
    fn invalid_diagram_is_left_as_fallback() {
        let html = r#"<pre><code class="language-mermaid">not a diagram</code></pre>"#.to_string();
        let out = inject_mermaid_svgs(html.clone());
        assert_eq!(out, html, "unrenderable block must stay for client fallback");
    }

    #[test]
    fn decode_reverses_entity_escaping() {
        assert_eq!(decode_source("A --&gt; B &amp; C"), "A --> B & C");
        assert_eq!(decode_source(r#"<span class="tok">x</span>&lt;y&gt;"#), "x<y>");
    }
}
