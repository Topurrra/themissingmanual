<script>
  import { onMount } from "svelte";
  import { generatePath } from "$lib/pathgen.js";
  import { beginnerMode } from "$lib/beginner-store.js";
  import { allCards, loadState, countDue } from "$lib/srs.js";
  import Seo from "$lib/Seo.svelte";
  import { page } from "$app/stores";
  import { siteOrigin } from "$lib/site.js";

  export let data;
  $: origin = siteOrigin($page.url.origin);
  $: homeLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "The Missing Manual",
      url: origin,
      description: "Free, in-depth guides to how software really works.",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${origin}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "The Missing Manual",
      url: origin,
      logo: `${origin}/icon-256.png`,
      makesOffer: {
        "@type": "Offer",
        priceSpecification: {
          "@type": "PriceSpecification",
          price: "0",
          priceCurrency: "USD",
        },
        availability: "https://schema.org/InStock",
        itemOffered: {
          "@type": "Service",
          name: "The Missing Manual guides",
          serviceType: "Educational content",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "The Missing Manual AI Tutor",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Any (runs in browser)",
      description:
        "An AI tutor grounded in this site's own guides - answers questions about the exact phase you're reading instead of generic chat.",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ];
  $: ({ categories, recent, guides } = data);
  $: iconFor = Object.fromEntries(categories.map((c) => [c.slug, c.icon]));

  $: begByCat = (guides || []).reduce((m, g) => {
    if (g.difficulty === "beginner") m[g.category] = (m[g.category] || 0) + 1;
    return m;
  }, {});
  $: cards = categories.map((c) => ({
    ...c,
    shown: $beginnerMode ? begByCat[c.slug] || 0 : c.count || 0,
    hasAny: (c.count || 0) > 0,
  }));
  $: totalGuides = $beginnerMode
    ? Object.values(begByCat).reduce((a, b) => a + b, 0)
    : categories.reduce((a, c) => a + (c.count || 0), 0);
  $: shownTopics = cards.filter((c) => c.shown > 0).length;
  $: shownRecent = (recent || []).filter(
    (g) => !$beginnerMode || g.difficulty === "beginner",
  );

  let hasPath = false;
  let pct = 0;
  let bookmarks = [];
  let dueCount = 0;

  $: titleFor = Object.fromEntries(
    (guides || []).map((g) => [g.slug, g.title]),
  );

  function loadBookmarks() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith("tmm-place:")) continue;
        const path = k.slice("tmm-place:".length);
        if (!path.startsWith("/guides/")) continue;
        let m = null;
        try {
          m = JSON.parse(localStorage.getItem(k));
        } catch (e) {}
        const mm = path.match(/^\/guides\/([^/]+)(?:\/(\d+))?/);
        const slug = mm ? mm[1] : null;
        out.push({
          key: k,
          path,
          title: titleFor[slug] || (slug ? slug.replace(/-/g, " ") : path),
          phase: mm && mm[2] ? mm[2] : null,
          label: m && m.label ? m.label : null,
        });
      }
    } catch (e) {}
    bookmarks = out;
  }
  function removeBookmark(k) {
    try {
      localStorage.removeItem(k);
    } catch (e) {}
    bookmarks = bookmarks.filter((b) => b.key !== k);
  }

  onMount(() => {
    try {
      const cfg = JSON.parse(localStorage.getItem("tmm-path-config") || "null");
      if (cfg && cfg.level) {
        hasPath = true;
        const done = JSON.parse(localStorage.getItem("tmm-path-done") || "[]");
        const steps = generatePath(
          { level: cfg.level, interests: cfg.interests || [] },
          categories,
          guides || [],
        );
        const d = Array.isArray(done)
          ? steps.filter((s) => done.includes(s.slug)).length
          : 0;
        pct = steps.length ? Math.round((d / steps.length) * 100) : 0;
      }
    } catch (e) {}
    try {
      dueCount = countDue(allCards(), loadState());
    } catch (e) {}
    loadBookmarks();
  });
</script>

<Seo
  title="The Missing Manual for Developers"
  description="Clear, in-depth guides to how software works - from how a computer boots up to the internet, databases, and AI. Start from zero or go deep. Free, forever."
  type="website"
  jsonld={homeLd}
/>

<section class="hero">
  <h1>Understand how software <span class="accent">actually</span> works.</h1>
  <p class="tagline">
    Clear, in-depth guides to everything from how a computer boots up to how the
    internet, databases, and AI really work. Start from zero or go deep at your
    own pace. Free, forever, no account needed.
  </p>
  <div class="hero-cta">
    {#if hasPath}
      <a class="cta-primary" href="/paths">Continue learning →</a>
      <span class="cta-note">{pct}% through your path</span>
    {:else}
      <a class="cta-primary" href="/paths">Start learning →</a>
    {/if}
    <a class="cta-secondary" href="#topics">Browse topics</a>
    <a class="cta-secondary" href="/cheat-sheet">Cheat sheets</a>
  </div>
  <div class="hero-stats">
    <span><b>{totalGuides}</b> guide{totalGuides === 1 ? "" : "s"}</span>
    <span><b>{shownTopics}</b> topics</span>
    <span><b>Free</b> forever</span>
  </div>
</section>

{#if bookmarks.length}
  <h2 class="section-eyebrow">Pick up where you left off</h2>
  <ul class="bookmarks">
    {#each bookmarks as b}
      <li class="bm-row">
        <a class="bm-link" href={b.path}>
          <i class="ti ti-bookmark" aria-hidden="true"></i>
          <span class="bm-body">
            <span class="bm-title"
              >{b.title}{#if b.phase}
                · Phase {b.phase}{/if}</span
            >
            {#if b.label}<span class="bm-sub">Continue at “{b.label}”</span
              >{/if}
          </span>
        </a>
        <button
          class="bm-x"
          on:click={() => removeBookmark(b.key)}
          aria-label="Remove bookmark"
          title="Remove">&times;</button
        >
      </li>
    {/each}
  </ul>
{/if}

<div class="home-cards">
  {#if dueCount > 0}
    <a class="home-train review" href="/review">
      <span class="ht-icon"><i class="ti ti-cards" aria-hidden="true"></i></span
      >
      <span class="ht-text">
        <span class="ht-title">Review · {dueCount} due</span>
      </span>
      <span class="ht-go" aria-hidden="true">→</span>
    </a>
  {/if}
  <a class="home-train" href="/train">
    <span class="ht-icon"><i class="ti ti-brain" aria-hidden="true"></i></span>
    <span class="ht-text">
      <span class="ht-title">Train your brain</span>
    </span>
    <span class="ht-go" aria-hidden="true">→</span>
  </a>
  <a class="home-train" href="/guides/git-from-zero/1?tutor=1">
    <span class="ht-icon"
      ><i class="ti ti-message-chatbot" aria-hidden="true"></i></span
    >
    <span class="ht-text">
      <span class="ht-title">Ask the AI tutor</span>
    </span>
    <span class="ht-go" aria-hidden="true">→</span>
  </a>
</div>

<h2 class="section-eyebrow" id="topics">Browse by topic</h2>
<div class="cat-grid">
  {#each cards as c}
    {#if c.shown > 0}
      <a class="cat-card" href={`/categories/${c.slug}`}>
        <i class={`ti ${c.icon}`} aria-hidden="true"></i>
        <span class="cat-name">{c.name}</span>
        <span class="cat-meta">{c.shown} guide{c.shown === 1 ? "" : "s"} →</span
        >
      </a>
    {:else}
      <div class="cat-card disabled">
        <i class={`ti ${c.icon}`} aria-hidden="true"></i>
        <span class="cat-name">{c.name}</span>
        <span class="cat-meta"
          >{$beginnerMode && c.hasAny
            ? "No beginner guides"
            : "Coming soon"}</span
        >
      </div>
    {/if}
  {/each}
</div>
<p class="req-hint">
  Missing a topic? <a href="/request">Request a guide →</a>
</p>

{#if shownRecent.length}
  <h2 class="section-eyebrow">Newly added</h2>
  <ul class="guides">
    {#each shownRecent as g}
      <li>
        <span class="guide-ico" title={g.category}
          ><i
            class={`ti ${iconFor[g.category] || "ti-file-text"}`}
            aria-hidden="true"
          ></i></span
        >
        <span class="guide-body">
          <a href={`/guides/${g.slug}`}>{g.title}</a>
          <span class="summary">{g.summary}</span>
        </span>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .home-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 0.8rem;
    margin: 1.5rem 0 0.5rem;
  }
  .home-train {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.1rem 1.3rem;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: var(--raise);
    transition:
      border-color 0.15s var(--ease),
      box-shadow 0.15s var(--ease),
      transform 0.15s var(--ease);
  }
  .home-train:hover {
    border-color: var(--accent);
    box-shadow: var(--shadow-md);
    text-decoration: none;
    transform: translateY(-2px);
  }
  .ht-icon {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--accent-tint);
  }
  .ht-icon .ti {
    font-size: 24px;
    color: var(--accent);
  }
  .ht-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }
  .ht-title {
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.05rem;
    color: var(--ink);
  }
  .ht-blurb {
    font-size: 0.9rem;
    color: var(--muted);
  }
  .ht-go {
    margin-left: auto;
    flex: none;
    color: var(--faint);
    font-size: 1.2rem;
    transition:
      color 0.15s var(--ease),
      transform 0.15s var(--ease);
  }
  .home-train:hover .ht-go {
    color: var(--accent);
    transform: translateX(3px);
  }

  .bookmarks {
    list-style: none;
    margin: 0 0 0.5rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .bm-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--raise);
    transition: border-color 0.15s var(--ease);
  }
  .bm-row:hover {
    border-color: var(--accent);
  }
  .bm-link {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    flex: 1;
    min-width: 0;
    padding: 0.7rem 0.9rem;
    color: var(--ink);
  }
  .bm-link:hover {
    text-decoration: none;
  }
  .bm-link .ti {
    flex: none;
    color: var(--accent);
    font-size: 18px;
  }
  .bm-body {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }
  .bm-title {
    font-weight: 600;
    color: var(--ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bm-sub {
    font-size: 0.85rem;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bm-x {
    flex: none;
    cursor: pointer;
    background: none;
    border: 0;
    color: var(--faint);
    font-size: 1.3rem;
    line-height: 1;
    padding: 0 0.8rem;
    align-self: stretch;
    border-radius: 0 12px 12px 0;
  }
  .bm-x:hover {
    color: #c0563c;
    background: var(--surface);
  }

  .req-hint {
    margin: 0.9rem 0 0;
    font-size: 0.92rem;
    color: var(--muted);
  }
</style>
