'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Search, X, Star, Users, MessageSquare, Calendar, CalendarPlus, QrCode, ClipboardCheck, LogIn, LogOut, UserPlus, UserMinus, Clock, AlertTriangle, MapPin, CalendarDays, FolderOpen,
} from 'lucide-react';
import {
  getCommittees,
  createCommittee,
  deleteCommittee,
  joinCommittee,
  leaveCommittee,
  getCommitteeJoinRequests,
  approveCommitteeJoinRequest,
  denyCommitteeJoinRequest,
  removeCommitteeMember,
  getCommitteeMembers,
  getCommitteeActivity,
  markCommitteeSeen,
  setCommitteeMemberRole,
  getMemberDirectory,
  createEvent,
  getDocumentFolders,
  getEvents,
} from '@/lib/portal-api';
import { memberDisplayName, memberInitials, formatMemberGroup } from '@/lib/portal-format';
import { profilePictureSrc, avatarAssetId } from '@/lib/avatar';
import { isRedirectError } from '@/lib/is-redirect-error';
import { TEXT_LIMITS } from '@/lib/text-limits';
import { NewMeetingModal } from './MeetingsPage';
import { PALETTES } from '@/components/portal/PortalAccentContext';

// Palette comes from PortalAccentContext, the single source of truth. Each of
// these files used to carry its own ACCENT_THEMES copy; they had already
// drifted (MemberDirectory was missing 'red' entirely, and every copy still
// had a real teal that nothing rendered — pledge passes 'blue').

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// ─── Shared: Avatar ───

function Avatar({ member, size = 36, accent }) {
  const [err, setErr] = useState(false);
  const userId = member?.authentik_id ?? member?.id;
  // Guarding on the built src, not just on `err`. profilePictureSrc returns null
  // when there is no user id, and React drops a null src attribute entirely —
  // so onError never fires and the row would hold an empty circle forever
  // instead of falling through to the initials below.
  const src = profilePictureSrc(userId, avatarAssetId(member));
  return (
    <div className="relative shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }} aria-hidden="true">
      {src && !err ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <div
          className="flex h-full w-full select-none items-center justify-center font-semibold text-white"
          style={{ background: accent.gradient, fontSize: size * 0.37 }}
        >
          {memberInitials(member)}
        </div>
      )}
    </div>
  );
}

// ─── Shared: modal primitives ───

function ModalWrapper({ children, onClose, label, maxWidth = 'max-w-sm' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className={cn('relative z-10 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl', maxWidth)}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ accent, title, icon, onClose }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(accent.base, 0.03) }}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: accent.gradient }}>
          {icon}
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
        <X size={14} />
      </button>
    </div>
  );
}

function ModalFooter({ accent, onClose, onConfirm, confirmLabel, disabled, confirmDanger }) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className={cn(
          'rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40',
          confirmDanger && 'bg-destructive hover:bg-destructive/90'
        )}
        style={!confirmDanger ? { background: accent.gradient } : undefined}
      >
        {confirmLabel}
      </button>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function inputClass() {
  return 'w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2';
}

function focusOn(accent) {
  return (e) => { e.currentTarget.style.borderColor = tint(accent.base, 0.4); };
}
function focusOff() {
  return (e) => { e.currentTarget.style.borderColor = ''; };
}

// ─── New Committee Modal ───

function NewCommitteeModal({ accent, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const committee = await createCommittee(trimmed);
      onCreated(committee);
      onClose();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to create committee');
      setSubmitting(false);
    }
  }

  return (
    <ModalWrapper onClose={onClose} label="New committee">
      <ModalHeader accent={accent} title="New Committee" icon={<Users size={14} strokeWidth={1.75} />} onClose={onClose} />
      <div className="space-y-3 p-5">
        <FormField label="Committee Name">
          <input
            autoFocus
            type="text"
            maxLength={TEXT_LIMITS.NAME}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) handleCreate(); }}
            placeholder="e.g. Professional Development"
            className={inputClass()}
            onFocus={focusOn(accent)}
            onBlur={focusOff()}
          />
        </FormField>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <ModalFooter accent={accent} onClose={onClose} onConfirm={handleCreate} confirmLabel={submitting ? 'Creating...' : 'Create Committee'} disabled={!name.trim() || submitting} />
    </ModalWrapper>
  );
}

// ─── Delete Confirm Modal ───

function DeleteConfirmModal({ committeeName, accent, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to delete committee');
      setDeleting(false);
    }
  }

  return (
    <ModalWrapper onClose={onClose} label="Confirm delete">
      <div className="p-6">
        <div className="mb-1 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle size={18} className="text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Delete &ldquo;{committeeName}&rdquo;?</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              This will permanently delete the committee and its linked group chat. All members will be removed from the chat automatically. This cannot be undone.
            </p>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
      <ModalFooter accent={accent} onClose={onClose} onConfirm={handleConfirm} confirmLabel={deleting ? 'Deleting...' : 'Delete Committee'} disabled={deleting} confirmDanger />
    </ModalWrapper>
  );
}

// ─── Schedule Event Modal ───
//
// This creates an *event* — a calendar entry for the committee, optionally
// with QR check-in attendance. Its sibling button opens `NewMeetingModal`
// instead, which creates a *meeting*: an RSVP request, no calendar entry, no
// attendance. The two used to be one ambiguous "Schedule Meeting" button.

// requiresAttendance defaults ON here (unlike the eboard form) because a
// committee scheduling its own meeting is nearly always taking attendance.
// requiresRsvp defaults OFF: a small committee already knows who is coming,
// and an unasked-for RSVP prompt on every meeting is noise.
const EMPTY_EVENT_FORM = { title: '', description: '', location: '', start: '', end: '', requiresAttendance: true, requiresRsvp: false };

function ScheduleEventModal({ committeeId, committeeName, accent, onClose, onScheduled }) {
  const [form, setForm] = useState(EMPTY_EVENT_FORM);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setError(null);
    const startDate = new Date(form.start);
    const endDate = new Date(form.end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError('Enter a valid start and end time.');
      return;
    }
    if (endDate <= startDate) {
      setError('End time must be after start time.');
      return;
    }

    setSaving(true);
    try {
      const result = await createEvent({
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        committeeIds: [committeeId],
        requiresAttendance: form.requiresAttendance,
        requiresRsvp: form.requiresRsvp,
      });

      if (!result?.ok) {
        setError(result?.error ?? 'Failed to schedule event.');
        setSaving(false);
        return;
      }

      onScheduled();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Failed to schedule event.');
      setSaving(false);
    }
  }

  const valid = form.title.trim() && form.start && form.end;
  const fieldClass = inputClass();

  return (
    <ModalWrapper onClose={onClose} label="Schedule event" maxWidth="max-w-lg">
      <ModalHeader accent={accent} title={`Schedule Event for ${committeeName}`} icon={<CalendarPlus size={14} strokeWidth={1.75} />} onClose={onClose} />
      <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
        <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          Goes on the calendar for everyone on <span className="font-medium text-foreground">{committeeName}</span>, no RSVP. Use <span className="font-medium text-foreground">New Meeting</span> instead if you want people to accept or decline.
        </p>

        <FormField label="Title">
          <input
            autoFocus
            type="text"
            maxLength={TEXT_LIMITS.TITLE}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Weekly Sync"
            className={fieldClass}
            onFocus={focusOn(accent)}
            onBlur={focusOff()}
          />
        </FormField>

        <FormField label="Description (optional)">
          <textarea
            rows={2}
            maxLength={TEXT_LIMITS.DESCRIPTION}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What's on the agenda?"
            className={cn(fieldClass, 'resize-y')}
            onFocus={focusOn(accent)}
            onBlur={focusOff()}
          />
        </FormField>

        <FormField label="Location (optional)">
          <div className="relative">
            <MapPin size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              maxLength={TEXT_LIMITS.LOCATION}
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Engineering Library 204 or Zoom"
              className={cn(fieldClass, 'pl-8')}
              onFocus={focusOn(accent)}
              onBlur={focusOff()}
            />
          </div>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start">
            <input type="datetime-local" value={form.start} onChange={(e) => set('start', e.target.value)} className={fieldClass} onFocus={focusOn(accent)} onBlur={focusOff()} />
          </FormField>
          <FormField label="End">
            <input type="datetime-local" value={form.end} onChange={(e) => set('end', e.target.value)} className={fieldClass} onFocus={focusOn(accent)} onBlur={focusOff()} />
          </FormField>
        </div>

        {/* Defaults on: taking attendance is the reason to make an event
            rather than a meeting. Same control as /admin/announcements. */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted/60">
          <input
            type="checkbox"
            checked={form.requiresAttendance}
            onChange={(e) => set('requiresAttendance', e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
            style={{ accentColor: accent.base }}
          />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <QrCode size={13} style={{ color: accent.light }} />
              Track attendance for this event (QR check-in)
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              A check-in code appears under the Attendance tab once it&apos;s created.
            </p>
          </div>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted/60">
          <input
            type="checkbox"
            checked={form.requiresRsvp}
            onChange={(e) => set('requiresRsvp', e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
            style={{ accentColor: accent.base }}
          />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <ClipboardCheck size={13} style={{ color: accent.light }} />
              Ask members to RSVP
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Committee members answer Going or Can&apos;t make it beforehand. Separate from attendance.
            </p>
          </div>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <ModalFooter accent={accent} onClose={onClose} onConfirm={handleSubmit} confirmLabel={saving ? 'Scheduling...' : 'Create Event'} disabled={!valid || saving} />
    </ModalWrapper>
  );
}

// ─── Promote from non-members picker ───

function PromoteMemberModal({ committeeName, excludeIds, accent, onClose, onPromote }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    getMemberDirectory()
      .then(setMembers)
      .catch((err) => { if (isRedirectError(err)) throw err; })
      .finally(() => setLoading(false));
  }, []);

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

  const filtered = useMemo(() => {
    const nonMembers = members.filter((m) => !excludeSet.has(m.id));
    const q = query.trim().toLowerCase();
    if (!q) return nonMembers.slice(0, 30);
    return nonMembers
      .filter((m) => memberDisplayName(m).toLowerCase().includes(q) || (m.username ?? '').toLowerCase().includes(q))
      .slice(0, 30);
  }, [members, excludeSet, query]);

  return (
    <ModalWrapper onClose={onClose} label="Promote a member to chair">
      <ModalHeader accent={accent} title="Promote to Chair" icon={<Star size={14} strokeWidth={1.75} />} onClose={onClose} />
      <div className="px-4 py-3">
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Picking someone below will make them a chair of <span className="font-semibold text-foreground">{committeeName}</span>, and automatically join them to the committee and its group chat.
        </p>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members…"
            className={cn(inputClass(), 'pl-8')}
            onFocus={focusOn(accent)}
            onBlur={focusOff()}
          />
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto border-t border-border">
        {loading ? (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">No members found</p>
        ) : (
          filtered.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { onPromote(m.id); onClose(); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/60"
            >
              <Avatar member={m} size={32} accent={accent} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{memberDisplayName(m)}</p>
                <p className="text-[11px] text-muted-foreground">@{m.username}</p>
              </div>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white" style={{ background: accent.gradient }}>
                Make Chair
              </span>
            </button>
          ))
        )}
      </div>
    </ModalWrapper>
  );
}

// ─── Committee card ───

function CommitteeCard({ committee, isEboard, accent, activity, onOpen, onDelete }) {
  // Two counts, never summed here. "3 new" is reading material; "2 requests" is
  // somebody blocked on you. Collapsing them into one number would make an
  // approval queue look like news, and news look urgent. Only the sidebar badge
  // adds them, because there the question is just "is there anything for me".
  const newCount = activity?.new_count ?? 0;
  const pendingCount = activity?.pending_count ?? 0;

  return (
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      aria-label={`Open ${committee.name}`}
    >
      <div className="h-1 w-full" style={{ background: accent.gradient }} aria-hidden="true" />

      <div className="flex flex-1 flex-col px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold leading-snug text-foreground">{committee.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {committee.member_count} member{committee.member_count === 1 ? '' : 's'}
            </p>
          </div>

          {isEboard && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              aria-label={`Delete ${committee.name}`}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {committee.is_chair && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: accent.gradient }}>
              <Star size={9} strokeWidth={2.5} />
              Chair
            </span>
          )}
          {committee.is_member && !committee.is_chair && (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: tint(accent.base, 0.1), color: accent.light }}>
              Member
            </span>
          )}
          {newCount > 0 && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
              style={{ background: accent.gradient }}
            >
              {newCount > 99 ? '99+' : newCount} new
            </span>
          )}
          {/* Deliberately NOT the accent colour the "new" pill uses: this one is
              a queue of people waiting on this person, and it has to be
              distinguishable at a glance from "there are things to read". */}
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              <Clock size={9} strokeWidth={2.5} />
              {pendingCount > 99 ? '99+' : pendingCount} request{pendingCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Committee detail view ───

// Exported for the render probe. A green next build says nothing about a
// client component: it never renders one. This is the only surface where the
// approval queue's visibility rules can actually be checked.
export function CommitteeDetail({ committee, currentUserId, isEboard, accent, onBack, onChanged, groupChatHref, filesHref }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [showPromotePicker, setShowPromotePicker] = useState(false);
  const [sharedFolder, setSharedFolder] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  // Matches checkEventPermission in ktp-api's eventsController: eboard may
  // schedule for any committee, a chair only for one they chair.
  const canSchedule = committee.is_chair || isEboard;
  // Regular members can browse the roster before joining, but committee-only
  // content must not be rendered or fetched until they belong to that
  // committee. Eboard retains its existing oversight access.
  const canViewCommitteeWorkspace = committee.is_member || isEboard;

  // Mirrors committeesController.loadAdministrable: eboard, or the chair of
  // THIS committee. Not "is a chair" generally — the Marketing chair has no
  // business in the Pledge queue, and the API enforces that independently.
  const canAdminister = isEboard || committee.is_chair;

  const [requests, setRequests] = useState([]);
  const [requestsError, setRequestsError] = useState(null);
  const [requestBusyId, setRequestBusyId] = useState(null);

  const loadRequests = useCallback(async () => {
    if (!canAdminister) return;
    const result = await getCommitteeJoinRequests(committee.id);
    if (result?.error) {
      setRequestsError(result.error);
      return;
    }
    setRequestsError(null);
    setRequests(result.requests ?? []);
  }, [canAdminister, committee.id]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  async function handleApprove(userId) {
    setRequestBusyId(userId);
    try {
      const result = await approveCommitteeJoinRequest(committee.id, userId);
      if (result?.error) {
        setRequestsError(result.error);
        // Reload anyway: the usual cause is another chair having just handled
        // it, so the stale row should disappear rather than sit there inviting
        // a second click.
        loadRequests();
        return;
      }
      setRequestsError(null);
      loadRequests();
      loadMembers();
      onChanged();
    } finally {
      setRequestBusyId(null);
    }
  }

  async function handleDeny(userId) {
    setRequestBusyId(userId);
    try {
      const result = await denyCommitteeJoinRequest(committee.id, userId);
      if (result?.error) setRequestsError(result.error);
      else setRequestsError(null);
      loadRequests();
    } finally {
      setRequestBusyId(null);
    }
  }

  async function handleRemoveMember(userId) {
    const person = members.find((m) => m.authentik_id === userId);
    const name = person ? memberDisplayName(person) : 'this member';
    // Removal also drops them from the committee group chat, which is not
    // guessable from a button labelled "remove" — so the confirm says it.
    if (!window.confirm(`Remove ${name} from ${committee.name}? They will also lose access to the committee group chat and anything restricted to this committee.`)) return;

    setRequestBusyId(userId);
    try {
      const result = await removeCommitteeMember(committee.id, userId);
      if (result?.error) {
        window.alert(result.error);
        return;
      }
      loadMembers();
      onChanged();
    } finally {
      setRequestBusyId(null);
    }
  }

  function loadMembers() {
    setLoading(true);
    getCommitteeMembers(committee.id)
      .then(setMembers)
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setError(err.message ?? 'Could not load members');
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadMembers, [committee.id]);

  // Folder responses already include the committee_ids used for their
  // visibility rule. Use that relationship rather than a name convention: a
  // folder may be renamed or moved without breaking its committee's Shared
  // Files link. The document library is nested, so search its visible tree.
  useEffect(() => {
    if (!canViewCommitteeWorkspace) {
      return undefined;
    }

    let cancelled = false;

    async function findCommitteeFolder(parentId = null) {
      const folders = await getDocumentFolders(parentId);
      const visibleFolders = Array.isArray(folders) ? folders : [];
      const matchingFolder = visibleFolders.find(
        (folder) => (folder.committee_ids ?? []).map(String).includes(String(committee.id))
      );
      if (matchingFolder) return matchingFolder;

      const childMatches = await Promise.all(
        visibleFolders.map((folder) => findCommitteeFolder(folder.id))
      );
      return childMatches.find(Boolean) ?? null;
    }

    findCommitteeFolder()
      .then((folder) => {
        if (cancelled) return;
        setSharedFolder(folder);
      })
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        if (!cancelled) setSharedFolder(null);
      });

    return () => { cancelled = true; };
  }, [canViewCommitteeWorkspace, committee.id]);

  const loadUpcomingEvents = useCallback(async () => {
    if (!canViewCommitteeWorkspace) {
      setUpcomingEvents([]);
      setEventsError(null);
      setEventsLoading(false);
      return;
    }
    setEventsLoading(true);
    setEventsError(null);
    try {
      const events = await getEvents();
      const now = new Date();
      setUpcomingEvents(
        (Array.isArray(events) ? events : [])
          .filter((event) => (event.committeeIds ?? []).map(String).includes(String(committee.id)))
          .filter((event) => new Date(event.endDate) >= now)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 3)
      );
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setEventsError(err.message ?? 'Could not load committee events');
    } finally {
      setEventsLoading(false);
    }
  }, [canViewCommitteeWorkspace, committee.id]);

  useEffect(() => { loadUpcomingEvents(); }, [loadUpcomingEvents]);

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.role === 'chair' && b.role !== 'chair') return -1;
      if (a.role !== 'chair' && b.role === 'chair') return 1;
      return memberDisplayName(a).localeCompare(memberDisplayName(b));
    });
  }, [members]);

  // Asks to join. The API returns 202 and grants nothing until a chair or
  // eboard approves, so this deliberately does NOT say "joined" on success —
  // telling someone they are in a committee they cannot yet see anything in is
  // worse than telling them nothing.
  async function handleJoin() {
    setBusy(true);
    try {
      await joinCommittee(committee.id);
      onChanged();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to request to join committee');
    } finally {
      setBusy(false);
    }
  }

  async function handleWithdraw() {
    setBusy(true);
    try {
      const result = await denyCommitteeJoinRequest(committee.id, myId);
      if (result?.error) {
        window.alert(result.error);
        return;
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    setBusy(true);
    try {
      await leaveCommittee(committee.id);
      loadMembers();
      onChanged();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to leave committee');
    } finally {
      setBusy(false);
    }
  }

  async function handleSetRole(userId, role) {
    try {
      await setCommitteeMemberRole(committee.id, userId, role);
      loadMembers();
      onChanged();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to update role');
    }
  }

  async function handleSchedule() {
    setShowSchedule(false);
    await loadUpcomingEvents();
    onChanged();
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Back to committees"
        >
          <ChevronLeft size={15} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-2xl font-normal leading-tight text-foreground">{committee.name}</h2>
          <p className="text-xs text-muted-foreground">
            {members.length} member{members.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {committee.is_member && committee.group_chat_id && (
          <Link
            href={groupChatHref}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
          >
            <MessageSquare size={15} style={{ color: accent.light }} />
            Group Chat
          </Link>
        )}

        {/* Two deliberately separate paths. A meeting asks people to RSVP and
            never touches the calendar; an event is a calendar entry that can
            take attendance. One combined button made the choice invisible. */}
        {canSchedule && (
          <>
            <button
              type="button"
              onClick={() => setShowMeeting(true)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              <Calendar size={15} style={{ color: accent.light }} />
              New Meeting
            </button>

            <button
              type="button"
              onClick={() => setShowSchedule(true)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              <CalendarPlus size={15} style={{ color: accent.light }} />
              Schedule Event
            </button>
          </>
        )}

        {committee.is_member ? (
          <button
            type="button"
            onClick={handleLeave}
            disabled={busy}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          >
            <LogOut size={15} />
            Leave Committee
          </button>
        ) : committee.has_requested ? (
          // Pending. The button becomes the way to take the request back, so
          // there is no separate "cancel" control to find, and the label states
          // the actual state rather than re-offering an action already taken.
          <button
            type="button"
            onClick={handleWithdraw}
            disabled={busy}
            className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            title="Withdraw your request"
          >
            <Clock size={15} />
            Requested, withdraw
          </button>
        ) : (
          <button
            type="button"
            onClick={handleJoin}
            disabled={busy}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: accent.gradient }}
          >
            <LogIn size={15} />
            Request to Join
          </button>
        )}

        {isEboard && (
          <button
            type="button"
            onClick={() => setShowPromotePicker(true)}
            className="ml-auto flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
          >
            <UserPlus size={15} style={{ color: accent.light }} />
            Promote to Chair
          </button>
        )}
      </div>

      {canSchedule && (
        <div className="mb-5 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">New Meeting</span> asks this committee to RSVP. It shows in their Meetings tab, and reaches the subscribed calendar of whoever accepts. Private to the people invited.{' '}
            <span className="font-semibold text-foreground">Schedule Event</span> puts it on the chapter calendar for the whole committee, no RSVP, and can take attendance by QR code.
          </p>
        </div>
      )}

      {committee.is_member && committee.group_chat_id && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border px-4 py-3" style={{ background: tint(accent.base, 0.04), borderColor: tint(accent.base, 0.18) }}>
          <MessageSquare size={15} style={{ color: accent.light }} />
          <p className="text-xs leading-relaxed text-muted-foreground">
            This committee has a linked group chat, and membership is kept in sync automatically. Joining or leaving this committee adds or removes you from the chat instantly.
          </p>
        </div>
      )}

      <div className={cn(
        'grid gap-5',
        canViewCommitteeWorkspace ? 'lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]' : 'grid-cols-1'
      )}>
      {canViewCommitteeWorkspace && <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-start-2 lg:row-start-1">
        <div className="flex items-center justify-between border-b border-border px-5 py-3" style={{ background: tint(accent.base, 0.03) }}>
          <div className="flex items-center gap-2">
            <CalendarDays size={15} style={{ color: accent.light }} />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming events</p>
          </div>
          {canSchedule && (
            <button
              type="button"
              onClick={() => setShowSchedule(true)}
              className="text-xs font-semibold transition-opacity hover:opacity-75"
              style={{ color: accent.light }}
            >
              Schedule
            </button>
          )}
        </div>

        {eventsLoading ? (
          <p className="px-5 py-4 text-sm text-muted-foreground">Loading upcoming events...</p>
        ) : eventsError ? (
          <p className="px-5 py-4 text-sm text-red-600">{eventsError}</p>
        ) : upcomingEvents.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted-foreground">No upcoming events for this committee.</p>
        ) : (
          <ul role="list">
            {upcomingEvents.map((event) => {
              const startsAt = new Date(event.startDate);
              return (
                <li key={event.id} className="flex items-start gap-3 border-b border-border px-5 py-3 last:border-b-0">
                  <div className="w-11 shrink-0 rounded-lg bg-muted/60 py-1.5 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {startsAt.toLocaleDateString(undefined, { month: 'short' })}
                    </p>
                    <p className="text-lg font-semibold leading-none text-foreground">{startsAt.getDate()}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {startsAt.toLocaleDateString(undefined, { weekday: 'short' })} {startsAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      {event.location ? ` · ${event.location}` : ''}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-start-2 lg:row-start-2">
        <div className="flex items-center gap-2 border-b border-border px-5 py-3" style={{ background: tint(accent.base, 0.03) }}>
          <FolderOpen size={15} style={{ color: accent.light }} />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shared Files</p>
        </div>
        {sharedFolder && filesHref ? (
          <Link
            href={`${filesHref}?tab=documents&folder=${encodeURIComponent(sharedFolder.id)}&folderName=${encodeURIComponent(sharedFolder.name)}`}
            className="flex items-center justify-between gap-3 px-5 py-4 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
          >
            <span className="min-w-0 truncate">{sharedFolder.name}</span>
            <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
          </Link>
        ) : committee.is_member ? (
          <p className="px-5 py-4 text-sm text-muted-foreground">No shared folder is available for this committee yet.</p>
        ) : (
          <p className="px-5 py-4 text-sm text-muted-foreground">Join this committee to access its shared files.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600 lg:col-start-2 lg:row-start-3">{error}</p>}
      </>}

      {/* The approval queue. Rendered only for people the API would actually
          let through — eboard, or the chair of THIS committee — so nobody is
          shown a panel that 403s. `canAdminister` mirrors the API's
          loadAdministrable exactly; if one changes, change both. */}
      {canAdminister && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-start-2 lg:row-start-4">
          <div className="flex items-center justify-between border-b border-border px-5 py-3" style={{ background: tint(accent.base, 0.03) }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Join requests{requests.length > 0 ? ` (${requests.length})` : ''}
            </p>
          </div>

          {requestsError && <p className="px-5 py-3 text-sm text-red-600">{requestsError}</p>}

          {requests.length === 0 && !requestsError ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">
              Nobody is waiting to join. Members who ask will appear here for you to approve.
            </p>
          ) : (
            <ul role="list">
              {requests.map((person) => (
                <li key={person.authentik_id} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0">
                  <Avatar member={person} size={34} accent={accent} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{memberDisplayName(person)}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {formatMemberGroup(person.member_group)}
                      {person.username ? ` · @${person.username}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(person.authentik_id)}
                      disabled={requestBusyId === person.authentik_id}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                      style={{ background: accent.gradient }}
                    >
                      {requestBusyId === person.authentik_id ? 'Working...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeny(person.authentik_id)}
                      disabled={requestBusyId === person.authentik_id}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      Deny
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:col-start-1 lg:row-span-4 lg:row-start-1">
        <div className="flex items-center justify-between border-b border-border px-5 py-3" style={{ background: tint(accent.base, 0.03) }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Members ({members.length})</p>
        </div>

        {loading ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <p className="text-sm text-muted-foreground">Loading members...</p>
          </div>
        ) : sortedMembers.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            <Users size={22} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No members yet</p>
          </div>
        ) : (
          <ul role="list">
            {sortedMembers.map((member) => {
              const isChairRow = member.role === 'chair';
              return (
                <li key={member.authentik_id} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0">
                  <Avatar member={member} size={34} accent={accent} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{memberDisplayName(member)}</p>
                      {isChairRow && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: accent.gradient }}>
                          <Star size={8} strokeWidth={2.5} />
                          Chair
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">@{member.username}</p>
                  </div>

                  {isEboard && member.authentik_id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleSetRole(member.authentik_id, isChairRow ? 'member' : 'chair')}
                      className={cn(
                        'shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                        isChairRow ? 'border-border text-muted-foreground hover:bg-muted hover:text-foreground' : 'border-transparent text-white hover:opacity-85'
                      )}
                      style={!isChairRow ? { background: accent.gradient } : undefined}
                    >
                      {isChairRow ? 'Demote' : 'Promote to Chair'}
                    </button>
                  )}

                  {/* Removal, which simply did not exist before: the only way
                      out of a committee was to leave it yourself. Never shown
                      against your own row — leaving is the Leave Committee
                      button above, and it needs no permission. */}
                  {canAdminister && member.authentik_id !== currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.authentik_id)}
                      disabled={requestBusyId === member.authentik_id}
                      aria-label={`Remove ${memberDisplayName(member)} from ${committee.name}`}
                      title="Remove from committee"
                      className="shrink-0 rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      </div>

      {showSchedule && (
        <ScheduleEventModal committeeId={committee.id} committeeName={committee.name} accent={accent} onClose={() => setShowSchedule(false)} onScheduled={handleSchedule} />
      )}
      {showMeeting && (
        <NewMeetingModal
          accent={accent}
          presetCommittee={{ id: committee.id, name: committee.name }}
          onClose={() => setShowMeeting(false)}
          onCreated={() => setShowMeeting(false)}
        />
      )}
      {showPromotePicker && (
        <PromoteMemberModal
          committeeName={committee.name}
          excludeIds={members.map((m) => m.authentik_id)}
          accent={accent}
          onClose={() => setShowPromotePicker(false)}
          onPromote={(userId) => handleSetRole(userId, 'chair')}
        />
      )}
    </>
  );
}

// ─── Main revamped page ───

function RevampedCommitteesPage({ accentKey }) {
  const accent = PALETTES[accentKey] ?? PALETTES.blue;
  const { data: session } = useSession();
  const pathname = usePathname();
  const portalRoot = '/' + (pathname.split('/')[1] || 'member');
  const currentUserId = session?.user?.authentik_id;
  const isEboard = session?.user?.groups?.includes('eboard') ?? false;

  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showNewCommittee, setShowNewCommittee] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Keyed by committee id so a card can look itself up without scanning.
  const [activity, setActivity] = useState({});

  function loadCommittees() {
    setLoading(true);
    getCommittees()
      .then(setCommittees)
      .catch((err) => { if (isRedirectError(err)) throw err; })
      .finally(() => setLoading(false));
  }

  // A separate request from getCommittees on purpose — see getCommitteeActivity
  // in portal-api. Failure is swallowed rather than surfaced: a missing badge
  // is a far better outcome than an error banner over a working page.
  const loadActivity = useCallback(() => {
    getCommitteeActivity()
      .then((rows) => {
        if (!Array.isArray(rows)) return;
        setActivity(Object.fromEntries(rows.map((row) => [String(row.committee_id), row])));
      })
      .catch((err) => { if (isRedirectError(err)) throw err; });
  }, []);

  useEffect(loadCommittees, []);
  useEffect(loadActivity, [loadActivity]);

  const selected = committees.find((c) => c.id === selectedId) ?? null;

  // Opening a committee is what marks it read — NOT opening this page. That is
  // the whole reason the cursor is per-committee, so this is the one call that
  // makes the feature behave as designed.
  //
  // The local count is cleared first so the pill disappears on click rather
  // than after the next poll; the server write is what makes it stick. Note
  // pending_count is deliberately left alone: an approval queue is not cleared
  // by looking at it, only by deciding the requests.
  function openCommittee(committee) {
    setSelectedId(committee.id);
    setActivity((previous) => {
      const current = previous[String(committee.id)];
      if (!current || current.new_count === 0) return previous;
      return { ...previous, [String(committee.id)]: { ...current, new_count: 0 } };
    });
    markCommitteeSeen(committee.id).catch((err) => {
      if (isRedirectError(err)) throw err;
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: accent.light }}>
          UGA Phi Chapter
        </p>
        <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">Committees</h1>
      </div>

      {selected ? (
        <CommitteeDetail
          committee={selected}
          currentUserId={currentUserId}
          isEboard={isEboard}
          accent={accent}
          onBack={() => { setSelectedId(null); loadActivity(); }}
          onChanged={() => { loadCommittees(); loadActivity(); }}
          groupChatHref={`${portalRoot}/messages?groupChat=${selected.group_chat_id}`}
          filesHref={`${portalRoot}/files`}
        />
      ) : (
        <>
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {committees.length} committee{committees.length === 1 ? '' : 's'}
            </p>
            {isEboard && (
              <button
                type="button"
                onClick={() => setShowNewCommittee(true)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: accent.gradient }}
              >
                <Plus size={12} />
                New Committee
              </button>
            )}
          </div>

          {loading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Loading committees...</p>
          ) : committees.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card">
              <Users size={26} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No committees yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {committees.map((committee) => (
                <CommitteeCard
                  key={committee.id}
                  committee={committee}
                  isEboard={isEboard}
                  accent={accent}
                  activity={activity[String(committee.id)]}
                  onOpen={() => openCommittee(committee)}
                  onDelete={() => setDeleteTarget(committee)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showNewCommittee && (
        <NewCommitteeModal accent={accent} onClose={() => setShowNewCommittee(false)} onCreated={(c) => setCommittees((prev) => [...prev, c])} />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          committeeName={deleteTarget.name}
          accent={accent}
          onClose={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deleteCommittee(deleteTarget.id);
            setCommittees((prev) => prev.filter((c) => c.id !== deleteTarget.id));
            if (selectedId === deleteTarget.id) setSelectedId(null);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}

// Every portal passes blue, amber or red, so the pre-revamp variant this used
// to fall back to was unreachable and has been deleted. An unrecognised accent
// now renders with the blue palette (see the PALETTES lookup), which beats
// maintaining a second copy of the whole UI — two copies is what let the
// CircleCheck/BlockButton fix keep disappearing from one of them.
export default function CommitteesPage({ accent = 'blue' }) {
  return <RevampedCommitteesPage accentKey={accent} />;
}
