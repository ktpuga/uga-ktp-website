// pages/hackathon/page.jsx
// 🚀 Dark‑mode hackathon page updated for our second hackathon (Fall 2025)

'use client'
import { Button } from '@/components/ui/button'
import Footer from '@/components/ui/footer'
import ktpHacks1 from '@/public/ktpHacks1.jpeg'
import ktpHacks2 from '@/public/ktpHacks2.jpeg'
import ktpHacks3 from '@/public/ktpHacks3.jpeg'
import ktpHacks4 from '@/public/ktphacks2_1.jpeg'
import ktpHacks13 from '@/public/ktphacks2_10.jpeg'
import ktpHacks5 from '@/public/ktphacks2_2.jpeg'
import ktpHacks6 from '@/public/ktphacks2_3.jpeg'
import ktpHacks7 from '@/public/ktphacks2_4.jpeg'
import ktpHacks8 from '@/public/ktphacks2_5.jpeg'
import ktpHacks9 from '@/public/ktphacks2_6.jpeg'
import ktpHacks10 from '@/public/ktphacks2_7.jpeg'
import ktpHacks11 from '@/public/ktphacks2_8.jpeg'
import ktpHacks12 from '@/public/ktphacks2_9.jpeg'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

export default function HackathonPage() {
  const [mobile, setMobile] = useState(false)
  const phrases = [
    'WELCOME_TO_KTP_HACKS',
    'SECOND_EVER • FALL_2025',
    '8_PROJECTS • 12_HOURS • 1_COMMUNITY',
    'exec.Code()=>CreateInnovation()'
  ]
  const [gibberish, setGibberish] = useState(phrases[0])
  const images = [
    ktpHacks1,
    ktpHacks2,
    ktpHacks3,
    ktpHacks4,
    ktpHacks5,
    ktpHacks6,
    ktpHacks7,
    ktpHacks8,
    ktpHacks9,
    ktpHacks10,
    ktpHacks11,
    ktpHacks12,
    ktpHacks13,
  ]
  const [lightbox, setLightbox] = useState({ open: false, index: 0 })

  useEffect(() => {
    let phraseIdx = 0 // which phrase is active?
    let scrambleTimer // shuffles letters
    let switchTimer // swaps phrases
    const updateMobile = () => setMobile(window.innerWidth < 599)
    updateMobile()
    window.addEventListener('resize', updateMobile)

    /** start/stop the letter-scramble interval */
    const startScramble = () => {
      scrambleTimer = setInterval(() => {
        setGibberish(prev =>
          prev
            .split('') // break into letters
            .sort(() => Math.random() - 0.5) // simple shuffle
            .join('')
        )
      }, 100) // adjust speed to taste
    }

    /** change to the next phrase every N ms */
    const switchPhrase = () => {
      clearInterval(scrambleTimer) // stop scrambling old phrase
      phraseIdx = (phraseIdx + 1) % phrases.length
      setGibberish(phrases[phraseIdx]) // show new phrase unscrambled
      startScramble() // then start scrambling it
    }

    // initial kick-off
    startScramble()
    switchTimer = setInterval(switchPhrase, 2000) // change every 2 s

    return () => {
      window.removeEventListener('resize', updateMobile)
      clearInterval(scrambleTimer)
      clearInterval(switchTimer)
    }
  }, [])

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900 relative overflow-hidden">
      {/* ---------- NAV ---------- */}
      <header className={`sticky top-0 z-50 flex h-16 items-center border-b px-4 backdrop-blur-md lg:px-6 transition-all duration-300 ${scrolled ? 'bg-white border-slate-200 shadow-sm' : 'bg-transparent border-transparent'}`}>
        <Link href="/" className="flex items-center font-bold">
          <Image src="/KTP PHI CHAPTER.svg" alt="ΚΘΠ" width={95} height={37} className="h-8 w-auto object-contain" />
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {[
            ['Home', '/'],
            ['Rush', '/rush'],
            ['About', '/#about'],
            ['Members', '/members-list'],
            ['KTP Life', '/ktp-life'],
          ].map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-medium transition-colors hover:text-blue-900"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* ---------- MAIN ---------- */}
      <main className="relative flex-1 overflow-hidden">
        {/* Animated/Glowing Backgrounds */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 [background-image:radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:6px_6px] opacity-5" />
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -left-32 top-0 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-blue-200 via-fuchsia-200 to-cyan-200 opacity-40 blur-[160px]" />
          <div className="absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-cyan-200 via-fuchsia-200 to-blue-200 opacity-30 blur-[120px]" />
        </div>

        {/* Hero / Content */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 py-10 text-center md:py-24">
          <h1 className="mb-4 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-900 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-6xl lg:text-7xl drop-shadow-xl animate-fade-in">
            KTP&nbsp;<span className="animate-fade animate-infinite">Hacks</span>
          </h1>

          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-blue-900 md:text-sm animate-fade-in delay-100">
            {gibberish}
          </p>

          {/* Edition + Stats */}
          <div className="mx-auto mb-8 flex flex-wrap items-center justify-center gap-2 text-sm md:text-base text-slate-600 animate-fade-in delay-150">
            <span className="rounded-full border border-fuchsia-400/50 bg-white/80 px-3 py-1">Second Edition • Fall 2025</span>
            <span className="rounded-full border border-cyan-400/50 bg-white/80 px-3 py-1">8 Projects</span>
            <span className="rounded-full border border-blue-900/50 bg-white/80 px-3 py-1">12 Hours</span>
            <span className="rounded-full border border-emerald-400/50 bg-white/80 px-3 py-1">Invite‑Only</span>
          </div>

          <p className="mx-auto mb-6 max-w-2xl text-lg text-slate-700 md:text-xl animate-fade-in delay-200">
            An annual private hackathon where brothers turn caffeine &amp; code into the next big idea.
          </p>

          <p className="mx-auto mb-3 max-w-2xl text-sm text-slate-600 animate-fade-in delay-300">
            Powered by community and sponsors:
            <span className="ml-2 text-blue-900">GitHub / GitHub Education</span>
            <span className="mx-2">•</span>
            <span className="text-blue-900">Red Bull</span>
            <span className="mx-2">•</span>
            <span className="text-blue-900">DoorDash</span>
          </p>

          <p className="mx-auto mb-10 max-w-2xl text-sm text-slate-600 animate-fade-in delay-300">
            No spring edition – we support{' '}
            <Link href="https://ugahacks.com" target="_blank" className="text-blue-900 hover:underline">
              UGAHacks
            </Link>{' '}
            as the flagship event during that semester.
          </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-6">
            <Link href="https://uga-ktp-hackathon-fall-25.devpost.com/" target="_blank">
              <Button className="rounded-xl bg-blue-900 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-blue-950 transition-all duration-300">
                View 2025 Devpost (This Year)
              </Button>
            </Link>
            <Link href="https://uga-ktp-hackathon-f24.devpost.com/" target="_blank">
              <Button className="rounded-xl bg-blue-900 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-blue-950 transition-all duration-300">
                View 2024 Devpost (Last Year)
              </Button>
            </Link>
            <Link href="mailto:ryan.majd@uga.edu?subject=[KTPHacks Sponsor Inquiry]" target="_blank" className="p-0">
              <Button className="rounded-xl bg-blue-900 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-blue-950 transition-all duration-300">
                Sponsor Us
              </Button>
            </Link>
          </div>

          {/* Gallery */}
          <div className="mx-auto mb-12 max-w-5xl">
            {/* Masonry layout: auto-fills columns, preserves native aspect ratios */}
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:balance]">
              {[
                ktpHacks1,
                ktpHacks2,
                ktpHacks3,
                ktpHacks4,
                ktpHacks5,
                ktpHacks6,
                ktpHacks7,
                ktpHacks8,
                ktpHacks9,
                ktpHacks10,
                ktpHacks11,
                ktpHacks12,
                ktpHacks13,
              ].map((src, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Open image ${i + 1}`}
                  className="mb-4 block w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md ring-0 transition duration-300 hover:border-blue-900/70 hover:shadow-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  onClick={() => setLightbox({ open: true, index: i })}
                >
                  <Image
                    unoptimized
                    src={src}
                    alt={`KTP Hacks gallery image ${i + 1}`}
                    className="w-full align-top transition-transform duration-500 hover:scale-[1.02]"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Lightbox */}
          {lightbox.open && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4"
              onClick={(e) => {
                if (e.currentTarget === e.target) setLightbox({ ...lightbox, open: false })
              }}
            >
              <div className="relative w-full max-w-5xl">
                <button
                  aria-label="Close"
                  className="absolute -top-10 right-0 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm text-white backdrop-blur hover:bg-white/20"
                  onClick={() => setLightbox({ ...lightbox, open: false })}
                >
                  Close
                </button>
                <button
                  aria-label="Previous image"
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightbox(({ index }) => ({ open: true, index: (index + images.length - 1) % images.length }))
                  }}
                >
                  ‹
                </button>
                <button
                  aria-label="Next image"
                  className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-white backdrop-blur hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLightbox(({ index }) => ({ open: true, index: (index + 1) % images.length }))
                  }}
                >
                  ›
                </button>
                <div className="mx-10 rounded-xl bg-black/40 p-2">
                  <Image
                    unoptimized
                    src={images[lightbox.index]}
                    alt={`KTP Hacks large image ${lightbox.index + 1}`}
                    className="mx-auto max-h-[80vh] w-auto object-contain"
                  />
                  <p className="mt-2 text-center text-xs text-slate-400">
                    {lightbox.index + 1} / {images.length}
                  </p>
                </div>
              </div>
            </div>
          )}

        
        </section>
      </main>

      <Footer />
    </div>
  )
}
