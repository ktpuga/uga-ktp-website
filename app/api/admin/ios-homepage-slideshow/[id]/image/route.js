import { proxyAdminApi, requireEboardAccess } from '@/lib/admin-proxy';
// iOS homepage slideshow API proxy — image replacement.
//
// Separate from the sibling [id] route because this one is multipart: it swaps
// the picture on an existing slide while its metadata, schedule and position
// stay put. Body carries `file` plus optional focal_x/focal_y, same as create.

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
  const formData = await request.formData();
  const response = await proxyAdminApi(`/ios-homepage-photos/${id}/image`, {
    accessToken: access.accessToken,
    method: 'PUT',
    body: formData,
  });

  return asJsonResponse(response);
}
