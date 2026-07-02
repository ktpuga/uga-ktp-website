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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-center text-sm text-gray-500 py-12">Loading events…</p>
      ) : sortedEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No events scheduled yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sortedEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <Badge className="bg-gray-100 text-gray-800">Event</Badge>
                    </div>
                    {event.description && (
                      <CardDescription>{event.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{formatEventDate(getEventStartDate(event))}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
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
