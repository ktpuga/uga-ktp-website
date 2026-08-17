import Image from 'next/image';
import Link from 'next/link';
import CredentialSignUp from '@/components/auth/CredentialSignUp';

export const metadata = {
  title: 'Create your KTP account',
  description: 'Finish setting up your Kappa Theta Pi at UGA account.',
  robots: { index: false, follow: false },
};

// Enrollment, on our own page instead of Authentik's.
//
// `itoken` is Authentik's own parameter name, kept deliberately: an existing
// invitation link becomes one of ours by changing the host and path and
// nothing else, and ktp-api's `signup_url` can be pointed here later without
// reshaping anything.
//
// Authentik's enrollment page still works and still has to. Rush QR codes are
// PRINTED ON FLYERS pointing at it, and `services/authentikAdmin.js` still
// generates that URL, so this is an additional door rather than a replacement.
export default async function SignUp({ searchParams }) {
  const params = (await searchParams) ?? {};
  const token = typeof params.itoken === 'string' ? params.itoken : null;

  // Same derivation as /login: the issuer is server-only, so the browser-facing
  // origin is resolved here and passed down. One source of truth, and a wrong
  // value fails here rather than in somebody's browser.
  let authentikOrigin = null;
  try {
    authentikOrigin = new URL(process.env.AUTHENTIK_ISSUER).origin;
  } catch {
    authentikOrigin = null;
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#14326E' }}
    >
      <div className="w-full max-w-md">
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
          <h1 className="text-2xl font-semibold text-white text-center">Create your KTP account</h1>
          <p className="text-white/60 text-sm mt-2 text-center">
            Use your UGA email address. You&apos;ll finish your profile after this.
          </p>
        </div>

        {/* No token at all means somebody typed /signup directly. Enrollment is
            invitation-only by design, so say so plainly and point at rush,
            rather than rendering a form that can only fail. */}
        {!token ? (
          <div className="space-y-4 text-center">
            <p className="rounded-md border border-white/20 bg-white/5 px-4 py-3 text-sm text-white">
              You need an invitation link to create an account.
            </p>
            <Link
              href="/rush/how-it-works"
              className="block w-full rounded-md border border-white/25 py-3 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
            >
              Sign up for rush
            </Link>
          </div>
        ) : authentikOrigin ? (
          <CredentialSignUp origin={authentikOrigin} token={token} />
        ) : (
          <p className="rounded-md border border-red-300/40 bg-red-500/15 px-4 py-3 text-center text-sm text-white">
            Signup is temporarily unavailable. Please try the link you were sent again later.
          </p>
        )}

        <div className="mt-8 text-center">
          <Link href="/login" className="text-sm text-white/70 hover:text-white hover:underline">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
