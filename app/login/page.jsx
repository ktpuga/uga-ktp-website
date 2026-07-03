import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import SignInButton from '@/components/auth/SignInButton';

export default async function Login() {
  const session = await auth();
  if (session) redirect('/auth/redirect');

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
            Sign in to your KTP Account
          </h1>
          <p className="text-white/60 text-sm mt-2 text-center">
            Use your KTP organization account to access the member portal.
          </p>
        </div>

        <SignInButton />

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-white/70 hover:text-white hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
