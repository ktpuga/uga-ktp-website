// A client for Authentik's own flow executor API, driven from the BROWSER.
//
// WHY THE BROWSER AND NOT A SERVER ACTION. The password has to reach
// Authentik's origin directly. Proxying it through Next.js would make this app
// a credential-handling surface, and "no application here ever touches a
// password" is the property the whole architecture is built on — it is the
// opening claim of ktp-infra-brief/02-identity-authentik.md. A custom form is
// fine; a custom credential broker is not, and this is the line between them.
//
// WHY IT WORKS AT ALL. Authentik's session cookie is `SameSite=None; Secure`
// (verified against the live instance, 2026-08-16), so it is sent on
// cross-site requests and is SET on auth.ugaktp.com by these fetches. Once the
// flow completes, the browser holds a real Authentik session and the ordinary
// OIDC redirect picks it up with no interaction — which is why this module
// never sees a token either. It establishes a session; next-auth does the rest.
//
// REQUIRES CORS on the Authentik router. `Access-Control-Allow-Origin` for our
// site plus `Access-Control-Allow-Credentials: true`. Without it every call
// here fails at the browser before Authentik is even reached, which is why
// `isNetworkFailure` below is treated as "hand off", not "wrong password".
//
// NO CSRF TOKEN IS NEEDED. Verified: `POST` with `{}` answers 200 with a
// validation error rather than 403. Don't add one speculatively; if a future
// version starts demanding it, the symptom is a 403 on submit only.

// The stages we render ourselves. ANYTHING ELSE HANDS OFF to Authentik's own
// page rather than dead-ending the person — see `fallbackUrl`.
//
// This list is the maintenance cost of the whole feature, and it is worth
// being honest about: adding an MFA or captcha stage to a flow means adding it
// here too, or every sign-in silently reroutes to the page this replaced.
export const HANDLED_COMPONENTS = new Set([
  'ak-stage-identification',
  'ak-stage-password',
  'ak-stage-prompt',
  'ak-stage-invitation',
  // Terminal states, handled by the caller rather than rendered.
  'xak-flow-redirect',
]);

function executorUrl(origin, slug, query = '') {
  // `?query=` carries the original request's querystring into the flow, which
  // is how `next=` survives. Empty is fine for a standalone execution.
  return `${origin}/api/v3/flows/executor/${encodeURIComponent(slug)}/?query=${encodeURIComponent(query)}`;
}

// ⚠ THERE IS DELIBERATELY NO `fallbackUrl` HERE ANY MORE. Read this before
// adding one back.
//
// The obvious escape hatch is `${origin}/if/flow/${slug}/`, Authentik's own
// renderer for the flow. It is WRONG, and it fails in a way that looks like it
// worked: a flow executed directly was not started by an OIDC authorize
// request, so when it finishes Authentik has no redirect to honour and drops
// the person on its own application library. They are now signed in to
// Authentik and still signed out of our site, and going back to the site
// starts the whole thing again — an apparent loop with no error anywhere.
//
// The real "degrade to what exists today" is next-auth's `signIn('authentik')`,
// which is precisely what the SSO button this form replaced always did: it
// goes through /application/o/authorize/, so Authentik has somewhere to send
// them and the callback completes our session too. The fallback lives in
// CredentialSignIn.jsx for that reason — it is a next-auth call, not a URL.

// Both calls resolve to { challenge } or { handoff: true }. Neither throws.
//
// `handoff` rather than `error` for a transport failure is deliberate. A
// missing CORS header, a blocked request and an offline browser are all
// indistinguishable from here, and none of them is something to explain to a
// member — the useful response to all three is "use Authentik's page", which
// still works.
async function call(url, init) {
  let response;
  try {
    response = await fetch(url, {
      credentials: 'include',
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
      ...init,
    });
  } catch {
    return { handoff: true };
  }

  // 4xx from the executor still carries a challenge with `response_errors`;
  // that is a rejected password, not a broken page. Only a server-side failure
  // or an unparseable body is worth handing off for.
  if (response.status >= 500) return { handoff: true };

  try {
    return { challenge: await response.json() };
  } catch {
    return { handoff: true };
  }
}

export function getChallenge(origin, slug, query = '') {
  return call(executorUrl(origin, slug, query), { method: 'GET' });
}

export function submitChallenge(origin, slug, body, query = '') {
  return call(executorUrl(origin, slug, query), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Authentik reports field errors as { field: [{ string, code }] }, plus
// `non_field_errors` for anything not attributable to one input. Flattened to
// { field: message } so a form can put each beside its own input — the same
// shape ktp-api returns as { message, field }, so both halves of the app place
// errors the same way.
//
// Only the FIRST message per field is kept. Authentik can return several and a
// stack of them under one input reads as a broken page rather than a
// correction.
export function fieldErrors(challenge) {
  const errors = challenge?.response_errors;
  if (!errors || typeof errors !== 'object') return {};

  const flattened = {};
  for (const [field, list] of Object.entries(errors)) {
    const first = Array.isArray(list) ? list[0] : list;
    const message = typeof first === 'string' ? first : first?.string;
    if (message) flattened[field] = message;
  }
  return flattened;
}

// The one error that isn't about a particular input. Rendered as a banner.
export function formError(challenge) {
  return fieldErrors(challenge).non_field_errors ?? null;
}
