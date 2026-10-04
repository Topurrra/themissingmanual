import { redirect } from '@sveltejs/kit';

export function GET() {
  throw redirect(308, '/additional-info?tab=privacy');
}
