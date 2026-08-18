'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Play, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// The links and media attached to an announcement, on the READING side.
//
// One component for both boards. The main feed and the rushee feed are separate
// pages with separate permissions, but an attachment renders identically in
// both, and a photo grid that behaves differently depending on which page you
// are on is the portal-duplication trap in components/README.md.
//
// The only thing that differs is which API the bytes come from, and that is one
// query parameter — see `mediaSrc`.

// The proxy route attaches the viewer's bearer token server-side, because a
// browser cannot put an Authorization header on an <img src>. All of the
// authorisation happens in ktp-api; `board` only picks which endpoint asks.
export function mediaSrc(media, board, { size } = {}) {
  const params = new URLSearchParams();
  if (board === 'rush') params.set('board', 'rush');
  if (size) params.set('size', size);
  const query = params.toString();
  return `/api/announcements/media/${media.id}${query ? `?${query}` : ''}`;
}

function LinkChips({ links, accent }) {
  if (!links?.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((link, i) => (
        <a
          // `rel` is not optional here. `target="_blank"` without `noopener`
          // hands the opened page a `window.opener` reference back to the
          // portal, and these URLs are typed by a person into a form.
          key={`${link.url}-${i}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          style={{ borderColor: accent ? `${accent.base}33` : undefined }}
        >
          <ExternalLink size={12} className="shrink-0 text-muted-foreground" />
          <span className="max-w-[16rem] truncate">{link.label}</span>
        </a>
      ))}
    </div>
  );
}

// Full-screen viewer. Videos play here rather than in the grid, so a feed of
// twenty posts never has twenty video elements buffering at once.
function Lightbox({ media, board, index, onClose, onMove }) {
  const item = media[index];

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onMove(1);
      else if (e.key === 'ArrowLeft') onMove(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onMove]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Attachment"
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={onClose}
    >
      <div className="flex shrink-0 items-center justify-between px-4 py-3 text-white">
        <span className="text-sm tabular-nums opacity-80">{index + 1} / {media.length}</span>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 hover:bg-white/10">
          <X size={18} />
        </button>
      </div>

      {/* Stops a click on the media itself from closing, while the backdrop
          still does. */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
        {item.kind === 'video' ? (
          <video src={mediaSrc(item, board)} controls autoPlay className="max-h-full max-w-full rounded-lg" />
        ) : (
          <img src={mediaSrc(item, board)} alt={item.filename ?? ''} className="max-h-full max-w-full rounded-lg object-contain" />
        )}
      </div>

      {media.length > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-6 pb-5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Previous"
            className={cn('rounded-full bg-white/10 p-3 text-white', index === 0 ? 'opacity-30' : 'hover:bg-white/20')}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button" onClick={() => onMove(1)} disabled={index === media.length - 1} aria-label="Next"
            className={cn('rounded-full bg-white/10 p-3 text-white', index === media.length - 1 ? 'opacity-30' : 'hover:bg-white/20')}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function AnnouncementAttachments({ links, media, board = 'main', accent }) {
  const [open, setOpen] = useState(null);

  const move = useCallback((delta) => {
    setOpen((i) => {
      if (i === null) return i;
      return Math.min(Math.max(i + delta, 0), media.length - 1);
    });
  }, [media?.length]);

  const hasMedia = media?.length > 0;
  if (!hasMedia && !links?.length) return null;

  return (
    <>
      {hasMedia && (
        <div
          className={cn(
            'mt-3 grid gap-2',
            // A lone attachment gets the full width; several become a grid. A
            // single photo forced into a 3-up column reads as a thumbnail of
            // something rather than as the thing itself.
            media.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3',
          )}
        >
          {media.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpen(i)}
              className="group relative overflow-hidden rounded-xl border border-border bg-muted"
              aria-label={item.kind === 'video' ? 'Play video' : 'View photo'}
            >
              {/* Thumbnails, not originals. A feed that loads full-size
                  originals for every tile pulls tens of megabytes to render a
                  grid nobody has clicked yet. */}
              <img
                src={mediaSrc(item, board, { size: 'thumbnail' })}
                alt={item.filename ?? ''}
                loading="lazy"
                className={cn(
                  'w-full object-cover transition-transform group-hover:scale-[1.02]',
                  media.length === 1 ? 'max-h-96' : 'aspect-square',
                )}
              />
              {item.kind === 'video' && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <span className="rounded-full bg-black/60 p-2.5 text-white">
                    <Play size={18} fill="currentColor" />
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <LinkChips links={links} accent={accent} />

      {open !== null && (
        <Lightbox media={media} board={board} index={open} onClose={() => setOpen(null)} onMove={move} />
      )}
    </>
  );
}
