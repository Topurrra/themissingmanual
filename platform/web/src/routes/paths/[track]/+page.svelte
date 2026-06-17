<script>
  export let data;
  $: ({ track, dimensions, roadmap, choices } = data);
</script>

<svelte:head><title>{track.name} — Learning path</title></svelte:head>

<h1>{track.name}</h1>
<p class="tagline">{track.blurb}</p>

{#if dimensions.length}
  <form method="GET" class="choice-form">
    {#each dimensions as d}
      <label>{d.label}
        <select name={d.id}>
          <option value="">Any</option>
          {#each d.options as o}
            <option value={o.value} selected={choices[d.id] === o.value}>{o.label}</option>
          {/each}
        </select>
      </label>
    {/each}
    <button type="submit">Build roadmap</button>
  </form>
{/if}

<ol class="roadmap">
  {#each roadmap as step, i}
    <li class="road-step">
      <span class="road-num">{i + 1}</span>
      <div class="road-body">
        <span class="road-cat">{step.category.replace(/-/g, ' ')}{#if step.choice} · {step.choice}{/if}</span>
        {#if step.guide}
          <a class="road-title" href={`/guides/${step.guide.slug}`}>{step.guide.title}</a>
          <span class="road-note">{step.guide.summary}</span>
        {:else}
          <span class="road-title muted">{step.title}</span>
          <span class="soon-tag">Coming soon</span>
          {#if step.note}<span class="road-note">{step.note}</span>{/if}
        {/if}
      </div>
    </li>
  {/each}
</ol>
