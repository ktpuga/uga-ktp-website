'use client'

import Footer from '@/components/ui/footer'
import Image from 'next/image'
import Link from 'next/link'
import { RUSH_STEPS } from '@/app/rush/rush-content'
import { getPublicRushSignup } from '@/lib/portal-api'
import { logoutEverywhere } from '@/lib/auth-actions'
import { useSession } from 'next-auth/react'
import React, { useEffect, useState } from 'react'

// Public, like /rush itself — this is aimed at people who don't have an account
// yet, so it must not sit behind the middleware matcher. /rush* is deliberately
// excluded there; only /rushee (the portal) is gated.
//
// Visual language matches /rush exactly so the two read as one site: same
// near-black background, gold accent and maroon rules.

function StepCard ({ step, index, isLast }) {
  const number = index + 1

  return (
    <li className="relative flex gap-4 sm:gap-6">
      {/* Rail: the connecting line is hidden on the final step so the sequence
          visibly terminates rather than trailing into nothing. */}
      <div className="flex shrink-0 flex-col items-center">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#d4af37] bg-[#2a1219] text-base font-bold text-[#d4af37] sm:h-12 sm:w-12 sm:text-lg"
          aria-hidden
        >
          {number}
        </span>
        {!isLast && <span className="mt-2 w-0.5 flex-1 bg-[#6b1c2a]" aria-hidden />}
      </div>

      <div className={isLast ? 'pb-0' : 'pb-10 sm:pb-14'}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="text-lg font-bold text-white sm:text-xl">
            <span className="sr-only">Step {number}: </span>
            {step.label}
          </h3>
          {step.detail && (
            <span className="rounded-full border border-[#6b1c2a] bg-[#1a1a1a] px-2.5 py-0.5 text-[11px] font-medium text-[#c9b896]">
              {step.detail}
            </span>
          )}
        </div>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#c9b896] sm:text-base">
          {step.body}
        </p>
      </div>
    </li>
  )
}

export default function HowRushWorksPage () {
  const [scrolled, setScrolled] = useState(false)
  const [rushSignupUrl, setRushSignupUrl] = useState(null)

  // The signup link goes straight to Authentik's enrollment flow, and the new
  // account it creates becomes Authentik's session for this browser. Doing
  // that while a KTP account is already open here is what mixes the two up:
  // our cookie keeps the old member while Authentik holds the new rushee, and
  // the next time our cookie lapses the member's session is silently rewritten
  // as the rushee. So make signing out the way through.
  //
  // This can't be the only guard — most rushees arrive by scanning a QR code
  // that points at Authentik directly and never loads this page. /auth/start
  // catches those on the way back. This just stops the site itself from
  // walking people into it.
  const { data: session, status } = useSession()
  const signedIn = status === 'authenticated' && !session?.error
  // The signup URL and the session resolve independently, and whichever loses
  // the race decides what a signed-in visitor sees. Without this, a slow
  // session lookup renders the live signup link for a beat — long enough to
  // click, which is the whole thing we're preventing. Treat "don't know yet"
  // as "not ready", which is what this block already does while the signup
  // URL is in flight.
  const sessionKnown = status !== 'loading'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    // Never rejects — resolves to is_open:false on any failure, so a hiccup
    // hides the button rather than breaking the page.
    getPublicRushSignup().then((status) => {
      if (status?.is_open && status.signup_url) setRushSignupUrl(status.signup_url)
    })
  }, [])

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#0a0a0a] font-sans text-white">
      <header className={`sticky top-0 z-50 flex h-14 shrink-0 items-center border-b-2 border-[#6b1c2a] bg-[#0a0a0a] px-4 transition-all duration-300 sm:h-16 lg:px-6 ${scrolled ? 'shadow-md' : ''}`}>
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image
            src="/KTP PHI CHAPTER.svg"
            alt="KTP Phi Chapter"
            width={100}
            height={40}
            className="h-7 w-auto shrink-0 sm:h-8"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </Link>
        <nav className="ml-auto flex shrink-0 gap-4 sm:gap-6">
          <Link href="/rush" className="text-sm font-medium text-white transition-colors hover:text-[#d4af37]">Rush</Link>
          <Link href="/" className="text-sm font-medium text-white transition-colors hover:text-[#d4af37]">Home</Link>
        </nav>
      </header>

      <main className="flex-1 border-b-4 border-[#6b1c2a] bg-[#111111]">
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
          <div className="text-center">
            <p className="mb-3 inline-block rounded-full border-2 border-[#d4af37] bg-[#2a1219] px-3 py-1.5 text-xs font-semibold tracking-wide text-white sm:mb-4 sm:px-4 sm:text-sm">
              Rushing KTP
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#d4af37] drop-shadow-xl sm:text-4xl md:text-5xl">
              How Rush Works
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance text-base leading-relaxed text-[#e8e0d5] sm:mt-6 sm:text-lg">
              Four steps, start to finish. Everything happens in one app, so you always know
              what&apos;s next and where to be.
            </p>
          </div>

          <ol className="mt-12 sm:mt-16">
            {RUSH_STEPS.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                index={index}
                isLast={index === RUSH_STEPS.length - 1}
              />
            ))}
          </ol>

          <div className="mt-14 rounded-2xl border-2 border-[#6b1c2a] bg-[#1a1a1a] p-6 text-center sm:mt-20 sm:p-8">
            {rushSignupUrl && sessionKnown && signedIn ? (
              <>
                <h2 className="text-xl font-extrabold text-white sm:text-2xl">
                  Sign out first
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#c9b896] sm:text-base">
                  This browser is signed in to a KTP account
                  {session?.user?.name ? ` as ${session.user.name}` : ''}. Creating a new
                  account on top of it mixes the two up. Sign out first; the sign-in
                  page has a rush signup link waiting.
                </p>
                <button
                  type="button"
                  onClick={() => logoutEverywhere()}
                  className="mt-6 inline-block w-full rounded-full border-2 border-[#f0d060] bg-[#d4af37] px-8 py-4 text-base font-bold text-[#1a1a1a] shadow-lg transition-colors hover:bg-[#f0d060] sm:w-auto sm:px-12"
                >
                  Sign out to sign up →
                </button>
                <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-[#8f8676]">
                  Already have a KTP account? You don&apos;t need a new one.{' '}
                  <Link href="/login" className="font-semibold text-[#d4af37] underline underline-offset-2 hover:text-[#f0d060]">
                    go to your portal
                  </Link>
                  .
                </p>
              </>
            ) : rushSignupUrl && sessionKnown ? (
              <>
                <h2 className="text-xl font-extrabold text-white sm:text-2xl">Ready to start?</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#c9b896] sm:text-base">
                  Create your account now. You can look around before the first event.
                </p>
                <a
                  href={rushSignupUrl}
                  className="mt-6 inline-block w-full rounded-full border-2 border-[#f0d060] bg-[#d4af37] px-8 py-4 text-base font-bold text-[#1a1a1a] shadow-lg transition-colors hover:bg-[#f0d060] sm:w-auto sm:px-12"
                >
                  Sign up for Rush →
                </a>
              </>
            ) : (
              /* Signup isn't open. Say so plainly rather than showing a dead
                 button — and point somewhere useful instead. */
              <>
                <h2 className="text-xl font-extrabold text-white sm:text-2xl">Signup isn&apos;t open yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#c9b896] sm:text-base">
                  Rush registration opens closer to the start of the semester. Check the rush page
                  for dates, or follow us on Instagram and we&apos;ll announce it there.
                </p>
                <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
                  <Link
                    href="/rush"
                    className="rounded-full border-2 border-[#d4af37] bg-[#1a1a1a] px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:border-[#f0d060] hover:bg-[#6b1c2a] sm:px-8"
                  >
                    Rush details
                  </Link>
                  <a
                    href="https://www.instagram.com/ugaktp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border-2 border-[#3b82f6] bg-[#1e3a8a] px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:border-[#60a5fa] hover:bg-[#1d4ed8] sm:px-8"
                  >
                    @ugaktp on Instagram
                  </a>
                </div>
              </>
            )}
          </div>

          {/* Outside the CTA card on purpose, so it shows in all three of its
              states — including "signup isn't open yet", which is exactly when
              somebody browsing has nothing else to look at. /members-list is
              public and needs no account. */}
          <div className="mt-10 rounded-2xl border border-[#3a3a3a] bg-[#141414] p-6 text-center">
            <h2 className="text-lg font-extrabold text-white sm:text-xl">See who you&apos;d be joining</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#c9b896]">
              The whole chapter is public: current members, the exec board, and the alumni who
              came before us with what they&apos;re doing now.
            </p>
            <Link
              href="/members-list"
              className="mt-5 inline-block rounded-full border-2 border-[#d4af37] bg-[#1a1a1a] px-8 py-3 text-sm font-semibold text-white transition-colors hover:border-[#f0d060] hover:bg-[#6b1c2a]"
            >
              Meet the chapter →
            </Link>
          </div>

          <p className="mt-10 text-center text-sm text-[#c9b896]">
            Still have questions?{' '}
            <Link href="/rush#faq" className="font-semibold text-[#d4af37] underline underline-offset-4 hover:text-[#f0d060]">
              Read the rush FAQ
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
