import { proxyAdminApi, requireEboardAccess } from '@/lib/admin-proxy';
// iOS homepage slideshow API proxy.

async function asJsonResponse(response) {
  if (!(response instanceof Response)) return response;

  const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) return Response.json(payload, { status: response.status });
  if (response.status === 204) return new Response(null, { status: 204 });
  return Response.json(payload);
}

export async function GET() {
  const access = await requireEboardAccess();
  if (!access.ok) return access.response;

  const response = await proxyAdminApi('/ios-homepage-slides', { accessToken: access.accessToken });
  return asJsonResponse(response);
}

export async function POST(request) {
  const access = await requireEboardAccess();
  if (!access.ok) return access.response;

  const formData = await request.formData();
  const response = await proxyAdminApi('/ios-homepage-slides', {
    accessToken: access.accessToken,
    method: 'POST',
    body: formData,
  });

  return asJsonResponse(response);
}
