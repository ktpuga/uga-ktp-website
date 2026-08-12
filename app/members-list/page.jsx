'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Footer from '@/components/ui/footer';
import { getRoster } from '@/lib/portal-api';
import { linkedinHref } from '@/lib/portal-format';
import { rosterPictureSrc } from '@/lib/avatar';

const SECTIONS = [
  { key: 'eboard', heading: 'Executive Board', title: 'E-Board', bg: 'bg-card', cols: 'sm:grid-cols-3 md:grid-cols-4' },
  { key: 'chair', heading: 'Cabinet', title: 'Chair', bg: 'bg-background', cols: 'sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' },
  { key: 'active', heading: 'Members', title: 'Member', bg: 'bg-card', cols: 'sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' },
  { key: 'alumni', heading: 'Alumni', title: 'Alumni', bg: 'bg-background', cols: 'sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' },
];

// Deliberately First + Last name here, not the shared memberDisplayName()
// helper's nickname-first logic — this is a public "meet the chapter" page,
// which reads better with formal names than the informal preferred names
// members use with each other elsewhere in the app.
function formalName(person) {
  const full = [person.firstName, person.lastName].filter(Boolean).join(' ');
  return full || 'Member';
}

function formalInitials(person) {
  const initials = `${person.firstName?.[0] ?? ''}${person.lastName?.[0] ?? ''}`.toUpperCase();
  return initials || 'M';
}

// Prefer the real, specific title over the generic per-section fallback —
// an eboard member's actual position ("President") if set, or which
// committee(s) a chair runs, otherwise just the section's generic label.
function personTitle(person, fallbackTitle) {
  if (person.execTitle) return person.execTitle;
  if (person.chairedCommittees?.length > 0) return person.chairedCommittees.map((c) => `${c} Committee`).join(' & ');
  return fallbackTitle;
}

function isPresident(person) {
  return /^president\b/i.test(person.execTitle?.trim() ?? '');
}

function RosterCard({ person, title }) {
  const name = formalName(person);
  const initials = formalInitials(person);

  return (
    <Card
      name={name}
      title={personTitle(person, title)}
      // What they're doing now, in their own words. Only alumni are asked for
      // it, so in practice this is blank on every other section's cards — but
      // it is rendered for anyone who has one rather than gated on the section,
      // because the form is what decides who is asked.
      note={person.doingNow}
      // Eboard-typed, unlike `note` above which the member writes themselves.
      traits={person.traits}
      // The member's own links. Card re-checks every href with
      // safeExternalHref before rendering, because this page has no
      // authentication and write-time validation only covers rows written
      // since services/urls.js existed.
      links={person.links}
      avatarSrc={rosterPictureSrc(person.id, person.profilePictureAssetId)}
      fallbackInitials={initials}
      // Card already renders a LinkedIn icon under the name when given one;
      // linkedinHref returns null for anything unsafe or non-LinkedIn, which
      // simply omits the icon.
      linkedinUrl={linkedinHref(person.linkedinUrl)}
      avatarShape="square"
      avatarSize="lg"
      // Top-align instead of the card's default vertical centering: grid
      // stretches every card to the tallest in the row, so centered content
      // means a name that wraps to two lines pushes its photo up and out of
      // line with its neighbours'. Anchored to the top, the photos stay level
      // across the row and the extra line grows downward.
      className="h-full justify-start"
    />
  );
}

export default function MembersListPage() {
  const { data: session } = useSession();
  const [roster, setRoster] = useState(null);
  const [error, setError] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    getRoster()
      .then(setRoster)
      .catch((err) => setError(err.message ?? 'Could not load the roster'));
  }, []);

  return (
    <div className="flex min-h-screen flex-col scroll-smooth font-sans bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      {/* ===============================  NAVBAR  ============================== */}
      <header
        className={`sticky top-0 z-50 flex h-16 items-center px-4 lg:px-6 transition-all duration-300 border-b ${scrolled ? 'bg-white/90 border-slate-200 shadow-sm backdrop-blur-md' : 'bg-transparent border-transparent'}`}
      >
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/KTP PHI CHAPTER.svg"
            alt="KTP Phi Chapter"
            width={100}
            height={40}
            className="h-8 w-auto"
          />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/" className="text-sm font-medium transition-colors duration-300 hover:text-indigo-600">
            Home
          </Link>
          <Link href="/rush" className="text-sm font-medium transition-colors duration-300 hover:text-indigo-600">
            Rush
          </Link>
        </nav>
        <Link
          href={session ? '/auth/redirect' : '/login'}
          className="ml-6 text-sm font-medium px-3 py-1.5 rounded-md bg-blue-900 text-white border border-blue-900 transition-colors duration-300 hover:bg-blue-800 hover:border-blue-800"
        >
          {session ? 'My Portal' : 'Portal Login'}
        </Link>
      </header>

      <main className="flex-1">
        {/* ===============================  HERO  ============================== */}
        <section className="relative overflow-hidden py-16 md:py-24 flex items-center">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-20 top-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-cyan-400 opacity-25 blur-[120px]" />
            <div className="absolute -bottom-24 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-fuchsia-500 opacity-20 blur-[110px]" />
          </div>

          <div className="container mx-auto max-w-4xl px-4 text-center md:px-6">
            <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/60 px-3 py-1 text-xs font-semibold tracking-wider text-blue-900 shadow-sm">
              Kappa Theta Pi &middot; Phi Chapter
            </p>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-blue-900 drop-shadow-xl">
              Meet the Chapter
            </h1>
            <p className="mx-auto mt-4 max-w-prose text-lg md:text-xl text-slate-700">
              The people behind Phi Chapter — leadership, chairs, members, and the alumni who came before us.
            </p>
          </div>
        </section>

        {error && (
          <div className="container mx-auto max-w-2xl px-4 pb-8 text-center text-sm text-red-600">{error}</div>
        )}

        {!roster && !error && (
          <div className="container mx-auto max-w-2xl px-4 pb-16 text-center text-sm text-slate-500">Loading roster...</div>
        )}

        {roster && SECTIONS.map(({ key, heading, title, bg, cols }) => {
          const people = roster[key] ?? [];
          // Keep the API's order for every group, while making the chapter's
          // President the first card in the public executive-board roster.
          const orderedPeople = key === 'eboard'
            ? [...people].sort((a, b) => Number(isPresident(b)) - Number(isPresident(a)))
            : people;
          if (people.length === 0) return null;

          return (
            <section key={key} id={key} className={`${bg} py-16 md:py-24`}>
              <div className="container mx-auto max-w-6xl px-4 md:px-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-primary">{heading}</h2>
                </div>
                <div className={`mt-12 grid grid-cols-2 gap-8 text-sm ${cols}`}>
                  {orderedPeople.map((person) => (
                    <RosterCard key={person.id} person={person} title={title} />
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        <section className="bg-slate-100 py-16 text-center md:py-24">
          <div className="container mx-auto max-w-2xl px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Want to join us?</h2>
            <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-700">
              Come see what Phi Chapter is all about.
            </p>
            <Link href="/rush" className="mt-6 inline-block">
              <Button className="rounded-full border-2 border-[#d4af37] bg-[#1a1a1a] px-8 py-4 text-lg font-semibold text-white shadow-none transition-colors hover:border-[#f0d060] hover:bg-[#6b1c2a] hover:text-white">
                Fall Rush 2026
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
