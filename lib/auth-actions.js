'use server'

import { signOut } from '@/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getIdToken } from './id-token'
import { SIGNED_OUT_COOKIE } from './sso'

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
  // It guards exactly ONE render of /login, which then clears it client-side.
  // A Server Component can't delete a cookie, so this is deliberately not
  // httpOnly — it's a UI hint, not a secret, and the worst an attacker can do
  // by forging it is cost someone a click. Leaving it to expire on a timer
  // instead was the bug: a member who signed out, signed back into Authentik
  // and returned inside the window was made to press the button again.
  const jar = await cookies()
  jar.set(SIGNED_OUT_COOKIE, '1', {
    maxAge: 120,
    path: '/',
    httpOnly: false,
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
