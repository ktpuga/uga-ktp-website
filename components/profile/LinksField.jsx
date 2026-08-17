'use client';

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PROFILE_LIMITS } from '@/lib/text-limits';

// Shared by BOTH profile write paths: the member's own ProfileForm and eboard's
// AdminEditProfileModal. That is not tidiness, it is a data-loss guard.
//
// Both forms build their body with `buildProfilePayload`, which reads `links`
// out of the form and sends whatever it finds. The profile write is a whole-row
// upsert, so a form that renders no links input sends `[]` and **erases the
// member's links on any unrelated save** — the same shape as the `preserveEmail`
// trap. A shared component is what makes "the admin form forgot this field"
// impossible rather than merely unlikely.
//
// The state behind any list of label/second-value rows. Used by the links
// editor below and by the eboard traits editor (`TraitsField.jsx`), which is the
// same widget with a plain text value instead of a URL.
//
// Generic rather than copied because the two rules below are the whole value of
// this hook, and both are the kind that look like nothing and cost an afternoon.
export function usePairRows(saved, valueKey, max) {
  // Each row carries a `key` that is NOT its index. Deleting a middle row
  // renumbers every index below it, so React reuses the wrong input for the
  // wrong row and the text visibly jumps to a different row.
  const [rows, setRows] = useState(() =>
    (saved ?? []).map((row, i) => ({
      key: `saved-${i}`,
      label: row?.label ?? '',
      [valueKey]: row?.[valueKey] ?? '',
    })),
  );
  const nextKey = useRef(0);

  const add = () =>
    setRows((current) => (
      current.length >= max
        ? current
        : [...current, { key: `new-${nextKey.current++}`, label: '', [valueKey]: '' }]
    ));
  const remove = (key) => setRows((current) => current.filter((row) => row.key !== key));
  const edit = (key, field, value) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, [field]: value } : row)));

  // What actually gets submitted. Rows added and never filled in are dropped
  // rather than sent: an empty row is someone who clicked Add and changed their
  // mind, and the API rejects a row with a missing half, so sending it would
  // turn "I didn't use that row" into a failed save of the whole form. A row
  // with only ONE half filled IS still sent, because that is a real mistake and
  // deserves the API's message.
  const submittable = rows
    .filter((row) => row.label.trim() !== '' || String(row[valueKey]).trim() !== '')
    .map((row) => ({ label: row.label.trim(), [valueKey]: String(row[valueKey]).trim() }));

  return { rows, add, remove, edit, submittable };
}

export function useProfileLinks(saved) {
  // `links` rather than `rows` in the returned shape, because that is what both
  // profile forms already destructure.
  const { rows, ...rest } = usePairRows(saved, 'url', PROFILE_LIMITS.LINKS);
  return { links: rows, ...rest };
}

// The hidden input the payload builder actually reads. Rendered by the same
// component that owns the rows so the two cannot drift apart.
export function LinksHiddenInput({ submittable }) {
  return <input type="hidden" name="links" value={JSON.stringify(submittable)} readOnly />;
}

// The links editor: a label, a URL, and a way to remove the row.
//
// Deliberately NOT a `Field` like everything else on this form. Field renders
// one label above one control, and this is a repeating group — the API's
// message for `links` names the offending row inside its own text ("Portfolio:
// Links must start with http:// or https://") because it cannot know which DOM
// input that row became. So the error sits under the whole group, and the
// message carries the label instead.
//
// `data-field="links"` is still here, and still matters: it is what the submit
// handler scrolls to when the API rejects one of these, and this group is at
// the bottom of a long form.
export function LinksField({ links, variant, inputClass, error, onAdd, onRemove, onEdit }) {
  const labelClass =
    variant === 'onboarding'
      ? 'mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-white/70'
      : 'block text-sm font-medium text-foreground mb-1';
  const helpClass = variant === 'onboarding' ? 'text-white/50' : 'text-muted-foreground';
  const full = links.length >= PROFILE_LIMITS.LINKS;

  return (
    <div data-field="links">
      <label className={labelClass}>Links</label>
      <p className={`mb-2 text-xs ${helpClass}`}>
        Up to {PROFILE_LIMITS.LINKS}. They show as chips on your directory card, so give each one a
        short label. Members only, never the public roster.
      </p>

      <div className="space-y-2">
        {links.map((row) => (
          <div key={row.key} className="flex items-start gap-2">
            {/* Label is the narrow one on purpose: it is a word, the URL is a
                URL. On a phone they stack rather than each taking half. */}
            <Input
              value={row.label}
              onChange={(e) => onEdit(row.key, 'label', e.target.value)}
              placeholder="Portfolio"
              maxLength={PROFILE_LIMITS.LINK_LABEL}
              aria-label="Link label"
              className={`${inputClass} sm:w-40`}
            />
            <Input
              value={row.url}
              onChange={(e) => onEdit(row.key, 'url', e.target.value)}
              placeholder="example.com/you"
              maxLength={PROFILE_LIMITS.LINK_URL}
              aria-label="Link URL"
              // type="url" is deliberately NOT set. It would make the browser
              // refuse "example.com/you" as invalid before the form ever
              // submits, and accepting a scheme-less host is the whole reason
              // normalizeWebUrl exists — that is what people paste.
              className={`${inputClass} flex-1`}
            />
            <button
              type="button"
              onClick={() => onRemove(row.key)}
              // The label names the row, so a screen reader hears which link is
              // about to go rather than five identical "Remove" buttons.
              aria-label={`Remove ${row.label.trim() || 'link'}`}
              className={variant === 'onboarding'
                ? 'mt-1 shrink-0 rounded-lg p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white'
                : 'mt-1 shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={full}
        className={variant === 'onboarding'
          ? 'mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#f0d060] underline decoration-[#f0d060]/45 underline-offset-4 transition-colors hover:text-white disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50'
          : 'mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50'}
      >
        <Plus className="h-3.5 w-3.5" />
        {full ? `That's all ${PROFILE_LIMITS.LINKS}` : 'Add a link'}
      </button>

      {error ? (
        <p role="alert" className={variant === 'onboarding' ? 'mt-1.5 text-xs font-medium text-red-200' : 'mt-1 text-xs text-red-600 dark:text-red-400'}>{error}</p>
      ) : null}
    </div>
  );
}

