'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, EyeOff, Loader2, Lock, Pencil, Save, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  deleteCandidateNote, getCandidateNotes, saveCandidateNote,
} from '@/lib/portal-api';
import { isRedirectError } from '@/lib/is-redirect-error';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { TEXT_LIMITS } from '@/lib/text-limits';
import { bulletKeyDown } from '@/lib/interview-note-format';
import NoteBody from '@/components/portal/NoteBody';

// The note panel for ONE candidate, shared by the member interviewer page and
// eboard's schedule sheet.
//
// This is shared while InterviewerSignup and InterviewScheduleManager are
// deliberately NOT (see the note at the top of InterviewerSignup). That is not a
// contradiction, and the difference is worth stating because it is the line
// between safe sharing and the isEboard-prop mistake: the two PAGES differ by
// what a role may DO, so a shared component with a read-only mode leaves a
// member one boolean away from deleting a slot. This panel differs by nothing —
// its affordances are driven entirely by `is_mine`, which the SERVER computes
// per note, and by the API's own refusals. There is no role prop to get wrong.
//
// The one thing a caller must pass is `canDeleteAny`, and note that it is a
// PRESENTATION hint only: the API decides, and answers 403 (or 404) regardless
// of what this renders.

const stamp = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' at ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export default function InterviewNotes({ bookingId, candidateName, accent, canDeleteAny = false }) {
  const confirm = useConfirm();
  const [notes, setNotes] = useState([]);
  const [access, setAccess] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const textareaRef = useRef(null);
  // Where the caret belongs after a bullet keystroke rewrote the draft.
  //
  // A ref rather than state, and applied in an effect rather than in the
  // handler: the textarea is controlled, so React has not painted the new value
  // at the moment the key is handled, and setting selectionStart there puts the
  // caret at a position in the OLD string. Every "the cursor jumps to the end
  // when I press Enter" bug in a controlled editor is this.
  const pendingCaret = useRef(null);

  useEffect(() => {
    if (pendingCaret.current == null || !textareaRef.current) return;
    const caret = pendingCaret.current;
    pendingCaret.current = null;
    textareaRef.current.setSelectionRange(caret, caret);
  }, [draft]);

  const onDraftKeyDown = (e) => {
    const result = bulletKeyDown(e, draft);
    // Only swallow the key when the handler actually claimed it. Off a bullet
    // line, Tab must still move focus out of the textarea.
    if (!result) return;
    e.preventDefault();
    setDraft(result.value);
    setFieldError('');
    pendingCaret.current = result.caret;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCandidateNotes(bookingId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError('');
      setNotes(result.notes);
      setAccess(result.access);
      // Seed the composer from the caller's existing note, so opening the panel
      // a second time offers an edit rather than a blank box beside a note they
      // already wrote.
      const mine = result.notes.find((n) => n.is_mine);
      setDraft(mine?.body ?? '');
      setEditing(!mine);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not load notes.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => { load(); }, [load]);

  const mine = notes.find((n) => n.is_mine) ?? null;
  const others = notes.filter((n) => !n.is_mine);

  async function save() {
    const body = draft.trim();
    if (!body) {
      setFieldError('Write something first.');
      return;
    }
    setSaving(true);
    setFieldError('');
    setError('');
    try {
      const result = await saveCandidateNote(bookingId, body);
      // Returns { error } rather than throwing — see lib/portal-api.js. The
      // length message belongs beside the box, the rest at the top.
      if (result.error) {
        if (result.field === 'body') setFieldError(result.error);
        else setError(result.error);
        return;
      }
      await load();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not save that note.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(note) {
    if (!(await confirm(
      note.is_mine
        ? 'Delete your note on this candidate? This cannot be undone.'
        : `Delete ${note.author_name}'s note on this candidate? This cannot be undone.`,
      { title: 'Delete this note?', confirmLabel: 'Delete' },
    ))) return;

    setBusyId(note.id);
    setError('');
    try {
      const result = await deleteCandidateNote(note.id);
      if (result.ok) await load();
      else setError(result.error);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err.message ?? 'Could not delete that note.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Lock size={10} className="text-muted-foreground" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Notes on {candidateName}
        </p>
      </div>

      {/* Not decoration. Nothing else on the page says who can read this, and an
          interviewer typing a candid assessment is entitled to know before they
          type it rather than after. */}
      <p className="mb-3 text-[10px] leading-relaxed text-muted-foreground/80">
        Only eboard and the members running this slot can read these.
        {candidateName ? ` ${candidateName} cannot.` : ' The candidate cannot.'}
      </p>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-16 items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Loader2 size={13} className="animate-spin" /> Loading notes…
        </div>
      ) : (
        <>
          {/* The `own` tier. A withdrawn interviewer gets a 200 carrying only
              their own note, so without this the panel would read as "one note
              exists" when several do. */}
          {access === 'own' && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <EyeOff size={12} className="mt-0.5 shrink-0" />
              <span>
                You&apos;re no longer signed up for this slot, so you can only see your own
                note. Others may have written more.
              </span>
            </div>
          )}

          {others.length > 0 && (
            <ul className="mb-3 space-y-2">
              {others.map((note) => (
                <li key={note.id} className="rounded-lg border border-border bg-card px-3 py-2">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-foreground">{note.author_name}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{stamp(note.updated_at)}</span>
                      {/* Eboard deletes but never edits: a note is a named
                          person's judgement, so rewriting it would make the
                          attribution false. There is deliberately no pencil here. */}
                      {canDeleteAny && (
                        <button
                          type="button"
                          onClick={() => remove(note)}
                          disabled={busyId === note.id}
                          className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                          aria-label={`Delete ${note.author_name}'s note`}
                        >
                          {busyId === note.id
                            ? <Loader2 size={11} className="animate-spin" />
                            : <Trash2 size={11} />}
                        </button>
                      )}
                    </span>
                  </div>
                  <NoteBody body={note.body} />
                </li>
              ))}
            </ul>
          )}

          {mine && !editing ? (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-foreground">Your note</span>
                <span className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{stamp(mine.updated_at)}</span>
                  <button
                    type="button"
                    onClick={() => { setDraft(mine.body); setEditing(true); }}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Edit your note"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(mine)}
                    disabled={busyId === mine.id}
                    className="text-muted-foreground hover:text-destructive disabled:opacity-40"
                    aria-label="Delete your note"
                  >
                    {busyId === mine.id
                      ? <Loader2 size={11} className="animate-spin" />
                      : <Trash2 size={11} />}
                  </button>
                </span>
              </div>
              <NoteBody body={mine.body} />
            </div>
          ) : (
            <div>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setFieldError(''); }}
                onKeyDown={onDraftKeyDown}
                // Mirrors the API cap so the limit is met while typing rather
                // than as a rejection after clicking save.
                maxLength={TEXT_LIMITS.INTERVIEW_NOTE}
                rows={7}
                placeholder="- What stood out about them?"
                className={cn(
                  'w-full resize-y rounded-lg border bg-card px-3 py-2 text-[12px] text-foreground outline-none',
                  fieldError ? 'border-destructive' : 'border-border',
                )}
              />
              <p className="mt-1 text-[10px] text-muted-foreground/70">
                Enter continues the list, Tab indents a sub-point.
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <span className={cn(
                  'text-[10px]',
                  fieldError ? 'text-destructive' : 'text-muted-foreground/70',
                )}>
                  {fieldError || `${draft.length} / ${TEXT_LIMITS.INTERVIEW_NOTE}`}
                </span>
                <span className="flex items-center gap-2">
                  {mine && (
                    <button
                      type="button"
                      onClick={() => { setDraft(mine.body); setEditing(false); setFieldError(''); }}
                      disabled={saving}
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted disabled:opacity-40"
                    >
                      <X size={11} /> Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
                    style={{ background: accent.gradient }}
                  >
                    {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                    {mine ? 'Save changes' : 'Save note'}
                  </button>
                </span>
              </div>
            </div>
          )}

          {others.length === 0 && !mine && !editing && (
            <p className="text-[11px] text-muted-foreground">No notes yet.</p>
          )}
        </>
      )}
    </div>
  );
}
