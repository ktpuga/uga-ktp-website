'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, CalendarClock, Check, ChevronRight, Clock, Eye, EyeOff,
  Loader2, MapPin, Plus, Trash2, User, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getInterviewSchedules, getInterviewSchedule, createInterviewSchedule, updateInterviewSchedule,
  deleteInterviewSchedule, createInterviewSlot, deleteInterviewSlot, cancelInterviewBooking,
  getMessageableMembers,
} from '@/lib/portal-api';
import { memberDisplayName, memberInitials } from '@/lib/portal-format';
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

// datetime-local speaks local wall-clock with no zone; the API stores
// timestamptz. Both directions are converted explicitly so a slot entered as
// 5:00 PM is 5:00 PM in Athens rather than in UTC.
function toLocalInput(date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 16);
}

function nextHalfHour() {
  const start = new Date();
  start.setMinutes(start.getMinutes() + 30 - (start.getMinutes() % 30), 0, 0);
  return start;
}

const inputClass = 'w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]';
const labelClass = 'mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground';

export default function InterviewScheduleManager() {
  const accent = useAccentPalette();
  const confirm = useConfirm();

  const [schedules, setSchedules] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setSchedules(await getInterviewSchedules());
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not load interview schedules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create({ title, description, location }) {
    setError('');
    try {
      const schedule = await createInterviewSchedule({ title, description, location });
      setSchedules((prev) => [schedule, ...prev]);
      // Straight into the new schedule — it has no slots yet, and adding them
      // is the entire reason anyone creates one.
      setOpenId(schedule.id);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not create that schedule.');
    }
  }

  async function remove(schedule) {
    if (!(await confirm(
      `Delete "${schedule.title}"? Every slot in it goes too.`,
      { title: 'Delete this interview round?' },
    ))) return;
    setError('');
    try {
      await deleteInterviewSchedule(schedule.id);
      setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      // The API refuses with 409 once anyone has booked, and says how many.
      // Re-asking with that number in the question is the point: "delete this
      // schedule" and "cancel 23 people's interviews" deserve different
      // answers, and only the server knows which one this is.
      const forced = await confirm(
        `${err.message}\n\nDelete it anyway? Their interviews will be cancelled and they will not be told.`,
        { title: 'People have already booked', confirmLabel: 'Delete anyway' },
      );
      if (!forced) return;
      try {
        await deleteInterviewSchedule(schedule.id, { force: true });
        setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
      } catch (forceErr) {
        if (isRedirectError(forceErr)) throw forceErr;
        setError(forceErr.message ?? 'Could not delete that schedule.');
      }
    }
  }

  if (openId) {
    return (
      <ScheduleDetail
        scheduleId={openId}
        accent={accent}
        onBack={() => { setOpenId(null); load(); }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>Rush</p>
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>Interviews</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Post the times you&apos;re running interviews and let rushees claim them. A claimed slot
          comes off the board for everyone else. Nothing is visible to rushees until you publish it.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <NewScheduleForm accent={accent} onCreate={create} />

      {loading ? (
        <div className="mt-6 flex h-32 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : schedules.length === 0 ? (
        <div className="mt-6 flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
          <CalendarClock size={22} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No interview rounds yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {schedules.map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              schedule={schedule}
              accent={accent}
              onOpen={() => setOpenId(schedule.id)}
              onDelete={() => remove(schedule)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleRow({ schedule, accent, onOpen, onDelete }) {
  const filled = schedule.booked_count ?? 0;
  const total = schedule.capacity_total ?? 0;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{schedule.title}</p>
          <span className={cn(
            'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
            schedule.published
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
              : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
          )}>
            {schedule.published ? 'Published' : 'Draft'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {schedule.slot_count ?? 0} {schedule.slot_count === 1 ? 'slot' : 'slots'}
          {total > 0 && ` · ${filled} of ${total} seats taken`}
        </p>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-lg border border-destructive/30 bg-destructive/10 p-2 text-destructive hover:bg-destructive/20"
        aria-label={`Delete ${schedule.title}`}
      >
        <Trash2 size={13} />
      </button>
      <button type="button" onClick={onOpen} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label={`Open ${schedule.title}`}>
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

function NewScheduleForm({ accent, onCreate }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim()) return;
    setSaving(true);
    await onCreate({ title: title.trim(), description, location });
    setSaving(false);
    setTitle(''); setDescription(''); setLocation(''); setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-85"
        style={{ background: accent.gradient }}
      >
        <Plus size={14} /> New interview round
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div>
        <label htmlFor="sched-title" className={labelClass}>Name</label>
        <input id="sched-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Fall 2026 Final Interviews" className={inputClass} autoFocus />
      </div>
      <div>
        <label htmlFor="sched-loc" className={labelClass}>Where (optional)</label>
        <input id="sched-loc" type="text" value={location} onChange={(e) => setLocation(e.target.value)}
          placeholder="Boyd 204 — individual slots can override this" className={inputClass} />
      </div>
      <div>
        <label htmlFor="sched-desc" className={labelClass}>Notes for rushees (optional)</label>
        <textarea id="sched-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Dress business casual, bring a resume…" className={cn(inputClass, 'resize-none')} />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} disabled={saving}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40">
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={saving || !title.trim()}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: accent.gradient }}>
          {saving && <Loader2 size={13} className="animate-spin" />} Create
        </button>
      </div>
    </div>
  );
}

function ScheduleDetail({ scheduleId, accent, onBack }) {
  const confirm = useConfirm();
  const [schedule, setSchedule] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setSchedule(await getInterviewSchedule(scheduleId));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not load that schedule.');
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    load();
    // The full directory for eboard — getMessageableMembers returns /members
    // for anyone who isn't a rush-only account. Named for messaging, but it is
    // the directory fetch every portal surface uses, and assigning an
    // interviewer needs exactly that list.
    getMessageableMembers()
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((err) => { if (isRedirectError(err)) throw err; });
  }, [load]);

  async function togglePublished() {
    setBusy(true);
    setError('');
    try {
      const updated = await updateInterviewSchedule(scheduleId, { published: !schedule.published });
      setSchedule((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not change that.');
    } finally {
      setBusy(false);
    }
  }

  async function addSlot(payload) {
    setError('');
    try {
      await createInterviewSlot(scheduleId, payload);
      await load();
      return true;
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not add that slot.');
      return false;
    }
  }

  async function removeSlot(slot) {
    const when = `${dayLabel(new Date(slot.startDate))}, ${timeLabel(new Date(slot.startDate))}`;
    if (!(await confirm(`Delete the ${when} slot?`, { title: 'Delete this slot?' }))) return;
    setBusy(true);
    setError('');
    try {
      await deleteInterviewSlot(slot.id);
      await load();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      // 409 when someone has booked it. Same escalation as deleting a
      // schedule: the second question is a different question.
      const forced = await confirm(
        `${err.message}\n\nDelete it anyway? They'll be told their slot was cancelled and asked to pick another.`,
        { title: 'Someone has booked this slot', confirmLabel: 'Delete anyway' },
      );
      if (forced) {
        try {
          await deleteInterviewSlot(slot.id, { force: true });
          await load();
        } catch (forceErr) {
          if (isRedirectError(forceErr)) throw forceErr;
          setError(forceErr.message ?? 'Could not delete that slot.');
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function releaseBooking(booking, slot) {
    const who = memberDisplayName(booking);
    // Not a deletion — the slot survives, the seat just goes back on the board.
    if (!(await confirm(
      `Release ${who}'s ${timeLabel(new Date(slot.startDate))} slot? They'll be notified and can book another time.`,
      { title: 'Release this booking?', confirmLabel: 'Release' },
    ))) return;
    setBusy(true);
    setError('');
    try {
      await cancelInterviewBooking(booking.booking_id);
      await load();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not release that booking.');
    } finally {
      setBusy(false);
    }
  }

  const days = useMemo(() => {
    const grouped = [];
    for (const slot of schedule?.slots ?? []) {
      const start = new Date(slot.startDate);
      if (Number.isNaN(start.getTime())) continue;
      const key = start.toDateString();
      if (grouped[grouped.length - 1]?.key !== key) grouped.push({ key, label: dayLabel(start), slots: [] });
      grouped[grouped.length - 1].slots.push(slot);
    }
    return grouped;
  }, [schedule]);

  const lastSlot = schedule?.slots?.[schedule.slots.length - 1] ?? null;
  const totals = (schedule?.slots ?? []).reduce(
    (acc, slot) => ({ seats: acc.seats + slot.capacity, taken: acc.taken + slot.booked_count }),
    { seats: 0, taken: 0 },
  );

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <button type="button" onClick={onBack} className="mb-5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={13} /> All interview rounds
      </button>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : !schedule ? null : (
        <>
          <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5" style={{ background: tint(accent.base, 0.03) }}>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">{schedule.title}</h1>
                {schedule.location && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin size={11} /> {schedule.location}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {schedule.slots.length} {schedule.slots.length === 1 ? 'slot' : 'slots'}
                  {totals.seats > 0 && ` · ${totals.taken} of ${totals.seats} seats taken`}
                </p>
              </div>
              <button
                type="button"
                onClick={togglePublished}
                disabled={busy || (!schedule.published && schedule.slots.length === 0)}
                title={!schedule.published && schedule.slots.length === 0 ? 'Add at least one slot first' : undefined}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40',
                  schedule.published ? 'border border-border text-muted-foreground hover:bg-muted' : 'text-white',
                )}
                style={schedule.published ? undefined : { background: accent.gradient }}
              >
                {schedule.published ? <><EyeOff size={13} /> Unpublish</> : <><Eye size={13} /> Publish to rushees</>}
              </button>
            </div>
            <p className="border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
              {schedule.published
                ? 'Rushees can see these times and book them right now. Unpublishing stops new signups — it does not cancel anyone who already booked.'
                : 'This is a draft. Nothing here is visible to rushees until you publish it, so take your time adding slots.'}
            </p>
          </div>

          <AddSlotForm
            accent={accent}
            members={members}
            defaultLocation={schedule.location}
            lastSlot={lastSlot}
            onAdd={addSlot}
          />

          {days.length === 0 ? (
            <div className="mt-6 flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
              <Clock size={22} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No slots yet.</p>
              <p className="max-w-sm text-xs text-muted-foreground/80">
                Add your first time above. After that each new slot starts where the last one ended,
                so you can click through a whole evening.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {days.map((day) => (
                <div key={day.key}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day.label}</p>
                  <div className="space-y-2">
                    {day.slots.map((slot) => (
                      <SlotRow
                        key={slot.id}
                        slot={slot}
                        accent={accent}
                        busy={busy}
                        onDelete={() => removeSlot(slot)}
                        onRelease={(booking) => releaseBooking(booking, slot)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SlotRow({ slot, accent, busy, onDelete, onRelease }) {
  const left = Math.max(0, slot.capacity - slot.booked_count);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {timeLabel(new Date(slot.startDate))} – {timeLabel(new Date(slot.endDate))}
          </p>
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>{slot.booked_count} of {slot.capacity} booked{left > 0 ? ` · ${left} open` : ' · full'}</span>
            {slot.location && <span className="flex items-center gap-1"><MapPin size={9} /> {slot.location}</span>}
            {slot.interviewer_name && <span className="flex items-center gap-1"><User size={9} /> {slot.interviewer_name}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 disabled:opacity-40"
          aria-label={`Delete the ${timeLabel(new Date(slot.startDate))} slot`}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {slot.bookings.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border pt-2.5">
          {slot.bookings.map((booking) => (
            <span key={booking.booking_id} className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1 pl-1 pr-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold text-white" style={{ background: accent.gradient }}>
                {memberInitials(booking)}
              </span>
              <span className="text-[11px] font-medium text-foreground">{memberDisplayName(booking)}</span>
              <button
                type="button"
                onClick={() => onRelease(booking)}
                disabled={busy}
                className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                aria-label={`Release ${memberDisplayName(booking)}'s booking`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Slots are added one at a time, which is a lot of typing for an interview
// night. The mitigation is that after each save the next slot starts exactly
// where the previous one ended and keeps its length, room and capacity — so a
// 3-hour evening of 20-minute slots is one field of typing and then nine
// clicks on Add.
function AddSlotForm({ accent, members, defaultLocation, lastSlot, onAdd }) {
  const [startsAt, setStartsAt] = useState(() => toLocalInput(nextHalfHour()));
  const [minutes, setMinutes] = useState(20);
  const [capacity, setCapacity] = useState(1);
  const [location, setLocation] = useState('');
  const [interviewerId, setInterviewerId] = useState('');
  const [saving, setSaving] = useState(false);
  // Tracks the id of the slot the form last chained from, so the prefill runs
  // once per added slot rather than on every re-render — otherwise typing a
  // start time would be overwritten the moment the parent refetched.
  const [chainedFrom, setChainedFrom] = useState(null);

  useEffect(() => {
    if (!lastSlot || lastSlot.id === chainedFrom) return;
    const end = new Date(lastSlot.endDate);
    const start = new Date(lastSlot.startDate);
    if (Number.isNaN(end.getTime())) return;
    setStartsAt(toLocalInput(end));
    const length = Math.round((end.getTime() - start.getTime()) / 60000);
    if (length > 0) setMinutes(length);
    setCapacity(lastSlot.capacity);
    setLocation(lastSlot.location ?? '');
    setInterviewerId(lastSlot.interviewer_id ?? '');
    setChainedFrom(lastSlot.id);
  }, [lastSlot, chainedFrom]);

  const endsAt = useMemo(() => {
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return null;
    return new Date(start.getTime() + minutes * 60000);
  }, [startsAt, minutes]);

  async function submit() {
    if (!endsAt) return;
    setSaving(true);
    await onAdd({
      startsAt: new Date(startsAt).toISOString(),
      endsAt: endsAt.toISOString(),
      location: location.trim() || null,
      capacity,
      interviewerId: interviewerId || null,
    });
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Plus size={12} /> Add a slot
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="slot-start" className={labelClass}>Starts</label>
          <input id="slot-start" type="datetime-local" value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="slot-len" className={labelClass}>Length (min)</label>
          <input id="slot-len" type="number" min={5} step={5} value={minutes}
            onChange={(e) => setMinutes(Math.max(5, Number(e.target.value) || 5))} className={inputClass} />
        </div>
        <div>
          <label htmlFor="slot-cap" className={labelClass}>Seats</label>
          <input id="slot-cap" type="number" min={1} value={capacity}
            onChange={(e) => setCapacity(Math.max(1, Number(e.target.value) || 1))} className={inputClass} />
          <p className="mt-1 text-[10px] text-muted-foreground">1 unless you run rooms in parallel.</p>
        </div>
        <div>
          <label htmlFor="slot-interviewer" className={labelClass}>Interviewer</label>
          <select id="slot-interviewer" value={interviewerId}
            onChange={(e) => setInterviewerId(e.target.value)} className={inputClass}>
            <option value="">Not decided</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{memberDisplayName(m)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="slot-loc" className={labelClass}>Room (optional)</label>
          <input id="slot-loc" type="text" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder={defaultLocation || 'Same as the round'} className={inputClass} />
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            {endsAt
              ? <>Ends <span className="font-semibold text-foreground">{timeLabel(endsAt)}</span></>
              : 'Pick a valid start time'}
          </p>
          <button type="button" onClick={submit} disabled={saving || !endsAt}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: accent.gradient }}>
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Add slot
          </button>
        </div>
      </div>
    </div>
  );
}
