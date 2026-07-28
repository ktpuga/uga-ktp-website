// Public — no access token needed, same reasoning as the homepage-photos
// media proxy: still routed through the website's own server rather than
// exposing ktp-api/Immich's address directly to the browser.
const API_URL = process.env.API_URL;

export async function GET(request, { params }) {
  const { id } = await params;
  const range = request.headers.get("range");

  const fetchHeaders = {};
  if (range) fetchHeaders.Range = range;

  let apiRes;
  try {
    apiRes = await fetch(`${API_URL}/roster/${id}/media`, { headers: fetchHeaders });
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
