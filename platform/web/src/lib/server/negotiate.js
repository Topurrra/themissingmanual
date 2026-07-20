// Content negotiation for "Markdown for Agents" (Accept: text/markdown).
//
// The rule this replaces was `has text/markdown && !has text/html`, which failed every
// well-behaved client: an agent that can read markdown still lists HTML as a fallback,
// so `Accept: text/markdown, text/html;q=0.9` was read as "html present -> send html".
// That is backwards - the q-values say markdown is preferred. Compare weights instead,
// per RFC 9110 section 12.5.1.

/// The effective q-weight for `type`, and whether the client named it explicitly
/// (as opposed to matching it only through a `*/*` or `text/*` wildcard).
function acceptQ(accept, type) {
  const [mainType] = type.split('/');
  let q = 0;
  let explicit = false;
  for (const part of accept.split(',')) {
    const [rawMedia, ...params] = part.trim().split(';');
    const media = rawMedia.trim().toLowerCase();
    const isExact = media === type;
    const isWildcard = media === '*/*' || media === `${mainType}/*`;
    if (!isExact && !isWildcard) continue;

    const qParam = params
      .map((p) => p.trim().toLowerCase())
      .find((p) => p.startsWith('q='));
    const parsed = qParam ? Number(qParam.slice(2)) : 1;
    const weight = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : 1;

    if (weight > q) q = weight;
    if (isExact && weight > 0) explicit = true;
  }
  return { q, explicit };
}

/// True when the client would rather have markdown than HTML.
///
/// A browser sends `text/html,...,*/*;q=0.8` - markdown only matches the wildcard at
/// 0.8 against HTML's 1.0, so browsers always keep getting HTML. An agent that names
/// `text/markdown` at an equal-or-higher weight gets markdown.
export function prefersMarkdown(accept) {
  if (!accept) return false;
  const md = acceptQ(accept, 'text/markdown');
  if (md.q === 0) return false;
  const html = acceptQ(accept, 'text/html');
  // On a tie, only an explicitly-named text/markdown wins - so a bare `*/*` (curl's
  // default, most crawlers) still gets HTML rather than a surprise content type.
  return md.q > html.q || (md.q === html.q && md.explicit);
}
