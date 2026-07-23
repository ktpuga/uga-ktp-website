import NextAuth from "next-auth"

// Authentik access tokens are short-lived — without this, every session
// silently breaks once the access token expires: ktp-api starts rejecting it
// ("exp" claim check failed), apiRequest() sees the 401 and redirect()s to
// /login, but the NextAuth session cookie itself is still valid so /login
// immediately redirect()s back into the app, which hits the same expired
// token again — an infinite bounce that has nothing to do with login itself.
//
// Pages like PortalDashboard fire several server actions in parallel
// (Promise.all), each independently calling auth() and so each independently
// deciding the token needs refreshing at nearly the same instant. Authentik
// rotates refresh tokens on use, so whichever request wins invalidates the
// refresh token for the others — they'd fail and flag an error even though
// one of them actually succeeded, and depending on response ordering the
// browser could end up with the failed result.
//
// A second, separate race: middleware refreshes and updates the cookie
// before a page's own Server Components/Actions run, but those *within the
// same request* still see the original (pre-refresh) cookie — Next.js
// doesn't let middleware's Set-Cookie retroactively affect what the same
// request's page rendering reads, only future requests. So the page's own
// auth() call sees the same stale expires_at, tries to refresh *again*, and
// gets rejected because Authentik already rotated that refresh token out
// from under it moments earlier — a false failure even though the browser
// is about to receive a perfectly valid session from middleware's update.
//
// Keeping a completed result (success or failure) cached for a few seconds
// after it resolves — not just de-duping truly concurrent calls — fixes
// both: any call using the same (now-rotated) refresh token within that
// window reuses the already-resolved outcome instead of hitting Authentik
// again and hitting a false "already used" rejection.
const inFlightRefreshes = new Map<string, Promise<any>>()

async function refreshAccessToken(token: any) {
  const refreshToken = token.refresh_token as string
  const existing = inFlightRefreshes.get(refreshToken)
  if (existing) return existing

  const promise = (async () => {
    try {
      const response = await fetch("https://auth.ugaktp.com/application/o/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.AUTHENTIK_CLIENT_ID as string,
          client_secret: process.env.AUTHENTIK_CLIENT_SECRET as string,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      })

      const refreshed = await response.json()
      if (!response.ok) throw refreshed

      return {
        ...token,
        access_token: refreshed.access_token,
        expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in,
        refresh_token: refreshed.refresh_token ?? token.refresh_token,
        error: undefined,
      }
    } catch (err) {
      console.error("[auth] failed to refresh access token:", err)
      return { ...token, error: "RefreshAccessTokenError" }
    }
  })()

  inFlightRefreshes.set(refreshToken, promise)
  // Delay cleanup instead of removing immediately — see comment above.
  promise.finally(() => {
    setTimeout(() => inFlightRefreshes.delete(refreshToken), 10000)
  })
  return promise
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    {
      id: "authentik",
      name: "Authentik",
      type: "oidc",
      issuer: process.env.AUTHENTIK_ISSUER,
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
      // offline_access is the standard OIDC scope for requesting a
      // refresh_token — without it, some providers omit it from the token
      // response entirely, which would silently break refreshAccessToken().
      authorization: { params: { scope: "openid email profile groups offline_access" } },
      checks: [],
    },
  ],
  callbacks: {
    async jwt({ token, profile, account, trigger, session }) {
      // First sign-in: profile and account are present
      if (profile && account) {
        token.sub = profile.sub as string
        token.groups = (profile.groups as string[]) ?? []
        token.access_token = account.access_token
        token.id_token = account.id_token
        token.refresh_token = account.refresh_token
        token.expires_at = account.expires_at

        // Create or update the user row in the DB. member_group isn't sent
        // here — ktp-api's own syncUser resolves it server-side from the
        // verified token's groups claim (never trusts a client-submitted
        // value for anything auth-related).
        try {
          const res = await fetch(`${process.env.API_URL}/users/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${account.access_token}`,
            },
            body: JSON.stringify({
              authentik_id: token.sub,
              username: profile.preferred_username ?? profile.sub,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            token.profile_complete = data.profile_complete
          }
        } catch (err) {
          console.error("[auth] failed to sync user with API:", err)
          token.profile_complete = false
        }
      }

      // Client called update({ profile_complete: true }) after saving profile
      if (trigger === "update" && session?.profile_complete !== undefined) {
        token.profile_complete = session.profile_complete
      }

      // Access token still valid — nothing to do.
      if (token.expires_at && Date.now() < (token.expires_at as number) * 1000) {
        return token
      }

      // Expired (or we never got an expiry) — refresh it if we can.
      if (token.refresh_token) {
        return refreshAccessToken(token)
      }

      // No refresh_token at all — either a session from before this refresh
      // mechanism existed, or the IdP never issued one. We can't confirm the
      // access token is still valid and can't renew it, so force a real
      // re-login instead of silently trusting an unverifiable token forever
      // (which otherwise loops: middleware lets it through with no error,
      // the stale token 401s against ktp-api, /login sees the same
      // no-error token and bounces right back in).
      return { ...token, error: "RefreshAccessTokenError" }
    },

    session({ session, token }) {
      const user = session.user as any
      user.authentik_id = token.sub
      user.groups = (token.groups as string[]) ?? []
      user.profile_complete = token.profile_complete ?? false
      // access_token intentionally left off the session object — this callback
      // backs both useSession() and auth(), so anything added here is shipped
      // to the browser. Server code reads it via lib/access-token.js instead.
      // error is just a status flag (set when a refresh attempt failed), not
      // a secret, so it's fine to expose — callers use it to force a clean
      // re-login instead of retrying with a token we know is dead.
      ;(session as any).error = token.error
      return session
    },
  },
  pages: { signIn: "/login" },
})
