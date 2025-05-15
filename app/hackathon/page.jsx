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
  const [gibberish, setGibberish] = useState('WELCOME_TO_KTP_HACKS')

  useEffect(() => {
    const updateMobile = () => setMobile(window.innerWidth < 599)
    updateMobile()
    window.addEventListener('resize', updateMobile)

    const scramble = setInterval(() => {
      // shuffle characters
      setGibberish((prev) => prev.split('').sort(() => Math.random() - 0.5).join(''))
    }, 100)

    return () => {
      window.removeEventListener('resize', updateMobile)
      clearInterval(scramble)
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col font-sans bg-gray-900 text-gray-100">
      {/* ---------- NAV ---------- */}
      <header className="sticky top-0 z-50 flex h-16 items-center border-b border-gray-700 bg-gray-800/80 px-4 backdrop-blur-md lg:px-6">
        <Link href="/" className="flex items-center font-bold text-indigo-400">
          ΚΘΠ {!mobile && <span className="ml-2 text-sm font-semibold text-gray-300">Phi Chapter at UGA</span>}
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
              className="text-sm font-medium transition-colors hover:text-indigo-400"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* ---------- MAIN ---------- */}
      <main className="relative flex-1 overflow-hidden">
        {/* Starfield background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 animate-pulse [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:4px_4px] opacity-10" />

        {/* Blurred gradient blobs */}
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-30 blur-[140px]" />
          <div className="absolute -bottom-32 right-0 h-[24rem] w-[24rem] rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 opacity-25 blur-[120px]" />
        </div>

        {/* Hero / Content */}
        <section className="relative z-10 mx-auto max-w-5xl px-6 py-10 text-center md:py-24">
          <h1 className="mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-5xl font-extrabold tracking-tight text-transparent md:text-6xl lg:text-7xl">
            KTP&nbsp;<span className="animate-fade animate-infinite">Hacks</span>
          </h1>
           <p className="mb-10 font-mono text-xs uppercase tracking-widest text-emerald-400 md:text-sm">
            {gibberish}
          </p>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300 md:text-xl">
            An annual private hackathon where brothers turn caffeine &amp; code into the next big idea. <br/>
          </p>
         

          <p className="mx-auto mb-12 max-w-2xl text-sm text-gray-400">
            No spring edition – we support
            <Link href="https://ugahacks.com" target="_blank" className="text-indigo-400 hover:underline">
              &nbsp;UGAHacks
            </Link>
            &nbsp;as the flagship event during that semester.
          </p>

          {/* Gallery */}
          <div className="mx-auto mb-12 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[ktpHacks1, ktpHacks2, ktpHacks3].map((src, i) => (
              <Image
                unoptimized
                key={i}
                src={src}
                alt={`KTP Hacks screenshot ${i + 1}`}
                className="h-64 w-full rounded-xl object-cover shadow-lg transition-transform hover:scale-[1.03]"
              />
            ))}
          </div>

          <Link href="https://uga-ktp-hackathon-f24.devpost.com/" target="_blank">
            <Button className="rounded-lg bg-indigo-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-indigo-500">
              View Last Year’s DevPost
            </Button>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}
