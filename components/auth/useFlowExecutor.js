'use client';

// Drives one Authentik flow to completion. Shared by the sign-in form and the
// signup form, which differ only in which stages they draw.
//
// THIS EXISTS SO THE HAND-OFF RULE IS WRITTEN ONCE. The first version of the
// sign-in form fell back to `${origin}/if/flow/${slug}/`, which is wrong in a
// way that reads as a loop rather than an error: a flow opened directly was
// not started by an OIDC authorize request, so Authentik finishes it by
// dropping the person on its own application library — signed in to Authentik,
// still signed out of our site, and back to the beginning on return.
//
// The correct fallback is next-auth's `signIn('authentik')`, which goes through
// /application/o/authorize/ so Authentik has somewhere to send them. A comment
// saying that would not have stopped the second file repeating the mistake;
// a hook that is easier to call than to re-implement does.
//
// See lib/authentik-flow.js for why these calls run in the browser rather than
// through a server action.

import { useCallback, useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { clearProbeMark } from '@/lib/sso';
import { HANDLED_COMPONENTS, getChallenge, submitChallenge } from '@/lib/authentik-flow';

/**
 * @param {object} opts
 * @param {string} opts.origin       Authentik's browser-facing origin
 * @param {string} opts.slug         flow slug, e.g. 'default-authentication-flow'
 * @param {string} [opts.query]      querystring handed to the flow, e.g. 'itoken=…'
 * @param {string} [opts.callbackUrl] where next-auth lands after the flow completes
 * @param {string} [opts.handOffTo]  URL to hand off to instead of signIn()
 */
export function useFlowExecutor({
  origin,
  slug,
  query = '',
  // SIGN-UP MUST OVERRIDE THIS TO '/auth/start'. That page is the only place
  // the "you enrolled on a browser already signed in as someone else" guard
  // lives, and rush is exactly where that happens: invitations are non
  // single-use and scanned off flyers, so one phone runs the flow repeatedly.
  // Before that guard existed the new rushee was dropped into the previous
  // member's portal and the member's session was later silently rewritten as
  // the rushee. /auth/redirect has no such check.
  callbackUrl = '/auth/redirect',
  // Sign-in leaves this unset and falls back to signIn(). Sign-up must set it,
  // because signIn() sends someone who has no account yet to a login form —
  // the least useful answer to "the signup form failed to load".
  handOffTo = null,
}) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // A navigation is in flight. STATE, because it decides what renders — the
  // ref below cannot, since changing a ref doesn't re-render and the form
  // would sit visible underneath the redirect.
  const [terminal, setTerminal] = useState(null); // 'handoff' | 'finishing'

  // The same fact as `terminal`, kept as a ref because the guard has to be
  // SYNCHRONOUS: two submits in one tick would both read a stale `terminal`
  // and fire two navigations, the second racing the first.
  const completing = useRef(false);

  const handOff = useCallback(() => {
    if (completing.current) return;
    completing.current = true;
    setTerminal('handoff');

    // Enrollment hands off to Authentik's own signup page, which is a
    // different thing from the bare-flow trap described above: that URL
    // carries `next=`, so the flow DOES return to the site when it finishes.
    // It is exactly the link ktp-api generated before /signup existed, so the
    // fallback is the behaviour that has been working all along.
    if (handOffTo) {
      window.location.href = handOffTo;
      return;
    }
    signIn('authentik', { callbackUrl });
  }, [callbackUrl, handOffTo]);

  // The flow is done and the browser now holds an Authentik session. next-auth
  // picks it up and completes ours.
  //
  // A FULL sign-in, never prompt=none: a brand new account still has to grant
  // first consent, and prompt=none is by definition unable to ask. That is the
  // bug that shipped in the original silent probe — see lib/sso.js.
  const finish = useCallback(() => {
    if (completing.current) return;
    completing.current = true;
    setTerminal('finishing');
    // A deliberate submit, so any later failure is real and must be reported
    // rather than suppressed as "the probe found nobody".
    clearProbeMark();
    signIn('authentik', { callbackUrl });
  }, [callbackUrl]);

  const apply = useCallback(
    (result) => {
      if (result.handoff) return handOff();

      const next = result.challenge;
      if (!next?.component) return handOff();
      if (next.component === 'xak-flow-redirect') return finish();
      if (!HANDLED_COMPONENTS.has(next.component)) return handOff();

      setChallenge(next);
    },
    [finish, handOff]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getChallenge(origin, slug, query);
      if (cancelled) return;
      setLoading(false);
      apply(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [apply, origin, slug, query]);

  const submit = useCallback(
    async (body) => {
      if (completing.current) return;
      setSubmitting(true);
      const result = await submitChallenge(origin, slug, body, query);
      setSubmitting(false);
      apply(result);
    },
    [apply, origin, slug, query]
  );

  return { challenge, loading, submitting, terminal, submit, handOff };
}
