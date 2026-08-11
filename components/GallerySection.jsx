"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getGalleryCollections } from "@/lib/portal-api";
import GalleryCollection from "@/components/GalleryCollection";

// The homepage's slice of the gallery: only the collections eboard marked as
// featured, and the API caps how many come back.
//
// The cap is not cosmetic. `/api/homepage-photos/:id/media` serves the ORIGINAL
// asset with no thumbnail variant, so every collection added to this page makes
// the landing page slower forever. The full archive is /gallery, which someone
// chooses to open.
export default function GallerySection() {
  const [collections, setCollections] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getGalleryCollections({ featured: true })
      .then((data) => setCollections(Array.isArray(data) ? data : []))
      .catch(() => setCollections([]))
      .finally(() => setLoaded(true));
  }, []);

  // Nothing configured yet — render nothing rather than an empty band. Also
  // covers the API being unreachable, which must not leave a broken section on
  // the public homepage.
  const withPhotos = collections.filter((c) => (c.photos?.length ?? 0) > 0);
  if (loaded && withPhotos.length === 0) return null;

  return (
    <section className="relative py-12 md:py-16 bg-white/70">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        {withPhotos.map((collection) => (
          <GalleryCollection key={collection.id} collection={collection} />
        ))}

        {withPhotos.length > 0 && (
          <div className="mt-2 flex justify-center">
            <Link
              href="/gallery"
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              Browse the full gallery →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
