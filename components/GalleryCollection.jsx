"use client";

import Link from "next/link";

// One collection's heading and carousel. Shared by the homepage
// (GallerySection, featured only) and /gallery (all of them), so the two can't
// drift into looking like different features.
//
// The markup is deliberately the same shape the hardcoded "Hackathon
// Highlights" section on the homepage used: heading, subtitle line, a
// "See more →" on the right, a snap carousel, and an optional CTA. That section
// is what this generalises, so matching it means the page looks unchanged while
// becoming eboard-editable.

function GalleryMedia({ photo, naturalSize = false }) {
  const src = `/api/homepage-photos/${photo.id}/media`;
  const mediaClass = naturalSize ? "block h-auto w-full" : "h-full w-full object-contain";

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

export default function GalleryCollection({ collection, headingLevel = "h2", layout = "carousel" }) {
  const Heading = headingLevel;
  const photos = Array.isArray(collection.photos) ? collection.photos : [];
  const isEditorial = layout === "editorial";
  const isArchive = layout === "archive";
  const isShowcase = layout === "showcase";
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
    <div className={isShowcase ? 'w-[90vw] max-w-[58rem] shrink-0 snap-start rounded-[2rem] border border-white/90 bg-white/75 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-sm sm:p-7' : `mb-14 last:mb-0 ${isArchive ? 'rounded-[2rem] border border-white/90 bg-white/70 p-5 shadow-xl shadow-slate-300/20 backdrop-blur-sm sm:p-7 md:p-9' : isEditorial ? 'border-t border-slate-200/80 pt-10 md:pt-12' : ''}`}>
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
          className={isPacked
            ? packedLayoutClass
            : isMosaic
            ? "grid grid-cols-2 auto-rows-[9rem] gap-3 sm:auto-rows-[12rem] md:auto-rows-[14rem] lg:grid-cols-4"
            : layout === "grid"
            ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
            : "no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4"}
        >
          {photos.map((photo, index) => (
            <figure
              key={photo.id}
              className={isPacked
                ? "group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200"
                : isMosaic
                ? `group relative overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200 ${index === 0 ? 'col-span-2 row-span-2' : ''}`
                : layout === "grid"
                ? "relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200"
                : "group relative h-56 w-[300px] shrink-0 snap-start overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100"}
            >
              <GalleryMedia photo={photo} naturalSize={isPacked} />

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
