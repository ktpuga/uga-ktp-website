import { headers } from "next/headers";
import { getAccessToken } from "@/lib/access-token";

const API_URL = process.env.API_URL;

// Browsers can't attach an Authorization header to <img>/<video> src
// requests, so this route runs server-side, attaches the Bearer token
// (if the viewer is signed in), and streams ktp-api's response straight
// through — including the Range header, so video seeking still works.
export async function GET(request, { params }) {
  const { id } = await params;
  const accessToken = await getAccessToken();
  const range = (await headers()).get("range");

  const fetchHeaders = {};
  if (accessToken) fetchHeaders.Authorization = `Bearer ${accessToken}`;
  if (range) fetchHeaders.Range = range;

  let apiRes;
  try {
    apiRes = await fetch(`${API_URL}/photos/${id}/media`, { headers: fetchHeaders });
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
