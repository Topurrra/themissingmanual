<script>
  import { adminPost, adminPatch, adminDelete } from '$lib/admin.js';
  import { invalidateAll } from '$app/navigation';
  export let data;
  $: ({ categories } = data);

  let msg = '';
  let confirmSlug = null; // category slug awaiting inline delete confirmation
  let neu = { slug: '', name: '', icon: 'ti-folder', blurb: '' };

  async function save(c) {
    msg = '';
    try {
      await adminPatch(`/categories/${c.slug}`, { name: c.name, icon: c.icon, blurb: c.blurb, sort_order: c.sort_order });
      msg = `Saved ${c.slug}`;
    } catch (e) {
      msg = e.message;
    }
  }
  async function add() {
    msg = '';
    try {
      await adminPost('/categories', { slug: neu.slug, name: neu.name, icon: neu.icon, blurb: neu.blurb });
      neu = { slug: '', name: '', icon: 'ti-folder', blurb: '' };
      await invalidateAll();
    } catch (e) {
      msg = e.message;
    }
  }
  async function del(slug) {
    msg = '';
    try {
      await adminDelete(`/categories/${slug}`);
      confirmSlug = null;
      await invalidateAll();
    } catch (e) {
      msg = e.message;
    }
  }
</script>

<svelte:head><title>Admin · Categories</title></svelte:head>

<h1 class="admin-h1">Categories</h1>
<p class="admin-sub">Topics that group your guides in the sidebar and on the homepage.</p>
{#if msg}<p class="admin-ok">{msg}</p>{/if}

<div class="cat-rows">
  {#each categories as c (c.slug)}
    <div class="cat-row">
      <i class={`ti ${c.icon}`} aria-hidden="true"></i>
      <div class="cat-fields">
        <input bind:value={c.name} placeholder="Name" />
        <input bind:value={c.icon} placeholder="ti-icon" class="cat-icon-input" list="ti-icons" />
        <input bind:value={c.blurb} placeholder="Blurb" class="cat-blurb-input" />
      </div>
      <span class="cat-slug">{c.slug}</span>
      <button class="admin-btn sm" on:click={() => save(c)}>Save</button>
      {#if confirmSlug === c.slug}
        <button class="admin-btn sm danger" on:click={() => del(c.slug)}>Delete?</button>
        <button class="admin-btn sm" on:click={() => (confirmSlug = null)}>Cancel</button>
      {:else}
        <button class="admin-btn sm danger" on:click={() => (confirmSlug = c.slug)} aria-label="Delete category"><i class="ti ti-trash" aria-hidden="true"></i></button>
      {/if}
    </div>
  {/each}
</div>

<h2 class="admin-h2">Add category</h2>
<div class="cat-row">
  <i class={`ti ${neu.icon || 'ti-folder'}`} aria-hidden="true"></i>
  <div class="cat-fields">
    <input bind:value={neu.slug} placeholder="slug" />
    <input bind:value={neu.name} placeholder="Name" />
    <input bind:value={neu.icon} placeholder="ti-icon" class="cat-icon-input" list="ti-icons" />
    <input bind:value={neu.blurb} placeholder="Blurb" class="cat-blurb-input" />
  </div>
  <button class="admin-btn sm" on:click={add}>Add</button>
</div>

<datalist id="ti-icons">
  {#each ['ti-folder', 'ti-code', 'ti-terminal-2', 'ti-database', 'ti-server', 'ti-network', 'ti-cpu', 'ti-brain', 'ti-shield', 'ti-cloud', 'ti-git-branch', 'ti-api', 'ti-bug', 'ti-test-pipe', 'ti-chart-bar', 'ti-book', 'ti-rocket', 'ti-settings', 'ti-lock', 'ti-world', 'ti-device-desktop', 'ti-stack-2', 'ti-binary', 'ti-math-symbols', 'ti-atom', 'ti-palette', 'ti-music', 'ti-robot', 'ti-key', 'ti-file-text'] as ic}
    <option value={ic}></option>
  {/each}
</datalist>
