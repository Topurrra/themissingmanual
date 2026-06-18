<script>
  import { adminGet, adminPatch, adminPost, adminDelete, adminUpload, adminPreview } from '$lib/admin.js';
  import { invalidateAll } from '$app/navigation';

  export let data;
  $: ({ guide, phases, categories } = data);

  // ---- metadata ----
  let meta = { ...data.guide };
  let lastSlug = data.guide.slug;
  $: if (data.guide.slug !== lastSlug) {
    meta = { ...data.guide };
    lastSlug = data.guide.slug;
    current = null;
    previewHtml = '';
  }
  let metaMsg = '';
  async function saveMeta() {
    metaMsg = 'Saving…';
    try {
      await adminPatch(`/guides/${guide.slug}`, {
        title: meta.title,
        summary: meta.summary,
        category: meta.category,
        difficulty: meta.difficulty,
        status: meta.status
      });
      metaMsg = 'Saved';
      await invalidateAll();
    } catch (e) {
      metaMsg = e.message;
    }
  }
  async function togglePublish() {
    meta.status = meta.status === 'published' ? 'draft' : 'published';
    await saveMeta();
  }

  // ---- phases ----
  let current = null; // { phase_no, title, summary, markdown }
  let previewHtml = '';
  let phaseMsg = '';
  let ta;
  let previewTimer;

  async function openPhase(no) {
    const p = await adminGet(`/guides/${guide.slug}/phases/${no}`);
    current = { phase_no: p.phase_no, title: p.title, summary: p.summary, markdown: p.markdown };
    phaseMsg = '';
    schedulePreview();
  }
  async function addPhase() {
    const r = await adminPost(`/guides/${guide.slug}/phases`, {
      title: 'New phase',
      summary: '',
      markdown: '## New phase\n\nWrite here.'
    });
    await invalidateAll();
    await openPhase(r.phase_no);
  }
  async function savePhase() {
    if (!current) return;
    phaseMsg = 'Saving…';
    try {
      await adminPatch(`/guides/${guide.slug}/phases/${current.phase_no}`, {
        title: current.title,
        summary: current.summary,
        markdown: current.markdown
      });
      phaseMsg = 'Saved';
      await invalidateAll();
    } catch (e) {
      phaseMsg = e.message;
    }
  }
  async function removePhase(no) {
    if (!confirm('Delete this phase?')) return;
    await adminDelete(`/guides/${guide.slug}/phases/${no}`);
    if (current && current.phase_no === no) current = null;
    await invalidateAll();
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(async () => {
      if (!current) {
        previewHtml = '';
        return;
      }
      try {
        const r = await adminPreview(current.markdown);
        previewHtml = r.html;
      } catch {
        previewHtml = '';
      }
    }, 250);
  }

  function setMarkdown(next) {
    current = { ...current, markdown: next };
    schedulePreview();
  }
  function surround(before, after = before) {
    if (!current) return;
    const el = ta;
    const v = current.markdown;
    if (!el) return setMarkdown(v + before + after);
    const s = el.selectionStart;
    const e = el.selectionEnd;
    setMarkdown(v.slice(0, s) + before + v.slice(s, e) + after + v.slice(e));
  }
  function insert(text) {
    if (!current) return;
    const el = ta;
    const v = current.markdown;
    const s = el ? el.selectionStart : v.length;
    setMarkdown(v.slice(0, s) + text + v.slice(s));
  }
  async function uploadAndInsert(file) {
    if (!file) return;
    try {
      const { url } = await adminUpload(file);
      insert(`\n![](${url})\n`);
    } catch (e) {
      phaseMsg = e.message;
    }
  }
  async function onDrop(e) {
    e.preventDefault();
    await uploadAndInsert(e.dataTransfer?.files?.[0]);
  }
  async function onPaste(e) {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    if (!item) return;
    e.preventDefault();
    await uploadAndInsert(item.getAsFile());
  }
</script>

<svelte:head><title>Admin · {guide.title}</title></svelte:head>

<div class="ed-top">
  <a href="/admin/content" class="ed-back"><i class="ti ti-arrow-left" aria-hidden="true"></i> Content</a>
  <span class="ed-title">{guide.title}</span>
  <span class={`badge ${meta.status}`}>{meta.status}</span>
  <span class="ed-actions">
    <span class="ed-msg">{metaMsg}</span>
    <button class="admin-btn sm" on:click={saveMeta}>Save</button>
    <button class="admin-btn sm primary" on:click={togglePublish}>
      {meta.status === 'published' ? 'Unpublish' : 'Publish'}
    </button>
  </span>
</div>

<div class="ed-meta">
  <input class="ed-titlefield" bind:value={meta.title} placeholder="Title" />
  <input bind:value={meta.summary} placeholder="One-line summary" />
  <div class="ed-meta-row">
    <label>Category
      <select bind:value={meta.category}>
        {#each categories as c}<option value={c.slug}>{c.name}</option>{/each}
      </select>
    </label>
    <label>Difficulty
      <select bind:value={meta.difficulty}>
        <option value="beginner">Basic</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
    </label>
    <label>Status
      <select bind:value={meta.status}>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
    </label>
  </div>
</div>

<div class="ed-body">
  <aside class="ed-phases">
    <div class="ed-phases-head">Phases <button class="admin-btn sm" on:click={addPhase}><i class="ti ti-plus" aria-hidden="true"></i></button></div>
    <ul>
      {#each phases as p}
        <li>
          <button class="ed-phase" class:on={current && current.phase_no === p.phase_no} on:click={() => openPhase(p.phase_no)}>
            {p.phase_no === 0 ? 'Overview' : `${p.phase_no} · ${p.title}`}
          </button>
          <button class="ed-del" on:click={() => removePhase(p.phase_no)} aria-label="Delete phase"><i class="ti ti-x" aria-hidden="true"></i></button>
        </li>
      {:else}
        <li class="admin-empty">No phases yet.</li>
      {/each}
    </ul>
  </aside>

  <section class="ed-editor">
    {#if current}
      <div class="ed-phase-meta">
        <input bind:value={current.title} placeholder="Phase title" />
        <input bind:value={current.summary} placeholder="Phase summary" />
      </div>
      <div class="ed-toolbar">
        <button on:click={() => surround('**')} title="Bold" aria-label="Bold"><i class="ti ti-bold" aria-hidden="true"></i></button>
        <button on:click={() => surround('*')} title="Italic" aria-label="Italic"><i class="ti ti-italic" aria-hidden="true"></i></button>
        <button on:click={() => insert('\n## ')} title="Heading" aria-label="Heading"><i class="ti ti-heading" aria-hidden="true"></i></button>
        <button on:click={() => surround('`')} title="Inline code" aria-label="Inline code"><i class="ti ti-code" aria-hidden="true"></i></button>
        <button on:click={() => insert('\n```\n\n```\n')} title="Code block" aria-label="Code block"><i class="ti ti-code-dots" aria-hidden="true"></i></button>
        <button on:click={() => insert('\n- ')} title="List" aria-label="List"><i class="ti ti-list" aria-hidden="true"></i></button>
        <button on:click={() => surround('[', '](url)')} title="Link" aria-label="Link"><i class="ti ti-link" aria-hidden="true"></i></button>
        <span class="ed-tool-hint">drop or paste an image to upload</span>
        <span class="ed-msg">{phaseMsg}</span>
        <button class="admin-btn sm primary" on:click={savePhase}>Save phase</button>
      </div>
      <div class="ed-split">
        <textarea
          bind:this={ta}
          value={current.markdown}
          on:input={(e) => setMarkdown(e.currentTarget.value)}
          on:drop={onDrop}
          on:paste={onPaste}
          spellcheck="false"
          placeholder="Write Markdown…"
        ></textarea>
        <div class="ed-preview reader">{@html previewHtml}</div>
      </div>
    {:else}
      <p class="admin-empty ed-pick">Pick a phase on the left, or add one.</p>
    {/if}
  </section>
</div>
