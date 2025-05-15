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
    <div className='flex min-h-screen flex-col font-sans bg-gray-950 text-gray-100'>
      <header className='sticky top-0 z-50 flex h-16 items-center border-b border-gray-800 bg-gray-900/70 px-4 backdrop-blur-sm lg:px-6'>
        <Link href='/' className='flex items-center font-bold text-pink-500'>ΚΘΠ<span className='ml-2 hidden text-lg font-semibold md:inline'>Phi Chapter at UGA</span></Link>
        <nav className='ml-auto flex gap-4 sm:gap-6'>
          <Link href='/' className='text-sm font-medium transition-colors hover:text-pink-500'>Home</Link>
        </nav>
      </header>

      <main className='flex-1'>
        {/* ---------- RESOURCES ---------- */}
        <section id='resources' className='bg-gray-900 py-10'>
          <div className='container mx-auto px-4 md:px-6 text-center'>
            <h2 className='mb-8 text-3xl font-bold tracking-tight text-pink-500 md:text-4xl'>ΚΘΠ <span className='font-gameOfSquids'>Prep Resources</span></h2>
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
                <div key={r.title} className='rounded-xl border border-pink-500 bg-gray-800 p-6 shadow-lg'>
                  <Link href={r.url} target='_blank' className='block font-medium text-pink-400 underline hover:text-pink-300'>
                    {r.title}
                  </Link>
                </div>
              ))}
            </Carousel>
          </div>
        </section>

        {/* ---------- TIMELINE ---------- */}
        <section className='bg-gray-800 py-16'>
          <div className='container mx-auto px-4 md:px-6 text-center'>
            <h1 className='mb-4 text-4xl font-bold tracking-tight text-emerald-400 md:text-5xl'>Fall&nbsp;2025 Rush</h1>
            <p className='mb-10 animate-pulse text-lg text-gray-400'>Last Semester's Theme: <span className='text-pink-500'>Squid&nbsp;Games</span></p>
            {/* <Timeline /> */}
            
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
