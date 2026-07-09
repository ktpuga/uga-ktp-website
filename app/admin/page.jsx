'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CheckCircle2, ImageIcon, Target, Users } from 'lucide-react';
import { getEvents, getMembers, getPhotos } from '@/lib/portal-api';
import {
  countUpcomingEvents,
  formatMemberGroup,
  formatPhotoDate,
  getEventStartDate,
  normalizeApiList,
} from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';

const ACTIVE_MEMBER_GROUPS = new Set(['eboard', 'chair', 'active']);
const LEADERSHIP_GROUPS = new Set(['eboard', 'chair']);
const KNOWN_MEMBER_GROUPS = ['eboard', 'chair', 'active', 'pledge', 'alumni'];

const GROUP_BAR_CLASS = {
  eboard: 'bg-red-900',
  chair: 'bg-red-700',
  active: 'bg-blue-700',
  pledge: 'bg-green-700',
  alumni: 'bg-amber-700',
  unknown: 'bg-slate-500',
};

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

function buildMemberGroupData(members) {
  const counts = new Map();

  members.forEach((member) => {
    const group = memberGroup(member);
    counts.set(group, (counts.get(group) ?? 0) + 1);
  });

  const knownRows = KNOWN_MEMBER_GROUPS.map((group) => ({
    group,
    label: formatMemberGroup(group),
    count: counts.get(group) ?? 0,
  })).filter((row) => row.count > 0);

  const extraRows = [...counts.entries()]
    .filter(([group]) => !KNOWN_MEMBER_GROUPS.includes(group))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, count]) => ({
      group,
      label: formatMemberGroup(group),
      count,
    }));

  return [...knownRows, ...extraRows];
}

function buildMonthlyEventData(events) {
  const buckets = new Map();

  events.forEach((event) => {
    const time = eventTimestamp(event);
    if (Number.isNaN(time)) return;

    const date = new Date(time);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    const bucket = buckets.get(key) ?? { key, label, count: 0 };
    bucket.count += 1;
    buckets.set(key, bucket);
  });

  return [...buckets.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-6);
}

function buildProfileCoverage(members) {
  const total = members.length;
  const percent = (count) => (total === 0 ? 0 : Math.round((count / total) * 100));

  const rows = [
    {
      label: 'Name listed',
      count: members.filter((member) =>
        memberHasAny(member, ['preferred_name', 'preferredName', 'first_name', 'firstName', 'last_name', 'lastName', 'username']),
      ).length,
    },
    {
      label: 'Major listed',
      count: members.filter((member) => memberHasAny(member, ['major'])).length,
    },
    {
      label: 'Pledge class listed',
      count: members.filter((member) => memberHasAny(member, ['pledge_class', 'pledgeClass'])).length,
    },
    {
      label: 'Graduation listed',
      count: members.filter((member) => memberHasAny(member, ['graduation_date', 'graduationDate'])).length,
    },
  ];

  return rows.map((row) => ({ ...row, percent: percent(row.count) }));
}

export default function AdminAnalytics() {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    Promise.all([
      getEvents(),
      getMembers(),
      getPhotos(),
    ])
      .then(([eventsData, membersData, photosData]) => {
        if (!active) return;
        setEvents(normalizeApiList(eventsData));
        setMembers(normalizeApiList(membersData));
        setPhotos(normalizeApiList(photosData));
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        if (!active) return;
        setError(err.message ?? 'Could not load analytics data');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const analytics = useMemo(() => {
    const now = Date.now();
    const memberCount = members.length;
    const activeMemberCount = members.filter((member) => ACTIVE_MEMBER_GROUPS.has(memberGroup(member))).length;
    const leadershipCount = members.filter((member) => LEADERSHIP_GROUPS.has(memberGroup(member))).length;
    const upcomingCount = countUpcomingEvents(events);
    const pastEventCount = events.filter((event) => {
      const time = eventTimestamp(event);
      return !Number.isNaN(time) && time < now;
    }).length;
    const undatedEventCount = events.filter((event) => Number.isNaN(eventTimestamp(event))).length;
    const memberGroupData = buildMemberGroupData(members);
    const monthlyEventData = buildMonthlyEventData(events);
    const profileCoverage = buildProfileCoverage(members);
    const latestPhotos = [...photos]
      .sort((a, b) => {
        const bTime = photoTimestamp(b);
        const aTime = photoTimestamp(a);
        if (Number.isNaN(bTime) && Number.isNaN(aTime)) return 0;
        if (Number.isNaN(bTime)) return 1;
        if (Number.isNaN(aTime)) return -1;
        return bTime - aTime;
      })
      .slice(0, 5);

    return {
      activeMemberCount,
      leadershipCount,
      latestPhotos,
      memberCount,
      memberGroupData,
      monthlyEventData,
      pastEventCount,
      photoCount: photos.length,
      profileCoverage,
      totalEventCount: events.length,
      undatedEventCount,
      upcomingCount,
    };
  }, [events, members, photos]);

  const maxGroupCount = Math.max(1, ...analytics.memberGroupData.map((row) => row.count));
  const maxMonthlyEvents = Math.max(1, ...analytics.monthlyEventData.map((row) => row.count));

  const stats = [
    {
      label: 'Total Members',
      value: analytics.memberCount,
      sub: 'From /members',
      icon: Users,
    },
    {
      label: 'Active Members',
      value: analytics.activeMemberCount,
      sub: 'E-board, chairs, and active members',
      icon: CheckCircle2,
    },
    {
      label: 'Upcoming Events',
      value: analytics.upcomingCount,
      sub: `${analytics.totalEventCount} total events`,
      icon: Calendar,
    },
    {
      label: 'Photos',
      value: analytics.photoCount,
      sub: 'From /photos',
      icon: ImageIcon,
    },
  ];

  return (
    <div className="relative space-y-6">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden dark:hidden">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-red-500 via-rose-400 to-orange-300 opacity-10 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-orange-300 via-red-400 to-rose-500 opacity-10 blur-[110px]" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-red-900 dark:text-red-100">Analytics</h1>
          <p className="text-slate-600 dark:text-slate-400">Live chapter metrics from the portal API</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label} className="shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-red-200/50 dark:ring-slate-800 dark:hover:shadow-red-900/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</CardTitle>
                <Icon className="h-4 w-4 text-red-800 dark:text-red-300" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                {loading ? '-' : value}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {loading ? 'Loading from API' : sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="profiles">Profiles</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Member Groups</CardTitle>
              <CardDescription>Current directory composition from the members API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="py-4 text-sm text-slate-500 dark:text-slate-400">Loading members...</p>
              ) : analytics.memberGroupData.length === 0 ? (
                <p className="py-4 text-sm text-slate-500 dark:text-slate-400">No members returned by the API.</p>
              ) : (
                analytics.memberGroupData.map((row) => (
                  <div key={row.group}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{row.label}</span>
                      <span className="text-slate-500 dark:text-slate-400">{row.count}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-3 rounded-full ${GROUP_BAR_CLASS[row.group] ?? GROUP_BAR_CLASS.unknown}`}
                        style={{ width: `${(row.count / maxGroupCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Event Volume</CardTitle>
                <CardDescription>Events grouped by month from the events API</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="py-4 text-sm text-slate-500 dark:text-slate-400">Loading events...</p>
                ) : analytics.monthlyEventData.length === 0 ? (
                  <p className="py-4 text-sm text-slate-500 dark:text-slate-400">No dated events returned by the API.</p>
                ) : (
                  <div className="flex h-48 items-end gap-4">
                    {analytics.monthlyEventData.map((row) => (
                      <div key={row.key} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{row.count}</span>
                        <div
                          className="w-full rounded-t bg-red-800"
                          style={{ height: `${Math.max(12, (row.count / maxMonthlyEvents) * 160)}px` }}
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400">{row.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Status</CardTitle>
                <CardDescription>Derived from event start dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Upcoming', value: analytics.upcomingCount },
                  { label: 'Past', value: analytics.pastEventCount },
                  { label: 'Undated', value: analytics.undatedEventCount },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.label}</span>
                    <span className="text-lg font-semibold text-red-900 dark:text-red-100">
                      {loading ? '-' : row.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profiles" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Profile Coverage</CardTitle>
                <CardDescription>How complete member directory fields are today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p className="py-4 text-sm text-slate-500 dark:text-slate-400">Loading profiles...</p>
                ) : analytics.memberCount === 0 ? (
                  <p className="py-4 text-sm text-slate-500 dark:text-slate-400">No member profiles returned by the API.</p>
                ) : (
                  analytics.profileCoverage.map((row) => (
                    <div key={row.label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{row.label}</span>
                        <span className="text-slate-500 dark:text-slate-400">{row.count}/{analytics.memberCount}</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-3 rounded-full bg-red-800" style={{ width: `${row.percent}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leadership</CardTitle>
                <CardDescription>E-board and chair groups</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-100">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                    {loading ? '-' : analytics.leadershipCount}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Current leadership profiles</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="photos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Photo Library</CardTitle>
              <CardDescription>Recent records from the photos API</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="py-4 text-sm text-slate-500 dark:text-slate-400">Loading photos...</p>
              ) : analytics.latestPhotos.length === 0 ? (
                <p className="py-4 text-sm text-slate-500 dark:text-slate-400">No photos returned by the API.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {analytics.latestPhotos.map((photo) => (
                    <div key={photo.id ?? photo.title ?? photo.url} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {photo.title || photo.name || 'Untitled photo'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {Number.isNaN(photoTimestamp(photo)) ? 'No upload date' : formatPhotoDate(new Date(photoTimestamp(photo)).toISOString())}
                        </p>
                      </div>
                      <ImageIcon className="h-4 w-4 shrink-0 text-red-800 dark:text-red-300" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
