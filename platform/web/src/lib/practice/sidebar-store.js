// Shared collapsed/expanded flag for the practice rail (PracticeSidebar). The
// toggle button lives in the site header (+layout.svelte, same button that
// drives the reader sidebar's `collapsed`) while the rail itself is rendered
// inside PracticeIde/[module]/+page.svelte - a store lets the two stay in sync
// despite living in different parts of the tree. Same pattern as
// beginner-store.js (SSR-safe: always starts expanded, matching what the
// server renders with no localStorage; the real value is applied on mount).
//
// Unlike the main reader sidebar, this one does NOT persist a collapsed choice
// across navigation: every /practice/[module] or [module]/[phase] page should
// default to expanded (the lesson list is the primary way to move around
// practice), so PracticeSidebar's onMount always resets to expanded (or
// collapsed on mobile) rather than restoring a saved preference.
import { writable } from 'svelte/store';

export const practiceRailCollapsed = writable(false);

export function togglePracticeRail() {
  practiceRailCollapsed.update((v) => !v);
}

// Called from PracticeSidebar's onMount (it remounts fresh on every practice
// nav) - always resets to the default (expanded on desktop, collapsed on
// mobile) rather than trusting a value computed once for the whole app
// session or a stale saved preference.
export function syncPracticeRail() {
  if (typeof window === 'undefined') return;
  practiceRailCollapsed.set(window.innerWidth <= 900);
}
