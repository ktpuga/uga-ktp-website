import { headers } from "next/headers"
import { getToken } from "next-auth/jwt"

// Reads the Authentik access token directly from the encrypted session
// cookie, server-side only. The `session()` callback in auth.ts deliberately
// does NOT expose access_token, since anything it returns is also shipped to
// the browser via useSession()/`/api/auth/session`. This is the only way to
// reach it without leaking it to the client.
export async function getAccessToken() {
  const token = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  })

  return token?.access_token ?? null
}
