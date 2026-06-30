<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { TRACKS } from '$lib/lofi-tracks.js';
  import { lofiEnabled, setLofiEnabled, syncLofiEnabled } from '$lib/lofi-store.js';

  // Compact lofi player for the header. Mounted ONCE in the root layout (outside
  // any {#key}/page block) so the <audio> element and playback survive route
  // changes - navigating between guides never restarts the music.
  //
  // NEVER autoplays: default state is paused. Audio only starts on a Play press
  // (browsers block autoplay anyway). Enabled-state + volume + track persist in
  // localStorage under tmm-lofi-*.
  const VOL_KEY = 'tmm-lofi-volume';
  const TRACK_KEY = 'tmm-lofi-track';
  const SHUFFLE_KEY = 'tmm-lofi-shuffle';
  const REPEAT_KEY = 'tmm-lofi-repeat';
  const VOL_STEP = 0.1;

  let audio; // bound <audio> element
  let open = false; // transport popover open
  let playing = false;
  let volume = 0.6;
  let index = 0;
  let ready = false; // mounted on client - gates rendering of stored state
  let shuffle = false;
  let repeat = 'none'; // 'none' | 'all' | 'one'

  $: enabled = $lofiEnabled;

  // Active playlist: prefer the admin-managed list from site config
  // (lofi_tracks - a JSON string of [{ title, artist, src }]); fall back to the
  // built-in TRACKS. Keep only well-formed entries (a non-empty `src`).
  $: list = (() => {
    try {
      const parsed = JSON.parse($page.data?.siteConfig?.lofi_tracks || '');
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((t) => t && typeof t.src === 'string' && t.src.trim());
        if (clean.length) return clean;
      }
    } catch (e) {}
    return TRACKS;
  })();
  $: hasTracks = list.length > 0;
  // Keep the index valid when the active list changes (e.g. admin shortens it).
  $: if (index >= list.length) index = 0;
  $: track = hasTracks ? list[index] : null;
  $: volPct = Math.round(volume * 100);

  onMount(() => {
    syncLofiEnabled();
    try {
      const v = parseFloat(localStorage.getItem(VOL_KEY));
      if (!Number.isNaN(v)) volume = Math.min(1, Math.max(0, v));
      const t = parseInt(localStorage.getItem(TRACK_KEY), 10);
      if (!Number.isNaN(t) && t >= 0 && t < list.length) index = t;
      const s = localStorage.getItem(SHUFFLE_KEY);
      if (s === '1') shuffle = true;
      const r = localStorage.getItem(REPEAT_KEY);
      if (r === 'all' || r === 'one') repeat = r;
    } catch (e) {}
    if (audio) audio.volume = volume;
    ready = true;
  });

  // When master is switched off, stop and reset - audio must not keep playing.
  $: if (ready && !enabled && playing) stop();

  function persistVol() {
    try { localStorage.setItem(VOL_KEY, String(volume)); } catch (e) {}
  }
  function persistTrack() {
    try { localStorage.setItem(TRACK_KEY, String(index)); } catch (e) {}
  }
  function persistShuffle() {
    try { localStorage.setItem(SHUFFLE_KEY, shuffle ? '1' : '0'); } catch (e) {}
  }
  function persistRepeat() {
    try { localStorage.setItem(REPEAT_KEY, repeat); } catch (e) {}
  }

  function play() {
    if (!audio || !hasTracks) return;
    audio.play().then(() => { playing = true; }).catch(() => { playing = false; });
  }
  function pause() {
    if (!audio) return;
    audio.pause();
    playing = false;
  }
  function stop() {
    if (!audio) return;
    audio.pause();
    playing = false;
  }
  function toggle() {
    playing ? pause() : play();
  }
  function next() {
    if (!hasTracks) return;
    if (shuffle) {
      let nextIndex;
      do {
        nextIndex = Math.floor(Math.random() * list.length);
      } while (nextIndex === index && list.length > 1);
      index = nextIndex;
    } else {
      index = (index + 1) % list.length;
    }
    persistTrack();
    if (playing) requestAnimationFrame(play);
  }
  function prev() {
    if (!hasTracks) return;
    if (shuffle) {
      let prevIndex;
      do {
        prevIndex = Math.floor(Math.random() * list.length);
      } while (prevIndex === index && list.length > 1);
      index = prevIndex;
    } else {
      index = (index - 1 + list.length) % list.length;
    }
    persistTrack();
    if (playing) requestAnimationFrame(play);
  }
  function toggleShuffle() {
    shuffle = !shuffle;
    persistShuffle();
  }
  function cycleRepeat() {
    if (repeat === 'none') repeat = 'all';
    else if (repeat === 'all') repeat = 'one';
    else repeat = 'none';
    persistRepeat();
  }
  function volUp() {
    volume = Math.min(1, Math.round((volume + VOL_STEP) * 100) / 100);
    if (audio) audio.volume = volume;
    persistVol();
  }
  function volDown() {
    volume = Math.max(0, Math.round((volume - VOL_STEP) * 100) / 100);
    if (audio) audio.volume = volume;
    persistVol();
  }

  // Quick-hide (✕ on the widget): a fast dismiss without opening Settings. Same
  // effect as the master toggle - stops audio and removes the widget. Persisted,
  // so reopening it lives in Settings → Lofi player.
  function quickHide() {
    stop();
    open = false;
    setLofiEnabled(false);
  }

  function onEnded() {
    // repeat-one is handled natively by the <audio loop> attribute, so `ended`
    // doesn't even fire in that mode. Here we only auto-advance.
    if (repeat === 'all' || index < list.length - 1) {
      // A natural end can fire `pause` (flipping `playing` false) before `ended`;
      // we're advancing, so force the play flag so next() actually starts the track.
      playing = true;
      next();
    } else {
      playing = false; // repeat: none and on the last track - stop.
    }
  }
  function onKeydown(e) {
    if (e.key === 'Escape') open = false;
  }
</script>

<svelte:window on:keydown={onKeydown} />

<!-- The <audio> element persists for the life of the layout. Never autoplay. -->
{#if enabled && hasTracks}
  <audio
    bind:this={audio}
    src={track.src}
    preload="none"
    loop={repeat === 'one'}
    on:ended={onEnded}
    on:pause={() => (playing = false)}
    on:play={() => (playing = true)}
  ></audio>
{/if}

{#if enabled && hasTracks}
  <div class="lofi-bar" role="group" aria-label="Lofi player">
    <button class="lofi-ib lofi-adv" class:on={shuffle} on:click={toggleShuffle} aria-label="Shuffle" title="Shuffle">
      <i class="ti ti-arrows-shuffle" aria-hidden="true"></i>
    </button>
    <button class="lofi-ib" on:click={prev} aria-label="Previous track" title="Previous">
      <i class="ti ti-player-skip-back" aria-hidden="true"></i>
    </button>
    <button class="lofi-ib lofi-ib-play" on:click={toggle}
      aria-label={playing ? 'Pause' : 'Play'} aria-pressed={playing} title={playing ? 'Pause' : 'Play'}>
      <i class={`ti ${playing ? 'ti-player-pause' : 'ti-player-play'}`} aria-hidden="true"></i>
    </button>
    <button class="lofi-ib" on:click={next} aria-label="Next track" title="Next">
      <i class="ti ti-player-skip-forward" aria-hidden="true"></i>
    </button>
    <button class="lofi-ib lofi-adv" class:on={repeat !== 'none'} on:click={cycleRepeat}
      aria-label={repeat === 'none' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}
      title={repeat === 'none' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}>
      <i class={`ti ${repeat === 'one' ? 'ti-repeat-once' : 'ti-repeat'}`} aria-hidden="true"></i>
    </button>
    <span class="lofi-bar-title" class:playing aria-live="polite" title={track.title}><span class="lofi-ttl">{track.title}</span></span>
    <button class="lofi-ib lofi-ib-sm lofi-adv" on:click={volDown} aria-label={`Volume down (${volPct}%)`} title={`Volume down (${volPct}%)`}>
      <i class="ti ti-minus" aria-hidden="true"></i>
    </button>
    <span class="lofi-vol-ico lofi-adv" aria-hidden="true"><i class="ti ti-volume"></i></span>
    <button class="lofi-ib lofi-ib-sm lofi-adv" on:click={volUp} aria-label={`Volume up (${volPct}%)`} title={`Volume up (${volPct}%)`}>
      <i class="ti ti-plus" aria-hidden="true"></i>
    </button>
    <button class="lofi-ib lofi-ib-sm" on:click={quickHide} aria-label="Hide player" title="Hide player">
      <i class="ti ti-x" aria-hidden="true"></i>
    </button>
  </div>
{/if}

<style>
  /* Inline lofi player in the header - namespaced (.lofi-*), uses global tokens. */
  .lofi-bar {
    display: inline-flex; align-items: center; gap: 1px;
    padding: 2px 4px; border: 1px solid var(--line); border-radius: 999px; background: var(--raise);
  }
  .lofi-ib {
    background: none; border: 0; color: var(--muted); cursor: pointer;
    width: 30px; height: 30px; border-radius: 999px; display: inline-grid; place-items: center;
    transition: background 0.15s var(--ease), color 0.15s var(--ease);
  }
  .lofi-ib:hover { background: var(--surface); color: var(--ink); }
  .lofi-ib.on { color: var(--accent); }
  .lofi-ib .ti { font-size: 17px; }
  .lofi-ib-sm { width: 28px; height: 28px; }
  .lofi-ib-sm .ti { font-size: 15px; }
  .lofi-ib-play { color: var(--accent); }
  .lofi-ib-play .ti { font-size: 21px; }
  .lofi-vol-ico { display: inline-grid; place-items: center; color: var(--faint); width: 16px; }
  .lofi-vol-ico .ti { font-size: 14px; }
  .lofi-bar-title {
    font-size: 0.8rem; color: var(--ink); max-width: 140px;
    overflow: hidden; white-space: nowrap; padding: 0 0.45rem;
  }
  .lofi-bar-title .lofi-ttl {
    display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; vertical-align: bottom;
  }
  /* Scroll the title only while playing, and only if it actually overflows:
     min(0px, …) clamps short titles to no movement. */
  .lofi-bar-title.playing .lofi-ttl {
    max-width: none; overflow: visible; text-overflow: clip;
    animation: lofi-marquee 9s linear infinite alternate;
  }
  @keyframes lofi-marquee {
    from { transform: translateX(0); }
    to { transform: translateX(min(0px, calc(120px - 100%))); }
  }
  @media (prefers-reduced-motion: reduce) { .lofi-bar-title.playing .lofi-ttl { animation: none; } }
  @media (max-width: 1000px) { .lofi-bar-title { display: none; } }
  @media (max-width: 640px) { .lofi-adv { display: none; } }
</style>
