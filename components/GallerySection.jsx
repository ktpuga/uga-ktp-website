"use client";

import { useEffect, useState } from "react";
import { getHomepagePhotos } from "@/lib/portal-api";

function GalleryMedia({ photo }) {
  const src = `/api/homepage-photos/${photo.id}/media`;
  if (photo.media_type === "video") {
    return (
      <video
        src={src}
        muted
        loop
        autoPlay
        playsInline
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={photo.title || "Chapter photo"}
      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
    />
  );
}

export default function GallerySection() {
  const [photos, setPhotos] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getHomepagePhotos()
      .then(setPhotos)
      .catch(() => setPhotos([]))
      .finally(() => setLoaded(true));
  }, []);

  // Nothing configured yet — quietly render nothing rather than an empty section.
  if (loaded && photos.length === 0) return null;

  return (
    <section className="relative py-12 md:py-16">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Chapter Gallery
          </h2>
          <p className="text-slate-600">A look at life in Phi Chapter</p>
        </div>

        <div className="group relative">
          <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-4">
            {photos.map((photo) => (
              <figure
                key={photo.id}
                className="relative h-56 w-[300px] shrink-0 snap-start overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-100"
              >
                <GalleryMedia photo={photo} />
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
