<script>
  import { onMount } from "svelte";
  import { generatePath } from "$lib/pathgen.js";
  import { beginnerMode } from "$lib/beginner-store.js";
  import { allCards, loadState, countDue } from "$lib/srs.js";
  import Seo from "$lib/Seo.svelte";
  import LandingOptions from "$lib/LandingOptions.svelte";
  import { page } from "$app/stores";
  import { siteOrigin } from "$lib/site.js";
  import { recentItems } from "$lib/changelog.js";

  const whatsNew = recentItems(5); // changelog highlights for the "What's new" strip

  export let data;
  $: origin = siteOrigin($page.url.origin);
  $: landingOption = [1, 2, 3, 4, 5].includes(Number($page.url.searchParams.get("landing")))
    ? Number($page.url.searchParams.get("landing"))
    : 1;
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
      // Which parts of the page an assistant should read aloud: the value prop.
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".hero h1", ".hero .tagline"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "The Missing Manual",
      url: origin,
      logo: `${origin}/icon-256.png`,
      description:
        "A free, text-first library of in-depth, plain-language guides to how software really works - from how a computer boots up to the internet, databases, and AI.",
      // sameAs disambiguates the brand from generically-named entities.
      sameAs: ["https://github.com/Topurrra/themissingmanual"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "support",
        email: "topurianika96@gmail.com",
        url: `${origin}/contact`,
      },
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
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is The Missing Manual?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A free, text-first library of in-depth, plain-language guides to how software really works - from how a computer boots up to the internet, databases, and AI. It explains the parts most docs and tutorials skip, with mental models first.",
          },
        },
        {
          "@type": "Question",
          name: "Is it free? Do I need an account?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, it is free forever - no ads, no paywalls, and no account or sign-up required to read anything.",
          },
        },
        {
          "@type": "Question",
          name: "Can AI agents read and cite the guides?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Every guide is available as clean Markdown (send Accept: text/markdown, or append .md to the URL), there is an MCP server at /mcp, a search API at /search.json, and an index for LLMs at /llms.txt. Content is free to read, cite, and index.",
          },
        },
        {
          "@type": "Question",
          name: "What topics does it cover?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Programming languages, version control, databases, networking and the internet, operating systems, algorithms, security, AI, and more - plus a hands-on practice area with runnable exercises.",
          },
        },
      ],
    },
  ];
  // The practice category has its own hub (/practice), not a reader shelf - keep
  // its card out of the topic grid and its guides out of "Newly added".
  $: ({ categories: rawCategories, recent: rawRecent, guides } = data);
  $: categories = (rawCategories || []).filter((c) => c.slug !== "practice");
  $: recent = (rawRecent || []).filter((g) => g.category !== "practice");
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
  // Guides count includes practice modules (all published content) to match the admin
  // total; topics counts only the browsable content categories (practice is hidden, so
  // it is not a topic card). `rawCategories` includes practice, `categories` does not.
  $: totalGuides = $beginnerMode
    ? Object.values(begByCat).reduce((a, b) => a + b, 0)
    : (rawCategories || []).reduce((a, c) => a + (c.count || 0), 0);
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

<LandingOptions
  option={landingOption}
  {cards}
  {totalGuides}
  {shownTopics}
  {shownRecent}
  {iconFor}
  {whatsNew}
  {bookmarks}
  {removeBookmark}
  {hasPath}
  {pct}
  {dueCount}
  beginner={$beginnerMode}
/>
