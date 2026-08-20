'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  ChevronLeft, ChevronRight, Clock, MapPin, CalendarDays, Trash2, X,
  CheckSquare, Loader2, AlertCircle, Users, ClipboardCheck,
} from 'lucide-react';
import { getEvents, deleteEvent, setEventRsvp, getEventRsvps, getCalendarMeetings, getCalendarInterviews } from '@/lib/portal-api';
import { formatEventTimeRange, getEventStartDate, getEventEndDate, formatAudience } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { PALETTES } from '@/components/portal/PortalAccentContext';
import { announceRsvpChange } from '@/lib/use-pending-rsvps';

// Palette comes from PortalAccentContext, the single source of truth. Each of
// these files used to carry its own ACCENT_THEMES copy; they had already
// drifted (MemberDirectory was missing 'red' entirely, and every copy still
// had a real teal that nothing rendered — pledge passes 'blue').

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

// Meetings and interviews live in their own tables (see ktp-docs), so the
// calendar merges three sources — as does the ICS feed.
//
// `isMeeting` / `isInterview` are not cosmetic: all three id sequences start at
// 1 and the delete button calls deleteEvent(id) against /events/:id, so an
// unguarded Delete on meeting 4 would destroy the unrelated EVENT 4.
// `createdBy` is left undefined so the "createdBy === me" checks stay dark too.
function asCalendarEntry(meeting) {
  return {
    id: `meeting-${meeting.id}`,
    title: meeting.title,
    description: meeting.message ?? null,
    location: meeting.location ?? null,
    startDate: meeting.startDate,
    endDate: meeting.endDate,
    audience: null,
    requiresAttendance: false,
    // Structurally false, not merely absent. Meetings and interviews live in
    // their own tables, so an RSVP control here would PUT /events/:id with an
    // id from a different table — the same trap the Delete button carries.
    requiresRsvp: false,
    isMeeting: true,
    // Who it's with, from your point of view — the API knows who asked.
    participants: Array.isArray(meeting.participants) ? meeting.participants : [],
  };
}

// The API already shapes interviews like events, so this only namespaces the
// id and sets the guard flag.
function asInterviewEntry(interview) {
  return {
    id: `interview-${interview.id}`,
    title: interview.title,
    description: interview.description ?? null,
    location: interview.location ?? null,
    startDate: interview.startDate,
    endDate: interview.endDate,
    audience: null,
    requiresAttendance: false,
    // Structurally false, not merely absent. Meetings and interviews live in
    // their own tables, so an RSVP control here would PUT /events/:id with an
    // id from a different table — the same trap the Delete button carries.
    requiresRsvp: false,
    isInterview: true,
    // Always empty. This calendar entry only ever belongs to the CANDIDATE, and
    // candidates aren't told who is conducting their interview — the API stopped
    // sending a name for this feed (findForCalendar), so there is nothing to
    // badge here. Don't reinstate it from another field.
    participants: [],
  };
}

// One fetch for both calendar variants. Each extra source degrades to [] so a
// 403 (a rushee hitting /meetings/calendar) can't blank the chapter calendar.
async function loadCalendarItems() {
  const [events, meetings, interviews] = await Promise.all([
    getEvents(),
    getCalendarMeetings().catch((err) => { if (isRedirectError(err)) throw err; return []; }),
    getCalendarInterviews().catch((err) => { if (isRedirectError(err)) throw err; return []; }),
  ]);
  return [
    ...(Array.isArray(events) ? events : []),
    ...(Array.isArray(meetings) ? meetings : []).map(asCalendarEntry),
    ...(Array.isArray(interviews) ? interviews : []).map(asInterviewEntry),
  ];
}

// ─── Calendar (all portals) ───

// Roles and committees ADD, matching the API: an event with both reaches
// everyone in those roles AND everyone on those committees. "All Members" is
// only honest when neither is set.
function eventAudienceLabel(audience, committeeIds) {
  const roles = audience?.length ? formatAudience(audience) : null;
  const count = Array.isArray(committeeIds) ? committeeIds.length : 0;
  if (!roles && count === 0) return 'All Members';
  const committees = count === 0 ? null : `${count} committee${count === 1 ? '' : 's'}`;
  return [roles, committees].filter(Boolean).join(' + ');
}

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

// Takes the slot an event's audience badge occupies, since "who's in this" is
// the equivalent question for something with participants. Two names then a
// count — eight would turn a calendar card into a paragraph.
function ParticipantBadge({ names, isInterview, accent }) {
  const shown = names.slice(0, 2).join(', ');
  const extra = names.length - 2;
  const label = names.length === 0
    ? (isInterview ? 'Interview' : 'Meeting')
    : `${isInterview ? 'Interview with' : 'With'} ${shown}${extra > 0 ? ` +${extra}` : ''}`;

  return (
    <span
      className="inline-flex max-w-full items-center gap-1 truncate rounded-sm px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ background: tint(accent.base, 0.12), color: accent.light }}
      title={names.length > 0 ? names.join(', ') : undefined}
    >
      <Users size={9} strokeWidth={2.5} className="shrink-0" />
      <span className="truncate">{label}</span>
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

function RsvpBadge({ myRsvp, accent }) {
  // Three states, and "not answered yet" has to be one of them: a member
  // scanning the calendar needs to see what they still owe an answer on, which
  // a badge that only appears once you have replied cannot show.
  const answered = myRsvp === 'going' || myRsvp === 'not_going';
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold"
      style={answered
        ? { background: tint(accent.base, 0.12), color: accent.light }
        : { background: tint(accent.base, 0.10), borderColor: tint(accent.base, 0.28), color: accent.light }}
      title={answered ? undefined : 'You have not responded yet'}
    >
      <ClipboardCheck size={9} strokeWidth={2.5} />
      {myRsvp === 'going' ? 'Going' : myRsvp === 'not_going' ? "Can't make it" : 'RSVP required'}
    </span>
  );
}

// The member-facing control. Only rendered for real events (never meetings or
// interviews) that asked for an RSVP.
// `compact` is the upcoming-events-list variant: no card of its own, because
// the list row already supplies the border and the highlight. The answering
// logic is shared rather than copied, so the two surfaces cannot disagree
// about what a failed RSVP does.
function RsvpControl({ event, accent, onAnswer, compact = false }) {
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState(null);

  // Read once per mount rather than on every render: reading the clock during
  // render is impure and the React Compiler rejects it (the file's other
  // "now" reads sit inside useMemo for the same reason). Fixing it at mount
  // also stops the control from vanishing mid-tap if the event ends while
  // somebody has the panel open.
  const [openedAt] = useState(() => Date.now());
  const ended = new Date(getEventEndDate(event)).getTime() < openedAt;

  // Once you have answered, the buttons LOCK and a "Change RSVP" link unlocks
  // them. Answering is a decision, and a pair of live buttons under a decision
  // you already made invites the tap that made this look like you could RSVP
  // twice. Unlocking is one deliberate click, so changing your mind is still
  // two taps rather than impossible.
  //
  // Seeded from whether an answer exists rather than defaulting to false, so
  // somebody who has never responded sees ordinary buttons with no extra step.
  const [editing, setEditing] = useState(false);
  const answered = event.myRsvp === 'going' || event.myRsvp === 'not_going';
  const locked = answered && !editing;

  async function answer(status) {
    // Re-pressing the answer you already gave does nothing. The write is an
    // upsert so a repeat was harmless in the database, but it still fired a
    // request per tap and the button gave every appearance of doing something,
    // which is what made it look like you could RSVP more than once.
    //
    // Guarded HERE as well as with `disabled` below, deliberately: the button
    // is only one way in. A double-tap can land both events before React
    // repaints, and this is also the shared entry point for the compact
    // variant. Changing your mind still works — that is the OTHER button, which
    // stays live.
    if (status === event.myRsvp) return;

    setSaving(status);
    setError(null);
    // setEventRsvp returns { error } rather than throwing: a 403 ("not sent to
    // you") and a 409 ("already ended") are both sentences a member has to
    // read, and a thrown server action would surface as React #441 instead.
    const result = await onAnswer(event.id, status);
    if (result?.error) setError(result.error);
    // Back to locked on success, so the buttons do not stay live after the
    // change lands. On failure it stays unlocked -- the answer did not take, so
    // taking the buttons away would leave the error with nothing to act on.
    else setEditing(false);
    setSaving(null);
  }

  if (ended) {
    return (
      <p className={cn('text-[11px] text-muted-foreground', !compact && 'pl-1')}>
        RSVP closed when this event ended
        {event.myRsvp && ` · you said ${event.myRsvp === 'going' ? 'Going' : "Can't make it"}`}
      </p>
    );
  }

  // Built once and rendered by both variants, so the two surfaces cannot
  // disagree about how answering behaves.
  const buttons = (
    <div className={cn('grid grid-cols-2', compact ? 'gap-1.5' : 'gap-2')}>
      {[['going', 'Going'], ['not_going', "Can't make it"]].map(([status, label]) => {
        const selected = event.myRsvp === status;
        return (
          <button
            key={status}
            type="button"
            // BOTH lock once answered; "Change RSVP" below is the way back.
            disabled={saving !== null || locked}
            aria-pressed={selected}
            onClick={() => answer(status)}
            // Fades while SAVING only, never merely because it is selected.
            // This used to be `disabled:opacity-50`, which was correct when the
            // only reason to be disabled was an in-flight request. Now that
            // your current answer is also disabled, that rule would render the
            // answer you chose at half opacity — the one button on screen that
            // should look most definite would look switched off.
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-lg border font-semibold transition-colors',
              compact ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-xs',
              selected ? 'cursor-default text-white' : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
              // Fade only what is genuinely inert. While locked, the answer you
              // chose stays solid and only the OTHER button dims -- fading your
              // own answer would make the most definite thing on screen look
              // switched off.
              (saving !== null || (locked && !selected)) && 'opacity-50',
            )}
            style={selected ? { background: accent.gradient, borderColor: 'transparent' } : undefined}
          >
            {saving === status && <Loader2 size={11} className="animate-spin" />}
            {label}
          </button>
        );
      })}
    </div>
  );

  // The way back out of the lock. Only rendered once an answer exists, so
  // somebody responding for the first time never sees it.
  //
  // A button rather than a link, and it does not touch the network: unlocking
  // is a UI state, and the RSVP is only rewritten when they actually pick an
  // answer. Cancelling therefore costs nothing and changes nothing.
  const changeControl = answered ? (
    <div className={cn('flex items-center gap-3', compact ? 'text-[11px]' : 'text-xs')}>
      <button
        type="button"
        onClick={() => setEditing((open) => !open)}
        disabled={saving !== null}
        className="font-semibold text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground disabled:opacity-50"
      >
        {editing ? 'Keep my answer' : 'Change RSVP'}
      </button>
      {editing && (
        <span className="text-muted-foreground">
          Pick again to update it.
        </span>
      )}
    </div>
  ) : null;

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-foreground">Will you be attending?</p>
          <RsvpBadge myRsvp={event.myRsvp} accent={accent} />
        </div>
        {buttons}
        {changeControl}
        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border p-3"
      style={{ background: tint(accent.base, 0.055), borderColor: tint(accent.base, 0.20) }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-foreground">Will you be attending?</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Let the organizer know your plans.</p>
        </div>
        <RsvpBadge myRsvp={event.myRsvp} accent={accent} />
      </div>
      {buttons}
      {changeControl}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

// Eboard/creator only. Fetches on open rather than reading a count off the
// event: GET /events deliberately omits rsvpSummary, because computing one
// costs a users-table scan per event and this list can be the whole calendar.
// GET /events/:id/rsvps returns the summary and the rows together, so opening
// this is one request and members who never open it pay nothing.
function RsvpListModal({ event, accent, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getEventRsvps(event.id)
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (isRedirectError(err)) throw err; if (!cancelled) setError(err.message ?? 'Could not load RSVPs'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [event.id]);

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const summary = data?.summary;
  const going = (data?.responses ?? []).filter((r) => r.status === 'going');
  const notGoing = (data?.responses ?? []).filter((r) => r.status === 'not_going');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={`RSVPs for ${event.title}`}>
      {/* A backdrop button rather than an onClick on the overlay div: a plain
          div with a handler is not reachable by keyboard and swallows the
          click that should close the dialog. */}
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />

      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RSVPs</p>
            <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-4 gap-2">
                {[
                  ['Going', summary?.going],
                  ["Can't", summary?.notGoing],
                  ['No reply', summary?.pending],
                  ['Invited', summary?.total],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border bg-muted/40 px-2 py-2.5 text-center">
                    <p className="text-lg font-semibold leading-none text-foreground">{value ?? 0}</p>
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>

              {/* "No reply" is a count and never a list. The people who have
                  not answered have no rows to return — they exist only as the
                  difference between the invited total and the answers. */}
              {[['Going', going], ["Can't make it", notGoing]].map(([heading, rows]) => (
                <div key={heading} className="mb-4 last:mb-0">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {heading} <span className="font-normal">({rows.length})</span>
                  </p>
                  {rows.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nobody yet.</p>
                  ) : (
                    <ul className="space-y-1.5" role="list">
                      {rows.map((row) => (
                        <li key={row.userId} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                          <span className="min-w-0 truncate text-sm text-foreground">{row.displayName}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">@{row.username}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, accent, canDelete, onDelete, isFirst, onAnswerRsvp, canSeeRsvps, onViewRsvps }) {
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
        {(event.isMeeting || event.isInterview) && (
          <ParticipantBadge names={event.participants} isInterview={event.isInterview} accent={accent} />
        )}
        {event.requiresAttendance && <AttendanceBadge accent={accent} />}
        {/* Gated on canRsvp too: "RSVP needed" is a demand, and telling
            somebody an answer is needed from them when the API would refuse
            it is worse than saying nothing. */}
        {event.requiresRsvp && event.canRsvp && <RsvpBadge myRsvp={event.myRsvp} accent={accent} />}
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

      {event.requiresRsvp && event.canRsvp && <RsvpControl event={event} accent={accent} onAnswer={onAnswerRsvp} />}

      {/* The organiser still answers for themselves above; this is the extra
          affordance, not a replacement. */}
      {canSeeRsvps && (
        <button
          type="button"
          onClick={() => onViewRsvps(event)}
          className="ml-1 mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Users size={11} /> View RSVPs
        </button>
      )}
    </div>
  );
}

function UpcomingEventsList({ events, accent, onSelect, canSeeRsvps, onViewRsvps, onAnswerRsvp }) {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm xl:h-[36.25rem]" aria-label="Upcoming events">
      <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
        <div className="flex items-center gap-2">
          <CalendarDays size={15} style={{ color: accent.light }} />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming events</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{events.length}</span>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-5 text-center">
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3" role="list">
          {events.map((event) => {
            const startsAt = new Date(getEventStartDate(event));
            const audience = (event.isMeeting || event.isInterview)
              ? null
              : eventAudienceLabel(event.audience, event.committeeIds);
            const type = event.isInterview ? 'Interview' : event.isMeeting ? 'Meeting' : 'Event';
            // Answering lives HERE, not only in the calendar day panel. The
            // panel version is one click behind a date nobody clicks unless
            // they already know something is there, so RSVPs went unanswered
            // simply because nothing asked.
            // canRsvp, not just requiresRsvp: an organiser outside their own
            // event's audience is not a recipient, and drawing the button for
            // them produced a 403 they could do nothing about.
            const canAnswer = Boolean(event.requiresRsvp) && Boolean(event.canRsvp)
              && !event.isMeeting && !event.isInterview;
            const needsAnswer = canAnswer && !event.myRsvp;
            return (
              <li key={event.id}>
                {/* The border/background moved from the button to this
                    wrapper so a second button ("View RSVPs") can sit beside
                    the first as a SIBLING. It cannot go inside: nesting a
                    button within a button is invalid HTML, and browsers
                    recover from it by dropping the inner one. */}
                <div
                  className={cn(
                    'overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-sm',
                    // An unanswered RSVP is the one row here that wants
                    // something FROM the reader, so it is the one row that
                    // looks different. Answered rows go back to the normal
                    // border rather than staying highlighted, or the list
                    // stops reading as a to-do.
                    //
                    // Two shades, measured rather than picked by eye: an
                    // indicator carrying meaning needs 3:1 against its
                    // background. amber-500/40 was 1.36:1 on the light card
                    // and 2.33:1 on the dark one — visible to nobody. Solid
                    // amber-600 is 3.19:1 on white, and amber-500 is 7.94:1
                    // on the dark card, so each theme takes the shade that
                    // works for it. (`dark:` only resolves inside
                    // .portal-dark, which is fine: this component is
                    // portal-only. The public site has no dark mode.)
                    needsAnswer ? 'border-amber-600 dark:border-amber-500' : 'border-border',
                  )}
                >
                <button
                  type="button"
                  onClick={() => onSelect(startsAt)}
                  className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/60"
                >
                  <div className="w-11 shrink-0 rounded-lg bg-muted/60 py-1.5 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {startsAt.toLocaleDateString(undefined, { month: 'short' })}
                    </p>
                    <p className="text-lg font-semibold leading-none text-foreground">{startsAt.getDate()}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={11} className="shrink-0" />
                      <span className="truncate">{startsAt.toLocaleDateString(undefined, { weekday: 'short' })} · {formatEventTimeRange(getEventStartDate(event), getEventEndDate(event))}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin size={11} className="shrink-0" />
                      <span className="truncate">{event.location || 'Location TBD'}</span>
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {audience && <AudienceBadge audience={audience} accent={accent} />}
                      {(event.isMeeting || event.isInterview) && (
                        <ParticipantBadge names={event.participants ?? []} isInterview={event.isInterview} accent={accent} />
                      )}
                      {event.requiresAttendance && <AttendanceBadge accent={accent} />}
                      {/* Badge only, no buttons: each row here is already a
                          <button> that opens the day, and nesting a button
                          inside one is invalid HTML. Answering happens on the
                          card in the day panel. */}
                      {event.requiresRsvp && event.canRsvp && <RsvpBadge myRsvp={event.myRsvp ?? null} accent={accent} />}
                      <span className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{type}</span>
                    </div>
                    {event.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{event.description}</p>}
                  </div>
                </button>
                {(canAnswer || canSeeRsvps(event)) && (
                  <div
                    className={cn(
                      'space-y-2 border-t px-3 py-2.5',
                      // The tint stays a low-contrast wash on purpose — it is
                      // decoration, and the text on top of it is a theme token
                      // (12.6:1 dark, 18.9:1 light), not amber.
                      needsAnswer ? 'border-amber-600 bg-amber-500/[0.07] dark:border-amber-500' : 'border-border',
                    )}
                  >
                    {canAnswer && (
                      <RsvpControl compact event={event} accent={accent} onAnswer={onAnswerRsvp} />
                    )}
                    {canSeeRsvps(event) && (
                      <button
                        type="button"
                        onClick={() => onViewRsvps(event)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Users size={11} /> View RSVPs
                      </button>
                    )}
                  </div>
                )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
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
  const accent = PALETTES[accentKey] ?? PALETTES.blue;
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
  // The event whose RSVP list is open, from either surface. Holds the whole
  // object rather than an id so the modal can title itself without a lookup.
  const [rsvpListEvent, setRsvpListEvent] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    loadCalendarItems()
      .then(setRawEvents)
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

  // Who may open the RSVP list. Mirrors the API's own rule (eboard OR the
  // event's creator) — deliberately NARROWER than attendance, which also
  // allows any chair, because these rows name individuals.
  //
  // Reads creatorId ?? createdBy because this runs against BOTH shapes: the
  // day panel passes the mapped card object (creatorId) while the upcoming
  // list passes the raw API event (createdBy). Excludes meetings and
  // interviews for the same reason Delete does — their ids belong to other
  // tables, so the request would hit the wrong row.
  const canSeeRsvps = (ev) => Boolean(ev.requiresRsvp)
    && !ev.isMeeting && !ev.isInterview
    && (isEboard || (!!currentUserId && (ev.creatorId ?? ev.createdBy) === currentUserId));

  // Returns { error } to the control rather than throwing, so a 403 or 409
  // lands beside the buttons. Only writes local state on success, which means
  // a rejected answer leaves the previous one showing instead of a button that
  // looks selected but was never saved.
  async function handleAnswerRsvp(id, status) {
    const result = await setEventRsvp(id, status);
    if (result?.error) return result;
    setRawEvents((prev) => prev.map((e) => (String(e.id) === String(id) ? { ...e, myRsvp: result.status } : e)));
    // The sidebar badge lives in PortalShell, a layout in a different React
    // tree, so there is no shared state to update. Without this the count
    // would sit stale for up to a poll interval after the member answered —
    // and a badge that lingers after you have done the thing is worse than no
    // badge at all.
    announceRsvpChange();
    return result;
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
        // Only real events have an audience. formatAudience(null) returns "All
        // Members", which badged every private 1-on-1 as visible to everyone.
        //
        // Committees have to be folded in here, not just the roles. This read
        // `formatAudience(event.audience)` alone, so an event targeted ONLY at a
        // committee has a null audience and was badged **"All Members"** — the
        // exact opposite of who could actually see it. Restricting an event to
        // one committee and having the card announce it to the whole chapter is
        // the kind of wrong that gets believed.
        //
        // Counted rather than named: this component never fetches the committee
        // list, and adding a request on every portal to label a badge is a worse
        // trade than saying "1 committee". The word also trips AudienceBadge's
        // existing icon check, so it picks up the committee glyph for free.
        audience: (event.isMeeting || event.isInterview)
          ? null
          : eventAudienceLabel(event.audience, event.committeeIds),
        participants: Array.isArray(event.participants) ? event.participants : [],
        requiresAttendance: event.requiresAttendance,
        requiresRsvp: Boolean(event.requiresRsvp),
        // Whether the API will actually accept an RSVP from this viewer.
        // Distinct from requiresRsvp: seeing an event and being sent one are
        // different questions. An organiser who targets an event at a group
        // they are not in can see it and is not a recipient, so the button
        // must not be drawn for them — it used to be, and answered 403.
        canRsvp: Boolean(event.canRsvp),
        myRsvp: event.myRsvp ?? null,
        // The control needs the real end time to know RSVP has closed, and
        // `timeRange` above is a formatted string, not a date.
        startDate: event.startDate,
        endDate: event.endDate,
        creatorId: event.createdBy,
        isMeeting: Boolean(event.isMeeting),
        isInterview: Boolean(event.isInterview),
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

  // Never for a meeting or interview — a Delete here would hit /events/:id
  // with an id from a different table. They're removed from their own tabs.
  const canDeleteEvent = (ev) => !ev.isMeeting && !ev.isInterview
    && (isEboard || (!!currentUserId && ev.creatorId === currentUserId));

  const monthEventCount = useMemo(() => {
    return Object.entries(eventsByDate).reduce((sum, [key, evs]) => {
      const [y, m] = key.split('-').map(Number);
      return y === viewYear && m === viewMonth + 1 ? sum + evs.length : sum;
    }, 0);
  }, [eventsByDate, viewYear, viewMonth]);

  // Six compact rows fill the month card without turning the companion panel
  // into a second, independently scrolling calendar. Meetings and interviews
  // are included because `rawEvents` is the merged calendar source.
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return rawEvents
      .filter((event) => {
        const start = getEventStartDate(event);
        const end = getEventEndDate(event) ?? getEventStartDate(event);
        return start && end && new Date(end) >= now;
      })
      .sort((a, b) => new Date(getEventStartDate(a)) - new Date(getEventStartDate(b)))
      .slice(0, 6);
  }, [rawEvents]);

  function selectUpcomingEvent(date) {
    setViewYear(date.getFullYear());
    setViewMonth(date.getMonth());
    setSelectedDate(localDateKey(date));
    setPanelOpen(true);
  }

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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-stretch">
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

      <UpcomingEventsList
        events={upcomingEvents}
        accent={accent}
        onSelect={selectUpcomingEvent}
        canSeeRsvps={canSeeRsvps}
        onViewRsvps={setRsvpListEvent}
        onAnswerRsvp={handleAnswerRsvp}
      />
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
                <EventCard
                  key={ev.id}
                  event={ev}
                  accent={accent}
                  canDelete={canDeleteEvent(ev)}
                  onDelete={handleDelete}
                  isFirst={i === 0}
                  onAnswerRsvp={handleAnswerRsvp}
                  canSeeRsvps={canSeeRsvps(ev)}
                  onViewRsvps={setRsvpListEvent}
                />
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

      {rsvpListEvent && (
        <RsvpListModal event={rsvpListEvent} accent={accent} onClose={() => setRsvpListEvent(null)} />
      )}
    </div>
  );
}

// Every portal passes blue, amber or red, so the pre-revamp variant this used
// to fall back to was unreachable and has been deleted. An unrecognised accent
// now renders with the blue palette (see the PALETTES lookup), which beats
// maintaining a second copy of the whole UI — two copies is what let the
// CircleCheck/BlockButton fix keep disappearing from one of them.
export default function EventsCalendar({ title, description, accent }) {
  return <RevampedEventsCalendar title={title} description={description} accentKey={accent} />;
}
