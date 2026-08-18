'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Megaphone, Users } from 'lucide-react';
import { getAnnouncements } from '@/lib/portal-api';
import { formatAudience } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import AnnouncementAttachments from '@/components/portal/AnnouncementAttachments';

// Read-only announcements tab for members, alumni and pledges.
//
// Deliberately NOT RushAnnouncements: that one reads the separate
// `rush_announcements` table, which is a different feed with different
// authors. This reads `/announcements`, which the API already filters to what
// the caller is allowed to see (their role's audience, plus any committee
// they're in). No client-side filtering here — restating that rule in JSX is
// how it drifts from the SQL.
//
// Creation still lives at /admin/announcements. This is the member-facing
// read surface that previously only existed as a 4-item dashboard card.

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function formatPosted(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AnnouncementsFeed({
  portalLabel = 'Member Portal',
  title = 'Announcements',
  description = 'Updates from the chapter',
  committees = [],
}) {
  // Palette from the context, not a local ACCENT map — see PortalAccentContext.
  const theme = useAccentPalette();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAnnouncements()
      .then((data) => setAnnouncements(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load announcements.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: theme.light }}>
          {portalLabel}
        </p>
        <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading announcements…
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: tint(theme.base, 0.1) }}>
            <Megaphone size={18} style={{ color: theme.light }} />
          </div>
          <p className="text-sm text-muted-foreground">Nothing posted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const committeeName = announcement.committee_id
              ? committees.find((c) => String(c.id) === String(announcement.committee_id))?.name
              : null;
            const hasAudience = announcement.audience && announcement.audience.length > 0;

            return (
              <article key={announcement.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="h-0.5 w-full" style={{ background: theme.gradient }} />
                <div className="px-5 py-4">
                  <h2 className="text-base font-semibold text-foreground">{announcement.title}</h2>

                  {/* Full body, wrapped — no line clamp. The dashboard card is
                      the preview; this page is where you read the whole thing,
                      which is the entire reason it exists. whitespace-pre-wrap
                      keeps the author's paragraph breaks. */}
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                    {announcement.body}
                  </p>

                  <AnnouncementAttachments
                    links={announcement.links}
                    media={announcement.media}
                    board="main"
                  />

                  {/* Both badges can show: an announcement may target roles AND
                      a committee, and whoever receives it is the union. */}
                  {(hasAudience || committeeName) && (
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {hasAudience && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          <Users size={9} /> {formatAudience(announcement.audience)}
                        </span>
                      )}
                      {committeeName && (
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{ background: tint(theme.base, 0.1), color: theme.light }}
                        >
                          <Users size={9} /> {committeeName}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground/70">
                    {announcement.author_name && (
                      <>
                        <span className="font-medium text-muted-foreground">
                          {announcement.author_name}
                          {announcement.author_exec_title ? ` · ${announcement.author_exec_title}` : ''}
                        </span>
                        <span>·</span>
                      </>
                    )}
                    <span>{formatPosted(announcement.created_at)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
