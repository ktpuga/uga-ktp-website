'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock, MapPin, CalendarDays } from 'lucide-react';
import { getEvents } from '@/lib/portal-api';
import { formatEventTimeRange, getEventStartDate, getEventEndDate, formatAudience } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// The 6x7 grid of days shown for a given month, including the trailing days
// of the previous/next month needed to fill out whole weeks.
function buildMonthGrid(monthDate) {
  const firstOfMonth = startOfMonth(monthDate);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    days.push(day);
  }
  return days;
}

export default function EventsCalendar({ title, description }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load events');
      })
      .finally(() => setLoading(false));
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      const start = getEventStartDate(event);
      if (!start) continue;
      const key = dateKey(new Date(start));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(event);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(getEventStartDate(a)) - new Date(getEventStartDate(b)));
    }
    return map;
  }, [events]);

  const days = useMemo(() => buildMonthGrid(month), [month]);
  const today = new Date();
  const selectedEvents = selectedDate ? eventsByDay.get(dateKey(selectedDate)) ?? [] : [];

  function goToMonth(offset) {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  function goToToday() {
    const now = new Date();
    setMonth(startOfMonth(now));
    setSelectedDate(now);
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">{description}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40">
          <CardContent className="pt-6 text-sm text-red-700 dark:text-red-300">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400 sm:py-12">Loading events...</p>
      ) : (
        <>
          <Card className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <Button type="button" variant="ghost" size="sm" onClick={() => goToMonth(-1)} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">
                  {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={() => goToMonth(1)} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="py-1">{label}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const inMonth = day.getMonth() === month.getMonth();
                  const isToday = dateKey(day) === dateKey(today);
                  const isSelected = selectedDate && dateKey(day) === dateKey(selectedDate);
                  const dayEvents = eventsByDay.get(dateKey(day)) ?? [];

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={`flex aspect-square flex-col items-center justify-start gap-1 rounded-lg p-1 text-sm transition-colors sm:p-2 ${
                        isSelected
                          ? 'bg-blue-800 text-white'
                          : isToday
                            ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200'
                            : inMonth
                              ? 'text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-slate-800'
                              : 'text-gray-300 hover:bg-gray-50 dark:text-slate-700 dark:hover:bg-slate-900'
                      }`}
                    >
                      <span>{day.getDate()}</span>
                      {dayEvents.length > 0 && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-600 dark:bg-blue-400'}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Select a day'}
            </h2>

            {selectedEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center px-4 py-8 text-center">
                  <CalendarDays className="mb-3 h-10 w-10 text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">No events scheduled for this day.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {selectedEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden">
                    <CardContent className="space-y-2 p-4 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{event.title}</h3>
                        <Badge className="bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-200">
                          {formatAudience(event.audience)}
                        </Badge>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Clock className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                        {formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <MapPin className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                        {event.location || 'Location TBD'}
                      </div>
                      {event.calendlyUrl && (
                        <a
                          href={event.calendlyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
                        >
                          <CalendarDays className="h-4 w-4" /> Schedule / RSVP
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
