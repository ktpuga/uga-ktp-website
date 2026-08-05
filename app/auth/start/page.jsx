import Image from 'next/image';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import StartSignIn from '@/components/auth/StartSignIn';

// The "get me in" entry point, as opposed to /login's "should I let you in?".
//
// Reached two ways, both of which mean the visitor definitely wants the portal
// and very probably already has an Authentik session:
//   - the enrollment invitation's `next=`, immediately after an account is
//     created, which is the one moment `prompt=none` provably cannot handle;
//   - /auth/redirect finding no session of ours, which is the same situation
//     arriving by a different road (and covers invitation QR codes already in
//     circulation that still point there).
export default async function AuthStart() {
  const session = await auth();
  if (session && !session.error) redirect('/auth/redirect');

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#14326E' }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
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
          <h1 className="mt-6 text-2xl font-semibold text-white text-center">
            Taking you to your portal
          </h1>
        </div>

        <StartSignIn />
      </div>
    </div>
  );
}
