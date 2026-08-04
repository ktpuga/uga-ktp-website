'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, CalendarCheck, CalendarClock, Check, Loader2, MapPin, User, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAvailableInterviews, bookInterviewSlot, cancelInterviewBooking } from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import { useConfirm } from '@/components/ui/confirm-dialog';

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const dayLabel = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const timeLabel = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

function formatRange(startsAt, endsAt) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime())) return '';
  if (Number.isNaN(end.getTime())) return `${dayLabel(start)}, ${timeLabel(start)}`;
  return `${dayLabel(start)}, ${timeLabel(start)} – ${timeLabel(end)}`;
}

// Slots arrive sorted, so this only watches for the key changing.
function groupByDay(slots) {
  const days = [];
  for (const slot of slots) {
    const start = new Date(slot.startDate);
    if (Number.isNaN(start.getTime())) continue;
    const key = start.toDateString();
    if (days[days.length - 1]?.key !== key) days.push({ key, label: dayLabel(start), slots: [] });
    days[days.length - 1].slots.push(slot);
  }
  return days;
}

// Capacity 1 reads better without arithmetic — "0 of 1 left" is a worse way to
// say "taken".
function seatsLabel(slot) {
  const left = Math.max(0, slot.capacity - slot.booked_count);
  if (slot.capacity === 1) return left === 0 ? 'Taken' : 'Open';
  if (left === 0) return 'Full';
  return `${left} of ${slot.capacity} left`;
}

function SlotButton({ slot, accent, disabled, onPick, busy }) {
  const left = Math.max(0, slot.capacity - slot.booked_count);
  const isFull = left === 0;
  // Full slots stay on the sheet, greyed out — hiding them would make it look
  // like fewer times were ever offered.
  const unavailable = isFull || disabled;

  return (
    <button
      type="button"
      disabled={unavailable || busy}
      onClick={() => onPick(slot)}
      aria-label={`Book ${timeLabel(new Date(slot.startDate))} — ${seatsLabel(slot)}`}
      className={cn(
        'flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-150',
        unavailable
          ? 'cursor-not-allowed border-border bg-muted/40 opacity-55'
          : 'border-border bg-card hover:-translate-y-0.5 hover:shadow-sm',
      )}
      style={unavailable ? undefined : { borderColor: tint(accent.base, 0.35) }}
    >
      <span className={cn('text-sm font-semibold', isFull ? 'text-muted-foreground line-through' : 'text-foreground')}>
        {timeLabel(new Date(slot.startDate))}
      </span>
      <span className="text-[10px] text-muted-foreground">{seatsLabel(slot)}</span>
      {slot.interviewer_name && (
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <User size={9} /> {slot.interviewer_name}
        </span>
      )}
    </button>
  );
}

// Replaces the grid rather than sitting above it — once you have a time, the
// only thing left to decide is whether to keep it.
function BookedCard({ schedule, slot, accent, onCancel, busy }) {
  return (
    <div className="overflow-hidden rounded-2xl border" style={{ borderColor: tint(accent.base, 0.4), background: tint(accent.base, 0.04) }}>
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5">
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent.base }}>
            <CalendarCheck size={12} /> Your interview
          </p>
          <p className="text-lg font-bold text-foreground">{formatRange(slot.startDate, slot.endDate)}</p>
          {(slot.location || schedule.location) && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={11} /> {slot.location ?? schedule.location}
            </p>
          )}
          {slot.interviewer_name && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <User size={11} /> with {slot.interviewer_name}
            </p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            This is on your calendar. Please be there a few minutes early.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
        >
          {busy ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />} Change my time
        </button>
      </div>
    </div>
  );
}

export default function InterviewSignup() {
  const accent = useAccentPalette();
  const confirm = useConfirm();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      setSchedules(await getAvailableInterviews());
      if (!quiet) setError('');
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not load interview times.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Every outcome refetches: a 409 means this page is already stale, so
  // patching locally would keep claiming a seat the server says is gone.
  async function pick(slot) {
    // useConfirm defaults to a red "Delete" — booking is not destructive.
    const ok = await confirm(
      `Book your interview for ${formatRange(slot.startDate, slot.endDate)}?`
      + '\n\nYou can only hold one time, but you can change it later if you need to.',
      { title: 'Confirm your interview', confirmLabel: 'Confirm', variant: 'default' },
    );
    if (!ok) return;

    setBusy(true);
    setError('');
    setNotice('');
    try {
      await bookInterviewSlot(slot.id);
      setNotice(`You're booked for ${formatRange(slot.startDate, slot.endDate)}.`);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not book that time.');
    } finally {
      await load({ quiet: true });
      setBusy(false);
    }
  }

  async function release(slot) {
    // Stays red: you can lose the time to someone else before re-picking.
    const ok = await confirm(
      `Give up your ${formatRange(slot.startDate, slot.endDate)} interview?`
      + '\n\nThe time goes back on the board and someone else may take it. You will need to pick a new one.',
      { title: 'Change your interview time?', confirmLabel: 'Release my time' },
    );
    if (!ok) return;

    setBusy(true);
    setError('');
    setNotice('');
    try {
      // No `?? slot.id` fallback: different tables, both starting at 1, so it
      // would cancel whoever else's booking happened to have that id.
      if (!slot.booking_id) throw new Error('Could not work out which booking to cancel. Refresh and try again.');
      await cancelInterviewBooking(slot.booking_id);
      setNotice('Your time was released. Pick a new one below.');
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not cancel that booking.');
    } finally {
      await load({ quiet: true });
      setBusy(false);
    }
  }

  const hasAnything = schedules.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>Rush</p>
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>Interviews</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Pick a time that works for you. Once you take a slot it comes off the board for
          everyone else, so grab one early. You can change it later if something comes up.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}
      {notice && !error && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <Check size={14} className="mt-0.5 shrink-0" /> {notice}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : !hasAnything ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
          <CalendarClock size={22} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Interview signups aren&apos;t open yet.</p>
          <p className="max-w-sm text-xs text-muted-foreground/80">
            You&apos;ll get a notification here as soon as times go up. Keep an eye on announcements too.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {schedules.map((schedule) => (
            <ScheduleBoard
              key={schedule.id}
              schedule={schedule}
              accent={accent}
              busy={busy}
              onPick={pick}
              onRelease={release}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleBoard({ schedule, accent, busy, onPick, onRelease }) {
  const days = useMemo(() => groupByDay(schedule.slots ?? []), [schedule.slots]);
  const booked = schedule.my_booking;

  const openSeats = (schedule.slots ?? [])
    .reduce((sum, slot) => sum + Math.max(0, slot.capacity - slot.booked_count), 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{schedule.title}</p>
          {!booked && (
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {openSeats === 0 ? 'No times left' : `${openSeats} ${openSeats === 1 ? 'time' : 'times'} open`}
            </span>
          )}
        </div>
        {schedule.description && (
          <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{schedule.description}</p>
        )}
        {schedule.location && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={11} /> {schedule.location}
          </p>
        )}
      </div>

      <div className="p-5">
        {booked ? (
          <BookedCard
            schedule={schedule}
            slot={booked}
            accent={accent}
            busy={busy}
            onCancel={() => onRelease(booked)}
          />
        ) : days.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No times have been posted for this round yet.
          </p>
        ) : (
          <div className="space-y-5">
            {days.map((day) => (
              <div key={day.key}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day.label}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {day.slots.map((slot) => (
                    <SlotButton
                      key={slot.id}
                      slot={slot}
                      accent={accent}
                      busy={busy}
                      onPick={onPick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
