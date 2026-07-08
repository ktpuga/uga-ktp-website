import { getAccessToken } from "@/lib/access-token";

const API_URL = process.env.API_URL;

// Same idea as the download route, but ktp-api sends Content-Disposition:
// inline for this endpoint, so browsers that can render the file type
// natively (PDF, images) show it directly instead of forcing a save dialog.
export async function GET(request, { params }) {
  const { id } = await params;
  const accessToken = await getAccessToken();

  const fetchHeaders = {};
  if (accessToken) fetchHeaders.Authorization = `Bearer ${accessToken}`;

  let apiRes;
  try {
    apiRes = await fetch(`${API_URL}/documents/${id}/preview`, { headers: fetchHeaders });
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
