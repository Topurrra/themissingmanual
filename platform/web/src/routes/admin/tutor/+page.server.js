import { fail } from '@sveltejs/kit';
import { isAuthed } from '$lib/server/adminApi.js';
import { getConfigMasked, setConfig, tutorStatus, recentLogs } from '$lib/server/tutor.js';

const PROVIDER_IDS = ['groq', 'cerebras', 'mistral', 'openrouter', 'uncloseai'];

export async function load() {
  // The admin +layout.server.js guard already blocks unauthenticated access.
  return { config: getConfigMasked(), status: tutorStatus(), logs: recentLogs(50) };
}

export const actions = {
  save: async ({ request }) => {
    if (!(await isAuthed(request.headers.get('cookie')))) return fail(401, { error: 'Not authorized' });
    const form = await request.formData();
    const providers = {};
    for (const id of PROVIDER_IDS) {
      providers[id] = {
        enabled: form.get(`${id}Enabled`) === 'on',
        model: (form.get(`${id}Model`) ?? '').toString(),
        apiKey: (form.get(`${id}Key`) ?? '').toString()
      };
    }
    setConfig({
      enabled: form.get('enabled') === 'on',
      monthlyCap: form.get('monthlyCap') ?? '',
      cooldownSec: form.get('cooldownSec') ?? '',
      routingMode: (form.get('routingMode') ?? '').toString(),
      systemPrompt: (form.get('systemPrompt') ?? '').toString(),
      providerOrder: (form.get('providerOrder') ?? '').toString().split(',').map((s) => s.trim()).filter(Boolean),
      providers
    });
    return { saved: true };
  }
  // Compare runs client-side against compare.json now (two independent,
  // stoppable slots) - see admin/tutor/compare.json/+server.js.
};
