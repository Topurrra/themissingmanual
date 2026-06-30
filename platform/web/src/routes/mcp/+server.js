// Remote MCP server (Model Context Protocol, Streamable HTTP transport) for
// external AI tools - Claude Desktop, Cursor, etc. Stateless and read-only:
// each POST is a self-contained JSON-RPC 2.0 message, answered with application/json
// (the spec permits a JSON response instead of an SSE stream for simple req/reply).
// Tools reuse the same pipeline the in-browser WebMcp uses: /search.json for search
// and Accept: text/markdown for full guide content.

const SERVER_INFO = { name: 'the-missing-manual', version: '1.0.0' };
const DEFAULT_PROTOCOL = '2025-06-18';

const TOOLS = [
  {
    name: 'search_guides',
    description:
      'Search The Missing Manual developer guides. Returns matching guide sections with titles, summaries, and URLs.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search terms, e.g. "undo a commit"' } },
      required: ['query']
    }
  },
  {
    name: 'read_guide',
    description:
      'Fetch the full Markdown of a Missing Manual guide or phase by its /guides/<slug>[/<phase>] path or URL (use one returned by search_guides).',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'A /guides/... path, or a full URL to one.' } },
      required: ['url']
    }
  }
];

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'Content-Type, Mcp-Session-Id, Mcp-Protocol-Version'
};
const JSON_HEADERS = { 'content-type': 'application/json', ...CORS };

const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const err = (id, code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });

async function callTool(name, args, { fetch, origin }) {
  if (name === 'search_guides') {
    const q = String(args?.query ?? '').trim();
    if (!q) return { content: [{ type: 'text', text: 'Provide a non-empty "query".' }], isError: true };
    const res = await fetch(`/search.json?q=${encodeURIComponent(q)}`);
    const data = res.ok ? await res.json() : { hits: [] };
    const hits = (data.hits || []).slice(0, 8).map(
      (h) => `- ${h.title}\n  ${h.summary}\n  ${origin}/guides/${h.guide_slug}/${h.phase_no}`
    );
    return { content: [{ type: 'text', text: hits.length ? hits.join('\n\n') : `No results for "${q}".` }] };
  }
  if (name === 'read_guide') {
    const raw = String(args?.url ?? '').trim();
    if (!raw) return { content: [{ type: 'text', text: 'Provide a "url".' }], isError: true };
    let path = raw;
    try { if (/^https?:\/\//i.test(raw)) path = new URL(raw).pathname; } catch { /* keep raw */ }
    if (!path.startsWith('/guides/')) {
      return { content: [{ type: 'text', text: 'url must be a /guides/<slug>[/<phase>] path.' }], isError: true };
    }
    const res = await fetch(path, { headers: { Accept: 'text/markdown' } });
    const text = res.ok ? await res.text() : '';
    return { content: [{ type: 'text', text: text || 'Guide not found.' }], isError: !res.ok };
  }
  return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
}

async function handle(msg, ctx) {
  const { id, method, params } = msg || {};
  // Notifications (no id) get no response.
  if (id === undefined || id === null) return null;
  switch (method) {
    case 'initialize':
      return ok(id, {
        protocolVersion: params?.protocolVersion || DEFAULT_PROTOCOL,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions:
          'Free, plain-language developer guides. Use search_guides to find topics, then read_guide to fetch full Markdown.'
      });
    case 'tools/list':
      return ok(id, { tools: TOOLS });
    case 'tools/call':
      return ok(id, await callTool(params?.name, params?.arguments, ctx));
    case 'ping':
      return ok(id, {});
    default:
      return err(id, -32601, `Method not found: ${method}`);
  }
}

export async function POST({ request, fetch, url }) {
  const ctx = { fetch, origin: url.origin };
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify(err(null, -32700, 'Parse error')), { status: 200, headers: JSON_HEADERS });
  }
  if (Array.isArray(body)) {
    const out = [];
    for (const m of body) {
      const r = await handle(m, ctx);
      if (r) out.push(r);
    }
    if (!out.length) return new Response(null, { status: 202, headers: CORS });
    return new Response(JSON.stringify(out), { status: 200, headers: JSON_HEADERS });
  }
  const r = await handle(body, ctx);
  if (!r) return new Response(null, { status: 202, headers: CORS });
  return new Response(JSON.stringify(r), { status: 200, headers: JSON_HEADERS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS });
}

// Friendly GET: opening /mcp in a browser explains what it is.
export function GET() {
  return new Response(
    JSON.stringify(
      {
        name: SERVER_INFO.name,
        description:
          'Model Context Protocol endpoint (Streamable HTTP). POST JSON-RPC 2.0 here to use the tools.',
        transport: 'streamable-http',
        tools: TOOLS.map((t) => t.name)
      },
      null,
      2
    ),
    { status: 200, headers: JSON_HEADERS }
  );
}
