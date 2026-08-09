import Image from 'next/image';
import { auth } from '@/auth';
import AutoSignIn from '@/components/auth/AutoSignIn';
import AlreadySignedIn from '@/components/auth/AlreadySignedIn';

// The "get me in" entry point, as opposed to /login's "should I let you in?".
//
// Reached two ways, both of which mean the visitor definitely wants the portal
// and very probably already has an Authentik session:
//   - the enrollment invitation's `next=`, immediately after an account is
//     created, which is the one moment `prompt=none` provably cannot handle;
//   - /auth/redirect finding no session of ours, which is the same situation
//     arriving by a different road (and covers invitation QR codes already in
//     circulation that still point there).
//
// It is also the ONE place every rush signup comes back through. The signup
// link itself points straight at Authentik — it's printed on flyers as a QR
// code (see ktp-api services/authentikAdmin.js), so the website gets no say in
// what happens before this page. Whatever guard exists for "you enrolled on a
// browser that was already signed in as someone else" has to live here.
export default async function AuthStart() {
  const session = await auth();

  // A session here does NOT mean this is that person. Arriving via `next=`
  // means someone just finished creating an account in Authentik seconds ago;
  // if our cookie still holds a different member, this is exactly the shared
  // browser the chooser exists for. This used to redirect() straight to
  // /auth/redirect, which handed the new rushee the member's portal.
  const alreadySignedIn = Boolean(session && !session.error);

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
            {alreadySignedIn ? 'Who should we sign in?' : 'Taking you to your portal'}
          </h1>
        </div>

        {alreadySignedIn ? (
          <AlreadySignedIn
            name={session.user?.name}
            email={session.user?.email}
            continueLabel="Continue to my portal"
            note="If you just created a new account on this device, this isn't it — the account below was already signed in here."
          />
        ) : (
          <AutoSignIn slot="start" cooldownHref="/login" />
        )}
      </div>
    </div>
  );
}
