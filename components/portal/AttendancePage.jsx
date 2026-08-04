'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle, ArrowLeft, CalendarDays, Clock, Loader2, QrCode, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEvents, getAttendanceCode, getAttendanceList, setAttendanceStatus } from '@/lib/portal-api';
import { memberDisplayName, memberInitials, getEventStartDate, getEventEndDate, formatEventTimeRange } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';

// Mirrors MAY_MANAGE_ATTENDANCE in ktp-api's attendanceController. The server
// enforces it regardless; this just avoids listing events that would 403.
const MAY_MANAGE_ATTENDANCE = ['eboard', 'chair'];

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const STATUS_STYLES = {
  present: { label: 'Present', className: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300' },
  excused: { label: 'Excused', className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300' },
  absent: { label: 'Absent', className: 'border-border bg-muted text-muted-foreground' },
};

const STATUSES = ['present', 'excused', 'absent'];

const inputClass = 'rounded-lg border border-border bg-muted/40 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]';

function isLive(event) {
  const start = new Date(getEventStartDate(event)).getTime();
  // Matches CHECKIN_BUFFER_MS in attendanceController — the 30-minute grace
  // period after the end, so a card doesn't go grey while people file out.
  const end = new Date(getEventEndDate(event)).getTime() + 30 * 60000;
  const now = Date.now();
  return now >= start && now <= end;
}

function AttendanceRow({ record, eventId, accent, onStatusChange, busy }) {
  const person = {
    firstName: record.first_name,
    lastName: record.last_name,
    preferredName: record.preferred_name,
    username: record.username,
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
          style={{ background: accent.gradient }}
        >
          {memberInitials(person)}
        </span>
        <span className="truncate text-sm font-medium text-foreground">{memberDisplayName(person)}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', STATUS_STYLES[record.status]?.className ?? STATUS_STYLES.present.className)}>
          {STATUS_STYLES[record.status]?.label ?? record.status}
        </span>
        <select
          value={record.status}
          disabled={busy}
          onChange={(e) => onStatusChange(eventId, record.user_id, e.target.value)}
          aria-label={`Attendance status for ${memberDisplayName(person)}`}
          className={cn(inputClass, 'disabled:opacity-40')}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>{STATUS_STYLES[status].label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function EventAttendanceView({ event, accent, onBack }) {
  const [checkinUrl, setCheckinUrl] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAttendanceCode(event.id)
      .then((data) => setCheckinUrl(`${window.location.origin}/checkin/${data.eventId}/${data.token}`))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load the check-in code');
      });
  }, [event.id]);

  const loadList = useCallback(async () => {
    try {
      const data = await getAttendanceList(event.id);
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not load attendance');
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    loadList();
    // Polling, not a websocket — good enough for "live-ish" during a meeting
    // without adding real-time infrastructure for something this low-traffic.
    const interval = setInterval(loadList, 5000);
    return () => clearInterval(interval);
  }, [loadList]);

  async function handleStatusChange(eventId, userId, status) {
    setBusy(true);
    try {
      await setAttendanceStatus(eventId, userId, status);
      await loadList();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to update status');
    } finally {
      setBusy(false);
    }
  }

  const counts = useMemo(() => records.reduce(
    (acc, r) => ({ ...acc, [r.status]: (acc[r.status] ?? 0) + 1 }),
    {},
  ), [records]);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={13} /> All events
      </button>

      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>Attendance</p>
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>{event.title}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock size={12} /> {formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <QrCode size={14} /> Check-in code
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Put this on a screen for members to scan. It only works while the event is happening.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 p-6">
            {checkinUrl ? (
              <>
                {/* Always on white: a QR on a dark background doesn't scan. */}
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <QRCodeSVG value={checkinUrl} size={220} />
                </div>
                {!isLive(event) && (
                  <p className="text-center text-[11px] text-amber-700 dark:text-amber-500">
                    Check-in isn&apos;t open yet — scanning now will be refused.
                  </p>
                )}
              </>
            ) : (
              <div className="flex h-[260px] items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={15} className="animate-spin" /> Loading code…
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Users size={14} /> Checked in
              </p>
              <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {records.length} total
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {STATUSES.filter((s) => counts[s]).map((status) => (
                <span key={status} className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', STATUS_STYLES[status].className)}>
                  {counts[status]} {STATUS_STYLES[status].label.toLowerCase()}
                </span>
              ))}
              <span className="text-[10px] text-muted-foreground">· refreshes every few seconds</span>
            </div>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={15} className="animate-spin" /> Loading…
            </div>
          ) : records.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 px-6 text-center">
              <Users size={20} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No one has checked in yet.</p>
              <p className="text-xs text-muted-foreground/80">Names appear here as people scan the code.</p>
            </div>
          ) : (
            <div className="max-h-[420px] overflow-y-auto portal-scroll">
              {records.map((record) => (
                <AttendanceRow
                  key={record.user_id}
                  record={record}
                  eventId={event.id}
                  accent={accent}
                  busy={busy}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  const accent = useAccentPalette();
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load events');
      })
      .finally(() => setLoading(false));
  }, []);

  const groups = session?.user?.groups ?? [];
  const canManageAll = groups.some((g) => MAY_MANAGE_ATTENDANCE.includes(g));
  const myId = session?.user?.authentik_id;

  // Live events first — during a meeting that's the one you're reaching for —
  // then upcoming, then past.
  const { live, upcoming, past } = useMemo(() => {
    const manageable = events.filter((event) => event.requiresAttendance
      && (canManageAll || event.createdBy === myId));
    const now = Date.now();
    const buckets = { live: [], upcoming: [], past: [] };
    for (const event of manageable) {
      if (isLive(event)) buckets.live.push(event);
      else if (new Date(getEventStartDate(event)).getTime() > now) buckets.upcoming.push(event);
      else buckets.past.push(event);
    }
    const byStart = (a, b) => new Date(getEventStartDate(a)) - new Date(getEventStartDate(b));
    buckets.live.sort(byStart);
    buckets.upcoming.sort(byStart);
    buckets.past.sort((a, b) => byStart(b, a));
    return buckets;
  }, [events, canManageAll, myId]);

  if (selected) {
    return <EventAttendanceView event={selected} accent={accent} onBack={() => setSelected(null)} />;
  }

  const total = live.length + upcoming.length + past.length;

  function EventCard({ event, isLiveNow }) {
    return (
      <button
        type="button"
        onClick={() => setSelected(event)}
        className="flex flex-col items-start gap-1.5 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
        style={isLiveNow ? { borderColor: tint(accent.base, 0.45) } : undefined}
      >
        <div className="flex w-full items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug text-foreground">{event.title}</p>
          {isLiveNow && (
            <span
              className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ background: accent.gradient }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
            </span>
          )}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock size={11} /> {formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}
        </p>
        {event.location && (
          <p className="truncate text-[11px] text-muted-foreground">{event.location}</p>
        )}
      </button>
    );
  }

  function Section({ title, items }) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((event) => (
            <EventCard key={event.id} event={event} isLiveNow={title === 'Happening now'} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>Chapter</p>
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>Attendance</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Pick an event to show its QR code and watch people check in. Turn attendance on from an
          event&apos;s create or edit form.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading events…
        </div>
      ) : total === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
          <CalendarDays size={22} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing to take attendance for.</p>
          <p className="max-w-sm text-xs text-muted-foreground/80">
            Tick &ldquo;requires attendance&rdquo; when you create or edit an event and it shows up here.
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          <Section title="Happening now" items={live} />
          <Section title="Upcoming" items={upcoming} />
          <Section title="Past" items={past} />
        </div>
      )}
    </div>
  );
}
