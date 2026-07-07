'use server'

import { signOut } from '@/auth'
import { redirect } from 'next/navigation'
import { getIdToken } from './id-token'

// NextAuth's signOut() only clears our own session cookie — Authentik's own
// SSO session survives, so a subsequent sign-in silently re-authenticates as
// the same account with no credential prompt. This does a full RP-initiated
// logout: clear our session, then send the browser to Authentik's
// end-session endpoint (with id_token_hint) so it drops its session too.
export async function logoutEverywhere() {
  const idToken = await getIdToken()

  const params = new URLSearchParams({
    post_logout_redirect_uri: `${process.env.AUTH_URL}/login`,
  })
  if (idToken) params.set('id_token_hint', idToken)

  await signOut({ redirect: false })
  redirect(`${process.env.AUTHENTIK_ISSUER}end-session/?${params.toString()}`)
}
