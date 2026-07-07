// Public — no access token needed at all, since these photos are meant to
// be visible to anonymous visitors on the homepage. Still proxied through
// the website's own server rather than exposing Immich's address directly.
const API_URL = process.env.API_URL;

export async function GET(request, { params }) {
  const { id } = await params;
  const range = request.headers.get("range");

  const fetchHeaders = {};
  if (range) fetchHeaders.Range = range;

  let apiRes;
  try {
    apiRes = await fetch(`${API_URL}/homepage-photos/${id}/media`, { headers: fetchHeaders });
  } catch {
    return Response.json({ message: "Could not reach the server" }, { status: 502 });
  }

  if (!apiRes.ok && apiRes.status !== 206) {
    const err = await apiRes.json().catch(() => ({}));
    return Response.json(err, { status: apiRes.status });
  }

  const responseHeaders = new Headers();
  for (const key of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const value = apiRes.headers.get(key);
    if (value) responseHeaders.set(key, value);
  }

  return new Response(apiRes.body, { status: apiRes.status, headers: responseHeaders });
}
