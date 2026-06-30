# Lofi player audio

These files feed the header lofi player. The player reads
`src/lib/lofi-tracks.js`; the files referenced there live in this folder.

## What's shipped here right now

`placeholder-1.wav`, `placeholder-2.wav`, `placeholder-3.wav` are
**self-generated placeholder tones** - soft sine-triad pads, a few seconds each,
created by `scripts/make-placeholder-audio.mjs`. They contain **no copyrighted
material** and exist only so the player is demonstrable out of the box. They are
not "music" - replace them.

Regenerate them any time with:

```
node scripts/make-placeholder-audio.mjs
```

## How to add your own tracks

1. Drop your **licensed** audio files into this folder (`static/audio/`).
   `.mp3`, `.ogg`, `.wav`, `.m4a` all work in modern browsers (`.mp3`/`.m4a`
   are the safest cross-browser bet).
2. Edit `src/lib/lofi-tracks.js` - replace the placeholder entries with yours:

   ```js
   export const TRACKS = [
     {
       title: 'Track title',
       artist: 'Artist name',
       src: '/audio/your-file.mp3',   // path is relative to static/
       license: 'CC0 - sourced from <url> on <date>'
     }
   ];
   ```
3. Restart `npm run dev` (or rebuild) and the player picks them up.

If the list is empty, the player still loads - it just shows a "No tracks yet"
hint and disables the transport controls. No errors.

## Licensing rules - read before adding audio

- **Only add audio you have the right to use.** When in doubt, leave it out.
- **Do NOT** add copyrighted tracks, audio ripped from YouTube, "Lofi Girl" /
  ChilledCow streams, or anything from random/unverified sources.
- If you ship a real file, it must be genuinely **CC0 / public-domain** (or a
  license you actually hold), and you must record the source + license in the
  `license` field of its manifest entry.

### Places to find genuinely free music

- **Free Music Archive** (filter to CC0 / CC-BY) - https://freemusicarchive.org/
- **ccMixter** - http://ccmixter.org/
- **Pixabay Music** (royalty-free; check each track's terms) - https://pixabay.com/music/
- **Public-domain / CC0 collections** on the Internet Archive - https://archive.org/

Always verify the specific track's license at the source before shipping it, and
keep attribution where the license requires it.
