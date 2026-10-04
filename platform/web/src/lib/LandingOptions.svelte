<script>
  import HeaderSearch from "$lib/HeaderSearch.svelte";
  export let cards = [];
  export let shownTopics = 0;
  export let shownRecent = [];
  export let iconFor = {};
  export let whatsNew = [];
  export let bookmarks = [];
  export let removeBookmark;
  export let hasPath = false;
  export let pct = 0;
  export let dueCount = 0;
  export let beginner = false;

  $: available = cards.filter((c) => c.shown > 0);
</script>

{#snippet search()}
  <HeaderSearch hero>
    <button class="landing-search-submit" type="submit" aria-label="Search guides"><i class="ti ti-arrow-right" aria-hidden="true"></i></button>
  </HeaderSearch>
{/snippet}

{#snippet saved()}
  {#if bookmarks.length}
    <section class="landing-saved" aria-labelledby="saved-title">
      <h2 id="saved-title">Pick up where you left off</h2>
      <ul>
        {#each bookmarks as b}
          <li>
            <a href={b.path}><i class="ti ti-bookmark" aria-hidden="true"></i><span><strong>{b.title}{#if b.phase} · Phase {b.phase}{/if}</strong>{#if b.label}<small>Continue at “{b.label}”</small>{/if}</span></a>
            <button on:click={() => removeBookmark(b.key)} aria-label={`Remove bookmark for ${b.title}`}><i class="ti ti-x" aria-hidden="true"></i></button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#snippet topics()}
  <section class="landing-topics" aria-labelledby="topics">
    <div class="landing-section-head">
      <h2 id="topics">Find your next rabbit hole.</h2>
      <span>{shownTopics} topics to explore</span>
    </div>
    <div class="landing-topic-list">
      {#each cards as c}
        {#if c.shown > 0}
          <a class="landing-topic" href={`/categories/${c.slug}`}>
            <i class={`ti ${c.icon}`} aria-hidden="true"></i>
            <span class="landing-topic-name">{c.name}</span>
            <span class="landing-topic-count">{c.shown} guide{c.shown === 1 ? "" : "s"}</span>
            <i class="ti ti-arrow-up-right landing-topic-arrow" aria-hidden="true"></i>
          </a>
        {:else}
          <div class="landing-topic landing-unavailable">
            <i class={`ti ${c.icon}`} aria-hidden="true"></i>
            <span class="landing-topic-name">{c.name}</span>
            <span class="landing-topic-count">{beginner && c.hasAny ? "No beginner guides" : "Coming soon"}</span>
          </div>
        {/if}
      {/each}
    </div>
    <p class="landing-request">Missing a topic? <a href="/request">Request a guide <i class="ti ti-arrow-up-right" aria-hidden="true"></i></a></p>
  </section>
{/snippet}

{#snippet tools()}
  <section class="landing-tools" aria-labelledby="tools-title">
    <div class="landing-section-head"><h2 id="tools-title">Make it stick.</h2><span>Read. Try. Remember.</span></div>
    <div class="landing-tool-list">
      <a href="/practice"><i class="ti ti-keyboard" aria-hidden="true"></i><h3>Learn by doing</h3><p>Put the ideas to work with hands-on exercises.</p><span>Open practice <i class="ti ti-arrow-up-right" aria-hidden="true"></i></span></a>
      <a href="/train"><i class="ti ti-brain" aria-hidden="true"></i><h3>Train your brain</h3><p>Keep your thinking sharp between guides.</p><span>Start training <i class="ti ti-arrow-up-right" aria-hidden="true"></i></span></a>
      <a href="/cheat-sheet"><i class="ti ti-notes" aria-hidden="true"></i><h3>Keep a reference</h3><p>Find the command or syntax when you need it.</p><span>Browse cheat sheets <i class="ti ti-arrow-up-right" aria-hidden="true"></i></span></a>
    </div>
    {#if dueCount > 0}<a class="landing-review" href="/review"><i class="ti ti-cards" aria-hidden="true"></i> {dueCount} card{dueCount === 1 ? "" : "s"} ready to review <i class="ti ti-arrow-right" aria-hidden="true"></i></a>{/if}
  </section>
{/snippet}

{#snippet recent()}
  {#if shownRecent.length}
    <section class="landing-recent" aria-labelledby="recent-title">
      <div class="landing-section-head"><h2 id="recent-title">New on the shelf.</h2><a href="/changelog">All updates <i class="ti ti-arrow-up-right" aria-hidden="true"></i></a></div>
      <ul>
        {#each shownRecent as g}
          <li><a href={`/guides/${g.slug}`}><i class={`ti ${iconFor[g.category] || "ti-file-text"}`} aria-hidden="true"></i><span><h3>{g.title}</h3><p>{g.summary}</p></span><i class="ti ti-arrow-up-right" aria-hidden="true"></i></a></li>
        {/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#snippet updates()}
  {#if whatsNew.length}
    <section class="landing-updates" aria-labelledby="updates-title">
      <div class="landing-section-head"><h2 id="updates-title">What’s new</h2><a href="/changelog">See all updates <i class="ti ti-arrow-up-right" aria-hidden="true"></i></a></div>
      <ul>
        {#each whatsNew as it}
          <li><span class="landing-update-tag">{it.tag}</span>{#if it.href}<a href={it.href}>{it.text}</a>{:else}<span>{it.text}</span>{/if}</li>
        {/each}
      </ul>
    </section>
  {/if}
{/snippet}

<div class="landing">
  <section class="hero landing-search-hero">
    <h1>Understand how software <br /><span>actually works.</span></h1>
    <p class="tagline">The internet, databases, AI, and everything underneath. Find the explanation you’ve been missing.</p>
    {@render search()}
    <div class="landing-search-suggestions"><span>Explore</span>{#each available.slice(0, 4) as c}<a href={`/categories/${c.slug}`}>{c.name}<i class="ti ti-arrow-up-right" aria-hidden="true"></i></a>{/each}</div>
    <div class="landing-search-foot"><p>Start from zero or go deep.<br />Free, forever. No account needed.</p><a href="/paths">{hasPath ? "Continue your learning path" : "Build your learning path"}<i class="ti ti-arrow-up-right" aria-hidden="true"></i></a></div>
    {#if hasPath}<p class="landing-progress">{pct}% through your path</p>{/if}
  </section>
  {@render saved()}{@render tools()}{@render topics()}{@render recent()}{@render updates()}
</div>

<style>
  .landing { color: var(--body); }
  .landing a { text-decoration: none; }
  .landing a:hover { text-decoration: none; }
  .landing .hero { max-width: none; margin: 0 auto; padding: 0 0 3.5rem; border-bottom: 1px solid var(--line); }
  .landing h1 { margin: 0; max-width: none; font-family: var(--font-display); font-size: clamp(2.8rem, 6.5vw, 5rem); font-weight: 600; line-height: 1.05; letter-spacing: -0.035em; text-wrap: balance; }
  .landing h1 span { color: var(--accent); }
  .landing .tagline { max-width: 56ch; margin: 0; font-size: 1.08rem; line-height: 1.7; color: var(--muted); }
  .landing h2 { margin: 0; color: var(--ink); font-size: 1.8rem; font-weight: 600; line-height: 1.2; letter-spacing: -0.025em; text-wrap: balance; }
  .landing h3 { margin: 0; color: var(--ink); font-size: 1.12rem; font-weight: 600; line-height: 1.4; }
  .landing-progress { color: var(--muted); font-size: 0.85rem; }
  .landing-section-head { display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem 1.5rem; margin-bottom: 1.5rem; }
  .landing-section-head > span, .landing-section-head > a { color: var(--muted); font-size: 0.85rem; }
  .landing-section-head > a:hover { color: var(--accent-strong); }
  .landing-topics, .landing-tools, .landing-recent, .landing-updates, .landing-saved { margin-top: 4rem; }
  .landing-topic-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 2.5rem; }
  .landing-topic { display: flex; align-items: center; gap: 0.85rem; min-height: 66px; padding: 1rem 0; border-top: 1px solid var(--line); color: var(--ink); }
  .landing-topic > .ti:first-child { color: var(--accent); font-size: 1.3rem; flex: none; }
  .landing-topic-name { font-size: 1.02rem; font-weight: 500; }
  .landing-topic-count { margin-left: auto; font-size: 0.76rem; color: var(--muted); text-align: right; }
  .landing-topic-arrow { color: var(--faint); transition: transform 160ms var(--ease); }
  a.landing-topic:hover .landing-topic-name { color: var(--accent-strong); }
  a.landing-topic:hover .landing-topic-arrow { transform: translate(2px, -2px); color: var(--accent); }
  .landing-unavailable { color: var(--muted); }
  .landing-unavailable > .ti:first-child { color: var(--faint); }
  .landing-request { margin: 1.25rem 0 0; font-size: 0.85rem; color: var(--muted); }
  .landing-request a { color: var(--accent-strong); }
  .landing-tool-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--line); }
  .landing-tool-list > a { display: flex; flex-direction: column; align-items: flex-start; color: var(--ink); }
  .landing-tool-list > a > .ti { font-size: 1.65rem; color: var(--accent); margin-bottom: 1rem; }
  .landing-tool-list p { margin: 0.5rem 0 1.2rem; font-size: 0.9rem; line-height: 1.65; color: var(--muted); }
  .landing-tool-list a > span { display: flex; align-items: center; gap: 0.6rem; margin-top: auto; color: var(--accent-strong); font-size: 0.85rem; font-weight: 500; }
  .landing-tool-list a:hover > span { text-decoration: underline; text-underline-offset: 4px; }
  .landing-review { display: flex; align-items: center; gap: 0.75rem; margin-top: 1.5rem; padding: 1rem; border-radius: 9px; background: var(--accent-tint); color: var(--accent-strong); }
  .landing-recent ul, .landing-updates ul, .landing-saved ul { list-style: none; margin: 0; padding: 0; }
  .landing-recent li { border-top: 1px solid var(--line); }
  .landing-recent li a { display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem 0; color: var(--ink); }
  .landing-recent li a > .ti:first-child { color: var(--accent); font-size: 1.35rem; padding-top: 0.15rem; }
  .landing-recent li a > span { flex: 1; min-width: 0; }
  .landing-recent li a > .ti:last-child { flex: none; color: var(--muted); padding-top: 0.2rem; }
  .landing-recent p { margin: 0.35rem 0 0; font-size: 0.9rem; color: var(--muted); line-height: 1.65; max-width: 70ch; }
  .landing-recent a:hover h3 { color: var(--accent-strong); }
  .landing-updates { padding-top: 2rem; border-top: 1px solid var(--line); }
  .landing-updates h2 { font-size: 1.3rem; }
  .landing-updates li { display: flex; align-items: baseline; gap: 1rem; margin-top: 0.8rem; font-size: 0.9rem; line-height: 1.65; }
  .landing-updates li a { color: var(--body); }
  .landing-updates li a:hover { color: var(--accent-strong); }
  .landing-update-tag { flex: none; min-width: 5rem; color: var(--accent-strong); font-size: 0.75rem; font-weight: 600; }
  .landing-saved h2 { margin-bottom: 1rem; }
  .landing-saved li { display: flex; align-items: center; border-top: 1px solid var(--line); }
  .landing-saved li a { display: flex; align-items: center; flex: 1; gap: 1rem; padding: 1rem 0; color: var(--ink); }
  .landing-saved li a > .ti { color: var(--accent); }
  .landing-saved li a span { display: flex; flex-direction: column; }
  .landing-saved small { font-size: 0.85rem; color: var(--muted); }
  .landing-saved button { display: grid; place-items: center; flex: none; width: 44px; height: 44px; border: 0; background: none; color: var(--muted); cursor: pointer; border-radius: 9px; }
  .landing-saved button:hover { background: var(--surface); color: var(--danger); }
  .landing-search-submit { display: grid; place-items: center; width: 44px; height: 44px; flex: none; background: var(--accent-tint); color: var(--accent-strong); border: 0; border-radius: 9px; cursor: pointer; font-size: 1.25rem; }
  .landing-search-submit:hover { background: var(--surface); }
  .landing-search-submit .ti { color: inherit; font-size: 1.25rem; }
  .landing-search-hero { text-align: center; }
  .landing-search-hero .tagline { margin: 1.5rem auto 2rem; max-width: 52ch; }
  .landing-search-suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem 1.25rem; margin: 1.25rem 0 2.5rem; font-size: 0.82rem; }
  .landing-search-suggestions > span { color: var(--muted); }
  .landing-search-suggestions a { display: inline-flex; gap: 0.35rem; color: var(--accent-strong); }
  .landing-search-foot { display: flex; justify-content: space-between; align-items: center; max-width: 720px; margin: 0 auto; padding-top: 1.25rem; border-top: 1px solid var(--line); text-align: left; font-size: 0.9rem; }
  .landing-search-foot p { margin: 0; color: var(--muted); }
  .landing-search-foot a { display: inline-flex; align-items: center; gap: 0.75rem; min-height: 44px; color: var(--ink); font-weight: 600; }
  .landing .landing-topic-list { grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 1.5rem; }
  .landing .landing-topic { gap: 0.6rem; flex-wrap: wrap; align-content: center; }
  .landing .landing-topic-name { flex: 1; font-size: 0.94rem; }
  .landing .landing-topic-count { width: 100%; margin-left: 1.9rem; text-align: left; }
  .landing .landing-topic-arrow { display: none; }
  @media (max-width: 900px) {
    .landing .landing-topic-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .landing .hero { padding-bottom: 2.5rem; }
    .landing h1 { font-size: clamp(2.6rem, 10.5vw, 4rem); }
    .landing h1 br { display: none; }
    .landing h2 { font-size: 1.55rem; }
    .landing .tagline { font-size: 1rem; }
    .landing-topics, .landing-tools, .landing-recent, .landing-updates, .landing-saved { margin-top: 3rem; }
    .landing-topic-list, .landing .landing-topic-list { grid-template-columns: 1fr; }
    .landing-topic { gap: 0.65rem; }
    .landing-topic-name { font-size: 0.98rem; }
    .landing-topic-count { font-size: 0.72rem; }
    .landing .landing-topic { flex-wrap: nowrap; }
    .landing .landing-topic-count { width: auto; margin-left: auto; text-align: right; }
    .landing-tool-list { grid-template-columns: 1fr; gap: 1.75rem; }
    .landing-tool-list > a { display: grid; grid-template-columns: 32px 1fr; column-gap: 1rem; }
    .landing-tool-list > a > .ti { grid-row: span 3; margin: 0; }
    .landing-tool-list p { margin-bottom: 0.5rem; }
    .landing-tool-list a > span { grid-column: 2; }
    .landing-section-head { margin-bottom: 1.25rem; }
    .landing-search-hero { text-align: left; }
    .landing-search-hero .tagline { margin: 1.25rem 0 1.5rem; }
    .landing-search-suggestions { justify-content: flex-start; margin-bottom: 1.5rem; }
    .landing-search-foot { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    .landing-updates li { gap: 0.75rem; }
    .landing-update-tag { min-width: 3.5rem; font-size: 0.65rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    .landing-topic-arrow { transition: none; }
  }
</style>
