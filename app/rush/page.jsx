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
    <div className='flex min-h-screen flex-col font-sans bg-gradient-to-br from-pink-200 via-yellow-100 to-cyan-100 text-pink-900'>
      <header className='sticky top-0 z-50 flex h-16 items-center border-b border-pink-300 bg-white/70 px-4 backdrop-blur-md lg:px-6 shadow-md'>
        <Link href='/' className='flex items-center font-bold text-pink-500'>
          <span className="text-2xl md:text-3xl tracking-tight bg-gradient-to-tr from-pink-500 via-yellow-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">ΚΘΠ</span>
          <span className='ml-2 hidden text-lg font-semibold md:inline text-pink-400'>Phi Chapter at UGA</span>
        </Link>
        <nav className='ml-auto flex gap-4 sm:gap-6'>
          <Link href='/' className='text-sm font-medium transition-colors hover:text-pink-500'>Home</Link>
        </nav>
      </header>

      <main className='flex-1'>
        {/* ---------- HERO ---------- */}
        <section className="relative flex flex-col items-center justify-center py-20 md:py-32 min-h-[50vh] overflow-hidden">
  {/* Decorative gradients */}
  <div className="absolute inset-0 -z-10 pointer-events-none">
    <div
      className="absolute -left-1/4 -top-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-pink-400 via-yellow-300 to-cyan-300 opacity-20 blur-3xl"
    />
    <div
      className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-gradient-to-tr from-yellow-200 via-pink-200 to-cyan-200 opacity-30 blur-2xl "
    />
  </div>

  {/* Palm tree SVG with gentle sway */}
  <svg
    className="absolute left-8 bottom-0 w-24 h-24 opacity-70 animate-swing"
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
  >
    <path d="M32 60V36" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
    <path
      d="M32 36C32 36 29 28 20 28C11 28 8 36 8 36C8 36 15 32 24 36C33 40 32 36 32 36Z"
      fill="#f472b6"
    />
    <path
      d="M32 36C32 36 35 28 44 28C53 28 56 36 56 36C56 36 49 32 40 36C31 40 32 36 32 36Z"
      fill="#38bdf8"
    />
  </svg>

  {/* Sun SVG */}
  <svg
    className="absolute right-8 top-8 w-16 h-16 opacity-80"
    viewBox="0 0 64 64"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="32" cy="32" r="14" fill="#fde68a" />
    <g stroke="#fbbf24" strokeWidth="2">
      <line x1="32" y1="4" x2="32" y2="16" />
      <line x1="32" y1="48" x2="32" y2="60" />
      <line x1="4" y1="32" x2="16" y2="32" />
      <line x1="48" y1="32" x2="60" y2="32" />
      <line x1="12.22" y1="12.22" x2="20.49" y2="20.49" />
      <line x1="43.51" y1="43.51" x2="51.78" y2="51.78" />
      <line x1="12.22" y1="51.78" x2="20.49" y2="43.51" />
      <line x1="43.51" y1="20.49" x2="51.78" y2="12.22" />
    </g>
  </svg>

  <h1 className="text-5xl md:text-7xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-tr from-pink-500 via-yellow-400 to-cyan-400 drop-shadow-lg">
    Love Island Rush
  </h1>

  <p className="mt-4 text-lg md:text-2xl text-center text-pink-600 max-w-xl">
    Find your perfect match with ΚΘΠ! Join us for a week of fun, friendship, and unforgettable Love Island vibes.
    <br />
    All majors welcome!
  </p>

  <Link
    href="https://forms.gle/CKxazwh6BvDTp6yr7"
    target="_blank"
    className="mt-8 inline-block px-8 py-3 bg-gradient-to-r from-pink-500 to-yellow-500 text-white font-semibold rounded-full shadow-xl transform hover:scale-105 transition duration-300"
    aria-label="Open Rush Form in new tab"
  >
    💌 Apply Now
  </Link>
</section>


        {/* ---------- RESOURCES ---------- */}
        <section id='resources' className='bg-white/60 py-10'>
          <div className='container mx-auto px-4 md:px-6 text-center'>
            <h2 className='mb-8 text-3xl font-bold tracking-tight text-pink-500 md:text-4xl'>Prep Resources</h2>
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
                <div key={r.title} className='rounded-2xl border-2 border-pink-300 bg-gradient-to-br from-pink-100 via-yellow-50 to-cyan-50 p-6 shadow-xl backdrop-blur-lg'>
                  <Link href={r.url} target='_blank' className='block font-semibold text-pink-600 underline hover:text-pink-400 transition-colors'>
                    {r.title}
                  </Link>
                </div>
              ))}
            </Carousel>
          </div>
        </section>

        {/* ---------- TIMELINE ---------- */}
        <section className='relative bg-gradient-to-br from-pink-100 via-yellow-50 to-cyan-50 py-16'>
          {/* Beach wave SVG at bottom */}
          <svg className="absolute left-0 bottom-0 w-full h-24 md:h-32 -z-10" viewBox="0 0 1440 320" fill="none"><path fill="#fbbf24" fillOpacity="0.18" d="M0,224L48,202.7C96,181,192,139,288,133.3C384,128,480,160,576,186.7C672,213,768,235,864,229.3C960,224,1056,192,1152,170.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" /><path fill="#38bdf8" fillOpacity="0.12" d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,154.7C672,160,768,192,864,197.3C960,203,1056,181,1152,154.7C1248,128,1344,96,1392,80L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" /></svg>
          {/* <Timeline
            timelineColor="bg-pink-300"
            dotColor="bg-yellow-300"
            cardClass="rounded-lg bg-white/80 p-6 shadow-lg border-2 border-pink-200 hover:border-yellow-300 transition-all duration-300"
            accentClass="text-pink-500"
            headingClass="mb-2 text-lg font-heading text-pink-600"
            aosAnimation="fade-up"
          /> */}
          <div className='container mx-auto px-4 md:px-6 text-center'>
            <h2 className='mb-8 text-4xl font-extrabold tracking-tight text-pink-500 md:text-5xl'>Rush Week Events</h2>
            <div className='mx-auto max-w-2xl grid gap-8 md:grid-cols-2'>
              {/* Event 1 */}
              <div className='rounded-2xl bg-white/80 shadow-lg p-8 flex flex-col items-center border-2 border-pink-200 hover:border-yellow-300 transition-all duration-300'>
                <div className='mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-pink-300 via-yellow-200 to-cyan-200 shadow-md text-3xl font-bold text-pink-500'>
                  9/1
                </div>
                <h3 className='text-2xl font-bold text-pink-600 mb-2'>Info Session 1</h3>
                <p className='text-pink-500'>Via Zoom</p>
                <p className='text-pink-400'>7-8 PM</p>
              </div>
              {/* Event 2 */}
              <div className='rounded-2xl bg-white/80 shadow-lg p-8 flex flex-col items-center border-2 border-pink-200 hover:border-yellow-300 transition-all duration-300'>
                <div className='mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-pink-300 via-yellow-200 to-cyan-200 shadow-md text-3xl font-bold text-pink-500'>
                  9/2
                </div>
                <h3 className='text-2xl font-bold text-pink-600 mb-2'>Info Session 2</h3>
                <p className='text-pink-500'>Boyd 307A</p>
                <p className='text-pink-400'>7-8 PM</p>
              </div>
              {/* Event 3 */}
              <div className='rounded-2xl bg-white/80 shadow-lg p-8 flex flex-col items-center border-2 border-pink-200 hover:border-yellow-300 transition-all duration-300'>
                <div className='mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-pink-300 via-yellow-200 to-cyan-200 shadow-md text-3xl font-bold text-pink-500'>
                  9/3
                </div>
                <h3 className='text-2xl font-bold text-pink-600 mb-2'>Info Session 3</h3>
                <p className='text-pink-500'>Boyd 307A</p>
                <p className='text-pink-400'>7-8 PM</p>
              </div>
              {/* Event 4 */}
              <div className='rounded-2xl bg-white/80 shadow-lg p-8 flex flex-col items-center border-2 border-pink-200 hover:border-yellow-300 transition-all duration-300'>
                <div className='mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-pink-300 via-yellow-200 to-cyan-200 shadow-md text-3xl font-bold text-pink-500'>
                  9/4
                </div>
                <h3 className='text-2xl font-bold text-pink-600 mb-2'>Game Night</h3>
                <p className='text-pink-500'>Boyd 307A</p>
                <p className='text-pink-400'>7-8 PM</p>
              </div>
              {/* Event 5 */}
              <div className='rounded-2xl bg-white/80 shadow-lg p-8 flex flex-col items-center border-2 border-pink-200 hover:border-yellow-300 transition-all duration-300'>
                <div className='mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-pink-300 via-yellow-200 to-cyan-200 shadow-md text-3xl font-bold text-pink-500'>
                  9/5
                </div>
                <h3 className='text-2xl font-bold text-pink-600 mb-2'>Speed Dating</h3>
                <p className='text-pink-500'>Boyd 203</p>
                <p className='text-pink-400'>7-8 PM</p>
              </div>
              {/* Event 6 */}
              <div className='rounded-2xl bg-white/80 shadow-lg p-8 flex flex-col items-center border-2 border-pink-200 hover:border-yellow-300 transition-all duration-300'>
                <div className='mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-pink-300 via-yellow-200 to-cyan-200 shadow-md text-3xl font-bold text-pink-500'>
                  9/8-9/16
                </div>
                <h3 className='text-2xl font-bold text-pink-600 mb-2'>Interviews</h3>
                <p className='text-pink-500'>Various</p>
                <p className='text-pink-400'>Times (See email)</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
