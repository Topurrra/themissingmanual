<script>
  import { adminPost, adminPatch, adminDelete } from '$lib/admin.js';
  import { invalidateAll } from '$app/navigation';
  export let data;
  $: ({ categories } = data);

  let msg = '';
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
    if (!confirm(`Delete category "${slug}"?`)) return;
    msg = '';
    try {
      await adminDelete(`/categories/${slug}`);
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
        <input bind:value={c.icon} placeholder="ti-icon" class="cat-icon-input" />
        <input bind:value={c.blurb} placeholder="Blurb" class="cat-blurb-input" />
      </div>
      <span class="cat-slug">{c.slug}</span>
      <button class="admin-btn sm" on:click={() => save(c)}>Save</button>
      <button class="admin-btn sm danger" on:click={() => del(c.slug)} aria-label="Delete"><i class="ti ti-trash" aria-hidden="true"></i></button>
    </div>
  {/each}
</div>

<h2 class="admin-h2">Add category</h2>
<div class="cat-row">
  <div class="cat-fields">
    <input bind:value={neu.slug} placeholder="slug" />
    <input bind:value={neu.name} placeholder="Name" />
    <input bind:value={neu.icon} placeholder="ti-icon" class="cat-icon-input" />
    <input bind:value={neu.blurb} placeholder="Blurb" class="cat-blurb-input" />
  </div>
  <button class="admin-btn sm" on:click={add}>Add</button>
</div>
