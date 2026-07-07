import { headers } from "next/headers";
import { getAccessToken } from "@/lib/access-token";

const API_URL = process.env.API_URL;

// Same pattern as app/api/photos/[id]/media — profile pictures are
// members-only (not public like homepage photos), so ktp-api will 401 this
// if the viewer isn't signed in.
export async function GET(request, { params }) {
  const { id } = await params;
  const accessToken = await getAccessToken();
  const range = (await headers()).get("range");

  const fetchHeaders = {};
  if (accessToken) fetchHeaders.Authorization = `Bearer ${accessToken}`;
  if (range) fetchHeaders.Range = range;

  let apiRes;
  try {
    apiRes = await fetch(`${API_URL}/users/${id}/profile-picture/media`, { headers: fetchHeaders });
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
