import Image from 'next/image';
import Link from 'next/link';
import { auth } from '@/auth';
import { logoutEverywhere } from '@/lib/auth-actions';
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
          // The escape hatch has to end the AUTHENTIK session, not just retry.
          // Landing here repeatedly means Authentik sent us straight to `next=`
          // instead of running the enrollment flow, and the two things that
          // cause that — a flow plan already used up in this browser's
          // Authentik session, or a flow that refuses to enroll an
          // already-authenticated browser — are both state living in
          // Authentik's cookie. Retrying cannot touch either; a full
          // RP-initiated logout clears both.
          //
          // Plain logoutEverywhere(), NOT logoutEverywhere('rush'): the 'rush'
          // marker puts "Continue to rush signup" on /login, which is the exact
          // door back into the loop this page just stopped.
          <AutoSignIn slot="start">
            <form action={logoutEverywhere} className="w-full">
              <button
                type="submit"
                className="w-full rounded-md border border-white/25 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Sign out of everything and start over
              </button>
            </form>
            <p className="text-xs leading-relaxed text-white/45">
              Use this if signing in keeps bringing you back here. It clears the
              KTP login this browser is holding — including a half-finished
              signup — so the next attempt starts clean.{' '}
              <Link href="/" className="underline underline-offset-2 hover:text-white/70">
                Back to home
              </Link>
            </p>
          </AutoSignIn>
        )}
      </div>
    </div>
  );
}
