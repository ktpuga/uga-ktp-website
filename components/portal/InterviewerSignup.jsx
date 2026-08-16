'use client';

import { useState } from 'react';
import {
  AlertTriangle, Calendar, Check, Clock, Loader2, MapPin, Users, X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { signUpAsInterviewer, withdrawInterviewer } from '@/lib/portal-api';
import { memberDisplayName, memberInitials } from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useInterviewerRounds } from '@/lib/use-interviewer-rounds';

// Deliberately a DIFFERENT component from InterviewScheduleManager rather than
// that one with an `isEboard` prop. The layouts look alike, but the two pages
// answer different questions — "run this round" versus "which of these am I
// covering" — and every editing affordance would need its own guard. A shared
// component with a read-only mode is how a member ends up one boolean away from
// deleting a slot; see the portal-duplication notes in ktp-docs for the reverse
// mistake, and note that the genuinely shared part (the API, the rules) is
// shared, while only the presentation is not.

const dayLabel = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
const timeLabel = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// Groups a round's slots by calendar day. The API already orders by start time,
// so this only has to notice when the day changes.
function groupByDay(slots) {
  const days = [];
  for (const slot of slots ?? []) {
    const start = new Date(slot.startDate);
    if (Number.isNaN(start.getTime())) continue;
    const key = start.toDateString();
    if (days[days.length - 1]?.key !== key) days.push({ key, label: dayLabel(start), slots: [] });
    days[days.length - 1].slots.push(slot);
  }
  return days;
}

export default function InterviewerSignup() {
  const accent = useAccentPalette();
  const confirm = useConfirm();
  const { data: session } = useSession();
  const { rounds, loading, reload } = useInterviewerRounds();
  const [error, setError] = useState('');
  const [busySlotId, setBusySlotId] = useState(null);

  // The withdraw route is addressed by user id, and it must be OUR id. Taking it
  // from the session rather than from the slot's interviewer list: picking an id
  // out of that list would silently address whoever happened to be first, which
  // a plain member survives only because the API 403s them — an eboard member
  // would successfully remove the wrong person.
  const myId = session?.user?.authentik_id ?? null;

  // Per-slot rather than a page-wide flag: on signup night several people are
  // clicking, and disabling the whole board because one row is in flight makes
  // the page feel broken.
  async function claim(slot) {
    setBusySlotId(slot.id);
    setError('');
    try {
      const result = await signUpAsInterviewer(slot.id);
      // Returns { error } rather than throwing — see lib/portal-api.js. Both
      // 409s here are messages the member has to read, and a thrown Server
      // Action error is redacted to React #441 in production.
      if (result.error) setError(result.error);
      else await reload();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not sign up for that slot.');
    } finally {
      setBusySlotId(null);
    }
  }

  async function withdraw(slot) {
    if (!myId) return;
    if (!(await confirm(
      `Give up the ${timeLabel(new Date(slot.startDate))} slot? Someone else will be able to take it.`,
      { title: 'Withdraw from this interview?', confirmLabel: 'Withdraw' },
    ))) return;

    setBusySlotId(slot.id);
    setError('');
    try {
      const result = await withdrawInterviewer(slot.id, myId);
      // withdrawInterviewer returns { ok } / { error } — see lib/portal-api.js.
      if (result.ok) await reload();
      else setError(result.error);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not withdraw from that slot.');
    } finally {
      setBusySlotId(null);
    }
  }

  const totalMine = rounds.reduce(
    (n, round) => n + (round.slots ?? []).filter((s) => s.i_am_interviewing).length,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>Rush</p>
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: accent.base }}>Interviews</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Pick the interview slots you can cover. Eboard sets the times and how many
          interviewers each one needs. Claim the ones that work for you, and you&apos;ll
          see who you&apos;re interviewing.
        </p>
        {totalMine > 0 && (
          <p className="mt-2 text-sm font-semibold text-foreground">
            You&apos;re covering {totalMine} {totalMine === 1 ? 'slot' : 'slots'}.
          </p>
        )}
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm text-muted-foreground">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : rounds.length === 0 ? (
        // Reachable: the nav entry is driven by this same list, but a round can
        // be unpublished or its committee changed while the page is open.
        <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
          <Calendar size={22} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No interview rounds are open to you right now.</p>
          <p className="max-w-sm text-xs text-muted-foreground/80">
            Eboard chooses which committees can sign up for each round. If you expected
            to see one, ask them to add your committee to it.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {rounds.map((round) => (
            <RoundCard
              key={round.id}
              round={round}
              accent={accent}
              busySlotId={busySlotId}
              canWithdraw={Boolean(myId)}
              onClaim={claim}
              onWithdraw={withdraw}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoundCard({ round, accent, busySlotId, canWithdraw, onClaim, onWithdraw }) {
  const days = groupByDay(round.slots);
  const mine = (round.slots ?? []).filter((s) => s.i_am_interviewing).length;

  return (
    <div>
      <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground sm:text-xl">{round.title}</h2>
              {round.location && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin size={11} /> {round.location}
                </p>
              )}
            </div>
            {mine > 0 && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                {mine} {mine === 1 ? 'slot' : 'slots'} yours
              </span>
            )}
          </div>
          {round.description && (
            <p className="mt-2 max-w-2xl whitespace-pre-line text-xs text-muted-foreground">{round.description}</p>
          )}
        </div>
      </div>

      {days.length === 0 ? (
        <div className="flex h-28 items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card text-sm text-muted-foreground">
          <Clock size={16} /> No times posted yet.
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <div key={day.key}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day.label}</p>
              <div className="space-y-2">
                {day.slots.map((slot) => (
                  <InterviewerSlotRow
                    key={slot.id}
                    slot={slot}
                    accent={accent}
                    busy={busySlotId === slot.id}
                    canWithdraw={canWithdraw}
                    onClaim={() => onClaim(slot)}
                    onWithdraw={() => onWithdraw(slot)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InterviewerSlotRow({ slot, accent, busy, canWithdraw, onClaim, onWithdraw }) {
  const interviewers = slot.interviewers ?? [];
  const spotsLeft = Math.max(0, slot.interviewer_capacity - interviewers.length);
  const mine = slot.i_am_interviewing;

  // The API is the authority on all of this; these only decide what to render.
  // A slot with nobody booked is still worth covering — rushees may book it
  // after you sign up — so an empty slot is claimable, not disabled.
  const full = spotsLeft === 0 && !mine;

  return (
    <div className={cn(
      'rounded-xl border bg-card px-4 py-3',
      mine ? 'border-emerald-300 dark:border-emerald-800' : 'border-border',
    )}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            {timeLabel(new Date(slot.startDate))} – {timeLabel(new Date(slot.endDate))}
            {mine && (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                You&apos;re interviewing
              </span>
            )}
          </p>
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users size={9} /> {interviewers.length} of {slot.interviewer_capacity} interviewer
              {slot.interviewer_capacity === 1 ? '' : 's'}
              {spotsLeft > 0 ? ` · ${spotsLeft} open` : ' · covered'}
            </span>
            {slot.location && <span className="flex items-center gap-1"><MapPin size={9} /> {slot.location}</span>}
          </p>
        </div>

        {mine ? (
          <button
            type="button"
            onClick={onWithdraw}
            disabled={busy || !canWithdraw}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40"
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Withdraw
          </button>
        ) : (
          <button
            type="button"
            onClick={onClaim}
            // Only this row's own request disables it; `anyBusy` would freeze the
            // whole board while one row saves.
            disabled={busy || full}
            title={full ? 'This slot already has all the interviewers it needs' : undefined}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-40',
              full ? 'border border-border text-muted-foreground' : 'text-white',
            )}
            style={full ? undefined : { background: accent.gradient }}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            {full ? 'Covered' : 'Sign up'}
          </button>
        )}
      </div>

      {interviewers.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Interviewing</span>
          {interviewers.map((interviewer) => (
            <span key={interviewer.id} className="rounded-full border border-border bg-muted/40 px-2 py-1 text-[11px] font-medium text-foreground">
              {memberDisplayName(interviewer)}
            </span>
          ))}
        </div>
      )}

      {/* The rushees this slot is for. Eboard chose to show these — an
          interviewer needs to know who they're meeting. */}
      {(slot.bookings?.length ?? 0) > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border pt-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Rushee{slot.bookings.length === 1 ? '' : 's'}
          </span>
          {slot.bookings.map((booking) => (
            <span key={booking.booking_id} className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1 pl-1 pr-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold text-white" style={{ background: accent.gradient }}>
                {memberInitials(booking)}
              </span>
              <span className="text-[11px] font-medium text-foreground">{memberDisplayName(booking)}</span>
            </span>
          ))}
        </div>
      )}

      {slot.booked_count === 0 && (
        <p className="mt-2 text-[10px] text-muted-foreground/80">
          No rushees have booked this time yet.
        </p>
      )}
    </div>
  );
}
