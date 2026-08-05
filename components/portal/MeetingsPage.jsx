'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle, Calendar, Check, Clock, Loader2, MapPin, Plus, Trash2, Users, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getMeetings, createMeeting, respondToMeeting, cancelMeeting, deleteMeeting, getMessageableMembers, getCommittees,
} from '@/lib/portal-api';
import AudienceSelect from '@/components/portal/AudienceSelect';
import { memberDisplayName, memberInitials } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import { useConfirm } from '@/components/ui/confirm-dialog';

// Kept in sync with MAY_BULK_INVITE in ktp-api's meetingsController.
const MAY_BULK_INVITE = ['eboard', 'chair', 'active', 'alumni'];

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function formatWhen(startsAt, endsAt) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime())) return '';
  const day = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const from = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (Number.isNaN(end.getTime())) return `${day}, ${from}`;
  const to = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day}, ${from} – ${to}`;
}

// Rounds to the next half hour and defaults to a 30-minute slot: a form that
// opens on "now" produces meetings for a time that has already passed by the
// moment someone finishes filling it in.
function defaultSlot() {
  const start = new Date();
  start.setMinutes(start.getMinutes() + 30 - (start.getMinutes() % 30), 0, 0);
  const end = new Date(start.getTime() + 30 * 60000);
  const local = (d) => {
    const copy = new Date(d);
    copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
    return copy.toISOString().slice(0, 16);
  };
  return { start: local(start), end: local(end) };
}

// A meeting is on the books as soon as it's made, so the only meeting-level
// states are scheduled and cancelled. Whether an individual is coming lives on
// their own RSVP, not here.
const STATUS_STYLES = {
  scheduled: { label: 'Scheduled', className: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300' },
  cancelled: { label: 'Cancelled', className: 'border-border bg-muted text-muted-foreground' },
};

const RSVP_STYLES = {
  going: { label: 'Going', className: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300' },
  not_going: { label: "Can't make it", className: 'border-border bg-muted text-muted-foreground' },
  pending: { label: 'No reply yet', className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300' },
};

function Pill({ styles, value }) {
  const style = styles[value];
  if (!style) return null;
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', style.className)}>
      {style.label}
    </span>
  );
}

function InviteeAvatars({ invitees, accent }) {
  return (
    <div className="flex -space-x-1.5">
      {invitees.slice(0, 5).map((person) => (
        <span
          key={person.id}
          title={`${memberDisplayName(person)}${person.response !== 'pending' ? ` — ${person.response}` : ''}`}
          className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[9px] font-semibold text-white"
          style={{ background: accent.gradient }}
        >
          {memberInitials(person)}
        </span>
      ))}
      {invitees.length > 5 && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-muted text-[9px] font-semibold text-muted-foreground">
          +{invitees.length - 5}
        </span>
      )}
    </div>
  );
}

function MeetingCard({ meeting, currentUserId, accent, onRespond, onCancel, onDelete, busy }) {
  const isOrganizer = meeting.organizer_id === currentUserId;
  // Same rule the API enforces: over, or already cancelled. `endDate` is the
  // meeting's own end, so one still in progress counts as upcoming and can't
  // be deleted out from under the people sitting in it.
  const canDelete = new Date(meeting.endDate).getTime() < Date.now() || meeting.status === 'cancelled';
  // my_response is null for the organizer — they have nothing to RSVP to,
  // which is what decides whether the buttons render at all.
  // An RSVP can be changed, unlike the old one-shot accept — plans change, and
  // the calendar should follow. So the buttons stay visible after answering,
  // with the current choice highlighted.
  const canRsvp = !isOrganizer && meeting.my_response != null && meeting.status !== 'cancelled';

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{meeting.title}</p>
            <Pill styles={STATUS_STYLES} value={meeting.status} />
            {/* Your own RSVP, shown next to the meeting's state so "this is
                happening" and "I'm coming" stay visibly separate. */}
            {!isOrganizer && meeting.status !== 'cancelled' && (
              <Pill styles={RSVP_STYLES} value={meeting.my_response} />
            )}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={11} /> {formatWhen(meeting.startDate, meeting.endDate)}
          </p>
          {meeting.location && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={11} /> {meeting.location}
            </p>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            {isOrganizer ? 'You set this up' : `Set up by ${meeting.organizer_name ?? 'someone'}`}
          </p>
          {meeting.message && (
            <p className="mt-2 whitespace-pre-line rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {meeting.message}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <InviteeAvatars invitees={meeting.invitees ?? []} accent={accent} />
          {(meeting.invitees?.length ?? 0) > 0 && (
            <p className="whitespace-nowrap text-[10px] text-muted-foreground">
              {meeting.invitees.filter((i) => i.response === 'going').length} going
              {' · '}
              {meeting.invitees.filter((i) => i.response === 'pending').length} no reply
            </p>
          )}
        </div>
      </div>

      {/* `isOrganizer && canDelete` is a separate term on purpose: the other
          two are false for a CANCELLED meeting, which would have hidden the
          whole bar and with it the Delete button — for exactly the meetings
          it's meant to clean up. */}
      {(canRsvp || (isOrganizer && meeting.status !== 'cancelled') || (isOrganizer && canDelete)) && (
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          {canRsvp && (
            <>
              <button
                type="button"
                onClick={() => onRespond(meeting.id, 'not_going')}
                disabled={busy}
                aria-pressed={meeting.my_response === 'not_going'}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40',
                  meeting.my_response === 'not_going'
                    ? 'border-foreground/30 bg-muted text-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                <X size={11} /> Can&apos;t make it
              </button>
              <button
                type="button"
                onClick={() => onRespond(meeting.id, 'going')}
                disabled={busy}
                aria-pressed={meeting.my_response === 'going'}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40',
                  meeting.my_response === 'going' ? 'text-white' : 'border border-border text-muted-foreground hover:bg-muted',
                )}
                style={meeting.my_response === 'going' ? { background: accent.gradient } : undefined}
              >
                <Check size={11} /> Going
              </button>
            </>
          )}
          {isOrganizer && meeting.status !== 'cancelled' && (
            <button
              type="button"
              onClick={() => onCancel(meeting.id)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-40"
            >
              <X size={11} /> Cancel
            </button>
          )}

          {/* Delete is offered only where the API will accept it: organizer,
              and the meeting is over or already cancelled. Cancel and Delete
              are therefore never both shown for a live upcoming meeting — you
              cancel it first, then it becomes deletable. Mirrors the rule in
              meetingsController.deleteMeeting rather than restating it
              loosely, so the button can't offer something that 400s. */}
          {isOrganizer && canDelete && (
            <button
              type="button"
              onClick={() => onDelete(meeting.id)}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-40"
              aria-label={`Delete "${meeting.title}" permanently`}
            >
              <Trash2 size={11} /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// `presetCommittee` ({ id, name }) opens this straight from a committee page
// with that committee already the invitee list — the picker is replaced by a
// locked chip, since choosing a *different* committee from inside one
// committee's page would be a surprise.
export function NewMeetingModal({ accent, presetInvitee, presetCommittee, onClose, onCreated }) {
  const { data: session } = useSession();
  // Everyone except pledges and rushees may invite a whole group or committee.
  // Mirrors MAY_BULK_INVITE in meetingsController — the server rejects it
  // regardless, this just avoids offering a control that would 403.
  const canBulkInvite = (session?.user?.groups ?? []).some((g) => MAY_BULK_INVITE.includes(g));
  const hasPresetCommittee = Boolean(presetCommittee);
  const slot = useMemo(defaultSlot, []);
  const [title, setTitle] = useState(() => {
    if (presetInvitee) return `Coffee with ${memberDisplayName(presetInvitee)}`;
    if (presetCommittee) return `${presetCommittee.name} Meeting`;
    return '';
  });
  const [audience, setAudience] = useState([]);
  const [committeeIds, setCommitteeIds] = useState(presetCommittee ? [String(presetCommittee.id)] : []);
  const [committees, setCommittees] = useState([]);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState(slot.start);
  const [endsAt, setEndsAt] = useState(slot.end);
  const [members, setMembers] = useState([]);
  const [selected, setSelected] = useState(presetInvitee ? [presetInvitee.id] : []);
  const [queryText, setQueryText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // The full directory. Rushees can't reach any meetings surface at all now,
    // so the old note about them only seeing leadership no longer applies.
    getMessageableMembers()
      .then((data) => setMembers(Array.isArray(data) ? data : []))
      .catch((err) => { if (isRedirectError(err)) throw err; });
    // Only fetched when the viewer may actually use them; the endpoint is open
    // to every member, so a failure here just leaves the section hidden. Not
    // needed at all with a preset committee — that one is already named.
    if (canBulkInvite && !hasPresetCommittee) {
      getCommittees()
        .then((data) => setCommittees(Array.isArray(data) ? data : []))
        .catch((err) => { if (isRedirectError(err)) throw err; });
    }
    // Depends on the boolean, not the object: callers pass an inline literal,
    // and a fresh object every render would refetch the member list forever.
  }, [canBulkInvite, hasPresetCommittee]);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return members.filter((m) => !q || memberDisplayName(m).toLowerCase().includes(q)).slice(0, 30);
  }, [members, queryText]);

  async function submit() {
    if (!title.trim() || !hasSomeone) return;
    setSubmitting(true);
    setError('');
    try {
      const meeting = await createMeeting({
        title: title.trim(),
        message,
        location,
        audience,
        committeeIds,
        // datetime-local gives a local wall-clock string with no zone; the API
        // stores timestamptz, so it's converted here rather than sent raw.
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        inviteeIds: selected,
      });
      onCreated(meeting);
      onClose();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not create that meeting.');
      setSubmitting(false);
    }
  }

  // Either an individual or a group counts — the server applies the same rule.
  const hasSomeone = selected.length > 0 || audience.length > 0 || committeeIds.length > 0;

  const inputClass = 'w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="New meeting">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent.gradient }}>
              <Calendar size={14} />
            </div>
            <p className="text-sm font-semibold text-foreground">New meeting</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div>
            <label htmlFor="mtg-title" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">What&apos;s it about</label>
            <input id="mtg-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chat about the hackathon" className={inputClass} autoFocus />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="mtg-start" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Starts</label>
              <input id="mtg-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="mtg-end" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ends</label>
              <input id="mtg-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="mtg-loc" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Where (optional)</label>
            <input id="mtg-loc" type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Jittery Joe's, MLC, Zoom…" className={inputClass} />
          </div>

          <div>
            <label htmlFor="mtg-msg" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Note (optional)</label>
            <textarea id="mtg-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Anything they should know beforehand." className={cn(inputClass, 'resize-y')} />
          </div>

          {hasPresetCommittee ? (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inviting</p>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white" style={{ background: accent.gradient }}>
                  <Users size={11} />
                  {presetCommittee.name}
                </span>
                <span className="text-[11px] text-muted-foreground">everyone on this committee</span>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Whoever is on it right now gets invited. Later joiners don&apos;t.
              </p>
            </div>
          ) : canBulkInvite && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invite a group</p>
              <AudienceSelect value={audience} onChange={setAudience} exclude={['rush']} />
              {committees.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-border bg-muted/40 p-3">
                  {committees.map((c) => {
                    const on = committeeIds.includes(String(c.id));
                    return (
                      <button
                        key={c.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setCommitteeIds((prev) => (
                          prev.includes(String(c.id)) ? prev.filter((x) => x !== String(c.id)) : [...prev, String(c.id)]
                        ))}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                          on ? 'border-transparent text-white' : 'border-border bg-card text-muted-foreground hover:text-foreground',
                        )}
                        style={on ? { background: accent.gradient } : undefined}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Says plainly that this is a snapshot. Someone who joins the
                  committee next week is not in today's meeting, which is the
                  opposite of how group chats behave and worth stating. */}
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Whoever is in these right now gets invited. Later joiners don&apos;t.
              </p>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {hasPresetCommittee ? 'Also invite (optional)' : canBulkInvite ? 'Or pick people' : 'Who'}
              <span className="ml-1 text-[10px] font-normal normal-case text-muted-foreground/70">{selected.length} selected</span>
            </p>
            <input type="text" value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Search members…" className={cn(inputClass, 'mb-2')} />
            <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No matches.</p>
              ) : filtered.map((m) => {
                const isOn = selected.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelected((prev) => (isOn ? prev.filter((x) => x !== m.id) : [...prev, m.id]))}
                    className="flex w-full items-center gap-2.5 border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted/40"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: accent.gradient }}>
                      {memberInitials(m)}
                    </span>
                    <span className="flex-1 truncate text-xs text-foreground">{memberDisplayName(m)}</span>
                    {isOn && <Check size={13} style={{ color: accent.base }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertTriangle size={12} /> {error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !title.trim() || !hasSomeone}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: accent.gradient }}
          >
            {submitting && <Loader2 size={13} className="animate-spin" />}
            Create meeting
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  const accent = useAccentPalette();
  const confirm = useConfirm();
  const { data: session } = useSession();
  const currentUserId = session?.user?.authentik_id ?? session?.user?.id ?? null;

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setMeetings(await getMeetings());
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not load meetings.');
    } finally {
      setLoading(false);
    }
  }

  async function respond(id, response) {
    setBusy(true);
    setError('');
    try {
      const updated = await respondToMeeting(id, response);
      // Merge rather than replace: the response payload has no invitees or
      // organizer_name, and dropping them would blank the card until reload.
      setMeetings((prev) => prev.map((m) => (m.id === updated.id
        ? { ...m, ...updated, my_response: response }
        : m)));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not save your response.');
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id) {
    setBusy(true);
    setError('');
    try {
      const updated = await cancelMeeting(id);
      setMeetings((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not cancel that meeting.');
    } finally {
      setBusy(false);
    }
  }

  // Permanent, and the row disappears for every participant, not just the
  // organizer — so it asks first. The API re-checks organizer + past/cancelled;
  // this is the friendly half of the same rule.
  async function remove(id) {
    if (!(await confirm('Delete this meeting permanently? It will disappear for everyone who was invited.'))) return;
    setBusy(true);
    setError('');
    try {
      await deleteMeeting(id);
      setMeetings((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not delete that meeting.');
    } finally {
      setBusy(false);
    }
  }

  // Anything still needing your RSVP floats to the top — that's the only part
  // of this page that is actually a to-do rather than a record.
  const { needsYou, upcoming, past } = useMemo(() => {
    const now = Date.now();
    const needs = [];
    const up = [];
    const old = [];
    for (const m of meetings) {
      const isOrganizer = m.organizer_id === currentUserId;
      // Cancelled is checked before the date, so a cancelled meeting whose
      // start time hasn't passed yet still files under Past rather than
      // sitting in Upcoming as something people might turn up to.
      if (m.status === 'cancelled') old.push(m);
      else if (!isOrganizer && m.my_response === 'pending') needs.push(m);
      else if (new Date(m.startDate).getTime() >= now) up.push(m);
      else old.push(m);
    }
    const byStart = (a, b) => new Date(a.startDate) - new Date(b.startDate);
    return { needsYou: needs.sort(byStart), upcoming: up.sort(byStart), past: old.sort((a, b) => byStart(b, a)) };
  }, [meetings, currentUserId]);

  function Section({ title, items }) {
    if (items.length === 0) return null;
    return (
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        {items.map((m) => (
          <MeetingCard key={m.id} meeting={m} currentUserId={currentUserId} accent={accent} onRespond={respond} onCancel={cancel} onDelete={remove} busy={busy} />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>Chapter</p>
          <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>Meetings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up a meeting with specific people, a whole group, or a committee. Everyone invited
            RSVPs, and it lands on the calendar of whoever says they're going.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowRequest(true)}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-85"
          style={{ background: accent.gradient }}
        >
          <Plus size={14} /> Make a meeting
        </button>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : meetings.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
          <Users size={22} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No meetings yet.</p>
          <p className="max-w-sm text-xs text-muted-foreground/80">
            Make one from here, or from anyone&apos;s profile in the directory.
          </p>
        </div>
      ) : (
        <div className="space-y-7">
          <Section title="Needs your RSVP" items={needsYou} />
          <Section title="Upcoming" items={upcoming} />
          <Section title="Past" items={past} />
        </div>
      )}

      {showRequest && (
        <NewMeetingModal
          accent={accent}
          onClose={() => setShowRequest(false)}
          onCreated={(meeting) => setMeetings((prev) => [meeting, ...prev])}
        />
      )}
    </div>
  );
}
