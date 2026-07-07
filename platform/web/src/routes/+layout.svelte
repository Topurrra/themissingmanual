<script>
  import "../app.css";
  import { page } from "$app/stores";
  import { dev } from "$app/environment";
  import { onMount } from "svelte";
  import { levelLabel } from "$lib/difficulty.js";
  import { afterNavigate } from "$app/navigation";
  import { sendPageview } from "$lib/beacon.js";
  import CommandPalette from "$lib/CommandPalette.svelte";
  import HeaderSearch from "$lib/HeaderSearch.svelte";
  import Appearance from "$lib/Appearance.svelte";
  import TranslateWidget from "$lib/TranslateWidget.svelte";
  import TutorChat from "$lib/TutorChat.svelte";
  import TutorToggleButton from "$lib/TutorToggleButton.svelte";
  import { tutorOpen } from "$lib/tutor-store.js";
  import LofiPlayer from "$lib/LofiPlayer.svelte";
  import PathRail from "$lib/PathRail.svelte";
  import WebMcp from "$lib/WebMcp.svelte";
  import OnboardingModal from "$lib/OnboardingModal.svelte";
  import { beginnerMode, setBeginner } from "$lib/beginner-store.js";
  import { CHEATSHEETS } from "$lib/cheatsheets.js";

  export let data;
  $: nav = data?.nav ?? [];
  $: guidePhases = data?.guidePhases ?? null;
  $: guideTitle = data?.guideTitle ?? null;
  // Flat category + guide lists (derived from nav) feed the right-side path rail.
  $: pathCategories = nav.map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
  }));
  $: pathGuides = nav.flatMap((c) => c.guides);
  $: path = $page.url.pathname;
  $: isHome = path === "/";
  // Cheat sheet gets the real app rail (like guides): tools listed in the sidebar,
  // the active one driven by ?tool= so it stays in sync with the page.
  $: isCheatSheet = path === "/cheat-sheet";
  $: activeTool = $page.url.searchParams.get("tool") || CHEATSHEETS[0].id;
  $: isAdmin = path.startsWith("/admin");
  // info pages + the learning-path wizard render centred, no sidebar (like home)
  // Centered (no sidebar) pages. Review is centered on its own, but when reached
  // from a learning-path "Review {topic}" link (?guides=…) we keep the shell so
  // the path rail stays visible and the user can continue.
  $: bare =
    isHome ||
    [
      "/about",
      "/contribute",
      "/rss",
      "/paths",
      "/roadmap",
      "/glossary",
      "/train",
      "/changelog",
    ].includes(path) ||
    (path === "/review" && !$page.url.searchParams.get("guides"));
  $: currentGuide = (path.match(/^\/guides\/([^/]+)/) || [])[1] || null;
  // The active phase number on /guides/[slug]/[phase] - null on the guide overview.
  $: currentPhase = (() => {
    const m = path.match(/^\/guides\/[^/]+\/(\d+)/);
    return m ? Number(m[1]) : null;
  })();
  $: currentCategory = (path.match(/^\/categories\/([^/]+)/) || [])[1] || null;

  // ── Public site config (from $page.data.siteConfig via the root layout load).
  // All fields are strings, "" when unset; every consumer has a fallback so an
  // all-empty config renders today's site byte-for-byte.
  $: siteConfig = data?.siteConfig ?? {};

  // Default-on flag rule (shared with the admin toggles): unset/""/"1"/"true" ⇒ ON,
  // only explicit "0"/"false"/"off"/"no" ⇒ off.
  const flagOn = (v) =>
    !["0", "false", "off", "no"].includes(
      String(v ?? "")
        .trim()
        .toLowerCase(),
    );

  $: siteName = (siteConfig.site_name || "").trim() || "The Missing Manual";
  $: announcement = (siteConfig.announcement || "").trim();
  $: lofiOn = flagOn(siteConfig.flag_lofi);

  // Sponsors: parse the JSON string; fall back to the current hardcoded two
  // (KeepITLocal / OMNIS-X) if it's empty/invalid so today's footer is unchanged.
  const SPONSOR_FALLBACK = [
    { name: "KeepITLocal", url: "#" },
    { name: "OMNIS-X", url: "#" },
  ];
  $: sponsors = (() => {
    try {
      const parsed = JSON.parse(siteConfig.sponsors || "");
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch (e) {}
    return SPONSOR_FALLBACK;
  })();

  // Bespoke per-letter colouring (reuses .spon-* from app.css). Returns the
  // segments for {@html}-free rendering in the markup.
  function sponsorParts(name) {
    if (name === "KeepITLocal")
      return { pre: "Keep", mid: "IT", midClass: "spon-it", post: "Local" };
    if (name === "OMNIS-X")
      return { pre: "OMNIS-", mid: "X", midClass: "spon-x", post: "" };
    return null;
  }

  // Social: parse the JSON string {github, x, linkedin, ...}; fall back to the
  // current hardcoded github + linkedin if empty/invalid.
  const SOCIAL_ICONS = {
    github: "ti-brand-github",
    x: "ti-brand-x",
    twitter: "ti-brand-twitter",
    linkedin: "ti-brand-linkedin",
    mastodon: "ti-brand-mastodon",
    youtube: "ti-brand-youtube",
    discord: "ti-brand-discord",
    bluesky: "ti-brand-bluesky",
  };
  const SOCIAL_FALLBACK = {
    github: "https://github.com/your-username",
    linkedin: "https://www.linkedin.com/in/your-handle",
  };
  $: socialLinks = (() => {
    let obj = null;
    try {
      const parsed = JSON.parse(siteConfig.social || "");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
        obj = parsed;
    } catch (e) {}
    const source =
      obj && Object.values(obj).some((v) => (v || "").trim())
        ? obj
        : SOCIAL_FALLBACK;
    return Object.entries(source)
      .filter(([, url]) => (url || "").trim())
      .map(([key, url]) => ({
        key,
        url,
        icon: SOCIAL_ICONS[key] || "ti-link",
        label: key.charAt(0).toUpperCase() + key.slice(1),
      }));
  })();

  $: activeCat =
    (currentCategory && nav.find((c) => c.slug === currentCategory)) ||
    (currentGuide &&
      nav.find((c) => c.guides.some((g) => g.slug === currentGuide))) ||
    null;
  $: visibleCatGuides = (activeCat?.guides ?? []).filter(
    (g) =>
      !$beginnerMode || g.difficulty === "beginner" || g.slug === currentGuide,
  );

  // Some categories (e.g. Frameworks) tag guides with a sub-group like a language.
  $: catGroups = (() => {
    const ungrouped = [];
    const groups = [];
    const byName = new Map();
    for (const g of visibleCatGuides) {
      if (!g.group) {
        ungrouped.push(g);
        continue;
      }
      let grp = byName.get(g.group);
      if (!grp) {
        grp = { name: g.group, guides: [] };
        byName.set(g.group, grp);
        groups.push(grp);
      }
      grp.guides.push(g);
    }
    return { ungrouped, groups };
  })();

  // Manually-opened sub-groups (the group owning the current guide is always open).
  let openGroups = new Set();
  function toggleGroup(name) {
    const k = (activeCat?.slug ?? "") + ":" + name;
    if (openGroups.has(k)) openGroups.delete(k);
    else openGroups.add(k);
    openGroups = openGroups; // trigger reactivity
    try {
      localStorage.setItem("tmm-groups", JSON.stringify([...openGroups]));
    } catch (e) {}
  }

  let collapsed = false;
  let palette;
  let kbdLabel = "/";
  const MOBILE_MAX = 920;
  let mobile = false;
  $: drawerOpen = mobile && !collapsed && !bare && !isHome && !isAdmin;

  function syncMobile() {
    const m = window.innerWidth <= MOBILE_MAX;
    if (m && !mobile) collapsed = true; // entering mobile → drawer starts closed
    mobile = m;
  }

  onMount(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js", { type: dev ? "module" : "classic" })
        .catch(() => {});
    }
  });

  onMount(() => {
    mobile = window.innerWidth <= MOBILE_MAX;
    try {
      const s = localStorage.getItem("tmm-sidebar");
      collapsed = mobile ? true : s ? s === "collapsed" : false;
    } catch (e) {
      collapsed = mobile;
    }
    try {
      const g = localStorage.getItem("tmm-groups");
      if (g) openGroups = new Set(JSON.parse(g));
    } catch (e) {}
    window.addEventListener("resize", syncMobile);
    return () => window.removeEventListener("resize", syncMobile);
  });

  onMount(() => {
    const footer = document.querySelector(".colophon");
    if (!footer) return;
    let raf = 0;
    const apply = () => {
      raf = 0;
      const peek = window.innerHeight - footer.getBoundingClientRect().top;
      // 22 = bookmark FAB's resting offset; 16 = gap kept above the footer.
      const lift = Math.max(0, peek - 22 + 16);
      document.documentElement.style.setProperty("--fab-lift", lift + "px");
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  });

  afterNavigate(({ to }) => {
    if (mobile) collapsed = true;
    if (to && !to.url.pathname.startsWith("/admin")) sendPageview(to.url);
  });

  function toggleSidebar() {
    collapsed = !collapsed;
    if (!mobile) {
      try {
        localStorage.setItem("tmm-sidebar", collapsed ? "collapsed" : "open");
      } catch (e) {}
    }
  }

  function closeDrawer() {
    if (mobile) collapsed = true;
  }
</script>

<svelte:head><title>{siteName}</title></svelte:head>

<WebMcp />

{#if isAdmin}
  <slot />
{:else}
  <OnboardingModal />
  {#if announcement}
    <div class="announce-banner" role="status">{announcement}</div>
  {/if}
  {#if $beginnerMode}
    <div class="beginner-banner" role="status">
      <span
        ><i class="ti ti-sparkles" aria-hidden="true"></i> Beginner mode - showing
        beginner-level guides only.</span
      >
      <button type="button" on:click={() => setBeginner(false)}
        >Show everything</button
      >
    </div>
  {/if}

  <header class="site-header">
    <div class="bar">
      {#if !bare}
        <button
          class="site-rail-btn"
          on:click={toggleSidebar}
          aria-label={collapsed ? "Show sidebar" : "Collapse sidebar"}
          title={collapsed ? "Show sidebar" : "Collapse sidebar"}
        >
          <i class="ti ti-menu-2" aria-hidden="true"></i>
        </button>
      {/if}
      <a href="/" class="brand" translate="no">{siteName}</a>

      <HeaderSearch>
        <span
          class="kbd"
          role="button"
          tabindex="-1"
          title="Command palette"
          on:click|preventDefault|stopPropagation={() =>
            palette && palette.show()}>{kbdLabel}</span
        >
      </HeaderSearch>

      {#if lofiOn}
        <LofiPlayer />
      {/if}
      <TranslateWidget />
      <Appearance />
      <TutorToggleButton />
    </div>
  </header>

  {#if bare}
    <main class="page-main home"><slot /></main>
  {:else}
    {#if drawerOpen}
      <button
        class="sidebar-backdrop"
        on:click={closeDrawer}
        aria-label="Close menu"
      ></button>
    {/if}
    <div class="shell" class:collapsed>
      <aside class="sidebar">
        <div class="sidebar-head">
          <a href="/" class="all-topics"
            ><i class="ti ti-layout-grid" aria-hidden="true"></i> All topics</a
          >
        </div>
        <nav class="sidebar-nav">
          {#if isCheatSheet}
            <div class="rail-topic">
              <i class="ti ti-terminal-2" aria-hidden="true"></i> Cheat Sheet
            </div>
            <ul class="nav-items">
              {#each CHEATSHEETS as s}
                <li>
                  <a
                    href={`/cheat-sheet?tool=${s.id}`}
                    class:on={activeTool === s.id}
                    aria-current={activeTool === s.id ? "page" : undefined}
                  >
                    <i class={`ti ${s.icon}`} aria-hidden="true"></i><span
                      class="nav-label">{s.name}</span
                    ></a
                  >
                </li>
              {/each}
            </ul>
          {:else if currentGuide && guidePhases}
            {#if activeCat}
              <a class="rail-back" href={`/categories/${activeCat.slug}`}
                ><i class="ti ti-chevron-left" aria-hidden="true"></i>
                {activeCat.name}</a
              >
            {/if}
            <div class="rail-guide-title">{guideTitle}</div>
            <ul class="nav-items">
              <li>
                <a
                  href={`/guides/${currentGuide}`}
                  class:on={currentPhase === null}
                  aria-current={currentPhase === null ? "page" : undefined}
                >
                  <i class="ti ti-file-text" aria-hidden="true"></i><span
                    class="nav-label">Overview</span
                  ></a
                >
              </li>
              {#each guidePhases.filter((p) => p.phase_no > 0) as p}
                <li>
                  <a
                    href={`/guides/${currentGuide}/${p.phase_no}`}
                    class:on={currentPhase === p.phase_no}
                    aria-current={currentPhase === p.phase_no
                      ? "page"
                      : undefined}
                  >
                    <i class="ti ti-file-text" aria-hidden="true"></i><span
                      class="nav-label">{p.phase_no} · {p.title}</span
                    ></a
                  >
                </li>
              {/each}
            </ul>
          {:else if activeCat}
            <div class="rail-topic">
              <i class={`ti ${activeCat.icon}`} aria-hidden="true"></i>
              {activeCat.name}
            </div>
            {#if visibleCatGuides.length}
              {#if catGroups.ungrouped.length}
                <ul class="nav-items">
                  {#each catGroups.ungrouped as g}
                    {@const lvl = levelLabel(g.difficulty)}
                    <li>
                      <a
                        href={`/guides/${g.slug}`}
                        class:on={currentGuide === g.slug}
                        class="nav-lvl-row"
                        aria-current={currentGuide === g.slug
                          ? "page"
                          : undefined}
                      >
                        <i class="ti ti-file-text" aria-hidden="true"></i>
                        <span class="nav-lvl-title">{g.title}</span>
                        <span
                          class="lvl"
                          class:mid={lvl === "Intermediate"}
                          class:adv={lvl === "Advanced"}
                          title={lvl}
                          aria-label={lvl}>{lvl[0]}</span
                        >
                      </a>
                    </li>
                  {/each}
                </ul>
              {/if}
              {#each catGroups.groups as grp}
                {@const hasCurrent = grp.guides.some(
                  (g) => g.slug === currentGuide,
                )}
                {@const open =
                  hasCurrent || openGroups.has(activeCat.slug + ":" + grp.name)}
                <button
                  type="button"
                  class="nav-group"
                  class:open
                  on:click={() => toggleGroup(grp.name)}
                  aria-expanded={open}
                >
                  <i
                    class="ti ti-chevron-right nav-group-chev"
                    aria-hidden="true"
                  ></i>
                  <span class="nav-group-name">{grp.name}</span>
                  <span class="nav-group-count">{grp.guides.length}</span>
                </button>
                {#if open}
                  <ul class="nav-items nav-sub">
                    {#each grp.guides as g}
                      {@const lvl = levelLabel(g.difficulty)}
                      <li>
                        <a
                          href={`/guides/${g.slug}`}
                          class:on={currentGuide === g.slug}
                          class="nav-lvl-row"
                          aria-current={currentGuide === g.slug
                            ? "page"
                            : undefined}
                        >
                          <i class="ti ti-file-text" aria-hidden="true"></i>
                          <span class="nav-lvl-title">{g.title}</span>
                          <span
                            class="lvl"
                            class:mid={lvl === "Intermediate"}
                            class:adv={lvl === "Advanced"}
                            title={lvl}
                            aria-label={lvl}>{lvl[0]}</span
                          >
                        </a>
                      </li>
                    {/each}
                  </ul>
                {/if}
              {/each}
            {:else}
              <div class="nav-soon">Coming soon</div>
            {/if}
          {:else}
            <div class="rail-topic">
              <i class="ti ti-list" aria-hidden="true"></i> Topics
            </div>
            <ul class="nav-items">
              {#each nav as c}
                <li>
                  <a
                    href={`/categories/${c.slug}`}
                    class:muted={!c.guides.length}
                    class:on={currentCategory === c.slug}
                  >
                    <i class={`ti ${c.icon}`} aria-hidden="true"></i><span
                      class="nav-label">{c.name}</span
                    ></a
                  >
                </li>
              {/each}
            </ul>
          {/if}
        </nav>
      </aside>
      <main class="page-main"><slot /></main>
      {#if !$tutorOpen}
        <PathRail
          guides={pathGuides}
          categories={pathCategories}
          currentSlug={currentGuide}
        />
      {/if}
      <TutorChat />
    </div>
  {/if}

  <footer class="colophon">
    <div class="colophon-inner">
      <div class="co-grid">
        <div class="co-id">
          <div class="co-brand">{siteName}</div>
          <a
            class="co-rss"
            href="/rss.xml"
            title="RSS Feed"
            aria-label="RSS Feed"
            ><i class="ti ti-rss" aria-hidden="true"></i></a
          >
          {#if socialLinks.length}
            <div class="co-social">
              {#each socialLinks as s}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener"
                  aria-label={s.label}
                  title={s.label}
                >
                  <i class="ti {s.icon}" aria-hidden="true"></i>
                </a>
              {/each}
            </div>
          {/if}
          <div class="sponsors">
            <span class="spon-label">Sponsored by</span>
            <span class="spon-names">
              {#each sponsors as s, i}
                {#if i > 0}<span class="spon-sep" aria-hidden="true">and</span
                  >{/if}
                <a
                  class="spon-name"
                  href={s.url}
                  target="_blank"
                  rel="noopener"
                >
                  {#if s.logo}
                    <img src={s.logo} alt={s.name} />
                  {:else if sponsorParts(s.name)}
                    {@const p = sponsorParts(s.name)}{p.pre}<span
                      class={p.midClass}>{p.mid}</span
                    >{p.post}
                  {:else}
                    {s.name}
                  {/if}
                </a>
              {/each}
            </span>
          </div>
        </div>
        <nav class="co-cols" aria-label="Footer">
          <div class="co-col">
            <h3 class="co-col-h">Learn</h3>
            <a href="/paths">Learning paths</a>
            <a href="/#topics">Browse topics</a>
            <a href="/train">Brain games</a>
          </div>
          <div class="co-col">
            <h3 class="co-col-h">Reference</h3>
            <a href="/cheat-sheet">Cheat sheets</a>
            <a href="/glossary">Glossary</a>
          </div>
          <div class="co-col">
            <h3 class="co-col-h">Project</h3>
            <a href="/about">About</a>
            <a href="/changelog">What's new</a>
            <a href="/contribute">Contribute</a>
            <a href="/request">Request a guide</a>
            <a href="/backlog">What's next?</a>
            <a href="/review">Review</a>
          </div>
        </nav>
      </div>
    </div>
  </footer>

  <CommandPalette bind:this={palette} {nav} />
{/if}

<style>
  /* Slim announcement banner at the very top of the page (above the header) */
  .announce-banner {
    padding: 0.5rem 1.25rem;
    background: var(--accent-tint);
    color: var(--ink);
    border-bottom: 1px solid var(--line);
    text-align: center;
    font-size: 0.86rem;
    line-height: 1.4;
  }
  /* Beginner-mode indicator - explains why advanced guides are hidden + a way out. */
  .beginner-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.9rem;
    flex-wrap: wrap;
    padding: 0.5rem 1.25rem;
    background: var(--accent-tint);
    color: var(--ink);
    border-bottom: 1px solid var(--line);
    font-size: 0.86rem;
    line-height: 1.4;
  }
  .beginner-banner .ti {
    color: var(--accent);
  }
  .beginner-banner button {
    font: inherit;
    font-size: 0.82rem;
    cursor: pointer;
    background: none;
    border: 1px solid var(--line);
    border-radius: 7px;
    padding: 0.2rem 0.6rem;
    color: var(--muted);
    transition:
      border-color 0.15s var(--ease),
      color 0.15s var(--ease);
  }
  .beginner-banner button:hover {
    border-color: var(--accent);
    color: var(--ink);
  }
</style>
