// robots.txt - allow everything, point crawlers at the sitemap, and declare
// AI-usage preferences via Content Signals (contentsignals.org). Fully open:
// this is free educational content meant to be read, indexed, and learned from.
export function GET({ url }) {
  // AI crawlers named explicitly: several don't honor Content-Signal alone,
  // and an explicit Allow group is an unambiguous welcome signal for citation.
  const AI_BOTS = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web',
    'PerplexityBot', 'Google-Extended', 'CCBot', 'Applebot-Extended', 'Meta-ExternalAgent'
  ];
  const aiGroups = AI_BOTS.map((b) => `User-agent: ${b}\nAllow: /\nDisallow: /admin\n`).join('\n');
  const body = `User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Disallow: /admin

${aiGroups}
Sitemap: ${url.origin}/sitemap.xml
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
