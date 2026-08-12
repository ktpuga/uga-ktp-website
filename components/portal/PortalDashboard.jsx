'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar, Users, Megaphone, ImageIcon, ArrowRight, Bell, MapPin,
} from 'lucide-react';
import { getEvents, getMembers, getPhotos, getAnnouncements } from '@/lib/portal-api';
import { formatEventTimeRange, upcomingEvents, countUpcomingEvents, getEventStartDate, getEventEndDate, formatAudience, formatMessageTime } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import PhotoMedia from './PhotoMedia';
import { AutoSkeleton } from 'auto-skeleton-react';

function cleanName(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function memberWelcomeName(member) {
  return cleanName(member?.preferred_name)
    ?? cleanName(member?.preferredName)
    ?? cleanName(member?.first_name)
    ?? cleanName(member?.firstName)
    ?? cleanName(member?.name)
    ?? cleanName(member?.username);
}

function sessionWelcomeName(session) {
  const user = session?.user ?? {};
  const name = cleanName(user.preferredName)
    ?? cleanName(user.preferred_name)
    ?? cleanName(user.firstName)
    ?? cleanName(user.first_name);

  if (name) return name;

  const fullName = cleanName(user.name);
  if (fullName) return fullName.split(/\s+/)[0];

  return cleanName(user.username);
}

function resolveWelcomeName(session, members) {
  const user = session?.user ?? {};
  const userIds = new Set(
    [user.authentik_id, user.id, user.sub]
      .map((value) => String(value ?? '').trim())
      .filter(Boolean),
  );
  const usernames = new Set(
    [user.username, user.email?.split('@')[0]]
      .map((value) => String(value ?? '').trim().toLowerCase())
      .filter(Boolean),
  );

  const currentMember = members.find((member) => {
    const memberIds = [member.authentik_id, member.id]
      .map((value) => String(value ?? '').trim())
      .filter(Boolean);
    const memberUsername = String(member.username ?? '').trim().toLowerCase();

    return memberIds.some((id) => userIds.has(id)) || usernames.has(memberUsername);
  });

  return memberWelcomeName(currentMember) ?? sessionWelcomeName(session);
}

// Revamped visual treatment — designed for theme="blue" (Member), and now
// extended to "amber" (Alumni) and "teal" (Pledge). Any other/unknown theme
// value falls back to blue via the `?? THEMES.blue` lookups below.
const THEMES = {
  blue: {
    base: '#1e3a8a',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0f172a 100%)',
    subtitleColor: 'rgba(191,219,254,0.85)',
    labelColor: 'rgba(147,197,253,0.7)',
    gradientBar: 'linear-gradient(90deg, #1e3a8a, #3b82f6)',
    rsvpColor: '#1d4ed8',
    dateBadgeBg: '#1e3a8a',
    dateBadgeBorder: 'rgba(30,58,138,0.35)',
    tagBg: 'rgba(30,58,138,0.10)',
    tagText: '#1e3a8a',
  },
  amber: {
    base: '#b45309',
    gradient: 'linear-gradient(135deg, #b45309 0%, #d97706 50%, #451a03 100%)',
    subtitleColor: 'rgba(253,230,138,0.85)',
    labelColor: 'rgba(252,211,77,0.7)',
    gradientBar: 'linear-gradient(90deg, #b45309, #f59e0b)',
    rsvpColor: '#d97706',
    dateBadgeBg: '#b45309',
    dateBadgeBorder: 'rgba(180,83,9,0.35)',
    tagBg: 'rgba(180,83,9,0.10)',
    tagText: '#b45309',
  },
  teal: {
    base: '#134e4a',
    gradient: 'linear-gradient(135deg, #134e4a 0%, #0f766e 50%, #042f2e 100%)',
    subtitleColor: 'rgba(153,246,228,0.85)',
    labelColor: 'rgba(94,234,212,0.7)',
    gradientBar: 'linear-gradient(90deg, #134e4a, #14b8a6)',
    rsvpColor: '#0f766e',
    dateBadgeBg: '#134e4a',
    dateBadgeBorder: 'rgba(19,78,74,0.35)',
    tagBg: 'rgba(19,78,74,0.10)',
    tagText: '#134e4a',
  },
};

function RevampedHero({ accent, welcomeName, welcomeSubtitle, nameLoading }) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateLine = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <section className="relative overflow-hidden rounded-2xl" style={{ background: accent.gradient }} aria-label="Welcome">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(120% 110% at 10% -10%, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.05) 38%, transparent 68%)' }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.13]"
        style={{
          backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.9) 0px, rgba(255,255,255,0.9) 1px, transparent 1px, transparent 13px)',
          maskImage: 'linear-gradient(to left, #000 0%, transparent 92%)',
          WebkitMaskImage: 'linear-gradient(to left, #000 0%, transparent 92%)',
        }}
      />

      <div className="relative z-10 px-6 py-7 sm:px-9 sm:py-9 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-4">
          <p className="font-serif text-xs tracking-[0.3em] text-white/70">ΚΘΠ&ensp;·&ensp;UGA</p>
          <p className="text-[11px] font-medium tracking-wide" style={{ color: accent.labelColor }}>{dateLine}</p>
        </div>

        <div className="pt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.labelColor }}>{greeting}</p>
          <h1 className="font-serif text-[2rem] leading-[1.1] tracking-tight text-white text-balance sm:text-[2.6rem]">
            Welcome back
            {nameLoading ? (
              <>, <span aria-hidden="true" className="inline-block h-[0.75em] w-[5ch] translate-y-[-0.05em] rounded-md bg-white/35 align-baseline animate-pulse" /></>
            ) : <>{welcomeName}.</> ? (
              <>, {welcomeName}.</>
            ) : null}
            
          </h1>
          <div aria-hidden="true" className="mt-4 h-[2px] w-14 rounded-full bg-white/45" />
          <p className="mt-4 text-sm leading-relaxed" style={{ color: accent.subtitleColor }}>{welcomeSubtitle}</p>
        </div>
      </div>
    </section>
  );
}

function RevampedStatCards({ accent, stats, loading }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, sub, icon: Icon }) => (
        <AutoSkeleton key={label} loading={loading}>
          <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <div
              data-no-skeleton
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: accent.gradientBar }}
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p data-no-skeleton className="truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-2 text-4xl font-bold leading-none tracking-tight" style={{ color: accent.base }}>{value}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>
              </div>
              <div data-no-skeleton className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: accent.base }}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
              </div>
            </div>
          </div>
        </AutoSkeleton>
      ))}
    </div>
  );
}

function RevampedEventsCard({ accent, loading, nextEvents, upcomingCount, calendarHref }) {
  const rows = loading ? [{ id: 'skeleton-event', placeholder: true }] : nextEvents;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div aria-hidden="true" className="h-4 w-0.5 rounded-full" style={{ background: accent.base }} />
          <h2 className="text-sm font-semibold tracking-tight">Upcoming Events{!loading && upcomingCount > 0 ? ` (${upcomingCount})` : ''}</h2>
        </div>
        <Link href={calendarHref} className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {!loading && nextEvents.length === 0 ? (
        <p className="px-6 py-4 text-sm text-muted-foreground">No upcoming events scheduled.</p>
      ) : (
        <AutoSkeleton loading={loading}>
          <ul className="flex-1 divide-y divide-border">
            {rows.map((event, idx) => (
              <li key={event.id} className="flex gap-4 px-6 py-4">
                <div
                  className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-md"
                  style={idx === 0
                    ? { background: accent.dateBadgeBg, color: 'white', border: 'none' }
                    : { background: 'transparent', border: `1px solid ${accent.dateBadgeBorder}` }}
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: idx === 0 ? 'rgba(255,255,255,0.7)' : 'var(--color-muted-foreground)' }}>
                    {event.placeholder ? 'Mon' : new Date(getEventStartDate(event)).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="mt-0.5 text-xl font-bold leading-none">
                    {event.placeholder ? '00' : new Date(getEventStartDate(event)).getDate()}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-snug text-foreground">
                    {event.placeholder ? 'Upcoming chapter event' : event.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.placeholder ? '6:00 PM – 7:00 PM' : formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}
                  </p>
                  {(event.placeholder || event.location) && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin data-no-skeleton className="h-2.5 w-2.5 shrink-0" />{' '}
                      <span className="truncate">{event.placeholder ? 'Campus location' : event.location}</span>
                    </p>
                  )}
                  {!event.placeholder && event.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{event.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </AutoSkeleton>
      )}
    </div>
  );
}

function RevampedAnnouncementsCard({ accent, loading, announcements, announcementsHref }) {
  const rows = loading
    ? [{ id: 'skeleton-announcement', placeholder: true }]
    : announcements.slice(0, 4);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div aria-hidden="true" className="h-4 w-0.5 rounded-full" style={{ background: accent.base }} />
          <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight"><Bell className="h-3.5 w-3.5" /> Announcements</h2>
        </div>
        {/* This card is a preview — bodies are clamped so four fit. The full
            text lives on the Announcements tab, which is why that tab exists. */}
        {announcementsHref && (
          <Link href={announcementsHref} className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            View all
          </Link>
        )}
      </div>

      {!loading && announcements.length === 0 ? (
        <p className="px-6 py-4 text-sm text-muted-foreground">No announcements yet.</p>
      ) : (
        <AutoSkeleton loading={loading}>
          <ul className="flex-1 divide-y divide-border">
            {rows.map((a) => {
              const isCommittee = Boolean(a.committee_id);
              return (
                <li key={a.id} className="flex flex-col gap-1.5 px-6 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug text-foreground text-balance">
                      {a.placeholder ? 'Chapter announcement title' : a.title}
                    </p>
                    <time className="mt-0.5 shrink-0 text-[11px] text-muted-foreground">
                      {a.placeholder ? '2d ago' : formatMessageTime(a.created_at)}
                    </time>
                  </div>
                  <span
                    className="inline-flex w-fit items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={a.placeholder || !isCommittee
                      ? { background: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }
                      : { background: accent.tagBg, color: accent.tagText }}
                  >
                    {a.placeholder ? 'Everyone' : isCommittee ? 'Committee' : formatAudience(a.audience)}
                  </span>
                  <p className="line-clamp-4 break-words text-xs leading-relaxed text-muted-foreground">
                    {a.placeholder
                      ? 'Announcement body preview text that fills a few lines so the skeleton matches the real card layout while content is loading.'
                      : a.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </AutoSkeleton>
      )}
    </div>
  );
}

function RevampedPhotosCard({ accent, loading, photos, filesHref }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div aria-hidden="true" className="h-4 w-0.5 rounded-full" style={{ background: accent.base }} />
          <h2 className="text-sm font-semibold tracking-tight">Recent Photos</h2>
        </div>
        <Link href={filesHref} className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
          View gallery <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {!loading && photos.length === 0 ? (
        <p className="px-6 py-4 text-sm text-muted-foreground">No photos uploaded yet.</p>
      ) : (
        <AutoSkeleton loading={loading}>
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            {(loading
              ? Array.from({ length: 4 }, (_, i) => ({ id: `skeleton-${i}` }))
              : photos.slice(0, 4)
            ).map((photo) => (
              <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                {loading ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img data-skeleton-role="image" alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <PhotoMedia photo={photo} />
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/20" />
                  </>
                )}
              </div>
            ))}
          </div>
        </AutoSkeleton>
      )}
    </div>
  );
}
export default function PortalDashboard({
  welcomeSubtitle,
  memberGroupLabel,
  calendarHref,
  filesHref,
  announcementsHref,
  theme = 'blue',
}) {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session, status: sessionStatus } = useSession();

  // Revamped now covers every real portal theme — this only stays false for
  // some genuinely unexpected value, in which case the plain fallback below
  // (dead code in practice) renders instead.
  const revamped = theme === 'blue' || theme === 'amber' || theme === 'teal';
  const accentTheme = THEMES[theme] ?? THEMES.blue;

  const isAmber = theme === 'amber';
  const heading = isAmber ? 'text-amber-900 dark:text-amber-100' : 'text-blue-900 dark:text-blue-100';
  const icon = isAmber ? 'text-amber-800 dark:text-amber-300' : 'text-blue-800 dark:text-blue-300';
  const statHover = isAmber ? 'hover:shadow-amber-200/50 dark:hover:shadow-amber-900/30' : 'hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/30';
  const eventHover = isAmber
    ? 'hover:border-amber-200 hover:bg-amber-50/50 dark:hover:border-amber-800 dark:hover:bg-amber-950/30'
    : 'hover:border-blue-200 hover:bg-blue-50/50 dark:hover:border-blue-800 dark:hover:bg-blue-950/30';
  const eventBadge = isAmber ? 'bg-amber-100 text-amber-900 dark:bg-[#22252b] dark:text-amber-100' : 'bg-blue-100 text-blue-900 dark:bg-[#22252b] dark:text-blue-100';
  const blobA = isAmber
    ? 'from-amber-400 via-orange-300 to-yellow-200'
    : 'from-indigo-500 via-fuchsia-500 to-cyan-400';
  const blobB = isAmber
    ? 'from-yellow-200 via-amber-400 to-orange-300'
    : 'from-cyan-400 via-indigo-500 to-fuchsia-500';

  useEffect(() => {
    Promise.all([
      getEvents(),
      getMembers(),
      getPhotos(),
      getAnnouncements(),
    ])
      .then(([eventsData, membersData, photosData, announcementsData]) => {
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setMembers(membersData);
        setPhotos(Array.isArray(photosData) ? photosData : []);
        setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load dashboard data');
      })
      .finally(() => setLoading(false));
  }, []);

  const nextEvents = upcomingEvents(events, 3);
  const upcomingCount = countUpcomingEvents(events);
  const totalEvents = events.length;
  const memberCount = members.length;
  const welcomeName = resolveWelcomeName(session, members);
  const nameLoading = sessionStatus === 'loading' || (loading && !welcomeName);
  const welcomeTitle = welcomeName ? `Welcome, ${welcomeName}!` : 'Welcome!';

  // Values stay populated while loading so AutoSkeleton can measure them;
  // the "-" placeholders are unnecessary because the skeleton overlays the real layout.
  const stats = [
    { label: 'Upcoming Events', value: String(upcomingCount), sub: `${totalEvents} on the calendar`, icon: Calendar },
    { label: memberGroupLabel, value: String(memberCount), sub: `${memberCount} listed`, icon: Users },
    { label: 'Announcements', value: String(announcements.length), sub: `${announcements.length} posted`, icon: Megaphone },
    { label: 'Photos', value: String(photos.length), sub: 'In the gallery', icon: ImageIcon },
  ];

  if (revamped) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 pb-8">
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
            <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
          </Card>
        )}

        <RevampedHero accent={accentTheme} welcomeName={welcomeName} welcomeSubtitle={welcomeSubtitle} nameLoading={nameLoading} />

        <RevampedStatCards accent={accentTheme} stats={stats} loading={loading} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <RevampedEventsCard accent={accentTheme} loading={loading} nextEvents={nextEvents} upcomingCount={upcomingCount} calendarHref={calendarHref} />
          </div>
          <div className="lg:col-span-2">
            <RevampedAnnouncementsCard accent={accentTheme} loading={loading} announcements={announcements} announcementsHref={announcementsHref} />
          </div>
        </div>

        <RevampedPhotosCard accent={accentTheme} loading={loading} photos={photos} filesHref={filesHref} />
      </div>
    );
  }

  return (
    <div className="relative space-y-6 overflow-x-hidden sm:space-y-8">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden sm:block dark:hidden">
        <div className={`absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br ${blobA} opacity-10 blur-[120px]`} />
        <div className={`absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr ${blobB} opacity-10 blur-[110px]`} />
      </div>

      <div>
        <h1 className={`mb-2 text-2xl font-bold sm:text-3xl ${heading}`}>{welcomeTitle}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 sm:text-base">{welcomeSubtitle}</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-6">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label} className={`ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm ${statHover} transition-all duration-300 sm:hover:-translate-y-0.5`}>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="truncate pr-2 text-xs font-medium text-slate-600 dark:text-slate-400 sm:text-sm">{label}</CardTitle>
                <Icon className={`h-4 w-4 shrink-0 ${icon}`} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className={`text-2xl font-bold ${heading}`}>{value}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3 sm:gap-6">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Upcoming Events{!loading && upcomingCount > 0 ? ` (${upcomingCount})` : ''}</CardTitle>
                  <CardDescription>What&apos;s coming up next</CardDescription>
                </div>
                <Link href={calendarHref} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    View All <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              {loading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading events...</p>
              ) : nextEvents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No upcoming events scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {nextEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`flex gap-3 rounded-lg border border-gray-200 dark:border-slate-700 p-3 transition-colors sm:gap-4 sm:p-4 ${eventHover}`}
                    >
                      <div className={`flex w-14 shrink-0 flex-col items-center justify-center rounded-lg px-3 py-2 sm:w-16 ${eventBadge}`}>
                        <div className="text-xs font-medium">
                          {new Date(getEventStartDate(event)).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-2xl font-bold">
                          {new Date(getEventStartDate(event)).getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="mb-1 break-words font-semibold text-gray-900 dark:text-gray-100">{event.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}
                        </p>
                        {event.location && (
                          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <MapPin className="h-3.5 w-3.5 shrink-0" /> {event.location}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="overflow-hidden">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Bell className="w-5 h-5" /> Announcements
              </CardTitle>
              <CardDescription>Latest from eboard</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              {loading ? (
                <p className="py-4 text-sm text-gray-500 dark:text-gray-400">Loading announcements...</p>
              ) : announcements.length === 0 ? (
                <p className="py-4 text-sm text-gray-500 dark:text-gray-400">No announcements yet.</p>
              ) : (
                <div className="space-y-3">
                  {announcements.slice(0, 4).map((a) => (
                    <div key={a.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{a.title}</p>
                        <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{formatMessageTime(a.created_at)}</span>
                      </div>
                      <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{a.body}</p>
                      <span className="mt-1 inline-block text-xs text-gray-500 dark:text-gray-400">
                        {a.committee_id ? 'Committee' : formatAudience(a.audience)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">Recent Photos</CardTitle>
              <CardDescription>Latest from the chapter</CardDescription>
            </div>
            <Link href={filesHref} className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                View Gallery <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading photos...</p>
          ) : photos.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {photos.slice(0, 4).map((photo) => (
                <div key={photo.id} className="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-800">
                  <PhotoMedia photo={photo} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
