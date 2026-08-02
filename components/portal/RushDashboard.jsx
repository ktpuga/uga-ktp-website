'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AlertTriangle, ArrowRight, CalendarDays, Loader2, Megaphone, MessageSquare } from 'lucide-react';
import { getEvents, getRushAnnouncements } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';

// Rush gets its own dashboard rather than reusing PortalDashboard, which
// fetches members and photos in a Promise.all — both gated on
// SHARED_ALBUM_GROUPS, so for a rushee the first 403 would reject the whole
// batch and the page would render as an error.
//
// It also shows different things on purpose. A prospective member doesn't need
// chapter headcounts or the photo gallery; they need to know what was
// announced, what's happening next, and who to ask.

// Matches the Member portal's blue — every portal except Alumni shares it now.
const ACCENT = {
  base: '#1e3a8a',
  gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
  light: '#1d4ed8',
};

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function formatEventDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function SectionCard({ icon, title, action, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(ACCENT.base, 0.03) }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: ACCENT.gradient }}>
            {icon}
          </div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function RushDashboard() {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Settled rather than all: a rushee seeing announcements but not events
    // (or the reverse) is far better than an error page because one call
    // failed. Each section reports its own emptiness below.
    Promise.allSettled([getEvents(), getRushAnnouncements()])
      .then(([eventsResult, announcementsResult]) => {
        if (eventsResult.status === 'fulfilled') {
          setEvents(Array.isArray(eventsResult.value) ? eventsResult.value : []);
        }
        if (announcementsResult.status === 'fulfilled') {
          setAnnouncements(Array.isArray(announcementsResult.value) ? announcementsResult.value : []);
        }
        if (eventsResult.status === 'rejected' && announcementsResult.status === 'rejected') {
          const reason = eventsResult.reason;
          if (isRedirectError(reason)) throw reason;
          setError(reason?.message ?? 'Could not load your rush dashboard.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = session?.user?.firstName || session?.user?.name?.split(' ')[0] || '';

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((event) => new Date(event.startDate).getTime() >= now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 4);
  }, [events]);

  const latest = useMemo(() => announcements.slice(0, 3), [announcements]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: ACCENT.light }}>
          Rush Portal
        </p>
        <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">
          {firstName ? `Welcome, ${firstName}` : 'Welcome'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you need during rush at KTP Phi Chapter
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div className="space-y-5">
          <SectionCard
            icon={<Megaphone size={14} />}
            title="Latest announcements"
            action={
              <Link href="/rushee/announcements" className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: ACCENT.light }}>
                See all <ArrowRight size={12} />
              </Link>
            }
          >
            {latest.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                Nothing posted yet — check back once rush kicks off.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {latest.map((announcement) => (
                  <li key={announcement.id} className="px-5 py-4">
                    <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{announcement.body}</p>
                    {announcement.author_name && (
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {announcement.author_name}
                        {announcement.author_exec_title ? ` · ${announcement.author_exec_title}` : ''}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            icon={<CalendarDays size={14} />}
            title="Upcoming events"
            action={
              <Link href="/rushee/calendar" className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: ACCENT.light }}>
                Full calendar <ArrowRight size={12} />
              </Link>
            }
          >
            {upcoming.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No rush events scheduled right now.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((event) => (
                  <li key={event.id} className="flex items-start justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatEventDate(event.startDate)}</p>
                      {event.location && <p className="text-[11px] text-muted-foreground/70">{event.location}</p>}
                    </div>
                    {event.requiresAttendance && (
                      <span
                        className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                        style={{ background: tint(ACCENT.base, 0.12), color: ACCENT.light }}
                      >
                        Check in
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard icon={<MessageSquare size={14} />} title="Questions?">
            <div className="px-5 py-4">
              <p className="text-sm text-muted-foreground">
                Message the exec board or a committee chair directly — they&apos;re the people running rush.
              </p>
              <Link
                href="/rushee/messages"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-85"
                style={{ background: ACCENT.gradient }}
              >
                <MessageSquare size={13} /> Message leadership
              </Link>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
