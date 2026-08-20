"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

// One collection's heading and carousel. Shared by the homepage
// (GallerySection, featured only) and /gallery (all of them), so the two can't
// drift into looking like different features.
//
// The markup is deliberately the same shape the hardcoded "Hackathon
// Highlights" section on the homepage used: heading, subtitle line, a
// "See more →" on the right, a snap carousel, and an optional CTA. That section
// is what this generalises, so matching it means the page looks unchanged while
// becoming eboard-editable.

function GalleryMedia({ photo, naturalSize = false, cover = false }) {
  const src = `/api/homepage-photos/${photo.id}/media`;
  // `cover` fills a fixed-aspect cell edge to edge, which is what makes the
  // homepage wall read as a wall rather than as rows of letterboxed pictures.
  // The other layouts keep `contain`, where the tile is sized to the photo and
  // cropping would lose part of the subject.
  const mediaClass = naturalSize
    ? "block h-auto w-full"
    : cover
    ? "h-full w-full object-cover"
    : "h-full w-full object-contain";

  if (photo.media_type === "video") {
    return (
      <video
        src={src}
        muted
        loop
        autoPlay
        playsInline
        className={mediaClass}
      />
    );
  }

  return (
    // The media endpoint serves the ORIGINAL file — there is no thumbnail
    // variant — so anything the visitor hasn't scrolled to must not be fetched.
    // This is also why the homepage shows only a few collections and the full
    // archive lives on its own page.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={photo.title || photo.caption || "Chapter photo"}
      loading="lazy"
      decoding="async"
      className={mediaClass}
    />
  );
}

// "2026-03-15" → "March 2026". Built from the string rather than a Date: the
// API sends a date-only value, and `new Date("2026-03-15")` is parsed as UTC
// midnight and then rendered in the viewer's zone, which shows February for
// anyone west of UTC. Same class of bug as the dob one in the API.
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatEventDate(value) {
  if (typeof value !== "string") return null;
  const [year, month] = value.split("-");
  const index = Number(month) - 1;
  if (!year || !MONTHS[index]) return null;
  return `${MONTHS[index]} ${year}`;
}

// `scrollRef` and `onScroll` attach to the PHOTO strip, not to the wrapper, and
// exist so an outer component can drive it — the homepage puts its prev/next
// chevrons in the section header, well outside this markup, and they have to
// move the photos rather than a container around them. Both are optional and
// both are undefined on /gallery, which scrolls the page instead.
//
// Passed rather than looked up with a querySelector for the obvious reason: a
// selector into a shared component's internals breaks silently the next time
// somebody wraps this markup in another div.
export default function GalleryCollection({ collection, headingLevel = "h2", layout = "carousel", scrollRef, onScroll }) {
  const Heading = headingLevel;
  const photos = Array.isArray(collection.photos) ? collection.photos : [];
  const isEditorial = layout === "editorial";
  const isArchive = layout === "archive";
  const isShowcase = layout === "showcase";
  // A photo wall with its own vertical scrollbar, used on the homepage so the
  // gallery scrolls in place instead of moving the page.
  const isColumn = layout === "column";
  const isMosaic = isEditorial;
  const isPacked = isArchive || isShowcase;

  // A collection with no photos yet would render a heading above an empty
  // bordered box, which reads as broken rather than as empty.
  if (photos.length === 0) return null;

  const meta = [collection.subtitle, formatEventDate(collection.event_date)]
    .filter(Boolean)
    .join(" • ");
  const packedLayoutClass = isShowcase
    ? "columns-2 gap-3"
    : photos.length === 1
    ? "mx-auto max-w-2xl columns-1 gap-4"
    : photos.length === 2
      ? "mx-auto max-w-5xl columns-1 gap-4 sm:columns-2"
      : "columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4";

  return (
    <div className={isShowcase ? 'w-[85vw] shrink-0 snap-start rounded-[2rem] border border-white/90 bg-white/75 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-sm sm:p-6 md:w-[calc((100%_-_1.25rem)/2)] lg:w-[calc((100%_-_2.5rem)/3)]' : `mb-14 last:mb-0 ${isArchive ? 'rounded-[2rem] border border-white/90 bg-white/70 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-sm sm:p-7 md:p-9' : isEditorial ? 'border-t border-slate-200/80 pt-10 md:pt-12' : ''}`}>
      <div className={`mb-6 flex items-end justify-between gap-4 ${isMosaic ? 'md:mb-8' : ''}`}>
        <div className="min-w-0">
          <Heading className={`font-bold tracking-tight text-slate-900 ${isEditorial ? 'text-2xl md:text-3xl' : 'text-2xl md:text-3xl'}`}>
            {collection.title}
          </Heading>
          {meta && <p className="text-slate-600">{meta}</p>}
        </div>

        {collection.link_url && (
          <Link
            href={collection.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-medium text-indigo-600 hover:underline"
          >
            {collection.link_label || "See more"} →
          </Link>
        )}
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className={isColumn
            // ⚠ A CSS GRID, deliberately NOT the `columns-*` multi-column used
            // by the packed layouts. Multi-column with a constrained height
            // does not scroll vertically at all — it keeps flowing content into
            // NEW COLUMNS sideways, so `max-h` + `overflow-y-auto` on a
            // `columns-3` produces a horizontal scrollbar and a wall nobody can
            // read. A grid grows downward, which is the whole point here.
            //
            // `overscroll-contain` is what makes this "scroll by itself": once
            // this box hits its end, the scroll does NOT chain on to the page
            // behind it.
            // Height is `min(48rem, 75svh)`, not a bare rem: a flat 48rem is taller
            // than a 13" laptop viewport, which would fill the screen with the
            // wall and hide the section heading and the chevrons driving it.
            // The svh half caps it against the real viewport, the rem half stops
            // it becoming enormous on a tall monitor, and `min` takes whichever
            // binds first.
            ? "sidebar-scroll grid max-h-[min(48rem,75svh)] grid-cols-2 gap-3 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
            : isPacked
            ? packedLayoutClass
            : isMosaic
            ? "grid grid-cols-2 auto-rows-[9rem] gap-3 sm:auto-rows-[12rem] md:auto-rows-[14rem] lg:grid-cols-4"
            : layout === "grid"
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            // TWO ROWS deep, scrolling sideways. `grid-flow-col` + a fixed row
            // count fills top-to-bottom and then moves right, which is what
            // makes a second row possible at all — a flex row (what this used
            // to be) can only ever be one tile tall.
            //
            // `auto-cols-[300px]` replaces the per-tile `w-[300px]`: in a grid
            // the track sets the width, and leaving the width on the figure as
            // well would fight the track on any browser that rounds them
            // differently.
            //
            // One row when there is a single photo, so a one-photo album is not
            // a half-empty box with a reserved second row under it.
            : cn(
                "no-scrollbar grid grid-flow-col auto-cols-[300px] snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4",
                photos.length > 1 ? "grid-rows-2" : "grid-rows-1",
              )}
        >
          {photos.map((photo, index) => (
            <figure
              key={photo.id}
              className={isColumn
                ? "group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 shadow-sm ring-1 ring-slate-200"
                : isPacked
                ? "group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200"
                : isMosaic
                ? `group relative overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200 ${index === 0 ? 'col-span-2 row-span-2' : ''}`
                : layout === "grid"
                ? "relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200"
                : "group relative h-56 snap-start overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100"}
            >
              <GalleryMedia photo={photo} naturalSize={isPacked} cover={isColumn} />

              {/* Title as the caption line, with the photo's own caption under
                  it when there is one. Both `truncate` with a `title`
                  attribute for the full text on hover: the tiles are a fixed
                  300px, so a long name would otherwise wrap upward and cover
                  the picture it is labelling.

                  The whole block is skipped when a photo has neither, rather
                  than rendering an empty gradient band across every untitled
                  tile. */}
              {(photo.title || photo.caption) && (
                <figcaption className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent text-white ${isMosaic && index === 0 ? 'px-5 pb-4 pt-16' : 'px-3 pb-2 pt-8'}`}>
                  {photo.title && (
                    <p className={`truncate font-medium leading-snug ${isMosaic && index === 0 ? 'text-sm md:text-base' : 'text-xs'}`} title={photo.title}>
                      {photo.title}
                    </p>
                  )}
                  {photo.caption && (
                    <p className="truncate text-[11px] leading-snug text-white/75" title={photo.caption}>
                      {photo.caption}
                    </p>
                  )}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
