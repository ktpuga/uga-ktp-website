'use client';

// The public gallery archive: every collection eboard has made, newest first.
//
// The homepage shows only the featured few, because its media endpoint serves
// original files with no thumbnail variant and an unbounded landing page gets
// slower with every gallery added. This page is the other half of that trade —
// somebody opening it has asked for all of them.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Footer from '@/components/ui/footer';
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
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline">
            ← Back to home
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Chapter Gallery
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Formals, tailgates, hackathons and everything in between. Newest first.
          </p>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
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
            <GalleryCollection key={collection.id} collection={collection} />
          ))
        )}
      </section>

      <Footer />
    </main>
  );
}
