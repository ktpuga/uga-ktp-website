'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AlertTriangle, CalendarDays, Clock, Loader2, Lock, MapPin, QrCode, Unlock, Users, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getEvents, getAttendanceCode, getAttendanceList, setAttendanceStatus, setAttendanceFinalized,
} from '@/lib/portal-api';
import {
  memberDisplayName, memberInitials, formatMemberGroup,
  getEventStartDate, getEventEndDate, formatEventTimeRange, formatEventDateShort,
} from '@/lib/portal-format';
import { profilePictureSrc } from '@/lib/avatar';
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

// Four states, not three. The roster comes back from findRosterForEvent as the
// event's whole expected audience, so most rows start with status === null —
// "nobody has accounted for this person yet", which is deliberately NOT the
// same as absent. Keyed by the literal string 'null' via statusKey() below so
// the map stays a plain lookup.
const STATUS_STYLES = {
  present: { label: 'Present', className: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300' },
  excused: { label: 'Excused', className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300' },
  absent: { label: 'Absent', className: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300' },
  unmarked: { label: 'Not marked', className: 'border-dashed border-border bg-muted/50 text-muted-foreground' },
};

// The three a person can be SET to. 'unmarked' is a starting state the API has
// no way back to — setAttendanceStatus only accepts these three.
const STATUSES = ['present', 'excused', 'absent'];

// Display order for the counts row: worst-known state last, unmarked first,
// because during a meeting "how many are still unaccounted for" is the number
// you are actually watching.
const COUNT_ORDER = ['unmarked', 'present', 'excused', 'absent'];

const statusKey = (status) => status ?? 'unmarked';

// A roster row is NOT a member row. display_name and member_group are frozen
// into event_attendance when the roster is materialised, so the live fields
// memberDisplayName()/memberInitials() read simply aren't there — and for a
// deleted account (user_id set to NULL by the FK) there is no user row to read
// at all. Shaping the frozen name as the preferred name reuses both helpers
// unchanged; username is the joined fallback for rows the backfill left
// without a frozen name.
const rosterPerson = (record) => ({
  preferred_name: record.display_name,
  username: record.username,
});

const inputClass = 'rounded-lg border border-border bg-muted/40 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]';

// Matches CHECKIN_BUFFER_MS in attendanceController — the 30-minute grace
// period after the end, so a card doesn't go grey while people file out.
const CHECKIN_BUFFER_MS = 30 * 60000;

function isLive(event) {
  const start = new Date(getEventStartDate(event)).getTime();
  const end = new Date(getEventEndDate(event)).getTime() + CHECKIN_BUFFER_MS;
  const now = Date.now();
  return now >= start && now <= end;
}

// "Not live" covers both sides of the window, and they need different wording.
// Past events stay in the rail all semester and get opened for reference, so
// telling someone check-in "isn't open yet" for a meeting that happened in
// September is actively confusing.
function hasEnded(event) {
  return Date.now() > new Date(getEventEndDate(event)).getTime() + CHECKIN_BUFFER_MS;
}

// An event that is over and never finalised is the one state where the roster
// silently keeps drifting: it re-syncs on every read, so the day a pledge is
// initiated the September meeting they attended starts listing them as an
// active member. Worth flagging wherever a past event appears.
function needsFinalizing(event) {
  return hasEnded(event) && !event.attendanceFinalizedAt;
}

function NotFinalizedPill({ className }) {
  return (
    <span className={cn(
      'flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
      className,
    )}
    >
      <AlertTriangle size={9} /> Not finalized
    </span>
  );
}

function RosterAvatar({ record, accent, size = 30 }) {
  // Keyed by asset id rather than a boolean so a photo that 404s once doesn't
  // pin the fallback forever after the member uploads a new one — and the same
  // id doubles as the cache-buster, since a fixed URL means the browser keeps
  // serving the old picture after a change.
  const [erroredAssetId, setErroredAssetId] = useState(null);
  const assetId = record.profile_picture_asset_id;
  const failed = assetId != null && erroredAssetId === assetId;

  return (
    <div className="shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }}>
      {assetId && !failed ? (
        <img
          src={profilePictureSrc(record.user_id, assetId)}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setErroredAssetId(assetId)}
        />
      ) : (
        <div
          className="flex h-full w-full select-none items-center justify-center font-semibold text-white"
          style={{ background: accent.gradient, fontSize: size * 0.37 }}
        >
          {memberInitials(rosterPerson(record))}
        </div>
      )}
    </div>
  );
}

function AttendanceRow({ record, eventId, accent, onStatusChange, busy }) {
  const style = STATUS_STYLES[statusKey(record.status)];
  const name = memberDisplayName(rosterPerson(record));
  // The account is gone; the row survives under its frozen name. There is no
  // id left to address a PUT to, so the status can be read but not changed.
  const departed = record.user_id == null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <RosterAvatar record={record} accent={accent} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {/* The backfill deliberately left member_group NULL on rows that
                predate freezing rather than stamping today's group, so say so
                instead of letting formatMemberGroup's fallback assert
                "Member". */}
            {record.member_group ? formatMemberGroup(record.member_group) : 'Group not recorded'}
            {departed && ' · account deleted'}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className={cn('hidden rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:inline', style.className)}>
          {style.label}
        </span>
        <select
          value={record.status ?? ''}
          disabled={busy || departed}
          onChange={(e) => onStatusChange(eventId, record.user_id, e.target.value)}
          aria-label={`Attendance status for ${name}`}
          className={cn(inputClass, 'disabled:opacity-40')}
        >
          {/* Present only while they're unmarked: there's no route back to it. */}
          {record.status == null && <option value="" disabled>Not marked</option>}
          {STATUSES.map((status) => (
            <option key={status} value={status}>{STATUS_STYLES[status].label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function EventRailCard({ event, accent, selected, onSelect }) {
  const live = isLive(event);
  return (
    <button
      type="button"
      onClick={() => onSelect(event)}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'w-full rounded-xl border px-3 py-2.5 text-left transition-colors duration-150',
        selected ? 'border-transparent shadow-sm' : 'border-border bg-card hover:bg-muted/50',
      )}
      style={selected ? { background: tint(accent.base, 0.1), borderColor: tint(accent.base, 0.45) } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn('text-sm font-semibold leading-snug', selected ? '' : 'text-foreground')} style={selected ? { color: accent.base } : undefined}>
          {event.title}
        </p>
        {live && (
          <span
            className="flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white"
            style={{ background: accent.gradient }}
          >
            <span className="h-1 w-1 animate-pulse rounded-full bg-white" /> Live
          </span>
        )}
        {needsFinalizing(event) && <NotFinalizedPill />}
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Clock size={10} /> {formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}
      </p>
    </button>
  );
}

// Fullscreen so the roster is genuinely hidden — this goes on a projector in a
// room full of people, and the roster next to it is chapter-wide attendance.
function QrOverlay({ event, url, accent, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Same lock ProfileModal uses. Without it the roster scrolls behind a
  // supposedly fullscreen overlay — visible on the projector this is for.
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background px-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Check-in QR code for ${event.title}`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <X size={13} /> Close
      </button>
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>Scan to check in</p>
        <h2 className="mt-1 text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>{event.title}</h2>
      </div>
      {/* Always on white: a QR on a dark background doesn't scan. */}
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <QRCodeSVG value={url} size={320} />
      </div>
      {!isLive(event) && (
        <p className="text-center text-xs text-amber-700 dark:text-amber-500">
          {hasEnded(event)
            ? 'Check-in has closed for this event. Scanning now will be refused.'
            : 'Check-in isn’t open yet. Scanning now will be refused.'}
        </p>
      )}
    </div>
  );
}

function EventRoster({ event, accent, onFinalizedChange }) {
  const [checkinUrl, setCheckinUrl] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  // Per user, not one flag for the whole roster. Taking attendance means
  // marking people in quick succession, and a single shared `busy` disabled
  // every row on the page for each round trip — so the second person you
  // reached for was always greyed out.
  const [busyIds, setBusyIds] = useState(() => new Set());
  const [error, setError] = useState('');

  // Reset per event, otherwise switching in the rail shows the previous
  // event's roster and QR while the new ones load.
  useEffect(() => {
    setRecords([]);
    setCheckinUrl(null);
    setShowQr(false);
    setLoading(true);
    setError('');
  }, [event.id]);

  useEffect(() => {
    let cancelled = false;
    getAttendanceCode(event.id)
      .then((data) => { if (!cancelled) setCheckinUrl(`${window.location.origin}/checkin/${data.eventId}/${data.token}`); })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        if (!cancelled) setError(err.message ?? 'Could not load the check-in code');
      });
    return () => { cancelled = true; };
  }, [event.id]);

  const loadList = useCallback(async () => {
    try {
      // { finalizedAt, records } — an object, not the bare array this used to
      // get. An Array.isArray() check on the wrapper is false, which silently
      // rendered an empty roster.
      const data = await getAttendanceList(event.id);
      setRecords(Array.isArray(data?.records) ? data.records : []);
      // Reported upward rather than kept here, so the rail's "Not finalized"
      // pill and this pane read the same value — the list of events is fetched
      // once at mount and would otherwise go stale the moment you finalize.
      onFinalizedChange(event.id, data?.finalizedAt ?? null);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not load attendance');
    } finally {
      setLoading(false);
    }
  }, [event.id, onFinalizedChange]);

  useEffect(() => {
    loadList();
    // Polling, not a websocket — good enough for "live-ish" during a meeting
    // without adding real-time infrastructure for something this low-traffic.
    const interval = setInterval(loadList, 5000);
    return () => clearInterval(interval);
  }, [loadList]);

  async function handleStatusChange(eventId, userId, status) {
    setBusyIds((prev) => new Set(prev).add(userId));
    // Optimistic: the 5s poll would otherwise snap the select back to its old
    // value for up to a beat after the click.
    setRecords((prev) => prev.map((r) => (r.user_id === userId ? { ...r, status } : r)));
    try {
      await setAttendanceStatus(eventId, userId, status);
      await loadList();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to update status');
      await loadList();
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  }

  async function handleFinalize(next) {
    setFinalizing(true);
    setError('');
    try {
      const data = await setAttendanceFinalized(event.id, next);
      onFinalizedChange(event.id, data?.finalizedAt ?? null);
      // The server syncs the roster one last time before freezing it, so
      // finalizing can add people — re-read rather than trusting what's on
      // screen.
      await loadList();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not change the finalized state');
    } finally {
      setFinalizing(false);
    }
  }

  const counts = useMemo(() => records.reduce(
    (acc, r) => ({ ...acc, [statusKey(r.status)]: (acc[statusKey(r.status)] ?? 0) + 1 }),
    {},
  ), [records]);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-foreground">{event.title}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Clock size={11} /> {formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}</span>
              {event.location && <span className="flex items-center gap-1.5"><MapPin size={11} /> {event.location}</span>}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => handleFinalize(!event.attendanceFinalizedAt)}
              disabled={finalizing}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              {finalizing
                ? <Loader2 size={13} className="animate-spin" />
                : (event.attendanceFinalizedAt ? <Unlock size={13} /> : <Lock size={13} />)}
              {event.attendanceFinalizedAt ? 'Reopen roster' : 'Finalize roster'}
            </button>
            <button
              type="button"
              onClick={() => setShowQr(true)}
              disabled={!checkinUrl}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white shadow-sm transition-opacity disabled:opacity-40"
              style={{ background: accent.gradient }}
            >
              <QrCode size={13} /> {checkinUrl ? 'Show QR code' : 'Loading code…'}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Users size={12} /> {records.length} expected
          </span>
          {COUNT_ORDER.filter((s) => counts[s]).map((status) => (
            <span key={status} className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', STATUS_STYLES[status].className)}>
              {counts[status]} {STATUS_STYLES[status].label.toLowerCase()}
            </span>
          ))}
          <span className="text-[10px] text-muted-foreground">· refreshes every few seconds</span>
        </div>

        {/* Which of the two states this roster is in, in words — the pill in
            the rail only says something is wrong, not what finalizing does. */}
        {event.attendanceFinalizedAt ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock size={11} className="shrink-0" />
            Roster finalized {formatEventDateShort(event.attendanceFinalizedAt)}. It is frozen, and
            nobody new is added. Marks can still be changed.
          </p>
        ) : needsFinalizing(event) && (
          <p className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-500">
            <AlertTriangle size={11} className="mt-0.5 shrink-0" />
            This event is over and its roster isn&apos;t finalized, so it still changes as people
            move between groups. Finalize it to keep this record as it stands.
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 border-b border-border bg-destructive/10 px-5 py-3 text-sm text-destructive">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading roster…
        </div>
      ) : records.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 px-6 text-center">
          <Users size={20} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nobody is on this event&apos;s roster.</p>
          <p className="text-xs text-muted-foreground/80">
            The roster is the event&apos;s audience. Check who it&apos;s targeted at on the event itself.
          </p>
        </div>
      ) : (
        <div className="max-h-[calc(100vh-20rem)] min-h-[18rem] overflow-y-auto portal-scroll">
          {records.map((record, i) => (
            <AttendanceRow
              // user_id is NULL for every deleted account, so two of them would
              // share a key. The list is server-ordered and read-only for those
              // rows, so the index is a safe tiebreaker.
              key={record.user_id ?? `deleted-${i}`}
              record={record}
              eventId={event.id}
              accent={accent}
              busy={busyIds.has(record.user_id)}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {showQr && checkinUrl && (
        <QrOverlay event={event} url={checkinUrl} accent={accent} onClose={() => setShowQr(false)} />
      )}
    </section>
  );
}

export default function AttendancePage() {
  const accent = useAccentPalette();
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState(null);

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load events');
      })
      .finally(() => setLoading(false));
  }, []);

  // The roster pane reads the authoritative finalized state on every poll;
  // this folds it back into the one events array the rail renders from.
  // Returning `prev` untouched when nothing changed matters — otherwise the
  // 5-second poll would hand back a new array forever and re-bucket the rail
  // on every tick.
  const handleFinalizedChange = useCallback((eventId, finalizedAt) => {
    setEvents((prev) => {
      const i = prev.findIndex((e) => e.id === eventId);
      if (i === -1 || (prev[i].attendanceFinalizedAt ?? null) === finalizedAt) return prev;
      const next = [...prev];
      next[i] = { ...next[i], attendanceFinalizedAt: finalizedAt };
      return next;
    });
  }, []);

  const groups = session?.user?.groups ?? [];
  const canManageAll = groups.some((g) => MAY_MANAGE_ATTENDANCE.includes(g));
  const myId = session?.user?.authentik_id;

  // Live events first — during a meeting that's the one you're reaching for —
  // then upcoming, then past.
  const { live, upcoming, past, ordered } = useMemo(() => {
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
    return { ...buckets, ordered: [...buckets.live, ...buckets.upcoming, ...buckets.past] };
  }, [events, canManageAll, myId]);

  // Live events sit under Upcoming, not their own tab: a meeting that started
  // ten minutes ago is the one you're taking attendance at, so it has to be on
  // the tab you land on. It keeps its own section heading and Live pill.
  const { tabs, activeTab, visible } = useMemo(() => {
    const all = [
      {
        key: 'upcoming',
        label: 'Upcoming',
        count: live.length + upcoming.length,
        sections: [
          { title: 'Happening now', items: live },
          { title: 'Upcoming', items: upcoming },
        ],
      },
      {
        key: 'past',
        label: 'Past',
        count: past.length,
        // Surfaced on the tab itself, because a past event that was never
        // finalized is a roster still quietly rewriting itself, and nobody
        // opens the Past tab looking for it.
        flagged: past.filter(needsFinalizing).length,
        sections: [{ title: 'Past', items: past }],
      },
    ];
    // Defaulted rather than stored: a chapter with nothing upcoming should open
    // on Past instead of an empty pane, without a state write to get there.
    const key = tab ?? (live.length + upcoming.length > 0 ? 'upcoming' : 'past');
    const active = all.find((t) => t.key === key) ?? all[0];
    return {
      tabs: all,
      activeTab: active,
      visible: active.sections.flatMap((s) => s.items),
    };
  }, [live, upcoming, past, tab]);

  // Keep the pane on something that's actually in the visible tab — this both
  // does the initial pick and follows a tab switch. It only fires when the
  // selection falls out of view, so a poll refresh never yanks the pane away
  // from a deliberate choice.
  useEffect(() => {
    if (visible.length === 0) {
      setSelectedId(null);
    } else if (!visible.some((e) => e.id === selectedId)) {
      setSelectedId(visible[0].id);
    }
  }, [visible, selectedId]);

  const selected = visible.find((e) => e.id === selectedId) ?? null;
  const sections = activeTab.sections.filter((s) => s.items.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>Chapter</p>
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>Attendance</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Pick an event to see everyone it&apos;s for, mark them off, and show the QR code. Turn
          attendance on from an event&apos;s create or edit form.
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
      ) : ordered.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
          <CalendarDays size={22} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nothing to take attendance for.</p>
          <p className="max-w-sm text-xs text-muted-foreground/80">
            Tick &ldquo;requires attendance&rdquo; when you create or edit an event and it shows up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[17rem_1fr]">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
              {tabs.map((t) => {
                const isActive = t.key === activeTab.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-pressed={isActive}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                      isActive ? '' : 'text-muted-foreground hover:text-foreground',
                    )}
                    style={isActive ? { background: tint(accent.base, 0.12), color: accent.base } : undefined}
                  >
                    {t.label}
                    <span className={cn('text-[10px]', isActive ? 'opacity-70' : 'text-muted-foreground')}>
                      {t.count}
                    </span>
                    {t.flagged > 0 && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-amber-500"
                        title={`${t.flagged} past event${t.flagged === 1 ? '' : 's'} not finalized`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Nothing in this tab: the roster pane beside it says so, so the
                rail stays quiet rather than repeating it. */}
            {sections.length === 0 ? null : (
              <>
                {/* Mobile: the rail collapses to a dropdown above the roster
                    rather than stacking a full-height event list on top of it. */}
                <div className="mt-3 lg:hidden">
                  <label htmlFor="attendance-event" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Event
                  </label>
                  <select
                    id="attendance-event"
                    value={selectedId ?? ''}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]"
                  >
                    {sections.map((section) => (
                      <optgroup key={section.title} label={section.title}>
                        {section.items.map((event) => (
                          <option key={event.id} value={event.id}>
                            {needsFinalizing(event) ? `⚠ ${event.title}` : event.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <aside className="mt-3 hidden max-h-[calc(100vh-14rem)] space-y-5 overflow-y-auto portal-scroll pr-1 lg:block">
                  {sections.map((section) => (
                    <div key={section.title} className="space-y-2">
                      <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.title}
                      </p>
                      {section.items.map((event) => (
                        <EventRailCard
                          key={event.id}
                          event={event}
                          accent={accent}
                          selected={event.id === selectedId}
                          onSelect={(e) => setSelectedId(e.id)}
                        />
                      ))}
                    </div>
                  ))}
                </aside>
              </>
            )}
          </div>

          {selected ? (
            <EventRoster
              key={selected.id}
              event={selected}
              accent={accent}
              onFinalizedChange={handleFinalizedChange}
            />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card text-center">
              <CalendarDays size={20} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {activeTab.key === 'past'
                  ? 'No past events with attendance yet.'
                  : 'Nothing coming up with attendance turned on.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
