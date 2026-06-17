import { listTracks } from '$lib/api.js';

export async function load({ fetch }) {
  const tracks = (await listTracks(fetch)) ?? [];
  return { tracks };
}
