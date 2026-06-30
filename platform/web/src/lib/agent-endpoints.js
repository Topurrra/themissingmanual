// Server-only payloads for agent-discovery endpoints (served from hooks.server.js).
import { createHash } from 'node:crypto';

// ── Agent skill: instructions for using the site programmatically.
export const SKILL_MD = `# Use The Missing Manual

The Missing Manual is a free, text-first library of in-depth developer guides -
from how a computer boots up to the internet, databases, and AI. Everything is
public, with no authentication required.

## Search
\`GET /search.json?q={terms}\` → JSON \`{ "hits": [ { "guide_slug", "phase_no", "title", "summary", "snippet" } ], "suggestion": string|null }\`

## Read a guide as Markdown
Any guide page returns Markdown when you send the header \`Accept: text/markdown\`
(HTML stays the default for browsers):
- \`GET /guides/{slug}\`          → the whole guide as Markdown
- \`GET /guides/{slug}/{phase}\`  → a single chapter as Markdown

The approximate token count is returned in the \`x-markdown-tokens\` response header.

## Browse everything
- \`GET /llms.txt\`     → a curated index of every guide, grouped by topic, with links and summaries
- \`GET /sitemap.xml\`  → every URL on the site

## Usage
No auth. Content is free to read, cite, and index - see the \`Content-Signal\`
directive in \`/robots.txt\` (search=yes, ai-input=yes, ai-train=yes).
`;

export const SKILL_DIGEST = 'sha256:' + createHash('sha256').update(SKILL_MD).digest('hex');

// ── RFC 9727 API catalog (application/linkset+json).
export function apiCatalog(origin) {
  return {
    linkset: [
      {
        anchor: `${origin}/`,
        'service-desc': [{ href: `${origin}/openapi.json`, type: 'application/openapi+json' }],
        'service-doc': [{ href: `${origin}/llms.txt`, type: 'text/plain' }],
        status: [{ href: `${origin}/api/health`, type: 'application/json' }]
      }
    ]
  };
}

// ── Agent Skills Discovery index (RFC v0.2.0).
export function skillsIndex(origin) {
  return {
    $schema: 'https://schemas.agentskills.io/discovery/0.2.0/schema.json',
    skills: [
      {
        name: 'use-the-missing-manual',
        type: 'skill-md',
        description:
          'Search, read, and cite The Missing Manual: query /search.json, fetch any guide as Markdown via Accept: text/markdown, and browse the full index at /llms.txt.',
        url: `${origin}/.well-known/agent-skills/use-the-missing-manual/SKILL.md`,
        digest: SKILL_DIGEST
      }
    ]
  };
}

// ── Minimal OpenAPI 3.1 for the public read endpoints. Relative server URL so it
// is origin-independent.
export const OPENAPI = {
  openapi: '3.1.0',
  info: {
    title: 'The Missing Manual - public read API',
    version: '1.0.0',
    description:
      'Read-only, unauthenticated endpoints for discovering and reading guide content. Guide pages also support Accept: text/markdown.'
  },
  servers: [{ url: '/' }],
  paths: {
    '/search.json': {
      get: {
        summary: 'Full-text search across guides',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search terms' }
        ],
        responses: {
          200: {
            description: 'Search hits',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    hits: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          guide_slug: { type: 'string' },
                          phase_no: { type: 'integer' },
                          title: { type: 'string' },
                          summary: { type: 'string' },
                          snippet: { type: 'string' }
                        }
                      }
                    },
                    suggestion: { type: ['string', 'null'] }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/guides/{slug}/{phase}': {
      get: {
        summary: 'A guide chapter (HTML by default, Markdown with Accept: text/markdown)',
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'phase', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: {
            description: 'Guide chapter',
            content: { 'text/html': {}, 'text/markdown': {} }
          }
        }
      }
    },
    '/llms.txt': {
      get: { summary: 'Curated index of all guides (llmstxt.org)', responses: { 200: { description: 'Index', content: { 'text/plain': {} } } } }
    },
    '/sitemap.xml': {
      get: { summary: 'All site URLs', responses: { 200: { description: 'Sitemap', content: { 'application/xml': {} } } } }
    },
    '/api/health': {
      get: { summary: 'Service health', responses: { 200: { description: 'OK', content: { 'application/json': {} } } } }
    }
  }
};
