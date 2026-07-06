// Curated live internet-radio stations for the lofi player's "radio" mode.
// All SomaFM - independent, listener-supported, explicitly free to link/embed
// for non-commercial listening (see https://somafm.com/faq/). Picked for the
// same "background focus music" job as the lofi loop: ambient/instrumental,
// no vocals to compete with reading. Verified reachable (200, Icecast) as of
// 2026-07 - if a stream ever goes dark, the player's radioError fallback
// (LofiPlayer.svelte) skips to the next station automatically.
export const RADIO_STATIONS = [
  { title: 'Groove Salad', artist: 'SomaFM', src: 'https://ice1.somafm.com/groovesalad-128-mp3' },
  { title: 'Drone Zone', artist: 'SomaFM', src: 'https://ice1.somafm.com/dronezone-128-mp3' },
  { title: 'Deep Space One', artist: 'SomaFM', src: 'https://ice1.somafm.com/deepspaceone-128-mp3' },
  { title: 'Space Station Soma', artist: 'SomaFM', src: 'https://ice1.somafm.com/spacestation-128-mp3' }
];
