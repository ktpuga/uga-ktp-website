import { proxyAdminApi, requireEboardAccess } from '@/lib/admin-proxy';

// Lets eboard choose an existing chapter photo for an iOS slideshow slide.
export async function GET() {
  const access = await requireEboardAccess();
  if (!access.ok) return access.response;

  const response = await proxyAdminApi('/photos', { accessToken: access.accessToken });
  const payload = response.status === 204 ? [] : await response.json().catch(() => ({}));
  if (!response.ok) return Response.json(payload, { status: response.status });
  return Response.json(payload);
}
