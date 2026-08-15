'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/ui/footer';
import PublicHeader from '@/components/PublicHeader';
import PresidentMessage from '@/components/PresidentMessage';
import { getRoster } from '@/lib/portal-api';

const PRESIDENT_MESSAGE = [
  'Welcome to the Phi Chapter of Kappa Theta Pi, the premier professional technology fraternity at UGA. On behalf of our entire chapter, it is my absolute privilege to welcome you to our digital home, where you can catch a glimpse of the passion and excellence that our chapter celebrates.',
  'At Kappa Theta Pi, we bridge the gap between academic ambition and industry excellence. Our brothers are innovators, creators, and leaders driven by a shared curiosity for technology and its limitless possibilities. Through professional development workshops, technical skill-building sessions, collaborative projects, and a tight-knit community, we empower one another to turn bold ideas into real-world impact.',
  'Whether you are a prospective member eager to find your tech family, an alumnus looking to reconnect, or a curious visitor, I invite you to explore our site and discover what makes our brotherhood so special.',
  'Welcome to our community, and Go Dawgs!',
  'With love,\nDaniel Rifai\nPresident, 2026',
];

const VALUES = [
  {
    title: 'Technology & Growth',
    description: 'We bring together students with a shared interest in technology and create opportunities for intellectual and technical development.',
  },
  {
    title: 'Professional Development',
    description: 'Career guidance, workshops, mentorship, and relationships with alumni, faculty, and industry help members prepare for what comes next.',
  },
  {
    title: 'Community & Service',
    description: 'We foster lasting friendship, mutual support, and a commitment to serve the local community through meaningful chapter experiences.',
  },
  {
    title: 'Opportunity for Everyone',
    description: 'Phi Chapter is committed to an inclusive community and equal opportunity in its membership and activities.',
  },
];

function isPresident(person) {
  return /^president\b/i.test(person?.execTitle?.trim() ?? '');
}

const SLOT_REELS = [
  { letter: 'K', sequence: ['K', 'Θ', 'Π', 'Θ', 'Π', 'K'] },
  { letter: 'Θ', sequence: ['Θ', 'Π', 'K', 'Π', 'K', 'Θ'] },
  { letter: 'Π', sequence: ['Π', 'K', 'Θ', 'K', 'Θ', 'Π'] },
];

function KtpSlotMachine() {
  return (
    <figure className="ktp-slot" aria-label="Kappa Theta Pi slot machine showing Kappa, Theta, and Pi symbols">
      <div className="ktp-slot__marquee" aria-hidden>
        {Array.from({ length: 11 }, (_, index) => <span key={index} />)}
      </div>
      <div className="ktp-slot__title" aria-hidden>Kappa Theta Pi</div>
      <div className="ktp-slot__window" aria-hidden>
        {SLOT_REELS.map((reel, reelIndex) => (
          <div key={reel.letter} className="ktp-slot__reel">
            <div className="ktp-slot__track" style={{ '--reel-delay': `${reelIndex * 120}ms` }}>
              {reel.sequence.map((symbol, symbolIndex) => (
                <span key={`${symbol}-${symbolIndex}`}>{symbol}</span>
              ))}
            </div>
          </div>
        ))}
        <div className="ktp-slot__payline" />
      </div>
      <div className="ktp-slot__footer" aria-hidden>
        <span>Phi Chapter</span>
        <span>UGA</span>
      </div>
      <div className="ktp-slot__marquee ktp-slot__marquee--bottom" aria-hidden>
        {Array.from({ length: 11 }, (_, index) => <span key={index} />)}
      </div>
    </figure>
  );
}

export default function AboutPage() {
  const [roster, setRoster] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getRoster().then(setRoster).catch((err) => setError(err.message ?? 'Could not load chapter leadership.'));
  }, []);

  const president = roster?.eboard?.find(isPresident);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 font-sans text-slate-900 sm:border-x-[6px] sm:border-[#14326E]">
      <PublicHeader />

      <main className="flex-1">
        {president && <PresidentMessage president={president} message={PRESIDENT_MESSAGE} featured />}
        {!roster && !error && <p className="flex min-h-[calc(100svh-4rem)] items-center justify-center text-sm text-slate-500">Loading chapter leadership...</p>}
        {error && <p className="flex min-h-[calc(100svh-4rem)] items-center justify-center text-sm text-slate-500">The President&apos;s Message is temporarily unavailable.</p>}

        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50 py-16 md:py-24">
          <div aria-hidden className="pointer-events-none absolute -right-24 top-1/2 h-[38rem] w-[38rem] -translate-y-1/2 rounded-full bg-blue-300/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-[96rem] items-center gap-14 px-4 sm:px-6 md:grid-cols-[minmax(0,1.15fr)_minmax(24rem,0.85fr)] md:gap-20">
            <div className="max-w-4xl text-center md:-translate-x-3 md:text-left">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">About Kappa Theta Pi</p>
              <h2 className="mt-2 text-4xl font-bold leading-tight tracking-tight text-blue-900 md:text-5xl">A Home for Ambitious Technologists</h2>
              <div className="mt-7 space-y-5 text-base leading-relaxed text-slate-700 md:text-[1.05rem]">
                <p>KTP develops technical skills and professionalism while fostering strong friendships and an international network. Established at UGA in 2024, Phi Chapter is committed to leaving a lasting legacy on campus and beyond.</p>
                <p>Our purpose is to build an active technology community; promote intellectual, technical, professional, and social development; offer career guidance; and foster mutually beneficial relationships with alumni, faculty, local organizations, and industry.</p>
                <p>The Alpha Chapter, founded on January 10, 2012 at the University of Michigan, paved the way for a growing community of students who care about innovation, collaboration, and professional growth.</p>
              </div>
              <Link href="https://ktpmichigan.com" target="_blank" className="mt-7 inline-flex rounded-full border border-blue-200 bg-white/75 px-5 py-2.5 text-sm font-semibold text-blue-900 shadow-sm transition-colors hover:bg-blue-900 hover:text-white">Learn about the Alpha Chapter</Link>
            </div>

            <div className="relative mx-auto w-full max-w-[29rem] md:mx-0 md:justify-self-end md:translate-x-4">
              <div aria-hidden className="absolute -inset-8 rounded-[2.5rem] bg-[#d4af37]/20 blur-2xl" />
              <KtpSlotMachine />
              <Link
                href="/rush"
                className="relative mt-4 flex items-center justify-between gap-4 rounded-full border-2 border-[#6b1c2a] bg-[#111111] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-lg transition-colors hover:border-[#d4af37] hover:bg-[#2a1219] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2"
              >
                <span>Fall 2026 Rush</span>
                <span className="rounded-full border border-[#d4af37] bg-[#2a1219] px-3 py-1 text-xs text-[#d4af37]">
                  Open Now
                </span>
              </Link>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-16 md:py-24">
          <div aria-hidden className="pointer-events-none absolute -left-32 top-1/2 h-[38rem] w-[38rem] -translate-y-1/2 rounded-full bg-indigo-300/20 blur-3xl" />
          <div className="relative mx-auto max-w-[96rem] px-4 sm:px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Phi Chapter Values</p>
              <h2 className="mt-2 text-4xl font-bold leading-tight tracking-tight text-blue-900 md:text-5xl">Our Values</h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-700">The pillars that guide and shape every KTP member.</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((value, index) => (
                <article key={value.title} className="rounded-[1.75rem] border border-white/90 bg-white/70 p-7 shadow-lg shadow-slate-300/25 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-200/40">
                  <p className="text-sm font-semibold tabular-nums text-indigo-500">0{index + 1}</p>
                  <h3 className="mt-5 text-xl font-bold text-blue-900">{value.title}</h3>
                  <p className="mt-3 leading-relaxed text-slate-700">{value.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
