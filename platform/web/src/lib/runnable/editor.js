// Lazy CodeMirror 6 factory.
//
// This module (and everything it imports from @codemirror/*) is only ever
// pulled in via dynamic import() from RunnableCode.svelte, so Vite code-splits
// the whole editor into lazy chunks that load only on pages with runnable
// blocks. Nothing here is in the main entry.
//
// We build a minimal-but-comfortable editor: history, bracket matching, the
// default keymap, line wrapping off (code scrolls), plus a theme that reads the
// site's design tokens so light/dark match the rest of the reader.

import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab
} from '@codemirror/commands';
import {
  syntaxHighlighting,
  HighlightStyle,
  bracketMatching,
  indentOnInput
} from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// JetBrains "Darcula"-style highlighting. The editor surface is always dark
// (--code-bg is dark in both site themes), so CM6's default light style left
// keywords (#708 etc.) nearly invisible — these are bright tokens tuned for a
// dark background: orange keywords, yellow functions, green strings, blue
// numbers, purple constants/fields, grey-italic comments.
const FG = '#a9b7c6';
const jetbrainsHighlightStyle = HighlightStyle.define([
  { tag: [t.keyword, t.modifier, t.controlKeyword, t.operatorKeyword, t.definitionKeyword, t.moduleKeyword], color: '#cc7832' },
  { tag: [t.bool, t.null, t.atom, t.self], color: '#cc7832' },
  { tag: [t.name, t.variableName, t.character, t.deleted], color: FG },
  { tag: [t.propertyName], color: '#9876aa' },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.definition(t.function(t.variableName))], color: '#ffc66d' },
  { tag: [t.labelName], color: FG },
  { tag: [t.constant(t.variableName), t.standard(t.name), t.color], color: '#9876aa' },
  { tag: [t.className, t.typeName, t.namespace], color: FG },
  { tag: [t.number, t.integer, t.float], color: '#6897bb' },
  { tag: [t.string, t.special(t.string), t.regexp, t.attributeValue], color: '#6a8759' },
  { tag: [t.escape], color: '#cc7832' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: '#808080', fontStyle: 'italic' },
  { tag: [t.docComment], color: '#629755', fontStyle: 'italic' },
  { tag: [t.meta, t.annotation], color: '#bbb529' },
  { tag: [t.operator, t.punctuation, t.separator, t.bracket, t.brace, t.paren], color: FG },
  { tag: [t.tagName], color: '#e8bf6a' },
  { tag: [t.attributeName], color: '#bababa' },
  { tag: [t.invalid], color: '#bc3f3c' },
  { tag: [t.heading], color: '#cc7832', fontWeight: 'bold' },
  { tag: [t.strong], fontWeight: 'bold' },
  { tag: [t.emphasis], fontStyle: 'italic' },
  { tag: [t.link, t.url], color: '#287bde', textDecoration: 'underline' }
]);

// Read a computed design token off :root, with a fallback.
function token(name, fallback) {
  if (typeof window === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// A CM theme wired to our tokens. Recomputed when we (re)create the editor and
// on theme flips, so the editor surface always matches --code-bg + friends.
function themeExtension() {
  const bg = token('--code-bg', '#16161a');
  const fg = token('--code-fg', '#e6e6ea');
  const accent = token('--accent', '#0e7c86');
  const line = token('--line', '#2a2a30');
  const faint = token('--faint', '#6e6e76');
  const mono = token(
    '--font-mono',
    '"JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace'
  );
  return EditorView.theme({
    '&': {
      color: fg,
      backgroundColor: bg,
      fontSize: '0.86rem',
      borderRadius: '10px'
    },
    '.cm-content': {
      fontFamily: mono,
      caretColor: accent,
      padding: '0.9rem 0'
    },
    '.cm-scroller': { fontFamily: mono, lineHeight: '1.65' },
    '&.cm-focused': { outline: 'none' },
    '.cm-gutters': {
      backgroundColor: bg,
      color: faint,
      border: 'none'
    },
    '.cm-activeLine': { backgroundColor: 'transparent' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: accent },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: accent },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'color-mix(in srgb, ' + accent + ' 28%, transparent)'
    },
    '.cm-matchingBracket': {
      outline: '1px solid ' + accent,
      backgroundColor: 'transparent'
    }
  });
}

// Compartments let us swap the language mode + theme without rebuilding state.
export function createEditor({ parent, doc, langExtension }) {
  const langCompartment = new Compartment();
  const themeCompartment = new Compartment();

  const state = EditorState.create({
    doc,
    extensions: [
      lineNumbers(),
      highlightActiveLine(),
      history(),
      indentOnInput(),
      bracketMatching(),
      syntaxHighlighting(jetbrainsHighlightStyle, { fallback: true }),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.contentAttributes.of({ 'aria-label': 'Code editor' }),
      langCompartment.of(langExtension ? [langExtension] : []),
      themeCompartment.of(themeExtension())
    ]
  });

  const view = new EditorView({ state, parent });

  return {
    view,
    getValue: () => view.state.doc.toString(),
    setValue: (text) => {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
    },
    setLanguage: (ext) => {
      view.dispatch({ effects: langCompartment.reconfigure(ext ? [ext] : []) });
    },
    refreshTheme: () => {
      view.dispatch({ effects: themeCompartment.reconfigure(themeExtension()) });
    },
    destroy: () => view.destroy()
  };
}
