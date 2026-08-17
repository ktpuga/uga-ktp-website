'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, CalendarClock, Check, ChevronRight, Clock, Eye, EyeOff,
  Loader2, MapPin, NotebookPen, Pencil, Plus, Trash2, Users, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getInterviewSchedules, getInterviewSchedule, createInterviewSchedule, updateInterviewSchedule,
  deleteInterviewSchedule, createInterviewSlot, updateInterviewSlot, deleteInterviewSlot,
  cancelInterviewBooking, withdrawInterviewer, getCommittees, getRoundNotes,
} from '@/lib/portal-api';
import { memberDisplayName, memberInitials } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import { useConfirm } from '@/components/ui/confirm-dialog';
import InterviewNotes from '@/components/portal/InterviewNotes';

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const dayLabel = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const timeLabel = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

// datetime-local is local wall-clock with no zone; the API stores timestamptz.
// Converted explicitly so 5:00 PM means 5:00 PM in Athens, not UTC.
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
  const [committees, setCommittees] = useState([]);
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

  useEffect(() => {
    // Its own catch: the committee list only drives the "who may staff this
    // round" picker, and losing it must not take the schedules down with it.
    getCommittees()
      .then((data) => setCommittees(Array.isArray(data) ? data : []))
      .catch((err) => { if (isRedirectError(err)) throw err; });
  }, []);

  async function create({ title, description, location, interviewerCommitteeIds }) {
    setError('');
    try {
      const schedule = await createInterviewSchedule({
        title, description, location, interviewerCommitteeIds,
      });
      setSchedules((prev) => [schedule, ...prev]);
      // Straight in — adding slots is the reason anyone creates one.
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
    const drop = () => setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));

    try {
      const first = await deleteInterviewSchedule(schedule.id);
      if (first.ok) return drop();

      // Only the "people have booked" refusal is worth offering to override.
      // Anything else is a real failure, and forcing it would just fail again —
      // offering "Delete anyway" for a network error is alarming and useless.
      if (first.code !== 'has_bookings') return setError(first.error);

      // The 409 carries the count. "Delete this schedule" and "cancel 23
      // people's interviews" deserve different answers, and only the server knows.
      const forced = await confirm(
        `${first.error}\n\nDelete it anyway? Their interviews will be cancelled and they will not be told.`,
        { title: 'People have already booked', confirmLabel: 'Delete anyway' },
      );
      if (!forced) return;

      const second = await deleteInterviewSchedule(schedule.id, { force: true });
      if (second.ok) drop();
      else setError(second.error);
    } catch (err) {
      // requireAccessToken() still redirects by throwing, and that must pass.
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not delete that schedule.');
    }
  }

  if (openId) {
    return (
      <ScheduleDetail
        scheduleId={openId}
        accent={accent}
        committees={committees}
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

      <NewScheduleForm accent={accent} committees={committees} onCreate={create} />

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

// Which committees may sign up to RUN this round. Pills rather than a multi-select
// because that is what AudienceSelect already trained everyone here to expect.
//
// Selecting nothing is a real, meaningful state — the API fails CLOSED, so a
// round with no committee is staffed by eboard alone. The empty caption says so
// rather than leaving it to be discovered.
function InterviewerCommitteeSelect({ committees, selected, onChange, accent, idPrefix }) {
  const toggle = (id) => onChange(
    selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id],
  );

  return (
    <div>
      <p className={labelClass} id={`${idPrefix}-committees-label`}>Who can sign up to interview</p>
      {committees.length === 0 ? (
        <p className="text-xs text-muted-foreground">No committees exist yet.</p>
      ) : (
        <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={`${idPrefix}-committees-label`}>
          {committees.map((committee) => {
            const on = selected.includes(String(committee.id));
            return (
              <button
                key={committee.id}
                type="button"
                onClick={() => toggle(String(committee.id))}
                aria-pressed={on}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  on ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:bg-muted',
                )}
                style={on ? { background: accent.gradient } : undefined}
              >
                {committee.name}
              </button>
            );
          })}
        </div>
      )}
      <p className="mt-1.5 text-[10px] text-muted-foreground">
        {selected.length === 0
          ? 'Nobody outside eboard can sign up to interview this round.'
          : 'Members of these committees can claim interviewer spots on any published slot.'}
      </p>
    </div>
  );
}

function NewScheduleForm({ accent, committees, onCreate }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [committeeIds, setCommitteeIds] = useState([]);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!title.trim()) return;
    setSaving(true);
    await onCreate({
      title: title.trim(), description, location, interviewerCommitteeIds: committeeIds,
    });
    setSaving(false);
    setTitle(''); setDescription(''); setLocation(''); setCommitteeIds([]); setOpen(false);
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
          placeholder="Boyd 204 (individual slots can override this)" className={inputClass} />
      </div>
      <div>
        <label htmlFor="sched-desc" className={labelClass}>Notes for rushees (optional)</label>
        <textarea id="sched-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="Dress business casual, bring a resume…" className={cn(inputClass, 'resize-y')} />
      </div>
      <InterviewerCommitteeSelect
        committees={committees}
        selected={committeeIds}
        onChange={setCommitteeIds}
        accent={accent}
        idPrefix="sched-new"
      />
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

function ScheduleDetail({ scheduleId, accent, committees, onBack }) {
  const confirm = useConfirm();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);

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

  useEffect(() => { load(); }, [load]);

  // Changing who may staff the round. Sent snake_case because
  // updateInterviewSchedule is a deliberate pass-through of only the keys given.
  async function saveCommittees(ids) {
    setBusy(true);
    setError('');
    try {
      const updated = await updateInterviewSchedule(scheduleId, { interviewer_committee_ids: ids });
      setSchedule((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not change who can interview.');
    } finally {
      setBusy(false);
    }
  }

  async function removeInterviewer(slot, interviewer) {
    const who = memberDisplayName(interviewer);
    if (!(await confirm(
      `Remove ${who} from the ${timeLabel(new Date(slot.startDate))} slot? They'll be notified and can sign up for another time.`,
      { title: 'Remove this interviewer?', confirmLabel: 'Remove' },
    ))) return;
    setBusy(true);
    setError('');
    try {
      const result = await withdrawInterviewer(slot.id, interviewer.id);
      if (result.ok) await load();
      else setError(result.error);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not remove that interviewer.');
    } finally {
      setBusy(false);
    }
  }

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

  // Returns an error message for the edit form to show, or null on success.
  // Deliberately not routed through the page-level banner: the message is about
  // the fields you are looking at, and the 409 for lowering capacity below the
  // seats already taken has no ?force escape the way deleting does — it is a
  // hard stop, so it has to read as an explanation rather than an escalation.
  async function saveSlot(slot, payload) {
    try {
      // Returns { error } rather than throwing — see lib/portal-api.js. A
      // thrown message would reach the reader as React's #441 digest, which is
      // exactly the explanation this 409 is supposed to give them.
      const result = await updateInterviewSlot(slot.id, payload);
      if (result?.error) return result.error;
      setEditingId(null);
      await load();
      return null;
    } catch (err) {
      // requireAccessToken() still redirects by throwing, and that must pass.
      if (isRedirectError(err)) throw err;
      return err.message ?? 'Could not save that slot.';
    }
  }

  async function removeSlot(slot) {
    const when = `${dayLabel(new Date(slot.startDate))}, ${timeLabel(new Date(slot.startDate))}`;
    if (!(await confirm(`Delete the ${when} slot?`, { title: 'Delete this slot?' }))) return;
    setBusy(true);
    setError('');
    try {
      const first = await deleteInterviewSlot(slot.id);
      // Awaited, not returned: `return load()` would let the finally below
      // clear `busy` while the refetch was still in flight.
      if (first.ok) { await load(); return; }

      // 409 when booked. Same escalation as deleting a schedule, and the same
      // rule that only that refusal earns one.
      if (first.code !== 'has_bookings') return setError(first.error);

      const forced = await confirm(
        `${first.error}\n\nDelete it anyway? They'll be told their slot was cancelled and asked to pick another.`,
        { title: 'Someone has booked this slot', confirmLabel: 'Delete anyway' },
      );
      if (!forced) return;

      const second = await deleteInterviewSlot(slot.id, { force: true });
      if (second.ok) await load();
      else setError(second.error);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not delete that slot.');
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
                ? 'Rushees can see these times and book them right now. Unpublishing stops new signups, but it does not cancel anyone who already booked.'
                : 'This is a draft. Nothing here is visible to rushees until you publish it, so take your time adding slots.'}
            </p>
          </div>

          <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <InterviewerCommitteeSelect
              committees={committees}
              selected={schedule.interviewer_committee_ids ?? []}
              onChange={saveCommittees}
              accent={accent}
              idPrefix={`sched-${schedule.id}`}
            />
          </div>

          <RoundNotes scheduleId={schedule.id} />

          <AddSlotForm
            accent={accent}
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
                        defaultLocation={schedule.location}
                        busy={busy}
                        editing={editingId === slot.id}
                        onEdit={() => setEditingId(slot.id)}
                        onCancelEdit={() => setEditingId(null)}
                        onSave={saveSlot}
                        onDelete={() => removeSlot(slot)}
                        onRelease={(booking) => releaseBooking(booking, slot)}
                        onRemoveInterviewer={(interviewer) => removeInterviewer(slot, interviewer)}
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

// Every note in the round, grouped by candidate. The decision-night view: the
// per-slot panels above answer "what did we think of this person", and this one
// answers "read them all side by side", which is the question actually being
// asked in the room.
//
// Collapsed by default and fetched only when opened. Two reasons, and the second
// is the real one: it is a whole round of evaluations on one screen, so it
// should be something eboard chooses to put up rather than something that
// appears behind them while they are showing the schedule to someone.
function RoundNotes({ scheduleId }) {
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setLoading(true);
    setError('');
    try {
      const result = await getRoundNotes(scheduleId);
      // Returns { error } rather than throwing — see lib/portal-api.js.
      if (result.error) setError(result.error);
      else setCandidates(result.candidates);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not load notes for this round.');
    } finally {
      setLoading(false);
    }
  }

  const total = candidates.reduce((n, c) => n + c.notes.length, 0);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40"
      >
        <span className="flex items-center gap-2">
          <NotebookPen size={14} className="text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Interview notes</span>
          {open && !loading && !error && (
            <span className="text-xs text-muted-foreground">
              {total} {total === 1 ? 'note' : 'notes'} on {candidates.length}{' '}
              {candidates.length === 1 ? 'candidate' : 'candidates'}
            </span>
          )}
        </span>
        <ChevronRight size={15} className={cn('text-muted-foreground transition-transform', open && 'rotate-90')} />
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4">
          {error ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {error}
            </div>
          ) : loading ? (
            <div className="flex h-16 items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> Loading notes…
            </div>
          ) : candidates.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nobody has written a note in this round yet. Interviewers add them from
              their own interviews page once they have signed up for a slot.
            </p>
          ) : (
            <div className="space-y-5">
              {candidates.map((candidate) => (
                <div key={candidate.candidate_id}>
                  <p className="mb-1.5 text-xs font-semibold text-foreground">
                    {candidate.candidate_name}
                    <span className="ml-2 font-normal text-muted-foreground">
                      {candidate.notes.length} {candidate.notes.length === 1 ? 'note' : 'notes'}
                    </span>
                  </p>
                  <ul className="space-y-2">
                    {candidate.notes.map((note) => (
                      <li key={note.id} className="rounded-lg border border-border bg-muted/20 px-3 py-2">
                        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-foreground">{note.author_name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="whitespace-pre-line text-[12px] leading-relaxed text-foreground">{note.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SlotRow({
  slot, accent, defaultLocation, busy,
  editing, onEdit, onCancelEdit, onSave, onDelete, onRelease, onRemoveInterviewer,
}) {
  const left = Math.max(0, slot.capacity - slot.booked_count);

  // One candidate's notes open at a time, by booking id. The panel is tall and
  // a night's worth of them open at once buries the schedule.
  const [openNotesFor, setOpenNotesFor] = useState(null);
  const when = timeLabel(new Date(slot.startDate));
  const interviewers = slot.interviewers ?? [];
  const interviewerSpotsLeft = Math.max(0, slot.interviewer_capacity - interviewers.length);

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {when} – {timeLabel(new Date(slot.endDate))}
          </p>
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
            <span>{slot.booked_count} of {slot.capacity} booked{left > 0 ? ` · ${left} open` : ' · full'}</span>
            {slot.location && <span className="flex items-center gap-1"><MapPin size={9} /> {slot.location}</span>}
            <span className="flex items-center gap-1">
              <Users size={9} /> {interviewers.length} of {slot.interviewer_capacity} interviewer
              {slot.interviewer_capacity === 1 ? '' : 's'}
              {interviewerSpotsLeft === 0 ? ' · covered' : ''}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={editing ? onCancelEdit : onEdit}
            disabled={busy}
            aria-expanded={editing}
            className={cn(
              'rounded-lg border border-border p-1.5 disabled:opacity-40',
              editing ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted',
            )}
            aria-label={`${editing ? 'Stop editing' : 'Edit'} the ${when} slot`}
          >
            {editing ? <X size={12} /> : <Pencil size={12} />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="rounded-lg border border-destructive/30 bg-destructive/10 p-1.5 text-destructive hover:bg-destructive/20 disabled:opacity-40"
            aria-label={`Delete the ${when} slot`}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Deliberately not keyed on the slot: a refetch triggered by something
          else on the page must not throw away what's half-typed in here. */}
      {editing && (
        <EditSlotForm
          slot={slot}
          accent={accent}
          defaultLocation={defaultLocation}
          onSave={onSave}
          onCancel={onCancelEdit}
        />
      )}

      {interviewers.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
          <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Users size={9} /> Interviewing
          </span>
          {interviewers.map((interviewer) => (
            <span key={interviewer.id} className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1 pl-2 pr-2">
              <span className="text-[11px] font-medium text-foreground">{memberDisplayName(interviewer)}</span>
              <button
                type="button"
                onClick={() => onRemoveInterviewer(interviewer)}
                disabled={busy}
                className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                aria-label={`Remove ${memberDisplayName(interviewer)} from this slot`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {slot.bookings.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border pt-2.5">
          {slot.bookings.map((booking) => (
            <span key={booking.booking_id} className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1 pl-1 pr-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold text-white" style={{ background: accent.gradient }}>
                {memberInitials(booking)}
              </span>
              <span className="text-[11px] font-medium text-foreground">{memberDisplayName(booking)}</span>
              {/* Notes before Release, because the destructive control should
                  not be the one nearest the name. */}
              <button
                type="button"
                onClick={() => setOpenNotesFor(openNotesFor === booking.booking_id ? null : booking.booking_id)}
                aria-expanded={openNotesFor === booking.booking_id}
                className={cn(
                  'hover:text-foreground',
                  openNotesFor === booking.booking_id ? 'text-foreground' : 'text-muted-foreground',
                )}
                aria-label={`Notes on ${memberDisplayName(booking)}`}
              >
                <NotebookPen size={11} />
              </button>
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

      {/* Keyed on the booking so switching candidates remounts and re-fetches
          rather than showing the previous person's notes while the new load. */}
      {openNotesFor && (
        <InterviewNotes
          key={openNotesFor}
          bookingId={openNotesFor}
          candidateName={memberDisplayName(
            slot.bookings.find((b) => b.booking_id === openNotesFor) ?? {},
          )}
          accent={accent}
          // Eboard removes anyone's note. They still cannot EDIT one — that
          // asymmetry is deliberate and lives in the panel, not here.
          canDeleteAny
        />
      )}
    </div>
  );
}

// Both forms drive the same five fields, so the inputs live here once and each
// parent keeps its own state — AddSlotForm chains from the previous slot,
// EditSlotForm starts from the slot being edited.
//
// `idPrefix` is load-bearing rather than decoration: the add form and an open
// edit form are on the page at the same time, and duplicate DOM ids silently
// break clicking a label to focus its field.
function SlotFields({ idPrefix, value, onChange, defaultLocation, seatsHint, interviewersHint, footer }) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor={`${idPrefix}-start`} className={labelClass}>Starts</label>
          <input id={`${idPrefix}-start`} type="datetime-local" value={value.startsAt}
            onChange={(e) => set({ startsAt: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-len`} className={labelClass}>Length (min)</label>
          <input id={`${idPrefix}-len`} type="number" min={5} step={5} value={value.minutes}
            onChange={(e) => set({ minutes: Math.max(5, Number(e.target.value) || 5) })} className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-cap`} className={labelClass}>Seats</label>
          <input id={`${idPrefix}-cap`} type="number" min={1} value={value.capacity}
            onChange={(e) => set({ capacity: Math.max(1, Number(e.target.value) || 1) })} className={inputClass} />
          {seatsHint && <p className="mt-1 text-[10px] text-muted-foreground">{seatsHint}</p>}
        </div>
        <div>
          <label htmlFor={`${idPrefix}-interviewers`} className={labelClass}>Interviewers</label>
          <input id={`${idPrefix}-interviewers`} type="number" min={1} value={value.interviewerCapacity}
            onChange={(e) => set({ interviewerCapacity: Math.max(1, Number(e.target.value) || 1) })}
            className={inputClass} />
          <p className="mt-1 text-[10px] text-muted-foreground">
            {interviewersHint ?? 'How many members can claim this slot.'}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-loc`} className={labelClass}>Room (optional)</label>
          <input id={`${idPrefix}-loc`} type="text" value={value.location}
            onChange={(e) => set({ location: e.target.value })}
            placeholder={defaultLocation || 'Same as the round'} className={inputClass} />
        </div>
        <div className="flex items-end justify-between gap-3">{footer}</div>
      </div>
    </>
  );
}

// A stored window is two timestamps; both forms edit it as a start plus a
// length, so this is the way back. The DB has CHECK (ends_at > starts_at), so
// the fallback only covers an unparseable date.
function lengthInMinutes(startDate, endDate) {
  const minutes = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 60000);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : 20;
}

function useEndsAt(startsAt, minutes) {
  return useMemo(() => {
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return null;
    return new Date(start.getTime() + minutes * 60000);
  }, [startsAt, minutes]);
}

const endsLabel = (endsAt) => (endsAt
  ? <>Ends <span className="font-semibold text-foreground">{timeLabel(endsAt)}</span></>
  : 'Pick a valid start time');

// Slots go in one at a time, so each save prefills the next one starting where
// the last ended, keeping its length, room and capacity. An evening of
// 20-minute slots is one field of typing and then repeated clicks on Add.
function AddSlotForm({ accent, defaultLocation, lastSlot, onAdd }) {
  const [fields, setFields] = useState(() => ({
    startsAt: toLocalInput(nextHalfHour()),
    minutes: 20,
    capacity: 1,
    location: '',
    interviewerCapacity: 1,
  }));
  const [saving, setSaving] = useState(false);
  // Keyed on the last slot's id so the prefill runs once per added slot —
  // otherwise a typed start time is overwritten when the parent refetches.
  const [chainedFrom, setChainedFrom] = useState(null);

  useEffect(() => {
    if (!lastSlot || lastSlot.id === chainedFrom) return;
    const end = new Date(lastSlot.endDate);
    if (Number.isNaN(end.getTime())) return;
    setFields({
      startsAt: toLocalInput(end),
      minutes: lengthInMinutes(lastSlot.startDate, lastSlot.endDate),
      capacity: lastSlot.capacity,
      location: lastSlot.location ?? '',
      // Chained like the rest: a whole evening usually wants the same staffing.
      interviewerCapacity: lastSlot.interviewer_capacity ?? 1,
    });
    setChainedFrom(lastSlot.id);
  }, [lastSlot, chainedFrom]);

  const endsAt = useEndsAt(fields.startsAt, fields.minutes);

  async function submit() {
    if (!endsAt) return;
    setSaving(true);
    await onAdd({
      startsAt: new Date(fields.startsAt).toISOString(),
      endsAt: endsAt.toISOString(),
      location: fields.location.trim() || null,
      capacity: fields.capacity,
      interviewerCapacity: fields.interviewerCapacity,
    });
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Plus size={12} /> Add a slot
      </p>
      <SlotFields
        idPrefix="slot-add"
        value={fields}
        onChange={setFields}
        defaultLocation={defaultLocation}
        seatsHint="1 unless you run rooms in parallel."
        footer={(
          <>
            <p className="text-[11px] text-muted-foreground">{endsLabel(endsAt)}</p>
            <button type="button" onClick={submit} disabled={saving || !endsAt}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: accent.gradient }}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Add slot
            </button>
          </>
        )}
      />
    </div>
  );
}

// Editing happens in place so the day it sits in, and the people already booked
// into it, stay on screen while you change it.
function EditSlotForm({ slot, accent, defaultLocation, onSave, onCancel }) {
  const original = useMemo(() => ({
    startsAt: toLocalInput(new Date(slot.startDate)),
    minutes: lengthInMinutes(slot.startDate, slot.endDate),
    capacity: slot.capacity,
    location: slot.location ?? '',
    interviewerCapacity: slot.interviewer_capacity ?? 1,
  }), [slot.startDate, slot.endDate, slot.capacity, slot.location, slot.interviewer_capacity]);

  const [fields, setFields] = useState(original);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const endsAt = useEndsAt(fields.startsAt, fields.minutes);
  const changed = Object.keys(original).some((key) => fields[key] !== original[key]);
  // Only the START triggers the API's "time changed" pushes, so this warning
  // tracks that field and not the others.
  const startMoved = fields.startsAt !== original.startsAt;

  // Two separate audiences get told, and a slot can have either without the
  // other — an unbooked slot someone signed up to run still needs the warning.
  const signedUp = slot.interviewers?.length ?? 0;
  const notifyList = [
    slot.booked_count > 0
      && `${slot.booked_count === 1 ? 'the rushee' : `all ${slot.booked_count} rushees`} who booked it`,
    signedUp > 0
      && `${signedUp === 1 ? 'the member' : `all ${signedUp} members`} signed up to interview it`,
  ].filter(Boolean);

  async function submit() {
    if (!endsAt) return;
    setSaving(true);
    setError('');
    const failure = await onSave(slot, {
      startsAt: new Date(fields.startsAt).toISOString(),
      endsAt: endsAt.toISOString(),
      // An empty room and "Not decided" are sent as explicit nulls so the API
      // clears those columns. Omitting the key would leave the old value in
      // place and the edit would look like it saved while changing nothing.
      location: fields.location.trim() || null,
      capacity: fields.capacity,
      interviewerCapacity: fields.interviewerCapacity,
    });
    setSaving(false);
    // Stays open on failure, so the values that caused it are still on screen
    // to correct. Lowering seats below the booked count has no force override.
    if (failure) setError(failure);
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Pencil size={11} /> Edit this slot
      </p>

      <SlotFields
        idPrefix={`slot-edit-${slot.id}`}
        value={fields}
        onChange={setFields}
        defaultLocation={defaultLocation}
        seatsHint={slot.booked_count > 0
          ? `${slot.booked_count} booked, so seats can't go below that.`
          : undefined}
        interviewersHint={(slot.interviewers?.length ?? 0) > 0
          ? `${slot.interviewers.length} signed up, so it can't go below that.`
          : undefined}
        footer={(
          <>
            <p className="text-[11px] text-muted-foreground">{endsLabel(endsAt)}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onCancel} disabled={saving}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40">
                Cancel
              </button>
              <button type="button" onClick={submit} disabled={saving || !endsAt || !changed}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: accent.gradient }}>
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save
              </button>
            </div>
          </>
        )}
      />

      {startMoved && notifyList.length > 0 && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          Moving this slot notifies {notifyList.join(' and ')}. Changing the length,
          room or either count doesn&apos;t.
        </p>
      )}

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
