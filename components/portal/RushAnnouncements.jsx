'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Megaphone } from 'lucide-react';
import { getRushAnnouncements } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';
import AnnouncementAttachments from '@/components/portal/AnnouncementAttachments';

// Read-only list of announcements written for rushees. Backed by its own table
// (`rush_announcements`), so nothing posted to the chapter internally can ever
// appear here — that isolation is structural, not a filter that could be
// mis-set.
//
// Accent-parameterised because eboard reads the same list from the admin
// portal to review what rushees have been told.

const ACCENTS = {
  violet: { base: '#1e3a8a', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', light: '#1d4ed8' },
  blue:   { base: '#1e3a8a', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', light: '#1d4ed8' },
  red: { base: '#7f1d1d', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', light: '#991b1b' },
};

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function formatPosted(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function RushAnnouncements({ accent = 'violet', title = 'Announcements', description = 'Updates from the chapter during rush' }) {
  const theme = ACCENTS[accent] ?? ACCENTS.violet;
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getRushAnnouncements()
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
          Rush Portal
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
          <p className="text-sm text-muted-foreground">Nothing posted yet, check back once rush kicks off.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="h-0.5 w-full" style={{ background: theme.gradient }} />
              <div className="px-5 py-4">
                <h2 className="text-base font-semibold text-foreground">{announcement.title}</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {announcement.body}
                </p>

                {/* board="rush" is what points the media proxy at the rush
                    endpoint. The API refuses ids from the other board either
                    way, so this picks the right door rather than granting one. */}
                <AnnouncementAttachments
                  links={announcement.links}
                  media={announcement.media}
                  board="rush"
                />
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground/70">
                  {announcement.author_name && (
                    <span className="font-medium text-muted-foreground">
                      {announcement.author_name}
                      {announcement.author_exec_title ? ` · ${announcement.author_exec_title}` : ''}
                    </span>
                  )}
                  {announcement.author_name && <span>·</span>}
                  <span>{formatPosted(announcement.created_at)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
