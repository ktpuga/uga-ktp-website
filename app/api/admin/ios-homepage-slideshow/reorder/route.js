import { proxyAdminApi, requireEboardAccess } from '@/lib/admin-proxy';
// iOS homepage slideshow API proxy.

export async function PUT(request) {
  const access = await requireEboardAccess();
  if (!access.ok) return access.response;

  const body = await request.json();
  const response = await proxyAdminApi('/ios-homepage-photos/reorder', {
    accessToken: access.accessToken,
    method: 'PUT',
    body: JSON.stringify(body),
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) return Response.json(payload, { status: response.status });
  if (response.status === 204) return new Response(null, { status: 204 });
  return Response.json(payload);
}
