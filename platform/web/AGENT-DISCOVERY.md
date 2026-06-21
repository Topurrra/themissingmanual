# Agent discovery — what's implemented & what you must do at your DNS host

This site implements the agent-readiness checks that make sense for a free,
public, no-auth content platform. Endpoints below are served by
`src/hooks.server.js` (+ `src/lib/agent-endpoints.js`) and existing routes.

## Implemented in code (live after deploy)

| Endpoint | Purpose |
|---|---|
| `Accept: text/markdown` on `/guides/...` | Markdown for Agents (HTML stays default for browsers) |
| `/robots.txt` | `Content-Signal: search=yes, ai-input=yes, ai-train=yes` |
| `/llms.txt` | llmstxt.org index of every guide |
| `Link:` headers on HTML | `rel="sitemap"`, `rel="describedby"` (llms.txt), `rel="api-catalog"`, and `rel="alternate"; type=text/markdown` on guide pages |
| `/.well-known/api-catalog` | RFC 9727 linkset (application/linkset+json) |
| `/openapi.json` | OpenAPI 3.1 for the public read API |
| `/api/health` | service health (status endpoint for the catalog) |
| `/.well-known/agent-skills/index.json` | Agent Skills Discovery v0.2.0 index |
| `/.well-known/agent-skills/use-the-missing-manual/SKILL.md` | the skill artifact (digest matches the index) |
| WebMCP | `search_guides` tool for in-browser agents (`src/lib/WebMcp.svelte`) |

### Verify after deploy
```bash
SITE=https://YOUR-DOMAIN
curl -s $SITE/robots.txt | grep Content-Signal
curl -s -H 'Accept: text/markdown' $SITE/guides/how-the-internet-works/1 -i | grep -i 'content-type\|x-markdown-tokens'
curl -s $SITE/.well-known/api-catalog -i | grep -i content-type
curl -s $SITE/.well-known/agent-skills/index.json | head
curl -s -I $SITE/ | grep -i '^link'
# then re-run the scanner:
curl -s -X POST https://isitagentready.com/api/scan -H 'content-type: application/json' -d "{\"url\":\"$SITE\"}"
```

## DNS-AID — you must add these records (cannot be done from the codebase)

DNS-AID advertises an agent entrypoint via DNS. This site's entrypoint is the
HTTPS website itself (agents then fetch `/.well-known/api-catalog`, `/llms.txt`,
and the agent-skills index). Add an `HTTPS`/`SVCB` record under the `_agents`
namespace, substituting your real domain:

```dns
; Discovery entrypoint = the website over HTTPS/h2
_index._agents.YOUR-DOMAIN.  3600  IN  HTTPS  1 YOUR-DOMAIN. alpn="h2,http/1.1" port=443
```

Notes:
- Use `HTTPS` (an HTTPS-specific `SVCB`) since the entrypoint is a web origin.
  Priority `1` = ServiceMode. `alpn` and `port` are the connection params.
- Only advertise `_a2a` / `_mcp` sub-records if you actually run an A2A or MCP
  **server** — you currently don't, so don't publish them (a record pointing at
  nothing breaks agents that trust it).
- **Enable DNSSEC** for the zone (one toggle on Cloudflare / Route 53 / most
  hosts). The scanner validates DNS-AID over DNS-over-HTTPS and expects signed,
  authenticated records.

## Deliberately NOT implemented (would be false metadata)

OAuth/OIDC discovery, OAuth Protected Resource, `auth.md`, and the MCP Server
Card all describe authentication or an MCP server this site does not have.
Publishing them would point agents at endpoints that don't exist. Add them only
if/when you build real auth or an MCP server.
