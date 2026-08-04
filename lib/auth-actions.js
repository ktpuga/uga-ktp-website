'use server'

import { signOut } from '@/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getIdToken } from './id-token'

// NextAuth's signOut() only clears our own session cookie — Authentik's own
// SSO session survives, so a subsequent sign-in silently re-authenticates as
// the same account with no credential prompt. This does a full RP-initiated
// logout: clear our session, then send the browser to Authentik's
// end-session endpoint (with id_token_hint) so it drops its session too.
export async function logoutEverywhere() {
  const idToken = await getIdToken()

  // This marker is REQUIRED, not cosmetic: /login auto-starts SSO on arrival,
  // so landing there bare would immediately sign the user back in and make
  // signing out impossible. See app/login/page.jsx.
  //
  // A cookie rather than a ?signedout=1 query param on the redirect below,
  // because Authentik validates post_logout_redirect_uri against the
  // provider's configured URI list — adding a query string risks breaking
  // logout outright, and this needs no Authentik configuration at all.
  //
  // Short-lived and self-expiring: a Server Component can't delete cookies
  // (cookies() is read-only outside actions/route handlers), so /login can't
  // clear it after reading. Two minutes is long enough to survive the round
  // trip through Authentik's end-session endpoint and short enough that the
  // next real visit auto-signs-in normally.
  const jar = await cookies()
  jar.set('ktp_signed_out', '1', {
    maxAge: 120,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  const params = new URLSearchParams({
    post_logout_redirect_uri: `${process.env.AUTH_URL}/login`,
  })
  if (idToken) params.set('id_token_hint', idToken)

  await signOut({ redirect: false })
  redirect(`${process.env.AUTHENTIK_ISSUER}end-session/?${params.toString()}`)
}
