// Shared open/closed flag for the AI tutor drawer. The toggle button lives in
// the site header (+layout.svelte) while the drawer itself is a grid sibling
// inside .shell (TutorChat.svelte) - a store lets the two stay in sync despite
// living in different parts of the layout. Same pattern as beginner-store.js.
import { writable } from 'svelte/store';

export const tutorOpen = writable(false);
