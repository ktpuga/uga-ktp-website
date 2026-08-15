"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const carouselRef = useRef(null);

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

  function updateScrollButtons() {
    const carousel = carouselRef.current;
    if (!carousel) return;
    setCanScrollLeft(carousel.scrollLeft > 2);
    setCanScrollRight(carousel.scrollLeft + carousel.clientWidth < carousel.scrollWidth - 2);
  }

  function shiftGallery(direction) {
    const carousel = carouselRef.current;
    const firstCard = carousel?.firstElementChild;
    if (!carousel || !firstCard) return;
    const gap = Number.parseFloat(getComputedStyle(carousel).columnGap) || 0;
    carousel.scrollBy({ left: direction * (firstCard.getBoundingClientRect().width + gap), behavior: "smooth" });
  }

  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [withPhotos.length]);

  if (loaded && withPhotos.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-y border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 py-16 text-slate-900 md:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-1/4 h-[34rem] w-[34rem] rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-[28rem] w-[28rem] rounded-full bg-indigo-200/25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[112rem] px-4 sm:px-6">
        <div className="mb-12 flex flex-col gap-6 md:mb-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600 shadow-sm">Chapter Gallery</p>
            <h2 className="mt-2 text-4xl font-bold leading-tight tracking-tight text-blue-900 md:text-5xl">Life at Phi Chapter.</h2>
            <p className="mt-4 text-[clamp(0.875rem,1.5vw,1.125rem)] leading-relaxed text-slate-700 md:whitespace-nowrap">The moments, people, and experiences that make Kappa Theta Pi more than a chapter.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2" aria-label="Gallery navigation">
              <button
                type="button"
                onClick={() => shiftGallery(-1)}
                disabled={!canScrollLeft}
                className="grid h-11 w-11 place-items-center rounded-full border border-blue-200 bg-white text-blue-900 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Previous gallery"
              >
                <ChevronLeft size={21} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => shiftGallery(1)}
                disabled={!canScrollRight}
                className="grid h-11 w-11 place-items-center rounded-full border border-blue-200 bg-white text-blue-900 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Next gallery"
              >
                <ChevronRight size={21} aria-hidden="true" />
              </button>
            </div>
            <Link
              href="/gallery"
              className="inline-flex w-fit rounded-full border border-white bg-white px-5 py-2.5 text-sm font-semibold text-[#14326E] shadow-sm transition-colors hover:bg-blue-100"
            >
              Browse the full gallery
            </Link>
          </div>
        </div>

        <div ref={carouselRef} onScroll={updateScrollButtons} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6" aria-label="Featured gallery collections">
          {withPhotos.map((collection) => (
            <GalleryCollection key={collection.id} collection={collection} headingLevel="h3" layout="showcase" />
          ))}
        </div>
      </div>
    </section>
  );
}
