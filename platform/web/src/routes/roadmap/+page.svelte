<script>
  import Seo from '$lib/Seo.svelte';
  import RoadmapMap from '$lib/RoadmapMap.svelte';
  import SkillGrid from '$lib/SkillGrid.svelte';
  import { exportSkillState, importSkillState } from '$lib/skillmap.js';

  export let data;
  $: ({ categories, guides } = data);

  let view = 'map';
  let fileInput;

  function download() {
    const blob = new Blob([JSON.stringify(exportSkillState(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'missing-manual-progress.json'; a.click();
    URL.revokeObjectURL(url);
  }
  function pickFile() { fileInput?.click(); }
  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      if (importSkillState(json)) location.reload();
    } catch (err) {}
  }
</script>

<Seo
  title="Roadmap - The Missing Manual"
  description="A map of every topic, and a skill dashboard built from what you've actually finished. No account - it's all stored on your device." />

<header class="rm-intro">
  <span class="eyebrow">Roadmap</span>
  <h1>Where you are, and what's next</h1>
  <p class="tagline">Every topic on the site, and how much of it you've actually worked through. Nothing here needs an account - it's built from progress already saved on this device.</p>
</header>

<div class="rm-bar">
  <div class="seg">
    <button class:on={view === 'map'} on:click={() => (view = 'map')}>Map</button>
    <button class:on={view === 'skills'} on:click={() => (view = 'skills')}>Skills</button>
  </div>
  <div class="rm-io">
    <button type="button" class="rm-io-btn" on:click={download}><i class="ti ti-download" aria-hidden="true"></i> Export progress</button>
    <button type="button" class="rm-io-btn" on:click={pickFile}><i class="ti ti-upload" aria-hidden="true"></i> Import</button>
    <input bind:this={fileInput} type="file" accept="application/json" on:change={onFile} style="display:none" />
  </div>
</div>

{#if view === 'map'}
  <RoadmapMap {categories} {guides} />
{:else}
  <SkillGrid {categories} {guides} />
{/if}

<style>
  .rm-intro { margin-bottom: 1.5rem; }
  .rm-intro h1 { margin: 0.5rem 0 0.6rem; }
  .rm-bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.6rem; }
  .rm-io { display: flex; gap: 0.5rem; }
  .rm-io-btn {
    display: inline-flex; align-items: center; gap: 0.4rem; font: inherit; font-size: 0.82rem;
    color: var(--muted); background: none; border: 1px solid var(--line); border-radius: 8px;
    padding: 0.4rem 0.7rem; cursor: pointer;
  }
  .rm-io-btn:hover { color: var(--ink); border-color: var(--faint); }
  .rm-io-btn .ti { font-size: 15px; }
</style>
