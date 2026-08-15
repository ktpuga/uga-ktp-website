'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Card from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Footer from '@/components/ui/footer';
import PublicHeader from '@/components/PublicHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getRoster } from '@/lib/portal-api';
import { formatPledgeClass, linkedinHref } from '@/lib/portal-format';
import { rosterPictureSrc } from '@/lib/avatar';

const SECTIONS = [
  // Leadership cards keep more room for titles, traits, and link chips.
  // Members and alumni have their own five-card canvas at desktop. It uses a
  // wider minimum width so those cards stay the same size as leadership cards.
  { key: 'eboard', heading: 'Executive Board', title: 'E-Board', bg: 'bg-card', cols: 'md:grid-cols-3 xl:grid-cols-4' },
  { key: 'chair', heading: 'Cabinet', title: 'Chair', bg: 'bg-background', cols: 'md:grid-cols-3 xl:grid-cols-4' },
  { key: 'active', heading: 'Members', title: 'Member', bg: 'bg-card', cols: 'md:grid-cols-3 xl:grid-cols-5' },
  { key: 'alumni', heading: 'Alumni', title: 'Alumni', bg: 'bg-background', cols: 'md:grid-cols-3 xl:grid-cols-5' },
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

const PLEDGE_CLASS_ORDER = [
  'founder', 'founding', 'founding class', 'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta',
  'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi',
  'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
];

const HERO_PHOTOS = [
  {
    src: '/members-hero/chapter-outdoors.jpg',
    alt: 'KTP members gathered outdoors at a chapter event',
    className: 'xl:col-start-1 xl:row-start-1 xl:-translate-x-5 xl:-translate-y-6 xl:-rotate-3',
    position: 'center 62%',
  },
  {
    src: '/members-hero/chapter-meeting.jpg',
    alt: 'KTP members gathered for a chapter meeting',
    className: 'xl:col-start-2 xl:row-start-1 xl:-translate-x-2 xl:translate-y-8 xl:rotate-2',
    position: 'center 62%',
  },
  {
    src: '/members-hero/chapter-mountain.jpg',
    alt: 'KTP members together during a mountain trip',
    className: 'xl:col-start-4 xl:row-start-1 xl:translate-x-2 xl:-translate-y-8 xl:rotate-3',
    position: 'center 48%',
  },
  {
    src: '/members-hero/chapter-group.jpg',
    alt: 'KTP members posing together after a chapter gathering',
    className: 'xl:col-start-5 xl:row-start-1 xl:translate-x-5 xl:translate-y-6 xl:-rotate-2',
    position: 'center 48%',
  },
];

function alumniByPledgeClass(people) {
  const classes = new Map();

  for (const person of people) {
    const label = String(person.pledgeClass ?? '').trim();
    const key = label.toLocaleLowerCase() || 'unlisted';
    const group = classes.get(key) ?? { key, label: label || null, people: [] };
    group.people.push(person);
    classes.set(key, group);
  }

  return [...classes.values()].sort((a, b) => {
    if (a.key === 'unlisted') return 1;
    if (b.key === 'unlisted') return -1;
    const aFounding = a.key.startsWith('found');
    const bFounding = b.key.startsWith('found');
    if (aFounding !== bFounding) return aFounding ? -1 : 1;
    const aIndex = PLEDGE_CLASS_ORDER.indexOf(a.key);
    const bIndex = PLEDGE_CLASS_ORDER.indexOf(b.key);
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
    return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' });
  });
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

function AlumniRoster({ people, title, cols }) {
  const [expandedClasses, setExpandedClasses] = useState(() => new Set());

  function toggleClass(key) {
    setExpandedClasses((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {alumniByPledgeClass(people).map((pledgeClass) => {
        const sectionId = `alumni-${pledgeClass.key.replace(/[^a-z0-9]+/g, '-')}`;
        const expanded = expandedClasses.has(pledgeClass.key);

        return (
          <section key={pledgeClass.key} aria-labelledby={`${sectionId}-trigger`}>
            <div className="flex items-center gap-4">
              <h4>
                <button
                  id={`${sectionId}-trigger`}
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={`${sectionId}-cards`}
                  onClick={() => toggleClass(pledgeClass.key)}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-blue-900 transition-colors hover:border-blue-900 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-900 focus-visible:ring-offset-2"
                >
                  {pledgeClass.label ? formatPledgeClass(pledgeClass.label) : 'Pledge class not listed'}
                </button>
              </h4>
              <div aria-hidden className="h-px flex-1 bg-slate-200" />
              <span className="text-sm text-slate-500">
                {pledgeClass.people.length} {pledgeClass.people.length === 1 ? 'alumnus' : 'alumni'}
              </span>
            </div>
            {expanded && (
              <div
                id={`${sectionId}-cards`}
                className={`mt-6 grid grid-cols-1 gap-8 text-sm sm:grid-cols-2 lg:gap-10 ${cols}`}
              >
                {pledgeClass.people.map((person) => <RosterCard key={person.id} person={person} title={title} />)}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default function MembersListPage() {
  const [roster, setRoster] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getRoster()
      .then(setRoster)
      .catch((err) => setError(err.message ?? 'Could not load the roster'));
  }, []);

  return (
    <div className="flex min-h-screen flex-col scroll-smooth font-sans bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <PublicHeader />

      <main className="flex-1">
        {/* ===============================  HERO  ============================== */}
        <section className="relative overflow-hidden border-b border-[#0f2758] bg-[#14326E] py-12 md:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-20 top-0 h-[28rem] w-[28rem] rounded-full bg-indigo-400/25 blur-[120px]" />
            <div className="absolute -bottom-24 right-0 h-[26rem] w-[26rem] rounded-full bg-cyan-300/15 blur-[110px]" />
          </div>

          <div className="mx-auto grid w-full max-w-[120rem] grid-cols-2 items-center gap-4 px-4 sm:gap-6 sm:px-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(34rem,1.7fr)_minmax(0,1.15fr)_minmax(0,1.15fr)] xl:gap-3">
            <div className="col-span-2 py-4 text-center xl:col-span-1 xl:col-start-3 xl:row-start-1 xl:px-2">
              <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-white shadow-sm backdrop-blur-sm">
                Kappa Theta Pi &middot; Phi Chapter
              </p>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-xl md:whitespace-nowrap md:text-6xl">
                Meet the Chapter
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100 md:text-xl">
                The people behind Phi Chapter: leadership, chairs, members, and the alumni who came before us.
              </p>
            </div>

            {HERO_PHOTOS.map((photo, index) => (
              <figure
                key={photo.src}
                className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-4 border-white bg-slate-200 shadow-xl transition-transform duration-300 hover:rotate-0 hover:scale-[1.04] ${photo.className}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  priority={index < 2}
                  sizes="(max-width: 1279px) 50vw, 18vw"
                  className="object-cover"
                  style={{ objectPosition: photo.position }}
                />
              </figure>
            ))}
          </div>
        </section>

        {error && (
          <div className="container mx-auto max-w-2xl px-4 pb-8 text-center text-sm text-red-600">{error}</div>
        )}

        {!roster && !error && (
          <div className="container mx-auto max-w-2xl px-4 pb-16 text-center text-sm text-slate-500">Loading roster...</div>
        )}

        {roster && (
          <>
            <section className="bg-slate-50 py-16 md:py-20">
              <div className="mx-auto w-full max-w-[88rem] px-4 md:px-6 xl:max-w-[112rem]">
                <Tabs defaultValue="eboard">
                  <div className="overflow-x-auto pb-2">
                    <TabsList className="mx-auto flex h-auto w-max min-w-full justify-start gap-1 rounded-xl border border-slate-200 bg-white p-1.5 sm:min-w-0 sm:justify-center">
                      {SECTIONS.map(({ key, heading }) => (
                        <TabsTrigger key={key} value={key} className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-blue-900 data-[state=active]:text-white data-[state=active]:shadow-sm">
                          {heading}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {SECTIONS.map(({ key, heading, title, cols }) => {
                    const people = roster[key] ?? [];
                    const isExpandedRoster = key === 'active' || key === 'alumni';
                    const orderedPeople = key === 'eboard'
                      ? [...people].sort((a, b) => Number(isPresident(b)) - Number(isPresident(a)))
                      : people;

                    return (
                      <TabsContent key={key} value={key} className="mt-10">
                        <h3 className="sr-only">{heading}</h3>
                        {orderedPeople.length > 0 ? (
                          <div className={isExpandedRoster ? '' : 'mx-auto max-w-[88rem]'}>
                            {key === 'alumni' ? (
                              <AlumniRoster people={orderedPeople} title={title} cols={cols} />
                            ) : (
                              <div className={`grid grid-cols-1 gap-8 text-sm sm:grid-cols-2 lg:gap-10 ${cols}`}>
                                {orderedPeople.map((person) => <RosterCard key={person.id} person={person} title={title} />)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="py-10 text-center text-slate-500">No {heading.toLowerCase()} to display yet.</p>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            </section>
          </>
        )}

        {false && SECTIONS.map(({ key, heading, title, bg, cols }) => {
          const people = roster[key] ?? [];
          // Keep the API's order for every group, while making the chapter's
          // President the first card in the public executive-board roster.
          const orderedPeople = key === 'eboard'
            ? [...people].sort((a, b) => Number(isPresident(b)) - Number(isPresident(a)))
            : people;
          if (people.length === 0) return null;

          return (
            <section key={key} id={key} className={`${bg} py-16 md:py-24`}>
              {/* max-w-6xl at five columns gave ~205px cards, which is
                  narrower than a single link chip — so a member's links stacked
                  one per line instead of sitting in a row. Wider container plus
                  one fewer column at each breakpoint roughly doubles the card
                  width, which is what lets the chips lay out horizontally. */}
              <div className="container mx-auto max-w-[88rem] px-4 md:px-6">
                <div className="text-center">
                  <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-primary">{heading}</h2>
                </div>
                <div className={`mt-12 grid grid-cols-1 gap-8 text-sm sm:grid-cols-2 lg:gap-10 ${cols}`}>
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
