<script>
  import { onMount } from 'svelte';
  // WebMCP: expose a single, safe read-only tool to in-browser agents that
  // support navigator.modelContext. No-op everywhere else.
  onMount(() => {
    const mc = typeof navigator !== 'undefined' ? navigator.modelContext : null;
    if (!mc || typeof mc.provideContext !== 'function') return;
    try {
      mc.provideContext({
        tools: [
          {
            name: 'search_guides',
            description:
              'Search The Missing Manual developer guides. Returns matching guide sections with titles, summaries, and URLs.',
            inputSchema: {
              type: 'object',
              properties: { query: { type: 'string', description: 'Search terms' } },
              required: ['query']
            },
            async execute({ query }) {
              try {
                const res = await fetch(`/search.json?q=${encodeURIComponent(query || '')}`);
                const data = res.ok ? await res.json() : { hits: [] };
                const hits = (data.hits || []).slice(0, 8).map((h) => ({
                  title: h.title,
                  summary: h.summary,
                  url: `${location.origin}/guides/${h.guide_slug}/${h.phase_no}`
                }));
                return { content: [{ type: 'text', text: JSON.stringify(hits, null, 2) }] };
              } catch (e) {
                return { content: [{ type: 'text', text: '[]' }], isError: true };
              }
            }
          }
        ]
      });
    } catch (e) {
      /* ignore — best-effort progressive enhancement */
    }
  });
</script>
