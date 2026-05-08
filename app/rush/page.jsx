// pages/rush/page.jsx
'use client'
import Footer from '@/components/ui/footer'
import Timeline from '@/components/ui/timeline'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
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
  const [scrolled, setScrolled] = useState(false)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const updateMobile = () => setMobile(window.innerWidth < 599)
    updateMobile()
    window.addEventListener('resize', updateMobile)
    return () => window.removeEventListener('resize', updateMobile)
  }, [])

  return (
    <div className='flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900'>
      <header className={`sticky top-0 z-50 flex h-16 items-center border-b px-4 backdrop-blur-md lg:px-6 transition-all duration-300 ${scrolled ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/80 border-transparent'}`}>
        <Link href='/' className='flex items-center gap-2'>
          <Image src='/KTP PHI CHAPTER.svg' alt='ΚΘΠ' width={48} height={48} className='h-10 w-auto object-contain' />
        </Link>
        <nav className='ml-auto flex gap-4 sm:gap-6'>
          {[
            { href: '/', label: 'Home' },
            { href: '/rush', label: 'Rush' },
            { href: '/#about', label: 'About', hideOnMobile: true },
            { href: '/members-list', label: 'Members' },
            { href: '/ktp-life', label: 'KTP Life' },
            // { href: '/hackathon', label: 'Hackathon' },
          ]
            .filter((l) => !(mobile && l.hideOnMobile))
            .map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`relative text-sm font-medium transition-colors duration-300 before:absolute before:-bottom-0.5 before:left-0 before:h-0.5 before:w-full before:origin-left before:scale-x-0 before:bg-blue-900 before:transition-transform before:duration-300 hover:text-blue-900 hover:before:scale-x-100 ${
                  l.label === 'Rush' ? 'text-blue-900 before:scale-x-100' : ''
                }`}
              >
                {l.label}
              </Link>
            ))}
        </nav>
        {/* hide until we have a login page ready 
        <Link
          href='/login'
          className='ml-6 text-sm font-medium px-3 py-1.5 rounded-md bg-blue-900 text-white border border-blue-900 transition-colors duration-300 hover:bg-blue-800 hover:border-blue-800'
        >
          Portal Login
        </Link>
        */}
      </header>

      <main className='flex-1'>
        {/* ---------- HERO ---------- */}
        <section className="relative flex flex-col items-center justify-center py-20 md:py-32 min-h-[50vh] overflow-hidden">
          {/* Decorative blue glows */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute -left-1/4 -top-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-sky-300 via-blue-200 to-cyan-200 opacity-30 blur-3xl" />
            <div className="absolute -right-1/4 -bottom-1/4 h-96 w-96 rounded-full bg-gradient-to-tr from-cyan-200 via-sky-300 to-blue-200 opacity-25 blur-2xl" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-center text-blue-900 drop-shadow-xl">
            Fall Rush 2027 - Coming Soon!
          </h1>

          <p className="mt-4 text-lg md:text-2xl text-center text-slate-700 max-w-2xl">
            Here are the rush events!
          </p>

          {/* Interest link placeholder (Dont Open Until Fall 2027 Rush!)
          <span className="mt-8 inline-block px-8 py-3 rounded-full border border-blue-900/60 text-blue-900 bg-white/80 backdrop-blur shadow-lg select-none">
            <Link href="https://docs.google.com/forms/d/e/1FAIpQLSeJcH3DrhT2-tV3HKejUGByJiL71F3dJF-BhTziDTC6-2xo5w/viewform">
            ❓ Interest Form: Click Here
              </Link>
          </span>
          */}
        </section>


        {/* ---------- RESOURCES (blue theme) ---------- */}
        <section id='resources' className='bg-slate-100 py-10'>
          <style>{`
            .react-multi-carousel-dot button {
              border-color: #1e3a5f;
              background: transparent;
            }
            .react-multi-carousel-dot--active button {
              background: #1e3a5f;
            }
          `}</style>
          <div className='container mx-auto px-4 md:px-6 text-center'>
            <h2 className='mb-8 text-3xl font-bold tracking-tight text-blue-900 md:text-4xl'>Prep Resources</h2>
            <Carousel
              responsive={responsive}
              infinite
              autoPlay
              autoPlaySpeed={3200}
              arrows={false}
              showDots
              containerClass='mx-auto max-w-5xl pb-10'
              itemClass='px-2'
              removeArrowOnDeviceType={['tablet', 'mobile']}
            >
              {resources.map((r) => (
                <div key={r.title} className='rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-md'>
                  <Link href={r.url} target='_blank' className='block font-semibold text-blue-900 underline hover:text-black transition-colors'>
                    {r.title}
                  </Link>
                </div>
              ))}
            </Carousel>
          </div>
        </section>

        {/* ---------- TIMELINE (placeholder cards) ---------- */}
        <section id='events' className='relative bg-gradient-to-b from-white to-slate-100 py-16'>
          <div className='container mx-auto px-4 md:px-6 text-center'>
            <h2 className='mb-8 text-4xl font-extrabold tracking-tight text-blue-900 md:text-5xl'>Rush Week Events</h2>
            <p className='mx-auto mb-10 max-w-xl text-slate-600'>
              Dates and venues are TBD. Here’s the typical structure — exact info will be announced soon.
            </p>
            <div className='mx-auto max-w-3xl grid gap-8 md:grid-cols-2'>
              {[
                { label: 'Info Session 1', when: '1/28', where: 'Boyd 328', time: '7:00pm' },
                { label: 'Info Session 2', when: '1/29', where: 'Boyd 328', time: '7:00pm' },
                { label: 'Info Session 3', when: '1/30', where: 'Boyd 328', time: '7:00pm' },
                { label: 'Social / Game Night', when: '2/2', where: 'Boyd 328', time: '7:00pm' },
                { label: 'Shark Tank Night', when: '2/3', where: 'Boyd 328', time: '7:00pm' },
                { label: 'Meet the Brothers: Speed Dating', when: '2/9', where: 'Boyd 328', time: '7:00pm' },
                { label: 'Interviews', when: '2/10–2/16', where: 'Various', time: 'By email' },
              ].map((e) => (
                <div key={e.label} className='rounded-2xl bg-white shadow-lg p-8 flex flex-col items-center border-2 border-slate-200 hover:border-blue-900 transition-all duration-300'>
                  <div className='mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-blue-900 shadow-md text-3xl font-bold text-white'>
                    ?
                  </div>
                  <h3 className='text-2xl font-bold text-slate-900 mb-1'>{e.label}</h3>
                  <p className='text-slate-600'>{e.where}</p>
                  <p className='text-slate-400'>{e.when} · {e.time}</p>
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
