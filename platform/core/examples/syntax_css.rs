//! Emits the CSS for the `tok-`-prefixed code-highlight classes.
//! Run: `cargo run -p content-core --example syntax_css > path/to/syntax-highlight.css`
fn main() {
    print!("{}", content_core::render::syntax_css());
}
