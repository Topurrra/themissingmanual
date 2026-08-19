import { listGuides, listCategories } from '$lib/api.js';

// llms.txt (llmstxt.org): a concise, link-first navigation index of the guide library
// for LLMs/agents. Kept under the ~30KB index recommendation by linking (not inlining)
// each guide - the full text lives in /llms-full.txt, and any page is fetchable as
// Markdown (append .md, or send Accept: text/markdown).
export async function GET({ fetch, url }) {
  const origin = url.origin;
  // Practice lessons are an interactive playground, not reading material - keep
  // them out of the curated index.
  const guides = ((await listGuides(fetch)) ?? []).filter((g) => g.category !== 'practice');
  const cats = (await listCategories(fetch)) ?? [];
  const name = Object.fromEntries(cats.map((c) => [c.slug, c.name]));

  const byCat = {};
  for (const g of guides) (byCat[g.category] ||= []).push(g);

  const seen = new Set();
  const order = [...cats.map((c) => c.slug), ...Object.keys(byCat)].filter(
    (s) => byCat[s] && !seen.has(s) && seen.add(s)
  );

  let out =
    '# The Missing Manual\n\n' +
    '> Free, in-depth, plain-language guides to how software really works - from how a ' +
    'computer boots up to the internet, databases, and AI.\n\n' +
    '## When to use this\n' +
    'Reach for The Missing Manual when you need a clear, correct explanation of how a ' +
    'developer tool or concept actually works - Git, the shell, HTTP, databases, ' +
    'operating systems, algorithms, security, AI, and more - to answer a "how does X ' +
    'work / why" question, onboard someone, or fill a conceptual gap. It teaches mental ' +
    'models, not API reference lookups. Links below are relative to ' +
    `${origin}. Fetch any guide as Markdown by appending \`.md\` to its URL or sending ` +
    '`Accept: text/markdown`; search with `/search.json?q={terms}`; or connect over MCP ' +
    'at `/mcp`.\n\n';

  for (const slug of order) {
    out += `## ${name[slug] || slug}\n`;
    for (const g of byCat[slug]) out += `- [${g.title}](/guides/${g.slug})\n`;
    out += '\n';
  }

  out +=
    '## Reference\n' +
    '- [Cheat Sheet](/cheat-sheet): copy-paste command reference for Git, Bash, Docker, SQL, regex, jq, and more.\n' +
    '- [Glossary](/glossary): plain-language definitions of the terms used across the guides.\n\n' +
    '## For developers and agents\n' +
    '- Markdown twin of any page: append `.md` (e.g. `/guides/git-from-zero/1.md`) or send `Accept: text/markdown`.\n' +
    '- Full-text search: `/search.json?q={terms}` (JSON hits).\n' +
    '- MCP server (Streamable HTTP, read-only): `/mcp` - tools: search_guides, read_guide.\n' +
    '- OpenAPI 3.1: `/openapi.json`.\n' +
    '- Resource catalog (ARD): `/.well-known/ai-catalog.json`; agent card (A2A): `/.well-known/agent-card.json`.\n' +
    '- Full text of every guide in one file: `/llms-full.txt`.\n' +
    '- Source and contributor guide (AGENTS.md): https://github.com/Topurrra/themissingmanual\n';

  return new Response(out, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'max-age=3600' }
  });
}
