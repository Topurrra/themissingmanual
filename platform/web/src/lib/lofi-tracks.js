// Lofi player track manifest.
//
// The player reads this array — drop your own LICENSED audio files into
// `static/audio/` and edit this list. Each entry:
//   { title, artist, src, license }
//     title   — display name
//     artist  — display attribution
//     src     — absolute path under static/, e.g. '/audio/your-track.mp3'
//     license — short license + source note (shown to you, not the UI; keep it honest)
//
// LICENSING: only add tracks you have the right to use. Do NOT add copyrighted,
// YouTube, or "Lofi Girl" audio. See static/audio/README.md for how to add real
// tracks and where to find genuinely CC0 / public-domain music.
//
// The entries below point at self-generated PLACEHOLDER tones (soft sine triads)
// shipped only so the player is demonstrable. Replace them with your tracks.
export const TRACKS = [
  {
    title: 'Placeholder — Cmaj7 pad',
    artist: 'PLACEHOLDER — replace me',
    src: '/audio/placeholder-1.wav',
    license: 'Self-generated sine triad (scripts/make-placeholder-audio.mjs). No rights reserved — replace with your licensed track.'
  },
  {
    title: 'Placeholder — Amin9 pad',
    artist: 'PLACEHOLDER — replace me',
    src: '/audio/placeholder-2.wav',
    license: 'Self-generated sine triad (scripts/make-placeholder-audio.mjs). No rights reserved — replace with your licensed track.'
  },
  {
    title: 'Placeholder — Fmaj7 pad',
    artist: 'PLACEHOLDER — replace me',
    src: '/audio/placeholder-3.wav',
    license: 'Self-generated sine triad (scripts/make-placeholder-audio.mjs). No rights reserved — replace with your licensed track.'
  }
];
