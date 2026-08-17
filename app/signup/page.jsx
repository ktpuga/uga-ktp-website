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
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#081b42] p-4"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-28 h-[32rem] w-[32rem] rounded-full bg-[#2454a6]/35 blur-[120px]" />
        <div className="absolute -bottom-44 -right-28 h-[34rem] w-[34rem] rounded-full bg-[#d4af37]/15 blur-[140px]" />
      </div>
      <div className="relative w-full max-w-lg py-8">
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Create your KTP account</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
            Use your UGA email address. You&apos;ll finish your profile after this.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-white/15 bg-white/[0.07] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-7">
        {/* No token at all means somebody typed /signup directly. Enrollment is
            invitation-only by design, so say so plainly and point at rush,
            rather than rendering a form that can only fail. */}
        {!token ? (
          <div className="space-y-4 text-center">
            <p className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm leading-relaxed text-white/80">
              You need an invitation link to create an account.
            </p>
            <Link
              href="/rush/how-it-works"
              className="block w-full rounded-xl border border-white/20 bg-white/[0.03] px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10"
            >
              Sign up for rush
            </Link>
          </div>
        ) : authentikOrigin ? (
          <CredentialSignUp origin={authentikOrigin} token={token} />
        ) : (
          <p className="rounded-xl border border-red-300/35 bg-red-500/15 px-4 py-3 text-center text-sm text-red-50">
            Signup is temporarily unavailable. Please try the link you were sent again later.
          </p>
        )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-medium text-white/65 underline decoration-white/25 underline-offset-4 transition-colors hover:text-[#f0d060] hover:decoration-[#f0d060]">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
