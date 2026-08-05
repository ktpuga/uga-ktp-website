import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import SignInButton from '@/components/auth/SignInButton';
import SilentSignIn from '@/components/auth/SilentSignIn';
import { SSO_PROBE_COOKIE } from '@/lib/sso';

export default async function Login({ searchParams }) {
  const session = await auth();
  // session.error means a token refresh already failed (see auth.ts) — treat
  // that as not really logged in, otherwise this bounces straight back into
  // the app, which immediately hits the same dead token and redirects here
  // again, looping forever instead of just showing the sign-in button.
  if (session && !session.error) redirect('/auth/redirect');

  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();

  // Auto-start the silent SSO probe unless doing so would loop. Both
  // suppressions are load bearing:
  //
  //   ?error=…            NextAuth sends failures back here. Auto-retrying a
  //                       flow that just failed is an infinite redirect
  //                       between us and Authentik, and the visitor never
  //                       sees why it broke.
  //   ktp_signed_out=1    Set by logoutEverywhere. Without it, "sign out"
  //                       lands here and is immediately undone — and if
  //                       Authentik's session somehow survived, signing out
  //                       becomes impossible.
  const failed = Boolean(params.error);
  const justSignedOut = cookieStore.get('ktp_signed_out')?.value === '1';
  const autoStart = !failed && !justSignedOut;

  // A probe that found no session reports itself exactly like a broken
  // sign-in, so "no account yet" would otherwise be announced in red as an
  // error. That's the single most common way to arrive here now.
  const probeCameBackEmpty = failed && cookieStore.get(SSO_PROBE_COOKIE)?.value === '1';

  const signInOptions = (
    <div>
      <SignInButton />

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
            {autoStart ? 'Taking you to your portal' : 'Sign in to your KTP Account'}
          </h1>
          <p className="text-white/60 text-sm mt-2 text-center">
            {autoStart
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

        {autoStart ? <SilentSignIn>{signInOptions}</SilentSignIn> : signInOptions}

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-white/70 hover:text-white hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
