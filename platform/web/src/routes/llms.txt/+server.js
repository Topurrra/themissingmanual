import { listGuides, listCategories } from '$lib/api.js';

// llms.txt (llmstxt.org): a curated, link-first index of the guide library for
// LLMs/agents. Every guide page is also available as Markdown via Accept: text/markdown.
export async function GET({ fetch, url }) {
  const origin = url.origin;
  const guides = (await listGuides(fetch)) ?? [];
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
    'computer boots up to the internet, databases, and AI. Every guide page is also available ' +
    'as Markdown by requesting it with the `Accept: text/markdown` header.\n\n';

  for (const slug of order) {
    out += `## ${name[slug] || slug}\n`;
    for (const g of byCat[slug]) out += `- [${g.title}](${origin}/guides/${g.slug}): ${g.summary}\n`;
    out += '\n';
  }

  out +=
    '## Reference\n' +
    `- [Cheat Sheet](${origin}/cheat-sheet): copy-paste command reference for Git, Bash, Docker, SQL, regex, jq, and more.\n` +
    `- [Glossary](${origin}/glossary): plain-language definitions of the terms used across the guides.\n\n` +
    '## For agents\n' +
    'Every guide page is also available as clean Markdown via the `Accept: text/markdown` header.\n' +
    `MCP server (Streamable HTTP, read-only): \`${origin}/mcp\` - tools: search_guides, read_guide.\n` +
    `Full text of every guide in one file: ${origin}/llms-full.txt\n\n`;

  return new Response(out, {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'max-age=3600' }
  });
}
