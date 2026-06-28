import NextAuth from "next-auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    {
      id: "authentik",
      name: "Authentik",
      type: "oidc",
      issuer: process.env.AUTHENTIK_ISSUER,
      clientId: process.env.AUTHENTIK_CLIENT_ID,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET,
      authorization: { params: { scope: "openid email profile groups" } },
    },
  ],
  callbacks: {
    async jwt({ token, profile, account, trigger }) {
      // First sign-in: profile and account are present
      if (profile && account) {
        token.sub = profile.sub as string
        token.groups = (profile.groups as string[]) ?? []
        token.access_token = account.access_token

        // Pick the highest-priority group as member_group in the DB
        const groupPriority = ["eboard", "chair", "active", "pledge", "alumni"]
        const memberGroup = groupPriority.find((g) =>
          (token.groups as string[]).includes(g)
        ) ?? null

        // Create or update the user row in the DB
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
              member_group: memberGroup,
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

      // Client called update() — re-fetch profile_complete from the API
      // so the session reflects the latest state without a full re-login
      if (trigger === "update" && token.access_token) {
        try {
          const res = await fetch(`${process.env.API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token.access_token}` },
          })
          if (res.ok) {
            const data = await res.json()
            token.profile_complete = data.profile_complete
          }
        } catch (err) {
          console.error("[auth] failed to refresh profile_complete:", err)
        }
      }

      return token
    },

    session({ session, token }) {
      const user = session.user as any
      user.authentik_id = token.sub
      user.groups = (token.groups as string[]) ?? []
      user.profile_complete = token.profile_complete ?? false
      // Kept on the session object (not user) so it stays server-side accessible
      // but is not part of the public user profile
      ;(session as any).access_token = token.access_token
      return session
    },
  },
  pages: { signIn: "/login" },
})
