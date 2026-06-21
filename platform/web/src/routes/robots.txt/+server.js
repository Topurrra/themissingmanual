// robots.txt — allow everything, point crawlers at the sitemap.
export function GET({ url }) {
  const body = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${url.origin}/sitemap.xml
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
}
