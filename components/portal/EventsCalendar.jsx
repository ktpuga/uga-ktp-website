'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { getEvents } from '@/lib/portal-api';
import { formatEventDate, formatEventTimeRange, sortEventsChronologically, getEventStartDate, getEventEndDate } from '@/lib/portal-format';

export default function EventsCalendar({ title, description }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((err) => setError(err.message ?? 'Could not load events'))
      .finally(() => setLoading(false));
  }, []);

  const sortedEvents = sortEventsChronologically(events);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
        <p className="text-sm text-gray-600 sm:text-base">{description}</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500 sm:py-12">Loading events...</p>
      ) : sortedEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center px-4 py-10 text-center sm:py-12">
            <CalendarIcon className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No events scheduled yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                      <CardTitle className="min-w-0 break-words text-lg sm:text-xl">{event.title}</CardTitle>
                      <Badge className="shrink-0 bg-gray-100 text-gray-800">Event</Badge>
                    </div>
                    {event.description && (
                      <CardDescription>{event.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <span className="min-w-0 text-gray-700">{formatEventDate(getEventStartDate(event))}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="min-w-0 text-gray-700">
                      {formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm mt-3 pt-3 border-t border-gray-100">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                  <span className="text-gray-500">Location TBD</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
