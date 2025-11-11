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
            ['Contact', '/#contact']
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

          <p className="mb-4 font-mono text-xs uppercase tracking-widest text-cyan-300 md:text-sm animate-fade-in delay-100">
            {gibberish}
          </p>

          {/* Edition + Stats */}
          <div className="mx-auto mb-8 flex flex-wrap items-center justify-center gap-2 text-sm md:text-base text-indigo-200 animate-fade-in delay-150">
            <span className="rounded-full border border-fuchsia-500/40 bg-black/40 px-3 py-1">Second Edition • Fall 2025</span>
            <span className="rounded-full border border-cyan-500/40 bg-black/40 px-3 py-1">8 Projects</span>
            <span className="rounded-full border border-indigo-500/40 bg-black/40 px-3 py-1">12 Hours</span>
            <span className="rounded-full border border-emerald-500/40 bg-black/40 px-3 py-1">Invite‑Only</span>
          </div>

          <p className="mx-auto mb-6 max-w-2xl text-lg text-fuchsia-200 md:text-xl animate-fade-in delay-200">
            An annual private hackathon where brothers turn caffeine &amp; code into the next big idea.
          </p>

          <p className="mx-auto mb-3 max-w-2xl text-sm text-indigo-300 animate-fade-in delay-300">
            Powered by community and sponsors:
            <span className="ml-2 text-cyan-200">GitHub / GitHub Education</span>
            <span className="mx-2">•</span>
            <span className="text-cyan-200">Red Bull</span>
            <span className="mx-2">•</span>
            <span className="text-cyan-200">DoorDash</span>
          </p>

          <p className="mx-auto mb-10 max-w-2xl text-sm text-indigo-300 animate-fade-in delay-300">
            No spring edition – we support{' '}
            <Link href="https://ugahacks.com" target="_blank" className="text-cyan-300 hover:underline">
              UGAHacks
            </Link>{' '}
            as the flagship event during that semester.
          </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-6">
            <Link href="https://uga-ktp-hackathon-fall-25.devpost.com/" target="_blank">
              <Button className="rounded-xl bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-indigo-500 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:from-fuchsia-500 hover:to-cyan-500 transition-all duration-300 drop-shadow-neon">
                View 2025 Devpost (This Year)
              </Button>
            </Link>
            <Link href="https://uga-ktp-hackathon-f24.devpost.com/" target="_blank">
              <Button className="rounded-xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-fuchsia-500 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:from-cyan-500 hover:to-fuchsia-500 transition-all duration-300 drop-shadow-neon">
                View 2024 Devpost (Last Year)
              </Button>
            </Link>
            <Link href="mailto:ryan.majd@uga.edu?subject=[KTPHacks Sponsor Inquiry]" target="_blank" className="p-0">
              <Button className="rounded-xl bg-gradient-to-r from-fuchsia-500 via-cyan-500 to-indigo-500 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:from-cyan-500 hover:to-fuchsia-500 transition-all duration-300 drop-shadow-neon">
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
                  className="mb-4 block w-full overflow-hidden rounded-2xl border border-indigo-900/60 bg-black/50 shadow-xl ring-0 transition duration-300 hover:border-fuchsia-500/70 hover:shadow-fuchsia-500/20 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
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
                  <p className="mt-2 text-center text-xs text-indigo-200">
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
