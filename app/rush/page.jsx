'use client'
import Footer from '@/components/ui/footer'
import Link from 'next/link'
import React from 'react'

export default function Page () {
  return (
    <div className='flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-950 text-sky-100'>
      <header className='sticky top-0 z-50 flex h-16 items-center border-b border-indigo-800 bg-black/60 px-4 backdrop-blur-md lg:px-6 shadow-md'>
        <Link href='/' className='flex items-center font-bold text-sky-300'>
          <span className="text-2xl md:text-3xl tracking-tight bg-gradient-to-tr from-sky-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">ΚΘΠ</span>
          <span className='ml-2 hidden text-lg font-semibold md:inline text-indigo-300'>Phi Chapter at UGA</span>
        </Link>
        <nav className='ml-auto flex gap-4 sm:gap-6'>
          <Link href='/' className='text-sm font-medium transition-colors hover:text-sky-300'>Home</Link>
        </nav>
      </header>

      <main className='flex-1'>
        <section className="relative flex min-h-[60vh] flex-col items-center justify-center overflow-x-hidden px-4 py-24 md:py-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-1/4 -top-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-sky-500 via-indigo-500 to-cyan-400 opacity-25 blur-3xl" />
            <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-500 opacity-30 blur-2xl" />
          </div>

          <p className="mb-4 rounded-full border border-sky-400/40 bg-white/5 px-4 py-1.5 text-sm font-semibold tracking-wide text-sky-200/90 backdrop-blur">
            Fall Rush 2026
          </p>

          <h1 className="inline-block pb-1 text-center text-5xl font-extrabold leading-normal tracking-tight text-transparent drop-shadow-xl md:text-7xl bg-gradient-to-tr from-sky-400 via-indigo-300 to-cyan-300 bg-clip-text">
            Coming soon
          </h1>

          <p className="mt-6 max-w-lg text-center text-lg text-sky-200/85 md:text-xl">
            Rush schedule, events, and signups will be posted here soon. Check back later, or reach out on Instagram if you have questions.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <Link
              href="/"
              className="rounded-full border border-sky-400/50 bg-white/5 px-8 py-3 text-sm font-medium text-sky-100 backdrop-blur transition-colors hover:border-sky-300 hover:bg-white/10"
            >
              ← Back to home
            </Link>
            <a
              href="https://www.instagram.com/ugaktp/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-indigo-500/40 bg-indigo-950/40 px-8 py-3 text-sm font-medium text-sky-100 backdrop-blur transition-colors hover:border-sky-400/60"
            >
              @ugaktp on Instagram
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
