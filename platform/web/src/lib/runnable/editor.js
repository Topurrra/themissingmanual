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
  defaultHighlightStyle,
  bracketMatching,
  indentOnInput
} from '@codemirror/language';

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
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
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
