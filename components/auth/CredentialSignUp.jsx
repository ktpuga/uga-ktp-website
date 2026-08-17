'use client';

// Our own signup form, drawn from the `ktp-enrollment` flow's challenges.
//
// The fields are NOT defined here. Authentik's enrollment prompt owns them —
// UGA email, username, password, confirm password — and `PromptFields` renders
// whatever the challenge describes. So the UGA-domain policy's message arrives
// beside the email input for free, and adding a field in Authentik changes
// this form with no deploy.
//
// Same mechanism as CredentialSignIn: the browser talks to Authentik directly,
// the flow's own user-login stage leaves a session in the browser, and
// next-auth then completes ours. See useFlowExecutor for the hand-off rule.
//
// WHAT THIS DOES NOT REPLACE. Rush invitation QR codes are printed on flyers
// pointing straight at Authentik's own page, and `signup_url` in ktp-api still
// generates that URL. Both entry points work; this one is additive until those
// links are regenerated. Don't remove Authentik's enrollment page.

import { fieldErrors, formError } from '@/lib/authentik-flow';
import { useFlowExecutor } from './useFlowExecutor';
import { buttonClass, FieldError, PromptFields } from './FlowFields';

// Our own origin, for the `next=` on the Authentik fallback below. Read from
// the browser rather than threaded down as a prop because it must match the
// host the person is actually on — ugaktp.com and ktpgeorgia.com both serve
// this page, and a hardcoded one would bounce them across domains mid-signup.
// Guarded for the server pass, where `window` does not exist.
function siteOrigin() {
  return typeof window === 'undefined' ? '' : window.location.origin;
}

export default function CredentialSignUp({ origin, token, slug = 'ktp-enrollment' }) {
  // The flow reads its invitation from the querystring, exactly as it does
  // when Authentik's own page runs it — `itoken` is Authentik's parameter
  // name, not ours, which is what lets an existing invitation link work here
  // by swapping the host and path alone.
  const { challenge, loading, submitting, terminal, submit } = useFlowExecutor({
    origin,
    slug,
    query: token ? `itoken=${encodeURIComponent(token)}` : '',

    // /auth/redirect, NOT /auth/start — and the reason is specific to this
    // path, so read it before "fixing" it back.
    //
    // /auth/start's chooser exists for the OTHER route into enrollment:
    // Authentik's own page with `next=`, where the browser arrives having just
    // created an account at Authentik while our cookie may still hold a
    // DIFFERENT member, and nothing has reconciled the two. Landing that
    // browser straight in a portal put the new rushee into the previous
    // member's account.
    //
    // This path has already reconciled them. When the flow completes, the hook
    // performs a full next-auth sign-in against the Authentik session the
    // enrollment stage just created, so the callback issues OUR session for the
    // account that just enrolled — overwriting any previous one. By the time
    // this callback runs, the session cannot be somebody else's.
    //
    // Sending it to /auth/start anyway produces a chooser asking "is this you?"
    // about an account created two seconds ago, which is what shipped first and
    // is a pure false positive. The fallback below still uses /auth/start,
    // because that path genuinely has not reconciled anything.
    callbackUrl: '/auth/redirect',

    // If this page can't drive the flow, fall back to Authentik's own signup
    // page rather than to signIn() — somebody who has no account yet must not
    // be sent to a login form. This is the exact URL ktp-api generated before
    // /signup existed, `next=` included, so the fallback is the behaviour that
    // was working all along.
    handOffTo: token
      ? `${origin}/if/flow/${encodeURIComponent(slug)}/?itoken=${encodeURIComponent(token)}`
        + `&next=${encodeURIComponent(`${siteOrigin()}/auth/start`)}`
      : null,
  });

  function onSubmit(event) {
    event.preventDefault();
    submit(Object.fromEntries(new FormData(event.currentTarget).entries()));
  }

  if (loading || terminal) {
    return (
      <p className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-center text-sm text-white/70" role="status">
        {terminal === 'handoff' ? 'Taking you to the signup page…' : 'One moment…'}
      </p>
    );
  }

  if (!challenge) return null;

  // An expired, used-up or missing invitation. Authentik's message is written
  // for a person, so show it rather than inventing our own — it distinguishes
  // "expired" from "already used", which we cannot tell apart from here.
  if (challenge.component === 'ak-stage-access-denied') {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-xl border border-red-300/35 bg-red-500/15 px-4 py-3 text-sm text-red-50">
          {challenge.error_message || 'This invitation link is no longer valid.'}
        </p>
        <p className="text-sm text-white/60">
          Rush links expire when rush closes. If you think this one should still
          work, ask whoever sent it to you for a new link.
        </p>
      </div>
    );
  }

  const errors = fieldErrors(challenge);
  const banner = formError(challenge);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {banner && (
        <p className="rounded-xl border border-red-300/35 bg-red-500/15 px-4 py-3 text-sm text-red-50">
          {banner}
        </p>
      )}

      <PromptFields fields={challenge.fields} errors={errors} />

      <button type="submit" disabled={submitting} className={buttonClass}>
        {submitting ? 'Creating your account…' : (challenge.primary_action ?? 'Sign up')}
      </button>

      {/* Nothing to render for a stage with no fields — an invitation stage
          that consumed its token silently, for instance. Submitting an empty
          body is how the flow is advanced past it. */}
      {!challenge.fields?.length && (
        <FieldError message="This step has nothing to fill in. Continue to carry on." />
      )}
    </form>
  );
}
