'use client'
import Footer from '@/components/ui/footer'
import Image from 'next/image'
import Link from 'next/link'
import CountdownTimer from '@/app/rush/countdownTimer'
import { RUSH_EVENTS, RUSH_FAQ } from '@/app/rush/rush-content'
import React, { useEffect, useState } from 'react'

function FaqItem ({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border-b border-[#6b1c2a] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left sm:py-5 lg:py-6"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-white sm:text-base lg:text-lg">{question}</span>
        <span className="shrink-0 text-lg text-[#d4af37]" aria-hidden>
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && (
        <p className="pb-4 text-sm leading-relaxed text-[#c9b896] whitespace-pre-line sm:pb-5 sm:text-base lg:pb-6 lg:text-lg">
          {answer}
        </p>
      )}
    </div>
  )
}

function SectionHeading ({ label, title, description }) {
  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37] sm:tracking-[0.35em]">
        {label}
      </p>
      <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#c9b896] sm:text-base lg:max-w-2xl">
          {description}
        </p>
      )}
    </div>
  )
}

export default function Page () {
  const [scrolled, setScrolled] = useState(false)
  const [openFaqId, setOpenFaqId] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className='flex min-h-screen flex-col overflow-x-hidden font-sans bg-[#0a0a0a] text-white'>
      <header className={`sticky top-0 z-50 flex h-14 shrink-0 items-center px-4 sm:h-16 lg:px-6 transition-all duration-300 border-b-2 bg-[#0a0a0a] border-[#6b1c2a] ${scrolled ? 'shadow-md' : ''}`}>
        <Link href='/' className='flex min-w-0 items-center gap-2'>
          <Image src="/KTP PHI CHAPTER.svg" alt="KTP Phi Chapter" width={100} height={40} className="h-7 w-auto shrink-0 sm:h-8" style={{filter: 'brightness(0) invert(1)'}} />
          <span className='hidden truncate text-base font-semibold sm:text-lg md:inline text-[#d4af37]'>Phi Chapter at UGA</span>
        </Link>
        <nav className='ml-auto flex shrink-0 gap-4 sm:gap-6'>
          <Link href='/' className='text-sm font-medium text-white transition-colors hover:text-[#d4af37]'>Home</Link>
        </nav>
      </header>

      <main className='flex-1 border-b-4 border-[#6b1c2a] bg-[#111111]'>
        <div className="w-full px-4 py-10 sm:px-6 sm:py-16 lg:px-12 lg:py-20 xl:px-16">
          <div className="flex flex-col items-center text-center">
            <p className="mb-3 text-xs font-semibold tracking-wide text-white sm:mb-4 sm:text-sm rounded-full border-2 border-[#d4af37] bg-[#2a1219] px-3 py-1.5 sm:px-4">
              Fall Rush 2026
            </p>

            <h1 className="flex w-full flex-col items-center">
              <span className="sr-only">Kappa Theta Pi Fall Rush</span>
              <span
                aria-hidden
                className="aspect-[378/150] w-full max-w-[10rem] bg-[#d4af37] drop-shadow-xl sm:max-w-[12rem] md:max-w-[14rem] lg:max-w-xs xl:max-w-sm"
                style={{
                  WebkitMaskImage: 'url(/KTP%20PHI%20CHAPTER.svg)',
                  maskImage: 'url(/KTP%20PHI%20CHAPTER.svg)',
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                }}
              />
              <span className="mt-3 text-3xl font-extrabold tracking-tight text-[#d4af37] drop-shadow-xl sm:mt-4 sm:text-4xl md:text-5xl lg:text-6xl">
                Fall Rush
              </span>
            </h1>

            <CountdownTimer targetDate="2026-08-31T18:00:00" />

            <p className="mt-4 w-full max-w-lg text-balance text-base leading-relaxed text-[#e8e0d5] sm:mt-6 sm:text-lg lg:max-w-3xl md:text-xl">
              Interest Forms and Applications will be posted here soon. Check back later, or reach out on Instagram if you have questions.
            </p>

            <div className="mt-8 flex w-full max-w-xs flex-col items-stretch gap-3 sm:mt-10 sm:max-w-none sm:w-auto sm:flex-row sm:items-center sm:justify-center sm:gap-6">
              <Link
                href="/"
                className="rounded-full border-2 border-[#d4af37] bg-[#1a1a1a] px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#6b1c2a] hover:border-[#f0d060] sm:px-8"
              >
                ← Back to home
              </Link>
              <a
                href="https://www.instagram.com/ugaktp/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-[#3b82f6] bg-[#1e3a8a] px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] hover:border-[#60a5fa] sm:px-8"
              >
                @ugaktp on Instagram
              </a>
            </div>
          </div>

          <div id="timeline" className="mt-16 border-t border-[#6b1c2a] pt-16 sm:mt-20 sm:pt-20">
            <SectionHeading
              label="Two-Week Rush"
              title="Event Timeline"
              description="Dates and locations are not finalized yet. Rush typically happens around the beginning of the semester and spans about two weeks."
            />

            <ol className="relative mt-10 space-y-0 sm:mt-12">
              <div className="absolute bottom-4 left-[0.6875rem] top-4 w-px bg-[#6b1c2a] sm:left-4 lg:hidden" aria-hidden />
              {RUSH_EVENTS.map((event, index) => (
                <li key={event.id} className="relative flex gap-4 border-[#6b1c2a]/50 pb-8 last:pb-0 sm:gap-6 sm:pb-10 lg:gap-8 lg:border-b lg:pb-12 lg:pt-2 lg:last:border-b-0">
                  <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#d4af37] bg-[#1a1a1a] text-[0.6rem] font-bold text-[#d4af37] sm:h-8 sm:w-8 sm:text-xs lg:h-10 lg:w-10 lg:text-sm">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1 text-left lg:flex lg:items-start lg:justify-between lg:gap-12 xl:gap-20">
                    <div className="lg:w-2/5 lg:shrink-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white sm:text-lg lg:text-xl">{event.title}</h3>
                        <span className="rounded-full border border-[#d4af37]/50 bg-[#2a1219] px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-[#d4af37]">
                          TBD
                        </span>
                      </div>
                      <dl className="mt-2 space-y-1 text-sm text-[#c9b896] lg:mt-3 lg:text-base">
                        <div className="flex flex-wrap gap-x-4 gap-y-1 lg:flex-col lg:gap-y-2">
                          <div>
                            <dt className="sr-only">Date</dt>
                            <dd><span className="text-[#d4af37]">Date:</span> {event.date}</dd>
                          </div>
                          <div>
                            <dt className="sr-only">Time</dt>
                            <dd><span className="text-[#d4af37]">Time:</span> {event.time}</dd>
                          </div>
                        </div>
                        <div>
                          <dt className="sr-only">Location</dt>
                          <dd><span className="text-[#d4af37]">Location:</span> {event.location}</dd>
                        </div>
                      </dl>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#e8e0d5]/90 sm:text-base lg:mt-0 lg:w-3/5 lg:text-lg">
                      {event.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div id="faq" className="mt-16 border-t border-[#6b1c2a] pt-16 sm:mt-20 sm:pt-20">
            <SectionHeading   
              title="Frequently Asked Questions"
            />

            <div className="mt-8 w-full sm:mt-10">
              {RUSH_FAQ.map((item) => (
                <FaqItem
                  key={item.id}
                  question={item.question}
                  answer={item.answer}
                  isOpen={openFaqId === item.id}
                  onToggle={() => setOpenFaqId(openFaqId === item.id ? null : item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <div className="[&_footer]:border-t-2 [&_footer]:border-[#6b1c2a] [&_footer]:bg-[#0a0a0a] [&_footer_p]:text-[#c9b896] [&_footer_a]:text-[#e8e0d5] [&_footer_a:hover]:text-[#d4af37] [&_footer_a:hover]:no-underline">
        <Footer />
      </div>
    </div>
  )
}
