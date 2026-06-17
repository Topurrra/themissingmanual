<script>
  import { enhance } from '$app/forms';
  export let data;
  export let form;
  $: ({ guides, categories } = data);
  let showNew = false;
</script>

<svelte:head><title>Admin · Content</title></svelte:head>

<div class="admin-head">
  <h1 class="admin-h1">Content</h1>
  <button class="admin-btn" on:click={() => (showNew = !showNew)}><i class="ti ti-plus" aria-hidden="true"></i> New topic</button>
</div>

{#if showNew}
  <form method="POST" action="?/create" use:enhance class="new-topic">
    <input name="slug" placeholder="slug (e.g. docker-basics)" required />
    <input name="title" placeholder="Title" required />
    <select name="category">
      {#each categories as c}<option value={c.slug}>{c.name}</option>{/each}
    </select>
    <select name="difficulty">
      <option value="beginner">Basic</option>
      <option value="intermediate">Intermediate</option>
      <option value="advanced">Advanced</option>
    </select>
    <button type="submit">Create</button>
  </form>
  {#if form?.error}<p class="admin-err">{form.error}</p>{/if}
{/if}

<table class="admin-table">
  <thead><tr><th>Title</th><th>Category</th><th>Level</th><th>Status</th></tr></thead>
  <tbody>
    {#each guides as g}
      <tr>
        <td><a href={`/admin/content/${g.slug}`}>{g.title}</a></td>
        <td>{g.category}</td>
        <td>{g.difficulty}</td>
        <td><span class={`badge ${g.status}`}>{g.status}</span></td>
      </tr>
    {:else}
      <tr><td colspan="4" class="admin-empty">No topics yet.</td></tr>
    {/each}
  </tbody>
</table>
