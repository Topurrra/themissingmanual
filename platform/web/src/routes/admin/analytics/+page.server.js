import { adminJson } from '$lib/server/adminApi.js';

const EMPTY = {
  views: 0,
  uniqueVisitors: 0,
  searches: 0,
  perDay: [],
  topPaths: [],
  topReferrers: [],
  topSearches: []
};

export async function load({ request, url }) {
  const days = url.searchParams.get('days') || '30';
  const analytics = (await adminJson(request.headers.get('cookie'), `/analytics?days=${days}`, null)) ?? EMPTY;
  return { analytics, days: Number(days) };
}
