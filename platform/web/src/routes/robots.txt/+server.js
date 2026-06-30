// robots.txt - allow everything, point crawlers at the sitemap, and declare
// AI-usage preferences via Content Signals (contentsignals.org). Fully open:
// this is free educational content meant to be read, indexed, and learned from.
export function GET({ url }) {
  const body = `User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
Disallow: /admin

Sitemap: ${url.origin}/sitemap.xml
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
