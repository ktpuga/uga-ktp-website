// Client-side markers shared by the two ways into the portal: the silent
// probe on /login, and the deliberate full sign-in on /auth/start.

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

// Set by logoutEverywhere so /login doesn't immediately undo a sign-out.
export const SIGNED_OUT_COOKIE = 'ktp_signed_out';

// SameSite=Lax so it survives the top-level redirect back from Authentik.
// Short-lived: it describes one in-flight round trip, not a preference.
export function markProbeStarted() {
  document.cookie = `${SSO_PROBE_COOKIE}=1; path=/; max-age=120; samesite=lax`;
}

// Both marks exist to be read by a single server render of /login, and both
// cause a wrong answer if they outlive it: a stale probe mark hides a real
// error, and a stale sign-out mark makes signing back in take a needless
// click. Clearing them once that render has happened is the whole contract.
export function clearEntryMarks() {
  document.cookie = `${SSO_PROBE_COOKIE}=; path=/; max-age=0; samesite=lax`;
  document.cookie = `${SIGNED_OUT_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

// One shared loop guard for both entry points. Returns false when either of
// them tried very recently — the signature of a redirect loop rather than of
// a person.
//
// Time-boxed rather than once-per-tab: a loop re-enters within milliseconds,
// while a session expiring an hour later deserves a fresh attempt. A permanent
// flag would silently turn auto-sign-in off for the rest of the tab's life.
const ENTRY_KEY = 'ktp_sso_auto_at';
const ENTRY_COOLDOWN_MS = 30_000;

export function takeAutoSignInSlot() {
  // sessionStorage throws in some privacy modes. Treating that as "free" is
  // the safe direction: the worst case is one redirect to Authentik, which
  // comes back with ?error= and is caught server-side.
  let lastAt = 0;
  try {
    lastAt = Number(sessionStorage.getItem(ENTRY_KEY)) || 0;
  } catch {
    lastAt = 0;
  }

  if (Date.now() - lastAt < ENTRY_COOLDOWN_MS) return false;

  try {
    sessionStorage.setItem(ENTRY_KEY, String(Date.now()));
  } catch {
    // Ignored — see above.
  }
  return true;
}
