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
    jwt({ token, profile }) {
      if (profile) {
        console.log("[auth] profile claims from Authentik:", JSON.stringify(profile, null, 2))
        if (profile.groups) token.groups = profile.groups
      }
      return token
    },
    session({ session, token }) {
      ;(session.user as any).groups = (token.groups as string[]) ?? []
      return session
    },
  },
  pages: { signIn: "/login" },
})
