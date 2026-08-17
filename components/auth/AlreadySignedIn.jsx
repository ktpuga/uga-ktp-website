import Link from 'next/link';
import { switchAccount } from '@/lib/auth-actions';

// Shown wherever someone lands on a way IN while a session is already sitting
// in this browser: /login and /auth/start.
//
// Both pages used to redirect straight to /auth/redirect on finding a session,
// which is where the account-mixing came from. There are two sessions in play
// and nothing keeps them in step — ours (the NextAuth cookie) and Authentik's
// own SSO cookie. Enrolling through rush on a browser where a member is signed
// in leaves Authentik holding the NEW account while our cookie still holds the
// member's, and the blind redirect then dropped the rushee inside the member's
// portal. Later, the moment our cookie lapsed, /login's silent prompt=none
// probe asked Authentik who this was, got the rushee, and quietly rewrote the
// member's session — the username and groups changing under them with nothing
// on screen to explain it.
//
// A refresh_token isn't tied to the browser session, so a lapsed cookie is not
// a reliable signal and there is nothing to detect the split mid-browse. These
// entry points are the only place the question can be asked, so they ask it.
//
// A server component: `switchAccount` is a server action invoked by a real
// form, so its redirect() resolves natively instead of surfacing as the
// NEXT_REDIRECT error a client onClick would have to special-case.
export default function AlreadySignedIn({ name, email, continueLabel = 'Continue', note }) {
  const who = name || email || 'this account';

  return (
    <div className="rounded-2xl border border-white/15 bg-black/15 p-5 shadow-inner shadow-black/10 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">You&apos;re already signed in as</p>
      <p className="mt-2 truncate text-xl font-semibold text-white" title={who}>
        {who}
      </p>
      {name && email && <p className="truncate text-sm text-white/50">{email}</p>}

      {note && <p className="mt-4 text-sm leading-relaxed text-white/70">{note}</p>}

      <Link
        href="/auth/redirect"
        className="mt-6 block w-full rounded-xl border border-[#f0d060] bg-[#d4af37] px-4 py-3.5 text-center text-sm font-bold uppercase tracking-[0.14em] text-[#1a1a1a] shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#f0d060]"
      >
        {continueLabel}
      </Link>

      <form action={switchAccount}>
        <button
          type="submit"
          className="mt-3 w-full rounded-xl border border-white/20 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          This isn&apos;t me: sign in as someone else
        </button>
      </form>

      <p className="mt-4 text-center text-xs leading-relaxed text-white/50">
        Signing in as someone else asks for your KTP password again, so nobody
        can take over the account already open here.
      </p>
    </div>
  );
}
