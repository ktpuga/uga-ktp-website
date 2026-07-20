import { headers } from 'next/headers';
// iOS homepage slideshow media proxy.
import { proxyAdminMedia, requireEboardAccess } from '@/lib/admin-proxy';

export async function GET(request, { params }) {
  const access = await requireEboardAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const range = request.headers.get('range') ?? (await headers()).get('range');
  const response = await proxyAdminMedia(`/ios-homepage-photos/${id}/media`, {
    accessToken: access.accessToken,
    range,
  });

  if (!(response instanceof Response)) return response;

  if (!response.ok && response.status !== 206) {
    const payload = await response.json().catch(() => ({}));
    return Response.json(payload, { status: response.status });
  }

  const responseHeaders = new Headers();
  for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const value = response.headers.get(key);
    if (value) responseHeaders.set(key, value);
  }

  return new Response(response.body, { status: response.status, headers: responseHeaders });
}
