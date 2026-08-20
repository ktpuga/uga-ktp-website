'use client';

// The public gallery archive: every collection eboard has made, newest first.
//
// The homepage shows only the featured few, because its media endpoint serves
// original files with no thumbnail variant and an unbounded landing page gets
// slower with every gallery added. This page is the other half of that trade —
// somebody opening it has asked for all of them.

import { useEffect, useState } from 'react';
import Footer from '@/components/ui/footer';
import PublicHeader from '@/components/PublicHeader';
import GalleryCollection from '@/components/GalleryCollection';
import { getGalleryCollections } from '@/lib/portal-api';

export default function GalleryPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getGalleryCollections()
      .then((data) => setCollections(Array.isArray(data) ? data : []))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  // Ordering is the API's, not this page's — `display_order`, then event_date
  // newest-first, then id. Re-sorting here would mean the homepage and this
  // page could disagree about what "chronological" means.
  const withPhotos = collections.filter((c) => (c.photos?.length ?? 0) > 0);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <PublicHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50">
          <div aria-hidden className="pointer-events-none absolute -right-32 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full bg-blue-300/25 blur-3xl" />
          <div className="relative mx-auto max-w-[96rem] px-4 py-14 sm:px-6 md:py-20">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Kappa Theta Pi · Phi Chapter</p>
            <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight text-blue-900 md:text-6xl">
              Chapter Gallery
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-700">
              Explore the people, events, and memories that shape life at Phi Chapter.
            </p>
          </div>
        </section>

        <section className="relative flex-1 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50 py-14 md:py-20">
          <div aria-hidden className="pointer-events-none absolute -left-32 bottom-0 h-[32rem] w-[32rem] rounded-full bg-indigo-200/25 blur-3xl" />
          <div className="relative mx-auto w-full max-w-[96rem] px-4 sm:px-6">
            {loading ? (
              // A skeleton rather than a spinner, so the page does not jump height
              // when the collections land.
              <div className="space-y-10" aria-busy="true" aria-label="Loading gallery">
                {[0, 1].map((i) => (
                  <div key={i}>
                    <div className="mb-6 h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
                    <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : failed ? (
              <p className="text-slate-600">
                The gallery could not be loaded right now. Please try again shortly.
              </p>
            ) : withPhotos.length === 0 ? (
              <p className="text-slate-600">No photos have been published yet. Check back soon.</p>
            ) : (
              withPhotos.map((collection) => (
                // `carousel`, so each album on this page is a horizontal
                // strip you swipe through rather than a tall masonry block.
                // The page itself still scrolls vertically between albums, so
                // the two axes do different jobs: down moves between albums,
                // sideways moves within one.
                <GalleryCollection key={collection.id} collection={collection} layout="carousel" />
              ))
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
