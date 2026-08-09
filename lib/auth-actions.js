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
// `after` is where the person was headed before we made them sign out, and it
// is an ENUM, never a URL. It arrives from a client component, so treating it
// as a destination would be an open redirect; /login maps the one accepted
// value to a hard-coded link of its own.
export async function logoutEverywhere(after) {
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
  // Doubles as the "and then what" marker so /login can offer one obvious way
  // onward. A second cookie would have meant a second thing to keep in step
  // for no gain: both facts describe the same round trip and expire together.
  // Any value at all means "just signed out"; the specific value 'rush' also
  // means "was on their way to rush signup".
  const jar = await cookies()
  jar.set('ktp_signed_out', after === 'rush' ? 'rush' : '1', {
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

// "This isn't me" — the escape hatch on the already-signed-in chooser shown by
// /login and /auth/start (components/auth/AlreadySignedIn).
//
// Deliberately NOT logoutEverywhere(). Ending Authentik's session is the wrong
// move here, because the whole reason the chooser exists is that Authentik's
// session may already belong to the OTHER person — someone who just enrolled
// through rush on a browser where a member was still signed in. Their brand
// new account is what Authentik is holding; destroying it would make them
// sign up or sign in from scratch. So this clears only our own cookie.
//
// The sign-in it hands off to uses prompt=login (see AutoSignIn), which is
// what makes this deterministic rather than a coin flip: Authentik is forced
// to ask who is at the keyboard instead of silently reusing whichever session
// it happens to be holding. Without that, clearing our cookie and signing back
// in could land on the same account we were just told wasn't theirs — and on
// /auth/start that is a loop, not just a wrong answer.
export async function switchAccount() {
  await signOut({ redirect: false })
  redirect('/login?switch=1')
}
