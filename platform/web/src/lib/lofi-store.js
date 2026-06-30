// Shared lofi-player state. Master enabled-flag lives here so both the header
// widget (LofiPlayer.svelte) and the Settings panel (Appearance.svelte) read and
// write the same source of truth. Persisted to localStorage under tmm-lofi-*.
//
// Default is OFF on a fresh visit - the player NEVER autoplays.
import { writable } from 'svelte/store';

export const LOFI_ENABLED_KEY = 'tmm-lofi-enabled';

function read() {
  if (typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(LOFI_ENABLED_KEY) === '1';
  } catch (e) {
    return false;
  }
}

export const lofiEnabled = writable(read());

export function setLofiEnabled(on) {
  lofiEnabled.set(!!on);
  try {
    localStorage.setItem(LOFI_ENABLED_KEY, on ? '1' : '0');
  } catch (e) {}
}

// Re-sync from storage (e.g. on mount, after the inline pre-paint script).
export function syncLofiEnabled() {
  lofiEnabled.set(read());
}
