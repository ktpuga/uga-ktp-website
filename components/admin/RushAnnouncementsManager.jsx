'use client';

import { useAccentPalette } from '@/components/portal/PortalAccentContext';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Info, Loader2, Megaphone, Pencil, Plus, Trash2, X } from 'lucide-react';
import {
  createRushAnnouncement,
  deleteRushAnnouncement,
  getRushAnnouncements,
  updateRushAnnouncement,
} from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';
import { TEXT_LIMITS } from '@/lib/text-limits';

// Palette now comes from the portal accent context so the Admin red/blue
// toggle reaches this page, not just the sidebar. Each component asks for it
// directly — no prop threading through the sub-components in this file.

const MAX_TITLE = TEXT_LIMITS.TITLE;

function tint(hex, alpha) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const INPUT = 'w-full rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[var(--portal-ring)]';

function Editor({ announcement, onClose, onSaved }) {
  const MAROON = useAccentPalette();
  const isEdit = Boolean(announcement);
  const [title, setTitle] = useState(announcement?.title ?? '');
  const [body, setBody] = useState(announcement?.body ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Both a title and a message are required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const saved = isEdit
        ? await updateRushAnnouncement(announcement.id, { title: title.trim(), body: body.trim() })
        : await createRushAnnouncement({ title: title.trim(), body: body.trim() });
      onSaved(saved);
      onClose();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not save that announcement.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4" style={{ background: tint(MAROON.base, 0.03) }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ background: MAROON.gradient }}>
              {isEdit ? <Pencil size={13} /> : <Plus size={14} />}
            </div>
            <p className="text-sm font-semibold text-foreground">{isEdit ? 'Edit announcement' : 'New rush announcement'}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={submit}>
          <div className="space-y-4 p-5">
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <Info size={11} className="mt-0.5 shrink-0" />
              This goes to <strong>rushees</strong>, not the chapter. It&apos;s a separate feed from chapter announcements. Nothing posted here reaches members&apos; announcement tab, and nothing internal reaches rushees.
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="rush-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</label>
                <span className="text-[10px] tabular-nums text-muted-foreground">{title.length}/{MAX_TITLE}</span>
              </div>
              <input id="rush-title" type="text" maxLength={MAX_TITLE} value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Info Session Tonight" className={INPUT} autoFocus />
            </div>

            <div>
              <label htmlFor="rush-body" className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</label>
              <textarea id="rush-body" rows={6} maxLength={TEXT_LIMITS.BODY} value={body} onChange={(e) => setBody(e.target.value)}
                placeholder="7pm in Boyd 208. Come meet the chapter, no need to dress up." className={cn(INPUT, 'resize-y')} />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
                <AlertTriangle size={12} /> {error}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
            <button type="button" onClick={onClose} disabled={submitting}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: MAROON.gradient }}>
              {submitting && <Loader2 size={13} className="animate-spin" />}
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Post to rushees'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RushAnnouncementsManager() {
  const MAROON = useAccentPalette();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorFor, setEditorFor] = useState(undefined); // undefined = closed, null = new
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setError('');
    try {
      const data = await getRushAnnouncements();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not load rush announcements.');
    } finally {
      setLoading(false);
    }
  }

  async function remove(announcement) {
    setBusyId(announcement.id);
    setError('');
    try {
      await deleteRushAnnouncement(announcement.id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== announcement.id));
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not delete that announcement.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: MAROON.light }}>Admin Panel</p>
          <h1 className="font-serif text-3xl font-normal leading-tight tracking-tight text-foreground">Rush Announcements</h1>
          <p className="mt-1 text-sm text-muted-foreground">Posted to rushees only, separate from chapter announcements</p>
        </div>
        <button type="button" onClick={() => setEditorFor(null)}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-85"
          style={{ background: MAROON.gradient }}>
          <Plus size={14} /> New announcement
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
      ) : announcements.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card text-center">
          <Megaphone size={22} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No rush announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{announcement.title}</p>
                  <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs text-muted-foreground">{announcement.body}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground/70">
                    {announcement.author_name ?? 'Unknown author'}
                    {announcement.author_exec_title ? ` · ${announcement.author_exec_title}` : ''}
                    {' · '}
                    {new Date(announcement.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button type="button" onClick={() => setEditorFor(announcement)}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                    <Pencil size={11} /> Edit
                  </button>
                  <button type="button" onClick={() => remove(announcement)} disabled={busyId === announcement.id}
                    className="flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-40">
                    {busyId === announcement.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editorFor !== undefined && (
        <Editor
          announcement={editorFor}
          onClose={() => setEditorFor(undefined)}
          onSaved={() => load()}
        />
      )}
    </div>
  );
}
