'use client';

import { useState } from 'react';
import { rosterPictureSrc } from '@/lib/avatar';

function fullName(person) {
  return [person?.firstName, person?.lastName].filter(Boolean).join(' ') || 'Chapter President';
}

function initials(person) {
  return `${person?.firstName?.[0] ?? ''}${person?.lastName?.[0] ?? ''}`.toUpperCase() || 'KTP';
}

export default function PresidentMessage({ president, message, featured = false }) {
  const name = fullName(president);
  const imageSrc = rosterPictureSrc(president?.id, president?.profilePictureAssetId);
  const [imageFailed, setImageFailed] = useState(false);
  const Heading = featured ? 'h1' : 'h2';

  return (
    <section className={`relative overflow-hidden border-y border-slate-200 ${featured ? 'bg-gradient-to-br from-white via-slate-50 to-blue-50 py-14 md:py-20' : 'bg-slate-50 py-16 md:py-20'}`}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/2 h-[40rem] w-[40rem] -translate-y-1/2 rounded-full bg-blue-300/25 blur-3xl" />
        <div className="absolute right-[12%] top-0 h-[30rem] w-[30rem] rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <div className={`relative mx-auto grid items-center px-4 sm:px-6 ${featured ? 'max-w-[96rem] gap-14 md:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.6fr)] md:gap-20' : 'max-w-5xl gap-10 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-14'}`}>
        <div className={`relative justify-self-center md:justify-self-start ${featured ? 'w-full max-w-[25rem] sm:max-w-[28rem]' : 'w-56 sm:w-64'}`}>
          {featured && (
            <>
              <div aria-hidden className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-blue-300/55 via-indigo-200/35 to-cyan-200/55 blur-2xl" />
              <div aria-hidden className="absolute -inset-3 rounded-[2rem] border border-blue-200/80 bg-white/60 shadow-xl" />
            </>
          )}
          <div className={`relative w-full overflow-hidden border-2 border-blue-200 bg-indigo-50 shadow-2xl ring-8 ring-white/80 ${featured ? 'aspect-square rounded-[1.75rem]' : 'aspect-[4/5] rounded-3xl'}`}>
            {imageSrc && !imageFailed ? (
              <img src={imageSrc} alt={`Portrait of ${name}, chapter president`} className="h-full w-full object-cover object-[center_35%]" onError={() => setImageFailed(true)} />
            ) : (
              <span className="grid h-full place-items-center text-3xl font-bold text-blue-900">{initials(president)}</span>
            )}
          </div>
        </div>

        <div className={`text-center md:text-left ${featured ? 'max-w-5xl py-4 md:py-8' : ''}`}>
          {featured && (
            <p className="mb-6 inline-flex rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-900 shadow-sm">
              Technology &middot; Professional Growth &middot; Lifelong Community
            </p>
          )}
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Phi Chapter Leadership</p>
          <Heading className={`mt-2 font-bold leading-tight tracking-tight text-blue-900 ${featured ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-3xl md:text-4xl'}`}>A Message from the President</Heading>
          <div className={`whitespace-pre-line text-pretty leading-relaxed text-slate-700 ${featured ? 'mt-7 space-y-5 text-base md:text-[1.05rem]' : 'mt-6 space-y-4'}`}>
            {message.map((paragraph, index) => (
              <p key={paragraph} className={index === message.length - 1 ? 'pt-3 font-semibold text-blue-900' : undefined}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
