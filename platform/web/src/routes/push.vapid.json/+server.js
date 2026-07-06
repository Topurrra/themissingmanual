import { json } from '@sveltejs/kit';
import { getPublicKey } from '$lib/server/push.js';

export async function GET() {
  const publicKey = await getPublicKey();
  return json({ publicKey });
}
