'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { getRoundNotes } from '@/lib/portal-api';
import { profilePictureSrc } from '@/lib/avatar';
import { memberInitials } from '@/lib/portal-format';
import { cn } from '@/lib/utils';
import NoteBody from '@/components/portal/NoteBody';

// Decision night: one candidate per screen, projected.
//
// This replaces a Google Slides deck that was rebuilt by hand every round. The
// thing that made the deck worth having is that the room looks at ONE person at
// a time with their face on the wall, so the layout is not negotiable: photo and
// identity on the left, every interviewer's notes on the right, and nothing else
// on screen competing for attention.
//
// READ-ONLY on purpose. There is no edit affordance anywhere in here, and that
// is the same reasoning that keeps a pencil off eboard's view of someone else's
// note: a note is a named person's judgement, and a room full of people watching
// it get rewritten is the worst possible moment for the attribution to go stale.
// Notes are edited from the interviewer's own page, before the meeting.

function CandidatePhoto({ candidate, accent }) {
  // Same keyed-by-asset-id pattern as RosterAvatar: an id that 404s once must
  // not pin the fallback after the rushee uploads a picture.
  const [erroredAssetId, setErroredAssetId] = useState(null);
  const assetId = candidate.profile_picture_asset_id;
  const failed = assetId != null && erroredAssetId === assetId;
  const src = assetId && !failed ? profilePictureSrc(candidate.candidate_id, assetId) : null;

  return (
    <div className="aspect-square w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted sm:w-48 lg:w-64">
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setErroredAssetId(assetId)}
        />
      ) : (
        <div
          className="flex h-full w-full select-none items-center justify-center text-5xl font-bold text-white lg:text-6xl"
          style={{ background: accent.gradient }}
        >
          {/* memberDisplayName reads preferred_name first, so handing it the
              display string the API already resolved gives the right initials
              without this component knowing anything about name columns. */}
          {memberInitials({ preferred_name: candidate.candidate_name })}
        </div>
      )}
    </div>
  );
}

export default function DecisionNight({ scheduleId, scheduleTitle, accent, onClose }) {
  const [candidates, setCandidates] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await getRoundNotes(scheduleId);
      if (cancelled) return;
      if (result.error) setError(result.error);
      // `{ candidates }`, not a bare array: portal-api wraps the response so an
      // error and a success are the same shape to the caller.
      else setCandidates(result.candidates);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [scheduleId]);

  const total = candidates.length;

  const go = useCallback((delta) => {
    setIndex((i) => {
      const next = Math.min(Math.max(i + delta, 0), Math.max(total - 1, 0));
      // Each candidate starts at the top of their own notes. Without this a long
      // previous slide leaves the next one scrolled halfway down, and the room
      // is looking at the middle of someone's evaluation.
      if (next !== i && scrollRef.current) scrollRef.current.scrollTop = 0;
      return next;
    });
  }, [total]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        go(1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        go(-1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setIndex(Math.max(total - 1, 0));
      }
    }
    // On window rather than the container: a presenter who clicked a button is
    // no longer focused on the slide, and arrow keys still have to work.
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose, total]);

  // The page behind must not scroll while this is over it.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => { containerRef.current?.focus(); }, []);

  const candidate = candidates[index];

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Decision night, ${scheduleTitle}`}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex flex-col bg-background outline-none"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>
            Decision night
          </p>
          <p className="truncate text-sm font-semibold text-foreground">{scheduleTitle}</p>
        </div>
        <div className="flex items-center gap-4">
          {total > 0 && (
            <span className="text-sm font-semibold tabular-nums text-muted-foreground">
              {index + 1} / {total}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close decision night"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="flex max-w-md items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={18} className="animate-spin" /> Loading notes…
        </div>
      ) : total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <p className="text-sm font-semibold text-foreground">There is nothing to present yet.</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Candidates appear here once an interviewer has written a note about them.
          </p>
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:gap-10">
              <div className="flex shrink-0 flex-col items-start gap-4 lg:sticky lg:top-8 lg:self-start">
                <CandidatePhoto candidate={candidate} accent={accent} />
                <div>
                  <h2 className="text-2xl font-bold text-foreground lg:text-3xl">{candidate.candidate_name}</h2>
                  {candidate.major && (
                    <p className="mt-1 text-base text-muted-foreground">{candidate.major}</p>
                  )}
                  {candidate.graduation_date && (
                    <p className="text-base text-muted-foreground">{candidate.graduation_date}</p>
                  )}
                  <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground/70">
                    {candidate.notes.length} {candidate.notes.length === 1 ? 'note' : 'notes'}
                  </p>
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-6">
                {candidate.notes.map((note) => (
                  <div key={note.id}>
                    <p className="mb-2 text-sm font-semibold" style={{ color: accent.base }}>
                      {note.author_name}
                    </p>
                    <NoteBody body={note.body} size="slide" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border px-5 py-3">
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={index === 0}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold',
                index === 0 ? 'text-muted-foreground/40' : 'text-foreground hover:bg-muted',
              )}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Arrow keys or space to move, Esc to close
            </p>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={index >= total - 1}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white',
                index >= total - 1 && 'opacity-40',
              )}
              style={{ background: accent.gradient }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
