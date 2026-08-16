import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import SignInButton from '@/components/auth/SignInButton';
import CredentialSignIn from '@/components/auth/CredentialSignIn';
import SilentSignIn from '@/components/auth/SilentSignIn';
import AutoSignIn from '@/components/auth/AutoSignIn';
import AlreadySignedIn from '@/components/auth/AlreadySignedIn';
import { SSO_PROBE_COOKIE } from '@/lib/sso';

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to the Kappa Theta Pi at UGA member portal.',
  robots: { index: false, follow: false },
};

export default async function Login({ searchParams }) {
  const session = await auth();
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();

  // Sent here by switchAccount(), which has just cleared our cookie and is
  // handing off the actual sign-in. prompt=login forces Authentik to ask for
  // credentials rather than silently reusing whatever session it holds —
  // without that, "sign in as someone else" would hand back the very account
  // the person just said wasn't theirs.
  const switching = params.switch === '1';

  // session.error means a token refresh already failed (see auth.ts) — treat
  // that as not really logged in, otherwise this bounces straight back into
  // the app, which immediately hits the same dead token and redirects here
  // again, looping forever instead of just showing the sign-in button.
  //
  // A HEALTHY session no longer redirect()s to /auth/redirect. That was
  // convenient for the owner of the session and a dead end for anyone else:
  // a second person on the same browser was dropped into the first person's
  // portal with no way to sign in as themselves short of finding the other
  // person's sign-out button. What they did instead was sign in at Authentik
  // directly, which is precisely how the two sessions ended up disagreeing
  // and how accounts got overwritten. One click on the chooser replaces that.
  const alreadySignedIn = Boolean(session && !session.error) && !switching;

  // Auto-start the silent SSO probe unless doing so would loop or override a
  // choice. Every suppression here is load bearing:
  //
  //   ?error=…            NextAuth sends failures back here. Auto-retrying a
  //                       flow that just failed is an infinite redirect
  //                       between us and Authentik, and the visitor never
  //                       sees why it broke.
  //   ktp_signed_out=1    Set by logoutEverywhere. Without it, "sign out"
  //                       lands here and is immediately undone — and if
  //                       Authentik's session somehow survived, signing out
  //                       becomes impossible.
  //   ?switch=1           The probe is the opposite of what a switch wants:
  //                       prompt=none reuses Authentik's existing session
  //                       silently, which is the account being switched away
  //                       from. AutoSignIn handles this case instead.
  //   a healthy session    That renders the chooser, and a probe underneath it
  //                       would race the person's own choice.
  const failed = Boolean(params.error);
  const justSignedOut = cookieStore.get('ktp_signed_out')?.value === '1';
  const autoStart = !failed && !justSignedOut && !switching && !alreadySignedIn;

  // A probe that found no session reports itself exactly like a broken
  // sign-in, so "no account yet" would otherwise be announced in red as an
  // error. That's the single most common way to arrive here now.
  const probeCameBackEmpty = failed && cookieStore.get(SSO_PROBE_COOKIE)?.value === '1';

  // Authentik's browser-facing origin, derived from the one URL that already
  // has to be right rather than duplicated into a NEXT_PUBLIC_ variable. The
  // issuer is server-only, so the origin is passed down as a prop — that keeps
  // a single source of truth and means a wrong value fails at build, not in
  // somebody's browser.
  //
  // Falls back to the SSO button if it isn't configured: a login page that
  // renders no way to log in is worse than the button this replaced.
  let authentikOrigin = null;
  try {
    authentikOrigin = new URL(process.env.AUTHENTIK_ISSUER).origin;
  } catch {
    authentikOrigin = null;
  }

  const signInOptions = (
    <div>
      {authentikOrigin ? <CredentialSignIn origin={authentikOrigin} /> : <SignInButton />}

      <div className="mt-6 border-t border-white/15 pt-6 text-center">
        <p className="text-sm text-white/60">Not a member yet?</p>
        <Link
          href="/rush/how-it-works"
          className="mt-3 block w-full rounded-md border border-white/25 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
        >
          Sign up for rush
        </Link>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#14326E' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="inline-flex items-center justify-center mb-6">
            <Image
              src="/KTP PHI CHAPTER.svg"
              alt="Kappa Theta Pi - Phi Chapter"
              width={180}
              height={92}
              priority
              style={{
                filter: 'brightness(0) invert(1) drop-shadow(0 0 18px rgba(255, 255, 255, 0.15))',
              }}
            />
          </Link>
          <h1 className="text-2xl font-semibold text-white text-center">
            {alreadySignedIn
              ? 'Who should we sign in?'
              : switching
                ? 'Sign in as someone else'
                : autoStart
                  ? 'Taking you to your portal'
                  : 'Sign in to your KTP Account'}
          </h1>
          <p className="text-white/60 text-sm mt-2 text-center">
            {alreadySignedIn
              ? 'This browser already has a KTP account open.'
              : switching
                ? 'Enter your own KTP credentials to continue.'
                : autoStart
                  ? 'One moment while we check your KTP account.'
                  : 'Use your KTP organization account to access the member portal.'}
          </p>
        </div>

        {failed && !probeCameBackEmpty && (
          <p className="mb-4 rounded-md border border-red-300/40 bg-red-500/15 px-4 py-3 text-center text-sm text-white">
            We couldn&apos;t complete sign-in. Please try again, and let the tech
            committee know if it keeps happening.
          </p>
        )}
        {justSignedOut && !failed && (
          <p className="mb-4 text-center text-sm text-white/70">You&apos;ve been signed out.</p>
        )}

        {alreadySignedIn ? (
          <AlreadySignedIn
            name={session.user?.name}
            email={session.user?.email}
            continueLabel="Continue to my portal"
          />
        ) : switching ? (
          // AutoSignIn never redirects out of its cooldown branch — it stops
          // and waits for a click. That matters most right here: the only page
          // to fall back to is this one, and bouncing /login?switch=1 ->
          // /login would re-arm the silent probe and sign them straight back
          // in as the account they're leaving.
          <AutoSignIn slot="switch" prompt="login" />
        ) : autoStart ? (
          <SilentSignIn>{signInOptions}</SilentSignIn>
        ) : (
          signInOptions
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-white/70 hover:text-white hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
