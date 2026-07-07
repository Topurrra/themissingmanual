<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { TRACKS } from '$lib/lofi-tracks.js';
  import { RADIO_STATIONS } from '$lib/lofi-radio.js';
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
  const RADIO_TRACK_KEY = 'tmm-lofi-radio-track';
  const SHUFFLE_KEY = 'tmm-lofi-shuffle';
  const REPEAT_KEY = 'tmm-lofi-repeat';
  const MODE_KEY = 'tmm-lofi-mode';
  const VOL_STEP = 0.1;

  let audio; // bound <audio> element
  let open = false; // mobile "full player" sheet (the compact bar only shows play/prev/next below 640px)
  let playing = false;
  let volume = 0.6;
  let index = 0; // index into whichever list is active (loop tracks or radio stations)
  let ready = false; // mounted on client - gates rendering of stored state
  let shuffle = false;
  let repeat = 'none'; // 'none' | 'all' | 'one'
  let mode = 'loop'; // 'loop' (the track list below) | 'radio' (live streams)
  let radioErrorStreak = 0; // consecutive stream failures - caps the auto-skip retry loop
  let radioError = false; // every station failed - show a small inline note instead of retrying forever

  $: enabled = $lofiEnabled;
  $: isRadio = mode === 'radio';

  // Active playlist: prefer the admin-managed list from site config
  // (lofi_tracks - a JSON string of [{ title, artist, src }]); fall back to the
  // built-in TRACKS. Keep only well-formed entries (a non-empty `src`).
  $: loopList = (() => {
    try {
      const parsed = JSON.parse($page.data?.siteConfig?.lofi_tracks || '');
      if (Array.isArray(parsed)) {
        const clean = parsed.filter((t) => t && typeof t.src === 'string' && t.src.trim());
        if (clean.length) return clean;
      }
    } catch (e) {}
    return TRACKS;
  })();
  $: list = isRadio ? RADIO_STATIONS : loopList;
  $: hasTracks = list.length > 0;
  // Keep the index valid when the active list changes (e.g. admin shortens it,
  // or switching mode swaps in a differently-sized list).
  $: if (index >= list.length) index = 0;
  $: track = hasTracks ? list[index] : null;
  $: volPct = Math.round(volume * 100);

  onMount(() => {
    syncLofiEnabled();
    try {
      const v = parseFloat(localStorage.getItem(VOL_KEY));
      if (!Number.isNaN(v)) volume = Math.min(1, Math.max(0, v));
      if (localStorage.getItem(MODE_KEY) === 'radio') mode = 'radio';
      const t = parseInt(localStorage.getItem(mode === 'radio' ? RADIO_TRACK_KEY : TRACK_KEY), 10);
      if (!Number.isNaN(t) && t >= 0) index = t; // clamped by the `index >= list.length` guard above
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
    try { localStorage.setItem(isRadio ? RADIO_TRACK_KEY : TRACK_KEY, String(index)); } catch (e) {}
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
    // Radio has no "shuffle" concept - channel-surf sequentially regardless of
    // the loop-mode shuffle flag (the button that sets it is hidden in radio mode).
    if (shuffle && !isRadio) {
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
    if (shuffle && !isRadio) {
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
  // Switching modes stops playback (loop tracks and radio streams are
  // unrelated audio sources) and restores that mode's own remembered station/track.
  function toggleMode() {
    stop();
    const nextMode = isRadio ? 'loop' : 'radio';
    mode = nextMode;
    try { localStorage.setItem(MODE_KEY, mode); } catch (e) {}
    try {
      const t = parseInt(localStorage.getItem(nextMode === 'radio' ? RADIO_TRACK_KEY : TRACK_KEY), 10);
      index = !Number.isNaN(t) && t >= 0 ? t : 0;
    } catch (e) { index = 0; }
    radioErrorStreak = 0;
    radioError = false;
  }
  // A live stream can drop (network blip, station restart). Skip to the next
  // one automatically; if every station in the list fails, stop retrying and
  // say so instead of looping forever.
  function onAudioError() {
    if (!isRadio) return;
    radioErrorStreak++;
    if (radioErrorStreak > list.length) {
      playing = false;
      radioError = true;
      return;
    }
    playing = true; // force it - `pause` can fire alongside `error` before this runs
    next();
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
  function setVolume(pct) {
    volume = Math.min(1, Math.max(0, pct / 100));
    if (audio) audio.volume = volume;
    persistVol();
  }
  // Jump straight to a track/station from the mobile sheet's list, instead of
  // stepping through with next()/prev(). Tapping the already-playing one toggles it.
  function selectTrack(i) {
    if (i < 0 || i >= list.length) return;
    if (i === index) { toggle(); return; }
    index = i;
    persistTrack();
    requestAnimationFrame(play);
  }

  // The header has a backdrop-filter, which makes any position:fixed descendant
  // positioned relative to the HEADER (a containing block) instead of the viewport,
  // clipping the sheet. Portal it to <body> so fixed positioning works (same fix
  // as Appearance.svelte's settings drawer).
  function portal(node) {
    document.body.appendChild(node);
    return { destroy() { if (node.parentNode) node.parentNode.removeChild(node); } };
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
    // A live stream shouldn't fire `ended` at all - if it somehow does, treat
    // it as a hiccup and reconnect rather than applying loop-mode's repeat rules.
    if (isRadio) { playing = true; next(); return; }
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
    loop={!isRadio && repeat === 'one'}
    on:ended={onEnded}
    on:error={onAudioError}
    on:pause={() => (playing = false)}
    on:play={() => { playing = true; radioErrorStreak = 0; radioError = false; }}
  ></audio>
{/if}

{#if enabled && hasTracks}
  <div class="lofi-bar" role="group" aria-label="Lofi player">
    {#if !isRadio}
      <button class="lofi-ib lofi-adv" class:on={shuffle} on:click={toggleShuffle} aria-label="Shuffle" title="Shuffle">
        <i class="ti ti-arrows-shuffle" aria-hidden="true"></i>
      </button>
    {/if}
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
    {#if !isRadio}
      <button class="lofi-ib lofi-adv" class:on={repeat !== 'none'} on:click={cycleRepeat}
        aria-label={repeat === 'none' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}
        title={repeat === 'none' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}>
        <i class={`ti ${repeat === 'one' ? 'ti-repeat-once' : 'ti-repeat'}`} aria-hidden="true"></i>
      </button>
    {/if}
    <button class="lofi-ib lofi-adv" class:on={isRadio} on:click={toggleMode}
      aria-label={isRadio ? 'Switch to lofi loop' : 'Switch to live radio'}
      title={isRadio ? 'Lofi loop' : 'Live radio'}>
      <i class="ti ti-antenna" aria-hidden="true"></i>
    </button>
    <span class="lofi-bar-title" class:playing aria-live="polite" title={radioError ? 'Stations unavailable' : track.title}>
      <span class="lofi-ttl">{radioError ? 'Stations unavailable' : track.title}</span>
    </span>
    <button class="lofi-ib lofi-ib-sm lofi-adv" on:click={volDown} aria-label={`Volume down (${volPct}%)`} title={`Volume down (${volPct}%)`}>
      <i class="ti ti-minus" aria-hidden="true"></i>
    </button>
    <span class="lofi-vol-ico lofi-adv" aria-hidden="true"><i class="ti ti-volume"></i></span>
    <button class="lofi-ib lofi-ib-sm lofi-adv" on:click={volUp} aria-label={`Volume up (${volPct}%)`} title={`Volume up (${volPct}%)`}>
      <i class="ti ti-plus" aria-hidden="true"></i>
    </button>
    <button class="lofi-ib lofi-ib-sm lofi-more" on:click={() => (open = true)} aria-label="More player controls" aria-expanded={open} title="More controls">
      <i class="ti ti-dots" aria-hidden="true"></i>
    </button>
    <button class="lofi-ib lofi-ib-sm" on:click={quickHide} aria-label="Hide player" title="Hide player">
      <i class="ti ti-x" aria-hidden="true"></i>
    </button>
  </div>
{/if}

<!-- Mobile full player: the compact bar above only fits play/prev/next below 640px
     (shuffle, repeat, radio toggle, volume, and the title all get hidden there) -
     this sheet gives them a comfortable, full-size home instead of a cramped row. -->
{#if enabled && hasTracks && open}
  <div use:portal>
    <button class="lofi-scrim" tabindex="-1" aria-hidden="true" on:click={() => (open = false)}></button>
    <div class="lofi-sheet" role="dialog" aria-label="Lofi player">
      <div class="lofi-sheet-handle" aria-hidden="true"></div>
      <div class="lofi-sheet-head">
        <div class="lofi-sheet-ttl-wrap">
          <span class="lofi-sheet-ttl">{radioError ? 'Stations unavailable' : track.title}</span>
          {#if !radioError && track?.artist}<span class="lofi-sheet-artist">{track.artist}</span>{/if}
        </div>
        <button class="lofi-x" on:click={() => (open = false)} aria-label="Close"><i class="ti ti-x" aria-hidden="true"></i></button>
      </div>

      <div class="lofi-sheet-seg">
        <button class:on={!isRadio} on:click={() => isRadio && toggleMode()}><i class="ti ti-disc" aria-hidden="true"></i> Lofi loop</button>
        <button class:on={isRadio} on:click={() => !isRadio && toggleMode()}><i class="ti ti-antenna" aria-hidden="true"></i> Live radio</button>
      </div>

      <div class="lofi-sheet-transport">
        {#if !isRadio}
          <button class="lofi-ib" class:on={shuffle} on:click={toggleShuffle} aria-label="Shuffle" title="Shuffle">
            <i class="ti ti-arrows-shuffle" aria-hidden="true"></i>
          </button>
        {:else}<span class="lofi-sheet-spacer" aria-hidden="true"></span>{/if}
        <button class="lofi-ib" on:click={prev} aria-label="Previous track" title="Previous">
          <i class="ti ti-player-skip-back" aria-hidden="true"></i>
        </button>
        <button class="lofi-ib lofi-ib-play-lg" on:click={toggle} aria-label={playing ? 'Pause' : 'Play'} aria-pressed={playing} title={playing ? 'Pause' : 'Play'}>
          <i class={`ti ${playing ? 'ti-player-pause' : 'ti-player-play'}`} aria-hidden="true"></i>
        </button>
        <button class="lofi-ib" on:click={next} aria-label="Next track" title="Next">
          <i class="ti ti-player-skip-forward" aria-hidden="true"></i>
        </button>
        {#if !isRadio}
          <button class="lofi-ib" class:on={repeat !== 'none'} on:click={cycleRepeat}
            aria-label={repeat === 'none' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}
            title={repeat === 'none' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one'}>
            <i class={`ti ${repeat === 'one' ? 'ti-repeat-once' : 'ti-repeat'}`} aria-hidden="true"></i>
          </button>
        {:else}<span class="lofi-sheet-spacer" aria-hidden="true"></span>{/if}
      </div>

      <div class="lofi-sheet-vol">
        <i class="ti ti-volume-2" aria-hidden="true"></i>
        <input type="range" min="0" max="100" value={volPct} on:input={(e) => setVolume(Number(e.currentTarget.value))} aria-label="Volume" />
        <span class="lofi-sheet-volpct">{volPct}%</span>
      </div>

      <ul class="lofi-sheet-list">
        {#each list as t, i (t.src)}
          <li>
            <button class:on={i === index} on:click={() => selectTrack(i)}>
              {#if i === index}<i class="ti {playing ? 'ti-volume' : 'ti-player-play'}" aria-hidden="true"></i>{/if}
              <span class="lofi-sheet-list-ttl">{t.title}</span>
              {#if t.artist}<span class="lofi-sheet-list-artist">{t.artist}</span>{/if}
            </button>
          </li>
        {/each}
      </ul>
    </div>
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

  /* Below 640px the compact bar only has room for prev/play/next - shuffle,
     repeat, the radio toggle, volume, and the title all move into the sheet
     below instead of disappearing outright. */
  .lofi-more { display: none; }
  @media (max-width: 640px) {
    .lofi-adv { display: none; }
    .lofi-more { display: inline-grid; }
  }

  /* Mobile full player - a bottom sheet (the natural "now playing" pattern),
     not a cramped popover. Mirrors Appearance.svelte's settings-drawer sizing
     language (scrim + raised panel + shadow-pop) but slides up, not in from
     the side, since this is a player, not a settings list. */
  .lofi-scrim { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.32); border: 0; z-index: 70; opacity: 0; animation: lofi-scrim-in 0.2s var(--ease) forwards; cursor: default; }
  @keyframes lofi-scrim-in { to { opacity: 1; } }
  .lofi-sheet {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 71;
    max-width: 480px; margin: 0 auto;
    background: var(--raise); border: 1px solid var(--line); border-bottom: 0;
    border-radius: 18px 18px 0 0; box-shadow: var(--shadow-pop);
    padding: 0.6rem 1.2rem calc(1.3rem + env(safe-area-inset-bottom, 0px));
    max-height: 82vh; overflow-y: auto;
    transform: translateY(100%); animation: lofi-sheet-in 0.26s var(--ease-out) forwards;
  }
  @keyframes lofi-sheet-in { to { transform: translateY(0); } }
  @media (prefers-reduced-motion: reduce) { .lofi-scrim, .lofi-sheet { animation: none; opacity: 1; transform: none; } }
  .lofi-sheet-handle { width: 36px; height: 4px; border-radius: 999px; background: var(--line); margin: 0 auto 0.9rem; }
  .lofi-sheet-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.8rem; }
  .lofi-sheet-ttl-wrap { min-width: 0; }
  .lofi-sheet-ttl { display: block; font-family: var(--font-display); font-weight: 600; font-size: 1.05rem; color: var(--ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lofi-sheet-artist { display: block; font-size: 0.82rem; color: var(--faint); margin-top: 0.15rem; }
  .lofi-x { flex: none; background: none; border: 0; color: var(--faint); cursor: pointer; width: 32px; height: 32px; border-radius: 8px; display: inline-grid; place-items: center; }
  .lofi-x:hover { background: var(--surface); color: var(--ink); }
  .lofi-x .ti { font-size: 19px; }

  .lofi-sheet-seg { display: flex; gap: 4px; background: var(--surface); padding: 4px; border-radius: 10px; margin: 1rem 0; }
  .lofi-sheet-seg button { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; cursor: pointer; font: inherit; font-size: 0.85rem; color: var(--muted); border: 0; background: none; padding: 0.5rem 0.6rem; border-radius: 8px; }
  .lofi-sheet-seg button.on { background: var(--raise); color: var(--accent); box-shadow: var(--shadow-sm); font-weight: 500; }
  .lofi-sheet-seg .ti { font-size: 16px; }

  .lofi-sheet-transport { display: flex; align-items: center; justify-content: center; gap: 1.4rem; margin: 0.4rem 0 1.1rem; }
  .lofi-sheet-transport .lofi-ib { width: 44px; height: 44px; }
  .lofi-sheet-transport .lofi-ib .ti { font-size: 21px; }
  .lofi-sheet-spacer { width: 44px; height: 44px; }
  .lofi-ib-play-lg { width: 60px; height: 60px; background: var(--accent); color: #fff; }
  .lofi-ib-play-lg:hover { background: var(--accent-strong); color: #fff; }
  .lofi-ib-play-lg .ti { font-size: 26px; }

  .lofi-sheet-vol { display: flex; align-items: center; gap: 0.7rem; color: var(--faint); margin-bottom: 1.1rem; }
  .lofi-sheet-vol .ti { font-size: 17px; flex: none; }
  .lofi-sheet-vol input[type='range'] { flex: 1; accent-color: var(--accent); }
  .lofi-sheet-volpct { font-family: var(--font-mono); font-size: 0.75rem; width: 3ch; text-align: right; flex: none; }

  .lofi-sheet-list { list-style: none; margin: 0; padding: 0.2rem 0 0; border-top: 1px solid var(--line); }
  .lofi-sheet-list li + li { margin-top: 2px; }
  .lofi-sheet-list button {
    width: 100%; display: flex; align-items: center; gap: 0.55rem; text-align: left;
    cursor: pointer; font: inherit; font-size: 0.88rem; color: var(--body);
    border: 0; background: none; border-radius: 9px; padding: 0.6rem 0.5rem;
  }
  .lofi-sheet-list button:hover { background: var(--surface); }
  .lofi-sheet-list button.on { color: var(--accent); font-weight: 500; }
  .lofi-sheet-list button.on .ti { color: var(--accent); font-size: 15px; }
  .lofi-sheet-list-ttl { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lofi-sheet-list-artist { flex: none; font-size: 0.76rem; color: var(--faint); }
</style>
