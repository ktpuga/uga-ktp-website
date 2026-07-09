import { getAccessToken } from "@/lib/access-token";

const API_URL = process.env.API_URL;

// Browsers can't attach an Authorization header to a plain <a href> download
// link, so this route runs server-side, attaches the Bearer token, and
// streams ktp-api's response straight through — including Content-Disposition
// so the browser saves the file under its original name.
export async function GET(request, { params }) {
  const { id } = await params;
  const accessToken = await getAccessToken();

  const fetchHeaders = {};
  if (accessToken) fetchHeaders.Authorization = `Bearer ${accessToken}`;

  let apiRes;
  try {
    apiRes = await fetch(`${API_URL}/documents/${id}/download`, { headers: fetchHeaders });
  } catch {
    return Response.json({ message: "Could not reach the server" }, { status: 502 });
  }

  if (!apiRes.ok) {
    const err = await apiRes.json().catch(() => ({}));
    return Response.json(err, { status: apiRes.status });
  }

  const responseHeaders = new Headers();
  for (const key of ["content-type", "content-length", "content-disposition"]) {
    const value = apiRes.headers.get(key);
    if (value) responseHeaders.set(key, value);
  }

  return new Response(apiRes.body, { status: apiRes.status, headers: responseHeaders });
}
