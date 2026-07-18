// Server-only. Free-tier AI providers for the tutor, adapted from a companion
// project's provider table (same OpenAI-compatible /chat/completions shape for
// all four - one call shape, not four SDKs). Non-streaming: there's no chat UI
// yet to stream tokens to, so a single JSON round-trip is simpler to verify.
//
// Model IDs drift as providers add/retire free models - these are just
// starting defaults, and every field here is overridable from Admin -> Tutor.
export const CLOUD = {
  groq: { name: 'Groq', base: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile', note: 'Fast inference, free tier (rate-limited).', keysUrl: 'https://console.groq.com/keys' },
  cerebras: { name: 'Cerebras', base: 'https://api.cerebras.ai/v1', defaultModel: 'llama-3.3-70b', note: 'Very fast inference, free tier (rate-limited).', keysUrl: 'https://cloud.cerebras.ai' },
  mistral: { name: 'Mistral', base: 'https://api.mistral.ai/v1', defaultModel: 'mistral-small-latest', note: 'Free tier (rate-limited).', keysUrl: 'https://console.mistral.ai/api-keys' },
  openrouter: { name: 'OpenRouter', base: 'https://openrouter.ai/api/v1', defaultModel: 'meta-llama/llama-3.3-70b-instruct:free', note: 'Free-model pool, shared rate limits across all :free models.', keysUrl: 'https://openrouter.ai/keys', headers: { 'X-Title': 'The Missing Manual Tutor' } },
  uncloseai: { name: 'uncloseai', base: 'https://hermes.ai.unturf.com/v1', defaultModel: 'adamo1139/Hermes-3-Llama-3.1-8B-FP8-Dynamic', note: 'Community-run, no key needed - smaller open models, best-effort uptime (no company behind it).', keysUrl: null, noKeyRequired: true },
  // Ollama Cloud is NOT OpenAI-compatible (own /api/chat request/response shape,
  // tool-call arguments already parsed instead of a JSON string) - `kind: 'ollama'`
  // routes it through callOllama()/listOllamaModels() below instead of the
  // generic OpenAI-shaped path. Everything else (config storage, provider order,
  // routing/failover) is generic over CLOUD and needs no changes for a new id.
  ollamacloud: { name: 'Ollama Cloud', kind: 'ollama', base: 'https://ollama.com', defaultModel: 'gpt-oss:120b', note: 'Ollama-hosted cloud models, free tier (usage-based, resets periodically).', keysUrl: 'https://ollama.com/settings/keys' }
};

// A provider is put on cooldown after a failure so routeChat() skips it for a
// while instead of retrying a known-broken provider on every question.
// In-memory only - a restart clears cooldowns, which is fine, they're short.
// Duration is admin-configurable (tutor.js passes it via opts.cooldownMs);
// this default only applies if a caller doesn't specify one.
const DEFAULT_COOLDOWN_MS = 60_000;
const cooldownUntil = new Map();

// A provider that rate-limits us usually says exactly when it will accept traffic again,
// via `Retry-After`. Ignoring it means we either come back too early (burning the next
// request on another 429) or idle a provider that was ready in 2s for the full 60s - and
// on free tiers, 429 is steady state, not an exception. Capped so a buggy or hostile
// header can't bench a provider for hours.
const MAX_COOLDOWN_MS = 15 * 60_000;
export function parseRetryAfter(res) {
  // Spec allows either delta-seconds ("30") or an HTTP date.
  const raw = res?.headers?.get?.('retry-after');
  if (!raw) return 0;
  const secs = Number(raw);
  const ms = Number.isFinite(secs) ? secs * 1000 : Date.parse(raw) - Date.now();
  return ms > 0 ? Math.min(ms, MAX_COOLDOWN_MS) : 0;
}

function isOnCooldown(id) {
  const until = cooldownUntil.get(id);
  return !!until && Date.now() < until;
}
function markCooldown(id, ms) {
  cooldownUntil.set(id, Date.now() + (ms || DEFAULT_COOLDOWN_MS));
}

export function providerStatus() {
  return Object.keys(CLOUD).map((id) => ({
    id,
    onCooldown: isOnCooldown(id),
    cooldownRemainingMs: isOnCooldown(id) ? cooldownUntil.get(id) - Date.now() : 0
  }));
}

// One non-streaming call to a single provider, with the LocalAIs tool-calling
// loop adapted from streaming deltas to plain JSON responses. Throws an Error
// with a `.status` (HTTP status, or 0 for network errors) so routeChat() can
// tell a rate-limit/outage apart from e.g. a bad request.
export async function callProvider(providerId, apiKey, messages, opts = {}) {
  const cfg = CLOUD[providerId];
  if (!cfg) throw Object.assign(new Error(`Unknown provider "${providerId}"`), { status: 0 });
  if (cfg.kind === 'ollama') return callOllama(cfg, apiKey, messages, opts);
  const model = opts.model || cfg.defaultModel;
  const tools = opts.tools || null;
  const execTool = opts.execTool || null;
  const useTools = !!(tools && tools.length && typeof execTool === 'function');
  const msgs = messages.slice();
  const MAX_STEPS = useTools ? 4 : 1;

  for (let step = 0; step < MAX_STEPS; step++) {
    const body = { model, messages: msgs, temperature: 0.4 };
    if (useTools) { body.tools = tools; body.tool_choice = 'auto'; }

    let res;
    try {
      res = await fetch(cfg.base + '/chat/completions', {
        method: 'POST',
        headers: Object.assign({ Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, cfg.headers || {}),
        signal: AbortSignal.timeout(opts.timeoutMs || 20_000)
      , body: JSON.stringify(body) });
    } catch (e) {
      throw Object.assign(new Error(`${cfg.name}: ${e?.name === 'TimeoutError' ? 'timed out' : e?.message || 'network error'}`), { status: 0 });
    }
    if (!res.ok) {
      let detail = res.statusText;
      try { const j = await res.json(); detail = j?.error?.message || j?.error || detail; } catch {}
      throw Object.assign(new Error(`${cfg.name}: ${res.status} ${detail}`), { status: res.status, retryAfterMs: parseRetryAfter(res) });
    }

    const j = await res.json().catch(() => null);
    const choice = j?.choices?.[0];
    const msg = choice?.message || {};
    const toolCalls = msg.tool_calls || [];

    if (useTools && toolCalls.length) {
      msgs.push({ role: 'assistant', content: msg.content || null, tool_calls: toolCalls });
      for (const tc of toolCalls) {
        let args = {};
        try { args = JSON.parse(tc.function?.arguments || '{}'); } catch {}
        let result;
        try { result = await execTool(tc.function?.name, args); } catch (e) { result = `Error: ${e?.message || e}`; }
        msgs.push({ role: 'tool', tool_call_id: tc.id, content: String(result) });
      }
      continue; // re-ask with the tool result appended
    }

    return { content: msg.content || '', usage: j?.usage || null, model };
  }
  throw Object.assign(new Error(`${cfg.name}: too many tool-call round-trips`), { status: 0 });
}

// Ollama's own /api/chat shape: {model, messages, stream}, response is
// {message: {role, content, tool_calls?}, done, ...}, and tool_calls arguments
// arrive already parsed as an object (not a JSON string like OpenAI). Tool
// result messages also skip tool_call_id - Ollama correlates by position.
// Returns the same {content, usage, model} shape as callProvider() above so
// routeChat() and every caller stay provider-agnostic.
async function callOllama(cfg, apiKey, messages, opts) {
  const model = opts.model || cfg.defaultModel;
  const tools = opts.tools || null;
  const execTool = opts.execTool || null;
  const useTools = !!(tools && tools.length && typeof execTool === 'function');
  const msgs = messages.slice();
  const MAX_STEPS = useTools ? 4 : 1;

  for (let step = 0; step < MAX_STEPS; step++) {
    const body = { model, messages: msgs, stream: false };
    if (useTools) body.tools = tools;

    let res;
    try {
      res = await fetch(cfg.base + '/api/chat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(opts.timeoutMs || 20_000),
        body: JSON.stringify(body)
      });
    } catch (e) {
      throw Object.assign(new Error(`${cfg.name}: ${e?.name === 'TimeoutError' ? 'timed out' : e?.message || 'network error'}`), { status: 0 });
    }
    if (!res.ok) {
      let detail = res.statusText;
      try { const j = await res.json(); detail = j?.error || detail; } catch {}
      throw Object.assign(new Error(`${cfg.name}: ${res.status} ${detail}`), { status: res.status, retryAfterMs: parseRetryAfter(res) });
    }

    const j = await res.json().catch(() => null);
    const msg = j?.message || {};
    const toolCalls = msg.tool_calls || [];

    if (useTools && toolCalls.length) {
      msgs.push({ role: 'assistant', content: msg.content || null, tool_calls: toolCalls });
      for (const tc of toolCalls) {
        const args = tc.function?.arguments || {};
        let result;
        try { result = await execTool(tc.function?.name, args); } catch (e) { result = `Error: ${e?.message || e}`; }
        msgs.push({ role: 'tool', content: String(result) });
      }
      continue;
    }

    const usage = (j?.prompt_eval_count != null || j?.eval_count != null)
      ? { prompt_tokens: j.prompt_eval_count || 0, completion_tokens: j.eval_count || 0, total_tokens: (j.prompt_eval_count || 0) + (j.eval_count || 0) }
      : null;
    return { content: msg.content || '', usage, model };
  }
  throw Object.assign(new Error(`${cfg.name}: too many tool-call round-trips`), { status: 0 });
}

// List models available to this key, adapted from LocalAIs's listCloudModels().
// "free" is only meaningful for OpenRouter, whose catalog genuinely mixes free
// and paid models (the `:free` suffix / zero pricing) - Groq/Cerebras/Mistral
// don't expose a reliable free/paid split on this endpoint, so `free` stays
// null there (their whole free-tier catalog is just "what your key can see").
export async function listModels(providerId, apiKey) {
  const cfg = CLOUD[providerId];
  if (!cfg || !apiKey) return [];
  if (cfg.kind === 'ollama') return listOllamaModels(cfg, apiKey);
  let res;
  try {
    res = await fetch(cfg.base + '/models', {
      headers: Object.assign({ Authorization: `Bearer ${apiKey}` }, cfg.headers || {}),
      signal: AbortSignal.timeout(10_000)
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const j = await res.json().catch(() => null);
  const rows = j?.data || j?.models || [];
  return rows
    .map((m) => {
      const id = m.id || m.name;
      let free = null;
      if (providerId === 'openrouter') {
        const p = m.pricing || {};
        free = id?.endsWith(':free') || (Number(p.prompt) === 0 && Number(p.completion) === 0);
      }
      return { id, free };
    })
    .filter((m) => m.id)
    .sort((a, b) => (a.free === b.free ? a.id.localeCompare(b.id) : a.free ? -1 : 1));
}

// Ollama's native model listing (/api/tags), unrelated shape to the OpenAI
// /models endpoint above - {models: [{model|name, ...}]}, no free/paid split.
async function listOllamaModels(cfg, apiKey) {
  let res;
  try {
    res = await fetch(cfg.base + '/api/tags', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000)
    });
  } catch {
    return [];
  }
  if (!res.ok) return [];
  const j = await res.json().catch(() => null);
  const rows = j?.models || [];
  return rows
    .map((m) => ({ id: m.model || m.name, free: null }))
    .filter((m) => m.id)
    .sort((a, b) => a.id.localeCompare(b.id));
}

// Round-robin start point - advances once per call so consecutive questions
// spread across providers instead of always hammering the one at the front
// of the list. In-memory only; a restart just starts the rotation over.
let rrIndex = 0;

// Try each enabled provider, skipping ones on cooldown, falling through to
// the next on any failure. `providerList` is already filtered/ordered by the
// caller (tutor.js) from admin config - this function just knows how to fail
// over. opts.mode: 'priority' (default) always starts at the front of the
// list; 'roundrobin' rotates the starting point each call, then still fails
// over through the rest of the list in order if that pick doesn't work -
// spreads load across free-tier rate limits instead of exhausting one first.
export async function routeChat(providerList, messages, opts = {}) {
  let order = providerList;
  if (opts.mode === 'roundrobin' && providerList.length > 1) {
    const start = rrIndex % providerList.length;
    order = [...providerList.slice(start), ...providerList.slice(0, start)];
    rrIndex++;
  }
  const attempted = [];
  for (const p of order) {
    if (isOnCooldown(p.id)) { attempted.push({ id: p.id, skipped: 'cooldown' }); continue; }
    try {
      const result = await callProvider(p.id, p.apiKey, messages, { ...opts, model: p.model });
      return { ...result, providerUsed: p.id, attempted };
    } catch (e) {
      // 429 = rate limited, 529 = overloaded (Anthropic's variant). Both mean "come back
      // later" rather than "you sent something invalid", and both are the cases that
      // actually carry Retry-After.
      const backpressure = e.status === 429 || e.status === 529;
      attempted.push({ id: p.id, error: e.message, status: e.status, backpressure });
      // Honor the provider's own Retry-After when it sent one; otherwise fall back to the
      // flat cooldown. A bad request (4xx that isn't a rate limit) likely won't heal by
      // waiting - but treating it identically is still the simplest correct behavior:
      // don't hammer a provider that just failed either way.
      markCooldown(p.id, e.retryAfterMs || opts.cooldownMs);
    }
  }
  throw Object.assign(new Error('All configured providers failed or are on cooldown.'), { attempted });
}
