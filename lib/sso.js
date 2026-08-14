// Client-side state for the two ways into the portal: the silent probe on
// /login, and the deliberate full sign-in on /auth/start.

// A silent `prompt=none` probe that finds no Authentik session comes back to
// /login?error=… — byte for byte what a genuine sign-in failure looks like,
// because Auth.js reports only its own error *type* and never the provider's
// `login_required`. This cookie is how the two are told apart: without it,
// every prospective rushee who has never had an account is greeted by a red
// "we couldn't sign you in" banner describing the expected outcome.
//
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

// Loop guard, kept PER ENTRY POINT. Returns false if this same entry point
// tried very recently — the signature of a redirect loop rather than a person.
//
// The two must NOT share a slot, however tempting it looks. They did at first,
// and it broke the exact journey it was meant to protect: /login probes and
// takes the slot, the visitor clicks through to rush signup and enrols, and
// /auth/start then finds the slot held by a probe that has nothing to do with
// it — so it bounces them back to /login, which now won't probe either.
// Sharing was never needed: /login only ever redirects to Authentik, never to
// /auth/start, so the two cannot ping-pong. Each loop is self-contained and
// each guard catches its own.
//
// Time-boxed rather than once-per-tab: a loop re-enters within milliseconds,
// while a session expiring an hour later deserves a fresh attempt. A permanent
// flag would silently turn auto-sign-in off for the rest of the tab's life.
const ENTRY_COOLDOWN_MS = 30_000;

export function takeAutoSignInSlot(name) {
  const key = `ktp_sso_auto_at_${name}`;

  // sessionStorage throws in some privacy modes. Treating that as "free" is
  // the safe direction: the worst case is one redirect to Authentik, which
  // comes back with ?error= and is caught server-side.
  let lastAt = 0;
  try {
    lastAt = Number(sessionStorage.getItem(key)) || 0;
  } catch {
    lastAt = 0;
  }

  if (Date.now() - lastAt < ENTRY_COOLDOWN_MS) return false;

  try {
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // Ignored — see above.
  }
  return true;
}
