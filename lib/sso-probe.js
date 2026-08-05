// A silent `prompt=none` probe that finds no Authentik session comes back to
// /login?error=… — byte for byte what a genuine sign-in failure looks like,
// because Auth.js reports only its own error *type* and never the provider's
// `login_required`. This cookie is how the two are told apart: without it,
// every prospective rushee who has never had an account is greeted by a red
// "we couldn't sign you in" banner describing the expected outcome.
//
// A cookie rather than sessionStorage because the decision is made while
// rendering /login on the server.
export const SSO_PROBE_COOKIE = 'ktp_sso_probe';

// SameSite=Lax so it survives the top-level redirect back from Authentik.
// Short-lived: it describes one in-flight round trip, not a preference.
export function markProbeStarted() {
  document.cookie = `${SSO_PROBE_COOKIE}=1; path=/; max-age=120; samesite=lax`;
}

export function clearProbeMark() {
  document.cookie = `${SSO_PROBE_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
