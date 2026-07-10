import { writable } from 'svelte/store';

// Bumped whenever a lesson's done-state changes (PracticeIde persists `done: true`
// after a passing grade) so anything showing per-lesson progress - currently
// PracticeSidebar - knows to re-read localStorage instead of polling it.
export const progressBump = writable(0);
export function bumpProgress() {
  progressBump.update((n) => n + 1);
}
