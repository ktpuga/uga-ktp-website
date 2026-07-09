'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock, MapPin, CalendarDays, Trash2, X } from 'lucide-react';
import { getEvents, deleteEvent } from '@/lib/portal-api';
import { formatEventTimeRange, getEventStartDate, getEventEndDate, formatAudience } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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

// The popover for a day's events, anchored right above that day's cell —
// `bottom-full` + a relatively-positioned cell wrapper does the anchoring,
// no manual pixel math needed.
const ALIGN_CLASSES = {
  left: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-0',
};

function DayPopover({ date, dayEvents, align, isEboard, currentUserId, onDelete, onClose }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute bottom-full z-50 mb-2 w-64 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-xl dark:border-slate-700 dark:bg-slate-900 ${ALIGN_CLASSES[align]}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {dayEvents.length === 0 ? (
        <p className="py-2 text-xs text-gray-500 dark:text-gray-400">No events scheduled.</p>
      ) : (
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {dayEvents.map((event) => {
            const canDelete = isEboard || event.createdBy === currentUserId;
            return (
              <div key={event.id} className="space-y-1.5 border-t border-gray-100 pt-2 first:border-0 first:pt-0 dark:border-slate-800">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">{event.title}</h3>
                  {canDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(event.id)}
                      className="h-6 w-6 shrink-0 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <Badge className="bg-gray-100 text-[10px] text-gray-800 dark:bg-slate-800 dark:text-slate-200">
                  {formatAudience(event.audience)}
                </Badge>
                {event.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">{event.description}</p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
                  {formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-500 dark:text-gray-400" />
                  {event.location || 'Location TBD'}
                </div>
                {event.calendlyUrl && (
                  <a
                    href={event.calendlyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline dark:text-blue-400"
                  >
                    <CalendarDays className="h-3.5 w-3.5" /> Schedule / RSVP
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EventsCalendar({ title, description }) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.authentik_id;
  const isEboard = session?.user?.groups?.includes('eboard') ?? false;

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [openDate, setOpenDate] = useState(null);

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load events');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete event');
    }
  }

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

  function goToMonth(offset) {
    setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    setOpenDate(null);
  }

  function goToToday() {
    const now = new Date();
    setMonth(startOfMonth(now));
    setOpenDate(now);
  }

  function toggleDay(day) {
    setOpenDate((prev) => (prev && dateKey(prev) === dateKey(day) ? null : day));
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
          {openDate && (
            <div className="fixed inset-0 z-40" onClick={() => setOpenDate(null)} />
          )}

          <Card className="mx-auto w-full max-w-sm overflow-visible sm:max-w-md">
            <CardContent className="p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <Button type="button" variant="ghost" size="sm" onClick={() => goToMonth(-1)} aria-label="Previous month" className="h-8 w-8 p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">
                  {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={() => goToMonth(1)} aria-label="Next month" className="h-8 w-8 p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {WEEKDAY_LABELS.map((label, i) => (
                  <div key={i} className="py-1">{label}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const inMonth = day.getMonth() === month.getMonth();
                  const isToday = dateKey(day) === dateKey(today);
                  const isOpen = openDate && dateKey(day) === dateKey(openDate);
                  const dayEvents = eventsByDay.get(dateKey(day)) ?? [];
                  const weekday = day.getDay();
                  const align = weekday <= 1 ? 'left' : weekday >= 5 ? 'right' : 'center';

                  return (
                    <div key={day.toISOString()} className="relative">
                      <button
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md text-sm transition-colors ${
                          isOpen
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
                            className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-white' : 'bg-blue-600 dark:bg-blue-400'}`}
                          />
                        )}
                      </button>

                      {isOpen && (
                        <DayPopover
                          date={openDate}
                          dayEvents={dayEvents}
                          align={align}
                          isEboard={isEboard}
                          currentUserId={currentUserId}
                          onDelete={handleDelete}
                          onClose={() => setOpenDate(null)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
