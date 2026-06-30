import { API_BASE } from '$lib/server/adminApi.js';
import { CHEATSHEETS } from '$lib/cheatsheets.js';

// Match cheat-sheet commands against the query and score by how "command-like"
// the match is. A query that names a command (exact, prefix, or the query starts
// with the command) scores high → we surface commands first. A query that only
// brushes a description scores low → guides stay on top.
function cheatHits(q) {
  const ql = q.trim().toLowerCase();
  if (!ql) return [];
  const out = [];
  for (const s of CHEATSHEETS) {
    const toolMatch = s.name.toLowerCase().includes(ql) || s.id.includes(ql);
    for (const c of s.commands) {
      const cmd = c.cmd.toLowerCase();
      let score = 0;
      if (cmd === ql) score = 100;
      else if (cmd.startsWith(ql)) score = 80;
      else if (ql.startsWith(cmd)) score = 70;
      else if (cmd.includes(ql)) score = 50;
      else if (toolMatch) score = 40;
      else if (c.desc.toLowerCase().includes(ql) || c.example.toLowerCase().includes(ql)) score = 20;
      if (score) out.push({ tool: s.name, toolId: s.id, icon: s.icon, cmd: c.cmd, desc: c.desc, example: c.example, score });
    }
  }
  out.sort((a, b) => b.score - a.score || a.cmd.length - b.cmd.length);
  return out.slice(0, 6);
}

export async function load({ fetch, url }) {
  const q = url.searchParams.get('q') ?? '';
  if (!q.trim()) return { q, hits: [], suggestion: null, cmdHits: [], cmdFirst: false };
  // Fetch the API directly (not $lib/api.js's search(), which drops headers) so we
  // can read the `x-search-suggestion` "did you mean" header off the response.
  const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`);
  const hits = res.ok ? await res.json() : [];
  const suggestion = res.headers.get('x-search-suggestion'); // string | null
  const cmdHits = cheatHits(q);
  const cmdFirst = cmdHits.length > 0 && cmdHits[0].score >= 70; // strong command intent
  return { q, hits: hits ?? [], suggestion, cmdHits, cmdFirst };
}
