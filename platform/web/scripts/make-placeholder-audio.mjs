// Generates the PLACEHOLDER lofi clips referenced by src/lib/lofi-tracks.js.
//
// These are self-generated soft sine-triad pads (no copyrighted material) so the
// lofi player is demonstrable out of the box. Run once:
//   node scripts/make-placeholder-audio.mjs
// Output: static/audio/placeholder-{1,2,3}.wav
//
// Replace these with your own licensed tracks (see static/audio/README.md).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'static', 'audio');

const SAMPLE_RATE = 22050; // small file size; plenty for a soft pad
const DURATION = 6; // seconds per clip

// A few gentle major/minor triads (frequencies in Hz).
const CLIPS = [
  { name: 'placeholder-1.wav', freqs: [261.63, 329.63, 392.0, 493.88] }, // Cmaj7
  { name: 'placeholder-2.wav', freqs: [220.0, 261.63, 329.63, 392.0] }, // Amin9-ish
  { name: 'placeholder-3.wav', freqs: [174.61, 220.0, 261.63, 329.63] } // Fmaj7
];

function makeWav(freqs) {
  const n = Math.floor(SAMPLE_RATE * DURATION);
  const data = Buffer.alloc(44 + n * 2);

  // WAV header (PCM, mono, 16-bit)
  data.write('RIFF', 0);
  data.writeUInt32LE(36 + n * 2, 4);
  data.write('WAVE', 8);
  data.write('fmt ', 12);
  data.writeUInt32LE(16, 16); // fmt chunk size
  data.writeUInt16LE(1, 20); // PCM
  data.writeUInt16LE(1, 22); // channels
  data.writeUInt32LE(SAMPLE_RATE, 24);
  data.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  data.writeUInt16LE(2, 32); // block align
  data.writeUInt16LE(16, 34); // bits per sample
  data.write('data', 36);
  data.writeUInt32LE(n * 2, 40);

  const fadeLen = Math.floor(SAMPLE_RATE * 0.5); // 0.5s fade in/out (soft)
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    let s = 0;
    for (const f of freqs) s += Math.sin(2 * Math.PI * f * t);
    s /= freqs.length;
    // soft amplitude envelope so it loops gently
    let env = 0.22;
    if (i < fadeLen) env *= i / fadeLen;
    else if (i > n - fadeLen) env *= (n - i) / fadeLen;
    const v = Math.max(-1, Math.min(1, s * env));
    data.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return data;
}

mkdirSync(OUT_DIR, { recursive: true });
for (const clip of CLIPS) {
  writeFileSync(join(OUT_DIR, clip.name), makeWav(clip.freqs));
  console.log('wrote', join('static', 'audio', clip.name));
}
