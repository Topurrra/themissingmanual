<script>
  import { adminPut, adminUpload } from '$lib/admin.js';
  import { invalidateAll } from '$app/navigation';

  export let data;

  // A feature is ENABLED unless its stored value is explicitly one of these.
  // Empty / unset / "1" / "true" ⇒ enabled (default-on, so we don't regress the
  // live site). The public side uses the exact same rule.
  const OFF = ['0', 'false', 'off', 'no'];
  const isOn = (v) => !OFF.includes(String(v ?? '').trim().toLowerCase());

  // Client-side state seeded from the loaded settings.
  let siteName = data.site_name;
  let tagline = data.tagline;
  let announcement = data.announcement;
  let sponsors = data.sponsors;
  let social = data.social;
  let lofi = isOn(data.flag_lofi);
  let runnable = isOn(data.flag_runnable);
  let mermaid = isOn(data.flag_mermaid);

  // Lofi playlist — a JSON string of [{ title, artist, src }] stored under
  // lofi_tracks. Seed defensively: invalid/empty ⇒ [].
  let tracks = (() => {
    try {
      const parsed = JSON.parse(data.lofi_tracks || '');
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
    return [];
  })();
  let trackTitle = '';
  let trackArtist = '';
  let pendingFile = null; // { url, name } once an upload finishes
  let uploading = false;
  let uploadErr = '';
  let playlistMsg = '';
  let playlistErr = '';

  let saving = false;
  let ok = '';
  let err = '';
  let sponsorsErr = '';
  let socialErr = '';

  async function onAudioPick(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    uploadErr = '';
    uploading = true;
    pendingFile = null;
    try {
      const { url } = await adminUpload(file);
      pendingFile = { url, name: file.name };
      if (!trackTitle) trackTitle = file.name.replace(/\.[^.]+$/, '');
    } catch (e2) {
      uploadErr = e2.message || 'Upload failed';
    } finally {
      uploading = false;
    }
  }

  async function addTrack() {
    if (!pendingFile) return;
    tracks = [
      ...tracks,
      { title: (trackTitle || pendingFile.name).trim(), artist: trackArtist.trim(), src: pendingFile.url }
    ];
    trackTitle = '';
    trackArtist = '';
    pendingFile = null;
    await savePlaylist();
  }

  async function removeTrack(i) {
    tracks = tracks.filter((_, idx) => idx !== i);
    await savePlaylist();
  }

  // Persist ONLY the playlist immediately — so adding/removing a track is live
  // without hunting for "Save settings". invalidateAll re-fetches the public
  // site config so the header player swaps to the new list without a reload.
  async function savePlaylist() {
    playlistErr = '';
    playlistMsg = '';
    try {
      await adminPut('/settings', { lofi_tracks: JSON.stringify(tracks) });
      playlistMsg = 'Playlist saved';
      await invalidateAll();
    } catch (e) {
      playlistErr = e.message || 'Could not save the playlist';
    }
  }

  // The pristine snapshot, for the "unsaved changes" hint.
  const initial = JSON.stringify({
    siteName: data.site_name,
    tagline: data.tagline,
    announcement: data.announcement,
    sponsors: data.sponsors,
    social: data.social,
    lofi: isOn(data.flag_lofi),
    runnable: isOn(data.flag_runnable),
    mermaid: isOn(data.flag_mermaid)
  });
  $: dirty =
    JSON.stringify({ siteName, tagline, announcement, sponsors, social, lofi, runnable, mermaid }) !==
    initial;

  // Validate a JSON textarea: blank is allowed (means "use defaults" → send "").
  // Returns an error string, or "" when valid.
  function jsonError(raw) {
    if (String(raw ?? '').trim() === '') return '';
    try {
      JSON.parse(raw);
      return '';
    } catch (e) {
      return e.message;
    }
  }

  async function save() {
    ok = '';
    err = '';
    sponsorsErr = jsonError(sponsors);
    socialErr = jsonError(social);
    if (sponsorsErr || socialErr) {
      err = 'Fix the JSON errors below before saving.';
      return;
    }

    // Build the { key: value } map. Text as-is; flags as "1"/"0"; sponsors/social
    // as their JSON strings (blank ⇒ "" = use defaults).
    const map = {
      site_name: siteName,
      tagline,
      announcement,
      sponsors: String(sponsors ?? '').trim() === '' ? '' : sponsors,
      social: String(social ?? '').trim() === '' ? '' : social,
      flag_lofi: lofi ? '1' : '0',
      flag_runnable: runnable ? '1' : '0',
      flag_mermaid: mermaid ? '1' : '0',
      lofi_tracks: JSON.stringify(tracks)
    };

    saving = true;
    try {
      const res = await adminPut('/settings', map);
      ok = `Saved · ${res?.updated ?? 0} updated`;
    } catch (e) {
      err = e.message;
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head><title>Admin · Settings</title></svelte:head>

<div class="admin-head">
  <h1 class="admin-h1">Settings</h1>
  {#if dirty}<span class="set-dirty">Unsaved changes</span>{/if}
</div>

<form class="set-form" on:submit|preventDefault={save}>
  <section class="set-group">
    <h2 class="admin-h2">Identity</h2>

    <label class="admin-field set-field">
      <span>Site name</span>
      <input type="text" bind:value={siteName} />
    </label>

    <label class="admin-field set-field">
      <span>Tagline</span>
      <input type="text" bind:value={tagline} />
    </label>

    <label class="admin-field set-field">
      <span>Announcement</span>
      <textarea class="set-textarea" rows="2" bind:value={announcement}></textarea>
      <small class="set-hint">Shown as a banner sitewide when not empty.</small>
    </label>
  </section>

  <section class="set-group">
    <h2 class="admin-h2">Feature flags</h2>

    <label class="set-toggle">
      <input type="checkbox" bind:checked={lofi} />
      <span class="set-track" aria-hidden="true"></span>
      <span class="set-toggle-label">Lo-fi mode</span>
    </label>

    <label class="set-toggle">
      <input type="checkbox" bind:checked={runnable} />
      <span class="set-track" aria-hidden="true"></span>
      <span class="set-toggle-label">Runnable code blocks</span>
    </label>

    <label class="set-toggle">
      <input type="checkbox" bind:checked={mermaid} />
      <span class="set-track" aria-hidden="true"></span>
      <span class="set-toggle-label">Mermaid diagrams</span>
    </label>
  </section>

  <section class="set-group">
    <h2 class="admin-h2">Lofi music</h2>
    <p class="set-hint">Upload audio and build the lofi playlist. Adding or removing a track <strong>saves immediately</strong> — the header player updates live (no need to hit "Save settings").</p>

    <div class="lofi-add">
      <label class="admin-field set-field">
        <span>Audio file</span>
        <input type="file" accept="audio/*" on:change={onAudioPick} disabled={uploading} />
      </label>
      {#if uploading}<span class="set-hint">Uploading…</span>{/if}
      {#if uploadErr}<p class="admin-err set-jsonerr">{uploadErr}</p>{/if}
      {#if pendingFile}
        <p class="set-hint">Ready: <code>{pendingFile.name}</code></p>
      {/if}

      <label class="admin-field set-field">
        <span>Title</span>
        <input type="text" bind:value={trackTitle} placeholder="Track title" />
      </label>
      <label class="admin-field set-field">
        <span>Artist</span>
        <input type="text" bind:value={trackArtist} placeholder="Artist" />
      </label>

      <button type="button" class="admin-btn" on:click={addTrack} disabled={!pendingFile}>
        <i class="ti ti-plus" aria-hidden="true"></i> Add track
      </button>
    </div>

    {#if tracks.length}
      <ul class="lofi-list">
        {#each tracks as t, i}
          <li class="lofi-item">
            <div class="lofi-item-meta">
              <span class="lofi-item-title">{t.title || 'Untitled'}</span>
              {#if t.artist}<span class="lofi-item-artist">— {t.artist}</span>{/if}
            </div>
            <audio class="lofi-item-audio" controls preload="none" src={t.src}></audio>
            <button type="button" class="lofi-item-x" on:click={() => removeTrack(i)}
              aria-label="Remove track" title="Remove">
              <i class="ti ti-x" aria-hidden="true"></i>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="set-hint">No tracks yet — the player falls back to the built-in placeholders.</p>
    {/if}

    <div class="set-actions">
      <button type="button" class="admin-btn" on:click={savePlaylist}>
        <i class="ti ti-device-floppy" aria-hidden="true"></i> Save playlist
      </button>
      {#if playlistMsg}<span class="admin-note">{playlistMsg}</span>{/if}
      {#if playlistErr}<span class="admin-err">{playlistErr}</span>{/if}
    </div>
  </section>

  <section class="set-group">
    <h2 class="admin-h2">Sponsors &amp; social</h2>

    <label class="admin-field set-field">
      <span>Sponsors (JSON)</span>
      <textarea
        class="set-textarea set-code"
        class:set-invalid={sponsorsErr}
        rows="6"
        spellcheck="false"
        bind:value={sponsors}
        on:input={() => (sponsorsErr = '')}
      ></textarea>
      <small class="set-hint">JSON array — <code>[{'{'}"name","url","logo"{'}'}]</code>. Blank uses defaults.</small>
      {#if sponsorsErr}<p class="admin-err set-jsonerr">Sponsors: {sponsorsErr}</p>{/if}
    </label>

    <label class="admin-field set-field">
      <span>Social (JSON)</span>
      <textarea
        class="set-textarea set-code"
        class:set-invalid={socialErr}
        rows="5"
        spellcheck="false"
        bind:value={social}
        on:input={() => (socialErr = '')}
      ></textarea>
      <small class="set-hint">JSON object — <code>{'{'}"github","x","linkedin"{'}'}</code>. Blank uses defaults.</small>
      {#if socialErr}<p class="admin-err set-jsonerr">Social: {socialErr}</p>{/if}
    </label>
  </section>

  <div class="set-actions">
    <button type="submit" class="admin-btn primary" disabled={saving}>
      <i class="ti ti-device-floppy" aria-hidden="true"></i> {saving ? 'Saving…' : 'Save settings'}
    </button>
    {#if ok}<span class="admin-note">{ok}</span>{/if}
    {#if err}<span class="admin-err">{err}</span>{/if}
  </div>
</form>

<style>
  .set-form {
    max-width: 640px;
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
  .set-group {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }
  .set-group .admin-h2 {
    margin: 0;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--line);
  }
  .set-field input,
  .set-textarea {
    width: 100%;
  }
  .set-textarea {
    padding: 0.5rem 0.6rem;
    border: 1px solid var(--line);
    border-radius: 8px;
    font: inherit;
    font-size: 0.9rem;
    background: var(--bg);
    color: var(--ink);
    resize: vertical;
  }
  .set-code {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    line-height: 1.5;
  }
  .set-invalid {
    border-color: var(--danger);
  }
  .set-hint {
    color: var(--faint);
    font-size: 0.8rem;
  }
  .set-hint code {
    font-family: var(--font-mono);
    font-size: 0.78rem;
  }
  .set-jsonerr {
    margin: 0.1rem 0 0;
  }

  /* Lofi playlist editor */
  .lofi-add {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    align-items: flex-start;
    padding: 0.9rem 1rem;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--surface);
  }
  .lofi-add .set-field {
    width: 100%;
  }
  .lofi-add input[type='file'] {
    font-size: 0.85rem;
    color: var(--body);
  }
  .lofi-list {
    list-style: none;
    margin: 0.9rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .lofi-item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 0.5rem 0.7rem;
    border: 1px solid var(--line);
    border-radius: 9px;
    background: var(--bg);
  }
  .lofi-item-meta {
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.3rem;
  }
  .lofi-item-title {
    font-size: 0.92rem;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lofi-item-artist {
    font-size: 0.8rem;
    color: var(--faint);
  }
  .lofi-item-audio {
    flex: 0 0 auto;
    height: 30px;
    max-width: 220px;
  }
  .lofi-item-x {
    flex: none;
    background: none;
    border: 1px solid var(--line);
    color: var(--muted);
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: inline-grid;
    place-items: center;
    transition: background 0.15s var(--ease), color 0.15s var(--ease), border-color 0.15s var(--ease);
  }
  .lofi-item-x:hover {
    background: var(--surface);
    color: var(--danger);
    border-color: var(--danger);
  }
  .lofi-item-x .ti {
    font-size: 16px;
  }

  /* On/off switch */
  .set-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
  }
  .set-toggle input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }
  .set-track {
    position: relative;
    flex: 0 0 auto;
    width: 38px;
    height: 22px;
    border-radius: 999px;
    background: var(--line);
    transition: background 0.18s var(--ease, ease);
  }
  .set-track::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: var(--raise);
    box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.2));
    transition: transform 0.18s var(--ease, ease);
  }
  .set-toggle input:checked + .set-track {
    background: var(--accent);
  }
  .set-toggle input:checked + .set-track::after {
    transform: translateX(16px);
  }
  .set-toggle input:focus-visible + .set-track {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .set-toggle-label {
    font-size: 0.95rem;
    color: var(--body);
  }

  .set-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .set-dirty {
    font-family: var(--font-mono);
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }
</style>
