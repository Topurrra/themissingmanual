import { fail } from '@sveltejs/kit';
import { isAuthed } from '$lib/server/adminApi.js';
import { getConfigMasked, setConfig, askStatus, topAsks } from '$lib/server/aisearch.js';

export async function load() {
  // The admin +layout.server.js guard already blocks unauthenticated access.
  return { config: getConfigMasked(), status: askStatus(), topAsks: topAsks(25) };
}

export const actions = {
  save: async ({ request }) => {
    // Defense in depth: actions can run before the layout guard, so re-check auth.
    if (!(await isAuthed(request.headers.get('cookie')))) return fail(401, { error: 'Not authorized' });
    const form = await request.formData();
    setConfig({
      enabled: form.get('enabled') === 'on',
      generate: form.get('generate') === 'on',
      accountId: form.get('accountId') ?? '',
      name: form.get('name') ?? '',
      monthlyCap: form.get('monthlyCap') ?? '',
      token: (form.get('token') ?? '').toString() // blank keeps existing
    });
    return { saved: true };
  }
};
