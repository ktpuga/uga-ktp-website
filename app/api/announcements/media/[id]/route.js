import { headers } from "next/headers";
import { getAccessToken } from "@/lib/access-token";

const API_URL = process.env.API_URL;

// Browsers can't attach an Authorization header to <img>/<video> src requests,
// so this route runs server-side, attaches the Bearer token and streams
// ktp-api's response straight through — including the Range header, which is
// what makes an attached video seekable rather than a full download before it
// plays.
//
// ?board=rush targets the rush board. The two boards share one media table but
// have separate endpoints, each of which refuses ids belonging to the other, so
// a wrong or forged `board` value gets a 404 from the API rather than reaching
// anything. All the authorisation lives there; nothing is decided here.
export async function GET(request, { params }) {
  const { id } = await params;
  const accessToken = await getAccessToken();
  const range = (await headers()).get("range");

  const url = new URL(request.url);
  const base = url.searchParams.get("board") === "rush" ? "rush-announcements" : "announcements";
  const size = url.searchParams.get("size");
  const query = size === "thumbnail" || size === "preview" ? `?size=${size}` : "";

  const fetchHeaders = {};
  if (accessToken) fetchHeaders.Authorization = `Bearer ${accessToken}`;
  if (range) fetchHeaders.Range = range;

  let apiRes;
  try {
    apiRes = await fetch(`${API_URL}/${base}/media/${id}${query}`, { headers: fetchHeaders });
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
