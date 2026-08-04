import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { auth } from '@/auth';
import SignInButton from '@/components/auth/SignInButton';
import AutoSignIn from '@/components/auth/AutoSignIn';

export default async function Login({ searchParams }) {
  const session = await auth();
  // session.error means a token refresh already failed (see auth.ts) — treat
  // that as not really logged in, otherwise this bounces straight back into
  // the app, which immediately hits the same dead token and redirects here
  // again, looping forever instead of just showing the sign-in button.
  if (session && !session.error) redirect('/auth/redirect');

  const params = (await searchParams) ?? {};

  // Auto-start SSO unless doing so would loop. Both suppressions are load
  // bearing:
  //
  //   ?error=…            NextAuth sends failures back here. Auto-retrying a
  //                       flow that just failed is an infinite redirect
  //                       between us and Authentik, and the user never sees
  //                       why it broke.
  //   ktp_signed_out=1    Set by logoutEverywhere. Without it, "sign out"
  //                       lands here and is immediately undone — and if
  //                       Authentik's session somehow survived, signing out
  //                       becomes impossible.
  const failed = Boolean(params.error);
  const justSignedOut = (await cookies()).get('ktp_signed_out')?.value === '1';
  const autoStart = !failed && !justSignedOut;

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

        {failed && (
          <p className="mb-4 rounded-md border border-red-300/40 bg-red-500/15 px-4 py-3 text-center text-sm text-white">
            We couldn&apos;t complete sign-in. Please try again, and let the tech
            committee know if it keeps happening.
          </p>
        )}
        {justSignedOut && !failed && (
          <p className="mb-4 text-center text-sm text-white/70">You&apos;ve been signed out.</p>
        )}

        {autoStart ? <AutoSignIn /> : <SignInButton />}

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-white/70 hover:text-white hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
