// pages/hackathon/page.jsx
// 🚀 Dark‑mode hackathon page with animated gibberish line.

'use client'
import { Button } from '@/components/ui/button'
import Footer from '@/components/ui/footer'
import ktpHacks1 from '@/public/ktpHacks1.jpeg'
import ktpHacks2 from '@/public/ktpHacks2.jpeg'
import ktpHacks3 from '@/public/ktpHacks3.jpeg'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

export default function HackathonPage() {
  const [mobile, setMobile] = useState(false)
  const phrases = ['WELCOME_TO_KTP_HACKS', 'RETURNING_THIS_FALL', 'exec.Code()=>CreateInnovation()']
  const [gibberish, setGibberish] = useState(phrases[0]);

  useEffect(() => {
  let phraseIdx = 0;                 // which phrase is active?
  let scrambleTimer; // shuffles letters
  let switchTimer;  // swaps phrases
  const updateMobile = () => setMobile(window.innerWidth < 599)
  updateMobile()
  /** start/stop the letter-scramble interval */
  const startScramble = () => {
    scrambleTimer = setInterval(() => {
      setGibberish(prev =>
        prev
          .split("")                       // break into letters
          .sort(() => Math.random() - 0.5) // Fisher-Yates shuffle
          .join("")
      );
    }, 100); // adjust speed to taste
  };

  /** change to the next phrase every N ms */
  const switchPhrase = () => {
    clearInterval(scrambleTimer);            // stop scrambling old phrase
    phraseIdx = (phraseIdx + 1) % phrases.length;
    setGibberish(phrases[phraseIdx]);        // show new phrase unscrumbled
    startScramble();                         // then start scrambling it
  };

  // initial kick-off
  startScramble();
  switchTimer = setInterval(switchPhrase, 2000); // change every 2 s

  return () => {
    window.removeEventListener("resize", updateMobile);
    clearInterval(scrambleTimer);
    clearInterval(switchTimer);
  };
}, []);

  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-gray-950 via-indigo-950 to-black text-gray-100 relative overflow-hidden">
      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-indigo-800 bg-black/70 px-4 backdrop-blur-md lg:px-6 shadow-lg">
        <Link href="/" className="flex items-center font-bold text-cyan-400 drop-shadow-neon">
          <span className="text-2xl md:text-3xl tracking-tight bg-gradient-to-tr from-indigo-400 via-cyan-400 to-fuchsia-500 bg-clip-text text-transparent animate-pulse">ΚΘΠ</span>
          {!mobile && <span className="ml-2 text-sm font-semibold text-fuchsia-300">Phi Chapter at UGA</span>}
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {[
            ['Rush', '/rush'],
            ['About', '/#about'],
            ['Leadership', '/#leadership'],
            ['Hackathon', '/hackathon'],
            ['Contact', '/#contact'],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium transition-colors hover:text-fuchsia-400"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* ---------- MAIN ---------- */}
      <main className="relative flex-1 overflow-hidden">
        {/* Animated/Glowing Backgrounds */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 animate-pulse [background-image:radial-gradient(#00fff7_1px,transparent_1px)] [background-size:6px_6px] opacity-10" />
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -left-32 top-0 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-400 opacity-40 blur-[160px] animate-pulse" />
          <div className="absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-cyan-500 via-fuchsia-500 to-indigo-500 opacity-30 blur-[120px] animate-pulse" />
        </div>

        {/* Hero / Content */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 py-10 text-center md:py-24">
          <h1 className="mb-4 bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-6xl lg:text-7xl drop-shadow-neon animate-fade-in">
            KTP&nbsp;<span className="animate-fade animate-infinite">Hacks</span>
          </h1>
          <p className="mb-10 font-mono text-xs uppercase tracking-widest text-cyan-300 md:text-sm animate-fade-in delay-100">
            {gibberish}
          </p>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-fuchsia-200 md:text-xl animate-fade-in delay-200">
            An annual private hackathon where brothers turn caffeine &amp; code into the next big idea.
          </p>
          <p className="mx-auto mb-12 max-w-2xl text-sm text-indigo-300 animate-fade-in delay-300">
            No spring edition – we support&nbsp;
            <Link href="https://ugahacks.com" target="_blank" className="text-cyan-300 hover:underline">
              UGAHacks
            </Link>
            &nbsp;as the flagship event during that semester.
          </p>

          {/* Gallery */}
          <div className="mx-auto mb-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {[ktpHacks1, ktpHacks2, ktpHacks3].map((src, i) => (
              <div key={i} className="rounded-2xl bg-black/60 backdrop-blur-lg shadow-2xl border-2 border-indigo-900 hover:border-fuchsia-500 transition-all duration-300 group overflow-hidden">
                <Image
                  unoptimized
                  src={src}
                  alt={`KTP Hacks screenshot ${i + 1}`}
                  className="h-64 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="https://uga-ktp-hackathon-f24.devpost.com/" target="_blank">
              <Button className="rounded-xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-indigo-500 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:from-fuchsia-500 hover:to-cyan-500 transition-all duration-300 drop-shadow-neon">
                View Last Year’s DevPost
              </Button>
            </Link>
            <Link href="mailto:ryan.majd@uga.edu?subject=[KTPHacks Sponsor Inquiry]" target="_blank" className='p-0'>
              <Button className="rounded-xl bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-indigo-500 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:from-cyan-500 hover:to-fuchsia-500 transition-all duration-300 drop-shadow-neon">
                Sponsor Us
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
