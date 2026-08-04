'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  CalendarDays, Plus, X, Pencil, Trash2, MapPin, Clock, Users,
  AlertCircle, Loader2, ArrowRight, QrCode, Bell,
} from 'lucide-react';
import {
  getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  getEvents, createEvent, updateEvent, deleteEvent, getCommittees,
} from '@/lib/portal-api';
import {
  formatAudience, formatMessageTime, formatEventTimeRange, getEventStartDate, getEventEndDate,
} from '@/lib/portal-format';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useConfirm } from '@/components/ui/confirm-dialog';
import AudienceSelect from '@/components/portal/AudienceSelect';
import { useAccentPalette } from '@/components/portal/PortalAccentContext';

// Palette comes from the portal accent context so the Admin red/blue toggle
// reaches this page. Each component asks for it directly.

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Shared form field components ───

function FieldLabel({ children }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</label>;
}

function FieldInput(props) {
  const MAROON = useAccentPalette();
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:outline-none focus:ring-2"
      style={{ '--tw-ring-color': tint(MAROON.base, 0.3) }}
      onFocus={(e) => { e.currentTarget.style.borderColor = tint(MAROON.base, 0.4); }}
      onBlur={(e) => { e.currentTarget.style.borderColor = ''; }}
    />
  );
}

function FieldTextarea(props) {
  const MAROON = useAccentPalette();
  return (
    <textarea
      {...props}
      className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 transition-colors focus:outline-none focus:ring-2"
      style={{ '--tw-ring-color': tint(MAROON.base, 0.3) }}
      onFocus={(e) => { e.currentTarget.style.borderColor = tint(MAROON.base, 0.4); }}
      onBlur={(e) => { e.currentTarget.style.borderColor = ''; }}
    />
  );
}

// ─── Targeting picker (Roles / Committees tab switcher) ───

// Roles AND committees, together. This used to be a two-tab switcher whose
// switchTab() actively CLEARED the other selection, so the two were mutually
// exclusive — you could send to rushees, or to the Pledge committee, never
// both. Nothing below the UI required that: `events.committee_ids` and
// `announcements.committee_id` are separate columns from `audience`, and both
// visibility queries already OR them together:
//
//     WHERE (untargeted AND you're a member)
//        OR audience && your_groups
//        OR committee_ids && your_committees
//
// So a row carrying both has always been readable by the union of the two.
// The xor was purely a UI invention, and this is just removing it.
//
// `singleCommittee` exists because announcements store ONE committee
// (`committee_id`, scalar) while events store many (`committee_ids`, array).
function TargetingPicker({ committeeIds, audience, onCommitteeIdsChange, onAudienceChange, committees, singleCommittee = false }) {
  const MAROON = useAccentPalette();

  function toggleCommittee(id) {
    if (committeeIds.includes(id)) {
      onCommitteeIdsChange(committeeIds.filter((c) => c !== id));
      return;
    }
    onCommitteeIdsChange(singleCommittee ? [id] : [...committeeIds, id]);
  }

  const targeted = (audience?.length ?? 0) > 0 || (committeeIds?.length ?? 0) > 0;

  return (
    <div className="space-y-3">
      <FieldLabel>Targeting</FieldLabel>

      {/* States the union rule outright, because "picked two things" reads as
          AND to most people and this is an OR. */}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {targeted
          ? 'Anyone who matches the roles OR the committees below will see this — the two add together, they don’t narrow each other.'
          : 'Nothing selected: every member sees this. Pick roles, committees, or both to narrow it.'}
      </p>

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Roles</p>
        <AudienceSelect value={audience} onChange={onAudienceChange} />
      </div>

      {committees.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Committees</p>
          <p className="mb-3 text-[11px] text-muted-foreground">
            {singleCommittee
              ? 'An announcement can carry one committee. Choosing another replaces it.'
              : 'Select any number of committees.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {committees.map((c) => {
              const selected = committeeIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCommittee(c.id)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                    selected
                      ? 'border-transparent text-white'
                      : 'border-border bg-card text-muted-foreground hover:border-transparent hover:text-foreground',
                  )}
                  style={selected ? { background: MAROON.gradient } : undefined}
                  onMouseEnter={(e) => { if (!selected) e.currentTarget.style.background = tint(MAROON.base, 0.07); }}
                  onMouseLeave={(e) => { if (!selected) e.currentTarget.style.background = ''; }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Badge ───

// Renders BOTH badges when both are targeted. This used to return early on
// committees and never show the audience — correct while the two were mutually
// exclusive, but now an item can carry both and showing only one would
// misreport who actually receives it.
function ItemBadge({ committeeIds, audience, committees }) {
  const MAROON = useAccentPalette();
  const hasCommittees = committeeIds && committeeIds.length > 0;
  const hasAudience = audience && audience.length > 0;

  // Neither targeted: one "everyone" badge, same as before.
  if (!hasCommittees && !hasAudience) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        <Users size={9} />
        {formatAudience(audience)}
      </span>
    );
  }

  const names = hasCommittees
    ? committeeIds.map((id) => committees.find((c) => c.id === id)?.name).filter(Boolean)
    : [];

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {hasAudience && (
        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          <Users size={9} />
          {formatAudience(audience)}
        </span>
      )}
      {hasCommittees && (
        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold" style={{ background: MAROON.muted, color: MAROON.light }}>
          <Users size={9} />
          {names.length > 0 ? names.join(', ') : 'Committee'}
        </span>
      )}
    </span>
  );
}

// ─── Section card wrapper ───

function SectionCard({ icon, title, action, children }) {
  const MAROON = useAccentPalette();
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4" style={{ background: tint(MAROON.base, 0.03) }}>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: MAROON.gradient }}>
            {icon}
          </div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-40 items-center justify-center">
      <Loader2 size={24} className="animate-spin text-muted-foreground" />
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
      <AlertCircle size={22} className="text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

// ─── Announcements ───

const EMPTY_ANNOUNCEMENT_FORM = { title: '', body: '', audience: [], committeeIds: [] };

function AnnouncementForm({ initial, onSubmit, onCancel, isEdit, committees }) {
  const MAROON = useAccentPalette();
  const [form, setForm] = useState(initial ?? EMPTY_ANNOUNCEMENT_FORM);

  return (
    <div className="border-b border-border p-6" style={{ background: tint(MAROON.base, 0.025) }}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{isEdit ? 'Edit Announcement' : 'New Announcement'}</p>
        <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <FieldLabel>Title</FieldLabel>
          <FieldInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter meeting this Thursday" />
        </div>
        <div>
          <FieldLabel>Body</FieldLabel>
          <FieldTextarea rows={4} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Write your announcement here…" />
        </div>
        {/* Was a bare AudienceSelect — announcements could only ever be
            targeted by role from this form, even though the table has had a
            `committee_id` column all along and AnnouncementCard already
            rendered a committee badge for it. The column was simply
            unreachable from the UI. singleCommittee because that column is a
            scalar, unlike events' committee_ids array. */}
        <TargetingPicker
          singleCommittee
          committees={committees}
          committeeIds={form.committeeIds}
          audience={form.audience}
          onCommitteeIdsChange={(v) => setForm((f) => ({ ...f, committeeIds: v }))}
          onAudienceChange={(v) => setForm((f) => ({ ...f, audience: v }))}
        />
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSubmit(form)}
          disabled={!form.title.trim() || !form.body.trim()}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ background: MAROON.gradient }}
        >
          {isEdit ? 'Save Changes' : 'Post Announcement'}
        </button>
      </div>
    </div>
  );
}

function AnnouncementCard({ item, onEdit, onDelete, committees }) {
  const MAROON = useAccentPalette();
  return (
    <div className="group flex gap-4 border-b border-border px-6 py-5 last:border-b-0 transition-colors hover:bg-muted/30">
      <div className="mt-0.5 h-5 w-[3px] shrink-0 rounded-full" style={{ background: MAROON.gradient }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{item.body}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button type="button" onClick={onEdit} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Edit">
              <Pencil size={13} />
            </button>
            <button type="button" onClick={onDelete} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Delete">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <ItemBadge committeeIds={item.committee_id ? [item.committee_id] : []} audience={item.audience} committees={committees} />
          <span className="text-[11px] text-muted-foreground">Posted {formatMessageTime(item.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

function AnnouncementsTab({ committees }) {
  const MAROON = useAccentPalette();
  const confirm = useConfirm();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    getAnnouncements()
      .then((data) => setAnnouncements(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setLoadError(err.message ?? 'Could not load announcements');
      })
      .finally(() => setLoading(false));
  }, []);

  const editingItem = editingId ? announcements.find((a) => a.id === editingId) : null;

  async function handleSubmit(form) {
    // The picker works in committeeIds[] for both forms; announcements store a
    // single scalar committee_id. Collapsing here rather than in the picker
    // keeps events (which really are multi-committee) on the same component.
    const payload = { ...form, committeeId: form.committeeIds?.[0] ?? null };
    try {
      if (editingId) {
        const updated = await updateAnnouncement(editingId, payload);
        setAnnouncements((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
        setEditingId(null);
      } else {
        const created = await createAnnouncement(payload);
        setAnnouncements((prev) => [created, ...prev]);
        setFormOpen(false);
      }
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to save announcement');
    }
  }

  async function handleDelete(id) {
    if (!(await confirm('Delete this announcement?'))) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete announcement');
    }
  }

  function handleCancel() {
    setFormOpen(false);
    setEditingId(null);
  }

  return (
    <SectionCard
      icon={<Bell size={15} strokeWidth={1.75} />}
      title="Announcements"
      action={
        !formOpen && !editingId ? (
          <button type="button" onClick={() => setFormOpen(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80" style={{ background: MAROON.gradient }}>
            <Plus size={13} /> New Announcement
          </button>
        ) : undefined
      }
    >
      {formOpen && !editingId && (
        <AnnouncementForm onSubmit={handleSubmit} onCancel={handleCancel} isEdit={false} committees={committees} />
      )}

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <ErrorState message={loadError} />
      ) : announcements.length === 0 && !formOpen ? (
        <EmptyState label="No announcements yet" />
      ) : (
        <div>
          {announcements.map((item) => (
            <div key={item.id}>
              {editingId === item.id && editingItem ? (
                <AnnouncementForm
                  initial={{
                    title: editingItem.title,
                    body: editingItem.body,
                    audience: editingItem.audience ?? [],
                    // Scalar committee_id -> the array shape the picker uses.
                    // Without this, editing an announcement that had a
                    // committee silently cleared it on save.
                    committeeIds: editingItem.committee_id ? [String(editingItem.committee_id)] : [],
                  }}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isEdit
                  committees={committees}
                />
              ) : (
                <AnnouncementCard
                  item={item}
                  committees={committees}
                  onEdit={() => { setEditingId(item.id); setFormOpen(false); }}
                  onDelete={() => handleDelete(item.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Events ───

const EMPTY_EVENT_FORM = {
  title: '', description: '', location: '', start: '', end: '',
  audience: [], committeeIds: [], requiresAttendance: false,
};

function EventForm({ initial, onSubmit, onCancel, isEdit, committees, formError }) {
  const MAROON = useAccentPalette();
  const [form, setForm] = useState(initial ?? EMPTY_EVENT_FORM);

  return (
    <div className="border-b border-border p-6" style={{ background: tint(MAROON.base, 0.025) }}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{isEdit ? 'Edit Event' : 'New Event'}</p>
        <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <FieldLabel>Title</FieldLabel>
          <FieldInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Alumni Networking Dinner" />
        </div>
        <div>
          <FieldLabel>Description</FieldLabel>
          <FieldTextarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Event details, dress code, notes…" />
        </div>
        <div>
          <FieldLabel>Location</FieldLabel>
          <FieldInput value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Location TBD" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Start</FieldLabel>
            <FieldInput type="datetime-local" value={form.start} onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>End</FieldLabel>
            <FieldInput type="datetime-local" value={form.end} onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))} />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted/60">
          <input
            type="checkbox"
            checked={form.requiresAttendance}
            onChange={(e) => setForm((f) => ({ ...f, requiresAttendance: e.target.checked }))}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
            style={{ accentColor: MAROON.base }}
          />
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <QrCode size={13} style={{ color: MAROON.light }} />
              Track attendance for this event (QR check-in)
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Members can scan a QR code to mark attendance at the door</p>
          </div>
        </label>

        <TargetingPicker
          committeeIds={form.committeeIds}
          audience={form.audience}
          onCommitteeIdsChange={(v) => setForm((f) => ({ ...f, committeeIds: v }))}
          onAudienceChange={(v) => setForm((f) => ({ ...f, audience: v }))}
          committees={committees}
        />

        {formError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>
        )}
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSubmit(form)}
          disabled={!form.title.trim() || !form.start || !form.end}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
          style={{ background: MAROON.gradient }}
        >
          {isEdit ? 'Save Changes' : 'Create Event'}
        </button>
      </div>
    </div>
  );
}

function EventCard({ item, onEdit, onDelete, committees }) {
  const MAROON = useAccentPalette();
  return (
    <div className="group flex gap-4 border-b border-border px-6 py-5 last:border-b-0 transition-colors hover:bg-muted/30">
      <div className="mt-0.5 h-5 w-[3px] shrink-0 rounded-full" style={{ background: MAROON.gradient }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              {item.requiresAttendance && (
                <span className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: tint(MAROON.base, 0.12), color: MAROON.light }}>
                  <QrCode size={9} /> Attendance
                </span>
              )}
            </div>
            {item.description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">{item.description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button type="button" onClick={onEdit} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Edit">
              <Pencil size={13} />
            </button>
            <button type="button" onClick={onDelete} className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label="Delete">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <ItemBadge committeeIds={item.committeeIds} audience={item.audience} committees={committees} />
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock size={10} />
            {formatEventTimeRange(getEventStartDate(item), getEventEndDate(item))}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin size={10} />
            {item.location || 'Location TBD'}
          </span>
        </div>
      </div>
    </div>
  );
}

function EventsTab({ committees }) {
  const MAROON = useAccentPalette();
  const confirm = useConfirm();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isRedirectError(err)) throw err;
        setLoadError(err.message ?? 'Could not load events');
      })
      .finally(() => setLoading(false));
  }, []);

  const editingItem = editingId ? events.find((e) => e.id === editingId) : null;

  async function handleSubmit(form) {
    setFormError(null);

    const startDate = new Date(form.start);
    const endDate = new Date(form.end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setFormError('Enter a valid start and end time.');
      return;
    }
    if (endDate <= startDate) {
      setFormError('End time must be after start time.');
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        // Both are sent. This used to blank the audience whenever any
        // committee was picked, which is what made the two mutually exclusive
        // on the wire even after the UI allowed both. eventModel's visibility
        // query ORs them, so a row carrying both reaches the union.
        audience: form.audience,
        committeeIds: form.committeeIds,
        requiresAttendance: form.requiresAttendance,
      };

      const result = editingId ? await updateEvent(editingId, payload) : await createEvent(payload);

      if (!result?.ok) {
        setFormError(result?.error ?? 'Failed to save event.');
        return;
      }

      setEvents((prev) => (editingId ? prev.map((e) => (e.id === editingId ? result.event : e)) : [...prev, result.event]));
      setFormOpen(false);
      setEditingId(null);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setFormError(err.message ?? 'Failed to save event.');
    }
  }

  async function handleDelete(id) {
    if (!(await confirm('Delete this event? This cannot be undone.'))) return;
    try {
      await deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      window.alert(err.message ?? 'Failed to delete event');
    }
  }

  function handleCancel() {
    setFormOpen(false);
    setEditingId(null);
    setFormError(null);
  }

  return (
    <SectionCard
      icon={<CalendarDays size={15} strokeWidth={1.75} />}
      title="Events"
      action={
        !formOpen && !editingId ? (
          <button type="button" onClick={() => setFormOpen(true)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80" style={{ background: MAROON.gradient }}>
            <Plus size={13} /> New Event
          </button>
        ) : undefined
      }
    >
      {formOpen && !editingId && (
        <EventForm onSubmit={handleSubmit} onCancel={handleCancel} isEdit={false} committees={committees} formError={formError} />
      )}

      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <ErrorState message={loadError} />
      ) : events.length === 0 && !formOpen ? (
        <EmptyState label="No events yet" />
      ) : (
        <div>
          {events.map((item) => (
            <div key={item.id}>
              {editingId === item.id && editingItem ? (
                <EventForm
                  initial={{
                    title: editingItem.title,
                    description: editingItem.description ?? '',
                    location: editingItem.location ?? '',
                    start: toDatetimeLocal(getEventStartDate(editingItem)),
                    end: toDatetimeLocal(getEventEndDate(editingItem)),
                    audience: editingItem.audience ?? [],
                    committeeIds: editingItem.committeeIds ?? [],
                    requiresAttendance: editingItem.requiresAttendance ?? false,
                  }}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isEdit
                  committees={committees}
                  formError={formError}
                />
              ) : (
                <EventCard
                  item={item}
                  committees={committees}
                  onEdit={() => { setEditingId(item.id); setFormOpen(false); setFormError(null); }}
                  onDelete={() => handleDelete(item.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Tab bar + main export ───

const TABS = [
  { id: 'announcements', label: 'Announcements', icon: Bell },
  { id: 'events', label: 'Events', icon: CalendarDays },
];

export default function AnnouncementsContent() {
  const MAROON = useAccentPalette();
  const [activeTab, setActiveTab] = useState('announcements');
  const [committees, setCommittees] = useState([]);

  useEffect(() => {
    getCommittees()
      .then((data) => setCommittees(Array.isArray(data) ? data : []))
      .catch((err) => { if (isRedirectError(err)) throw err; });
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: MAROON.light }}>
          Chapter Overview
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: MAROON.base }}>Announcements &amp; Events</h1>
        <p className="text-sm text-muted-foreground">Manage what the chapter sees on the dashboard and calendar</p>
      </div>

      <div className="relative flex items-center gap-1 border-b border-border">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-medium transition-colors duration-150',
                isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
              role="tab"
              aria-selected={isActive}
            >
              <Icon size={14} />
              {tab.label}
              {isActive && <span aria-hidden="true" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full" style={{ background: MAROON.base }} />}
            </button>
          );
        })}
      </div>

      {activeTab === 'announcements' && <AnnouncementsTab committees={committees} />}
      {activeTab === 'events' && <EventsTab committees={committees} />}
    </div>
  );
}
