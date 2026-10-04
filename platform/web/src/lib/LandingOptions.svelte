<script>
  import { dev } from "$app/environment";

  export let option = 6;
  export let cards = [];
  export let totalGuides = 0;
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

  const options = ["Editorial", "Search first", "Learning journey", "Library index", "Type statement", "Your selection"];
  $: available = cards.filter((c) => c.shown > 0);
  $: featured = shownRecent[0];
</script>

{#snippet actions()}
  <div class="landing-actions">
    <a class="landing-primary" href="/paths">{hasPath ? "Continue learning" : "Start learning"}<i class="ti ti-arrow-up-right" aria-hidden="true"></i></a>
    <a class="landing-link" href="#topics">Explore the topics <i class="ti ti-arrow-down" aria-hidden="true"></i></a>
    {#if hasPath}<span class="landing-progress">{pct}% through your path</span>{/if}
  </div>
{/snippet}

{#snippet search()}
  <form class="landing-search" action="/search" method="GET" role="search" aria-label="Search the library">
    <i class="ti ti-search" aria-hidden="true"></i>
    <input name="q" type="search" aria-label="What do you want to understand?" placeholder="What do you want to understand?" required />
    <button type="submit" aria-label="Search guides"><i class="ti ti-arrow-right" aria-hidden="true"></i></button>
  </form>
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

<div class="landing" data-option={option}>
  {#if dev}
    <nav class="landing-options" aria-label="Landing page design options">
      <span>Preview designs</span>
      <div>{#each options as name, i}<a href={`/?landing=${i + 1}`} aria-current={option === i + 1 ? "page" : undefined}>{i + 1}. {name}</a>{/each}</div>
    </nav>
  {/if}

  {#if option === 1}
    <section class="hero landing-editorial">
      <h1>Understand how <br />software <span>actually</span> works.</h1>
      <div class="landing-editorial-bottom">
        <div><p class="tagline">Clear, in-depth guides to the parts most docs skip. From how a computer boots up to the internet, databases, and AI.</p>{@render actions()}<p class="landing-promise">Free, forever. No account needed.</p></div>
        {#if featured}
          <a class="landing-feature" href={`/guides/${featured.slug}`}><span>Recently added to the manual</span><h2>{featured.title}</h2><p>{featured.summary}</p><strong>Read the guide <i class="ti ti-arrow-up-right" aria-hidden="true"></i></strong></a>
        {/if}
      </div>
    </section>
    {@render saved()}{@render topics()}{@render tools()}{@render recent()}{@render updates()}
  {:else if option === 2 || option === 6}
    <section class="hero landing-search-hero">
      <h1>Understand how software <br /><span>actually works.</span></h1>
      <p class="tagline">The internet, databases, AI, and everything underneath. Find the explanation you’ve been missing.</p>
      {@render search()}
      <div class="landing-search-suggestions"><span>Explore</span>{#each available.slice(0, 4) as c}<a href={`/categories/${c.slug}`}>{c.name}<i class="ti ti-arrow-up-right" aria-hidden="true"></i></a>{/each}</div>
      <div class="landing-search-foot"><p>Start from zero or go deep.<br />Free, forever. No account needed.</p><a href="/paths">{hasPath ? "Continue your learning path" : "Build your learning path"}<i class="ti ti-arrow-up-right" aria-hidden="true"></i></a></div>
      {#if hasPath}<p class="landing-progress">{pct}% through your path</p>{/if}
    </section>
    {@render saved()}
    {#if option === 6}
      {@render tools()}{@render topics()}{@render recent()}{@render updates()}
    {:else}
      {@render topics()}{@render recent()}{@render tools()}{@render updates()}
    {/if}
  {:else if option === 3}
    <section class="hero landing-journey">
      <div><h1>Understand <br />how software <br /><span>actually works.</span></h1><p class="tagline">Start from zero or go deep at your own pace. Clear, in-depth guides to the internet, databases, AI, and more.</p><p class="landing-promise">Free, forever. No account needed.</p></div>
      <div class="landing-pathways">
        <a class="landing-path-main" href="/paths"><i class="ti ti-route" aria-hidden="true"></i><h2>{hasPath ? "Pick up your path." : "Find your way in."}</h2><p>A learning path for your level and interests.</p><strong>{hasPath ? "Continue learning" : "Start learning"}<i class="ti ti-arrow-up-right" aria-hidden="true"></i></strong>{#if hasPath}<span>{pct}% through your path</span>{/if}</a>
        <a class="landing-path-secondary" href="#topics"><span><h3>Follow your curiosity.</h3><p>Go straight to a topic.</p></span><i class="ti ti-arrow-down" aria-hidden="true"></i></a>
        <a class="landing-path-secondary" href="/practice"><span><h3>Get your hands on it.</h3><p>Learn by doing.</p></span><i class="ti ti-arrow-up-right" aria-hidden="true"></i></a>
      </div>
    </section>
    {@render saved()}{@render tools()}{@render topics()}{@render recent()}{@render updates()}
  {:else if option === 4}
    <section class="hero landing-index-hero">
      <div><h1>Software. <br /><span>Understood.</span></h1><p class="tagline">Clear, in-depth guides to how software actually works. Start from zero or go deep.</p></div>
      <div class="landing-index-intro"><p>A free library.<br /><strong>{totalGuides} guides.</strong><br />No account needed.</p>{@render search()}<a class="landing-link" href="/paths">{hasPath ? "Continue learning" : "Find a learning path"}<i class="ti ti-arrow-up-right" aria-hidden="true"></i></a>{#if hasPath}<span class="landing-progress">{pct}% through your path</span>{/if}</div>
    </section>
    {@render saved()}{@render topics()}
    <div class="landing-index-columns">{@render recent()}{@render tools()}</div>
    {@render updates()}
  {:else}
    <section class="hero landing-statement">
      <h1>Understand <br />how software <br /><span>actually works.</span></h1>
      <div class="landing-statement-bottom"><p class="tagline">From the first boot to the internet, databases, and AI. Clear, in-depth guides. Your pace. Free, forever.</p><div>{@render actions()}<p class="landing-promise">No account needed. Just curiosity.</p></div></div>
    </section>
    {@render saved()}{@render recent()}{@render topics()}{@render tools()}{@render updates()}
  {/if}
</div>

<style>
  .landing { color: var(--body); }
  .landing a { text-decoration: none; }
  .landing a:hover { text-decoration: none; }
  .landing-options { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem 1rem; margin: -1.5rem 0 2.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--line); font-size: 0.75rem; }
  .landing-options > span { color: var(--muted); }
  .landing-options > div { display: flex; flex-wrap: wrap; gap: 0.25rem; }
  .landing-options a { padding: 0.45rem 0.65rem; color: var(--muted); border-radius: 9px; }
  .landing-options a[aria-current="page"] { color: var(--accent-strong); background: var(--accent-tint); font-weight: 600; }
  .landing-options a:hover { color: var(--ink); background: var(--surface); }
  .landing .hero { max-width: none; margin: 0 auto; padding: 0 0 3.5rem; border-bottom: 1px solid var(--line); }
  .landing h1 { margin: 0; max-width: none; font-family: var(--font-display); font-size: clamp(2.8rem, 6.5vw, 5rem); font-weight: 600; line-height: 1.05; letter-spacing: -0.035em; text-wrap: balance; }
  .landing h1 span { color: var(--accent); }
  .landing .tagline { max-width: 56ch; margin: 0; font-size: 1.08rem; line-height: 1.7; color: var(--muted); }
  .landing h2 { margin: 0; color: var(--ink); font-size: 1.8rem; font-weight: 600; line-height: 1.2; letter-spacing: -0.025em; text-wrap: balance; }
  .landing h3 { margin: 0; color: var(--ink); font-size: 1.12rem; font-weight: 600; line-height: 1.4; }
  .landing-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem 1.5rem; margin-top: 1.75rem; }
  .landing-primary { display: inline-flex; align-items: center; justify-content: space-between; gap: 1.5rem; min-height: 48px; padding: 0.7rem 1.1rem; border-radius: 9px; background: var(--accent); color: var(--bg); font-weight: 600; transition: background 160ms var(--ease); }
  .landing-primary:hover { background: var(--accent-strong); }
  :global(:root[data-mode="dark"]) .landing-primary { background: var(--accent-strong); color: var(--bg); }
  .landing-link { display: inline-flex; align-items: center; gap: 0.75rem; min-height: 44px; color: var(--ink); font-weight: 500; }
  .landing-link:hover { color: var(--accent-strong); }
  .landing-promise { margin: 1.25rem 0 0; font-size: 0.85rem; color: var(--muted); }
  .landing-progress { color: var(--muted); font-size: 0.85rem; }
  .landing-editorial-bottom { display: grid; grid-template-columns: 1.15fr 1fr; gap: 3rem; margin-top: 2.5rem; }
  .landing-feature { display: flex; flex-direction: column; align-items: flex-start; padding: 1.5rem; border-radius: 14px; background: var(--surface); color: var(--ink); }
  .landing-feature > span { color: var(--muted); font-size: 0.8rem; }
  .landing-feature h2 { margin-top: 0.75rem; font-size: 1.5rem; }
  .landing-feature p { margin: 0.65rem 0 1rem; font-size: 0.9rem; line-height: 1.6; color: var(--muted); }
  .landing-feature strong { display: flex; gap: 0.75rem; margin-top: auto; font-size: 0.9rem; color: var(--accent-strong); }
  .landing-feature:hover strong { text-decoration: underline; text-underline-offset: 4px; }
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
  .landing-search { display: flex; align-items: center; gap: 1rem; padding: 0.6rem 0.75rem 0.6rem 1.25rem; border: 1px solid var(--line); border-radius: 10px; background: var(--raise); }
  .landing-search:focus-within { border-color: var(--accent); outline: 2px solid var(--accent); outline-offset: 3px; }
  .landing-search > .ti { color: var(--muted); font-size: 1.25rem; flex: none; }
  .landing-search input { width: 100%; min-width: 0; padding: 0.7rem 0; border: 0; background: none; color: var(--ink); font: inherit; outline: none; }
  .landing-search input:focus-visible { outline: none; box-shadow: none; }
  .landing-search input::placeholder { color: var(--faint); opacity: 1; }
  .landing-search button { display: grid; place-items: center; width: 44px; height: 44px; flex: none; background: var(--accent-tint); color: var(--accent-strong); border: 0; border-radius: 9px; cursor: pointer; font-size: 1.25rem; }
  .landing-search button:hover { background: var(--surface); }
  .landing-search-hero { text-align: center; }
  .landing-search-hero .tagline { margin: 1.5rem auto 2rem; max-width: 52ch; }
  .landing-search-hero .landing-search { max-width: 720px; margin: 0 auto; text-align: left; }
  .landing-search-suggestions { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem 1.25rem; margin: 1.25rem 0 2.5rem; font-size: 0.82rem; }
  .landing-search-suggestions > span { color: var(--muted); }
  .landing-search-suggestions a { display: inline-flex; gap: 0.35rem; color: var(--accent-strong); }
  .landing-search-foot { display: flex; justify-content: space-between; align-items: center; max-width: 720px; margin: 0 auto; padding-top: 1.25rem; border-top: 1px solid var(--line); text-align: left; font-size: 0.9rem; }
  .landing-search-foot p { margin: 0; color: var(--muted); }
  .landing-search-foot a { display: inline-flex; align-items: center; gap: 0.75rem; min-height: 44px; color: var(--ink); font-weight: 600; }
  .landing-journey { display: grid; grid-template-columns: 1.1fr 1fr; gap: 3rem; align-items: center; }
  .landing-journey h1 { font-size: clamp(2.8rem, 5.5vw, 4.4rem); }
  .landing-journey .tagline { margin-top: 1.5rem; }
  .landing-path-main { display: flex; flex-direction: column; align-items: flex-start; padding: 2rem; border-radius: 14px; background: var(--accent-tint); color: var(--ink); }
  .landing-path-main > .ti { font-size: 2rem; color: var(--accent); margin-bottom: 1.25rem; }
  .landing-path-main h2 { font-size: 2.3rem; }
  .landing-path-main p { margin: 0.75rem 0 1.5rem; color: var(--body); line-height: 1.65; }
  .landing-path-main strong { display: flex; align-items: center; justify-content: space-between; gap: 1rem; width: 100%; color: var(--accent-strong); }
  .landing-path-main > span { margin-top: 0.5rem; font-size: 0.8rem; color: var(--muted); }
  .landing-path-secondary { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1.25rem 0; border-bottom: 1px solid var(--line); color: var(--ink); }
  .landing-path-secondary p { margin: 0.25rem 0 0; color: var(--muted); font-size: 0.9rem; }
  .landing-path-secondary > .ti { color: var(--accent); }
  .landing-path-main:hover strong, .landing-path-secondary:hover h3 { text-decoration: underline; text-underline-offset: 4px; }
  .landing-index-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center; }
  .landing-index-hero .tagline { margin-top: 1.25rem; max-width: 32ch; }
  .landing-index-intro > p { margin: 0 0 1.5rem; font-size: 1.3rem; line-height: 1.6; color: var(--muted); }
  .landing-index-intro > p strong { color: var(--ink); font-size: 2rem; font-weight: 600; }
  .landing-index-intro .landing-search { gap: 0.5rem; padding-left: 0.75rem; font-size: 0.9rem; }
  .landing-index-intro .landing-link { margin-top: 0.75rem; }
  .landing-index-columns { display: grid; grid-template-columns: 1.5fr 1fr; gap: 3rem; }
  .landing-index-columns .landing-tool-list { grid-template-columns: 1fr; gap: 2rem; }
  .landing:is([data-option="4"], [data-option="6"]) .landing-topic-list { grid-template-columns: repeat(3, minmax(0, 1fr)); column-gap: 1.5rem; }
  .landing:is([data-option="4"], [data-option="6"]) .landing-topic { gap: 0.6rem; flex-wrap: wrap; align-content: center; }
  .landing:is([data-option="4"], [data-option="6"]) .landing-topic-name { flex: 1; font-size: 0.94rem; }
  .landing:is([data-option="4"], [data-option="6"]) .landing-topic-count { width: 100%; margin-left: 1.9rem; text-align: left; }
  .landing:is([data-option="4"], [data-option="6"]) .landing-topic-arrow { display: none; }
  .landing-statement h1 { font-size: clamp(3rem, 8vw, 6rem); line-height: 1.02; }
  .landing-statement-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; margin-top: 2.5rem; align-items: start; }
  .landing-statement-bottom .landing-actions { margin-top: 0; }
  .landing[data-option="5"] .landing-topic-list { grid-template-columns: 1fr; }
  .landing[data-option="5"] .landing-topic-name { font-size: 1.25rem; }
  @media (max-width: 900px) {
    .landing-editorial-bottom, .landing-journey, .landing-index-hero, .landing-statement-bottom { gap: 2rem; }
    .landing-journey h1 { font-size: clamp(2.6rem, 5.2vw, 4.4rem); }
    .landing:is([data-option="4"], [data-option="6"]) .landing-topic-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .landing-options { margin-top: -0.5rem; margin-bottom: 2rem; }
    .landing-options a { min-height: 44px; display: inline-flex; align-items: center; }
    .landing .hero { padding-bottom: 2.5rem; }
    .landing h1 { font-size: clamp(2.6rem, 10.5vw, 4rem); }
    .landing h1 br { display: none; }
    .landing-index-hero h1 br { display: initial; }
    .landing h2 { font-size: 1.55rem; }
    .landing .tagline { font-size: 1rem; }
    .landing-editorial-bottom, .landing-journey, .landing-index-hero, .landing-statement-bottom, .landing-index-columns { grid-template-columns: 1fr; gap: 2rem; }
    .landing-journey h1, .landing-statement h1 { font-size: clamp(2.7rem, 11.5vw, 4.5rem); }
    .landing-editorial-bottom, .landing-statement-bottom { margin-top: 1.5rem; }
    .landing-feature { padding: 1.25rem; }
    .landing-topics, .landing-tools, .landing-recent, .landing-updates, .landing-saved { margin-top: 3rem; }
    .landing-topic-list, .landing:is([data-option="4"], [data-option="6"]) .landing-topic-list { grid-template-columns: 1fr; }
    .landing-topic { gap: 0.65rem; }
    .landing-topic-name { font-size: 0.98rem; }
    .landing-topic-count { font-size: 0.72rem; }
    .landing:is([data-option="4"], [data-option="6"]) .landing-topic { flex-wrap: nowrap; }
    .landing:is([data-option="4"], [data-option="6"]) .landing-topic-count { width: auto; margin-left: auto; text-align: right; }
    .landing[data-option="5"] .landing-topic-name { font-size: 1.08rem; }
    .landing-tool-list { grid-template-columns: 1fr; gap: 1.75rem; }
    .landing-tool-list > a { display: grid; grid-template-columns: 32px 1fr; column-gap: 1rem; }
    .landing-tool-list > a > .ti { grid-row: span 3; margin: 0; }
    .landing-tool-list p { margin-bottom: 0.5rem; }
    .landing-tool-list a > span { grid-column: 2; }
    .landing-section-head { margin-bottom: 1.25rem; }
    .landing-search-hero { text-align: left; }
    .landing-search-hero .tagline { margin: 1.25rem 0 1.5rem; }
    .landing-search { gap: 0.6rem; padding-left: 0.75rem; font-size: 0.88rem; }
    .landing-search-suggestions { justify-content: flex-start; margin-bottom: 1.5rem; }
    .landing-search-foot { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    .landing-path-main { padding: 1.5rem; }
    .landing-path-main h2 { font-size: 2rem; }
    .landing-index-hero .tagline { max-width: none; }
    .landing-index-intro > p { font-size: 1.05rem; }
    .landing-updates li { gap: 0.75rem; }
    .landing-update-tag { min-width: 3.5rem; font-size: 0.65rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    .landing-topic-arrow, .landing-primary { transition: none; }
  }
</style>
