import { json } from '@sveltejs/kit';
import { isAuthed } from '$lib/server/adminApi.js';
import { getProviderCreds } from '$lib/server/tutor.js';
import { listModels } from '$lib/server/providers.js';

export async function GET({ url, request }) {
  if (!(await isAuthed(request.headers.get('cookie')))) return json({ error: 'unauthorized' }, { status: 401 });
  const provider = url.searchParams.get('provider') || '';
  const creds = getProviderCreds(provider);
  if (!creds?.apiKey) return json({ models: [], error: 'no_key' });
  const models = await listModels(provider, creds.apiKey);
  return json({ models, error: models.length ? undefined : 'empty' });
}
