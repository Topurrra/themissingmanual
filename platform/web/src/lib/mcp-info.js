// The single source of truth for what our MCP server is and what it can do.
//
// Shared deliberately: the live server (`/mcp`) answers `initialize`/`tools/list` from
// these, and the discovery card (`/.well-known/mcp/server-card.json`) is generated from
// the same values. A card that is hand-maintained drifts from the server it describes,
// and a wrong card is worse than none - an agent trusts it and then calls a tool that
// does not exist.

export const SERVER_INFO = { name: 'the-missing-manual', version: '1.0.0' };

export const DEFAULT_PROTOCOL = '2025-06-18';

export const SERVER_DESCRIPTION =
  'Search and read The Missing Manual - a free, text-first library of developer and STEM guides. Read-only.';

export const TOOLS = [
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

export const CAPABILITIES = { tools: { listChanged: false } };

/// The MCP Server Card (SEP-1649).
///
/// NOTE: the schema is still an unmerged proposal (modelcontextprotocol#2127), so field
/// names may change before it lands. Everything here is derived from the constants above,
/// so keeping up means editing one place.
export function serverCard(origin) {
  return {
    serverInfo: SERVER_INFO,
    description: SERVER_DESCRIPTION,
    protocolVersion: DEFAULT_PROTOCOL,
    transport: { type: 'streamable-http', endpoint: `${origin}/mcp` },
    capabilities: CAPABILITIES,
    // Advertised so an agent can decide whether we are worth connecting to before it
    // opens a session. Mirrors exactly what `tools/list` returns.
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
    documentation: `${origin}/llms.txt`,
    websiteUrl: origin
  };
}
