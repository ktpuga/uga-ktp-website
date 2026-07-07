import { headers } from "next/headers"
import { getToken } from "next-auth/jwt"

// Reads the Authentik id_token directly from the encrypted session cookie,
// server-side only — needed as the id_token_hint for RP-initiated logout.
// Same reasoning as getAccessToken() in access-token.js: the session()
// callback deliberately doesn't expose this, so this is the only way to
// reach it without shipping it to the browser.
export async function getIdToken() {
  const token = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  })

  return token?.id_token ?? null
}
