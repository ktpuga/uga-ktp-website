'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Megaphone, ImageIcon, ArrowRight, Bell } from 'lucide-react';
import { getEvents, getMembers, getPhotos } from '@/lib/portal-api';
import { formatEventTimeRange, upcomingEvents, countUpcomingEvents, getEventStartDate, getEventEndDate } from '@/lib/portal-format';

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

export default function PortalDashboard({
  welcomeSubtitle,
  memberGroupLabel,
  calendarHref,
  filesHref,
  theme = 'blue',
}) {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { data: session } = useSession();

  const isAmber = theme === 'amber';
  const heading = isAmber ? 'text-amber-900' : 'text-blue-900';
  const icon = isAmber ? 'text-amber-800' : 'text-blue-800';
  const statHover = isAmber ? 'hover:shadow-amber-200/50' : 'hover:shadow-indigo-200/50';
  const eventHover = isAmber
    ? 'hover:border-amber-200 hover:bg-amber-50/50'
    : 'hover:border-blue-200 hover:bg-blue-50/50';
  const eventBadge = isAmber ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900';
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
    ])
      .then(([eventsData, membersData, photosData]) => {
        setEvents(Array.isArray(eventsData) ? eventsData : []);
        setMembers(membersData);
        setPhotos(Array.isArray(photosData) ? photosData : []);
      })
      .catch((err) => setError(err.message ?? 'Could not load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const nextEvents = upcomingEvents(events, 3);
  const upcomingCount = countUpcomingEvents(events);
  const totalEvents = events.length;
  const memberCount = members.length;
  const welcomeName = resolveWelcomeName(session, members);
  const welcomeTitle = welcomeName ? `Welcome, ${welcomeName}!` : 'Welcome!';

  const stats = [
    { label: 'Upcoming Events', value: loading ? '-' : String(upcomingCount), sub: loading ? 'On the chapter calendar' : `${totalEvents} on the calendar`, icon: Calendar },
    { label: memberGroupLabel, value: loading ? '-' : String(memberCount), sub: loading ? 'From chapter directory' : `${memberCount} listed`, icon: Users },
    { label: 'Announcements', value: '0', sub: 'N/A', icon: Megaphone },
    { label: 'Photos', value: loading ? '-' : String(photos.length), sub: 'In the gallery', icon: ImageIcon },
  ];

  return (
    <div className="relative space-y-6 overflow-x-hidden sm:space-y-8">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden sm:block">
        <div className={`absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br ${blobA} opacity-10 blur-[120px]`} />
        <div className={`absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr ${blobB} opacity-10 blur-[110px]`} />
      </div>

      <div>
        <h1 className={`mb-2 text-2xl font-bold sm:text-3xl ${heading}`}>{welcomeTitle}</h1>
        <p className="text-sm text-slate-600 sm:text-base">{welcomeSubtitle}</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 sm:gap-6">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label} className={`ring-1 ring-slate-100 shadow-sm ${statHover} transition-all duration-300 sm:hover:-translate-y-0.5`}>
            <CardHeader className="p-4 pb-2 sm:p-6 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="truncate pr-2 text-xs font-medium text-slate-600 sm:text-sm">{label}</CardTitle>
                <Icon className={`h-4 w-4 shrink-0 ${icon}`} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <div className={`text-2xl font-bold ${heading}`}>{value}</div>
              <p className="text-xs text-slate-500 mt-1">{sub}</p>
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
                <p className="text-sm text-gray-500 py-4">Loading events...</p>
              ) : nextEvents.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No upcoming events scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {nextEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`flex gap-3 rounded-lg border border-gray-200 p-3 transition-colors sm:gap-4 sm:p-4 ${eventHover}`}
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
                        <h4 className="mb-1 break-words font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-600">
                          {formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}
                        </p>
                        {event.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
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
              <CardDescription>Announcements will appear here once the messages API is enabled on the backend.</CardDescription>
            </CardHeader>
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
            <p className="text-sm text-gray-500 py-4">Loading photos...</p>
          ) : photos.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {photos.slice(0, 4).map((photo) => (
                <div
                  key={photo.id}
                  className={`aspect-square rounded-lg flex items-center justify-center p-3 ${eventBadge}`}
                >
                  <span className="text-xs font-medium text-center text-gray-700 line-clamp-3">
                    {photo.title || 'Untitled'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
