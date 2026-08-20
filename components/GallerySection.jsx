"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown } from "lucide-react";
import { getGalleryCollections } from "@/lib/portal-api";
import GalleryCollection from "@/components/GalleryCollection";

// The homepage's slice of the gallery: ONE album, as a photo wall with its OWN
// vertical scrollbar.
//
// It used to stack up to three featured collections side by side, each one a
// card holding a little masonry of its own photos, and the chevrons moved
// between the cards. Then it became one album scrolled sideways. It is now one
// album in a fixed-height grid that scrolls DOWN inside itself, with the
// chevrons moving a row at a time.
//
// The point of the fixed height is `overscroll-contain` on that grid: reaching
// the end of the wall does not hand the scroll on to the page, so a visitor
// browsing photos stays where they are instead of being thrown down the
// homepage. That is the behaviour being asked for by "scroll by itself".
//
// Which album: the first featured one that actually has photos. "First" is the
// API's own ordering — `display_order ASC, event_date DESC NULLS LAST` — so it
// is whatever eboard dragged to the top of the collections list, not an
// accident of insertion order.
//
// ⚠ The API is still asked for up to three (HOMEPAGE_COLLECTION_LIMIT) even
// though one is rendered, and that is deliberate. Eboard creates a collection
// and then uploads into it, so a featured collection with zero photos is a real
// state that exists for as long as that takes. Asking for exactly one would
// make the entire gallery section vanish from the public homepage during that
// window; asking for three and taking the first non-empty one degrades to the
// next album instead. The extra cost is metadata for two collections, not
// images — the media endpoint is hit per rendered tile, and unrendered
// collections render no tiles.
//
// That media endpoint serves the ORIGINAL asset with no thumbnail variant,
// which is why the homepage shows a slice at all. The full archive is /gallery,
// which someone chooses to open.
export default function GallerySection() {
  const [collections, setCollections] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
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
  //
  // An empty collection is skipped rather than shown, because GalleryCollection
  // returns null for one and the section would otherwise be a heading and a set
  // of dead chevrons above nothing.
  const album = collections.find((c) => (c.photos?.length ?? 0) > 0) ?? null;

  function updateScrollButtons() {
    const wall = carouselRef.current;
    if (!wall) return;
    // The 2px slack absorbs sub-pixel rounding: a box scrolled fully to the
    // bottom can report scrollTop + clientHeight a fraction under scrollHeight
    // on a fractional-DPI display, which would leave the down arrow enabled
    // forever with nothing left to scroll to.
    setCanScrollUp(wall.scrollTop > 2);
    setCanScrollDown(wall.scrollTop + wall.clientHeight < wall.scrollHeight - 2);
  }

  // One row of tiles per press. `rowGap` rather than `columnGap` now that the
  // wall is a grid scrolled vertically — the row axis is what separates the
  // tiles in the direction of travel. getComputedStyle returns "normal" for an
  // unset gap, which Number.parseFloat gives NaN, hence the || 0.
  function shiftGallery(direction) {
    const wall = carouselRef.current;
    const firstTile = wall?.firstElementChild;
    if (!wall || !firstTile) return;
    const gap = Number.parseFloat(getComputedStyle(wall).rowGap) || 0;
    wall.scrollBy({ top: direction * (firstTile.getBoundingClientRect().height + gap), behavior: "smooth" });
  }

  // Keyed on the album's id, not on a count. The strip is remounted when the
  // album changes, so the old scroll position and both button states are stale
  // the moment it does.
  useEffect(() => {
    const frame = requestAnimationFrame(updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [album?.id]);

  if (loaded && !album) return null;

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
                disabled={!canScrollUp}
                className="grid h-11 w-11 place-items-center rounded-full border border-blue-200 bg-white text-blue-900 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Scroll gallery up"
              >
                <ChevronUp size={21} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => shiftGallery(1)}
                disabled={!canScrollDown}
                className="grid h-11 w-11 place-items-center rounded-full border border-blue-200 bg-white text-blue-900 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Scroll gallery down"
              >
                <ChevronDown size={21} aria-hidden="true" />
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

        {/* One album. The `column` layout is what makes it a fixed-height grid
            with its own vertical scrollbar rather than a block that stretches
            the page. The ref and the scroll handler go THROUGH the component
            onto the scrolling grid itself, because the chevrons above live
            outside this markup. */}
        {album && (
          <GalleryCollection
            key={album.id}
            collection={album}
            headingLevel="h3"
            layout="column"
            scrollRef={carouselRef}
            onScroll={updateScrollButtons}
          />
        )}
      </div>
    </section>
  );
}
