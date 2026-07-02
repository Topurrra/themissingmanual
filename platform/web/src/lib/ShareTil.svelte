<script>
  export let guideSlug;
  export let phaseNo;

  let open = false;
  let copied = false;

  $: origin = typeof location !== 'undefined' ? location.origin : '';
  $: pageUrl = `${origin}/guides/${guideSlug}/${phaseNo}`;
  // Tagged so shares show up in Admin -> Analytics -> Traffic by source (source=til-card).
  $: tilUrl = `${pageUrl}?utm_source=til-card&utm_medium=social&utm_campaign=learn`;
  $: imgUrl = `/guides/${guideSlug}/${phaseNo}/til.png`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(tilUrl);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch (e) {}
  }
  function downloadImg() {
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = `${guideSlug}-${phaseNo}-til.png`;
    a.click();
  }
  function onKeydown(e) {
    if (e.key === 'Escape') open = false;
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="til">
  <button type="button" class="til-btn" on:click={() => (open = !open)} aria-haspopup="dialog" aria-expanded={open}>
    <i class="ti ti-share-2" aria-hidden="true"></i> Share what you learned
  </button>
  {#if open}
    <button type="button" class="til-backdrop" aria-label="Close" on:click={() => (open = false)}></button>
    <div class="til-pop" role="dialog" aria-label="Share this page">
      <img class="til-preview" src={imgUrl} alt="Shareable card for {guideSlug} phase {phaseNo}" loading="lazy" />
      <button type="button" class="til-action" on:click={copyLink}>
        <i class="ti {copied ? 'ti-check' : 'ti-link'}" aria-hidden="true"></i> {copied ? 'Copied' : 'Copy link'}
      </button>
      <button type="button" class="til-action" on:click={downloadImg}>
        <i class="ti ti-download" aria-hidden="true"></i> Download image
      </button>
    </div>
  {/if}
</div>

<style>
  .til { position: relative; margin: 1.6rem 0 0; }
  .til-btn {
    display: inline-flex; align-items: center; gap: 0.4rem; font: inherit; font-size: 0.85rem;
    color: var(--muted); background: none; border: 1px solid var(--line); border-radius: 999px;
    padding: 0.4rem 0.85rem; cursor: pointer;
  }
  .til-btn:hover { color: var(--accent); border-color: var(--accent); }
  .til-btn .ti { font-size: 15px; }
  .til-backdrop { position: fixed; inset: 0; z-index: 56; background: transparent; border: 0; cursor: default; }
  .til-pop {
    position: absolute; z-index: 57; top: calc(100% + 8px); left: 0; width: 300px;
    background: var(--raise); border: 1px solid var(--line); border-radius: 14px;
    box-shadow: var(--shadow-pop); padding: 0.7rem; display: flex; flex-direction: column; gap: 0.5rem;
  }
  .til-preview { width: 100%; border-radius: 8px; border: 1px solid var(--line); display: block; }
  .til-action {
    display: flex; align-items: center; gap: 0.5rem; font: inherit; font-size: 0.88rem;
    color: var(--ink); background: var(--surface); border: 1px solid var(--line); border-radius: 9px;
    padding: 0.5rem 0.7rem; cursor: pointer; text-align: left;
  }
  .til-action:hover { border-color: var(--accent); color: var(--accent); }
  .til-action .ti { font-size: 16px; }
</style>
