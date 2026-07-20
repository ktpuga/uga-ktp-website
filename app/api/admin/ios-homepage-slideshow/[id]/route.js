import { proxyAdminApi, requireEboardAccess } from '@/lib/admin-proxy';
// iOS homepage slideshow API proxy.

async function asJsonResponse(response) {
  if (!(response instanceof Response)) return response;

  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) return Response.json(payload, { status: response.status });
  if (response.status === 204) return new Response(null, { status: 204 });
  return Response.json(payload);
}

export async function PUT(request, { params }) {
  const access = await requireEboardAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const body = await request.json();
  const response = await proxyAdminApi(`/ios-homepage-photos/${id}`, {
    accessToken: access.accessToken,
    method: 'PUT',
    body: JSON.stringify(body),
  });

  return asJsonResponse(response);
}

export async function DELETE(request, { params }) {
  const access = await requireEboardAccess();
  if (!access.ok) return access.response;

  const { id } = await params;
  const response = await proxyAdminApi(`/ios-homepage-photos/${id}`, {
    accessToken: access.accessToken,
    method: 'DELETE',
  });

  return asJsonResponse(response);
}
