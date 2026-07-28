'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, ChevronRight, Clock, MapPin, CalendarDays, Trash2, X,
  CheckSquare, Loader2, AlertCircle, ArrowRight,
} from 'lucide-react';
import { getEvents, deleteEvent } from '@/lib/portal-api';
import { formatEventTimeRange, getEventStartDate, getEventEndDate, formatAudience } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';

const ACCENT_THEMES = {
  blue: { base: '#1e3a8a', gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)', light: '#1d4ed8', muted: 'rgba(30,58,138,0.10)' },
  red: { base: '#7f1d1d', gradient: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', light: '#991b1b', muted: 'rgba(127,29,29,0.10)' },
};

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = firstDay - 1; i >= 0; i -= 1) {
    const d = daysInPrev - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    cells.push({ day: d, currentMonth: false, iso: localDateKey(new Date(prevYear, prevMonth, d)) });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ day: d, currentMonth: true, iso: localDateKey(new Date(year, month, d)) });
  }
  let d = 1;
  while (cells.length < 42) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    cells.push({ day: d, currentMonth: false, iso: localDateKey(new Date(nextYear, nextMonth, d)) });
    d += 1;
  }
  return cells;
}

// ─── Legacy calendar (Alumni portal — deliberately untouched, see project-portal-revamp memory) ───

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function dateKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

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

const ALIGN_CLASSES = {
  left: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-0',
};

function DayPopover({ date, dayEvents, align, isEboard, currentUserId, onDelete, onClose }) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`absolute bottom-full z-50 mb-2 w-72 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-xl dark:border-slate-700 dark:bg-slate-900 ${ALIGN_CLASSES[align]}`}
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

function LegacyEventsCalendar({ title, description }) {
  const confirm = useConfirm();
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
    if (!(await confirm('Delete this event? This cannot be undone.'))) return;
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

          <Card className="mx-auto w-full max-w-xl overflow-visible sm:max-w-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <Button type="button" variant="ghost" size="sm" onClick={() => goToMonth(-1)} aria-label="Previous month" className="h-9 w-9 p-0">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100 sm:text-lg">
                  {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <Button type="button" variant="ghost" size="sm" onClick={() => goToMonth(1)} aria-label="Next month" className="h-9 w-9 p-0">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {WEEKDAY_LABELS.map((label, i) => (
                  <div key={i} className="py-1">{label}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
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
                        className={`flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg text-base transition-colors sm:text-lg ${
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
                            className={`h-2 w-2 rounded-full ${isOpen ? 'bg-white' : 'bg-blue-600 dark:bg-blue-400'}`}
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

// ─── Revamped calendar (Member/Admin portals) ───

function AudienceBadge({ audience, accent }) {
  const isCommittee = audience.toLowerCase().includes('committee');
  return (
    <span
      className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={
        isCommittee
          ? { background: accent.muted, color: accent.light }
          : { background: 'var(--color-muted)', color: 'var(--color-muted-foreground)' }
      }
    >
      {audience}
    </span>
  );
}

function AttendanceBadge({ accent }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ background: tint(accent.base, 0.12), color: accent.light }}
      title="Attendance tracking enabled"
    >
      <CheckSquare size={9} strokeWidth={2.5} />
      Attendance
    </span>
  );
}

function EventCard({ event, accent, canDelete, onDelete, isFirst }) {
  return (
    <div
      className={cn(
        'relative flex flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-sm',
        isFirst && 'ring-1',
      )}
      style={isFirst ? { '--tw-ring-color': tint(accent.base, 0.3) } : undefined}
    >
      {isFirst && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-3 h-6 w-[3px] rounded-r-full"
          style={{ background: accent.gradient }}
        />
      )}

      <div className="flex items-start justify-between gap-2 pl-1">
        <p className="text-sm font-semibold leading-snug text-foreground">{event.title}</p>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(event.id)}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${event.title}`}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 pl-1">
        {event.audience && <AudienceBadge audience={event.audience} accent={accent} />}
        {event.requiresAttendance && <AttendanceBadge accent={accent} />}
      </div>

      <div className="flex flex-col gap-1 pl-1">
        {event.timeRange && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={11} className="shrink-0" />
            {event.timeRange}
          </p>
        )}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{event.location || 'Location TBD'}</span>
        </p>
      </div>

      {event.description && (
        <p className="pl-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{event.description}</p>
      )}

      {event.calendlyUrl && (
        <a
          href={event.calendlyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 pl-1 text-xs font-semibold transition-opacity hover:opacity-75"
          style={{ color: accent.light }}
        >
          Schedule / RSVP
          <ArrowRight size={10} />
        </a>
      )}
    </div>
  );
}

function CalendarHeader({ title, description, accent }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>
          Chapter Calendar
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function RevampedEventsCalendar({ title, description, accentKey }) {
  const accent = ACCENT_THEMES[accentKey] ?? ACCENT_THEMES.blue;
  const confirm = useConfirm();
  const { data: session } = useSession();
  const currentUserId = session?.user?.authentik_id;
  const isEboard = session?.user?.groups?.includes('eboard') ?? false;

  const [rawEvents, setRawEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    getEvents()
      .then((data) => setRawEvents(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load events');
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!(await confirm('Delete this event? This cannot be undone.'))) return;
    try {
      await deleteEvent(id);
      setRawEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete event');
    }
  }

  const todayIso = localDateKey(today);

  const prevMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) { setViewYear((y) => y - 1); return 11; }
      return m - 1;
    });
    setSelectedDate(null);
    setPanelOpen(false);
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) { setViewYear((y) => y + 1); return 0; }
      return m + 1;
    });
    setSelectedDate(null);
    setPanelOpen(false);
  }, []);

  const goToday = useCallback(() => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(null);
    setPanelOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDayClick = useCallback((iso, hasEvents) => {
    if (!hasEvents) return;
    setSelectedDate((prevDate) => {
      const closing = prevDate === iso && panelOpen;
      setPanelOpen(!closing);
      if (!closing) {
        setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
      }
      return closing ? null : iso;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen]);

  useEffect(() => {
    function handler(e) {
      if (e.key === 'Escape') { setPanelOpen(false); setSelectedDate(null); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const event of rawEvents) {
      const start = getEventStartDate(event);
      if (!start) continue;
      const key = localDateKey(new Date(start));
      const shaped = {
        id: event.id,
        title: event.title,
        description: event.description,
        timeRange: formatEventTimeRange(getEventStartDate(event), getEventEndDate(event)),
        location: event.location,
        audience: formatAudience(event.audience),
        calendlyUrl: event.calendlyUrl,
        requiresAttendance: event.requiresAttendance,
        creatorId: event.createdBy,
      };
      if (!map[key]) map[key] = [];
      map[key].push(shaped);
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => (a.timeRange > b.timeRange ? 1 : -1));
    }
    return map;
  }, [rawEvents]);

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];
  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  const canDeleteEvent = (ev) => isEboard || (!!currentUserId && ev.creatorId === currentUserId);

  const monthEventCount = useMemo(() => {
    return Object.entries(eventsByDate).reduce((sum, [key, evs]) => {
      const [y, m] = key.split('-').map(Number);
      return y === viewYear && m === viewMonth + 1 ? sum + evs.length : sum;
    }, 0);
  }, [eventsByDate, viewYear, viewMonth]);

  if (loading) {
    return (
      <div className="space-y-6">
        <CalendarHeader title={title} description={description} accent={accent} />
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading calendar…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <CalendarHeader title={title} description={description} accent={accent} />
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle size={28} className="text-destructive" />
            <p className="text-sm font-medium text-foreground">Failed to load events</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CalendarHeader title={title} description={description} accent={accent} />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-transparent hover:text-foreground"
              onMouseEnter={(e) => { e.currentTarget.style.background = tint(accent.base, 0.08); }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
              aria-label="Previous month"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-all hover:border-transparent hover:text-foreground"
              onMouseEnter={(e) => { e.currentTarget.style.background = tint(accent.base, 0.08); }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
              aria-label="Next month"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {MONTH_LABELS[viewMonth]} <span className="text-muted-foreground">{viewYear}</span>
          </h2>

          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:text-foreground"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = tint(accent.base, 0.08);
              e.currentTarget.style.borderColor = tint(accent.base, 0.3);
              e.currentTarget.style.color = accent.light;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '';
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.color = '';
            }}
          >
            Today
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-border">
          {DAY_LABELS.map((label) => (
            <div key={label} className="py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((cell, idx) => {
            const cellEvents = eventsByDate[cell.iso] ?? [];
            const hasEvents = cellEvents.length > 0;
            const isToday = cell.iso === todayIso;
            const isSelected = cell.iso === selectedDate;
            const isLastRow = idx >= 35;
            const isRightEdge = (idx + 1) % 7 === 0;

            return (
              <button
                key={cell.iso + idx}
                type="button"
                onClick={() => handleDayClick(cell.iso, hasEvents)}
                disabled={!hasEvents}
                className={cn(
                  'group relative flex flex-col items-center gap-1.5 border-border py-5 text-sm transition-all duration-150',
                  !isLastRow && 'border-b',
                  !isRightEdge && 'border-r',
                  hasEvents ? 'cursor-pointer' : 'cursor-default',
                  !cell.currentMonth && 'opacity-35',
                )}
                style={isSelected ? { background: tint(accent.base, 0.08) } : undefined}
                onMouseEnter={(e) => { if (hasEvents && !isSelected) e.currentTarget.style.background = tint(accent.base, 0.05); }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = ''; }}
                aria-label={`${cell.iso}${hasEvents ? `, ${cellEvents.length} event${cellEvents.length > 1 ? 's' : ''}` : ''}`}
                aria-pressed={isSelected}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-all',
                    isToday ? 'text-white' : isSelected ? 'font-bold' : 'text-foreground group-hover:font-semibold',
                    !cell.currentMonth && 'text-muted-foreground',
                  )}
                  style={isToday ? { background: accent.gradient } : isSelected ? { color: accent.light } : undefined}
                >
                  {cell.day}
                </span>

                {hasEvents && (
                  <div className="flex items-center gap-0.5">
                    {cellEvents.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className="h-1.5 w-1.5 rounded-full transition-all"
                        style={{ background: isSelected ? accent.light : tint(accent.base, 0.6), transform: isSelected ? 'scale(1.25)' : undefined }}
                        aria-hidden="true"
                      />
                    ))}
                    {cellEvents.length > 3 && (
                      <span className="text-[9px] font-bold leading-none" style={{ color: tint(accent.base, 0.7) }}>
                        +{cellEvents.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={panelRef}
        className={cn(
          'overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 ease-in-out',
          panelOpen ? 'opacity-100' : 'max-h-0 border-transparent opacity-0',
        )}
        aria-live="polite"
      >
        {panelOpen && selectedDate && (
          <>
            <div className="flex items-center justify-between border-b border-border px-6 py-4" style={{ background: tint(accent.base, 0.04) }}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ background: accent.gradient }} aria-hidden="true">
                  <CalendarDays size={16} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedDateLabel}</p>
                  <p className="text-xs text-muted-foreground">{selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setPanelOpen(false); setSelectedDate(null); }}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close event detail panel"
              >
                <X size={15} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
              {selectedEvents.map((ev, i) => (
                <EventCard key={ev.id} event={ev} accent={accent} canDelete={canDeleteEvent(ev)} onDelete={handleDelete} isFirst={i === 0} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 px-1">
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: accent.light }} aria-hidden="true" />
        <p className="text-xs text-muted-foreground">
          {monthEventCount} event{monthEventCount !== 1 ? 's' : ''} in {MONTH_LABELS[viewMonth]}
        </p>
      </div>
    </div>
  );
}

export default function EventsCalendar({ title, description, accent }) {
  if (accent === 'blue' || accent === 'red') {
    return <RevampedEventsCalendar title={title} description={description} accentKey={accent} />;
  }
  return <LegacyEventsCalendar title={title} description={description} />;
}
