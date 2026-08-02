// Public by design — no access token, matching app/api/homepage-photos.
//
// A calendar client cannot log in, hold a session, or refresh a token: it just
// re-fetches a URL it stored months ago. So the token in the path IS the
// credential, and ktp-api resolves it to a member and filters events to what
// that member can see. Adding auth here would break the only client this
// endpoint exists for.
//
// There is no generic /api/* rewrite in this app — every proxied path is an
// explicit route handler like this one — so this file is what makes the
// subscription URL work at all.
const API_URL = process.env.API_URL;

// The feed changes whenever an event does, and clients poll it directly.
// Caching it at the framework layer would serve a stale calendar for as long
// as the cache lived, on top of the client's own refresh delay.
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { token } = await params;

  let apiRes;
  try {
    apiRes = await fetch(`${API_URL}/calendar/feed/${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
  } catch {
    return new Response("Could not reach the server", { status: 502 });
  }

  const body = await apiRes.text();

  if (!apiRes.ok) {
    // Plain text, not JSON: the caller is a calendar app, and some of them
    // surface the raw body to the user when a subscription fails.
    return new Response(body || "Calendar not found", {
      status: apiRes.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="ktp.ics"',
      "Cache-Control": "no-cache, must-revalidate",
    },
  });
}
