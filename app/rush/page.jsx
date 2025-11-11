// pages/rush/page.jsx
'use client'
import Footer from '@/components/ui/footer'
import Timeline from '@/components/ui/timeline'
import Link from 'next/link'
import React from 'react'
import Carousel from 'react-multi-carousel'
import 'react-multi-carousel/lib/styles.css'

const responsive = {
  superLargeDesktop: { breakpoint: { max: 4000, min: 1024 }, items: 3 },
  desktop: { breakpoint: { max: 1024, min: 768 }, items: 2 },
  tablet: { breakpoint: { max: 768, min: 464 }, items: 1 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 }
}

const resources = [
  { title: 'UGA CC – Online Resources', url: 'https://career.uga.edu/online_resources' },
  { title: 'Resume & Cover‑Letter Templates', url: 'https://career.uga.edu/students#resumes_cover_letters' },
  { title: 'Interviewing Resources', url: 'https://career.uga.edu/students#interviewing' },
  { title: 'Do & Don’ts of Video Interviews', url: 'https://www.wayup.com/guide/6-dos-and-donts-of-video-interviews/' },
  { title: 'First‑Round Interview Tips', url: 'https://www.wayup.com/guide/first-round-interview-tips-will-land-second-interview/' },
  { title: 'Guide to Follow‑Ups', url: 'https://www.wayup.com/guide/the-ultimate-guide-to-following-up/' },
  { title: 'UGA Email‑Signature Builder', url: 'https://brand.uga.edu/email-signature-builder/' }
]

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
        {/* ---------- HERO ---------- */}
        <section className="relative flex flex-col items-center justify-center py-20 md:py-32 min-h-[50vh] overflow-hidden">
          {/* Decorative blue glows */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute -left-1/4 -top-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-sky-500 via-indigo-500 to-cyan-400 opacity-25 blur-3xl" />
            <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-500 opacity-30 blur-2xl" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-tr from-sky-400 via-indigo-300 to-cyan-300 drop-shadow-xl">
            Spring Rush 2026... Coming Soon
          </h1>

          <p className="mt-4 text-lg md:text-2xl text-center text-sky-200/90 max-w-2xl">
            Details are being finalized. Check back soon for dates, locations, and the official theme.
          </p>

          {/* Interest link placeholder (disabled until ready) */}
          <span className="mt-8 inline-block px-8 py-3 rounded-full border border-sky-400/50 text-sky-200/80 bg-white/5 backdrop-blur shadow-lg select-none">
            ❓ Interest Form: TBD
          </span>
        </section>

        {/* ---------- RESOURCES (blue theme) ---------- */}
        <section id='resources' className='bg-black/30 py-10'>
          <div className='container mx-auto px-4 md:px-6 text-center'>
            <h2 className='mb-8 text-3xl font-bold tracking-tight text-sky-300 md:text-4xl'>Prep Resources</h2>
            <Carousel
              responsive={responsive}
              infinite
              autoPlay
              autoPlaySpeed={3200}
              arrows={false}
              showDots
              containerClass='mx-auto max-w-5xl'
              itemClass='px-2'
              removeArrowOnDeviceType={['tablet', 'mobile']}
            >
              {resources.map((r) => (
                <div key={r.title} className='rounded-2xl border-2 border-indigo-800 bg-gradient-to-br from-slate-900 via-indigo-900/60 to-sky-900/40 p-6 shadow-xl backdrop-blur-lg'>
                  <Link href={r.url} target='_blank' className='block font-semibold text-sky-300 underline hover:text-cyan-300 transition-colors'>
                    {r.title}
                  </Link>
                </div>
              ))}
            </Carousel>
          </div>
        </section>

        {/* ---------- TIMELINE (placeholder cards) ---------- */}
        <section className='relative bg-gradient-to-br from-slate-950 via-indigo-950 to-sky-950 py-16'>
          <div className='container mx-auto px-4 md:px-6 text-center'>
            <h2 className='mb-8 text-4xl font-extrabold tracking-tight text-sky-300 md:text-5xl'>Rush Week Events</h2>
            <p className='mx-auto mb-10 max-w-xl text-sky-200/80'>
              Dates and venues are TBD. Here’s the typical structure — exact info will be announced soon.
            </p>
            <div className='mx-auto max-w-3xl grid gap-8 md:grid-cols-2'>
              {[
                { label: 'Info Session 1', when: '??/??', where: 'TBD', time: 'TBD' },
                { label: 'Info Session 2', when: '??/??', where: 'TBD', time: 'TBD' },
                { label: 'Social / Game Night', when: '??/??', where: 'TBD', time: 'TBD' },
                { label: 'Interviews', when: '??/??–??/??', where: 'Various', time: 'By email' },
              ].map((e) => (
                <div key={e.label} className='rounded-2xl bg-white/5 shadow-lg p-8 flex flex-col items-center border-2 border-indigo-800 hover:border-sky-500 transition-all duration-300'>
                  <div className='mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 via-indigo-500 to-cyan-400 shadow-md text-3xl font-bold text-white'>
                    ?
                  </div>
                  <h3 className='text-2xl font-bold text-sky-200 mb-1'>{e.label}</h3>
                  <p className='text-sky-300/90'>{e.where}</p>
                  <p className='text-sky-300/60'>{e.when} · {e.time}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}