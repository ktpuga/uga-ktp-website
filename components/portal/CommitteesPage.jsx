'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  ChevronLeft, Plus, Trash2, Search, X, Star, Users, MessageSquare, Calendar, CalendarPlus, QrCode, LogIn, LogOut, UserPlus, AlertTriangle, MapPin,
} from 'lucide-react';
import {
  getCommittees,
  createCommittee,
  deleteCommittee,
  joinCommittee,
  leaveCommittee,
  getCommitteeMembers,
  setCommitteeMemberRole,
  getMemberDirectory,
  createEvent,
} from '@/lib/portal-api';
import { memberDisplayName, memberInitials } from '@/lib/portal-format';
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

const EMPTY_EVENT_FORM = { title: '', description: '', location: '', start: '', end: '', requiresAttendance: true };

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

function CommitteeCard({ committee, isEboard, accent, onOpen, onDelete }) {
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
        </div>
      </div>
    </div>
  );
}

// ─── Committee detail view ───

function CommitteeDetail({ committee, currentUserId, isEboard, accent, onBack, onChanged, groupChatHref }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [showPromotePicker, setShowPromotePicker] = useState(false);

  // Matches checkEventPermission in ktp-api's eventsController: eboard may
  // schedule for any committee, a chair only for one they chair.
  const canSchedule = committee.is_chair || isEboard;

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

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.role === 'chair' && b.role !== 'chair') return -1;
      if (a.role !== 'chair' && b.role === 'chair') return 1;
      return memberDisplayName(a).localeCompare(memberDisplayName(b));
    });
  }, [members]);

  async function handleJoin() {
    setBusy(true);
    try {
      await joinCommittee(committee.id);
      loadMembers();
      onChanged();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to join committee');
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
        ) : (
          <button
            type="button"
            onClick={handleJoin}
            disabled={busy}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: accent.gradient }}
          >
            <LogIn size={15} />
            Join Committee
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

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
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
                </li>
              );
            })}
          </ul>
        )}
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

  function loadCommittees() {
    setLoading(true);
    getCommittees()
      .then(setCommittees)
      .catch((err) => { if (isRedirectError(err)) throw err; })
      .finally(() => setLoading(false));
  }

  useEffect(loadCommittees, []);

  const selected = committees.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
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
          onBack={() => setSelectedId(null)}
          onChanged={loadCommittees}
          groupChatHref={`${portalRoot}/messages?groupChat=${selected.group_chat_id}`}
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
                  onOpen={() => setSelectedId(committee.id)}
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
