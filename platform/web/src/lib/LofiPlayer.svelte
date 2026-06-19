<script>
  import { onMount } from 'svelte';
  import { TRACKS } from '$lib/lofi-tracks.js';
  import { lofiEnabled, setLofiEnabled, syncLofiEnabled } from '$lib/lofi-store.js';

  // Compact lofi player for the header. Mounted ONCE in the root layout (outside
  // any {#key}/page block) so the <audio> element and playback survive route
  // changes — navigating between guides never restarts the music.
  //
  // NEVER autoplays: default state is paused. Audio only starts on a Play press
  // (browsers block autoplay anyway). Enabled-state + volume + track persist in
  // localStorage under tmm-lofi-*.
  const VOL_KEY = 'tmm-lofi-volume';
  const TRACK_KEY = 'tmm-lofi-track';
  const VOL_STEP = 0.1;

  const hasTracks = TRACKS.length > 0;

  let audio; // bound <audio> element
  let open = false; // transport popover open
  let playing = false;
  let volume = 0.6;
  let index = 0;
  let ready = false; // mounted on client — gates rendering of stored state

  $: enabled = $lofiEnabled;
  $: track = hasTracks ? TRACKS[index] : null;
  $: volPct = Math.round(volume * 100);

  onMount(() => {
    syncLofiEnabled();
    try {
      const v = parseFloat(localStorage.getItem(VOL_KEY));
      if (!Number.isNaN(v)) volume = Math.min(1, Math.max(0, v));
      const t = parseInt(localStorage.getItem(TRACK_KEY), 10);
      if (!Number.isNaN(t) && t >= 0 && t < TRACKS.length) index = t;
    } catch (e) {}
    if (audio) audio.volume = volume;
    ready = true;
  });

  // When master is switched off, stop and reset — audio must not keep playing.
  $: if (ready && !enabled && playing) stop();

  function persistVol() {
    try { localStorage.setItem(VOL_KEY, String(volume)); } catch (e) {}
  }
  function persistTrack() {
    try { localStorage.setItem(TRACK_KEY, String(index)); } catch (e) {}
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
    index = (index + 1) % TRACKS.length;
    persistTrack();
    if (playing) queueMicrotask(play);
  }
  function prev() {
    if (!hasTracks) return;
    index = (index - 1 + TRACKS.length) % TRACKS.length;
    persistTrack();
    if (playing) queueMicrotask(play);
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
  // effect as the master toggle — stops audio and removes the widget. Persisted,
  // so reopening it lives in Settings → Lofi player.
  function quickHide() {
    stop();
    open = false;
    setLofiEnabled(false);
  }

  function onEnded() {
    // Auto-advance through the playlist; loop back to the start.
    next();
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
    on:ended={onEnded}
    on:pause={() => (playing = false)}
    on:play={() => (playing = true)}
  ></audio>
{/if}

{#if enabled}
  <div class="lofi-wrap">
    <button
      class="icon-btn lofi-trigger"
      class:on={playing}
      on:click={() => (open = !open)}
      aria-label="Lofi player"
      aria-expanded={open}
      title="Lofi player"
    >
      <i class="ti ti-music" aria-hidden="true"></i>
      {#if playing}<span class="lofi-dot" aria-hidden="true"></span>{/if}
    </button>

    {#if open}
      <button class="pop-backdrop" tabindex="-1" aria-hidden="true" on:click={() => (open = false)}></button>
      <div class="settings-pop lofi-pop" role="dialog" aria-label="Lofi player">
        <div class="lofi-head">
          <p class="settings-label" style="margin:0">Lofi player</p>
          <button class="lofi-x" on:click={quickHide} aria-label="Hide player" title="Hide player">
            <i class="ti ti-x" aria-hidden="true"></i>
          </button>
        </div>

        {#if hasTracks}
          <div class="lofi-now" aria-live="polite">
            <span class="lofi-title">{track.title}</span>
            <span class="lofi-artist">{track.artist}</span>
          </div>

          <div class="lofi-transport">
            <button class="lofi-btn" on:click={prev} aria-label="Previous track" title="Previous">
              <i class="ti ti-player-skip-back" aria-hidden="true"></i>
            </button>
            <button class="lofi-btn lofi-play" on:click={toggle}
              aria-label={playing ? 'Pause' : 'Play'} aria-pressed={playing} title={playing ? 'Pause' : 'Play'}>
              <i class={`ti ${playing ? 'ti-player-pause' : 'ti-player-play'}`} aria-hidden="true"></i>
            </button>
            <button class="lofi-btn" on:click={next} aria-label="Next track" title="Next">
              <i class="ti ti-player-skip-forward" aria-hidden="true"></i>
            </button>
          </div>

          <div class="lofi-vol">
            <button class="lofi-btn lofi-btn-sm" on:click={volDown} aria-label="Volume down" title="Volume down">
              <i class="ti ti-volume-3" aria-hidden="true"></i>
            </button>
            <div class="lofi-meter" role="progressbar" aria-label="Volume"
              aria-valuemin="0" aria-valuemax="100" aria-valuenow={volPct}>
              <span class="lofi-meter-fill" style={`width:${volPct}%`}></span>
            </div>
            <button class="lofi-btn lofi-btn-sm" on:click={volUp} aria-label="Volume up" title="Volume up">
              <i class="ti ti-volume" aria-hidden="true"></i>
            </button>
          </div>
        {:else}
          <p class="lofi-empty">No tracks yet. Add licensed audio to <code>static/audio/</code> and edit <code>lofi-tracks.js</code>.</p>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Lofi player — namespaced (.lofi-*) so it can't collide with global classes.
     Reuses global tokens + the .icon-btn / .settings-pop / .pop-backdrop pattern. */
  .lofi-wrap { position: relative; display: inline-flex; }

  .lofi-trigger { position: relative; }
  .lofi-trigger.on { color: var(--accent); border-color: var(--accent); }
  .lofi-dot {
    position: absolute;
    top: 5px; right: 5px;
    width: 6px; height: 6px;
    border-radius: 999px;
    background: var(--accent);
    box-shadow: 0 0 0 2px var(--raise);
  }

  .lofi-pop { width: 232px; }
  .lofi-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.7rem; }
  .lofi-x {
    background: none; border: 0; color: var(--faint); cursor: pointer;
    width: 24px; height: 24px; border-radius: 7px; display: inline-grid; place-items: center;
    transition: background 0.15s var(--ease), color 0.15s var(--ease);
  }
  .lofi-x:hover { background: var(--surface); color: var(--ink); }
  .lofi-x .ti { font-size: 16px; }

  .lofi-now { display: flex; flex-direction: column; gap: 1px; margin-bottom: 0.8rem; min-height: 2.4em; }
  .lofi-title { font-size: 0.92rem; color: var(--ink); line-height: 1.25; }
  .lofi-artist { font-size: 0.74rem; color: var(--faint); line-height: 1.2; }

  .lofi-transport { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.7rem; }
  .lofi-vol { display: flex; align-items: center; gap: 0.5rem; }

  .lofi-btn {
    background: none;
    border: 1px solid var(--line);
    color: var(--muted);
    cursor: pointer;
    width: 36px; height: 36px;
    border-radius: 9px;
    display: inline-grid; place-items: center;
    transition: background 0.15s var(--ease), color 0.15s var(--ease), border-color 0.15s var(--ease);
  }
  .lofi-btn:hover { background: var(--surface); color: var(--ink); }
  .lofi-btn .ti { font-size: 18px; }
  .lofi-btn-sm { width: 30px; height: 30px; }
  .lofi-btn-sm .ti { font-size: 16px; }

  .lofi-play {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    width: 42px; height: 42px;
  }
  .lofi-play:hover { background: var(--accent-strong); border-color: var(--accent-strong); color: #fff; }
  .lofi-play .ti { font-size: 20px; }

  .lofi-meter {
    flex: 1;
    height: 6px;
    border-radius: 999px;
    background: var(--surface);
    overflow: hidden;
  }
  .lofi-meter-fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--accent);
    transition: width 0.12s var(--ease);
  }

  .lofi-empty { font-size: 0.8rem; color: var(--muted); line-height: 1.5; margin: 0.2rem 0 0; }
  .lofi-empty code {
    font-family: var(--font-mono); font-size: 0.86em;
    background: var(--surface); color: var(--accent-strong);
    padding: 1px 5px; border-radius: 5px;
  }

  /* Tight on phones: the music trigger stays a single 34px icon-button in the
     header (no inline strip), so it never crowds brand · search · settings. */
  @media (max-width: 560px) {
    .lofi-pop { width: 208px; }
  }
</style>
