// Shared "Beginner mode" flag. When on, guide lists across the site are filtered
// to beginner-level content so a newcomer isn't shown intermediate/advanced
// material. Read + written by the Settings panel (Appearance.svelte) and read by
// the layout sidebar, category pages, and home. Persisted to localStorage.
//
// Default is OFF. The learning path / right rail are intentionally NOT filtered
// by this - they follow the level chosen in the path wizard.
import { writable } from 'svelte/store';

export const BEGINNER_KEY = 'tmm-beginner';

function read() {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(BEGINNER_KEY) === '1';
  } catch (e) {
    return false;
  }
}

export const beginnerMode = writable(read());

export function setBeginner(on) {
  beginnerMode.set(!!on);
  try {
    localStorage.setItem(BEGINNER_KEY, on ? '1' : '0');
    if (typeof document !== 'undefined') document.documentElement.dataset.beginner = on ? '1' : '';
  } catch (e) {}
}

export function syncBeginner() {
  beginnerMode.set(read());
}
