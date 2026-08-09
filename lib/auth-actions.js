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
//
// :: THE ENDPOINT IS RIGHT; THE PROVIDER SETTING DECIDES WHAT IT DOES ::
//
// `${AUTHENTIK_ISSUER}end-session/` matches the `end_session_endpoint` in
// Authentik's own discovery document exactly (checked 2026-08-09). So if
// signing out leaves people still signed in to Authentik, the URL is not the
// problem — the OAuth2 provider's **Invalidation flow** is.
//
// Authentik ships two, and providers default to the wrong one for our purpose:
//
//   default-provider-invalidation-flow   ends only the APPLICATION session.
//                                        The authentik SSO session survives.
//   default-invalidation-flow            runs a user_logout stage — really
//                                        signs out of authentik. It is this
//                                        instance's brand default, which is
//                                        why /flows/-/default/invalidation/
//                                        redirects to it.
//
// The provider-scoped one is a trap because logout still *looks* like it
// worked: `post_logout_redirect_uri` is honoured and the browser lands back on
// /login. Nothing on our side can detect the difference — a refresh_token is
// not tied to the browser session — and everything downstream depends on it,
// up to and including rush enrollment renaming the account that was still
// signed in. Set Providers → ktpapp → Invalidation flow to
// `default-invalidation-flow`.
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

  await signOut({ redirect: false })

  // Without an id_token_hint there is nothing to send Authentik to. Verified
  // against the live server 2026-08-09: end-session with no hint answers
  //
  //   302 → /if/flow/default-authentication-flow/?…&next=…/end-session/
  //
  // — the LOGIN flow. It can't tell whose session to end, so it asks them to
  // sign in first. Following that would land someone who pressed "sign out" on
  // a login form, still signed in to Authentik, having achieved nothing. Going
  // straight to /login is no worse for the SSO session and far less confusing.
  //
  // The hint is normally present: auth.ts stores it at sign-in and refreshes it
  // with the access token. Missing means the session was already half gone.
  if (!idToken) {
    redirect('/login')
  }

  const params = new URLSearchParams({
    post_logout_redirect_uri: `${process.env.AUTH_URL}/login`,
    id_token_hint: idToken,
  })

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
