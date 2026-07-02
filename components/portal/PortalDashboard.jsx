'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Megaphone, ImageIcon, ArrowRight, Bell } from 'lucide-react';
import { getEvents, getMembers, getPhotos } from '@/lib/portal-api';
import { formatEventTimeRange, upcomingEvents } from '@/lib/portal-format';

export default function PortalDashboard({
  welcomeTitle,
  welcomeSubtitle,
  memberGroup,
  memberGroupLabel,
  calendarHref,
  filesHref,
  theme = 'blue',
}) {
  const [events, setEvents] = useState([]);
  const [memberCount, setMemberCount] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      getMembers(memberGroup),
      getPhotos(),
    ])
      .then(([eventsData, membersData, photosData]) => {
        setEvents(eventsData);
        setMemberCount(membersData.length);
        setPhotos(photosData);
      })
      .catch((err) => setError(err.message ?? 'Could not load dashboard data'))
      .finally(() => setLoading(false));
  }, [memberGroup]);

  const nextEvents = upcomingEvents(events, 3);
  const upcomingCount = events.filter((e) => new Date(e.startDate).getTime() >= Date.now()).length;

  const stats = [
    { label: 'Upcoming Events', value: loading ? '—' : String(upcomingCount), sub: 'On the chapter calendar', icon: Calendar },
    { label: memberGroupLabel, value: loading ? '—' : String(memberCount ?? 0), sub: `Alumni and Members`, icon: Users },
    { label: 'Announcements', value: '0', sub: 'N/A', icon: Megaphone },
    { label: 'Photos', value: loading ? '—' : String(photos.length), sub: 'In the gallery', icon: ImageIcon },
  ];

  return (
    <div className="relative space-y-8">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className={`absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br ${blobA} opacity-10 blur-[120px]`} />
        <div className={`absolute -bottom-32 right-0 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr ${blobB} opacity-10 blur-[110px]`} />
      </div>

      <div>
        <h1 className={`text-3xl font-bold ${heading} mb-2`}>{welcomeTitle}</h1>
        <p className="text-slate-600">{welcomeSubtitle}</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label} className={`ring-1 ring-slate-100 shadow-sm ${statHover} hover:-translate-y-0.5 transition-all duration-300`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">{label}</CardTitle>
                <Icon className={`w-4 h-4 ${icon}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${heading}`}>{value}</div>
              <p className="text-xs text-slate-500 mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>What&apos;s coming up next</CardDescription>
                </div>
                <Link href={calendarHref}>
                  <Button variant="outline" size="sm">
                    View All <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-gray-500 py-4">Loading events…</p>
              ) : nextEvents.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No upcoming events scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {nextEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`flex gap-4 p-4 rounded-lg border border-gray-200 ${eventHover} transition-colors`}
                    >
                      <div className={`flex flex-col items-center justify-center rounded-lg px-3 py-2 min-w-16 ${eventBadge}`}>
                        <div className="text-xs font-medium">
                          {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div className="text-2xl font-bold">
                          {new Date(event.startDate).getDate()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                        <p className="text-sm text-gray-600">
                          {formatEventTimeRange(event.startDate, event.endDate)}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" /> Announcements
              </CardTitle>
              <CardDescription>Announcements will appear here once the messages API is enabled on the backend.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Photos</CardTitle>
              <CardDescription>Latest from the chapter</CardDescription>
            </div>
            <Link href={filesHref}>
              <Button variant="outline" size="sm">
                View Gallery <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500 py-4">Loading photos…</p>
          ) : photos.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No photos uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
