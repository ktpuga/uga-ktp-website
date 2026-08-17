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

      <div className="mt-7 border-t border-white/10 pt-6 text-center">
        <p className="text-sm text-white/65">Not a member yet?</p>
        <Link
          href="/rush/how-it-works"
          className="mt-3 block w-full rounded-xl border border-white/20 bg-white/[0.03] px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10"
        >
          Sign up for rush
        </Link>
      </div>
    </div>
  );

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#081b42] p-4"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-28 h-[32rem] w-[32rem] rounded-full bg-[#2454a6]/35 blur-[120px]" />
        <div className="absolute -bottom-44 -right-28 h-[34rem] w-[34rem] rounded-full bg-[#d4af37]/15 blur-[140px]" />
      </div>
      <div className="relative w-full max-w-lg py-8">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="mb-5 inline-flex items-center justify-center transition-transform hover:scale-[1.02]">
            <Image
              src="/KTP PHI CHAPTER.svg"
              alt="Kappa Theta Pi - Phi Chapter"
              width={180}
              height={92}
              priority
              style={{
                filter: 'brightness(0) invert(1) drop-shadow(0 0 22px rgba(255, 255, 255, 0.2))',
              }}
            />
          </Link>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#f0d060]">Phi Chapter · UGA</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {alreadySignedIn
              ? 'Who should we sign in?'
              : switching
                ? 'Sign in as someone else'
                : autoStart
                  ? 'Taking you to your portal'
                  : 'Sign in to your KTP Account'}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
            {alreadySignedIn
              ? 'This browser already has a KTP account open.'
              : switching
                ? 'Enter your own KTP credentials to continue.'
                : autoStart
                  ? 'One moment while we check your KTP account.'
                  : 'Use your KTP organization account to access the member portal.'}
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-white/15 bg-white/[0.07] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-7">
        {failed && !probeCameBackEmpty && (
          <p className="mb-5 rounded-xl border border-red-300/35 bg-red-500/15 px-4 py-3 text-center text-sm text-red-50">
            We couldn&apos;t complete sign-in. Please try again, and let the tech
            committee know if it keeps happening.
          </p>
        )}
        {justSignedOut && !failed && (
          <p className="mb-5 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-center text-sm text-white/70">You&apos;ve been signed out.</p>
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
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-white/65 underline decoration-white/25 underline-offset-4 transition-colors hover:text-[#f0d060] hover:decoration-[#f0d060]">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
