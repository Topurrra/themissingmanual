<script>
  import { onMount } from 'svelte';

  // "Listen to this guide" - reads the current .reader content aloud with the
  // browser's SpeechSynthesis (no server, no cost). Reads block-by-block so it
  // can highlight what's being spoken and survive engine limits. Voice + speed
  // are user-selectable and persisted. Mounted inside the page's {#key} block.
  const VOICE_KEY = 'tmm-tts-voice';
  const RATE_KEY = 'tmm-tts-rate';

  let supported = false;
  let playing = false;
  let paused = false;
  let rate = 1;
  let idx = -1;
  let blocks = [];
  let voices = [];
  let voiceURI = '';
  let gen = 0; // invalidates in-flight utterances on stop/restart

  $: label = !playing ? 'Listen' : paused ? 'Resume' : 'Pause';

  // The browser's *default* voice is often the most robotic local one. We rank the
  // available voices so neural / "Natural" / online ones float to the top and the
  // best one is used unless the listener picks a specific voice.
  const NATURAL_RE = /natural|neural|online|enhanced|premium|wavenet|journey|siri/i;
  const GOOD_NAMES =
    /google|aria|jenny|guy|ryan|sonia|natasha|michelle|libby|samantha|daniel|karen|moira|serena|allison|ava|zoe|aaron|nathan/i;
  function isNatural(v) {
    // localService === false means the voice is served (usually a neural cloud voice).
    return NATURAL_RE.test(v.name) || v.localService === false;
  }
  function rankVoice(v) {
    let s = 0;
    if (NATURAL_RE.test(v.name)) s += 100;
    if (v.localService === false) s += 40;
    if (GOOD_NAMES.test(v.name)) s += 20;
    if (/^en[-_]?US/i.test(v.lang)) s += 6;
    else if (/^en[-_]?GB/i.test(v.lang)) s += 5;
    else if (/^en/i.test(v.lang)) s += 3;
    return s;
  }
  function loadVoices() {
    const all = window.speechSynthesis.getVoices() || [];
    const en = all.filter((v) => /^en/i.test(v.lang));
    voices = (en.length ? en : all).slice().sort((a, b) => rankVoice(b) - rankVoice(a));
  }
  // Empty selection ("Auto") resolves to the top-ranked (most natural) voice.
  function currentVoice() {
    return voices.find((v) => v.voiceURI === voiceURI) || voices[0] || null;
  }

  // Friendly short label, e.g. "Microsoft Zira - English (United States)" -> "Zira (US)".
  const REGION = { US: 'US', GB: 'UK', AU: 'AU', IN: 'IN', CA: 'CA', IE: 'IE', ZA: 'ZA', NZ: 'NZ' };
  function prettyVoice(v) {
    let n = v.name
      .replace(/\([^)]*\)/g, '')
      .replace(/Microsoft|Google|Apple|Desktop|Online|Natural|Enhanced|Premium/gi, '')
      .replace(/\benglish\b/gi, '')
      .replace(/[-–-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    let r = REGION[(v.lang.split('-')[1] || '').toUpperCase()] || '';
    if (!n) n = v.lang;
    if (n.toUpperCase() === r) r = '';
    return r ? `${n} (${r})` : n;
  }

  function collect() {
    const reader = document.querySelector('.reader');
    if (!reader) return;
    blocks = [...reader.querySelectorAll('p, h1, h2, h3, h4, li')]
      .filter((el) => !el.closest('pre, code, .phasenav') && el.textContent.trim().length > 1)
      .map((el) => ({ el, text: el.textContent.replace(/\s+/g, ' ').trim() }));
  }
  // Light cleanup so the engine reads abbreviations/symbols like a person, not literally.
  function normalize(t) {
    return t
      .replace(/\be\.g\.\s*/gi, 'for example, ')
      .replace(/\bi\.e\.\s*/gi, 'that is, ')
      .replace(/\betc\./gi, 'etcetera')
      .replace(/\bvs\.?\b/gi, 'versus')
      .replace(/\s*→\s*/g, ' to ')
      .replace(/\s*&\s*/g, ' and ');
  }
  function clearHighlight() {
    document.querySelectorAll('.tts-reading').forEach((el) => el.classList.remove('tts-reading'));
  }
  function highlight(i) {
    clearHighlight();
    const el = blocks[i] && blocks[i].el;
    if (el) { el.classList.add('tts-reading'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }
  function step(i, myGen) {
    if (myGen !== gen) return;
    if (i >= blocks.length) { stop(); return; }
    idx = i;
    highlight(i);
    const u = new SpeechSynthesisUtterance(normalize(blocks[i].text));
    u.rate = rate;
    u.pitch = 1;
    const v = currentVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'en-US'; }
    u.onend = () => { if (myGen === gen) step(i + 1, myGen); };
    u.onerror = () => { if (myGen === gen) step(i + 1, myGen); };
    window.speechSynthesis.speak(u);
  }
  function speakFrom(i) {
    const myGen = ++gen;
    window.speechSynthesis.cancel();
    setTimeout(() => step(i, myGen), 60); // defer: Chrome drops speak() right after cancel()
  }
  function play() {
    if (!blocks.length) collect();
    if (!blocks.length) return;
    playing = true; paused = false;
    speakFrom(idx >= 0 && idx < blocks.length ? idx : 0);
  }
  function pause() { window.speechSynthesis.pause(); paused = true; }
  function resume() { window.speechSynthesis.resume(); paused = false; }
  function toggle() { if (!playing) play(); else if (paused) resume(); else pause(); }
  function stop() {
    gen++;
    window.speechSynthesis.cancel();
    clearHighlight();
    playing = false; paused = false; idx = -1;
  }
  function onVoice() {
    try { localStorage.setItem(VOICE_KEY, voiceURI); } catch (e) {}
    if (playing && !paused) speakFrom(idx);
  }
  function onRate() {
    try { localStorage.setItem(RATE_KEY, String(rate)); } catch (e) {}
    if (playing && !paused) speakFrom(idx);
  }

  onMount(() => {
    supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (!supported) return;
    try {
      voiceURI = localStorage.getItem(VOICE_KEY) || '';
      const r = parseFloat(localStorage.getItem(RATE_KEY));
      if (r) rate = r;
    } catch (e) {}
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    if (!document.getElementById('tts-style')) {
      const st = document.createElement('style');
      st.id = 'tts-style';
      st.textContent = `.tts-reading { background: var(--accent-tint); border-radius: 5px;
        box-shadow: 0 0 0 5px var(--accent-tint); transition: background 0.2s ease; }`;
      document.head.appendChild(st);
    }
    return () => { stop(); if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null; };
  });
</script>

{#if supported}
  <div class="tts" class:active={playing}>
    <button class="tts-main" on:click={toggle} title={label} aria-label={label}>
      <i class={`ti ${playing && !paused ? 'ti-player-pause-filled' : 'ti-player-play-filled'}`} aria-hidden="true"></i>
      <span>{label}</span>
    </button>
    {#if voices.length}
      <select bind:value={voiceURI} on:change={onVoice} class="tts-sel tts-voice" aria-label="Voice" title="Voice">
        <option value="">Auto · best voice</option>
        {#each voices as v}
          <option value={v.voiceURI}>{isNatural(v) ? '✨ ' : ''}{prettyVoice(v)}</option>
        {/each}
      </select>
    {/if}
    {#if playing}
      <select bind:value={rate} on:change={onRate} class="tts-sel" aria-label="Reading speed" title="Speed">
        <option value={0.8}>0.8×</option>
        <option value={1}>1×</option>
        <option value={1.25}>1.25×</option>
        <option value={1.5}>1.5×</option>
      </select>
      <button class="tts-stop" on:click={stop} title="Stop" aria-label="Stop">
        <i class="ti ti-x" aria-hidden="true"></i>
      </button>
    {/if}
  </div>
{/if}

<style>
  .tts {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
    width: fit-content; max-width: 100%; margin: 0 0 1.5rem;
    background: var(--raise); border: 1px solid var(--line); border-radius: 999px;
    padding: 4px;
  }
  .tts-main {
    display: inline-flex; align-items: center; gap: 0.45rem; cursor: pointer; flex: none;
    border: 0; background: none; color: var(--ink); font: inherit; font-size: 0.88rem; font-weight: 500;
    padding: 0.4rem 0.8rem; border-radius: 999px;
  }
  .tts-main:hover { background: var(--surface); }
  .tts-main .ti { font-size: 18px; color: var(--accent); }
  .tts.active .tts-main { background: var(--accent-tint); }
  .tts-sel {
    border: 1px solid var(--line); background: var(--bg); color: var(--body);
    font: inherit; font-size: 0.8rem; border-radius: 999px; padding: 0.25rem 0.5rem; cursor: pointer;
  }
  .tts-voice { max-width: 130px; }
  .tts-stop {
    display: inline-grid; place-items: center; cursor: pointer; flex: none;
    width: 30px; height: 30px; border-radius: 999px; border: 0; background: none; color: var(--muted);
  }
  .tts-stop:hover { background: var(--surface); color: var(--ink); }
  .tts-stop .ti { font-size: 17px; }
  @media (max-width: 600px) { .tts-main span { display: none; } .tts-voice { max-width: 92px; } }
</style>
