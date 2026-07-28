'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Users, UserCheck, CalendarDays, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getEvents, getMembers, getPhotos } from '@/lib/portal-api';
import { countUpcomingEvents, formatMemberGroup, formatPhotoDate, getEventStartDate, normalizeApiList } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import AnalyticsStatRow from './AnalyticsStatRow';
import MembersTab from './tabs/MembersTab';
import EventsTab from './tabs/EventsTab';
import ProfilesTab from './tabs/ProfilesTab';
import PhotosTab from './tabs/PhotosTab';

// Matches the existing multi-color group scheme already used everywhere
// else (Directory, /admin/users, this page's own prior GROUP_BAR_CLASS) —
// deliberately not the monochromatic maroon gradient v0 first proposed,
// since that would've reintroduced the exact chair-color inconsistency
// fixed earlier across the app.
const GROUP_HEX = {
  eboard: '#7f1d1d',
  chair: '#7e22ce',
  active: '#1d4ed8',
  pledge: '#15803d',
  alumni: '#b45309',
  unknown: '#6b7280',
};

const KNOWN_MEMBER_GROUPS = ['eboard', 'chair', 'active', 'pledge', 'alumni'];
const ACTIVE_MEMBER_GROUPS = new Set(['eboard', 'chair', 'active']);

const TABS = [
  { id: 'members', label: 'Members' },
  { id: 'events', label: 'Events' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'photos', label: 'Photos' },
];

function cleanValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function memberGroup(member) {
  return cleanValue(member?.member_group) ?? cleanValue(member?.memberGroup) ?? 'unknown';
}

function memberHasAny(member, fields) {
  return fields.some((field) => cleanValue(member?.[field]));
}

function eventTimestamp(event) {
  const start = getEventStartDate(event);
  if (!start) return NaN;
  const time = new Date(start).getTime();
  return Number.isNaN(time) ? NaN : time;
}

function photoTimestamp(photo) {
  const value = photo?.created_at ?? photo?.createdAt ?? photo?.uploaded_at ?? photo?.uploadedAt ?? photo?.date;
  if (!value) return NaN;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? NaN : time;
}

function buildMemberGroups(members) {
  const counts = new Map();
  members.forEach((member) => {
    const group = memberGroup(member);
    counts.set(group, (counts.get(group) ?? 0) + 1);
  });

  const knownRows = KNOWN_MEMBER_GROUPS.map((group) => ({
    id: group,
    label: formatMemberGroup(group),
    count: counts.get(group) ?? 0,
    color: GROUP_HEX[group] ?? GROUP_HEX.unknown,
  })).filter((row) => row.count > 0);

  const extraRows = [...counts.entries()]
    .filter(([group]) => !KNOWN_MEMBER_GROUPS.includes(group))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, count]) => ({ id: group, label: formatMemberGroup(group), count, color: GROUP_HEX.unknown }));

  return [...knownRows, ...extraRows];
}

function buildEventsByMonth(events) {
  const buckets = new Map();
  events.forEach((event) => {
    const time = eventTimestamp(event);
    if (Number.isNaN(time)) return;
    const date = new Date(time);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const bucket = buckets.get(key) ?? { key, month: label, events: 0 };
    bucket.events += 1;
    buckets.set(key, bucket);
  });
  return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key)).slice(-6);
}

function buildProfileCoverage(members) {
  const total = members.length;
  const rows = [
    { field: 'Name listed', fields: ['preferred_name', 'preferredName', 'first_name', 'firstName', 'last_name', 'lastName', 'username'] },
    { field: 'Major listed', fields: ['major'] },
    { field: 'Pledge class listed', fields: ['pledge_class', 'pledgeClass'] },
    { field: 'Graduation listed', fields: ['graduation_date', 'graduationDate'] },
  ];
  return rows.map(({ field, fields }) => ({
    field,
    filled: members.filter((member) => memberHasAny(member, fields)).length,
    total,
  }));
}

export default function AnalyticsContent({ accentBase, accentGradient, accentMuted, accentLight }) {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    let active = true;
    Promise.all([getEvents(), getMembers(), getPhotos()])
      .then(([eventsData, membersData, photosData]) => {
        if (!active) return;
        setEvents(normalizeApiList(eventsData));
        setMembers(normalizeApiList(membersData));
        setPhotos(normalizeApiList(photosData));
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        if (active) setError(err.message ?? 'Could not load analytics data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const analytics = useMemo(() => {
    const now = Date.now();
    const memberCount = members.length;
    const eboardCount = members.filter((m) => memberGroup(m) === 'eboard').length;
    const chairCount = members.filter((m) => memberGroup(m) === 'chair').length;
    const activeMemberCount = members.filter((m) => ACTIVE_MEMBER_GROUPS.has(memberGroup(m))).length;

    const upcomingEvents = events
      .filter((event) => {
        const time = eventTimestamp(event);
        return !Number.isNaN(time) && time >= now;
      })
      .sort((a, b) => eventTimestamp(a) - eventTimestamp(b));
    const upcomingCount = countUpcomingEvents(events);
    const pastEventCount = events.filter((event) => {
      const time = eventTimestamp(event);
      return !Number.isNaN(time) && time < now;
    }).length;
    const undatedEventCount = events.filter((event) => Number.isNaN(eventTimestamp(event))).length;

    const latestPhotos = [...photos]
      .sort((a, b) => {
        const bTime = photoTimestamp(b);
        const aTime = photoTimestamp(a);
        if (Number.isNaN(bTime) && Number.isNaN(aTime)) return 0;
        if (Number.isNaN(bTime)) return 1;
        if (Number.isNaN(aTime)) return -1;
        return bTime - aTime;
      })
      .slice(0, 5)
      .map((photo) => ({
        ...photo,
        dateLabel: Number.isNaN(photoTimestamp(photo)) ? 'No upload date' : formatPhotoDate(new Date(photoTimestamp(photo)).toISOString()),
      }));

    return {
      memberCount,
      activeMemberCount,
      leadershipCounts: [
        { label: 'E-Board Officers', count: eboardCount },
        { label: 'Committee Chairs', count: chairCount },
        { label: 'Total Leadership', count: eboardCount + chairCount },
      ],
      memberGroups: buildMemberGroups(members),
      eventsByMonth: buildEventsByMonth(events),
      eventStatus: [
        { label: 'Upcoming', count: upcomingCount, description: 'Scheduled, not yet happened' },
        { label: 'Past', count: pastEventCount, description: 'Already happened' },
        { label: 'Undated', count: undatedEventCount, description: 'Created, no date set' },
      ],
      profileCoverage: buildProfileCoverage(members),
      latestPhotos,
      photoCount: photos.length,
      totalEventCount: events.length,
      nextEventLabel: upcomingEvents[0]
        ? new Date(eventTimestamp(upcomingEvents[0])).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null,
    };
  }, [events, members, photos]);

  const stats = [
    { id: 'total_members', label: 'Total Members', value: loading ? '-' : analytics.memberCount, sub: 'across all groups', icon: Users },
    { id: 'active_members', label: 'Active Members', value: loading ? '-' : analytics.activeMemberCount, sub: 'E-board, chairs & active', icon: UserCheck },
    {
      id: 'upcoming_events',
      label: 'Upcoming Events',
      value: loading ? '-' : analytics.eventStatus?.[0]?.count ?? 0,
      sub: loading ? '' : `${analytics.totalEventCount} total events`,
      icon: CalendarDays,
      delta: analytics.nextEventLabel ? `Next: ${analytics.nextEventLabel}` : null,
    },
    { id: 'photos', label: 'Photos', value: loading ? '-' : analytics.photoCount, sub: 'in the library', icon: ImageIcon },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accentLight }}>
          Chapter Overview
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accentBase }}>Analytics</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Live chapter metrics from the portal API</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      <AnalyticsStatRow stats={stats} accentBase={accentBase} accentGradient={accentGradient} accentMuted={accentMuted} />

      <div>
        <div className="relative mb-6 flex items-center gap-1 border-b border-border">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn('relative px-4 pb-3 pt-1 text-sm font-medium transition-colors duration-150', isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')}
                aria-selected={isActive}
                role="tab"
              >
                {tab.label}
                {isActive && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full" style={{ background: accentBase }} />}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">Loading analytics...</p>
        ) : (
          <div role="tabpanel">
            {activeTab === 'members' && <MembersTab memberGroups={analytics.memberGroups} totalMembers={analytics.memberCount} accentBase={accentBase} />}
            {activeTab === 'events' && <EventsTab eventsByMonth={analytics.eventsByMonth} eventStatus={analytics.eventStatus} accentBase={accentBase} accentMuted={accentMuted} />}
            {activeTab === 'profiles' && (
              <ProfilesTab
                profileCoverage={analytics.profileCoverage}
                leadershipCounts={analytics.leadershipCounts}
                memberCount={analytics.memberCount}
                accentBase={accentBase}
                accentGradient={accentGradient}
                accentMuted={accentMuted}
              />
            )}
            {activeTab === 'photos' && <PhotosTab photos={analytics.latestPhotos} accentBase={accentBase} accentGradient={accentGradient} accentMuted={accentMuted} />}
          </div>
        )}
      </div>
    </div>
  );
}
